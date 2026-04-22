import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Moon({ size = 120 }) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient
        colors={['#fff9e0', '#c8a84b', '#8a6a20']}
        start={{ x: 0.35, y: 0.35 }}
        end={{ x: 0.8, y: 0.8 }}
        style={[styles.moon, { width: size, height: size, borderRadius: size / 2 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#c8a84b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 10,
  },
  moon: {},
});
