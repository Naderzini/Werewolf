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
        label="🌙 Night duration"
        value={settings.nightDuration}
        min={15}
        max={300}
        step={15}
        disabled={!isHost}
        onChange={(v) => patch({ nightDuration: v })}
      />
      <Stepper
        label="☀️ Day duration"
        value={settings.dayDuration}
        min={30}
        max={600}
        step={30}
        disabled={!isHost}
        onChange={(v) => patch({ dayDuration: v })}
      />
      <Stepper
        label="🗳️ Vote duration"
        value={settings.voteDuration}
        min={15}
        max={180}
        step={15}
        disabled={!isHost}
        onChange={(v) => patch({ voteDuration: v })}
      />

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
  hostNote: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
