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
  onWolfMessage,
  onSeerResult,
  onNightActionStatus,
  onPlayerAvatarUpdate,
  updateAvatar,
} from '../services/socketService';

function navTo(name) {
  if (navigationRef.isReady()) navigationRef.navigate(name);
}

// Map a player's role to the screen they should see during the night phase
// Map a night step to the screen a player should see if it's their turn
function screenForNightStep(step, role) {
  switch (step) {
    case 'doctor': return role === 'doctor' ? 'DoctorAction' : null;
    case 'wolves': return role === 'wolf'   ? 'WolfAction'   : null;
    case 'witch':  return role === 'witch'  ? 'WitchAction'  : null;
    case 'seer':   return role === 'seer'   ? 'SeerAction'   : null;
    default: return null;
  }
}

/**
 * Centralized game socket listener — mounted once for the whole app.
 * - Eagerly connects the socket so listeners are live from app start.
 * - Navigates players based on server phase + their role (real-game scenario).
 */
export default function useGameSocket() {
  const { state, updateRoom, setRole, setPhase, nightResults, gameOver, setSkip, setWolfVictim, setNightStatus, addWolfMessage, setSpeakingPlayer, setSeerResult, setGameRevealedPlayers, setAvatar, playerAvatar } = useGame();
  // Live refs so handlers registered once can read current values without stale closures
  const roleRef = useRef(state.myRole);
  roleRef.current = state.myRole;
  const isDeadRef = useRef(false);
  isDeadRef.current = !!(state.players || []).find((p) => p.id === state.playerId)?.isDead;

  useEffect(() => {
    // Eagerly establish the socket so listeners attach immediately
    connectSocket().catch((err) => console.log('[useGameSocket] initial connect failed', err?.message));

    const offRoom = onRoomUpdated((room) => {
      updateRoom(room);
      // Send avatar update if we have one set and it's not reflected in the room yet
      if (playerAvatar && state.playerId) {
        const currentPlayer = room.players?.find(p => p.id === state.playerId);
        if (!currentPlayer?.avatarUrl || currentPlayer.avatarUrl !== playerAvatar) {
          updateAvatar(playerAvatar);
        }
      }
    });
    const offRole = onRoleAssigned(({ role }) => {
      roleRef.current = role;
      setRole(role);
    });

    // Avatar updates from other players
    const offAvatarUpdate = onPlayerAvatarUpdate(({ playerId, avatar }) => {
      // Update the player in the players list with new avatar
      const updatedPlayers = state.players.map((p) => 
        p.id === playerId ? { ...p, avatarUrl: avatar } : p
      );
      updateRoom({ ...state, players: updatedPlayers });
    });

    const offPhase = onPhaseChanged(({ phase, duration, dayNumber }) => {
      setPhase(phase, duration, dayNumber);

      switch (phase) {
        case 'role_reveal':
          navTo('RoleReveal');
          break;
        case 'night':
          // Everyone goes to Night screen first; role-specific screens
          // are triggered by night_action_status when their step is active
          navTo('Night');
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

    const offGameOver = onGameOver(({ winner, players }) => {
      gameOver?.(winner);
      // Populate revealed players for GameResultScreen
      if (players && Array.isArray(players)) {
        setGameRevealedPlayers?.(players);
      }
      navTo('GameResult');
    });

    const offSkip = onSkipUpdate(({ skipCount, totalAlive }) => {
      setSkip?.({ skipCount, totalAlive });
    });

    const offWolfVictim = onWolfVictimUpdate(({ victimId }) => {
      setWolfVictim?.(victimId);
    });

    // Sequential night step updates — navigate the relevant role to their action screen
    // Wolf chat messages
    const offWolfMessage = onWolfMessage((message) => {
      addWolfMessage?.(message);
    });

    // Speaking player updates (for wolf chat)
    const offSpeakingUpdate = onWolfMessage((data) => {
      if (data.speakingPlayer) {
        setSpeakingPlayer?.(data.speakingPlayer);
      }
    });

    // Seer result (only sent to the seer)
    const offSeerResult = onSeerResult((result) => {
      setSeerResult?.(result);
    });

    const offNightStatus = onNightActionStatus((status) => {
      setNightStatus?.(status);
      if (isDeadRef.current) return; // dead players stay on Night screen
      const screen = screenForNightStep(status.nightStep, roleRef.current);
      if (screen) {
        navTo(screen);
      }
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
      offWolfMessage?.();
      offSpeakingUpdate?.();
      offSeerResult?.();
      offNightStatus?.();
      offAvatarUpdate?.();
    };
  }, []);
}
