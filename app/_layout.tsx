import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getTheme } from '../theme';

export default function RootLayout() {
  const [client] = useState(() => new QueryClient()); const theme = getTheme(useColorScheme());
  return <SafeAreaProvider><QueryClientProvider client={client}><StatusBar style={theme.background === '#07141D' ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="spot/[id]" options={{ presentation: 'card' }} /></Stack></QueryClientProvider></SafeAreaProvider>;
}
