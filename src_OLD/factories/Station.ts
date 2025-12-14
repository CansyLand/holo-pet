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
  Entity
} from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { Interactable, InteractionType } from '../components/Interaction'
import { SceneElement, SceneType } from '../components/Scene'
import { SCENE_CENTER_X, SCENE_CENTER_Z } from '../utils/constants'

// =============================================================================
// STATION FACTORY
// Creates interactive care stations for Tamagotchi mechanics
// =============================================================================

// Station positions (exported for behavior system)
export const STATION_POSITIONS = {
  FOOD_BOWL: Vector3.create(SCENE_CENTER_X - 2, 0.15, SCENE_CENTER_Z + 2),
  WATER_BOWL: Vector3.create(SCENE_CENTER_X + 2, 0.15, SCENE_CENTER_Z + 2),
  TREAT_DISPENSER: Vector3.create(SCENE_CENTER_X - 3, 0.5, SCENE_CENTER_Z + 3),
  BATHTUB: Vector3.create(SCENE_CENTER_X + 4, 0.3, SCENE_CENTER_Z - 3),
  GROOMING_BRUSH: Vector3.create(SCENE_CENTER_X - 4, 0.4, SCENE_CENTER_Z - 3),
  BED: Vector3.create(SCENE_CENTER_X + 4, 0.2, SCENE_CENTER_Z + 3)
}

/**
 * Create the treat dispenser station
 * Gives treats that boost bond but are less healthy than food
 */
export function createTreatDispenser(): Entity {
  const entity = engine.addEntity()

  Transform.create(entity, {
    position: STATION_POSITIONS.TREAT_DISPENSER,
    scale: Vector3.create(0.4, 0.6, 0.4)
  })

  // Tall cylinder for dispenser
  MeshRenderer.setCylinder(entity)
  Material.setPbrMaterial(entity, {
    albedoColor: Color4.create(0.9, 0.6, 0.3, 1), // Orange/golden
    metallic: 0.3,
    roughness: 0.5
  })

  MeshCollider.setCylinder(entity, ColliderLayer.CL_POINTER)
  SceneElement.create(entity, { sceneType: SceneType.PET })

  Interactable.create(entity, {
    type: InteractionType.GIVE_TREAT
  })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: 'Give Treat'
        }
      }
    ]
  })

  return entity
}

/**
 * Create the bathtub station
 * Restores cleanliness significantly
 */
export function createBathtub(): Entity {
  const entity = engine.addEntity()

  Transform.create(entity, {
    position: STATION_POSITIONS.BATHTUB,
    scale: Vector3.create(1.2, 0.4, 0.8)
  })

  // Oval box shape for bathtub
  MeshRenderer.setBox(entity)
  Material.setPbrMaterial(entity, {
    albedoColor: Color4.create(0.9, 0.9, 0.95, 1), // White/porcelain
    metallic: 0.5,
    roughness: 0.3
  })

  MeshCollider.setBox(entity, ColliderLayer.CL_POINTER)
  SceneElement.create(entity, { sceneType: SceneType.PET })

  Interactable.create(entity, {
    type: InteractionType.BATHE
  })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: 'Bathe Pet'
        }
      }
    ]
  })

  // Add water inside the tub
  const water = engine.addEntity()
  Transform.create(water, {
    position: Vector3.create(
      STATION_POSITIONS.BATHTUB.x,
      STATION_POSITIONS.BATHTUB.y + 0.15,
      STATION_POSITIONS.BATHTUB.z
    ),
    scale: Vector3.create(1.0, 0.05, 0.6)
  })
  MeshRenderer.setBox(water)
  Material.setPbrMaterial(water, {
    albedoColor: Color4.create(0.3, 0.6, 0.9, 0.7), // Blue water
    metallic: 0.8,
    roughness: 0.1
  })
  SceneElement.create(water, { sceneType: SceneType.PET })

  return entity
}

/**
 * Create the grooming brush station
 * Quick cleanliness boost
 */
export function createGroomingBrush(): Entity {
  const entity = engine.addEntity()

  Transform.create(entity, {
    position: STATION_POSITIONS.GROOMING_BRUSH,
    scale: Vector3.create(0.3, 0.5, 0.15)
  })

  // Box shape for brush
  MeshRenderer.setBox(entity)
  Material.setPbrMaterial(entity, {
    albedoColor: Color4.create(0.6, 0.4, 0.2, 1), // Wooden brown
    roughness: 0.8
  })

  MeshCollider.setBox(entity, ColliderLayer.CL_POINTER)
  SceneElement.create(entity, { sceneType: SceneType.PET })

  Interactable.create(entity, {
    type: InteractionType.BRUSH
  })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: 'Brush Pet'
        }
      }
    ]
  })

  // Add bristles on top
  const bristles = engine.addEntity()
  Transform.create(bristles, {
    position: Vector3.create(
      STATION_POSITIONS.GROOMING_BRUSH.x,
      STATION_POSITIONS.GROOMING_BRUSH.y + 0.3,
      STATION_POSITIONS.GROOMING_BRUSH.z
    ),
    scale: Vector3.create(0.25, 0.15, 0.12)
  })
  MeshRenderer.setBox(bristles)
  Material.setPbrMaterial(bristles, {
    albedoColor: Color4.create(0.2, 0.2, 0.2, 1), // Dark bristles
    roughness: 1
  })
  SceneElement.create(bristles, { sceneType: SceneType.PET })

  return entity
}

/**
 * Create the bed station
 * Put pet to sleep for energy recharge
 */
export function createBed(): Entity {
  const entity = engine.addEntity()

  Transform.create(entity, {
    position: STATION_POSITIONS.BED,
    scale: Vector3.create(1.2, 0.3, 0.8)
  })

  // Box shape for bed frame
  MeshRenderer.setBox(entity)
  Material.setPbrMaterial(entity, {
    albedoColor: Color4.create(0.4, 0.3, 0.2, 1), // Wooden brown bed frame
    roughness: 0.7
  })

  MeshCollider.setBox(entity, ColliderLayer.CL_POINTER)
  SceneElement.create(entity, { sceneType: SceneType.PET })

  Interactable.create(entity, {
    type: InteractionType.SLEEP
  })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: 'Put to Bed'
        }
      }
    ]
  })

  // Add pillow/mattress on top
  const mattress = engine.addEntity()
  Transform.create(mattress, {
    position: Vector3.create(STATION_POSITIONS.BED.x, STATION_POSITIONS.BED.y + 0.2, STATION_POSITIONS.BED.z),
    scale: Vector3.create(1.0, 0.1, 0.6)
  })
  MeshRenderer.setBox(mattress)
  Material.setPbrMaterial(mattress, {
    albedoColor: Color4.create(0.9, 0.9, 1, 1), // White/light blue mattress
    roughness: 0.9
  })
  SceneElement.create(mattress, { sceneType: SceneType.PET })

  return entity
}

/**
 * Create all care stations for the pet environment
 * Called when transitioning to PET phase
 */
export function createAllStations(): {
  treatDispenser: Entity
  bathtub: Entity
  groomingBrush: Entity
  bed: Entity
} {
  return {
    treatDispenser: createTreatDispenser(),
    bathtub: createBathtub(),
    groomingBrush: createGroomingBrush(),
    bed: createBed()
  }
}
