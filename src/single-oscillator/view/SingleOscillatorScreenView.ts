/**
 * SingleOscillatorScreenView is the view for the Single Oscillator screen.
 * It extends BaseOscillatorScreenView and provides the same functionality.
 *
 * In the future, this class can be extended to add screen-specific UI elements.
 */

import { ScreenViewOptions } from "scenerystack/sim";
import { BaseOscillatorScreenView } from "../../common/view/BaseOscillatorScreenView.js";
import { SingleOscillatorModel } from "../model/SingleOscillatorModel.js";

export class SingleOscillatorScreenView extends BaseOscillatorScreenView {
  public constructor(
    model: SingleOscillatorModel,
    options?: ScreenViewOptions,
  ) {
    super(model, options);
  }
}
