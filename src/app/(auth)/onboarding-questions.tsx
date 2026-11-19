import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import { useTripStore } from '@/store/trips';
import { supabase } from '@/lib/supabase';
import { FairpayLogo } from '@/components/FairpayLogo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { sendWelcomeGreeting } from '@/lib/welcomeEmail';
import { space } from '@/theme/tokens';

type UseCase = 'roommates' | 'trips' | 'groups' | 'partner' | null;
type Frequency = 'daily' | 'weekly' | 'monthly' | 'trips-only' | null;

const USE_CASES: { id: NonNullable<UseCase>; iconName: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  {
    id: 'trips',
    iconName: 'airplane-outline',
    title: 'Travel & Vacations',
    subtitle: 'Flights, stays, food & group activities',
  },
  {
    id: 'roommates',
    iconName: 'home-outline',
    title: 'Roommates & Rent',
    subtitle: 'Rent, Wi-Fi, electricity, groceries',
  },
  {
    id: 'groups',
    iconName: 'people-outline',
    title: 'Friends & Dinners',
    subtitle: 'Weekend hangs, parties, drinks, gifts',
  },
  {
    id: 'partner',
    iconName: 'heart-outline',
    title: 'With Partner',
    subtitle: 'Dates, bills, dining & household splits',
  },
];

const FREQUENCIES: { id: NonNullable<Frequency>; title: string; subtitle: string }[] = [
  {
    id: 'daily',
    title: 'Daily / Several times a week',
    subtitle: 'Frequent shared living expenses',
  },
  {
    id: 'weekly',
    title: 'Weekly',
    subtitle: 'Regular social events or outings',
  },
  {
    id: 'monthly',
    title: 'Monthly',
    subtitle: 'Rent & shared subscriptions',
  },
  {
    id: 'trips-only',
    title: 'Only on vacations & trips',
    subtitle: 'Periodic travel expenses',
  },
];

export default function QuestionsScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const { user, session, name, email, preferredCurrency } = useAuthStore();
  const addTrip = useTripStore((s) => s.addTrip);

  const [step, setStep] = useState<1 | 2>(1);
  const [useCase, setUseCase] = useState<UseCase>('trips');
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [loading, setLoading] = useState(false);

  const completeOnboardingFlow = async (skipGroup = false) => {
    try {
      setLoading(true);
      const userName = name || user?.name || 'You';
      const userEmail = email || user?.email || '';

      // Save onboarding preferences to database
      if (session?.user?.id) {
        try {
          await supabase
            .from('users')
            .update({
              onboarding_data: {
                completed: true,
                use_case: useCase,
                frequency: frequency,
                completed_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', session.user.id);
        } catch {
          // ignore
        }
      }

      // Auto-create starter group if not skipped
      if (!skipGroup && useCase) {
        let groupName = 'Goa Trip 2026';
        switch (useCase) {
          case 'roommates':
            groupName = 'Apartment 402';
            break;
          case 'trips':
            groupName = 'Goa Vacation';
            break;
          case 'groups':
            groupName = 'Weekend Hangout';
            break;
          case 'partner':
            groupName = `${userName} & Partner`;
            break;
        }

        try {
          addTrip(groupName, useCase, preferredCurrency || 'INR', userName);
        } catch {
          // ignore
        }
      }

      // Finalize status: mark onboarding done & trigger celebration modal once
      useAuthStore.getState().setOnboardingDone(true);
      useAuthStore.getState().completeQuestions();
      useAuthStore.getState().setShowWelcomeModal(true);

      if (userEmail) {
        sendWelcomeGreeting(userName, userEmail);
      }

      router.replace('/');
    } catch (err: any) {
      console.warn('Onboarding completion error:', err);
      useAuthStore.getState().setOnboardingDone(true);
      useAuthStore.getState().setShowWelcomeModal(true);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + space.md,
            paddingBottom: insets.bottom + space.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation / Skip Bar */}
        <View style={styles.topRow}>
          {step === 2 ? (
            <Pressable onPress={() => setStep(1)} hitSlop={12} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={c.textSecondary} />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <FairpayLogo width={105} />
          <Pressable onPress={() => completeOnboardingFlow(true)} hitSlop={12} style={styles.skipBtn}>
            <Text style={[styles.skipTxt, { color: c.textTertiary }]}>Skip</Text>
          </Pressable>
        </View>

        {/* Step Header */}
        <View style={styles.titleBlock}>
          <View style={[styles.stepPill, { backgroundColor: darkMode ? '#1C1C1E' : '#F2F2F7' }]}>
            <Text style={[styles.stepTxt, { color: c.textSecondary }]}>Step 2 of 2 · {step === 1 ? 'Primary Purpose' : 'Cadence'}</Text>
          </View>
          <Text style={[styles.heading, { color: c.text }]}>
            {step === 1 ? 'How will you use Fairpay?' : 'How often do you split?'}
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {step === 1
              ? 'We will tailor your smart split engine and default currency for your group.'
              : 'Helps Fairpay schedule smart reminders before debts become awkward.'}
          </Text>
        </View>

        {/* Question Options */}
        {step === 1 ? (
          <View style={styles.optionsWrap}>
            {USE_CASES.map((item) => {
              const active = useCase === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setUseCase(item.id)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: active
                        ? (darkMode ? '#2C2C2E' : '#FFFFFF')
                        : (darkMode ? '#1C1C1E' : '#F5F5F7'),
                      borderColor: active ? c.accent : 'transparent',
                    },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: active ? c.accent : (darkMode ? '#242426' : '#E5E5EA') }]}>
                    <Ionicons
                      name={item.iconName}
                      size={20}
                      color={active ? '#000000' : c.textSecondary}
                    />
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={[styles.cardTitle, { color: c.text }]}>{item.title}</Text>
                    <Text style={[styles.cardSub, { color: c.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                  {active && (
                    <Ionicons name="checkmark-circle" size={20} color={c.accent} style={{ marginLeft: 8 }} />
                  )}
                </Pressable>
              );
            })}

            <View style={{ marginTop: 24 }}>
              <PrimaryButton
                label="Continue →"
                onPress={() => setStep(2)}
                disabled={!useCase}
                variant="accent"
              />
            </View>
          </View>
        ) : (
          <View style={styles.optionsWrap}>
            {FREQUENCIES.map((item) => {
              const active = frequency === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFrequency(item.id)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: active
                        ? (darkMode ? '#2C2C2E' : '#FFFFFF')
                        : (darkMode ? '#1C1C1E' : '#F5F5F7'),
                      borderColor: active ? c.accent : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.textWrap}>
                    <Text style={[styles.cardTitle, { color: c.text }]}>{item.title}</Text>
                    <Text style={[styles.cardSub, { color: c.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                  {active && (
                    <Ionicons name="checkmark-circle" size={20} color={c.accent} style={{ marginLeft: 8 }} />
                  )}
                </Pressable>
              );
            })}

            <View style={{ marginTop: 24 }}>
              <PrimaryButton
                label={loading ? 'Finishing setup…' : 'Complete Setup & Launch →'}
                onPress={() => completeOnboardingFlow(false)}
                disabled={loading || !frequency}
                variant="accent"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    paddingHorizontal: space.xl,
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipTxt: {
    fontSize: 13.5,
    fontWeight: '400',
  },
  titleBlock: {
    marginBottom: space.xl,
  },
  stepPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
    marginBottom: 10,
  },
  stepTxt: {
    fontSize: 11.5,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  heading: {
    fontSize: 27,
    fontWeight: '300', // Apple SF Pro Display Light
    letterSpacing: -0.7,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '400',
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  optionsWrap: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: -0.1,
  },
});
