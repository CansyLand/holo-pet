import { engine, Transform, PrimaryPointerInfo, UiCanvasInformation } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { CursorFollowComponent, CameraFocusComponent } from '../components/UIState'
import { CURSOR_FOLLOW_MAX_TILT, CURSOR_FOLLOW_LERP_SPEED } from '../utils/constants'

/**
 * Cursor Follow System - Makes pet subtly follow cursor when camera is focused
 * Similar to MetaMask fox effect, creates engaging interactive feel
 */
export function cursorFollowSystem(dt: number) {
  // Only run when camera is focused on a pet
  let isAnyCameraFocused = false
  for (const [entity, focusComponent] of engine.getEntitiesWith(CameraFocusComponent)) {
    if (focusComponent.isCameraFocused) {
      isAnyCameraFocused = true
      break
    }
  }

  if (!isAnyCameraFocused) return

  // Get cursor position as percentage of canvas
  const pointerInfo = PrimaryPointerInfo.get(engine.RootEntity)
  if (!pointerInfo?.screenCoordinates) return

  const cursorPos = pointerInfo.screenCoordinates
  const canvas = UiCanvasInformation.get(engine.RootEntity)
  if (!canvas) return

  const percentX = (cursorPos.x / canvas.width) * 100
  const percentY = (cursorPos.y / canvas.height) * 100

  // Normalize cursor to -1 to 1 range (center = 0)
  const normalizedX = (percentX / 100 - 0.5) * 2 // -1 (left) to 1 (right)
  const normalizedY = (percentY / 100 - 0.5) * 2 // -1 (top) to 1 (bottom)

  // Apply cursor follow to active pets
  for (const [petEntity, cursorFollow] of engine.getEntitiesWith(CursorFollowComponent)) {
    if (!cursorFollow.isActive) continue

    const petTransform = Transform.getMutable(petEntity)
    const currentRotation = petTransform.rotation

    // Calculate target rotations based on cursor position (in degrees)
    const targetRotY = -normalizedX * cursorFollow.maxTiltAngle
    const targetRotX = normalizedY * (cursorFollow.maxTiltAngle * 0.5) // Less vertical tilt

    // Create target rotation by modifying the base rotation
    const tiltRotation = Quaternion.fromEulerDegrees(targetRotX, targetRotY, 0)
    petTransform.rotation = Quaternion.multiply(cursorFollow.baseRotation, tiltRotation)
  }
}

/**
 * Linear interpolation helper
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(t, 1)
}
