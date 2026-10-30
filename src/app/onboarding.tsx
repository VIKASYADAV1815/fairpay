import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { FairpayLogo } from '@/components/FairpayLogo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SoftCard } from '@/components/SoftCard';
import { EmptyArt } from '@/components/EmptyArt';
import { FadeIn } from '@/components/FadeIn';
import { useAuthStore } from '@/store/auth';
import { useColors } from '@/store/theme';
import { space, type } from '@/theme/tokens';
import { enter } from '@/theme/motion';

const STEPS = [
  { title: 'Split with 2+', body: 'Any group — travel, rent, office. Never solo.' },
  { title: 'Settle on WhatsApp', body: 'Pay links for UPI, PayPal, Venmo & more.' },
  { title: 'Earn as a group', body: 'Travel cashback funds the shared pot — Pro tracks it.' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const finish = () => {
    completeOnboarding();
    router.replace('/');
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: c.bg,
          paddingTop: insets.top + space.xxl,
          paddingBottom: insets.bottom + space.xxl,
        },
      ]}
    >
      <FadeIn>
        <FairpayLogo width={160} />
      </FadeIn>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={enter(80)}
        style={styles.hero}
      >
        <EmptyArt kind="welcome" width={168} height={112} />
        <Text style={[styles.headline, { color: c.text }]}>Zero-friction{'\n'}shared money.</Text>
        <Text style={[styles.sub, { color: c.textSecondary }]}>
          Track spends together. Settle on WhatsApp. Earn as a group.
        </Text>
      </MotiView>

      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <MotiView
            key={s.title}
            transition={enter(140 + i * 70)}
            from={{ opacity: 0, translateX: -12 }}
            animate={{ opacity: 1, translateX: 0 }}
          >
            <SoftCard style={styles.step}>
              <View style={[styles.num, { backgroundColor: c.accent }]}>
                <Text style={[styles.numText, { color: c.accentInk }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: c.text }]}>{s.title}</Text>
                <Text style={[styles.stepBody, { color: c.textSecondary }]}>{s.body}</Text>
              </View>
            </SoftCard>
          </MotiView>
        ))}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Get started" variant="accent" onPress={finish} />
        <Pressable onPress={finish} style={styles.skip}>
          <Text style={[styles.skipText, { color: c.textSecondary }]}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: space.xl,
  },
  hero: { marginTop: space.xl },
  headline: { ...type.largeTitle, marginTop: space.md },
  sub: {
    ...type.body,
    marginTop: space.sm,
  },
  steps: { marginTop: space.xl, gap: space.sm, flex: 1 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  num: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { ...type.subheadline },
  stepTitle: { ...type.subheadline },
  stepBody: { ...type.caption1, marginTop: 2 },
  footer: { gap: space.md },
  skip: { alignItems: 'center', paddingVertical: space.sm },
  skipText: { ...type.footnote, fontWeight: '600' },
});
