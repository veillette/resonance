/**
 * SingleOscillatorModel is the model for the Single Oscillator screen.
 * It extends BaseOscillatorScreenModel and provides the same functionality.
 *
 * In the future, this class can be extended to add screen-specific behavior.
 */

import { BaseOscillatorScreenModel } from "../../common/model/BaseOscillatorScreenModel.js";
import { ResonancePreferencesModel } from "../../preferences/ResonancePreferencesModel.js";

export class SingleOscillatorModel extends BaseOscillatorScreenModel {
  public constructor(preferencesModel: ResonancePreferencesModel) {
    super(preferencesModel);
  }
}
