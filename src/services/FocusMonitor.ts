// EPIC: Pet Care Interactions - Focus Monitoring
// Monitors multiple conditions to break focus: cursor locking, F key, player movement.
// Only runs when focus is active to avoid unnecessary processing.

import { engine, PointerLock, inputSystem, InputAction, PointerEventType } from '@dcl/sdk/ecs'
import { focus } from './Focus'
import { CameraFocusComponent } from '../components/CameraFocus'

export function focusMonitorSystem(dt: number) {
  // Check if any camera is currently focused
  let isFocused = false
  for (const [cameraEntity] of engine.getEntitiesWith(CameraFocusComponent)) {
    const focusComponent = CameraFocusComponent.get(cameraEntity)
    if (focusComponent.isCameraFocused) {
      isFocused = true
      break
    }
  }

  if (!isFocused) return

  // 1. Cursor becomes locked (original behavior)
  const pointerLock = PointerLock.getOrNull(engine.CameraEntity)
  if (pointerLock && pointerLock.isPointerLocked) {
    console.log('🎥 Cursor locked while camera focused - unfocusing camera')
    focus.unfocus()
    return
  }

  // 2. F key pressed
  if (inputSystem.isTriggered(InputAction.IA_SECONDARY, PointerEventType.PET_DOWN)) {
    console.log('🎥 F key pressed while focused - unfocusing camera')
    focus.unfocus()
    return
  }

  // 3. Player movement (walking away)
  if (
    inputSystem.isPressed(InputAction.IA_FORWARD) ||
    inputSystem.isPressed(InputAction.IA_BACKWARD) ||
    inputSystem.isPressed(InputAction.IA_LEFT) ||
    inputSystem.isPressed(InputAction.IA_RIGHT)
  ) {
    console.log('🎥 Player moving while focused - unfocusing camera')
    focus.unfocus()
    return
  }
}

// System management functions
export function startFocusMonitoring() {
  // Always remove first to ensure clean state (no duplicates)
  engine.removeSystem('FocusMonitorSystem')

  // Add the monitoring system
  engine.addSystem(focusMonitorSystem, 1, 'FocusMonitorSystem')
  console.log('🎥 Focus monitoring started')
}

export function stopFocusMonitoring() {
  engine.removeSystem('FocusMonitorSystem')
  console.log('🎥 Focus monitoring stopped')
}
