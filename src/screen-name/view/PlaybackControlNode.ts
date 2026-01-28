/**
 * PlaybackControlNode contains the simulation speed radio buttons (slow/normal)
 * and the play/pause/step button group.
 */

import { Text, HBox } from "scenerystack/scenery";
import { PlayPauseStepButtonGroup } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import { Bounds2 } from "scenerystack/dot";
import { SimModel } from "../model/SimModel.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";

export class PlaybackControlNode extends HBox {

  public constructor( model: SimModel, layoutBounds: Bounds2 ) {

    // Speed radio buttons
    const speedButtons = [
      { value: 'slow', createNode: () => new Text( 'slow', { font: ResonanceConstants.CONTROL_FONT } ) },
      { value: 'normal', createNode: () => new Text( 'normal', { font: ResonanceConstants.CONTROL_FONT } ) }
    ];

    const speedControl = new AquaRadioButtonGroup(
      model.resonanceModel.timeSpeedProperty,
      speedButtons,
      {
        orientation: 'horizontal',
        spacing: ResonanceConstants.SPEED_CONTROL_SPACING,
        radioButtonOptions: {
          radius: ResonanceConstants.SPEED_RADIO_BUTTON_RADIUS
        }
      }
    );

    // Play/Pause/Step buttons
    const playPauseStepButtonGroup = new PlayPauseStepButtonGroup( model.resonanceModel.isPlayingProperty, {
      playPauseButtonOptions: {
        scale: ResonanceConstants.PLAY_PAUSE_SCALE
      },
      includeStepForwardButton: true,
      includeStepBackwardButton: true,
      stepForwardButtonOptions: {
        listener: () => {
          model.resonanceModel.step( ResonanceConstants.STEP_DT, true );
          const count = model.resonatorCountProperty.value;
          for ( let i = 1; i < count; i++ ) {
            model.oscillatorModels[ i ].step( ResonanceConstants.STEP_DT, true );
          }
        }
      },
      stepBackwardButtonOptions: {
        listener: () => {
          model.resonanceModel.step( -ResonanceConstants.STEP_DT, true );
          const count = model.resonatorCountProperty.value;
          for ( let i = 1; i < count; i++ ) {
            model.oscillatorModels[ i ].step( -ResonanceConstants.STEP_DT, true );
          }
        }
      }
    } );

    super( {
      children: [ speedControl, playPauseStepButtonGroup ],
      spacing: ResonanceConstants.PLAYBACK_CONTROLS_SPACING,
      align: 'center',
      centerX: layoutBounds.centerX + ResonanceConstants.DRIVER_CENTER_X_OFFSET,
      bottom: layoutBounds.bottom - ResonanceConstants.PLAYBACK_BOTTOM_MARGIN
    } );
  }
}
