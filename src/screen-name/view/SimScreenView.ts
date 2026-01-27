import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { SimModel } from "../model/SimModel.js";
import { ResetAllButton, PlayPauseStepButtonGroup, NumberControl, RulerNode } from "scenerystack/scenery-phet";
import { Rectangle, Text, Path, Node, Circle, Line, VBox, HBox, Image } from "scenerystack/scenery";
import ResonanceColors from "../../common/ResonanceColors.js";
import { RectangularPushButton, Panel, AquaRadioButtonGroup, Checkbox, ToggleSwitch } from "scenerystack/sun";
import { Shape } from "scenerystack/kite";
import { ResonancePreferencesModel } from "../../preferences/ResonancePreferencesModel.js";
import { PreferencesDialog } from "../../preferences/PreferencesDialog.js";
import { Range } from "scenerystack/dot";
import { Property, NumberProperty } from "scenerystack/axon";
import { preferencesIcon_png } from "scenerystack/joist";

export class SimScreenView extends ScreenView {

  private readonly model: SimModel;
  private preferencesDialog: PreferencesDialog | null = null;
  private readonly resonatorsContainer: Node;
  private springNodes: Path[] = [];
  private massNodes: Node[] = [];
  private readonly rulerNode: RulerNode;
  private readonly rulerVisibleProperty: Property<boolean>;
  private readonly selectedResonatorProperty: NumberProperty;
  private readonly gravityEnabledProperty: Property<boolean>;
  private readonly driverNode: Node;

  public constructor(
    model: SimModel,
    preferencesModel: ResonancePreferencesModel,
    options?: ScreenViewOptions
  ) {
    super(options);

    this.model = model;

    // Initialize properties
    this.rulerVisibleProperty = new Property<boolean>(false);
    this.selectedResonatorProperty = new NumberProperty(1);
    this.gravityEnabledProperty = new Property<boolean>(model.resonanceModel.gravityProperty.value > 0);

    // Create simulation area container
    const simulationArea = new Node();

    // ===== DRIVER (Grey box at bottom) =====
    this.driverNode = new Node();
    const driverBox = new Rectangle(0, 0, 200, 120, 10, 10, {
      fill: ResonanceColors.driverFillProperty,
      stroke: ResonanceColors.driverStrokeProperty,
      lineWidth: 2
    });
    this.driverNode.addChild(driverBox);

    // Driver Power Toggle
    const powerToggleLabel = new Text('ON', { font: 'bold 14px sans-serif', fill: ResonanceColors.driverTextProperty });
    const powerToggleSwitch = new ToggleSwitch(model.resonanceModel.drivingEnabledProperty, false, true, {
      trackFillLeft: '#666666',
      trackFillRight: '#00CC00',
      thumbFill: 'white'
    });
    const powerToggleBox = new HBox({
      children: [powerToggleLabel, powerToggleSwitch],
      spacing: 8,
      left: 15,
      top: 15
    });
    this.driverNode.addChild(powerToggleBox);

    // Driver Frequency Control using NumberControl
    const frequencyControl = new NumberControl('Frequency', model.resonanceModel.drivingFrequencyProperty, new Range(0.1, 5), {
      numberDisplayOptions: {
        valuePattern: '{{value}} Hz',
        decimalPlaces: 2
      },
      sliderOptions: {
        trackFillEnabled: ResonanceColors.frequencyTrackProperty
      }
    });
    frequencyControl.setScaleMagnitude(0.7);
    frequencyControl.centerX = driverBox.centerX;
    frequencyControl.top = 40;
    this.driverNode.addChild(frequencyControl);

    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - 20,
      bottom: this.layoutBounds.maxY - 20
    });
    this.addChild(resetAllButton);

    // Driver Amplitude Control using NumberControl
    const amplitudeControl = new NumberControl('Amplitude', model.resonanceModel.drivingAmplitudeProperty, new Range(0, 10), {
      numberDisplayOptions: {
        valuePattern: '{{value}} N',
        decimalPlaces: 1
      },
      sliderOptions: {
        trackFillEnabled: ResonanceColors.amplitudeTrackProperty
      }
    });
    amplitudeControl.setScaleMagnitude(0.7);
    amplitudeControl.left = 10;
    amplitudeControl.bottom = driverBox.bottom - 10;
    this.driverNode.addChild(amplitudeControl);

    // Position driver at bottom center-left
    this.driverNode.centerX = this.layoutBounds.centerX - 100;
    this.driverNode.bottom = this.layoutBounds.bottom - 150;
    simulationArea.addChild(this.driverNode);

    // ===== RESONATORS (springs + masses, displayed side by side) =====
    this.resonatorsContainer = new Node();
    simulationArea.addChild(this.resonatorsContainer);
    this.rebuildResonators(1);

    // Rebuild resonators when count changes
    this.selectedResonatorProperty.link((count: number) => {
      this.rebuildResonators(count);
      this.updateSpringAndMass(this.driverNode);
    });

    // ===== RULER (optional, toggled on/off) =====
    // Using standard RulerNode from scenerystack
    const rulerLabels = ['0', '10', '20', '30'];
    this.rulerNode = new RulerNode(300, 40, 100, rulerLabels, 'cm', {
      minorTicksPerMajorTick: 4,
      insetsWidth: 10
    });
    this.rulerNode.left = this.layoutBounds.left + 20;
    this.rulerNode.top = this.layoutBounds.top + 50;
    this.rulerNode.visible = false;
    simulationArea.addChild(this.rulerNode);

    this.addChild(simulationArea);

    // ===== CONTROL PANEL (Right side, green panel) =====

    // Number of Resonators control using NumberControl
    const resonatorCountControl = new NumberControl('Resonators', this.selectedResonatorProperty, new Range(1, 10), {
      delta: 1,
      numberDisplayOptions: {
        decimalPlaces: 0
      },
      sliderOptions: {
        majorTicks: [
          { value: 1, label: new Text('1', { font: '12px sans-serif' }) },
          { value: 10, label: new Text('10', { font: '12px sans-serif' }) }
        ],
        minorTickSpacing: 1
      }
    });

    // Resonator 1 Parameters Box
    const resonatorLabel = new Text('Resonator 1', {
      font: 'bold 16px sans-serif',
      fill: ResonanceColors.textProperty
    });

    // Mass control using NumberControl
    const massControl = new NumberControl('Mass', model.resonanceModel.massProperty, new Range(0.1, 10), {
      numberDisplayOptions: {
        valuePattern: '{{value}} kg',
        decimalPlaces: 4
      }
    });

    // Spring Constant control using NumberControl
    const springConstantControl = new NumberControl('Spring Constant', model.resonanceModel.springConstantProperty, new Range(1, 200), {
      numberDisplayOptions: {
        valuePattern: '{{value}} N/m',
        decimalPlaces: 0
      }
    });

    // Natural Frequency Readout (derived, non-editable)
    const naturalFrequencyText = new Text('', {
      font: '14px sans-serif',
      fill: ResonanceColors.textProperty
    });

    model.resonanceModel.naturalFrequencyHzProperty.link((freq: number) => {
      naturalFrequencyText.string = `frequency = ${freq.toFixed(3)} Hz`;
    });

    // Damping Constant control using NumberControl
    const dampingControl = new NumberControl('Damping', model.resonanceModel.dampingProperty, new Range(0, 10), {
      numberDisplayOptions: {
        valuePattern: '{{value}} N/(m/s)',
        decimalPlaces: 1
      }
    });

    // Gravity Toggle using ToggleSwitch
    const gravityToggleSwitch = new ToggleSwitch(this.gravityEnabledProperty, false, true, {
      trackFillLeft: '#999999',
      trackFillRight: '#4499FF'
    });

    // Listen to gravity toggle changes and update model
    this.gravityEnabledProperty.link((enabled: boolean) => {
      model.resonanceModel.gravityProperty.value = enabled ? 9.8 : 0;
    });

    const gravityLabel = new Text('Gravity', { font: 'bold 14px sans-serif', fill: ResonanceColors.textProperty });
    const gravityBox = new HBox({
      children: [gravityLabel, gravityToggleSwitch],
      spacing: 10,
      align: 'center'
    });

    // Ruler Toggle
    const rulerCheckbox = new Checkbox(this.rulerVisibleProperty, new Text('Ruler', {
      font: '14px sans-serif',
      fill: ResonanceColors.textProperty
    }), {
      boxWidth: 18
    });

    // Update ruler visibility
    this.rulerVisibleProperty.link((visible: boolean) => {
      this.rulerNode.visible = visible;
    });

    // Assemble control panel contents
    const controlPanelContent = new VBox({
      children: [
        resonatorCountControl,
        new Line(0, 0, 250, 0, { stroke: ResonanceColors.textProperty, lineWidth: 1 }),
        resonatorLabel,
        massControl,
        springConstantControl,
        naturalFrequencyText,
        dampingControl,
        new Line(0, 0, 250, 0, { stroke: ResonanceColors.textProperty, lineWidth: 1 }),
        gravityBox,
        rulerCheckbox
      ],
      spacing: 15,
      align: 'left'
    });

    const controlPanel = new Panel(controlPanelContent, {
      fill: ResonanceColors.controlPanelFillProperty,
      stroke: ResonanceColors.controlPanelStrokeProperty,
      lineWidth: 2,
      cornerRadius: 10,
      xMargin: 15,
      yMargin: 15,
      right: this.layoutBounds.maxX - 20,
      top: this.layoutBounds.minY + 20
    });

    this.addChild(controlPanel);

    // ===== SIMULATION CONTROLS (Below driver) =====

    // Simulation Speed Control
    const speedButtons = [
      { value: 'slow', createNode: () => new Text('slow', { font: '14px sans-serif' }) },
      { value: 'normal', createNode: () => new Text('normal', { font: '14px sans-serif' }) }
    ];

    const speedControl = new AquaRadioButtonGroup(
      model.resonanceModel.timeSpeedProperty,
      speedButtons,
      {
        orientation: 'horizontal',
        spacing: 5,
        radioButtonOptions: {
          radius: 8
        }
      }
    );

    // Playback Controls using SceneryStack components
    const playPauseStepButtonGroup = new PlayPauseStepButtonGroup(model.resonanceModel.isPlayingProperty, {
      playPauseButtonOptions: {
        scale: 0.8
      },
      includeStepForwardButton: true,
      includeStepBackwardButton: true,
      stepForwardButtonOptions: {
        listener: () => {
          // Step forward by one frame (0.016 seconds at 60 FPS)
          // forceStep=true ensures it steps even when paused
          model.resonanceModel.step(0.016, true);
        }
      },
      stepBackwardButtonOptions: {
        listener: () => {
          // Step backward by reversing the time step
          // Note: This is a simplified backward step - for accurate backward integration,
          // you'd need a reversible solver, but for small steps this approximation works
          model.resonanceModel.step(-0.016, true);
        }
      }
    });

    const playbackControls = new HBox({
      children: [speedControl, playPauseStepButtonGroup],
      spacing: 10,
      align: 'center',
      centerX: this.layoutBounds.centerX - 100,
      bottom: this.layoutBounds.bottom - 20
    });

    this.addChild(playbackControls);

    // Add preferences button using standard icon from joist
    const preferencesIcon = new Image(preferencesIcon_png, {
      scale: 0.8
    });

    const preferencesButton = new RectangularPushButton({
      content: preferencesIcon,
      baseColor: ResonanceColors.panelFillProperty,
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

    // Update spring and mass positions
    this.updateSpringAndMass(this.driverNode);
  }

  /**
   * Rebuild the visual resonator nodes (springs + masses) for a given count.
   */
  private rebuildResonators(count: number): void {
    this.resonatorsContainer.removeAllChildren();
    this.springNodes = [];
    this.massNodes = [];

    // Scale mass radius based on count so they fit on the platform
    const massRadius = Math.max(10, 25 - count);

    for (let i = 0; i < count; i++) {
      const springNode = new Path(null, {
        stroke: ResonanceColors.springProperty,
        lineWidth: 3
      });
      this.resonatorsContainer.addChild(springNode);
      this.springNodes.push(springNode);

      const massNode = new Node();
      const massCircle = new Circle(massRadius, {
        fill: ResonanceColors.massProperty,
        stroke: ResonanceColors.massStrokeProperty,
        lineWidth: 3
      });
      const massLabel = new Text(`${i + 1}`, {
        font: `bold ${Math.max(10, 24 - count)}px sans-serif`,
        fill: ResonanceColors.massLabelProperty,
        center: massCircle.center
      });
      massNode.addChild(massCircle);
      massNode.addChild(massLabel);
      this.resonatorsContainer.addChild(massNode);
      this.massNodes.push(massNode);
    }
  }

  private updateSpringAndMass(driverNode: Node): void {
    const model = this.model.resonanceModel;
    const count = this.springNodes.length;
    if (count === 0) {
      return;
    }

    // Driver top position
    const driverTopY = driverNode.top;
    const driverCenterX = driverNode.centerX;

    // Spacing: distribute resonators evenly across the driver width
    const driverWidth = 200;
    const spacing = driverWidth / (count + 1);

    // Calculate mass position based on model position property
    const metersToPixels = 100;
    const equilibriumY = driverTopY - 150;
    const massY = equilibriumY + model.positionProperty.value * metersToPixels;

    const massRadius = Math.max(10, 25 - count);
    const coilWidth = Math.max(8, 20 - count);

    for (let i = 0; i < count; i++) {
      const xCenter = driverCenterX - driverWidth / 2 + spacing * (i + 1);

      // Update mass position
      this.massNodes[i].centerX = xCenter;
      this.massNodes[i].centerY = massY;

      // Update spring path
      const springStartY = driverTopY;
      const springEndY = massY - massRadius;
      const springHeight = springEndY - springStartY;
      const numCoils = Math.max(8, Math.abs(springHeight / 15));

      const springShape = new Shape();
      springShape.moveTo(xCenter, springStartY);

      for (let j = 0; j <= numCoils; j++) {
        const t = j / numCoils;
        const y = springStartY + t * springHeight;
        const x = xCenter + Math.sin(j * Math.PI) * coilWidth;
        springShape.lineTo(x, y);
      }

      this.springNodes[i].shape = springShape;
    }
  }

  public reset(): void {
    // Called when the user presses the reset-all button
  }

  public step(): void {
    // Called every frame, update spring and mass positions
    this.updateSpringAndMass(this.driverNode);
  }
}
