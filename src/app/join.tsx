import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FadeIn } from '@/components/FadeIn';
import { useTripStore } from '@/store/trips';
import { useAuthStore } from '@/store/auth';
import { useColors } from '@/store/theme';
import { parseInvitePayload } from '@/lib/invite';
import { space, type } from '@/theme/tokens';

export default function JoinScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const joinByInviteCode = useTripStore((s) => s.joinByInviteCode);
  const name = useAuthStore((s) => s.name);
  const [code, setCode] = useState('');

  const join = () => {
    const parsed = parseInvitePayload(code);
    if (!parsed) {
      Alert.alert('Invalid code', 'Enter a 4–8 character Fairpay invite code.');
      return;
    }
    const trip = joinByInviteCode(parsed, name || undefined);
    if (!trip) {
      Alert.alert('Couldn’t join', 'Try again.');
      return;
    }
    router.replace({ pathname: '/trip/[id]', params: { id: trip.id } });
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: c.bg, paddingTop: insets.top, paddingBottom: insets.bottom + space.xxl },
      ]}
    >
      <ScreenHeader title="Join group" />

      <FadeIn>
        <Text style={[styles.hero, { color: c.text }]}>Enter invite code</Text>
        <Text style={[styles.sub, { color: c.textSecondary }]}>
          Someone shared a Fairpay link or 6-digit code? Paste it here.
        </Text>
      </FadeIn>

      <SoftCard tone="fill" style={styles.codeCard}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="ABC123"
          placeholderTextColor={c.textTertiary}
          style={[styles.codeInput, { color: c.text }]}
          autoCapitalize="characters"
          maxLength={12}
          selectionColor={c.accent}
        />
      </SoftCard>

      <View style={styles.orRow}>
        <View style={[styles.line, { backgroundColor: c.fillSecondary }]} />
        <Text style={[styles.or, { color: c.textTertiary }]}>or</Text>
        <View style={[styles.line, { backgroundColor: c.fillSecondary }]} />
      </View>

      <Pressable onPress={() => router.push('/scan')}>
        <SoftCard style={styles.scan}>
          <View style={[styles.scanIcon, { backgroundColor: c.accent }]}>
            <Ionicons name="qr-code-outline" size={22} color={c.accentInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.scanTitle, { color: c.text }]}>Scan QR</Text>
            <Text style={[styles.scanBody, { color: c.textSecondary }]}>
              Open camera and point at invite QR
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
        </SoftCard>
      </Pressable>

      <View style={{ flex: 1 }} />

      <PrimaryButton
        label="Join group"
        variant="accent"
        disabled={code.trim().length < 4}
        onPress={join}
      />
      <Text style={[styles.footnote, { color: c.textTertiary }]}>
        Codes work on this device now · cloud invites next
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  hero: { ...type.title1 },
  sub: { ...type.body, marginTop: space.sm, marginBottom: space.xxxl },
  codeCard: { paddingHorizontal: space.lg },
  codeInput: {
    ...type.largeTitle,
    letterSpacing: 4,
    textAlign: 'center',
    paddingVertical: space.xl,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginVertical: space.xxl,
  },
  line: { flex: 1, height: 1 },
  or: { ...type.caption1, fontWeight: '700' },
  scan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  scanIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTitle: { ...type.subheadline },
  scanBody: { ...type.caption1, marginTop: 2 },
  footnote: {
    ...type.caption1,
    textAlign: 'center',
    marginTop: space.md,
  },
});
