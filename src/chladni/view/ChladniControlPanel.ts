/**
 * ChladniControlPanel.ts
 *
 * Control panel for the Chladni plate visualization.
 * Uses modular section components for better organization.
 */

import { Node, VBox, Line } from "scenerystack/scenery";
import { Panel } from "scenerystack/sun";
import { Property } from "scenerystack/axon";
import { Bounds2 } from "scenerystack/dot";
import { ChladniModel } from "../model/ChladniModel.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import {
  MaterialSection,
  FrequencySection,
  GrainSection,
  DisplayOptionsSection,
} from "./controls/index.js";

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

  private readonly displayOptionsSection: DisplayOptionsSection;

  public constructor(model: ChladniModel, layoutBounds: Bounds2) {
    const comboBoxListParent = new Node();

    // Create sections using modular components
    const materialSection = new MaterialSection(model, comboBoxListParent);
    const frequencySection = new FrequencySection(model);
    const grainSection = new GrainSection(model, comboBoxListParent);
    const displayOptionsSection = new DisplayOptionsSection();

    // Create separators
    const createSeparator = () =>
      new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, {
        stroke: ResonanceColors.textProperty,
        lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH,
      });

    // Assemble panel content
    const controlPanelContent = new VBox({
      children: [
        materialSection,
        createSeparator(),
        frequencySection,
        grainSection,
        createSeparator(),
        displayOptionsSection,
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

    // Store references
    this.comboBoxListParent = comboBoxListParent;
    this.displayOptionsSection = displayOptionsSection;

    // Expose display option properties from the section
    this.showResonanceCurveProperty =
      displayOptionsSection.showResonanceCurveProperty;
    this.showRulerProperty = displayOptionsSection.showRulerProperty;
    this.showGridProperty = displayOptionsSection.showGridProperty;
  }

  public reset(): void {
    this.displayOptionsSection.reset();
  }
}
