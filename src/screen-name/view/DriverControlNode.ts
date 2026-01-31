/**
 * DriverControlNode is the grey box at the bottom of the simulation that contains
 * the power toggle, frequency slider, and amplitude slider for the driving force.
 */

import { Node, Text, Rectangle, HBox, VBox } from "scenerystack/scenery";
import { ToggleSwitch } from "scenerystack/sun";
import { NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { SimModel } from "../model/SimModel.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import { CircularUpdateGuard } from "../../common/util/index.js";
import { NumberControlFactory } from "./NumberControlFactory.js";

export class DriverControlNode extends Node {
  public constructor(model: SimModel) {
    super();

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

    // Power Toggle
    const powerToggleLabel = new Text(
      ResonanceStrings.controls.onStringProperty,
      {
        font: ResonanceConstants.LABEL_FONT,
        fill: ResonanceColors.driverTextProperty,
      },
    );
    const powerToggleSwitch = new ToggleSwitch(
      model.resonanceModel.drivingEnabledProperty,
      false,
      true,
      {
        trackFillLeft: ResonanceColors.toggleTrackOffProperty,
        trackFillRight: ResonanceColors.toggleTrackOnProperty,
        thumbFill: "white",
        scale: 0.7,
      },
    );
    const powerToggleBox = new VBox({
      children: [powerToggleLabel, powerToggleSwitch],
      spacing: ResonanceConstants.POWER_TOGGLE_SPACING,
    });

    // Frequency Control
    const frequencyControl = NumberControlFactory.createScaled({
      titleProperty: ResonanceStrings.controls.frequencyStringProperty,
      numberProperty: model.resonanceModel.drivingFrequencyProperty,
      range: ResonanceConstants.FREQUENCY_RANGE,
      delta: 0.1,
      decimalPlaces: 1,
      valuePattern: ResonanceStrings.units.hertzPatternStringProperty,
      trackFill: ResonanceColors.frequencyTrackProperty,
      minorTickSpacing: 0.5,
    });

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

    // Container for all three controls in a row
    const controlsBox = new HBox({
      children: [powerToggleBox, frequencyControl, amplitudeControl],
      spacing: 25,
    });
    controlsBox.center = driverBox.center;
    this.addChild(controlsBox);
  }
}
