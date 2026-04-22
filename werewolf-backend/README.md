# 🐺 Werewolf Game - Backend Server

Backend server for the Werewolf multiplayer game using Socket.IO and Express.

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18.0 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on port 3000 by default (or the PORT specified in .env).

## 🔧 Configuration

Edit the `.env` file to configure:

```env
PORT=3000
NODE_ENV=development
```

## 📡 API Endpoints

### HTTP Endpoints

- `GET /` - Health check
- `GET /rooms` - List all active rooms

### Socket.IO Events

#### Client → Server
- `create_room` - Create a new game room
- `join_room` - Join an existing room
- `start_game` - Start the game (host only)
- `wolf_action` - Werewolf night action
- `seer_action` - Seer night action
- `witch_action` - Witch night action
- `doctor_action` - Doctor night action
- `vote` - Vote during day phase
- `hunter_action` - Hunter final action

#### Server → Client
- `room_created` - Room successfully created
- `player_joined` - New player joined
- `player_left` - Player left the room
- `game_started` - Game has started
- `role_assigned` - Player role assignment
- `night_phase` - Night phase started
- `day_phase` - Day phase started
- `game_over` - Game ended

## 🎮 Game Rules

- Minimum 6 players required to start
- Roles distributed based on player count:
  - 6 players: 1 wolf, 1 villager, 1 seer, 1 witch, 1 doctor, 1 hunter
  - 7-12 players: Scaled distribution

## 📁 Project Structure

```
werewolf-backend/
├── index.js          # Main server file
├── package.json      # Dependencies
├── .env.example      # Environment variables template
└── README.md         # This file
```

## 🔒 Security Notes

- CORS is currently set to allow all origins (`*`) for development
- Update CORS settings for production deployment
- Consider adding rate limiting for production

## 📝 License

MIT
