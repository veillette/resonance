/**
 * OscillatorTraceNode renders a strip-chart-style trace of the mass position over time.
 *
 * When trace mode is active:
 * - The grid scrolls from right to left, like paper moving under a pen.
 * - The x-axis represents time and the y-axis represents position.
 * - A trace line records the mass displacement history.
 * - The "pen" point is at the x-position of the first mass, so the trace
 *   line appears to be drawn by the oscillating mass.
 *
 * The node is clipped to the grid bounds so that the scrolling grid and trace
 * line don't extend outside the visible area.
 */

import { Node, Path, Circle } from "scenerystack/scenery";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Bounds2 } from "scenerystack/dot";
import type { TReadOnlyProperty } from "scenerystack/axon";
import { TraceDataModel } from "../model/TraceDataModel.js";
import type { TimeSpeed } from "../model/BaseModel.js";
import ResonanceColors from "../ResonanceColors.js";
import ResonanceConstants from "../ResonanceConstants.js";
import { OscillatorGridNode } from "./OscillatorGridNode.js";

export interface OscillatorTraceNodeOptions {
  /** The x-position of the pen (where the trace is written), in view coordinates */
  penViewX: number;
  /** Width of the grid area in view coordinates */
  gridWidth: number;
  /** Top of the grid in model coordinates */
  gridTopModel: number;
  /** Bottom of the grid in model coordinates */
  gridBottomModel: number;
  /** Center X of the grid in view coordinates */
  gridCenterX: number;
  /** Major grid spacing in model coords (meters) */
  majorSpacing?: number;
  /** Minor divisions per major grid spacing */
  minorDivisionsPerMajor?: number;
  /** Property for the current time speed (slow/normal/fast) */
  timeSpeedProperty?: TReadOnlyProperty<TimeSpeed>;
}

export class OscillatorTraceNode extends Node {
  private readonly modelViewTransform: ModelViewTransform2;
  private readonly traceData: TraceDataModel;
  private readonly tracePath: Path;
  private readonly penDot: Circle;
  private readonly scrollingGridContainer: Node;
  private readonly gridNode: OscillatorGridNode;

  private readonly penViewX: number;
  private readonly gridWidth: number;
  private readonly gridTopView: number;
  private readonly gridBottomView: number;
  private readonly gridLeft: number;
  private readonly gridRight: number;

  /** Property for time speed (to sync trace scroll with simulation speed) */
  private readonly timeSpeedProperty: TReadOnlyProperty<TimeSpeed> | null;

  /** Time speed multipliers matching BaseModel */
  private readonly timeSpeedMultipliers: Record<TimeSpeed, number> = {
    slow: 0.1,
    normal: 1.0,
    fast: 2.0,
  };

  /** Cumulative scroll offset in view pixels (never wraps, used for point positioning) */
  private scrollOffset = 0;

  /** Visual grid offset (wraps for seamless tiling) */
  private gridVisualOffset = 0;

  /** Get the current scroll offset (for recording points) */
  public getScrollOffset(): number {
    return this.scrollOffset;
  }

  public constructor(
    modelViewTransform: ModelViewTransform2,
    traceData: TraceDataModel,
    layoutBounds: Bounds2,
    options: OscillatorTraceNodeOptions,
  ) {
    super();

    this.modelViewTransform = modelViewTransform;
    this.traceData = traceData;

    this.penViewX = options.penViewX;
    this.gridWidth = options.gridWidth;
    const gridCenterX = options.gridCenterX;
    this.gridLeft = gridCenterX - this.gridWidth / 2;
    this.gridRight = gridCenterX + this.gridWidth / 2;
    this.gridTopView = modelViewTransform.modelToViewY(options.gridTopModel);
    this.gridBottomView = modelViewTransform.modelToViewY(
      options.gridBottomModel,
    );

    // Create a clip area matching the grid bounds
    const clipShape = Shape.rect(
      this.gridLeft,
      this.gridTopView,
      this.gridWidth,
      this.gridBottomView - this.gridTopView,
    );
    this.clipArea = clipShape;

    // Scrolling container for the grid
    // We create a wider grid (3x width) so it can scroll without gaps
    this.gridNode = new OscillatorGridNode(modelViewTransform, layoutBounds, {
      majorSpacing: options.majorSpacing ?? 0.05,
      minorDivisionsPerMajor: options.minorDivisionsPerMajor ?? 5,
      gridWidth: this.gridWidth * 3,
      gridTopModel: options.gridTopModel,
      gridBottomModel: options.gridBottomModel,
      gridCenterX: gridCenterX,
    });

    this.scrollingGridContainer = new Node({ children: [this.gridNode] });
    this.addChild(this.scrollingGridContainer);

    // Store time speed property for scroll speed adjustment
    this.timeSpeedProperty = options.timeSpeedProperty ?? null;

    // Trace line path
    this.tracePath = new Path(null, {
      stroke: ResonanceColors.traceLineProperty,
      lineWidth: ResonanceConstants.TRACE_LINE_WIDTH,
      lineJoin: "round",
      lineCap: "round",
    });
    this.addChild(this.tracePath);

    // Pen dot at the trace origin (where the trace is being drawn)
    this.penDot = new Circle(5, {
      fill: ResonanceColors.traceLineProperty,
      x: this.penViewX,
    });
    this.addChild(this.penDot);
  }

  /**
   * Update the trace visualization. Called each frame from the screen view's step().
   * @param dt - time step in seconds (real time, not simulation time)
   */
  public step(dt: number): void {
    if (!this.traceData.traceEnabledProperty.value) {
      return;
    }

    // Apply time speed multiplier to sync scroll with simulation speed
    const speedMultiplier = this.timeSpeedProperty
      ? this.timeSpeedMultipliers[this.timeSpeedProperty.value]
      : 1.0;

    // Update cumulative scroll offset (never wraps, used for point positioning)
    const scrollDelta =
      ResonanceConstants.TRACE_SCROLL_SPEED * dt * speedMultiplier;
    this.scrollOffset += scrollDelta;

    // Update visual grid offset (wraps for seamless tiling)
    this.gridVisualOffset += scrollDelta;
    const wrapWidth = this.gridWidth;
    if (this.gridVisualOffset > wrapWidth) {
      this.gridVisualOffset -= wrapWidth;
    }

    this.scrollingGridContainer.x = -this.gridVisualOffset;

    // Rebuild the trace path from data points
    this.updateTracePath();
  }

  /**
   * Rebuild the trace line shape from the collected data points.
   *
   * Each point stores the scroll offset when it was recorded. The x-position
   * is calculated as the difference between current and recorded scroll offset.
   * This ensures smooth transitions when speed changes.
   */
  private updateTracePath(): void {
    const points = this.traceData.getPoints();
    if (points.length < 2) {
      this.tracePath.shape = null;
      this.penDot.visible = false;
      return;
    }

    const shape = new Shape();
    let started = false;

    for (const pt of points) {
      // Calculate x position based on scroll offset difference
      // Points recorded earlier have smaller scrollOffset, so they appear to the left
      const viewX = this.penViewX - (this.scrollOffset - pt.scrollOffset);

      // Skip points that have scrolled off the left side
      if (viewX < this.gridLeft) {
        continue;
      }
      // Skip points past the right edge (shouldn't happen but guard)
      if (viewX > this.gridRight) {
        continue;
      }

      const viewY = this.modelViewTransform.modelToViewY(pt.position);

      if (!started) {
        shape.moveTo(viewX, viewY);
        started = true;
      } else {
        shape.lineTo(viewX, viewY);
      }
    }

    this.tracePath.shape = shape;

    // Update pen dot position to match the most recent point
    const lastPoint = points[points.length - 1];
    if (lastPoint) {
      this.penDot.y = this.modelViewTransform.modelToViewY(lastPoint.position);
      this.penDot.visible = true;
    }
  }

  /** Clear the trace visualization and reset scroll */
  public clear(): void {
    this.scrollOffset = 0;
    this.gridVisualOffset = 0;
    this.scrollingGridContainer.x = 0;
    this.tracePath.shape = null;
    this.penDot.visible = false;
    this.traceData.clear();
  }

  /** Reset everything */
  public reset(): void {
    this.clear();
  }
}
