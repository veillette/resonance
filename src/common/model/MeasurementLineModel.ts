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
  // Position in model coordinates (x is fixed, y represents displacement from equilibrium)
  // Uses same coordinate system as mass position: 0 = at equilibrium (natural spring length)
  // Positive y = upward from equilibrium
  public readonly positionProperty: Vector2Property;
  public readonly dragBoundsProperty: Property<Bounds2>;

  private readonly initialPosition: Vector2;

  /**
   * @param initialDisplacement - Initial displacement in meters from equilibrium (same as mass coordinates)
   * @param dragBounds - Allowed bounds for dragging in model coordinates
   */
  public constructor(initialDisplacement: number, dragBounds: Bounds2) {
    // Positive Y = upward from equilibrium (same as mass position coordinate system)
    this.initialPosition = new Vector2(0, initialDisplacement);
    this.positionProperty = new Vector2Property(this.initialPosition);
    this.dragBoundsProperty = new Property(dragBounds);
  }

  /**
   * Get the displacement from equilibrium (positive = up, same as mass position).
   */
  public get displacement(): number {
    return this.positionProperty.value.y;
  }

  public reset(): void {
    this.positionProperty.reset();
  }
}

/**
 * MeasurementLinesModel - Model for the pair of measurement lines.
 * Uses displacement from equilibrium coordinates (same as mass position).
 */
export class MeasurementLinesModel {
  public readonly line1: MeasurementLineModel;
  public readonly line2: MeasurementLineModel;
  public readonly dragBounds: Bounds2;

  /**
   * @param minDisplacement - Minimum allowed displacement in meters from equilibrium
   * @param maxDisplacement - Maximum allowed displacement in meters from equilibrium
   * @param initialDisplacement1 - Initial displacement of line 1 in meters (default: at equilibrium)
   * @param initialDisplacement2 - Initial displacement of line 2 in meters (default: 14 cm above equilibrium)
   */
  public constructor(
    minDisplacement: number,
    maxDisplacement: number,
    initialDisplacement1: number = 0.0,
    initialDisplacement2: number = 0.14,
  ) {
    // Drag bounds in model coordinates (displacement from equilibrium)
    // Positive y = upward from equilibrium
    // x is fixed at 0
    this.dragBounds = new Bounds2(0, minDisplacement, 0, maxDisplacement);

    this.line1 = new MeasurementLineModel(
      initialDisplacement1,
      this.dragBounds,
    );
    this.line2 = new MeasurementLineModel(
      initialDisplacement2,
      this.dragBounds,
    );
  }

  public reset(): void {
    this.line1.reset();
    this.line2.reset();
  }
}
