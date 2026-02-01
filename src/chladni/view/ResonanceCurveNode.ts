/**
 * ResonanceCurveNode.ts
 *
 * Displays the resonance curve (courbe de résonance) showing how the plate's
 * amplitude response varies with frequency. Uses the bamboo charting library
 * for proper plotting with axes and grid lines.
 *
 * The graph shows a scrolling window that follows the current frequency,
 * revealing resonance peaks as you adjust the frequency slider.
 */

import { Node, Line, Text, Rectangle } from "scenerystack/scenery";
import {
  ChartTransform,
  ChartRectangle,
  LinePlot,
  GridLineSet,
  TickMarkSet,
  TickLabelSet,
} from "scenerystack/bamboo";
import { Orientation } from "scenerystack/phet-core";
import { Range, Bounds2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { ChladniModel } from "../model/ChladniModel.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";

// Chart dimensions
const CHART_WIDTH = 220;
const CHART_HEIGHT = 120;

// Fixed total height including axis labels (prevents layout shifts)
const TOTAL_HEIGHT = CHART_HEIGHT + 35;

// Number of sample points for the curve
const SAMPLE_COUNT = 2000;

export class ResonanceCurveNode extends Node {
  private readonly model: ChladniModel;
  private readonly chartTransform: ChartTransform;
  private readonly linePlot: LinePlot;
  private readonly frequencyMarker: Line;
  private readonly chartRectangle: ChartRectangle;

  // Grid and tick elements
  private verticalGridLines: GridLineSet;
  private horizontalGridLines: GridLineSet;
  private xTickMarks: TickMarkSet;
  private xTickLabels: TickLabelSet;

  // Hz label
  private readonly hzLabel: Text;

  // Fixed size container to prevent layout shifts
  private readonly fixedContainer: Node;

  // Track current window range
  private currentWindowRange: Range;

  public constructor(model: ChladniModel) {
    super();

    this.model = model;

    // Get initial window range
    this.currentWindowRange = model.getGraphWindowRange();

    // Create chart transform
    this.chartTransform = new ChartTransform({
      viewWidth: CHART_WIDTH,
      viewHeight: CHART_HEIGHT,
      modelXRange: this.currentWindowRange,
      modelYRange: new Range(0, 1), // Normalized amplitude
    });

    // Create a fixed-size container that prevents layout shifts
    // This ensures the overall node bounds stay constant
    this.fixedContainer = new Node();

    // Invisible rectangle to establish fixed bounds
    const boundsRect = new Rectangle(0, 0, CHART_WIDTH, TOTAL_HEIGHT, {
      fill: null,
      stroke: null,
    });
    this.fixedContainer.addChild(boundsRect);

    // Background rectangle
    this.chartRectangle = new ChartRectangle(this.chartTransform, {
      fill: ResonanceColors.chladniBackgroundProperty,
      stroke: ResonanceColors.chladniPlateBorderProperty,
      lineWidth: 1,
    });
    this.fixedContainer.addChild(this.chartRectangle);

    // Create a clipped container for the chart content (grid, curve, marker)
    // This prevents the curve and grid from rendering outside the chart area
    const chartClipArea = Shape.bounds(new Bounds2(0, 0, CHART_WIDTH, CHART_HEIGHT));
    const clippedChartContent = new Node({
      clipArea: chartClipArea,
    });

    // Grid lines
    const gridSpacingX = this.calculateGridSpacing(this.currentWindowRange);
    this.verticalGridLines = new GridLineSet(
      this.chartTransform,
      Orientation.VERTICAL,
      gridSpacingX,
      {
        stroke: ResonanceColors.gridLinesProperty,
        lineWidth: 0.5,
      },
    );
    clippedChartContent.addChild(this.verticalGridLines);

    this.horizontalGridLines = new GridLineSet(
      this.chartTransform,
      Orientation.HORIZONTAL,
      0.2,
      {
        stroke: ResonanceColors.gridLinesProperty,
        lineWidth: 0.5,
      },
    );
    clippedChartContent.addChild(this.horizontalGridLines);

    // Create the line plot for resonance curve using precomputed data
    const dataSet = this.model.getResonanceCurveData(SAMPLE_COUNT);
    this.linePlot = new LinePlot(this.chartTransform, dataSet, {
      stroke: ResonanceColors.frequencyTrackProperty,
      lineWidth: 2,
    });
    clippedChartContent.addChild(this.linePlot);

    // Current frequency marker (vertical line)
    this.frequencyMarker = new Line(0, 0, 0, CHART_HEIGHT, {
      stroke: ResonanceColors.textProperty,
      lineWidth: 2,
      lineDash: [4, 4],
    });
    clippedChartContent.addChild(this.frequencyMarker);

    this.fixedContainer.addChild(clippedChartContent);

    // X-axis tick marks (outside clip area, at the bottom edge)
    this.xTickMarks = new TickMarkSet(
      this.chartTransform,
      Orientation.HORIZONTAL,
      gridSpacingX,
      {
        edge: "min",
        stroke: ResonanceColors.textProperty,
        lineWidth: 1,
        extent: 6,
      },
    );
    this.fixedContainer.addChild(this.xTickMarks);

    // X-axis tick labels with fixed-width formatting to prevent layout shifts
    this.xTickLabels = new TickLabelSet(
      this.chartTransform,
      Orientation.HORIZONTAL,
      gridSpacingX,
      {
        edge: "min",
        createLabel: (value: number) =>
          new Text(Math.round(value).toString(), {
            font: ResonanceConstants.TICK_LABEL_FONT,
            fill: ResonanceColors.textProperty,
            maxWidth: 40, // Fixed max width to prevent layout shifts
          }),
      },
    );
    this.fixedContainer.addChild(this.xTickLabels);

    // Hz label at fixed position
    this.hzLabel = new Text(ResonanceStrings.units.hzStringProperty, {
      font: ResonanceConstants.TICK_LABEL_FONT,
      fill: ResonanceColors.textProperty,
      left: CHART_WIDTH + 5,
      top: CHART_HEIGHT + 18,
    });
    this.fixedContainer.addChild(this.hzLabel);

    // Add the fixed container to this node
    this.addChild(this.fixedContainer);

    this.updateFrequencyMarker();

    // Update when frequency changes (just update window and marker, data is precomputed)
    model.frequencyProperty.link(() => {
      this.updateWindowRange();
      this.updateCurveFromPrecomputed();
      this.updateFrequencyMarker();
    });

    // Update curve when material or excitation position changes
    // (model recomputes the full curve, we just need to display the window)
    model.materialProperty.link(() => {
      this.updateCurveFromPrecomputed();
    });

    model.excitationPositionProperty.link(() => {
      this.updateCurveFromPrecomputed();
    });

    // Update curve when plate dimensions change
    model.plateWidthProperty.link(() => {
      this.updateCurveFromPrecomputed();
    });

    model.plateHeightProperty.link(() => {
      this.updateCurveFromPrecomputed();
    });
  }

  /**
   * Calculate appropriate grid spacing based on the frequency range.
   */
  private calculateGridSpacing(range: Range): number {
    const span = range.max - range.min;
    if (span <= 200) return 50;
    if (span <= 500) return 100;
    if (span <= 1000) return 200;
    return 500;
  }

  /**
   * Update the window range based on current frequency.
   */
  private updateWindowRange(): void {
    const newRange = this.model.getGraphWindowRange();

    // Only update if range actually changed
    if (
      newRange.min !== this.currentWindowRange.min ||
      newRange.max !== this.currentWindowRange.max
    ) {
      this.currentWindowRange = newRange;
      this.chartTransform.setModelXRange(newRange);

      // Update grid and tick spacing
      const gridSpacing = this.calculateGridSpacing(newRange);
      this.verticalGridLines.setSpacing(gridSpacing);
      this.xTickMarks.setSpacing(gridSpacing);
      this.xTickLabels.setSpacing(gridSpacing);
    }
  }

  /**
   * Update the resonance curve using precomputed data from the model.
   * The model precomputes the full frequency range; we just extract the visible window.
   */
  private updateCurveFromPrecomputed(): void {
    const dataSet = this.model.getResonanceCurveData(SAMPLE_COUNT);
    this.linePlot.setDataSet(dataSet);
  }

  /**
   * Update the position of the frequency marker line.
   */
  private updateFrequencyMarker(): void {
    const freq = this.model.frequencyProperty.value;
    const x = this.chartTransform.modelToViewX(freq);

    this.frequencyMarker.x1 = x;
    this.frequencyMarker.x2 = x;
    this.frequencyMarker.y1 = 0;
    this.frequencyMarker.y2 = CHART_HEIGHT;
  }

  /**
   * Force a full update of the curve and marker.
   */
  public update(): void {
    this.updateWindowRange();
    this.updateCurveFromPrecomputed();
    this.updateFrequencyMarker();
  }
}
