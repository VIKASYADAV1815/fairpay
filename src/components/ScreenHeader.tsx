import type { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/store/theme';
import { space, type } from '@/theme/tokens';

type Props = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  showBack?: boolean;
};

export function ScreenHeader({ title, onBack, right, showBack = true }: Props) {
  const c = useColors();
  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right ?? <View style={styles.iconBtn} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
    marginBottom: space.xl,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.headline,
    flex: 1,
    textAlign: 'center',
  },
  right: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
});
