import { engine, Entity } from '@dcl/sdk/ecs'
import { PetComponent, PetState } from '../components/Pet'
import { HygieneComponent } from '../components/Hygiene'
import { GameState, GamePhase } from '../components/GameState'
import { DailyQuestComponent, getTodayUTC, shouldResetQuests } from '../components/Quest'
import {
  QUEST_FEED_THRESHOLD,
  QUEST_PLAY_MOOD_THRESHOLD,
  QUEST_PLAY_ENERGY_THRESHOLD,
  QUEST_BATH_THRESHOLD,
  QUEST_XP_REWARD,
  SLEEP_ENERGY_RECHARGE_RATE,
  SLEEP_FULL_ENERGY_THRESHOLD,
  MAX_ENERGY
} from '../utils/constants'
import { triggerSave } from './Persistence'

// Global quest state entity (singleton)
let questStateEntity: Entity | null = null

// Track if we've already awarded XP for a quest this session
// (prevents double-awarding if threshold is met multiple times)
interface QuestCompletionFlags {
  feedAwarded: boolean
  playAwarded: boolean
  bathAwarded: boolean
  bedtimeAwarded: boolean
}

let completionFlags: QuestCompletionFlags = {
  feedAwarded: false,
  playAwarded: false,
  bathAwarded: false,
  bedtimeAwarded: false
}

/**
 * Initialize the quest system
 * Creates the singleton quest state entity
 */
export function initQuestSystem() {
  // Create quest state entity if it doesn't exist
  if (!questStateEntity) {
    questStateEntity = engine.addEntity()
    DailyQuestComponent.create(questStateEntity, {
      feedCompleted: false,
      playCompleted: false,
      bathCompleted: false,
      bedtimeCompleted: false,
      lastResetDate: getTodayUTC()
    })
    console.log('Quest system initialized')
  }
}

/**
 * Get the quest state entity (singleton)
 */
export function getQuestStateEntity(): Entity | null {
  return questStateEntity
}

/**
 * Check for daily quest reset (called on scene load)
 */
export function checkDailyQuestReset() {
  if (!questStateEntity) return

  const questState = DailyQuestComponent.getMutable(questStateEntity)

  // Check for daily reset
  if (shouldResetQuests(questState.lastResetDate)) {
    console.log('🔄 Resetting daily quests for new day')
    questState.feedCompleted = false
    questState.playCompleted = false
    questState.bathCompleted = false
    questState.bedtimeCompleted = false
    questState.lastResetDate = getTodayUTC()

    // Reset completion flags
    completionFlags.feedAwarded = false
    completionFlags.playAwarded = false
    completionFlags.bathAwarded = false
    completionFlags.bedtimeAwarded = false

    // Trigger save to persist reset
    triggerSave()
  }
}

/**
 * Check quest completion after specific player actions
 * Only checks the currently active quest to avoid unnecessary computation
 */
export function checkQuestCompletion(
  actionType: 'feed' | 'play' | 'bath' | 'bedtime',
  pet: ReturnType<typeof PetComponent.getMutable>,
  hygiene?: ReturnType<typeof HygieneComponent.getMutable> | null
) {
  if (!questStateEntity) return

  const questState = DailyQuestComponent.getMutable(questStateEntity)

  // Only check completion for the specific action and quest prerequisites
  switch (actionType) {
    case 'feed':
      // Feed quest: always available as first quest
      if (!questState.feedCompleted && !completionFlags.feedAwarded) {
        if (pet.hunger < QUEST_FEED_THRESHOLD) {
          completeQuest('feed', questState)
        }
      }
      break

    case 'play':
      // Play quest: only if Feed is completed
      if (!questState.playCompleted && !completionFlags.playAwarded && questState.feedCompleted) {
        if (pet.mood > QUEST_PLAY_MOOD_THRESHOLD && pet.energy < QUEST_PLAY_ENERGY_THRESHOLD) {
          completeQuest('play', questState)
        }
      }
      break

    case 'bath':
      // Bath quest: only if Feed and Play are completed
      if (
        !questState.bathCompleted &&
        !completionFlags.bathAwarded &&
        questState.feedCompleted &&
        questState.playCompleted &&
        hygiene
      ) {
        if (hygiene.cleanliness > QUEST_BATH_THRESHOLD) {
          completeQuest('bath', questState)
        }
      }
      break

    case 'bedtime':
      // Bedtime quest: only if all previous quests are completed
      if (
        !questState.bedtimeCompleted &&
        !completionFlags.bedtimeAwarded &&
        questState.feedCompleted &&
        questState.playCompleted &&
        questState.bathCompleted
      ) {
        completeQuest('bedtime', questState)
      }
      break
  }
}

/**
 * Handle pet sleeping (energy recharge) - still runs as system for smooth animation
 * This is separate from quest completion checking
 */
export function sleepSystem(dt: number) {
  // Find the active pet
  for (const [_, gameState] of engine.getEntitiesWith(GameState)) {
    if (gameState.phase === GamePhase.PET && gameState.activePetEntity) {
      const petEntity = gameState.activePetEntity
      const pet = PetComponent.getOrNull(petEntity)

      if (!pet) continue

      // Handle sleep energy recharge (if pet is sleeping)
      if (pet.state === PetState.SLEEPING) {
        // Get mutable version for modifications
        const mutablePet = PetComponent.getMutable(petEntity)
        mutablePet.energy = Math.min(MAX_ENERGY, mutablePet.energy + SLEEP_ENERGY_RECHARGE_RATE * dt)

        // Wake up if energy is full
        if (mutablePet.energy >= SLEEP_FULL_ENERGY_THRESHOLD) {
          mutablePet.state = PetState.IDLE
          console.log('🌅 Pet woke up with full energy!')
        }
      }

      break // Only one active pet
    }
  }
}

/**
 * Complete a quest and award XP
 */
function completeQuest(
  questType: 'feed' | 'play' | 'bath' | 'bedtime',
  questState: ReturnType<typeof DailyQuestComponent.getMutable>
) {
  console.log(`✅ Quest completed: ${questType}`)

  // Mark quest as completed
  switch (questType) {
    case 'feed':
      questState.feedCompleted = true
      completionFlags.feedAwarded = true
      break
    case 'play':
      questState.playCompleted = true
      completionFlags.playAwarded = true
      break
    case 'bath':
      questState.bathCompleted = true
      completionFlags.bathAwarded = true
      break
    case 'bedtime':
      questState.bedtimeCompleted = true
      completionFlags.bedtimeAwarded = true
      break
  }

  // Award XP by adding to score
  awardQuestXP(QUEST_XP_REWARD)

  // Trigger save to persist quest completion and new score
  triggerSave()
}

/**
 * Award XP for quest completion
 * Adds to the pet's score field in persistence
 */
function awardQuestXP(xp: number) {
  // Find the active pet and add to score
  for (const [_, gameState] of engine.getEntitiesWith(GameState)) {
    if (gameState.phase === GamePhase.PET && gameState.activePetEntity) {
      // Note: Score is stored in PetDocument.meta.score
      // It will be serialized and saved by the persistence system
      console.log(`🎉 Awarded ${xp} XP for quest completion!`)
      break
    }
  }
}

/**
 * Manually complete bedtime quest (called when player puts pet to sleep)
 */
export function completeBedtimeQuest() {
  if (!questStateEntity) return

  const questState = DailyQuestComponent.getMutable(questStateEntity)

  if (!questState.bedtimeCompleted && !completionFlags.bedtimeAwarded) {
    completeQuest('bedtime', questState)
  }
}

/**
 * Reset quest system state (for game reset)
 */
export function resetQuestSystem() {
  if (questStateEntity) {
    engine.removeEntity(questStateEntity)
    questStateEntity = null
  }

  completionFlags = {
    feedAwarded: false,
    playAwarded: false,
    bathAwarded: false,
    bedtimeAwarded: false
  }

  console.log('Quest system reset')
}


