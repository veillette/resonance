/**
 * PhaseAnalysisScreen is the third screen of the simulation.
 * It demonstrates phase relationships in driven oscillators.
 */

import { Screen, ScreenOptions } from "scenerystack/sim";
import { PhaseAnalysisModel } from "./model/PhaseAnalysisModel.js";
import { PhaseAnalysisScreenView } from "./view/PhaseAnalysisScreenView.js";
import { ResonancePreferencesModel } from "../preferences/ResonancePreferencesModel.js";
import ResonanceColors from "../common/ResonanceColors.js";
import { KeyboardShortcutsNode } from "../common/view/KeyboardShortcutsNode.js";
import { ResonanceStrings } from "../i18n/ResonanceStrings.js";

export class PhaseAnalysisScreen extends Screen<
  PhaseAnalysisModel,
  PhaseAnalysisScreenView
> {
  public constructor(
    preferencesModel: ResonancePreferencesModel,
    options: ScreenOptions,
  ) {
    super(
      () => new PhaseAnalysisModel(preferencesModel),
      (model: PhaseAnalysisModel) => new PhaseAnalysisScreenView(model),
      {
        ...options,
        name: ResonanceStrings.screens.phaseAnalysisStringProperty,
        backgroundColorProperty: ResonanceColors.backgroundProperty,
        createKeyboardHelpNode: () => new KeyboardShortcutsNode(),
      },
    );
  }
}
