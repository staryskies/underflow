const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// PostgreSQL connection
const pool = new Pool({
    connectionString: 'postgresql://playerdata_ykha_user:a3ZXhMzf3id4tMaIlLdu59lBhA7wgJBv@dpg-d0rim0mmcj7s738aofg0-a.oregon-postgres.render.com/playerdata_ykha',
    ssl: { rejectUnauthorized: false }
});

// Admin password for ticket conversion
const ADMIN_PASSWORD = 'password123';

// Create or recreate database tables
async function initDatabase() {
    try {
        await pool.query('DROP TABLE IF EXISTS redemptions CASCADE');
        await pool.query('DROP TABLE IF EXISTS user_prizes CASCADE');
        await pool.query('DROP TABLE IF EXISTS prizes CASCADE');
        await pool.query('DROP TABLE IF EXISTS users CASCADE');

        await pool.query(`
            CREATE TABLE users (
                username VARCHAR(50) PRIMARY KEY,
                passcode VARCHAR(4) NOT NULL,
                tickets INTEGER DEFAULT 2,
                plays INTEGER DEFAULT 5,
                coins INTEGER DEFAULT 500,
                games_played INTEGER DEFAULT 0,
                total_coins_earned INTEGER DEFAULT 0
            );
        `);

        await pool.query(`
            CREATE TABLE prizes (
                prize_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                coin_cost INTEGER NOT NULL,
                stock INTEGER NOT NULL
            );
        `);

        await pool.query(`
            CREATE TABLE user_prizes (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) REFERENCES users(username),
                prize_id INTEGER REFERENCES prizes(prize_id),
                acquired_at BIGINT NOT NULL
            );
        `);

        await pool.query(`
            CREATE TABLE redemptions (
                redemption_id SERIAL PRIMARY KEY,
                username VARCHAR(50) REFERENCES users(username),
                prize_id INTEGER REFERENCES prizes(prize_id),
                redemption_date BIGINT NOT NULL
            );
        `);

        await pool.query(`
            INSERT INTO prizes (name, description, coin_cost, stock) VALUES
            ('Gold Badge', 'A shiny badge to show off your skills', 200, 50),
            ('Star Skin', 'A starry skin for your profile', 300, 30),
            ('Super Trophy', 'A trophy for top players', 500, 20);
        `);

        console.log('Database tables recreated successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/games', express.static(path.join(__dirname, 'public/games')));
app.use(express.json());

// API to get user data
app.get('/api/user/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length > 0) {
            const prizesResult = await pool.query(`
                SELECT p.prize_id, p.name, p.description, p.coin_cost, up.acquired_at
                FROM user_prizes up
                JOIN prizes p ON up.prize_id = p.prize_id
                WHERE up.username = $1
            `, [username]);
            res.json({
                success: true,
                user: {
                    ...userResult.rows[0],
                    prizes: prizesResult.rows
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// API to sign in or create user
app.post('/api/signin', async (req, res) => {
    const { username, passcode } = req.body;
    if (!username || !passcode || passcode.length !== 4 || !/^\d{4}$/.test(passcode)) {
        return res.status(400).json({ success: false, message: 'Invalid username or passcode' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            if (result.rows[0].passcode === passcode) {
                const prizesResult = await pool.query(`
                    SELECT p.prize_id, p.name, p.description, p.coin_cost, up.acquired_at
                    FROM user_prizes up
                    JOIN prizes p ON up.prize_id = p.prize_id
                    WHERE up.username = $1
                `, [username]);
                res.json({
                    success: true,
                    user: {
                        ...result.rows[0],
                        prizes: prizesResult.rows
                    }
                });
            } else {
                res.status(401).json({ success: false, message: 'Incorrect passcode' });
            }
        } else {
            const newUser = {
                username,
                passcode,
                tickets: 2,
                plays: 5,
                coins: 500,
                games_played: 0,
                total_coins_earned: 0,
                prizes: []
            };
            await pool.query(
                'INSERT INTO users (username, passcode, tickets, plays, coins, games_played, total_coins_earned) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [username, passcode, 2, 5, 500, 0, 0]
            );
            res.json({ success: true, user: newUser });
        }
    } catch (error) {
        console.error('Error signing in:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// API to convert ticket to plays
app.post('/api/convert-ticket', async (req, res) => {
    const { username, ticketCount, adminPassword } = req.body;
    if (!username || !Number.isInteger(ticketCount) || !adminPassword) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Incorrect admin password' });
    }

    try {
        const result = await pool.query('SELECT tickets FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Admin can add any number of tickets
        await pool.query(
            'UPDATE users SET tickets = tickets + $4 WHERE username = $2',
            [ticketCount, username]
        );

        const updatedUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const prizesResult = await pool.query(`
            SELECT p.prize_id, p.name, p.description, p.coin_cost, up.acquired_at
            FROM user_prizes up
            JOIN prizes p ON up.prize_id = p.prize_id
            WHERE up.username = $1
        `, [username]);

        res.json({
            success: true,
            user: {
                ...updatedUser.rows[0],
                prizes: prizesResult.rows
            }
        });
    } catch (error) {
        console.error('Error converting ticket:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// API to purchase prize
app.post('/api/buy-prize', async (req, res) => {
    const { username, prizeId } = req.body;
    if (!username || !Number.isInteger(prizeId)) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    try {
        const userResult = await pool.query('SELECT coins FROM users WHERE username = $1', [username]);
        const prizeResult = await pool.query('SELECT prize_id, name, coin_cost, stock FROM prizes WHERE prize_id = $1', [prizeId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (prizeResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Prize not found' });
        }

        const user = userResult.rows[0];
        const prize = prizeResult.rows[0];

        if (user.coins < prize.coin_cost) {
            return res.status(400).json({ success: false, message: 'Insufficient coins' });
        }
        if (prize.stock <= 0) {
            return res.status(400).json({ success: false, message: 'Prize out of stock' });
        }

        await pool.query('BEGIN');
        await pool.query(
            'UPDATE users SET coins = coins - $1 WHERE username = $2',
            [prize.coin_cost, username]
        );
        await pool.query(
            'UPDATE prizes SET stock = stock - 1 WHERE prize_id = $1',
            [prizeId]
        );
        await pool.query(
            'INSERT INTO user_prizes (username, prize_id, acquired_at) VALUES ($1, $2, $3)',
            [username, prizeId, Date.now()]
        );
        await pool.query(
            'INSERT INTO redemptions (username, prize_id, redemption_date) VALUES ($1, $2, $3)',
            [username, prizeId, Date.now()]
        );
        await pool.query('COMMIT');

        const updatedUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const prizesResult = await pool.query(`
            SELECT p.prize_id, p.name, p.description, p.coin_cost, up.acquired_at
            FROM user_prizes up
            JOIN prizes p ON up.prize_id = p.prize_id
            WHERE up.username = $1
        `, [username]);

        res.json({
            success: true,
            user: {
                ...updatedUser.rows[0],
                prizes: prizesResult.rows
            }
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error buying prize:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// API to get available prizes
app.get('/api/prizes', async (req, res) => {
    try {
        const result = await pool.query('SELECT prize_id, name, description, coin_cost, stock FROM prizes WHERE stock > 0');
        res.json({ success: true, prizes: result.rows });
    } catch (error) {
        console.error('Error fetching prizes:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// API to award coins
app.post('/api/award-coins', async (req, res) => {
    const { username, coins } = req.body;
    if (!username || !Number.isInteger(coins) || coins <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET coins = coins + $1, total_coins_earned = total_coins_earned + $1 WHERE username = $2 RETURNING *',
            [coins, username]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const prizesResult = await pool.query(`
            SELECT p.prize_id, p.name, p.description, p.coin_cost, up.acquired_at
            FROM user_prizes up
            JOIN prizes p ON up.prize_id = p.prize_id
            WHERE up.username = $1
        `, [username]);
        res.json({
            success: true,
            user: {
                ...result.rows[0],
                prizes: prizesResult.rows
            }
        });
    } catch (error) {
        console.error('Error awarding coins:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// API to start game
app.post('/api/start-game', async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    try {
        const result = await pool.query('SELECT plays FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (result.rows[0].plays < 1) {
            return res.status(400).json({ success: false, message: 'No plays available' });
        }

        const updatedUser = await pool.query(
            'UPDATE users SET plays = plays - 1, games_played = games_played + 1 WHERE username = $1 RETURNING *',
            [username]
        );
        const prizesResult = await pool.query(`
            SELECT p.prize_id, p.name, p.description, p.coin_cost, up.acquired_at
            FROM user_prizes up
            JOIN prizes p ON up.prize_id = p.prize_id
            WHERE up.username = $1
        `, [username]);

        res.json({
            success: true,
            user: {
                ...updatedUser.rows[0],
                prizes: prizesResult.rows
            }
        });
    } catch (error) {
        console.error('Error starting game:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
async function startServer() {
    try {
        await initDatabase();
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize database, exiting:', error);
        process.exit(1);
    }
}

startServer();