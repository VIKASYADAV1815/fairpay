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

    if (!isLoggedIn && !user && !inAuthGroup) {
      // User is not logged in and trying to access protected route
      router.replace('/(auth)/phone');
    } else if ((isLoggedIn || user) && inAuthGroup) {
      // User is logged in and on auth screen - redirect to home
      router.replace('/');
    }
  }, [isLoggedIn, user, segments]);

  return <>{children}</>;
}
