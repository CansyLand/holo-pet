// EPIC: Pet Care Interactions - Cursor Follow System
// System that makes pets follow the cursor when in focus mode.
// Delegates to pet methods for the actual cursor tracking logic.

import { engine } from '@dcl/sdk/ecs'
import { CursorFollowComponent, CameraFocusComponent } from '../components/CameraFocus'
import { game } from '../Game'

export function cursorFollowSystem(dt: number) {
  // Only run when camera is focused on a pet (like old system)
  let isAnyCameraFocused = false
  for (const [entity, focusComponent] of engine.getEntitiesWith(CameraFocusComponent)) {
    if (focusComponent.isCameraFocused) {
      isAnyCameraFocused = true
      break
    }
  }

  if (!isAnyCameraFocused) return

  // Update all entities with active cursor follow
  for (const [entity, cursorFollow] of engine.getEntitiesWith(CursorFollowComponent)) {
    if (!cursorFollow.isActive) continue

    // If this entity belongs to the pet, delegate to pet's cursor follow logic
    if (game.state.pet && game.state.pet.entity === entity) {
      game.state.pet.updateCursorFollow(dt)
    }
  }
}
