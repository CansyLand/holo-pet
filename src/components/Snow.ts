import { Schemas, engine } from '@dcl/sdk/ecs'

// =============================================================================
// SNOW PARTICLE COMPONENTS
// Falling snow particles with wind effects and visual variation
// Uses entity pooling pattern - 50 pre-allocated billboarded planes
// =============================================================================

/**
 * Individual snow particle entity
 * Uses pooling - isActive toggles visibility
 * Billboarded planes that always face the camera
 */
export const SnowComponent = engine.defineComponent('SnowComponent', {
  // Pooling state
  isActive: Schemas.Boolean, // false = pooled/hidden, true = visible & falling
  poolIndex: Schemas.Number, // Index in pre-allocated pool

  // Animation state
  spawnTime: Schemas.Number, // When this snowflake was spawned
  lifetime: Schemas.Number, // How long this snowflake lives
  startY: Schemas.Number, // Y position when spawned

  // Movement physics
  velocityX: Schemas.Number, // Horizontal wind velocity
  velocityY: Schemas.Number, // Downward fall velocity
  velocityZ: Schemas.Number, // Depth drift velocity

  // Visual variation
  size: Schemas.Number, // Scale multiplier for this flake
  rotationSpeed: Schemas.Number // Degrees per second rotation
})

/**
 * Snow pool manager - controls spawning and tracks active particles
 */
export const SnowPoolManager = engine.defineComponent('SnowPoolManager', {
  lastSpawnTime: Schemas.Number, // Cooldown between spawning new flakes
  activeCount: Schemas.Number // Number of currently active snowflakes
})
