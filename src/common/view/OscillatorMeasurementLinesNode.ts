/**
 * OscillatorMeasurementLinesNode - View for two horizontal dashed lines that span the driver width.
 * Each line is vertically draggable for measuring heights above the driver plate.
 * Uses MeasurementLinesModel for the underlying model state.
 *
 * This is a shared view component used by all oscillator-based screens:
 * - Single Oscillator
 * - Multiple Oscillators
 * - Phase Analysis
 */

import { Node, Line, Rectangle } from "scenerystack/scenery";
import { DragListener, KeyboardDragListener } from "scenerystack/scenery";
import { Bounds2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import {
  MeasurementLineModel,
  MeasurementLinesModel,
} from "../model/MeasurementLineModel.js";
import ResonanceColors from "../ResonanceColors.js";

/**
 * View for a single draggable measurement line with a handle.
 */
class MeasurementLineNode extends Node {
  public constructor(
    model: MeasurementLineModel,
    driverWidth: number,
    driverCenterX: number,
    modelViewTransform: ModelViewTransform2,
    lineNumber: number,
  ) {
    super();

    // Create the dashed horizontal line
    const lineLength = driverWidth;
    const line = new Line(0, 0, lineLength, 0, {
      stroke: ResonanceColors.textProperty,
      lineWidth: 2,
      lineDash: [10, 6],
    });
    line.centerX = 0;
    this.addChild(line);

    // Create a small handle on the left side for dragging
    const handleWidth = 12;
    const handleHeight = 20;
    const handle = new Rectangle(
      -handleWidth / 2,
      -handleHeight / 2,
      handleWidth,
      handleHeight,
      {
        fill: ResonanceColors.driverFillProperty,
        stroke: ResonanceColors.textProperty,
        lineWidth: 1,
        cornerRadius: 3,
        cursor: "ns-resize",
      },
    );
    handle.left = line.left - handleWidth / 2 - 5;
    this.addChild(handle);

    this.cursor = "ns-resize";

    // Make focusable for keyboard navigation
    this.tagName = "div";
    this.focusable = true;
    this.accessibleName = `Measurement Line ${lineNumber}`;

    // Position the node based on model position using modelViewTransform
    model.positionProperty.link((position) => {
      const viewPosition = modelViewTransform.modelToViewPosition(position);
      this.x = driverCenterX;
      this.y = viewPosition.y;
    });

    // DragListener uses model's positionProperty directly with transform and bounds
    const dragListener = new DragListener({
      targetNode: this,
      positionProperty: model.positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: model.dragBoundsProperty,
    });
    this.addInputListener(dragListener);

    // KeyboardDragListener for keyboard navigation (vertical only)
    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: model.positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: model.dragBoundsProperty,
      dragSpeed: 100, // pixels per second
      shiftDragSpeed: 50, // slower with shift key
    });
    this.addInputListener(keyboardDragListener);
  }
}

/**
 * Container view for the two measurement lines.
 */
export class OscillatorMeasurementLinesNode extends Node {
  private readonly line1Node: MeasurementLineNode;
  private readonly line2Node: MeasurementLineNode;
  public readonly model: MeasurementLinesModel;

  public constructor(
    driverCenterX: number,
    driverTopY: number,
    driverWidth: number,
    modelViewTransform: ModelViewTransform2,
    layoutBounds: Bounds2,
  ) {
    super();

    // Calculate height range in model coordinates (meters)
    const minHeight = -0.2; // 20cm minimum below plate
    const screenHeightView = driverTopY - layoutBounds.minY;
    const maxHeight = Math.abs(
      modelViewTransform.viewToModelDeltaY(screenHeightView),
    );

    // Create the model with height bounds
    this.model = new MeasurementLinesModel(minHeight, maxHeight, 0.2, 0.4);

    // Create view nodes for each line
    this.line1Node = new MeasurementLineNode(
      this.model.line1,
      driverWidth,
      driverCenterX,
      modelViewTransform,
      1,
    );
    this.line2Node = new MeasurementLineNode(
      this.model.line2,
      driverWidth,
      driverCenterX,
      modelViewTransform,
      2,
    );

    this.addChild(this.line1Node);
    this.addChild(this.line2Node);
  }

  public reset(): void {
    this.model.reset();
  }
}
