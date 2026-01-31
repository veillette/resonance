/**
 * ChladniScreenView.ts
 *
 * View for the Chladni plate pattern visualization.
 * Contains the particle visualization, control panel, and playback controls.
 */

import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { Circle, DragListener, Node, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton, PlayPauseStepButtonGroup } from "scenerystack/scenery-phet";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { ChladniModel } from "../model/ChladniModel.js";
import { ChladniVisualizationNode } from "./ChladniVisualizationNode.js";
import { ChladniControlPanel } from "./ChladniControlPanel.js";
import { ResonanceCurveNode } from "./ResonanceCurveNode.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";

// Size of the Chladni plate visualization
const VISUALIZATION_SIZE = 450;

// Excitation marker properties
const EXCITATION_MARKER_RADIUS = 12;
const EXCITATION_MARKER_INNER_RADIUS = 4;

export class ChladniScreenView extends ScreenView {
  private readonly model: ChladniModel;
  private readonly visualizationNode: ChladniVisualizationNode;
  private readonly excitationMarker: Node;
  private readonly controlPanel: ChladniControlPanel;
  private readonly resonanceCurveNode: ResonanceCurveNode;
  private readonly curveContainer: VBox;

  public constructor(model: ChladniModel, options?: ScreenViewOptions) {
    super(options);
    this.model = model;

    // Create the particle visualization
    this.visualizationNode = new ChladniVisualizationNode(model, {
      visualizationSize: VISUALIZATION_SIZE,
    });

    // Center the visualization on the left side of the screen
    this.visualizationNode.centerX = this.layoutBounds.centerX - 100;
    this.visualizationNode.centerY = this.layoutBounds.centerY;

    this.addChild(this.visualizationNode);

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

    // Create playback controls
    const playbackControls = this.createPlaybackControls();
    this.addChild(playbackControls);

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

    // Calculate drag bounds (within the visualization)
    const vizBounds = this.visualizationNode.bounds;
    const dragBounds = new Bounds2(
      vizBounds.minX,
      vizBounds.minY,
      vizBounds.maxX,
      vizBounds.maxY,
    );

    // Add drag listener
    const dragListener = new DragListener({
      positionProperty: this.model.excitationPositionProperty,
      dragBoundsProperty: null, // We'll handle bounds manually
      transform: null,
      drag: (event, listener) => {
        // Get the position in the visualization's local coordinate system
        const localPoint = this.visualizationNode.globalToLocalPoint(event.pointer.point);

        // Convert to normalized coordinates (0-1)
        const normalizedX = Math.max(0, Math.min(1, localPoint.x / VISUALIZATION_SIZE));
        const normalizedY = Math.max(0, Math.min(1, localPoint.y / VISUALIZATION_SIZE));

        // Update the model
        this.model.excitationPositionProperty.value = new Vector2(normalizedX, normalizedY);
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
   */
  private updateExcitationMarkerPosition(): void {
    if (!this.excitationMarker) return;

    const excitation = this.model.excitationPositionProperty.value;
    const vizBounds = this.visualizationNode.bounds;

    // Convert normalized (0-1) to view coordinates
    this.excitationMarker.centerX = vizBounds.minX + excitation.x * VISUALIZATION_SIZE;
    this.excitationMarker.centerY = vizBounds.minY + excitation.y * VISUALIZATION_SIZE;
  }

  public reset(): void {
    this.controlPanel.reset();
    this.visualizationNode.update();
  }

  public override step(dt: number): void {
    // Step the physics model
    this.model.step(dt);

    // Update the visualization
    this.visualizationNode.update();
  }
}
