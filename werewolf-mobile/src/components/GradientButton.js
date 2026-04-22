import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

export default function GradientButton({ 
  title, 
  onPress, 
  colors = ['#7c3aed', '#4f46e5'], 
  style, 
  textStyle,
  icon,
  outline = false,
  disabled = false,
}) {
  if (outline) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[styles.outlineBtn, { borderColor: colors[0], opacity: disabled ? 0.5 : 1 }, style]}
        activeOpacity={0.7}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.outlineText, { color: colors[0] }, textStyle]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8} style={{ opacity: disabled ? 0.5 : 1 }}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.btn, style]}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  icon: {
    fontSize: 16,
  },
  outlineBtn: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  outlineText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
