/**
 * SingleOscillatorScreenView is the view for the Single Oscillator screen.
 * It extends BaseOscillatorScreenView and adds:
 * - Velocity, acceleration, and applied force vector arrows on the mass
 * - A control panel with checkboxes to toggle vector visibility
 */

import { ScreenViewOptions } from "scenerystack/sim";
import { BaseOscillatorScreenView } from "../../common/view/BaseOscillatorScreenView.js";
import { SingleOscillatorModel } from "../model/SingleOscillatorModel.js";
import { OscillatorVectorNode } from "./OscillatorVectorNode.js";
import { OscillatorVectorControlPanel } from "./OscillatorVectorControlPanel.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";

export class SingleOscillatorScreenView extends BaseOscillatorScreenView {
  private readonly vectorNode: OscillatorVectorNode;
  private readonly vectorControlPanel: OscillatorVectorControlPanel;

  public constructor(
    model: SingleOscillatorModel,
    options?: ScreenViewOptions,
  ) {
    super(model, options);

    // Create the vector control panel (positioned in upper-left)
    this.vectorControlPanel = new OscillatorVectorControlPanel();
    this.vectorControlPanel.left =
      this.layoutBounds.minX + ResonanceConstants.CONTROL_PANEL_X_MARGIN;
    this.vectorControlPanel.top =
      this.layoutBounds.minY + ResonanceConstants.CONTROL_PANEL_TOP_MARGIN;
    this.addChild(this.vectorControlPanel);

    // Create the vector node that displays arrows on the mass
    this.vectorNode = new OscillatorVectorNode(
      model.resonanceModel,
      this.modelViewTransform,
      {
        velocityVisibleProperty: this.vectorControlPanel.velocityVisibleProperty,
        accelerationVisibleProperty:
          this.vectorControlPanel.accelerationVisibleProperty,
        appliedForceVisibleProperty:
          this.vectorControlPanel.appliedForceVisibleProperty,
      },
    );

    // Add vector node to the resonators container so it appears with the mass
    this.resonatorsContainer.addChild(this.vectorNode);

    // Initial vector position update
    this.updateVectorPosition();
  }

  /**
   * Update the position of the vector node to match the mass bottom.
   * The vectors originate from the bottom of the mass (the spring connection point).
   */
  private updateVectorPosition(): void {
    const massNode = this.massNodes[0];
    if (massNode) {
      // Get the bottom of the mass node in parent coordinates
      // massNode.y is already the bottom of the mass (local origin is at bottom)
      const massBottomX = massNode.x;
      const massBottomY = massNode.y;
      this.vectorNode.setMassBottom(massBottomX, massBottomY);
    }
  }

  public override reset(): void {
    super.reset();
    this.vectorControlPanel.reset();
  }

  public override step(dt: number): void {
    super.step(dt);

    // Update vector position to follow the mass
    this.updateVectorPosition();

    // Update the vector arrows based on current physics values
    this.vectorNode.updateVectors();
  }
}
