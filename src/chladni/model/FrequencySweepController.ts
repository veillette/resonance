/**
 * FrequencySweepController.ts
 *
 * Controls the frequency sweep functionality for the Chladni plate simulation.
 * Extracted from ChladniModel for separation of concerns.
 *
 * A frequency sweep automatically increases the frequency from minimum to maximum
 * over time, allowing users to observe how patterns change across the frequency range.
 */

import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { SWEEP_RATE } from "./ChladniConstants.js";

/**
 * Options for creating a FrequencySweepController
 */
export interface FrequencySweepControllerOptions {
  frequencyProperty: NumberProperty;
  frequencyRange: Range;
}

/**
 * FrequencySweepController manages the frequency sweep state machine.
 * It handles starting, stopping, and stepping through frequency sweeps.
 */
export class FrequencySweepController {
  private readonly frequencyProperty: NumberProperty;
  private readonly frequencyRange: Range;

  /**
   * Whether a frequency sweep is currently active.
   */
  public readonly isSweepingProperty: BooleanProperty;

  /**
   * The rate at which frequency increases during a sweep (Hz per second).
   */
  public readonly sweepRate: number;

  public constructor(options: FrequencySweepControllerOptions) {
    this.frequencyProperty = options.frequencyProperty;
    this.frequencyRange = options.frequencyRange;

    // Initialize sweep state
    this.isSweepingProperty = new BooleanProperty(false);

    // Sweep rate from constants
    this.sweepRate = SWEEP_RATE;
  }

  /**
   * Start a frequency sweep from minimum to maximum frequency.
   * The frequency will be reset to minimum and sweeping state activated.
   */
  public startSweep(): void {
    this.frequencyProperty.value = this.frequencyRange.min;
    this.isSweepingProperty.value = true;
  }

  /**
   * Stop an active frequency sweep.
   * The current frequency is preserved.
   */
  public stopSweep(): void {
    this.isSweepingProperty.value = false;
  }

  /**
   * Toggle the sweep state.
   * If sweeping, stops the sweep. If not sweeping, starts a new sweep.
   */
  public toggleSweep(): void {
    if (this.isSweepingProperty.value) {
      this.stopSweep();
    } else {
      this.startSweep();
    }
  }

  /**
   * Step the frequency sweep forward by the given time delta.
   * If the sweep reaches the maximum frequency, it automatically stops.
   *
   * @param dt - Time delta in seconds
   * @returns true if the sweep is still active, false if it completed
   */
  public step(dt: number): boolean {
    if (!this.isSweepingProperty.value) {
      return false;
    }

    const newFreq = this.frequencyProperty.value + this.sweepRate * dt;

    if (newFreq >= this.frequencyRange.max) {
      // Sweep completed
      this.frequencyProperty.value = this.frequencyRange.max;
      this.isSweepingProperty.value = false;
      return false;
    }

    this.frequencyProperty.value = newFreq;
    return true;
  }

  /**
   * Check if a sweep is currently active.
   */
  public get isSweeping(): boolean {
    return this.isSweepingProperty.value;
  }

  /**
   * Get the progress of the current sweep as a fraction (0 to 1).
   */
  public getSweepProgress(): number {
    const min = this.frequencyRange.min;
    const max = this.frequencyRange.max;
    const current = this.frequencyProperty.value;
    return (current - min) / (max - min);
  }

  /**
   * Get the estimated time remaining in the sweep (in seconds).
   */
  public getEstimatedTimeRemaining(): number {
    if (!this.isSweepingProperty.value) {
      return 0;
    }
    const remaining = this.frequencyRange.max - this.frequencyProperty.value;
    return remaining / this.sweepRate;
  }

  /**
   * Reset the sweep controller to initial state.
   */
  public reset(): void {
    this.isSweepingProperty.reset();
  }
}
