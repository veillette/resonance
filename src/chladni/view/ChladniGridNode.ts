/**
 * ChladniGridNode.ts
 *
 * A grid overlay for the Chladni plate visualization.
 * Shows grid lines with a double arrow indicator showing the spacing between major lines.
 */

import { Node, Line, Path, Text } from "scenerystack/scenery";
import { Shape } from "scenerystack/kite";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import { DerivedProperty, TReadOnlyProperty } from "scenerystack/axon";

// Grid configuration
const MAJOR_GRID_SPACING_CM = 5; // Major grid line every 5 cm
const MINOR_GRID_SPACING_CM = 1; // Minor grid line every 1 cm
const MAJOR_LINE_WIDTH = 1.5;
const MINOR_LINE_WIDTH = 0.5;
const MAJOR_LINE_OPACITY = 0.4;
const MINOR_LINE_OPACITY = 0.2;

// Arrow indicator configuration
const ARROW_HEAD_SIZE = 6;
const ARROW_LINE_WIDTH = 2;
const ARROW_OFFSET_FROM_EDGE = 25;

export class ChladniGridNode extends Node {
  private visualizationWidth: number;
  private visualizationHeight: number;
  private plateWidthMeters: number;
  private plateHeightMeters: number;

  // The spacing indicator arrow and label
  private readonly spacingIndicator: Node;
  private readonly spacingLabel: Text;

  public constructor(
    visualizationWidth: number,
    visualizationHeight: number,
    plateWidthMeters: number,
    plateHeightMeters: number,
  ) {
    super();

    this.visualizationWidth = visualizationWidth;
    this.visualizationHeight = visualizationHeight;
    this.plateWidthMeters = plateWidthMeters;
    this.plateHeightMeters = plateHeightMeters;

    // Create spacing indicator (will be positioned in createGrid)
    this.spacingIndicator = new Node();
    this.spacingLabel = new Text(this.createSpacingString(), {
      font: ResonanceConstants.LABEL_FONT,
      fill: ResonanceColors.textProperty,
    });

    this.createGrid();
  }

  /**
   * Create a string property for the spacing label (e.g., "5 cm").
   */
  private createSpacingString(): TReadOnlyProperty<string> {
    return new DerivedProperty(
      [ResonanceStrings.units.cmPatternStringProperty],
      (pattern) => pattern.replace("{{value}}", MAJOR_GRID_SPACING_CM.toString())
    );
  }

  /**
   * Create the grid lines and spacing indicator.
   */
  private createGrid(): void {
    // Clear existing children
    this.removeAllChildren();

    const plateWidthCm = this.plateWidthMeters * 100;
    const plateHeightCm = this.plateHeightMeters * 100;

    // Pixels per centimeter
    const pxPerCmX = this.visualizationWidth / plateWidthCm;
    const pxPerCmY = this.visualizationHeight / plateHeightCm;

    // Create minor grid lines first (so major lines render on top)
    this.createGridLines(plateWidthCm, plateHeightCm, pxPerCmX, pxPerCmY, false);

    // Create major grid lines
    this.createGridLines(plateWidthCm, plateHeightCm, pxPerCmX, pxPerCmY, true);

    // Create spacing indicator
    this.createSpacingIndicator(pxPerCmX);
  }

  /**
   * Create grid lines (major or minor).
   */
  private createGridLines(
    widthCm: number,
    heightCm: number,
    pxPerCmX: number,
    pxPerCmY: number,
    major: boolean,
  ): void {
    const spacing = major ? MAJOR_GRID_SPACING_CM : MINOR_GRID_SPACING_CM;
    const lineWidth = major ? MAJOR_LINE_WIDTH : MINOR_LINE_WIDTH;
    const opacity = major ? MAJOR_LINE_OPACITY : MINOR_LINE_OPACITY;

    // Vertical lines
    for (let cm = 0; cm <= widthCm; cm += spacing) {
      // Skip minor lines where major lines exist
      if (!major && cm % MAJOR_GRID_SPACING_CM === 0) continue;

      const x = cm * pxPerCmX;
      const line = new Line(x, 0, x, this.visualizationHeight, {
        stroke: ResonanceColors.textProperty,
        lineWidth: lineWidth,
        opacity: opacity,
      });
      this.addChild(line);
    }

    // Horizontal lines
    for (let cm = 0; cm <= heightCm; cm += spacing) {
      // Skip minor lines where major lines exist
      if (!major && cm % MAJOR_GRID_SPACING_CM === 0) continue;

      const y = this.visualizationHeight - cm * pxPerCmY;
      const line = new Line(0, y, this.visualizationWidth, y, {
        stroke: ResonanceColors.textProperty,
        lineWidth: lineWidth,
        opacity: opacity,
      });
      this.addChild(line);
    }
  }

  /**
   * Create the double arrow spacing indicator.
   */
  private createSpacingIndicator(pxPerCmX: number): void {
    // Clear and recreate the indicator
    this.spacingIndicator.removeAllChildren();

    const arrowLength = MAJOR_GRID_SPACING_CM * pxPerCmX;
    const y = -ARROW_OFFSET_FROM_EDGE;

    // Create double-headed arrow shape
    const arrowShape = new Shape();

    // Horizontal line
    arrowShape.moveTo(0, 0);
    arrowShape.lineTo(arrowLength, 0);

    // Left arrowhead
    arrowShape.moveTo(ARROW_HEAD_SIZE, -ARROW_HEAD_SIZE);
    arrowShape.lineTo(0, 0);
    arrowShape.lineTo(ARROW_HEAD_SIZE, ARROW_HEAD_SIZE);

    // Right arrowhead
    arrowShape.moveTo(arrowLength - ARROW_HEAD_SIZE, -ARROW_HEAD_SIZE);
    arrowShape.lineTo(arrowLength, 0);
    arrowShape.lineTo(arrowLength - ARROW_HEAD_SIZE, ARROW_HEAD_SIZE);

    const arrowPath = new Path(arrowShape, {
      stroke: ResonanceColors.textProperty,
      lineWidth: ARROW_LINE_WIDTH,
      lineCap: "round",
      lineJoin: "round",
    });

    this.spacingIndicator.addChild(arrowPath);

    // Position the label above the arrow, centered
    this.spacingLabel.centerX = arrowLength / 2;
    this.spacingLabel.bottom = -ARROW_HEAD_SIZE - 3;
    this.spacingIndicator.addChild(this.spacingLabel);

    // Position the indicator at the top center of the visualization
    this.spacingIndicator.centerX = this.visualizationWidth / 2;
    this.spacingIndicator.top = y;

    this.addChild(this.spacingIndicator);
  }

  /**
   * Update the grid for new dimensions.
   */
  public updateDimensions(
    visualizationWidth: number,
    visualizationHeight: number,
    plateWidthMeters: number,
    plateHeightMeters: number,
  ): void {
    this.visualizationWidth = visualizationWidth;
    this.visualizationHeight = visualizationHeight;
    this.plateWidthMeters = plateWidthMeters;
    this.plateHeightMeters = plateHeightMeters;
    this.createGrid();
  }
}
