import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { SoftCard } from '@/components/SoftCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FadeIn } from '@/components/FadeIn';
import { transferKey, useTripStore } from '@/store/trips';
import { useProStore } from '@/store/pro';
import { useColors } from '@/store/theme';
import { computeBalances, minimizeTransfers, type Transfer } from '@/lib/settle';
import {
  buildPayLink,
  buildWhatsAppSettleMessage,
  openWhatsAppWithMessage,
} from '@/lib/settlePay';
import { formatMoney } from '@/lib/currency';
import { settleHint } from '@/lib/payments';
import { space, type } from '@/theme/tokens';
import { enter } from '@/theme/motion';

export default function SettleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const trip = useTripStore((s) => s.trips.find((t) => t.id === id));
  const markTransferPaid = useTripStore((s) => s.markTransferPaid);
  const unmarkTransferPaid = useTripStore((s) => s.unmarkTransferPaid);
  const isPro = useProStore((s) => s.isPro);

  const balances = useMemo(
    () => (trip ? computeBalances(trip.members, trip.expenses) : []),
    [trip],
  );
  const transfers = useMemo(() => minimizeTransfers(balances), [balances]);

  const paidKeys = useMemo(() => {
    const set = new Set<string>();
    trip?.paidTransfers.forEach((p) => set.add(transferKey(p.fromId, p.toId, p.amount)));
    return set;
  }, [trip]);

  const unpaid = useMemo(
    () => transfers.filter((t) => !paidKeys.has(transferKey(t.fromId, t.toId, t.amount))),
    [transfers, paidKeys],
  );
  const paid = useMemo(
    () => transfers.filter((t) => paidKeys.has(transferKey(t.fromId, t.toId, t.amount))),
    [transfers, paidKeys],
  );

  if (!trip) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top + space.xl }]}>
        <Text style={[styles.missing, { color: c.text }]}>Group not found</Text>
      </View>
    );
  }

  const notifyOne = async (t: Transfer) => {
    const method = t.toPayMethod;
    const payLink = buildPayLink({
      method,
      payeeName: t.toName,
      amount: t.amount,
      note: trip.name,
    });

    if (!method?.handle) {
      Alert.alert(
        'No pay method',
        `Add a pay method for ${t.toName} (UPI, PayPal, Venmo…) so the link auto-fills. Message will still open.`,
      );
    }

    const message = buildWhatsAppSettleMessage({
      debtorName: t.fromName,
      creditorName: t.toName,
      amount: t.amount,
      tripName: trip.name,
      currency: trip.currency,
      method,
      payLink,
    });
    await openWhatsAppWithMessage(message);
  };

  const notifyAll = async () => {
    if (!isPro) {
      Alert.alert('Fairpay Pro', 'Batch WhatsApp settle is a Pro feature.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'See Pro', onPress: () => router.push('/pro') },
      ]);
      return;
    }
    for (const t of unpaid) {
      await notifyOne(t);
    }
  };

  const togglePaid = (t: Transfer) => {
    const key = transferKey(t.fromId, t.toId, t.amount);
    const existing = trip.paidTransfers.find(
      (p) => transferKey(p.fromId, p.toId, p.amount) === key,
    );
    if (existing) {
      unmarkTransferPaid(trip.id, existing.id);
    } else {
      markTransferPaid(trip.id, {
        fromId: t.fromId,
        toId: t.toId,
        amount: t.amount,
      });
    }
  };

  const allClear = transfers.length === 0 || unpaid.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Settle up</Text>
        <Pressable hitSlop={12} style={styles.iconBtn} onPress={() => router.push('/pro')}>
          <Ionicons name="diamond-outline" size={20} color={c.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <FadeIn>
          <Text style={[styles.heroLabel, { color: c.textSecondary }]}>{trip.name}</Text>
          <Text style={[styles.heroTitle, { color: c.text }]}>
            {allClear ? 'All clear' : `${unpaid.length} left to pay`}
          </Text>
          <Text style={[styles.heroSub, { color: c.textSecondary }]}>
            {paid.length > 0
              ? `${paid.length} marked paid · WhatsApp settle`
              : 'Minimized transfers · WhatsApp settle'}
          </Text>
        </FadeIn>

        {allClear && transfers.length > 0 ? (
          <FadeIn delay={40}>
            <SoftCard tone="accent" style={{ marginBottom: space.xxl }}>
              <Text style={[styles.clearTitle, { color: c.accentInk }]}>Settled ✓</Text>
              <Text style={[styles.clearBody, { color: c.accentInk }]}>
                Every transfer is marked paid. Nice work.
              </Text>
            </SoftCard>
          </FadeIn>
        ) : null}

        <Text style={[styles.section, { color: c.textSecondary }]}>Balances</Text>
        {balances.map((b, i) => (
          <MotiView
            key={b.memberId}
            transition={enter(i * 40)}
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
          >
            <SoftCard style={styles.balanceRow}>
              <Text style={[styles.balName, { color: c.text }]}>{b.name}</Text>
              <Text
                style={[
                  styles.balNet,
                  { color: b.net >= 0 ? c.accentInk : c.danger },
                ]}
              >
                {b.net >= 0 ? '+' : '−'}
                {formatMoney(Math.abs(b.net), trip.currency).replace(/^[^\d−-]+/, '')}
              </Text>
            </SoftCard>
          </MotiView>
        ))}

        <Text style={[styles.section, { color: c.textSecondary, marginTop: space.xxl }]}>
          Who pays whom
        </Text>
        {transfers.length === 0 ? (
          <SoftCard tone="accent">
            <Text style={[styles.clearTitle, { color: c.accentInk }]}>Nothing to settle</Text>
            <Text style={[styles.clearBody, { color: c.accentInk }]}>
              Everyone is even in this group.
            </Text>
          </SoftCard>
        ) : (
          unpaid.map((t, i) => (
            <MotiView
              key={`u-${t.fromId}-${t.toId}-${i}`}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={enter(60 + i * 45)}
            >
              <SoftCard style={styles.transferCard}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.transferTitle, { color: c.text }]}>
                    {t.fromName} → {t.toName}
                  </Text>
                  <Text style={[styles.transferAmt, { color: c.text }]}>
                    {formatMoney(t.amount, trip.currency)}
                  </Text>
                  <Text style={[styles.transferMeta, { color: c.textSecondary }]}>
                    {settleHint(t.toPayMethod)}
                  </Text>
                </View>
                <View style={styles.actionsCol}>
                  <Pressable
                    style={[styles.notifyBtn, { backgroundColor: c.accent }]}
                    onPress={() => notifyOne(t)}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color={c.accentInk} />
                    <Text style={[styles.notifyText, { color: c.accentInk }]}>Notify</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.paidBtn, { backgroundColor: c.fill }]}
                    onPress={() => togglePaid(t)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color={c.text} />
                    <Text style={[styles.paidText, { color: c.text }]}>Paid</Text>
                  </Pressable>
                </View>
              </SoftCard>
            </MotiView>
          ))
        )}

        {paid.length > 0 ? (
          <>
            <Text style={[styles.section, { color: c.textSecondary, marginTop: space.xxl }]}>
              Marked paid
            </Text>
            {paid.map((t, i) => (
              <MotiView
                key={`p-${t.fromId}-${t.toId}-${i}`}
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={enter(40 + i * 30)}
              >
                <SoftCard style={[styles.transferCard, styles.paidCard]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.transferTitle, { color: c.text }]}>
                      {t.fromName} → {t.toName}
                    </Text>
                    <Text style={[styles.transferMeta, { color: c.textSecondary }]}>
                      {formatMoney(t.amount, trip.currency)} · done
                    </Text>
                  </View>
                  <Pressable onPress={() => togglePaid(t)} hitSlop={8}>
                    <Ionicons name="checkmark-circle" size={28} color={c.accentInk} />
                  </Pressable>
                </SoftCard>
              </MotiView>
            ))}
          </>
        ) : null}

        {trip.potCashback > 0 ? (
          <SoftCard tone="accent" style={{ marginTop: space.xl }}>
            <Text style={[styles.clearTitle, { color: c.accentInk }]}>
              Group pot · {formatMoney(trip.potCashback, trip.currency)}
            </Text>
            <Text style={[styles.clearBody, { color: c.accentInk }]}>
              Affiliate cashback credited here
            </Text>
          </SoftCard>
        ) : null}
      </ScrollView>

      {unpaid.length > 0 ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
          <PrimaryButton
            label={isPro ? 'Notify all unpaid' : 'Batch notify · Pro'}
            variant="accent"
            onPress={notifyAll}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
    marginBottom: space.xl,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...type.headline },
  heroLabel: { ...type.footnote },
  heroTitle: { ...type.largeTitle, marginTop: 4 },
  heroSub: {
    ...type.caption1,
    marginTop: 6,
    marginBottom: space.xxl,
  },
  section: {
    ...type.footnote,
    fontWeight: '700',
    marginBottom: space.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  balName: { ...type.subheadline },
  balNet: { ...type.headline },
  transferCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  paidCard: { opacity: 0.72 },
  transferTitle: { ...type.subheadline },
  transferAmt: { ...type.title3, marginTop: 2 },
  transferMeta: { ...type.caption1, marginTop: 2 },
  actionsCol: { gap: 8, alignItems: 'stretch' },
  notifyBtn: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
  },
  notifyText: { ...type.caption2, fontWeight: '700' },
  paidBtn: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  paidText: { ...type.caption2, fontWeight: '700' },
  clearTitle: { ...type.title3 },
  clearBody: { ...type.footnote, marginTop: 4, opacity: 0.8 },
  footer: { paddingTop: space.md },
  missing: { ...type.title2 },
});
