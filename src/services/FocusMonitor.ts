// EPIC: Pet Care Interactions - Focus Monitoring
// Monitors multiple conditions to break focus: cursor locking, F key, player distance.

import { engine, PointerLock, inputSystem, InputAction, PointerEventType, Transform } from '@dcl/sdk/ecs'
import { focus } from './Focus'
import { CameraFocusComponent } from '../components/CameraFocus'
import { Vector3 } from '@dcl/sdk/math'

// Store player's position when focus starts
let focusStartPlayerPos: Vector3 | null = null

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
    focusStartPlayerPos = null
    return
  }

  // 2. F key pressed
  if (inputSystem.isTriggered(InputAction.IA_SECONDARY, PointerEventType.PET_DOWN)) {
    console.log('🎥 F key pressed while focused - unfocusing camera')
    focus.unfocus()
    focusStartPlayerPos = null
    return
  }

  // 3. Player moved more than 0.5m from focus start position
  if (focusStartPlayerPos) {
    const currentPlayerPos = Transform.get(engine.PlayerEntity).position
    const distance = Vector3.distance(focusStartPlayerPos, currentPlayerPos)

    if (distance > 0.5) {
      console.log(`🎥 Player moved ${distance.toFixed(2)}m away while focused - unfocusing camera`)
      focus.unfocus()
      focusStartPlayerPos = null
      return
    }
  }
}

// System management functions
export function startFocusMonitoring() {
  // Always remove first to ensure clean state (no duplicates)
  engine.removeSystem('FocusMonitorSystem')

  // Store player's position when focus starts
  const playerPos = Transform.get(engine.PlayerEntity).position
  focusStartPlayerPos = { x: playerPos.x, y: playerPos.y, z: playerPos.z }

  // Add the monitoring system
  engine.addSystem(focusMonitorSystem, 1, 'FocusMonitorSystem')
  console.log('🎥 Focus monitoring started')
}

export function stopFocusMonitoring() {
  engine.removeSystem('FocusMonitorSystem')
  focusStartPlayerPos = null
  console.log('🎥 Focus monitoring stopped')
}
