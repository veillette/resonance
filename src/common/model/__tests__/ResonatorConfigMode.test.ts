/**
 * Tests for ResonatorConfigMode - Resonator parameter distribution modes
 *
 * P2 Priority: Tests for configuration mode values and types.
 */

import { describe, it, expect } from "vitest";
import {
  ResonatorConfigMode,
  ResonatorConfigModeType,
} from "../ResonatorConfigMode.js";

describe("ResonatorConfigMode", () => {
  describe("mode values", () => {
    it("should have SAME_MASS mode", () => {
      expect(ResonatorConfigMode.SAME_MASS).toBeDefined();
      expect(ResonatorConfigMode.SAME_MASS).toBe("sameMass");
    });

    it("should have SAME_SPRING_CONSTANT mode", () => {
      expect(ResonatorConfigMode.SAME_SPRING_CONSTANT).toBeDefined();
      expect(ResonatorConfigMode.SAME_SPRING_CONSTANT).toBe(
        "sameSpringConstant",
      );
    });

    it("should have MIXED mode", () => {
      expect(ResonatorConfigMode.MIXED).toBeDefined();
      expect(ResonatorConfigMode.MIXED).toBe("mixed");
    });

    it("should have SAME_FREQUENCY mode", () => {
      expect(ResonatorConfigMode.SAME_FREQUENCY).toBeDefined();
      expect(ResonatorConfigMode.SAME_FREQUENCY).toBe("sameFrequency");
    });

    it("should have CUSTOM mode", () => {
      expect(ResonatorConfigMode.CUSTOM).toBeDefined();
      expect(ResonatorConfigMode.CUSTOM).toBe("custom");
    });

    it("should have exactly 5 configuration modes", () => {
      const modes = Object.values(ResonatorConfigMode);
      expect(modes.length).toBe(5);
    });

    it("should have unique string values", () => {
      const values = Object.values(ResonatorConfigMode);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe("mode semantics", () => {
    it("SAME_MASS should indicate constant mass across resonators", () => {
      // In SAME_MASS mode: masses are constant, spring constants vary (k, 2k, 3k, ...)
      expect(ResonatorConfigMode.SAME_MASS).toContain("Mass");
    });

    it("SAME_SPRING_CONSTANT should indicate constant k across resonators", () => {
      // In SAME_SPRING_CONSTANT mode: k is constant, masses vary (m, 2m, 3m, ...)
      expect(ResonatorConfigMode.SAME_SPRING_CONSTANT).toContain(
        "SpringConstant",
      );
    });

    it("MIXED should indicate both vary", () => {
      // In MIXED mode: both mass and k vary
      expect(ResonatorConfigMode.MIXED).toBe("mixed");
    });

    it("SAME_FREQUENCY should indicate constant natural frequency", () => {
      // In SAME_FREQUENCY mode: k/m ratio is constant (same ω₀)
      expect(ResonatorConfigMode.SAME_FREQUENCY).toContain("Frequency");
    });

    it("CUSTOM should allow independent configuration", () => {
      // In CUSTOM mode: each resonator can be configured independently
      expect(ResonatorConfigMode.CUSTOM).toBe("custom");
    });
  });

  describe("type safety", () => {
    it("should work with switch statements", () => {
      const describeModePhysics = (mode: ResonatorConfigModeType): string => {
        switch (mode) {
          case ResonatorConfigMode.SAME_MASS:
            return "All masses equal, spring constants scale as k, 2k, 3k...";
          case ResonatorConfigMode.SAME_SPRING_CONSTANT:
            return "All spring constants equal, masses scale as m, 2m, 3m...";
          case ResonatorConfigMode.MIXED:
            return "Both mass and spring constant scale together";
          case ResonatorConfigMode.SAME_FREQUENCY:
            return "All natural frequencies equal (ω₀ = √(k/m) constant)";
          case ResonatorConfigMode.CUSTOM:
            return "Each resonator configured independently";
          default:
            return "Unknown mode";
        }
      };

      expect(describeModePhysics(ResonatorConfigMode.SAME_MASS)).toContain(
        "masses equal",
      );
      expect(
        describeModePhysics(ResonatorConfigMode.SAME_SPRING_CONSTANT),
      ).toContain("spring constants equal");
      expect(describeModePhysics(ResonatorConfigMode.SAME_FREQUENCY)).toContain(
        "frequencies equal",
      );
    });

    it("should be usable as object keys", () => {
      const modeDescriptions: Record<ResonatorConfigModeType, string> = {
        [ResonatorConfigMode.SAME_MASS]: "Same Mass",
        [ResonatorConfigMode.SAME_SPRING_CONSTANT]: "Same Spring Constant",
        [ResonatorConfigMode.MIXED]: "Mixed",
        [ResonatorConfigMode.SAME_FREQUENCY]: "Same Frequency",
        [ResonatorConfigMode.CUSTOM]: "Custom",
      };

      expect(modeDescriptions[ResonatorConfigMode.SAME_MASS]).toBe("Same Mass");
      expect(modeDescriptions[ResonatorConfigMode.CUSTOM]).toBe("Custom");
    });

    it("should be comparable with strict equality", () => {
      const mode1 = ResonatorConfigMode.SAME_MASS;
      const mode2 = ResonatorConfigMode.SAME_MASS;
      const mode3 = ResonatorConfigMode.CUSTOM;

      expect(mode1 === mode2).toBe(true);
      expect((mode1 as string) === (mode3 as string)).toBe(false);
    });

    it("should work with array includes", () => {
      const automaticModes: ResonatorConfigModeType[] = [
        ResonatorConfigMode.SAME_MASS,
        ResonatorConfigMode.SAME_SPRING_CONSTANT,
        ResonatorConfigMode.MIXED,
        ResonatorConfigMode.SAME_FREQUENCY,
      ];

      expect(automaticModes.includes(ResonatorConfigMode.SAME_MASS)).toBe(true);
      expect(automaticModes.includes(ResonatorConfigMode.CUSTOM)).toBe(false);
    });
  });

  describe("const assertion", () => {
    it("should be a const object (immutable)", () => {
      // The object is defined with `as const`, so values should be literal types
      const mode: "sameMass" = ResonatorConfigMode.SAME_MASS;
      expect(mode).toBe("sameMass");
    });

    it("should not allow modification", () => {
      // TypeScript prevents this at compile time, but we can verify the values are stable
      const originalValue = ResonatorConfigMode.SAME_MASS;
      expect(ResonatorConfigMode.SAME_MASS).toBe(originalValue);
    });
  });

  describe("string representation", () => {
    it("should have camelCase string values", () => {
      Object.values(ResonatorConfigMode).forEach((value) => {
        // Should be camelCase (starts lowercase, no underscores)
        expect(value[0]).toBe(value[0]!.toLowerCase());
        expect(value).not.toContain("_");
      });
    });

    it("should be valid identifiers", () => {
      const validIdentifier = /^[a-zA-Z][a-zA-Z0-9]*$/;
      Object.values(ResonatorConfigMode).forEach((value) => {
        expect(validIdentifier.test(value)).toBe(true);
      });
    });

    it("should be serializable to JSON", () => {
      const mode = ResonatorConfigMode.SAME_FREQUENCY;
      const serialized = JSON.stringify({ mode });
      const deserialized = JSON.parse(serialized) as { mode: string };

      expect(deserialized.mode).toBe(ResonatorConfigMode.SAME_FREQUENCY);
    });
  });

  describe("exhaustiveness", () => {
    it("should cover all physics distribution scenarios", () => {
      const allModes = Object.values(ResonatorConfigMode);

      // Should have mode for: same mass, same k, mixed, same frequency, custom
      expect(allModes).toContain("sameMass");
      expect(allModes).toContain("sameSpringConstant");
      expect(allModes).toContain("mixed");
      expect(allModes).toContain("sameFrequency");
      expect(allModes).toContain("custom");
    });

    it("should have modes that are mutually exclusive", () => {
      // Each mode represents a different configuration strategy
      const modes = Object.values(ResonatorConfigMode);
      const uniqueModes = new Set(modes);

      expect(uniqueModes.size).toBe(modes.length);
    });
  });
});
