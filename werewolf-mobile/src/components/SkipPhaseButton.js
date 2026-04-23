import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { useGame } from '../context/GameContext';
import { sendSkipPhase } from '../services/socketService';

/**
 * "Ready / Skip" button used on waiting-style screens (RoleReveal, Night for villagers,
 * Day, Vote). Players vote to skip the current phase; when all alive players have
 * pressed it, the server advances the phase immediately.
 */
export default function SkipPhaseButton({ label = 'Ready ⏭' }) {
  const { state, markSkipped } = useGame();
  const { iSkipped, skipCount, skipTotal } = state;

  const handlePress = () => {
    if (iSkipped) return;
    sendSkipPhase();
    markSkipped();
  };

  const total = skipTotal || (state.players || []).filter((p) => !p.isDead && p.isOnline).length || 0;
  const count = skipCount || 0;

  return (
    <TouchableOpacity
      style={[styles.btn, iSkipped && styles.btnDone]}
      onPress={handlePress}
      disabled={iSkipped}
      activeOpacity={0.75}
    >
      <Text style={[styles.text, iSkipped && styles.textDone]}>
        {iSkipped ? '✅ ' : '⏭ '}
        {iSkipped ? 'Waiting for others' : label}
        {total > 0 ? `  (${count}/${total})` : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#7c3aed',
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnDone: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  text: { color: '#c4b5fd', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  textDone: { color: '#4ade80' },
});
