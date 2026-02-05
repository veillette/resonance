/**
 * BaseOscillatorScreenView is the shared view for oscillator-based screens.
 * It provides the common UI elements for:
 * - Single Oscillator
 * - Multiple Oscillators
 * - Phase Analysis
 *
 * This includes:
 * - Driver plate and connection rod
 * - Measurement lines
 * - Resonators (springs + masses)
 * - Control panel
 * - Reset button
 * - Playback controls
 * - Ruler
 */

import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { Utterance } from "scenerystack/utterance-queue";
import { utteranceQueue } from "../util/utteranceQueue.js";
import { BaseOscillatorScreenModel } from "../model/BaseOscillatorScreenModel.js";
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
import ResonanceColors from "../ResonanceColors.js";
import ResonanceConstants from "../ResonanceConstants.js";
import { Property } from "scenerystack/axon";
import { OscillatorDriverControlNode } from "./OscillatorDriverControlNode.js";
import { OscillatorControlPanel } from "./OscillatorControlPanel.js";
import { OscillatorPlaybackControlNode } from "./OscillatorPlaybackControlNode.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import { OscillatorResonatorNodeBuilder } from "./OscillatorResonatorNodeBuilder.js";
import { OscillatorMeasurementLinesNode } from "./OscillatorMeasurementLinesNode.js";

export class BaseOscillatorScreenView extends ScreenView {
  protected readonly model: BaseOscillatorScreenModel;
  protected readonly modelViewTransform: ModelViewTransform2;
  protected readonly resonatorsContainer: Node;
  protected springNodes: ParametricSpringNode[] = [];
  protected massNodes: Node[] = [];
  protected readonly rulerNode: RulerNode;
  protected readonly rulerVisibleProperty: Property<boolean>;
  protected readonly rulerPositionProperty: Vector2Property;
  protected readonly measurementLinesNode: OscillatorMeasurementLinesNode;
  protected readonly controlPanel: OscillatorControlPanel;
  protected readonly driverNode: OscillatorDriverControlNode;
  protected driverPlate!: Rectangle;
  protected connectionRod!: Rectangle;

  public constructor(
    model: BaseOscillatorScreenModel,
    options?: ScreenViewOptions,
  ) {
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
    this.driverNode = new OscillatorDriverControlNode(model);
    this.driverNode.centerX =
      this.layoutBounds.centerX + ResonanceConstants.DRIVER_CENTER_X_OFFSET;
    this.driverNode.bottom =
      this.layoutBounds.bottom - ResonanceConstants.DRIVER_BOTTOM_MARGIN;
    simulationArea.addChild(this.driverNode);

    // ===== DRIVER PLATE & CONNECTION ROD =====
    this.createDriverPlateAndRod(simulationArea);

    // ===== MEASUREMENT LINES =====
    // Must be created before resonators since measurement lines appear behind them
    const naturalLength = this.model.resonanceModel.naturalLengthProperty.value;
    this.measurementLinesNode = new OscillatorMeasurementLinesNode(
      this.driverPlate.centerX,
      this.driverPlate.top,
      ResonanceConstants.DRIVER_BOX_WIDTH,
      naturalLength,
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
    this.controlPanel = new OscillatorControlPanel(
      model,
      this.layoutBounds,
      this.rulerVisibleProperty,
      { singleOscillatorMode: model.singleOscillatorMode },
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
    const playbackControls = new OscillatorPlaybackControlNode(
      model,
      this.layoutBounds,
    );
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

    // Set up accessibility alerts
    this.setupAccessibilityAlerts();

    // Initial spring/mass update
    this.updateSpringAndMass();
  }

  /**
   * Set up screen reader alerts for important state changes.
   */
  protected setupAccessibilityAlerts(): void {
    // Get alert string properties (with type assertion to work around deeply nested type inference)
    const alerts = ResonanceStrings.a11y.alerts as unknown as {
      simulationPlayingStringProperty: { value: string };
      simulationPausedStringProperty: { value: string };
      gravityOnStringProperty: { value: string };
      gravityOffStringProperty: { value: string };
      resonatorCountStringProperty: { value: string };
    };

    // Announce play/pause state changes
    this.model.isPlayingProperty.lazyLink((isPlaying: boolean) => {
      const alertString = isPlaying
        ? alerts.simulationPlayingStringProperty.value
        : alerts.simulationPausedStringProperty.value;
      utteranceQueue.addToBack(
        new Utterance({
          alert: alertString,
          priority: Utterance.LOW_PRIORITY,
        }),
      );
    });

    // Announce gravity toggle
    this.model.resonanceModel.gravityProperty.lazyLink((gravity: number) => {
      const alertString =
        gravity > 0
          ? alerts.gravityOnStringProperty.value
          : alerts.gravityOffStringProperty.value;
      utteranceQueue.addToBack(
        new Utterance({
          alert: alertString,
          priority: Utterance.LOW_PRIORITY,
        }),
      );
    });

    // Announce resonator count changes (only for multi-oscillator screens)
    if (!this.model.singleOscillatorMode) {
      this.model.resonatorCountProperty.lazyLink((count: number) => {
        const alertString = alerts.resonatorCountStringProperty.value.replace(
          "{{count}}",
          String(count),
        );
        utteranceQueue.addToBack(
          new Utterance({
            alert: alertString,
            priority: Utterance.LOW_PRIORITY,
          }),
        );
      });
    }
  }

  /**
   * Create the driver plate and connection rod visuals.
   */
  protected createDriverPlateAndRod(simulationArea: Node): void {
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
  protected createRulerNode(): RulerNode {
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
  protected createAllResonators(): void {
    const context = {
      modelViewTransform: this.modelViewTransform,
      layoutBounds: this.layoutBounds,
      driverPlate: this.driverPlate,
      selectedResonatorIndexProperty: this.model.selectedResonatorIndexProperty,
    };

    const result = OscillatorResonatorNodeBuilder.buildResonators(
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
  protected updateResonatorVisibility(count: number): void {
    for (let i = 0; i < this.springNodes.length; i++) {
      const visible = i < count;
      this.springNodes[i]!.visible = visible;
      this.massNodes[i]!.visible = visible;
    }
  }

  /**
   * Update spring and mass positions each frame.
   * Uses model coordinates for computing positions, then converts to view.
   */
  protected updateSpringAndMass(): void {
    const count = this.model.resonatorCountProperty.value;
    if (count === 0) {
      return;
    }

    // Get driver model parameters
    const driverModel = this.model.resonanceModel;
    const phase = driverModel.drivingPhaseProperty.value;
    const drivingAmplitude = driverModel.drivingAmplitudeProperty.value;
    const naturalLength = driverModel.naturalLengthProperty.value;

    // Compute driver plate displacement in MODEL coordinates
    // driverPlateDisplacementModel: positive = upward in model
    let driverPlateDisplacementModel = 0;
    if (driverModel.drivingEnabledProperty.value) {
      // Driver oscillates: A * sin(phase) in model coordinates
      driverPlateDisplacementModel = drivingAmplitude * Math.sin(phase);
    }

    // Convert driver displacement to VIEW coordinates for plate positioning
    const driverPlateBaseY =
      this.driverNode.top - ResonanceConstants.DRIVER_PLATE_VERTICAL_OFFSET;
    // Note: positive model displacement = upward = negative view Y change
    const viewDisplacement = this.modelViewTransform.modelToViewDeltaY(
      driverPlateDisplacementModel,
    );
    this.driverPlate.y = driverPlateBaseY - viewDisplacement;

    // Update connection rod
    const rodHeight = Math.max(
      ResonanceConstants.CONNECTION_ROD_MIN_HEIGHT,
      ResonanceConstants.CONNECTION_ROD_HEIGHT + viewDisplacement,
    );
    this.connectionRod.setRect(
      0,
      0,
      ResonanceConstants.CONNECTION_ROD_WIDTH,
      rodHeight,
    );
    this.connectionRod.bottom = this.driverNode.top;

    // Note: Measurement lines stay fixed relative to driver plate rest position
    // They do not move with the oscillating driver plate

    // Position springs and masses (only visible ones need positioning)
    const driverCenterX = this.driverPlate.centerX;
    const spacing = ResonanceConstants.DRIVER_BOX_WIDTH / (count + 1);

    // Convert spring end lengths from model to view coordinates
    const leftEndLengthView = Math.abs(
      this.modelViewTransform.modelToViewDeltaY(
        ResonanceConstants.SPRING_LEFT_END_LENGTH_MODEL,
      ),
    );
    const rightEndLengthView = Math.abs(
      this.modelViewTransform.modelToViewDeltaY(
        ResonanceConstants.SPRING_RIGHT_END_LENGTH_MODEL,
      ),
    );
    const endLengths = leftEndLengthView + rightEndLengthView;

    for (let i = 0; i < count; i++) {
      const xCenter =
        driverCenterX -
        ResonanceConstants.DRIVER_BOX_WIDTH / 2 +
        spacing * (i + 1);

      const resonatorModel = this.model.getResonatorModel(i);

      // MASS POSITION in model coordinates:
      // positionProperty.value = displacement from equilibrium (natural length from rest driver)
      // Positive = mass displaced downward in model (stretched spring)
      const massDisplacementModel = resonatorModel.positionProperty.value;

      // SPRING ENDPOINTS in model coordinates:
      // Driver plate top (spring attachment point): driverPlateDisplacementModel from rest
      // Mass bottom (spring attachment point): at naturalLength + massDisplacement from driver rest position
      //
      // In model coordinates (positive = upward):
      // - Driver plate top at: driverPlateDisplacementModel (relative to rest)
      // - Mass bottom at: naturalLength + massDisplacementModel (relative to rest driver position)
      //
      // Spring length in model = distance between these points:
      const springLengthModel =
        naturalLength + massDisplacementModel - driverPlateDisplacementModel;

      // Convert to VIEW coordinates for rendering
      // Driver plate top position in view
      const driverTopY = this.driverPlate.top;

      // Mass bottom position in view: driver top - spring length (spring extends upward in view)
      const springLengthView = Math.abs(
        this.modelViewTransform.modelToViewDeltaY(springLengthModel),
      );
      const massBottomY = driverTopY - springLengthView;

      // Position mass node (local origin is at bottom of mass box)
      this.massNodes[i]!.x = xCenter;
      this.massNodes[i]!.y = massBottomY;

      // Configure spring to connect driver plate top to mass bottom
      const springNode = this.springNodes[i]!;
      const springRadius = springNode.radiusProperty.value;
      const loopsTimesRadius = ResonanceConstants.SPRING_LOOPS * springRadius;

      // Calculate xScale to make spring fill the visual distance
      const xScale = Math.max(
        ResonanceConstants.MIN_SPRING_XSCALE,
        (springLengthView - endLengths - 2 * springRadius) / loopsTimesRadius,
      );

      springNode.xScaleProperty.value = xScale;
      // Spring extends upward from driver plate to mass
      springNode.rotation = -Math.PI / 2;
      springNode.x = xCenter;
      springNode.y = driverTopY; // Start at driver plate top
    }
  }

  public reset(): void {
    this.rulerVisibleProperty.reset();
    this.rulerPositionProperty.reset();
    this.measurementLinesNode.reset();
    this.controlPanel.reset();
  }

  public step(_dt: number): void {
    // Note: model.step(dt) is called by the Screen base class, not here
    // to avoid double-stepping

    // Update the visual representation
    this.updateSpringAndMass();
  }
}
