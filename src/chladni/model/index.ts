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

// Guitar plate geometry
export { GuitarPlateGeometry } from "./GuitarPlateGeometry.js";

// Circular plate geometry
export { CircularPlateGeometry } from "./CircularPlateGeometry.js";

// Plate shape enumeration
export { PlateShape, DEFAULT_PLATE_SHAPE } from "./PlateShape.js";
export type { PlateShapeType } from "./PlateShape.js";

// Modal calculator strategy interface
export type { IModalCalculatorStrategy } from "./IModalCalculatorStrategy.js";

// Circular modal calculator
export { CircularModalCalculator } from "./CircularModalCalculator.js";
export type {
  CircularModalCalculatorOptions,
  CircularBoundaryCondition,
} from "./CircularModalCalculator.js";

// Guitar modal calculator
export { GuitarModalCalculator } from "./GuitarModalCalculator.js";
export type { GuitarModalCalculatorOptions } from "./GuitarModalCalculator.js";

// Modal calculator factory
export { ModalCalculatorFactory } from "./ModalCalculatorFactory.js";
export type { ModalCalculatorFactoryOptions } from "./ModalCalculatorFactory.js";

// Bessel functions
export {
  besselJ,
  besselY,
  besselJPrime,
  getBesselJZero,
  getBesselJPrimeZero,
  BESSEL_J_ZEROS,
  BESSEL_J_PRIME_ZEROS,
} from "./BesselFunctions.js";

// Resonance curve calculation
export { ResonanceCurveCalculator } from "./ResonanceCurveCalculator.js";
export type { ResonanceCurveCalculatorOptions } from "./ResonanceCurveCalculator.js";

// Frequency sweep control
export { FrequencySweepController } from "./FrequencySweepController.js";
export type { FrequencySweepControllerOptions } from "./FrequencySweepController.js";

// Playback state management
export { PlaybackStateMachine, PlaybackState } from "./PlaybackStateMachine.js";

// Material definitions
export { Material } from "./Material.js";
export type { MaterialType } from "./Material.js";

// Constants
export { default as ChladniConstants } from "./ChladniConstants.js";
export * from "./ChladniConstants.js";
