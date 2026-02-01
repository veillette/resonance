/**
 * TransformManager.ts
 *
 * Manages the ModelViewTransform2 for the Chladni plate visualization.
 * Provides a single source of truth for coordinate transformation between
 * model and view spaces.
 *
 * Coordinate System:
 * - Model: (0,0) at plate center, x in [-width/2, width/2], y in [-height/2, height/2], +Y up
 * - View: (0,0) at top-left of visualization, +Y down
 */

import { Property, TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { createChladniTransform } from "./ChladniTransformFactory.js";

/**
 * Options for creating a TransformManager
 */
export interface TransformManagerOptions {
  plateWidthProperty: TReadOnlyProperty<number>;
  plateHeightProperty: TReadOnlyProperty<number>;
  pixelsPerMeter: number;
}

/**
 * TransformManager maintains and updates the ModelViewTransform2 for coordinate
 * conversion between model space (centered, +Y up) and view space (top-left origin, +Y down).
 *
 * This class serves as the single source of truth for the transform, ensuring
 * consistency across all components that need coordinate conversion.
 */
export class TransformManager {
  private readonly plateWidthProperty: TReadOnlyProperty<number>;
  private readonly plateHeightProperty: TReadOnlyProperty<number>;
  private readonly pixelsPerMeter: number;

  /**
   * The current model-view transform.
   * Use transformProperty for reactive updates.
   */
  private currentTransform: ModelViewTransform2;

  /**
   * Observable property for the transform, allowing views to react to changes.
   */
  public readonly transformProperty: Property<ModelViewTransform2>;

  /**
   * Current view width in pixels.
   */
  private viewWidth: number;

  /**
   * Current view height in pixels.
   */
  private viewHeight: number;

  public constructor(options: TransformManagerOptions) {
    this.plateWidthProperty = options.plateWidthProperty;
    this.plateHeightProperty = options.plateHeightProperty;
    this.pixelsPerMeter = options.pixelsPerMeter;

    // Calculate initial view dimensions
    this.viewWidth = this.plateWidthProperty.value * this.pixelsPerMeter;
    this.viewHeight = this.plateHeightProperty.value * this.pixelsPerMeter;

    // Create initial transform
    this.currentTransform = createChladniTransform(
      this.plateWidthProperty.value,
      this.plateHeightProperty.value,
      this.viewWidth,
      this.viewHeight,
    );

    // Create property for reactive updates
    this.transformProperty = new Property(this.currentTransform);

    // Listen for plate dimension changes
    this.plateWidthProperty.lazyLink(() => this.updateTransform());
    this.plateHeightProperty.lazyLink(() => this.updateTransform());
  }

  /**
   * Update the transform when plate dimensions change.
   */
  private updateTransform(): void {
    this.viewWidth = this.plateWidthProperty.value * this.pixelsPerMeter;
    this.viewHeight = this.plateHeightProperty.value * this.pixelsPerMeter;

    this.currentTransform = createChladniTransform(
      this.plateWidthProperty.value,
      this.plateHeightProperty.value,
      this.viewWidth,
      this.viewHeight,
    );

    this.transformProperty.value = this.currentTransform;
  }

  /**
   * Get the current transform.
   */
  public get transform(): ModelViewTransform2 {
    return this.currentTransform;
  }

  /**
   * Get the current view width in pixels.
   */
  public getViewWidth(): number {
    return this.viewWidth;
  }

  /**
   * Get the current view height in pixels.
   */
  public getViewHeight(): number {
    return this.viewHeight;
  }

  /**
   * Get the view bounds in pixels.
   */
  public getViewBounds(): Bounds2 {
    return new Bounds2(0, 0, this.viewWidth, this.viewHeight);
  }

  /**
   * Get the model bounds (centered coordinates).
   */
  public getModelBounds(): Bounds2 {
    const hw = this.plateWidthProperty.value / 2;
    const hh = this.plateHeightProperty.value / 2;
    return new Bounds2(-hw, -hh, hw, hh);
  }

  /**
   * Convert a model point to view coordinates.
   *
   * @param modelPoint - Point in model space (centered, +Y up)
   * @returns Point in view space (top-left origin, +Y down)
   */
  public modelToView(modelPoint: Vector2): Vector2 {
    return this.currentTransform.modelToViewPosition(modelPoint);
  }

  /**
   * Convert view coordinates to model point.
   *
   * @param viewPoint - Point in view space (top-left origin, +Y down)
   * @returns Point in model space (centered, +Y up)
   */
  public viewToModel(viewPoint: Vector2): Vector2 {
    return this.currentTransform.viewToModelPosition(viewPoint);
  }

  /**
   * Convert a model X coordinate to view X.
   *
   * @param modelX - X coordinate in model space
   * @returns X coordinate in view space
   */
  public modelToViewX(modelX: number): number {
    return this.currentTransform.modelToViewX(modelX);
  }

  /**
   * Convert a model Y coordinate to view Y.
   *
   * @param modelY - Y coordinate in model space
   * @returns Y coordinate in view space
   */
  public modelToViewY(modelY: number): number {
    return this.currentTransform.modelToViewY(modelY);
  }

  /**
   * Convert a model distance to view distance (delta X or delta Y).
   *
   * @param modelDelta - Distance in model space
   * @returns Distance in view space
   */
  public modelToViewDeltaX(modelDelta: number): number {
    return this.currentTransform.modelToViewDeltaX(modelDelta);
  }

  /**
   * Convert a model distance to view distance (delta Y).
   *
   * @param modelDelta - Distance in model space
   * @returns Distance in view space
   */
  public modelToViewDeltaY(modelDelta: number): number {
    return this.currentTransform.modelToViewDeltaY(modelDelta);
  }

  /**
   * Convert view X to model X.
   *
   * @param viewX - X coordinate in view space
   * @returns X coordinate in model space
   */
  public viewToModelX(viewX: number): number {
    return this.currentTransform.viewToModelX(viewX);
  }

  /**
   * Convert view Y to model Y.
   *
   * @param viewY - Y coordinate in view space
   * @returns Y coordinate in model space
   */
  public viewToModelY(viewY: number): number {
    return this.currentTransform.viewToModelY(viewY);
  }

  /**
   * Check if a view point is within the visualization bounds.
   *
   * @param viewPoint - Point in view space
   * @returns true if the point is within the view bounds
   */
  public isViewPointInBounds(viewPoint: Vector2): boolean {
    return this.getViewBounds().containsPoint(viewPoint.x, viewPoint.y);
  }

  /**
   * Get the pixels per meter scaling factor.
   */
  public getPixelsPerMeter(): number {
    return this.pixelsPerMeter;
  }
}
