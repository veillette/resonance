/**
 * SingleOscillatorModel is the model for the Single Oscillator screen.
 * It extends BaseOscillatorScreenModel with singleOscillatorMode enabled,
 * which hides multi-oscillator UI controls in the view.
 *
 * In the future, this class can be extended to add screen-specific behavior.
 */

import { BaseOscillatorScreenModel } from "../../common/model/BaseOscillatorScreenModel.js";
import { ResonancePreferencesModel } from "../../preferences/ResonancePreferencesModel.js";

export class SingleOscillatorModel extends BaseOscillatorScreenModel {
  public constructor(preferencesModel: ResonancePreferencesModel) {
    super(preferencesModel, { singleOscillatorMode: true });
  }
}
