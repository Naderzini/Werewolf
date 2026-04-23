// ── Role distribution logic ──
// Base distribution based on player count.
// When `extraWolf` is true AND players >= 10, we add one additional wolf
// by converting one villager into a wolf. This is the "+1 wolf" option.

const BASE_DISTRIBUTION = {
  6:  { wolf: 1, villager: 1, seer: 1, witch: 1, doctor: 1, hunter: 1 },
  7:  { wolf: 2, villager: 1, seer: 1, witch: 1, doctor: 1, hunter: 1 },
  8:  { wolf: 2, villager: 2, seer: 1, witch: 1, doctor: 1, hunter: 1 },
  9:  { wolf: 2, villager: 3, seer: 1, witch: 1, doctor: 1, hunter: 1 },
  10: { wolf: 3, villager: 3, seer: 1, witch: 1, doctor: 1, hunter: 1 },
  11: { wolf: 3, villager: 4, seer: 1, witch: 1, doctor: 1, hunter: 1 },
  12: { wolf: 3, villager: 5, seer: 1, witch: 1, doctor: 1, hunter: 1 },
};

const MIN_PLAYERS = 6;
const MAX_PLAYERS = 12;
const EXTRA_WOLF_MIN_PLAYERS = 10;

function getRoleDistribution(count, extraWolf = false) {
  if (count < MIN_PLAYERS) return null;
  const capped = Math.min(count, MAX_PLAYERS);

  // Find the closest distribution key that is <= capped
  const keys = Object.keys(BASE_DISTRIBUTION).map(Number).sort((a, b) => a - b);
  let bestKey = keys[0];
  for (const k of keys) {
    if (k <= capped) bestKey = k;
  }

  const dist = { ...BASE_DISTRIBUTION[bestKey] };

  // Apply extra wolf option if eligible
  if (extraWolf && count >= EXTRA_WOLF_MIN_PLAYERS && dist.villager > 0) {
    dist.villager -= 1;
    dist.wolf += 1;
  }

  return dist;
}

function expandRolesToList(distribution) {
  const list = [];
  for (const [role, count] of Object.entries(distribution)) {
    for (let i = 0; i < count; i++) list.push(role);
  }
  return list;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = {
  MIN_PLAYERS,
  MAX_PLAYERS,
  EXTRA_WOLF_MIN_PLAYERS,
  BASE_DISTRIBUTION,
  getRoleDistribution,
  expandRolesToList,
  shuffleArray,
};
