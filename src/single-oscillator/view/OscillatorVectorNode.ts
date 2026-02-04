/**
 * OscillatorVectorNode displays velocity, acceleration, and applied force vectors
 * on the oscillator mass. Each vector is shown as an arrow originating from the
 * center of the mass, with length proportional to the magnitude of the quantity.
 *
 * The vectors are:
 * - Velocity (green): points in the direction of motion
 * - Acceleration (yellow): points in the direction of net acceleration
 * - Applied Force (orange): the spring force from the driver
 */

import { Node } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { BooleanProperty, TReadOnlyProperty, Multilink, UnknownMultilink } from "scenerystack/axon";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import ResonanceColors from "../../common/ResonanceColors.js";
import { ResonanceModel } from "../../common/model/ResonanceModel.js";

// Scale factors to convert physics values to pixel lengths
const VELOCITY_SCALE = 50; // pixels per m/s
const ACCELERATION_SCALE = 2; // pixels per m/s^2
const FORCE_SCALE = 0.5; // pixels per Newton

// Minimum length threshold to display vectors (pixels)
const MIN_VECTOR_LENGTH = 2;

// Arrow styling constants
const ARROW_HEAD_WIDTH = 12;
const ARROW_HEAD_HEIGHT = 10;
const ARROW_TAIL_WIDTH = 5;

export type OscillatorVectorNodeOptions = {
  velocityVisibleProperty: BooleanProperty;
  accelerationVisibleProperty: BooleanProperty;
  appliedForceVisibleProperty: BooleanProperty;
};

export class OscillatorVectorNode extends Node {
  private readonly velocityArrow: ArrowNode;
  private readonly accelerationArrow: ArrowNode;
  private readonly appliedForceArrow: ArrowNode;
  private readonly model: ResonanceModel;
  private readonly _modelViewTransform: ModelViewTransform2;
  private readonly multilink: UnknownMultilink;

  public constructor(
    model: ResonanceModel,
    modelViewTransform: ModelViewTransform2,
    options: OscillatorVectorNodeOptions,
  ) {
    super();

    this.model = model;
    this._modelViewTransform = modelViewTransform;

    // Create velocity arrow (green)
    this.velocityArrow = new ArrowNode(0, 0, 0, 0, {
      fill: ResonanceColors.velocityVectorProperty,
      stroke: null,
      headWidth: ARROW_HEAD_WIDTH,
      headHeight: ARROW_HEAD_HEIGHT,
      tailWidth: ARROW_TAIL_WIDTH,
    });
    this.addChild(this.velocityArrow);

    // Create acceleration arrow (yellow)
    this.accelerationArrow = new ArrowNode(0, 0, 0, 0, {
      fill: ResonanceColors.accelerationVectorProperty,
      stroke: null,
      headWidth: ARROW_HEAD_WIDTH,
      headHeight: ARROW_HEAD_HEIGHT,
      tailWidth: ARROW_TAIL_WIDTH,
    });
    this.addChild(this.accelerationArrow);

    // Create applied force arrow (orange)
    this.appliedForceArrow = new ArrowNode(0, 0, 0, 0, {
      fill: ResonanceColors.appliedForceVectorProperty,
      stroke: null,
      headWidth: ARROW_HEAD_WIDTH,
      headHeight: ARROW_HEAD_HEIGHT,
      tailWidth: ARROW_TAIL_WIDTH,
    });
    this.addChild(this.appliedForceArrow);

    // Link visibility to the control properties
    options.velocityVisibleProperty.linkAttribute(
      this.velocityArrow,
      "visible",
    );
    options.accelerationVisibleProperty.linkAttribute(
      this.accelerationArrow,
      "visible",
    );
    options.appliedForceVisibleProperty.linkAttribute(
      this.appliedForceArrow,
      "visible",
    );

    // Create multilink to update vectors when physics values change
    this.multilink = Multilink.multilink(
      [
        options.velocityVisibleProperty as TReadOnlyProperty<boolean>,
        options.accelerationVisibleProperty as TReadOnlyProperty<boolean>,
        options.appliedForceVisibleProperty as TReadOnlyProperty<boolean>,
        model.velocityProperty as TReadOnlyProperty<number>,
        model.positionProperty as TReadOnlyProperty<number>,
      ],
      (
        velocityVisible: boolean,
        accelerationVisible: boolean,
        forceVisible: boolean,
        _velocity: number,
        _position: number,
      ) => {
        if (velocityVisible || accelerationVisible || forceVisible) {
          this.updateVectors();
        }
      },
    );
  }

  /**
   * Update the vector arrows based on current physics values.
   * Called each frame when the view steps.
   */
  public updateVectors(): void {
    const velocity = this.model.velocityProperty.value;
    const position = this.model.positionProperty.value;
    const mass = this.model.massProperty.value;
    const springConstant = this.model.springConstantProperty.value;
    const damping = this.model.dampingProperty.value;
    const gravity = this.model.gravityProperty.value;

    // Calculate the driving force
    let drivingForce = 0;
    if (this.model.drivingEnabledProperty.value) {
      const amplitude = this.model.drivingAmplitudeProperty.value;
      const phase = this.model.drivingPhaseProperty.value;
      drivingForce = springConstant * amplitude * Math.sin(phase);
    }

    // Calculate acceleration from the equation of motion:
    // m*a = -k*x - b*v - m*g + F_drive
    const acceleration =
      (-springConstant * position - damping * velocity - mass * gravity + drivingForce) /
      mass;

    // The applied force is the spring force from the driver (the driving term)
    // This is F_drive = k * A * sin(phase)
    const appliedForce = drivingForce;

    // Update velocity arrow
    // In model coordinates, positive velocity means moving in positive direction (upward when viewed)
    // In view coordinates with inverted Y, we need to convert
    const velocityPixels = velocity * VELOCITY_SCALE;
    // Positive velocity in model = upward = negative Y in view
    const velocityTipY = -velocityPixels;
    if (Math.abs(velocityPixels) > MIN_VECTOR_LENGTH) {
      this.velocityArrow.setTailAndTip(0, 0, 0, velocityTipY);
    } else {
      this.velocityArrow.setTailAndTip(0, 0, 0, 0);
    }

    // Update acceleration arrow
    // Positive acceleration in model = upward = negative Y in view
    const accelerationPixels = acceleration * ACCELERATION_SCALE;
    const accelerationTipY = -accelerationPixels;
    if (Math.abs(accelerationPixels) > MIN_VECTOR_LENGTH) {
      this.accelerationArrow.setTailAndTip(0, 0, 0, accelerationTipY);
    } else {
      this.accelerationArrow.setTailAndTip(0, 0, 0, 0);
    }

    // Update applied force arrow
    // Positive force in model = upward = negative Y in view
    const forcePixels = appliedForce * FORCE_SCALE;
    const forceTipY = -forcePixels;
    if (Math.abs(forcePixels) > MIN_VECTOR_LENGTH) {
      this.appliedForceArrow.setTailAndTip(0, 0, 0, forceTipY);
    } else {
      this.appliedForceArrow.setTailAndTip(0, 0, 0, 0);
    }
  }

  /**
   * Set the position of this node (center of the mass in view coordinates).
   */
  public setMassCenter(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public override dispose(): void {
    this.multilink.dispose();
    super.dispose();
  }
}
