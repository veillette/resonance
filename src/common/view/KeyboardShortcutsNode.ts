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
  TextKeyNode,
  LetterKeyNode,
  ArrowKeyNode,
} from "scenerystack/scenery-phet";
import { HBox } from "scenerystack/scenery";
import resonance from "../ResonanceNamespace.js";

/**
 * Custom keyboard help section for simulation-specific shortcuts.
 */
class SimulationShortcutsKeyboardHelpSection extends KeyboardHelpSection {
  public constructor() {
    // Play/Pause with Space
    const playPauseRow = KeyboardHelpSectionRow.labelWithIcon(
      "Play / Pause",
      TextKeyNode.space(),
    );

    // Adjust frequency with arrow keys
    const frequencyRow = KeyboardHelpSectionRow.labelWithIcon(
      "Adjust Frequency",
      new HBox({
        children: [
          ArrowKeyNode.leftRight(),
        ],
        spacing: 2,
      }),
    );

    // Large frequency steps with Shift + arrows
    const largeStepRow = KeyboardHelpSectionRow.labelWithIcon(
      "Large Frequency Steps",
      KeyboardHelpSectionRow.shiftPlusIcon(ArrowKeyNode.upDown()),
    );

    // Reset with R key
    const resetRow = KeyboardHelpSectionRow.labelWithIcon(
      "Reset Simulation",
      new LetterKeyNode("R"),
    );

    // Stop sweep with Escape
    const escapeRow = KeyboardHelpSectionRow.labelWithIcon(
      "Stop Frequency Sweep",
      TextKeyNode.esc(),
    );

    super("Simulation Controls", [
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
      "Move Objects",
      ArrowKeyNode.arrowOrWasdKeys(),
    );

    // Fine control with Shift
    const fineRow = KeyboardHelpSectionRow.labelWithIcon(
      "Fine Movement",
      KeyboardHelpSectionRow.shiftPlusIcon(ArrowKeyNode.arrowOrWasdKeys()),
    );

    super("Drag Controls", [moveRow, fineRow]);
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
    super([simulationSection, dragSection], [sliderControlsSection, basicActionsSection], {
      columnSpacing: 20,
      sectionSpacing: 15,
    });
  }
}

// Register with namespace for debugging accessibility
resonance.register("KeyboardShortcutsNode", KeyboardShortcutsNode);
