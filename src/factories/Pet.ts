import {
  engine,
  Entity,
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
import { Vector3, Color4, Quaternion } from '@dcl/sdk/math'
import { PetComponent, Species, PetState } from '../components/Pet'
import { Interactable, InteractionType } from '../components/Interaction'
import { PetAnimationStateComponent, CursorFollowComponent, CameraFocusComponent } from '../components/UIState'
import {
  PersonalityComponent,
  BondComponent,
  PetIdentityComponent,
  TrustLevel,
  generatePersonality
} from '../components/Personality'
import { HygieneComponent } from '../components/Hygiene'
import { createPetMenu } from './UI'
import { createPoopPool } from './PoopPool'
import { createHeartPool } from './HeartPool'
import { createAllStations } from './Station'
import { SCENE_CENTER_X, SCENE_CENTER_Z, MAX_CLEANLINESS, MAX_BOND, CURSOR_FOLLOW_MAX_TILT } from '../utils/constants'

export function createEgg() {
  const entity = engine.addEntity()

  Transform.create(entity, {
    position: Vector3.create(SCENE_CENTER_X, 3, SCENE_CENTER_Z),
    scale: Vector3.create(3.6, 5, 3.6)
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
    position: Vector3.create(SCENE_CENTER_X, 0.5, SCENE_CENTER_Z),
    scale: Vector3.create(1.5, 1.5, 1.5)
  })

  // Load the 3D dog model
  GltfContainer.create(entity, {
    src: 'assets/models/BlockDog.glb'
  })

  // Add Animator component with animation states
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

  // Core pet component
  PetComponent.create(entity, {
    species: species,
    mood: 100,
    hunger: 0,
    energy: 100,
    state: PetState.IDLE
  })

  // Generate unique personality for this pet
  const personality = generatePersonality()
  PersonalityComponent.create(entity, {
    energy: personality.energy,
    sociability: personality.sociability,
    cleanliness: personality.cleanliness,
    appetite: personality.appetite
  })

  console.log(`Pet personality generated:`, personality)

  // Initialize bond component - starts as stranger
  BondComponent.create(entity, {
    bond: 50, // Start with some bond so pet doesn't immediately run away
    trustLevel: TrustLevel.ACQUAINTANCE,
    lastVisitTime: Date.now() / 1000
  })

  // Initialize hygiene component - starts clean
  HygieneComponent.create(entity, {
    cleanliness: MAX_CLEANLINESS,
    lastBathTime: Date.now() / 1000,
    lastBrushTime: Date.now() / 1000
  })

  // Pet identity - name will be set by naming popup
  PetIdentityComponent.create(entity, {
    name: '', // Will be set after naming popup
    hatchedAt: Date.now(),
    ownerId: '' // Will be set when persistence is implemented
  })

  // Cursor follow - starts disabled, activated when camera focuses
  CursorFollowComponent.create(entity, {
    isActive: false,
    baseRotation: Quaternion.Identity(), // Will be set when activated
    maxTiltAngle: CURSOR_FOLLOW_MAX_TILT
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

  // Create poop pool for this pet environment
  createPoopPool()

  // Create heart particle pool for visual feedback
  createHeartPool()

  // Create care stations
  createAllStations()

  return { petEntity: entity, menuStateEntity }
}

/**
 * Set the pet's name and update hover text (called from naming UI)
 */
export function setPetName(petEntity: Entity, name: string) {
  const identity = PetIdentityComponent.getMutableOrNull(petEntity)
  if (identity) {
    identity.name = name
    console.log(`Pet named: ${name}`)

    // Update the hover text to show the pet's name
    updatePetHoverText(petEntity, name)
  }
}

/**
 * Update the pet's hover text to show its name (or "pet" when in focused mode)
 */
export function updatePetHoverText(petEntity: Entity, name: string) {
  // Remove old PointerEvents and create new one with updated text
  if (PointerEvents.has(petEntity)) {
    PointerEvents.deleteFrom(petEntity)
  }

  // Check if we're in focused mode (camera is active)
  let isFocusedMode = false
  for (const [cameraEntity, focusComponent] of engine.getEntitiesWith(CameraFocusComponent)) {
    if (focusComponent.isCameraFocused) {
      isFocusedMode = true
      break
    }
  }

  // Use "pet" as hover text when in focused mode, otherwise use the pet's name
  const hoverText = isFocusedMode ? 'pet' : name || 'Pet'

  PointerEvents.create(petEntity, {
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
}
