import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function PhaseBanner({ phase, label, icon }) {
  const isNight = phase === 'night';
  
  return (
    <View style={[styles.banner, isNight ? styles.night : styles.day]}>
      <Text style={styles.icon}>{icon || (isNight ? '🌙' : '☀️')}</Text>
      <Text style={[styles.text, { color: isNight ? '#a78bfa' : '#fbbf24' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    margin: 8,
  },
  night: {
    backgroundColor: '#0d0d2e',
    borderWidth: 1,
    borderColor: '#2a2a6a',
  },
  day: {
    backgroundColor: '#1a1200',
    borderWidth: 1,
    borderColor: '#3a2800',
  },
  icon: {
    fontSize: 18,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});
