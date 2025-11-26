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
import { PoopComponent, PoopPoolManager } from '../components/Poop'
import { Interactable, InteractionType } from '../components/Interaction'
import { initializePoopSystem } from '../systems/Poop'
import { POOP_POOL_SIZE, POOLED_POSITION_Y, SCENE_CENTER_X, SCENE_CENTER_Z } from '../utils/constants'

// =============================================================================
// POOP POOL FACTORY
// Pre-creates a pool of poop entities that are reused via toggling
// Never creates/destroys entities during gameplay - only shows/hides
// =============================================================================

/**
 * Create the poop entity pool
 * Called once when the pet environment is set up
 * Returns the pool manager entity for reference
 */
export function createPoopPool(): Entity {
  const pool: Entity[] = []

  // Hidden position for pooled (inactive) entities
  const pooledPosition = Vector3.create(SCENE_CENTER_X, POOLED_POSITION_Y, SCENE_CENTER_Z)

  // Create pool of poop entities
  for (let i = 0; i < POOP_POOL_SIZE; i++) {
    const entity = engine.addEntity()

    // Start in hidden position
    Transform.create(entity, {
      position: pooledPosition,
      scale: Vector3.create(0.3, 0.2, 0.3)
    })

    // Visual representation (placeholder - brown sphere)
    // TODO: Replace with GltfContainer when Poop.glb is available
    MeshRenderer.setSphere(entity)
    Material.setPbrMaterial(entity, {
      albedoColor: Color4.create(0.4, 0.25, 0.1, 1), // Brown
      roughness: 0.9
    })

    // Collision for click detection
    MeshCollider.setSphere(entity, ColliderLayer.CL_POINTER)

    // Poop component with pooling data
    PoopComponent.create(entity, {
      isActive: false,
      spawnedAt: 0,
      poolIndex: i
    })

    // Make it interactable (collect poop)
    Interactable.create(entity, {
      type: InteractionType.COLLECT_POOP
    })

    // Pointer events for collection
    PointerEvents.create(entity, {
      pointerEvents: [
        {
          eventType: PointerEventType.PET_DOWN,
          eventInfo: {
            button: InputAction.IA_POINTER,
            hoverText: 'Collect'
          }
        }
      ]
    })

    pool.push(entity)
  }

  // Create pool manager entity
  const managerEntity = engine.addEntity()
  PoopPoolManager.create(managerEntity, {
    activeCount: 0,
    lastPoopTime: 0
  })

  // Initialize the poop system with the pool
  initializePoopSystem(pool, managerEntity)

  console.log(`Created poop pool with ${POOP_POOL_SIZE} entities`)

  return managerEntity
}

