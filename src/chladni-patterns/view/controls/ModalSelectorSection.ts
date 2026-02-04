/**
 * ModalSelectorSection.ts
 *
 * Control panel section for modal shape visualization in the Chladni plate simulation.
 * Includes checkbox to show modal shape overlay and controls for selecting the mode (m, n).
 */

import { HBox, Text, VBox } from "scenerystack/scenery";
import { Checkbox, NumberSpinner } from "scenerystack/sun";
import { NumberProperty, Property } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import ResonanceColors from "../../../common/ResonanceColors.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../../i18n/ResonanceStrings.js";
import { MAX_MODE } from "../../model/ChladniConstants.js";
import type { ModeSelection } from "../ModalShapeNode.js";

/**
 * Range for mode numbers (0 to MAX_MODE, but we start at 1 for user-friendly display)
 */
const MODE_RANGE = new Range(1, MAX_MODE);

export class ModalSelectorSection extends VBox {
  /**
   * Property controlling whether the modal shape visualization is shown.
   */
  public readonly showModalShapeProperty: Property<boolean>;

  /**
   * Property containing the currently selected mode (m, n).
   */
  public readonly selectedModeProperty: Property<ModeSelection>;

  // Internal properties for the spinners
  private readonly mProperty: NumberProperty;
  private readonly nProperty: NumberProperty;

  public constructor() {
    // Create properties with default values
    const showModalShapeProperty = new Property<boolean>(false);
    const selectedModeProperty = new Property<ModeSelection>({ m: 1, n: 1 });

    // Internal properties for individual mode numbers
    const mProperty = new NumberProperty(1, { range: MODE_RANGE });
    const nProperty = new NumberProperty(1, { range: MODE_RANGE });

    // Sync individual properties with the combined selection property
    mProperty.link((m) => {
      selectedModeProperty.value = { m, n: selectedModeProperty.value.n };
    });
    nProperty.link((n) => {
      selectedModeProperty.value = { m: selectedModeProperty.value.m, n };
    });

    // --- Show Modal Shape Checkbox ---
    const showModalShapeCheckbox = new Checkbox(
      showModalShapeProperty,
      new Text(ResonanceStrings.chladni.modalShapeStringProperty, {
        font: ResonanceConstants.CONTROL_FONT,
        fill: ResonanceColors.textProperty,
      }),
      {
        boxWidth: ResonanceConstants.RULER_CHECKBOX_BOX_WIDTH,
      },
    );

    // --- Mode m Spinner ---
    const mLabel = new Text(ResonanceStrings.chladni.modeMStringProperty, {
      font: ResonanceConstants.CONTROL_FONT,
      fill: ResonanceColors.textProperty,
    });

    const mSpinner = new NumberSpinner(mProperty, new Property(MODE_RANGE), {
      arrowsPosition: "bothRight",
      arrowsScale: 0.7,
      numberDisplayOptions: {
        textOptions: {
          font: ResonanceConstants.CONTROL_FONT,
          fill: ResonanceColors.textProperty,
        },
        backgroundFill: ResonanceColors.controlPanelFillProperty,
        backgroundStroke: ResonanceColors.controlPanelStrokeProperty,
        cornerRadius: 3,
        xMargin: 6,
        yMargin: 2,
      },
    });

    const mControl = new HBox({
      children: [mLabel, mSpinner],
      spacing: 8,
    });

    // --- Mode n Spinner ---
    const nLabel = new Text(ResonanceStrings.chladni.modeNStringProperty, {
      font: ResonanceConstants.CONTROL_FONT,
      fill: ResonanceColors.textProperty,
    });

    const nSpinner = new NumberSpinner(nProperty, new Property(MODE_RANGE), {
      arrowsPosition: "bothRight",
      arrowsScale: 0.7,
      numberDisplayOptions: {
        textOptions: {
          font: ResonanceConstants.CONTROL_FONT,
          fill: ResonanceColors.textProperty,
        },
        backgroundFill: ResonanceColors.controlPanelFillProperty,
        backgroundStroke: ResonanceColors.controlPanelStrokeProperty,
        cornerRadius: 3,
        xMargin: 6,
        yMargin: 2,
      },
    });

    const nControl = new HBox({
      children: [nLabel, nSpinner],
      spacing: 8,
    });

    // --- Mode Controls Row ---
    const modeControlsRow = new HBox({
      children: [mControl, nControl],
      spacing: 16,
    });

    // Link visibility of mode controls to the checkbox
    showModalShapeProperty.link((visible) => {
      modeControlsRow.visible = visible;
    });

    super({
      children: [showModalShapeCheckbox, modeControlsRow],
      spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
      align: "left",
    });

    // Store properties for external access
    this.showModalShapeProperty = showModalShapeProperty;
    this.selectedModeProperty = selectedModeProperty;
    this.mProperty = mProperty;
    this.nProperty = nProperty;
  }

  /**
   * Reset modal selector options to their default values.
   */
  public reset(): void {
    this.showModalShapeProperty.reset();
    this.mProperty.reset();
    this.nProperty.reset();
    this.selectedModeProperty.reset();
  }
}
