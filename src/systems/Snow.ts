import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { SnowComponent, SnowPoolManager } from '../components/Snow'
import { POOLED_POSITION_Y, SCENE_CENTER_X, SCENE_CENTER_Z } from '../utils/constants'
import {
  SNOW_POOL_SIZE,
  SNOW_LIFETIME,
  SNOW_FALL_SPEED,
  SNOW_WIND_STRENGTH,
  SNOW_SPAWN_RATE,
  SNOW_SIZE_MIN,
  SNOW_SIZE_MAX,
  SNOW_AREA_WIDTH,
  SNOW_AREA_DEPTH,
  SNOW_HEIGHT
} from '../factories/SnowPool'

// =============================================================================
// SNOW PARTICLE SYSTEM
// Continuously falling snow particles with wind effects
// Uses entity pooling - recycles snowflakes that fall below ground
// =============================================================================

// Module-level references to the pool (set by initializeSnowSystem)
let snowPool: Entity[] = []
let managerEntity: Entity | null = null

/**
 * Initialize the snow system with the pre-created pool
 * Called by SnowPool factory
 */
export function initializeSnowSystem(pool: Entity[], manager: Entity) {
  snowPool = pool
  managerEntity = manager
  console.log('Snow particle system initialized with', SNOW_POOL_SIZE, 'flakes')
}

/**
 * Snow particle system - runs every frame
 * Handles spawning new flakes and animating existing ones
 */
export function snowSystem(dt: number) {
  if (!managerEntity) return

  const manager = SnowPoolManager.getMutable(managerEntity)
  const now = Date.now() / 1000
  const pooledPosition = Vector3.create(SCENE_CENTER_X, POOLED_POSITION_Y, SCENE_CENTER_Z)

  // Spawn new snow periodically (continuous falling effect)
  if (now - manager.lastSpawnTime >= SNOW_SPAWN_RATE && manager.activeCount < SNOW_POOL_SIZE) {
    spawnSnowFlake()
    manager.lastSpawnTime = now
  }

  // Update all active snowflakes
  let activeCount = 0
  for (const [entity] of engine.getEntitiesWith(SnowComponent)) {
    const snow = SnowComponent.getMutable(entity)

    if (!snow.isActive) continue
    activeCount++

    const elapsed = now - snow.spawnTime

    // Return to pool if lifetime expired or fallen below ground
    if (elapsed >= snow.lifetime) {
      snow.isActive = false
      Transform.getMutable(entity).position = pooledPosition
      continue
    }

    // Get current transform
    const transform = Transform.getMutable(entity)

    // Apply physics: fall with wind
    transform.position.x += snow.velocityX * dt
    transform.position.y += snow.velocityY * dt
    transform.position.z += snow.velocityZ * dt

    // Add subtle wind variation
    snow.velocityX += (Math.random() - 0.5) * SNOW_WIND_STRENGTH * dt

    // Rotate for visual variety (billboarded planes)
    const rotation = Quaternion.fromEulerDegrees(0, elapsed * snow.rotationSpeed, 0)
    transform.rotation = rotation

    // Respawn if fallen below ground (continuous effect)
    if (transform.position.y < 0) {
      snow.isActive = false
      Transform.getMutable(entity).position = pooledPosition
    }
  }

  manager.activeCount = activeCount
}

/**
 * Spawn a single snowflake with randomized properties
 */
function spawnSnowFlake() {
  // Find inactive snow entity from pool
  for (const entity of snowPool) {
    const snow = SnowComponent.getMutableOrNull(entity)
    if (!snow || snow.isActive) continue

    const now = Date.now() / 1000

    // Activate snowflake
    snow.isActive = true
    snow.spawnTime = now

    // Random spawn position above scene
    const spawnX = SCENE_CENTER_X + (Math.random() - 0.5) * SNOW_AREA_WIDTH
    const spawnZ = SCENE_CENTER_Z + (Math.random() - 0.5) * SNOW_AREA_DEPTH

    // Random properties for natural variation
    const size = SNOW_SIZE_MIN + Math.random() * (SNOW_SIZE_MAX - SNOW_SIZE_MIN)
    const wind = (Math.random() - 0.5) * SNOW_WIND_STRENGTH * 2 // Initial wind direction

    snow.velocityX = wind
    snow.velocityY = -SNOW_FALL_SPEED - Math.random() * 0.5 // Vary fall speed
    snow.velocityZ = (Math.random() - 0.5) * 0.3 // Slight depth drift
    snow.size = size
    snow.rotationSpeed = (Math.random() - 0.5) * 180 // Random spin speed

    // Position and scale the snowflake
    const transform = Transform.getMutable(entity)
    transform.position = Vector3.create(spawnX, SNOW_HEIGHT, spawnZ)
    transform.scale = Vector3.create(size, size, size)

    break // Only spawn one per call
  }
}

// =============================================================================
// MANUAL CONTROL FUNCTIONS
// For testing and seasonal control
// =============================================================================

/**
 * Enable snow spawning (for manual control)
 */
export function enableSnow() {
  console.log('Snow spawning enabled')
  // This is a placeholder - actual control is through theme system
  // or by calling createSnowPool() during initialization
}

/**
 * Disable snow spawning and hide all active flakes (for manual control)
 */
export function disableSnow() {
  if (!managerEntity) return

  console.log('Snow spawning disabled')

  // Return all active snowflakes to pool
  const pooledPosition = Vector3.create(SCENE_CENTER_X, POOLED_POSITION_Y, SCENE_CENTER_Z)
  for (const [entity] of engine.getEntitiesWith(SnowComponent)) {
    const snow = SnowComponent.getMutable(entity)
    if (snow.isActive) {
      snow.isActive = false
      Transform.getMutable(entity).position = pooledPosition
    }
  }

  // Reset manager
  const manager = SnowPoolManager.getMutable(managerEntity)
  manager.activeCount = 0
  manager.lastSpawnTime = 0
}

/**
 * Reset the snow system - clears pool references
 * Called when resetting the game or changing themes
 */
export function resetSnowSystem() {
  snowPool = []
  managerEntity = null
  console.log('Snow system reset')
}


