// Pet cursor follow - focus mode functionality

import { engine, PrimaryPointerInfo, UiCanvasInformation, Transform } from '@dcl/sdk/ecs'
import { Quaternion } from '@dcl/sdk/math'
import type { Pet } from '../Pet'

// Enable cursor follow for focus mode
export function enableCursorFollow(pet: Pet) {
  if (pet.data.cursorFollow.isActive || !pet.entity) return

  const currentTransform = Transform.get(pet.entity)
  pet.data.cursorFollow.baseRotation = {
    x: currentTransform.rotation.x,
    y: currentTransform.rotation.y,
    z: currentTransform.rotation.z,
    w: currentTransform.rotation.w
  }
  pet.data.cursorFollow.isActive = true
}

// Disable cursor follow
export function disableCursorFollow(pet: Pet) {
  if (!pet.data.cursorFollow.isActive || !pet.entity) return

  const petTransform = Transform.getMutable(pet.entity)
  petTransform.rotation = {
    x: pet.data.cursorFollow.baseRotation.x,
    y: pet.data.cursorFollow.baseRotation.y,
    z: pet.data.cursorFollow.baseRotation.z,
    w: pet.data.cursorFollow.baseRotation.w
  }

  pet.data.cursorFollow.isActive = false
}

// Update cursor follow each frame
export function updateCursorFollow(pet: Pet, dt: number) {
  // Don't rotate if in bath mode
  if (pet.data.bathMode.isActive) return
  if (!pet.data.cursorFollow.isActive || !pet.entity) return

  // Get cursor position as percentage of canvas
  const pointerInfo = PrimaryPointerInfo.get(engine.RootEntity)
  if (!pointerInfo?.screenCoordinates) return

  const cursorPos = pointerInfo.screenCoordinates
  const canvas = UiCanvasInformation.get(engine.RootEntity)
  if (!canvas) return

  const percentX = (cursorPos.x / canvas.width) * 100
  const percentY = (cursorPos.y / canvas.height) * 100

  // Normalize cursor to -1 to 1 range (center = 0)
  const normalizedX = (percentX / 100 - 0.5) * 2
  const normalizedY = (percentY / 100 - 0.5) * 2

  const petTransform = Transform.getMutable(pet.entity)

  // Calculate target rotations based on cursor position
  const targetRotY = -normalizedX * pet.data.cursorFollow.maxTiltAngle
  const targetRotX = -normalizedY * (pet.data.cursorFollow.maxTiltAngle * 0.5)

  // Create target rotation by modifying the base rotation
  const tiltRotation = Quaternion.fromEulerDegrees(targetRotX, targetRotY, 0)
  petTransform.rotation = Quaternion.multiply(pet.data.cursorFollow.baseRotation, tiltRotation)
}
