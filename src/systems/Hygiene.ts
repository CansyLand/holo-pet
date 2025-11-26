import { engine, Entity } from '@dcl/sdk/ecs'
import { PetComponent } from '../components/Pet'
import { PersonalityComponent } from '../components/Personality'
import { HygieneComponent } from '../components/Hygiene'
import { getActivePoopCount } from './Poop'
import {
  HYGIENE_DECAY_RATE,
  HYGIENE_INTERVAL,
  DIRTY_THRESHOLD,
  FILTHY_THRESHOLD,
  DIRTY_MOOD_PENALTY,
  FILTHY_MOOD_PENALTY,
  POOP_CLEANLINESS_PENALTY,
  MIN_CLEANLINESS,
  MAX_CLEANLINESS,
  MIN_MOOD
} from '../utils/constants'

// =============================================================================
// HYGIENE SYSTEM
// Manages pet cleanliness decay and visual feedback triggers
// =============================================================================

let timeSinceLastDecay = 0

// Track visual state to avoid spamming state changes
const petHygieneVisualState: Map<number, {
  isDirty: boolean
  isFilthy: boolean
}> = new Map()

export function hygieneSystem(dt: number) {
  timeSinceLastDecay += dt

  // Only decay periodically
  if (timeSinceLastDecay < HYGIENE_INTERVAL) return
  timeSinceLastDecay = 0

  // Process each pet with hygiene component
  for (const [entity] of engine.getEntitiesWith(PetComponent, HygieneComponent)) {
    const hygieneData = HygieneComponent.getMutable(entity)
    const petData = PetComponent.getMutable(entity)
    const personality = PersonalityComponent.getOrNull(entity)

    // Calculate decay rate modified by cleanliness personality trait
    // High cleanliness trait = gets dirty FASTER (more sensitive to dirt)
    const personalityModifier = personality ? (personality.cleanliness / 50) : 1
    const decayAmount = HYGIENE_DECAY_RATE * personalityModifier

    // Decay cleanliness
    if (hygieneData.cleanliness > MIN_CLEANLINESS) {
      hygieneData.cleanliness = Math.max(
        MIN_CLEANLINESS,
        hygieneData.cleanliness - decayAmount
      )
    }

    // Apply cleanliness penalty from active poops
    const activePoops = getActivePoopCount()
    if (activePoops > 0) {
      const poopPenalty = activePoops * POOP_CLEANLINESS_PENALTY
      hygieneData.cleanliness = Math.max(
        MIN_CLEANLINESS,
        hygieneData.cleanliness - poopPenalty
      )
    }

    // Initialize visual state tracking
    if (!petHygieneVisualState.has(entity)) {
      petHygieneVisualState.set(entity, { isDirty: false, isFilthy: false })
    }

    const visualState = petHygieneVisualState.get(entity)!

    // Check dirty threshold (show stink lines)
    const nowDirty = hygieneData.cleanliness < DIRTY_THRESHOLD
    if (nowDirty !== visualState.isDirty) {
      visualState.isDirty = nowDirty
      if (nowDirty) {
        console.log('🦨 Pet is getting dirty - stink lines should appear')
        // TODO: Trigger stink visual effect on pet
      } else {
        console.log('✨ Pet is clean - stink lines removed')
        // TODO: Remove stink visual effect
      }
    }

    // Check filthy threshold (show flies)
    const nowFilthy = hygieneData.cleanliness < FILTHY_THRESHOLD
    if (nowFilthy !== visualState.isFilthy) {
      visualState.isFilthy = nowFilthy
      if (nowFilthy) {
        console.log('🪰 Pet is filthy - flies should appear')
        // TODO: Trigger flies visual effect on pet
      } else {
        console.log('🧼 Pet is less dirty - flies removed')
        // TODO: Remove flies visual effect
      }
    }

    // Apply mood penalty for being dirty
    if (nowFilthy) {
      // High cleanliness personality = bigger mood penalty when dirty
      const penaltyModifier = personality ? (personality.cleanliness / 50) : 1
      petData.mood = Math.max(MIN_MOOD, petData.mood - (FILTHY_MOOD_PENALTY * penaltyModifier))
    } else if (nowDirty) {
      const penaltyModifier = personality ? (personality.cleanliness / 50) : 1
      petData.mood = Math.max(MIN_MOOD, petData.mood - (DIRTY_MOOD_PENALTY * penaltyModifier))
    }
  }
}

/**
 * Restore cleanliness from bathing
 */
export function applyBath(petEntity: Entity, amount: number) {
  const hygieneData = HygieneComponent.getMutableOrNull(petEntity)
  if (hygieneData) {
    hygieneData.cleanliness = Math.min(MAX_CLEANLINESS, hygieneData.cleanliness + amount)
    hygieneData.lastBathTime = Date.now() / 1000
  }
}

/**
 * Restore cleanliness from brushing
 */
export function applyBrush(petEntity: Entity, amount: number) {
  const hygieneData = HygieneComponent.getMutableOrNull(petEntity)
  if (hygieneData) {
    hygieneData.cleanliness = Math.min(MAX_CLEANLINESS, hygieneData.cleanliness + amount)
    hygieneData.lastBrushTime = Date.now() / 1000
  }
}

/**
 * Get current hygiene visual state for a pet
 */
export function getHygieneVisualState(entity: number): { isDirty: boolean; isFilthy: boolean } | undefined {
  return petHygieneVisualState.get(entity)
}

