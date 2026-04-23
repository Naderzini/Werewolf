// Emoji pool for rendering players in action screens
const EMOJIS = ['🧑', '👩', '🧔', '🧑‍🦱', '👨', '👱‍♀️', '🧑‍🎓', '👩‍🦰', '🧑‍🦳', '👨‍🦲', '🧔‍♂️', '👩‍🦱'];

/**
 * Returns a list of real players from GameContext decorated with emoji/ui fields.
 *
 * @param {Array} players           state.players
 * @param {string} myId             state.playerId
 * @param {object} opts
 * @param {boolean} [opts.includeSelf=false]   include the current player
 * @param {boolean} [opts.includeDead=false]   include dead players
 * @param {(player) => boolean} [opts.extraFilter]  custom filter
 */
export function getActionPlayers(players, myId, opts = {}) {
  const { includeSelf = false, includeDead = false, extraFilter } = opts;
  const list = (players || []).filter((p) => {
    if (!includeSelf && p.id === myId) return false;
    if (!includeDead && p.isDead) return false;
    if (extraFilter && !extraFilter(p)) return false;
    return true;
  });
  return list.map((p, i) => ({
    ...p,
    emoji: p.isDead ? '💀' : EMOJIS[i % EMOJIS.length],
  }));
}
