/**
 * FrequencySection.ts
 *
 * Control panel section for frequency control in the Chladni plate visualization.
 * Includes the frequency slider and sweep button.
 */

import { VBox, Path, TColor, Color } from "scenerystack/scenery";
import {
  RectangularPushButton,
  FlatAppearanceStrategy,
} from "scenerystack/sun";
import { DerivedProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { ChladniModel } from "../../model/ChladniModel.js";
import ResonanceColors from "../../../common/ResonanceColors.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../../i18n/ResonanceStrings.js";
import { NumberControlFactory } from "../../../common/view/NumberControlFactory.js";

/**
 * Creates a frequency sweep icon - a sinusoidal wave that gets more compressed from left to right,
 * representing increasing frequency during a sweep.
 */
function createSweepIconNode(options: {
  width?: number;
  height?: number;
  lineWidth?: number;
  stroke?: TColor;
}): Path {
  const width = options.width ?? 30;
  const height = options.height ?? 16;
  const lineWidth = options.lineWidth ?? 2;
  const stroke = options.stroke ?? "#666";

  // Create a sinusoidal wave with increasing frequency (chirp)
  // The frequency increases quadratically from left to right
  const shape = new Shape();
  const numPoints = 60;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints; // 0 to 1 across the width
    const x = t * width;

    // Quadratic chirp: frequency increases with position
    // phase = 2π * (f0 * t + (f1 - f0) * t² / 2)
    // where f0 = 1.5 cycles, f1 = 6 cycles over the width
    const f0 = 1.5;
    const f1 = 6;
    const phase = 2 * Math.PI * (f0 * t + ((f1 - f0) * t * t) / 2);

    const y = (height / 2) * Math.sin(phase);

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  return new Path(shape, {
    stroke: stroke,
    lineWidth: lineWidth,
    lineCap: "round",
    lineJoin: "round",
  });
}

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

    const sweepIcon = createSweepIconNode({
      width: 30,
      height: 16,
      lineWidth: 2,
      stroke: ResonanceColors.textProperty,
    });

    // Sweep button acts as a toggle: start sweep when not sweeping, stop when sweeping
    const sweepButton = new RectangularPushButton({
      content: sweepIcon,
      listener: () => {
        model.toggleSweep();
      },
      baseColor: ResonanceColors.subPanelFillProperty,
      disabledColor: new Color(90, 90, 90),
      buttonAppearanceStrategy: FlatAppearanceStrategy,
      xMargin: 8,
      yMargin: 6,
      // Accessibility
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
