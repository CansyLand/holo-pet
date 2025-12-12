import { Schemas, engine } from '@dcl/sdk/ecs'

// =============================================================================
// MULTIPLAYER COMPONENTS
// Components for managing player visibility and visit state
// =============================================================================

/**
 * Component to track local visit state (NOT synced - each player manages their own)
 * Attached to a global entity to track the player's current visit status
 */
export const VisitStateComponent = engine.defineComponent('VisitStateComponent', {
  isVisiting: Schemas.Boolean, // true = currently visiting someone, false = at home
  hostUserId: Schemas.String, // Wallet address of player being visited (empty string if at home)
  visiblePlayerIds: Schemas.Array(Schemas.String), // Array of player wallet addresses that are visible
  visiblePetCount: Schemas.Number // Number of visible pets (max 3 for performance)
})

/**
 * Component to mark the avatar modifier area entity
 * Used to hide/show player avatars
 */
export const AvatarModifierComponent = engine.defineComponent('AvatarModifierComponent', {
  isInitialized: Schemas.Boolean
})



