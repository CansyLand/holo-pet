import { Schemas, engine } from '@dcl/sdk/ecs'

// =============================================================================
// HYGIENE COMPONENT
// Tracks pet cleanliness - decays over time, restored by bathing/brushing
// =============================================================================

/**
 * Cleanliness tracking for the pet
 * Low cleanliness triggers visual effects (stink lines, flies)
 * and applies mood penalties
 */
export const HygieneComponent = engine.defineComponent('HygieneComponent', {
  cleanliness: Schemas.Number,    // 0-100, current cleanliness level
  lastBathTime: Schemas.Number,   // Timestamp of last bath
  lastBrushTime: Schemas.Number   // Timestamp of last brushing
})

// Visual state thresholds (for reference, used in RenderSystem)
// DIRTY_THRESHOLD = 40  -> Show stink lines
// FILTHY_THRESHOLD = 20 -> Show flies



