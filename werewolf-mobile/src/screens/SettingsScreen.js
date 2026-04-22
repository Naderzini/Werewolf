import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import { LANGUAGES, isRTL } from '../i18n';

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <LinearGradient colors={['#1a0a2e', '#0a0510', COLORS.bg]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>⚙️ {t('home.settings')}</Text>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 {t('home.language')}</Text>
          <View style={styles.langList}>
            {LANGUAGES.map((lang) => {
              const isActive = currentLang === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langRow, isActive && styles.langActive]}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langLabel, isActive && { color: COLORS.moon }]}>
                    {lang.label}
                  </Text>
                  {isActive && (
                    <View style={styles.activeDot}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ {t('app.title')}</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutIcon}>🐺</Text>
            <Text style={styles.aboutTitle}>{t('app.title')}</Text>
            <Text style={styles.aboutSub}>{t('app.subtitle')}</Text>
            <Text style={styles.version}>v1.0.0</Text>
            <View style={styles.tags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>🎙️ Voice Chat</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>🔴 Online</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>6-12 Players</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Roles info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🃏 {t('app.title')}</Text>
          <View style={styles.rolesGrid}>
            {[
              { icon: '🐺', name: t('roles.wolf'), color: '#f87171' },
              { icon: '🧑‍🌾', name: t('roles.villager'), color: '#4ade80' },
              { icon: '🔮', name: t('roles.seer'), color: '#fbbf24' },
              { icon: '🧙‍♂️', name: t('roles.witch'), color: '#c4b5fd' },
              { icon: '🧑‍⚕️', name: t('roles.doctor'), color: '#6ee7b7' },
              { icon: '🏹', name: t('roles.hunter'), color: '#fb923c' },
            ].map((role, i) => (
              <View key={i} style={styles.roleChip}>
                <Text style={styles.roleIcon}>{role.icon}</Text>
                <Text style={[styles.roleName, { color: role.color }]}>{role.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 50, gap: 24 },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: COLORS.muted, fontSize: 14 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  section: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.muted },
  langList: { gap: 6 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langActive: {
    borderColor: COLORS.moon,
    backgroundColor: 'rgba(200,168,75,0.06)',
  },
  langFlag: { fontSize: 24 },
  langLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  activeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.moon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 14, color: '#000', fontWeight: '700' },
  aboutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  aboutIcon: { fontSize: 40 },
  aboutTitle: { fontSize: 22, fontWeight: '900', color: COLORS.moon },
  aboutSub: { fontSize: 12, color: COLORS.muted },
  version: { fontSize: 10, color: '#444', marginTop: 4 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(200,168,75,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.2)',
  },
  tagText: { fontSize: 10, color: COLORS.moon },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleIcon: { fontSize: 20 },
  roleName: { fontSize: 12, fontWeight: '700' },
});
