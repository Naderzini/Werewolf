import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { COLORS } from '../constants/theme';
import { EXTRA_WOLF_MIN_PLAYERS } from '../constants/roles';

// Compact stepper used for timers
function Stepper({ label, value, min, max, step, onChange, unit = 's', disabled }) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperCtrl}>
        <TouchableOpacity
          style={[styles.stepBtn, disabled && styles.btnDisabled]}
          onPress={dec}
          disabled={disabled || value <= min}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>
          {value}
          {unit}
        </Text>
        <TouchableOpacity
          style={[styles.stepBtn, disabled && styles.btnDisabled]}
          onPress={inc}
          disabled={disabled || value >= max}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Host-only settings panel. For non-hosts we show a read-only summary.
 */
export default function SettingsPanel({
  settings,
  playerCount,
  isHost,
  onChange,
}) {
  const patch = (partial) => {
    if (!isHost) return;
    onChange(partial);
  };

  const extraWolfEligible = playerCount >= EXTRA_WOLF_MIN_PLAYERS;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚙️ Game Settings</Text>

      <Stepper
        label="⏱️ Optional timer (seconds)"
        value={settings.extraTime || 0}
        min={0}
        max={300}
        step={15}
        unit={settings.extraTime === 0 ? 's (disabled)' : 's'}
        disabled={!isHost}
        onChange={(v) => patch({ extraTime: v })}
      />

      <View style={styles.helperRow}>
        <Text style={styles.helperText}>
          {settings.extraTime === 0 
            ? '⚡ No timers — phases advance only when all players have acted'
            : '⏱️ Optional countdown hint shown in UI (not enforced)'}
        </Text>
      </View>

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepperLabel}>🐺 Extra wolf (+1)</Text>
          <Text style={styles.helper}>
            Available when players ≥ {EXTRA_WOLF_MIN_PLAYERS}
          </Text>
        </View>
        <Switch
          value={!!settings.extraWolf && extraWolfEligible}
          onValueChange={(v) => patch({ extraWolf: v })}
          disabled={!isHost || !extraWolfEligible}
          trackColor={{ true: '#7c3aed', false: '#333' }}
          thumbColor={settings.extraWolf ? '#fff' : '#888'}
        />
      </View>

      {!isHost && (
        <Text style={styles.hostNote}>Only the host can edit these settings.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161625',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.moon,
    marginBottom: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  stepperCtrl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#2a2a45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  stepBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  stepperValue: {
    color: COLORS.moon,
    fontWeight: '700',
    width: 48,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  helper: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  helperRow: { marginTop: 8 },
  helperText: { color: COLORS.muted, fontSize: 11, lineHeight: 14 },
  hostNote: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
