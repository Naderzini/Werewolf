import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import PhaseBanner from '../components/PhaseBanner';
import GradientButton from '../components/GradientButton';
import { useGame } from '../context/GameContext';
import { getActionPlayers } from '../utils/players';
import { sendSeerReveal } from '../services/socketService';

export default function SeerActionScreen({ navigation }) {
  const { t } = useTranslation();
  const { state, seerReveal } = useGame();
  const [selected, setSelected] = useState(null);

  // Track who we've already checked using seerResults from context
  const checkedIds = new Set((state.seerResults || []).map((r) => r.playerId));

  const players = getActionPlayers(state.players, state.playerId, {
    includeSelf: false,
  }).map((p) => {
    const res = (state.seerResults || []).find((r) => r.playerId === p.id);
    return {
      ...p,
      checked: checkedIds.has(p.id),
      isVillager: res ? !res.isWolf : undefined,
    };
  });

  const handleReveal = async () => {
    if (!selected) return;
    try {
      const res = await sendSeerReveal(selected);
      seerReveal(res.targetId, res.playerName, res.isWolf);
      navigation.replace('SeerResult', { targetName: res.playerName, isWolf: res.isWolf });
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not reveal');
    }
  };

  return (
    <LinearGradient colors={['#1a1400', '#060500', COLORS.bg]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <PhaseBanner phase="night" label={t('night.seerTurn')} icon="🔮" />

        {/* Crystal ball */}
        <Text style={styles.crystal}>🔮</Text>

        {/* Choose player */}
        <Text style={styles.label}>{t('night.whoToReveal')}</Text>

        <View style={styles.list}>
          {players.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerRow,
                selected === player.id && styles.selectedRow,
                player.checked && styles.checkedRow,
              ]}
              onPress={() => !player.checked && setSelected(player.id)}
              disabled={player.checked}
            >
              <Text style={styles.emoji}>{player.emoji}</Text>
              <View style={styles.info}>
                <Text style={[
                  styles.name,
                  selected === player.id && { color: '#fbbf24' },
                  player.checked && player.isVillager && { color: '#4ade80' },
                ]}>
                  {player.name}
                </Text>
              </View>
              {selected === player.id && <Text style={styles.icon}>🔮</Text>}
              {player.checked && (
                <View style={styles.checkedBadge}>
                  <Text style={styles.checkedText}>✓ {player.isVillager ? t('seerResult.isVillager') : t('seerResult.isWolf')}</Text>
                </View>
              )}
              {!player.checked && selected !== player.id && <Text style={styles.icon}>👁️</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <GradientButton
          title={`👁️ ${t('night.revealIdentity')}`}
          onPress={handleReveal}
          colors={['#d97706', '#b45309']}
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
  crystal: {
    fontSize: 60,
    textAlign: 'center',
    textShadowColor: 'rgba(217,119,6,0.5)',
    textShadowRadius: 20,
  },
  label: {
    fontSize: 12,
    color: '#d97706',
    textAlign: 'center',
  },
  list: { gap: 6 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#1a1400',
    borderWidth: 1,
    borderColor: '#2a2200',
    borderRadius: 10,
  },
  selectedRow: {
    backgroundColor: '#2a1e00',
    borderColor: '#d97706',
    borderWidth: 2,
  },
  checkedRow: {
    backgroundColor: '#001a00',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  icon: { fontSize: 16 },
  checkedBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  checkedText: { fontSize: 10, color: '#22c55e' },
  btn: { width: '100%' },
});
