import { View, StyleSheet, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useColors, useThemeStore } from '@/store/theme';
import { radius, space } from '@/theme/tokens';

type Props = ViewProps & {
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: 'fill' | 'white' | 'accent';
};

export function SoftCard({ style, padded = true, tone = 'fill', children, ...rest }: Props) {
  const c = useColors();
  const darkMode = useThemeStore((s) => s.darkMode);

  // Dark mode: never flood the screen with neon — muted olive surface instead
  const bg =
    tone === 'accent'
      ? darkMode
        ? c.accentSoft
        : c.accent
      : tone === 'white'
        ? c.card
        : c.fill;

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: bg },
        darkMode && tone !== 'accent' && styles.darkLift,
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 0,
  },
  /** Soft edge so cards read on charcoal dark bg */
  darkLift: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  padded: {
    padding: space.lg,
  },
});
