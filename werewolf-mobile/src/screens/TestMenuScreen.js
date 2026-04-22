import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

export default function TestMenuScreen({ navigation }) {
  const screens = [
    { name: 'Home', icon: '🏠', desc: 'Home Screen' },
    { name: 'JoinRoom', icon: '🔑', desc: 'Join Room' },
    { name: 'Lobby', icon: '👥', desc: 'Lobby Screen' },
    { name: 'Settings', icon: '⚙️', desc: 'Settings' },
    { name: 'RoleReveal', icon: '🎭', desc: 'Role Reveal' },
    { name: 'Night', icon: '🌙', desc: 'Night Phase' },
    { name: 'WolfAction', icon: '🐺', desc: 'Wolf Action' },
    { name: 'SeerAction', icon: '🔮', desc: 'Seer Action' },
    { name: 'SeerResult', icon: '✨', desc: 'Seer Result' },
    { name: 'WitchAction', icon: '🧙', desc: 'Witch Action' },
    { name: 'DoctorAction', icon: '⚕️', desc: 'Doctor Action' },
    { name: 'Day', icon: '☀️', desc: 'Day Phase' },
    { name: 'Vote', icon: '🗳️', desc: 'Vote Screen' },
    { name: 'HunterAction', icon: '🏹', desc: 'Hunter Action' },
    { name: 'GameResult', icon: '🏆', desc: 'Game Result' },
  ];

  return (
    <LinearGradient
      colors={['#1a0a2e', '#0a0510', COLORS.bg]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🧪 Test Menu</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Tap any screen to navigate</Text>
        {screens.map((screen, index) => (
          <TouchableOpacity
            key={screen.name}
            style={styles.screenBtn}
            onPress={() => navigation.navigate(screen.name)}
          >
            <View style={styles.screenBtnContent}>
              <Text style={styles.screenIcon}>{screen.icon}</Text>
              <View style={styles.screenInfo}>
                <Text style={styles.screenName}>{screen.name}</Text>
                <Text style={styles.screenDesc}>{screen.desc}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.moon,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.moon,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 20,
    textAlign: 'center',
  },
  screenBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  screenBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  screenIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  screenInfo: {
    flex: 1,
  },
  screenName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.moon,
    marginBottom: 2,
  },
  screenDesc: {
    fontSize: 12,
    color: COLORS.muted,
  },
  arrow: {
    fontSize: 20,
    color: '#7c3aed',
  },
});
