import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS, ROLE_COLORS } from '../constants/theme';
import { ROLE_CONFIG, ROLES, TEAMS } from '../constants/roles';
import GradientButton from '../components/GradientButton';
import { useGame } from '../context/GameContext';

export default function RoleRevealScreen({ navigation }) {
  const { t } = useTranslation();
  const { state } = useGame();
  const role = state.myRole || ROLES.WOLF;
  const config = ROLE_CONFIG[role];
  const colors = ROLE_COLORS[role] || ROLE_COLORS.villager;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleUnderstood = () => {
    navigation.replace('Night');
  };

  const getRoleName = () => t(`roles.${role}`);
  const getRoleDesc = () => t(`roleDesc.${role}`);
  const isEvil = config.team === TEAMS.EVIL;

  return (
    <LinearGradient
      colors={[colors.bg, '#060310', COLORS.bg]}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Secret role label */}
        <Text style={styles.secretLabel}>🤫 {t('roles.yourRole')}</Text>

        {/* Role card */}
        <Animated.View style={[styles.roleCard, { 
          borderColor: colors.primary + '66',
          backgroundColor: colors.bg,
          transform: [{ scale: scaleAnim }],
        }]}>
          <Text style={styles.roleIcon}>{config.icon}</Text>
          <Text style={[styles.roleName, { color: colors.text }]}>{getRoleName()}</Text>
          <Text style={styles.roleDesc}>{getRoleDesc()}</Text>
        </Animated.View>

        {/* Team badge */}
        <View style={[styles.teamBadge, { 
          backgroundColor: isEvil ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
          borderColor: isEvil ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
        }]}>
          <Text style={[styles.teamText, { color: isEvil ? '#f87171' : '#4ade80' }]}>
            {isEvil ? t('roles.teamEvil') : t('roles.teamGood')}
          </Text>
        </View>

        {/* Abilities */}
        <View style={[styles.abilitiesBox, { borderColor: colors.primary + '33' }]}>
          <Text style={[styles.abilityTitle, { color: colors.text }]}>
            {role === ROLES.WOLF && `🌙 ${t('abilities.wolfHunt')}`}
            {role === ROLES.SEER && `👁️ ${t('abilities.seerVision')}`}
            {role === ROLES.WITCH && `💚 ${t('abilities.witchSave')} + 🖤 ${t('abilities.witchKill')}`}
            {role === ROLES.DOCTOR && `🛡️ ${t('abilities.docProtect')}`}
            {role === ROLES.HUNTER && `💀 ${t('abilities.hunterShot')}`}
            {role === ROLES.VILLAGER && `💬 ${t('abilities.wolfDisguise').replace('التمويه النهاري', t('roleDesc.villager').substring(0, 30))}`}
          </Text>
          <Text style={styles.abilityDesc}>
            {role === ROLES.WOLF && t('abilities.wolfHuntDesc')}
            {role === ROLES.SEER && t('abilities.seerVisionDesc')}
            {role === ROLES.WITCH && t('abilities.witchSaveDesc')}
            {role === ROLES.DOCTOR && t('abilities.docProtectDesc')}
            {role === ROLES.HUNTER && t('abilities.hunterShotDesc')}
            {role === ROLES.VILLAGER && t('abilities.wolfDisguiseDesc')}
          </Text>
        </View>

        {/* Phase pills */}
        <View style={styles.phases}>
          {config.phases.map((phase) => (
            <View key={phase} style={[styles.phasePill, 
              phase === 'night' && styles.pillNight,
              phase === 'day' && styles.pillDay,
              phase === 'death' && styles.pillDeath,
            ]}>
              <Text style={[styles.pillText,
                phase === 'night' && { color: '#a5b4fc' },
                phase === 'day' && { color: '#fde68a' },
                phase === 'death' && { color: '#fca5a5' },
              ]}>
                {phase === 'night' && '🌙 Night'}
                {phase === 'day' && '☀️ Day'}
                {phase === 'death' && '💀 Death'}
              </Text>
            </View>
          ))}
        </View>

        {/* Understood button */}
        <GradientButton
          title={`${t('roles.understood')} 🤫`}
          onPress={handleUnderstood}
          colors={[colors.primary, colors.primary + 'cc']}
          style={styles.understoodBtn}
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  secretLabel: {
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  roleCard: {
    width: 180,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
  },
  roleIcon: { fontSize: 56 },
  roleName: { fontSize: 22, fontWeight: '900' },
  roleDesc: { fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 18 },
  teamBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  teamText: { fontSize: 11, fontWeight: '700' },
  abilitiesBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  abilityTitle: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  abilityDesc: { fontSize: 11, color: '#888', lineHeight: 18 },
  phases: { flexDirection: 'row', gap: 8 },
  phasePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  pillNight: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' },
  pillDay: { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.3)' },
  pillDeath: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
  pillText: { fontSize: 11, fontWeight: '700' },
  understoodBtn: { width: 200, marginTop: 10 },
});
