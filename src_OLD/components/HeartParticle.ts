import { Schemas, engine, Entity } from '@dcl/sdk/ecs'

// =============================================================================
// HEART PARTICLE COMPONENTS
// Visual feedback when petting - pink cubes (later hearts) rise from pet
// Uses entity pooling pattern for performance
// =============================================================================

/**
 * Individual heart particle entity
 * Uses pooling - isActive toggles visibility
 */
export const HeartParticleComponent = engine.defineComponent('HeartParticleComponent', {
  isActive: Schemas.Boolean,       // false = pooled/hidden, true = visible & animating
  poolIndex: Schemas.Number,       // Index in pre-allocated pool
  spawnTime: Schemas.Number,       // When this heart was spawned (for animation timing)
  startY: Schemas.Number,          // Y position when spawned
  lifetime: Schemas.Number         // How long this heart lives (seconds)
})

/**
 * Pool manager - tracks the heart particle pool
 */
export const HeartPoolManager = engine.defineComponent('HeartPoolManager', {
  lastSpawnTime: Schemas.Number    // Cooldown between spawn bursts
})



