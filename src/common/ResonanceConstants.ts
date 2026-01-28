/**
 * ResonanceConstants defines the magic numbers and layout constants
 * used throughout the Resonance simulation.
 */

import { Range } from "scenerystack/dot";
import { PhetFont } from "scenerystack/scenery-phet";

// ===== FONTS =====

const LABEL_FONT = new PhetFont({ size: 14, weight: 'bold' });
const TITLE_FONT = new PhetFont({ size: 16, weight: 'bold' });
const TICK_LABEL_FONT = new PhetFont({ size: 12 });
const CONTROL_FONT = new PhetFont({ size: 14 });

// ===== DRIVER BOX =====

const DRIVER_BOX_WIDTH = 600;
const DRIVER_BOX_HEIGHT = 120;
const DRIVER_BOX_CORNER_RADIUS = 10;
const DRIVER_BOX_LINE_WIDTH = 2;
const DRIVER_BOTTOM_MARGIN = 100; // distance from layout bounds bottom
const DRIVER_CENTER_X_OFFSET = -100; // offset from layout center

// ===== DRIVER PLATE AND CONNECTION ROD =====

const DRIVER_PLATE_HEIGHT = 20;
const DRIVER_PLATE_VERTICAL_OFFSET = 30; // distance above driver box top
const DRIVER_PLATE_CORNER_RADIUS = 5;
const CONNECTION_ROD_WIDTH = 15;
const CONNECTION_ROD_HEIGHT = 30; // base height when not oscillating
const CONNECTION_ROD_MIN_HEIGHT = 10; // minimum height during oscillation
const CONNECTION_ROD_CORNER_RADIUS = 7.5;

// ===== DRIVER CONTROLS =====

const CONTROL_SCALE = 0.7;
const POWER_TOGGLE_SPACING = 8;
const POWER_TOGGLE_LEFT = 15;
const POWER_TOGGLE_TOP = 15;
const FREQUENCY_CONTROL_TOP = 40;
const AMPLITUDE_CONTROL_LEFT = 10;
const AMPLITUDE_CONTROL_BOTTOM_MARGIN = 40;

// ===== PHYSICS RANGES =====

const FREQUENCY_RANGE = new Range( 0.1, 5 );
const AMPLITUDE_RANGE = new Range( 0.002, 0.02 ); // 0.2 cm to 2 cm (in meters)
const RESONATOR_COUNT_RANGE = new Range( 1, 10 );
const MASS_RANGE = new Range( 0.1, 5.0 );
const SPRING_CONSTANT_RANGE = new Range( 10, 1200 );
const DAMPING_RANGE = new Range( 0.1, 5 );

// ===== MODEL-VIEW TRANSFORM =====

const MODEL_BOUNDS_MIN = -0.5; // meters (symmetric: -0.5 m to +0.5 m = 1 m total)
const MODEL_BOUNDS_MAX = 0.5;  // meters

// ===== SPRING AND MASS RENDERING =====

// Mass node sizing: square boxes instead of circles
// size = max( MIN_MASS_SIZE, MAX_MASS_SIZE - count )
const MAX_MASS_SIZE = 50; // pixels (width and height of square)
const MIN_MASS_SIZE = 20; // pixels
const MASS_STROKE_LINE_WIDTH = 3;
const MASS_LABEL_FONT_SIZE_BASE = 24; // base font size
const MASS_LABEL_FONT_SIZE_MIN = 10;  // minimum font size
const MASS_CENTER_OFFSET = 5; // pixels - offset of mass center above junction point

// ParametricSpringNode configuration
const SPRING_LOOPS = 10;
const SPRING_RADIUS = 5; // Reduced from 8 to make springs narrower
const SPRING_ASPECT_RATIO = 4;
const SPRING_POINTS_PER_LOOP = 40;
const SPRING_LINE_WIDTH = 1;
const SPRING_LINE_WIDTH_MIN = 1; // minimum line width based on spring constant
const SPRING_LINE_WIDTH_MAX = 5; // maximum line width based on spring constant
const SPRING_LEFT_END_LENGTH = 5;
const SPRING_RIGHT_END_LENGTH = 5;
const MIN_SPRING_XSCALE = 0.3;

// ===== RULER =====

const RULER_WIDTH = 500; // 50 cm total length
const RULER_HEIGHT = 40;
const RULER_MAJOR_TICK_WIDTH = 50; // 5 cm per major tick
const RULER_MINOR_TICKS_PER_MAJOR = 4; // 1 cm per minor tick
const RULER_INSETS_WIDTH = 10;
const RULER_LEFT_MARGIN = 80;
const RULER_TOP_MARGIN = 300;

// ===== CONTROL PANEL =====

const CONTROL_PANEL_CORNER_RADIUS = 10;
const CONTROL_PANEL_LINE_WIDTH = 2;
const CONTROL_PANEL_X_MARGIN = 15;
const CONTROL_PANEL_Y_MARGIN = 15;
const CONTROL_PANEL_SPACING = 15;
const CONTROL_PANEL_RIGHT_MARGIN = 20;
const CONTROL_PANEL_TOP_MARGIN = 20;
const SEPARATOR_WIDTH = 250;
const SEPARATOR_LINE_WIDTH = 1;

// ===== COMBO BOX =====

const COMBO_BOX_X_MARGIN = 10;
const COMBO_BOX_Y_MARGIN = 6;
const COMBO_BOX_CORNER_RADIUS = 5;
const COMBO_BOX_SPACING = 5;

// ===== GRAVITY =====

const GRAVITY_ACCELERATION = 9.8;
const GRAVITY_BOX_SPACING = 10;

// ===== RULER CHECKBOX =====

const RULER_CHECKBOX_BOX_WIDTH = 18;

// ===== RESET ALL BUTTON =====

const RESET_ALL_RIGHT_MARGIN = 20;
const RESET_ALL_BOTTOM_MARGIN = 20;

// ===== PLAYBACK CONTROLS =====

const STEP_DT = 0.016;
const PLAY_PAUSE_SCALE = 0.8;
const PLAYBACK_CONTROLS_SPACING = 10;
const SPEED_CONTROL_SPACING = 5;
const SPEED_RADIO_BUTTON_RADIUS = 8;
const PLAYBACK_BOTTOM_MARGIN = 20;

const ResonanceConstants = {
  // Fonts
  LABEL_FONT,
  TITLE_FONT,
  TICK_LABEL_FONT,
  CONTROL_FONT,

  // Driver box
  DRIVER_BOX_WIDTH,
  DRIVER_BOX_HEIGHT,
  DRIVER_BOX_CORNER_RADIUS,
  DRIVER_BOX_LINE_WIDTH,
  DRIVER_BOTTOM_MARGIN,
  DRIVER_CENTER_X_OFFSET,

  // Driver plate and connection rod
  DRIVER_PLATE_HEIGHT,
  DRIVER_PLATE_VERTICAL_OFFSET,
  DRIVER_PLATE_CORNER_RADIUS,
  CONNECTION_ROD_WIDTH,
  CONNECTION_ROD_HEIGHT,
  CONNECTION_ROD_MIN_HEIGHT,
  CONNECTION_ROD_CORNER_RADIUS,

  // Driver controls
  CONTROL_SCALE,
  POWER_TOGGLE_SPACING,
  POWER_TOGGLE_LEFT,
  POWER_TOGGLE_TOP,
  FREQUENCY_CONTROL_TOP,
  AMPLITUDE_CONTROL_LEFT,
  AMPLITUDE_CONTROL_BOTTOM_MARGIN,

  // Physics ranges
  FREQUENCY_RANGE,
  AMPLITUDE_RANGE,
  RESONATOR_COUNT_RANGE,
  MASS_RANGE,
  SPRING_CONSTANT_RANGE,
  DAMPING_RANGE,

  // Model-view transform
  MODEL_BOUNDS_MIN,
  MODEL_BOUNDS_MAX,

  // Spring and mass rendering
  MAX_MASS_SIZE,
  MIN_MASS_SIZE,
  MASS_STROKE_LINE_WIDTH,
  MASS_LABEL_FONT_SIZE_BASE,
  MASS_LABEL_FONT_SIZE_MIN,
  MASS_CENTER_OFFSET,
  SPRING_LOOPS,
  SPRING_RADIUS,
  SPRING_ASPECT_RATIO,
  SPRING_POINTS_PER_LOOP,
  SPRING_LINE_WIDTH,
  SPRING_LINE_WIDTH_MIN,
  SPRING_LINE_WIDTH_MAX,
  SPRING_LEFT_END_LENGTH,
  SPRING_RIGHT_END_LENGTH,
  MIN_SPRING_XSCALE,

  // Ruler
  RULER_WIDTH,
  RULER_HEIGHT,
  RULER_MAJOR_TICK_WIDTH,
  RULER_MINOR_TICKS_PER_MAJOR,
  RULER_INSETS_WIDTH,
  RULER_LEFT_MARGIN,
  RULER_TOP_MARGIN,

  // Control panel
  CONTROL_PANEL_CORNER_RADIUS,
  CONTROL_PANEL_LINE_WIDTH,
  CONTROL_PANEL_X_MARGIN,
  CONTROL_PANEL_Y_MARGIN,
  CONTROL_PANEL_SPACING,
  CONTROL_PANEL_RIGHT_MARGIN,
  CONTROL_PANEL_TOP_MARGIN,
  SEPARATOR_WIDTH,
  SEPARATOR_LINE_WIDTH,

  // Combo box
  COMBO_BOX_X_MARGIN,
  COMBO_BOX_Y_MARGIN,
  COMBO_BOX_CORNER_RADIUS,
  COMBO_BOX_SPACING,

  // Gravity
  GRAVITY_ACCELERATION,
  GRAVITY_BOX_SPACING,

  // Ruler checkbox
  RULER_CHECKBOX_BOX_WIDTH,

  // Reset all button
  RESET_ALL_RIGHT_MARGIN,
  RESET_ALL_BOTTOM_MARGIN,

  // Playback controls
  STEP_DT,
  PLAY_PAUSE_SCALE,
  PLAYBACK_CONTROLS_SPACING,
  SPEED_CONTROL_SPACING,
  SPEED_RADIO_BUTTON_RADIUS,
  PLAYBACK_BOTTOM_MARGIN
};

export default ResonanceConstants;
