const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Serve static files
app.use(express.static('public'));

// Game state
const gameState = {
    players: new Map(),
    chests: new Map(),
    leaderboard: {
        tictactoe: [],
        wordle: [],
        // Add more games as needed
    }
};

// Initialize chests with items
const initializeChests = () => {
    const chestTypes = ['common', 'rare', 'epic', 'legendary'];
    const items = {
        common: ['Basic Skin', 'Simple Emote', 'Common Title'],
        rare: ['Animated Skin', 'Special Effect', 'Rare Title'],
        epic: ['Exclusive Skin', 'Particle Effect', 'Epic Title'],
        legendary: ['Legendary Skin', 'Unique Animation', 'Legendary Title']
    };

    for (let i = 0; i < 5; i++) {
        const chestId = uuidv4();
        const type = chestTypes[Math.floor(Math.random() * chestTypes.length)];
        gameState.chests.set(chestId, {
            type,
            items: items[type],
            position: { x: Math.random() * 800, y: Math.random() * 600 }
        });
    }
};

initializeChests();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Player join
    socket.on('playerJoin', (playerData) => {
        gameState.players.set(socket.id, {
            id: socket.id,
            name: playerData.name,
            position: { x: 400, y: 300 },
            inventory: [],
            score: 0
        });
        io.emit('gameState', {
            players: Array.from(gameState.players.values()),
            chests: Array.from(gameState.chests.values())
        });
    });

    // Player movement
    socket.on('playerMove', (position) => {
        const player = gameState.players.get(socket.id);
        if (player) {
            player.position = position;
            io.emit('playerMoved', { id: socket.id, position });
        }
    });

    // Chest interaction
    socket.on('openChest', (chestId) => {
        const chest = gameState.chests.get(chestId);
        if (chest) {
            const player = gameState.players.get(socket.id);
            const item = chest.items[Math.floor(Math.random() * chest.items.length)];
            player.inventory.push(item);
            io.emit('chestOpened', { playerId: socket.id, item });
        }
    });

    // Game scores
    socket.on('gameScore', (data) => {
        const { game, score } = data;
        const player = gameState.players.get(socket.id);
        if (player) {
            gameState.leaderboard[game].push({
                playerId: socket.id,
                playerName: player.name,
                score
            });
            gameState.leaderboard[game].sort((a, b) => b.score - a.score);
            gameState.leaderboard[game] = gameState.leaderboard[game].slice(0, 10);
            io.emit('leaderboardUpdate', gameState.leaderboard);
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        gameState.players.delete(socket.id);
        io.emit('playerLeft', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 