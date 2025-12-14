// EPIC: Pet Care Interactions - Petting Interaction Story (Cursor Focus)
// Centralized pointer/lock mechanics - cursor locking/unlocking for any interactive entity.
// Pointer management service that any module can use.
// Remembers previous pointer state to restore after modal interactions.

import { engine, PointerLock } from '@dcl/sdk/ecs'

export interface PointerOptions {
  force?: boolean // Force a specific state regardless of current state
}

export class PointerService {
  // Remember the pointer state before modal interactions
  private previousPointerState: boolean | null = null

  constructor() {
    console.log('🖱️ Pointer service initialized')
    this.setupPointerLockListener()
  }

  // Setup listener for pointer lock changes (for debugging/logging)
  private setupPointerLockListener() {
    PointerLock.onChange(engine.CameraEntity, (pointerLock) => {
      if (!pointerLock) return
      console.log(`🖱️ Pointer ${pointerLock.isPointerLocked ? 'locked' : 'unlocked'}`)
    })
  }

  // Lock pointer (detach from player movement)
  lockPointer(options: PointerOptions = {}) {
    console.log('🔒 Locking pointer')

    if (options.force) {
      // Force lock regardless of current state
      PointerLock.getMutable(engine.CameraEntity).isPointerLocked = true
    } else {
      // Only lock if not already locked
      if (!PointerLock.getOrNull(engine.CameraEntity)?.isPointerLocked) {
        PointerLock.getMutable(engine.CameraEntity).isPointerLocked = true
      }
    }
  }

  // Unlock pointer (reattach to player movement)
  unlockPointer(options: PointerOptions = {}) {
    console.log('🔓 Unlocking pointer')

    if (options.force) {
      // Force unlock regardless of current state
      PointerLock.getMutable(engine.CameraEntity).isPointerLocked = false
    } else {
      // Only unlock if currently locked
      if (PointerLock.getOrNull(engine.CameraEntity)?.isPointerLocked) {
        PointerLock.getMutable(engine.CameraEntity).isPointerLocked = false
      }
    }
  }

  // Remember current pointer state for later restoration
  rememberPointerState() {
    const currentState = PointerLock.getOrNull(engine.CameraEntity)?.isPointerLocked ?? false
    this.previousPointerState = currentState
    console.log(`💾 Remembered pointer state: ${currentState ? 'locked' : 'unlocked'}`)
    return currentState
  }

  // Restore previously remembered pointer state
  restorePointerState() {
    if (this.previousPointerState === null) {
      console.log('⚠️ No previous pointer state to restore')
      return
    }

    console.log(`🔄 Restoring pointer state to: ${this.previousPointerState ? 'locked' : 'unlocked'}`)
    PointerLock.getMutable(engine.CameraEntity).isPointerLocked = this.previousPointerState
    this.previousPointerState = null // Clear after restoration
  }

  // Get current pointer state
  isPointerLocked(): boolean {
    return PointerLock.getOrNull(engine.CameraEntity)?.isPointerLocked ?? false
  }

  // Force a specific pointer state and remember previous state
  setPointerState(locked: boolean, rememberPrevious: boolean = false) {
    if (rememberPrevious) {
      this.rememberPointerState()
    }

    if (locked) {
      this.lockPointer({ force: true })
    } else {
      this.unlockPointer({ force: true })
    }
  }

  // Check if we have a remembered state
  hasRememberedState(): boolean {
    return this.previousPointerState !== null
  }

  // Clear remembered state (useful for cleanup)
  clearRememberedState() {
    this.previousPointerState = null
    console.log('🧹 Cleared remembered pointer state')
  }
}

// Global instance
export const pointer = new PointerService()
