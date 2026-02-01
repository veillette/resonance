/**
 * ChladniScreenView.ts
 *
 * View for the Chladni plate pattern visualization.
 * Contains the particle visualization, control panel, and playback controls.
 * Supports resizing the plate via a corner drag handle.
 *
 * Coordinate System:
 * - Model: (0,0) at plate center, x in [-width/2, width/2], y in [-height/2, height/2], +Y up
 * - View: (0,0) at top-left of visualization, +Y down
 * - ModelViewTransform2 handles the conversion with Y inversion
 */

import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { Circle, DragListener, Node, Path, Rectangle, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton, PlayPauseStepButtonGroup } from "scenerystack/scenery-phet";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { ChladniModel } from "../model/ChladniModel.js";
import { ChladniVisualizationNode } from "./ChladniVisualizationNode.js";
import { ChladniControlPanel } from "./ChladniControlPanel.js";
import { ResonanceCurveNode } from "./ResonanceCurveNode.js";
import { ChladniRulerNode } from "./ChladniRulerNode.js";
import { ChladniGridNode } from "./ChladniGridNode.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import { ResonancePreferencesModel } from "../../preferences/ResonancePreferencesModel.js";

// Base size for the Chladni plate visualization (pixels per meter of plate)
const PIXELS_PER_METER = 1400;

// Excitation marker properties
const EXCITATION_MARKER_RADIUS = 12;
const EXCITATION_MARKER_INNER_RADIUS = 4;

// Resize handle properties
const RESIZE_HANDLE_SIZE = 24;
const RESIZE_HANDLE_HIT_AREA = 36;

export class ChladniScreenView extends ScreenView {
  private readonly model: ChladniModel;
  private readonly preferencesModel: ResonancePreferencesModel;
  private readonly visualizationNode: ChladniVisualizationNode;
  private readonly excitationMarker: Node;
  private readonly resizeHandle: Node;
  private readonly controlPanel: ChladniControlPanel;
  private readonly resonanceCurveNode: ResonanceCurveNode;
  private readonly curveContainer: VBox;
  private readonly playbackControls: Node;
  private readonly rulerNode: ChladniRulerNode;
  private readonly gridNode: ChladniGridNode;

  // Center position of the visualization in screen coordinates (fixed during resize)
  private readonly visualizationCenterX: number;
  private readonly visualizationCenterY: number;

  // Model-View transform for coordinate conversion
  // Model: (0,0) at center, +Y up; View: (0,0) at top-left of viz, +Y down
  private modelViewTransform: ModelViewTransform2;

  public constructor(model: ChladniModel, preferencesModel: ResonancePreferencesModel, options?: ScreenViewOptions) {
    super(options);
    this.model = model;
    this.preferencesModel = preferencesModel;

    // Fixed center position for the visualization
    this.visualizationCenterX = this.layoutBounds.centerX - 100;
    this.visualizationCenterY = this.layoutBounds.centerY;

    // Calculate initial visualization dimensions
    const initialWidth = model.plateWidth * PIXELS_PER_METER;
    const initialHeight = model.plateHeight * PIXELS_PER_METER;

    // Create the model-view transform
    // Model: centered coordinates with +Y up
    // View: top-left origin with +Y down
    this.modelViewTransform = this.createModelViewTransform(initialWidth, initialHeight);

    // Create the particle visualization with proper dimensions and transform
    this.visualizationNode = new ChladniVisualizationNode(model, preferencesModel.rendererTypeProperty, {
      visualizationWidth: initialWidth,
      visualizationHeight: initialHeight,
    });

    // Center the visualization
    this.visualizationNode.centerX = this.visualizationCenterX;
    this.visualizationNode.centerY = this.visualizationCenterY;

    this.addChild(this.visualizationNode);

    // Create the grid overlay (behind particles, but on visualization)
    this.gridNode = new ChladniGridNode(
      initialWidth,
      initialHeight,
      model.plateWidth,
      model.plateHeight,
    );
    this.gridNode.visible = false;
    this.gridNode.x = this.visualizationNode.bounds.minX;
    this.gridNode.y = this.visualizationNode.bounds.minY;
    this.addChild(this.gridNode);

    // Create the ruler overlay
    this.rulerNode = new ChladniRulerNode(
      initialWidth,
      initialHeight,
      model.plateWidth,
      model.plateHeight,
    );
    this.rulerNode.visible = false;
    this.rulerNode.x = this.visualizationNode.bounds.minX;
    this.rulerNode.y = this.visualizationNode.bounds.minY;
    this.addChild(this.rulerNode);

    // Create the resize handle at the bottom-right corner
    this.resizeHandle = this.createResizeHandle();
    this.addChild(this.resizeHandle);
    this.updateResizeHandlePosition();

    // Create the draggable excitation marker
    this.excitationMarker = this.createExcitationMarker();
    this.addChild(this.excitationMarker);
    this.updateExcitationMarkerPosition();

    // Create the control panel first so we can position the curve relative to it
    this.controlPanel = new ChladniControlPanel(model, this.layoutBounds);
    this.addChild(this.controlPanel);
    this.addChild(this.controlPanel.comboBoxListParent);

    // Create the resonance curve display
    const curveLabel = new Text(ResonanceStrings.chladni.resonanceCurveStringProperty, {
      font: ResonanceConstants.LABEL_FONT,
      fill: ResonanceColors.textProperty,
    });

    this.resonanceCurveNode = new ResonanceCurveNode(model);

    this.curveContainer = new VBox({
      children: [curveLabel, this.resonanceCurveNode],
      spacing: 5,
      align: "center",
    });

    // Position below the control panel, aligned to right side
    this.curveContainer.right = this.layoutBounds.maxX - ResonanceConstants.CONTROL_PANEL_RIGHT_MARGIN;
    this.curveContainer.top = this.controlPanel.bottom + 15;

    this.addChild(this.curveContainer);

    // Link curve visibility to the checkbox property
    this.controlPanel.showResonanceCurveProperty.linkAttribute(this.curveContainer, "visible");

    // Link ruler visibility to the checkbox property
    this.controlPanel.showRulerProperty.linkAttribute(this.rulerNode, "visible");

    // Link grid visibility to the checkbox property
    this.controlPanel.showGridProperty.linkAttribute(this.gridNode, "visible");

    // Create playback controls
    this.playbackControls = this.createPlaybackControls();
    this.addChild(this.playbackControls);

    // Create reset button
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - ResonanceConstants.RESET_ALL_RIGHT_MARGIN,
      bottom:
        this.layoutBounds.maxY - ResonanceConstants.RESET_ALL_BOTTOM_MARGIN,
    });
    this.addChild(resetAllButton);

    // Listen to plate dimension changes to update the visualization
    model.plateWidthProperty.link(() => this.updateVisualizationSize());
    model.plateHeightProperty.link(() => this.updateVisualizationSize());
  }

  /**
   * Create a ModelViewTransform2 for converting between model and view coordinates.
   * Model: (0,0) at center, x in [-w/2, w/2], y in [-h/2, h/2], +Y up
   * View: (0,0) at top-left, x in [0, viewWidth], y in [0, viewHeight], +Y down
   */
  private createModelViewTransform(viewWidth: number, viewHeight: number): ModelViewTransform2 {
    const plateWidth = this.model.plateWidth;
    const plateHeight = this.model.plateHeight;

    // Model bounds: centered coordinates
    const modelBounds = new Bounds2(
      -plateWidth / 2, -plateHeight / 2,
      plateWidth / 2, plateHeight / 2
    );

    // View bounds: (0,0) at top-left
    const viewBounds = new Bounds2(0, 0, viewWidth, viewHeight);

    // Create transform with Y inversion (model +Y up, view +Y down)
    return ModelViewTransform2.createRectangleInvertedYMapping(modelBounds, viewBounds);
  }

  /**
   * Update the visualization size based on the model's plate dimensions.
   */
  private updateVisualizationSize(): void {
    const newWidth = this.model.plateWidth * PIXELS_PER_METER;
    const newHeight = this.model.plateHeight * PIXELS_PER_METER;

    // Update the model-view transform
    this.modelViewTransform = this.createModelViewTransform(newWidth, newHeight);

    // Resize the visualization node
    this.visualizationNode.resize(newWidth, newHeight);

    // Re-center the visualization (keep center fixed)
    this.visualizationNode.centerX = this.visualizationCenterX;
    this.visualizationNode.centerY = this.visualizationCenterY;

    // Update dependent elements
    this.updateResizeHandlePosition();
    this.updateExcitationMarkerPosition();
    this.updateRulerAndGrid();
    this.visualizationNode.update();
  }

  /**
   * Update the ruler and grid overlays for the current visualization size.
   */
  private updateRulerAndGrid(): void {
    const vizWidth = this.visualizationNode.getVisualizationWidth();
    const vizHeight = this.visualizationNode.getVisualizationHeight();
    const vizBounds = this.visualizationNode.bounds;

    // Update dimensions
    this.rulerNode.updateDimensions(
      vizWidth,
      vizHeight,
      this.model.plateWidth,
      this.model.plateHeight,
    );
    this.gridNode.updateDimensions(
      vizWidth,
      vizHeight,
      this.model.plateWidth,
      this.model.plateHeight,
    );

    // Update positions to match visualization bounds
    this.rulerNode.x = vizBounds.minX;
    this.rulerNode.y = vizBounds.minY;
    this.gridNode.x = vizBounds.minX;
    this.gridNode.y = vizBounds.minY;
  }

  /**
   * Create the resize handle for the bottom-right corner.
   * Dragging this handle resizes the plate while keeping the center fixed.
   */
  private createResizeHandle(): Node {
    // Larger invisible hit area for easier grabbing
    const hitArea = new Rectangle(0, 0, RESIZE_HANDLE_HIT_AREA, RESIZE_HANDLE_HIT_AREA, {
      fill: "rgba(0,0,0,0.01)", // Nearly invisible but still catches events
      cursor: "nwse-resize",
    });

    // Create a diagonal resize indicator (three diagonal lines)
    const handleShape = new Shape();
    for (let i = 0; i < 4; i++) {
      const offset = i * 5;
      handleShape.moveTo(RESIZE_HANDLE_SIZE - offset, RESIZE_HANDLE_SIZE);
      handleShape.lineTo(RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE - offset);
    }

    const handleLines = new Path(handleShape, {
      stroke: ResonanceColors.textProperty,
      lineWidth: 2.5,
      lineCap: "round",
    });

    // Position the visual indicator at the bottom-right of the hit area
    handleLines.right = RESIZE_HANDLE_HIT_AREA;
    handleLines.bottom = RESIZE_HANDLE_HIT_AREA;

    const handle = new Node({
      children: [hitArea, handleLines],
      cursor: "nwse-resize",
    });

    // Track the starting position for the drag
    let dragStartPoint: Vector2 | null = null;
    let startWidth = 0;
    let startHeight = 0;

    const dragListener = new DragListener({
      start: (event) => {
        dragStartPoint = event.pointer.point.copy();
        startWidth = this.model.plateWidthProperty.value;
        startHeight = this.model.plateHeightProperty.value;
      },
      drag: (event) => {
        if (!dragStartPoint) return;

        // Calculate the drag delta
        const currentPoint = event.pointer.point;
        const deltaX = currentPoint.x - dragStartPoint.x;
        const deltaY = currentPoint.y - dragStartPoint.y;

        // Convert pixel delta to physical dimension delta
        // Since we're dragging the corner, the delta is half the total size change
        // (because center is fixed, the opposite corner moves by the same amount)
        const widthDelta = (deltaX * 2) / PIXELS_PER_METER;
        const heightDelta = (deltaY * 2) / PIXELS_PER_METER;

        // Calculate new dimensions
        const widthRange = this.model.plateWidthProperty.range;
        const heightRange = this.model.plateHeightProperty.range;
        const newWidth = Math.max(
          widthRange.min,
          Math.min(widthRange.max, startWidth + widthDelta)
        );
        const newHeight = Math.max(
          heightRange.min,
          Math.min(heightRange.max, startHeight + heightDelta)
        );

        // Update the model
        this.model.plateWidthProperty.value = newWidth;
        this.model.plateHeightProperty.value = newHeight;
      },
      end: () => {
        dragStartPoint = null;
      },
    });

    handle.addInputListener(dragListener);

    return handle;
  }

  /**
   * Update the position of the resize handle to the bottom-right corner.
   */
  private updateResizeHandlePosition(): void {
    const vizBounds = this.visualizationNode.bounds;
    this.resizeHandle.right = vizBounds.maxX;
    this.resizeHandle.bottom = vizBounds.maxY;
  }

  /**
   * Create the play/pause and step controls.
   */
  private createPlaybackControls(): Node {
    const playPauseStepButtonGroup = new PlayPauseStepButtonGroup(
      this.model.isPlayingProperty,
      {
        stepForwardButtonOptions: {
          listener: () => {
            // Step the model forward by a fixed amount
            this.model.step(ResonanceConstants.STEP_DT);
            this.visualizationNode.update();
          },
        },
      },
    );

    // Position at the bottom center of the screen
    playPauseStepButtonGroup.centerX = this.visualizationNode.centerX;
    playPauseStepButtonGroup.bottom = this.layoutBounds.maxY - ResonanceConstants.PLAYBACK_BOTTOM_MARGIN;

    return playPauseStepButtonGroup;
  }

  /**
   * Create the draggable excitation position marker.
   * This shows where the plate is being driven (vibrator position).
   */
  private createExcitationMarker(): Node {
    // Outer circle (ring)
    const outerCircle = new Circle(EXCITATION_MARKER_RADIUS, {
      stroke: ResonanceColors.frequencyTrackProperty,
      lineWidth: 3,
      fill: null,
    });

    // Inner filled circle
    const innerCircle = new Circle(EXCITATION_MARKER_INNER_RADIUS, {
      fill: ResonanceColors.frequencyTrackProperty,
    });

    // Container node for the marker
    const marker = new Node({
      children: [outerCircle, innerCircle],
      cursor: "pointer",
    });

    // Add drag listener
    const dragListener = new DragListener({
      positionProperty: this.model.excitationPositionProperty,
      dragBoundsProperty: null, // We'll handle bounds manually
      transform: null,
      drag: (event) => {
        // Get the position in the visualization's local coordinate system (view coords)
        const viewPoint = this.visualizationNode.globalToLocalPoint(event.pointer.point);

        // Convert view coordinates to model coordinates using the transform
        const modelPoint = this.modelViewTransform.viewToModelPosition(viewPoint);

        // Clamp to plate boundaries (centered model coordinates)
        const halfWidth = this.model.plateWidth / 2;
        const halfHeight = this.model.plateHeight / 2;
        const clampedX = Math.max(-halfWidth, Math.min(halfWidth, modelPoint.x));
        const clampedY = Math.max(-halfHeight, Math.min(halfHeight, modelPoint.y));

        // Update the model
        this.model.excitationPositionProperty.value = new Vector2(clampedX, clampedY);
      },
      end: () => {
        // Update visualization when drag ends
        this.visualizationNode.update();
      },
    });

    marker.addInputListener(dragListener);

    // Update marker position when model changes
    this.model.excitationPositionProperty.link(() => {
      // Only update if marker is already set (avoid calling during initialization)
      if (this.excitationMarker) {
        this.updateExcitationMarkerPosition();
        this.visualizationNode.update();
      }
    });

    return marker;
  }

  /**
   * Update the excitation marker position based on the model.
   * Uses ModelViewTransform2 to convert from model to view coordinates.
   */
  private updateExcitationMarkerPosition(): void {
    if (!this.excitationMarker) return;

    // Get model position (centered coordinates, +Y up)
    const modelPosition = this.model.excitationPositionProperty.value;

    // Convert to view coordinates using the transform
    const viewPosition = this.modelViewTransform.modelToViewPosition(modelPosition);

    // Position relative to visualization bounds
    const vizBounds = this.visualizationNode.bounds;
    this.excitationMarker.centerX = vizBounds.minX + viewPosition.x;
    this.excitationMarker.centerY = vizBounds.minY + viewPosition.y;
  }

  public reset(): void {
    this.controlPanel.reset();
    this.updateVisualizationSize();
    this.visualizationNode.update();
  }

  public override step(_dt: number): void {
    // Note: model.step(dt) is called by the Screen base class, not here
    // to avoid double-stepping

    // Update the visualization
    this.visualizationNode.update();
  }
}
