/**
 * SweepButton.ts
 *
 * A reusable toggle button for starting and stopping frequency sweeps.
 * Used across all screens (oscillator screens and Chladni screen).
 *
 * The button displays a chirp icon (sinusoidal wave with increasing frequency)
 * and acts as a toggle: pressing starts a sweep, pressing again stops it.
 *
 * This component is model-agnostic - it accepts generic properties and callbacks
 * rather than depending on any specific model type.
 */

import { Node, Path, TColor, Color } from "scenerystack/scenery";
import {
  RectangularPushButton,
  FlatAppearanceStrategy,
} from "scenerystack/sun";
import { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import ResonanceColors from "../ResonanceColors.js";

/**
 * Options for creating a SweepButton.
 */
export interface SweepButtonOptions {
  /**
   * Callback invoked when the button is pressed.
   * Should toggle the sweep (start if not sweeping, stop if sweeping).
   */
  toggleSweep: () => void;

  /**
   * Optional stroke color for the sweep icon.
   * Defaults to ResonanceColors.textProperty.
   */
  iconStroke?: TReadOnlyProperty<Color | string> | TColor;

  /**
   * Optional accessible name for the button.
   */
  accessibleName?: TReadOnlyProperty<string>;
}

/**
 * Creates a frequency sweep icon - a sinusoidal wave that gets more compressed
 * from left to right, representing increasing frequency during a sweep (chirp).
 */
function createSweepIconNode(options: {
  width?: number;
  height?: number;
  lineWidth?: number;
  stroke?: TColor;
}): Node {
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
    // phase = 2pi * (f0 * t + (f1 - f0) * t^2 / 2)
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

/**
 * SweepButton is a RectangularPushButton that toggles a frequency sweep.
 * It is a common component shared across all simulation screens.
 */
export class SweepButton extends RectangularPushButton {
  public constructor(options: SweepButtonOptions) {
    const iconStroke = options.iconStroke ?? ResonanceColors.textProperty;

    const sweepIcon = createSweepIconNode({
      width: 30,
      height: 16,
      lineWidth: 2,
      stroke: iconStroke,
    });

    super({
      content: sweepIcon,
      listener: () => {
        options.toggleSweep();
      },
      baseColor: ResonanceColors.subPanelFillProperty,
      disabledColor: new Color(90, 90, 90),
      buttonAppearanceStrategy: FlatAppearanceStrategy,
      xMargin: 8,
      yMargin: 6,
      accessibleName: options.accessibleName,
    });
  }
}
