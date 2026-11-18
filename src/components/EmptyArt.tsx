import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '@/store/theme';

type Kind = 'groups' | 'spend' | 'people' | 'welcome';

type Props = {
  kind?: Kind;
  width?: number;
  height?: number;
};

/**
 * High-precision, minimalist fintech vector illustrations.
 * Clean geometry, glassmorphic cards, crisp subtle shadows.
 */
export function EmptyArt({ kind = 'groups', width = 160, height = 120 }: Props) {
  const c = useColors();

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height} viewBox="0 0 160 120">
        <Defs>
          {/* Card Gradient */}
          <LinearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#1E293B" stopOpacity="0.95" />
            <Stop offset="1" stopColor="#0F172A" stopOpacity="1" />
          </LinearGradient>

          {/* Accent Glass Gradient */}
          <LinearGradient id="accentGlow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c.accent} stopOpacity="0.4" />
            <Stop offset="1" stopColor="#38BDF8" stopOpacity="0.15" />
          </LinearGradient>

          {/* Subtle Grid Dot */}
          <LinearGradient id="mintGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={c.accent} stopOpacity="1" />
            <Stop offset="1" stopColor="#4ADE80" stopOpacity="0.9" />
          </LinearGradient>
        </Defs>

        {/* Ambient base shadow / glow */}
        <Circle cx="80" cy="60" r="50" fill="url(#accentGlow)" opacity={0.6} />

        {kind === 'groups' || kind === 'welcome' ? (
          <>
            {/* Background floating card (angled) */}
            <Rect
              x="46"
              y="22"
              width="82"
              height="54"
              rx="12"
              fill="#334155"
              opacity={0.35}
              transform="rotate(6, 87, 49)"
            />

            {/* Main Foreground Sleek Dark Card */}
            <Rect
              x="34"
              y="30"
              width="92"
              height="58"
              rx="12"
              fill="url(#cardGrad)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />

            {/* Smart EMV Chip */}
            <Rect x="46" y="42" width="14" height="11" rx="3" fill="#FBBF24" opacity={0.9} />
            <Path d="M46 47h14M53 42v11" stroke="#92400E" strokeWidth="0.75" />

            {/* Contactless wave */}
            <Path
              d="M66 43c2 2 2 7 0 9M70 41c3.5 3.5 3.5 11 0 13"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Electric mint balance bar */}
            <Rect x="46" y="64" width="42" height="5" rx="2.5" fill="url(#mintGrad)" />
            <Rect x="92" y="64" width="22" height="5" rx="2.5" fill="rgba(255,255,255,0.2)" />

            {/* Floating Live Sync Pill */}
            <Rect x="88" y="14" width="46" height="22" rx="11" fill="#0A0A0A" stroke={c.accent} strokeWidth="1" />
            <Circle cx="98" cy="25" r="3.5" fill={c.accent} />
            <Path d="M106 25h18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : null}

        {kind === 'spend' ? (
          <>
            {/* Sleek Digital Receipt / Ledger Card */}
            <Rect
              x="42"
              y="18"
              width="76"
              height="84"
              rx="12"
              fill="url(#cardGrad)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />

            {/* Receipt header bar */}
            <Rect x="54" y="30" width="32" height="6" rx="3" fill="url(#mintGrad)" />
            <Circle cx="106" cy="33" r="5" fill="#38BDF8" opacity={0.8} />

            {/* Ledger items */}
            <Rect x="54" y="44" width="52" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
            <Rect x="54" y="54" width="38" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
            <Rect x="54" y="64" width="46" height="4" rx="2" fill="rgba(255,255,255,0.2)" />

            {/* Dotted divider */}
            <Path d="M52 76h56" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Total / Verified Check pill */}
            <Rect x="54" y="83" width="28" height="5" rx="2.5" fill={c.accent} />
            <Circle cx="100" cy="85.5" r="7" fill={c.accent} />
            <Path d="M97.5 85.5l1.8 1.8 3.5-3.5" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        ) : null}

        {kind === 'people' ? (
          <>
            {/* Interconnected Member Nodes */}
            {/* Center link lines */}
            <Path d="M52 52L80 38L108 52" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
            <Path d="M80 38v38" stroke={c.accent} strokeWidth="1.5" opacity={0.6} />

            {/* Node 1: Left */}
            <Circle cx="50" cy="54" r="18" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" />
            <Circle cx="50" cy="50" r="6" fill="#38BDF8" />
            <Path d="M40 64c0-4 4.5-6 10-6s10 2 10 6" fill="#38BDF8" opacity={0.6} />

            {/* Node 2: Top (You / Admin) */}
            <Circle cx="80" cy="36" r="20" fill="#0A0A0A" stroke={c.accent} strokeWidth="2.5" />
            <Circle cx="80" cy="32" r="7" fill={c.accent} />
            <Path d="M68 47c0-4.5 5.4-7 12-7s12 2.5 12 7" fill={c.accent} opacity={0.8} />

            {/* Node 3: Right */}
            <Circle cx="110" cy="54" r="18" fill="#1E293B" stroke="#A855F7" strokeWidth="2" />
            <Circle cx="110" cy="50" r="6" fill="#A855F7" />
            <Path d="M100 64c0-4 4.5-6 10-6s10 2 10 6" fill="#A855F7" opacity={0.6} />

            {/* Bottom Settle Complete Pill */}
            <Rect x="55" y="80" width="50" height="20" rx="10" fill="#0A0A0A" stroke="#334155" strokeWidth="1" />
            <Path d="M68 90l3 3 6-6" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Circle cx="88" cy="90" r="2.5" fill="rgba(255,255,255,0.7)" />
            <Circle cx="95" cy="90" r="2.5" fill="rgba(255,255,255,0.4)" />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
