/**
 * MeasurementLineModel - Model for a single measurement line.
 * Stores the height (position) in model coordinates with a constrained range.
 */

import { NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";

export class MeasurementLineModel {
  public readonly heightProperty: NumberProperty;

  /**
   * @param initialHeight - Initial height in meters
   * @param heightRange - Allowed range of heights in meters
   */
  public constructor(initialHeight: number, heightRange: Range) {
    this.heightProperty = new NumberProperty(initialHeight, {
      range: heightRange,
    });
  }

  public reset(): void {
    this.heightProperty.reset();
  }
}

/**
 * MeasurementLinesModel - Model for the pair of measurement lines.
 */
export class MeasurementLinesModel {
  public readonly line1: MeasurementLineModel;
  public readonly line2: MeasurementLineModel;
  public readonly heightRange: Range;

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
    this.heightRange = new Range(minHeight, maxHeight);
    this.line1 = new MeasurementLineModel(initialHeight1, this.heightRange);
    this.line2 = new MeasurementLineModel(initialHeight2, this.heightRange);
  }

  public reset(): void {
    this.line1.reset();
    this.line2.reset();
  }
}
