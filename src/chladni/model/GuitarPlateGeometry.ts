/**
 * GuitarPlateGeometry.ts
 *
 * Manages the geometry for a guitar (dreadnought) shaped Chladni plate.
 * Uses a normalized polygon scaled by a scaleProperty.
 *
 * The dreadnought shape is characterized by:
 * - Upper bout (smaller curve at top)
 * - Waist (narrow middle section)
 * - Lower bout (larger curve at bottom)
 */

import { NumberProperty } from "scenerystack/axon";
import { Range, Vector2, Bounds2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import {
  DEFAULT_GUITAR_SCALE,
  MIN_GUITAR_SCALE,
  MAX_GUITAR_SCALE,
  GUITAR_BASE_WIDTH,
  GUITAR_BASE_HEIGHT,
} from "./ChladniConstants.js";

/**
 * Normalized dreadnought body outline vertices.
 * Coordinates are in [-1, 1] range, will be scaled by the actual dimensions.
 * The shape is vertically oriented with the upper bout at top (positive y in model space).
 */
const DREADNOUGHT_VERTICES: readonly Vector2[] = [
  // Start at top center and go clockwise
  // Upper bout (top)
  new Vector2(0, 1.0),
  new Vector2(0.15, 0.98),
  new Vector2(0.28, 0.92),
  new Vector2(0.38, 0.82),
  new Vector2(0.44, 0.7),
  new Vector2(0.46, 0.58),

  // Waist (right side)
  new Vector2(0.42, 0.45),
  new Vector2(0.36, 0.32),
  new Vector2(0.32, 0.2),
  new Vector2(0.3, 0.08),
  new Vector2(0.32, -0.05),

  // Lower bout (right side, wider)
  new Vector2(0.38, -0.18),
  new Vector2(0.46, -0.32),
  new Vector2(0.52, -0.46),
  new Vector2(0.54, -0.6),
  new Vector2(0.52, -0.74),
  new Vector2(0.46, -0.86),
  new Vector2(0.36, -0.94),
  new Vector2(0.22, -0.98),

  // Bottom center
  new Vector2(0, -1.0),

  // Lower bout (left side, mirror)
  new Vector2(-0.22, -0.98),
  new Vector2(-0.36, -0.94),
  new Vector2(-0.46, -0.86),
  new Vector2(-0.52, -0.74),
  new Vector2(-0.54, -0.6),
  new Vector2(-0.52, -0.46),
  new Vector2(-0.46, -0.32),
  new Vector2(-0.38, -0.18),

  // Waist (left side)
  new Vector2(-0.32, -0.05),
  new Vector2(-0.3, 0.08),
  new Vector2(-0.32, 0.2),
  new Vector2(-0.36, 0.32),
  new Vector2(-0.42, 0.45),

  // Upper bout (left side)
  new Vector2(-0.46, 0.58),
  new Vector2(-0.44, 0.7),
  new Vector2(-0.38, 0.82),
  new Vector2(-0.28, 0.92),
  new Vector2(-0.15, 0.98),
];

/**
 * GuitarPlateGeometry manages the guitar (dreadnought) shape for the Chladni simulation.
 * The shape is defined by a polygon that is scaled uniformly by the scaleProperty.
 */
export class GuitarPlateGeometry {
  /**
   * Uniform scale factor for the guitar shape.
   * 1.0 = base size, 0.6 = 60% size, 1.4 = 140% size.
   */
  public readonly scaleProperty: NumberProperty;

  /**
   * Base width of the guitar at scale 1.0 (meters).
   */
  public readonly baseWidth: number;

  /**
   * Base height of the guitar at scale 1.0 (meters).
   */
  public readonly baseHeight: number;

  /**
   * Default scale (used for reset).
   */
  public readonly defaultScale: number;

  /**
   * Cached scaled vertices for the current scale.
   */
  private cachedVertices: Vector2[] = [];

  /**
   * Cached scale value for vertex invalidation.
   */
  private cachedScaleValue: number = -1;

  public constructor(options?: {
    initialScale?: number;
    baseWidth?: number;
    baseHeight?: number;
  }) {
    this.defaultScale = options?.initialScale ?? DEFAULT_GUITAR_SCALE;
    this.baseWidth = options?.baseWidth ?? GUITAR_BASE_WIDTH;
    this.baseHeight = options?.baseHeight ?? GUITAR_BASE_HEIGHT;

    this.scaleProperty = new NumberProperty(this.defaultScale, {
      range: new Range(MIN_GUITAR_SCALE, MAX_GUITAR_SCALE),
    });

    // Initialize cached vertices
    this.updateCachedVertices();

    // Update cache when scale changes
    this.scaleProperty.lazyLink(() => this.updateCachedVertices());
  }

  /**
   * Get the current scale value.
   */
  public get scale(): number {
    return this.scaleProperty.value;
  }

  /**
   * Get the current width (scaled).
   */
  public get width(): number {
    return this.baseWidth * this.scaleProperty.value;
  }

  /**
   * Get the current height (scaled).
   */
  public get height(): number {
    return this.baseHeight * this.scaleProperty.value;
  }

  /**
   * Get half the current width.
   */
  public get halfWidth(): number {
    return this.width / 2;
  }

  /**
   * Get half the current height.
   */
  public get halfHeight(): number {
    return this.height / 2;
  }

  /**
   * Update the cached scaled vertices.
   */
  private updateCachedVertices(): void {
    const scale = this.scaleProperty.value;
    if (scale === this.cachedScaleValue) {
      return;
    }

    const hw = (this.baseWidth * scale) / 2;
    const hh = (this.baseHeight * scale) / 2;

    this.cachedVertices = DREADNOUGHT_VERTICES.map(
      (v) => new Vector2(v.x * hw, v.y * hh),
    );
    this.cachedScaleValue = scale;
  }

  /**
   * Get the scaled vertices for the current scale.
   */
  public getVertices(): readonly Vector2[] {
    return this.cachedVertices;
  }

  /**
   * Get the bounding box of the guitar shape.
   */
  public getBounds(): Bounds2 {
    const hw = this.halfWidth;
    const hh = this.halfHeight;
    return new Bounds2(-hw, -hh, hw, hh);
  }

  /**
   * Get the outline shape for rendering.
   */
  public getOutlineShape(): Shape {
    const vertices = this.getVertices();
    if (vertices.length === 0) {
      return new Shape();
    }

    const shape = new Shape();
    shape.moveToPoint(vertices[0]!);
    for (let i = 1; i < vertices.length; i++) {
      shape.lineToPoint(vertices[i]!);
    }
    shape.close();
    return shape;
  }

  /**
   * Check if a point is inside the guitar shape using ray casting.
   *
   * @param x - X coordinate in model space
   * @param y - Y coordinate in model space
   * @returns true if the point is inside the guitar boundary
   */
  public containsPoint(x: number, y: number): boolean {
    const vertices = this.cachedVertices;
    const n = vertices.length;
    if (n < 3) return false;

    // Ray casting algorithm
    let inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const vi = vertices[i]!;
      const vj = vertices[j]!;

      if (
        vi.y > y !== vj.y > y &&
        x < ((vj.x - vi.x) * (y - vi.y)) / (vj.y - vi.y) + vi.x
      ) {
        inside = !inside;
      }
    }
    return inside;
  }

  /**
   * Clamp a point to the guitar boundary.
   * If inside, returns the point unchanged.
   * If outside, returns the nearest point on the boundary.
   *
   * @param x - X coordinate in model space
   * @param y - Y coordinate in model space
   * @returns Clamped coordinates as [x, y]
   */
  public clampPoint(x: number, y: number): [number, number] {
    if (this.containsPoint(x, y)) {
      return [x, y];
    }

    // Find nearest point on polygon boundary
    const vertices = this.cachedVertices;
    const n = vertices.length;
    let nearestDist = Infinity;
    let nearestX = x;
    let nearestY = y;

    for (let i = 0; i < n; i++) {
      const v1 = vertices[i]!;
      const v2 = vertices[(i + 1) % n]!;

      // Project point onto line segment
      const [px, py, dist] = this.nearestPointOnSegment(
        x,
        y,
        v1.x,
        v1.y,
        v2.x,
        v2.y,
      );

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestX = px;
        nearestY = py;
      }
    }

    return [nearestX, nearestY];
  }

  /**
   * Find the nearest point on a line segment to a given point.
   */
  private nearestPointOnSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): [number, number, number] {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      // Segment is a point
      const dist = Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
      return [x1, y1, dist];
    }

    // Parameter t for the projection
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));

    const nearX = x1 + t * dx;
    const nearY = y1 + t * dy;
    const dist = Math.sqrt((px - nearX) ** 2 + (py - nearY) ** 2);

    return [nearX, nearY, dist];
  }

  /**
   * Get the characteristic length for physics calculations.
   * Uses the geometric mean of width and height.
   */
  public getCharacteristicLength(): number {
    return Math.sqrt(this.width * this.height);
  }

  /**
   * Get a drag handle position for scale adjustment.
   * Returns the rightmost point of the lower bout (widest part).
   */
  public getScaleHandlePosition(): Vector2 {
    // The widest point is around y = -0.6 normalized, x = 0.54 normalized
    const scale = this.scaleProperty.value;
    const hw = (this.baseWidth * scale) / 2;
    const hh = (this.baseHeight * scale) / 2;

    // Position at the widest part of the lower bout (right side)
    return new Vector2(0.54 * hw, -0.6 * hh);
  }

  /**
   * Calculate scale from a drag handle position.
   * Given a target position for the handle, calculates what scale would put
   * the handle at that position.
   *
   * @param x - Target X position for the handle
   * @param y - Target Y position for the handle (ignored, scale is uniform)
   * @returns The calculated scale value, clamped to valid range
   */
  public calculateScaleFromHandlePosition(x: number, _y: number): number {
    // The handle is at x = 0.54 * (baseWidth * scale) / 2
    // So: scale = (2 * x) / (0.54 * baseWidth)
    const normalizedX = 0.54;
    const newScale = (2 * Math.abs(x)) / (normalizedX * this.baseWidth);

    // Clamp to valid range
    const range = this.scaleProperty.range;
    return Math.max(range.min, Math.min(range.max, newScale));
  }

  /**
   * Generate a random point inside the guitar boundary.
   * Uses rejection sampling.
   */
  public randomPoint(): [number, number] {
    const hw = this.halfWidth;
    const hh = this.halfHeight;

    // Rejection sampling - generate random points in bounding box
    // and reject those outside the guitar boundary
    let x: number, y: number;
    do {
      x = (Math.random() - 0.5) * 2 * hw;
      y = (Math.random() - 0.5) * 2 * hh;
    } while (!this.containsPoint(x, y));

    return [x, y];
  }

  /**
   * Reset the geometry to default scale.
   */
  public reset(): void {
    this.scaleProperty.reset();
  }
}
