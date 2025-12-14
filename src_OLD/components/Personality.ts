import { Schemas, engine } from '@dcl/sdk/ecs'

// =============================================================================
// PERSONALITY SYSTEM COMPONENTS
// Defines pet personality traits, bond/relationship, and identity
// =============================================================================

// -----------------------------------------------------------------------------
// Trust Levels (Bond thresholds)
// -----------------------------------------------------------------------------

export enum TrustLevel {
  STRANGER = 'stranger',        // 0-20: Pet avoids player
  ACQUAINTANCE = 'acquaintance', // 21-40: Pet tolerates player
  FRIEND = 'friend',            // 41-60: Pet approaches player
  BONDED = 'bonded',            // 61-80: Pet follows player, occasional hearts
  SOULMATE = 'soulmate'         // 81-100: Constant hearts, special animations
}

// -----------------------------------------------------------------------------
// Pet Identity Component
// -----------------------------------------------------------------------------

/**
 * Stores the pet's identity - name, birth time, and owner
 * Created when the pet is named after hatching
 */
export const PetIdentityComponent = engine.defineComponent('PetIdentityComponent', {
  name: Schemas.String,           // Player-given name
  hatchedAt: Schemas.Number,      // Unix timestamp of hatch
  ownerId: Schemas.String         // Wallet address for persistence
})

// -----------------------------------------------------------------------------
// Personality Component
// -----------------------------------------------------------------------------

/**
 * Permanent personality traits generated at hatch (0-100 scale)
 * These traits modify behavior and stat decay rates
 */
export const PersonalityComponent = engine.defineComponent('PersonalityComponent', {
  energy: Schemas.Number,         // High = moves more, hunger grows faster
  sociability: Schemas.Number,    // High = seeks player, bigger petting boost
  cleanliness: Schemas.Number,    // High = gets dirty faster, hates being dirty
  appetite: Schemas.Number        // High = hungry faster, loves food more
})

// -----------------------------------------------------------------------------
// Bond Component
// -----------------------------------------------------------------------------

/**
 * Tracks the relationship between pet and owner
 * Bond grows with care and DECAYS when player is absent
 * If bond reaches 0, pet runs away (game over)
 */
export const BondComponent = engine.defineComponent('BondComponent', {
  bond: Schemas.Number,           // 0-100 relationship level
  trustLevel: Schemas.EnumString<TrustLevel>(TrustLevel, TrustLevel.STRANGER),
  lastVisitTime: Schemas.Number   // Timestamp of last player interaction
})

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Generate random personality traits for a new pet
 * Values are between PERSONALITY_MIN and PERSONALITY_MAX (20-80)
 * to avoid extreme personalities
 */
export function generatePersonality(): {
  energy: number
  sociability: number
  cleanliness: number
  appetite: number
} {
  const min = 20
  const max = 80
  const range = max - min

  return {
    energy: Math.floor(Math.random() * range) + min,
    sociability: Math.floor(Math.random() * range) + min,
    cleanliness: Math.floor(Math.random() * range) + min,
    appetite: Math.floor(Math.random() * range) + min
  }
}

/**
 * Calculate trust level from bond value
 */
export function getTrustLevel(bond: number): TrustLevel {
  if (bond <= 20) return TrustLevel.STRANGER
  if (bond <= 40) return TrustLevel.ACQUAINTANCE
  if (bond <= 60) return TrustLevel.FRIEND
  if (bond <= 80) return TrustLevel.BONDED
  return TrustLevel.SOULMATE
}

