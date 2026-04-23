import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import PhaseBanner from '../components/PhaseBanner';
import GradientButton from '../components/GradientButton';
import { useGame } from '../context/GameContext';
import { getActionPlayers } from '../utils/players';
import { sendDoctorProtect } from '../services/socketService';

export default function DoctorActionScreen({ navigation }) {
  const { t } = useTranslation();
  const { state, doctorProtect } = useGame();
  const [selected, setSelected] = useState(null);

  // Doctor can protect themselves but cannot target the same person two nights in a row
  const players = getActionPlayers(state.players, state.playerId, {
    includeSelf: true,
  }).map((p) => ({
    ...p,
    protectedLastNight: state.doctorLastTarget === p.id,
  }));

  const handleProtect = () => {
    if (!selected) return;
    sendDoctorProtect(selected);
    doctorProtect(selected);
    navigation.replace('Night');
  };

  const selectedPlayer = players.find((p) => p.id === selected);

  return (
    <LinearGradient colors={['#031a10', '#010805', COLORS.bg]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <PhaseBanner phase="night" label={t('night.docTurn')} icon="🧑‍⚕️" />

        <Text style={styles.label}>{t('night.whoToProtect')} 🛡️</Text>

        <View style={styles.list}>
          {players.map((player) => {
            const isDisabled = player.protectedLastNight;
            const isSelected = selected === player.id;

            return (
              <TouchableOpacity
                key={player.id}
                style={[
                  styles.row,
                  isSelected && styles.selectedRow,
                  isDisabled && styles.disabledRow,
                ]}
                onPress={() => !isDisabled && setSelected(player.id)}
                disabled={isDisabled}
              >
                <View style={[styles.avatar, isSelected && styles.selectedAvatar]}>
                  <Text style={styles.avatarEmoji}>{player.emoji}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={[
                    styles.name,
                    isSelected && { color: '#34d399' },
                    isDisabled && { color: '#555' },
                  ]}>
                    {player.name}
                  </Text>
                  {isSelected && (
                    <Text style={styles.selectedLabel}>✔ {t('common.confirm')}</Text>
                  )}
                  {isDisabled && (
                    <Text style={styles.disabledLabel}>{t('night.protectedLastNight')} ⛔</Text>
                  )}
                </View>
                {isSelected ? (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                ) : (
                  <Text style={styles.shieldIcon}>🛡️</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Confirmation bar */}
        {selectedPlayer && (
          <View style={styles.confirmBar}>
            <Text style={styles.confirmIcon}>🛡️</Text>
            <Text style={styles.confirmText}>
              {t('night.youWillProtect')} {selectedPlayer.name} {t('night.tonight')}
            </Text>
          </View>
        )}

        <GradientButton
          title={`💉 ${t('night.confirmProtect')}`}
          onPress={handleProtect}
          colors={['#059669', '#047857']}
          style={styles.btn}
          disabled={!selected}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  scroll: { padding: 16, gap: 16 },
  label: { fontSize: 12, color: '#888', textAlign: 'center' },
  list: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#0a1a0e',
    borderWidth: 1,
    borderColor: '#1a3a22',
    borderRadius: 12,
  },
  selectedRow: {
    backgroundColor: '#062a1a',
    borderColor: '#059669',
    borderWidth: 2,
    shadowColor: '#059669',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  disabledRow: { opacity: 0.5 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a3a22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAvatar: {
    backgroundColor: '#1a4a2a',
    borderWidth: 2,
    borderColor: '#059669',
  },
  avatarEmoji: { fontSize: 20 },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  selectedLabel: { fontSize: 10, color: '#059669', marginTop: 2 },
  disabledLabel: { fontSize: 10, color: '#059669', marginTop: 2 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 14, color: '#fff' },
  shieldIcon: { fontSize: 18 },
  confirmBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#062a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5,150,105,0.3)',
  },
  confirmIcon: { fontSize: 20 },
  confirmText: { fontSize: 12, color: '#34d399' },
  btn: { width: '100%' },
});
