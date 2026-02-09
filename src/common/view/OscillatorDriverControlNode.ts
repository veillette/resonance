/**
 * OscillatorDriverControlNode is the grey box at the bottom of the simulation that contains
 * the power toggle, frequency slider, and amplitude slider for the driving force.
 *
 * This is a shared control node used by all oscillator-based screens:
 * - Single Oscillator
 * - Multiple Oscillators
 * - Phase Analysis
 */

import {
  Node,
  Rectangle,
  HBox,
  VBox,
  Path,
  TColor,
} from "scenerystack/scenery";
import { ToggleSwitch } from "scenerystack/sun";
import { DerivedProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { BaseOscillatorScreenModel } from "../model/BaseOscillatorScreenModel.js";
import ResonanceColors from "../ResonanceColors.js";
import ResonanceConstants from "../ResonanceConstants.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import { CircularUpdateGuard } from "../util/index.js";
import { NumberControlFactory } from "./NumberControlFactory.js";
import { SweepButton } from "./SweepButton.js";

/**
 * Creates a power symbol (IEC 5009) - a circle with a vertical line through the top.
 * The "I" represents on (binary 1) and "O" represents off (binary 0).
 */
function createPowerSymbolNode(options: {
  radius?: number;
  lineWidth?: number;
  stroke?: TColor;
}): Node {
  const radius = options.radius ?? 10;
  const lineWidth = options.lineWidth ?? 2;
  const stroke = options.stroke ?? "#666";

  // Gap angle from vertical (in radians) - controls size of gap at top
  const gapAngle = Math.PI / 5;

  // Create the broken circle using line segments to avoid arc boundary issues
  // The circle goes from (top + gap) counterclockwise around to (top - gap)
  const segments = 32; // number of line segments to approximate the arc
  const arcSpan = 2 * Math.PI - 2 * gapAngle; // total arc angle to draw
  const startAngle = -Math.PI / 2 + gapAngle; // start just right of top

  const circleShape = new Shape();
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (i / segments) * arcSpan;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) {
      circleShape.moveTo(x, y);
    } else {
      circleShape.lineTo(x, y);
    }
  }

  const circlePath = new Path(circleShape, {
    stroke: stroke,
    lineWidth: lineWidth,
    lineCap: "round",
    lineJoin: "round",
  });

  // Create the vertical line through the top
  const lineShape = new Shape()
    .moveTo(0, -radius * 0.3)
    .lineTo(0, -radius * 1.1);

  const linePath = new Path(lineShape, {
    stroke: stroke,
    lineWidth: lineWidth,
    lineCap: "round",
  });

  return new Node({
    children: [circlePath, linePath],
  });
}

export class OscillatorDriverControlNode extends Node {
  public constructor(model: BaseOscillatorScreenModel) {
    super({
      // Accessibility: make the driver control box accessible as a group
      tagName: "div",
      labelTagName: "h3",
      labelContent: ResonanceStrings.a11y.driverControl.labelStringProperty,
      descriptionContent:
        ResonanceStrings.a11y.driverControl.descriptionStringProperty,
    });

    // Grey driver box
    const driverBox = new Rectangle(
      0,
      0,
      ResonanceConstants.DRIVER_BOX_WIDTH,
      ResonanceConstants.DRIVER_BOX_HEIGHT,
      ResonanceConstants.DRIVER_BOX_CORNER_RADIUS,
      ResonanceConstants.DRIVER_BOX_CORNER_RADIUS,
      {
        fill: ResonanceColors.driverFillProperty,
        stroke: ResonanceColors.driverStrokeProperty,
        lineWidth: ResonanceConstants.DRIVER_BOX_LINE_WIDTH,
      },
    );
    this.addChild(driverBox);

    // Power Toggle with power symbol (IEC 5009) instead of "On" text
    const powerSymbol = createPowerSymbolNode({
      radius: 9,
      lineWidth: 2,
      stroke: ResonanceColors.driverTextProperty,
    });

    const powerToggleSwitch = new ToggleSwitch(
      model.resonanceModel.drivingEnabledProperty,
      false,
      true,
      {
        trackFillLeft: ResonanceColors.toggleTrackOffProperty,
        trackFillRight: ResonanceColors.toggleTrackOnProperty,
        thumbFill: "white",
        scale: 0.7,
        // Accessibility
        accessibleName:
          ResonanceStrings.a11y.driverControl.powerToggleLabelStringProperty,
      },
    );
    const powerToggleBox = new VBox({
      children: [powerSymbol, powerToggleSwitch],
      spacing: ResonanceConstants.POWER_TOGGLE_SPACING,
    });

    // Frequency Control
    const frequencyControl = NumberControlFactory.createScaled({
      titleProperty: ResonanceStrings.controls.frequencyStringProperty,
      numberProperty: model.resonanceModel.drivingFrequencyProperty,
      range: ResonanceConstants.FREQUENCY_RANGE,
      delta: 0.01,
      decimalPlaces: 2,
      valuePattern: ResonanceStrings.units.hertzPatternStringProperty,
      trackFill: ResonanceColors.frequencyTrackProperty,
      minorTickSpacing: 0.5,
    });

    // Disable frequency control while sweeping
    const frequencyEnabledProperty = new DerivedProperty(
      [model.sweepController.isSweepingProperty],
      (isSweeping: boolean) => !isSweeping,
    );
    frequencyEnabledProperty.linkAttribute(frequencyControl, "enabled");

    // Amplitude Control (display in cm, model in meters)
    const amplitudeCmProperty = new NumberProperty(
      model.resonanceModel.drivingAmplitudeProperty.value * 100,
    );

    // Bidirectional sync: cm <-> meters
    const amplitudeGuard = new CircularUpdateGuard();
    amplitudeCmProperty.link((cm: number) => {
      amplitudeGuard.run(() => {
        model.resonanceModel.drivingAmplitudeProperty.value = cm / 100;
      });
    });
    model.resonanceModel.drivingAmplitudeProperty.link((meters: number) => {
      amplitudeGuard.run(() => {
        amplitudeCmProperty.value = meters * 100;
      });
    });

    const amplitudeRangeCm = new Range(
      ResonanceConstants.AMPLITUDE_RANGE.min * 100,
      ResonanceConstants.AMPLITUDE_RANGE.max * 100,
    );

    const amplitudeControl = NumberControlFactory.createScaled({
      titleProperty: ResonanceStrings.controls.amplitudeStringProperty,
      numberProperty: amplitudeCmProperty,
      range: amplitudeRangeCm,
      delta: 0.01,
      decimalPlaces: 2,
      valuePattern: ResonanceStrings.units.cmPatternStringProperty,
      trackFill: ResonanceColors.amplitudeTrackProperty,
      minorTickSpacing: 0.2,
    });

    // Sweep button - toggle to start/stop frequency sweep
    const sweepButton = new SweepButton({
      toggleSweep: () => {
        model.toggleSweep();
      },
      iconStroke: ResonanceColors.driverTextProperty,
      accessibleName:
        ResonanceStrings.a11y.driverControl.sweepButtonLabelStringProperty,
    });

    // Container for all controls in a row
    const controlsBox = new HBox({
      children: [
        powerToggleBox,
        frequencyControl,
        sweepButton,
        amplitudeControl,
      ],
      spacing: 25,
    });
    controlsBox.center = driverBox.center;
    this.addChild(controlsBox);
  }
}
