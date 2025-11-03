import { Screen, ScreenOptions } from "scenerystack/sim";
import { SimModel } from "./model/SimModel.js";
import { SimScreenView } from "./view/SimScreenView.js";
import { ResonancePreferencesModel } from "../preferences/ResonancePreferencesModel.js";

export class SimScreen extends Screen<SimModel, SimScreenView> {
  public constructor(
    preferencesModel: ResonancePreferencesModel,
    options: ScreenOptions
  ) {
    super(
      () => new SimModel(preferencesModel),
      (model: SimModel) => new SimScreenView(model, preferencesModel),
      options,
    );
  }
}
