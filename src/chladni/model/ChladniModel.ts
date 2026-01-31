/**
 * ChladniModel.ts
 *
 * Model for the Chladni plate pattern visualization.
 *
 * Physics:
 * - Chladni patterns form when particles on a vibrating plate migrate to nodal lines
 * - The displacement psi(x, y) is calculated using modal superposition
 * - Particles perform a biased random walk, moving faster in high-displacement regions
 *
 * The wave equation solution uses:
 * - Wave number k = sqrt(frequency / C) where C is the material dispersion constant
 * - Modal superposition over (m, n) modes with m, n = 0, 1, 2, ..., MAX_MODE
 * - For rectangular plate with dimensions a (width) × b (height):
 *   k_{m,n} = π√((m/a)² + (n/b)²)
 * - Damping term gamma = 0.02 / √(a*b) (geometric mean of dimensions)
 */

import { Property, NumberProperty, BooleanProperty } from "scenerystack/axon";
import { Vector2, Range } from "scenerystack/dot";
import { Material, MaterialType } from "./Material.js";

// Grain count options for the combo box
export type GrainCountOption = {
  readonly value: number;
  readonly name: string;
};

export const GRAIN_COUNT_OPTIONS: readonly GrainCountOption[] = [
  { value: 1000, name: "1000" },
  { value: 5000, name: "5000" },
  { value: 10000, name: "10000" },
  { value: 25000, name: "25000" },
] as const;

// Default grain count
const DEFAULT_GRAIN_COUNT = GRAIN_COUNT_OPTIONS[2]!; // 10,000

// Model coordinate system:
// - (0,0) is at the center of the plate
// - x ranges from -plateWidth/2 to +plateWidth/2
// - y ranges from -plateHeight/2 to +plateHeight/2
// - Positive Y is up (will be inverted in view)

// Default physical plate dimensions in meters (from original Chladni simulator)
// These affect wave number calculations and resonant frequencies
// For a rectangular plate, width (a) is along x-axis, height (b) is along y-axis
const DEFAULT_PLATE_WIDTH = 0.32;  // a - dimension along x
const DEFAULT_PLATE_HEIGHT = 0.32; // b - dimension along y

// Minimum plate size (half of default)
const MIN_PLATE_WIDTH = DEFAULT_PLATE_WIDTH / 2;
const MIN_PLATE_HEIGHT = DEFAULT_PLATE_HEIGHT / 2;

// Particle movement parameters
const PARTICLE_STEP_SCALE = 5.0;
const DAMPING_COEFFICIENT = 0.02;

// Modal calculation parameters
// Include both even and odd modes for off-center excitation
const MAX_MODE = 16;
const MODE_STEP = 1; // Include all modes for off-center excitation

// Threshold for skipping modes with negligible source contribution
const SOURCE_THRESHOLD = 0.001;

// Default excitation position (center of plate, in model coordinates)
// Model uses centered coordinates: (0,0) is at plate center
// x ranges from -width/2 to +width/2
// y ranges from -height/2 to +height/2 (positive Y is up)
const DEFAULT_EXCITATION_X = 0;
const DEFAULT_EXCITATION_Y = 0;

// Full frequency range for the simulation (Hz)
const FREQUENCY_MIN = 50;
const FREQUENCY_MAX = 4000;
const FREQUENCY_DEFAULT = 500;

// Width of the visible window in the resonance curve graph (Hz)
const GRAPH_WINDOW_WIDTH = 500;

// Precomputed resonance curve resolution (samples per Hz)
const CURVE_SAMPLES_PER_HZ = 4;
const TOTAL_CURVE_SAMPLES = (FREQUENCY_MAX - FREQUENCY_MIN) * CURVE_SAMPLES_PER_HZ;

export class ChladniModel {
  // Material selection
  public readonly materialProperty: Property<MaterialType>;

  // Frequency control - single slider covering full range
  public readonly frequencyProperty: NumberProperty;

  // Full frequency range
  public readonly frequencyRange: Range;

  // Excitation position (normalized 0-1 coordinates)
  // This is where the plate is driven (e.g., by a speaker or vibrator)
  public readonly excitationPositionProperty: Property<Vector2>;

  // Animation state
  public readonly isPlayingProperty: BooleanProperty;

  // Grain count selection (number of particles)
  public readonly grainCountProperty: Property<GrainCountOption>;

  // Plate dimensions (can be resized by the user)
  public readonly plateWidthProperty: NumberProperty;
  public readonly plateHeightProperty: NumberProperty;

  // Particle positions (normalized 0-1 coordinates)
  public readonly particlePositions: Vector2[];

  // Cached values for performance
  private cachedWaveNumber: number;
  private cachedDamping: number;

  // Precomputed resonance curve data
  // Array of strength values for the full frequency range, computed once
  private readonly precomputedStrengths: Float32Array;
  private precomputedMaxStrength: number;

  public constructor() {
    // Initialize material to aluminum (good mid-range dispersion)
    this.materialProperty = new Property<MaterialType>(Material.ALUMINUM);

    // Initialize frequency with full range
    this.frequencyRange = new Range(FREQUENCY_MIN, FREQUENCY_MAX);
    this.frequencyProperty = new NumberProperty(FREQUENCY_DEFAULT, {
      range: this.frequencyRange,
    });

    // Initialize excitation position at center of plate
    this.excitationPositionProperty = new Property<Vector2>(
      new Vector2(DEFAULT_EXCITATION_X, DEFAULT_EXCITATION_Y),
    );

    // Animation starts paused
    this.isPlayingProperty = new BooleanProperty(false);

    // Initialize grain count to default (10,000)
    this.grainCountProperty = new Property<GrainCountOption>(DEFAULT_GRAIN_COUNT);

    // Initialize plate dimensions
    this.plateWidthProperty = new NumberProperty(DEFAULT_PLATE_WIDTH, {
      range: new Range(MIN_PLATE_WIDTH, DEFAULT_PLATE_WIDTH),
    });
    this.plateHeightProperty = new NumberProperty(DEFAULT_PLATE_HEIGHT, {
      range: new Range(MIN_PLATE_HEIGHT, DEFAULT_PLATE_HEIGHT),
    });

    // Initialize particles with random positions
    this.particlePositions = [];
    this.initializeParticles();

    // Cache derived values
    this.cachedWaveNumber = this.calculateWaveNumber();
    this.cachedDamping = this.calculateDamping();

    // Initialize precomputed resonance curve
    this.precomputedStrengths = new Float32Array(TOTAL_CURVE_SAMPLES);
    this.precomputedMaxStrength = 0;
    this.recomputeResonanceCurve();

    // Update cached wave number when frequency changes
    this.frequencyProperty.link(() => {
      this.cachedWaveNumber = this.calculateWaveNumber();
    });

    // Recompute resonance curve when material or excitation position changes
    this.materialProperty.link(() => {
      this.cachedWaveNumber = this.calculateWaveNumber();
      this.recomputeResonanceCurve();
    });

    this.excitationPositionProperty.link(() => {
      this.recomputeResonanceCurve();
    });

    // Regenerate particles when grain count changes
    this.grainCountProperty.lazyLink(() => {
      this.initializeParticles();
    });

    // Recompute when plate dimensions change
    this.plateWidthProperty.lazyLink(() => {
      this.cachedDamping = this.calculateDamping();
      this.recomputeResonanceCurve();
    });

    this.plateHeightProperty.lazyLink(() => {
      this.cachedDamping = this.calculateDamping();
      this.recomputeResonanceCurve();
    });
  }

  /**
   * Calculate the damping coefficient based on plate dimensions.
   * Uses geometric mean of plate dimensions.
   */
  private calculateDamping(): number {
    return DAMPING_COEFFICIENT / Math.sqrt(
      this.plateWidthProperty.value * this.plateHeightProperty.value
    );
  }

  /**
   * Recompute the full resonance curve for the entire frequency range.
   * This is called when material or excitation position changes.
   */
  private recomputeResonanceCurve(): void {
    let maxStrength = 0;

    for (let i = 0; i < TOTAL_CURVE_SAMPLES; i++) {
      const freq = FREQUENCY_MIN + i / CURVE_SAMPLES_PER_HZ;
      const s = this.strength(freq);
      this.precomputedStrengths[i] = s;
      if (s > maxStrength) {
        maxStrength = s;
      }
    }

    this.precomputedMaxStrength = maxStrength;
  }

  /**
   * Get the precomputed resonance curve data for the current visible window.
   * Returns an array of {frequency, normalizedStrength} points ready for plotting.
   */
  public getResonanceCurveData(sampleCount: number): Vector2[] {
    const range = this.getGraphWindowRange();
    const freqMin = range.min;
    const freqMax = range.max;
    const dataSet: Vector2[] = [];

    if (this.precomputedMaxStrength <= 0) {
      // No resonance data, return flat line
      for (let i = 0; i < sampleCount; i++) {
        const freq = freqMin + (i / (sampleCount - 1)) * (freqMax - freqMin);
        dataSet.push(new Vector2(freq, 0));
      }
      return dataSet;
    }

    for (let i = 0; i < sampleCount; i++) {
      const freq = freqMin + (i / (sampleCount - 1)) * (freqMax - freqMin);

      // Map frequency to precomputed array index
      const index = Math.round((freq - FREQUENCY_MIN) * CURVE_SAMPLES_PER_HZ);
      const clampedIndex = Math.max(0, Math.min(TOTAL_CURVE_SAMPLES - 1, index));

      const strength = this.precomputedStrengths[clampedIndex]!;
      const normalized = Math.min(strength / this.precomputedMaxStrength, 1);

      dataSet.push(new Vector2(freq, normalized));
    }

    return dataSet;
  }

  /**
   * Initialize all particles with random positions across the plate.
   * Uses centered coordinates: x in [-width/2, width/2], y in [-height/2, height/2].
   */
  private initializeParticles(): void {
    const count = this.grainCountProperty.value.value;
    const halfWidth = this.plateWidthProperty.value / 2;
    const halfHeight = this.plateHeightProperty.value / 2;

    this.particlePositions.length = 0;
    for (let i = 0; i < count; i++) {
      // Random position in centered coordinates
      const x = (Math.random() - 0.5) * 2 * halfWidth;  // -halfWidth to +halfWidth
      const y = (Math.random() - 0.5) * 2 * halfHeight; // -halfHeight to +halfHeight
      this.particlePositions.push(new Vector2(x, y));
    }
  }

  /**
   * Calculate the wave number k from the current frequency and material.
   * k = sqrt(frequency / C) where C is the dispersion constant
   */
  private calculateWaveNumber(): number {
    const frequency = this.frequencyProperty.value;
    const C = this.materialProperty.value.dispersionConstant;
    return Math.sqrt(frequency / C);
  }

  /**
   * Calculate the displacement psi at a given point (x, y).
   * Input coordinates are centered: x in [-a/2, a/2], y in [-b/2, b/2].
   * Uses modal superposition based on the inhomogeneous Helmholtz equation solution.
   *
   * For a rectangular plate with dimensions a (width) × b (height):
   * Ψ(x,y; k,γ) = (2/√(ab))² Σₘ Σₙ [cos(mπx'/a)cos(nπy'/b) / ((k² - k²ₘₙ) + 2iγk)]
   *              × cos(mπx/a)cos(nπy/b)
   *
   * where (x', y') is the excitation position and k_{m,n} = π√((m/a)² + (n/b)²)
   */
  public psi(x: number, y: number): number {
    const k = this.cachedWaveNumber;
    const gamma = this.cachedDamping;
    const a = this.plateWidthProperty.value;
    const b = this.plateHeightProperty.value;

    // Convert centered coordinates to physics coordinates (0 to a, 0 to b)
    // Model: x in [-a/2, a/2] -> Physics: x in [0, a]
    const excitation = this.excitationPositionProperty.value;
    const excitX = excitation.x + a / 2;
    const excitY = excitation.y + b / 2;

    // Convert input centered coordinates to physics coordinates
    const physX = x + a / 2;
    const physY = y + b / 2;

    let sumReal = 0;
    let sumImag = 0;
    const mOverA = Math.PI / a;
    const nOverB = Math.PI / b;
    const twoGammaK = 2 * gamma * k;
    const kSquared = k * k;

    // Sum over modes m, n = 0, 1, 2, ..., MAX_MODE
    for (let m = 0; m <= MAX_MODE; m += MODE_STEP) {
      // Source term X component: cos(mπx'/a)
      const sourceX = Math.cos(m * Math.PI * excitX / a);

      for (let n = 0; n <= MAX_MODE; n += MODE_STEP) {
        // Skip the (0,0) mode to avoid division issues
        if (m === 0 && n === 0) continue;

        // Source term: cos(mπx'/a)cos(nπy'/b)
        const sourceY = Math.cos(n * Math.PI * excitY / b);
        const sourceTerm = sourceX * sourceY;

        // Skip modes with negligible source contribution (optimization)
        if (Math.abs(sourceTerm) < SOURCE_THRESHOLD) continue;

        // Modal wave number for rectangular plate: k_{m,n} = π√((m/a)² + (n/b)²)
        const kmn = Math.sqrt((m * mOverA) * (m * mOverA) + (n * nOverB) * (n * nOverB));
        const kmnSquared = kmn * kmn;

        // Complex denominator: (k² - k²ₘₙ) + 2iγk
        const realPart = kSquared - kmnSquared;
        const imagPart = twoGammaK;
        const denomMagSquared = realPart * realPart + imagPart * imagPart;

        // Field term: cos(mπx/a)cos(nπy/b)
        const fieldX = Math.cos(m * Math.PI * physX / a);
        const fieldY = Math.cos(n * Math.PI * physY / b);
        const fieldTerm = fieldX * fieldY;

        // Complex division: numerator / (realPart + i*imagPart)
        // = numerator * (realPart - i*imagPart) / |denominator|²
        const numerator = sourceTerm * fieldTerm;
        sumReal += numerator * realPart / denomMagSquared;
        sumImag -= numerator * imagPart / denomMagSquared;
      }
    }

    // Return magnitude of complex sum, with normalization for rectangular plate
    const normalization = 4 / (a * b);
    return normalization * Math.sqrt(sumReal * sumReal + sumImag * sumImag);
  }

  /**
   * Step the simulation forward by dt seconds.
   * Moves particles based on a biased random walk where step size
   * is proportional to local displacement magnitude.
   */
  public step(dt: number): void {
    if (!this.isPlayingProperty.value) {
      return;
    }

    // Scale factor for reasonable animation speed
    const timeScale = dt * 60; // Normalize to ~60fps

    const halfWidth = this.plateWidthProperty.value / 2;
    const halfHeight = this.plateHeightProperty.value / 2;

    for (let i = 0; i < this.particlePositions.length; i++) {
      const particle = this.particlePositions[i]!;
      const x = particle.x;
      const y = particle.y;

      // Calculate displacement at current position
      const displacement = Math.abs(this.psi(x, y));

      // Random walk with step size proportional to displacement
      const stepSize = PARTICLE_STEP_SCALE * displacement * timeScale * 0.01;
      const angle = Math.random() * 2 * Math.PI;

      // Update position
      let newX = x + stepSize * Math.cos(angle);
      let newY = y + stepSize * Math.sin(angle);

      // Clamp to plate boundaries (centered coordinates)
      newX = Math.max(-halfWidth, Math.min(halfWidth, newX));
      newY = Math.max(-halfHeight, Math.min(halfHeight, newY));

      particle.setXY(newX, newY);
    }
  }

  /**
   * Reset the model to initial state.
   */
  public reset(): void {
    this.materialProperty.reset();
    this.frequencyProperty.reset();
    this.excitationPositionProperty.reset();
    this.isPlayingProperty.reset();
    this.grainCountProperty.reset();
    this.plateWidthProperty.reset();
    this.plateHeightProperty.reset();
    this.initializeParticles();
    this.cachedWaveNumber = this.calculateWaveNumber();
    this.cachedDamping = this.calculateDamping();
  }

  /**
   * Get the visible frequency range for the resonance curve graph.
   * Returns a window centered on the current frequency.
   */
  public getGraphWindowRange(): Range {
    const currentFreq = this.frequencyProperty.value;
    const halfWindow = GRAPH_WINDOW_WIDTH / 2;

    let min = currentFreq - halfWindow;
    let max = currentFreq + halfWindow;

    // Clamp to valid frequency range
    if (min < FREQUENCY_MIN) {
      min = FREQUENCY_MIN;
      max = Math.min(FREQUENCY_MIN + GRAPH_WINDOW_WIDTH, FREQUENCY_MAX);
    }
    if (max > FREQUENCY_MAX) {
      max = FREQUENCY_MAX;
      min = Math.max(FREQUENCY_MAX - GRAPH_WINDOW_WIDTH, FREQUENCY_MIN);
    }

    return new Range(min, max);
  }

  /**
   * Regenerate particles with new random positions.
   */
  public regenerateParticles(): void {
    this.initializeParticles();
  }

  /**
   * Get the current frequency display value.
   */
  public get frequency(): number {
    return this.frequencyProperty.value;
  }

  /**
   * Get the current material name.
   */
  public get materialName(): string {
    return this.materialProperty.value.name;
  }

  /**
   * Get the number of particles.
   */
  public get particleCount(): number {
    return this.grainCountProperty.value.value;
  }

  /**
   * Calculate the resonance strength/amplitude at a given frequency.
   * This is used to plot the resonance curve showing peaks at resonant frequencies.
   *
   * For a rectangular plate with dimensions a × b:
   * I(x',y',k,γ) = Σₘₙ |φₘₙ(x',y')|² / [(k² - k²ₘₙ)² + 4(γk)²]
   *
   * The |φₘₙ(x',y')|² term weights each mode by its amplitude at the excitation point.
   */
  public strength(freq: number): number {
    const C = this.materialProperty.value.dispersionConstant;
    const k = Math.sqrt(freq / C);
    const gamma = this.cachedDamping;
    const a = this.plateWidthProperty.value;
    const b = this.plateHeightProperty.value;

    // Convert centered excitation position to physics coordinates (0 to a, 0 to b)
    const excitation = this.excitationPositionProperty.value;
    const excitX = excitation.x + a / 2;
    const excitY = excitation.y + b / 2;

    let sum = 0;
    const mOverA = Math.PI / a;
    const nOverB = Math.PI / b;
    const fourGammaKSquared = 4 * gamma * gamma * k * k;
    const kSquared = k * k;
    // Normalization for rectangular plate: (2/√(ab))² = 4/(ab)
    const normFactor = 4 / (a * b);

    // Sum over modes m, n = 0, 1, 2, ..., MAX_MODE
    for (let m = 0; m <= MAX_MODE; m += MODE_STEP) {
      const cosX = Math.cos(m * Math.PI * excitX / a);
      const cosXSquared = cosX * cosX;

      for (let n = 0; n <= MAX_MODE; n += MODE_STEP) {
        // Skip (0,0) mode
        if (m === 0 && n === 0) continue;

        // |φₘₙ(x',y')|² = (4/ab) cos²(mπx'/a) cos²(nπy'/b)
        const cosY = Math.cos(n * Math.PI * excitY / b);
        const phiSquared = normFactor * cosXSquared * cosY * cosY;

        // Skip modes with negligible source contribution
        if (phiSquared < SOURCE_THRESHOLD * SOURCE_THRESHOLD) continue;

        // Modal wave number for rectangular plate: k_{m,n} = π√((m/a)² + (n/b)²)
        const kmn = Math.sqrt((m * mOverA) * (m * mOverA) + (n * nOverB) * (n * nOverB));
        const kmnSquared = kmn * kmn;

        // Resonance denominator: (k² - kmn²)² + 4(γk)²
        const diff = kSquared - kmnSquared;
        const denominator = diff * diff + fourGammaKSquared;

        if (denominator > 0) {
          sum += phiSquared / denominator;
        }
      }
    }

    return sum;
  }

  /**
   * Get the plate width (a) in meters.
   */
  public get plateWidth(): number {
    return this.plateWidthProperty.value;
  }

  /**
   * Get the plate height (b) in meters.
   */
  public get plateHeight(): number {
    return this.plateHeightProperty.value;
  }

  /**
   * Get the plate aspect ratio (width / height).
   */
  public get aspectRatio(): number {
    return this.plateWidthProperty.value / this.plateHeightProperty.value;
  }

  /**
   * Get the default plate width.
   */
  public get defaultPlateWidth(): number {
    return DEFAULT_PLATE_WIDTH;
  }

  /**
   * Get the default plate height.
   */
  public get defaultPlateHeight(): number {
    return DEFAULT_PLATE_HEIGHT;
  }
}
