export const ROLES = {
  WOLF: 'wolf',
  VILLAGER: 'villager',
  SEER: 'seer',
  WITCH: 'witch',
  DOCTOR: 'doctor',
  HUNTER: 'hunter',
};

export const TEAMS = {
  EVIL: 'evil',
  GOOD: 'good',
};

export const PHASES = {
  NIGHT: 'night',
  DAY: 'day',
  VOTE: 'vote',
  DEATH: 'death',
};

export const ROLE_CONFIG = {
  [ROLES.WOLF]: {
    team: TEAMS.EVIL,
    icon: '🐺',
    phases: [PHASES.NIGHT, PHASES.DAY],
    nightAction: true,
  },
  [ROLES.VILLAGER]: {
    team: TEAMS.GOOD,
    icon: '🧑‍🌾',
    phases: [PHASES.DAY],
    nightAction: false,
  },
  [ROLES.SEER]: {
    team: TEAMS.GOOD,
    icon: '🔮',
    phases: [PHASES.NIGHT, PHASES.DAY],
    nightAction: true,
  },
  [ROLES.WITCH]: {
    team: TEAMS.GOOD,
    icon: '🧙‍♂️',
    phases: [PHASES.NIGHT],
    nightAction: true,
  },
  [ROLES.DOCTOR]: {
    team: TEAMS.GOOD,
    icon: '🧑‍⚕️',
    phases: [PHASES.NIGHT],
    nightAction: true,
  },
  [ROLES.HUNTER]: {
    team: TEAMS.GOOD,
    icon: '🏹',
    phases: [PHASES.DEATH],
    nightAction: false,
  },
};

// Minimum & maximum players
export const MIN_PLAYERS = 6;
export const MAX_PLAYERS = 12;
export const EXTRA_WOLF_MIN_PLAYERS = 10;

// Role distribution based on player count. When extraWolf is true and
// players >= 10, one villager is converted into an extra wolf.
export const getRoleDistribution = (playerCount, extraWolf = false) => {
  if (playerCount < MIN_PLAYERS) return null;

  const distributions = {
    6:  { [ROLES.WOLF]: 1, [ROLES.VILLAGER]: 1, [ROLES.SEER]: 1, [ROLES.WITCH]: 1, [ROLES.DOCTOR]: 1, [ROLES.HUNTER]: 1 },
    7:  { [ROLES.WOLF]: 2, [ROLES.VILLAGER]: 1, [ROLES.SEER]: 1, [ROLES.WITCH]: 1, [ROLES.DOCTOR]: 1, [ROLES.HUNTER]: 1 },
    8:  { [ROLES.WOLF]: 2, [ROLES.VILLAGER]: 2, [ROLES.SEER]: 1, [ROLES.WITCH]: 1, [ROLES.DOCTOR]: 1, [ROLES.HUNTER]: 1 },
    9:  { [ROLES.WOLF]: 2, [ROLES.VILLAGER]: 3, [ROLES.SEER]: 1, [ROLES.WITCH]: 1, [ROLES.DOCTOR]: 1, [ROLES.HUNTER]: 1 },
    10: { [ROLES.WOLF]: 3, [ROLES.VILLAGER]: 3, [ROLES.SEER]: 1, [ROLES.WITCH]: 1, [ROLES.DOCTOR]: 1, [ROLES.HUNTER]: 1 },
    11: { [ROLES.WOLF]: 3, [ROLES.VILLAGER]: 4, [ROLES.SEER]: 1, [ROLES.WITCH]: 1, [ROLES.DOCTOR]: 1, [ROLES.HUNTER]: 1 },
    12: { [ROLES.WOLF]: 3, [ROLES.VILLAGER]: 5, [ROLES.SEER]: 1, [ROLES.WITCH]: 1, [ROLES.DOCTOR]: 1, [ROLES.HUNTER]: 1 },
  };

  const capped = Math.min(playerCount, MAX_PLAYERS);
  const counts = Object.keys(distributions).map(Number).sort((a, b) => a - b);
  let best = counts[0];
  for (const c of counts) {
    if (c <= capped) best = c;
  }

  const dist = { ...distributions[best] };
  if (extraWolf && playerCount >= EXTRA_WOLF_MIN_PLAYERS && dist[ROLES.VILLAGER] > 0) {
    dist[ROLES.VILLAGER] -= 1;
    dist[ROLES.WOLF] += 1;
  }
  return dist;
};
