/* eslint-disable @typescript-eslint/no-explicit-any */
/** Smoother Moti / Reanimated transitions */

export const timing = (duration = 520, delay = 0): any => ({
  type: 'timing',
  duration,
  delay,
});

export const spring = (damping = 18, stiffness = 160, delay = 0): any => ({
  type: 'spring',
  damping,
  stiffness,
  mass: 0.85,
  delay,
});

/** Soft entrance used across screens */
export const enter = (delay = 0): any => spring(20, 140, delay);
