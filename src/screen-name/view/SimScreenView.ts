import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { SimModel } from "../model/SimModel.js";
import { ResetAllButton, PlayPauseStepButtonGroup, NumberControl, RulerNode, ParametricSpringNode } from "scenerystack/scenery-phet";
import { Rectangle, Text, Node, Circle, Line, VBox, HBox } from "scenerystack/scenery";
import { DragListener } from "scenerystack/scenery";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Vector2Property } from "scenerystack/dot";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { Panel, AquaRadioButtonGroup, Checkbox, ToggleSwitch, ComboBox } from "scenerystack/sun";
import type { ComboBoxItem } from "scenerystack/sun";
import { Property} from "scenerystack/axon";
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
    // Model bounds: reasonable range for oscillator positions (-5 to 5 meters)
    // View bounds: simulation area bounds  
    const transformModelBounds = new Bounds2(-5, -5, 5, 5); // meters
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
    const amplitudeControl = new NumberControl(ResonanceStrings.controls.amplitudeStringProperty, model.resonanceModel.drivingAmplitudeProperty, ResonanceConstants.AMPLITUDE_RANGE, {
      numberDisplayOptions: {
        valuePattern: '{{value}} N',
        decimalPlaces: 1
      },
      sliderOptions: {
        trackFillEnabled: ResonanceColors.amplitudeTrackProperty
      }
    });
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
    const driverPlateHeight = 20; // Thinner plate for the driver
    const driverPlateBaseY = this.driverNode.top - 30; // Position above the control box
    const connectionRodHeight = 30; // Height of the connection rod between box and plate
    
    // Create connection rod (vertical cylinder/rectangle) that connects the control box to the plate
    this.connectionRod = new Rectangle(0, 0, 15, connectionRodHeight, {
      fill: ResonanceColors.driverFillProperty,
      stroke: ResonanceColors.driverStrokeProperty,
      lineWidth: ResonanceConstants.DRIVER_BOX_LINE_WIDTH,
      cornerRadius: 7.5 // Make it cylindrical looking
    });
    this.connectionRod.centerX = this.driverNode.centerX;
    this.connectionRod.bottom = this.driverNode.top;
    simulationArea.addChild(this.connectionRod);
    
    // Create the driver plate
    this.driverPlate = new Rectangle(0, 0, driverPlateWidth, driverPlateHeight, {
      fill: ResonanceColors.driverFillProperty,
      stroke: ResonanceColors.driverStrokeProperty,
      lineWidth: ResonanceConstants.DRIVER_BOX_LINE_WIDTH,
      cornerRadius: 5
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
    // For vertical: rulerWidth (tick extent) = 300, rulerHeight (thickness) = 40
    const rulerLabels = ['0', '10', '20', '30'];
    this.rulerNode = new RulerNode(
      ResonanceConstants.RULER_WIDTH,   // rulerWidth: distance between ticks (300 for vertical extent)
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
    const dragBounds = new Bounds2(
      rulerModelBounds.minX,
      rulerModelBounds.minY,
      rulerModelBounds.maxX - rulerWidthModel,
      rulerModelBounds.maxY - rulerHeightModel
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
        value: OscillatorConfigMode.SAME_MASS,
        createNode: () => new Text(ResonanceStrings.controls.sameMassStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        })
      },
      {
        value: OscillatorConfigMode.SAME_SPRING_CONSTANT,
        createNode: () => new Text(ResonanceStrings.controls.sameSpringConstantStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        })
      },
      {
        value: OscillatorConfigMode.MIXED,
        createNode: () => new Text(ResonanceStrings.controls.mixedStringProperty, {
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

    // Resonator 1 Parameters Box
    const resonatorLabel = new Text(ResonanceStrings.controls.resonator1StringProperty, {
      font: ResonanceConstants.TITLE_FONT,
      fill: ResonanceColors.textProperty
    });

    // Mass control using NumberControl
    const massControl = new NumberControl(ResonanceStrings.controls.massSimpleStringProperty, model.resonanceModel.massProperty, ResonanceConstants.MASS_RANGE, {
      numberDisplayOptions: {
        valuePattern: '{{value}} kg',
        decimalPlaces: 4
      }
    });

    // Spring Constant control using NumberControl
    const springConstantControl = new NumberControl(ResonanceStrings.controls.springConstantSimpleStringProperty, model.resonanceModel.springConstantProperty, ResonanceConstants.SPRING_CONSTANT_RANGE, {
      numberDisplayOptions: {
        valuePattern: '{{value}} N/m',
        decimalPlaces: 0
      }
    });

    // Natural Frequency Readout (derived, non-editable)
    const naturalFrequencyText = new Text('', {
      font: ResonanceConstants.CONTROL_FONT,
      fill: ResonanceColors.textProperty
    });

    model.resonanceModel.naturalFrequencyHzProperty.link((freq: number) => {
      naturalFrequencyText.string = `${ResonanceStrings.controls.frequencyEqualsStringProperty.value} ${freq.toFixed(3)} Hz`;
    });

    // Damping Constant control using NumberControl
    const dampingControl = new NumberControl('Damping', model.resonanceModel.dampingProperty, ResonanceConstants.DAMPING_RANGE, {
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
        new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, { stroke: ResonanceColors.textProperty, lineWidth: 1 }),
        resonatorLabel,
        massControl,
        springConstantControl,
        naturalFrequencyText,
        dampingControl,
        new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, { stroke: ResonanceColors.textProperty, lineWidth: 1 }),
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

    // Scale mass radius based on count so they fit on the platform
    const massRadius = Math.max(ResonanceConstants.MIN_MASS_RADIUS, ResonanceConstants.MAX_MASS_RADIUS - count);

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
      
      // Link line width to spring constant: map spring constant (1-200) to line width (1-5 pixels)
      oscillatorModel.springConstantProperty.link((springConstant: number) => {
        // Linear mapping: minK (1) -> minWidth (1), maxK (200) -> maxWidth (5)
        const minK = ResonanceConstants.SPRING_CONSTANT_RANGE.min;
        const maxK = ResonanceConstants.SPRING_CONSTANT_RANGE.max;
        const minWidth = 1;
        const maxWidth = 5;
        const normalizedK = (springConstant - minK) / (maxK - minK); // 0 to 1
        const lineWidth = minWidth + normalizedK * (maxWidth - minWidth);
        springNode.lineWidthProperty.value = lineWidth;
      });
      
      this.resonatorsContainer.addChild(springNode);
      this.springNodes.push(springNode);

      const massNode = new Node();
      const massCircle = new Circle(massRadius, {
        fill: ResonanceColors.massProperty,
        stroke: ResonanceColors.massStrokeProperty,
        lineWidth: ResonanceConstants.MASS_STROKE_LINE_WIDTH
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
      
      // Get driving amplitude (N) - this directly controls the oscillation amplitude
      const drivingAmplitude = driverModel.drivingAmplitudeProperty.value;
      
      // Convert amplitude to view displacement
      // Map amplitude range (0-10 N) to view displacement range (0-100 pixels)
      // This gives a direct, visible response to amplitude changes
      const amplitudeRange = ResonanceConstants.AMPLITUDE_RANGE;
      const maxViewDisplacement = 100; // Maximum view displacement in pixels
      const normalizedAmplitude = (drivingAmplitude - amplitudeRange.min) / (amplitudeRange.max - amplitudeRange.min);
      const amplitudeViewDisplacement = normalizedAmplitude * maxViewDisplacement;
      
      // Calculate oscillation: amplitude * sin(ω*t)
      const viewDisplacement = amplitudeViewDisplacement * Math.sin(omega * time);
      
      // Update driver plate Y position (oscillates around base position)
      const driverPlateBaseY = this.driverNode.top - 30;
      this.driverPlate.y = driverPlateBaseY + viewDisplacement;
      
      // Update connection rod to stretch/compress with the plate movement
      const connectionRodBaseHeight = 30;
      const connectionRodBaseBottom = this.driverNode.top;
      // Rod height adjusts to maintain connection between box and plate
      // When plate moves up, rod compresses (shorter), when down, rod extends (longer)
      const rodHeight = Math.max(10, connectionRodBaseHeight - viewDisplacement);
      this.connectionRod.setRectHeight(rodHeight);
      this.connectionRod.bottom = connectionRodBaseBottom;
    } else {
      // When driving is off, plate stays at base position
      const driverPlateBaseY = this.driverNode.top - 30;
      this.driverPlate.y = driverPlateBaseY;
      
      // Reset connection rod to base height
      this.connectionRod.setRectHeight(30);
      this.connectionRod.bottom = this.driverNode.top;
    }

    // Driver plate top position (where springs attach)
    const driverTopY = this.driverPlate.top;
    const driverCenterX = this.driverPlate.centerX;

    // Spacing: distribute resonators evenly across the driver width
    const spacing = ResonanceConstants.DRIVER_BOX_WIDTH / (count + 1);

    const equilibriumY = driverTopY - ResonanceConstants.EQUILIBRIUM_Y_OFFSET;
    const massRadius = Math.max(ResonanceConstants.MIN_MASS_RADIUS, ResonanceConstants.MAX_MASS_RADIUS - count);

    // Pre-compute the spring geometry constants for xScale calculation
    const endLengths = ResonanceConstants.SPRING_LEFT_END_LENGTH + ResonanceConstants.SPRING_RIGHT_END_LENGTH;
    const loopsTimesRadius = ResonanceConstants.SPRING_LOOPS * ResonanceConstants.SPRING_RADIUS;

    for (let i = 0; i < count; i++) {
      const xCenter = driverCenterX - ResonanceConstants.DRIVER_BOX_WIDTH / 2 + spacing * (i + 1);

      // Each oscillator has its own position from its own model
      const oscillatorModel = this.model.oscillatorModels[i];
      // Convert model position (meters) to view position (pixels) using ModelViewTransform
      const modelY = oscillatorModel.positionProperty.value; // meters
      const viewYOffset = this.modelViewTransform.modelToViewDeltaY(modelY); // pixels
      const massY = equilibriumY + viewYOffset;

      // Update mass position
      this.massNodes[i].centerX = xCenter;
      this.massNodes[i].centerY = massY;

      // Compute the spring connection endpoints
      const springStartY = driverTopY;
      const springEndY = massY - massRadius;
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
