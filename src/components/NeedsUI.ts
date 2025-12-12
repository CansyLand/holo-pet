import { Schemas, engine } from '@dcl/sdk/ecs'

// =============================================================================
// NEEDS UI COMPONENTS
// Optional cylindrical bars showing pet stats above the pet
// =============================================================================

// Global toggle for needs UI system
export const NeedsUIEnabledComponent = engine.defineComponent('NeedsUIEnabledComponent', {
  enabled: Schemas.Boolean // Global toggle - when false, bars are hidden
})

// Tracks individual needs UI instances per pet
export const NeedsUIComponent = engine.defineComponent('NeedsUIComponent', {
  petEntity: Schemas.Entity, // Which pet this UI belongs to
  rootEntity: Schemas.Entity, // Root transform entity (billboard parent)
  barEntities: Schemas.Array(Schemas.Entity) // Array of 4 bar fill entities [food, mood, rest, bath]
})
