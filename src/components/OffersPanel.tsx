import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SoftCard } from '@/components/SoftCard';
import { AFFILIATE_OFFERS } from '@/lib/affiliates';
import { useProStore } from '@/store/pro';
import { useColors } from '@/store/theme';
import { router } from 'expo-router';
import { space, type } from '@/theme/tokens';

type Props = {
  tripId: string;
  onCashback: (amount: number, brand: string) => void;
};

export function OffersPanel({ tripId, onCashback }: Props) {
  const c = useColors();
  const isPro = useProStore((s) => s.isPro);

  const openOffer = async (id: string) => {
    const offer = AFFILIATE_OFFERS.find((o) => o.id === id);
    if (!offer) return;

    if (!isPro) {
      Alert.alert('Pro cashback tracking', 'Track affiliate cashback into trip pot with Pro.', [
        { text: 'Browse anyway', onPress: () => Linking.openURL(offer.url) },
        { text: 'Unlock Pro', onPress: () => router.push('/pro') },
      ]);
      return;
    }

    await Linking.openURL(offer.url);
    const demoCredit = Math.round(offer.cashbackPct * 20);
    onCashback(demoCredit, offer.brand);
    Alert.alert(
      'Pot credited',
      `Demo ₹${demoCredit} cashback from ${offer.brand} added to trip pot.`,
    );
  };

  return (
    <View>
      <Text style={[styles.section, { color: c.textSecondary }]}>Travel deals · trip pot</Text>
      {AFFILIATE_OFFERS.map((o) => (
        <Pressable key={o.id} onPress={() => openOffer(o.id)}>
          <SoftCard style={styles.row}>
            <View style={[styles.badge, { backgroundColor: c.accent }]}>
              <Text style={[styles.pct, { color: c.accentInk }]}>{o.cashbackPct}%</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: c.text }]}>
                {o.brand} · {o.title}
              </Text>
              <Text style={[styles.blurb, { color: c.textSecondary }]}>{o.blurb}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
          </SoftCard>
        </Pressable>
      ))}
      <Text style={[styles.hint, { color: c.textTertiary }]}>
        Specialty: book via Fairpay → cashback fuels the group pot
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    ...type.footnote,
    fontWeight: '700',
    marginBottom: space.sm,
    marginTop: space.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: { ...type.subheadline },
  title: { ...type.subheadline },
  blurb: { ...type.caption1, marginTop: 2 },
  hint: {
    ...type.caption1,
    marginTop: space.sm,
  },
});
