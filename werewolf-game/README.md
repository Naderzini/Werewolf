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

### 1. Install Dependencies
```bash
cd werewolf-game
npm install
```

### 2. Start the Backend Server
```bash
cd server
npm install
npm start
```
Server runs on `http://localhost:3001`

### 3. Configure Server URL
Edit `src/services/socketService.js` and set `SERVER_URL` to your machine's IP:
```js
const SERVER_URL = 'http://YOUR_IP:3001';
```

### 4. Start the App
```bash
npx expo start
```
Then scan QR with Expo Go (Android/iOS).

## Project Structure
```
werewolf-game/
├── App.js                    # Entry point
├── src/
│   ├── components/           # Shared UI components
│   │   ├── GradientButton.js
│   │   ├── Moon.js
│   │   ├── PhaseBanner.js
│   │   ├── PlayerAvatar.js
│   │   └── PlayerRow.js
│   ├── constants/
│   │   ├── theme.js          # Colors, fonts, shadows
│   │   └── roles.js          # Roles, teams, phases
│   ├── context/
│   │   └── GameContext.js     # Global game state
│   ├── i18n/
│   │   ├── index.js           # i18n config
│   │   └── locales/
│   │       ├── ar.json        # Arabic
│   │       ├── en.json        # English
│   │       └── fr.json        # French
│   ├── navigation/
│   │   └── AppNavigator.js    # Screen navigation
│   ├── screens/
│   │   ├── HomeScreen.js      # Cinematic hero screen
│   │   ├── JoinRoomScreen.js  # Create/join room
│   │   ├── LobbyScreen.js     # Waiting room
│   │   ├── RoleRevealScreen.js
│   │   ├── NightScreen.js     # Night voice chat
│   │   ├── WolfActionScreen.js
│   │   ├── SeerActionScreen.js
│   │   ├── SeerResultScreen.js
│   │   ├── WitchActionScreen.js
│   │   ├── DoctorActionScreen.js
│   │   ├── DayScreen.js       # Day discussion
│   │   ├── VoteScreen.js
│   │   ├── HunterActionScreen.js
│   │   ├── GameResultScreen.js
│   │   └── SettingsScreen.js
│   └── services/
│       ├── socketService.js   # Socket.IO client
│       └── voiceService.js    # WebRTC voice chat
└── server/
    ├── package.json
    └── index.js               # Game server
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
