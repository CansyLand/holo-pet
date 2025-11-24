import { engine, PointerLock } from '@dcl/sdk/ecs'
import { CameraFocusComponent } from '../components/Visuals'

/**
 * Camera Focus System - Prevents cursor locking while camera is focused on pet
 * This system is dynamically added/removed based on camera focus state
 */
export function cameraFocusSystem(dt: number) {
  // Check current pointer lock state
  const pointerLock = PointerLock.getOrNull(engine.CameraEntity)
  if (!pointerLock || !pointerLock.isPointerLocked) return

  // Check if any camera is currently focused
  let isAnyCameraFocused = false
  for (const [entity, focusComponent] of engine.getEntitiesWith(CameraFocusComponent)) {
    if (focusComponent.isCameraFocused) {
      isAnyCameraFocused = true
      break
    }
  }

  // If camera is focused on pet, prevent cursor from being locked
  if (isAnyCameraFocused) {
    PointerLock.getMutable(engine.CameraEntity).isPointerLocked = false
    console.log('Cursor lock prevented - camera is focused on pet')
  }
}

/**
 * Start camera focus monitoring by adding the system to the engine
 */
export function startCameraFocusMonitoring() {
  engine.addSystem(cameraFocusSystem, 1, 'CameraFocusSystem')
  console.log('Camera focus monitoring started')
}

/**
 * Stop camera focus monitoring by removing the system from the engine
 */
export function stopCameraFocusMonitoring() {
  engine.removeSystem('CameraFocusSystem')
  console.log('Camera focus monitoring stopped')
}
