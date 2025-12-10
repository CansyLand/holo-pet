import { engine, PointerLock } from '@dcl/sdk/ecs'
import { CameraFocusComponent } from '../components/UIState'
import { deactivatePetCamera } from '../factories/UI'

// Track whether the system is currently active to prevent duplicate additions
let isCameraFocusSystemActive = false

/**
 * Camera Focus System - Detects cursor locking to unfocus camera
 * Only runs when cursor becomes locked during focus mode
 */
export function cameraFocusSystem(dt: number) {
  // Only check when cursor becomes locked
  const pointerLock = PointerLock.getOrNull(engine.CameraEntity)
  if (!pointerLock || !pointerLock.isPointerLocked) return

  // Check if any camera is currently focused
  for (const [entity, focusComponent] of engine.getEntitiesWith(CameraFocusComponent)) {
    if (focusComponent.isCameraFocused) {
      console.log('User locked cursor while camera focused - unfocusing camera')
      deactivatePetCamera()
      return
    }
  }
}

/**
 * Start camera focus monitoring by adding the system to the engine
 */
export function startCameraFocusMonitoring() {
  if (isCameraFocusSystemActive) {
    console.log('Camera focus monitoring already active')
    return
  }
  engine.addSystem(cameraFocusSystem, 1, 'CameraFocusSystem')
  isCameraFocusSystemActive = true
  console.log('Camera focus monitoring started')
}

/**
 * Stop camera focus monitoring by removing the system from the engine
 */
export function stopCameraFocusMonitoring() {
  if (!isCameraFocusSystemActive) {
    console.log('Camera focus monitoring already stopped')
    return
  }
  engine.removeSystem('CameraFocusSystem')
  isCameraFocusSystemActive = false
  console.log('Camera focus monitoring stopped')
}
