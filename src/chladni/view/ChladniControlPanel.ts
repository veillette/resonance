/**
 * ChladniControlPanel.ts
 *
 * Control panel for the Chladni plate visualization.
 * Contains controls for material selection and frequency slider.
 */

import { Node, Text, VBox, Line } from "scenerystack/scenery";
import { Panel, ComboBox, TextPushButton, Checkbox } from "scenerystack/sun";
import type { ComboBoxItem } from "scenerystack/sun";
import { Property } from "scenerystack/axon";
import { Bounds2 } from "scenerystack/dot";
import { ChladniModel } from "../model/ChladniModel.js";
import { Material, MaterialType, MATERIALS } from "../model/Material.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import { NumberControlFactory } from "../../screen-name/view/NumberControlFactory.js";

export class ChladniControlPanel extends Panel {
  /**
   * The combo box list parent node. Must be added to the scene graph above the panel
   * so the popup list renders on top.
   */
  public readonly comboBoxListParent: Node;

  /**
   * Property controlling the visibility of the resonance curve graph.
   */
  public readonly showResonanceCurveProperty: Property<boolean>;

  private readonly model: ChladniModel;

  public constructor(model: ChladniModel, layoutBounds: Bounds2) {
    const comboBoxListParent = new Node();

    // --- Material Selection ---
    const materialLabel = new Text(
      ResonanceStrings.chladni.materialStringProperty,
      {
        font: ResonanceConstants.LABEL_FONT,
        fill: ResonanceColors.textProperty,
      },
    );

    const materialComboBoxItems: ComboBoxItem<MaterialType>[] = MATERIALS.map(
      (material) => ({
        value: material,
        createNode: () => {
          const stringProperty =
            ChladniControlPanel.getMaterialStringProperty(material);
          return new Text(stringProperty, {
            font: ResonanceConstants.CONTROL_FONT,
          });
        },
      }),
    );

    const materialComboBox = new ComboBox(
      model.materialProperty,
      materialComboBoxItems,
      comboBoxListParent,
      {
        xMargin: ResonanceConstants.COMBO_BOX_X_MARGIN,
        yMargin: ResonanceConstants.COMBO_BOX_Y_MARGIN,
        cornerRadius: ResonanceConstants.COMBO_BOX_CORNER_RADIUS,
      },
    );

    const materialBox = new VBox({
      children: [materialLabel, materialComboBox],
      spacing: ResonanceConstants.COMBO_BOX_SPACING,
      align: "left",
    });

    // --- Frequency Slider ---
    // Simple slider covering the full frequency range
    const frequencyControl = NumberControlFactory.create({
      titleProperty: ResonanceStrings.chladni.frequencyStringProperty,
      numberProperty: model.frequencyProperty,
      range: model.frequencyRange,
      delta: 1,
      decimalPlaces: 0,
      valuePattern: ResonanceStrings.units.hertzPatternStringProperty,
      trackFill: ResonanceColors.frequencyTrackProperty,
      trackWidth: 150,
    });

    // --- Regenerate Button ---
    const regenerateButton = new TextPushButton(
      ResonanceStrings.chladni.regenerateStringProperty,
      {
        font: ResonanceConstants.CONTROL_FONT,
        listener: () => {
          model.regenerateParticles();
        },
        baseColor: ResonanceColors.subPanelFillProperty,
        textFill: ResonanceColors.textProperty,
      },
    );

    // --- Show Resonance Curve Checkbox ---
    const showResonanceCurveProperty = new Property<boolean>(true);
    const showResonanceCurveCheckbox = new Checkbox(
      showResonanceCurveProperty,
      new Text(ResonanceStrings.chladni.resonanceCurveStringProperty, {
        font: ResonanceConstants.CONTROL_FONT,
        fill: ResonanceColors.textProperty,
      }),
      {
        boxWidth: ResonanceConstants.RULER_CHECKBOX_BOX_WIDTH,
      },
    );

    // --- Assemble Panel Content ---
    const controlPanelContent = new VBox({
      children: [
        materialBox,
        new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, {
          stroke: ResonanceColors.textProperty,
          lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH,
        }),
        frequencyControl,
        new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, {
          stroke: ResonanceColors.textProperty,
          lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH,
        }),
        regenerateButton,
        showResonanceCurveCheckbox,
      ],
      spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
      align: "left",
    });

    super(controlPanelContent, {
      fill: ResonanceColors.controlPanelFillProperty,
      stroke: ResonanceColors.controlPanelStrokeProperty,
      lineWidth: ResonanceConstants.CONTROL_PANEL_LINE_WIDTH,
      cornerRadius: ResonanceConstants.CONTROL_PANEL_CORNER_RADIUS,
      xMargin: ResonanceConstants.CONTROL_PANEL_X_MARGIN,
      yMargin: ResonanceConstants.CONTROL_PANEL_Y_MARGIN,
      right: layoutBounds.maxX - ResonanceConstants.CONTROL_PANEL_RIGHT_MARGIN,
      top: layoutBounds.minY + ResonanceConstants.CONTROL_PANEL_TOP_MARGIN,
    });

    this.model = model;
    this.comboBoxListParent = comboBoxListParent;
    this.showResonanceCurveProperty = showResonanceCurveProperty;
  }

  /**
   * Get the string property for a material type.
   */
  private static getMaterialStringProperty(material: MaterialType) {
    switch (material) {
      case Material.COPPER:
        return ResonanceStrings.chladni.copperStringProperty;
      case Material.ALUMINUM:
        return ResonanceStrings.chladni.aluminumStringProperty;
      case Material.ZINC:
        return ResonanceStrings.chladni.zincStringProperty;
      case Material.STAINLESS_STEEL:
        return ResonanceStrings.chladni.stainlessSteelStringProperty;
      default:
        return ResonanceStrings.chladni.copperStringProperty;
    }
  }

  public reset(): void {
    this.showResonanceCurveProperty.reset();
  }
}
