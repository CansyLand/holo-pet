import { engine } from '@dcl/sdk/ecs'
import { CameraFocusComponent } from '../services/CameraFocus'
import { game } from '../Game'
import { cameraFocus } from '../services/CameraFocus'

let isAnyCameraFocused = false

export function cursorFollowSystem(dt: number) {
  // Still need this check to know if focus mode is active at all
  isAnyCameraFocused = false
  for (const [, focusComponent] of engine.getEntitiesWith(CameraFocusComponent)) {
    if (focusComponent.isCameraFocused) {
      isAnyCameraFocused = true
      break
    }
  }

  if (!isAnyCameraFocused) return
  // Now directly check and update the single pet, no iteration needed
  if (game.state.pet && game.state.pet.entity && cameraFocus.isFocused(game.state.pet.entity)) {
    game.state.pet.updateCursorFollow(dt)
  }
}
