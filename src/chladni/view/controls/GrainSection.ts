/**
 * GrainSection.ts
 *
 * Control panel section for grain (particle) control in the Chladni plate visualization.
 * Includes grain count selection, actual count display, and replenish button.
 */

import { Node, Text, VBox, HBox } from "scenerystack/scenery";
import {
  ComboBox,
  TextPushButton,
  AquaRadioButtonGroup,
} from "scenerystack/sun";
import type { ComboBoxItem } from "scenerystack/sun";
import { DerivedProperty, TReadOnlyProperty } from "scenerystack/axon";
import {
  ChladniModel,
  GrainCountOption,
  GRAIN_COUNT_OPTIONS,
  BoundaryMode,
} from "../../model/ChladniModel.js";
import ResonanceColors from "../../../common/ResonanceColors.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../../i18n/ResonanceStrings.js";

/**
 * Map of grain count values to their string properties.
 */
const GRAIN_COUNT_STRINGS = new Map<number, TReadOnlyProperty<string>>([
  [1000, ResonanceStrings.chladni.grains1000StringProperty],
  [5000, ResonanceStrings.chladni.grains5000StringProperty],
  [10000, ResonanceStrings.chladni.grains10000StringProperty],
  [25000, ResonanceStrings.chladni.grains25000StringProperty],
]);

export class GrainSection extends VBox {
  public constructor(model: ChladniModel, comboBoxListParent: Node) {
    // --- Grain Count Selection ---
    const grainCountLabel = new Text(
      ResonanceStrings.chladni.grainsStringProperty,
      {
        font: ResonanceConstants.LABEL_FONT,
        fill: ResonanceColors.textProperty,
      },
    );

    const grainCountComboBoxItems: ComboBoxItem<GrainCountOption>[] =
      GRAIN_COUNT_OPTIONS.map((option) => ({
        value: option,
        createNode: () => {
          const stringProperty =
            GRAIN_COUNT_STRINGS.get(option.value) ??
            ResonanceStrings.chladni.grains10000StringProperty;
          return new Text(stringProperty, {
            font: ResonanceConstants.CONTROL_FONT,
          });
        },
      }));

    const grainCountComboBox = new ComboBox(
      model.grainCountProperty,
      grainCountComboBoxItems,
      comboBoxListParent,
      {
        xMargin: ResonanceConstants.COMBO_BOX_X_MARGIN,
        yMargin: ResonanceConstants.COMBO_BOX_Y_MARGIN,
        cornerRadius: ResonanceConstants.COMBO_BOX_CORNER_RADIUS,
      },
    );

    // --- Actual Grain Count Display ---
    const actualCountText = new Text("", {
      font: ResonanceConstants.CONTROL_FONT,
      fill: ResonanceColors.textProperty,
    });

    model.actualParticleCountProperty.link((count) => {
      actualCountText.string = `(${count.toLocaleString()})`;
    });

    // --- Replenish Button ---
    const replenishEnabledProperty = new DerivedProperty(
      [model.actualParticleCountProperty, model.grainCountProperty],
      (actualCount, grainOption) => actualCount !== grainOption.value,
    );

    // Text fill changes based on enabled state and color profile
    const replenishTextFillProperty = new DerivedProperty(
      [
        replenishEnabledProperty,
        ResonanceColors.textProperty,
        ResonanceColors.textDisabledProperty,
      ],
      (enabled, textColor, disabledColor) =>
        enabled ? textColor : disabledColor,
    );

    const replenishButton = new TextPushButton(
      ResonanceStrings.chladni.replenishStringProperty,
      {
        font: ResonanceConstants.CONTROL_FONT,
        listener: () => {
          model.regenerateParticles();
        },
        baseColor: ResonanceColors.subPanelFillProperty,
        textFill: replenishTextFillProperty,
        enabledProperty: replenishEnabledProperty,
      },
    );

    const grainCountRow = new HBox({
      children: [grainCountComboBox, actualCountText, replenishButton],
      spacing: 10,
      align: "center",
    });

    const grainCountBox = new VBox({
      children: [grainCountLabel, grainCountRow],
      spacing: ResonanceConstants.COMBO_BOX_SPACING,
      align: "left",
    });

    // --- Boundary Mode Radio Buttons ---
    const boundaryModeLabel = new Text(
      ResonanceStrings.chladni.boundaryModeStringProperty,
      {
        font: ResonanceConstants.LABEL_FONT,
        fill: ResonanceColors.textProperty,
      },
    );

    const boundaryModeItems: { value: BoundaryMode; createNode: () => Node }[] =
      [
        {
          value: "clamp",
          createNode: () =>
            new Text(ResonanceStrings.chladni.boundaryClampStringProperty, {
              font: ResonanceConstants.CONTROL_FONT,
              fill: ResonanceColors.textProperty,
            }),
        },
        {
          value: "remove",
          createNode: () =>
            new Text(ResonanceStrings.chladni.boundaryRemoveStringProperty, {
              font: ResonanceConstants.CONTROL_FONT,
              fill: ResonanceColors.textProperty,
            }),
        },
      ];

    const boundaryModeRadioButtons = new AquaRadioButtonGroup(
      model.boundaryModeProperty,
      boundaryModeItems,
      {
        orientation: "horizontal",
        spacing: 15,
        radioButtonOptions: {
          radius: 8,
        },
      },
    );

    const boundaryModeBox = new HBox({
      children: [boundaryModeLabel, boundaryModeRadioButtons],
      spacing: 10,
      align: "center",
    });

    super({
      children: [grainCountBox, boundaryModeBox],
      spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
      align: "left",
    });
  }
}
