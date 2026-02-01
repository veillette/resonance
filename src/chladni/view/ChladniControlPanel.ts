/**
 * ChladniControlPanel.ts
 *
 * Control panel for the Chladni plate visualization.
 * Contains controls for material selection and frequency slider.
 */

import { Node, Text, VBox, HBox, Line } from "scenerystack/scenery";
import {
  Panel,
  ComboBox,
  TextPushButton,
  Checkbox,
  AquaRadioButtonGroup,
} from "scenerystack/sun";
import type { ComboBoxItem } from "scenerystack/sun";
import { DerivedProperty, Property } from "scenerystack/axon";
import { Bounds2 } from "scenerystack/dot";
import {
  ChladniModel,
  GrainCountOption,
  GRAIN_COUNT_OPTIONS,
  BoundaryMode,
} from "../model/ChladniModel.js";
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

  /**
   * Property controlling the visibility of the ruler.
   */
  public readonly showRulerProperty: Property<boolean>;

  /**
   * Property controlling the visibility of the grid.
   */
  public readonly showGridProperty: Property<boolean>;

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
            ChladniControlPanel.getGrainCountStringProperty(option);
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

    // Update the actual count display when particle count changes
    model.actualParticleCountProperty.link((count) => {
      actualCountText.string = `(${count.toLocaleString()})`;
    });

    // --- Replenish Button ---
    // Enabled only when actual count differs from target count
    const replenishEnabledProperty = new DerivedProperty(
      [model.actualParticleCountProperty, model.grainCountProperty],
      (actualCount, grainOption) => actualCount !== grainOption.value,
    );

    const replenishButton = new TextPushButton(
      ResonanceStrings.chladni.replenishStringProperty,
      {
        font: ResonanceConstants.CONTROL_FONT,
        listener: () => {
          model.regenerateParticles();
        },
        baseColor: ResonanceColors.subPanelFillProperty,
        textFill: ResonanceColors.textProperty,
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

    // --- Sweep Button ---
    // Enabled only when not currently sweeping
    const sweepEnabledProperty = new DerivedProperty(
      [model.isSweepingProperty],
      (isSweeping) => !isSweeping,
    );

    const sweepButton = new TextPushButton(
      ResonanceStrings.chladni.sweepStringProperty,
      {
        font: ResonanceConstants.CONTROL_FONT,
        listener: () => {
          model.startSweep();
        },
        baseColor: ResonanceColors.subPanelFillProperty,
        textFill: ResonanceColors.textProperty,
        enabledProperty: sweepEnabledProperty,
      },
    );

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

    // --- Show Ruler Checkbox ---
    const showRulerProperty = new Property<boolean>(false);
    const showRulerCheckbox = new Checkbox(
      showRulerProperty,
      new Text(ResonanceStrings.chladni.rulerStringProperty, {
        font: ResonanceConstants.CONTROL_FONT,
        fill: ResonanceColors.textProperty,
      }),
      {
        boxWidth: ResonanceConstants.RULER_CHECKBOX_BOX_WIDTH,
      },
    );

    // --- Show Grid Checkbox ---
    const showGridProperty = new Property<boolean>(false);
    const showGridCheckbox = new Checkbox(
      showGridProperty,
      new Text(ResonanceStrings.chladni.gridStringProperty, {
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
        sweepButton,
        grainCountBox,
        boundaryModeBox,
        new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, {
          stroke: ResonanceColors.textProperty,
          lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH,
        }),
        showResonanceCurveCheckbox,
        showRulerCheckbox,
        showGridCheckbox,
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
    this.showRulerProperty = showRulerProperty;
    this.showGridProperty = showGridProperty;
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

  /**
   * Get the string property for a grain count option.
   */
  private static getGrainCountStringProperty(option: GrainCountOption) {
    switch (option.value) {
      case 1000:
        return ResonanceStrings.chladni.grains1000StringProperty;
      case 5000:
        return ResonanceStrings.chladni.grains5000StringProperty;
      case 10000:
        return ResonanceStrings.chladni.grains10000StringProperty;
      case 25000:
        return ResonanceStrings.chladni.grains25000StringProperty;
      default:
        return ResonanceStrings.chladni.grains10000StringProperty;
    }
  }

  public reset(): void {
    this.showResonanceCurveProperty.reset();
    this.showRulerProperty.reset();
    this.showGridProperty.reset();
  }
}
