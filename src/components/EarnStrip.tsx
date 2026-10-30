import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BeamUnlockButton } from '@/components/BeamUnlockButton';
import { useProStore } from '@/store/pro';
import { useTripStore } from '@/store/trips';
import { useColors, useThemeStore } from '@/store/theme';
import { formatMoney } from '@/lib/currency';
import { PRO_PRICE_LABEL } from '@/store/pro';
import { radius, space, type } from '@/theme/tokens';

/** Home earn surface — neutral premium card, thin grey border (no green fill) */
export function EarnStrip() {
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  const isPro = useProStore((s) => s.isPro);
  const pot = useTripStore((s) =>
    s.trips.reduce((n, t) => n + (t.potCashback || 0), 0),
  );

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: darkMode ? c.fill : c.card,
          borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.14)',
        },
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: c.accent }]}>
          <Ionicons name="diamond" size={16} color={c.accentInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: c.textSecondary }]}>
            EARN · PRO · DEALS
          </Text>
          <Text style={[styles.title, { color: c.text }]}>
            {isPro ? 'Pro active' : `Fairpay Pro · ${PRO_PRICE_LABEL}`}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: c.text }]}>
            {formatMoney(pot, 'INR')}
          </Text>
          <Text style={[styles.statLbl, { color: c.textSecondary }]}>Group pot</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: c.separator }]} />
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: c.text }]}>{isPro ? 'On' : 'Off'}</Text>
          <Text style={[styles.statLbl, { color: c.textSecondary }]}>Cashback track</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {isPro ? (
          <Pressable
            style={[styles.btn, { backgroundColor: c.accentInk }]}
            onPress={() => router.push('/pro')}
          >
            <Text style={[styles.btnText, { color: c.accent }]}>Manage Pro</Text>
          </Pressable>
        ) : (
          <BeamUnlockButton
            label="Unlock Pro"
            size="compact"
            tone="dark"
            onPress={() => router.push('/pro')}
          />
        )}
        <Pressable
          style={[
            styles.btnGhost,
            {
              backgroundColor: darkMode ? c.fillSecondary : c.fill,
              borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            },
          ]}
          onPress={() => router.push('/deals')}
        >
          <Text style={[styles.btnText, { color: c.text }]}>Browse deals</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { ...type.caption2, fontWeight: '800', letterSpacing: 0.6 },
  title: { ...type.subheadline, marginTop: 2 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.lg,
    marginBottom: space.lg,
  },
  stat: { flex: 1 },
  statVal: { ...type.title3 },
  statLbl: { ...type.caption1, marginTop: 2 },
  divider: { width: 1, height: 36, marginHorizontal: space.md },
  actions: { flexDirection: 'row', gap: space.sm, alignItems: 'stretch' },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnText: { ...type.footnote, fontWeight: '700' },
});
