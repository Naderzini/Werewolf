import React, { createContext, useContext, useReducer } from 'react';
import { ROLES, PHASES, getRoleDistribution } from '../constants/roles';

const GameContext = createContext();

// Default options (overridden by server `room.settings` broadcasts)
// No automatic timers — phases advance only when all players have acted.
export const DEFAULT_SETTINGS = {
  extraWolf: false,
  extraTime: 0,
};

const initialState = {
  // Player info
  playerId: null,
  playerName: '',
  playerAvatar: '🧑', // Default avatar

  // Room info
  
  // Room info
  roomId: null,
  roomCode: null,
  isHost: false,
  
  // Players in room
  players: [],

  // Game settings (editable by host in lobby)
  settings: { ...DEFAULT_SETTINGS },

  // Game state
  gameStarted: false,
  phase: null,        // 'lobby' | 'role_reveal' | 'night' | 'day' | 'vote' | 'game_over'
  phaseDuration: 0,   // duration in seconds for current phase (from server)
  dayNumber: 0,
  myRole: null,
  
  // Night actions
  wolfVictim: null,
  seerTarget: null,
  seerResults: [],    // [{playerId, isWolf}]
  witchSaveUsed: false,
  witchKillUsed: false,
  witchAction: null,  // {type: 'save'|'kill', targetId}
  doctorTarget: null,
  doctorLastTarget: null,
  
  // Day/Vote
  votes: {},          // {voterId: targetId}
  eliminatedToday: null,
  
  // Hunter
  hunterShooting: false,
  hunterTarget: null,
  
  // Results
  nightResults: [],   // [{playerId, event: 'killed'|'saved'|'protected'}]
  deadPlayers: [],
  gameOver: false,
  winner: null,       // 'wolves' | 'village'
  
  // Voice
  isMuted: false,
  isSpeaking: false,
  speakingPlayers: [],
  
  // Sequential night step tracking (from server night_action_status)
  nightStep: null,     // 'doctor' | 'wolves' | 'witch' | 'seer' | null
  doctorDone: false,
  wolvesDone: false,
  witchDone: false,
  seerDone: false,

  // Skip-phase voting (ready-up)
  skipCount: 0,
  skipTotal: 0,
  iSkipped: false,

  // Dynamic data (replaces hardcoded values)
  wolfMessages: [],     // [{ id, senderId, senderName, text, timestamp }]
  speakingPlayer: null, // { id, name } | null
  seerResult: null,     // { targetId, targetName, isWolf } | null
  gameRevealedPlayers: [], // Populated by game_over event
};

const gameReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PLAYER':
      return { 
        ...state, 
        playerId: action.payload.id, 
        playerName: action.payload.name,
        playerAvatar: action.payload.avatar || '🧑'
      };
    
    case 'SET_AVATAR':
      return { ...state, playerAvatar: action.payload };
    
    case 'SET_ROOM':
      return { 
        ...state, 
        roomId: action.payload.roomId, 
        roomCode: action.payload.roomCode,
        isHost: action.payload.isHost || false,
      };
    
    case 'UPDATE_PLAYERS':
      return { ...state, players: action.payload };

    case 'UPDATE_ROOM': {
      // Payload: public room object from server (see backend getPublicRoom)
      const r = action.payload || {};
      return {
        ...state,
        players: r.players ?? state.players,
        settings: r.settings ?? state.settings,
        phase: r.phase ?? state.phase,
        dayNumber: r.dayNumber ?? state.dayNumber,
        gameStarted: r.gameStarted ?? state.gameStarted,
        isHost: r.hostId ? r.hostId === state.playerId : state.isHost,
      };
    }

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SET_ROLE':
      return { ...state, myRole: action.payload };
    
    case 'START_GAME':
      return { 
        ...state, 
        gameStarted: true, 
        myRole: action.payload.role ?? state.myRole,
        phase: PHASES.NIGHT,
        dayNumber: 1,
      };
    
    case 'SET_PHASE':
      return { 
        ...state, 
        phase: action.payload.phase,
        dayNumber: action.payload.dayNumber ?? state.dayNumber,
        // Reset skip votes on every phase transition
        skipCount: 0,
        skipTotal: 0,
        iSkipped: false,
        // Reset night step tracking when entering night (will be set by night_action_status)
        ...(action.payload.phase === 'night' ? {
          nightStep: null,
          doctorDone: false,
          wolvesDone: false,
          witchDone: false,
          seerDone: false,
          wolfVictim: null,
          seerTarget: null,
          witchAction: null,
          doctorTarget: null,
          nightResults: [],
          eliminatedToday: null,
          votes: {},
        } : {}),
      };

    case 'SET_NIGHT_STATUS':
      return {
        ...state,
        nightStep: action.payload.nightStep ?? state.nightStep,
        doctorDone: action.payload.doctorDone ?? state.doctorDone,
        wolvesDone: action.payload.wolvesDone ?? state.wolvesDone,
        witchDone: action.payload.witchDone ?? state.witchDone,
        seerDone: action.payload.seerDone ?? state.seerDone,
      };

    case 'SET_SKIP':
      return {
        ...state,
        skipCount: action.payload.skipCount ?? state.skipCount,
        skipTotal: action.payload.totalAlive ?? state.skipTotal,
      };

    case 'MARK_SKIPPED':
      return { ...state, iSkipped: true };

    case 'SET_WOLF_VICTIM':
      return { ...state, wolfVictim: action.payload };
    
    case 'NEXT_DAY':
      return { ...state, phase: PHASES.DAY, dayNumber: state.dayNumber + 1 };
    
    case 'WOLF_VOTE':
      return { ...state, wolfVictim: action.payload };
    
    case 'SEER_REVEAL':
      return { 
        ...state, 
        seerTarget: action.payload.targetId,
        seerResults: [...state.seerResults, { 
          playerId: action.payload.targetId, 
          playerName: action.payload.playerName,
          isWolf: action.payload.isWolf 
        }],
      };
    
    case 'WITCH_ACTION':
      return { 
        ...state, 
        witchAction: action.payload,
        witchSaveUsed: action.payload?.type === 'save' ? true : state.witchSaveUsed,
        witchKillUsed: action.payload?.type === 'kill' ? true : state.witchKillUsed,
      };
    
    case 'DOCTOR_PROTECT':
      return { 
        ...state, 
        doctorTarget: action.payload,
        doctorLastTarget: action.payload,
      };
    
    case 'CAST_VOTE':
      return { 
        ...state, 
        votes: { ...state.votes, [action.payload.voterId]: action.payload.targetId },
      };
    
    case 'ELIMINATE_PLAYER':
      return {
        ...state,
        eliminatedToday: action.payload,
        deadPlayers: [...state.deadPlayers, action.payload],
      };
    
    case 'HUNTER_SHOOT':
      return {
        ...state,
        hunterShooting: true,
      };
    
    case 'HUNTER_TARGET':
      return {
        ...state,
        hunterTarget: action.payload,
        hunterShooting: false,
        deadPlayers: [...state.deadPlayers, action.payload],
      };
    
    case 'NIGHT_RESULTS':
      return {
        ...state,
        nightResults: action.payload.results,
        // Server sends the full authoritative deadPlayers list — don't append
        deadPlayers: Array.isArray(action.payload.newDead)
          ? action.payload.newDead
          : state.deadPlayers,
      };
    
    case 'GAME_OVER':
      return { ...state, gameOver: true, winner: action.payload };
    
    case 'SET_TIMER':
      return { ...state, timer: action.payload };
    
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    
    case 'UPDATE_SPEAKING':
      return { ...state, speakingPlayers: action.payload };
    
    case 'SET_WOLF_MESSAGES':
      return { ...state, wolfMessages: action.payload };
    
    case 'ADD_WOLF_MESSAGE':
      return { ...state, wolfMessages: [...state.wolfMessages, action.payload] };
    
    case 'SET_SPEAKING_PLAYER':
      return { ...state, speakingPlayer: action.payload };
    
    case 'SET_SEER_RESULT':
      return { ...state, seerResult: action.payload };
    
    case 'SET_GAME_REVEALED_PLAYERS':
      return { ...state, gameRevealedPlayers: action.payload };

    case 'RESET_NIGHT':
      return {
        ...state,
        wolfVictim: null,
        seerTarget: null,
        witchAction: null,
        doctorTarget: null,
        nightResults: [],
        eliminatedToday: null,
        votes: {},
        nightStep: null,
        doctorDone: false,
        wolvesDone: false,
        witchDone: false,
        seerDone: false,
        // Reset dynamic data that's night-specific
        wolfMessages: [],
        seerResult: null,
      };
    
    case 'RESET_GAME':
      return { ...initialState, playerId: state.playerId, playerName: state.playerName };
    
    default:
      return state;
  }
};

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const actions = {
    setPlayer: (id, name, avatar) => dispatch({ type: 'SET_PLAYER', payload: { id, name, avatar } }),
    setAvatar: (avatar) => dispatch({ type: 'SET_AVATAR', payload: avatar }),
    setRoom: (roomId, roomCode, isHost) => dispatch({ type: 'SET_ROOM', payload: { roomId, roomCode, isHost } }),
    updatePlayers: (players) => dispatch({ type: 'UPDATE_PLAYERS', payload: players }),
    updateRoom: (room) => dispatch({ type: 'UPDATE_ROOM', payload: room }),
    setSettings: (partial) => dispatch({ type: 'SET_SETTINGS', payload: partial }),
    setRole: (role) => dispatch({ type: 'SET_ROLE', payload: role }),
    startGame: (role) => dispatch({ type: 'START_GAME', payload: { role } }),
    setPhase: (phase, duration, dayNumber) => dispatch({ type: 'SET_PHASE', payload: { phase, duration, dayNumber } }),
    nextDay: () => dispatch({ type: 'NEXT_DAY' }),
    wolfVote: (targetId) => dispatch({ type: 'WOLF_VOTE', payload: targetId }),
    seerReveal: (targetId, playerName, isWolf) => dispatch({ type: 'SEER_REVEAL', payload: { targetId, playerName, isWolf } }),
    witchAction: (action) => dispatch({ type: 'WITCH_ACTION', payload: action }),
    doctorProtect: (targetId) => dispatch({ type: 'DOCTOR_PROTECT', payload: targetId }),
    castVote: (voterId, targetId) => dispatch({ type: 'CAST_VOTE', payload: { voterId, targetId } }),
    eliminatePlayer: (playerId) => dispatch({ type: 'ELIMINATE_PLAYER', payload: playerId }),
    hunterShoot: () => dispatch({ type: 'HUNTER_SHOOT' }),
    hunterTarget: (targetId) => dispatch({ type: 'HUNTER_TARGET', payload: targetId }),
    nightResults: (results, newDead) => dispatch({ type: 'NIGHT_RESULTS', payload: { results, newDead } }),
    gameOver: (winner) => dispatch({ type: 'GAME_OVER', payload: winner }),
    setNightStatus: (status) => dispatch({ type: 'SET_NIGHT_STATUS', payload: status }),
    toggleMute: () => dispatch({ type: 'TOGGLE_MUTE' }),
    updateSpeaking: (players) => dispatch({ type: 'UPDATE_SPEAKING', payload: players }),
    resetNight: () => dispatch({ type: 'RESET_NIGHT' }),
    setSkip: ({ skipCount, totalAlive }) => dispatch({ type: 'SET_SKIP', payload: { skipCount, totalAlive } }),
    markSkipped: () => dispatch({ type: 'MARK_SKIPPED' }),
    setWolfVictim: (victimId) => dispatch({ type: 'SET_WOLF_VICTIM', payload: victimId }),
    setWolfMessages: (messages) => dispatch({ type: 'SET_WOLF_MESSAGES', payload: messages }),
    addWolfMessage: (message) => dispatch({ type: 'ADD_WOLF_MESSAGE', payload: message }),
    setSpeakingPlayer: (player) => dispatch({ type: 'SET_SPEAKING_PLAYER', payload: player }),
    setSeerResult: (result) => dispatch({ type: 'SET_SEER_RESULT', payload: result }),
    setGameRevealedPlayers: (players) => dispatch({ type: 'SET_GAME_REVEALED_PLAYERS', payload: players }),
    resetGame: () => dispatch({ type: 'RESET_GAME' }),
  };

  return (
    <GameContext.Provider value={{ state, ...actions }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
