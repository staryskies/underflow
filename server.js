const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// PostgreSQL connection
const pool = new Pool({
    connectionString: 'postgresql://playerdata_ykha_user:a3ZXhMzf3id4tMaIlLdu59lBhA7wgJBv@dpg-d0rim0mmcj7s738aofg0-a.oregon-postgres.render.com/playerdata_ykha',
    ssl: { rejectUnauthorized: false }
});

// Create database tables
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                username VARCHAR(50) PRIMARY KEY,
                passcode VARCHAR(4) NOT NULL,
                memory_coins INTEGER DEFAULT 500,
                plays INTEGER DEFAULT 5,
                yellow_tickets INTEGER DEFAULT 0,
                blue_tickets INTEGER DEFAULT 0,
                games_played INTEGER DEFAULT 0,
                total_coins_earned INTEGER DEFAULT 0
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS redemptions (
                request_id UUID PRIMARY KEY,
                username VARCHAR(50) REFERENCES users(username),
                ticket_type VARCHAR(10) NOT NULL,
                plays INTEGER NOT NULL,
                timestamp BIGINT NOT NULL,
                status VARCHAR(20) DEFAULT 'pending'
            );
        `);

        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Initialize database on server start
initDatabase();

// Store connected admins
const connectedAdmins = new Set();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/games', express.static(path.join(__dirname, 'public/games')));
app.use(express.json());

// API to get or create user
app.get('/api/user/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.json({ success: false, message: 'User not found' });
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
                res.json({ success: true, user: result.rows[0] });
            } else {
                res.json({ success: false, message: 'Incorrect passcode' });
            }
        } else {
            const newUser = {
                username,
                passcode,
                memory_coins: 500,
                plays: 5,
                yellow_tickets: 0,
                blue_tickets: 0,
                games_played: 0,
                total_coins_earned: 0
            };
            await pool.query(
                'INSERT INTO users (username, passcode, memory_coins, plays, yellow_tickets, blue_tickets, games_played, total_coins_earned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [username, passcode, 500, 5, 0, 0, 0, 0]
            );
            res.json({ success: true, user: newUser });
        }
    } catch (error) {
        console.error('Error signing in:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// API to purchase ticket
app.post('/api/buy-ticket', async (req, res) => {
    const { username, ticketType } = req.body;
    if (!username || !['yellow', 'blue'].includes(ticketType)) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const cost = ticketType === 'yellow' ? 100 : 200;
    try {
        const result = await pool.query('SELECT memory_coins, yellow_tickets, blue_tickets FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = result.rows[0];
        if (user.memory_coins < cost) {
            return res.status(400).json({ success: false, message: 'Insufficient coins' });
        }

        await pool.query(
            `UPDATE users SET memory_coins = memory_coins - $1, ${ticketType}_tickets = ${ticketType}_tickets + 1 WHERE username = $2`,
            [cost, username]
        );

        const updatedUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        res.json({ success: true, user: updatedUser.rows[0] });
    } catch (error) {
        console.error('Error buying ticket:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// API to submit ticket redemption request
app.post('/api/redeem-ticket', async (req, res) => {
    const { username, ticketType } = req.body;
    if (!username || !['yellow', 'blue'].includes(ticketType)) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    try {
        const result = await pool.query(`SELECT ${ticketType}_tickets FROM users WHERE username = $1`, [username]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (result.rows[0][`${ticketType}_tickets`] <= 0) {
            return res.status(400).json({ success: false, message: `No ${ticketType} tickets available` });
        }

        const requestId = uuidv4();
        const plays = ticketType === 'yellow' ? 4 : 9;
        await pool.query(
            'INSERT INTO redemptions (request_id, username, ticket_type, plays, timestamp) VALUES ($1, $2, $3, $4, $5)',
            [requestId, username, ticketType, plays, Date.now()]
        );

        // Notify all connected admins
        connectedAdmins.forEach(adminWs => {
            adminWs.send(JSON.stringify({
                type: 'new-redemption',
                requestId,
                username,
                ticketType,
                plays,
                timestamp: Date.now()
            }));
        });

        res.json({ success: true, requestId });
    } catch (error) {
        console.error('Error submitting redemption:', error);
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
            'UPDATE users SET memory_coins = memory_coins + $1, total_coins_earned = total_coins_earned + $1 WHERE username = $2 RETURNING *',
            [coins, username]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user: result.rows[0] });
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

        await pool.query(
            'UPDATE users SET plays = plays - 1, games_played = games_played + 1 WHERE username = $1 RETURNING *',
            [username]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error starting game:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// WebSocket for admin panel
wss.on('connection', (ws) => {
    connectedAdmins.add(ws);

    // Send current pending redemptions
    pool.query("SELECT * FROM redemptions WHERE status = 'pending'")
        .then(result => {
            const redemptions = result.rows.map(row => ({
                requestId: row.request_id,
                username: row.username,
                ticketType: row.ticket_type,
                plays: row.plays,
                timestamp: row.timestamp
            }));
            ws.send(JSON.stringify({
                type: 'init-redemptions',
                redemptions
            }));
        })
        .catch(error => console.error('Error fetching redemptions:', error));

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        if (data.type === 'approve-redemption') {
            const { requestId, approved } = data;
            try {
                const result = await pool.query(
                    "SELECT * FROM redemptions WHERE request_id = $1 AND status = 'pending'",
                    [requestId]
                );
                if (result.rows.length === 0) return;

                const redemption = result.rows[0];
                if (approved) {
                    await pool.query(
                        'UPDATE users SET plays = plays + $1, yellow_tickets = yellow_tickets - $2, blue_tickets = blue_tickets - $3 WHERE username = $4',
                        [
                            redemption.plays,
                            redemption.ticket_type === 'yellow' ? 1 : 0,
                            redemption.ticket_type === 'blue' ? 1 : 0,
                            redemption.username
                        ]
                    );
                }
                await pool.query(
                    "UPDATE redemptions SET status = $1 WHERE request_id = $2",
                    [approved ? 'approved' : 'rejected', requestId]
                );

                // Broadcast to clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'redemption-result',
                            requestId,
                            approved,
                            username: redemption.username,
                            ticketType: redemption.ticket_type,
                            plays: redemption.plays
                        }));
                    }
                });
            } catch (error) {
                console.error('Error processing redemption:', error);
            }
        }
    });

    ws.on('close', () => {
        connectedAdmins.delete(ws);
    });
});

// Admin panel route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});