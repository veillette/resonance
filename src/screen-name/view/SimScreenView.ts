import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { SimModel } from "../model/SimModel.js";
import { ResetAllButton, PlayPauseStepButtonGroup, NumberControl } from "scenerystack/scenery-phet";
import { Rectangle, Text, Path, Node, Circle, Line, VBox, HBox } from "scenerystack/scenery";
import ResonanceColors from "../../common/ResonanceColors.js";
import { RectangularPushButton, Panel, AquaRadioButtonGroup, Checkbox } from "scenerystack/sun";
import { Shape } from "scenerystack/kite";
import { ResonancePreferencesModel } from "../../preferences/ResonancePreferencesModel.js";
import { PreferencesDialog } from "../../preferences/PreferencesDialog.js";
import { Range } from "scenerystack/dot";
import { Property, NumberProperty } from "scenerystack/axon";

export class SimScreenView extends ScreenView {

  private readonly model: SimModel;
  private preferencesDialog: PreferencesDialog | null = null;
  private readonly springNode: Path;
  private readonly massNode: Node;
  private readonly rulerNode: Node;
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
      fill: '#888888',
      stroke: '#444444',
      lineWidth: 2
    });
    this.driverNode.addChild(driverBox);

    // Driver Power Toggle (Green ON button)
    const powerToggleButton = new RectangularPushButton({
      content: new Text('ON', { font: 'bold 14px sans-serif', fill: 'white' }),
      baseColor: model.resonanceModel.drivingEnabledProperty.value ? '#00CC00' : '#666666',
      listener: () => {
        model.resonanceModel.drivingEnabledProperty.value = !model.resonanceModel.drivingEnabledProperty.value;
        powerToggleButton.baseColor = model.resonanceModel.drivingEnabledProperty.value ? '#00CC00' : '#666666';
      },
      xMargin: 10,
      yMargin: 6
    });
    powerToggleButton.left = 15;
    powerToggleButton.top = 15;
    this.driverNode.addChild(powerToggleButton);

    // Driver Frequency Control (dial with readout)
    const frequencyReadout = new Text('1.00 Hz', { font: '16px sans-serif', fill: 'white' });
    const frequencyKnob = new Circle(25, {
      fill: '#00CC00',
      stroke: '#008800',
      lineWidth: 2,
      cursor: 'pointer'
    });
    const frequencyIndicator = new Line(0, 0, 0, -20, { stroke: 'white', lineWidth: 3 });
    frequencyKnob.addChild(frequencyIndicator);

    frequencyKnob.centerX = driverBox.centerX;
    frequencyKnob.centerY = 45;
    frequencyReadout.centerX = frequencyKnob.centerX;
    frequencyReadout.top = frequencyKnob.bottom + 5;

    this.driverNode.addChild(frequencyKnob);
    this.driverNode.addChild(frequencyReadout);

    // Update frequency readout
    model.resonanceModel.drivingFrequencyProperty.link((freq: number) => {
      frequencyReadout.string = `${freq.toFixed(2)} Hz`;
      frequencyReadout.centerX = frequencyKnob.centerX;
    });

    const resetAllButton = new ResetAllButton({listener: () => {
      model.reset();
      this.reset();
      }});
    this.addChild(resetAllButton);
    resetAllButton.right = this.layoutBounds.maxX - 20;
    resetAllButton.top = this.layoutBounds.minY + 20; 
    
    // Driver Amplitude Control (blue slider with readout)
    const amplitudeReadout = new Text('0.50 cm', { font: '12px sans-serif', fill: 'white' });
    const amplitudeSliderTrack = new Rectangle(0, 0, 120, 8, 4, 4, {
      fill: '#003366',
      stroke: '#0055AA',
      lineWidth: 1
    });
    const amplitudeSliderThumb = new Circle(8, {
      fill: '#3399FF',
      stroke: '#0066CC',
      lineWidth: 2,
      cursor: 'pointer'
    });

    amplitudeSliderTrack.left = driverBox.right - 135;
    amplitudeSliderTrack.bottom = driverBox.bottom - 15;
    amplitudeSliderThumb.centerY = amplitudeSliderTrack.centerY;

    // Set initial thumb position based on amplitude (0-10N range mapped to slider width)
    const updateAmplitudeThumb = () => {
      const normalizedValue = model.resonanceModel.drivingAmplitudeProperty.value / 10;
      amplitudeSliderThumb.centerX = amplitudeSliderTrack.left + normalizedValue * amplitudeSliderTrack.width;
      amplitudeReadout.string = `${(model.resonanceModel.drivingAmplitudeProperty.value / 10).toFixed(2)} cm`;
      amplitudeReadout.centerX = amplitudeSliderTrack.centerX;
    };
    updateAmplitudeThumb();

    amplitudeReadout.centerX = amplitudeSliderTrack.centerX;
    amplitudeReadout.bottom = amplitudeSliderTrack.top - 5;

    this.driverNode.addChild(amplitudeSliderTrack);
    this.driverNode.addChild(amplitudeSliderThumb);
    this.driverNode.addChild(amplitudeReadout);

    model.resonanceModel.drivingAmplitudeProperty.link(updateAmplitudeThumb);

    // Position driver at bottom center-left
    this.driverNode.centerX = this.layoutBounds.centerX - 100;
    this.driverNode.bottom = this.layoutBounds.bottom - 150;
    simulationArea.addChild(this.driverNode);

    // ===== SPRING (Red helical element) =====
    this.springNode = new Path(null, {
      stroke: '#CC0000',
      lineWidth: 3
    });
    simulationArea.addChild(this.springNode);

    // ===== MASS/RESONATOR (Blue circle labeled "1") =====
    this.massNode = new Node();
    const massCircle = new Circle(25, {
      fill: '#3366FF',
      stroke: '#0033AA',
      lineWidth: 3
    });
    const massNumberLabel = new Text('1', {
      font: 'bold 24px sans-serif',
      fill: 'white',
      center: massCircle.center
    });
    this.massNode.addChild(massCircle);
    this.massNode.addChild(massNumberLabel);
    simulationArea.addChild(this.massNode);

    // ===== RULER (optional, toggled on/off) =====
    this.rulerNode = new Node();
    const rulerRect = new Rectangle(0, 0, 30, 300, {
      fill: '#FFFFCC',
      stroke: '#666666',
      lineWidth: 2
    });
    this.rulerNode.addChild(rulerRect);

    // Add tick marks
    for (let i = 0; i <= 30; i++) {
      const tickLength = i % 5 === 0 ? 10 : 5;
      const tick = new Line(0, i * 10, tickLength, i * 10, { stroke: '#333333', lineWidth: 1 });
      this.rulerNode.addChild(tick);

      if (i % 10 === 0) {
        const label = new Text(`${i}`, { font: '10px sans-serif', fill: '#333333' });
        label.left = tickLength + 2;
        label.centerY = i * 10;
        this.rulerNode.addChild(label);
      }
    }

    this.rulerNode.left = this.layoutBounds.left + 20;
    this.rulerNode.top = this.layoutBounds.top + 50;
    this.rulerNode.visible = false;
    simulationArea.addChild(this.rulerNode);

    this.addChild(simulationArea);

    // ===== CONTROL PANEL (Right side, green panel) =====

    // Number of Resonators selector (currently just showing '1')
    const resonatorSelectorButtons = [
      { value: 1, createNode: () => new Text('1', { font: 'bold 18px sans-serif' }) }
    ];

    const resonatorSelector = new AquaRadioButtonGroup(
      this.selectedResonatorProperty,
      resonatorSelectorButtons,
      {
        orientation: 'horizontal',
        spacing: 10,
        radioButtonOptions: {
          radius: 12
        }
      }
    );

    const resonatorSelectorLabel = new Text('Number of Resonators', {
      font: 'bold 14px sans-serif',
      fill: ResonanceColors.text
    });

    // Resonator 1 Parameters Box
    const resonatorLabel = new Text('Resonator 1', {
      font: 'bold 16px sans-serif',
      fill: ResonanceColors.text
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
      fill: ResonanceColors.text
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

    // Gravity Toggle
    const gravityToggleButtons = [
      { value: true, createNode: () => new Text('ON', { font: '14px sans-serif' }) },
      { value: false, createNode: () => new Text('OFF', { font: '14px sans-serif' }) }
    ];

    const gravityToggle = new AquaRadioButtonGroup(
      this.gravityEnabledProperty,
      gravityToggleButtons,
      {
        orientation: 'horizontal',
        spacing: 5,
        radioButtonOptions: {
          radius: 8
        }
      }
    );

    // Listen to gravity toggle changes and update model
    this.gravityEnabledProperty.link((enabled: boolean) => {
      model.resonanceModel.gravityProperty.value = enabled ? 9.8 : 0;
    });

    const gravityLabel = new Text('Gravity', { font: 'bold 14px sans-serif', fill: ResonanceColors.text });
    const gravityBox = new HBox({
      children: [gravityLabel, gravityToggle],
      spacing: 10,
      align: 'center'
    });

    // Ruler Toggle
    const rulerCheckbox = new Checkbox(this.rulerVisibleProperty, new Text('Ruler', {
      font: '14px sans-serif',
      fill: ResonanceColors.text
    }), {
      boxWidth: 18
    });

    // Update ruler visibility
    this.rulerVisibleProperty.link((visible: boolean) => {
      this.rulerNode.visible = visible;
    });

    // Reset All Button
    const controlPanelResetButton = new RectangularPushButton({
      content: new Text('Reset All', { font: 'bold 16px sans-serif', fill: 'white' }),
      baseColor: '#CC0000',
      listener: () => {
        model.reset();
        this.reset();
      },
      xMargin: 20,
      yMargin: 10
    });

    // Assemble control panel contents
    const controlPanelContent = new VBox({
      children: [
        resonatorSelectorLabel,
        resonatorSelector,
        new Line(0, 0, 250, 0, { stroke: ResonanceColors.text, lineWidth: 1 }),
        resonatorLabel,
        massControl,
        springConstantControl,
        naturalFrequencyText,
        dampingControl,
        new Line(0, 0, 250, 0, { stroke: ResonanceColors.text, lineWidth: 1 }),
        gravityBox,
        rulerCheckbox,
        controlPanelResetButton
      ],
      spacing: 15,
      align: 'left'
    });

    const controlPanel = new Panel(controlPanelContent, {
      fill: '#CCFFCC',
      stroke: '#006600',
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

    // ===== PhET BRANDING =====
    const phetBranding = new Text('PhET', {
      font: 'bold 20px sans-serif',
      fill: ResonanceColors.text,
      right: this.layoutBounds.maxX - 20,
      bottom: this.layoutBounds.maxY - 20
    });
    this.addChild(phetBranding);

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

    // Update spring and mass positions
    this.updateSpringAndMass(this.driverNode);
  }

  private updateSpringAndMass(driverNode: Node): void {
    const model = this.model.resonanceModel;

    // Driver top position
    const driverTopY = driverNode.top;
    const driverCenterX = driverNode.centerX;

    // Calculate mass position based on model position property
    // Position is in meters, we'll scale it to pixels
    const metersToPixels = 100; // 100 pixels per meter
    const equilibriumY = driverTopY - 150; // Equilibrium position 150px above driver
    const massY = equilibriumY + model.positionProperty.value * metersToPixels;

    // Update mass position
    this.massNode.centerX = driverCenterX;
    this.massNode.centerY = massY;

    // Update spring path - create a helical spring shape
    const springStartY = driverTopY;
    const springEndY = massY - 25; // End at top of mass (25px radius)
    const springHeight = springEndY - springStartY;
    const numCoils = Math.max(8, Math.abs(springHeight / 15)); // Adjust coil density
    const coilWidth = 20;

    const springShape = new Shape();
    springShape.moveTo(driverCenterX, springStartY);

    for (let i = 0; i <= numCoils; i++) {
      const t = i / numCoils;
      const y = springStartY + t * springHeight;
      const x = driverCenterX + Math.sin(i * Math.PI) * coilWidth;
      springShape.lineTo(x, y);
    }

    this.springNode.shape = springShape;
  }

  public reset(): void {
    // Called when the user presses the reset-all button
  }

  public step(): void {
    // Called every frame, update spring and mass positions
    this.updateSpringAndMass(this.driverNode);
  }
}
