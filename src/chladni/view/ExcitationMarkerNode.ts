/**
 * ExcitationMarkerNode.ts
 *
 * A draggable marker that shows the excitation position on the Chladni plate.
 * This is where the plate is being driven (vibrator position).
 * Extracted from ChladniScreenView for better separation of concerns.
 */

import {
  Circle,
  DragListener,
  KeyboardDragListener,
  Node,
} from "scenerystack/scenery";
import { Bounds2, Transform3, Vector2 } from "scenerystack/dot";
import { Property } from "scenerystack/axon";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { ChladniModel } from "../model/ChladniModel.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import { Matrix3 } from "scenerystack/dot";

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

    // Add keyboard drag listener for accessibility
    this.addKeyboardDragListener();

    // Update position when model changes
    model.excitationPositionProperty.link(() => {
      this.updatePosition();
    });

    // --- Accessibility (PDOM) Setup ---
    this.tagName = "div";
    this.focusable = true;
    this.accessibleName =
      ResonanceStrings.chladni.a11y.excitationMarkerLabelStringProperty;
    this.descriptionContent =
      ResonanceStrings.chladni.a11y.excitationMarkerDescriptionStringProperty;
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
    // Create drag bounds in model coordinates
    const createDragBounds = () => {
      const halfWidth = this.model.plateWidth / 2;
      const halfHeight = this.model.plateHeight / 2;
      return new Bounds2(-halfWidth, -halfHeight, halfWidth, halfHeight);
    };
    const dragBoundsProperty = new Property(createDragBounds());

    // Update bounds when plate dimensions change
    this.model.plateWidthProperty.link(() => {
      dragBoundsProperty.value = createDragBounds();
    });
    this.model.plateHeightProperty.link(() => {
      dragBoundsProperty.value = createDragBounds();
    });

    const dragListener = new DragListener({
      positionProperty: this.model.excitationPositionProperty,
      dragBoundsProperty: dragBoundsProperty,
      // Use visualization node's coordinate frame for drag positions
      targetNode: this.options.getVisualizationNode(),
      // Transform from view coordinates to model coordinates
      transform: this.options.getModelViewTransform(),
      // Don't apply pointer offset - excitation point moves directly to pointer location
      applyOffset: false,
      end: () => {
        this.options.onDragEnd?.();
      },
    });

    this.addInputListener(dragListener);
  }

  /**
   * Add keyboard drag listener for accessibility.
   * Allows arrow key navigation to move the excitation point.
   */
  private addKeyboardDragListener(): void {
    // Create drag bounds based on plate dimensions
    const halfWidth = this.model.plateWidth / 2;
    const halfHeight = this.model.plateHeight / 2;
    const dragBounds = new Bounds2(
      -halfWidth,
      -halfHeight,
      halfWidth,
      halfHeight,
    );
    const dragBoundsProperty = new Property(dragBounds);

    // Update drag bounds when plate dimensions change
    this.model.plateWidthProperty.link(() => {
      const hw = this.model.plateWidth / 2;
      const hh = this.model.plateHeight / 2;
      dragBoundsProperty.value = new Bounds2(-hw, -hh, hw, hh);
    });
    this.model.plateHeightProperty.link(() => {
      const hw = this.model.plateWidth / 2;
      const hh = this.model.plateHeight / 2;
      dragBoundsProperty.value = new Bounds2(-hw, -hh, hw, hh);
    });

    // Create a transform that inverts Y axis for keyboard drag
    // This is needed because KeyboardDragListener assumes screen coordinates (+Y down)
    // but excitationPositionProperty uses model coordinates (+Y up)
    const invertYTransform = new Transform3(Matrix3.scaling(1, -1));

    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: this.model.excitationPositionProperty,
      dragBoundsProperty: dragBoundsProperty,
      dragSpeed: 0.05, // meters per second (model units)
      shiftDragSpeed: 0.01, // slower with shift key for fine control
      transform: invertYTransform,
    });

    this.addInputListener(keyboardDragListener);
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
