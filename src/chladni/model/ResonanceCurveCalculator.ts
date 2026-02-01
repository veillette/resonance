/**
 * ResonanceCurveCalculator.ts
 *
 * Handles the calculation and caching of resonance curve data for the Chladni plate.
 * Extracted from ChladniModel for separation of concerns.
 *
 * The resonance curve shows the amplitude response vs frequency, with peaks at
 * resonant frequencies where modes are strongly excited.
 */

import { Vector2, Range } from "scenerystack/dot";
import { ModalCalculator } from "./ModalCalculator.js";
import {
  FREQUENCY_MIN,
  FREQUENCY_MAX,
  GRAPH_WINDOW_WIDTH,
  CURVE_SAMPLES_PER_HZ,
  TOTAL_CURVE_SAMPLES,
} from "./ChladniConstants.js";

/**
 * Options for creating a ResonanceCurveCalculator
 */
export interface ResonanceCurveCalculatorOptions {
  modalCalculator: ModalCalculator;
}

/**
 * ResonanceCurveCalculator handles precomputation and retrieval of resonance curve data.
 * It maintains a cache of strength values across the full frequency range for efficient
 * graph rendering.
 */
export class ResonanceCurveCalculator {
  private readonly modalCalculator: ModalCalculator;

  // Precomputed resonance curve data
  private readonly precomputedStrengths: Float32Array;
  private precomputedMaxStrength: number;

  public constructor(options: ResonanceCurveCalculatorOptions) {
    this.modalCalculator = options.modalCalculator;

    // Initialize precomputed resonance curve storage
    this.precomputedStrengths = new Float32Array(TOTAL_CURVE_SAMPLES);
    this.precomputedMaxStrength = 0;
  }

  /**
   * Recompute the full resonance curve for the entire frequency range.
   * This should be called when material or excitation position changes.
   */
  public recompute(): void {
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
   * Get the precomputed resonance curve data for a given frequency window.
   * Returns an array of {frequency, normalizedStrength} points ready for plotting.
   *
   * @param currentFrequency - The current frequency to center the window on
   * @param sampleCount - The number of data points to return
   * @returns Array of Vector2 points with (frequency, normalizedStrength)
   */
  public getData(currentFrequency: number, sampleCount: number): Vector2[] {
    const range = this.getGraphWindowRange(currentFrequency);
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
   * Get the visible frequency range for the resonance curve graph.
   * Returns a window centered on the given frequency.
   *
   * @param currentFrequency - The frequency to center the window on
   * @returns Range representing the visible frequency window
   */
  public getGraphWindowRange(currentFrequency: number): Range {
    const halfWindow = GRAPH_WINDOW_WIDTH / 2;

    let min = currentFrequency - halfWindow;
    let max = currentFrequency + halfWindow;

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
   * Get the maximum precomputed strength value.
   * Useful for normalization purposes.
   */
  public getMaxStrength(): number {
    return this.precomputedMaxStrength;
  }

  /**
   * Get the raw strength value at a specific index.
   * @param index - The index into the precomputed array
   */
  public getStrengthAtIndex(index: number): number {
    const clampedIndex = Math.max(0, Math.min(TOTAL_CURVE_SAMPLES - 1, index));
    return this.precomputedStrengths[clampedIndex]!;
  }
}
