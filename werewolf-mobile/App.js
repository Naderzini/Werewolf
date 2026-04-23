import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from './src/context/GameContext';
import AppNavigator from './src/navigation/AppNavigator';
import useGameSocket from './src/hooks/useGameSocket';
import './src/i18n';

function GameSocketWatcher() {
  useGameSocket();
  return null;
}

export default function App() {
  return (
    <GameProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </GameProvider>
  );
}
