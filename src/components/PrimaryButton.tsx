import { Pressable, Text, StyleSheet, type PressableProps } from 'react-native';
import { useColors } from '@/store/theme';
import { radius, space, type } from '@/theme/tokens';

type Props = PressableProps & {
  label: string;
  variant?: 'black' | 'accent';
};

export function PrimaryButton({ label, disabled, variant = 'black', style, ...rest }: Props) {
  const c = useColors();
  const accent = variant === 'accent';

  return (
    <Pressable
      style={(state) => [
        styles.button,
        {
          backgroundColor: accent ? c.accent : c.text,
        },
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <Text
        style={[
          styles.label,
          { color: accent ? c.accentInk : c.bg },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    ...type.headline,
  },
});
