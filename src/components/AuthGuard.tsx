import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/auth';

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const segments = useSegments();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    // Allow access if either:
    // 1. User is logged in (Supabase or legacy)
    // 2. User is on home screen (they can use local mode)
    // Only redirect to auth if trying to access protected features
    
    if (!isLoggedIn && !user && !inAuthGroup) {
      // User not logged in, but let them use the app (local mode)
      // They'll be prompted to sign up when trying to sync/invite
      return;
    }
    
    if ((isLoggedIn || user) && inAuthGroup) {
      // User is logged in and on auth screen - redirect to home
      router.replace('/');
    }
  }, [isLoggedIn, user, segments]);

  return <>{children}</>;
}
