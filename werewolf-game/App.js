import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from './src/context/GameContext';
import AppNavigator from './src/navigation/AppNavigator';
import './src/i18n';

export default function App() {
  return (
    <GameProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </GameProvider>
  );
}
