import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import { useTripStore } from '@/store/trips';
import { supabase } from '@/lib/supabase';
import { space, type } from '@/theme/tokens';

type UseCase = 'roommates' | 'trips' | 'groups' | 'partner' | null;
type Frequency = 'daily' | 'weekly' | 'monthly' | 'trips-only' | null;

const USE_CASES = [
  {
    id: 'roommates' as const,
    icon: '🎒',
    title: 'With roommates',
    subtitle: 'Rent, utilities, groceries',
  },
  {
    id: 'trips' as const,
    icon: '✈️',
    title: 'On trips',
    subtitle: 'Travel, food, activities',
  },
  {
    id: 'groups' as const,
    icon: '👥',
    title: 'With groups',
    subtitle: 'Dinners, events, outings',
  },
  {
    id: 'partner' as const,
    icon: '💑',
    title: 'With partner',
    subtitle: 'Dates, bills, groceries',
  },
];

const FREQUENCIES = [
  {
    id: 'daily' as const,
    icon: '📅',
    title: 'Daily',
    subtitle: 'Roommates, regular splits',
  },
  {
    id: 'weekly' as const,
    icon: '📆',
    title: 'Weekly',
    subtitle: 'Regular group activities',
  },
  {
    id: 'monthly' as const,
    icon: '🗓️',
    title: 'Monthly',
    subtitle: 'Occasional splits',
  },
  {
    id: 'trips-only' as const,
    icon: '🎯',
    title: 'Only for trips',
    subtitle: 'Travel expenses only',
  },
];

export default function QuestionsScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { user, session } = useAuthStore();
  const addTrip = useTripStore((s) => s.addTrip);

  const [step, setStep] = useState<1 | 2>(1);
  const [useCase, setUseCase] = useState<UseCase>(null);
  const [frequency, setFrequency] = useState<Frequency>(null);
  const [loading, setLoading] = useState(false);

  const handleUseCaseSelect = (selected: UseCase) => {
    setUseCase(selected);
  };

  const handleContinueFromStep1 = () => {
    if (!useCase) return;
    setStep(2);
  };

  const handleFinish = async () => {
    if (!useCase || !frequency) return;

    try {
      setLoading(true);

      // Save onboarding preferences to database
      const onboardingData = {
        completed: true,
        use_case: useCase,
        frequency: frequency,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .update({
          onboarding_data: onboardingData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session?.user.id);

      if (error) throw error;

      // Auto-create first group based on use case
      let groupName = 'My Group';
      const userName = user?.name || 'You';

      switch (useCase) {
        case 'roommates':
          groupName = 'Home';
          break;
        case 'trips':
          groupName = 'Trip';
          break;
        case 'groups':
          groupName = 'My Group';
          break;
        case 'partner':
          groupName = `${userName} & Partner`;
          break;
      }

      // Create the first group
      const trip = addTrip(groupName, useCase, 'INR', userName);

      // Mark onboarding as done in local store
      useAuthStore.getState().setOnboardingDone(true);

      // Navigate to the newly created group
      router.replace({
        pathname: '/trip/[id]',
        params: { id: trip.id, onboard: '1' },
      });
    } catch (error: any) {
      console.error('Onboarding completion error:', error);
      Alert.alert('Setup failed', error.message || 'Could not complete setup');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Mark onboarding as done without preferences
    useAuthStore.getState().setOnboardingDone(true);
    router.replace('/');
  };

  const progressPercent = step === 1 ? 75 : 100;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.bg,
          paddingTop: insets.top + space.lg,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (step === 2 ? setStep(1) : router.back())}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>
          {step === 1 ? 'Almost there!' : 'Final step'}
        </Text>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={[styles.skipText, { color: c.textSecondary }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={[styles.progressText, { color: c.textSecondary }]}>
            Quick setup ({step}/2)
          </Text>
          <View style={[styles.progress, { backgroundColor: c.fill }]}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: c.accent, width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>

        {/* Step 1: Use Case */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={[styles.question, { color: c.text }]}>
              How will you split expenses?
            </Text>
            <Text style={[styles.questionSub, { color: c.textSecondary }]}>
              We'll personalize your experience
            </Text>

            <View style={styles.options}>
              {USE_CASES.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        useCase === option.id ? c.accent : c.fillSecondary,
                      borderColor: useCase === option.id ? c.accent : 'transparent',
                    },
                  ]}
                  onPress={() => handleUseCaseSelect(option.id)}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color: useCase === option.id ? c.accentInk : c.text,
                        },
                      ]}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.optionSubtitle,
                        {
                          color:
                            useCase === option.id ? c.accentInk : c.textSecondary,
                        },
                      ]}
                    >
                      {option.subtitle}
                    </Text>
                  </View>
                  {useCase === option.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={c.accentInk}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Frequency */}
        {step === 2 && (
          <View style={styles.section}>
            <Text style={[styles.question, { color: c.text }]}>
              How often do you split?
            </Text>
            <Text style={[styles.questionSub, { color: c.textSecondary }]}>
              We'll set up reminders for you
            </Text>

            <View style={styles.options}>
              {FREQUENCIES.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        frequency === option.id ? c.accent : c.fillSecondary,
                      borderColor:
                        frequency === option.id ? c.accent : 'transparent',
                    },
                  ]}
                  onPress={() => setFrequency(option.id)}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color: frequency === option.id ? c.accentInk : c.text,
                        },
                      ]}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.optionSubtitle,
                        {
                          color:
                            frequency === option.id
                              ? c.accentInk
                              : c.textSecondary,
                        },
                      ]}
                    >
                      {option.subtitle}
                    </Text>
                  </View>
                  {frequency === option.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={c.accentInk}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: c.bg,
            paddingBottom: insets.bottom + space.md,
            borderTopColor: c.fill,
          },
        ]}
      >
        <Pressable
          style={[
            styles.continueButton,
            { backgroundColor: c.accent },
            ((step === 1 && !useCase) ||
              (step === 2 && !frequency) ||
              loading) &&
              styles.buttonDisabled,
          ]}
          onPress={step === 1 ? handleContinueFromStep1 : handleFinish}
          disabled={
            (step === 1 && !useCase) || (step === 2 && !frequency) || loading
          }
        >
          {loading ? (
            <ActivityIndicator color={c.accentInk} />
          ) : (
            <>
              <Text style={[styles.continueText, { color: c.accentInk }]}>
                {step === 1 ? 'Continue' : 'Get Started'}
              </Text>
              {step === 1 && (
                <Ionicons name="arrow-forward" size={20} color={c.accentInk} />
              )}
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  headerTitle: {
    ...type.headline,
  },
  skipText: {
    ...type.subheadline,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: space.xl,
  },
  progressSection: {
    marginBottom: space.xxl,
  },
  progressText: {
    ...type.caption1,
    marginBottom: space.sm,
  },
  progress: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  section: {
    marginBottom: space.xl,
  },
  question: {
    ...type.title2,
    marginBottom: space.xs,
  },
  questionSub: {
    ...type.body,
    marginBottom: space.xl,
  },
  options: {
    gap: space.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: 16,
    borderWidth: 2,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: space.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...type.subheadline,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    ...type.caption1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    borderTopWidth: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 16,
    borderRadius: 14,
    minHeight: 56,
  },
  continueText: {
    ...type.subheadline,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
