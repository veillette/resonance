/**
 * PhaseAnalysisScreenView is the view for the Phase Analysis screen.
 * It extends BaseOscillatorScreenView and provides the same functionality.
 *
 * In the future, this class can be extended to add screen-specific UI elements
 * for phase analysis visualization.
 */

import { ScreenViewOptions } from "scenerystack/sim";
import { BaseOscillatorScreenView } from "../../common/view/BaseOscillatorScreenView.js";
import { PhaseAnalysisModel } from "../model/PhaseAnalysisModel.js";

export class PhaseAnalysisScreenView extends BaseOscillatorScreenView {
  public constructor(model: PhaseAnalysisModel, options?: ScreenViewOptions) {
    super(model, options);
  }
}
