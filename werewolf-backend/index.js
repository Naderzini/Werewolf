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

// Skip votes per room (roomCode -> Set<socketId>) — reset on each phase change
const skipVotes = new Map();

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

// ── Sequential night steps ──
// Order: doctor → wolves → witch → seer → resolve
const NIGHT_STEPS = ['doctor', 'wolves', 'witch', 'seer', 'resolve'];

// Check if a given night step has any alive player that needs to act
function stepHasActor(room, step) {
  switch (step) {
    case 'doctor': return room.players.some((p) => p.role === 'doctor' && !p.isDead && p.isOnline);
    case 'wolves': return room.players.some((p) => p.role === 'wolf' && !p.isDead && p.isOnline);
    case 'witch':  return room.players.some((p) => p.role === 'witch' && !p.isDead && p.isOnline);
    case 'seer':   return room.players.some((p) => p.role === 'seer' && !p.isDead && p.isOnline);
    case 'resolve': return true; // always runs
    default: return false;
  }
}

// Advance to the next night step that has an actor, or resolve
function advanceNightStep(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'night') return;

  const currentIdx = NIGHT_STEPS.indexOf(room.nightStep);
  for (let i = currentIdx + 1; i < NIGHT_STEPS.length; i++) {
    const step = NIGHT_STEPS[i];
    if (step === 'resolve') {
      // All actions collected — resolve the night
      const results = resolveNight(roomCode);
      broadcastRoom(roomCode);
      io.to(roomCode).emit('night_results', { results, deadPlayers: room.deadPlayers });

      // Check if hunter was killed by wolves
      const hunterKilled = (results || []).find(
        (r) => r.event === 'killed_by_wolves' && r.role === 'hunter'
      ) || (results || []).find(
        (r) => r.event === 'killed_by_witch' && r.role === 'hunter'
      );
      if (hunterKilled) {
        room.phase = 'hunter_turn';
        io.to(hunterKilled.playerId).emit('hunter_turn');
        broadcastNightStatus(roomCode);
        return;
      }

      const winner = checkWinCondition(roomCode);
      if (winner) {
        room.phase = 'game_over';
        io.to(roomCode).emit('game_over', { winner, players: room.players });
        return;
      }
      emitPhase(roomCode, 'day');
      return;
    }
    if (stepHasActor(room, step)) {
      room.nightStep = step;
      broadcastNightStatus(roomCode);
      return;
    }
  }
}

// Check if all players for the current step have acted
function isCurrentStepComplete(room) {
  const acted = room.nightActions.acted || new Set();
  switch (room.nightStep) {
    case 'doctor': {
      const docs = room.players.filter((p) => p.role === 'doctor' && !p.isDead && p.isOnline);
      return docs.length === 0 || docs.every((p) => acted.has(p.id));
    }
    case 'wolves': {
      const wolves = room.players.filter((p) => p.role === 'wolf' && !p.isDead && p.isOnline);
      return wolves.length === 0 || wolves.every((p) => acted.has(p.id));
    }
    case 'witch': {
      const witches = room.players.filter((p) => p.role === 'witch' && !p.isDead && p.isOnline);
      return witches.length === 0 || witches.every((p) => acted.has(p.id));
    }
    case 'seer': {
      const seers = room.players.filter((p) => p.role === 'seer' && !p.isDead && p.isOnline);
      return seers.length === 0 || seers.every((p) => acted.has(p.id));
    }
    default: return true;
  }
}

// After every night action: if current step is done, advance to next step
function maybeAdvanceNightStep(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'night') return;
  if (isCurrentStepComplete(room)) {
    advanceNightStep(roomCode);
  }
}

function markNightActed(room, playerId) {
  if (!room.nightActions.acted) room.nightActions.acted = new Set();
  room.nightActions.acted.add(playerId);
}

// Broadcast night action status to all clients so they can show/hide/grey out UIs
function broadcastNightStatus(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const acted = room.nightActions.acted || new Set();
  io.to(roomCode).emit('night_action_status', {
    nightStep: room.nightStep,
    doctorDone: room.players.filter((p) => p.role === 'doctor' && !p.isDead && p.isOnline)
      .every((p) => acted.has(p.id)),
    wolvesDone: room.players.filter((p) => p.role === 'wolf' && !p.isDead && p.isOnline)
      .every((p) => acted.has(p.id)),
    witchDone: room.players.filter((p) => p.role === 'witch' && !p.isDead && p.isOnline)
      .every((p) => acted.has(p.id)),
    seerDone: room.players.filter((p) => p.role === 'seer' && !p.isDead && p.isOnline)
      .every((p) => acted.has(p.id)),
  });
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

// Helper: phase transition — no automatic timers.
// Phase advances only when all relevant players have submitted their actions.
function emitPhase(roomCode, phase, extra = {}) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.phase = phase;
  io.to(roomCode).emit('phase_changed', {
    phase,
    dayNumber: room.dayNumber,
    duration: null, // no timers — action-driven advancement
    ...extra,
  });

  clearSkipVotes(roomCode);

  // When entering night, reset nightActions and start the sequential night flow
  if (phase === 'night') {
    room.nightActions = {
      wolfVotes: {},
      seerTarget: null,
      witchAction: null,
      doctorTarget: null,
      acted: new Set(),
    };
    // Find first step that has an alive actor
    room.nightStep = null;
    for (const step of NIGHT_STEPS) {
      if (step === 'resolve') { /* handled by advanceNightStep */ break; }
      if (stepHasActor(room, step)) {
        room.nightStep = step;
        break;
      }
    }
    if (room.nightStep) {
      broadcastNightStatus(roomCode);
    } else {
      // No night actors alive — go straight to resolve
      advanceNightStep(roomCode);
    }
  }
}

// Manual phase advance — used by skip_phase unanimous vote and host triggers
function advancePhase(roomCode, expectedPhase) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== expectedPhase) return;

  if (expectedPhase === 'role_reveal') {
    emitPhase(roomCode, 'night');
    return;
  }

  if (expectedPhase === 'day') {
    emitPhase(roomCode, 'vote');
    return;
  }

  if (expectedPhase === 'vote') {
    const result = resolveVote(roomCode);
    broadcastRoom(roomCode);
    io.to(roomCode).emit('vote_result', result);
    if (result && result.isHunter) {
      room.phase = 'hunter_turn';
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

  // ── Night actions (sequential: doctor → wolves → witch → seer) ──

  socket.on('doctor_protect', ({ targetId }) => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room || room.phase !== 'night' || room.nightStep !== 'doctor') return;
    room.nightActions.doctorTarget = targetId;
    markNightActed(room, socket.id);
    broadcastNightStatus(info.roomCode);
    maybeAdvanceNightStep(info.roomCode);
  });

  socket.on('wolf_vote', ({ targetId }) => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room || room.phase !== 'night' || room.nightStep !== 'wolves') return;
    room.nightActions.wolfVotes[socket.id] = targetId;

    // Share votes among wolves only
    const wolves = room.players.filter((p) => p.role === 'wolf' && !p.isDead);
    wolves.forEach((w) => {
      io.to(w.id).emit('wolf_vote_update', { voterId: socket.id, targetId });
    });

    markNightActed(room, socket.id);
    broadcastNightStatus(info.roomCode);

    // If all wolves voted, notify witch of the victim before advancing
    if (isCurrentStepComplete(room)) {
      const leadingVictimId = computeLeadingVictim(room.nightActions.wolfVotes);
      const witch = room.players.find((p) => p.role === 'witch' && !p.isDead);
      if (witch) {
        io.to(witch.id).emit('wolf_victim_update', { victimId: leadingVictimId });
      }
    }

    maybeAdvanceNightStep(info.roomCode);
  });

  socket.on('witch_action', ({ action }) => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room || room.phase !== 'night' || room.nightStep !== 'witch') return;
    room.nightActions.witchAction = action;
    markNightActed(room, socket.id);
    broadcastNightStatus(info.roomCode);
    maybeAdvanceNightStep(info.roomCode);
  });

  socket.on('seer_reveal', ({ targetId }, callback = () => {}) => {
    const info = playerSockets.get(socket.id);
    if (!info) return callback({ success: false });
    const room = rooms.get(info.roomCode);
    if (!room || room.phase !== 'night' || room.nightStep !== 'seer') return callback({ success: false });
    const target = room.players.find((p) => p.id === targetId);
    if (!target) return callback({ success: false });
    callback({
      success: true,
      targetId,
      playerName: target.name,
      isWolf: target.role === 'wolf',
    });
    markNightActed(room, socket.id);
    broadcastNightStatus(info.roomCode);
    maybeAdvanceNightStep(info.roomCode);
  });

  // ── End night (manual host trigger — forces resolution) ──
  socket.on('end_night', () => {
    const info = playerSockets.get(socket.id);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room) return;
    if (room.hostId !== info.playerId) return;
    if (room.phase !== 'night') return;

    // Force jump to resolve
    room.nightStep = 'seer'; // set to last step so advanceNightStep goes to resolve
    advanceNightStep(info.roomCode);
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
      advancePhase(info.roomCode, room.phase);
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

    const result = resolveVote(info.roomCode);
    broadcastRoom(info.roomCode);
    io.to(info.roomCode).emit('vote_result', result);

    if (result && result.isHunter) {
      room.phase = 'hunter_turn';
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
