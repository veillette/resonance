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
 *
 * Keyboard Controls:
 * - Space: Toggle play/pause
 * - Left/Right arrows: Adjust frequency (10 Hz increments, Shift for 100 Hz)
 * - Up/Down arrows: Adjust frequency (100 Hz increments, Shift for 500 Hz)
 * - R: Reset all
 * - Escape: Stop sweep if running
 */

import { Multilink } from "scenerystack/axon";
import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import {
  DragListener,
  KeyboardUtils,
  Node,
  Path,
  Rectangle,
  Text,
  VBox,
} from "scenerystack/scenery";
import {
  ResetAllButton,
  PlayPauseStepButtonGroup,
} from "scenerystack/scenery-phet";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { ChladniModel } from "../model/ChladniModel.js";
import { ChladniVisualizationNode } from "./ChladniVisualizationNode.js";
import { ChladniControlPanel } from "./ChladniControlPanel.js";
import { ResonanceCurveNode } from "./ResonanceCurveNode.js";
import { ChladniRulerNode } from "./ChladniRulerNode.js";
import { ChladniGridNode } from "./ChladniGridNode.js";
import { DisplacementColormapNode } from "./DisplacementColormapNode.js";
import { ModalShapeNode } from "./ModalShapeNode.js";
import { ExcitationMarkerNode } from "./ExcitationMarkerNode.js";
import { createChladniTransform } from "./ChladniTransformFactory.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import { ResonancePreferencesModel } from "../../preferences/ResonancePreferencesModel.js";

// Base size for the Chladni plate visualization (pixels per meter of plate)
const PIXELS_PER_METER = 1400;

// Resize handle properties
const RESIZE_HANDLE_SIZE = 24;
const RESIZE_HANDLE_HIT_AREA = 36;

// Keyboard frequency adjustment increments (Hz)
const FREQUENCY_STEP_SMALL = 10;
const FREQUENCY_STEP_MEDIUM = 100;
const FREQUENCY_STEP_LARGE = 500;

export class ChladniScreenView extends ScreenView {
  private readonly model: ChladniModel;
  private readonly visualizationNode: ChladniVisualizationNode;
  private readonly excitationMarker: ExcitationMarkerNode;
  private readonly resizeHandle: Node;
  private readonly controlPanel: ChladniControlPanel;
  private readonly resonanceCurveNode: ResonanceCurveNode;
  private readonly curveContainer: VBox;
  private readonly playbackControls: Node;
  private readonly rulerNode: ChladniRulerNode;
  private readonly gridNode: ChladniGridNode;
  private readonly colormapNode: DisplacementColormapNode;
  private modalShapeNode!: ModalShapeNode;

  // Center position of the visualization in screen coordinates (fixed during resize)
  private readonly visualizationCenterX: number;
  private readonly visualizationCenterY: number;

  // Model-View transform for coordinate conversion
  private modelViewTransform: ModelViewTransform2;

  public constructor(
    model: ChladniModel,
    preferencesModel: ResonancePreferencesModel,
    options?: ScreenViewOptions,
  ) {
    super(options);
    this.model = model;

    // Fixed center position for the visualization
    this.visualizationCenterX = this.layoutBounds.centerX - 100;
    this.visualizationCenterY = this.layoutBounds.centerY;

    // Calculate initial visualization dimensions
    const initialWidth = model.plateWidth * PIXELS_PER_METER;
    const initialHeight = model.plateHeight * PIXELS_PER_METER;

    // Create the model-view transform using the shared factory
    this.modelViewTransform = createChladniTransform(
      model.plateWidth,
      model.plateHeight,
      initialWidth,
      initialHeight,
    );

    // Create the particle visualization with proper dimensions and transform
    this.visualizationNode = new ChladniVisualizationNode(
      model,
      preferencesModel.rendererTypeProperty,
      {
        visualizationWidth: initialWidth,
        visualizationHeight: initialHeight,
      },
    );

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

    // Create the displacement colormap overlay (behind particles)
    this.colormapNode = new DisplacementColormapNode(
      initialWidth,
      initialHeight,
      model.plateWidth,
      model.plateHeight,
      (x: number, y: number) => model.psi(x, y),
    );
    this.colormapNode.visible = false;
    this.colormapNode.x = this.visualizationNode.bounds.minX;
    this.colormapNode.y = this.visualizationNode.bounds.minY;
    // Insert behind visualization but in front of background
    this.addChild(this.colormapNode);
    this.colormapNode.moveToBack();

    // Note: Modal shape node is created after control panel so we can use its mode property

    // Create the resize handle at the bottom-right corner
    this.resizeHandle = this.createResizeHandle();
    this.addChild(this.resizeHandle);
    this.updateResizeHandlePosition();

    // Create the draggable excitation marker using extracted component
    this.excitationMarker = new ExcitationMarkerNode(model, {
      getModelViewTransform: () => this.modelViewTransform,
      getVisualizationBounds: () => this.visualizationNode.bounds,
      getVisualizationNode: () => this.visualizationNode,
      onDragEnd: () => this.visualizationNode.update(),
    });
    this.addChild(this.excitationMarker);
    this.excitationMarker.updatePosition();

    // Create the control panel first so we can position the curve relative to it
    this.controlPanel = new ChladniControlPanel(model, this.layoutBounds);
    this.addChild(this.controlPanel);
    this.addChild(this.controlPanel.comboBoxListParent);

    // Create the resonance curve display
    const curveLabel = new Text(
      ResonanceStrings.chladni.resonanceCurveStringProperty,
      {
        font: ResonanceConstants.LABEL_FONT,
        fill: ResonanceColors.textProperty,
      },
    );

    this.resonanceCurveNode = new ResonanceCurveNode(model);

    this.curveContainer = new VBox({
      children: [curveLabel, this.resonanceCurveNode],
      spacing: 5,
      align: "center",
    });

    // Position below the control panel, aligned to right side
    this.curveContainer.right =
      this.layoutBounds.maxX - ResonanceConstants.CONTROL_PANEL_RIGHT_MARGIN;
    this.curveContainer.top = this.controlPanel.bottom + 15;

    this.addChild(this.curveContainer);

    // Link curve visibility to the checkbox property
    this.controlPanel.showResonanceCurveProperty.linkAttribute(
      this.curveContainer,
      "visible",
    );

    // Link ruler visibility to the checkbox property
    this.controlPanel.showRulerProperty.linkAttribute(
      this.rulerNode,
      "visible",
    );

    // Link grid visibility to the checkbox property
    this.controlPanel.showGridProperty.linkAttribute(this.gridNode, "visible");

    // Link colormap visibility to the checkbox property
    this.controlPanel.showColormapProperty.linkAttribute(
      this.colormapNode,
      "visible",
    );

    // Create the modal shape overlay (after control panel so we can use its mode property)
    this.modalShapeNode = new ModalShapeNode(
      initialWidth,
      initialHeight,
      model.plateWidth,
      model.plateHeight,
      this.controlPanel.selectedModeProperty,
      model.waveNumber,
    );
    this.modalShapeNode.visible = false;
    this.modalShapeNode.x = this.visualizationNode.bounds.minX;
    this.modalShapeNode.y = this.visualizationNode.bounds.minY;
    this.addChild(this.modalShapeNode);
    this.modalShapeNode.moveToBack();

    // Link modal shape visibility to the checkbox property (after node is created)
    this.controlPanel.showModalShapeProperty.linkAttribute(
      this.modalShapeNode,
      "visible",
    );

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
    // Using Multilink for coordinated updates
    Multilink.multilink(
      [model.plateWidthProperty, model.plateHeightProperty],
      () => this.updateVisualizationSize(),
    );

    // Set up keyboard accessibility
    this.setupKeyboardControls();
  }

  /**
   * Set up keyboard controls for accessibility.
   * - Space: Toggle play/pause
   * - Left/Right arrows: Adjust frequency (10 Hz, Shift for 100 Hz)
   * - Up/Down arrows: Adjust frequency (100 Hz, Shift for 500 Hz)
   * - R: Reset all
   * - Escape: Stop sweep if running
   */
  private setupKeyboardControls(): void {
    // Use DOM event listener for global keyboard handling
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const shiftPressed = event.shiftKey;

      if (KeyboardUtils.isKeyEvent(event, KeyboardUtils.KEY_SPACE)) {
        // Toggle play/pause
        event.preventDefault();
        this.model.isPlayingProperty.value =
          !this.model.isPlayingProperty.value;
      } else if (KeyboardUtils.isArrowKey(event)) {
        event.preventDefault();

        if (KeyboardUtils.isKeyEvent(event, KeyboardUtils.KEY_LEFT_ARROW)) {
          // Decrease frequency
          const step = shiftPressed
            ? FREQUENCY_STEP_MEDIUM
            : FREQUENCY_STEP_SMALL;
          this.adjustFrequency(-step);
        } else if (
          KeyboardUtils.isKeyEvent(event, KeyboardUtils.KEY_RIGHT_ARROW)
        ) {
          // Increase frequency
          const step = shiftPressed
            ? FREQUENCY_STEP_MEDIUM
            : FREQUENCY_STEP_SMALL;
          this.adjustFrequency(step);
        } else if (
          KeyboardUtils.isKeyEvent(event, KeyboardUtils.KEY_DOWN_ARROW)
        ) {
          // Decrease frequency (larger step)
          const step = shiftPressed
            ? FREQUENCY_STEP_LARGE
            : FREQUENCY_STEP_MEDIUM;
          this.adjustFrequency(-step);
        } else if (KeyboardUtils.isKeyEvent(event, KeyboardUtils.KEY_UP_ARROW)) {
          // Increase frequency (larger step)
          const step = shiftPressed
            ? FREQUENCY_STEP_LARGE
            : FREQUENCY_STEP_MEDIUM;
          this.adjustFrequency(step);
        }
      } else if (event.key.toLowerCase() === "r" && !event.ctrlKey) {
        // Reset all (but not Ctrl+R which is browser refresh)
        event.preventDefault();
        this.model.reset();
        this.reset();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardUtils.KEY_ESCAPE)) {
        // Stop sweep if running
        if (this.model.isSweepingProperty.value) {
          event.preventDefault();
          this.model.stopSweep();
        }
      }
    };

    // Add global keyboard listener
    window.addEventListener("keydown", handleKeyDown);
  }

  /**
   * Adjust the frequency by the given delta, clamping to valid range.
   */
  private adjustFrequency(delta: number): void {
    const currentFreq = this.model.frequencyProperty.value;
    const newFreq = currentFreq + delta;
    const range = this.model.frequencyRange;
    this.model.frequencyProperty.value = Math.max(
      range.min,
      Math.min(range.max, newFreq),
    );
  }

  /**
   * Update the visualization size based on the model's plate dimensions.
   */
  private updateVisualizationSize(): void {
    const newWidth = this.model.plateWidth * PIXELS_PER_METER;
    const newHeight = this.model.plateHeight * PIXELS_PER_METER;

    // Update the model-view transform using the shared factory
    this.modelViewTransform = createChladniTransform(
      this.model.plateWidth,
      this.model.plateHeight,
      newWidth,
      newHeight,
    );

    // Resize the visualization node
    this.visualizationNode.resize(newWidth, newHeight);

    // Re-center the visualization (keep center fixed)
    this.visualizationNode.centerX = this.visualizationCenterX;
    this.visualizationNode.centerY = this.visualizationCenterY;

    // Update dependent elements
    this.updateResizeHandlePosition();
    this.excitationMarker.updatePosition();
    this.updateRulerAndGrid();
    this.visualizationNode.update();
  }

  /**
   * Update the ruler, grid, and colormap overlays for the current visualization size.
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
    this.colormapNode.updateDimensions(
      vizWidth,
      vizHeight,
      this.model.plateWidth,
      this.model.plateHeight,
    );
    // Update modal shape if it exists (may not during initial construction)
    if (this.modalShapeNode) {
      this.modalShapeNode.updateDimensions(
        vizWidth,
        vizHeight,
        this.model.plateWidth,
        this.model.plateHeight,
      );
    }

    // Update positions to match visualization bounds
    this.rulerNode.x = vizBounds.minX;
    this.rulerNode.y = vizBounds.minY;
    this.gridNode.x = vizBounds.minX;
    this.gridNode.y = vizBounds.minY;
    this.colormapNode.x = vizBounds.minX;
    this.colormapNode.y = vizBounds.minY;
    if (this.modalShapeNode) {
      this.modalShapeNode.x = vizBounds.minX;
      this.modalShapeNode.y = vizBounds.minY;
    }
  }

  /**
   * Create the resize handle for the bottom-right corner.
   * Dragging this handle resizes the plate while keeping the center fixed.
   */
  private createResizeHandle(): Node {
    // Larger invisible hit area for easier grabbing
    const hitArea = new Rectangle(
      0,
      0,
      RESIZE_HANDLE_HIT_AREA,
      RESIZE_HANDLE_HIT_AREA,
      {
        fill: "rgba(0,0,0,0.01)", // Nearly invisible but still catches events
        cursor: "nwse-resize",
      },
    );

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
          Math.min(widthRange.max, startWidth + widthDelta),
        );
        const newHeight = Math.max(
          heightRange.min,
          Math.min(heightRange.max, startHeight + heightDelta),
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
    playPauseStepButtonGroup.bottom =
      this.layoutBounds.maxY - ResonanceConstants.PLAYBACK_BOTTOM_MARGIN;

    return playPauseStepButtonGroup;
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

    // Update colormap if visible (reflects current displacement field)
    if (this.colormapNode.visible) {
      this.colormapNode.update();
    }

    // Update modal shape if visible (reflects current wave number and mode)
    if (this.modalShapeNode.visible) {
      this.modalShapeNode.setWaveNumber(this.model.waveNumber);
      this.modalShapeNode.update();
    }
  }
}
