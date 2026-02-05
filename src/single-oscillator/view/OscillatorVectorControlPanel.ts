/**
 * OscillatorVectorControlPanel provides checkboxes for toggling the visibility
 * of velocity, acceleration, and applied force vectors on the oscillator mass.
 *
 * Each checkbox displays a label and a small colored arrow icon matching the
 * vector's color for easy visual identification.
 */

import { Text, HBox, VBox } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { Panel, Checkbox } from "scenerystack/sun";
import { BooleanProperty } from "scenerystack/axon";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";

// Arrow icon dimensions for the checkboxes
const ICON_ARROW_LENGTH = 20;
const ICON_ARROW_HEAD_WIDTH = 8;
const ICON_ARROW_HEAD_HEIGHT = 6;
const ICON_ARROW_TAIL_WIDTH = 3;

// Checkbox options
const CHECKBOX_BOX_WIDTH = 14;
const CHECKBOX_SPACING = 8;

export class OscillatorVectorControlPanel extends Panel {
  public readonly velocityVisibleProperty: BooleanProperty;
  public readonly accelerationVisibleProperty: BooleanProperty;
  public readonly appliedForceVisibleProperty: BooleanProperty;

  public constructor() {
    // Create visibility properties for each vector type (off by default)
    const velocityVisibleProperty = new BooleanProperty(false);
    const accelerationVisibleProperty = new BooleanProperty(false);
    const appliedForceVisibleProperty = new BooleanProperty(false);

    // Create velocity checkbox with green arrow icon
    const velocityArrowIcon = new ArrowNode(0, 0, ICON_ARROW_LENGTH, 0, {
      fill: ResonanceColors.velocityVectorProperty,
      stroke: null,
      headWidth: ICON_ARROW_HEAD_WIDTH,
      headHeight: ICON_ARROW_HEAD_HEIGHT,
      tailWidth: ICON_ARROW_TAIL_WIDTH,
    });

    const velocityLabel = new HBox({
      children: [
        new Text(ResonanceStrings.controls.velocityStringProperty, {
          font: ResonanceConstants.CONTROL_FONT,
          fill: ResonanceColors.textProperty,
        }),
        velocityArrowIcon,
      ],
      spacing: CHECKBOX_SPACING,
    });

    const velocityCheckbox = new Checkbox(
      velocityVisibleProperty,
      velocityLabel,
      {
        boxWidth: CHECKBOX_BOX_WIDTH,
        accessibleName:
          ResonanceStrings.controls.velocityStringProperty,
      },
    );

    // Create acceleration checkbox with yellow arrow icon
    const accelerationArrowIcon = new ArrowNode(0, 0, ICON_ARROW_LENGTH, 0, {
      fill: ResonanceColors.accelerationVectorProperty,
      stroke: null,
      headWidth: ICON_ARROW_HEAD_WIDTH,
      headHeight: ICON_ARROW_HEAD_HEIGHT,
      tailWidth: ICON_ARROW_TAIL_WIDTH,
    });

    const accelerationLabel = new HBox({
      children: [
        new Text(ResonanceStrings.controls.accelerationStringProperty, {
          font: ResonanceConstants.CONTROL_FONT,
          fill: ResonanceColors.textProperty,
        }),
        accelerationArrowIcon,
      ],
      spacing: CHECKBOX_SPACING,
    });

    const accelerationCheckbox = new Checkbox(
      accelerationVisibleProperty,
      accelerationLabel,
      {
        boxWidth: CHECKBOX_BOX_WIDTH,
        accessibleName:
          ResonanceStrings.controls.accelerationStringProperty,
      },
    );

    // Create applied force checkbox with orange arrow icon
    const appliedForceArrowIcon = new ArrowNode(0, 0, ICON_ARROW_LENGTH, 0, {
      fill: ResonanceColors.appliedForceVectorProperty,
      stroke: null,
      headWidth: ICON_ARROW_HEAD_WIDTH,
      headHeight: ICON_ARROW_HEAD_HEIGHT,
      tailWidth: ICON_ARROW_TAIL_WIDTH,
    });

    const appliedForceLabel = new HBox({
      children: [
        new Text(ResonanceStrings.controls.appliedForceStringProperty, {
          font: ResonanceConstants.CONTROL_FONT,
          fill: ResonanceColors.textProperty,
        }),
        appliedForceArrowIcon,
      ],
      spacing: CHECKBOX_SPACING,
    });

    const appliedForceCheckbox = new Checkbox(
      appliedForceVisibleProperty,
      appliedForceLabel,
      {
        boxWidth: CHECKBOX_BOX_WIDTH,
        accessibleName:
          ResonanceStrings.controls.appliedForceStringProperty,
      },
    );

    // Arrange checkboxes vertically
    const content = new VBox({
      children: [velocityCheckbox, accelerationCheckbox, appliedForceCheckbox],
      spacing: CHECKBOX_SPACING,
      align: "left",
    });

    super(content, {
      fill: ResonanceColors.panelFillProperty,
      stroke: ResonanceColors.panelStrokeProperty,
      lineWidth: ResonanceConstants.CONTROL_PANEL_LINE_WIDTH,
      cornerRadius: ResonanceConstants.CONTROL_PANEL_CORNER_RADIUS,
      xMargin: ResonanceConstants.CONTROL_PANEL_X_MARGIN,
      yMargin: ResonanceConstants.CONTROL_PANEL_Y_MARGIN,
    });

    // Store properties for external access
    this.velocityVisibleProperty = velocityVisibleProperty;
    this.accelerationVisibleProperty = accelerationVisibleProperty;
    this.appliedForceVisibleProperty = appliedForceVisibleProperty;
  }

  public reset(): void {
    this.velocityVisibleProperty.reset();
    this.accelerationVisibleProperty.reset();
    this.appliedForceVisibleProperty.reset();
  }
}
