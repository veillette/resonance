/**
 * PlateShape.ts
 *
 * Enumeration of available plate shapes for the Chladni simulation.
 */

/**
 * Available plate shapes for the Chladni simulation.
 */
export const PlateShape = {
  RECTANGLE: "rectangle",
  CIRCLE: "circle",
  GUITAR: "guitar",
} as const;

export type PlateShapeType = (typeof PlateShape)[keyof typeof PlateShape];

/**
 * Default plate shape
 */
export const DEFAULT_PLATE_SHAPE: PlateShapeType = PlateShape.RECTANGLE;
