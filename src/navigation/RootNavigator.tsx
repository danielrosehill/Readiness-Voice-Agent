import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { SessionScreen } from '../screens/SessionScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Colors } from '../utils/constants';

export type RootStackParamList = {
  Home: undefined;
  Session: { checklistId: string };
  Summary: {
    checklistId: string;
    checked: number;
    skipped: number;
    total: number;
    skippedCritical: string[];
  };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Session" component={SessionScreen} options={{ title: 'Voice Session' }} />
      <Stack.Screen name="Summary" component={SummaryScreen} options={{ title: 'Summary', headerBackVisible: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
