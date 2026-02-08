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

import { Node, Path } from "scenerystack/scenery";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Bounds2 } from "scenerystack/dot";
import { TraceDataModel } from "../model/TraceDataModel.js";
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
}

export class OscillatorTraceNode extends Node {
  private readonly modelViewTransform: ModelViewTransform2;
  private readonly traceData: TraceDataModel;
  private readonly tracePath: Path;
  private readonly scrollingGridContainer: Node;
  private readonly gridNode: OscillatorGridNode;

  private readonly penViewX: number;
  private readonly gridWidth: number;
  private readonly gridTopView: number;
  private readonly gridBottomView: number;
  private readonly gridLeft: number;
  private readonly gridRight: number;

  /** Current scroll offset in view pixels (increases over time as grid moves left) */
  private scrollOffset = 0;

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

    // Trace line path
    this.tracePath = new Path(null, {
      stroke: ResonanceColors.traceLineProperty,
      lineWidth: ResonanceConstants.TRACE_LINE_WIDTH,
      lineJoin: "round",
      lineCap: "round",
    });
    this.addChild(this.tracePath);
  }

  /**
   * Update the trace visualization. Called each frame from the screen view's step().
   * @param dt - time step in seconds (real time, not simulation time)
   */
  public step(dt: number): void {
    if (!this.traceData.traceEnabledProperty.value) {
      return;
    }

    // Scroll the grid to the left
    this.scrollOffset += ResonanceConstants.TRACE_SCROLL_SPEED * dt;

    // Wrap the scroll offset so the grid tiles seamlessly.
    // The grid is 3x wide, so we wrap at 1x width.
    const wrapWidth = this.gridWidth;
    if (this.scrollOffset > wrapWidth) {
      this.scrollOffset -= wrapWidth;
    }

    this.scrollingGridContainer.x = -this.scrollOffset;

    // Rebuild the trace path from data points
    this.updateTracePath();
  }

  /**
   * Rebuild the trace line shape from the collected data points.
   *
   * Each point has a time and a position. The most recent point appears at
   * the pen x-position. Older points are to the left of the pen, at a
   * distance proportional to how much time has passed (scrollSpeed * deltaT).
   */
  private updateTracePath(): void {
    const points = this.traceData.getPoints();
    if (points.length < 2) {
      this.tracePath.shape = null;
      return;
    }

    const elapsed = this.traceData.getElapsedTime();
    const scrollSpeed = ResonanceConstants.TRACE_SCROLL_SPEED;

    const shape = new Shape();
    let started = false;

    for (const pt of points) {
      // Time ago = elapsed - pt.time
      // View x = penViewX - scrollSpeed * timeAgo
      const viewX = this.penViewX - scrollSpeed * (elapsed - pt.time);

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
  }

  /** Clear the trace visualization and reset scroll */
  public clear(): void {
    this.scrollOffset = 0;
    this.scrollingGridContainer.x = 0;
    this.tracePath.shape = null;
    this.traceData.clear();
  }

  /** Reset everything */
  public reset(): void {
    this.clear();
  }
}
