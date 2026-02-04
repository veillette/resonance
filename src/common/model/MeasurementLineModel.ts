/**
 * MeasurementLineModel - Model for a single measurement line.
 * Stores the position in model coordinates with constrained bounds.
 *
 * This is a shared model used by all oscillator-based screens:
 * - Single Oscillator
 * - Multiple Oscillators
 * - Phase Analysis
 */

import { Property } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Vector2Property } from "scenerystack/dot";

export class MeasurementLineModel {
  // Position in model coordinates (x is fixed, y represents height above driver)
  // With inverted Y transform: positive y = upward = height above driver
  public readonly positionProperty: Vector2Property;
  public readonly dragBoundsProperty: Property<Bounds2>;

  private readonly initialPosition: Vector2;

  /**
   * @param initialHeight - Initial height in meters above driver plate
   * @param dragBounds - Allowed bounds for dragging in model coordinates
   */
  public constructor(initialHeight: number, dragBounds: Bounds2) {
    // Positive Y = upward (with inverted Y transform)
    this.initialPosition = new Vector2(0, initialHeight);
    this.positionProperty = new Vector2Property(this.initialPosition);
    this.dragBoundsProperty = new Property(dragBounds);
  }

  /**
   * Get the height above driver plate (positive = up).
   */
  public get height(): number {
    return this.positionProperty.value.y;
  }

  public reset(): void {
    this.positionProperty.reset();
  }
}

/**
 * MeasurementLinesModel - Model for the pair of measurement lines.
 */
export class MeasurementLinesModel {
  public readonly line1: MeasurementLineModel;
  public readonly line2: MeasurementLineModel;
  public readonly dragBounds: Bounds2;

  /**
   * @param minHeight - Minimum allowed height in meters
   * @param maxHeight - Maximum allowed height in meters
   * @param initialHeight1 - Initial height of line 1 in meters
   * @param initialHeight2 - Initial height of line 2 in meters
   */
  public constructor(
    minHeight: number,
    maxHeight: number,
    initialHeight1: number = 0.2,
    initialHeight2: number = 0.4,
  ) {
    // Drag bounds in model coordinates
    // With inverted Y transform: positive y = upward
    // x is fixed at 0
    this.dragBounds = new Bounds2(0, minHeight, 0, maxHeight);

    this.line1 = new MeasurementLineModel(initialHeight1, this.dragBounds);
    this.line2 = new MeasurementLineModel(initialHeight2, this.dragBounds);
  }

  public reset(): void {
    this.line1.reset();
    this.line2.reset();
  }
}
