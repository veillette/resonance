/**
 * ResonatorControlPanel is the green panel on the right side of the simulation.
 * It contains controls for:
 * - Number of resonators
 * - Resonator configuration mode (combo box)
 * - Selected resonator spinner
 * - Mass and spring constant controls
 * - Natural frequency readout
 * - Damping control
 * - Gravity toggle
 * - Ruler visibility checkbox
 */

import {
  Node,
  Text,
  Line,
  VBox,
  HBox,
  AlignBox,
  VStrut,
} from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import {
  Panel,
  ComboBox,
  Checkbox,
  ToggleSwitch,
  NumberSpinner,
} from "scenerystack/sun";
import type { ComboBoxItem } from "scenerystack/sun";
import { Property, NumberProperty } from "scenerystack/axon";
import { Range, Bounds2, Dimension2 } from "scenerystack/dot";
import { SimModel } from "../model/SimModel.js";
import { ResonatorConfigMode } from "../../common/model/ResonatorConfigMode.js";
import type { ResonatorConfigModeType } from "../../common/model/ResonatorConfigMode.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import { ListenerTracker } from "../../common/util/index.js";

export class ResonatorControlPanel extends Panel {
  /**
   * The combo box list parent node. Must be added to the scene graph above the panel
   * so the popup list renders on top.
   */
  public readonly comboBoxListParent: Node;

  public readonly gravityEnabledProperty: Property<boolean>;
  public readonly rulerVisibleProperty: Property<boolean>;

  private readonly model: SimModel;
  private readonly listenerTracker = new ListenerTracker();

  // Internal display properties for controls
  private readonly displayResonatorNumberProperty: NumberProperty;
  private readonly displayMassProperty: NumberProperty;
  private readonly displaySpringConstantProperty: NumberProperty;

  // Controls that need enabled state updates
  private readonly massControl: NumberControl;
  private readonly springConstantControl: NumberControl;
  private readonly resonatorCountControl: NumberControl;

  // UI containers that toggle visibility
  private readonly configBox: VBox;
  private readonly configBoxStrut: VStrut;
  private readonly resonatorSelectionBox: HBox;

  // Natural frequency text element
  private readonly naturalFrequencyText: Text;

  public constructor(
    model: SimModel,
    layoutBounds: Bounds2,
    rulerVisibleProperty: Property<boolean>,
  ) {
    // Store model reference for use in methods
    const tempModel = model;

    // --- Create all controls using extracted methods ---
    const gravityEnabledProperty =
      ResonatorControlPanel.createGravityProperty(tempModel);

    const resonatorCountControl =
      ResonatorControlPanel.createResonatorCountControl(tempModel);

    const { configBox, comboBoxListParent } =
      ResonatorControlPanel.createConfigurationControls(tempModel);

    // Measure configBox size to create matching strut for layout preservation
    // Add to temporary container to force layout calculation
    const tempContainer = new VBox({ children: [configBox] });
    void tempContainer.localBounds; // Force layout calculation
    const configBoxHeight = configBox.height || configBox.localBounds.height;
    const configBoxStrut = new VStrut(configBoxHeight);
    tempContainer.removeChild(configBox); // Remove from temp container

    // Container that holds both configBox and strut, swapping visibility
    // Use VBox so both participate in layout, but only one is visible at a time
    // The container will size to whichever child is visible
    const configBoxContainer = new VBox({
      children: [configBox, configBoxStrut],
      spacing: 0,
    });
    // Initially show configBox if count > 1, otherwise show strut
    configBox.visible = tempModel.resonatorCountProperty.value > 1;
    configBoxStrut.visible = !configBox.visible;

    const { resonatorSelectionBox, displayResonatorNumberProperty } =
      ResonatorControlPanel.createResonatorSelectionControls(tempModel);

    const {
      massControl,
      springConstantControl,
      displayMassProperty,
      displaySpringConstantProperty,
    } = ResonatorControlPanel.createMassSpringControls(tempModel);

    const { naturalFrequencyText, naturalFrequencyBox } =
      ResonatorControlPanel.createNaturalFrequencyReadout(tempModel);

    const dampingControl =
      ResonatorControlPanel.createDampingControl(tempModel);

    const gravityBox = ResonatorControlPanel.createGravityToggle(
      gravityEnabledProperty,
    );

    const rulerCheckbox =
      ResonatorControlPanel.createRulerCheckbox(rulerVisibleProperty);

    // --- Create sub-panel for mass/spring/resonator/frequency controls ---
    // Use a light blue color to contrast with the green main panel
    const massSpringResonatorSubPanel = new Panel(
      new VBox({
        children: [
          resonatorSelectionBox,
          massControl,
          springConstantControl,
          naturalFrequencyBox,
        ],
        spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
        align: "left",
      }),
      {
        fill: ResonanceColors.subPanelFillProperty,
        stroke: ResonanceColors.subPanelStrokeProperty,
        lineWidth: ResonanceConstants.CONTROL_PANEL_LINE_WIDTH,
        cornerRadius: ResonanceConstants.CONTROL_PANEL_CORNER_RADIUS,
        xMargin: ResonanceConstants.CONTROL_PANEL_X_MARGIN,
        yMargin: ResonanceConstants.CONTROL_PANEL_Y_MARGIN,
      },
    );

    // --- Assemble panel content ---
    const controlPanelContent = new VBox({
      children: [
        resonatorCountControl,
        configBoxContainer, // Container that swaps between configBox and strut
        new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, {
          stroke: ResonanceColors.textProperty,
          lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH,
        }),
        massSpringResonatorSubPanel,
        dampingControl,
        new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, {
          stroke: ResonanceColors.textProperty,
          lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH,
        }),
        gravityBox,
        rulerCheckbox,
      ],
      spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
      align: "left",
    });

    super(controlPanelContent, {
      fill: ResonanceColors.controlPanelFillProperty,
      stroke: ResonanceColors.controlPanelStrokeProperty,
      lineWidth: ResonanceConstants.CONTROL_PANEL_LINE_WIDTH,
      cornerRadius: ResonanceConstants.CONTROL_PANEL_CORNER_RADIUS,
      xMargin: ResonanceConstants.CONTROL_PANEL_X_MARGIN,
      yMargin: ResonanceConstants.CONTROL_PANEL_Y_MARGIN,
      right: layoutBounds.maxX - ResonanceConstants.CONTROL_PANEL_RIGHT_MARGIN,
      top: layoutBounds.minY + ResonanceConstants.CONTROL_PANEL_TOP_MARGIN,
    });

    // Store references for instance methods
    this.model = model;
    this.comboBoxListParent = comboBoxListParent;
    this.gravityEnabledProperty = gravityEnabledProperty;
    this.rulerVisibleProperty = rulerVisibleProperty;
    this.displayResonatorNumberProperty = displayResonatorNumberProperty;
    this.displayMassProperty = displayMassProperty;
    this.displaySpringConstantProperty = displaySpringConstantProperty;
    this.massControl = massControl;
    this.springConstantControl = springConstantControl;
    this.resonatorCountControl = resonatorCountControl;
    this.configBox = configBox;
    this.configBoxStrut = configBoxStrut;
    this.resonatorSelectionBox = resonatorSelectionBox;
    this.naturalFrequencyText = naturalFrequencyText;

    // Setup listeners that need to be tracked for cleanup
    this.setupVisibilityListeners();
    this.setupMassSpringSync();
    this.setupNaturalFrequencySync();
  }

  /**
   * Creates the gravity enabled property that syncs with the model.
   */
  private static createGravityProperty(model: SimModel): Property<boolean> {
    const gravityEnabledProperty = new Property<boolean>(
      model.resonanceModel.gravityProperty.value > 0,
    );
    gravityEnabledProperty.link((enabled: boolean) => {
      model.resonanceModel.gravityProperty.value = enabled
        ? ResonanceConstants.GRAVITY_ACCELERATION
        : 0;
    });
    return gravityEnabledProperty;
  }

  /**
   * Creates the resonator count slider control.
   */
  private static createResonatorCountControl(model: SimModel): NumberControl {
    return new NumberControl(
      ResonanceStrings.controls.resonatorsStringProperty,
      model.resonatorCountProperty,
      ResonanceConstants.RESONATOR_COUNT_RANGE,
      {
        delta: 1,
        numberDisplayOptions: {
          decimalPlaces: 0,
          textOptions: {
            fill: ResonanceColors.preferencesTextProperty,
          },
        },
        titleNodeOptions: {
          fill: ResonanceColors.textProperty,
        },
        sliderOptions: {
          trackSize: new Dimension2(120, 3),
          majorTicks: [
            {
              value: 1,
              label: new Text("1", {
                font: ResonanceConstants.TICK_LABEL_FONT,
                fill: ResonanceColors.textProperty,
              }),
            },
            {
              value: 10,
              label: new Text("10", {
                font: ResonanceConstants.TICK_LABEL_FONT,
                fill: ResonanceColors.textProperty,
              }),
            },
          ],
          minorTickSpacing: 1,
          majorTickStroke: ResonanceColors.textProperty,
          minorTickStroke: ResonanceColors.textProperty,
        },
      },
    );
  }

  /**
   * Creates the resonator configuration combo box and its container.
   */
  private static createConfigurationControls(model: SimModel): {
    configBox: VBox;
    comboBoxListParent: Node;
  } {
    const configLabel = new Text(
      ResonanceStrings.controls.resonatorConfigStringProperty,
      {
        font: ResonanceConstants.LABEL_FONT,
        fill: ResonanceColors.textProperty,
      },
    );

    const comboBoxItems: ComboBoxItem<ResonatorConfigModeType>[] = [
      {
        value: ResonatorConfigMode.SAME_SPRING_CONSTANT,
        createNode: () =>
          new Text(ResonanceStrings.controls.sameSpringConstantStringProperty, {
            font: ResonanceConstants.CONTROL_FONT,
          }),
      },
      {
        value: ResonatorConfigMode.SAME_MASS,
        createNode: () =>
          new Text(ResonanceStrings.controls.sameMassStringProperty, {
            font: ResonanceConstants.CONTROL_FONT,
          }),
      },
      {
        value: ResonatorConfigMode.MIXED,
        createNode: () =>
          new Text(ResonanceStrings.controls.mixedStringProperty, {
            font: ResonanceConstants.CONTROL_FONT,
          }),
      },
      {
        value: ResonatorConfigMode.SAME_FREQUENCY,
        createNode: () =>
          new Text(ResonanceStrings.controls.sameFrequencyStringProperty, {
            font: ResonanceConstants.CONTROL_FONT,
          }),
      },
      {
        value: ResonatorConfigMode.CUSTOM,
        createNode: () =>
          new Text(ResonanceStrings.controls.customStringProperty, {
            font: ResonanceConstants.CONTROL_FONT,
          }),
      },
    ];

    const comboBoxListParent = new Node();

    const configComboBox = new ComboBox(
      model.resonatorConfigProperty,
      comboBoxItems,
      comboBoxListParent,
      {
        xMargin: ResonanceConstants.COMBO_BOX_X_MARGIN,
        yMargin: ResonanceConstants.COMBO_BOX_Y_MARGIN,
        cornerRadius: ResonanceConstants.COMBO_BOX_CORNER_RADIUS,
      },
    );

    const configBox = new VBox({
      children: [configLabel, configComboBox],
      spacing: ResonanceConstants.COMBO_BOX_SPACING,
      align: "left",
    });

    return { configBox, comboBoxListParent };
  }

  /**
   * Creates the resonator selection spinner and label.
   */
  private static createResonatorSelectionControls(model: SimModel): {
    resonatorSelectionBox: HBox;
    displayResonatorNumberProperty: NumberProperty;
  } {
    const displayResonatorNumberProperty = new NumberProperty(1);

    displayResonatorNumberProperty.link((displayNumber: number) => {
      model.selectedResonatorIndexProperty.value = displayNumber - 1;
    });
    model.selectedResonatorIndexProperty.link((index: number) => {
      displayResonatorNumberProperty.value = index + 1;
    });

    const spinnerRangeProperty = new Property(
      new Range(1, model.resonatorCountProperty.value),
    );
    model.resonatorCountProperty.link((count: number) => {
      spinnerRangeProperty.value = new Range(1, count);
    });

    const resonatorSpinner = new NumberSpinner(
      displayResonatorNumberProperty,
      spinnerRangeProperty,
      {
        arrowsPosition: "bothRight",
        arrowsScale: 0.8,
      },
    );

    const resonatorLabel = new Text(
      ResonanceStrings.controls.resonatorStringProperty,
      {
        font: ResonanceConstants.TITLE_FONT,
        fill: ResonanceColors.textProperty,
      },
    );

    const resonatorSelectionBox = new HBox({
      children: [resonatorLabel, resonatorSpinner],
      spacing: 10,
      align: "center",
    });

    return { resonatorSelectionBox, displayResonatorNumberProperty };
  }

  /**
   * Creates the mass and spring constant controls.
   */
  private static createMassSpringControls(model: SimModel): {
    massControl: NumberControl;
    springConstantControl: NumberControl;
    displayMassProperty: NumberProperty;
    displaySpringConstantProperty: NumberProperty;
  } {
    const displayMassProperty = new NumberProperty(
      model.resonanceModel.massProperty.value,
    );
    const displaySpringConstantProperty = new NumberProperty(
      model.resonanceModel.springConstantProperty.value,
    );

    const massControl = new NumberControl(
      ResonanceStrings.controls.massSimpleStringProperty,
      displayMassProperty,
      ResonanceConstants.MASS_RANGE,
      {
        delta: 0.01,
        numberDisplayOptions: {
          valuePattern: ResonanceStrings.units.kgPatternStringProperty,
          decimalPlaces: 2,
          textOptions: {
            fill: ResonanceColors.preferencesTextProperty,
          },
        },
        titleNodeOptions: {
          fill: ResonanceColors.textProperty,
        },
        sliderOptions: {
          trackSize: new Dimension2(120, 3),
          majorTickStroke: ResonanceColors.textProperty,
          minorTickStroke: ResonanceColors.textProperty,
        },
      },
    );

    const springConstantControl = new NumberControl(
      ResonanceStrings.controls.springConstantSimpleStringProperty,
      displaySpringConstantProperty,
      ResonanceConstants.SPRING_CONSTANT_RANGE,
      {
        delta: 1,
        numberDisplayOptions: {
          valuePattern:
            ResonanceStrings.units.newtonPerMeterPatternStringProperty,
          decimalPlaces: 0,
          textOptions: {
            fill: ResonanceColors.preferencesTextProperty,
          },
        },
        titleNodeOptions: {
          fill: ResonanceColors.textProperty,
        },
        sliderOptions: {
          trackSize: new Dimension2(120, 3),
          majorTickStroke: ResonanceColors.textProperty,
          minorTickStroke: ResonanceColors.textProperty,
        },
      },
    );

    return {
      massControl,
      springConstantControl,
      displayMassProperty,
      displaySpringConstantProperty,
    };
  }

  /**
   * Creates the natural frequency readout text and container.
   */
  private static createNaturalFrequencyReadout(model: SimModel): {
    naturalFrequencyText: Text;
    naturalFrequencyBox: AlignBox;
  } {
    const naturalFrequencyText = new Text("", {
      font: ResonanceConstants.CONTROL_FONT,
      fill: ResonanceColors.textProperty,
    });

    // Initialize with first resonator's frequency
    const freq = model.resonatorModels[0].naturalFrequencyHzProperty.value;
    const valueWithUnit =
      ResonanceStrings.units.hertzPatternStringProperty.value.replace(
        "{{value}}",
        freq.toFixed(3),
      );
    naturalFrequencyText.string = `${ResonanceStrings.controls.frequencyEqualsStringProperty.value} ${valueWithUnit}`;

    const naturalFrequencyBox = new AlignBox(naturalFrequencyText, {
      xAlign: "center",
      alignBounds: new Bounds2(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0),
    });

    return { naturalFrequencyText, naturalFrequencyBox };
  }

  /**
   * Creates the damping slider control.
   */
  private static createDampingControl(model: SimModel): NumberControl {
    return new NumberControl(
      ResonanceStrings.controls.dampingStringProperty,
      model.resonanceModel.dampingProperty,
      ResonanceConstants.DAMPING_RANGE,
      {
        delta: 0.1,
        numberDisplayOptions: {
          valuePattern:
            ResonanceStrings.units.dampingUnitsPatternStringProperty,
          decimalPlaces: 1,
          textOptions: {
            fill: ResonanceColors.preferencesTextProperty,
          },
        },
        titleNodeOptions: {
          fill: ResonanceColors.textProperty,
        },
        sliderOptions: {
          trackSize: new Dimension2(120, 3),
          majorTickStroke: ResonanceColors.textProperty,
          minorTickStroke: ResonanceColors.textProperty,
        },
      },
    );
  }

  /**
   * Creates the gravity toggle switch and label.
   */
  private static createGravityToggle(
    gravityEnabledProperty: Property<boolean>,
  ): HBox {
    const gravityToggleSwitch = new ToggleSwitch(
      gravityEnabledProperty,
      false,
      true,
      {
        trackFillLeft: ResonanceColors.gravityToggleOffProperty,
        trackFillRight: ResonanceColors.gravityToggleOnProperty,
        scale: 0.7,
      },
    );

    const gravityLabel = new Text(
      ResonanceStrings.controls.gravityStringProperty,
      {
        font: ResonanceConstants.LABEL_FONT,
        fill: ResonanceColors.textProperty,
      },
    );

    return new HBox({
      children: [gravityLabel, gravityToggleSwitch],
      spacing: ResonanceConstants.GRAVITY_BOX_SPACING,
      align: "center",
    });
  }

  /**
   * Creates the ruler visibility checkbox.
   */
  private static createRulerCheckbox(
    rulerVisibleProperty: Property<boolean>,
  ): Checkbox {
    return new Checkbox(
      rulerVisibleProperty,
      new Text(ResonanceStrings.controls.rulerStringProperty, {
        font: ResonanceConstants.CONTROL_FONT,
        fill: ResonanceColors.textProperty,
      }),
      {
        boxWidth: ResonanceConstants.RULER_CHECKBOX_BOX_WIDTH,
      },
    );
  }

  /**
   * Sets up listeners that control visibility of UI elements based on resonator count.
   */
  private setupVisibilityListeners(): void {
    // Ensure resonator selector is always visible
    this.resonatorSelectionBox.visible = true;

    // Swap visibility between configBox and strut based on resonator count
    // This preserves panel size regardless of combo box visibility
    this.listenerTracker.link(
      this.model.resonatorCountProperty,
      (count: number) => {
        const shouldShowComboBox = count > 1;
        this.configBox.visible = shouldShowComboBox;
        this.configBoxStrut.visible = !shouldShowComboBox;
      },
    );
  }

  /**
   * Sets up bidirectional sync between display properties and model, with enabled state updates.
   */
  private setupMassSpringSync(): void {
    const updateControlsEnabledState = () => {
      const index = this.model.selectedResonatorIndexProperty.value;
      const isCustomMode =
        this.model.resonatorConfigProperty.value === ResonatorConfigMode.CUSTOM;
      this.massControl.enabled = index === 0 || isCustomMode;
      this.springConstantControl.enabled = index === 0 || isCustomMode;
    };

    // Update display properties when selected resonator changes
    this.listenerTracker.link(
      this.model.selectedResonatorIndexProperty,
      (index: number) => {
        const selectedResonator = this.model.resonatorModels[index];
        this.displayMassProperty.value = selectedResonator.massProperty.value;
        this.displaySpringConstantProperty.value =
          selectedResonator.springConstantProperty.value;
        updateControlsEnabledState();
      },
    );

    // Update enabled state when config mode changes
    this.listenerTracker.link(this.model.resonatorConfigProperty, () => {
      updateControlsEnabledState();
    });

    // Flag to prevent circular updates
    let updatingFromModel = false;

    // Display -> Model sync
    this.listenerTracker.link(this.displayMassProperty, (mass: number) => {
      if (!updatingFromModel) {
        const index = this.model.selectedResonatorIndexProperty.value;
        const isCustomMode =
          this.model.resonatorConfigProperty.value ===
          ResonatorConfigMode.CUSTOM;
        if (index === 0 || isCustomMode) {
          this.model.resonatorModels[index].massProperty.value = mass;
        }
      }
    });

    this.listenerTracker.link(
      this.displaySpringConstantProperty,
      (springConstant: number) => {
        if (!updatingFromModel) {
          const index = this.model.selectedResonatorIndexProperty.value;
          const isCustomMode =
            this.model.resonatorConfigProperty.value ===
            ResonatorConfigMode.CUSTOM;
          if (index === 0 || isCustomMode) {
            this.model.resonatorModels[index].springConstantProperty.value =
              springConstant;
          }
        }
      },
    );

    // Model -> Display sync (for each resonator)
    this.model.resonatorModels.forEach((resonator, index) => {
      this.listenerTracker.link(resonator.massProperty, (mass: number) => {
        if (this.model.selectedResonatorIndexProperty.value === index) {
          updatingFromModel = true;
          this.displayMassProperty.value = mass;
          updatingFromModel = false;
        }
      });
      this.listenerTracker.link(
        resonator.springConstantProperty,
        (springConstant: number) => {
          if (this.model.selectedResonatorIndexProperty.value === index) {
            updatingFromModel = true;
            this.displaySpringConstantProperty.value = springConstant;
            updatingFromModel = false;
          }
        },
      );
    });
  }

  /**
   * Sets up the natural frequency readout sync.
   */
  private setupNaturalFrequencySync(): void {
    const updateNaturalFrequency = () => {
      const index = this.model.selectedResonatorIndexProperty.value;
      const freq =
        this.model.resonatorModels[index].naturalFrequencyHzProperty.value;
      const valueWithUnit =
        ResonanceStrings.units.hertzPatternStringProperty.value.replace(
          "{{value}}",
          freq.toFixed(3),
        );
      this.naturalFrequencyText.string = `${ResonanceStrings.controls.frequencyEqualsStringProperty.value} ${valueWithUnit}`;
    };

    this.listenerTracker.link(
      this.model.selectedResonatorIndexProperty,
      updateNaturalFrequency,
    );
    this.model.resonatorModels.forEach((resonator) => {
      this.listenerTracker.link(
        resonator.naturalFrequencyHzProperty,
        updateNaturalFrequency,
      );
    });

    // Also update when locale changes (string properties update)
    this.listenerTracker.link(
      ResonanceStrings.units.hertzPatternStringProperty,
      updateNaturalFrequency,
    );
    this.listenerTracker.link(
      ResonanceStrings.controls.frequencyEqualsStringProperty,
      updateNaturalFrequency,
    );
  }

  public reset(): void {
    this.gravityEnabledProperty.reset();
  }

  public override dispose(): void {
    this.listenerTracker.dispose();
    super.dispose();
  }
}
