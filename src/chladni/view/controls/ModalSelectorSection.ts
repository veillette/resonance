/**
 * ModalSelectorSection.ts
 *
 * Control panel section for modal shape visualization in the Chladni plate simulation.
 * Includes checkbox to show modal shape overlay and controls for selecting the mode (m, n).
 *
 * @placeholder - This is a minimal implementation. Full mode selector UI to be implemented.
 */

import { Text, VBox } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";
import { Property } from "scenerystack/axon";
import ResonanceColors from "../../../common/ResonanceColors.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";
import type { ModeSelection } from "../ModalShapeNode.js";

export class ModalSelectorSection extends VBox {
  /**
   * Property controlling whether the modal shape visualization is shown.
   */
  public readonly showModalShapeProperty: Property<boolean>;

  /**
   * Property containing the currently selected mode (m, n).
   */
  public readonly selectedModeProperty: Property<ModeSelection>;

  public constructor() {
    // Create properties with default values
    const showModalShapeProperty = new Property<boolean>(false);
    const selectedModeProperty = new Property<ModeSelection>({ m: 1, n: 1 });

    // --- Show Modal Shape Checkbox ---
    const showModalShapeCheckbox = new Checkbox(
      showModalShapeProperty,
      new Text("Modal Shape", {
        font: ResonanceConstants.CONTROL_FONT,
        fill: ResonanceColors.textProperty,
      }),
      {
        boxWidth: ResonanceConstants.RULER_CHECKBOX_BOX_WIDTH,
      },
    );

    // TODO: Add mode selector controls (m, n spinners or combo box)
    // For now, just include the checkbox

    super({
      children: [showModalShapeCheckbox],
      spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
      align: "left",
    });

    // Store properties for external access
    this.showModalShapeProperty = showModalShapeProperty;
    this.selectedModeProperty = selectedModeProperty;
  }

  /**
   * Reset modal selector options to their default values.
   */
  public reset(): void {
    this.showModalShapeProperty.reset();
    this.selectedModeProperty.reset();
  }
}
