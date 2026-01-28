/**
 * Visual Preferences Panel
 * Allows users to configure visual settings including color profiles
 */

import { VBox, Text } from "scenerystack/scenery";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import { PhetFont } from "scenerystack/scenery-phet";
import { ResonancePreferencesModel } from "./ResonancePreferencesModel.js";
import { ResonanceStrings } from "../strings/ResonanceStrings.js";

export class VisualPreferencesPanel extends VBox {
  public constructor(preferencesModel: ResonancePreferencesModel) {
    // Get localized strings
    const strings = ResonanceStrings.resonance.preferences.visual;

    // Color profile selector
    const colorProfileLabel = new Text(strings.colorProfile, {
      font: new PhetFont({ size: 14, weight: 'bold' }),
    });

    const colorProfileButtons = new AquaRadioButtonGroup(
      preferencesModel.colorProfileProperty,
      [
        {
          value: "default",
          createNode: () =>
            new Text(strings.colorProfileDefault, {
              font: new PhetFont({ size: 12 }),
            }),
        },
        {
          value: "projector",
          createNode: () =>
            new Text(strings.colorProfileProjector, {
              font: new PhetFont({ size: 12 }),
            }),
        },
        {
          value: "colorblind",
          createNode: () =>
            new Text(strings.colorProfileColorblind, {
              font: new PhetFont({ size: 12 }),
            }),
        },
      ],
      {
        spacing: 8,
        radioButtonOptions: {
          radius: 8,
        },
      }
    );

    const colorProfileSection = new VBox({
      align: "left",
      spacing: 8,
      children: [colorProfileLabel, colorProfileButtons],
    });

    // Create panel content
    const content = new VBox({
      align: "left",
      spacing: 15,
      children: [colorProfileSection],
    });

    super({
      align: "left",
      spacing: 10,
      children: [content],
    });
  }
}
