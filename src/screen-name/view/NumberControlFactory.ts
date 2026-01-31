/**
 * NumberControlFactory provides factory methods for creating NumberControl instances
 * with consistent styling throughout the Resonance simulation.
 */

import { Text, Color } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import { NumberProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Range, Dimension2 } from "scenerystack/dot";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";

/**
 * Options for creating a NumberControl with the factory.
 */
export interface NumberControlFactoryOptions {
  /** The title/label for the control */
  titleProperty: TReadOnlyProperty<string>;
  /** The property to control */
  numberProperty: NumberProperty;
  /** The valid range for the property */
  range: Range;
  /** Step size for arrow buttons */
  delta: number;
  /** Number of decimal places to display */
  decimalPlaces: number;
  /** Optional unit pattern (e.g., "{{value}} Hz") */
  valuePattern?: TReadOnlyProperty<string>;
  /** Optional custom track fill color */
  trackFill?: TReadOnlyProperty<Color | string>;
  /** Optional minor tick spacing */
  minorTickSpacing?: number;
  /** Optional custom major ticks */
  majorTicks?: Array<{ value: number; label: Text }>;
  /** Track width (default 120) */
  trackWidth?: number;
  /** Optional dynamic enabled range property for the slider */
  enabledRangeProperty?: TReadOnlyProperty<Range>;
}

/**
 * Factory for creating consistently styled NumberControl instances.
 */
export class NumberControlFactory {
  /**
   * Default track size used across the simulation.
   */
  private static readonly DEFAULT_TRACK_SIZE = new Dimension2(120, 3);

  /**
   * Creates a NumberControl with standard Resonance styling.
   */
  public static create(options: NumberControlFactoryOptions): NumberControl {
    const {
      titleProperty,
      numberProperty,
      range,
      delta,
      decimalPlaces,
      valuePattern,
      trackFill,
      minorTickSpacing,
      majorTicks,
      trackWidth = 120,
      enabledRangeProperty,
    } = options;

    const trackSize =
      trackWidth === 120
        ? NumberControlFactory.DEFAULT_TRACK_SIZE
        : new Dimension2(trackWidth, 3);

    return new NumberControl(titleProperty, numberProperty, range, {
      delta,
      enabledRangeProperty,
      numberDisplayOptions: {
        valuePattern,
        decimalPlaces,
        textOptions: {
          font: ResonanceConstants.LABEL_FONT,
          fill: ResonanceColors.preferencesTextProperty,
        },
      },
      titleNodeOptions: {
        font: ResonanceConstants.LABEL_FONT,
        fill: ResonanceColors.textProperty,
      },
      sliderOptions: {
        trackSize,
        trackFillEnabled: trackFill,
        minorTickSpacing,
        majorTicks,
        majorTickStroke: ResonanceColors.textProperty,
        minorTickStroke: ResonanceColors.textProperty,
      },
    });
  }

  /**
   * Creates a NumberControl and applies the standard control scale.
   */
  public static createScaled(
    options: NumberControlFactoryOptions,
  ): NumberControl {
    const control = NumberControlFactory.create(options);
    control.setScaleMagnitude(ResonanceConstants.CONTROL_SCALE);
    return control;
  }
}
