/**
 * Chladni Model Module Exports
 *
 * This file exports all model-related classes and types for the Chladni plate simulation.
 */

// Main model
export { ChladniModel } from "./ChladniModel.js";
export type { BoundaryMode, GrainCountOption } from "./ChladniModel.js";
export { GRAIN_COUNT_OPTIONS } from "./ChladniModel.js";

// Physics calculations
export { ModalCalculator } from "./ModalCalculator.js";
export type { ModalCalculatorOptions } from "./ModalCalculator.js";

// Particle management
export { ParticleManager } from "./ParticleManager.js";

// Plate geometry
export { PlateGeometry } from "./PlateGeometry.js";
export type { PlateGeometryOptions } from "./PlateGeometry.js";

// Resonance curve calculation
export { ResonanceCurveCalculator } from "./ResonanceCurveCalculator.js";
export type { ResonanceCurveCalculatorOptions } from "./ResonanceCurveCalculator.js";

// Frequency sweep control (re-exported from common)
export { FrequencySweepController } from "../../common/model/FrequencySweepController.js";
export type { FrequencySweepControllerOptions } from "../../common/model/FrequencySweepController.js";

// Playback state management
export { PlaybackStateMachine, PlaybackState } from "./PlaybackStateMachine.js";

// Material definitions
export { Material } from "./Material.js";
export type { MaterialType } from "./Material.js";

// Constants
export { default as ChladniConstants } from "./ChladniConstants.js";
export * from "./ChladniConstants.js";
