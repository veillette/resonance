import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { SimModel } from "../model/SimModel.js";
import { ResetAllButton, PlayPauseStepButtonGroup, NumberControl, RulerNode, ParametricSpringNode } from "scenerystack/scenery-phet";
import { Rectangle, Text, Node, Circle, Line, VBox, HBox } from "scenerystack/scenery";
import { DragListener } from "scenerystack/scenery";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Bounds2, Vector2, Range } from "scenerystack/dot";
import { Vector2Property } from "scenerystack/dot";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { Panel, AquaRadioButtonGroup, Checkbox, ToggleSwitch, ComboBox, NumberSpinner } from "scenerystack/sun";
import type { ComboBoxItem } from "scenerystack/sun";
import { Property, NumberProperty, DerivedProperty } from "scenerystack/axon";
import { OscillatorConfigMode } from "../../common/model/OscillatorConfigMode.js";
import type { OscillatorConfigModeType } from "../../common/model/OscillatorConfigMode.js";
import { ResonanceStrings } from "../../strings/ResonanceStrings.js";

export class SimScreenView extends ScreenView {

  private readonly model: SimModel;
  private readonly modelViewTransform: ModelViewTransform2;
  private readonly resonatorsContainer: Node;
  private springNodes: ParametricSpringNode[] = [];
  private massNodes: Node[] = [];
  private readonly rulerNode: RulerNode;
  private readonly rulerVisibleProperty: Property<boolean>;
  private readonly rulerPositionProperty: Vector2Property;
  private readonly gravityEnabledProperty: Property<boolean>;
  private readonly driverNode: Node; // Control box with UI
  private driverPlate!: Rectangle; // Gray plate that oscillates and springs attach to (initialized in constructor)
  private connectionRod!: Rectangle; // Connection rod between control box and plate (initialized in constructor)

  public constructor(
    model: SimModel,
    options?: ScreenViewOptions
  ) {
    super(options);

    this.model = model;

    // Initialize ModelViewTransform for converting between model coordinates (meters) and view coordinates (pixels)
    // Model bounds: reasonable range for oscillator positions
    // View bounds: simulation area bounds
    const transformModelBounds = new Bounds2(
      ResonanceConstants.MODEL_BOUNDS_MIN,
      ResonanceConstants.MODEL_BOUNDS_MIN,
      ResonanceConstants.MODEL_BOUNDS_MAX,
      ResonanceConstants.MODEL_BOUNDS_MAX
    );
    const viewBounds = this.layoutBounds;
    
    // Create transform using createRectangleMapping which maps model bounds to view bounds
    // This will handle the coordinate conversion with proper scaling
    this.modelViewTransform = ModelViewTransform2.createRectangleMapping(transformModelBounds, viewBounds);

    // Initialize properties
    this.rulerVisibleProperty = new Property<boolean>(false);
    // Ruler position in model coordinates (meters) as Vector2Property
    // Convert initial view position to model coordinates
    const initialViewX = this.layoutBounds.left + ResonanceConstants.RULER_LEFT_MARGIN;
    const initialViewY = this.layoutBounds.top + ResonanceConstants.RULER_TOP_MARGIN;
    const initialModelX = this.modelViewTransform.viewToModelX(initialViewX);
    const initialModelY = this.modelViewTransform.viewToModelY(initialViewY);
    this.rulerPositionProperty = new Vector2Property(new Vector2(initialModelX, initialModelY));
    this.gravityEnabledProperty = new Property<boolean>(model.resonanceModel.gravityProperty.value > 0);

    // Create simulation area container
    const simulationArea = new Node();

    // ===== DRIVER (Grey box at bottom) =====
    this.driverNode = new Node();
    const driverBox = new Rectangle(0, 0,
      ResonanceConstants.DRIVER_BOX_WIDTH,
      ResonanceConstants.DRIVER_BOX_HEIGHT,
      ResonanceConstants.DRIVER_BOX_CORNER_RADIUS,
      ResonanceConstants.DRIVER_BOX_CORNER_RADIUS, {
        fill: ResonanceColors.driverFillProperty,
        stroke: ResonanceColors.driverStrokeProperty,
        lineWidth: ResonanceConstants.DRIVER_BOX_LINE_WIDTH
      });
    this.driverNode.addChild(driverBox);

    // Driver Power Toggle
    const powerToggleLabel = new Text(ResonanceStrings.controls.onStringProperty, {
      font: ResonanceConstants.LABEL_FONT,
      fill: ResonanceColors.driverTextProperty
    });
    const powerToggleSwitch = new ToggleSwitch(model.resonanceModel.drivingEnabledProperty, false, true, {
      trackFillLeft: ResonanceColors.toggleTrackOffProperty,
      trackFillRight: ResonanceColors.toggleTrackOnProperty,
      thumbFill: 'white'
    });
    const powerToggleBox = new HBox({
      children: [powerToggleLabel, powerToggleSwitch],
      spacing: ResonanceConstants.POWER_TOGGLE_SPACING,
      left: ResonanceConstants.POWER_TOGGLE_LEFT,
      top: ResonanceConstants.POWER_TOGGLE_TOP
    });
    this.driverNode.addChild(powerToggleBox);

    // Driver Frequency Control using NumberControl
    const frequencyControl = new NumberControl(ResonanceStrings.controls.frequencyStringProperty, model.resonanceModel.drivingFrequencyProperty, ResonanceConstants.FREQUENCY_RANGE, {
      delta: 0.01, // Small increment: 0.01 Hz per arrow click
      numberDisplayOptions: {
        valuePattern: '{{value}} Hz',
        decimalPlaces: 2
      },
      sliderOptions: {
        trackFillEnabled: ResonanceColors.frequencyTrackProperty
      }
    });
    frequencyControl.setScaleMagnitude(ResonanceConstants.CONTROL_SCALE);
    frequencyControl.centerX = driverBox.centerX;
    frequencyControl.top = ResonanceConstants.FREQUENCY_CONTROL_TOP;
    this.driverNode.addChild(frequencyControl);

    const resetAllButton = new ResetAllButton({
      listener: () => {
        // Reset model first (this resets all physics properties)
        model.reset();
        // Then reset view properties
        this.reset();
        // Sync gravity toggle with model's gravity property after reset
        this.gravityEnabledProperty.value = model.resonanceModel.gravityProperty.value > 0;
      },
      right: this.layoutBounds.maxX - ResonanceConstants.RESET_ALL_RIGHT_MARGIN,
      bottom: this.layoutBounds.maxY - ResonanceConstants.RESET_ALL_BOTTOM_MARGIN
    });
    this.addChild(resetAllButton);

    // Driver Amplitude Control using NumberControl
    // Create a property in centimeters for display (model property is in meters)
    const amplitudeCmProperty = new NumberProperty(model.resonanceModel.drivingAmplitudeProperty.value * 100);

    // Bidirectional sync: cm <-> meters (with flag to prevent circular updates)
    let updatingAmplitude = false;
    amplitudeCmProperty.link((cm: number) => {
      if (!updatingAmplitude) {
        updatingAmplitude = true;
        model.resonanceModel.drivingAmplitudeProperty.value = cm / 100; // cm to meters
        updatingAmplitude = false;
      }
    });
    model.resonanceModel.drivingAmplitudeProperty.link((meters: number) => {
      if (!updatingAmplitude) {
        updatingAmplitude = true;
        amplitudeCmProperty.value = meters * 100; // meters to cm
        updatingAmplitude = false;
      }
    });

    // Range in centimeters
    const amplitudeRangeCm = new Range(
      ResonanceConstants.AMPLITUDE_RANGE.min * 100,
      ResonanceConstants.AMPLITUDE_RANGE.max * 100
    );

    const amplitudeControl = new NumberControl(
      ResonanceStrings.controls.amplitudeStringProperty,
      amplitudeCmProperty,
      amplitudeRangeCm,
      {
        delta: 0.01, // Small increment: 0.01 cm per arrow click
        numberDisplayOptions: {
          valuePattern: '{{value}} cm',
          decimalPlaces: 2
        },
        sliderOptions: {
          trackFillEnabled: ResonanceColors.amplitudeTrackProperty
        }
      }
    );
    amplitudeControl.setScaleMagnitude(ResonanceConstants.CONTROL_SCALE);
    amplitudeControl.left = ResonanceConstants.AMPLITUDE_CONTROL_LEFT;
    amplitudeControl.bottom = driverBox.bottom - ResonanceConstants.AMPLITUDE_CONTROL_BOTTOM_MARGIN;
    this.driverNode.addChild(amplitudeControl);

    // Position driver control box at bottom center-left
    this.driverNode.centerX = this.layoutBounds.centerX + ResonanceConstants.DRIVER_CENTER_X_OFFSET;
    this.driverNode.bottom = this.layoutBounds.bottom - ResonanceConstants.DRIVER_BOTTOM_MARGIN;
    simulationArea.addChild(this.driverNode);

    // ===== DRIVER PLATE (Gray plate that oscillates, springs attach to this) =====
    // This is the gray plate that all springs connect to and is driven by oscillations
    const driverPlateWidth = ResonanceConstants.DRIVER_BOX_WIDTH;
    const driverPlateHeight = ResonanceConstants.DRIVER_PLATE_HEIGHT;
    const driverPlateBaseY = this.driverNode.top - ResonanceConstants.DRIVER_PLATE_VERTICAL_OFFSET;
    const connectionRodHeight = ResonanceConstants.CONNECTION_ROD_HEIGHT;

    // Create connection rod (vertical cylinder/rectangle) that connects the control box to the plate
    this.connectionRod = new Rectangle(0, 0, ResonanceConstants.CONNECTION_ROD_WIDTH, connectionRodHeight, {
      fill: ResonanceColors.driverFillProperty,
      stroke: ResonanceColors.driverStrokeProperty,
      lineWidth: ResonanceConstants.DRIVER_BOX_LINE_WIDTH,
      cornerRadius: ResonanceConstants.CONNECTION_ROD_CORNER_RADIUS
    });
    this.connectionRod.centerX = this.driverNode.centerX;
    this.connectionRod.bottom = this.driverNode.top;
    simulationArea.addChild(this.connectionRod);

    // Create the driver plate
    this.driverPlate = new Rectangle(0, 0, driverPlateWidth, driverPlateHeight, {
      fill: ResonanceColors.driverFillProperty,
      stroke: ResonanceColors.driverStrokeProperty,
      lineWidth: ResonanceConstants.DRIVER_BOX_LINE_WIDTH,
      cornerRadius: ResonanceConstants.DRIVER_PLATE_CORNER_RADIUS
    });
    this.driverPlate.centerX = this.driverNode.centerX;
    this.driverPlate.y = driverPlateBaseY;
    simulationArea.addChild(this.driverPlate);

    // ===== RESONATORS (springs + masses, displayed side by side) =====
    this.resonatorsContainer = new Node();
    simulationArea.addChild(this.resonatorsContainer);
    this.rebuildResonators(1);

    // Rebuild resonators when count changes
    model.resonatorCountProperty.link((count: number) => {
      this.rebuildResonators(count);
      this.updateSpringAndMass(this.driverNode);
    });

    // ===== RULER (optional, toggled on/off) =====
    // Create vertical ruler by swapping width/height and rotating
    // For vertical: rulerWidth (tick extent) = 500, rulerHeight (thickness) = 40
    // Ruler shows 0-50 cm (0-0.5 m)
    const rulerLabels = ['0', '10', '20', '30', '40', '50'];
    this.rulerNode = new RulerNode(
      ResonanceConstants.RULER_WIDTH,   // rulerWidth: distance between ticks (500 for vertical extent)
      ResonanceConstants.RULER_HEIGHT,   // rulerHeight: thickness of ruler (40 for horizontal extent)
      ResonanceConstants.RULER_MAJOR_TICK_WIDTH, // majorTickWidth: spacing between major ticks (100)
      rulerLabels, 'cm', {
        minorTicksPerMajorTick: ResonanceConstants.RULER_MINOR_TICKS_PER_MAJOR,
        insetsWidth: ResonanceConstants.RULER_INSETS_WIDTH
      });
    
    // Rotate ruler -90 degrees to make it vertical (pointing upward)
    this.rulerNode.rotation = -Math.PI / 2;
    
    // Convert model coordinates to view coordinates using ModelViewTransform
    this.rulerPositionProperty.link((modelPosition: Vector2) => {
      const viewX = this.modelViewTransform.modelToViewX(modelPosition.x);
      const viewY = this.modelViewTransform.modelToViewY(modelPosition.y);
      // Position at the center of the rotated ruler
      this.rulerNode.centerX = viewX;
      this.rulerNode.centerY = viewY;
    });
    
    this.rulerNode.visible = false;
    
    // Add drag handler using positionProperty - much simpler!
    // Calculate drag bounds accounting for ruler size (rotated dimensions)
    const rulerModelBounds = this.modelViewTransform.viewToModelBounds(this.layoutBounds);
    // After rotation, the effective width (horizontal) is RULER_HEIGHT and height (vertical) is RULER_WIDTH
    const rulerWidthModel = this.modelViewTransform.viewToModelDeltaX(ResonanceConstants.RULER_HEIGHT);
    const rulerHeightModel = Math.abs(this.modelViewTransform.viewToModelDeltaY(ResonanceConstants.RULER_WIDTH));

    // Allow ruler to reach the bottom of the screen (maxY stays at rulerModelBounds.maxY)
    const dragBounds = new Bounds2(
      rulerModelBounds.minX,
      rulerModelBounds.minY + rulerHeightModel / 2, // Keep top half visible at minimum
      rulerModelBounds.maxX - rulerWidthModel,
      rulerModelBounds.maxY // Allow ruler to reach bottom
    );
    
    const dragListener = new DragListener({
      targetNode: this.rulerNode,
      positionProperty: this.rulerPositionProperty,
      transform: this.modelViewTransform,
      // Use parent offset to handle rotation correctly - computes offsets in parent coordinate space
      // rather than using the node's transform, which is necessary when positioning via centerX/centerY
      useParentOffset: true,
      // Constrain to model bounds accounting for ruler size
      dragBoundsProperty: new Property(dragBounds)
    });
    this.rulerNode.addInputListener(dragListener);
    this.rulerNode.cursor = 'move';
    
    simulationArea.addChild(this.rulerNode);

    this.addChild(simulationArea);

    // ===== CONTROL PANEL (Right side, green panel) =====

    // Number of Resonators control using NumberControl
    const resonatorCountControl = new NumberControl(ResonanceStrings.controls.resonatorsStringProperty, model.resonatorCountProperty, ResonanceConstants.RESONATOR_COUNT_RANGE, {
      delta: 1,
      numberDisplayOptions: {
        decimalPlaces: 0
      },
      sliderOptions: {
        majorTicks: [
          { value: 1, label: new Text('1', { font: ResonanceConstants.TICK_LABEL_FONT }) },
          { value: 10, label: new Text('10', { font: ResonanceConstants.TICK_LABEL_FONT }) }
        ],
        minorTickSpacing: 1
      }
    });

    // ===== OSCILLATOR CONFIGURATION COMBO BOX =====
    const configLabel = new Text(ResonanceStrings.controls.oscillatorConfigStringProperty, {
      font: ResonanceConstants.LABEL_FONT,
      fill: ResonanceColors.textProperty
    });

    const comboBoxItems: ComboBoxItem<OscillatorConfigModeType>[] = [
      {
        value: OscillatorConfigMode.SAME_SPRING_CONSTANT,
        createNode: () => new Text(ResonanceStrings.controls.sameSpringConstantStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        })
      },
      {
        value: OscillatorConfigMode.SAME_MASS,
        createNode: () => new Text(ResonanceStrings.controls.sameMassStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        })
      },
      {
        value: OscillatorConfigMode.MIXED,
        createNode: () => new Text(ResonanceStrings.controls.mixedStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        })
      },
      {
        value: OscillatorConfigMode.SAME_FREQUENCY,
        createNode: () => new Text(ResonanceStrings.controls.sameFrequencyStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        })
      },
      {
        value: OscillatorConfigMode.CUSTOM,
        createNode: () => new Text(ResonanceStrings.controls.customStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        })
      }
    ];

    // The ComboBox list needs a parent node that's high in the scene graph
    // so the popup list renders above everything else
    const comboBoxListParent = new Node();

    const configComboBox = new ComboBox(
      model.oscillatorConfigProperty,
      comboBoxItems,
      comboBoxListParent,
      {
        xMargin: ResonanceConstants.COMBO_BOX_X_MARGIN,
        yMargin: ResonanceConstants.COMBO_BOX_Y_MARGIN,
        cornerRadius: ResonanceConstants.COMBO_BOX_CORNER_RADIUS
      }
    );

    const configBox = new VBox({
      children: [configLabel, configComboBox],
      spacing: ResonanceConstants.COMBO_BOX_SPACING,
      align: 'left'
    });

    // Resonator Selection Spinner (1-indexed for display)
    // Convert between 0-indexed internal and 1-indexed display
    const displayResonatorNumberProperty = new NumberProperty(1);

    // Sync display property with model's selected index (with offset)
    displayResonatorNumberProperty.link((displayNumber: number) => {
      model.selectedResonatorIndexProperty.value = displayNumber - 1;
    });
    model.selectedResonatorIndexProperty.link((index: number) => {
      displayResonatorNumberProperty.value = index + 1;
    });

    // Create a dynamic range property that updates with resonator count
    const spinnerRangeProperty = new Property(new Range(1, model.resonatorCountProperty.value));

    // Update spinner range when resonator count changes
    model.resonatorCountProperty.link((count: number) => {
      spinnerRangeProperty.value = new Range(1, count);
    });

    const resonatorSpinner = new NumberSpinner(
      displayResonatorNumberProperty,
      spinnerRangeProperty,
      {
        arrowsPosition: 'bothRight',
        arrowsScale: 0.8
      }
    );

    const resonatorLabel = new Text('', {
      font: ResonanceConstants.TITLE_FONT,
      fill: ResonanceColors.textProperty
    });

    // Update label based on selected resonator
    displayResonatorNumberProperty.link((num: number) => {
      resonatorLabel.string = `Resonator ${num}`;
    });

    const resonatorSelectionBox = new HBox({
      children: [resonatorLabel, resonatorSpinner],
      spacing: 10,
      align: 'center'
    });

    // Create display properties that will show/edit the selected oscillator's values
    const displayMassProperty = new NumberProperty(model.resonanceModel.massProperty.value);
    const displaySpringConstantProperty = new NumberProperty(model.resonanceModel.springConstantProperty.value);

    // Mass control - shows selected oscillator's mass
    const massControl = new NumberControl(
      ResonanceStrings.controls.massSimpleStringProperty,
      displayMassProperty,
      ResonanceConstants.MASS_RANGE,
      {
        delta: 0.01, // Small increment: 0.01 kg per arrow click
        numberDisplayOptions: {
          valuePattern: '{{value}} kg',
          decimalPlaces: 4
        }
      }
    );

    // Spring Constant control - shows selected oscillator's spring constant
    const springConstantControl = new NumberControl(
      ResonanceStrings.controls.springConstantSimpleStringProperty,
      displaySpringConstantProperty,
      ResonanceConstants.SPRING_CONSTANT_RANGE,
      {
        delta: 1, // Small increment: 1 N/m per arrow click
        numberDisplayOptions: {
          valuePattern: '{{value}} N/m',
          decimalPlaces: 0
        }
      }
    );

    // Sync display properties with selected oscillator
    const updateControlsEnabledState = () => {
      const index = model.selectedResonatorIndexProperty.value;
      const isCustomMode = model.oscillatorConfigProperty.value === OscillatorConfigMode.CUSTOM;

      // Enable editing for:
      // - Base oscillator (index 0) in any mode
      // - Any oscillator in CUSTOM mode
      massControl.enabled = (index === 0) || isCustomMode;
      springConstantControl.enabled = (index === 0) || isCustomMode;
    };

    model.selectedResonatorIndexProperty.link((index: number) => {
      const selectedOscillator = model.oscillatorModels[index];

      // Update display to show selected oscillator's values
      displayMassProperty.value = selectedOscillator.massProperty.value;
      displaySpringConstantProperty.value = selectedOscillator.springConstantProperty.value;

      updateControlsEnabledState();
    });

    // Also update enabled state when config mode changes
    model.oscillatorConfigProperty.link(() => {
      updateControlsEnabledState();
    });

    // When display properties change and oscillator 0 is selected, update the model
    // Use a flag to prevent circular updates
    let updatingFromModel = false;

    displayMassProperty.link((mass: number) => {
      if (!updatingFromModel) {
        const index = model.selectedResonatorIndexProperty.value;
        const isCustomMode = model.oscillatorConfigProperty.value === OscillatorConfigMode.CUSTOM;

        // Update model if editing base oscillator or in CUSTOM mode
        if (index === 0 || isCustomMode) {
          model.oscillatorModels[index].massProperty.value = mass;
        }
      }
    });

    displaySpringConstantProperty.link((springConstant: number) => {
      if (!updatingFromModel) {
        const index = model.selectedResonatorIndexProperty.value;
        const isCustomMode = model.oscillatorConfigProperty.value === OscillatorConfigMode.CUSTOM;

        // Update model if editing base oscillator or in CUSTOM mode
        if (index === 0 || isCustomMode) {
          model.oscillatorModels[index].springConstantProperty.value = springConstant;
        }
      }
    });

    // When oscillator parameters change, update display if showing that oscillator
    model.oscillatorModels.forEach((oscillator, index) => {
      oscillator.massProperty.link((mass: number) => {
        if (model.selectedResonatorIndexProperty.value === index) {
          updatingFromModel = true;
          displayMassProperty.value = mass;
          updatingFromModel = false;
        }
      });
      oscillator.springConstantProperty.link((springConstant: number) => {
        if (model.selectedResonatorIndexProperty.value === index) {
          updatingFromModel = true;
          displaySpringConstantProperty.value = springConstant;
          updatingFromModel = false;
        }
      });
    });

    // Natural Frequency Readout (derived, non-editable)
    const naturalFrequencyText = new Text('', {
      font: ResonanceConstants.CONTROL_FONT,
      fill: ResonanceColors.textProperty
    });

    // Update natural frequency display based on selected oscillator
    const updateNaturalFrequency = () => {
      const index = model.selectedResonatorIndexProperty.value;
      const freq = model.oscillatorModels[index].naturalFrequencyHzProperty.value;
      naturalFrequencyText.string = `${ResonanceStrings.controls.frequencyEqualsStringProperty.value} ${freq.toFixed(3)} Hz`;
    };

    model.selectedResonatorIndexProperty.link(updateNaturalFrequency);
    // Also listen to each oscillator's frequency changes
    model.oscillatorModels.forEach(oscillator => {
      oscillator.naturalFrequencyHzProperty.link(updateNaturalFrequency);
    });

    // Damping Constant control using NumberControl
    const dampingControl = new NumberControl('Damping', model.resonanceModel.dampingProperty, ResonanceConstants.DAMPING_RANGE, {
      delta: 0.1, // Small increment: 0.1 N/(m/s) per arrow click
      numberDisplayOptions: {
        valuePattern: '{{value}} N/(m/s)',
        decimalPlaces: 1
      }
    });

    // Gravity Toggle using ToggleSwitch
    const gravityToggleSwitch = new ToggleSwitch(this.gravityEnabledProperty, false, true, {
      trackFillLeft: ResonanceColors.gravityToggleOffProperty,
      trackFillRight: ResonanceColors.gravityToggleOnProperty
    });

    // Listen to gravity toggle changes and update model
    this.gravityEnabledProperty.link((enabled: boolean) => {
      model.resonanceModel.gravityProperty.value = enabled ? ResonanceConstants.GRAVITY_ACCELERATION : 0;
    });

    const gravityLabel = new Text(ResonanceStrings.controls.gravityStringProperty, {
      font: ResonanceConstants.LABEL_FONT,
      fill: ResonanceColors.textProperty
    });
    const gravityBox = new HBox({
      children: [gravityLabel, gravityToggleSwitch],
      spacing: ResonanceConstants.GRAVITY_BOX_SPACING,
      align: 'center'
    });

    // Ruler Toggle
    const rulerCheckbox = new Checkbox(this.rulerVisibleProperty, new Text(ResonanceStrings.controls.rulerStringProperty, {
      font: ResonanceConstants.CONTROL_FONT,
      fill: ResonanceColors.textProperty
    }), {
      boxWidth: ResonanceConstants.RULER_CHECKBOX_BOX_WIDTH
    });

    // Update ruler visibility
    this.rulerVisibleProperty.link((visible: boolean) => {
      this.rulerNode.visible = visible;
    });

    // Assemble control panel contents
    const controlPanelContent = new VBox({
      children: [
        resonatorCountControl,
        configBox,
        new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, { stroke: ResonanceColors.textProperty, lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH }),
        resonatorSelectionBox,
        massControl,
        springConstantControl,
        naturalFrequencyText,
        dampingControl,
        new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, { stroke: ResonanceColors.textProperty, lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH }),
        gravityBox,
        rulerCheckbox
      ],
      spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
      align: 'left'
    });

    const controlPanel = new Panel(controlPanelContent, {
      fill: ResonanceColors.controlPanelFillProperty,
      stroke: ResonanceColors.controlPanelStrokeProperty,
      lineWidth: ResonanceConstants.CONTROL_PANEL_LINE_WIDTH,
      cornerRadius: ResonanceConstants.CONTROL_PANEL_CORNER_RADIUS,
      xMargin: ResonanceConstants.CONTROL_PANEL_X_MARGIN,
      yMargin: ResonanceConstants.CONTROL_PANEL_Y_MARGIN,
      right: this.layoutBounds.maxX - ResonanceConstants.CONTROL_PANEL_RIGHT_MARGIN,
      top: this.layoutBounds.minY + ResonanceConstants.CONTROL_PANEL_TOP_MARGIN
    });

    this.addChild(controlPanel);

    // Add the combo box list parent on top of the control panel so the popup renders above
    this.addChild(comboBoxListParent);

    // ===== SIMULATION CONTROLS (Below driver) =====

    // Simulation Speed Control
    const speedButtons = [
      { value: 'slow', createNode: () => new Text('slow', { font: ResonanceConstants.CONTROL_FONT }) },
      { value: 'normal', createNode: () => new Text('normal', { font: ResonanceConstants.CONTROL_FONT }) }
    ];

    const speedControl = new AquaRadioButtonGroup(
      model.resonanceModel.timeSpeedProperty,
      speedButtons,
      {
        orientation: 'horizontal',
        spacing: ResonanceConstants.SPEED_CONTROL_SPACING,
        radioButtonOptions: {
          radius: ResonanceConstants.SPEED_RADIO_BUTTON_RADIUS
        }
      }
    );

    // Playback Controls using SceneryStack components
    const playPauseStepButtonGroup = new PlayPauseStepButtonGroup(model.resonanceModel.isPlayingProperty, {
      playPauseButtonOptions: {
        scale: ResonanceConstants.PLAY_PAUSE_SCALE
      },
      includeStepForwardButton: true,
      includeStepBackwardButton: true,
      stepForwardButtonOptions: {
        listener: () => {
          model.resonanceModel.step(ResonanceConstants.STEP_DT, true);
          // Step the other active oscillators too
          const count = model.resonatorCountProperty.value;
          for (let i = 1; i < count; i++) {
            model.oscillatorModels[i].step(ResonanceConstants.STEP_DT, true);
          }
        }
      },
      stepBackwardButtonOptions: {
        listener: () => {
          model.resonanceModel.step(-ResonanceConstants.STEP_DT, true);
          const count = model.resonatorCountProperty.value;
          for (let i = 1; i < count; i++) {
            model.oscillatorModels[i].step(-ResonanceConstants.STEP_DT, true);
          }
        }
      }
    });

    const playbackControls = new HBox({
      children: [speedControl, playPauseStepButtonGroup],
      spacing: ResonanceConstants.PLAYBACK_CONTROLS_SPACING,
      align: 'center',
      centerX: this.layoutBounds.centerX + ResonanceConstants.DRIVER_CENTER_X_OFFSET,
      bottom: this.layoutBounds.bottom - ResonanceConstants.PLAYBACK_BOTTOM_MARGIN
    });

    this.addChild(playbackControls);

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

    // Scale mass size based on count so they fit on the platform
    const massSize = Math.max(ResonanceConstants.MIN_MASS_SIZE, ResonanceConstants.MAX_MASS_SIZE - count);

    for (let i = 0; i < count; i++) {
      // Get the oscillator model for this resonator
      const oscillatorModel = this.model.oscillatorModels[i];

      // Create a ParametricSpringNode for each resonator
      const springNode = new ParametricSpringNode({
        frontColor: ResonanceColors.springProperty,
        middleColor: ResonanceColors.springProperty,
        backColor: ResonanceColors.springBackProperty,
        loops: ResonanceConstants.SPRING_LOOPS,
        radius: ResonanceConstants.SPRING_RADIUS,
        aspectRatio: ResonanceConstants.SPRING_ASPECT_RATIO,
        pointsPerLoop: ResonanceConstants.SPRING_POINTS_PER_LOOP,
        lineWidth: ResonanceConstants.SPRING_LINE_WIDTH,
        leftEndLength: ResonanceConstants.SPRING_LEFT_END_LENGTH,
        rightEndLength: ResonanceConstants.SPRING_RIGHT_END_LENGTH,
        rotation: -Math.PI / 2, // Rotate to vertical (upward from origin)
        boundsMethod: 'none'
      });
      
      // Link line width to spring constant: map spring constant range to line width range
      oscillatorModel.springConstantProperty.link((springConstant: number) => {
        // Linear mapping: minK -> minWidth, maxK -> maxWidth
        const minK = ResonanceConstants.SPRING_CONSTANT_RANGE.min;
        const maxK = ResonanceConstants.SPRING_CONSTANT_RANGE.max;
        const normalizedK = (springConstant - minK) / (maxK - minK); // 0 to 1
        const lineWidth = ResonanceConstants.SPRING_LINE_WIDTH_MIN + normalizedK * (ResonanceConstants.SPRING_LINE_WIDTH_MAX - ResonanceConstants.SPRING_LINE_WIDTH_MIN);
        springNode.lineWidthProperty.value = lineWidth;
      });
      
      this.resonatorsContainer.addChild(springNode);
      this.springNodes.push(springNode);

      const massNode = new Node();
      // Create square mass box
      const massBox = new Rectangle(0, 0, massSize, massSize, {
        fill: ResonanceColors.massProperty,
        stroke: ResonanceColors.massStrokeProperty,
        lineWidth: ResonanceConstants.MASS_STROKE_LINE_WIDTH,
        cornerRadius: 3 // Slight rounding for aesthetics
      });
      const massLabel = new Text(`${i + 1}`, {
        font: `bold ${Math.max(ResonanceConstants.MASS_LABEL_FONT_SIZE_MIN, ResonanceConstants.MASS_LABEL_FONT_SIZE_BASE - count)}px sans-serif`,
        fill: ResonanceColors.massLabelProperty,
        center: massBox.center
      });
      massNode.addChild(massBox);
      massNode.addChild(massLabel);
      this.resonatorsContainer.addChild(massNode);
      this.massNodes.push(massNode);
    }
  }

  /**
   * Update spring and mass positions each frame.
   * Computes the desired spring length and adjusts ParametricSpringNode xScale
   * so the spring visually connects the driver plate to the mass.
   * Also updates the driver plate position based on driving force.
   */
  private updateSpringAndMass(driverNode: Node): void {
    const count = this.springNodes.length;
    if (count === 0) {
      return;
    }

    // Update driver plate position based on driving force
    // The driver plate oscillates: y = baseY + A * sin(ω*t)
    // The amplitude directly controls the oscillation amplitude
    const driverModel = this.model.resonanceModel;
    if (driverModel.drivingEnabledProperty.value) {
      const omega = driverModel.drivingFrequencyProperty.value * 2 * Math.PI; // rad/s
      const time = driverModel.timeProperty.value;
      
      // Get driving amplitude (meters) - plate displacement amplitude
      const drivingAmplitude = driverModel.drivingAmplitudeProperty.value;

      // Convert amplitude from model coordinates (meters) to view coordinates (pixels)
      // This ensures the visual displacement matches the physical displacement
      const amplitudeViewDisplacement = Math.abs(this.modelViewTransform.modelToViewDeltaY(drivingAmplitude));

      // Calculate oscillation: amplitude * sin(ω*t)
      const viewDisplacement = amplitudeViewDisplacement * Math.sin(omega * time);

      // Update driver plate Y position (oscillates around base position)
      const driverPlateBaseY = this.driverNode.top - ResonanceConstants.DRIVER_PLATE_VERTICAL_OFFSET;
      this.driverPlate.y = driverPlateBaseY + viewDisplacement;

      // Update connection rod to stretch/compress with the plate movement
      const connectionRodBaseBottom = this.driverNode.top;
      // Rod height adjusts to maintain connection between box and plate
      // When plate moves up, rod compresses (shorter), when down, rod extends (longer)
      const rodHeight = Math.max(ResonanceConstants.CONNECTION_ROD_MIN_HEIGHT, ResonanceConstants.CONNECTION_ROD_HEIGHT - viewDisplacement);
      this.connectionRod.setRect(0, 0, ResonanceConstants.CONNECTION_ROD_WIDTH, rodHeight);
      this.connectionRod.bottom = connectionRodBaseBottom;
    } else {
      // When driving is off, plate stays at base position
      const driverPlateBaseY = this.driverNode.top - ResonanceConstants.DRIVER_PLATE_VERTICAL_OFFSET;
      this.driverPlate.y = driverPlateBaseY;

      // Reset connection rod to base height
      this.connectionRod.setRect(0, 0, ResonanceConstants.CONNECTION_ROD_WIDTH, ResonanceConstants.CONNECTION_ROD_HEIGHT);
      this.connectionRod.bottom = this.driverNode.top;
    }

    // Driver plate top position (where springs attach)
    const driverTopY = this.driverPlate.top;
    const driverCenterX = this.driverPlate.centerX;

    // Spacing: distribute resonators evenly across the driver width
    const spacing = ResonanceConstants.DRIVER_BOX_WIDTH / (count + 1);

    // Calculate equilibrium position based on natural length from model
    // Natural length is the spring length when mass is at rest (position = 0)
    // Springs extend UPWARD from the driver plate, so equilibrium is above the plate
    const naturalLength = this.model.resonanceModel.naturalLengthProperty.value; // meters
    const naturalLengthView = Math.abs(this.modelViewTransform.modelToViewDeltaY(naturalLength)); // pixels
    const equilibriumY = driverTopY - naturalLengthView; // Subtract to go up (smaller Y = higher on screen)
    const massSize = Math.max(ResonanceConstants.MIN_MASS_SIZE, ResonanceConstants.MAX_MASS_SIZE - count);

    // Pre-compute the spring geometry constants for xScale calculation
    const endLengths = ResonanceConstants.SPRING_LEFT_END_LENGTH + ResonanceConstants.SPRING_RIGHT_END_LENGTH;
    const loopsTimesRadius = ResonanceConstants.SPRING_LOOPS * ResonanceConstants.SPRING_RADIUS;

    for (let i = 0; i < count; i++) {
      const xCenter = driverCenterX - ResonanceConstants.DRIVER_BOX_WIDTH / 2 + spacing * (i + 1);

      // Each oscillator has its own position from its own model
      const oscillatorModel = this.model.oscillatorModels[i];
      // Convert model position (meters) to view position (pixels) using ModelViewTransform
      // For springs extending upward: positive position = moving up (spring stretches)
      // In screen coordinates: moving up = smaller Y values, so we SUBTRACT the offset
      const modelY = oscillatorModel.positionProperty.value; // meters
      const viewYOffset = this.modelViewTransform.modelToViewDeltaY(modelY); // pixels

      // Junction point (where spring connects to mass bottom) is at the model position
      const junctionY = equilibriumY - viewYOffset; // Subtract: positive position moves mass UP (smaller Y)

      // Mass box center is positioned slightly above the junction point
      const massCenterY = junctionY - ResonanceConstants.MASS_CENTER_OFFSET;

      // Update mass position (centered at massCenterY)
      this.massNodes[i].centerX = xCenter;
      this.massNodes[i].centerY = massCenterY;

      // Compute the spring connection endpoints
      const springStartY = driverTopY;
      // Spring connects to the bottom of the mass box (junction point)
      const springEndY = junctionY;
      const springLength = Math.abs(springEndY - springStartY);

      // Compute the xScale needed to achieve the desired spring length.
      // Total width ≈ leftEndLength + rightEndLength + 2*radius + xScale * loops * radius
      const xScale = Math.max(
        ResonanceConstants.MIN_SPRING_XSCALE,
        (springLength - endLengths - 2 * ResonanceConstants.SPRING_RADIUS) / loopsTimesRadius
      );

      const springNode = this.springNodes[i];
      springNode.xScaleProperty.value = xScale;

      // Set rotation: upward (-PI/2) if mass is above driver, downward (PI/2) if below
      springNode.rotation = springEndY < springStartY ? -Math.PI / 2 : Math.PI / 2;

      // Position the spring origin at the driver top
      springNode.x = xCenter;
      springNode.y = springStartY;
    }
  }

  public reset(): void {
    // Reset ruler visibility and position
    this.rulerVisibleProperty.reset();
    this.rulerPositionProperty.reset();
    
    // Reset gravity toggle (will be synced with model after model.reset() is called)
    // Note: gravityEnabledProperty is reset here, but will be updated by the listener
    // in resetAllButton to match the model's gravityProperty value
    this.gravityEnabledProperty.reset();
  }

  public step(): void {
    // Called every frame, update spring and mass positions
    this.updateSpringAndMass(this.driverNode);
  }
}
