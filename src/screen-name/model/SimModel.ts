import { ResonanceModel } from "../../common/model/index.js";
import { ResonancePreferencesModel } from "../../preferences/ResonancePreferencesModel.js";

/**
 * Main model for the Resonance simulation
 * Wraps the ResonanceModel and provides the interface expected by the screen
 */
export class SimModel {
  public readonly resonanceModel: ResonanceModel;

  public constructor(preferencesModel: ResonancePreferencesModel) {
    this.resonanceModel = new ResonanceModel(preferencesModel);
  }

  public reset(): void {
    // Called when the user presses the reset-all button
    this.resonanceModel.reset();
  }

  public step(dt: number): void {
    // Called every frame, with the time since the last frame in seconds
    this.resonanceModel.step(dt);
  }
}
