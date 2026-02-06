/**
 * Creates UI controls for the configurable graph including:
 * - Title panel with axis selection combo boxes
 * - Header bar
 */

import { Node, HBox, Text, Rectangle } from "scenerystack/scenery";
import { ComboBox } from "scenerystack/sun";
import { Property, DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { PlottableProperty } from "./PlottableProperty.js";
import ResonanceColors from "../../ResonanceColors.js";
import { PhetFont } from "scenerystack/scenery-phet";
import resonance from '../../ResonanceNamespace.js';

export default class GraphControlsPanel {
  private readonly availableProperties: PlottableProperty[];
  private readonly xPropertyProperty: Property<PlottableProperty>;
  private readonly yPropertyProperty: Property<PlottableProperty>;
  private readonly graphWidth: number;

  public constructor(
    availableProperties: PlottableProperty[],
    xPropertyProperty: Property<PlottableProperty>,
    yPropertyProperty: Property<PlottableProperty>,
    graphWidth: number
  ) {
    this.availableProperties = availableProperties;
    this.xPropertyProperty = xPropertyProperty;
    this.yPropertyProperty = yPropertyProperty;
    this.graphWidth = graphWidth;
  }

  /**
   * Helper to get the string value from either a string or TReadOnlyProperty<string>
   */
  private getNameValue(name: string | TReadOnlyProperty<string>): string {
    return typeof name === "string" ? name : name.value;
  }

  /**
   * Sanitize a name for use as a tandem name (keep only alphanumeric characters)
   */
  private sanitizeTandemName(name: string | TReadOnlyProperty<string>): string {
    const nameValue = this.getNameValue(name);
    // Keep only alphanumeric characters (remove spaces, punctuation, etc.)
    return nameValue.replace(/[^a-zA-Z0-9]/g, "");
  }

  /**
   * Create title panel with "(Y vs X)" format where Y and X are combo boxes
   */
  public createTitlePanel(listParent: Node): Node {
    const xItems = this.availableProperties.map((prop) => ({
      value: prop,
      createNode: () =>
        new Text(prop.name, {
          font: new PhetFont({size: 12}),
          fill: ResonanceColors.textColorProperty,
        }),
      tandemName: this.sanitizeTandemName(prop.name) + "Item",
    }));

    const xComboBox = new ComboBox(this.xPropertyProperty, xItems, listParent, {
      cornerRadius: 5,
      xMargin: 6,
      yMargin: 3,
      buttonFill: ResonanceColors.controlPanelBackgroundColorProperty,
      buttonStroke: ResonanceColors.controlPanelStrokeColorProperty,
      listFill: ResonanceColors.controlPanelBackgroundColorProperty,
      listStroke: ResonanceColors.controlPanelStrokeColorProperty,
      highlightFill: ResonanceColors.controlPanelStrokeColorProperty,
    });

    const yItems = this.availableProperties.map((prop) => ({
      value: prop,
      createNode: () =>
        new Text(prop.name, {
          font: new PhetFont({size: 12}),
          fill: ResonanceColors.textColorProperty,
        }),
      tandemName: this.sanitizeTandemName(prop.name) + "Item",
    }));

    const yComboBox = new ComboBox(this.yPropertyProperty, yItems, listParent, {
      cornerRadius: 5,
      xMargin: 6,
      yMargin: 3,
      buttonFill: ResonanceColors.controlPanelBackgroundColorProperty,
      buttonStroke: ResonanceColors.controlPanelStrokeColorProperty,
      listFill: ResonanceColors.controlPanelBackgroundColorProperty,
      listStroke: ResonanceColors.controlPanelStrokeColorProperty,
      highlightFill: ResonanceColors.controlPanelStrokeColorProperty,
    });

    // Create title in format "(Y vs X)"
    const leftParen = new Text("(", {
      font: new PhetFont({size: 14}),
      fill: ResonanceColors.textColorProperty,
    });

    const vsText = new Text(" vs ", {
      font: new PhetFont({size: 14})  ,
      fill: ResonanceColors.textColorProperty,
    });

    const rightParen = new Text(")", {
      font: new PhetFont({size: 14}),
      fill: ResonanceColors.textColorProperty,
    });

    // Arrange in horizontal layout: (Y vs X)
    return new HBox({
      spacing: 3,
      align: "center",
      children: [leftParen, yComboBox, vsText, xComboBox, rightParen],
    });
  }

  /**
   * Create the header bar (without checkbox - checkbox is now in ToolsControlPanel)
   */
  public createHeaderBar(): Rectangle {
    // Create header bar with dynamic fill that darkens the control panel background
    const headerHeight = 30;
    const headerFillProperty = new DerivedProperty(
      [ResonanceColors.controlPanelBackgroundColorProperty],
      (backgroundColor) => backgroundColor.colorUtilsDarker(0.1)
    );
    const headerBar = new Rectangle(0, -headerHeight, this.graphWidth, headerHeight, 5, 5, {
      fill: headerFillProperty,
      stroke: ResonanceColors.controlPanelStrokeColorProperty,
      lineWidth: 2,
      cursor: 'grab',
    });

    return headerBar;
  }

  /**
   * Update header bar width when graph is resized
   */
  public static updateHeaderBarWidth(headerBar: Rectangle, newWidth: number): void {
    headerBar.setRect(0, -30, newWidth, 30);
  }
}

// Register with namespace for debugging accessibility
resonance.register('GraphControlsPanel', GraphControlsPanel);
