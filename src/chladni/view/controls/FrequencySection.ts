/**
 * FrequencySection.ts
 *
 * Control panel section for frequency control in the Chladni plate visualization.
 * Includes the frequency slider and sweep button.
 */

import { VBox } from "scenerystack/scenery";
import { TextPushButton } from "scenerystack/sun";
import { DerivedProperty } from "scenerystack/axon";
import { ChladniModel } from "../../model/ChladniModel.js";
import ResonanceColors from "../../../common/ResonanceColors.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../../i18n/ResonanceStrings.js";
import { NumberControlFactory } from "../../../screen-name/view/NumberControlFactory.js";

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

    // Create sweep button (enabled only when not currently sweeping)
    const sweepEnabledProperty = new DerivedProperty(
      [model.isSweepingProperty],
      (isSweeping) => !isSweeping,
    );

    // Text fill changes based on enabled state and color profile
    const sweepTextFillProperty = new DerivedProperty(
      [
        sweepEnabledProperty,
        ResonanceColors.textProperty,
        ResonanceColors.textDisabledProperty,
      ],
      (enabled, textColor, disabledColor) =>
        enabled ? textColor : disabledColor,
    );

    const sweepButton = new TextPushButton(
      ResonanceStrings.chladni.sweepStringProperty,
      {
        font: ResonanceConstants.CONTROL_FONT,
        listener: () => {
          model.startSweep();
        },
        baseColor: ResonanceColors.subPanelFillProperty,
        textFill: sweepTextFillProperty,
        enabledProperty: sweepEnabledProperty,
      },
    );

    super({
      children: [frequencyControl, sweepButton],
      spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
      align: "left",
    });
  }
}
