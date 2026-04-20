import React, { createContext, useContext, useReducer } from 'react';
import { ROLES, PHASES, getRoleDistribution } from '../constants/roles';

const GameContext = createContext();

const initialState = {
  // Player info
  playerId: null,
  playerName: '',
  
  // Room info
  roomId: null,
  roomCode: null,
  isHost: false,
  
  // Players in room
  players: [],
  
  // Game state
  gameStarted: false,
  phase: null,        // 'night' | 'day' | 'vote'
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
  
  // Timer
  timer: 0,
};

const gameReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PLAYER':
      return { ...state, playerId: action.payload.id, playerName: action.payload.name };
    
    case 'SET_ROOM':
      return { 
        ...state, 
        roomId: action.payload.roomId, 
        roomCode: action.payload.roomCode,
        isHost: action.payload.isHost || false,
      };
    
    case 'UPDATE_PLAYERS':
      return { ...state, players: action.payload };
    
    case 'START_GAME':
      return { 
        ...state, 
        gameStarted: true, 
        myRole: action.payload.role,
        phase: PHASES.NIGHT,
        dayNumber: 1,
      };
    
    case 'SET_PHASE':
      return { 
        ...state, 
        phase: action.payload.phase,
        dayNumber: action.payload.phase === PHASES.DAY ? state.dayNumber : state.dayNumber,
        timer: action.payload.timer || 0,
      };
    
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
        deadPlayers: [...state.deadPlayers, ...action.payload.newDead],
      };
    
    case 'GAME_OVER':
      return { ...state, gameOver: true, winner: action.payload };
    
    case 'SET_TIMER':
      return { ...state, timer: action.payload };
    
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    
    case 'UPDATE_SPEAKING':
      return { ...state, speakingPlayers: action.payload };
    
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
    setPlayer: (id, name) => dispatch({ type: 'SET_PLAYER', payload: { id, name } }),
    setRoom: (roomId, roomCode, isHost) => dispatch({ type: 'SET_ROOM', payload: { roomId, roomCode, isHost } }),
    updatePlayers: (players) => dispatch({ type: 'UPDATE_PLAYERS', payload: players }),
    startGame: (role) => dispatch({ type: 'START_GAME', payload: { role } }),
    setPhase: (phase, timer) => dispatch({ type: 'SET_PHASE', payload: { phase, timer } }),
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
    setTimer: (time) => dispatch({ type: 'SET_TIMER', payload: time }),
    toggleMute: () => dispatch({ type: 'TOGGLE_MUTE' }),
    updateSpeaking: (players) => dispatch({ type: 'UPDATE_SPEAKING', payload: players }),
    resetNight: () => dispatch({ type: 'RESET_NIGHT' }),
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
