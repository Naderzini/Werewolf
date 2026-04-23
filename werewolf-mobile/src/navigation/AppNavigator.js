import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export const navigationRef = createNavigationContainerRef();
import { COLORS } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import JoinRoomScreen from '../screens/JoinRoomScreen';
import LobbyScreen from '../screens/LobbyScreen';
import RoleRevealScreen from '../screens/RoleRevealScreen';
import NightScreen from '../screens/NightScreen';
import WolfActionScreen from '../screens/WolfActionScreen';
import SeerActionScreen from '../screens/SeerActionScreen';
import SeerResultScreen from '../screens/SeerResultScreen';
import WitchActionScreen from '../screens/WitchActionScreen';
import DoctorActionScreen from '../screens/DoctorActionScreen';
import DayScreen from '../screens/DayScreen';
import VoteScreen from '../screens/VoteScreen';
import HunterActionScreen from '../screens/HunterActionScreen';
import GameResultScreen from '../screens/GameResultScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TestMenuScreen from '../screens/TestMenuScreen';
import useGameSocket from '../hooks/useGameSocket';

function GameSocketWatcher() {
  useGameSocket();
  return null;
}

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: COLORS.bg },
  animation: 'fade',
};

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <GameSocketWatcher />
      <Stack.Navigator screenOptions={screenOptions} initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TestMenu" component={TestMenuScreen} />
        <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="RoleReveal" component={RoleRevealScreen} />
        <Stack.Screen name="Night" component={NightScreen} />
        <Stack.Screen name="WolfAction" component={WolfActionScreen} />
        <Stack.Screen name="SeerAction" component={SeerActionScreen} />
        <Stack.Screen name="SeerResult" component={SeerResultScreen} />
        <Stack.Screen name="WitchAction" component={WitchActionScreen} />
        <Stack.Screen name="DoctorAction" component={DoctorActionScreen} />
        <Stack.Screen name="Day" component={DayScreen} />
        <Stack.Screen name="Vote" component={VoteScreen} />
        <Stack.Screen name="HunterAction" component={HunterActionScreen} />
        <Stack.Screen name="GameResult" component={GameResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
