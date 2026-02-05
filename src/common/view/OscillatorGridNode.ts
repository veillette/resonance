/**
 * OscillatorGridNode displays a grid overlay for the oscillator screens.
 * Features:
 * - Major and minor grid lines
 * - Bold y=0 (equilibrium) line using modelViewTransform
 * - Scale indicator with double-headed arrow between two major grid lines
 */

import { Node, Path, Line, Text } from "scenerystack/scenery";
import { ArrowNode, PhetFont } from "scenerystack/scenery-phet";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Bounds2 } from "scenerystack/dot";
import ResonanceColors from "../ResonanceColors.js";

export interface OscillatorGridNodeOptions {
  /** Spacing between major grid lines in model coordinates (meters) */
  majorSpacing?: number;
  /** Number of minor divisions between major lines */
  minorDivisionsPerMajor?: number;
  /** Width of the grid area in view coordinates */
  gridWidth?: number;
  /** Top of grid in model coordinates (meters) */
  gridTopModel?: number;
  /** Bottom of grid in model coordinates (meters) */
  gridBottomModel?: number;
  /** X position of the grid center in view coordinates */
  gridCenterX?: number;
}

export class OscillatorGridNode extends Node {
  private readonly modelViewTransform: ModelViewTransform2;
  private readonly majorSpacing: number;
  private readonly minorDivisionsPerMajor: number;
  private readonly gridWidth: number;
  private readonly gridTopModel: number;
  private readonly gridBottomModel: number;
  private readonly gridCenterX: number;

  public constructor(
    modelViewTransform: ModelViewTransform2,
    layoutBounds: Bounds2,
    options?: OscillatorGridNodeOptions,
  ) {
    super();

    this.modelViewTransform = modelViewTransform;
    this.majorSpacing = options?.majorSpacing ?? 0.05; // 5 cm default
    this.minorDivisionsPerMajor = options?.minorDivisionsPerMajor ?? 5; // 1 cm minor lines
    this.gridWidth = options?.gridWidth ?? 500;
    // Use model coordinates for top and bottom
    this.gridTopModel = options?.gridTopModel ?? 0.25; // 25 cm above equilibrium
    this.gridBottomModel = options?.gridBottomModel ?? -0.3; // 30 cm below equilibrium
    this.gridCenterX = options?.gridCenterX ?? layoutBounds.centerX - 100;

    // Create the grid
    this.createGrid();
  }

  private createGrid(): void {
    const minorSpacing = this.majorSpacing / this.minorDivisionsPerMajor;

    // Calculate view spacing for minor grid lines
    const minorSpacingView = Math.abs(
      this.modelViewTransform.modelToViewDeltaY(minorSpacing),
    );

    // Grid bounds in view coordinates (using modelViewTransform)
    const gridLeft = this.gridCenterX - this.gridWidth / 2;
    const gridRight = this.gridCenterX + this.gridWidth / 2;
    const gridTopView = this.modelViewTransform.modelToViewY(this.gridTopModel);
    const gridBottomView = this.modelViewTransform.modelToViewY(
      this.gridBottomModel,
    );

    // Calculate equilibrium Y position (model Y=0) using modelViewTransform
    const equilibriumViewY = this.modelViewTransform.modelToViewY(0);

    // Create shapes for minor and major grid lines
    const minorLinesShape = new Shape();
    const majorLinesShape = new Shape();

    // Draw horizontal lines based on model coordinates
    // Iterate through model Y values from bottom to top
    const numMajorLinesBelow = Math.ceil(
      Math.abs(this.gridBottomModel) / this.majorSpacing,
    );
    const numMajorLinesAbove = Math.ceil(this.gridTopModel / this.majorSpacing);

    for (
      let majorIndex = -numMajorLinesBelow;
      majorIndex <= numMajorLinesAbove;
      majorIndex++
    ) {
      // Draw minor lines between this major and the next
      for (
        let minorIndex = 0;
        minorIndex < this.minorDivisionsPerMajor;
        minorIndex++
      ) {
        const modelY =
          majorIndex * this.majorSpacing + minorIndex * minorSpacing;
        if (modelY < this.gridBottomModel || modelY > this.gridTopModel)
          continue;

        const viewY = this.modelViewTransform.modelToViewY(modelY);

        // Skip the y=0 line (will be drawn separately as bold)
        if (Math.abs(modelY) < 0.0001) continue;

        const isMajor = minorIndex === 0;
        const shape = isMajor ? majorLinesShape : minorLinesShape;
        shape.moveTo(gridLeft, viewY);
        shape.lineTo(gridRight, viewY);
      }
    }

    // Draw vertical lines (varying X)
    const numLinesLeft = Math.ceil(this.gridWidth / 2 / minorSpacingView);
    const numLinesRight = numLinesLeft;

    for (let i = -numLinesLeft; i <= numLinesRight; i++) {
      const x = this.gridCenterX + i * minorSpacingView;
      if (x < gridLeft || x > gridRight) continue;

      const isMajor = i % this.minorDivisionsPerMajor === 0;
      const shape = isMajor ? majorLinesShape : minorLinesShape;
      shape.moveTo(x, gridTopView);
      shape.lineTo(x, gridBottomView);
    }

    // Create path nodes for grid lines with better visibility for projector mode
    const minorLinesNode = new Path(minorLinesShape, {
      stroke: ResonanceColors.gridLinesProperty,
      lineWidth: 1,
      opacity: 0.6,
    });

    const majorLinesNode = new Path(majorLinesShape, {
      stroke: ResonanceColors.gridLinesProperty,
      lineWidth: 1.5,
      opacity: 0.9,
    });

    // Bold y=0 (equilibrium) line - positioned using modelViewTransform
    const equilibriumLine = new Line(
      gridLeft,
      equilibriumViewY,
      gridRight,
      equilibriumViewY,
      {
        stroke: ResonanceColors.equilibriumProperty,
        lineWidth: 3,
      },
    );

    // Add grid lines to the node
    this.addChild(minorLinesNode);
    this.addChild(majorLinesNode);
    this.addChild(equilibriumLine);

    // Create scale indicator with double arrow between two major grid lines
    this.createScaleIndicator(gridLeft);
  }

  /**
   * Creates a scale indicator showing the distance between major grid lines.
   * Positioned between two actual major grid lines using modelViewTransform.
   */
  private createScaleIndicator(gridLeft: number): void {
    // Position on the left side of the grid
    const indicatorX = gridLeft + 20;

    // Double-headed arrow spanning one major grid spacing (vertical)
    const arrowTop = this.modelViewTransform.modelToViewY(0);
    const arrowBottom = this.modelViewTransform.modelToViewY(
      -this.majorSpacing,
    );

    const arrow = new ArrowNode(indicatorX, arrowTop, indicatorX, arrowBottom, {
      doubleHead: true,
      headHeight: 10,
      headWidth: 10,
      tailWidth: 2,
      fill: ResonanceColors.textProperty,
      stroke: null,
    });

    // Label showing the distance (convert meters to cm)
    const distanceCm = this.majorSpacing * 100;
    const label = new Text(`${distanceCm} cm`, {
      font: new PhetFont({ size: 13, weight: "bold" }),
      fill: ResonanceColors.textProperty,
      left: indicatorX + 8,
      centerY: (arrowTop + arrowBottom) / 2,
    });

    // Container for scale indicator
    const scaleIndicator = new Node({
      children: [arrow, label],
    });

    this.addChild(scaleIndicator);
  }
}
