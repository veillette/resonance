/**
 * FrequencySweepController.ts
 *
 * Controls the frequency sweep functionality for the Chladni plate simulation.
 * Extracted from ChladniModel for separation of concerns.
 *
 * A frequency sweep automatically increases the frequency from minimum to maximum
 * over time, allowing users to observe how patterns change across the frequency range.
 *
 * Uses scenerystack's Animation class for built-in timing, completion detection,
 * and integration with the global animation timer.
 */

import { BooleanProperty, NumberProperty, Emitter } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { Animation, Easing } from "scenerystack/twixt";
import { SWEEP_RATE } from "./ChladniConstants.js";

/**
 * Options for creating a FrequencySweepController
 */
export interface FrequencySweepControllerOptions {
  frequencyProperty: NumberProperty;
  frequencyRange: Range;
}

/**
 * FrequencySweepController manages the frequency sweep using scenerystack's Animation.
 * It handles starting, stopping, and automatically stepping through frequency sweeps.
 */
export class FrequencySweepController {
  private readonly frequencyProperty: NumberProperty;
  private readonly frequencyRange: Range;

  /**
   * Whether a frequency sweep is currently active (animation running or paused).
   */
  public readonly isSweepingProperty: BooleanProperty;

  /**
   * The rate at which frequency increases during a sweep (Hz per second).
   */
  public readonly sweepRate: number;

  /**
   * Emitter that fires when a sweep completes naturally (reaches max frequency).
   */
  public readonly sweepCompletedEmitter: Emitter;

  /**
   * The current animation instance, or null if no sweep is active.
   */
  private sweepAnimation: Animation | null = null;

  /**
   * Stores the frequency when sweep is paused for resume capability.
   */
  private pausedFrequency: number | null = null;

  public constructor(options: FrequencySweepControllerOptions) {
    this.frequencyProperty = options.frequencyProperty;
    this.frequencyRange = options.frequencyRange;

    // Initialize sweep state
    this.isSweepingProperty = new BooleanProperty(false);

    // Sweep rate from constants
    this.sweepRate = SWEEP_RATE;

    // Create emitter for sweep completion
    this.sweepCompletedEmitter = new Emitter();
  }

  /**
   * Calculate the duration for a sweep from a given start frequency to max.
   */
  private calculateDuration(fromFrequency: number): number {
    return (this.frequencyRange.max - fromFrequency) / this.sweepRate;
  }

  /**
   * Create and start a new animation from the current frequency to max.
   */
  private createAndStartAnimation(fromFrequency: number): void {
    // Clean up any existing animation
    this.disposeAnimation();

    const duration = this.calculateDuration(fromFrequency);

    // Create the sweep animation using twixt
    this.sweepAnimation = new Animation({
      property: this.frequencyProperty,
      to: this.frequencyRange.max,
      from: fromFrequency,
      duration: duration,
      easing: Easing.LINEAR,
    });

    // Listen for sweep completion
    this.sweepAnimation.endedEmitter.addListener(() => {
      this.isSweepingProperty.value = false;
      this.pausedFrequency = null;
      this.sweepCompletedEmitter.emit();
    });

    // Start the animation
    this.sweepAnimation.start();
    this.isSweepingProperty.value = true;
  }

  /**
   * Dispose the current animation if it exists.
   */
  private disposeAnimation(): void {
    if (this.sweepAnimation) {
      this.sweepAnimation.stop();
      this.sweepAnimation = null;
    }
  }

  /**
   * Start a frequency sweep from minimum to maximum frequency.
   * The frequency will be reset to minimum and sweeping state activated.
   */
  public startSweep(): void {
    this.pausedFrequency = null;
    this.frequencyProperty.value = this.frequencyRange.min;
    this.createAndStartAnimation(this.frequencyRange.min);
  }

  /**
   * Stop an active frequency sweep.
   * The current frequency is preserved.
   */
  public stopSweep(): void {
    this.disposeAnimation();
    this.isSweepingProperty.value = false;
    this.pausedFrequency = null;
  }

  /**
   * Pause the sweep, preserving the current position for later resume.
   */
  public pauseSweep(): void {
    if (this.sweepAnimation && this.isSweepingProperty.value) {
      this.pausedFrequency = this.frequencyProperty.value;
      this.disposeAnimation();
      // Keep isSweepingProperty true to indicate sweep can be resumed
    }
  }

  /**
   * Resume a paused sweep from where it left off.
   */
  public resumeSweep(): void {
    if (this.pausedFrequency !== null && this.isSweepingProperty.value) {
      this.createAndStartAnimation(this.pausedFrequency);
      this.pausedFrequency = null;
    }
  }

  /**
   * Toggle the sweep state.
   * If sweeping, stops the sweep. If not sweeping, starts a new sweep.
   * @unused - Currently not used in the codebase but kept for toggle button implementations
   */
  public toggleSweep(): void {
    if (this.isSweepingProperty.value) {
      this.stopSweep();
    } else {
      this.startSweep();
    }
  }

  /**
   * Check if a sweep is currently active.
   */
  public get isSweeping(): boolean {
    return this.isSweepingProperty.value;
  }

  /**
   * Check if the animation is actually running (not paused).
   * @unused - Currently not used in the codebase but kept for animation state monitoring
   */
  public get isAnimationRunning(): boolean {
    return this.sweepAnimation !== null && this.pausedFrequency === null;
  }

  /**
   * Get the progress of the current sweep as a fraction (0 to 1).
   * @unused - Currently not used in the codebase but kept for progress indicators
   */
  public getSweepProgress(): number {
    const min = this.frequencyRange.min;
    const max = this.frequencyRange.max;
    const current = this.frequencyProperty.value;
    return (current - min) / (max - min);
  }

  /**
   * Get the estimated time remaining in the sweep (in seconds).
   * @unused - Currently not used in the codebase but kept for time estimation features
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
    this.disposeAnimation();
    this.pausedFrequency = null;
    this.isSweepingProperty.reset();
  }
}
