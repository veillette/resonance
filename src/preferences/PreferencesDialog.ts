/**
 * Preferences Dialog
 * Main panel containing all preference panels organized vertically
 */

import { VBox, Text } from "scenerystack/scenery";
import { Panel } from "scenerystack/sun";
import { RectangularPushButton } from "scenerystack/sun";
import { ResonancePreferencesModel } from "./ResonancePreferencesModel.js";
import { VisualPreferencesPanel } from "./VisualPreferencesPanel.js";
import { SimulationPreferencesPanel } from "./SimulationPreferencesPanel.js";
import { ResonanceStrings } from "../strings/ResonanceStrings.js";
import ResonanceColors from "../common/ResonanceColors.js";

export class PreferencesDialog extends Panel {
  public constructor(
    preferencesModel: ResonancePreferencesModel,
    closeCallback: () => void
  ) {
    const strings = ResonanceStrings.resonance.preferences;

    // Title
    const title = new Text(strings.title, {
      font: "20px sans-serif",
      fontWeight: "bold",
      fill: ResonanceColors.text,
    });

    // Create preference panels
    const visualLabel = new Text(strings.visual.title, {
      font: "16px sans-serif",
      fontWeight: "bold",
      fill: ResonanceColors.text,
    });

    const visualPanel = new Panel(new VisualPreferencesPanel(preferencesModel), {
      fill: ResonanceColors.panelFill,
      stroke: ResonanceColors.panelStroke,
      cornerRadius: 5,
      xMargin: 15,
      yMargin: 15,
    });

    const simulationLabel = new Text(strings.simulation.title, {
      font: "16px sans-serif",
      fontWeight: "bold",
      fill: ResonanceColors.text,
    });

    const simulationPanel = new Panel(
      new SimulationPreferencesPanel(preferencesModel),
      {
        fill: ResonanceColors.panelFill,
        stroke: ResonanceColors.panelStroke,
        cornerRadius: 5,
        xMargin: 15,
        yMargin: 15,
      }
    );

    // Close button
    const closeButton = new RectangularPushButton({
      content: new Text("Close", {
        font: "14px sans-serif",
        fill: ResonanceColors.text,
      }),
      listener: closeCallback,
      baseColor: ResonanceColors.panelFill,
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
      fill: ResonanceColors.background,
      stroke: ResonanceColors.panelStroke,
      xMargin: 20,
      yMargin: 20,
      cornerRadius: 10,
      lineWidth: 2,
    });
  }
}
