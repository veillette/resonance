/**
 * MeasurementLinesNode - Two horizontal dashed lines that span the driver width.
 * Each line is vertically draggable for measuring heights above the driver plate.
 */

import { Node, Line, Rectangle } from "scenerystack/scenery";
import { DragListener } from "scenerystack/scenery";
import { Vector2, Bounds2 } from "scenerystack/dot";
import { NumberProperty, Property } from "scenerystack/axon";
import { ModelViewTransform2 } from "scenerystack/phetcommon";

// Note: Bounds2 is used in MeasurementLine class

/**
 * A single draggable measurement line with a handle.
 */
class MeasurementLine extends Node {
  public readonly heightProperty: NumberProperty;

  public constructor(
    initialHeightCm: number,
    driverWidth: number,
    modelViewTransform: ModelViewTransform2,
    dragBounds: Bounds2,
  ) {
    super();

    // Height in model coordinates (meters)
    this.heightProperty = new NumberProperty(initialHeightCm / 100);

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

    // Position property for dragging (x is fixed, y changes)
    const positionProperty = new Property(new Vector2(0, 0));

    // Sync height to position
    this.heightProperty.link((height: number) => {
      const viewY = modelViewTransform.modelToViewY(-height); // negative because up is positive height
      positionProperty.value = new Vector2(0, viewY);
    });

    // Sync position back to height
    positionProperty.lazyLink((position: Vector2) => {
      const modelY = modelViewTransform.viewToModelY(position.y);
      this.heightProperty.value = -modelY; // negative because up is positive height
    });

    // Update visual position
    positionProperty.link((position: Vector2) => {
      this.y = position.y;
    });

    // Create drag bounds in view coordinates
    const viewDragBounds = new Bounds2(
      0,
      modelViewTransform.modelToViewY(-dragBounds.maxY),
      0,
      modelViewTransform.modelToViewY(-dragBounds.minY),
    );

    const dragListener = new DragListener({
      targetNode: this,
      positionProperty: positionProperty,
      dragBoundsProperty: new Property(viewDragBounds),
    });
    this.addInputListener(dragListener);
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
  ) {
    super();

    // Drag bounds: from just above driver plate to near top of screen
    // Height range: 0 to 60cm above plate
    const minHeight = 0.01; // 1cm minimum (just above plate)
    const maxHeight = 0.6; // 60cm maximum

    const dragBounds = new Bounds2(0, minHeight, 0, maxHeight);

    // Create two measurement lines at 20cm and 40cm
    this.line1 = new MeasurementLine(
      20,
      driverWidth,
      modelViewTransform,
      dragBounds,
    );
    this.line2 = new MeasurementLine(
      40,
      driverWidth,
      modelViewTransform,
      dragBounds,
    );

    // Position lines horizontally centered on driver
    this.line1.x = driverCenterX;
    this.line2.x = driverCenterX;

    // Offset Y positions relative to driver top
    // The line positions are set via heightProperty, but we need to offset
    // based on the actual driver plate position
    const updateLinePositions = () => {
      // The lines' y positions are in absolute view coordinates from heightProperty
      // We need to offset them relative to current driver top
      this.line1.y =
        driverTopY -
        Math.abs(
          modelViewTransform.modelToViewDeltaY(this.line1.heightProperty.value),
        );
      this.line2.y =
        driverTopY -
        Math.abs(
          modelViewTransform.modelToViewDeltaY(this.line2.heightProperty.value),
        );
    };

    this.line1.heightProperty.link(updateLinePositions);
    this.line2.heightProperty.link(updateLinePositions);

    this.addChild(this.line1);
    this.addChild(this.line2);
  }

  /**
   * Update line positions when driver plate moves.
   */
  public updateDriverPosition(
    driverTopY: number,
    modelViewTransform: ModelViewTransform2,
  ): void {
    this.line1.y =
      driverTopY -
      Math.abs(
        modelViewTransform.modelToViewDeltaY(this.line1.heightProperty.value),
      );
    this.line2.y =
      driverTopY -
      Math.abs(
        modelViewTransform.modelToViewDeltaY(this.line2.heightProperty.value),
      );
  }

  public reset(): void {
    this.line1.reset();
    this.line2.reset();
  }
}
