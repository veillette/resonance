/**
 * DisplayOptionsSection.ts
 *
 * Control panel section for display options in the Chladni plate visualization.
 * Includes checkboxes for resonance curve, ruler, grid, and displacement colormap visibility.
 */

import { Text, VBox } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";
import { Property } from "scenerystack/axon";
import ResonanceColors from "../../../common/ResonanceColors.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../../i18n/ResonanceStrings.js";

export class DisplayOptionsSection extends VBox {
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

  /**
   * Property controlling the visibility of the displacement colormap.
   */
  public readonly showColormapProperty: Property<boolean>;

  public constructor() {
    // Create properties with default values
    const showResonanceCurveProperty = new Property<boolean>(true);
    const showRulerProperty = new Property<boolean>(false);
    const showGridProperty = new Property<boolean>(false);
    const showColormapProperty = new Property<boolean>(false);

    // --- Show Resonance Curve Checkbox ---
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

    // --- Show Displacement Colormap Checkbox ---
    const showColormapCheckbox = new Checkbox(
      showColormapProperty,
      new Text(ResonanceStrings.chladni.colormapStringProperty, {
        font: ResonanceConstants.CONTROL_FONT,
        fill: ResonanceColors.textProperty,
      }),
      {
        boxWidth: ResonanceConstants.RULER_CHECKBOX_BOX_WIDTH,
      },
    );

    super({
      children: [
        showResonanceCurveCheckbox,
        showRulerCheckbox,
        showGridCheckbox,
        showColormapCheckbox,
      ],
      spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
      align: "left",
    });

    // Store properties for external access
    this.showResonanceCurveProperty = showResonanceCurveProperty;
    this.showRulerProperty = showRulerProperty;
    this.showGridProperty = showGridProperty;
    this.showColormapProperty = showColormapProperty;
  }

  /**
   * Reset all display options to their default values.
   */
  public reset(): void {
    this.showResonanceCurveProperty.reset();
    this.showRulerProperty.reset();
    this.showGridProperty.reset();
    this.showColormapProperty.reset();
  }
}
