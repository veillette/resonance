/**
 * ResonatorConfigMode - Defines how resonator parameters are distributed
 * across multiple resonators.
 *
 * - SAME_MASS: All resonators share the same mass; spring constants increase (k, 2k, 3k, ...)
 * - SAME_SPRING_CONSTANT: All resonators share the same spring constant; masses increase (m, 2m, 3m, ...)
 * - MIXED: Both masses and spring constants vary across resonators (m, 2m, 3m, ... and k, 2k, 3k, ...)
 * - SAME_FREQUENCY: All resonators have the same natural frequency (k/m ratio constant)
 * - CUSTOM: Each resonator can be independently configured
 */
export const ResonatorConfigMode = {
  SAME_MASS: 'sameMass',
  SAME_SPRING_CONSTANT: 'sameSpringConstant',
  MIXED: 'mixed',
  SAME_FREQUENCY: 'sameFrequency',
  CUSTOM: 'custom'
} as const;

export type ResonatorConfigModeType = typeof ResonatorConfigMode[keyof typeof ResonatorConfigMode];
