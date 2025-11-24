import {
  engine,
  Transform,
  MeshRenderer,
  Material,
  Billboard,
  BillboardMode,
  PointerEvents,
  PointerEventType,
  InputAction,
  Entity,
  VirtualCamera,
  MainCamera
} from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { Interactable, InteractionType } from '../components/Interaction'
import { MoodBarComponent, MenuStateComponent } from '../components/UIComponents'

export function createPetMenu(petEntity: Entity) {
  const petPos = Transform.get(petEntity).position
  const menuCenter = Vector3.add(petPos, Vector3.create(0, 1.5, 0)) // Initial pos, but should parent or update in system

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

  // Create a root menu entity parented to the pet
  const menuRoot = engine.addEntity()
  Transform.create(menuRoot, {
    parent: petEntity,
    position: Vector3.create(0, 1.5, 0) // Relative to pet
  })

  // Update menu state with menu root
  const menuState = MenuStateComponent.getMutable(menuStateEntity)
  menuState.menuRootEntity = menuRoot

  // --- Buttons ---
  createButton(menuRoot, Vector3.create(-0.8, 0, 0), Color4.Yellow(), 'Pet Me!', InteractionType.PET)
  createButton(menuRoot, Vector3.create(-0.4, 0, 0), Color4.Gray(), 'Feed', InteractionType.FEED)
  createButton(menuRoot, Vector3.create(0, 0, 0), Color4.Gray(), 'Play', InteractionType.PLAY)
  createButton(menuRoot, Vector3.create(0.4, 0, 0), Color4.Gray(), 'Clean', InteractionType.CLEAN)
  createButton(menuRoot, Vector3.create(0.8, 0, 0), Color4.Red(), 'Close', InteractionType.CLOSE_MENU)

  // --- Mood Bar ---
  createMoodBar(menuRoot)

  // Initially hide all menu elements
  hideMenu(menuRoot)

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

function createMoodBar(parent: Entity) {
  const barPos = Vector3.create(0, 0.4, 0)

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
    scale: Vector3.create(1.5, 0.15, 0.05)
  })
  MeshRenderer.setBox(fgBar)
  Material.setPbrMaterial(fgBar, { albedoColor: Color4.Green(), emissiveColor: Color4.Green(), emissiveIntensity: 0.5 })
  Billboard.create(fgBar, { billboardMode: BillboardMode.BM_Y })

  // Tag it for the RenderSystem
  MoodBarComponent.create(fgBar)
}

// Menu visibility functions
export function showMenu(menuRoot: Entity) {
  // Show all child entities of the menu root
  for (const [entity, transform] of engine.getEntitiesWith(Transform)) {
    if (transform.parent === menuRoot) {
      // Add MeshRenderer back to make entities visible
      if (!MeshRenderer.has(entity)) {
        // This is a button or mood bar - recreate based on what it is
        if (transform.scale.x === 0.3 && transform.scale.y === 0.3) {
          // It's a button
          MeshRenderer.setBox(entity)
        } else if (transform.scale.y === 0.15) {
          // It's a mood bar
          MeshRenderer.setBox(entity)
        }
      }
    }
  }
}

export function hideMenu(menuRoot: Entity) {
  // Hide all child entities of the menu root by removing MeshRenderer
  for (const [entity, transform] of engine.getEntitiesWith(Transform)) {
    if (transform.parent === menuRoot) {
      if (MeshRenderer.has(entity)) {
        MeshRenderer.deleteFrom(entity)
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
