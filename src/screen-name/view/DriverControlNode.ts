/**
 * DriverControlNode is the grey box at the bottom of the simulation that contains
 * the power toggle, frequency slider, and amplitude slider for the driving force.
 */

import { Node, Text, Rectangle, HBox } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import { ToggleSwitch } from "scenerystack/sun";
import { NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { SimModel } from "../model/SimModel.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../strings/ResonanceStrings.js";

export class DriverControlNode extends Node {

  public constructor( model: SimModel ) {
    super();

    // Grey driver box
    const driverBox = new Rectangle( 0, 0,
      ResonanceConstants.DRIVER_BOX_WIDTH,
      ResonanceConstants.DRIVER_BOX_HEIGHT,
      ResonanceConstants.DRIVER_BOX_CORNER_RADIUS,
      ResonanceConstants.DRIVER_BOX_CORNER_RADIUS, {
        fill: ResonanceColors.driverFillProperty,
        stroke: ResonanceColors.driverStrokeProperty,
        lineWidth: ResonanceConstants.DRIVER_BOX_LINE_WIDTH
      } );
    this.addChild( driverBox );

    // Power Toggle
    const powerToggleLabel = new Text( ResonanceStrings.controls.onStringProperty, {
      font: ResonanceConstants.LABEL_FONT,
      fill: ResonanceColors.driverTextProperty
    } );
    const powerToggleSwitch = new ToggleSwitch( model.resonanceModel.drivingEnabledProperty, false, true, {
      trackFillLeft: ResonanceColors.toggleTrackOffProperty,
      trackFillRight: ResonanceColors.toggleTrackOnProperty,
      thumbFill: 'white'
    } );
    const powerToggleBox = new HBox( {
      children: [ powerToggleLabel, powerToggleSwitch ],
      spacing: ResonanceConstants.POWER_TOGGLE_SPACING,
      left: ResonanceConstants.POWER_TOGGLE_LEFT,
      top: ResonanceConstants.POWER_TOGGLE_TOP
    } );
    this.addChild( powerToggleBox );

    // Frequency Control
    const frequencyControl = new NumberControl( ResonanceStrings.controls.frequencyStringProperty, model.resonanceModel.drivingFrequencyProperty, ResonanceConstants.FREQUENCY_RANGE, {
      delta: 0.01,
      numberDisplayOptions: {
        valuePattern: '{{value}} Hz',
        decimalPlaces: 2
      },
      sliderOptions: {
        trackFillEnabled: ResonanceColors.frequencyTrackProperty
      }
    } );
    frequencyControl.setScaleMagnitude( ResonanceConstants.CONTROL_SCALE );
    frequencyControl.centerX = driverBox.centerX;
    frequencyControl.top = ResonanceConstants.FREQUENCY_CONTROL_TOP;
    this.addChild( frequencyControl );

    // Amplitude Control (display in cm, model in meters)
    const amplitudeCmProperty = new NumberProperty( model.resonanceModel.drivingAmplitudeProperty.value * 100 );

    // Bidirectional sync: cm <-> meters
    let updatingAmplitude = false;
    amplitudeCmProperty.link( ( cm: number ) => {
      if ( !updatingAmplitude ) {
        updatingAmplitude = true;
        model.resonanceModel.drivingAmplitudeProperty.value = cm / 100;
        updatingAmplitude = false;
      }
    } );
    model.resonanceModel.drivingAmplitudeProperty.link( ( meters: number ) => {
      if ( !updatingAmplitude ) {
        updatingAmplitude = true;
        amplitudeCmProperty.value = meters * 100;
        updatingAmplitude = false;
      }
    } );

    const amplitudeRangeCm = new Range(
      ResonanceConstants.AMPLITUDE_RANGE.min * 100,
      ResonanceConstants.AMPLITUDE_RANGE.max * 100
    );

    const amplitudeControl = new NumberControl(
      ResonanceStrings.controls.amplitudeStringProperty,
      amplitudeCmProperty,
      amplitudeRangeCm,
      {
        delta: 0.01,
        numberDisplayOptions: {
          valuePattern: '{{value}} cm',
          decimalPlaces: 2
        },
        sliderOptions: {
          trackFillEnabled: ResonanceColors.amplitudeTrackProperty
        }
      }
    );
    amplitudeControl.setScaleMagnitude( ResonanceConstants.CONTROL_SCALE );
    amplitudeControl.left = ResonanceConstants.AMPLITUDE_CONTROL_LEFT;
    amplitudeControl.bottom = driverBox.bottom - ResonanceConstants.AMPLITUDE_CONTROL_BOTTOM_MARGIN;
    this.addChild( amplitudeControl );
  }
}
