import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ThemedAlertHost } from '@/components/ThemedAlert';
import { useApiKeepAlive } from '@/hooks/useApiKeepAlive';

SplashScreen.preventAutoHideAsync();

// Dev-only warning from expo-router 57's own deep-link handling (fork/useLinking.native.js):
// at launch it can report the launch URL before its NavigationContainer has mounted.
// Harmless and outside our code; remove once a newer expo-router fixes it.
LogBox.ignoreLogs(["Can't perform a React state update on a component that hasn't mounted yet"]);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  useApiKeepAlive();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
      <ThemedAlertHost />
    </ThemeProvider>
  );
}
