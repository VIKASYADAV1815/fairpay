import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="social" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="phone" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="name-setup" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="payment-setup" />
      <Stack.Screen name="onboarding-questions" />
    </Stack>
  );
}
