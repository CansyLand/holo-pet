// EPIC: Pet Care Interactions - Cursor Follow System
// System that makes pets look at the cursor when in focus mode.

import { engine, Transform } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { CursorFollowComponent } from '../components/CameraFocus'

export function cursorFollowSystem(dt: number) {
  // Update all entities with active cursor follow
  for (const [entity, cursorFollow] of engine.getEntitiesWith(CursorFollowComponent)) {
    if (!cursorFollow.isActive) continue

    const entityTransform = Transform.get(entity)
    const cameraTransform = Transform.get(engine.CameraEntity)

    // Simple: make pet look toward camera (like old system)
    const lookDirection = Vector3.subtract(cameraTransform.position, entityTransform.position)
    lookDirection.y = 0 // Keep pet looking horizontally

    if (Vector3.length(lookDirection) > 0.1) {
      const normalizedDirection = Vector3.normalize(lookDirection)
      const targetRotation = Quaternion.lookRotation(normalizedDirection, Vector3.Up())

      // Smoothly interpolate to target rotation
      const currentRotation = entityTransform.rotation
      const interpolatedRotation = Quaternion.slerp(currentRotation, targetRotation, dt * 2)

      Transform.getMutable(entity).rotation = interpolatedRotation
    }
  }
}
