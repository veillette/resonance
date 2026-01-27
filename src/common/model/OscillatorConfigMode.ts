/**
 * OscillatorConfigMode - Defines how oscillator parameters are distributed
 * across multiple resonators.
 *
 * - SAME_MASS: All oscillators share the same mass; spring constants increase (k, 2k, 3k, ...)
 * - SAME_SPRING_CONSTANT: All oscillators share the same spring constant; masses increase (m, 2m, 3m, ...)
 * - MIXED: Both masses and spring constants vary across oscillators (m, 2m, 3m, ... and k, 2k, 3k, ...)
 * - SAME_FREQUENCY: All oscillators have the same natural frequency (k/m ratio constant)
 * - CUSTOM: Each oscillator can be independently configured
 */
export const OscillatorConfigMode = {
  SAME_MASS: 'sameMass',
  SAME_SPRING_CONSTANT: 'sameSpringConstant',
  MIXED: 'mixed',
  SAME_FREQUENCY: 'sameFrequency',
  CUSTOM: 'custom'
} as const;

export type OscillatorConfigModeType = typeof OscillatorConfigMode[keyof typeof OscillatorConfigMode];
