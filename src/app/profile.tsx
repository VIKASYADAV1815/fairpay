import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FadeIn } from '@/components/FadeIn';
import { FairpayMark } from '@/components/FairpayLogo';
import { useAuthStore } from '@/store/auth';
import { useTripStore } from '@/store/trips';
import { useColors } from '@/store/theme';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';
import { PAY_RAILS, type PayRail, type PaymentMethod } from '@/lib/payments';
import { radius, space, type } from '@/theme/tokens';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const {
    name: authName,
    phone: authPhone,
    email,
    preferredCurrency,
    paymentMethods: savedMethods,
    updateProfile,
  } = useAuthStore();
  const updateMember = useTripStore((s) => s.updateMember);
  const trips = useTripStore((s) => s.trips);

  const [name, setName] = useState(authName || '');
  const [phone, setPhone] = useState(authPhone || '');
  const [currency, setCurrency] = useState<CurrencyCode>(preferredCurrency);
  const [rail, setRail] = useState<PayRail>(savedMethods[0]?.rail ?? 'upi');
  const [handle, setHandle] = useState(savedMethods[0]?.handle ?? '');

  const save = () => {
    const methods: PaymentMethod[] = handle.trim()
      ? [{ rail, handle: handle.trim() }]
      : [];
    updateProfile({
      name,
      phone,
      preferredCurrency: currency,
      paymentMethods: methods,
    });
    const prev = authName?.trim().toLowerCase();
    if (prev) {
      trips.forEach((t) => {
        t.members.forEach((m) => {
          if (m.name.trim().toLowerCase() === prev) {
            updateMember(t.id, m.id, { name, paymentMethods: methods });
          }
        });
      });
    }
    Alert.alert('Saved', 'Profile & pay method updated on this device.');
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ScreenHeader title="Profile" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FadeIn>
          <View style={styles.avatarBlock}>
            <FairpayMark size={72} />
            <Text style={[styles.name, { color: c.text }]}>{name || 'Your name'}</Text>
            <Text style={[styles.hint, { color: c.textSecondary }]}>
              {email || 'Shown to people in your groups'}
            </Text>
          </View>
        </FadeIn>

        <Text style={[styles.label, { color: c.textSecondary }]}>Display name</Text>
        <SoftCard tone="fill" style={styles.field}>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, { color: c.text }]}
            placeholder="Your name"
            placeholderTextColor={c.textTertiary}
            selectionColor={c.accent}
          />
        </SoftCard>

        <Text style={[styles.label, { color: c.textSecondary }]}>Phone</Text>
        <SoftCard tone="fill" style={styles.field}>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={[styles.input, { color: c.text }]}
            placeholder="+1 / +91 / …"
            placeholderTextColor={c.textTertiary}
            keyboardType="phone-pad"
            selectionColor={c.accent}
          />
        </SoftCard>

        <Text style={[styles.label, { color: c.textSecondary }]}>Preferred currency</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {CURRENCIES.map((cur) => {
            const on = currency === cur.code;
            return (
              <Pressable
                key={cur.code}
                onPress={() => setCurrency(cur.code)}
                style={[
                  styles.chip,
                  { backgroundColor: on ? c.accent : c.fillSecondary },
                ]}
              >
                <Text style={{ color: on ? c.accentInk : c.text, fontWeight: '700' }}>
                  {cur.symbol} {cur.code}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.label, { color: c.textSecondary, marginTop: space.xl }]}>
          How you get paid
        </Text>
        <Text style={[styles.hintLeft, { color: c.textTertiary }]}>
          Optional · pick your country rail (UPI, PayPal, Venmo, Pix…)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {PAY_RAILS.map((r) => {
            const on = rail === r.rail;
            return (
              <Pressable
                key={r.rail}
                onPress={() => setRail(r.rail)}
                style={[
                  styles.chip,
                  { backgroundColor: on ? c.accent : c.fillSecondary },
                ]}
              >
                <Text style={{ color: on ? c.accentInk : c.text, fontWeight: '700' }}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SoftCard tone="fill" style={styles.field}>
          <TextInput
            value={handle}
            onChangeText={setHandle}
            style={[styles.input, { color: c.text }]}
            placeholder={PAY_RAILS.find((r) => r.rail === rail)?.placeholder}
            placeholderTextColor={c.textTertiary}
            autoCapitalize="none"
            selectionColor={c.accent}
          />
        </SoftCard>
        <Text style={[styles.hintLeft, { color: c.textSecondary }]}>
          {PAY_RAILS.find((r) => r.rail === rail)?.hint}
        </Text>

        <View style={{ marginTop: space.xxl }}>
          <PrimaryButton label="Save profile" variant="accent" onPress={save} />
          <Text style={[styles.footnote, { color: c.textTertiary }]}>
            Syncs pay method into matching group members · FX conversion later
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  avatarBlock: { alignItems: 'center', marginBottom: space.xxxl },
  name: { ...type.title2, marginTop: space.lg },
  hint: { ...type.caption1, marginTop: 4 },
  hintLeft: { ...type.caption1, marginBottom: space.sm, marginLeft: 4 },
  label: {
    ...type.footnote,
    marginBottom: space.sm,
    marginLeft: 4,
  },
  field: { marginBottom: space.xl, paddingVertical: 4, paddingHorizontal: space.lg },
  input: { ...type.title3, paddingVertical: space.lg },
  chipRow: { gap: space.sm, paddingBottom: space.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  footnote: {
    ...type.caption1,
    textAlign: 'center',
    marginTop: space.md,
  },
});
