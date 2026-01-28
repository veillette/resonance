import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { SimModel } from "../model/SimModel.js";
import { ResetAllButton, RulerNode, ParametricSpringNode, PhetFont } from "scenerystack/scenery-phet";
import { Rectangle, Text, Node } from "scenerystack/scenery";
import { DragListener } from "scenerystack/scenery";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Vector2Property } from "scenerystack/dot";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { Property } from "scenerystack/axon";
import { DriverControlNode } from "./DriverControlNode.js";
import { ResonatorControlPanel } from "./ResonatorControlPanel.js";
import { PlaybackControlNode } from "./PlaybackControlNode.js";
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
  private readonly controlPanel: ResonatorControlPanel;
  private readonly driverNode: DriverControlNode;
  private driverPlate!: Rectangle;
  private connectionRod!: Rectangle;

  public constructor(
    model: SimModel,
    options?: ScreenViewOptions
  ) {
    super(options);

    this.model = model;

    // Initialize ModelViewTransform
    const transformModelBounds = new Bounds2(
      ResonanceConstants.MODEL_BOUNDS_MIN,
      ResonanceConstants.MODEL_BOUNDS_MIN,
      ResonanceConstants.MODEL_BOUNDS_MAX,
      ResonanceConstants.MODEL_BOUNDS_MAX
    );
    const viewBounds = this.layoutBounds;
    this.modelViewTransform = ModelViewTransform2.createRectangleMapping(transformModelBounds, viewBounds);

    // Initialize ruler properties
    this.rulerVisibleProperty = new Property<boolean>(false);
    const initialViewX = this.layoutBounds.left + ResonanceConstants.RULER_LEFT_MARGIN;
    const initialViewY = this.layoutBounds.top + ResonanceConstants.RULER_TOP_MARGIN;
    const initialModelX = this.modelViewTransform.viewToModelX(initialViewX);
    const initialModelY = this.modelViewTransform.viewToModelY(initialViewY);
    this.rulerPositionProperty = new Vector2Property(new Vector2(initialModelX, initialModelY));

    // Create simulation area container
    const simulationArea = new Node();

    // ===== DRIVER CONTROL BOX =====
    this.driverNode = new DriverControlNode(model);
    this.driverNode.centerX = this.layoutBounds.centerX + ResonanceConstants.DRIVER_CENTER_X_OFFSET;
    this.driverNode.bottom = this.layoutBounds.bottom - ResonanceConstants.DRIVER_BOTTOM_MARGIN;
    simulationArea.addChild(this.driverNode);

    // ===== DRIVER PLATE & CONNECTION ROD =====
    this.createDriverPlateAndRod(simulationArea);

    // ===== RESONATORS (springs + masses) =====
    this.resonatorsContainer = new Node();
    simulationArea.addChild(this.resonatorsContainer);
    this.rebuildResonators(1);

    model.resonatorCountProperty.link((count: number) => {
      this.rebuildResonators(count);
      this.updateSpringAndMass();
    });

    // ===== RULER =====
    this.rulerNode = this.createRulerNode();
    simulationArea.addChild(this.rulerNode);

    this.addChild(simulationArea);

    // ===== CONTROL PANEL (right side) =====
    this.controlPanel = new ResonatorControlPanel(model, this.layoutBounds, this.rulerVisibleProperty);
    this.addChild(this.controlPanel);
    this.addChild(this.controlPanel.comboBoxListParent);

    // Update ruler visibility from the shared property
    this.rulerVisibleProperty.link((visible: boolean) => {
      this.rulerNode.visible = visible;
    });

    // ===== RESET ALL BUTTON =====
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
        this.controlPanel.gravityEnabledProperty.value = model.resonanceModel.gravityProperty.value > 0;
      },
      right: this.layoutBounds.maxX - ResonanceConstants.RESET_ALL_RIGHT_MARGIN,
      bottom: this.layoutBounds.maxY - ResonanceConstants.RESET_ALL_BOTTOM_MARGIN
    });
    this.addChild(resetAllButton);

    // ===== PLAYBACK CONTROLS =====
    const playbackControls = new PlaybackControlNode(model, this.layoutBounds);
    this.addChild(playbackControls);

    // Initial spring/mass update
    this.updateSpringAndMass();
  }

  /**
   * Create the driver plate and connection rod visuals.
   */
  private createDriverPlateAndRod(simulationArea: Node): void {
    const driverPlateWidth = ResonanceConstants.DRIVER_BOX_WIDTH;
    const driverPlateHeight = ResonanceConstants.DRIVER_PLATE_HEIGHT;
    const connectionRodHeight = ResonanceConstants.CONNECTION_ROD_HEIGHT;

    // Connection rod between control box and plate
    this.connectionRod = new Rectangle(0, 0, ResonanceConstants.CONNECTION_ROD_WIDTH, connectionRodHeight, {
      fill: ResonanceColors.driverFillProperty,
      stroke: ResonanceColors.driverStrokeProperty,
      lineWidth: ResonanceConstants.DRIVER_BOX_LINE_WIDTH,
      cornerRadius: ResonanceConstants.CONNECTION_ROD_CORNER_RADIUS
    });
    this.connectionRod.centerX = this.driverNode.centerX;
    this.connectionRod.bottom = this.driverNode.top;
    simulationArea.addChild(this.connectionRod);

    // Driver plate
    this.driverPlate = new Rectangle(0, 0, driverPlateWidth, driverPlateHeight, {
      fill: ResonanceColors.driverFillProperty,
      stroke: ResonanceColors.driverStrokeProperty,
      lineWidth: ResonanceConstants.DRIVER_BOX_LINE_WIDTH,
      cornerRadius: ResonanceConstants.DRIVER_PLATE_CORNER_RADIUS
    });
    this.driverPlate.centerX = this.driverNode.centerX;
    this.driverPlate.y = this.driverNode.top - ResonanceConstants.DRIVER_PLATE_VERTICAL_OFFSET;
    simulationArea.addChild(this.driverPlate);
  }

  /**
   * Create and configure the ruler node with drag handling.
   */
  private createRulerNode(): RulerNode {
    const rulerLabels = ['0', '10', '20', '30', '40', '50'];
    const rulerNode = new RulerNode(
      ResonanceConstants.RULER_WIDTH,
      ResonanceConstants.RULER_HEIGHT,
      ResonanceConstants.RULER_MAJOR_TICK_WIDTH,
      rulerLabels, ResonanceStrings.units.cmStringProperty.value, {
        minorTicksPerMajorTick: ResonanceConstants.RULER_MINOR_TICKS_PER_MAJOR,
        insetsWidth: ResonanceConstants.RULER_INSETS_WIDTH
      });

    rulerNode.rotation = -Math.PI / 2;

    // Position from model coordinates
    this.rulerPositionProperty.link((modelPosition: Vector2) => {
      const viewX = this.modelViewTransform.modelToViewX(modelPosition.x);
      const viewY = this.modelViewTransform.modelToViewY(modelPosition.y);
      rulerNode.centerX = viewX;
      rulerNode.centerY = viewY;
    });

    rulerNode.visible = false;

    // Drag handling
    const rulerModelBounds = this.modelViewTransform.viewToModelBounds(this.layoutBounds);
    const rulerWidthModel = this.modelViewTransform.viewToModelDeltaX(ResonanceConstants.RULER_HEIGHT);
    const rulerHeightModel = Math.abs(this.modelViewTransform.viewToModelDeltaY(ResonanceConstants.RULER_WIDTH));

    const dragBounds = new Bounds2(
      rulerModelBounds.minX,
      rulerModelBounds.minY + rulerHeightModel / 2,
      rulerModelBounds.maxX - rulerWidthModel,
      rulerModelBounds.maxY
    );

    const dragListener = new DragListener({
      targetNode: rulerNode,
      positionProperty: this.rulerPositionProperty,
      transform: this.modelViewTransform,
      useParentOffset: true,
      dragBoundsProperty: new Property(dragBounds)
    });
    rulerNode.addInputListener(dragListener);
    rulerNode.cursor = 'move';

    return rulerNode;
  }

  /**
   * Calculate mass box size based on mass value using surface area scaling.
   * Surface area scales linearly with mass, so side length scales with √mass.
   */
  private calculateMassSize(mass: number): number {
    const minMass = ResonanceConstants.MASS_RANGE.min;
    const maxMass = ResonanceConstants.MASS_RANGE.max;
    const minSize = ResonanceConstants.MIN_MASS_SIZE;
    const maxSize = ResonanceConstants.MAX_MASS_SIZE;

    // Surface area scaling: side = minSize + (maxSize - minSize) × √((mass - minMass) / (maxMass - minMass))
    const normalizedMass = (mass - minMass) / (maxMass - minMass);
    const size = minSize + (maxSize - minSize) * Math.sqrt(normalizedMass);

    return size;
  }

  /**
   * Rebuild the visual resonator nodes (springs + masses) for a given count.
   */
  private rebuildResonators(count: number): void {
    this.resonatorsContainer.removeAllChildren();
    this.springNodes = [];
    this.massNodes = [];

    for (let i = 0; i < count; i++) {
      const oscillatorModel = this.model.oscillatorModels[i];

      // Spring node
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
        rotation: -Math.PI / 2,
        boundsMethod: 'none'
      });

      // Line width varies with spring constant
      oscillatorModel.springConstantProperty.link((springConstant: number) => {
        const minK = ResonanceConstants.SPRING_CONSTANT_RANGE.min;
        const maxK = ResonanceConstants.SPRING_CONSTANT_RANGE.max;
        const normalizedK = (springConstant - minK) / (maxK - minK);
        const lineWidth = ResonanceConstants.SPRING_LINE_WIDTH_MIN + normalizedK * (ResonanceConstants.SPRING_LINE_WIDTH_MAX - ResonanceConstants.SPRING_LINE_WIDTH_MIN);
        springNode.lineWidthProperty.value = lineWidth;
      });

      this.resonatorsContainer.addChild(springNode);
      this.springNodes.push(springNode);

      // Mass node with dynamic sizing based on mass
      const massNode = new Node();
      const initialMassSize = this.calculateMassSize(oscillatorModel.massProperty.value);
      const massBox = new Rectangle(0, 0, initialMassSize, initialMassSize, {
        fill: ResonanceColors.massProperty,
        stroke: ResonanceColors.massStrokeProperty,
        lineWidth: ResonanceConstants.MASS_STROKE_LINE_WIDTH,
        cornerRadius: 3
      });
      const massLabel = new Text(`${i + 1}`, {
        font: new PhetFont( { size: Math.max( ResonanceConstants.MASS_LABEL_FONT_SIZE_MIN, ResonanceConstants.MASS_LABEL_FONT_SIZE_BASE - count * 2 ), weight: 'bold' } ),
        fill: ResonanceColors.massLabelProperty,
        center: massBox.center
      });
      massNode.addChild(massBox);
      massNode.addChild(massLabel);

      // Update mass box size when mass changes
      oscillatorModel.massProperty.link((mass: number) => {
        const newSize = this.calculateMassSize(mass);
        massBox.setRect(0, 0, newSize, newSize);
        massLabel.center = massBox.center;
      });

      // Add vertical drag listener using positionProperty
      massNode.cursor = 'ns-resize';

      // Create a Vector2Property for dragging that stays synchronized with the oscillator's position
      const massPositionProperty = new Vector2Property(new Vector2(0, 0));

      // Flag to prevent circular updates
      let updatingPosition = false;

      // Bidirectional sync: model position -> view position
      oscillatorModel.positionProperty.link((modelPosition: number) => {
        if (updatingPosition) return;

        updatingPosition = true;
        const naturalLength = oscillatorModel.naturalLengthProperty.value;
        const naturalLengthView = Math.abs(this.modelViewTransform.modelToViewDeltaY(naturalLength));
        const driverTopY = this.driverPlate.top;
        const equilibriumY = driverTopY - naturalLengthView;
        const viewYOffset = this.modelViewTransform.modelToViewDeltaY(modelPosition);
        const junctionY = equilibriumY - viewYOffset;
        const massCenterY = junctionY - ResonanceConstants.MASS_CENTER_OFFSET;

        // Keep x fixed, only update y
        massPositionProperty.value = new Vector2(massPositionProperty.value.x, massCenterY);
        updatingPosition = false;
      });

      // View position -> model position
      massPositionProperty.lazyLink((viewPosition: Vector2) => {
        if (updatingPosition) return;

        updatingPosition = true;
        const massCenterY = viewPosition.y;
        const junctionY = massCenterY + ResonanceConstants.MASS_CENTER_OFFSET;

        const naturalLength = oscillatorModel.naturalLengthProperty.value;
        const naturalLengthView = Math.abs(this.modelViewTransform.modelToViewDeltaY(naturalLength));
        const driverTopY = this.driverPlate.top;
        const equilibriumY = driverTopY - naturalLengthView;
        const viewYOffset = equilibriumY - junctionY;
        const modelPosition = this.modelViewTransform.viewToModelDeltaY(viewYOffset);

        oscillatorModel.positionProperty.value = modelPosition;
        oscillatorModel.velocityProperty.value = 0;
        oscillatorModel.isPlayingProperty.value = false;
        updatingPosition = false;
      });

      const dragListener = new DragListener({
        targetNode: massNode,
        positionProperty: massPositionProperty,
        dragBoundsProperty: new Property(this.layoutBounds)
      });
      massNode.addInputListener(dragListener);

      this.resonatorsContainer.addChild(massNode);
      this.massNodes.push(massNode);
    }
  }

  /**
   * Update spring and mass positions each frame.
   */
  private updateSpringAndMass(): void {
    const count = this.springNodes.length;
    if (count === 0) {
      return;
    }

    // Update driver plate position based on driving force
    const driverModel = this.model.resonanceModel;
    if (driverModel.drivingEnabledProperty.value) {
      const phase = driverModel.drivingPhaseProperty.value;
      const drivingAmplitude = driverModel.drivingAmplitudeProperty.value;
      const amplitudeViewDisplacement = Math.abs(this.modelViewTransform.modelToViewDeltaY(drivingAmplitude));
      const viewDisplacement = amplitudeViewDisplacement * Math.sin(phase);

      const driverPlateBaseY = this.driverNode.top - ResonanceConstants.DRIVER_PLATE_VERTICAL_OFFSET;
      this.driverPlate.y = driverPlateBaseY + viewDisplacement;

      const rodHeight = Math.max(ResonanceConstants.CONNECTION_ROD_MIN_HEIGHT, ResonanceConstants.CONNECTION_ROD_HEIGHT - viewDisplacement);
      this.connectionRod.setRect(0, 0, ResonanceConstants.CONNECTION_ROD_WIDTH, rodHeight);
      this.connectionRod.bottom = this.driverNode.top;
    } else {
      const driverPlateBaseY = this.driverNode.top - ResonanceConstants.DRIVER_PLATE_VERTICAL_OFFSET;
      this.driverPlate.y = driverPlateBaseY;

      this.connectionRod.setRect(0, 0, ResonanceConstants.CONNECTION_ROD_WIDTH, ResonanceConstants.CONNECTION_ROD_HEIGHT);
      this.connectionRod.bottom = this.driverNode.top;
    }

    // Position springs and masses
    const driverTopY = this.driverPlate.top;
    const driverCenterX = this.driverPlate.centerX;
    const spacing = ResonanceConstants.DRIVER_BOX_WIDTH / (count + 1);

    const naturalLength = this.model.resonanceModel.naturalLengthProperty.value;
    const naturalLengthView = Math.abs(this.modelViewTransform.modelToViewDeltaY(naturalLength));
    const equilibriumY = driverTopY - naturalLengthView;

    const endLengths = ResonanceConstants.SPRING_LEFT_END_LENGTH + ResonanceConstants.SPRING_RIGHT_END_LENGTH;
    const loopsTimesRadius = ResonanceConstants.SPRING_LOOPS * ResonanceConstants.SPRING_RADIUS;

    for (let i = 0; i < count; i++) {
      const xCenter = driverCenterX - ResonanceConstants.DRIVER_BOX_WIDTH / 2 + spacing * (i + 1);

      const oscillatorModel = this.model.oscillatorModels[i];
      const modelY = oscillatorModel.positionProperty.value;
      const viewYOffset = this.modelViewTransform.modelToViewDeltaY(modelY);

      const junctionY = equilibriumY - viewYOffset;
      const massCenterY = junctionY - ResonanceConstants.MASS_CENTER_OFFSET;

      this.massNodes[i].centerX = xCenter;
      this.massNodes[i].centerY = massCenterY;

      const springStartY = driverTopY;
      const springEndY = junctionY;
      const springLength = Math.abs(springEndY - springStartY);

      const xScale = Math.max(
        ResonanceConstants.MIN_SPRING_XSCALE,
        (springLength - endLengths - 2 * ResonanceConstants.SPRING_RADIUS) / loopsTimesRadius
      );

      const springNode = this.springNodes[i];
      springNode.xScaleProperty.value = xScale;
      springNode.rotation = springEndY < springStartY ? -Math.PI / 2 : Math.PI / 2;
      springNode.x = xCenter;
      springNode.y = springStartY;
    }
  }

  public reset(): void {
    this.rulerVisibleProperty.reset();
    this.rulerPositionProperty.reset();
    this.controlPanel.reset();
  }

  public step(dt: number): void {
    // Step the physics model first
    this.model.step(dt);

    // Then update the visual representation
    this.updateSpringAndMass();
  }
}
