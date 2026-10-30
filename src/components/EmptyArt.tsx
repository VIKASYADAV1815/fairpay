import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '@/store/theme';

type Kind = 'groups' | 'spend' | 'people' | 'welcome';

type Props = {
  kind?: Kind;
  width?: number;
  height?: number;
};

/**
 * Soft flat illustrations (no stock photos) — iOS empty-state energy.
 */
export function EmptyArt({ kind = 'groups', width = 160, height = 120 }: Props) {
  const c = useColors();

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height} viewBox="0 0 160 120">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.accent} stopOpacity="0.35" />
            <Stop offset="1" stopColor="#7DD3FC" stopOpacity="0.2" />
          </LinearGradient>
          <LinearGradient id="card" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
            <Stop offset="1" stopColor={c.accent} stopOpacity="0.55" />
          </LinearGradient>
        </Defs>

        <Ellipse cx="80" cy="98" rx="54" ry="10" fill={c.fillSecondary} opacity={0.9} />

        {kind === 'groups' || kind === 'welcome' ? (
          <>
            <Rect x="28" y="28" width="70" height="52" rx="14" fill="url(#card)" />
            <Rect x="38" y="40" width="36" height="6" rx="3" fill={c.accentInk} opacity={0.2} />
            <Rect x="38" y="52" width="24" height="6" rx="3" fill={c.accentInk} opacity={0.12} />
            <Circle cx="118" cy="44" r="22" fill="url(#sky)" />
            <Circle cx="110" cy="44" r="10" fill={c.accent} />
            <Circle cx="126" cy="44" r="10" fill="#7DD3FC" />
            <Circle cx="118" cy="52" r="10" fill="#F9A8D4" />
            <Path
              d="M52 78c8-14 28-14 36 0"
              stroke={c.accentInk}
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
              opacity={0.25}
            />
          </>
        ) : null}

        {kind === 'spend' ? (
          <>
            <Rect x="40" y="22" width="80" height="68" rx="16" fill="url(#card)" />
            <Rect x="54" y="36" width="52" height="8" rx="4" fill={c.accent} />
            <Rect x="54" y="52" width="36" height="6" rx="3" fill={c.accentInk} opacity={0.15} />
            <Rect x="54" y="64" width="44" height="6" rx="3" fill={c.accentInk} opacity={0.1} />
            <Circle cx="122" cy="30" r="14" fill="#FDE68A" />
            <Path
              d="M116 30h12M122 24v12"
              stroke={c.accentInk}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </>
        ) : null}

        {kind === 'people' ? (
          <>
            <Circle cx="56" cy="48" r="20" fill={c.accent} />
            <Circle cx="80" cy="40" r="22" fill="#7DD3FC" />
            <Circle cx="104" cy="48" r="20" fill="#F9A8D4" />
            <Ellipse cx="56" cy="78" rx="18" ry="10" fill={c.accent} opacity={0.55} />
            <Ellipse cx="80" cy="74" rx="20" ry="12" fill="#7DD3FC" opacity={0.55} />
            <Ellipse cx="104" cy="78" rx="18" ry="10" fill="#F9A8D4" opacity={0.55} />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
