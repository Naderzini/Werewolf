require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── Game State Storage ──
const rooms = new Map();      // roomCode -> RoomState
const playerSockets = new Map(); // socketId -> { roomCode, playerId }

// ── Role Distribution ──
const ROLES = ['wolf', 'villager', 'seer', 'witch', 'doctor', 'hunter'];

function getRoleDistribution(count) {
  const dist = {
    6:  { wolf: 1, villager: 1, seer: 1, witch: 1, doctor: 1, hunter: 1 },
    7:  { wolf: 2, villager: 1, seer: 1, witch: 1, doctor: 1, hunter: 1 },
    8:  { wolf: 2, villager: 2, seer: 1, witch: 1, doctor: 1, hunter: 1 },
    9:  { wolf: 2, villager: 3, seer: 1, witch: 1, doctor: 1, hunter: 1 },
    10: { wolf: 3, villager: 3, seer: 1, witch: 1, doctor: 1, hunter: 1 },
    12: { wolf: 3, villager: 5, seer: 1, witch: 1, doctor: 1, hunter: 1 },
  };
  const keys = Object.keys(dist).map(Number).sort((a, b) => a - b);
  let best = keys[0];
  for (const k of keys) { if (k <= count) best = k; }
  return dist[best];
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRoomCode() {
  return 'WLF-' + Math.floor(10 + Math.random() * 90);
}

// ── Room Management ──
function createRoom(hostId, hostName) {
  const code = generateRoomCode();
  const room = {
    code,
    hostId,
    players: [{ id: hostId, name: hostName, isOnline: true, isHost: true, isDead: false, role: null }],
    gameStarted: false,
    phase: null,
    dayNumber: 0,
    nightActions: { wolfVotes: {}, seerTarget: null, witchAction: null, doctorTarget: null },
    witchSaveUsed: false,
    witchKillUsed: false,
    doctorLastTarget: null,
    deadPlayers: [],
    votes: {},
    timer: null,
  };
  rooms.set(code, room);
  return room;
}

function joinRoom(code, playerId, playerName) {
  const room = rooms.get(code);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.gameStarted) return { error: 'GAME_ALREADY_STARTED' };
  if (room.players.length >= 12) return { error: 'ROOM_FULL' };
  if (room.players.find(p => p.id === playerId)) return { error: 'ALREADY_IN_ROOM' };

  room.players.push({ id: playerId, name: playerName, isOnline: true, isHost: false, isDead: false, role: null });
  return { room };
}

function startGame(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.players.length < 6) return null;

  const dist = getRoleDistribution(room.players.length);
  const rolesList = [];
  for (const [role, count] of Object.entries(dist)) {
    for (let i = 0; i < count; i++) rolesList.push(role);
  }
  const shuffled = shuffleArray(rolesList);

  room.players.forEach((p, i) => { p.role = shuffled[i]; });
  room.gameStarted = true;
  room.phase = 'role_reveal';
  room.dayNumber = 1;

  return room;
}

// ── Night Resolution ──
function resolveNight(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const { wolfVotes, seerTarget, witchAction, doctorTarget } = room.nightActions;
  const results = [];

  // Count wolf votes
  const voteCounts = {};
  Object.values(wolfVotes).forEach(targetId => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });
  let wolfVictimId = null;
  let maxVotes = 0;
  for (const [id, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) { maxVotes = count; wolfVictimId = id; }
  }

  // Doctor protection
  const isProtected = wolfVictimId && doctorTarget === wolfVictimId;

  // Witch save
  const isSaved = wolfVictimId && witchAction?.type === 'save';
  if (isSaved) room.witchSaveUsed = true;

  // Wolf kill result
  if (wolfVictimId && !isProtected && !isSaved) {
    const victim = room.players.find(p => p.id === wolfVictimId);
    if (victim) {
      victim.isDead = true;
      room.deadPlayers.push(wolfVictimId);
      results.push({ playerId: wolfVictimId, event: 'killed_by_wolves', name: victim.name });
    }
  } else if (wolfVictimId && (isProtected || isSaved)) {
    results.push({ playerId: wolfVictimId, event: 'saved', name: room.players.find(p => p.id === wolfVictimId)?.name });
  }

  // Witch kill
  if (witchAction?.type === 'kill' && witchAction.targetId) {
    room.witchKillUsed = true;
    const target = room.players.find(p => p.id === witchAction.targetId);
    if (target && !target.isDead) {
      target.isDead = true;
      room.deadPlayers.push(witchAction.targetId);
      results.push({ playerId: witchAction.targetId, event: 'killed_by_witch', name: target.name });
    }
  }

  // Save doctor last target
  room.doctorLastTarget = doctorTarget;

  // Reset night actions
  room.nightActions = { wolfVotes: {}, seerTarget: null, witchAction: null, doctorTarget: null };

  return results;
}

// ── Win Condition Check ──
function checkWinCondition(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const alive = room.players.filter(p => !p.isDead);
  const wolves = alive.filter(p => p.role === 'wolf');
  const villagers = alive.filter(p => p.role !== 'wolf');

  if (wolves.length === 0) return 'village';
  if (wolves.length >= villagers.length) return 'wolves';
  return null;
}

// ── Vote Resolution ──
function resolveVote(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const voteCounts = {};
  Object.values(room.votes).forEach(targetId => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  let eliminated = null;
  let maxVotes = 0;
  for (const [id, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) { maxVotes = count; eliminated = id; }
  }

  if (eliminated) {
    const player = room.players.find(p => p.id === eliminated);
    if (player) {
      player.isDead = true;
      room.deadPlayers.push(eliminated);
      room.votes = {};
      return { eliminated: player, isHunter: player.role === 'hunter' };
    }
  }

  room.votes = {};
  return { eliminated: null };
}

// ── Socket.IO Events ──
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create room
  socket.on('create_room', ({ playerName }, callback) => {
    const playerId = socket.id;
    const room = createRoom(playerId, playerName);
    playerSockets.set(socket.id, { roomCode: room.code, playerId });
    socket.join(room.code);
    callback({ success: true, roomCode: room.code, playerId, players: room.players });
  });

  // Join room
  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    const playerId = socket.id;
    const result = joinRoom(roomCode, playerId, playerName);
    if (result.error) {
      callback({ success: false, error: result.error });
      return;
    }
    playerSockets.set(socket.id, { roomCode, playerId });
    socket.join(roomCode);
    io.to(roomCode).emit('players_updated', result.room.players);
    callback({ success: true, roomCode, playerId, players: result.room.players });
  });

  // Start game
  socket.on('start_game', ({ roomCode }, callback) => {
    const room = startGame(roomCode);
    if (!room) {
      callback({ success: false, error: 'CANNOT_START' });
      return;
    }
    // Send each player their role privately
    room.players.forEach(player => {
      const playerSocket = [...io.sockets.sockets.values()].find(s => s.id === player.id);
      if (playerSocket) {
        playerSocket.emit('role_assigned', { role: player.role });
      }
    });
    io.to(roomCode).emit('game_started', { dayNumber: room.dayNumber });
    callback({ success: true });
  });

  // Night actions
  socket.on('wolf_vote', ({ roomCode, targetId }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.nightActions.wolfVotes[socket.id] = targetId;
      // Notify other wolves
      const wolves = room.players.filter(p => p.role === 'wolf' && !p.isDead);
      wolves.forEach(wolf => {
        io.to(wolf.id).emit('wolf_vote_update', { voterId: socket.id, targetId });
      });
    }
  });

  socket.on('seer_reveal', ({ roomCode, targetId }, callback) => {
    const room = rooms.get(roomCode);
    if (room) {
      const target = room.players.find(p => p.id === targetId);
      if (target) {
        const isWolf = target.role === 'wolf';
        callback({ success: true, targetId, playerName: target.name, isWolf });
      }
    }
  });

  socket.on('witch_action', ({ roomCode, action }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.nightActions.witchAction = action; // { type: 'save'|'kill', targetId } or null
    }
  });

  socket.on('doctor_protect', ({ roomCode, targetId }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.nightActions.doctorTarget = targetId;
    }
  });

  // End night / resolve
  socket.on('end_night', ({ roomCode }) => {
    const results = resolveNight(roomCode);
    const room = rooms.get(roomCode);
    if (room && results) {
      room.phase = 'day';
      io.to(roomCode).emit('night_results', { results, deadPlayers: room.deadPlayers });
      
      const winner = checkWinCondition(roomCode);
      if (winner) {
        room.phase = 'game_over';
        io.to(roomCode).emit('game_over', { winner, players: room.players });
      } else {
        io.to(roomCode).emit('phase_changed', { phase: 'day', dayNumber: room.dayNumber });
      }
    }
  });

  // Day vote
  socket.on('cast_vote', ({ roomCode, targetId }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.votes[socket.id] = targetId;
      io.to(roomCode).emit('vote_update', { votes: room.votes });
    }
  });

  // End vote
  socket.on('end_vote', ({ roomCode }) => {
    const result = resolveVote(roomCode);
    const room = rooms.get(roomCode);
    if (room && result) {
      io.to(roomCode).emit('vote_result', result);
      
      if (result.isHunter) {
        io.to(result.eliminated.id).emit('hunter_turn');
      }

      const winner = checkWinCondition(roomCode);
      if (winner) {
        room.phase = 'game_over';
        io.to(roomCode).emit('game_over', { winner, players: room.players });
      } else if (!result.isHunter) {
        room.phase = 'night';
        room.dayNumber++;
        io.to(roomCode).emit('phase_changed', { phase: 'night', dayNumber: room.dayNumber });
      }
    }
  });

  // Hunter shot
  socket.on('hunter_shot', ({ roomCode, targetId }) => {
    const room = rooms.get(roomCode);
    if (room) {
      const target = room.players.find(p => p.id === targetId);
      if (target) {
        target.isDead = true;
        room.deadPlayers.push(targetId);
        io.to(roomCode).emit('hunter_result', { targetId, targetName: target.name });
        
        const winner = checkWinCondition(roomCode);
        if (winner) {
          room.phase = 'game_over';
          io.to(roomCode).emit('game_over', { winner, players: room.players });
        } else {
          room.phase = 'night';
          room.dayNumber++;
          io.to(roomCode).emit('phase_changed', { phase: 'night', dayNumber: room.dayNumber });
        }
      }
    }
  });

  // Voice signaling (WebRTC)
  socket.on('voice_offer', ({ roomCode, targetId, offer }) => {
    io.to(targetId).emit('voice_offer', { from: socket.id, offer });
  });

  socket.on('voice_answer', ({ targetId, answer }) => {
    io.to(targetId).emit('voice_answer', { from: socket.id, answer });
  });

  socket.on('ice_candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('ice_candidate', { from: socket.id, candidate });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const info = playerSockets.get(socket.id);
    if (info) {
      const room = rooms.get(info.roomCode);
      if (room) {
        const player = room.players.find(p => p.id === info.playerId);
        if (player) player.isOnline = false;
        io.to(info.roomCode).emit('players_updated', room.players);

        // Clean up empty rooms
        if (room.players.every(p => !p.isOnline)) {
          rooms.delete(info.roomCode);
        }
      }
      playerSockets.delete(socket.id);
    }
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// ── Health Check ──
app.get('/', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, players: playerSockets.size });
});

app.get('/rooms', (req, res) => {
  const list = [];
  rooms.forEach((room, code) => {
    list.push({ code, players: room.players.length, started: room.gameStarted });
  });
  res.json(list);
});

// ── Start Server ──
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🐺 Werewolf Server running on port ${PORT}`);
});
