/**
 * PlateGeometry.ts
 *
 * Manages the geometry and dimensions of the Chladni plate.
 * Extracted from ChladniModel for separation of concerns.
 *
 * The plate uses centered coordinates where (0,0) is at the center,
 * x ranges from -width/2 to width/2, and y ranges from -height/2 to height/2.
 */

import { NumberProperty, Property } from "scenerystack/axon";
import { Range, Vector2, Bounds2 } from "scenerystack/dot";
import {
  DEFAULT_PLATE_WIDTH,
  DEFAULT_PLATE_HEIGHT,
  MIN_PLATE_WIDTH,
  MIN_PLATE_HEIGHT,
} from "./ChladniConstants.js";

/**
 * Options for creating a PlateGeometry
 */
export interface PlateGeometryOptions {
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

/**
 * PlateGeometry manages plate dimensions, bounds calculations,
 * and coordinate validation for the Chladni plate simulation.
 */
export class PlateGeometry {
  /**
   * Plate width in meters.
   */
  public readonly widthProperty: NumberProperty;

  /**
   * Plate height in meters.
   */
  public readonly heightProperty: NumberProperty;

  /**
   * Default plate width (used for reset).
   */
  public readonly defaultWidth: number;

  /**
   * Default plate height (used for reset).
   */
  public readonly defaultHeight: number;

  public constructor(options?: PlateGeometryOptions) {
    this.defaultWidth = options?.initialWidth ?? DEFAULT_PLATE_WIDTH;
    this.defaultHeight = options?.initialHeight ?? DEFAULT_PLATE_HEIGHT;

    const minWidth = options?.minWidth ?? MIN_PLATE_WIDTH;
    const minHeight = options?.minHeight ?? MIN_PLATE_HEIGHT;

    this.widthProperty = new NumberProperty(this.defaultWidth, {
      range: new Range(minWidth, this.defaultWidth),
    });

    this.heightProperty = new NumberProperty(this.defaultHeight, {
      range: new Range(minHeight, this.defaultHeight),
    });
  }

  /**
   * Get the current plate width.
   */
  public get width(): number {
    return this.widthProperty.value;
  }

  /**
   * Get the current plate height.
   */
  public get height(): number {
    return this.heightProperty.value;
  }

  /**
   * Get the plate aspect ratio (width / height).
   */
  public get aspectRatio(): number {
    return this.widthProperty.value / this.heightProperty.value;
  }

  /**
   * Get half the plate width.
   */
  public get halfWidth(): number {
    return this.widthProperty.value / 2;
  }

  /**
   * Get half the plate height.
   */
  public get halfHeight(): number {
    return this.heightProperty.value / 2;
  }

  /**
   * Get the plate bounds in model coordinates (centered at origin).
   */
  public getBounds(): Bounds2 {
    const hw = this.halfWidth;
    const hh = this.halfHeight;
    return new Bounds2(-hw, -hh, hw, hh);
  }

  /**
   * Check if a point is within the plate bounds.
   *
   * @param x - X coordinate in model space
   * @param y - Y coordinate in model space
   * @returns true if the point is within the plate bounds
   */
  public containsPoint(x: number, y: number): boolean {
    const hw = this.halfWidth;
    const hh = this.halfHeight;
    return x >= -hw && x <= hw && y >= -hh && y <= hh;
  }

  /**
   * Check if a Vector2 point is within the plate bounds.
   *
   * @param point - Point in model space
   * @returns true if the point is within the plate bounds
   * @unused - Currently not used in the codebase but kept for boundary checking
   */
  public containsVector(point: Vector2): boolean {
    return this.containsPoint(point.x, point.y);
  }

  /**
   * Clamp a point to the plate bounds.
   *
   * @param x - X coordinate in model space
   * @param y - Y coordinate in model space
   * @returns Clamped coordinates as [x, y]
   */
  public clampPoint(x: number, y: number): [number, number] {
    const hw = this.halfWidth;
    const hh = this.halfHeight;
    const clampedX = Math.max(-hw, Math.min(hw, x));
    const clampedY = Math.max(-hh, Math.min(hh, y));
    return [clampedX, clampedY];
  }

  /**
   * Clamp a Vector2 point to the plate bounds.
   *
   * @param point - Point in model space
   * @returns New Vector2 clamped to plate bounds
   */
  public clampVector(point: Vector2): Vector2 {
    const [clampedX, clampedY] = this.clampPoint(point.x, point.y);
    return new Vector2(clampedX, clampedY);
  }

  /**
   * Clamp the excitation position property to current plate bounds.
   * Only updates if the position actually changed to avoid unnecessary notifications.
   *
   * @param excitationPositionProperty - The property to clamp
   */
  public clampExcitationPosition(
    excitationPositionProperty: Property<Vector2>,
  ): void {
    const pos = excitationPositionProperty.value;
    const clamped = this.clampVector(pos);

    // Only update if actually changed to avoid unnecessary notifications
    if (clamped.x !== pos.x || clamped.y !== pos.y) {
      excitationPositionProperty.value = clamped;
    }
  }

  /**
   * Convert physics coordinates (0 to width, 0 to height) to model coordinates
   * (centered at origin).
   *
   * @param physX - X in physics space (0 to width)
   * @param physY - Y in physics space (0 to height)
   * @returns [modelX, modelY] coordinates centered at origin
   * @unused - Currently not used in the codebase but kept for coordinate transformations
   */
  public physicsToModel(physX: number, physY: number): [number, number] {
    return [physX - this.halfWidth, physY - this.halfHeight];
  }

  /**
   * Convert model coordinates (centered at origin) to physics coordinates
   * (0 to width, 0 to height).
   *
   * @param modelX - X in model space (centered)
   * @param modelY - Y in model space (centered)
   * @returns [physX, physY] coordinates in physics space
   * @unused - Currently not used in the codebase but kept for coordinate transformations
   */
  public modelToPhysics(modelX: number, modelY: number): [number, number] {
    return [modelX + this.halfWidth, modelY + this.halfHeight];
  }

  /**
   * Get the plate area in square meters.
   * @unused - Currently not used in the codebase but kept for area calculations
   */
  public getArea(): number {
    return this.widthProperty.value * this.heightProperty.value;
  }

  /**
   * Get the geometric mean of width and height.
   * Used for damping calculations.
   * @unused - Currently not used in the codebase but kept for physics calculations
   */
  public getGeometricMean(): number {
    return Math.sqrt(this.widthProperty.value * this.heightProperty.value);
  }

  /**
   * Add a listener for when plate dimensions change.
   *
   * @param listener - Callback function (width, height)
   * @unused - Currently not used in the codebase but kept for dimension change notifications
   */
  public linkDimensions(
    listener: (width: number, height: number) => void,
  ): void {
    // Link both properties and call the listener
    const update = () => {
      listener(this.widthProperty.value, this.heightProperty.value);
    };
    this.widthProperty.link(update);
    this.heightProperty.lazyLink(update);
  }

  /**
   * Reset the plate geometry to default dimensions.
   */
  public reset(): void {
    this.widthProperty.reset();
    this.heightProperty.reset();
  }
}
