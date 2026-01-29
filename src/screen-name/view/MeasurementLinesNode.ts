/**
 * MeasurementLinesNode - View for two horizontal dashed lines that span the driver width.
 * Each line is vertically draggable for measuring heights above the driver plate.
 * Uses MeasurementLinesModel for the underlying model state.
 */

import { Node, Line, Rectangle } from "scenerystack/scenery";
import { DragListener } from "scenerystack/scenery";
import { Bounds2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import {
  MeasurementLineModel,
  MeasurementLinesModel,
} from "../model/MeasurementLineModel.js";

/**
 * View for a single draggable measurement line with a handle.
 */
class MeasurementLineNode extends Node {
  public constructor(
    model: MeasurementLineModel,
    driverWidth: number,
    driverTopY: number,
    modelViewTransform: ModelViewTransform2,
  ) {
    super();

    // Create the dashed horizontal line
    const lineLength = driverWidth;
    const line = new Line(0, 0, lineLength, 0, {
      stroke: "black",
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
        fill: "rgba(100, 100, 100, 0.8)",
        stroke: "black",
        lineWidth: 1,
        cornerRadius: 3,
        cursor: "ns-resize",
      },
    );
    handle.left = line.left - handleWidth / 2 - 5;
    this.addChild(handle);

    // Make the whole node draggable
    this.cursor = "ns-resize";

    // Update visual Y position when model height changes
    model.heightProperty.link((height: number) => {
      // Height is positive upward, but view Y increases downward
      const viewDeltaY = Math.abs(modelViewTransform.modelToViewDeltaY(height));
      this.y = driverTopY - viewDeltaY;
    });

    // Set up drag listener - updates model, which has range constraints
    const dragListener = new DragListener({
      targetNode: this,
      drag: (event, listener) => {
        // Convert drag delta to height change
        const viewDeltaY = listener.modelDelta.y;
        const modelDeltaHeight = modelViewTransform.viewToModelDeltaY(viewDeltaY);
        // Dragging down (positive viewDeltaY) decreases height
        // Setting the property will auto-clamp to the model's range
        model.heightProperty.value = model.heightProperty.value - modelDeltaHeight;
      },
    });
    this.addInputListener(dragListener);
  }
}

/**
 * Container view for the two measurement lines.
 */
export class MeasurementLinesNode extends Node {
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
    // Height is measured upward from driver plate
    const minHeight = 0.01; // 1cm minimum above plate
    // Convert screen top to view delta from driver plate, then to model height
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
      driverTopY,
      modelViewTransform,
    );
    this.line2Node = new MeasurementLineNode(
      this.model.line2,
      driverWidth,
      driverTopY,
      modelViewTransform,
    );

    // Position lines horizontally centered on driver
    this.line1Node.x = driverCenterX;
    this.line2Node.x = driverCenterX;

    this.addChild(this.line1Node);
    this.addChild(this.line2Node);
  }

  public reset(): void {
    this.model.reset();
  }
}
