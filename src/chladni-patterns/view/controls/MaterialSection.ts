/**
 * MaterialSection.ts
 *
 * Control panel section for material selection in the Chladni plate visualization.
 */

import { Node, Text, VBox } from "scenerystack/scenery";
import { ComboBox } from "scenerystack/sun";
import type { ComboBoxItem } from "scenerystack/sun";
import { ChladniModel } from "../../model/ChladniModel.js";
import { MaterialType, MATERIALS } from "../../model/Material.js";
import ResonanceColors from "../../../common/ResonanceColors.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../../i18n/ResonanceStrings.js";
import { TReadOnlyProperty } from "scenerystack/axon";
import { Material } from "../../model/Material.js";

/**
 * Map of material types to their string properties.
 */
const MATERIAL_STRINGS = new Map<MaterialType, TReadOnlyProperty<string>>([
  [Material.COPPER, ResonanceStrings.chladni.copperStringProperty],
  [Material.ALUMINUM, ResonanceStrings.chladni.aluminumStringProperty],
  [Material.ZINC, ResonanceStrings.chladni.zincStringProperty],
  [
    Material.STAINLESS_STEEL,
    ResonanceStrings.chladni.stainlessSteelStringProperty,
  ],
]);

export class MaterialSection extends VBox {
  public constructor(model: ChladniModel, comboBoxListParent: Node) {
    // Create label
    const materialLabel = new Text(
      ResonanceStrings.chladni.materialStringProperty,
      {
        font: ResonanceConstants.LABEL_FONT,
        fill: ResonanceColors.textProperty,
      },
    );

    // Create combo box items
    const materialComboBoxItems: ComboBoxItem<MaterialType>[] = MATERIALS.map(
      (material) => ({
        value: material,
        createNode: () => {
          const stringProperty =
            MATERIAL_STRINGS.get(material) ??
            ResonanceStrings.chladni.copperStringProperty;
          return new Text(stringProperty, {
            font: ResonanceConstants.CONTROL_FONT,
          });
        },
      }),
    );

    // Create combo box
    const materialComboBox = new ComboBox(
      model.materialProperty,
      materialComboBoxItems,
      comboBoxListParent,
      {
        xMargin: ResonanceConstants.COMBO_BOX_X_MARGIN,
        yMargin: ResonanceConstants.COMBO_BOX_Y_MARGIN,
        cornerRadius: ResonanceConstants.COMBO_BOX_CORNER_RADIUS,
        // Accessibility
        accessibleName:
          ResonanceStrings.chladni.a11y.controlPanel
            .materialLabelStringProperty,
      },
    );

    super({
      children: [materialLabel, materialComboBox],
      spacing: ResonanceConstants.COMBO_BOX_SPACING,
      align: "left",
    });
  }
}
