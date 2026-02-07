/**
 * Tests for ResonancePreferencesModel - Preferences persistence
 *
 * P2 Priority: User preferences with localStorage persistence.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  ResonancePreferencesModel,
  StoredPreferences,
} from "../ResonancePreferencesModel.js";
import { SolverType } from "../../common/model/SolverType.js";

/** Typed shape for setItem spy when reading .mock or calling .mockImplementation */
interface SetItemSpyLike {
  mock: { calls: [string, string][] };
  mockImplementation: (fn: (key: string, value: string) => void) => void;
}
/** Typed shape for getItem spy when calling .mockImplementation */
interface GetItemSpyLike {
  mockImplementation: (fn: (key: string) => string | null) => void;
}

describe("ResonancePreferencesModel", () => {
  let mockStorage: Record<string, string>;
  let getItemSpy: ReturnType<typeof vi.spyOn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear real localStorage and set up mock storage
    localStorage.clear();
    mockStorage = {};

    // Spy on localStorage methods
    getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation((key: string) => {
        return mockStorage[key] ?? null;
      });

    setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation((key: string, value: string) => {
        mockStorage[key] = value;
      });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("default values", () => {
    it("should have correct default for showEnergy", () => {
      const model = new ResonancePreferencesModel();
      expect(model.showEnergyProperty.value).toBe(true);
    });

    it("should have correct default for showVectors", () => {
      const model = new ResonancePreferencesModel();
      expect(model.showVectorsProperty.value).toBe(false);
    });

    it("should have correct default for showPhase", () => {
      const model = new ResonancePreferencesModel();
      expect(model.showPhaseProperty.value).toBe(true);
    });

    it("should have correct default for solverType", () => {
      const model = new ResonancePreferencesModel();
      expect(model.solverTypeProperty.value).toBe(SolverType.RUNGE_KUTTA_4);
    });
  });

  describe("persistence save", () => {
    it("should save showEnergy changes to localStorage", () => {
      const model = new ResonancePreferencesModel();
      model.showEnergyProperty.value = false;

      expect(mockStorage["resonance-preferences"]).toBeDefined();
      const saved = JSON.parse(
        mockStorage["resonance-preferences"]!,
      ) as StoredPreferences;
      expect(saved.showEnergy).toBe(false);
    });

    it("should save showVectors changes to localStorage", () => {
      const model = new ResonancePreferencesModel();
      model.showVectorsProperty.value = true;

      const saved = JSON.parse(
        mockStorage["resonance-preferences"]!,
      ) as StoredPreferences;
      expect(saved.showVectors).toBe(true);
    });

    it("should save showPhase changes to localStorage", () => {
      const model = new ResonancePreferencesModel();
      model.showPhaseProperty.value = false;

      const saved = JSON.parse(
        mockStorage["resonance-preferences"]!,
      ) as StoredPreferences;
      expect(saved.showPhase).toBe(false);
    });

    it("should save solverType changes to localStorage", () => {
      const model = new ResonancePreferencesModel();
      model.solverTypeProperty.value = SolverType.ADAPTIVE_RK45;

      const saved = JSON.parse(
        mockStorage["resonance-preferences"]!,
      ) as StoredPreferences;
      expect(saved.solverType).toBe(SolverType.ADAPTIVE_RK45);
    });

    it("should save all preferences together", () => {
      const model = new ResonancePreferencesModel();
      model.showEnergyProperty.value = false;
      model.showVectorsProperty.value = true;
      model.showPhaseProperty.value = false;
      model.solverTypeProperty.value = SolverType.ADAPTIVE_RK45;

      const saved = JSON.parse(
        mockStorage["resonance-preferences"]!,
      ) as StoredPreferences;
      expect(saved).toEqual({
        showEnergy: false,
        showVectors: true,
        showPhase: false,
        solverType: SolverType.ADAPTIVE_RK45,
        showModalControls: false, // Default value
        rendererType: "canvas", // Default renderer type
      });
    });

    it("should call localStorage.setItem when saving", () => {
      const model = new ResonancePreferencesModel();
      const setItemMock = (setItemSpy as SetItemSpyLike).mock;
      const initialCallCount = setItemMock.calls.length;

      model.showEnergyProperty.value = false;

      expect(setItemSpy).toHaveBeenCalledWith(
        "resonance-preferences",
        expect.any(String),
      );
      expect(setItemMock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe("persistence load", () => {
    it("should load showEnergy from localStorage", () => {
      mockStorage["resonance-preferences"] = JSON.stringify({
        showEnergy: false,
      });

      const model = new ResonancePreferencesModel();
      expect(model.showEnergyProperty.value).toBe(false);
    });

    it("should load showVectors from localStorage", () => {
      mockStorage["resonance-preferences"] = JSON.stringify({
        showVectors: true,
      });

      const model = new ResonancePreferencesModel();
      expect(model.showVectorsProperty.value).toBe(true);
    });

    it("should load showPhase from localStorage", () => {
      mockStorage["resonance-preferences"] = JSON.stringify({
        showPhase: false,
      });

      const model = new ResonancePreferencesModel();
      expect(model.showPhaseProperty.value).toBe(false);
    });

    it("should load solverType from localStorage", () => {
      mockStorage["resonance-preferences"] = JSON.stringify({
        solverType: SolverType.ADAPTIVE_RK45,
      });

      const model = new ResonancePreferencesModel();
      expect(model.solverTypeProperty.value).toBe(SolverType.ADAPTIVE_RK45);
    });

    it("should load all saved preferences", () => {
      mockStorage["resonance-preferences"] = JSON.stringify({
        showEnergy: false,
        showVectors: true,
        showPhase: false,
        solverType: SolverType.ADAPTIVE_RK45,
      });

      const model = new ResonancePreferencesModel();

      expect(model.showEnergyProperty.value).toBe(false);
      expect(model.showVectorsProperty.value).toBe(true);
      expect(model.showPhaseProperty.value).toBe(false);
      expect(model.solverTypeProperty.value).toBe(SolverType.ADAPTIVE_RK45);
    });

    it("should call localStorage.getItem when loading", () => {
      new ResonancePreferencesModel();

      expect(getItemSpy).toHaveBeenCalledWith("resonance-preferences");
    });
  });

  describe("invalid storage data", () => {
    it("should use defaults for invalid JSON", () => {
      mockStorage["resonance-preferences"] = "not valid json";

      // Should not throw, should use defaults
      const model = new ResonancePreferencesModel();

      expect(model.showEnergyProperty.value).toBe(true);
      expect(model.showVectorsProperty.value).toBe(false);
      expect(model.showPhaseProperty.value).toBe(true);
      expect(model.solverTypeProperty.value).toBe(SolverType.RUNGE_KUTTA_4);
    });

    it("should use defaults when localStorage is empty", () => {
      // mockStorage is empty by default

      const model = new ResonancePreferencesModel();

      expect(model.showEnergyProperty.value).toBe(true);
      expect(model.showVectorsProperty.value).toBe(false);
      expect(model.showPhaseProperty.value).toBe(true);
      expect(model.solverTypeProperty.value).toBe(SolverType.RUNGE_KUTTA_4);
    });

    it("should handle partial saved data gracefully", () => {
      mockStorage["resonance-preferences"] = JSON.stringify({
        showEnergy: false,
        // Missing other fields
      });

      const model = new ResonancePreferencesModel();

      expect(model.showEnergyProperty.value).toBe(false); // Loaded
      expect(model.showVectorsProperty.value).toBe(false); // Default
      expect(model.showPhaseProperty.value).toBe(true); // Default
      expect(model.solverTypeProperty.value).toBe(SolverType.RUNGE_KUTTA_4); // Default
    });
  });

  describe("reset functionality", () => {
    it("should reset showEnergy to default", () => {
      const model = new ResonancePreferencesModel();
      model.showEnergyProperty.value = false;

      model.reset();

      expect(model.showEnergyProperty.value).toBe(true);
    });

    it("should reset showVectors to default", () => {
      const model = new ResonancePreferencesModel();
      model.showVectorsProperty.value = true;

      model.reset();

      expect(model.showVectorsProperty.value).toBe(false);
    });

    it("should reset showPhase to default", () => {
      const model = new ResonancePreferencesModel();
      model.showPhaseProperty.value = false;

      model.reset();

      expect(model.showPhaseProperty.value).toBe(true);
    });

    it("should reset solverType to default", () => {
      const model = new ResonancePreferencesModel();
      model.solverTypeProperty.value = SolverType.ADAPTIVE_RK45;

      model.reset();

      expect(model.solverTypeProperty.value).toBe(SolverType.RUNGE_KUTTA_4);
    });

    it("should reset all properties at once", () => {
      const model = new ResonancePreferencesModel();
      model.showEnergyProperty.value = false;
      model.showVectorsProperty.value = true;
      model.showPhaseProperty.value = false;
      model.solverTypeProperty.value = SolverType.ADAPTIVE_RK45;

      model.reset();

      expect(model.showEnergyProperty.value).toBe(true);
      expect(model.showVectorsProperty.value).toBe(false);
      expect(model.showPhaseProperty.value).toBe(true);
      expect(model.solverTypeProperty.value).toBe(SolverType.RUNGE_KUTTA_4);
    });

    it("should trigger save after reset", () => {
      const model = new ResonancePreferencesModel();
      model.showEnergyProperty.value = false;
      const setItemMock: { calls: [string, string][] } = (
        setItemSpy as SetItemSpyLike
      ).mock;
      const countBeforeReset = setItemMock.calls.length;

      model.reset();

      // Reset triggers saves for each property that changes
      expect(setItemMock.calls.length).toBeGreaterThan(countBeforeReset);
    });
  });

  describe("localStorage error handling", () => {
    it("should handle localStorage.getItem throwing", () => {
      (getItemSpy as GetItemSpyLike).mockImplementation(() => {
        throw new Error("Storage error");
      });

      // Should not throw, should use defaults
      const model = new ResonancePreferencesModel();

      expect(model.showEnergyProperty.value).toBe(true);
    });

    it("should handle localStorage.setItem throwing", () => {
      (setItemSpy as SetItemSpyLike).mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      // Should not throw when saving
      const model = new ResonancePreferencesModel();
      expect(() => {
        model.showEnergyProperty.value = false;
      }).not.toThrow();
    });
  });

  describe("property change triggers save", () => {
    it("should save on every property change", () => {
      const model = new ResonancePreferencesModel();
      const setItemMock = (setItemSpy as SetItemSpyLike).mock;
      const initialCount = setItemMock.calls.length;

      model.showEnergyProperty.value = false;
      model.showVectorsProperty.value = true;
      model.showPhaseProperty.value = false;
      model.solverTypeProperty.value = SolverType.ADAPTIVE_RK45;

      // Should have called setItem 4 more times (once for each property change)
      expect(setItemMock.calls.length).toBe(initialCount + 4);
    });

    it("should save with correct key", () => {
      const model = new ResonancePreferencesModel();
      model.showEnergyProperty.value = false;

      const setItemMock = (setItemSpy as SetItemSpyLike).mock;
      const mockCalls = setItemMock.calls;
      const lastCall = mockCalls[mockCalls.length - 1];
      expect(lastCall?.[0]).toBe("resonance-preferences");
    });
  });
});
