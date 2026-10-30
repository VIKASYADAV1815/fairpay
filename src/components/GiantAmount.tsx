import { Text, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useColors } from '@/store/theme';
import { getCurrency, type CurrencyCode } from '@/lib/currency';
import { type } from '@/theme/tokens';
import { enter } from '@/theme/motion';

type Props = {
  amount: number;
  currency?: CurrencyCode | string | null;
  accent?: boolean;
  /** @deprecated use amount */
  rupees?: number;
};

export function GiantAmount({ amount, rupees, currency, accent = false }: Props) {
  const c = useColors();
  const value = amount ?? rupees ?? 0;
  const meta = getCurrency(currency);
  const whole = Math.floor(Math.abs(value)).toLocaleString(meta.locale);
  const cents =
    meta.decimals === 0
      ? null
      : Math.round((Math.abs(value) % 1) * 100)
          .toString()
          .padStart(2, '0');

  const ink = c.text;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(40)}
      style={styles.row}
    >
      <Text style={[styles.currency, { color: ink }]}>{meta.symbol}</Text>
      <Text style={[styles.whole, { color: ink }]}>{whole}</Text>
      {cents != null ? (
        <Text style={[styles.cents, { color: ink }]}>.{cents}</Text>
      ) : null}
      {accent ? <View style={[styles.dot, { backgroundColor: c.accent }]} /> : null}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currency: {
    ...type.hero,
    marginRight: 2,
  },
  whole: {
    ...type.hero,
  },
  cents: {
    ...type.heroCents,
    marginTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
    marginTop: 14,
  },
});
