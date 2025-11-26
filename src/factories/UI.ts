import {
  engine,
  Transform,
  MeshRenderer,
  MeshCollider,
  Material,
  Billboard,
  BillboardMode,
  PointerEvents,
  PointerEventType,
  InputAction,
  Entity,
  VirtualCamera,
  MainCamera,
  ColliderLayer,
  PointerLock
} from '@dcl/sdk/ecs'
import { Vector3, Color4, Quaternion } from '@dcl/sdk/math'
import { Interactable, InteractionType } from '../components/Interaction'
import {
  MoodBarComponent,
  MenuStateComponent,
  MenuElementComponent,
  CameraFocusComponent,
  CursorFollowComponent
} from '../components/UIState'
import { startCameraFocusMonitoring, stopCameraFocusMonitoring } from '../systems/CameraFocus'

export function createPetMenu(petEntity: Entity) {
  const petPos = Transform.get(petEntity).position

  // Create virtual camera for pet interaction
  const virtualCameraEntity = createPetCamera(petEntity)

  // Create menu state entity to track menu visibility
  const menuStateEntity = engine.addEntity()
  MenuStateComponent.create(menuStateEntity, {
    isVisible: false,
    petEntity: petEntity,
    menuRootEntity: 0 as Entity, // Will be set below
    virtualCameraEntity: virtualCameraEntity
  })

  // Create a root menu entity (not parented to pet to avoid hover highlighting)
  const menuRoot = engine.addEntity()
  Transform.create(menuRoot, {
    position: Vector3.add(petPos, Vector3.create(0, 1.5, 0)) // Absolute position relative to pet
  })

  // Update menu state with menu root
  const menuState = MenuStateComponent.getMutable(menuStateEntity)
  menuState.menuRootEntity = menuRoot

  // --- Buttons --- Arranged in a horizontal line in front of the pet, positioned absolutely
  const buttonBasePos = Vector3.add(petPos, Vector3.create(0, 1.5, 0)) // Base position for buttons
  createButtonAbsolute(
    menuStateEntity,
    buttonBasePos,
    Vector3.create(-0.6, -1.3, 0.8),
    Color4.Yellow(),
    'Pet Me!',
    InteractionType.PET
  )
  createButtonAbsolute(
    menuStateEntity,
    buttonBasePos,
    Vector3.create(-0.2, -1.3, 0.8),
    Color4.Gray(),
    'Feed',
    InteractionType.FEED
  )
  createButtonAbsolute(
    menuStateEntity,
    buttonBasePos,
    Vector3.create(0.2, -1.3, 0.8),
    Color4.Gray(),
    'Play',
    InteractionType.PLAY
  )
  createButtonAbsolute(
    menuStateEntity,
    buttonBasePos,
    Vector3.create(0.6, -1.3, 0.8),
    Color4.Gray(),
    'Clean',
    InteractionType.CLEAN
  )
  createButtonAbsolute(
    menuStateEntity,
    buttonBasePos,
    Vector3.create(1.0, -1.3, 0.8),
    Color4.Red(),
    'Close',
    InteractionType.CLOSE_MENU
  )

  // --- Mood Bar ---
  createMoodBarAbsolute(menuStateEntity, buttonBasePos)

  // Initially hide all menu elements
  hideMenu(menuStateEntity)

  return menuStateEntity
}

function createButton(parent: Entity, pos: Vector3, color: Color4, hoverText: string, type: InteractionType) {
  const entity = engine.addEntity()
  Transform.create(entity, {
    parent: parent,
    position: pos,
    scale: Vector3.create(0.3, 0.3, 0.1)
  })
  MeshRenderer.setBox(entity)
  MeshCollider.setBox(entity, ColliderLayer.CL_POINTER)
  Material.setPbrMaterial(entity, { albedoColor: color })
  Billboard.create(entity, { billboardMode: BillboardMode.BM_Y }) // Individual billboard for text readability if we had text

  Interactable.create(entity, { type: type })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: hoverText
        }
      }
    ]
  })

  return entity
}

function createButtonAbsolute(
  menuStateEntity: Entity,
  basePos: Vector3,
  offset: Vector3,
  color: Color4,
  hoverText: string,
  type: InteractionType
) {
  const entity = engine.addEntity()
  Transform.create(entity, {
    position: Vector3.add(basePos, offset),
    scale: Vector3.create(0.3, 0.3, 0.1)
  })
  MeshRenderer.setBox(entity)
  MeshCollider.setBox(entity, ColliderLayer.CL_POINTER)
  Material.setPbrMaterial(entity, { albedoColor: color })
  Billboard.create(entity, { billboardMode: BillboardMode.BM_Y }) // Individual billboard for text readability if we had text

  Interactable.create(entity, { type: type })
  MenuElementComponent.create(entity, { menuStateEntity: menuStateEntity })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: hoverText
        }
      }
    ]
  })

  return entity
}

function createMoodBar(parent: Entity) {
  const barPos = Vector3.create(0, -1.1, 0.9) // Position 1m down, in front of the pet

  // Background
  const bgBar = engine.addEntity()
  Transform.create(bgBar, {
    parent: parent,
    position: barPos,
    scale: Vector3.create(1.5, 0.15, 0.05)
  })
  MeshRenderer.setBox(bgBar)
  Material.setPbrMaterial(bgBar, { albedoColor: Color4.Gray() })
  Billboard.create(bgBar, { billboardMode: BillboardMode.BM_Y })

  // Foreground
  const fgBar = engine.addEntity()
  Transform.create(fgBar, {
    parent: parent, // Parent to same root
    position: Vector3.add(barPos, Vector3.create(0, 0, -0.01)), // Slightly in front
    scale: Vector3.create(1.5, 0.15, 0.1)
  })
  MeshRenderer.setBox(fgBar)
  Material.setPbrMaterial(fgBar, { albedoColor: Color4.Green(), emissiveColor: Color4.Green(), emissiveIntensity: 0.5 })
  Billboard.create(fgBar, { billboardMode: BillboardMode.BM_Y })

  // Tag it for the RenderSystem
  MoodBarComponent.create(fgBar)
}

function createMoodBarAbsolute(menuStateEntity: Entity, basePos: Vector3) {
  const barPos = Vector3.create(0, -1.1, 0.9) // Position 1m down, in front of the pet

  // Background
  const bgBar = engine.addEntity()
  Transform.create(bgBar, {
    position: Vector3.add(basePos, barPos),
    scale: Vector3.create(1.5, 0.15, 0.05)
  })
  MeshRenderer.setBox(bgBar)
  Material.setPbrMaterial(bgBar, { albedoColor: Color4.Gray() })
  Billboard.create(bgBar, { billboardMode: BillboardMode.BM_Y })
  MenuElementComponent.create(bgBar, { menuStateEntity: menuStateEntity })

  // Foreground
  const fgBar = engine.addEntity()
  Transform.create(fgBar, {
    position: Vector3.add(basePos, Vector3.add(barPos, Vector3.create(0, 0, 0.01))), // Slightly in front of background
    scale: Vector3.create(1.5, 0.15, 0.05)
  })
  MeshRenderer.setBox(fgBar)
  Material.setPbrMaterial(fgBar, { albedoColor: Color4.Green(), emissiveColor: Color4.Green(), emissiveIntensity: 0.5 })
  Billboard.create(fgBar, { billboardMode: BillboardMode.BM_Y })

  // Tag it for the RenderSystem
  MoodBarComponent.create(fgBar)
  MenuElementComponent.create(fgBar, { menuStateEntity: menuStateEntity })
}

// Menu visibility functions
export function showMenu(menuStateEntity: Entity) {
  // Show all menu elements that belong to this menu state
  let shownCount = 0
  for (const [entity, menuElement] of engine.getEntitiesWith(MenuElementComponent)) {
    if (menuElement.menuStateEntity === menuStateEntity) {
      // Add MeshRenderer back to make entities visible
      if (!MeshRenderer.has(entity)) {
        MeshRenderer.setBox(entity)
        shownCount++
      }
      // Add MeshCollider back for buttons (they have colliders for interaction)
      if (!MeshCollider.has(entity)) {
        MeshCollider.setBox(entity, ColliderLayer.CL_POINTER)
      }
    }
  }
  console.log(`Menu shown: ${shownCount} elements restored for menu ${menuStateEntity}`)
}

export function hideMenu(menuStateEntity: Entity) {
  // Hide all menu elements that belong to this menu state
  for (const [entity, menuElement] of engine.getEntitiesWith(MenuElementComponent)) {
    if (menuElement.menuStateEntity === menuStateEntity) {
      if (MeshRenderer.has(entity)) {
        MeshRenderer.deleteFrom(entity)
      }
      if (MeshCollider.has(entity)) {
        MeshCollider.deleteFrom(entity)
      }
    }
  }
}

// Camera functions
export function createPetCamera(petEntity: Entity): Entity {
  const cameraEntity = engine.addEntity()

  // Position camera to look at the pet from a good angle
  const petPos = Transform.get(petEntity).position
  const cameraPos = Vector3.add(petPos, Vector3.create(0, 2, 3)) // Behind and above the pet

  Transform.create(cameraEntity, {
    position: cameraPos
  })

  VirtualCamera.create(cameraEntity, {
    lookAtEntity: petEntity, // Make camera look at the pet
    defaultTransition: { transitionMode: VirtualCamera.Transition.Time(1) } // Smooth transition
  })

  return cameraEntity
}

export function activatePetCamera(cameraEntity: Entity) {
  // Store original cursor state before unlocking
  const originalCursorLocked = PointerLock.get(engine.CameraEntity).isPointerLocked

  // Create or update camera focus component on the camera entity
  CameraFocusComponent.createOrReplace(cameraEntity, {
    isCameraFocused: true,
    originalCursorLocked: originalCursorLocked
  })

  // Start camera focus monitoring to prevent cursor locking
  startCameraFocusMonitoring()

  // Update camera position to be in front of pet's facing direction
  const cameraConfig = VirtualCamera.get(cameraEntity)
  if (cameraConfig?.lookAtEntity) {
    const petEntity = cameraConfig.lookAtEntity as Entity

    // Get pet's current transform
    const petTransform = Transform.get(petEntity)
    const petPos = petTransform.position
    const petRotation = petTransform.rotation

    // Calculate forward direction from pet's rotation
    const forward = Vector3.rotate(Vector3.Forward(), petRotation)

    // Position camera 2m in front of pet + height offset
    const cameraPos = Vector3.add(
      petPos,
      Vector3.add(
        Vector3.scale(forward, 2), // 2m in front
        Vector3.create(0, 2.5, 0) // height offset for good viewing angle
      )
    )

    // Update camera transform
    Transform.getMutable(cameraEntity).position = cameraPos
  }

  // Activate virtual camera
  MainCamera.createOrReplace(engine.CameraEntity, {
    virtualCameraEntity: cameraEntity
  })

  // Unlock cursor when focused
  PointerLock.getMutable(engine.CameraEntity).isPointerLocked = false

  // Enable cursor follow for the pet
  const virtualCamera = VirtualCamera.get(cameraEntity)
  if (virtualCamera?.lookAtEntity) {
    const petEntity = virtualCamera.lookAtEntity
    const cursorFollow = CursorFollowComponent.getMutableOrNull(petEntity as Entity)
    if (cursorFollow) {
      const petTransform = Transform.get(petEntity as Entity)

      const mutableCursorFollow = CursorFollowComponent.getMutable(petEntity as Entity)
      mutableCursorFollow.isActive = true
      mutableCursorFollow.baseRotation = {
        x: petTransform.rotation.x,
        y: petTransform.rotation.y,
        z: petTransform.rotation.z,
        w: petTransform.rotation.w
      }

      console.log(`Cursor follow enabled for pet`)
    }
  }

  console.log(`Camera focused on pet - cursor unlocked (was ${originalCursorLocked ? 'locked' : 'unlocked'})`)
}

export function deactivatePetCamera() {
  // Find the currently active camera and restore cursor state
  for (const [cameraEntity] of engine.getEntitiesWith(CameraFocusComponent)) {
    const focusComponent = CameraFocusComponent.getMutable(cameraEntity)
    if (focusComponent.isCameraFocused) {
      // Restore original cursor state
      if (focusComponent.originalCursorLocked !== undefined) {
        PointerLock.getMutable(engine.CameraEntity).isPointerLocked = focusComponent.originalCursorLocked
        console.log(
          `Camera detached from pet - cursor restored to ${focusComponent.originalCursorLocked ? 'locked' : 'unlocked'}`
        )
      } else {
        // Fallback to locked if we somehow don't have the original state
        PointerLock.getMutable(engine.CameraEntity).isPointerLocked = true
        console.log('Camera detached from pet - cursor locked (fallback)')
      }

      // Mark camera as not focused
      focusComponent.isCameraFocused = false
      break
    }
  }

  // Stop camera focus monitoring since no cameras are focused
  stopCameraFocusMonitoring()

  // Disable cursor follow for all pets and reset their rotation
  for (const [petEntity, cursorFollow] of engine.getEntitiesWith(CursorFollowComponent)) {
    if (cursorFollow.isActive) {
      const petTransform = Transform.getMutable(petEntity)

      // Reset rotation to base rotation
      petTransform.rotation = {
        x: cursorFollow.baseRotation.x,
        y: cursorFollow.baseRotation.y,
        z: cursorFollow.baseRotation.z,
        w: cursorFollow.baseRotation.w
      }

      const mutableCursorFollow = CursorFollowComponent.getMutable(petEntity)
      mutableCursorFollow.isActive = false
      console.log(`Cursor follow disabled for pet - rotation reset to base`)
    }
  }

  // Deactivate virtual camera
  const mainCamera = MainCamera.getMutableOrNull(engine.CameraEntity)
  if (mainCamera) {
    mainCamera.virtualCameraEntity = undefined
  }
}
