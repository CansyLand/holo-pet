// EPIC: Daily Quest System - Quest Tracking Story
// UI indicating the current and next quest.
// Shows completion status and tracks progress.

import ReactEcs, { UiEntity, Label } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { game } from '../Game'

// Colors for UI
const BG_COLOR = Color4.create(1, 1, 1, 0.95) // White background
const TEXT_COLOR = Color4.create(0.3, 0.3, 0.3, 1) // Dark gray text
const SQUARE_INACTIVE = Color4.create(0.6, 0.6, 0.6, 1) // Gray square
const SQUARE_COMPLETE = Color4.create(0.2, 0.8, 0.2, 1) // Green square

export interface QuestData {
  id: string
  name: string
  description: string
  completed: boolean
  reward?: string
}

// Quest state
const quests: QuestData[] = [
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

export function QuestUI() {
  // Don't show if no pet exists
  if (!game.state.pet) {
    return null
  }

  return (
    <UiEntity
      uiTransform={{
        position: { top: '10px', right: '10px' },
        positionType: 'absolute',
        width: 220,
        height: 100
      }}
      uiBackground={{
        color: BG_COLOR
      }}
    >
      <Label
        value="Daily Quests"
        fontSize={14}
        color={TEXT_COLOR}
        uiTransform={{ positionType: 'relative' }}
      />
    </UiEntity>
  )
}
