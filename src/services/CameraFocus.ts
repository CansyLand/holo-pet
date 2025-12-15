// EPIC: Pet Care Interactions - Petting Interaction Story (Camera Focus)
// Centralized focus mechanics - camera movement, pointer locking/unlocking for any interactive entity.
// Pointer/camera management service that any module can use.

import {
  engine,
  VirtualCamera,
  MainCamera,
  PointerLock,
  Transform,
  Schemas,
  inputSystem,
  InputAction,
  PointerEventType
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { pointer } from './Pointer'
// import { CameraFocusComponent, CursorFollowComponent } from '../components/CameraFocus'
import { game } from '../Game'
// EPIC: Pet Care Interactions - Camera Focus System
// Components for managing camera focus state and cursor follow behavior.

// COMPONENTS

/**
 * Tracks camera focus state for Focus Mode
 * Used to manage cursor lock/unlock during pet interaction
 */
export const CameraFocusComponent = engine.defineComponent('CameraFocusComponent', {
  isCameraFocused: Schemas.Boolean, // true when in Focus Mode
  originalCursorLocked: Schemas.Optional(Schemas.Boolean), // Restore cursor state when exiting
  virtualCameraEntity: Schemas.Optional(Schemas.Entity) // Reference to the virtual camera
})

/**
 * Tracks cursor follow state for pet interaction
 * Controls whether pet looks at cursor when camera is focused
 */
export const CursorFollowComponent = engine.defineComponent('CursorFollowComponent', {
  isActive: Schemas.Boolean, // Only active when camera is focused
  baseRotation: Schemas.Quaternion, // Store pet's original rotation
  maxTiltAngle: Schemas.Number // Max rotation angle (degrees)
})

// OBJECT

export interface FocusOptions {
  distance?: number
  height?: number
  smooth?: boolean
  duration?: number
}

// Store player's position when focus starts
let focusStartPlayerPos: Vector3 | null = null

export class CameraFocusService {
  currentFocus: any = null // Currently focused entity
  virtualCameraEntity: any = null // Virtual camera entity for focus mode

  constructor() {
    console.log('🎥 Camera focus service initialized')
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
    this.startFocusMonitoring()

    // Notify modules of focus change
    this.onFocusChanged(true, entity)
  }

  // Unfocus current entity
  unfocus() {
    if (!this.currentFocus) return

    console.log('🎥 Unfocusing current entity')

    // Stop monitoring for focus-breaking inputs
    this.stopFocusMonitoring()

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
    const cameraPos = Vector3.add(entityPos, Vector3.create(0, -2, 7)) // Behind and above the entity

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

  // Update camera position between pet and player
  private updateCameraPosition(cameraEntity: any, entity: any) {
    const entityTransform = Transform.get(entity)
    const entityPos = entityTransform.position

    // Get player position
    const playerTransform = Transform.get(engine.PlayerEntity)
    const playerPos = playerTransform.position

    // Calculate direction from pet to player
    const petToPlayer = Vector3.subtract(playerPos, entityPos)

    // Position camera between player and pet, but at fixed distance from pet
    // Camera should be closer to the pet for better focus
    const cameraDistanceFromPet = 1.5 // Adjust this distance as needed
    const cameraPos = Vector3.add(entityPos, Vector3.scale(Vector3.normalize(petToPlayer), cameraDistanceFromPet))

    // Add height offset for "from above" perspective
    cameraPos.y += 4

    // Update camera transform
    Transform.getMutable(cameraEntity).position = cameraPos
  }

  // Enable cursor follow for entity
  private enableCursorFollow(entity: any) {
    // If this is the pet entity, make it face the player first
    if (game.state.pet && game.state.pet.entity === entity) {
      // Get player position
      const playerPos = Transform.get(engine.PlayerEntity).position
      const petPos = Transform.get(entity).position

      // Calculate direction from pet to player
      const directionToPlayer = Vector3.subtract(playerPos, petPos)

      // Create rotation to face player
      const lookRotation = Quaternion.fromLookAt(Vector3.Zero(), directionToPlayer)

      // Set pet's base rotation to face player
      game.state.pet.data.cursorFollow.baseRotation = lookRotation

      // Apply the rotation immediately
      const petTransform = Transform.getMutable(entity)
      petTransform.rotation = lookRotation

      game.state.pet.enableCursorFollow()
    }

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

  // FOCUS MONITORING SYSTEM
  // Monitors multiple conditions to break focus: cursor locking, F key, player distance.

  private focusMonitorSystem(dt: number) {
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
      this.unfocus()
      focusStartPlayerPos = null
      return
    }

    // 2. F key pressed
    if (inputSystem.isTriggered(InputAction.IA_SECONDARY, PointerEventType.PET_DOWN)) {
      console.log('🎥 F key pressed while focused - unfocusing camera')
      this.unfocus()
      focusStartPlayerPos = null
      return
    }

    // 3. Player moved more than 0.5m from focus start position
    if (focusStartPlayerPos) {
      const currentPlayerPos = Transform.get(engine.PlayerEntity).position
      const distance = Vector3.distance(focusStartPlayerPos, currentPlayerPos)

      if (distance > 0.5) {
        console.log(`🎥 Player moved ${distance.toFixed(2)}m away while focused - unfocusing camera`)
        this.unfocus()
        focusStartPlayerPos = null
        return
      }
    }
  }

  // System management functions
  private startFocusMonitoring() {
    // Always remove first to ensure clean state (no duplicates)
    engine.removeSystem('FocusMonitorSystem')

    // Store player's position when focus starts
    const playerPos = Transform.get(engine.PlayerEntity).position
    focusStartPlayerPos = { x: playerPos.x, y: playerPos.y, z: playerPos.z }

    // Add the monitoring system
    engine.addSystem(this.focusMonitorSystem.bind(this), 1, 'FocusMonitorSystem')
    console.log('🎥 Focus monitoring started')
  }

  private stopFocusMonitoring() {
    engine.removeSystem('FocusMonitorSystem')
    focusStartPlayerPos = null
    console.log('🎥 Focus monitoring stopped')
  }
}

// Global instance
export const cameraFocus = new CameraFocusService()
