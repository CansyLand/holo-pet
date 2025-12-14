import { engine } from '@dcl/sdk/ecs'
import { CameraFocusComponent } from '../components/CameraFocus'
import { game } from '../Game'
import { focus } from '../services/Focus'

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
  if (game.state.pet && game.state.pet.entity && focus.isFocused(game.state.pet.entity)) {
    console.log('👁️ Updating cursor follow for pet')
    game.state.pet.updateCursorFollow(dt)
  }
}
