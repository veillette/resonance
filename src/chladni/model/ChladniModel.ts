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
import { ModalCalculator } from "./ModalCalculator.js";
import { ParticleManager } from "./ParticleManager.js";
import {
  BoundaryMode,
  GrainCountOption,
  GRAIN_COUNT_OPTIONS,
  DEFAULT_GRAIN_COUNT,
  DEFAULT_PLATE_WIDTH,
  DEFAULT_PLATE_HEIGHT,
  MIN_PLATE_WIDTH,
  MIN_PLATE_HEIGHT,
  FREQUENCY_MIN,
  FREQUENCY_MAX,
  FREQUENCY_DEFAULT,
  DEFAULT_EXCITATION_X,
  DEFAULT_EXCITATION_Y,
  DEFAULT_BOUNDARY_MODE,
  SWEEP_RATE,
  GRAPH_WINDOW_WIDTH,
  CURVE_SAMPLES_PER_HZ,
  TOTAL_CURVE_SAMPLES,
} from "./ChladniConstants.js";

// Re-export types for backward compatibility
export type { BoundaryMode, GrainCountOption };
export { GRAIN_COUNT_OPTIONS };

export class ChladniModel {
  // Material selection
  public readonly materialProperty: Property<MaterialType>;

  // Frequency control - single slider covering full range
  public readonly frequencyProperty: NumberProperty;

  // Full frequency range
  public readonly frequencyRange: Range;

  // Excitation position (centered model coordinates)
  // This is where the plate is driven (e.g., by a speaker or vibrator)
  public readonly excitationPositionProperty: Property<Vector2>;

  // Animation state
  public readonly isPlayingProperty: BooleanProperty;

  // Grain count selection (number of particles)
  public readonly grainCountProperty: Property<GrainCountOption>;

  // Plate dimensions (can be resized by the user)
  public readonly plateWidthProperty: NumberProperty;
  public readonly plateHeightProperty: NumberProperty;

  // Boundary handling mode: clamp particles to edges or remove them
  public readonly boundaryModeProperty: Property<BoundaryMode>;

  // Frequency sweep state
  public readonly isSweepingProperty: BooleanProperty;

  // Extracted modules
  private readonly modalCalculator: ModalCalculator;
  private readonly particleManager: ParticleManager;

  // Cached wave number for current frequency
  private cachedWaveNumber: number;

  // Precomputed resonance curve data
  private readonly precomputedStrengths: Float32Array;
  private precomputedMaxStrength: number;

  // Actual particle count (delegated to particle manager)
  public readonly actualParticleCountProperty: NumberProperty;

  // Particle positions (delegated to particle manager)
  public get particlePositions(): Vector2[] {
    return this.particleManager.particlePositions;
  }

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
    this.grainCountProperty = new Property<GrainCountOption>(
      DEFAULT_GRAIN_COUNT,
    );

    // Initialize plate dimensions
    this.plateWidthProperty = new NumberProperty(DEFAULT_PLATE_WIDTH, {
      range: new Range(MIN_PLATE_WIDTH, DEFAULT_PLATE_WIDTH),
    });
    this.plateHeightProperty = new NumberProperty(DEFAULT_PLATE_HEIGHT, {
      range: new Range(MIN_PLATE_HEIGHT, DEFAULT_PLATE_HEIGHT),
    });

    // Initialize boundary mode
    this.boundaryModeProperty = new Property<BoundaryMode>(
      DEFAULT_BOUNDARY_MODE,
    );

    // Initialize sweep state
    this.isSweepingProperty = new BooleanProperty(false);

    // Create modal calculator
    this.modalCalculator = new ModalCalculator({
      materialProperty: this.materialProperty,
      plateWidthProperty: this.plateWidthProperty,
      plateHeightProperty: this.plateHeightProperty,
      excitationPositionProperty: this.excitationPositionProperty,
    });

    // Create particle manager
    this.particleManager = new ParticleManager({
      grainCountProperty: this.grainCountProperty,
      plateWidthProperty: this.plateWidthProperty,
      plateHeightProperty: this.plateHeightProperty,
      boundaryModeProperty: this.boundaryModeProperty,
      isPlayingProperty: this.isPlayingProperty,
    });

    // Expose actual particle count from particle manager
    this.actualParticleCountProperty =
      this.particleManager.actualParticleCountProperty;

    // Initialize particles
    this.particleManager.initialize();

    // Cache initial wave number
    this.cachedWaveNumber = this.modalCalculator.calculateWaveNumber(
      this.frequencyProperty.value,
    );

    // Initialize precomputed resonance curve
    this.precomputedStrengths = new Float32Array(TOTAL_CURVE_SAMPLES);
    this.precomputedMaxStrength = 0;
    this.recomputeResonanceCurve();

    // Update cached wave number when frequency changes
    this.frequencyProperty.link(() => {
      this.cachedWaveNumber = this.modalCalculator.calculateWaveNumber(
        this.frequencyProperty.value,
      );
    });

    // Recompute resonance curve when material or excitation position changes
    this.materialProperty.link(() => {
      this.cachedWaveNumber = this.modalCalculator.calculateWaveNumber(
        this.frequencyProperty.value,
      );
      this.recomputeResonanceCurve();
    });

    this.excitationPositionProperty.link(() => {
      this.recomputeResonanceCurve();
    });

    // Regenerate particles when grain count changes
    this.grainCountProperty.lazyLink(() => {
      this.particleManager.initialize();
    });

    // Recompute when plate dimensions change
    this.plateWidthProperty.lazyLink(() => {
      this.modalCalculator.updateCachedDamping();
      this.recomputeResonanceCurve();
      this.particleManager.clampToBounds();
      this.clampExcitationToBounds();
    });

    this.plateHeightProperty.lazyLink(() => {
      this.modalCalculator.updateCachedDamping();
      this.recomputeResonanceCurve();
      this.particleManager.clampToBounds();
      this.clampExcitationToBounds();
    });
  }

  /**
   * Clamp excitation position to current plate bounds.
   * Called when plate dimensions change to ensure excitation stays within bounds.
   */
  private clampExcitationToBounds(): void {
    const halfWidth = this.plateWidthProperty.value / 2;
    const halfHeight = this.plateHeightProperty.value / 2;
    const pos = this.excitationPositionProperty.value;

    const clampedX = Math.max(-halfWidth, Math.min(halfWidth, pos.x));
    const clampedY = Math.max(-halfHeight, Math.min(halfHeight, pos.y));

    // Only update if actually changed to avoid unnecessary notifications
    if (clampedX !== pos.x || clampedY !== pos.y) {
      this.excitationPositionProperty.value = new Vector2(clampedX, clampedY);
    }
  }

  /**
   * Recompute the full resonance curve for the entire frequency range.
   * This is called when material or excitation position changes.
   */
  private recomputeResonanceCurve(): void {
    let maxStrength = 0;

    for (let i = 0; i < TOTAL_CURVE_SAMPLES; i++) {
      const freq = FREQUENCY_MIN + i / CURVE_SAMPLES_PER_HZ;
      const s = this.modalCalculator.strength(freq);
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
      const clampedIndex = Math.max(
        0,
        Math.min(TOTAL_CURVE_SAMPLES - 1, index),
      );

      const strength = this.precomputedStrengths[clampedIndex]!;
      const normalized = Math.min(strength / this.precomputedMaxStrength, 1);

      dataSet.push(new Vector2(freq, normalized));
    }

    return dataSet;
  }

  /**
   * Calculate the displacement psi at a given point (x, y).
   * Delegates to ModalCalculator using the cached wave number.
   */
  public psi(x: number, y: number): number {
    return this.modalCalculator.psi(x, y, this.cachedWaveNumber);
  }

  /**
   * Step the simulation forward by dt seconds.
   */
  public step(dt: number): void {
    // Handle frequency sweep if active
    if (this.isSweepingProperty.value) {
      const newFreq = this.frequencyProperty.value + SWEEP_RATE * dt;
      if (newFreq >= this.frequencyRange.max) {
        this.frequencyProperty.value = this.frequencyRange.max;
        this.isSweepingProperty.value = false;
      } else {
        this.frequencyProperty.value = newFreq;
      }
    }

    // Delegate particle stepping to particle manager
    this.particleManager.step(dt, (x, y) => this.psi(x, y));
  }

  /**
   * Start a frequency sweep from minimum to maximum frequency.
   */
  public startSweep(): void {
    this.frequencyProperty.value = this.frequencyRange.min;
    this.isSweepingProperty.value = true;
  }

  /**
   * Stop an active frequency sweep.
   */
  public stopSweep(): void {
    this.isSweepingProperty.value = false;
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
    this.boundaryModeProperty.reset();
    this.isSweepingProperty.reset();
    this.particleManager.initialize();
    this.cachedWaveNumber = this.modalCalculator.calculateWaveNumber(
      this.frequencyProperty.value,
    );
    this.modalCalculator.updateCachedDamping();
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
    this.particleManager.regenerate();
  }

  /**
   * Calculate the resonance strength/amplitude at a given frequency.
   * Delegates to ModalCalculator.
   */
  public strength(freq: number): number {
    return this.modalCalculator.strength(freq);
  }

  // Convenience getters

  public get frequency(): number {
    return this.frequencyProperty.value;
  }

  public get materialName(): string {
    return this.materialProperty.value.name;
  }

  public get particleCount(): number {
    return this.grainCountProperty.value.value;
  }

  public get plateWidth(): number {
    return this.plateWidthProperty.value;
  }

  public get plateHeight(): number {
    return this.plateHeightProperty.value;
  }

  public get aspectRatio(): number {
    return this.plateWidthProperty.value / this.plateHeightProperty.value;
  }

  public get defaultPlateWidth(): number {
    return DEFAULT_PLATE_WIDTH;
  }

  public get defaultPlateHeight(): number {
    return DEFAULT_PLATE_HEIGHT;
  }
}
