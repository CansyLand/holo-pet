// EPIC: Daily Quest System - Quest Completion and Persistence
// Handles quest state management, completion checking, and save triggers
// Ensures quests are saved immediately when completed

import { engine, Entity } from '@dcl/sdk/ecs'
import { game, GameModule } from '../Game'
import { triggerSave } from '../services/Persistence'
import { startQuestCompletionAnimation } from '../ui/QuestAnimations'

// Quest state entity (singleton)
let questStateEntity: Entity | null = null

// Track if we've already awarded XP for a quest this session
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

// Quest data structure - using a simple object for now
export interface QuestState {
  feedCompleted: boolean
  playCompleted: boolean
  bathCompleted: boolean
  bedtimeCompleted: boolean
  lastResetDate: string
}

// Store quest state in memory for now (can be moved to ECS component later)
let questState: QuestState = {
  feedCompleted: false,
  playCompleted: false,
  bathCompleted: false,
  bedtimeCompleted: false,
  lastResetDate: ''
}

export class QuestModule implements GameModule {
  name = 'Quest'

  init() {
    console.log('📋 Quest module initialized')
    this.initQuestState()
  }

  update(dt: number) {
    // Check for daily quest reset
    this.checkDailyQuestReset()
  }

  cleanup() {
    console.log('📋 Quest module cleanup')
    if (questStateEntity) {
      engine.removeEntity(questStateEntity)
      questStateEntity = null
    }
    this.resetCompletionFlags()
  }

  /**
   * Initialize quest state
   */
  private initQuestState() {
    if (!questStateEntity) {
      questStateEntity = engine.addEntity()

      // Initialize with default quest state
      questState = {
        feedCompleted: false,
        playCompleted: false,
        bathCompleted: false,
        bedtimeCompleted: false,
        lastResetDate: this.getTodayUTC()
      }

      console.log('📋 Quest state initialized')
    }
  }

  /**
   * Get current quest state
   */
  getQuestState(): QuestState {
    return questState
  }

  /**
   * Update quest state
   */
  private updateQuestState(updates: Partial<QuestState>) {
    questState = { ...questState, ...updates }
  }

  /**
   * Check quest completion after specific player actions
   */
  checkQuestCompletion(
    actionType: 'feed' | 'play' | 'bath' | 'bedtime',
    petData: any, // Pet data object
    hygieneData?: any // Hygiene data object (for bath quest)
  ) {
    if (!game.state.pet) return

    const questState = this.getQuestState()

    switch (actionType) {
      case 'feed':
        // Feed quest: always available as first quest
        if (!questState.feedCompleted && !completionFlags.feedAwarded) {
          if (petData.hunger < 20) {
            // Feed threshold
            this.completeQuest('feed', questState)
          }
        }
        break

      case 'play':
        // Play quest: only if Feed is completed
        if (!questState.playCompleted && !completionFlags.playAwarded && questState.feedCompleted) {
          if (petData.mood > 50 && petData.energy < 30) {
            // Play thresholds
            this.completeQuest('play', questState)
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
          hygieneData
        ) {
          if (hygieneData.cleanliness > 70) {
            // Bath threshold
            this.completeQuest('bath', questState)
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
          this.completeQuest('bedtime', questState)
        }
        break
    }
  }

  /**
   * Complete a quest and trigger save
   */
  private completeQuest(questType: 'feed' | 'play' | 'bath' | 'bedtime', questState: QuestState) {
    console.log(`✅ Quest completed: ${questType}`)

    // Determine quest index for animation
    let questIndex = 0
    switch (questType) {
      case 'feed':
        this.updateQuestState({ feedCompleted: true })
        completionFlags.feedAwarded = true
        questIndex = 0
        break
      case 'play':
        this.updateQuestState({ playCompleted: true })
        completionFlags.playAwarded = true
        questIndex = 1
        break
      case 'bath':
        this.updateQuestState({ bathCompleted: true })
        completionFlags.bathAwarded = true
        questIndex = 2
        break
      case 'bedtime':
        this.updateQuestState({ bedtimeCompleted: true })
        completionFlags.bedtimeAwarded = true
        questIndex = 3
        break
    }

    // Trigger completion animation
    startQuestCompletionAnimation(questIndex)

    // Award XP (could be extended to modify pet score)
    console.log(`🎉 Awarded XP for quest completion!`)

    // Trigger save to persist quest completion
    triggerSave()
  }

  /**
   * Check for daily quest reset
   */
  private checkDailyQuestReset() {
    const questState = this.getQuestState()
    if (!questState) return

    // Check if we need to reset quests for new day
    if (this.shouldResetQuests(questState.lastResetDate)) {
      console.log('🔄 Resetting daily quests for new day')

      // Reset all quests to incomplete
      this.updateQuestState({
        feedCompleted: false,
        playCompleted: false,
        bathCompleted: false,
        bedtimeCompleted: false,
        lastResetDate: this.getTodayUTC()
      })

      // Reset completion flags
      this.resetCompletionFlags()

      // Trigger save to persist reset
      triggerSave()
    }
  }

  /**
   * Reset completion flags
   */
  private resetCompletionFlags() {
    completionFlags = {
      feedAwarded: false,
      playAwarded: false,
      bathAwarded: false,
      bedtimeAwarded: false
    }
  }

  /**
   * Get today's date in UTC format
   */
  private getTodayUTC(): string {
    return new Date().toISOString().split('T')[0]
  }

  /**
   * Check if quests should reset based on date
   */
  private shouldResetQuests(lastResetDate: string): boolean {
    const today = this.getTodayUTC()
    return lastResetDate !== today
  }

  /**
   * Manually complete bedtime quest (called when player puts pet to sleep)
   */
  completeBedtimeQuest() {
    const questState = this.getQuestState()

    if (!questState.bedtimeCompleted && !completionFlags.bedtimeAwarded) {
      this.completeQuest('bedtime', questState)
    }
  }
}
