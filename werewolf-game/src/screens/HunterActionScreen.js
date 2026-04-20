import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import GradientButton from '../components/GradientButton';
import { useGame } from '../context/GameContext';

const ALIVE_PLAYERS = [
  { id: 'p3', name: 'كريم', emoji: '🧔' },
  { id: 'p2', name: 'سارة', emoji: '👩' },
  { id: 'p1', name: 'أحمد', emoji: '🧑' },
  { id: 'p6', name: 'نور', emoji: '👩‍🦰' },
];

export default function HunterActionScreen({ navigation }) {
  const { t } = useTranslation();
  const { hunterTarget } = useGame();
  const [selected, setSelected] = useState(null);

  const selectedPlayer = ALIVE_PLAYERS.find((p) => p.id === selected);

  const handleShoot = () => {
    if (!selected) return;
    hunterTarget(selected);
    navigation.replace('GameResult');
  };

  return (
    <LinearGradient colors={['#1a0800', '#060200', COLORS.bg]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Death banner */}
        <View style={styles.deathBanner}>
          <Text style={styles.deathTitle}>💀 {t('hunter.youDied')}</Text>
          <Text style={styles.deathSub}>{t('hunter.lastShot')}</Text>
        </View>

        <Text style={styles.label}>🏹 {t('hunter.whoToTake')}</Text>

        {/* Player list */}
        <View style={styles.list}>
          {ALIVE_PLAYERS.map((player) => {
            const isSelected = selected === player.id;
            return (
              <TouchableOpacity
                key={player.id}
                style={[styles.row, isSelected && styles.selectedRow]}
                onPress={() => setSelected(player.id)}
              >
                <Text style={styles.emoji}>{player.emoji}</Text>
                <Text style={[styles.name, isSelected && { color: '#fb923c' }]}>
                  {player.name}
                  {isSelected && ` — ${t('hunter.yourTarget')} 🎯`}
                </Text>
                <Text style={styles.icon}>{isSelected ? '🎯' : '🏹'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Confirm target */}
        {selectedPlayer && (
          <View style={styles.confirmBar}>
            <Text style={styles.confirmIcon}>🏹</Text>
            <Text style={styles.confirmText}>
              {t('hunter.willHit')} {selectedPlayer.name}!
            </Text>
          </View>
        )}

        <GradientButton
          title={`🏹 ${t('hunter.fireShot')}`}
          onPress={handleShoot}
          colors={['#ea580c', '#c2410c']}
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
  deathBanner: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#1a0800',
    borderWidth: 1,
    borderColor: 'rgba(234,88,12,0.3)',
    alignItems: 'center',
    gap: 4,
  },
  deathTitle: { fontSize: 16, fontWeight: '900', color: '#fb923c' },
  deathSub: { fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '700', color: '#fb923c', textAlign: 'center' },
  list: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#1a0a00',
    borderWidth: 1,
    borderColor: '#2a1400',
    borderRadius: 10,
  },
  selectedRow: {
    borderColor: '#ea580c',
    borderWidth: 2,
    backgroundColor: '#2a1000',
  },
  emoji: { fontSize: 20 },
  name: { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.text },
  icon: { fontSize: 16 },
  confirmBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#2a1000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(234,88,12,0.3)',
  },
  confirmIcon: { fontSize: 20 },
  confirmText: { fontSize: 12, color: '#fb923c' },
  btn: { width: '100%' },
});
