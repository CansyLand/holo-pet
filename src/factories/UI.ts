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
  ColliderLayer
} from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { Interactable, InteractionType } from '../components/Interaction'
import { MoodBarComponent, MenuStateComponent, MenuElementComponent } from '../components/UIComponents'

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
  MainCamera.createOrReplace(engine.CameraEntity, {
    virtualCameraEntity: cameraEntity
  })
}

export function deactivatePetCamera() {
  const mainCamera = MainCamera.getMutableOrNull(engine.CameraEntity)
  if (mainCamera) {
    mainCamera.virtualCameraEntity = undefined
  }
}
