/**
 * Preferences Dialog
 * Main panel containing all preference panels organized vertically
 */

import { VBox, Text } from "scenerystack/scenery";
import { Panel } from "scenerystack/sun";
import { RectangularPushButton } from "scenerystack/sun";
import { PhetFont } from "scenerystack/scenery-phet";
import { ResonancePreferencesModel } from "./ResonancePreferencesModel.js";
import { VisualPreferencesPanel } from "./VisualPreferencesPanel.js";
import { SimulationPreferencesPanel } from "./SimulationPreferencesPanel.js";
import { ResonanceStrings } from "../strings/ResonanceStrings.js";
import ResonanceColors from "../common/ResonanceColors.js";
import ResonanceConstants from "../common/ResonanceConstants.js";

export class PreferencesDialog extends Panel {
  public constructor(
    preferencesModel: ResonancePreferencesModel,
    closeCallback: () => void
  ) {
    const strings = ResonanceStrings.resonance.preferences;

    // Title
    const title = new Text(strings.title, {
      font: new PhetFont({ size: 20, weight: 'bold' }),
      fill: ResonanceColors.textProperty,
    });

    // Create preference panels
    const visualLabel = new Text(strings.visual.title, {
      font: ResonanceConstants.TITLE_FONT,
      fill: ResonanceColors.textProperty,
    });

    const visualPanel = new Panel(new VisualPreferencesPanel(preferencesModel), {
      fill: ResonanceColors.panelFillProperty,
      stroke: ResonanceColors.panelStrokeProperty,
      cornerRadius: 5,
      xMargin: 15,
      yMargin: 15,
    });

    const simulationLabel = new Text(strings.simulation.title, {
      font: ResonanceConstants.TITLE_FONT,
      fill: ResonanceColors.textProperty,
    });

    const simulationPanel = new Panel(
      new SimulationPreferencesPanel(preferencesModel),
      {
        fill: ResonanceColors.panelFillProperty,
        stroke: ResonanceColors.panelStrokeProperty,
        cornerRadius: 5,
        xMargin: 15,
        yMargin: 15,
      }
    );

    // Close button
    const closeButton = new RectangularPushButton({
      content: new Text(ResonanceStrings.controls.closeStringProperty, {
        font: ResonanceConstants.CONTROL_FONT,
        fill: ResonanceColors.textProperty,
      }),
      listener: closeCallback,
      baseColor: ResonanceColors.panelFillProperty,
      xMargin: 10,
      yMargin: 6,
    });

    // Combine all content
    const content = new VBox({
      align: "center",
      spacing: 15,
      children: [
        title,
        visualLabel,
        visualPanel,
        simulationLabel,
        simulationPanel,
        closeButton,
      ],
    });

    super(content, {
      fill: ResonanceColors.backgroundProperty,
      stroke: ResonanceColors.panelStrokeProperty,
      xMargin: 20,
      yMargin: 20,
      cornerRadius: 10,
      lineWidth: 2,
    });
  }
}
