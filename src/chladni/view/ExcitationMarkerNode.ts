/**
 * ExcitationMarkerNode.ts
 *
 * A draggable marker that shows the excitation position on the Chladni plate.
 * This is where the plate is being driven (vibrator position).
 * Extracted from ChladniScreenView for better separation of concerns.
 */

import { Circle, DragListener, Node } from "scenerystack/scenery";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { ChladniModel } from "../model/ChladniModel.js";
import ResonanceColors from "../../common/ResonanceColors.js";

// Excitation marker properties
const EXCITATION_MARKER_RADIUS = 12;
const EXCITATION_MARKER_INNER_RADIUS = 4;

/**
 * Options for creating an ExcitationMarkerNode.
 */
export interface ExcitationMarkerNodeOptions {
  /**
   * Callback to get the current model-view transform.
   * Used for coordinate conversion during dragging.
   */
  getModelViewTransform: () => ModelViewTransform2;

  /**
   * Callback to get the visualization bounds in screen coordinates.
   * Used for positioning the marker relative to the visualization.
   */
  getVisualizationBounds: () => Bounds2;

  /**
   * Callback to get the visualization node for coordinate conversion.
   */
  getVisualizationNode: () => Node;

  /**
   * Optional callback when drag ends.
   */
  onDragEnd?: () => void;
}

export class ExcitationMarkerNode extends Node {
  private readonly model: ChladniModel;
  private readonly options: ExcitationMarkerNodeOptions;

  public constructor(
    model: ChladniModel,
    options: ExcitationMarkerNodeOptions,
  ) {
    super({ cursor: "pointer" });

    this.model = model;
    this.options = options;

    // Create the marker visuals
    this.createMarker();

    // Add drag listener
    this.addDragListener();

    // Update position when model changes
    model.excitationPositionProperty.link(() => {
      this.updatePosition();
    });
  }

  /**
   * Create the visual marker elements.
   */
  private createMarker(): void {
    // Outer circle (ring)
    const outerCircle = new Circle(EXCITATION_MARKER_RADIUS, {
      stroke: ResonanceColors.frequencyTrackProperty,
      lineWidth: 3,
      fill: null,
    });
    this.addChild(outerCircle);

    // Inner filled circle
    const innerCircle = new Circle(EXCITATION_MARKER_INNER_RADIUS, {
      fill: ResonanceColors.frequencyTrackProperty,
    });
    this.addChild(innerCircle);
  }

  /**
   * Add drag listener for interactive positioning.
   */
  private addDragListener(): void {
    const dragListener = new DragListener({
      positionProperty: this.model.excitationPositionProperty,
      dragBoundsProperty: null, // We handle bounds manually
      transform: null,
      drag: (event) => {
        const visualizationNode = this.options.getVisualizationNode();
        const transform = this.options.getModelViewTransform();

        // Get the position in the visualization's local coordinate system
        const viewPoint = visualizationNode.globalToLocalPoint(
          event.pointer.point,
        );

        // Convert view coordinates to model coordinates
        const modelPoint = transform.viewToModelPosition(viewPoint);

        // Clamp to plate boundaries (centered model coordinates)
        const halfWidth = this.model.plateWidth / 2;
        const halfHeight = this.model.plateHeight / 2;
        const clampedX = Math.max(-halfWidth, Math.min(halfWidth, modelPoint.x));
        const clampedY = Math.max(
          -halfHeight,
          Math.min(halfHeight, modelPoint.y),
        );

        // Update the model
        this.model.excitationPositionProperty.value = new Vector2(
          clampedX,
          clampedY,
        );
      },
      end: () => {
        this.options.onDragEnd?.();
      },
    });

    this.addInputListener(dragListener);
  }

  /**
   * Update the marker position based on the model.
   * Uses ModelViewTransform2 to convert from model to view coordinates.
   */
  public updatePosition(): void {
    const transform = this.options.getModelViewTransform();
    const vizBounds = this.options.getVisualizationBounds();

    // Get model position (centered coordinates, +Y up)
    const modelPosition = this.model.excitationPositionProperty.value;

    // Convert to view coordinates using the transform
    const viewPosition = transform.modelToViewPosition(modelPosition);

    // Position relative to visualization bounds
    this.centerX = vizBounds.minX + viewPosition.x;
    this.centerY = vizBounds.minY + viewPosition.y;
  }
}
