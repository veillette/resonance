/**
 * CircularPlateGeometry.ts
 *
 * Manages the geometry for circular and annular Chladni plates.
 * Supports both solid discs (innerRadius = 0) and annular rings (innerRadius > 0).
 */

import { NumberProperty } from "scenerystack/axon";
import { Range, Vector2, Bounds2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";

// Default outer radius (meters) - similar to rectangular plate default
const DEFAULT_OUTER_RADIUS = 0.16;
const MIN_OUTER_RADIUS = 0.08;
const MAX_OUTER_RADIUS = 0.20;

// Inner radius (for annular plates)
const DEFAULT_INNER_RADIUS = 0;
const MIN_INNER_RADIUS = 0;
const MAX_INNER_RADIUS = 0.15;

// Minimum gap between inner and outer radius
const MIN_ANNULAR_GAP = 0.02;

/**
 * CircularPlateGeometry manages circular and annular plate shapes.
 * When innerRadius = 0, it's a solid disc.
 * When innerRadius > 0, it's an annular ring.
 */
export class CircularPlateGeometry {
  /**
   * Outer radius of the circular plate (meters).
   */
  public readonly outerRadiusProperty: NumberProperty;

  /**
   * Inner radius of the circular plate (meters).
   * When 0, the plate is a solid disc.
   * When > 0, the plate is an annular ring.
   */
  public readonly innerRadiusProperty: NumberProperty;

  /**
   * Default outer radius (used for reset).
   */
  public readonly defaultOuterRadius: number;

  /**
   * Default inner radius (used for reset).
   */
  public readonly defaultInnerRadius: number;

  public constructor(options?: {
    initialOuterRadius?: number;
    initialInnerRadius?: number;
    minOuterRadius?: number;
    maxOuterRadius?: number;
  }) {
    this.defaultOuterRadius = options?.initialOuterRadius ?? DEFAULT_OUTER_RADIUS;
    this.defaultInnerRadius = options?.initialInnerRadius ?? DEFAULT_INNER_RADIUS;

    const minOuter = options?.minOuterRadius ?? MIN_OUTER_RADIUS;
    const maxOuter = options?.maxOuterRadius ?? MAX_OUTER_RADIUS;

    this.outerRadiusProperty = new NumberProperty(this.defaultOuterRadius, {
      range: new Range(minOuter, maxOuter),
    });

    this.innerRadiusProperty = new NumberProperty(this.defaultInnerRadius, {
      range: new Range(MIN_INNER_RADIUS, MAX_INNER_RADIUS),
    });

    // Ensure inner radius stays less than outer radius
    this.outerRadiusProperty.lazyLink((outerRadius) => {
      const maxInner = outerRadius - MIN_ANNULAR_GAP;
      if (this.innerRadiusProperty.value > maxInner) {
        this.innerRadiusProperty.value = Math.max(0, maxInner);
      }
    });
  }

  /**
   * Get the current outer radius.
   */
  public get outerRadius(): number {
    return this.outerRadiusProperty.value;
  }

  /**
   * Get the current inner radius.
   */
  public get innerRadius(): number {
    return this.innerRadiusProperty.value;
  }

  /**
   * Check if this is an annular (ring) plate.
   */
  public get isAnnular(): boolean {
    return this.innerRadiusProperty.value > 0;
  }

  /**
   * Get the equivalent width for compatibility (diameter).
   */
  public get width(): number {
    return this.outerRadiusProperty.value * 2;
  }

  /**
   * Get the equivalent height for compatibility (diameter).
   */
  public get height(): number {
    return this.outerRadiusProperty.value * 2;
  }

  /**
   * Get the bounding box of the circular plate.
   */
  public getBounds(): Bounds2 {
    const r = this.outerRadiusProperty.value;
    return new Bounds2(-r, -r, r, r);
  }

  /**
   * Get the outline shape for rendering.
   * Returns a circular arc for solid disc, or two arcs for annular ring.
   */
  public getOutlineShape(): Shape {
    const outer = this.outerRadiusProperty.value;
    const inner = this.innerRadiusProperty.value;

    if (inner <= 0) {
      // Solid disc - single circle
      return Shape.circle(0, 0, outer);
    } else {
      // Annular ring - outer circle with inner circle cutout
      const shape = new Shape();
      // Outer circle (counterclockwise)
      shape.arc(0, 0, outer, 0, Math.PI * 2, false);
      shape.close();
      // Inner circle (clockwise for cutout)
      shape.arc(0, 0, inner, 0, Math.PI * 2, true);
      shape.close();
      return shape;
    }
  }

  /**
   * Check if a point is inside the plate boundary.
   *
   * @param x - X coordinate in model space
   * @param y - Y coordinate in model space
   * @returns true if the point is inside the plate (and outside inner hole if annular)
   */
  public containsPoint(x: number, y: number): boolean {
    const rSquared = x * x + y * y;
    const outerSquared = this.outerRadiusProperty.value ** 2;
    const innerSquared = this.innerRadiusProperty.value ** 2;

    return rSquared <= outerSquared && rSquared >= innerSquared;
  }

  /**
   * Clamp a point to the plate boundary.
   *
   * @param x - X coordinate in model space
   * @param y - Y coordinate in model space
   * @returns Clamped coordinates as [x, y]
   */
  public clampPoint(x: number, y: number): [number, number] {
    const r = Math.sqrt(x * x + y * y);
    const outer = this.outerRadiusProperty.value;
    const inner = this.innerRadiusProperty.value;

    if (r === 0) {
      // At center - if annular, move to inner edge
      if (inner > 0) {
        return [inner, 0];
      }
      return [0, 0];
    }

    if (r > outer) {
      // Outside outer boundary - clamp to outer edge
      const scale = outer / r;
      return [x * scale, y * scale];
    }

    if (inner > 0 && r < inner) {
      // Inside inner hole - clamp to inner edge
      const scale = inner / r;
      return [x * scale, y * scale];
    }

    // Already inside valid region
    return [x, y];
  }

  /**
   * Get the characteristic length for physics calculations.
   */
  public getCharacteristicLength(): number {
    return this.outerRadiusProperty.value;
  }

  /**
   * Generate a random point inside the plate.
   * For annular plates, ensures point is between inner and outer radius.
   */
  public randomPoint(): [number, number] {
    const outer = this.outerRadiusProperty.value;
    const inner = this.innerRadiusProperty.value;

    // Use rejection sampling for simplicity
    // For solid disc, generate random point in circle
    // For annular, generate in ring
    let x: number, y: number, r: number;
    do {
      x = (Math.random() - 0.5) * 2 * outer;
      y = (Math.random() - 0.5) * 2 * outer;
      r = Math.sqrt(x * x + y * y);
    } while (r > outer || r < inner);

    return [x, y];
  }

  /**
   * Get the handle position for outer radius adjustment.
   * Returns the rightmost point of the outer circle.
   */
  public getOuterRadiusHandlePosition(): Vector2 {
    return new Vector2(this.outerRadiusProperty.value, 0);
  }

  /**
   * Get the handle position for inner radius adjustment.
   * Returns the rightmost point of the inner circle.
   */
  public getInnerRadiusHandlePosition(): Vector2 {
    return new Vector2(this.innerRadiusProperty.value, 0);
  }

  /**
   * Calculate radius from a handle position.
   *
   * @param x - X position of the handle
   * @param y - Y position of the handle
   * @returns The calculated radius
   */
  public calculateRadiusFromPosition(x: number, y: number): number {
    return Math.sqrt(x * x + y * y);
  }

  /**
   * Reset the geometry to default dimensions.
   */
  public reset(): void {
    this.outerRadiusProperty.reset();
    this.innerRadiusProperty.reset();
  }
}
