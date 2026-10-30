import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors } from '@/store/theme';
import { radius, space, type } from '@/theme/tokens';
import { enter } from '@/theme/motion';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  highlight?: boolean;
  delay?: number;
};

export function ActionTile({ icon, label, onPress, highlight, delay = 0 }: Props) {
  const c = useColors();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14, scale: 0.96 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={enter(delay)}
      style={{ flex: 1 }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          { backgroundColor: highlight ? c.accent : c.fill },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={22} color={highlight ? c.accentInk : c.text} />
        </View>
        <Text style={[styles.label, { color: highlight ? c.accentInk : c.text }]}>
          {label}
        </Text>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderWidth: 0,
    minHeight: 92,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...type.footnote,
    fontWeight: '700',
  },
});
