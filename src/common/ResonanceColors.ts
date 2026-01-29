/**
 * ResonanceColors defines the color palette for the Resonance simulation.
 * Colors are defined as ProfileColorProperty instances which adapt to different color profiles.
 */

import { ProfileColorProperty, Color } from "scenerystack/scenery";
import resonance from "./ResonanceNamespace.js";

const ResonanceColors = {
  // Background
  backgroundProperty: new ProfileColorProperty(resonance, "background", {
    default: new Color(0, 0, 0),
    projector: new Color(255, 255, 255),
  }),

  // Panel
  panelFillProperty: new ProfileColorProperty(resonance, "panelFill", {
    default: new Color(40, 40, 40),
    projector: new Color(240, 240, 240),
  }),

  panelStrokeProperty: new ProfileColorProperty(resonance, "panelStroke", {
    default: new Color(150, 150, 150),
    projector: new Color(204, 204, 204),
  }),

  // Text
  textProperty: new ProfileColorProperty(resonance, "text", {
    default: new Color(255, 255, 255),
    projector: new Color(0, 0, 0),
  }),

  textSecondaryProperty: new ProfileColorProperty(resonance, "textSecondary", {
    default: new Color(180, 180, 180),
    projector: new Color(102, 102, 102),
  }),

  // Preferences text - stays black regardless of color profile
  preferencesTextProperty: new ProfileColorProperty(
    resonance,
    "preferencesText",
    {
      default: new Color(0, 0, 0),
      projector: new Color(0, 0, 0),
    },
  ),

  preferencesTextSecondaryProperty: new ProfileColorProperty(
    resonance,
    "preferencesTextSecondary",
    {
      default: new Color(102, 102, 102),
      projector: new Color(102, 102, 102),
    },
  ),

  // Spring and mass
  springProperty: new ProfileColorProperty(resonance, "spring", {
    default: new Color(255, 100, 100),
    projector: new Color(204, 0, 0),
  }),

  massProperty: new ProfileColorProperty(resonance, "mass", {
    default: new Color(120, 180, 255),
    projector: new Color(51, 102, 255),
  }),

  massStrokeProperty: new ProfileColorProperty(resonance, "massStroke", {
    default: new Color(180, 220, 255),
    projector: new Color(0, 51, 170),
  }),

  massLabelProperty: new ProfileColorProperty(resonance, "massLabel", {
    default: new Color(255, 255, 255),
    projector: new Color(255, 255, 255),
  }),

  // Mass label color when being dragged (yellow for visibility)
  massLabelDraggingProperty: new ProfileColorProperty(
    resonance,
    "massLabelDragging",
    {
      default: new Color(255, 255, 100),
      projector: new Color(255, 255, 0), // Bright yellow
    },
  ),

  equilibriumProperty: new ProfileColorProperty(resonance, "equilibrium", {
    default: new Color(120, 255, 120),
    projector: new Color(76, 175, 80),
  }),

  // Driver box
  driverFillProperty: new ProfileColorProperty(resonance, "driverFill", {
    default: new Color(80, 80, 80),
    projector: new Color(136, 136, 136),
  }),

  driverStrokeProperty: new ProfileColorProperty(resonance, "driverStroke", {
    default: new Color(180, 180, 180),
    projector: new Color(68, 68, 68),
  }),

  driverTextProperty: new ProfileColorProperty(resonance, "driverText", {
    default: new Color(255, 255, 255),
    projector: new Color(255, 255, 255),
  }),

  // Control panel
  controlPanelFillProperty: new ProfileColorProperty(
    resonance,
    "controlPanelFill",
    {
      default: new Color(30, 80, 30),
      projector: new Color(204, 255, 204),
    },
  ),

  controlPanelStrokeProperty: new ProfileColorProperty(
    resonance,
    "controlPanelStroke",
    {
      default: new Color(100, 255, 100),
      projector: new Color(0, 102, 0),
    },
  ),

  // Sub-panel colors (for mass/spring/resonator/frequency sub-panel)
  subPanelFillProperty: new ProfileColorProperty(resonance, "subPanelFill", {
    default: new Color(30, 60, 100), // Dark blue for default
    projector: new Color(200, 230, 255), // Light blue
  }),

  subPanelStrokeProperty: new ProfileColorProperty(
    resonance,
    "subPanelStroke",
    {
      default: new Color(80, 130, 200), // Lighter blue for default
      projector: new Color(100, 150, 200), // Medium blue
    },
  ),

  // Energy colors
  kineticEnergyProperty: new ProfileColorProperty(resonance, "kineticEnergy", {
    default: new Color(255, 180, 50),
    projector: new Color(255, 152, 0),
  }),

  potentialEnergyProperty: new ProfileColorProperty(
    resonance,
    "potentialEnergy",
    {
      default: new Color(100, 200, 255),
      projector: new Color(3, 169, 244),
    },
  ),

  totalEnergyProperty: new ProfileColorProperty(resonance, "totalEnergy", {
    default: new Color(200, 100, 255),
    projector: new Color(156, 39, 176),
  }),

  // Plots
  plot1Property: new ProfileColorProperty(resonance, "plot1", {
    default: new Color(100, 180, 255),
    projector: new Color(33, 150, 243),
  }),

  plot2Property: new ProfileColorProperty(resonance, "plot2", {
    default: new Color(255, 120, 80),
    projector: new Color(255, 87, 34),
  }),

  plot3Property: new ProfileColorProperty(resonance, "plot3", {
    default: new Color(200, 100, 255),
    projector: new Color(156, 39, 176),
  }),

  // Grid and axes
  gridLinesProperty: new ProfileColorProperty(resonance, "gridLines", {
    default: new Color(60, 60, 60),
    projector: new Color(224, 224, 224),
  }),

  axesProperty: new ProfileColorProperty(resonance, "axes", {
    default: new Color(200, 200, 200),
    projector: new Color(117, 117, 117),
  }),

  // Phase colors
  inPhaseProperty: new ProfileColorProperty(resonance, "inPhase", {
    default: new Color(100, 255, 100),
    projector: new Color(76, 175, 80),
  }),

  outOfPhaseProperty: new ProfileColorProperty(resonance, "outOfPhase", {
    default: new Color(255, 100, 100),
    projector: new Color(244, 67, 54),
  }),

  // Frequency slider track
  frequencyTrackProperty: new ProfileColorProperty(
    resonance,
    "frequencyTrack",
    {
      default: new Color(0, 255, 0),
      projector: new Color(0, 204, 0),
    },
  ),

  // Amplitude slider track
  amplitudeTrackProperty: new ProfileColorProperty(
    resonance,
    "amplitudeTrack",
    {
      default: new Color(100, 180, 255),
      projector: new Color(51, 153, 255),
    },
  ),

  // Toggle switch colors
  toggleTrackOffProperty: new ProfileColorProperty(
    resonance,
    "toggleTrackOff",
    {
      default: new Color(100, 100, 100),
      projector: new Color(102, 102, 102), // #666666
    },
  ),

  toggleTrackOnProperty: new ProfileColorProperty(resonance, "toggleTrackOn", {
    default: new Color(100, 255, 100),
    projector: new Color(0, 204, 0), // #00CC00
  }),

  // Spring back color (for ParametricSpringNode)
  springBackProperty: new ProfileColorProperty(resonance, "springBack", {
    default: new Color(180, 50, 50),
    projector: new Color(102, 0, 0), // #660000
  }),

  // Gravity toggle colors
  gravityToggleOffProperty: new ProfileColorProperty(
    resonance,
    "gravityToggleOff",
    {
      default: new Color(100, 100, 100),
      projector: new Color(153, 153, 153), // #999999
    },
  ),

  gravityToggleOnProperty: new ProfileColorProperty(
    resonance,
    "gravityToggleOn",
    {
      default: new Color(100, 180, 255),
      projector: new Color(68, 153, 255), // #4499FF
    },
  ),
};

export default ResonanceColors;
