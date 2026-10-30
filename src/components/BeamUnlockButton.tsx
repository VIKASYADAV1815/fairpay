import { useEffect } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/theme';
import { radius, space, type } from '@/theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  size?: 'default' | 'compact';
  tone?: 'white' | 'neon' | 'dark';
};

/**
 * Unlock CTA — glossy tilted shimmer (no beam), soft rounded rect.
 */
export function BeamUnlockButton({
  label,
  onPress,
  size = 'default',
  tone = 'neon',
}: Props) {
  const c = useColors();
  const compact = size === 'compact';
  const w = useSharedValue(200);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = 0;
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.cubic) }),
      -1,
      false,
    );
  }, [shimmer]);

  const onLayout = (e: LayoutChangeEvent) => {
    w.value = e.nativeEvent.layout.width;
  };

  /** Wide soft gloss sheet */
  const glossWide = useAnimatedStyle(() => {
    const travel = w.value + 200;
    return {
      transform: [
        { translateX: -120 + shimmer.value * travel },
        { rotate: '-20deg' },
      ],
      opacity: 0.15 + Math.sin(shimmer.value * Math.PI) * 0.55,
    };
  });

  /** Thin bright specular highlight on top */
  const glossThin = useAnimatedStyle(() => {
    const travel = w.value + 200;
    return {
      transform: [
        { translateX: -40 + shimmer.value * travel },
        { rotate: '-20deg' },
      ],
      opacity: 0.35 + Math.sin(shimmer.value * Math.PI) * 0.65,
    };
  });

  const bg =
    tone === 'white' ? '#FFFFFF' : tone === 'dark' ? c.accentInk : c.accent;
  const fg =
    tone === 'white' ? c.accentInk : tone === 'dark' ? c.accent : c.accentInk;

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.wrap,
        compact && styles.wrapCompact,
        { backgroundColor: bg, borderRadius: compact ? 14 : radius.xl },
        pressed && styles.pressed,
      ]}
    >
      {/* Soft wide gloss */}
      <Animated.View pointerEvents="none" style={[styles.glossWide, glossWide]}>
        <Svg width={110} height={140}>
          <Defs>
            <LinearGradient id="glossWide" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0.12" />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.55" />
              <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.12" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect width={110} height={140} fill="url(#glossWide)" />
        </Svg>
      </Animated.View>

      {/* Sharp specular streak — the glossy feel */}
      <Animated.View pointerEvents="none" style={[styles.glossThin, glossThin]}>
        <Svg width={28} height={140}>
          <Defs>
            <LinearGradient id="glossThin" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.35" />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="0.65" stopColor="#FFFFFF" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect width={28} height={140} fill="url(#glossThin)" />
        </Svg>
      </Animated.View>

      <View style={[styles.content, compact ? styles.contentCompact : styles.contentDefault]}>
        <Text
          style={[compact ? styles.labelCompact : styles.label, { color: fg }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Ionicons name="arrow-forward" size={compact ? 15 : 18} color={fg} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapCompact: {
    flex: 1,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  glossWide: {
    position: 'absolute',
    top: -50,
    width: 110,
    height: 140,
  },
  glossThin: {
    position: 'absolute',
    top: -50,
    width: 28,
    height: 140,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1,
  },
  contentDefault: {
    paddingVertical: 16,
    paddingHorizontal: space.xxl,
  },
  contentCompact: {
    paddingVertical: 12,
    paddingHorizontal: space.lg,
  },
  label: {
    ...type.headline,
    fontWeight: '700',
  },
  labelCompact: {
    ...type.footnote,
    fontWeight: '700',
  },
});
