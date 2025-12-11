import { Entity } from '@dcl/sdk/ecs'
import { PetComponent } from '../components/Pet'
import { PersonalityComponent, BondComponent, PetIdentityComponent } from '../components/Personality'
import { HygieneComponent } from '../components/Hygiene'
import { getActivePoopCount } from '../systems/Poop'
import { PetDocument } from './api'
import { getLocalPlayerName } from '../utils/players'

/**
 * Serialize pet entity components to PetDocument for saving
 * Note: visitStreak, lastVisitDate, and score are calculated/updated by the server
 */
export function serializePet(petEntity: Entity, existingMeta?: PetDocument['meta']): PetDocument | null {
  const pet = PetComponent.getOrNull(petEntity)
  const identity = PetIdentityComponent.getOrNull(petEntity)
  const personality = PersonalityComponent.getOrNull(petEntity)
  const bond = BondComponent.getOrNull(petEntity)
  const hygiene = HygieneComponent.getOrNull(petEntity)

  if (!pet || !identity || !personality || !bond || !hygiene) {
    return null
  }

  return {
    identity: {
      name: identity.name,
      species: pet.species,
      hatchedAt: identity.hatchedAt
    },
    stats: {
      mood: pet.mood,
      hunger: pet.hunger,
      energy: pet.energy,
      state: pet.state
    },
    personality: {
      energy: personality.energy,
      sociability: personality.sociability,
      cleanliness: personality.cleanliness,
      appetite: personality.appetite
    },
    bond: {
      bond: bond.bond,
      trustLevel: bond.trustLevel,
      lastVisitTime: bond.lastVisitTime
    },
    hygiene: {
      cleanliness: hygiene.cleanliness,
      lastBathTime: hygiene.lastBathTime,
      lastBrushTime: hygiene.lastBrushTime
    },
    meta: {
      version: '1.0.0',
      createdAt: existingMeta?.createdAt || identity.hatchedAt,
      updatedAt: Date.now(),
      activePoopCount: getActivePoopCount(),
      gamePhase: 'pet',
      hatchCount: existingMeta?.hatchCount || 1,
      // Server-calculated fields - preserve existing values or use defaults
      visitStreak: existingMeta?.visitStreak || 0,
      lastVisitDate: existingMeta?.lastVisitDate || '',
      score: existingMeta?.score || 0,
      ownerName: getLocalPlayerName() // Always update player name on save
    }
  }
}

/**
 * Deserialize PetDocument to component values for loading
 */
export function deserializePet(doc: PetDocument) {
  return {
    pet: {
      species: doc.identity.species,
      mood: doc.stats.mood,
      hunger: doc.stats.hunger,
      energy: doc.stats.energy,
      state: doc.stats.state
    },
    identity: {
      name: doc.identity.name,
      hatchedAt: doc.identity.hatchedAt,
      ownerId: '' // Will be set from wallet
    },
    personality: {
      energy: doc.personality.energy,
      sociability: doc.personality.sociability,
      cleanliness: doc.personality.cleanliness,
      appetite: doc.personality.appetite
    },
    bond: {
      bond: doc.bond.bond,
      trustLevel: doc.bond.trustLevel,
      lastVisitTime: doc.bond.lastVisitTime
    },
    hygiene: {
      cleanliness: doc.hygiene.cleanliness,
      lastBathTime: doc.hygiene.lastBathTime,
      lastBrushTime: doc.hygiene.lastBrushTime
    },
    activePoopCount: doc.meta.activePoopCount
  }
}
