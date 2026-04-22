# 🐺 Werewolf Game - Multiplayer Mobile Game

A real-time multiplayer Werewolf (Loup-Garou) game with voice chat for iOS and Android.

## 📁 Project Structure

This project is split into two separate applications:

```
Werewolf/
├── werewolf-backend/     # Node.js backend server (Socket.IO)
├── werewolf-mobile/      # React Native mobile app (Expo)
└── README.md            # This file
```

### Backend (`werewolf-backend/`)
Node.js server handling game logic, room management, and real-time communication via Socket.IO.

**[→ Backend Documentation](./werewolf-backend/README.md)**

### Mobile App (`werewolf-mobile/`)
React Native (Expo) mobile application for iOS and Android with multilingual support.

**[→ Mobile App Documentation](./werewolf-mobile/README.md)**

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
cd werewolf-backend
npm install
npm start
```

Server will run on `http://localhost:3000`

### 2. Start the Mobile App

```bash
cd werewolf-mobile
npm install

# Update src/config/api.js with your computer's IP address
# Then start Expo
npx expo start --lan
```

### 3. Connect from Mobile Device

- Install **Expo Go** on your phone
- Scan the QR code or enter: `exp://YOUR_IP:8081`

## 🎮 Features

- 🎙️ **Real-time Voice Chat** - Communicate with other players
- 🔴 **Online Multiplayer** - 6-12 players per game
- 🌍 **Multi-language** - Arabic, English, French
- 🃏 **6 Unique Roles** - Wolf, Villager, Seer, Witch, Doctor, Hunter
- 🌙 **Day/Night Cycles** - Complete game phases with role-specific actions
- 📱 **Cross-platform** - iOS and Android support

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- Socket.IO for real-time communication
- UUID for unique identifiers

### Mobile
- React Native (Expo SDK 54)
- React Navigation
- Socket.IO Client
- i18next for internationalization
- WebRTC for voice chat

## 📖 Game Rules

### Roles

| Role | Team | Ability |
|------|------|---------|
| 🐺 Wolf | Evil | Kill a villager each night |
| 🧑‍🌾 Villager | Good | No special ability |
| 🔮 Seer | Good | Reveal one player's identity |
| 🧙 Witch | Good | Save or poison (once each) |
| ⚕️ Doctor | Good | Protect one player per night |
| 🏹 Hunter | Good | Shoot someone when eliminated |

### Win Conditions
- **Villagers win**: Eliminate all wolves
- **Wolves win**: Equal or outnumber villagers

## 📝 Development

### Prerequisites
- Node.js 18.18.0 or higher
- npm or yarn
- Expo Go app (for mobile testing)

### Environment Setup

**Backend:**
```bash
cd werewolf-backend
cp .env.example .env
# Edit .env with your configuration
```

**Mobile:**
```bash
cd werewolf-mobile
# Edit src/config/api.js with your server URL
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is free to use. Built with ❤️

## 🐛 Troubleshooting

### Cannot connect to server
- Ensure backend is running
- Check firewall settings
- Verify IP address in `src/config/api.js`
- Use `--lan` flag when starting Expo

### Node version error
```bash
# Use Node.js 20+
nvm use 20
```

### Expo connection issues
```bash
# Clear cache and restart
npx expo start --clear --lan
```

## 📞 Support

For issues and questions, please open an issue on GitHub.
