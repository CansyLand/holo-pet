// EPIC: Pet Care Interactions - Petting Interaction Story (Camera Focus)
// Centralized focus mechanics - camera movement, pointer locking/unlocking for any interactive entity.
// Pointer/camera management service that any module can use.

import { pointer } from './Pointer'

export interface FocusOptions {
  distance?: number
  height?: number
  smooth?: boolean
  duration?: number
}

export class FocusService {
  currentFocus: any = null // Currently focused entity
  previousCameraState: any = null // To restore camera when unfocusing

  constructor() {
    console.log('🎥 Focus service initialized')
  }

  // Focus on any entity
  focusOn(entity: any, options: FocusOptions = {}) {
    console.log(`🎥 Focusing on entity: ${entity}`)

    // Store current camera state for restoration
    // this.previousCameraState = getCurrentCameraState()

    // Set focus state
    this.currentFocus = entity

    // Lock pointer (detach from player movement)
    this.lockPointer()

    // Move camera to focus position
    this.moveCameraToEntity(entity, options)

    // Notify modules of focus change
    this.onFocusChanged(true, entity)
  }

  // Unfocus current entity
  unfocus() {
    if (!this.currentFocus) return

    console.log('🎥 Unfocusing current entity')

    // Unlock pointer
    this.unlockPointer()

    // Restore camera to previous state
    this.restoreCamera()

    // Clear focus state
    const previousFocus = this.currentFocus
    this.currentFocus = null

    // Notify modules of focus change
    this.onFocusChanged(false, previousFocus)
  }

  // Check if currently focused
  isFocused(entity?: any): boolean {
    if (entity) {
      return this.currentFocus === entity
    }
    return this.currentFocus !== null
  }

  // Get currently focused entity
  getCurrentFocus(): any {
    return this.currentFocus
  }

  // Lock pointer (detach from player movement)
  private lockPointer() {
    pointer.lockPointer()
  }

  // Unlock pointer (reattach to player movement)
  private unlockPointer() {
    pointer.unlockPointer()
  }

  // Move camera to focus on entity
  private moveCameraToEntity(entity: any, options: FocusOptions) {
    const distance = options.distance || 3
    const height = options.height || 2
    const smooth = options.smooth !== false
    const duration = options.duration || 1000

    // TODO: Calculate camera position relative to entity
    // TODO: Smooth camera movement using tweens

    console.log(`📷 Moving camera to entity (distance: ${distance}, height: ${height})`)
  }

  // Restore camera to previous state
  private restoreCamera() {
    // TODO: Restore camera position and settings
    console.log('📷 Camera restored')
  }

  // Notify listeners of focus changes
  private onFocusChanged(isFocused: boolean, entity: any) {
    // TODO: Notify modules that care about focus state
    // e.g., Needs module might hide bars when focused
    console.log(`🎥 Focus changed: ${isFocused ? 'focused' : 'unfocused'} on ${entity}`)
  }

  // Focus on pet (common use case)
  focusOnPet() {
    // TODO: Get pet entity from game state
    // const petEntity = game.state.pet?.entity
    // if (petEntity) {
    //   this.focusOn(petEntity, { distance: 2, height: 1.5 })
    // }
    console.log('🎥 Focusing on pet')
  }

  // Focus on specific interactive objects
  focusOnFoodBowl() {
    // TODO: Get food bowl entity
    console.log('🎥 Focusing on food bowl')
  }

  focusOnBath() {
    // TODO: Get bath entity
    console.log('🎥 Focusing on bath')
  }

  focusOnBall() {
    // TODO: Get ball entity
    console.log('🎥 Focusing on ball')
  }

  // Handle escape key or right-click to unfocus
  handleUnfocusInput() {
    if (this.currentFocus) {
      this.unfocus()
    }
  }
}

// Global instance
export const focus = new FocusService()
