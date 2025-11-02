import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { SimModel } from "../model/SimModel.js";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { Rectangle, Text, Path } from "scenerystack/scenery";
import { ResonanceStrings } from "../../strings/ResonanceStrings.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import { RectangularPushButton } from "scenerystack/sun";
import { Shape } from "scenerystack/kite";
import { ResonancePreferencesModel } from "../../preferences/ResonancePreferencesModel.js";
import { PreferencesDialog } from "../../preferences/PreferencesDialog.js";

export class SimScreenView extends ScreenView {

  private readonly rotatingRectangle: Rectangle;
  private preferencesDialog: PreferencesDialog | null = null;

  public constructor(
    model: SimModel,
    preferencesModel: ResonancePreferencesModel,
    options?: ScreenViewOptions
  ) {
    super(options);

    // Get localized strings
    const strings = ResonanceStrings.resonance.content;

    // Sample Content - using color profiles

    this.rotatingRectangle = new Rectangle(-150, -20, 300, 40, {
      fill: ResonanceColors.rotatingRectangle,
      translation: this.layoutBounds.center
    });
    this.addChild( this.rotatingRectangle );

    // Using internationalized string instead of hardcoded English
    this.addChild( new Text(strings.sampleText, {
      font: "24px sans-serif",
      fill: ResonanceColors.text,
      center: this.layoutBounds.center
    }) );

    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - 10,
      bottom: this.layoutBounds.maxY - 10,
    });
    this.addChild(resetAllButton);

    // Add preferences button (gear icon)
    const gearIcon = new Path(
      new Shape()
        .moveTo(0, -8)
        .lineTo(2, -6)
        .lineTo(4, -8)
        .lineTo(6, -6)
        .lineTo(8, -4)
        .lineTo(6, -2)
        .lineTo(8, 0)
        .lineTo(6, 2)
        .lineTo(8, 4)
        .lineTo(6, 6)
        .lineTo(4, 8)
        .lineTo(2, 6)
        .lineTo(0, 8)
        .lineTo(-2, 6)
        .lineTo(-4, 8)
        .lineTo(-6, 6)
        .lineTo(-8, 4)
        .lineTo(-6, 2)
        .lineTo(-8, 0)
        .lineTo(-6, -2)
        .lineTo(-8, -4)
        .lineTo(-6, -6)
        .lineTo(-4, -8)
        .lineTo(-2, -6)
        .close()
        .circle(0, 0, 4),
      {
        fill: ResonanceColors.text,
        scale: 1.2,
      }
    );

    const preferencesButton = new RectangularPushButton({
      content: gearIcon,
      baseColor: ResonanceColors.panelFill,
      listener: () => {
        if (!this.preferencesDialog) {
          this.preferencesDialog = new PreferencesDialog(
            preferencesModel,
            () => {
              if (this.preferencesDialog) {
                this.preferencesDialog.visible = false;
                this.removeChild(this.preferencesDialog);
                this.preferencesDialog = null;
              }
            }
          );
          this.preferencesDialog.center = this.layoutBounds.center;
          this.addChild(this.preferencesDialog);
        }
        this.preferencesDialog.visible = true;
      },
      xMargin: 8,
      yMargin: 8,
      left: this.layoutBounds.minX + 10,
      bottom: this.layoutBounds.maxY - 10,
    });
    this.addChild(preferencesButton);
  }

  public reset(): void {
    // Called when the user presses the reset-all button
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public step(dt: number): void {
    // Called every frame, with the time since the last frame in seconds

    this.rotatingRectangle.rotation += 2 * dt;
  }
}
