/**
 * ChladniConstants.ts
 *
 * Physics and configuration constants for the Chladni plate simulation.
 * Extracted from ChladniModel for better organization and reusability.
 */

import { Range } from "scenerystack/dot";

// ============================================================================
// MATHEMATICAL CONSTANTS
// ============================================================================

export const TWO_PI = Math.PI * 2;

// ============================================================================
// PHYSICAL CONSTANTS
// ============================================================================

/**
 * Default physical plate dimensions in meters.
 * These affect wave number calculations and resonant frequencies.
 * For a rectangular plate, width (a) is along x-axis, height (b) is along y-axis.
 */
export const DEFAULT_PLATE_WIDTH = 0.32; // meters
export const DEFAULT_PLATE_HEIGHT = 0.32; // meters

/**
 * Plate size constraints
 */
export const MIN_PLATE_SIZE_RATIO = 0.5;
export const MIN_PLATE_WIDTH = DEFAULT_PLATE_WIDTH * MIN_PLATE_SIZE_RATIO;
export const MIN_PLATE_HEIGHT = DEFAULT_PLATE_HEIGHT * MIN_PLATE_SIZE_RATIO;

/**
 * Damping coefficient for the plate vibration (dimensionless).
 * gamma = DAMPING_COEFFICIENT / sqrt(a * b)
 */
export const DAMPING_COEFFICIENT = 0.02;

// ============================================================================
// FREQUENCY PARAMETERS
// ============================================================================

export const FREQUENCY_MIN = 50;
export const FREQUENCY_MAX = 4000;
export const FREQUENCY_DEFAULT = 500;
export const FREQUENCY_RANGE = new Range(FREQUENCY_MIN, FREQUENCY_MAX);

/**
 * Frequency sweep rate (Hz per second).
 * Full range is 3950 Hz (50-4000), so ~66 Hz/s gives ~60 second sweep.
 */
export const SWEEP_RATE = 66;

// ============================================================================
// MODAL CALCULATION PARAMETERS
// ============================================================================

/**
 * Maximum mode number for modal superposition (m, n = 0, 1, 2, ..., MAX_MODE)
 */
export const MAX_MODE = 16;

/**
 * Mode step size: 1 = all modes (for off-center excitation), 2 = even modes only
 */
export const MODE_STEP = 1;

/**
 * Threshold for skipping modes with negligible source contribution
 */
export const SOURCE_THRESHOLD = 0.001;
export const SOURCE_THRESHOLD_SQUARED = SOURCE_THRESHOLD * SOURCE_THRESHOLD;

/**
 * Normalization factor for rectangular plate mode shapes: (2/√(ab))² = 4/(ab)
 */
export const NORMALIZATION_NUMERATOR = 4;

// ============================================================================
// PARTICLE ANIMATION PARAMETERS
// ============================================================================

/**
 * Scale factor for particle step size, tuned to match Roussel's pixel-based behavior.
 * Roussel: 5*psi pixels on ~480px plate ≈ 0.01*psi fraction of plate
 * Here: PARTICLE_STEP_SCALE * psi * STEP_TIME_SCALE meters on 0.32m plate
 */
export const PARTICLE_STEP_SCALE = 0.3;

/**
 * Time scaling factor for step size calculation
 */
export const STEP_TIME_SCALE = 0.01;

/**
 * Target frame rate for normalizing time-based calculations
 */
export const TARGET_FPS = 60;

// ============================================================================
// EXCITATION PARAMETERS
// ============================================================================

/**
 * Default excitation position (center of plate, in model coordinates).
 * Model uses centered coordinates: (0,0) is at plate center.
 */
export const DEFAULT_EXCITATION_X = 0;
export const DEFAULT_EXCITATION_Y = 0;

// ============================================================================
// RESONANCE CURVE GRAPH PARAMETERS
// ============================================================================

/**
 * Width of the visible window in the resonance curve graph (Hz)
 */
export const GRAPH_WINDOW_WIDTH = 500;

/**
 * Precomputed resonance curve resolution (samples per Hz)
 */
export const CURVE_SAMPLES_PER_HZ = 4;
export const TOTAL_CURVE_SAMPLES =
  (FREQUENCY_MAX - FREQUENCY_MIN) * CURVE_SAMPLES_PER_HZ;

// ============================================================================
// GRAIN COUNT OPTIONS
// ============================================================================

/**
 * Boundary handling mode: how particles behave at plate edges
 */
export type BoundaryMode = "clamp" | "remove";

/**
 * Default boundary handling mode
 */
export const DEFAULT_BOUNDARY_MODE: BoundaryMode = "clamp";

/**
 * Grain count option type for combo box
 */
export type GrainCountOption = {
  readonly value: number;
  readonly name: string;
};

/**
 * Available grain count options
 */
export const GRAIN_COUNT_OPTIONS: readonly GrainCountOption[] = [
  { value: 1000, name: "1000" },
  { value: 5000, name: "5000" },
  { value: 10000, name: "10000" },
  { value: 25000, name: "25000" },
] as const;

/**
 * Default grain count index in GRAIN_COUNT_OPTIONS array
 */
export const DEFAULT_GRAIN_COUNT_INDEX = 2; // 10,000
export const DEFAULT_GRAIN_COUNT = GRAIN_COUNT_OPTIONS[DEFAULT_GRAIN_COUNT_INDEX]!;

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * All Chladni constants bundled together for convenient importing
 */
const ChladniConstants = {
  // Math
  TWO_PI,

  // Plate dimensions
  DEFAULT_PLATE_WIDTH,
  DEFAULT_PLATE_HEIGHT,
  MIN_PLATE_SIZE_RATIO,
  MIN_PLATE_WIDTH,
  MIN_PLATE_HEIGHT,

  // Damping
  DAMPING_COEFFICIENT,

  // Frequency
  FREQUENCY_MIN,
  FREQUENCY_MAX,
  FREQUENCY_DEFAULT,
  FREQUENCY_RANGE,
  SWEEP_RATE,

  // Modal calculation
  MAX_MODE,
  MODE_STEP,
  SOURCE_THRESHOLD,
  SOURCE_THRESHOLD_SQUARED,
  NORMALIZATION_NUMERATOR,

  // Particle animation
  PARTICLE_STEP_SCALE,
  STEP_TIME_SCALE,
  TARGET_FPS,

  // Excitation
  DEFAULT_EXCITATION_X,
  DEFAULT_EXCITATION_Y,

  // Graph
  GRAPH_WINDOW_WIDTH,
  CURVE_SAMPLES_PER_HZ,
  TOTAL_CURVE_SAMPLES,

  // Boundary
  DEFAULT_BOUNDARY_MODE,

  // Grain count
  GRAIN_COUNT_OPTIONS,
  DEFAULT_GRAIN_COUNT_INDEX,
  DEFAULT_GRAIN_COUNT,
} as const;

export default ChladniConstants;
