import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
// Pressable for routes + reminder hour
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SoftCard } from '@/components/SoftCard';
import { FadeIn } from '@/components/FadeIn';
import { useProStore } from '@/store/pro';
import { useAuthStore } from '@/store/auth';
import { useColors, useThemeStore } from '@/store/theme';
import { reminderLabel, useRemindersStore } from '@/store/reminders';
import { space, type } from '@/theme/tokens';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const isPro = useProStore((s) => s.isPro);
  const { isLoggedIn, name, logout } = useAuthStore();
  const darkMode = useThemeStore((s) => s.darkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);
  const remindersOn = useRemindersStore((s) => s.enabled);
  const setRemindersOn = useRemindersStore((s) => s.setEnabled);
  const reminderHour = useRemindersStore((s) => s.hour);
  const setReminderHour = useRemindersStore((s) => s.setHour);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ScreenHeader title="Settings" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <SoftCard tone={darkMode ? 'fill' : 'accent'} style={styles.banner}>
            <Text style={[styles.bannerEyebrow, { color: darkMode ? c.accent : c.accentInk }]}>
              ACCOUNT
            </Text>
            <Text style={[styles.bannerTitle, { color: darkMode ? c.text : c.accentInk }]}>
              {isLoggedIn ? name : 'Guest mode'}
            </Text>
            <Text
              style={[
                styles.bannerBody,
                { color: darkMode ? c.textSecondary : c.accentInk },
              ]}
            >
              {isLoggedIn
                ? 'You’re signed in (UI). Backend sync comes later.'
                : 'Log in or sign up to unlock full setup.'}
            </Text>
            <View style={styles.authRow}>
              {isLoggedIn ? (
                <Pressable
                  style={[
                    styles.authBtn,
                    { backgroundColor: darkMode ? c.accent : c.accentInk },
                  ]}
                  onPress={() => logout()}
                >
                  <Text
                    style={[
                      styles.authBtnText,
                      { color: darkMode ? c.accentInk : c.accent },
                    ]}
                  >
                    Log out
                  </Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={[
                      styles.authBtn,
                      { backgroundColor: darkMode ? c.accent : c.accentInk },
                    ]}
                    onPress={() => router.push('/login')}
                  >
                    <Text
                      style={[
                        styles.authBtnText,
                        { color: darkMode ? c.accentInk : c.accent },
                      ]}
                    >
                      Log in
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.authBtn,
                      {
                        backgroundColor: darkMode ? '#F5F5F7' : '#FFFFFF',
                        borderWidth: darkMode ? 0 : 1,
                        borderColor: 'rgba(0,0,0,0.08)',
                      },
                    ]}
                    onPress={() => router.push('/signup')}
                  >
                    <Text style={[styles.authBtnText, { color: '#0A0A0A' }]}>Sign up</Text>
                  </Pressable>
                </>
              )}
            </View>
          </SoftCard>
        </FadeIn>

        <SoftCard style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: c.accent }]}>
            <Ionicons name="moon-outline" size={18} color={c.accentInk} />
          </View>
          <Text style={[styles.label, { color: c.text }]}>Dark mode</Text>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: c.fillSecondary, true: c.accent }}
            thumbColor={c.white}
          />
        </SoftCard>

        <SoftCard style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: c.accent }]}>
            <Ionicons name="notifications-outline" size={18} color={c.accentInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: c.text, flex: 0 }]}>Settle reminders</Text>
            <Text style={[styles.value, { color: c.textSecondary }]}>
              Daily · {reminderLabel(reminderHour)}
            </Text>
          </View>
          <Switch
            value={remindersOn}
            onValueChange={setRemindersOn}
            trackColor={{ false: c.fillSecondary, true: c.accent }}
            thumbColor={c.white}
          />
        </SoftCard>

        {remindersOn ? (
          <SoftCard style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: c.accent }]}>
              <Ionicons name="time-outline" size={18} color={c.accentInk} />
            </View>
            <Text style={[styles.label, { color: c.text }]}>Reminder hour</Text>
            <Pressable
              onPress={() => setReminderHour((reminderHour + 1) % 24)}
              style={[styles.hourChip, { backgroundColor: c.fillSecondary }]}
            >
              <Text style={{ color: c.text, fontWeight: '700' }}>
                {reminderLabel(reminderHour)}
              </Text>
            </Pressable>
          </SoftCard>
        ) : null}

        {(
          [
            { icon: 'person-outline' as const, label: 'Profile', route: '/profile' },
            { icon: 'diamond-outline' as const, label: 'Fairpay Pro', value: isPro ? 'Active' : 'Upgrade', route: '/pro' },
            { icon: 'help-buoy-outline' as const, label: 'Setup questions', route: '/questions' },
            { icon: 'sparkles-outline' as const, label: 'Welcome / onboarding', route: '/onboarding' },
            { icon: 'link-outline' as const, label: 'Join a group', route: '/join' },
            { icon: 'time-outline' as const, label: 'History', route: '/history' },
            { icon: 'gift-outline' as const, label: 'Deals', route: '/deals' },
            { icon: 'help-circle-outline' as const, label: 'Help & FAQ', onPress: () => Alert.alert('Help', 'Documentation coming soon. For now, explore the app!') },
            { icon: 'document-text-outline' as const, label: 'Privacy Policy', onPress: () => Alert.alert('Privacy', 'We store data locally on your device. No data is sent to servers yet. Backend privacy policy will be added when cloud sync launches.') },
          ] as const
        ).map((r) => (
          <Pressable
            key={r.label}
            onPress={() => {
              if ('onPress' in r && r.onPress) {
                r.onPress();
              } else if ('route' in r && r.route) {
                router.push(r.route as any);
              }
            }}
          >
            <SoftCard style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: c.accent }]}>
                <Ionicons name={r.icon} size={18} color={c.accentInk} />
              </View>
              <Text style={[styles.label, { color: c.text }]}>{r.label}</Text>
              <View style={styles.trailing}>
                {'value' in r && r.value ? (
                  <Text style={[styles.value, { color: c.textSecondary }]}>{r.value}</Text>
                ) : null}
                <Ionicons name="chevron-forward" size={16} color={c.textTertiary} />
              </View>
            </SoftCard>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  banner: { marginBottom: space.xl },
  bannerEyebrow: { ...type.caption2, fontWeight: '800', letterSpacing: 0.6 },
  bannerTitle: { ...type.title3, marginTop: 6 },
  bannerBody: { ...type.footnote, marginTop: 4, opacity: 0.85 },
  authRow: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  authBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  authBtnGhost: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  authBtnText: { ...type.subheadline },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...type.subheadline, flex: 1 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { ...type.caption1, fontWeight: '600' },
  hourChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
