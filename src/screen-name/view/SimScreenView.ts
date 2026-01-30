import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { SimModel } from "../model/SimModel.js";
import {
  ResetAllButton,
  RulerNode,
  ParametricSpringNode,
} from "scenerystack/scenery-phet";
import { Rectangle, Node } from "scenerystack/scenery";
import { DragListener, KeyboardDragListener } from "scenerystack/scenery";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Vector2Property } from "scenerystack/dot";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { Property } from "scenerystack/axon";
import { DriverControlNode } from "./DriverControlNode.js";
import { ResonatorControlPanel } from "./ResonatorControlPanel.js";
import { PlaybackControlNode } from "./PlaybackControlNode.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import { ResonatorNodeBuilder } from "./ResonatorNodeBuilder.js";
import { MeasurementLinesNode } from "./MeasurementLinesNode.js";

export class SimScreenView extends ScreenView {
  private readonly model: SimModel;
  private readonly modelViewTransform: ModelViewTransform2;
  private readonly resonatorsContainer: Node;
  private springNodes: ParametricSpringNode[] = [];
  private massNodes: Node[] = [];
  private readonly rulerNode: RulerNode;
  private readonly rulerVisibleProperty: Property<boolean>;
  private readonly rulerPositionProperty: Vector2Property;
  private readonly measurementLinesNode: MeasurementLinesNode;
  private readonly controlPanel: ResonatorControlPanel;
  private readonly driverNode: DriverControlNode;
  private driverPlate!: Rectangle;
  private connectionRod!: Rectangle;

  public constructor(model: SimModel, options?: ScreenViewOptions) {
    super(options);

    this.model = model;

    // Initialize ModelViewTransform with inverted Y axis
    // This makes positive Y in model = upward on screen (natural physics convention)
    const transformModelBounds = new Bounds2(
      ResonanceConstants.MODEL_BOUNDS_MIN,
      ResonanceConstants.MODEL_BOUNDS_MIN,
      ResonanceConstants.MODEL_BOUNDS_MAX,
      ResonanceConstants.MODEL_BOUNDS_MAX,
    );
    const viewBounds = this.layoutBounds;
    this.modelViewTransform =
      ModelViewTransform2.createRectangleInvertedYMapping(
        transformModelBounds,
        viewBounds,
      );

    // Initialize ruler properties
    this.rulerVisibleProperty = new Property<boolean>(false);
    const initialViewX =
      this.layoutBounds.left + ResonanceConstants.RULER_LEFT_MARGIN;
    const initialViewY =
      this.layoutBounds.top + ResonanceConstants.RULER_TOP_MARGIN;
    const initialModelX = this.modelViewTransform.viewToModelX(initialViewX);
    const initialModelY = this.modelViewTransform.viewToModelY(initialViewY);
    this.rulerPositionProperty = new Vector2Property(
      new Vector2(initialModelX, initialModelY),
    );

    // Create simulation area container
    const simulationArea = new Node();

    // ===== DRIVER CONTROL BOX =====
    this.driverNode = new DriverControlNode(model);
    this.driverNode.centerX =
      this.layoutBounds.centerX + ResonanceConstants.DRIVER_CENTER_X_OFFSET;
    this.driverNode.bottom =
      this.layoutBounds.bottom - ResonanceConstants.DRIVER_BOTTOM_MARGIN;
    simulationArea.addChild(this.driverNode);

    // ===== DRIVER PLATE & CONNECTION ROD =====
    this.createDriverPlateAndRod(simulationArea);

    // ===== MEASUREMENT LINES =====
    // Must be created before resonators since measurement lines appear behind them
    this.measurementLinesNode = new MeasurementLinesNode(
      this.driverPlate.centerX,
      this.driverPlate.top,
      ResonanceConstants.DRIVER_BOX_WIDTH,
      this.modelViewTransform,
      this.layoutBounds,
    );
    this.measurementLinesNode.visible = false;
    simulationArea.addChild(this.measurementLinesNode);

    // ===== RESONATORS (springs + masses) =====
    // Create all resonator nodes once - visibility controlled by count
    this.resonatorsContainer = new Node();
    simulationArea.addChild(this.resonatorsContainer);
    this.createAllResonators();

    // Update visibility when resonator count changes
    model.resonatorCountProperty.link((count: number) => {
      this.updateResonatorVisibility(count);
      this.updateSpringAndMass();
    });

    this.addChild(simulationArea);

    // ===== CONTROL PANEL (right side) =====
    this.controlPanel = new ResonatorControlPanel(
      model,
      this.layoutBounds,
      this.rulerVisibleProperty,
    );
    this.addChild(this.controlPanel);
    this.addChild(this.controlPanel.comboBoxListParent);

    // ===== RESET ALL BUTTON =====
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
        this.controlPanel.gravityEnabledProperty.value =
          model.resonanceModel.gravityProperty.value > 0;
      },
      right: this.layoutBounds.maxX - ResonanceConstants.RESET_ALL_RIGHT_MARGIN,
      bottom:
        this.layoutBounds.maxY - ResonanceConstants.RESET_ALL_BOTTOM_MARGIN,
    });
    this.addChild(resetAllButton);

    // ===== PLAYBACK CONTROLS =====
    const playbackControls = new PlaybackControlNode(model, this.layoutBounds);
    this.addChild(playbackControls);

    // ===== RULER =====
    // Added last so it appears on top of control panel and playback controls when dragged
    this.rulerNode = this.createRulerNode();
    this.addChild(this.rulerNode);

    // Update ruler and measurement lines visibility from the shared property
    this.rulerVisibleProperty.link((visible: boolean) => {
      this.rulerNode.visible = visible;
      this.measurementLinesNode.visible = visible;
    });

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
    this.connectionRod = new Rectangle(
      0,
      0,
      ResonanceConstants.CONNECTION_ROD_WIDTH,
      connectionRodHeight,
      {
        fill: ResonanceColors.driverFillProperty,
        stroke: ResonanceColors.driverStrokeProperty,
        lineWidth: ResonanceConstants.DRIVER_BOX_LINE_WIDTH,
        cornerRadius: ResonanceConstants.CONNECTION_ROD_CORNER_RADIUS,
      },
    );
    this.connectionRod.centerX = this.driverNode.centerX;
    this.connectionRod.bottom = this.driverNode.top;
    simulationArea.addChild(this.connectionRod);

    // Driver plate
    this.driverPlate = new Rectangle(
      0,
      0,
      driverPlateWidth,
      driverPlateHeight,
      {
        fill: ResonanceColors.driverFillProperty,
        stroke: ResonanceColors.driverStrokeProperty,
        lineWidth: ResonanceConstants.DRIVER_BOX_LINE_WIDTH,
        cornerRadius: ResonanceConstants.DRIVER_PLATE_CORNER_RADIUS,
      },
    );
    this.driverPlate.centerX = this.driverNode.centerX;
    this.driverPlate.y =
      this.driverNode.top - ResonanceConstants.DRIVER_PLATE_VERTICAL_OFFSET;
    simulationArea.addChild(this.driverPlate);
  }

  /**
   * Create and configure the ruler node with drag handling.
   * The ruler uses model-based dimensions converted to view coordinates.
   */
  private createRulerNode(): RulerNode {
    // Generate labels: 0, 5, 10, 15, ..., 50 (cm)
    const rulerLabels: string[] = [];
    for (let i = 0; i < ResonanceConstants.RULER_NUM_MAJOR_TICKS; i++) {
      rulerLabels.push(String(i * 5));
    }

    // Convert ruler length from model (meters) to view pixels
    const rulerLengthView = Math.abs(
      this.modelViewTransform.modelToViewDeltaY(
        ResonanceConstants.RULER_LENGTH_MODEL,
      ),
    );

    // Major tick spacing: ruler length / (num ticks - 1)
    const majorTickWidth =
      rulerLengthView / (ResonanceConstants.RULER_NUM_MAJOR_TICKS - 1);

    const rulerNode = new RulerNode(
      rulerLengthView,
      ResonanceConstants.RULER_THICKNESS_VIEW,
      majorTickWidth,
      rulerLabels,
      ResonanceStrings.units.cmStringProperty.value,
      {
        minorTicksPerMajorTick: ResonanceConstants.RULER_MINOR_TICKS_PER_MAJOR,
        insetsWidth: ResonanceConstants.RULER_INSETS_WIDTH,
      },
    );

    rulerNode.rotation = -Math.PI / 2;

    // Position from model coordinates
    this.rulerPositionProperty.link((modelPosition: Vector2) => {
      const viewX = this.modelViewTransform.modelToViewX(modelPosition.x);
      const viewY = this.modelViewTransform.modelToViewY(modelPosition.y);
      rulerNode.centerX = viewX;
      rulerNode.centerY = viewY;
    });

    rulerNode.visible = false;

    // Drag handling - keep ruler within visible bounds so it's always grabbable
    // The ruler is rotated, so its "width" in view is actually its thickness,
    // and its "height" in view is its length
    const margin = 20; // Keep at least this many pixels visible on each edge
    const rulerThickness = ResonanceConstants.RULER_THICKNESS_VIEW;

    const dragBounds = new Bounds2(
      this.layoutBounds.minX + margin,
      this.layoutBounds.minY + rulerLengthView / 2 + margin,
      this.layoutBounds.maxX - rulerThickness - margin,
      this.layoutBounds.maxY - rulerLengthView / 2 - margin,
    );

    // Convert to model bounds for the drag listener
    const dragBoundsModel =
      this.modelViewTransform.viewToModelBounds(dragBounds);

    const dragListener = new DragListener({
      targetNode: rulerNode,
      positionProperty: this.rulerPositionProperty,
      transform: this.modelViewTransform,
      useParentOffset: true,
      dragBoundsProperty: new Property(dragBoundsModel),
    });
    rulerNode.addInputListener(dragListener);
    rulerNode.cursor = "move";

    // Make focusable for keyboard navigation
    rulerNode.tagName = "div";
    rulerNode.focusable = true;
    rulerNode.accessibleName = "Ruler";

    // KeyboardDragListener for keyboard navigation
    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: this.rulerPositionProperty,
      transform: this.modelViewTransform,
      dragBoundsProperty: new Property(dragBoundsModel),
      dragSpeed: 150, // pixels per second
      shiftDragSpeed: 50, // slower with shift key
    });
    rulerNode.addInputListener(keyboardDragListener);

    return rulerNode;
  }

  /**
   * Create all resonator nodes (springs + masses) once at startup.
   * All MAX_RESONATORS are created; visibility is controlled by count.
   */
  private createAllResonators(): void {
    const context = {
      modelViewTransform: this.modelViewTransform,
      layoutBounds: this.layoutBounds,
      driverPlate: this.driverPlate,
      selectedResonatorIndexProperty: this.model.selectedResonatorIndexProperty,
    };

    const result = ResonatorNodeBuilder.buildResonators(
      this.model.resonatorModels,
      context,
    );

    this.springNodes = result.springNodes;
    this.massNodes = result.massNodes;

    // Add all nodes to container
    for (const springNode of this.springNodes) {
      this.resonatorsContainer.addChild(springNode);
    }
    for (const massNode of this.massNodes) {
      this.resonatorsContainer.addChild(massNode);
    }

    // Set initial visibility based on current count
    this.updateResonatorVisibility(this.model.resonatorCountProperty.value);
  }

  /**
   * Update visibility of resonator nodes based on the current count.
   */
  private updateResonatorVisibility(count: number): void {
    for (let i = 0; i < this.springNodes.length; i++) {
      const visible = i < count;
      this.springNodes[i].visible = visible;
      this.massNodes[i].visible = visible;
    }
  }

  /**
   * Update spring and mass positions each frame.
   */
  private updateSpringAndMass(): void {
    const count = this.model.resonatorCountProperty.value;
    if (count === 0) {
      return;
    }

    // Update driver plate position based on driving force
    const driverModel = this.model.resonanceModel;
    if (driverModel.drivingEnabledProperty.value) {
      const phase = driverModel.drivingPhaseProperty.value;
      const drivingAmplitude = driverModel.drivingAmplitudeProperty.value;
      const amplitudeViewDisplacement = Math.abs(
        this.modelViewTransform.modelToViewDeltaY(drivingAmplitude),
      );
      const viewDisplacement = amplitudeViewDisplacement * Math.sin(phase);

      const driverPlateBaseY =
        this.driverNode.top - ResonanceConstants.DRIVER_PLATE_VERTICAL_OFFSET;
      this.driverPlate.y = driverPlateBaseY + viewDisplacement;

      const rodHeight = Math.max(
        ResonanceConstants.CONNECTION_ROD_MIN_HEIGHT,
        ResonanceConstants.CONNECTION_ROD_HEIGHT - viewDisplacement,
      );
      this.connectionRod.setRect(
        0,
        0,
        ResonanceConstants.CONNECTION_ROD_WIDTH,
        rodHeight,
      );
      this.connectionRod.bottom = this.driverNode.top;
    } else {
      const driverPlateBaseY =
        this.driverNode.top - ResonanceConstants.DRIVER_PLATE_VERTICAL_OFFSET;
      this.driverPlate.y = driverPlateBaseY;

      this.connectionRod.setRect(
        0,
        0,
        ResonanceConstants.CONNECTION_ROD_WIDTH,
        ResonanceConstants.CONNECTION_ROD_HEIGHT,
      );
      this.connectionRod.bottom = this.driverNode.top;
    }

    // Note: Measurement lines stay fixed relative to driver plate rest position
    // They do not move with the oscillating driver plate

    // Position springs and masses (only visible ones need positioning)
    const driverTopY = this.driverPlate.top;
    const driverCenterX = this.driverPlate.centerX;
    const spacing = ResonanceConstants.DRIVER_BOX_WIDTH / (count + 1);

    const naturalLength = this.model.resonanceModel.naturalLengthProperty.value;
    const naturalLengthView = Math.abs(
      this.modelViewTransform.modelToViewDeltaY(naturalLength),
    );
    const equilibriumY = driverTopY - naturalLengthView;

    const endLengths =
      ResonanceConstants.SPRING_LEFT_END_LENGTH +
      ResonanceConstants.SPRING_RIGHT_END_LENGTH;

    for (let i = 0; i < count; i++) {
      const xCenter =
        driverCenterX -
        ResonanceConstants.DRIVER_BOX_WIDTH / 2 +
        spacing * (i + 1);

      const resonatorModel = this.model.resonatorModels[i];
      const modelY = resonatorModel.positionProperty.value;
      const viewYOffset = this.modelViewTransform.modelToViewDeltaY(modelY);

      // With inverted Y transform: positive position = upward (spring stretched)
      // modelToViewDeltaY(positive) returns negative, so junctionY decreases (moves up on screen)
      const junctionY = equilibriumY + viewYOffset;
      const massCenterY = junctionY - ResonanceConstants.MASS_CENTER_OFFSET;

      this.massNodes[i].centerX = xCenter;
      this.massNodes[i].centerY = massCenterY;

      const springStartY = driverTopY;
      const springEndY = junctionY;
      const springLength = Math.abs(springEndY - springStartY);

      const springNode = this.springNodes[i];
      // Use the actual radius from this spring node (varies with spring constant)
      const springRadius = springNode.radiusProperty.value;
      const loopsTimesRadius = ResonanceConstants.SPRING_LOOPS * springRadius;

      const xScale = Math.max(
        ResonanceConstants.MIN_SPRING_XSCALE,
        (springLength - endLengths - 2 * springRadius) / loopsTimesRadius,
      );

      springNode.xScaleProperty.value = xScale;
      springNode.rotation =
        springEndY < springStartY ? -Math.PI / 2 : Math.PI / 2;
      springNode.x = xCenter;
      springNode.y = springStartY;
    }
  }

  public reset(): void {
    this.rulerVisibleProperty.reset();
    this.rulerPositionProperty.reset();
    this.measurementLinesNode.reset();
    this.controlPanel.reset();
  }

  public step(dt: number): void {
    // Step the physics model first
    this.model.step(dt);

    // Then update the visual representation
    this.updateSpringAndMass();
  }
}
