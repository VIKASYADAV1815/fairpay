import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useColors, useThemeStore } from '@/store/theme';
import { useTripStore } from '@/store/trips';
import { useAuthStore } from '@/store/auth';
import { parseInvitePayload } from '@/lib/invite';

function useInviteDeepLink() {
  const joinByInviteCode = useTripStore((s) => s.joinByInviteCode);
  const name = useAuthStore((s) => s.name);

  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) return;
      const code = parseInvitePayload(url);
      if (!code) return;
      const trip = joinByInviteCode(code, name || undefined);
      if (trip) {
        router.push({ pathname: '/trip/[id]', params: { id: trip.id } });
      }
    };

    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', (e) => handle(e.url));
    return () => sub.remove();
  }, [joinByInviteCode, name]);
}

export default function RootLayout() {
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  useInviteDeepLink();

  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="signup" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="questions" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="scan"
          options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="pro" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
