/**
 * ModalShapeNode.ts
 *
 * Visualizes the theoretical modal shape (eigenfunction) of the Chladni plate
 * at a selected mode (m, n) and current wave number.
 *
 * This is a placeholder implementation for the modal shape visualization feature.
 */

import { CanvasNode, CanvasNodeOptions } from "scenerystack/scenery";
import { Property } from "scenerystack/axon";
import { Bounds2 } from "scenerystack/dot";

/**
 * Represents a mode selection (m, n) for the Chladni plate.
 */
export type ModeSelection = {
  m: number;
  n: number;
};

/**
 * ModalShapeNode renders the theoretical modal shape for a selected mode.
 *
 * @placeholder - This is a minimal implementation. Full visualization to be implemented.
 */
export class ModalShapeNode extends CanvasNode {
  private readonly selectedModeProperty: Property<ModeSelection>;
  private waveNumber: number;
  private plateWidth: number;
  private plateHeight: number;

  public constructor(
    viewWidth: number,
    viewHeight: number,
    plateWidth: number,
    plateHeight: number,
    selectedModeProperty: Property<ModeSelection>,
    waveNumber: number,
    options?: CanvasNodeOptions,
  ) {
    super({
      ...options,
      canvasBounds: new Bounds2(0, 0, viewWidth, viewHeight),
    });

    this.plateWidth = plateWidth;
    this.plateHeight = plateHeight;
    this.selectedModeProperty = selectedModeProperty;
    this.waveNumber = waveNumber;

    // Listen for mode changes
    this.selectedModeProperty.link(() => {
      this.update();
    });
  }

  /**
   * Update the dimensions of the modal shape visualization.
   */
  public updateDimensions(
    viewWidth: number,
    viewHeight: number,
    plateWidth: number,
    plateHeight: number,
  ): void {
    this.plateWidth = plateWidth;
    this.plateHeight = plateHeight;

    this.setCanvasBounds(new Bounds2(0, 0, viewWidth, viewHeight));
    this.update();
  }

  /**
   * Set the wave number for modal calculations.
   */
  public setWaveNumber(waveNumber: number): void {
    this.waveNumber = waveNumber;
  }

  /**
   * Update the modal shape visualization.
   */
  public update(): void {
    if (!this.visible) {
      return;
    }

    this.invalidatePaint();
  }

  /**
   * Paint the modal shape on the canvas.
   * @placeholder - This is a minimal implementation. Full rendering to be implemented.
   */
  public override paintCanvas(context: CanvasRenderingContext2D): void {
    // TODO: Implement modal shape rendering
    // For now, just clear the canvas to maintain transparency
    const bounds = this.canvasBounds;
    if (bounds) {
      context.clearRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
    }
  }
}
