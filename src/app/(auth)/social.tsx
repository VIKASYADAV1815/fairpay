import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/store/theme';

export default function SocialAuthScreen() {
  const c = useColors();

  useEffect(() => {
    // Redirect to unified Email & Phone login
    router.replace('/login');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={c.accent} />
    </View>
  );
}
