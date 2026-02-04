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
  Voicing,
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

// Apply Voicing mixin to Node for spoken descriptions
const VoicingNode = Voicing(Node);

export class ExcitationMarkerNode extends VoicingNode {
  private readonly model: ChladniModel;
  private readonly options: ExcitationMarkerNodeOptions;

  // View-coordinate position property for drag handling
  // This is kept in sync with the model's excitation position
  private readonly viewPositionProperty: Property<Vector2>;
  private isUpdatingFromModel = false;
  private isUpdatingFromView = false;

  public constructor(
    model: ChladniModel,
    options: ExcitationMarkerNodeOptions,
  ) {
    super({ cursor: "pointer" });

    this.model = model;
    this.options = options;

    // Create view position property initialized from model
    const initialViewPos = this.modelToViewPosition(
      model.excitationPositionProperty.value,
    );
    this.viewPositionProperty = new Property(initialViewPos);

    // Bidirectional sync: model -> view
    model.excitationPositionProperty.link((modelPos) => {
      if (this.isUpdatingFromView) return;
      this.isUpdatingFromModel = true;
      this.viewPositionProperty.value = this.modelToViewPosition(modelPos);
      this.isUpdatingFromModel = false;
    });

    // Bidirectional sync: view -> model
    this.viewPositionProperty.lazyLink((viewPos) => {
      if (this.isUpdatingFromModel) return;
      this.isUpdatingFromView = true;
      model.excitationPositionProperty.value =
        this.viewToModelPosition(viewPos);
      this.isUpdatingFromView = false;
    });

    // Create the marker visuals
    this.createMarker();

    // Add drag listener
    this.addDragListener();

    // Add keyboard drag listener for accessibility
    this.addKeyboardDragListener();

    // Update node position when view position changes
    this.viewPositionProperty.link((viewPos) => {
      this.center = viewPos;
    });

    // --- Accessibility (PDOM) Setup ---
    this.tagName = "div";
    this.focusable = true;
    this.accessibleName =
      ResonanceStrings.chladni.a11y.excitationMarkerLabelStringProperty;
    this.descriptionContent =
      ResonanceStrings.chladni.a11y.excitationMarkerDescriptionStringProperty;

    // --- Voicing Setup ---
    // Spoken when the marker receives focus
    this.voicingNameResponse =
      ResonanceStrings.chladni.a11y.excitationMarkerLabelStringProperty;
    this.voicingHintResponse =
      "Use arrow keys to move. Hold Shift for fine control.";
  }

  /**
   * Convert model position to global view position.
   */
  private modelToViewPosition(modelPos: Vector2): Vector2 {
    const transform = this.options.getModelViewTransform();
    const vizBounds = this.options.getVisualizationBounds();
    const localView = transform.modelToViewPosition(modelPos);
    return new Vector2(
      vizBounds.minX + localView.x,
      vizBounds.minY + localView.y,
    );
  }

  /**
   * Convert global view position to model position.
   */
  private viewToModelPosition(viewPos: Vector2): Vector2 {
    const transform = this.options.getModelViewTransform();
    const vizBounds = this.options.getVisualizationBounds();
    const localView = new Vector2(
      viewPos.x - vizBounds.minX,
      viewPos.y - vizBounds.minY,
    );
    return transform.viewToModelPosition(localView);
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
    // Create drag bounds in view coordinates
    const createDragBounds = () => {
      const vizBounds = this.options.getVisualizationBounds();
      return vizBounds;
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
      positionProperty: this.viewPositionProperty,
      dragBoundsProperty: dragBoundsProperty,
      useParentOffset: true,
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
    // Create drag bounds based on plate dimensions (in model coordinates)
    const createDragBounds = () => {
      const halfWidth = this.model.plateWidth / 2;
      const halfHeight = this.model.plateHeight / 2;
      return new Bounds2(-halfWidth, -halfHeight, halfWidth, halfHeight);
    };
    const dragBoundsProperty = new Property(createDragBounds());

    // Update drag bounds when plate dimensions change
    this.model.plateWidthProperty.link(() => {
      dragBoundsProperty.value = createDragBounds();
    });
    this.model.plateHeightProperty.link(() => {
      dragBoundsProperty.value = createDragBounds();
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
   * Called when visualization size changes.
   */
  public updatePosition(): void {
    // Trigger re-sync from model to view
    this.isUpdatingFromModel = true;
    this.viewPositionProperty.value = this.modelToViewPosition(
      this.model.excitationPositionProperty.value,
    );
    this.isUpdatingFromModel = false;
  }
}
