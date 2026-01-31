import { Screen, ScreenOptions } from "scenerystack/sim";
import { ChladniModel } from "./model/ChladniModel.js";
import { ChladniScreenView } from "./view/ChladniScreenView.js";
import { ResonancePreferencesModel } from "../preferences/ResonancePreferencesModel.js";
import ResonanceColors from "../common/ResonanceColors.js";
import { ResonanceStrings } from "../i18n/ResonanceStrings.js";

export class ChladniScreen extends Screen<ChladniModel, ChladniScreenView> {
  public constructor(
    preferencesModel: ResonancePreferencesModel,
    options: ScreenOptions,
  ) {
    // preferencesModel will be used when model implementation is added
    void preferencesModel;

    super(
      () => new ChladniModel(),
      (model: ChladniModel) => new ChladniScreenView(model),
      {
        ...options,
        name: ResonanceStrings.screens.chladniStringProperty,
        backgroundColorProperty: ResonanceColors.backgroundProperty,
      },
    );
  }
}
