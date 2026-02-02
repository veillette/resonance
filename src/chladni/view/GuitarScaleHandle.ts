/**
 * GuitarScaleHandle.ts
 *
 * A draggable handle for adjusting the scale of the guitar plate shape.
 * Positioned at the widest point of the guitar (lower bout) and allows
 * uniform scaling by dragging horizontally.
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
import { GuitarPlateGeometry } from "../model/GuitarPlateGeometry.js";
import ResonanceColors from "../../common/ResonanceColors.js";

// Handle visual properties
const HANDLE_RADIUS = 10;
const HANDLE_HIT_RADIUS = 18;
const GRIP_LINE_LENGTH = 6;
const GRIP_LINE_SPACING = 3;

export interface GuitarScaleHandleOptions {
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
 * GuitarScaleHandle provides a draggable handle for adjusting the guitar scale.
 * The handle is positioned at the widest point of the guitar (lower bout, right side)
 * and allows the user to scale the guitar by dragging horizontally.
 */
export class GuitarScaleHandle extends Node {
  private readonly geometry: GuitarPlateGeometry;
  private readonly getModelViewTransform: () => ModelViewTransform2;
  private readonly getVisualizationBounds: () => { minX: number; minY: number };
  private readonly onDragEnd?: () => void;

  public constructor(
    geometry: GuitarPlateGeometry,
    options: GuitarScaleHandleOptions,
  ) {
    super();

    this.geometry = geometry;
    this.getModelViewTransform = options.getModelViewTransform;
    this.getVisualizationBounds = options.getVisualizationBounds;
    this.onDragEnd = options.onDragEnd;

    // Create the handle visual
    this.createHandleVisual();

    // Set up drag interaction
    this.setupDragListener();

    // Update position when scale changes
    geometry.scaleProperty.link(() => this.updatePosition());
  }

  /**
   * Create the visual elements for the handle.
   */
  private createHandleVisual(): void {
    // Larger invisible hit area for easier grabbing
    const hitArea = new Circle(HANDLE_HIT_RADIUS, {
      fill: "rgba(0,0,0,0.01)",
      cursor: "ew-resize",
    });

    // Visible handle circle
    const handleCircle = new Circle(HANDLE_RADIUS, {
      fill: ResonanceColors.controlPanelFillProperty,
      stroke: ResonanceColors.textProperty,
      lineWidth: 2,
    });

    // Grip lines (horizontal lines indicating drag direction)
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

    // Left/right arrows to indicate drag direction
    const arrowSize = 4;
    const arrowOffset = 6;

    // Left arrow
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

    // Right arrow
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

    this.addChild(hitArea);
    this.addChild(handleCircle);
    this.addChild(gripLines);
    this.addChild(leftArrow);
    this.addChild(rightArrow);
  }

  /**
   * Set up the drag listener for scale adjustment.
   */
  private setupDragListener(): void {
    let dragStartPoint: Vector2 | null = null;
    let startScale = 1;

    const dragListener = new DragListener({
      start: (event) => {
        dragStartPoint = event.pointer.point.copy();
        startScale = this.geometry.scaleProperty.value;
      },
      drag: (event) => {
        if (!dragStartPoint) return;

        const currentPoint = event.pointer.point;
        const transform = this.getModelViewTransform();

        // Convert drag delta to model coordinates
        // We only care about horizontal movement for uniform scaling
        const deltaX = currentPoint.x - dragStartPoint.x;

        // Calculate scale change based on drag distance
        // Moving right increases scale, moving left decreases
        // Use the view-to-model scale factor for proportional scaling
        const modelDeltaX = deltaX / transform.getMatrix().getScaleVector().x;

        // The handle is at x = 0.54 * halfWidth = 0.54 * (baseWidth * scale) / 2
        // So scale factor change = modelDeltaX / (0.54 * baseWidth / 2)
        const scaleDelta =
          modelDeltaX / ((0.54 * this.geometry.baseWidth) / 2);
        const newScale = startScale + scaleDelta;

        // Clamp to valid range
        const range = this.geometry.scaleProperty.range;
        this.geometry.scaleProperty.value = Math.max(
          range.min,
          Math.min(range.max, newScale),
        );
      },
      end: () => {
        dragStartPoint = null;
        this.onDragEnd?.();
      },
    });

    this.addInputListener(dragListener);
  }

  /**
   * Update the position of the handle based on current scale.
   */
  public updatePosition(): void {
    const transform = this.getModelViewTransform();
    const vizBounds = this.getVisualizationBounds();

    // Get the handle position in model coordinates
    const modelPos = this.geometry.getScaleHandlePosition();

    // Convert to view coordinates
    const viewPos = transform.modelToViewPosition(modelPos);

    // Position relative to visualization origin
    this.x = vizBounds.minX + viewPos.x;
    this.y = vizBounds.minY + viewPos.y;
  }
}
