import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

let socket = null;
// Persistent listeners that survive socket reconnects / early subscriptions
const persistentListeners = new Map(); // event -> Set<callback>

function attachAllListeners(sock) {
  persistentListeners.forEach((cbs, event) => {
    cbs.forEach((cb) => {
      sock.off(event, cb);
      sock.on(event, cb);
    });
  });
}

// ── Connection lifecycle ──
export const connectSocket = () => {
  return new Promise((resolve, reject) => {
    // Already connected — resolve immediately
    if (socket?.connected) return resolve(socket);

    // Already connecting — wait for it
    if (socket && !socket.connected) {
      const onConnect = () => { cleanup(); resolve(socket); };
      const onError = (err) => { cleanup(); reject(err); };
      const cleanup = () => { socket.off('connect', onConnect); socket.off('connect_error', onError); };
      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
      return;
    }

    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 8000,
    });

    // Attach any listeners that were registered before the socket existed
    attachAllListeners(socket);

    socket.on('connect', () => {
      console.log('[socket] connected', socket.id);
      // Re-attach on every (re)connect to survive network drops
      attachAllListeners(socket);
      resolve(socket);
    });

    socket.once('connect_error', (err) => {
      console.log('[socket] error', err.message);
      reject(new Error('NOT_CONNECTED'));
    });

    socket.on('disconnect', (reason) => console.log('[socket] disconnected', reason));
  });
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// ── Helpers ──
const ACK_TIMEOUT_MS = 8000;
const emitWithAck = (event, payload) => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) return reject(new Error('NOT_CONNECTED'));
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('TIMEOUT'));
    }, ACK_TIMEOUT_MS);
    socket.emit(event, payload, (response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (response?.success) resolve(response);
      else reject(new Error(response?.error || 'UNKNOWN_ERROR'));
    });
  });
};

// ── Room actions ──
export const createRoom = (playerName) => emitWithAck('create_room', { playerName });
export const joinRoom = (roomCode, playerName) => emitWithAck('join_room', { roomCode, playerName });
export const leaveRoom = () => emitWithAck('leave_room', {});
export const updateSettings = (settings) => emitWithAck('update_settings', { settings });
export const startGame = () => emitWithAck('start_game', {});

// ── Night actions ──
export const sendWolfVote = (targetId) => socket?.emit('wolf_vote', { targetId });
export const sendSeerReveal = (targetId) => emitWithAck('seer_reveal', { targetId });
export const sendWitchAction = (action) => socket?.emit('witch_action', { action });
export const sendDoctorProtect = (targetId) => socket?.emit('doctor_protect', { targetId });
export const endNight = () => socket?.emit('end_night');

// ── Day actions ──
export const castVote = (targetId) => socket?.emit('cast_vote', { targetId });
export const endVote = () => socket?.emit('end_vote');

// ── Hunter ──
export const hunterShot = (targetId) => socket?.emit('hunter_shot', { targetId });

// ── Skip phase ──
export const sendSkipPhase = () => socket?.emit('skip_phase');

// ── Voice signaling ──
export const sendVoiceOffer = (targetId, offer) => socket?.emit('voice_offer', { targetId, offer });
export const sendVoiceAnswer = (targetId, answer) => socket?.emit('voice_answer', { targetId, answer });
export const sendIceCandidate = (targetId, candidate) => socket?.emit('ice_candidate', { targetId, candidate });

// ── Event listeners (persistent: work even if called before socket exists) ──
const subscribe = (event) => (callback) => {
  if (!persistentListeners.has(event)) persistentListeners.set(event, new Set());
  persistentListeners.get(event).add(callback);
  // If socket already exists, attach immediately
  if (socket) socket.on(event, callback);
  return () => {
    persistentListeners.get(event)?.delete(callback);
    socket?.off(event, callback);
  };
};

export const onRoomUpdated = subscribe('room_updated');
export const onRoleAssigned = subscribe('role_assigned');
export const onPhaseChanged = subscribe('phase_changed');
export const onNightResults = subscribe('night_results');
export const onVoteUpdate = subscribe('vote_update');
export const onVoteResult = subscribe('vote_result');
export const onGameOver = subscribe('game_over');
export const onHunterTurn = subscribe('hunter_turn');
export const onHunterResult = subscribe('hunter_result');
export const onWolfVoteUpdate = subscribe('wolf_vote_update');
export const onWolfVictimUpdate = subscribe('wolf_victim_update');
export const onSkipUpdate = subscribe('skip_update');
export const onVoiceOffer = subscribe('voice_offer');
export const onVoiceAnswer = subscribe('voice_answer');
export const onIceCandidate = subscribe('ice_candidate');
