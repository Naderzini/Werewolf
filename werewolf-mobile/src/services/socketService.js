import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;
  
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.log('Connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// ── Room Actions ──
export const createRoom = (playerName) => {
  return new Promise((resolve, reject) => {
    if (!socket) return reject('Not connected');
    socket.emit('create_room', { playerName }, (response) => {
      if (response.success) resolve(response);
      else reject(response.error);
    });
  });
};

export const joinRoom = (roomCode, playerName) => {
  return new Promise((resolve, reject) => {
    if (!socket) return reject('Not connected');
    socket.emit('join_room', { roomCode, playerName }, (response) => {
      if (response.success) resolve(response);
      else reject(response.error);
    });
  });
};

export const startGame = (roomCode) => {
  return new Promise((resolve, reject) => {
    if (!socket) return reject('Not connected');
    socket.emit('start_game', { roomCode }, (response) => {
      if (response.success) resolve(response);
      else reject(response.error);
    });
  });
};

// ── Night Actions ──
export const sendWolfVote = (roomCode, targetId) => {
  socket?.emit('wolf_vote', { roomCode, targetId });
};

export const sendSeerReveal = (roomCode, targetId) => {
  return new Promise((resolve, reject) => {
    if (!socket) return reject('Not connected');
    socket.emit('seer_reveal', { roomCode, targetId }, (response) => {
      if (response.success) resolve(response);
      else reject('Reveal failed');
    });
  });
};

export const sendWitchAction = (roomCode, action) => {
  socket?.emit('witch_action', { roomCode, action });
};

export const sendDoctorProtect = (roomCode, targetId) => {
  socket?.emit('doctor_protect', { roomCode, targetId });
};

export const endNight = (roomCode) => {
  socket?.emit('end_night', { roomCode });
};

// ── Day Actions ──
export const castVote = (roomCode, targetId) => {
  socket?.emit('cast_vote', { roomCode, targetId });
};

export const endVote = (roomCode) => {
  socket?.emit('end_vote', { roomCode });
};

// ── Hunter ──
export const hunterShot = (roomCode, targetId) => {
  socket?.emit('hunter_shot', { roomCode, targetId });
};

// ── Voice Signaling ──
export const sendVoiceOffer = (roomCode, targetId, offer) => {
  socket?.emit('voice_offer', { roomCode, targetId, offer });
};

export const sendVoiceAnswer = (targetId, answer) => {
  socket?.emit('voice_answer', { targetId, answer });
};

export const sendIceCandidate = (targetId, candidate) => {
  socket?.emit('ice_candidate', { targetId, candidate });
};

// ── Event Listeners ──
export const onPlayersUpdated = (callback) => {
  socket?.on('players_updated', callback);
  return () => socket?.off('players_updated', callback);
};

export const onGameStarted = (callback) => {
  socket?.on('game_started', callback);
  return () => socket?.off('game_started', callback);
};

export const onRoleAssigned = (callback) => {
  socket?.on('role_assigned', callback);
  return () => socket?.off('role_assigned', callback);
};

export const onPhaseChanged = (callback) => {
  socket?.on('phase_changed', callback);
  return () => socket?.off('phase_changed', callback);
};

export const onNightResults = (callback) => {
  socket?.on('night_results', callback);
  return () => socket?.off('night_results', callback);
};

export const onVoteUpdate = (callback) => {
  socket?.on('vote_update', callback);
  return () => socket?.off('vote_update', callback);
};

export const onVoteResult = (callback) => {
  socket?.on('vote_result', callback);
  return () => socket?.off('vote_result', callback);
};

export const onGameOver = (callback) => {
  socket?.on('game_over', callback);
  return () => socket?.off('game_over', callback);
};

export const onHunterTurn = (callback) => {
  socket?.on('hunter_turn', callback);
  return () => socket?.off('hunter_turn', callback);
};

export const onWolfVoteUpdate = (callback) => {
  socket?.on('wolf_vote_update', callback);
  return () => socket?.off('wolf_vote_update', callback);
};

// Voice signaling listeners
export const onVoiceOffer = (callback) => {
  socket?.on('voice_offer', callback);
  return () => socket?.off('voice_offer', callback);
};

export const onVoiceAnswer = (callback) => {
  socket?.on('voice_answer', callback);
  return () => socket?.off('voice_answer', callback);
};

export const onIceCandidate = (callback) => {
  socket?.on('ice_candidate', callback);
  return () => socket?.off('ice_candidate', callback);
};
