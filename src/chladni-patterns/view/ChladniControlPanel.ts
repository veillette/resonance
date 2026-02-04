/**
 * ChladniControlPanel.ts
 *
 * Control panel for the Chladni plate visualization.
 * Uses modular section components for better organization.
 */

import { Node, VBox, Line } from "scenerystack/scenery";
import { Panel } from "scenerystack/sun";
import { Property, TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2 } from "scenerystack/dot";
import { ChladniModel } from "../model/ChladniModel.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import {
  MaterialSection,
  FrequencySection,
  GrainSection,
  DisplayOptionsSection,
  ModalSelectorSection,
} from "./controls/index.js";
import type { ModeSelection } from "./ModalShapeNode.js";

export interface ChladniControlPanelOptions {
  showModalControlsProperty: TReadOnlyProperty<boolean>;
}

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

  /**
   * Property controlling the visibility of the displacement colormap.
   */
  public readonly showColormapProperty: Property<boolean>;

  /**
   * Property controlling whether modal shape visualization is enabled.
   */
  public readonly showModalShapeProperty: Property<boolean>;

  /**
   * Property containing the currently selected mode (m, n).
   */
  public readonly selectedModeProperty: Property<ModeSelection>;

  private readonly displayOptionsSection: DisplayOptionsSection;
  private readonly modalSelectorSection: ModalSelectorSection;
  private readonly modalSeparator: Line;

  public constructor(
    model: ChladniModel,
    layoutBounds: Bounds2,
    options: ChladniControlPanelOptions,
  ) {
    const comboBoxListParent = new Node();

    // Create sections using modular components
    const materialSection = new MaterialSection(model, comboBoxListParent);
    const frequencySection = new FrequencySection(model);
    const grainSection = new GrainSection(model, comboBoxListParent);
    const displayOptionsSection = new DisplayOptionsSection();
    const modalSelectorSection = new ModalSelectorSection();

    // Create separators
    const createSeparator = () =>
      new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, {
        stroke: ResonanceColors.textProperty,
        lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH,
      });

    // Create separator for modal section (needs to be toggled with section)
    const modalSeparator = createSeparator();

    // Assemble panel content
    const controlPanelContent = new VBox({
      children: [
        materialSection,
        createSeparator(),
        frequencySection,
        grainSection,
        createSeparator(),
        displayOptionsSection,
        modalSeparator,
        modalSelectorSection,
      ],
      spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
      align: "left",
    });

    // Link modal section and separator visibility to preference
    options.showModalControlsProperty.linkAttribute(
      modalSelectorSection,
      "visible",
    );
    options.showModalControlsProperty.linkAttribute(modalSeparator, "visible");

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
    this.modalSelectorSection = modalSelectorSection;
    this.modalSeparator = modalSeparator;

    // Expose display option properties from the section
    this.showResonanceCurveProperty =
      displayOptionsSection.showResonanceCurveProperty;
    this.showRulerProperty = displayOptionsSection.showRulerProperty;
    this.showGridProperty = displayOptionsSection.showGridProperty;
    this.showColormapProperty = displayOptionsSection.showColormapProperty;

    // Expose modal selector properties
    this.showModalShapeProperty = modalSelectorSection.showModalShapeProperty;
    this.selectedModeProperty = modalSelectorSection.selectedModeProperty;
  }

  public reset(): void {
    this.displayOptionsSection.reset();
    this.modalSelectorSection.reset();
  }
}
