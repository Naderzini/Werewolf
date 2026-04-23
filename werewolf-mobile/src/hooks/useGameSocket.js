import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { navigationRef } from '../navigation/AppNavigator';
import { ROLES } from '../constants/roles';
import {
  connectSocket,
  onRoomUpdated,
  onRoleAssigned,
  onPhaseChanged,
  onNightResults,
  onVoteResult,
  onGameOver,
  onHunterTurn,
  onHunterResult,
  onSkipUpdate,
  onWolfVictimUpdate,
} from '../services/socketService';

function navTo(name) {
  if (navigationRef.isReady()) navigationRef.navigate(name);
}

// Map a player's role to the screen they should see during the night phase
function nightScreenForRole(role) {
  switch (role) {
    case ROLES.WOLF:   return 'WolfAction';
    case ROLES.SEER:   return 'SeerAction';
    case ROLES.WITCH:  return 'WitchAction';
    case ROLES.DOCTOR: return 'DoctorAction';
    // Villager and Hunter just watch the night phase
    default:           return 'Night';
  }
}

/**
 * Centralized game socket listener — mounted once for the whole app.
 * - Eagerly connects the socket so listeners are live from app start.
 * - Navigates players based on server phase + their role (real-game scenario).
 */
export default function useGameSocket() {
  const { state, updateRoom, setRole, setPhase, nightResults, gameOver, setSkip, setWolfVictim } = useGame();
  // Live refs so handlers registered once can read current values without stale closures
  const roleRef = useRef(state.myRole);
  roleRef.current = state.myRole;
  const isDeadRef = useRef(false);
  isDeadRef.current = !!(state.players || []).find((p) => p.id === state.playerId)?.isDead;

  useEffect(() => {
    // Eagerly establish the socket so listeners attach immediately
    connectSocket().catch((err) => console.log('[useGameSocket] initial connect failed', err?.message));

    const offRoom = onRoomUpdated((room) => updateRoom(room));
    const offRole = onRoleAssigned(({ role }) => {
      roleRef.current = role;
      setRole(role);
    });

    const offPhase = onPhaseChanged(({ phase, duration, dayNumber }) => {
      setPhase(phase, duration, dayNumber);

      switch (phase) {
        case 'role_reveal':
          navTo('RoleReveal');
          break;
        case 'night':
          // Dead players can never act at night — always watch from Night screen
          navTo(isDeadRef.current ? 'Night' : nightScreenForRole(roleRef.current));
          break;
        case 'day':
          navTo('Day');
          break;
        case 'vote':
          navTo('Vote');
          break;
        case 'game_over':
          navTo('GameResult');
          break;
      }
    });

    const offNightResults = onNightResults(({ results, deadPlayers }) => {
      nightResults?.(results || [], deadPlayers || []);
    });

    const offVoteResult = onVoteResult(() => {});
    const offHunterTurn = onHunterTurn(() => navTo('HunterAction'));
    const offHunterResult = onHunterResult(() => {});

    const offGameOver = onGameOver(({ winner }) => {
      gameOver?.(winner);
      navTo('GameResult');
    });

    const offSkip = onSkipUpdate(({ skipCount, totalAlive }) => {
      setSkip?.({ skipCount, totalAlive });
    });

    const offWolfVictim = onWolfVictimUpdate(({ victimId }) => {
      setWolfVictim?.(victimId);
    });

    return () => {
      offRoom?.();
      offRole?.();
      offPhase?.();
      offNightResults?.();
      offVoteResult?.();
      offHunterTurn?.();
      offHunterResult?.();
      offGameOver?.();
      offSkip?.();
      offWolfVictim?.();
    };
  }, []);
}
