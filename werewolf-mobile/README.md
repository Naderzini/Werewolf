# 🐺 ذئب المدينة — Werewolf Mobile Game

A multiplayer online Werewolf (Loup-Garou) mobile game for Android & iOS built with React Native (Expo).

## Features
- 🎙️ **Voice Chat** — Real-time voice communication (WebRTC)
- 🔴 **Online Multiplayer** — 6-12 players per room
- 🌍 **Multi-language** — Arabic, English, French
- 🃏 **6 Roles** — Wolf, Villager, Seer, Witch, Doctor, Hunter
- 🌙 **Night/Day Phases** — Full game cycle with role-specific actions

## Tech Stack
- **Frontend**: React Native (Expo), React Navigation, i18next
- **Backend**: Node.js, Express, Socket.IO
- **Voice**: WebRTC (react-native-webrtc)
- **State**: React Context + useReducer

## Getting Started

### Prerequisites
- Node.js 18.18.0 or higher
- Expo Go app on your mobile device
- Backend server running (see [werewolf-backend](../werewolf-backend/README.md))

### 1. Install Dependencies
```bash
cd werewolf-mobile
npm install
```

### 2. Configure Server URL
Edit `src/config/api.js` and update `SOCKET_URL_LAN` with your computer's IP address:
```js
SOCKET_URL_LAN: 'http://YOUR_COMPUTER_IP:3000'
```

To find your IP:
- **macOS**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows**: `ipconfig`
- **Linux**: `ip addr show`

### 3. Start the App
```bash
# Make sure to use Node.js 20+
source ~/.nvm/nvm.sh && nvm use 20

# Start Expo with LAN mode
npx expo start --lan
```

### 4. Connect from Mobile
- Open **Expo Go** app on your phone
- Scan the QR code OR
- Enter manually: `exp://YOUR_COMPUTER_IP:8081`

## Project Structure
```
werewolf-mobile/
├── App.js                    # Entry point
├── app.json                  # Expo configuration
├── package.json              # Dependencies
├── src/
│   ├── components/           # Shared UI components
│   │   ├── GradientButton.js
│   │   ├── Moon.js
│   │   ├── PhaseBanner.js
│   │   ├── PlayerAvatar.js
│   │   └── PlayerRow.js
│   ├── config/
│   │   └── api.js            # API/Socket URL configuration
│   ├── constants/
│   │   ├── theme.js          # Colors, fonts, shadows
│   │   └── roles.js          # Roles, teams, phases
│   ├── context/
│   │   └── GameContext.js    # Global game state
│   ├── i18n/
│   │   ├── index.js          # i18n config
│   │   └── locales/
│   │       ├── ar.json       # Arabic
│   │       ├── en.json       # English
│   │       └── fr.json       # French
│   ├── navigation/
│   │   └── AppNavigator.js   # Screen navigation
│   ├── screens/
│   │   ├── HomeScreen.js     # Cinematic hero screen
│   │   ├── JoinRoomScreen.js # Create/join room
│   │   ├── LobbyScreen.js    # Waiting room
│   │   ├── RoleRevealScreen.js
│   │   ├── NightScreen.js    # Night voice chat
│   │   ├── WolfActionScreen.js
│   │   ├── SeerActionScreen.js
│   │   ├── SeerResultScreen.js
│   │   ├── WitchActionScreen.js
│   │   ├── DoctorActionScreen.js
│   │   ├── DayScreen.js      # Day discussion
│   │   ├── VoteScreen.js
│   │   ├── HunterActionScreen.js
│   │   ├── GameResultScreen.js
│   │   ├── SettingsScreen.js
│   │   └── TestMenuScreen.js # Testing navigation
│   └── services/
│       ├── socketService.js  # Socket.IO client
│       └── voiceService.js   # WebRTC voice chat
└── assets/                   # Images, icons, fonts
```

## Game Flow
1. **Home** → Create or Join Room
2. **Lobby** → Wait for players (6-12)
3. **Role Reveal** → See your secret role
4. **Night** → Role-specific actions (Wolf kills, Seer reveals, etc.)
5. **Day** → Discussion with voice chat
6. **Vote** → Eliminate a suspect
7. **Repeat** until wolves or villagers win

## Roles
| Role | Team | Night Action |
|------|------|-------------|
| 🐺 Wolf | Evil | Choose a victim to kill |
| 🧑‍🌾 Villager | Good | No action (discuss by day) |
| 🔮 Seer | Good | Reveal one player's identity |
| 🧙‍♂️ Witch | Good | Save victim OR poison someone (1x each) |
| 🧑‍⚕️ Doctor | Good | Protect one player (not same twice) |
| 🏹 Hunter | Good | When dying, take someone down |

## License
Free to use. Built with ❤️
