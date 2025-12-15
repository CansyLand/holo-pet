// Stats management - decay, restoration, trust calculation, personality generation

import type { Pet } from '../Pet'
import { TrustLevel, PetState } from './types'

// Stats decay over time (modified by personality)
export function decayStats(pet: Pet, dt: number) {
  const decayRate = dt / 1000 // Convert to seconds

  // Hunger grows faster with high appetite personality
  const hungerModifier = 1000 + pet.data.personality.appetite / 100
  pet.data.hunger = Math.min(100, pet.data.hunger + decayRate * hungerModifier)

  // Energy decays (slightly affected by energy personality)
  // Skip energy decay during sleep - let restoration handle it
  if (pet.data.state !== PetState.SLEEPING) {
    const energyModifier = 100 + pet.data.personality.energy / 500 // Less effect on decay
    pet.data.energy = Math.max(0, pet.data.energy - decayRate * energyModifier)
  }

  // Cleanliness decays faster with high cleanliness personality
  const cleanlinessModifier = 100 + pet.data.personality.cleanliness / 200
  pet.data.cleanliness = Math.max(0, pet.data.cleanliness - decayRate * cleanlinessModifier)

  // Bond decays when player is absent (1 month = game reset)
  const timeSinceVisit = Date.now() - pet.data.lastVisit
  if (timeSinceVisit > 24 * 60 * 60 * 1000) {
    // 24 hours
    pet.data.bond = Math.max(0, pet.data.bond - decayRate * 2)
  }
}

// Gradually restore energy during sleep
export function restoreEnergy(pet: Pet, dt: number): boolean {
  const restoreRate = (dt / 1000) * 3000 // Restore 25 energy per second
  pet.data.energy = Math.min(100, pet.data.energy + restoreRate)

  // Return true if energy is fully restored (signal to wake up)
  return pet.data.energy >= 100
}

// Calculate trust level from bond value
export function getTrustLevel(bond: number): TrustLevel {
  if (bond <= 20) return TrustLevel.STRANGER
  if (bond <= 40) return TrustLevel.ACQUAINTANCE
  if (bond <= 60) return TrustLevel.FRIEND
  if (bond <= 80) return TrustLevel.BONDED
  return TrustLevel.SOULMATE
}

// Generate random personality traits (20-80 range to avoid extremes)
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
