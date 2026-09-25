import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Appearance, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { VercelObservability } from '../components/VercelObservability';
import { useAppTheme } from '../hooks/useAppTheme';

export default function RootLayout() {
  const [client] = useState(() => new QueryClient());
  const { mode, theme } = useAppTheme();

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.style.colorScheme = mode;
    } else {
      Appearance.setColorScheme(mode);
    }
  }, [mode]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="spot/[id]" options={{ presentation: 'card' }} />
        </Stack>
        <VercelObservability />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
