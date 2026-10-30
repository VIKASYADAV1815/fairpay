import { Text, StyleSheet } from 'react-native';
import { useColors } from '@/store/theme';
import { space, type } from '@/theme/tokens';

type Props = {
  children: string;
  style?: object;
};

/** Consistent section eyebrow across screens */
export function SectionLabel({ children, style }: Props) {
  const c = useColors();
  return (
    <Text style={[styles.label, { color: c.textSecondary }, style]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  label: {
    ...type.footnote,
    fontWeight: '700',
    marginBottom: space.sm,
    marginLeft: 2,
  },
});
