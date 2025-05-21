# Game Hub

A web-based game hub featuring multiple mini-games and a chest system. Players can walk around in a virtual space, interact with chests, and play various mini-games.

## Features

- Virtual character movement
- Interactive chest system with different rarity levels
- Multiple mini-games:
  - Tic Tac Toe
  - Number Wordle
- Leaderboard system
- Inventory system for collected items
- Real-time multiplayer support

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd game-hub
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## How to Play

1. Enter your name when prompted
2. Use arrow keys to move your character around
3. Click on chests to open them and collect items
4. Enter game rooms to play mini-games
5. Check your inventory for collected items
6. View the leaderboard for high scores

## Game Controls

- Arrow Keys: Move character
- Mouse: Click on chests and game rooms
- Enter/Backspace: Game-specific controls (in Number Wordle)
- Numbers 0-9: Input numbers (in Number Wordle)

## Adding New Games

To add a new game:

1. Create a new HTML file in the `public` directory
2. Add the game room to the main interface in `public/index.html`
3. Update the server's game state handling in `server.js`
4. Add the game to the leaderboard system

## Chest System

Chests come in different rarities:
- Common (Gray)
- Rare (Blue)
- Epic (Purple)
- Legendary (Orange)

Each chest type has different possible rewards and drop rates.

## Contributing

Feel free to submit issues and enhancement requests! 