import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/store/theme';

type Props = {
  /** Full wordmark width; height scales from viewBox 240×64 */
  width?: number;
  /** Mark-only (geometric F) */
  markOnly?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Fairpay logo from src/logo.svg
 * Mark: F + neon middle bar + wordmark + accent dot
 */
export function FairpayLogo({ width = 148, markOnly = false, style }: Props) {
  const c = useColors();
  const ink = c.text;

  if (markOnly) {
    return (
      <View style={[{ width, height: width }, style]}>
        <Svg width={width} height={width} viewBox="0 0 44 64">
          <Rect x={8} y={12} width={10} height={40} rx={4} fill={ink} />
          <Rect x={8} y={12} width={28} height={10} rx={4} fill={ink} />
          <Rect x={8} y={27} width={22} height={10} rx={4} fill={c.accent} />
        </Svg>
      </View>
    );
  }

  const height = (width * 64) / 240;
  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox="0 0 240 64">
        <Rect x={8} y={12} width={10} height={40} rx={4} fill={ink} />
        <Rect x={8} y={12} width={28} height={10} rx={4} fill={ink} />
        <Rect x={8} y={27} width={22} height={10} rx={4} fill={c.accent} />
        <SvgText
          x={52}
          y={44}
          fontSize={32}
          fontWeight="800"
          fill={ink}
          letterSpacing={-1.2}
        >
          Fairpay
        </SvgText>
        <Circle cx={184} cy={40} r={4.5} fill={c.accent} />
      </Svg>
    </View>
  );
}

/** Compact F mark for avatars / app icon-style spots */
export function FairpayMark({ size = 36, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <View
      style={[
        styles.markWrap,
        { width: size, height: size, borderRadius: size * 0.32, backgroundColor: c.fill },
        style,
      ]}
    >
      <Svg width={size * 0.72} height={size * 0.72} viewBox="4 8 40 48">
        <Rect x={8} y={12} width={10} height={40} rx={4} fill={c.text} />
        <Rect x={8} y={12} width={28} height={10} rx={4} fill={c.text} />
        <Rect x={8} y={27} width={22} height={10} rx={4} fill={c.accent} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
