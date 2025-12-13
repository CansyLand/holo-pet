import { engine, Transform, MeshRenderer, Material, Billboard, Entity } from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { SnowComponent, SnowPoolManager } from '../components/Snow'
import { initializeSnowSystem } from '../systems/Snow'
import { POOLED_POSITION_Y, SCENE_CENTER_X, SCENE_CENTER_Z } from '../utils/constants'

// =============================================================================
// SNOW POOL FACTORY
// Pre-creates 50 billboarded snow particle entities (white planes)
// Uses entity pooling - never creates/destroys during gameplay
// =============================================================================

// =============================================================================
// CONFIGURABLE SNOW VARIABLES
// =============================================================================
export const SNOW_POOL_SIZE = 50 // Number of pre-allocated snowflakes (user requirement)
export const SNOW_LIFETIME = 8.0 // How long each snowflake lives (seconds)
export const SNOW_FALL_SPEED = 1.5 // Base fall speed (units per second)
export const SNOW_WIND_STRENGTH = 0.8 // Wind variation strength
export const SNOW_SPAWN_RATE = 0.1 // Seconds between spawning new flakes
export const SNOW_SIZE_MIN = 0.05 // Minimum snowflake size
export const SNOW_SIZE_MAX = 0.15 // Maximum snowflake size
export const SNOW_AREA_WIDTH = 32 // Scene width coverage (meters)
export const SNOW_AREA_DEPTH = 32 // Scene depth coverage (meters)
export const SNOW_HEIGHT = 15 // Spawn height above ground

/**
 * Create the snow particle pool
 * Called once during scene initialization when snow should be active
 */
export function createSnowPool(): Entity {
  const pool: Entity[] = []

  // Hidden position for pooled (inactive) entities
  const pooledPosition = Vector3.create(SCENE_CENTER_X, POOLED_POSITION_Y, SCENE_CENTER_Z)

  // Snow color (white with slight blue tint)
  const snowColor = Color4.create(0.95, 0.98, 1.0, 0.8) // Slightly transparent white

  // Create 50 snowflake entities (user requirement)
  for (let i = 0; i < SNOW_POOL_SIZE; i++) {
    const entity = engine.addEntity()

    // Start in hidden position
    Transform.create(entity, {
      position: pooledPosition,
      scale: Vector3.create(SNOW_SIZE_MIN, SNOW_SIZE_MIN, SNOW_SIZE_MIN)
    })

    // Billboard so snow always faces camera
    Billboard.create(entity)

    // Visual representation - white plane
    MeshRenderer.setPlane(entity)
    Material.setPbrMaterial(entity, {
      albedoColor: snowColor,
      emissiveColor: Color4.create(0.9, 0.95, 1.0, 0.3), // Slight blue glow
      emissiveIntensity: 0.1,
      roughness: 0.8,
      metallic: 0.0,
      alphaTest: 0.1 // For transparency
    })

    // Snow particle component with pooling data
    SnowComponent.create(entity, {
      isActive: false,
      poolIndex: i,
      spawnTime: 0,
      lifetime: SNOW_LIFETIME,
      startY: SNOW_HEIGHT,
      velocityX: 0,
      velocityY: -SNOW_FALL_SPEED,
      velocityZ: 0,
      size: SNOW_SIZE_MIN,
      rotationSpeed: 0
    })

    pool.push(entity)
  }

  // Create pool manager entity
  const managerEntity = engine.addEntity()
  SnowPoolManager.create(managerEntity, {
    lastSpawnTime: 0,
    activeCount: 0
  })

  // Initialize the snow system with the pool
  initializeSnowSystem(pool, managerEntity)

  console.log(`Created snow pool with ${SNOW_POOL_SIZE} billboarded entities`)

  return managerEntity
}


