import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FadeIn } from '@/components/FadeIn';
import { FairpayLogo } from '@/components/FairpayLogo';
import { useAuthStore } from '@/store/auth';
import { useColors } from '@/store/theme';
import { radius, space, type } from '@/theme/tokens';
import { enter } from '@/theme/motion';

const QUESTIONS: {
  id: string;
  prompt: string;
  options: string[];
}[] = [
  {
    id: 'use',
    prompt: 'What will you use Fairpay for most?',
    options: ['Travel / trips', 'Flat & rent', 'Office / team', 'Friends & hangouts', 'All of the above'],
  },
  {
    id: 'size',
    prompt: 'Usual group size?',
    options: ['2 people', '3–5', '6–10', '10+'],
  },
  {
    id: 'settle',
    prompt: 'How do you usually settle?',
    options: ['UPI / GPay', 'PayPal / Venmo', 'Pix / SEPA / bank', 'Cash', 'We just forget'],
  },
];

export default function QuestionsScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const completeQuestions = useAuthStore((s) => s.completeQuestions);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const q = QUESTIONS[step];
  const selected = answers[q.id];
  const last = step === QUESTIONS.length - 1;

  const next = () => {
    if (!selected) return;
    if (last) {
      completeQuestions();
      router.replace('/');
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xxl }]}>
      <FairpayLogo width={120} />
      <FadeIn key={q.id}>
        <Text style={[styles.progress, { color: c.textSecondary }]}>
          Question {step + 1} of {QUESTIONS.length}
        </Text>
        <Text style={[styles.prompt, { color: c.text }]}>{q.prompt}</Text>
      </FadeIn>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: space.xl }}>
        {q.options.map((opt, i) => {
          const on = selected === opt;
          return (
            <MotiView key={opt} transition={enter(50 + i * 40)} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}>
              <Pressable
                onPress={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                style={[
                  styles.opt,
                  { backgroundColor: on ? c.accent : c.fill },
                ]}
              >
                <Text style={[styles.optText, { color: on ? c.accentInk : c.text }]}>{opt}</Text>
              </Pressable>
            </MotiView>
          );
        })}
      </ScrollView>

      <PrimaryButton
        label={last ? 'Finish' : 'Continue'}
        variant="accent"
        disabled={!selected}
        onPress={next}
      />
      <Pressable onPress={() => router.replace('/')} style={styles.skip}>
        <Text style={{ ...type.footnote, color: c.textSecondary }}>Skip for now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  progress: { ...type.footnote, marginTop: space.xxxl, fontWeight: '700' },
  prompt: { ...type.title1, marginTop: space.sm },
  opt: {
    borderRadius: radius.lg,
    paddingVertical: 18,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  optText: { ...type.subheadline },
  skip: { alignItems: 'center', marginTop: space.lg },
});
