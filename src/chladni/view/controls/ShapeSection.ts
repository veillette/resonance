/**
 * ShapeSection.ts
 *
 * Control panel section for plate shape selection in the Chladni plate visualization.
 */

import { Node, Text, VBox } from "scenerystack/scenery";
import { ComboBox } from "scenerystack/sun";
import type { ComboBoxItem } from "scenerystack/sun";
import { Property, TReadOnlyProperty } from "scenerystack/axon";
import { PlateShape, PlateShapeType } from "../../model/PlateShape.js";
import ResonanceColors from "../../../common/ResonanceColors.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../../i18n/ResonanceStrings.js";

/**
 * All available plate shapes.
 */
const SHAPES: readonly PlateShapeType[] = [
  PlateShape.RECTANGLE,
  PlateShape.CIRCLE,
  PlateShape.GUITAR,
] as const;

/**
 * Map of shape types to their string properties.
 */
const SHAPE_STRINGS = new Map<PlateShapeType, TReadOnlyProperty<string>>([
  [PlateShape.RECTANGLE, ResonanceStrings.chladni.shapeRectangleStringProperty],
  [PlateShape.CIRCLE, ResonanceStrings.chladni.shapeCircleStringProperty],
  [PlateShape.GUITAR, ResonanceStrings.chladni.shapeGuitarStringProperty],
]);

export class ShapeSection extends VBox {
  public constructor(
    shapeProperty: Property<PlateShapeType>,
    comboBoxListParent: Node,
  ) {
    // Create label
    const shapeLabel = new Text(ResonanceStrings.chladni.shapeStringProperty, {
      font: ResonanceConstants.LABEL_FONT,
      fill: ResonanceColors.textProperty,
    });

    // Create combo box items
    const shapeComboBoxItems: ComboBoxItem<PlateShapeType>[] = SHAPES.map(
      (shape) => ({
        value: shape,
        createNode: () => {
          const stringProperty =
            SHAPE_STRINGS.get(shape) ??
            ResonanceStrings.chladni.shapeRectangleStringProperty;
          return new Text(stringProperty, {
            font: ResonanceConstants.CONTROL_FONT,
          });
        },
      }),
    );

    // Create combo box
    const shapeComboBox = new ComboBox(
      shapeProperty,
      shapeComboBoxItems,
      comboBoxListParent,
      {
        xMargin: ResonanceConstants.COMBO_BOX_X_MARGIN,
        yMargin: ResonanceConstants.COMBO_BOX_Y_MARGIN,
        cornerRadius: ResonanceConstants.COMBO_BOX_CORNER_RADIUS,
      },
    );

    super({
      children: [shapeLabel, shapeComboBox],
      spacing: ResonanceConstants.COMBO_BOX_SPACING,
      align: "left",
    });
  }
}
