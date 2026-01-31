import { Screen, ScreenOptions } from "scenerystack/sim";
import { SimModel } from "./model/SimModel.js";
import { SimScreenView } from "./view/SimScreenView.js";
import { ResonancePreferencesModel } from "../preferences/ResonancePreferencesModel.js";
import ResonanceColors from "../common/ResonanceColors.js";
import { KeyboardShortcutsNode } from "./view/KeyboardShortcutsNode.js";
import { ResonanceStrings } from "../i18n/ResonanceStrings.js";

export class SimScreen extends Screen<SimModel, SimScreenView> {
  public constructor(
    preferencesModel: ResonancePreferencesModel,
    options: ScreenOptions,
  ) {
    super(
      () => new SimModel(preferencesModel),
      (model: SimModel) => new SimScreenView(model),
      {
        ...options,
        name: ResonanceStrings.screens.simStringProperty,
        backgroundColorProperty: ResonanceColors.backgroundProperty,
        createKeyboardHelpNode: () => new KeyboardShortcutsNode(),
      },
    );
  }
}
