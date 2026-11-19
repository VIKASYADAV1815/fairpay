import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useColors, useThemeStore } from '@/store/theme';
import { useTripStore } from '@/store/trips';
import { useAuthStore } from '@/store/auth';
import { parseInvitePayload } from '@/lib/invite';
import { AuthGuard } from '@/components/AuthGuard';
import { supabase } from '@/lib/supabase';

function useInviteDeepLink() {
  const joinByInviteCodeAsync = useTripStore((s) => s.joinByInviteCodeAsync);
  const name = useAuthStore((s) => s.name);

  useEffect(() => {
    const handle = async (url: string | null) => {
      if (!url) return;
      
      // Handle Supabase Auth callback links
      if (
        url.includes('access_token=') ||
        url.includes('refresh_token=') ||
        url.includes('type=signup') ||
        url.includes('type=magiclink')
      ) {
        try {
          const hashIdx = url.indexOf('#');
          const queryIdx = url.indexOf('?');
          const paramsStr =
            hashIdx !== -1
              ? url.slice(hashIdx + 1)
              : queryIdx !== -1
              ? url.slice(queryIdx + 1)
              : '';
          const params = new URLSearchParams(paramsStr);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            useAuthStore.getState().setShowWelcomeModal(true);
            router.replace('/');
            return;
          }
        } catch (e) {
          console.warn('Failed to handle auth deep link:', e);
        }
      }

      // Handle invite links
      const code = parseInvitePayload(url);
      if (code) {
        try {
          const trip = await joinByInviteCodeAsync(code, name || undefined);
          if (trip) {
            router.push({ pathname: '/trip/[id]', params: { id: trip.id } });
          }
        } catch (e) {
          console.warn('Failed to join by deep link:', e);
        }
        return;
      }
      
      // Handle payment completion deep links
      // Format: fairpay://payment-complete?tripId=xxx&expenseId=yyy&memberId=zzz
      if (url.includes('fairpay://payment-complete')) {
        try {
          const parsed = new URL(url);
          const tripId = parsed.searchParams.get('tripId');
          const expenseId = parsed.searchParams.get('expenseId');
          const memberId = parsed.searchParams.get('memberId');
          
          if (tripId && expenseId && memberId) {
            // Navigate to the trip and show payment confirmation prompt
            router.push({
              pathname: '/trip/[id]',
              params: {
                id: tripId,
                confirmPayment: expenseId,
                memberId: memberId,
              },
            });
          }
        } catch (e) {
          console.warn('Failed to parse payment-complete URL:', e);
        }
      }
    };

    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', (e) => handle(e.url));
    return () => sub.remove();
  }, [joinByInviteCodeAsync, name]);
}

export default function RootLayout() {
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const { onboardingDone, isLoggedIn } = useAuthStore();
  useInviteDeepLink();

  // Check if user needs to see social login screen
  useEffect(() => {
    // If not logged in and onboarding not done, could show social login
    // But we also allow "Skip" so don't force it
    // The social login screen will be shown via direct navigation when needed
  }, [isLoggedIn, onboardingDone]);

  return (
    <AuthGuard>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="questions" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="scan"
          options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="pro" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="faq" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </AuthGuard>
  );
}
