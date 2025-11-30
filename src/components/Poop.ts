import { Schemas, engine, Entity } from '@dcl/sdk/ecs'

// =============================================================================
// POOP COMPONENT - Entity Pooling Pattern
// Pre-created entities that are toggled active/inactive instead of created/destroyed
// =============================================================================

/**
 * Component for poop entities in the object pool
 * - isActive: false = pooled/hidden, true = visible in world
 * - Never create/destroy poop entities, only toggle isActive
 */
export const PoopComponent = engine.defineComponent('PoopComponent', {
  isActive: Schemas.Boolean,      // false = hidden in pool, true = visible
  spawnedAt: Schemas.Number,      // Timestamp when this poop appeared
  poolIndex: Schemas.Number       // Index in pre-allocated pool (0-9)
})

/**
 * Singleton component to track the poop pool state
 * Attached to a manager entity, not individual poops
 */
export const PoopPoolManager = engine.defineComponent('PoopPoolManager', {
  activeCount: Schemas.Number,    // Number of visible poops
  lastPoopTime: Schemas.Number    // When pet last pooped
})

// Pool configuration (constants defined in utils/constants.ts)
// POOP_POOL_SIZE = 10
// POOLED_POSITION = { x: 0, y: -10, z: 0 }  // Hidden below ground



