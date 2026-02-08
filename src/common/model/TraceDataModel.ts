/**
 * TraceDataModel manages trace data for the trace mode feature.
 *
 * In trace mode the grid scrolls left-to-right like a strip chart recorder
 * (paper moving under a pen). The x-axis represents time and the y-axis
 * represents the position of the selected resonator's mass.
 *
 * Data is stored as an array of {time, position} points sampled each frame
 * while trace mode is active and the simulation is playing.
 */

import { BooleanProperty } from "scenerystack/axon";
import ResonanceConstants from "../ResonanceConstants.js";

export interface TracePoint {
  /** Elapsed time since trace started (seconds) */
  time: number;
  /** Mass position in model coordinates (meters) */
  position: number;
}

export class TraceDataModel {
  /** Whether trace mode is enabled */
  public readonly traceEnabledProperty: BooleanProperty;

  /** Accumulated trace points */
  private readonly points: TracePoint[] = [];

  /** Time elapsed since trace was started (seconds) */
  private elapsedTime = 0;

  public constructor() {
    this.traceEnabledProperty = new BooleanProperty(false);
  }

  /**
   * Record a new data point. Called every frame while trace mode is active.
   * @param dt - time step in seconds
   * @param position - mass position in model coordinates
   */
  public addPoint(dt: number, position: number): void {
    this.elapsedTime += dt;
    this.points.push({ time: this.elapsedTime, position });

    // Trim old points to keep memory bounded
    if (this.points.length > ResonanceConstants.TRACE_MAX_POINTS) {
      this.points.splice(
        0,
        this.points.length - ResonanceConstants.TRACE_MAX_POINTS,
      );
    }
  }

  /** Get all recorded trace points (read-only view) */
  public getPoints(): readonly TracePoint[] {
    return this.points;
  }

  /** Get the elapsed time since trace started */
  public getElapsedTime(): number {
    return this.elapsedTime;
  }

  /** Clear all trace data and reset elapsed time */
  public clear(): void {
    this.points.length = 0;
    this.elapsedTime = 0;
  }

  /** Reset the model (disable trace and clear data) */
  public reset(): void {
    this.traceEnabledProperty.reset();
    this.clear();
  }
}
