/**
 * FrequencySection.ts
 *
 * Control panel section for frequency control in the Chladni plate visualization.
 * Includes the frequency slider and sweep button.
 */

import { VBox } from "scenerystack/scenery";
import { DerivedProperty } from "scenerystack/axon";
import { ChladniModel } from "../../model/ChladniModel.js";
import ResonanceColors from "../../../common/ResonanceColors.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../../i18n/ResonanceStrings.js";
import { NumberControlFactory } from "../../../common/view/NumberControlFactory.js";
import { SweepButton } from "../../../common/view/SweepButton.js";

export class FrequencySection extends VBox {
  public constructor(model: ChladniModel) {
    // Create frequency slider
    const frequencyControl = NumberControlFactory.create({
      titleProperty: ResonanceStrings.chladni.frequencyStringProperty,
      numberProperty: model.frequencyProperty,
      range: model.frequencyRange,
      delta: 1,
      decimalPlaces: 0,
      valuePattern: ResonanceStrings.units.hertzPatternStringProperty,
      trackFill: ResonanceColors.frequencyTrackProperty,
      trackWidth: 150,
    });

    // Disable frequency control while sweeping
    const frequencyControlEnabledProperty = new DerivedProperty(
      [model.isSweepActiveProperty],
      (isSweepActive: boolean) => !isSweepActive,
    );
    frequencyControlEnabledProperty.linkAttribute(frequencyControl, "enabled");

    // Sweep button acts as a toggle: start sweep when not sweeping, stop when sweeping
    const sweepButton = new SweepButton({
      toggleSweep: () => {
        model.toggleSweep();
      },
      accessibleName:
        ResonanceStrings.chladni.a11y.controlPanel
          .sweepButtonLabelStringProperty,
    });

    super({
      children: [frequencyControl, sweepButton],
      spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
      align: "left",
    });
  }
}
