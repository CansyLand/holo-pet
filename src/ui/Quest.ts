// EPIC: Daily Quest System - Quest Tracking Story
// UI indicating the current and next quest.
// Shows completion status and tracks progress.

import { game } from '../Game'

export interface QuestData {
  id: string
  name: string
  description: string
  completed: boolean
  reward?: string
}

export class QuestUI {
  private quests: QuestData[] = []
  private isVisible = true // Always visible in corner

  constructor() {
    console.log('🏆 Quest UI initialized')
    this.initializeQuests()
  }

  private initializeQuests() {
    this.quests = [
      {
        id: 'feed',
        name: 'Feed Your Pet',
        description: 'Feed your pet to keep it healthy',
        completed: false,
        reward: 'Mood +5'
      },
      {
        id: 'play',
        name: 'Play Time',
        description: 'Play with your pet using the ball',
        completed: false,
        reward: 'Bond +5'
      },
      {
        id: 'bath',
        name: 'Bath Time',
        description: 'Give your pet a bath',
        completed: false,
        reward: 'Clean +10'
      },
      {
        id: 'bedtime',
        name: 'Bedtime',
        description: 'Put your pet to bed for the night',
        completed: false,
        reward: 'Energy Full'
      }
    ]
    console.log('🏆 Quests initialized')
  }

  update() {
    if (!game.state.pet) return

    // Sync quest completion with pet data
    this.quests.forEach(quest => {
      quest.completed = game.state.pet!.data.quests[quest.id as keyof typeof game.state.pet.data.quests] || false
    })

    this.render()
  }

  private render() {
    // TODO: Render quest UI in corner of screen
    // Show current incomplete quest prominently
    // Show checkmarks for completed quests
    console.log('🏆 Rendering quest UI')
  }

  // Get next incomplete quest
  getNextQuest(): QuestData | null {
    return this.quests.find(quest => !quest.completed) || null
  }

  // Get completion percentage
  getCompletionPercentage(): number {
    const completed = this.quests.filter(quest => quest.completed).length
    return Math.round((completed / this.quests.length) * 100)
  }

  // Show quest completion animation
  showQuestComplete(questId: string) {
    console.log(`🏆 Quest completed: ${questId}`)
    // TODO: Play completion animation/sound
    // TODO: Show reward notification
  }

  // Reset all quests (new day)
  resetQuests() {
    this.quests.forEach(quest => {
      quest.completed = false
    })
    console.log('🏆 All quests reset for new day')
  }

  // Hide/show quest UI
  hide() {
    this.isVisible = false
    console.log('🏆 Quest UI hidden')
  }

  show() {
    this.isVisible = true
    console.log('🏆 Quest UI shown')
  }

  // Get quest progress summary
  getProgressSummary(): string {
    const completed = this.getCompletionPercentage()
    const nextQuest = this.getNextQuest()
    return `${completed}% complete${nextQuest ? ` - Next: ${nextQuest.name}` : ' - All done!'}`
