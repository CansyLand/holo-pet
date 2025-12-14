// EPIC: Pet Care Interactions - Petting Interaction Story (Camera Focus)
// Centralized focus mechanics - camera movement, pointer locking/unlocking for any interactive entity.
// Pointer/camera management service that any module can use.

import { engine, VirtualCamera, MainCamera, PointerLock, Transform } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { pointer } from './Pointer'
import { startFocusMonitoring, stopFocusMonitoring } from './FocusMonitor'
import { CameraFocusComponent, CursorFollowComponent } from '../components/CameraFocus'
import { game } from '../Game'

export interface FocusOptions {
  distance?: number
  height?: number
  smooth?: boolean
  duration?: number
}

export class FocusService {
  currentFocus: any = null // Currently focused entity
  virtualCameraEntity: any = null // Virtual camera entity for focus mode

  constructor() {
    console.log('🎥 Focus service initialized')
  }

  // Focus on any entity
  focusOn(entity: any, options: FocusOptions = {}) {
    console.log(`🎥 Focusing on entity: ${entity}`)

    // Set focus state
    this.currentFocus = entity

    // Create virtual camera for this focus session
    this.virtualCameraEntity = this.createVirtualCamera(entity)

    // Store original cursor state before unlocking
    const originalCursorLocked = PointerLock.get(engine.CameraEntity).isPointerLocked

    // Activate the virtual camera
    this.activateVirtualCamera(this.virtualCameraEntity)

    // Create camera focus component for monitoring system
    CameraFocusComponent.createOrReplace(this.virtualCameraEntity, {
      isCameraFocused: true,
      originalCursorLocked: originalCursorLocked
    })

    // Enable cursor follow for the pet
    this.enableCursorFollow(entity)

    // Start monitoring for focus-breaking inputs
    startFocusMonitoring()

    // Notify modules of focus change
    this.onFocusChanged(true, entity)
  }

  // Unfocus current entity
  unfocus() {
    if (!this.currentFocus) return

    console.log('🎥 Unfocusing current entity')

    // Stop monitoring for focus-breaking inputs
    stopFocusMonitoring()

    // Find the currently active camera and restore cursor state (like old deactivatePetCamera)
    if (this.virtualCameraEntity) {
      const focusComponent = CameraFocusComponent.getMutable(this.virtualCameraEntity)
      if (focusComponent.isCameraFocused) {
        // Restore original cursor state
        if (focusComponent.originalCursorLocked !== undefined) {
          PointerLock.getMutable(engine.CameraEntity).isPointerLocked = focusComponent.originalCursorLocked
          console.log(`🎥 Cursor restored to ${focusComponent.originalCursorLocked ? 'locked' : 'unlocked'}`)
        }

        // Mark camera as not focused
        focusComponent.isCameraFocused = false
      }
    }

    // Disable cursor follow
    this.disableCursorFollow(this.currentFocus)

    // Deactivate virtual camera
    this.deactivateVirtualCamera()

    // Clean up virtual camera entity
    if (this.virtualCameraEntity) {
      engine.removeEntity(this.virtualCameraEntity)
      this.virtualCameraEntity = null
    }

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

  // Create virtual camera for focusing on entity
  private createVirtualCamera(entity: any): any {
    const cameraEntity = engine.addEntity()

    // Position camera to look at the entity from a good angle
    const entityPos = Transform.get(entity).position
    const cameraPos = Vector3.add(entityPos, Vector3.create(0, 2, 3)) // Behind and above the entity

    Transform.create(cameraEntity, {
      position: cameraPos
    })

    VirtualCamera.create(cameraEntity, {
      lookAtEntity: entity, // Make camera look at the entity
      defaultTransition: { transitionMode: VirtualCamera.Transition.Time(1) } // Smooth transition
    })

    return cameraEntity
  }

  // Activate virtual camera
  private activateVirtualCamera(cameraEntity: any) {
    // Update camera position dynamically based on entity's facing direction
    this.updateCameraPosition(cameraEntity, this.currentFocus)

    // Activate virtual camera
    MainCamera.createOrReplace(engine.CameraEntity, {
      virtualCameraEntity: cameraEntity
    })

    // Unlock cursor when focused
    PointerLock.getMutable(engine.CameraEntity).isPointerLocked = false

    console.log(`📷 Virtual camera activated - cursor unlocked`)
  }

  // Deactivate virtual camera
  private deactivateVirtualCamera() {
    const mainCamera = MainCamera.getMutableOrNull(engine.CameraEntity)
    if (mainCamera) {
      mainCamera.virtualCameraEntity = undefined
    }
    console.log('📷 Virtual camera deactivated')
  }

  // Update camera position based on entity's facing direction
  private updateCameraPosition(cameraEntity: any, entity: any) {
    const entityTransform = Transform.get(entity)
    const entityPos = entityTransform.position
    const entityRotation = entityTransform.rotation

    // Calculate forward direction from entity's rotation
    const forward = Vector3.rotate(Vector3.Forward(), entityRotation)

    // Position camera 2m in front of entity + height offset
    const cameraPos = Vector3.add(
      Vector3.create(entityPos.x, entityPos.y + 4, entityPos.z - 4), // base offset
      Vector3.add(
        Vector3.scale(forward, 2), // 2m in front
        Vector3.create(0, 4.5, 0) // height offset for good viewing angle
      )
    )

    // Update camera transform
    Transform.getMutable(cameraEntity).position = cameraPos
  }

  // Enable cursor follow for entity
  private enableCursorFollow(entity: any) {
    // Create cursor follow component if it doesn't exist
    if (!CursorFollowComponent.has(entity)) {
      CursorFollowComponent.create(entity, {
        isActive: true,
        baseRotation: { x: 0, y: 0, z: 0, w: 1 }, // Will be set by pet
        maxTiltAngle: 15 // Default, pet can override
      })
    } else {
      // Update existing component
      const cursorFollow = CursorFollowComponent.getMutable(entity)
      cursorFollow.isActive = true
    }

    // If this is the pet entity, call pet's enable method
    if (game.state.pet && game.state.pet.entity === entity) {
      game.state.pet.enableCursorFollow()
    }
  }

  // Disable cursor follow for entity
  private disableCursorFollow(entity: any) {
    // If this is the pet entity, call pet's disable method
    if (game.state.pet && game.state.pet.entity === entity) {
      game.state.pet.disableCursorFollow()
    }

    // Update component state
    const cursorFollow = CursorFollowComponent.getMutableOrNull(entity)
    if (cursorFollow) {
      cursorFollow.isActive = false
    }

    console.log('👁️ Cursor follow disabled')
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
