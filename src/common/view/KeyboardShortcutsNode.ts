/**
 * Keyboard shortcuts help content for Resonance simulation.
 * Displays available keyboard shortcuts in a two-column layout.
 * Includes simulation-specific shortcuts for Chladni and oscillator screens.
 */

import {
  TwoColumnKeyboardHelpContent,
  SliderControlsKeyboardHelpSection,
  BasicActionsKeyboardHelpSection,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  KeyboardHelpIconFactory,
  TextKeyNode,
  LetterKeyNode,
} from "scenerystack/scenery-phet";
import resonance from "../ResonanceNamespace.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";

// Layout constants
const COLUMN_SPACING = 20;
const SECTION_SPACING = 15;

/**
 * Custom keyboard help section for simulation-specific shortcuts.
 */
class SimulationShortcutsKeyboardHelpSection extends KeyboardHelpSection {
  public constructor() {
    // Play/Pause with Space
    const playPauseRow = KeyboardHelpSectionRow.labelWithIcon(
      ResonanceStrings.keyboardHelp.playPauseStringProperty,
      TextKeyNode.space(),
    );

    // Adjust frequency with arrow keys
    const frequencyRow = KeyboardHelpSectionRow.labelWithIcon(
      ResonanceStrings.keyboardHelp.adjustFrequencyStringProperty,
      KeyboardHelpIconFactory.leftRightArrowKeysRowIcon(),
    );

    // Large frequency steps with Shift + arrows
    const largeStepRow = KeyboardHelpSectionRow.labelWithIcon(
      ResonanceStrings.keyboardHelp.largeFrequencyStepsStringProperty,
      KeyboardHelpIconFactory.shiftPlusIcon(
        KeyboardHelpIconFactory.upDownArrowKeysRowIcon(),
      ),
    );

    // Reset with R key
    const resetRow = KeyboardHelpSectionRow.labelWithIcon(
      ResonanceStrings.keyboardHelp.resetSimulationStringProperty,
      new LetterKeyNode("R"),
    );

    // Stop sweep with Escape
    const escapeRow = KeyboardHelpSectionRow.labelWithIcon(
      ResonanceStrings.keyboardHelp.stopFrequencySweepStringProperty,
      TextKeyNode.esc(),
    );

    super(ResonanceStrings.keyboardHelp.simulationControlsStringProperty, [
      playPauseRow,
      frequencyRow,
      largeStepRow,
      resetRow,
      escapeRow,
    ]);
  }
}

/**
 * Custom keyboard help section for dragging objects.
 */
class DragObjectsKeyboardHelpSection extends KeyboardHelpSection {
  public constructor() {
    // Move with arrow keys
    const moveRow = KeyboardHelpSectionRow.labelWithIcon(
      ResonanceStrings.keyboardHelp.moveObjectsStringProperty,
      KeyboardHelpIconFactory.arrowOrWasdKeysRowIcon(),
    );

    // Fine control with Shift
    const fineRow = KeyboardHelpSectionRow.labelWithIcon(
      ResonanceStrings.keyboardHelp.fineMovementStringProperty,
      KeyboardHelpIconFactory.shiftPlusIcon(
        KeyboardHelpIconFactory.arrowOrWasdKeysRowIcon(),
      ),
    );

    super(ResonanceStrings.keyboardHelp.dragControlsStringProperty, [moveRow, fineRow]);
  }
}

export class KeyboardShortcutsNode extends TwoColumnKeyboardHelpContent {
  public constructor() {
    // Create slider controls section (for frequency, amplitude, mass, etc.)
    const sliderControlsSection = new SliderControlsKeyboardHelpSection();

    // Create simulation shortcuts section
    const simulationSection = new SimulationShortcutsKeyboardHelpSection();

    // Create drag controls section
    const dragSection = new DragObjectsKeyboardHelpSection();

    // Create basic actions section (tab navigation, escape, etc.)
    const basicActionsSection = new BasicActionsKeyboardHelpSection();

    // Left column: simulation + drag controls
    // Right column: slider + basic actions
    super(
      [simulationSection, dragSection],
      [sliderControlsSection, basicActionsSection],
      {
        columnSpacing: COLUMN_SPACING,
        sectionSpacing: SECTION_SPACING,
      },
    );
  }
}

// Register with namespace for debugging accessibility
resonance.register("KeyboardShortcutsNode", KeyboardShortcutsNode);
