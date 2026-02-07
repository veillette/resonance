/**
 * Tests for ResonanceStrings - Localized string convenience module
 *
 * P2 Priority: Tests for string organization and accessibility.
 */

import { describe, it, expect } from "vitest";
import {
  ResonanceStrings,
  resonanceStringManager,
  StringManager,
} from "../ResonanceStrings.js";

describe("ResonanceStrings", () => {
  describe("exports", () => {
    it("should export ResonanceStrings object", () => {
      expect(ResonanceStrings).toBeDefined();
    });

    it("should export resonanceStringManager singleton", () => {
      expect(resonanceStringManager).toBeDefined();
      expect(resonanceStringManager).toBeInstanceOf(StringManager);
    });

    it("should export StringManager class", () => {
      expect(StringManager).toBeDefined();
    });

    it("should use singleton instance", () => {
      expect(resonanceStringManager).toBe(StringManager.getInstance());
    });
  });

  describe("title string", () => {
    it("should have title string property", () => {
      expect(ResonanceStrings.titleStringProperty).toBeDefined();
    });

    it("should have non-empty title", () => {
      expect(ResonanceStrings.titleStringProperty.value.length).toBeGreaterThan(
        0,
      );
    });
  });

  describe("screens", () => {
    it("should have screens object", () => {
      expect(ResonanceStrings.screens).toBeDefined();
    });

    it("should have screen name properties", () => {
      const screens = ResonanceStrings.screens;
      // The actual property name is simStringProperty (not simScreenStringProperty)
      expect(screens.simStringProperty).toBeDefined();
    });

    it("should have non-empty screen names", () => {
      expect(
        ResonanceStrings.screens.simStringProperty.value.length,
      ).toBeGreaterThan(0);
    });
  });

  describe("controls", () => {
    it("should have controls object", () => {
      expect(ResonanceStrings.controls).toBeDefined();
    });

    it("should have frequency control labels", () => {
      expect(ResonanceStrings.controls.frequencyStringProperty).toBeDefined();
    });

    it("should have amplitude control labels", () => {
      expect(ResonanceStrings.controls.amplitudeStringProperty).toBeDefined();
    });

    it("should have spring constant control labels", () => {
      expect(
        ResonanceStrings.controls.springConstantStringProperty,
      ).toBeDefined();
    });

    it("should have reset control label", () => {
      expect(ResonanceStrings.controls.resetStringProperty).toBeDefined();
    });

    it("should have non-empty control labels", () => {
      expect(
        ResonanceStrings.controls.frequencyStringProperty.value.length,
      ).toBeGreaterThan(0);
      expect(
        ResonanceStrings.controls.amplitudeStringProperty.value.length,
      ).toBeGreaterThan(0);
    });
  });

  describe("preferences", () => {
    it("should have preferences object", () => {
      expect(ResonanceStrings.preferences).toBeDefined();
    });

    it("should have preferences title", () => {
      expect(ResonanceStrings.preferences.titleStringProperty).toBeDefined();
    });

    it("should have visual preferences", () => {
      expect(ResonanceStrings.preferences.visual).toBeDefined();
    });

    it("should have simulation preferences", () => {
      expect(ResonanceStrings.preferences.simulation).toBeDefined();
    });

    it("should have localization preferences", () => {
      expect(ResonanceStrings.preferences.localization).toBeDefined();
    });

    it("should have solver names and descriptions", () => {
      expect(ResonanceStrings.preferences.solvers).toBeDefined();
    });
  });

  describe("content", () => {
    it("should have content object", () => {
      expect(ResonanceStrings.content).toBeDefined();
    });

    it("should have sample text content", () => {
      expect(ResonanceStrings.content.sampleTextStringProperty).toBeDefined();
    });
  });

  describe("presets", () => {
    it("should have presets object", () => {
      expect(ResonanceStrings.presets).toBeDefined();
    });

    it("should have preset name properties", () => {
      expect(
        ResonanceStrings.presets.lightAndBouncyStringProperty,
      ).toBeDefined();
      expect(ResonanceStrings.presets.heavyAndSlowStringProperty).toBeDefined();
      expect(ResonanceStrings.presets.underdampedStringProperty).toBeDefined();
    });

    it("should have non-empty preset names", () => {
      expect(
        ResonanceStrings.presets.lightAndBouncyStringProperty.value.length,
      ).toBeGreaterThan(0);
    });
  });

  describe("units", () => {
    it("should have units object", () => {
      expect(ResonanceStrings.units).toBeDefined();
    });

    it("should have frequency unit pattern", () => {
      expect(ResonanceStrings.units.hertzPatternStringProperty).toBeDefined();
    });

    it("should have mass unit pattern", () => {
      expect(ResonanceStrings.units.kgPatternStringProperty).toBeDefined();
    });

    it("should have length unit", () => {
      expect(ResonanceStrings.units.cmStringProperty).toBeDefined();
      expect(ResonanceStrings.units.cmPatternStringProperty).toBeDefined();
    });

    it("should have spring constant unit pattern", () => {
      expect(
        ResonanceStrings.units.newtonPerMeterPatternStringProperty,
      ).toBeDefined();
    });

    it("should have damping unit pattern", () => {
      expect(
        ResonanceStrings.units.dampingUnitsPatternStringProperty,
      ).toBeDefined();
    });
  });

  describe("common", () => {
    it("should have common object", () => {
      expect(ResonanceStrings.common).toBeDefined();
    });

    it("should have solver names in common", () => {
      expect(ResonanceStrings.common.solverNames).toBeDefined();
    });

    it("should have all solver type names", () => {
      const solverNames = ResonanceStrings.common.solverNames;
      expect(solverNames.solverRK4StringProperty).toBeDefined();
      expect(solverNames.solverAdaptiveRK45StringProperty).toBeDefined();
    });

    it("should have non-empty solver names", () => {
      expect(
        ResonanceStrings.common.solverNames.solverRK4StringProperty.value
          .length,
      ).toBeGreaterThan(0);
    });
  });

  describe("string property behavior", () => {
    it("should return ReadOnlyProperty instances", () => {
      const titleProp = ResonanceStrings.titleStringProperty;

      // Should be observable
      expect(titleProp.value).toBeDefined();
      expect(typeof titleProp.link).toBe("function");
    });

    it("should have consistent values on repeated access", () => {
      const value1 = ResonanceStrings.titleStringProperty.value;
      const value2 = ResonanceStrings.titleStringProperty.value;

      expect(value1).toBe(value2);
    });

    it("should allow linking to string changes", () => {
      let notifiedValue: string | null = null;
      const listener = (value: string) => {
        notifiedValue = value;
      };
      ResonanceStrings.titleStringProperty.link(listener);

      expect(notifiedValue).toBe(ResonanceStrings.titleStringProperty.value);

      // Clean up
      ResonanceStrings.titleStringProperty.unlink(listener);
    });
  });

  describe("structure completeness", () => {
    it("should have all major categories", () => {
      const categories = [
        "titleStringProperty",
        "screens",
        "controls",
        "preferences",
        "content",
        "presets",
        "units",
        "common",
      ];

      categories.forEach((category) => {
        expect(
          ResonanceStrings[category as keyof typeof ResonanceStrings],
        ).toBeDefined();
      });
    });

    it("should not have undefined nested properties", () => {
      // Check controls
      Object.values(ResonanceStrings.controls).forEach((prop) => {
        expect(prop).toBeDefined();
      });

      // Check units
      Object.values(ResonanceStrings.units).forEach((prop) => {
        expect(prop).toBeDefined();
      });

      // Check presets
      Object.values(ResonanceStrings.presets).forEach((prop) => {
        expect(prop).toBeDefined();
      });
    });
  });
});
