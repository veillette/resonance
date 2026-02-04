/**
 * MultipleOscillatorsScreen is the second screen of the simulation.
 * It demonstrates multiple driven, damped harmonic oscillators with different natural frequencies.
 */

import { Screen, ScreenOptions } from "scenerystack/sim";
import { MultipleOscillatorsModel } from "./model/MultipleOscillatorsModel.js";
import { MultipleOscillatorsScreenView } from "./view/MultipleOscillatorsScreenView.js";
import { ResonancePreferencesModel } from "../preferences/ResonancePreferencesModel.js";
import ResonanceColors from "../common/ResonanceColors.js";
import { KeyboardShortcutsNode } from "../common/view/KeyboardShortcutsNode.js";
import { ResonanceStrings } from "../i18n/ResonanceStrings.js";

export class MultipleOscillatorsScreen extends Screen<MultipleOscillatorsModel, MultipleOscillatorsScreenView> {
  public constructor(
    preferencesModel: ResonancePreferencesModel,
    options: ScreenOptions,
  ) {
    super(
      () => new MultipleOscillatorsModel(preferencesModel),
      (model: MultipleOscillatorsModel) => new MultipleOscillatorsScreenView(model),
      {
        ...options,
        name: ResonanceStrings.screens.multipleOscillatorsStringProperty,
        backgroundColorProperty: ResonanceColors.backgroundProperty,
        createKeyboardHelpNode: () => new KeyboardShortcutsNode(),
      },
    );
  }
}
