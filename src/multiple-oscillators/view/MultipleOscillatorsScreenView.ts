/**
 * MultipleOscillatorsScreenView is the view for the Multiple Oscillators screen.
 * It extends BaseOscillatorScreenView and provides the same functionality.
 *
 * In the future, this class can be extended to add screen-specific UI elements.
 */

import { ScreenViewOptions } from "scenerystack/sim";
import { BaseOscillatorScreenView } from "../../common/view/BaseOscillatorScreenView.js";
import { MultipleOscillatorsModel } from "../model/MultipleOscillatorsModel.js";

export class MultipleOscillatorsScreenView extends BaseOscillatorScreenView {
  public constructor(model: MultipleOscillatorsModel, options?: ScreenViewOptions) {
    super(model, options);
  }
}
