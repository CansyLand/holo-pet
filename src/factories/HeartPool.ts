import {
  engine,
  Transform,
  MeshRenderer,
  Material,
  Entity
} from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { HeartParticleComponent, HeartPoolManager } from '../components/HeartParticle'
import { initializeHeartSystem } from '../systems/HeartParticle'
import { POOLED_POSITION_Y, SCENE_CENTER_X, SCENE_CENTER_Z } from '../utils/constants'

// =============================================================================
// HEART POOL FACTORY
// Pre-creates a pool of heart particle entities (pink cubes for now)
// Never creates/destroys entities during gameplay - only shows/hides
// =============================================================================

export const HEART_POOL_SIZE = 15  // Number of pre-allocated hearts
export const HEART_LIFETIME = 1.5  // Seconds each heart floats up
export const HEART_RISE_SPEED = 2.0  // Units per second
export const HEART_SPAWN_COOLDOWN = 0.3  // Min seconds between spawn bursts
export const HEARTS_PER_PET = 5  // Hearts spawned per petting action

/**
 * Create the heart particle pool
 * Called once when the pet is created
 */
export function createHeartPool(): Entity {
  const pool: Entity[] = []

  // Hidden position for pooled (inactive) entities
  const pooledPosition = Vector3.create(SCENE_CENTER_X, POOLED_POSITION_Y, SCENE_CENTER_Z)

  // Pink/rose color for the hearts
  const roseColor = Color4.create(1.0, 0.4, 0.6, 1)  // Rosa pink

  // Create pool of heart entities
  for (let i = 0; i < HEART_POOL_SIZE; i++) {
    const entity = engine.addEntity()

    // Start in hidden position
    Transform.create(entity, {
      position: pooledPosition,
      scale: Vector3.create(0.15, 0.15, 0.15)  // Small cubes
    })

    // Visual representation - pink cube (will be hearts later)
    MeshRenderer.setBox(entity)
    Material.setPbrMaterial(entity, {
      albedoColor: roseColor,
      emissiveColor: Color4.create(1.0, 0.3, 0.5, 1),  // Slight glow
      emissiveIntensity: 0.3,
      roughness: 0.3
    })

    // Heart particle component with pooling data
    HeartParticleComponent.create(entity, {
      isActive: false,
      poolIndex: i,
      spawnTime: 0,
      startY: 0,
      lifetime: HEART_LIFETIME
    })

    pool.push(entity)
  }

  // Create pool manager entity
  const managerEntity = engine.addEntity()
  HeartPoolManager.create(managerEntity, {
    lastSpawnTime: 0
  })

  // Initialize the heart system with the pool
  initializeHeartSystem(pool, managerEntity)

  console.log(`Created heart pool with ${HEART_POOL_SIZE} entities`)

  return managerEntity
}

