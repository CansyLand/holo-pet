import { Schemas, engine } from '@dcl/sdk/ecs'

/**
 * Daily Quest State Component
 * Tracks which daily quests have been completed
 * Resets daily based on UTC date comparison
 */
export const DailyQuestComponent = engine.defineComponent('DailyQuestComponent', {
  feedCompleted: Schemas.Boolean,
  playCompleted: Schemas.Boolean,
  bathCompleted: Schemas.Boolean,
  bedtimeCompleted: Schemas.Boolean,
  lastResetDate: Schemas.String // ISO date "YYYY-MM-DD" in UTC
})

/**
 * Quest Animation State Component
 * Used for carousel-style completion animations
 */
export const QuestAnimationComponent = engine.defineComponent('QuestAnimationComponent', {
  isAnimating: Schemas.Boolean,
  animationType: Schemas.String, // 'complete' | 'slide_out' | 'slide_in'
  progress: Schemas.Number, // 0-1 animation progress
  targetQuestIndex: Schemas.Number // Which quest is animating (0=feed, 1=play, 2=bath, 3=bedtime)
})

/**
 * Quest types enum for easy reference
 */
export enum QuestType {
  FEED = 'feed',
  PLAY = 'play',
  BATH = 'bath',
  BEDTIME = 'bedtime'
}

/**
 * Get the ISO date string for today in UTC
 */
export function getTodayUTC(): string {
  const now = new Date()
  return now.toISOString().split('T')[0] // Returns "YYYY-MM-DD"
}

/**
 * Check if quests should reset (different day)
 */
export function shouldResetQuests(lastResetDate: string): boolean {
  const today = getTodayUTC()
  return lastResetDate !== today
}

