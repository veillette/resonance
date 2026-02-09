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
  /** Scroll offset when this point was recorded (pixels) */
  scrollOffset: number;
  /** Mass position in model coordinates (meters) */
  position: number;
}

export class TraceDataModel {
  /** Whether trace mode is enabled */
  public readonly traceEnabledProperty: BooleanProperty;

  /** Accumulated trace points */
  private readonly points: TracePoint[] = [];

  public constructor() {
    this.traceEnabledProperty = new BooleanProperty(false);
  }

  /**
   * Record a new data point. Called every frame while trace mode is active.
   * @param scrollOffset - current scroll offset in pixels
   * @param position - mass position in model coordinates
   */
  public addPoint(scrollOffset: number, position: number): void {
    this.points.push({ scrollOffset, position });

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

  /** Clear all trace data */
  public clear(): void {
    this.points.length = 0;
  }

  /** Reset the model (disable trace and clear data) */
  public reset(): void {
    this.traceEnabledProperty.reset();
    this.clear();
  }
}
