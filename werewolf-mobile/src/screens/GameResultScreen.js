import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS, ROLE_COLORS } from '../constants/theme';
import { ROLE_CONFIG } from '../constants/roles';
import GradientButton from '../components/GradientButton';
import { useGame } from '../context/GameContext';

const REVEALED_ROLES = [
  { id: 'p1', name: 'أحمد', role: 'wolf', isDead: true },
  { id: 'p2', name: 'سارة', role: 'seer', isDead: false },
  { id: 'p3', name: 'كريم', role: 'wolf', isDead: true },
  { id: 'p4', name: 'لينا', role: 'villager', isDead: true },
  { id: 'p5', name: 'يوسف', role: 'doctor', isDead: false },
  { id: 'me', name: 'أنت', role: 'witch', isDead: false },
];

export default function GameResultScreen({ navigation }) {
  const { t } = useTranslation();
  const { state, resetGame } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  const winner = state.winner || 'village';
  const isWolfWin = winner === 'wolves';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePlayAgain = () => {
    resetGame();
    navigation.popToTop();
  };

  return (
    <LinearGradient
      colors={isWolfWin ? ['#1a0505', '#0a0202', COLORS.bg] : ['#051a0d', '#010805', COLORS.bg]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Winner announcement */}
        <Animated.View style={[styles.winnerBox, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.winnerIcon}>{isWolfWin ? '🐺' : '🧑‍🌾'}</Text>
          <Text style={[styles.winnerText, { color: isWolfWin ? '#f87171' : '#4ade80' }]}>
            {isWolfWin ? t('result.wolfWin') : t('result.villageWin')}
          </Text>
          <Text style={styles.trophy}>🏆</Text>
        </Animated.View>

        {/* Roles revealed */}
        <Text style={styles.revealTitle}>🃏 {t('result.rolesRevealed')}</Text>

        <View style={styles.rolesList}>
          {REVEALED_ROLES.map((player) => {
            const config = ROLE_CONFIG[player.role];
            const colors = ROLE_COLORS[player.role] || ROLE_COLORS.villager;
            return (
              <View
                key={player.id}
                style={[
                  styles.roleRow,
                  { borderColor: colors.primary + '44', backgroundColor: colors.bg },
                  player.isDead && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.roleEmoji}>{config.icon}</Text>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleName, { color: colors.text }]}>{player.name}</Text>
                  <Text style={[styles.roleLabel, { color: colors.text + 'aa' }]}>
                    {t(`roles.${player.role}`)}
                  </Text>
                </View>
                {player.isDead && <Text style={styles.deadIcon}>💀</Text>}
                {!player.isDead && <Text style={styles.aliveIcon}>✅</Text>}
              </View>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <GradientButton
            title={`🎮 ${t('result.playAgain')}`}
            onPress={handlePlayAgain}
            colors={['#7c3aed', '#4f46e5']}
            style={styles.btn}
          />
          <GradientButton
            title={`🏠 ${t('result.backToHome')}`}
            onPress={handlePlayAgain}
            colors={['#7c3aed', '#4f46e5']}
            outline
            style={styles.btn}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  scroll: { padding: 16, gap: 20, alignItems: 'center' },
  winnerBox: { alignItems: 'center', gap: 8, marginVertical: 10 },
  winnerIcon: { fontSize: 60 },
  winnerText: { fontSize: 28, fontWeight: '900' },
  trophy: { fontSize: 40 },
  revealTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  rolesList: { width: '100%', gap: 8 },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  roleEmoji: { fontSize: 28 },
  roleInfo: { flex: 1 },
  roleName: { fontSize: 14, fontWeight: '700' },
  roleLabel: { fontSize: 11, marginTop: 2 },
  deadIcon: { fontSize: 18 },
  aliveIcon: { fontSize: 18 },
  actions: { width: '100%', gap: 10, marginTop: 10 },
  btn: { width: '100%' },
});
