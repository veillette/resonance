/**
 * ModalCalculatorFactory.ts
 *
 * Factory for creating modal calculator strategies based on plate shape.
 */

import { Property, TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import type { MaterialType } from "./Material.js";
import type { IModalCalculatorStrategy } from "./IModalCalculatorStrategy.js";
import { PlateShape, PlateShapeType } from "./PlateShape.js";
import { ModalCalculator } from "./ModalCalculator.js";
import { CircularModalCalculator } from "./CircularModalCalculator.js";
import { GuitarModalCalculator } from "./GuitarModalCalculator.js";
import { PlateGeometry } from "./PlateGeometry.js";
import { CircularPlateGeometry } from "./CircularPlateGeometry.js";
import { GuitarPlateGeometry } from "./GuitarPlateGeometry.js";

/**
 * Options for creating a modal calculator.
 */
export interface ModalCalculatorFactoryOptions {
  materialProperty: TReadOnlyProperty<MaterialType>;
  excitationPositionProperty: Property<Vector2>;

  // Geometry objects for each shape type
  rectangularGeometry: PlateGeometry;
  circularGeometry: CircularPlateGeometry;
  guitarGeometry: GuitarPlateGeometry;
}

/**
 * Factory for creating modal calculator strategies.
 */
export class ModalCalculatorFactory {
  private readonly options: ModalCalculatorFactoryOptions;

  // Cached calculator instances
  private rectangularCalculator: ModalCalculator | null = null;
  private circularCalculator: CircularModalCalculator | null = null;
  private guitarCalculator: GuitarModalCalculator | null = null;

  public constructor(options: ModalCalculatorFactoryOptions) {
    this.options = options;
  }

  /**
   * Get or create the calculator for a given plate shape.
   *
   * @param shape - The plate shape
   * @returns The modal calculator strategy for that shape
   */
  public getCalculator(shape: PlateShapeType): IModalCalculatorStrategy {
    switch (shape) {
      case PlateShape.RECTANGLE:
        return this.getRectangularCalculator();

      case PlateShape.CIRCLE:
        return this.getCircularCalculator();

      case PlateShape.GUITAR:
        return this.getGuitarCalculator();

      default: {
        // Exhaustive check - this should never happen
        const _exhaustiveCheck: never = shape;
        throw new Error(`Unknown plate shape: ${String(_exhaustiveCheck)}`);
      }
    }
  }

  /**
   * Get or create the rectangular modal calculator.
   */
  private getRectangularCalculator(): ModalCalculator {
    if (!this.rectangularCalculator) {
      this.rectangularCalculator = new ModalCalculator({
        materialProperty: this.options.materialProperty,
        plateWidthProperty: this.options.rectangularGeometry.widthProperty,
        plateHeightProperty: this.options.rectangularGeometry.heightProperty,
        excitationPositionProperty: this.options.excitationPositionProperty,
      });
    }
    return this.rectangularCalculator;
  }

  /**
   * Get or create the circular modal calculator.
   */
  private getCircularCalculator(): CircularModalCalculator {
    if (!this.circularCalculator) {
      this.circularCalculator = new CircularModalCalculator({
        materialProperty: this.options.materialProperty,
        outerRadiusProperty: this.options.circularGeometry.outerRadiusProperty,
        excitationPositionProperty: this.options.excitationPositionProperty,
        boundaryCondition: "free",
      });
    }
    return this.circularCalculator;
  }

  /**
   * Get or create the guitar modal calculator.
   */
  private getGuitarCalculator(): GuitarModalCalculator {
    if (!this.guitarCalculator) {
      this.guitarCalculator = new GuitarModalCalculator({
        materialProperty: this.options.materialProperty,
        geometry: this.options.guitarGeometry,
        excitationPositionProperty: this.options.excitationPositionProperty,
      });
    }
    return this.guitarCalculator;
  }

  /**
   * Update cached damping for all calculators.
   * Call when any plate dimensions change.
   */
  public updateAllCachedDamping(): void {
    this.rectangularCalculator?.updateCachedDamping();
    this.circularCalculator?.updateCachedDamping();
    this.guitarCalculator?.updateCachedDamping();
  }

  /**
   * Invalidate mode caches for all calculators.
   * Call when excitation position changes.
   */
  public invalidateAllModeCaches(): void {
    this.rectangularCalculator?.invalidateModeCache();
    this.circularCalculator?.invalidateModeCache();
    this.guitarCalculator?.invalidateModeCache();
  }
}
