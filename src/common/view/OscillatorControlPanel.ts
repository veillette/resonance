/**
 * OscillatorControlPanel is the green panel on the right side of oscillator screens.
 * It contains controls for:
 * - Number of resonators
 * - Resonator configuration mode (combo box)
 * - Selected resonator spinner
 * - Mass and spring constant controls
 * - Natural frequency readout
 * - Damping control
 * - Gravity toggle
 * - Ruler visibility checkbox
 *
 * This is a shared control panel used by all oscillator-based screens:
 * - Single Oscillator
 * - Multiple Oscillators
 * - Phase Analysis
 */

import {
  Node,
  Text,
  Line,
  VBox,
  HBox,
  AlignBox,
  VStrut,
  voicingUtteranceQueue,
} from "scenerystack/scenery";
import { NumberControl, GridIcon } from "scenerystack/scenery-phet";
import {
  Panel,
  ComboBox,
  Checkbox,
  ToggleSwitch,
  NumberSpinner,
} from "scenerystack/sun";
import type { ComboBoxItem } from "scenerystack/sun";
import { Property, NumberProperty } from "scenerystack/axon";
import { Range, Bounds2 } from "scenerystack/dot";
import { BaseOscillatorScreenModel } from "../model/BaseOscillatorScreenModel.js";
import { ResonatorConfigMode } from "../model/ResonatorConfigMode.js";
import type { ResonatorConfigModeType } from "../model/ResonatorConfigMode.js";
import ResonanceColors from "../ResonanceColors.js";
import ResonanceConstants from "../ResonanceConstants.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import { ListenerTracker } from "../util/index.js";
import { NumberControlFactory } from "./NumberControlFactory.js";

export type OscillatorControlPanelOptions = {
  /**
   * When true, hides multi-oscillator controls (resonator count slider,
   * configuration combo box, and resonator selection spinner).
   */
  singleOscillatorMode?: boolean;
};

export class OscillatorControlPanel extends Panel {
  /**
   * The combo box list parent node. Must be added to the scene graph above the panel
   * so the popup list renders on top.
   */
  public readonly comboBoxListParent: Node;

  public readonly gravityEnabledProperty: Property<boolean>;
  public readonly rulerVisibleProperty: Property<boolean>;
  public readonly gridVisibleProperty: Property<boolean>;

  private readonly model: BaseOscillatorScreenModel;
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

  // Whether to hide multi-oscillator controls
  private readonly singleOscillatorMode: boolean;

  public constructor(
    model: BaseOscillatorScreenModel,
    layoutBounds: Bounds2,
    rulerVisibleProperty: Property<boolean>,
    gridVisibleProperty: Property<boolean>,
    options?: OscillatorControlPanelOptions,
  ) {
    // Store model reference for use in methods
    const tempModel = model;
    const singleOscillatorMode = options?.singleOscillatorMode ?? false;

    // --- Create all controls using extracted methods ---
    const gravityEnabledProperty =
      OscillatorControlPanel.createGravityProperty(tempModel);

    const resonatorCountControl =
      OscillatorControlPanel.createResonatorCountControl(tempModel);

    const { configBox, comboBoxListParent } =
      OscillatorControlPanel.createConfigurationControls(tempModel);

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
    });
    // Initially show configBox if count > 1, otherwise show strut
    configBox.visible = tempModel.resonatorCountProperty.value > 1;
    configBoxStrut.visible = !configBox.visible;

    const { resonatorSelectionBox, displayResonatorNumberProperty } =
      OscillatorControlPanel.createResonatorSelectionControls(tempModel);

    const {
      massControl,
      springConstantControl,
      displayMassProperty,
      displaySpringConstantProperty,
    } = OscillatorControlPanel.createMassSpringControls(tempModel);

    const { naturalFrequencyText, naturalFrequencyBox } =
      OscillatorControlPanel.createNaturalFrequencyReadout(tempModel);

    const dampingControl =
      OscillatorControlPanel.createDampingControl(tempModel);

    const gravityBox = OscillatorControlPanel.createGravityToggle(
      gravityEnabledProperty,
    );

    const rulerCheckbox =
      OscillatorControlPanel.createRulerCheckbox(rulerVisibleProperty);

    const gridCheckbox =
      OscillatorControlPanel.createGridCheckbox(gridVisibleProperty);

    // --- Create sub-panel for mass/spring/resonator/frequency controls ---
    // Use a light blue color to contrast with the green main panel
    // In single oscillator mode, hide the resonator selection box
    const subPanelChildren = singleOscillatorMode
      ? [massControl, springConstantControl, naturalFrequencyBox]
      : [
          resonatorSelectionBox,
          massControl,
          springConstantControl,
          naturalFrequencyBox,
        ];

    const massSpringResonatorSubPanel = new Panel(
      new VBox({
        children: subPanelChildren,
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
    // In single oscillator mode, hide the resonator count slider and config box
    const topSeparator = new Line(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, {
      stroke: ResonanceColors.textProperty,
      lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH,
    });
    const bottomSeparator = new Line(
      0,
      0,
      ResonanceConstants.SEPARATOR_WIDTH,
      0,
      {
        stroke: ResonanceColors.textProperty,
        lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH,
      },
    );

    const panelChildren: Node[] = singleOscillatorMode
      ? [
          // Single oscillator mode: no resonator count or config controls
          massSpringResonatorSubPanel,
          dampingControl,
          bottomSeparator,
          gravityBox,
          rulerCheckbox,
          gridCheckbox,
        ]
      : [
          // Multiple oscillators mode: full controls
          resonatorCountControl,
          configBoxContainer, // Container that swaps between configBox and strut
          topSeparator,
          massSpringResonatorSubPanel,
          dampingControl,
          bottomSeparator,
          gravityBox,
          rulerCheckbox,
          gridCheckbox,
        ];

    const controlPanelContent = new VBox({
      children: panelChildren,
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
      // Accessibility
      tagName: "div",
      labelTagName: "h2",
      labelContent: ResonanceStrings.a11y.resonatorPanel.labelStringProperty,
      descriptionContent:
        ResonanceStrings.a11y.resonatorPanel.descriptionStringProperty,
    });

    // Store references for instance methods
    this.model = model;
    this.comboBoxListParent = comboBoxListParent;
    this.gravityEnabledProperty = gravityEnabledProperty;
    this.rulerVisibleProperty = rulerVisibleProperty;
    this.gridVisibleProperty = gridVisibleProperty;
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
    this.singleOscillatorMode = singleOscillatorMode;

    // Setup listeners that need to be tracked for cleanup
    this.setupVisibilityListeners();
    this.setupMassSpringSync();
    this.setupNaturalFrequencySync();
  }

  /**
   * Creates the gravity enabled property that syncs with the model.
   */
  private static createGravityProperty(
    model: BaseOscillatorScreenModel,
  ): Property<boolean> {
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
  private static createResonatorCountControl(
    model: BaseOscillatorScreenModel,
  ): NumberControl {
    return NumberControlFactory.create({
      titleProperty: ResonanceStrings.controls.resonatorsStringProperty,
      numberProperty: model.resonatorCountProperty,
      range: ResonanceConstants.RESONATOR_COUNT_RANGE,
      delta: 1,
      decimalPlaces: 0,
      minorTickSpacing: 1,
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
    });
  }

  /**
   * Creates the resonator configuration combo box and its container.
   */
  private static createConfigurationControls(
    model: BaseOscillatorScreenModel,
  ): {
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
  private static createResonatorSelectionControls(
    model: BaseOscillatorScreenModel,
  ): {
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
        // Accessibility
        accessibleName:
          ResonanceStrings.a11y.resonatorPanel
            .resonatorSelectorLabelStringProperty,
        // Voicing support
        voicingNameResponse:
          ResonanceStrings.a11y.resonatorPanel
            .resonatorSelectorLabelStringProperty,
        voicingHintResponse:
          ResonanceStrings.a11y.resonatorPanel
            .resonatorSelectorDescriptionStringProperty,
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
    });

    return { resonatorSelectionBox, displayResonatorNumberProperty };
  }

  /**
   * Creates the mass and spring constant controls.
   */
  private static createMassSpringControls(model: BaseOscillatorScreenModel): {
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

    const massControl = NumberControlFactory.create({
      titleProperty: ResonanceStrings.controls.massSimpleStringProperty,
      numberProperty: displayMassProperty,
      range: ResonanceConstants.MASS_RANGE,
      delta: 0.01,
      decimalPlaces: 2,
      valuePattern: ResonanceStrings.units.kgPatternStringProperty,
    });

    const springConstantControl = NumberControlFactory.create({
      titleProperty:
        ResonanceStrings.controls.springConstantSimpleStringProperty,
      numberProperty: displaySpringConstantProperty,
      range: ResonanceConstants.SPRING_CONSTANT_RANGE,
      delta: 1,
      decimalPlaces: 0,
      valuePattern: ResonanceStrings.units.newtonPerMeterPatternStringProperty,
    });

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
  private static createNaturalFrequencyReadout(
    model: BaseOscillatorScreenModel,
  ): {
    naturalFrequencyText: Text;
    naturalFrequencyBox: AlignBox;
  } {
    const naturalFrequencyText = new Text("", {
      font: ResonanceConstants.CONTROL_FONT,
      fill: ResonanceColors.textProperty,
    });

    // Initialize with first resonator's frequency
    const freq = model.getResonatorModel(0).naturalFrequencyHzProperty.value;
    const valueWithUnit =
      ResonanceStrings.units.hertzPatternStringProperty.value.replace(
        "{{value}}",
        freq.toFixed(3),
      );
    naturalFrequencyText.string = `${ResonanceStrings.controls.frequencyEqualsStringProperty.value} ${valueWithUnit}`;

    const naturalFrequencyBox = new AlignBox(naturalFrequencyText, {
      alignBounds: new Bounds2(0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0),
    });

    return { naturalFrequencyText, naturalFrequencyBox };
  }

  /**
   * Creates the damping slider control.
   */
  private static createDampingControl(
    model: BaseOscillatorScreenModel,
  ): NumberControl {
    return NumberControlFactory.create({
      titleProperty: ResonanceStrings.controls.dampingStringProperty,
      numberProperty: model.resonanceModel.dampingProperty,
      range: ResonanceConstants.DAMPING_RANGE,
      delta: 0.1,
      decimalPlaces: 1,
      valuePattern: ResonanceStrings.units.dampingUnitsPatternStringProperty,
    });
  }

  /**
   * Creates the gravity toggle switch and label with voicing support.
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
        // Accessibility
        accessibleName:
          ResonanceStrings.a11y.resonatorPanel.gravityToggleLabelStringProperty,
        // Voicing support - announce name on focus
        voicingNameResponse:
          ResonanceStrings.a11y.resonatorPanel.gravityToggleLabelStringProperty,
        voicingHintResponse:
          ResonanceStrings.a11y.resonatorPanel
            .gravityToggleDescriptionStringProperty,
      },
    );

    // Announce state changes via voicing
    // Type assertion to work around deeply nested type inference
    const alerts = ResonanceStrings.a11y.alerts as unknown as {
      gravityOnStringProperty: { value: string };
      gravityOffStringProperty: { value: string };
    };
    gravityEnabledProperty.lazyLink((enabled: boolean) => {
      const announcement = enabled
        ? alerts.gravityOnStringProperty.value
        : alerts.gravityOffStringProperty.value;
      voicingUtteranceQueue.addToBack(announcement);
    });

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
    });
  }

  /**
   * Creates the ruler visibility checkbox with voicing support.
   */
  private static createRulerCheckbox(
    rulerVisibleProperty: Property<boolean>,
  ): Checkbox {
    const checkbox = new Checkbox(
      rulerVisibleProperty,
      new Text(ResonanceStrings.controls.rulerStringProperty, {
        font: ResonanceConstants.CONTROL_FONT,
        fill: ResonanceColors.textProperty,
      }),
      {
        boxWidth: ResonanceConstants.RULER_CHECKBOX_BOX_WIDTH,
        // Accessibility
        accessibleName:
          ResonanceStrings.a11y.resonatorPanel.rulerCheckboxLabelStringProperty,
        // Voicing support
        voicingNameResponse:
          ResonanceStrings.a11y.resonatorPanel.rulerCheckboxLabelStringProperty,
        voicingHintResponse:
          ResonanceStrings.a11y.resonatorPanel
            .rulerCheckboxDescriptionStringProperty,
      },
    );

    // Announce visibility changes via voicing
    rulerVisibleProperty.lazyLink((visible: boolean) => {
      const announcement = visible ? "Ruler shown" : "Ruler hidden";
      voicingUtteranceQueue.addToBack(announcement);
    });

    return checkbox;
  }

  /**
   * Creates the grid visibility checkbox with a grid icon and voicing support.
   */
  private static createGridCheckbox(
    gridVisibleProperty: Property<boolean>,
  ): Checkbox {
    // Use GridIcon instead of text - color adapts to color profile
    const gridIcon = new GridIcon({
      size: 24,
      numberOfRows: 4,
      stroke: ResonanceColors.gridIconProperty,
    });

    const checkbox = new Checkbox(gridVisibleProperty, gridIcon, {
      boxWidth: ResonanceConstants.RULER_CHECKBOX_BOX_WIDTH,
      // Accessibility
      accessibleName: "Grid",
      // Voicing support
      voicingNameResponse: "Grid",
      voicingHintResponse: "Toggle grid visibility",
    });

    // Announce visibility changes via voicing
    gridVisibleProperty.lazyLink((visible: boolean) => {
      const announcement = visible ? "Grid shown" : "Grid hidden";
      voicingUtteranceQueue.addToBack(announcement);
    });

    return checkbox;
  }

  /**
   * Sets up listeners that control visibility of UI elements based on resonator count.
   */
  private setupVisibilityListeners(): void {
    // Skip visibility management for multi-oscillator controls when in single oscillator mode
    if (this.singleOscillatorMode) {
      return;
    }

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
      // In single oscillator mode, controls are always enabled
      if (this.singleOscillatorMode) {
        this.massControl.enabled = true;
        this.springConstantControl.enabled = true;
        return;
      }
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
        const selectedResonator = this.model.getResonatorModel(index);
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
          this.model.getResonatorModel(index).massProperty.value = mass;
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
            this.model.getResonatorModel(index).springConstantProperty.value =
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
        this.model.getResonatorModel(index).naturalFrequencyHzProperty.value;
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
