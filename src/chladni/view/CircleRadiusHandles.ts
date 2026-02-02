/**
 * CircleRadiusHandles.ts
 *
 * Draggable handles for adjusting circular/annular plate radii.
 * - Outer radius handle on the outer edge (always visible)
 * - Inner radius handle on the inner edge (visible only when inner radius > 0)
 */

import {
  Circle,
  DragListener,
  Line,
  Node,
  Path,
} from "scenerystack/scenery";
import { Shape } from "scenerystack/kite";
import { Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { CircularPlateGeometry } from "../model/CircularPlateGeometry.js";
import ResonanceColors from "../../common/ResonanceColors.js";

// Handle visual properties
const HANDLE_RADIUS = 10;
const HANDLE_HIT_RADIUS = 18;
const GRIP_LINE_LENGTH = 6;
const GRIP_LINE_SPACING = 3;

// Minimum inner radius before snapping to 0
const INNER_RADIUS_SNAP_THRESHOLD = 0.01;

export interface CircleRadiusHandlesOptions {
  /**
   * Function to get the current model-view transform.
   */
  getModelViewTransform: () => ModelViewTransform2;

  /**
   * Function to get the visualization bounds in view coordinates.
   */
  getVisualizationBounds: () => { minX: number; minY: number };

  /**
   * Optional callback when drag ends.
   */
  onDragEnd?: () => void;
}

/**
 * CircleRadiusHandles provides draggable handles for adjusting circle radii.
 */
export class CircleRadiusHandles extends Node {
  private readonly geometry: CircularPlateGeometry;
  private readonly getModelViewTransform: () => ModelViewTransform2;
  private readonly getVisualizationBounds: () => { minX: number; minY: number };
  private readonly onDragEnd?: () => void;

  private readonly outerHandle: Node;
  private readonly innerHandle: Node;

  public constructor(
    geometry: CircularPlateGeometry,
    options: CircleRadiusHandlesOptions,
  ) {
    super();

    this.geometry = geometry;
    this.getModelViewTransform = options.getModelViewTransform;
    this.getVisualizationBounds = options.getVisualizationBounds;
    this.onDragEnd = options.onDragEnd;

    // Create outer radius handle
    this.outerHandle = this.createRadiusHandle(true);
    this.addChild(this.outerHandle);

    // Create inner radius handle
    this.innerHandle = this.createRadiusHandle(false);
    this.addChild(this.innerHandle);

    // Set up drag interactions
    this.setupOuterDragListener();
    this.setupInnerDragListener();

    // Update positions when radii change
    geometry.outerRadiusProperty.link(() => this.updatePositions());
    geometry.innerRadiusProperty.link(() => this.updatePositions());
  }

  /**
   * Create a radius handle visual.
   */
  private createRadiusHandle(isOuter: boolean): Node {
    const handle = new Node();

    // Larger invisible hit area
    const hitArea = new Circle(HANDLE_HIT_RADIUS, {
      fill: "rgba(0,0,0,0.01)",
      cursor: "ew-resize",
    });

    // Visible handle circle
    const handleCircle = new Circle(HANDLE_RADIUS, {
      fill: isOuter
        ? ResonanceColors.controlPanelFillProperty
        : ResonanceColors.backgroundProperty,
      stroke: ResonanceColors.textProperty,
      lineWidth: 2,
    });

    // Grip lines
    const gripLines = new Node();
    for (let i = -1; i <= 1; i++) {
      const y = i * GRIP_LINE_SPACING;
      const line = new Line(
        -GRIP_LINE_LENGTH / 2,
        y,
        GRIP_LINE_LENGTH / 2,
        y,
        {
          stroke: ResonanceColors.textProperty,
          lineWidth: 1.5,
          lineCap: "round",
        },
      );
      gripLines.addChild(line);
    }

    // Direction arrows
    const arrowSize = 4;
    const arrowOffset = 6;

    const leftArrowShape = new Shape()
      .moveTo(-arrowOffset, 0)
      .lineTo(-arrowOffset + arrowSize, -arrowSize)
      .moveTo(-arrowOffset, 0)
      .lineTo(-arrowOffset + arrowSize, arrowSize);

    const leftArrow = new Path(leftArrowShape, {
      stroke: ResonanceColors.textProperty,
      lineWidth: 1.5,
      lineCap: "round",
      lineJoin: "round",
    });

    const rightArrowShape = new Shape()
      .moveTo(arrowOffset, 0)
      .lineTo(arrowOffset - arrowSize, -arrowSize)
      .moveTo(arrowOffset, 0)
      .lineTo(arrowOffset - arrowSize, arrowSize);

    const rightArrow = new Path(rightArrowShape, {
      stroke: ResonanceColors.textProperty,
      lineWidth: 1.5,
      lineCap: "round",
      lineJoin: "round",
    });

    handle.addChild(hitArea);
    handle.addChild(handleCircle);
    handle.addChild(gripLines);
    handle.addChild(leftArrow);
    handle.addChild(rightArrow);

    return handle;
  }

  /**
   * Set up the drag listener for outer radius adjustment.
   */
  private setupOuterDragListener(): void {
    let dragStartPoint: Vector2 | null = null;
    let startRadius = 0;

    const dragListener = new DragListener({
      start: (event) => {
        dragStartPoint = event.pointer.point.copy();
        startRadius = this.geometry.outerRadiusProperty.value;
      },
      drag: (event) => {
        if (!dragStartPoint) return;

        const currentPoint = event.pointer.point;
        const transform = this.getModelViewTransform();

        // Convert drag delta to model coordinates
        const deltaX = currentPoint.x - dragStartPoint.x;
        const modelDeltaX = deltaX / Math.abs(transform.getMatrix().getScaleVector().x);

        const newRadius = startRadius + modelDeltaX;

        // Clamp to valid range
        const range = this.geometry.outerRadiusProperty.range;
        const minRadius = this.geometry.innerRadiusProperty.value + 0.02; // Keep gap
        this.geometry.outerRadiusProperty.value = Math.max(
          Math.max(range.min, minRadius),
          Math.min(range.max, newRadius),
        );
      },
      end: () => {
        dragStartPoint = null;
        this.onDragEnd?.();
      },
    });

    this.outerHandle.addInputListener(dragListener);
  }

  /**
   * Set up the drag listener for inner radius adjustment.
   */
  private setupInnerDragListener(): void {
    let dragStartPoint: Vector2 | null = null;
    let startRadius = 0;

    const dragListener = new DragListener({
      start: (event) => {
        dragStartPoint = event.pointer.point.copy();
        startRadius = this.geometry.innerRadiusProperty.value;
      },
      drag: (event) => {
        if (!dragStartPoint) return;

        const currentPoint = event.pointer.point;
        const transform = this.getModelViewTransform();

        // Convert drag delta to model coordinates
        const deltaX = currentPoint.x - dragStartPoint.x;
        const modelDeltaX = deltaX / Math.abs(transform.getMatrix().getScaleVector().x);

        let newRadius = startRadius + modelDeltaX;

        // Snap to 0 when close to center
        if (newRadius < INNER_RADIUS_SNAP_THRESHOLD) {
          newRadius = 0;
        }

        // Clamp to valid range
        const range = this.geometry.innerRadiusProperty.range;
        const maxRadius = this.geometry.outerRadiusProperty.value - 0.02; // Keep gap
        this.geometry.innerRadiusProperty.value = Math.max(
          range.min,
          Math.min(Math.min(range.max, maxRadius), newRadius),
        );
      },
      end: () => {
        dragStartPoint = null;
        this.onDragEnd?.();
      },
    });

    this.innerHandle.addInputListener(dragListener);
  }

  /**
   * Update the positions of both handles.
   */
  public updatePositions(): void {
    const transform = this.getModelViewTransform();
    const vizBounds = this.getVisualizationBounds();

    // Outer handle at right edge of outer circle
    const outerPos = this.geometry.getOuterRadiusHandlePosition();
    const outerViewPos = transform.modelToViewPosition(outerPos);
    this.outerHandle.x = vizBounds.minX + outerViewPos.x;
    this.outerHandle.y = vizBounds.minY + outerViewPos.y;

    // Inner handle at right edge of inner circle
    const innerRadius = this.geometry.innerRadiusProperty.value;
    if (innerRadius > 0) {
      const innerPos = this.geometry.getInnerRadiusHandlePosition();
      const innerViewPos = transform.modelToViewPosition(innerPos);
      this.innerHandle.x = vizBounds.minX + innerViewPos.x;
      this.innerHandle.y = vizBounds.minY + innerViewPos.y;
      this.innerHandle.visible = true;
    } else {
      this.innerHandle.visible = false;
    }
  }
}
