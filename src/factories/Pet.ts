import {
  engine,
  Transform,
  MeshRenderer,
  MeshCollider,
  Material,
  PointerEvents,
  PointerEventType,
  InputAction,
  ColliderLayer,
  GltfContainer,
  Animator
} from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { PetComponent, Species, PetState } from '../components/Pet'
import { Interactable, InteractionType } from '../components/Interaction'
import { PetAnimationStateComponent } from '../components/UIState'
import { createPetMenu } from './UI' // We will create this next

// Scene center for 2x2 parcels (32m x 32m)
const SCENE_CENTER_X = 16
const SCENE_CENTER_Z = 16

export function createEgg() {
  const entity = engine.addEntity()

  Transform.create(entity, {
    position: Vector3.create(SCENE_CENTER_X, 1, SCENE_CENTER_Z),
    scale: Vector3.create(1, 1, 1)
  })

  MeshRenderer.setSphere(entity)
  MeshCollider.setSphere(entity, ColliderLayer.CL_POINTER)
  Material.setPbrMaterial(entity, {
    albedoColor: Color4.create(0.5, 0.8, 1, 0.8),
    metallic: 0.5,
    roughness: 0.1,
    emissiveColor: Color4.create(0.2, 0.5, 1, 1),
    emissiveIntensity: 0.5
  })

  Interactable.create(entity, {
    type: InteractionType.HATCH
  })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: 'Hatch Egg'
        }
      }
    ]
  })

  return entity
}

export function createPet(species: Species) {
  const entity = engine.addEntity()

  Transform.create(entity, {
    position: Vector3.create(SCENE_CENTER_X, 0.5, SCENE_CENTER_Z), // Centered in 2x2 parcel
    scale: Vector3.create(1.5, 1.5, 1.5) // Slightly larger scale for better visibility
  })

  // Load the 3D dog model
  GltfContainer.create(entity, {
    src: 'assets/models/BlockDog.glb'
  })

  // Add Animator component with three animation states
  Animator.create(entity, {
    states: [
      {
        clip: 'Idle',
        playing: true,
        loop: true
      },
      {
        clip: 'Sitting',
        playing: false,
        loop: false
      },
      {
        clip: 'Standing',
        playing: false,
        loop: false
      }
    ]
  })

  // Initialize animation state component
  PetAnimationStateComponent.create(entity, {
    currentAnimation: 'Idle',
    lastMenuVisible: false,
    isTransitioning: false,
    transitionStartTime: 0
  })

  // Add collision for interaction
  MeshCollider.setBox(entity, ColliderLayer.CL_POINTER)

  PetComponent.create(entity, {
    species: species,
    mood: 100,
    hunger: 0,
    state: PetState.IDLE
  })

  Interactable.create(entity, {
    type: InteractionType.PET
  })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: 'Interact'
        }
      }
    ]
  })

  // Spawn UI attached to pet and get menu state entity
  const menuStateEntity = createPetMenu(entity)

  return { petEntity: entity, menuStateEntity }
}
