/**
 * Tests for SolverType - ODE solver type enumeration
 *
 * P2 Priority: Tests for solver type values and localized names.
 */

import { describe, it, expect } from "vitest";
import {
  SolverType,
  SolverTypeName,
  SolverTypeDescription,
} from "../SolverType.js";

describe("SolverType", () => {
  describe("enum values", () => {
    it("should have RUNGE_KUTTA_4 type", () => {
      expect(SolverType.RUNGE_KUTTA_4).toBeDefined();
      expect(SolverType.RUNGE_KUTTA_4).toBe("rk4");
    });

    it("should have ADAPTIVE_RK45 type", () => {
      expect(SolverType.ADAPTIVE_RK45).toBeDefined();
      expect(SolverType.ADAPTIVE_RK45).toBe("adaptiveRK45");
    });

    it("should have exactly 2 solver types", () => {
      const solverTypes = Object.values(SolverType);
      expect(solverTypes.length).toBe(2);
    });

    it("should have unique string values", () => {
      const values = Object.values(SolverType);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe("SolverTypeName mapping", () => {
    it("should have name for RUNGE_KUTTA_4", () => {
      expect(SolverTypeName[SolverType.RUNGE_KUTTA_4]).toBeDefined();
    });

    it("should have name for ADAPTIVE_RK45", () => {
      expect(SolverTypeName[SolverType.ADAPTIVE_RK45]).toBeDefined();
    });

    it("should have names for all solver types", () => {
      Object.values(SolverType).forEach((solverType) => {
        expect(SolverTypeName[solverType]).toBeDefined();
      });
    });
  });

  describe("localized name properties", () => {
    it("should return ReadOnlyProperty for RK4 name", () => {
      const nameProp = SolverTypeName[SolverType.RUNGE_KUTTA_4];
      expect(nameProp.value).toBeDefined();
      expect(typeof nameProp.value).toBe("string");
    });

    it("should return ReadOnlyProperty for Adaptive RK45 name", () => {
      const nameProp = SolverTypeName[SolverType.ADAPTIVE_RK45];
      expect(nameProp.value).toBeDefined();
      expect(typeof nameProp.value).toBe("string");
    });

    it("should have non-empty localized names", () => {
      Object.values(SolverType).forEach((solverType) => {
        const name = SolverTypeName[solverType].value;
        expect(name.length).toBeGreaterThan(0);
      });
    });

    it("should have unique localized names", () => {
      const names = Object.values(SolverType).map(
        (solverType) => SolverTypeName[solverType].value,
      );
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe("SolverTypeDescription mapping", () => {
    it("should have description for RUNGE_KUTTA_4", () => {
      expect(SolverTypeDescription[SolverType.RUNGE_KUTTA_4]).toBeDefined();
    });

    it("should have description for ADAPTIVE_RK45", () => {
      expect(SolverTypeDescription[SolverType.ADAPTIVE_RK45]).toBeDefined();
    });

    it("should have descriptions for all solver types", () => {
      Object.values(SolverType).forEach((solverType) => {
        expect(SolverTypeDescription[solverType]).toBeDefined();
      });
    });
  });

  describe("localized description properties", () => {
    it("should return ReadOnlyProperty for RK4 description", () => {
      const descProp = SolverTypeDescription[SolverType.RUNGE_KUTTA_4];
      expect(descProp.value).toBeDefined();
      expect(typeof descProp.value).toBe("string");
    });

    it("should return ReadOnlyProperty for Adaptive RK45 description", () => {
      const descProp = SolverTypeDescription[SolverType.ADAPTIVE_RK45];
      expect(descProp.value).toBeDefined();
      expect(typeof descProp.value).toBe("string");
    });

    it("should have non-empty localized descriptions", () => {
      Object.values(SolverType).forEach((solverType) => {
        const description = SolverTypeDescription[solverType].value;
        expect(description.length).toBeGreaterThan(0);
      });
    });

    it("should have unique localized descriptions", () => {
      const descriptions = Object.values(SolverType).map(
        (solverType) => SolverTypeDescription[solverType].value,
      );
      const uniqueDescriptions = new Set(descriptions);
      expect(uniqueDescriptions.size).toBe(descriptions.length);
    });

    it("should have descriptions longer than names", () => {
      Object.values(SolverType).forEach((solverType) => {
        const name = SolverTypeName[solverType].value;
        const description = SolverTypeDescription[solverType].value;
        expect(description.length).toBeGreaterThan(name.length);
      });
    });
  });

  describe("type safety", () => {
    it("should work with switch statements", () => {
      const getSolverDescription = (type: SolverType): string => {
        switch (type) {
          case SolverType.RUNGE_KUTTA_4:
            return "Fixed-step fourth-order Runge-Kutta";
          case SolverType.ADAPTIVE_RK45:
            return "Adaptive Dormand-Prince RK4/5";
          default:
            return "Unknown";
        }
      };

      expect(getSolverDescription(SolverType.RUNGE_KUTTA_4)).toContain(
        "Runge-Kutta",
      );
      expect(getSolverDescription(SolverType.ADAPTIVE_RK45)).toContain(
        "Dormand-Prince",
      );
    });

    it("should be usable as object keys", () => {
      const solverConfigs: Record<SolverType, { adaptive: boolean }> = {
        [SolverType.RUNGE_KUTTA_4]: { adaptive: false },
        [SolverType.ADAPTIVE_RK45]: { adaptive: true },
      };

      expect(solverConfigs[SolverType.RUNGE_KUTTA_4].adaptive).toBe(false);
      expect(solverConfigs[SolverType.ADAPTIVE_RK45].adaptive).toBe(true);
    });

    it("should be comparable with strict equality", () => {
      const type1 = SolverType.RUNGE_KUTTA_4;
      const type2 = SolverType.RUNGE_KUTTA_4;
      const type3 = SolverType.ADAPTIVE_RK45;

      expect(type1 === type2).toBe(true);
      expect((type1 as string) === (type3 as string)).toBe(false);
    });
  });

  describe("string representation", () => {
    it("should have lowercase string values", () => {
      Object.values(SolverType).forEach((value) => {
        // Should be camelCase (starts lowercase)
        expect(value[0]).toBe(value[0]!.toLowerCase());
      });
    });

    it("should be valid identifiers", () => {
      const validIdentifier = /^[a-zA-Z][a-zA-Z0-9]*$/;
      Object.values(SolverType).forEach((value) => {
        expect(validIdentifier.test(value)).toBe(true);
      });
    });
  });
});
