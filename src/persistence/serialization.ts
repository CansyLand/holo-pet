import { Pet } from '../Pet'
import { PetDocument } from './api'
import { getLocalPlayerName } from '../utils/playerUtils'

/**
 * Get today's date in UTC format for quest reset tracking
 */
function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Serialize Pet.data to PetDocument for saving
 * Note: visitStreak, lastVisitDate, and score are calculated/updated by the server
 */
export function serializePet(pet: Pet, existingMeta?: PetDocument['meta']): PetDocument | null {
  if (!pet) return null

  return {
    identity: {
      name: pet.data.name,
      species: pet.data.species,
      hatchedAt: pet.data.hatchedAt
    },
    stats: {
      mood: pet.data.mood,
      hunger: pet.data.hunger,
      energy: pet.data.energy,
      state: pet.data.state
    },
    personality: {
      energy: pet.data.personality.energy,
      sociability: pet.data.personality.sociability,
      cleanliness: pet.data.personality.cleanliness,
      appetite: pet.data.personality.appetite
    },
    bond: {
      bond: pet.data.bond,
      trustLevel: pet.getTrustLevel(),
      lastVisitTime: pet.data.lastVisit
    },
    hygiene: {
      cleanliness: pet.data.cleanliness,
      lastBathTime: pet.data.lastBathTime,
      lastBrushTime: pet.data.lastBrushTime
    },
    meta: {
      version: '2.0.0', // Updated for new Pet.data structure
      createdAt: existingMeta?.createdAt || pet.data.hatchedAt,
      updatedAt: Date.now(),
      activePoopCount: 0, // TODO: Get from poop module when implemented
      gamePhase: 'pet',
      hatchCount: existingMeta?.hatchCount || 1,
      // Server-calculated fields - preserve existing values or use defaults
      visitStreak: existingMeta?.visitStreak || 0,
      lastVisitDate: existingMeta?.lastVisitDate || '',
      score: existingMeta?.score || 0,
      ownerName: getLocalPlayerName(), // Always update player name on save
      // Quest state from pet.data.quests
      dailyQuests: {
        feedCompleted: pet.data.quests.feed,
        playCompleted: pet.data.quests.play,
        bathCompleted: pet.data.quests.bath,
        bedtimeCompleted: pet.data.quests.bedtime,
        lastResetDate: existingMeta?.dailyQuests?.lastResetDate || getTodayUTC()
      }
    }
  }
}

/**
 * Deserialize PetDocument to Pet.data values for loading
 * Standard loading - preserves saved values
 */
export function deserializePet(doc: PetDocument) {
  return {
    // Identity - keep as saved
    name: doc.identity.name,
    species: doc.identity.species,
    hatchedAt: doc.identity.hatchedAt,
    ownerId: '', // Will be set from wallet

    // Stats - keep as saved
    mood: doc.stats.mood,
    hunger: doc.stats.hunger,
    energy: doc.stats.energy,
    cleanliness: doc.hygiene.cleanliness,
    bond: doc.bond.bond,

    // Personality - keep as saved
    personality: {
      energy: doc.personality.energy,
      sociability: doc.personality.sociability,
      cleanliness: doc.personality.cleanliness,
      appetite: doc.personality.appetite
    },

    // State and behavior
    state: doc.stats.state,
    position: { x: 16, y: 0, z: 16 }, // Default spawn position
    lastVisit: doc.bond.lastVisitTime,
    lastBathTime: doc.hygiene.lastBathTime,
    lastBrushTime: doc.hygiene.lastBrushTime,

    // Quests - keep as saved
    quests: {
      feed: doc.meta.dailyQuests?.feedCompleted || false,
      play: doc.meta.dailyQuests?.playCompleted || false,
      bath: doc.meta.dailyQuests?.bathCompleted || false,
      bedtime: doc.meta.dailyQuests?.bedtimeCompleted || false
    }
  }
}

/**
 * Deserialize PetDocument to Pet.data values for QUEST MODE loading
 * Sets levels LOW so players can complete all 4 quests: feed, play, bath, sleep
 * This is the key function for your requirement!
 */
export function deserializePetForQuestMode(doc: PetDocument) {
  return {
    // Identity - keep saved name and traits
    name: doc.identity.name,
    species: doc.identity.species,
    hatchedAt: doc.identity.hatchedAt,
    ownerId: '', // Will be set from wallet

    // SET LOW LEVELS for quest completion (your requirement)
    mood: 30, // Low mood - encourages interaction
    hunger: 80, // Very hungry - NEED TO FEED (quest)
    energy: 20, // Low energy - NEED TO SLEEP (quest)
    cleanliness: 25, // Very dirty - NEED TO BATH (quest)
    bond: Math.min(doc.bond.bond, 30), // Keep some bond but not too high

    // Personality - keep saved traits
    personality: {
      energy: doc.personality.energy,
      sociability: doc.personality.sociability,
      cleanliness: doc.personality.cleanliness,
      appetite: doc.personality.appetite
    },

    // State and behavior
    state: 'idle',
    position: { x: 16, y: 0, z: 16 }, // Default spawn position
    lastVisit: Date.now(), // Update visit time
    lastBathTime: doc.hygiene.lastBathTime,
    lastBrushTime: doc.hygiene.lastBrushTime,

    // RESET QUESTS TO INCOMPLETE - player needs to complete all 4
    quests: {
      feed: false, // Need to complete feed quest
      play: false, // Need to complete play quest
      bath: false, // Need to complete bath quest
      bedtime: false // Need to complete sleep quest
    }
  }
}
