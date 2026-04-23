require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
  rooms,
  playerSockets,
  createRoom,
  joinRoom,
  leaveRoom,
  updateSettings,
  startGame,
  resolveNight,
  resolveVote,
  checkWinCondition,
  getPublicRoom,
} = require('./src/rooms');

// Server-side phase timers (roomCode -> NodeJS timer)
const phaseTimers = new Map();
// Skip votes per room (roomCode -> Set<socketId>) — reset on each phase change
const skipVotes = new Map();

function clearPhaseTimer(roomCode) {
  const t = phaseTimers.get(roomCode);
  if (t) { clearTimeout(t); phaseTimers.delete(roomCode); }
}

function clearSkipVotes(roomCode) {
  skipVotes.delete(roomCode);
}

// Count wolf votes and return the id leading the tally (or null if none)
function computeLeadingVictim(wolfVotes) {
  const counts = {};
  Object.values(wolfVotes || {}).forEach((id) => {
    if (id) counts[id] = (counts[id] || 0) + 1;
  });
  let leader = null;
  let max = 0;
  for (const [id, c] of Object.entries(counts)) {
    if (c > max) { max = c; leader = id; }
  }
  return leader;
}

// Roles that act at night (hunter acts only on death; villager never)
const NIGHT_ACTING_ROLES = new Set(['wolf', 'seer', 'witch', 'doctor']);

function markNightActed(room, playerId) {
  if (!room.nightActions.acted) room.nightActions.acted = new Set();
  room.nightActions.acted.add(playerId);
}

function isNightComplete(room) {
  if (room.phase !== 'night') return false;
  const acted = room.nightActions.acted || new Set();
  const aliveActors = room.players.filter(
    (p) => !p.isDead && p.isOnline && NIGHT_ACTING_ROLES.has(p.role)
  );
  if (aliveActors.length === 0) return true;
  return aliveActors.every((p) => acted.has(p.id));
}

// Call after every night action: if everyone who needs to act has acted, advance
function maybeAutoAdvanceNight(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  if (isNightComplete(room)) autoAdvancePhase(roomCode, 'night');
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Helper: broadcast updated public room state
function broadcastRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.to(roomCode).emit('room_updated', getPublicRoom(room));
}

// Helper: send each player their role privately
function emitRoles(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.players.forEach((player) => {
    io.to(player.id).emit('role_assigned', { role: player.role });
  });
}

// Helper: phase transition with timer info + server-side auto-advance
function emitPhase(roomCode, phase, extra = {}) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.phase = phase;
  const durationMap = {
    role_reveal: room.settings.roleRevealDuration,
    night: room.settings.nightDuration,
    day: room.settings.dayDuration,
    vote: room.settings.voteDuration,
  };
  const duration = durationMap[phase] ?? null;
  io.to(roomCode).emit('phase_changed', {
    phase,
    dayNumber: room.dayNumber,
    duration,
    ...extra,
  });

  // Auto-advance when duration expires. Reset skip votes for the new phase.
  clearPhaseTimer(roomCode);
  clearSkipVotes(roomCode);
  if (duration) {
    phaseTimers.set(roomCode, setTimeout(() => autoAdvancePhase(roomCode, phase), duration * 1000));
  }
}

function autoAdvancePhase(roomCode, expectedPhase) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== expectedPhase) return; // already changed

  if (expectedPhase === 'role_reveal') {
    emitPhase(roomCode, 'night');
    return;
  }

  if (expectedPhase === 'night') {
    const results = resolveNight(roomCode);
    // Broadcast updated player list first so clients know who died / their role
    broadcastRoom(roomCode);
    io.to(roomCode).emit('night_results', { results, deadPlayers: room.deadPlayers });
    const winner = checkWinCondition(roomCode);
    if (winner) {
      room.phase = 'game_over';
      io.to(roomCode).emit('game_over', { winner, players: room.players });
      return;
    }
    emitPhase(roomCode, 'day');
    return;
  }

  if (expectedPhase === 'day') {
    emitPhase(roomCode, 'vote');
    return;
  }

  if (expectedPhase === 'vote') {
    const result = resolveVote(roomCode);
    broadcastRoom(roomCode); // reveal eliminated player's role
    io.to(roomCode).emit('vote_result', result);
    if (result && result.isHunter) {
      io.to(result.eliminated.id).emit('hunter_turn');
      return;
    }
    const winner = checkWinCondition(roomCode);
    if (winner) {
      room.phase = 'game_over';
      io.to(roomCode).emit('game_over', { winner, players: room.players });
      return;
    }
    room.dayNumber += 1;
    emitPhase(roomCode, 'night');
  }
}

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── Create room ──
  socket.on('create_room', ({ playerName }, callback = () => {}) => {
    try {
      const playerId = socket.id;
      const room = createRoom(playerId, playerName);
      playerSockets.set(socket.id, { roomCode: room.code, playerId });
      socket.join(room.code);
      callback({ success: true, room: getPublicRoom(room), playerId });
    } catch (err) {
      console.error('create_room error:', err);
      callback({ success: false, error: 'INTERNAL_ERROR' });
    }
  });

  // ── Join room ──
  socket.on('join_room', ({ roomCode, playerName }, callback = () => {}) => {
    try {
      const code = (roomCode || '').toUpperCase().trim();
      const playerId = socket.id;
      const result = joinRoom(code, playerId, playerName);
      if (result.error) return callback({ success: false, error: result.error });

      playerSockets.set(socket.id, { roomCode: code, playerId });
      socket.join(code);
      broadcastRoom(code);
      callback({ success: true, room: getPublicRoom(result.room), playerId });
    } catch (err) {
      console.error('join_room error:', err);
      callback({ success: false, error: 'INTERNAL_ERROR' });
    }
  });

  // ── Leave room ──
  socket.on('leave_room', (_, callback = () => {}) => {
    const info = playerSockets.get(socket.id);
    if (!info) return callback({ success: true });
    const result = leaveRoom(info.roomCode, info.playerId);
    playerSockets.delete(socket.id);
    socket.leave(info.roomCode);
    if (result && !result.deleted) broadcastRoom(info.roomCode);
    callback({ success: true });
  });

  // ── Update game settings (host only) ──
  socket.on('update_settings', ({ settings }, callback = () => {}) => {
    const info = playerSockets.get(socket.id);
    if (!info) return callback({ success: false, error: 'NOT_IN_ROOM' });
    const result = updateSettings(info.roomCode, info.playerId, settings || {});
    if (result.error) return callback({ success: false, error: result.error });
    broadcastRoom(info.roomCode);
    callback({ success: true, settings: result.room.settings });
  });

  // ── Start game (host only) ──
  socket.on('start_game', (_, callback = () => {}) => {
    const info = playerSockets.get(socket.id);
    if (!info) return callback({ success: false, error: 'NOT_IN_ROOM' });
    const result = startGame(info.roomCode, info.playerId);
    if (result.error) return callback({ success: false, error: result.error });

    emitRoles(info.roomCode);
    broadcastRoom(info.roomCode);
    emitPhase(info.roomCode, 'role_reveal');
    callback({ success: true });
  });

  // ── Night actions ──
  socket.on('wolf_vote', ({ targetId }) => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room) return;
    room.nightActions.wolfVotes[socket.id] = targetId;

    // Share votes among wolves only
    const wolves = room.players.filter((p) => p.role === 'wolf' && !p.isDead);
    wolves.forEach((w) => {
      io.to(w.id).emit('wolf_vote_update', { voterId: socket.id, targetId });
    });

    // Also notify the witch of the current leading victim so she can decide
    const leadingVictimId = computeLeadingVictim(room.nightActions.wolfVotes);
    const witch = room.players.find((p) => p.role === 'witch' && !p.isDead);
    if (witch) {
      io.to(witch.id).emit('wolf_victim_update', { victimId: leadingVictimId });
    }

    // Mark this wolf as done and maybe advance the night
    markNightActed(room, socket.id);
    maybeAutoAdvanceNight(info.roomCode);
  });

  socket.on('seer_reveal', ({ targetId }, callback = () => {}) => {
    const info = playerSockets.get(socket.id);
    if (!info) return callback({ success: false });
    const room = rooms.get(info.roomCode);
    if (!room) return callback({ success: false });
    const target = room.players.find((p) => p.id === targetId);
    if (!target) return callback({ success: false });
    callback({
      success: true,
      targetId,
      playerName: target.name,
      isWolf: target.role === 'wolf',
    });
    markNightActed(room, socket.id);
    maybeAutoAdvanceNight(info.roomCode);
  });

  socket.on('witch_action', ({ action }) => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room) return;
    room.nightActions.witchAction = action;
    markNightActed(room, socket.id);
    maybeAutoAdvanceNight(info.roomCode);
  });

  socket.on('doctor_protect', ({ targetId }) => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room) return;
    room.nightActions.doctorTarget = targetId;
    markNightActed(room, socket.id);
    maybeAutoAdvanceNight(info.roomCode);
  });

  // ── End night (manual host trigger) ──
  socket.on('end_night', () => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room) return;
    if (room.hostId !== info.playerId) return;
    clearPhaseTimer(info.roomCode); // cancel server-side timer

    const results = resolveNight(info.roomCode);
    io.to(info.roomCode).emit('night_results', { results, deadPlayers: room.deadPlayers });

    const winner = checkWinCondition(info.roomCode);
    if (winner) {
      room.phase = 'game_over';
      io.to(info.roomCode).emit('game_over', { winner, players: room.players });
      return;
    }
    emitPhase(info.roomCode, 'day');
  });

  // ── Skip phase voting (any player can vote to skip; advance when all alive agree) ──
  socket.on('skip_phase', () => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room) return;
    // Only active game phases can be skipped
    const skippable = ['role_reveal', 'night', 'day', 'vote'];
    if (!skippable.includes(room.phase)) return;

    const player = room.players.find((p) => p.id === info.playerId);
    if (!player || player.isDead) return;

    if (!skipVotes.has(info.roomCode)) skipVotes.set(info.roomCode, new Set());
    const votes = skipVotes.get(info.roomCode);
    votes.add(info.playerId);

    const alive = room.players.filter((p) => p.isOnline && !p.isDead);
    io.to(info.roomCode).emit('skip_update', {
      phase: room.phase,
      skipCount: votes.size,
      totalAlive: alive.length,
    });

    // Unanimous among alive players → advance immediately
    if (votes.size >= alive.length && alive.length > 0) {
      autoAdvancePhase(info.roomCode, room.phase);
    }
  });

  // ── Day vote ──
  socket.on('cast_vote', ({ targetId }) => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room) return;
    room.votes[socket.id] = targetId;
    io.to(info.roomCode).emit('vote_update', { votes: room.votes });
  });

  // ── End vote (manual host trigger) ──
  socket.on('end_vote', () => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room) return;
    if (room.hostId !== info.playerId) return;
    clearPhaseTimer(info.roomCode);

    const result = resolveVote(info.roomCode);
    io.to(info.roomCode).emit('vote_result', result);

    if (result && result.isHunter) {
      io.to(result.eliminated.id).emit('hunter_turn');
      return; // Wait for hunter action
    }

    const winner = checkWinCondition(info.roomCode);
    if (winner) {
      room.phase = 'game_over';
      io.to(info.roomCode).emit('game_over', { winner, players: room.players });
      return;
    }

    room.dayNumber += 1;
    emitPhase(info.roomCode, 'night');
  });

  // ── Hunter shot ──
  socket.on('hunter_shot', ({ targetId }) => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room) return;
    const target = room.players.find((p) => p.id === targetId);
    if (!target) return;

    target.isDead = true;
    room.deadPlayers.push(targetId);
    io.to(info.roomCode).emit('hunter_result', { targetId, targetName: target.name });

    const winner = checkWinCondition(info.roomCode);
    if (winner) {
      room.phase = 'game_over';
      io.to(info.roomCode).emit('game_over', { winner, players: room.players });
      return;
    }
    room.dayNumber += 1;
    emitPhase(info.roomCode, 'night');
  });

  // ── Voice signaling (WebRTC) ──
  socket.on('voice_offer', ({ targetId, offer }) => {
    io.to(targetId).emit('voice_offer', { from: socket.id, offer });
  });
  socket.on('voice_answer', ({ targetId, answer }) => {
    io.to(targetId).emit('voice_answer', { from: socket.id, answer });
  });
  socket.on('ice_candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('ice_candidate', { from: socket.id, candidate });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    const info = playerSockets.get(socket.id);
    if (info) {
      const result = leaveRoom(info.roomCode, info.playerId);
      playerSockets.delete(socket.id);
      if (result?.deleted) {
        clearPhaseTimer(info.roomCode); // clean up timer for empty room
        clearSkipVotes(info.roomCode);
      } else {
        broadcastRoom(info.roomCode);
      }
    }
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

// ── HTTP routes ──
app.get('/', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, players: playerSockets.size });
});

app.get('/rooms', (req, res) => {
  const list = [];
  rooms.forEach((room, code) => {
    list.push({
      code,
      players: room.players.length,
      started: room.gameStarted,
      phase: room.phase,
    });
  });
  res.json(list);
});

// ── Start server ──
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🐺 Werewolf Server running on port ${PORT}`);
});
