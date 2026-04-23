const {
  MIN_PLAYERS,
  MAX_PLAYERS,
  getRoleDistribution,
  expandRolesToList,
  shuffleArray,
} = require('./roles');

// Default game settings (timers in seconds). Host can override these before start.
const DEFAULT_SETTINGS = {
  nightDuration: 60,      // duration of the night voice phase
  dayDuration: 120,       // duration of the day discussion
  voteDuration: 45,       // duration of the vote
  roleRevealDuration: 10, // how long each player sees their role
  extraWolf: false,       // +1 wolf when players >= 10
};

// Active rooms storage
const rooms = new Map();           // roomCode -> RoomState
const playerSockets = new Map();   // socketId -> { roomCode, playerId }

function generateRoomCode() {
  // Ensure uniqueness by retrying if the code already exists
  for (let attempt = 0; attempt < 50; attempt++) {
    const code = 'WLF-' + Math.floor(100 + Math.random() * 900);
    if (!rooms.has(code)) return code;
  }
  // Fallback: timestamp-based
  return 'WLF-' + Date.now().toString().slice(-5);
}

function buildPlayer({ id, name, isHost = false }) {
  return {
    id,
    name: (name || 'Player').slice(0, 20),
    isOnline: true,
    isHost,
    isDead: false,
    role: null,
  };
}

function createRoom(hostId, hostName) {
  const code = generateRoomCode();
  const room = {
    code,
    hostId,
    players: [buildPlayer({ id: hostId, name: hostName, isHost: true })],
    gameStarted: false,
    phase: 'lobby',
    dayNumber: 0,
    settings: { ...DEFAULT_SETTINGS },
    nightActions: {
      wolfVotes: {},
      seerTarget: null,
      witchAction: null,
      doctorTarget: null,
    },
    witchSaveUsed: false,
    witchKillUsed: false,
    doctorLastTarget: null,
    deadPlayers: [],
    votes: {},
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

function joinRoom(code, playerId, playerName) {
  const room = rooms.get(code);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.gameStarted) return { error: 'GAME_ALREADY_STARTED' };
  if (room.players.length >= MAX_PLAYERS) return { error: 'ROOM_FULL' };

  // If a player with this id is reconnecting (rare with socket.id), allow it.
  const existing = room.players.find((p) => p.id === playerId);
  if (existing) {
    existing.isOnline = true;
    return { room };
  }

  room.players.push(buildPlayer({ id: playerId, name: playerName, isHost: false }));
  return { room };
}

function leaveRoom(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  if (!room.gameStarted) {
    // Remove entirely while in lobby
    room.players = room.players.filter((p) => p.id !== playerId);
    if (room.hostId === playerId && room.players.length > 0) {
      // Transfer host to the next player
      room.players[0].isHost = true;
      room.hostId = room.players[0].id;
    }
  } else {
    // In-game: keep slot but mark offline
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.isOnline = false;
  }

  // Clean up empty rooms
  if (room.players.length === 0 || room.players.every((p) => !p.isOnline)) {
    rooms.delete(roomCode);
    return { deleted: true };
  }
  return { room };
}

function updateSettings(roomCode, playerId, partial) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.hostId !== playerId) return { error: 'NOT_HOST' };
  if (room.gameStarted) return { error: 'GAME_ALREADY_STARTED' };

  const next = { ...room.settings };
  if (typeof partial.nightDuration === 'number') {
    next.nightDuration = Math.max(15, Math.min(600, partial.nightDuration));
  }
  if (typeof partial.dayDuration === 'number') {
    next.dayDuration = Math.max(30, Math.min(600, partial.dayDuration));
  }
  if (typeof partial.voteDuration === 'number') {
    next.voteDuration = Math.max(15, Math.min(300, partial.voteDuration));
  }
  if (typeof partial.roleRevealDuration === 'number') {
    next.roleRevealDuration = Math.max(5, Math.min(60, partial.roleRevealDuration));
  }
  if (typeof partial.extraWolf === 'boolean') {
    next.extraWolf = partial.extraWolf;
  }
  room.settings = next;
  return { room };
}

function startGame(roomCode, hostId) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.hostId !== hostId) return { error: 'NOT_HOST' };
  if (room.gameStarted) return { error: 'ALREADY_STARTED' };
  if (room.players.length < MIN_PLAYERS) return { error: 'NOT_ENOUGH_PLAYERS' };

  const dist = getRoleDistribution(room.players.length, room.settings.extraWolf);
  if (!dist) return { error: 'INVALID_DISTRIBUTION' };

  const rolesList = expandRolesToList(dist);
  const shuffled = shuffleArray(rolesList);

  room.players.forEach((p, i) => {
    p.role = shuffled[i] || 'villager';
  });

  room.gameStarted = true;
  room.phase = 'role_reveal';
  room.dayNumber = 1;

  return { room, distribution: dist };
}

function resolveNight(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const { wolfVotes, witchAction, doctorTarget } = room.nightActions;
  const results = [];

  // Count wolf votes
  const voteCounts = {};
  Object.values(wolfVotes).forEach((targetId) => {
    if (targetId) voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });
  let wolfVictimId = null;
  let maxVotes = 0;
  for (const [id, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      wolfVictimId = id;
    }
  }

  const isProtected = wolfVictimId && doctorTarget === wolfVictimId;
  const isSaved = wolfVictimId && witchAction?.type === 'save';
  if (isSaved) room.witchSaveUsed = true;

  if (wolfVictimId && !isProtected && !isSaved) {
    const victim = room.players.find((p) => p.id === wolfVictimId);
    if (victim && !victim.isDead) {
      victim.isDead = true;
      room.deadPlayers.push(wolfVictimId);
      results.push({ playerId: wolfVictimId, event: 'killed_by_wolves', name: victim.name, role: victim.role });
    }
  } else if (wolfVictimId) {
    const target = room.players.find((p) => p.id === wolfVictimId);
    results.push({ playerId: wolfVictimId, event: 'saved', name: target?.name });
  }

  if (witchAction?.type === 'kill' && witchAction.targetId) {
    room.witchKillUsed = true;
    const target = room.players.find((p) => p.id === witchAction.targetId);
    if (target && !target.isDead) {
      target.isDead = true;
      room.deadPlayers.push(witchAction.targetId);
      results.push({ playerId: witchAction.targetId, event: 'killed_by_witch', name: target.name, role: target.role });
    }
  }

  room.doctorLastTarget = doctorTarget;
  room.nightActions = { wolfVotes: {}, seerTarget: null, witchAction: null, doctorTarget: null };

  return results;
}

function resolveVote(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const voteCounts = {};
  Object.values(room.votes).forEach((targetId) => {
    if (targetId) voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  let eliminated = null;
  let maxVotes = 0;
  for (const [id, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = id;
    }
  }

  room.votes = {};
  if (eliminated) {
    const player = room.players.find((p) => p.id === eliminated);
    if (player && !player.isDead) {
      player.isDead = true;
      room.deadPlayers.push(eliminated);
      return {
        eliminated: { id: player.id, name: player.name, role: player.role },
        isHunter: player.role === 'hunter',
      };
    }
  }
  return { eliminated: null };
}

function checkWinCondition(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  const alive = room.players.filter((p) => !p.isDead);
  const wolves = alive.filter((p) => p.role === 'wolf');
  const villagers = alive.filter((p) => p.role !== 'wolf');
  if (wolves.length === 0) return 'village';
  if (wolves.length >= villagers.length) return 'wolves';
  return null;
}

function getPublicRoom(room) {
  // Strip role info for public state
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    dayNumber: room.dayNumber,
    gameStarted: room.gameStarted,
    settings: room.settings,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isOnline: p.isOnline,
      isHost: p.isHost,
      isDead: p.isDead,
      // Reveal role only after death (like the real-game narrator)
      role: p.isDead ? p.role : undefined,
    })),
  };
}

module.exports = {
  rooms,
  playerSockets,
  DEFAULT_SETTINGS,
  createRoom,
  joinRoom,
  leaveRoom,
  updateSettings,
  startGame,
  resolveNight,
  resolveVote,
  checkWinCondition,
  getPublicRoom,
};
