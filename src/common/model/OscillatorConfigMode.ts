/**
 * OscillatorConfigMode - Defines how oscillator parameters are distributed
 * across multiple resonators.
 *
 * - SAME_MASS: All oscillators share the same mass; spring constants increase (k, 2k, 3k, ...)
 * - SAME_SPRING_CONSTANT: All oscillators share the same spring constant; masses increase (m, 2m, 3m, ...)
 * - MIXED: Both masses and spring constants vary across oscillators
 */
export const OscillatorConfigMode = {
  SAME_MASS: 'sameMass',
  SAME_SPRING_CONSTANT: 'sameSpringConstant',
  MIXED: 'mixed'
} as const;

export type OscillatorConfigModeType = typeof OscillatorConfigMode[keyof typeof OscillatorConfigMode];
