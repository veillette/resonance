/**
 * MeasurementLinesNode - Two horizontal dashed lines that span the driver width.
 * Each line is vertically draggable for measuring heights above the driver plate.
 */

import { Node, Line, Rectangle } from "scenerystack/scenery";
import { DragListener } from "scenerystack/scenery";
import { Bounds2, Range } from "scenerystack/dot";
import { NumberProperty } from "scenerystack/axon";
import { ModelViewTransform2 } from "scenerystack/phetcommon";

/**
 * A single draggable measurement line with a handle.
 */
class MeasurementLine extends Node {
  public readonly heightProperty: NumberProperty;

  public constructor(
    initialHeightCm: number,
    driverWidth: number,
    modelDragBounds: Bounds2,
  ) {
    super();

    // Height in model coordinates (meters) - positive = up from driver plate
    this.heightProperty = new NumberProperty(initialHeightCm / 100, {
      range: new Range(modelDragBounds.minY, modelDragBounds.maxY),
    });

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
  }

  public reset(): void {
    this.heightProperty.reset();
  }
}

/**
 * Container for the two measurement lines.
 */
export class MeasurementLinesNode extends Node {
  private readonly line1: MeasurementLine;
  private readonly line2: MeasurementLine;

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
    const maxHeight = Math.abs(modelViewTransform.viewToModelDeltaY(screenHeightView));

    // Height bounds in model coordinates (meters above driver plate)
    const heightBounds = new Bounds2(0, minHeight, 0, maxHeight);

    // Create two measurement lines at 20cm and 40cm
    this.line1 = new MeasurementLine(20, driverWidth, heightBounds);
    this.line2 = new MeasurementLine(40, driverWidth, heightBounds);

    // Position lines horizontally centered on driver
    this.line1.x = driverCenterX;
    this.line2.x = driverCenterX;

    // Helper to set up drag and position for a measurement line
    const setupLine = (line: MeasurementLine) => {
      // Update visual Y position when height changes
      line.heightProperty.link((height: number) => {
        // Height is positive upward, but view Y increases downward
        const viewDeltaY = Math.abs(modelViewTransform.modelToViewDeltaY(height));
        line.y = driverTopY - viewDeltaY;
      });

      // Set up drag listener
      const dragListener = new DragListener({
        targetNode: line,
        start: () => {
          // Nothing special on start
        },
        drag: (event, listener) => {
          // Convert drag delta to height change
          const viewDeltaY = listener.modelDelta.y;
          const modelDeltaHeight = modelViewTransform.viewToModelDeltaY(viewDeltaY);
          // Dragging down (positive viewDeltaY) decreases height
          const newHeight = line.heightProperty.value - modelDeltaHeight;
          // Clamp to bounds
          line.heightProperty.value = Math.max(minHeight, Math.min(maxHeight, newHeight));
        },
      });
      line.addInputListener(dragListener);
    };

    setupLine(this.line1);
    setupLine(this.line2);

    this.addChild(this.line1);
    this.addChild(this.line2);
  }

  public reset(): void {
    this.line1.reset();
    this.line2.reset();
  }
}
