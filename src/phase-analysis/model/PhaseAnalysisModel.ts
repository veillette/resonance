/**
 * PhaseAnalysisModel is the model for the Phase Analysis screen.
 * It extends BaseOscillatorScreenModel and provides the same functionality.
 *
 * In the future, this class can be extended to add screen-specific behavior
 * for phase analysis features.
 */

import { BaseOscillatorScreenModel } from "../../common/model/BaseOscillatorScreenModel.js";
import { ResonancePreferencesModel } from "../../preferences/ResonancePreferencesModel.js";

export class PhaseAnalysisModel extends BaseOscillatorScreenModel {
  public constructor(preferencesModel: ResonancePreferencesModel) {
    super(preferencesModel);
  }
}
