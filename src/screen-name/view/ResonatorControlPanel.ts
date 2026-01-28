/**
 * ResonatorControlPanel is the green panel on the right side of the simulation.
 * It contains controls for:
 * - Number of resonators
 * - Oscillator configuration mode (combo box)
 * - Selected resonator spinner
 * - Mass and spring constant controls
 * - Natural frequency readout
 * - Damping control
 * - Gravity toggle
 * - Ruler visibility checkbox
 */

import { Node, Text, Line, VBox, HBox, AlignBox } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import { Panel, ComboBox, Checkbox, ToggleSwitch, NumberSpinner } from "scenerystack/sun";
import type { ComboBoxItem } from "scenerystack/sun";
import { Property, NumberProperty } from "scenerystack/axon";
import { Range, Bounds2 } from "scenerystack/dot";
import { SimModel } from "../model/SimModel.js";
import { OscillatorConfigMode } from "../../common/model/OscillatorConfigMode.js";
import type { OscillatorConfigModeType } from "../../common/model/OscillatorConfigMode.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { ResonanceStrings } from "../../strings/ResonanceStrings.js";

export class ResonatorControlPanel extends Panel {

  /**
   * The combo box list parent node. Must be added to the scene graph above the panel
   * so the popup list renders on top.
   */
  public readonly comboBoxListParent: Node;

  public readonly gravityEnabledProperty: Property<boolean>;
  public readonly rulerVisibleProperty: Property<boolean>;

  public constructor( model: SimModel, layoutBounds: Bounds2, rulerVisibleProperty: Property<boolean> ) {

    // --- Gravity toggle property ---
    const gravityEnabledProperty = new Property<boolean>( model.resonanceModel.gravityProperty.value > 0 );
    gravityEnabledProperty.link( ( enabled: boolean ) => {
      model.resonanceModel.gravityProperty.value = enabled ? ResonanceConstants.GRAVITY_ACCELERATION : 0;
    } );

    // --- Resonator count control ---
    const resonatorCountControl = new NumberControl( ResonanceStrings.controls.resonatorsStringProperty, model.resonatorCountProperty, ResonanceConstants.RESONATOR_COUNT_RANGE, {
      delta: 1,
      numberDisplayOptions: {
        decimalPlaces: 0
      },
      sliderOptions: {
        majorTicks: [
          { value: 1, label: new Text( '1', { font: ResonanceConstants.TICK_LABEL_FONT } ) },
          { value: 10, label: new Text( '10', { font: ResonanceConstants.TICK_LABEL_FONT } ) }
        ],
        minorTickSpacing: 1
      }
    } );

    // --- Oscillator configuration combo box ---
    const configLabel = new Text( ResonanceStrings.controls.oscillatorConfigStringProperty, {
      font: ResonanceConstants.LABEL_FONT,
      fill: ResonanceColors.textProperty
    } );

    const comboBoxItems: ComboBoxItem<OscillatorConfigModeType>[] = [
      {
        value: OscillatorConfigMode.SAME_SPRING_CONSTANT,
        createNode: () => new Text( ResonanceStrings.controls.sameSpringConstantStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        } )
      },
      {
        value: OscillatorConfigMode.SAME_MASS,
        createNode: () => new Text( ResonanceStrings.controls.sameMassStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        } )
      },
      {
        value: OscillatorConfigMode.MIXED,
        createNode: () => new Text( ResonanceStrings.controls.mixedStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        } )
      },
      {
        value: OscillatorConfigMode.SAME_FREQUENCY,
        createNode: () => new Text( ResonanceStrings.controls.sameFrequencyStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        } )
      },
      {
        value: OscillatorConfigMode.CUSTOM,
        createNode: () => new Text( ResonanceStrings.controls.customStringProperty, {
          font: ResonanceConstants.CONTROL_FONT
        } )
      }
    ];

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

    const configBox = new VBox( {
      children: [ configLabel, configComboBox ],
      spacing: ResonanceConstants.COMBO_BOX_SPACING,
      align: 'left'
    } );

    // Hide configuration combo box when there's only one oscillator
    model.resonatorCountProperty.link( ( count: number ) => {
      configBox.visible = count > 1;
    } );

    // --- Resonator selection spinner ---
    const displayResonatorNumberProperty = new NumberProperty( 1 );

    displayResonatorNumberProperty.link( ( displayNumber: number ) => {
      model.selectedResonatorIndexProperty.value = displayNumber - 1;
    } );
    model.selectedResonatorIndexProperty.link( ( index: number ) => {
      displayResonatorNumberProperty.value = index + 1;
    } );

    const spinnerRangeProperty = new Property( new Range( 1, model.resonatorCountProperty.value ) );
    model.resonatorCountProperty.link( ( count: number ) => {
      spinnerRangeProperty.value = new Range( 1, count );
    } );

    const resonatorSpinner = new NumberSpinner(
      displayResonatorNumberProperty,
      spinnerRangeProperty,
      {
        arrowsPosition: 'bothRight',
        arrowsScale: 0.8
      }
    );

    const resonatorLabel = new Text( '', {
      font: ResonanceConstants.TITLE_FONT,
      fill: ResonanceColors.textProperty
    } );

    displayResonatorNumberProperty.link( ( num: number ) => {
      resonatorLabel.string = `Resonator ${num}`;
    } );

    const resonatorSelectionBox = new HBox( {
      children: [ resonatorLabel, resonatorSpinner ],
      spacing: 10,
      align: 'center'
    } );

    // Hide resonator selection when there's only one oscillator
    model.resonatorCountProperty.link( ( count: number ) => {
      resonatorSelectionBox.visible = count > 1;
    } );

    // --- Mass and spring constant controls ---
    const displayMassProperty = new NumberProperty( model.resonanceModel.massProperty.value );
    const displaySpringConstantProperty = new NumberProperty( model.resonanceModel.springConstantProperty.value );

    const massControl = new NumberControl(
      ResonanceStrings.controls.massSimpleStringProperty,
      displayMassProperty,
      ResonanceConstants.MASS_RANGE,
      {
        delta: 0.01,
        numberDisplayOptions: {
          valuePattern: '{{value}} kg',
          decimalPlaces: 4
        }
      }
    );

    const springConstantControl = new NumberControl(
      ResonanceStrings.controls.springConstantSimpleStringProperty,
      displaySpringConstantProperty,
      ResonanceConstants.SPRING_CONSTANT_RANGE,
      {
        delta: 1,
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
      massControl.enabled = ( index === 0 ) || isCustomMode;
      springConstantControl.enabled = ( index === 0 ) || isCustomMode;
    };

    model.selectedResonatorIndexProperty.link( ( index: number ) => {
      const selectedOscillator = model.oscillatorModels[ index ];
      displayMassProperty.value = selectedOscillator.massProperty.value;
      displaySpringConstantProperty.value = selectedOscillator.springConstantProperty.value;
      updateControlsEnabledState();
    } );

    model.oscillatorConfigProperty.link( () => {
      updateControlsEnabledState();
    } );

    // Bidirectional sync with model (with circular update prevention)
    let updatingFromModel = false;

    displayMassProperty.link( ( mass: number ) => {
      if ( !updatingFromModel ) {
        const index = model.selectedResonatorIndexProperty.value;
        const isCustomMode = model.oscillatorConfigProperty.value === OscillatorConfigMode.CUSTOM;
        if ( index === 0 || isCustomMode ) {
          model.oscillatorModels[ index ].massProperty.value = mass;
        }
      }
    } );

    displaySpringConstantProperty.link( ( springConstant: number ) => {
      if ( !updatingFromModel ) {
        const index = model.selectedResonatorIndexProperty.value;
        const isCustomMode = model.oscillatorConfigProperty.value === OscillatorConfigMode.CUSTOM;
        if ( index === 0 || isCustomMode ) {
          model.oscillatorModels[ index ].springConstantProperty.value = springConstant;
        }
      }
    } );

    model.oscillatorModels.forEach( ( oscillator, index ) => {
      oscillator.massProperty.link( ( mass: number ) => {
        if ( model.selectedResonatorIndexProperty.value === index ) {
          updatingFromModel = true;
          displayMassProperty.value = mass;
          updatingFromModel = false;
        }
      } );
      oscillator.springConstantProperty.link( ( springConstant: number ) => {
        if ( model.selectedResonatorIndexProperty.value === index ) {
          updatingFromModel = true;
          displaySpringConstantProperty.value = springConstant;
          updatingFromModel = false;
        }
      } );
    } );

    // --- Natural frequency readout ---
    const naturalFrequencyText = new Text( '', {
      font: ResonanceConstants.CONTROL_FONT,
      fill: ResonanceColors.textProperty
    } );

    const updateNaturalFrequency = () => {
      const index = model.selectedResonatorIndexProperty.value;
      const freq = model.oscillatorModels[ index ].naturalFrequencyHzProperty.value;
      naturalFrequencyText.string = `${ResonanceStrings.controls.frequencyEqualsStringProperty.value} ${freq.toFixed( 3 )} Hz`;
    };

    model.selectedResonatorIndexProperty.link( updateNaturalFrequency );
    model.oscillatorModels.forEach( oscillator => {
      oscillator.naturalFrequencyHzProperty.link( updateNaturalFrequency );
    } );

    // Wrap the natural frequency text in an AlignBox to center it
    const naturalFrequencyBox = new AlignBox( naturalFrequencyText, {
      xAlign: 'center'
    } );

    // --- Damping control ---
    const dampingControl = new NumberControl( 'Damping', model.resonanceModel.dampingProperty, ResonanceConstants.DAMPING_RANGE, {
      delta: 0.1,
      numberDisplayOptions: {
        valuePattern: '{{value}} N/(m/s)',
        decimalPlaces: 1
      }
    } );

    // --- Gravity toggle ---
    const gravityToggleSwitch = new ToggleSwitch( gravityEnabledProperty, false, true, {
      trackFillLeft: ResonanceColors.gravityToggleOffProperty,
      trackFillRight: ResonanceColors.gravityToggleOnProperty
    } );

    const gravityLabel = new Text( ResonanceStrings.controls.gravityStringProperty, {
      font: ResonanceConstants.LABEL_FONT,
      fill: ResonanceColors.textProperty
    } );
    const gravityBox = new HBox( {
      children: [ gravityLabel, gravityToggleSwitch ],
      spacing: ResonanceConstants.GRAVITY_BOX_SPACING,
      align: 'center'
    } );

    // --- Ruler checkbox ---
    const rulerCheckbox = new Checkbox( rulerVisibleProperty, new Text( ResonanceStrings.controls.rulerStringProperty, {
      font: ResonanceConstants.CONTROL_FONT,
      fill: ResonanceColors.textProperty
    } ), {
      boxWidth: ResonanceConstants.RULER_CHECKBOX_BOX_WIDTH
    } );

    // --- Assemble panel content ---
    const controlPanelContent = new VBox( {
      children: [
        resonatorCountControl,
        configBox,
        new Line( 0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, { stroke: ResonanceColors.textProperty, lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH } ),
        resonatorSelectionBox,
        massControl,
        springConstantControl,
        naturalFrequencyBox,
        dampingControl,
        new Line( 0, 0, ResonanceConstants.SEPARATOR_WIDTH, 0, { stroke: ResonanceColors.textProperty, lineWidth: ResonanceConstants.SEPARATOR_LINE_WIDTH } ),
        gravityBox,
        rulerCheckbox
      ],
      spacing: ResonanceConstants.CONTROL_PANEL_SPACING,
      align: 'left'
    } );

    super( controlPanelContent, {
      fill: ResonanceColors.controlPanelFillProperty,
      stroke: ResonanceColors.controlPanelStrokeProperty,
      lineWidth: ResonanceConstants.CONTROL_PANEL_LINE_WIDTH,
      cornerRadius: ResonanceConstants.CONTROL_PANEL_CORNER_RADIUS,
      xMargin: ResonanceConstants.CONTROL_PANEL_X_MARGIN,
      yMargin: ResonanceConstants.CONTROL_PANEL_Y_MARGIN,
      right: layoutBounds.maxX - ResonanceConstants.CONTROL_PANEL_RIGHT_MARGIN,
      top: layoutBounds.minY + ResonanceConstants.CONTROL_PANEL_TOP_MARGIN
    } );

    this.comboBoxListParent = comboBoxListParent;
    this.gravityEnabledProperty = gravityEnabledProperty;
    this.rulerVisibleProperty = rulerVisibleProperty;
  }

  public reset(): void {
    this.gravityEnabledProperty.reset();
  }
}
