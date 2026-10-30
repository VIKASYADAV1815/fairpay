import { MotiView } from 'moti';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { enter } from '@/theme/motion';

type Props = {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  fromY?: number;
};

/** Smooth Moti entrance (Framer-like spring) */
export function FadeIn({ children, delay = 0, style, fromY = 18 }: Props) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: fromY, scale: 0.98 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={enter(delay)}
      style={style}
    >
      {children}
    </MotiView>
  );
}
