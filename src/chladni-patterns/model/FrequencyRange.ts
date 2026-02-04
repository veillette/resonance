/**
 * FrequencyRange.ts
 *
 * Defines the available frequency ranges for the Chladni pattern simulation.
 * Each range allows the user to explore patterns at different frequency scales.
 */

import { Range } from "scenerystack/dot";

export interface FrequencyRangeProperties {
  readonly label: string;
  readonly range: Range;
}

/**
 * Available frequency ranges for the simulation.
 * Different ranges reveal different pattern structures.
 */
export const FrequencyRange = {
  LOW: {
    label: "50 - 1000 Hz",
    range: new Range(50, 1000),
  },
  MID_LOW: {
    label: "1000 - 2000 Hz",
    range: new Range(1000, 2000),
  },
  MID_HIGH: {
    label: "2000 - 3000 Hz",
    range: new Range(2000, 3000),
  },
  HIGH: {
    label: "3000 - 4000 Hz",
    range: new Range(3000, 4000),
  },
} as const;

export type FrequencyRangeType =
  (typeof FrequencyRange)[keyof typeof FrequencyRange];

/**
 * Get all available frequency ranges as an array for UI iteration.
 */
export const FREQUENCY_RANGES: readonly FrequencyRangeType[] = [
  FrequencyRange.LOW,
  FrequencyRange.MID_LOW,
  FrequencyRange.MID_HIGH,
  FrequencyRange.HIGH,
];
