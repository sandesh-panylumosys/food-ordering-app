import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandIntro } from '@/components/brand/BrandIntro';
import { ToastHost } from '@/components/ui';
import { fontAssets } from '@/constants/fonts';
import { colors } from '@/constants/theme';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/auth.store';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Auth hydration doesn't block rendering — screens handle the 'loading' state.
  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={introDone ? 'dark' : 'light'} />
          {fontsReady && (
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'default',
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="product/[id]" options={{ animation: 'fade_from_bottom' }} />
              <Stack.Screen name="search" options={{ animation: 'fade' }} />
              <Stack.Screen name="login" options={{ presentation: 'modal' }} />
              <Stack.Screen name="register" options={{ presentation: 'modal' }} />
              <Stack.Screen name="payment" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
              <Stack.Screen name="order-success/[id]" options={{ gestureEnabled: false, animation: 'fade' }} />
            </Stack>
          )}
          {!introDone && <BrandIntro onDone={finishIntro} />}
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.espresso } });
