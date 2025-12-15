// EPIC: Daily Quest System - Quest Tracking Story
// UI indicating the current and next quest.
// Shows completion status and tracks progress.

import ReactEcs, { UiEntity, Label } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { game } from '../Game'
import { QuestModule } from '../modules/Quest'
import {
  startQuestCompletionAnimation,
  updateQuestAnimation,
  getAnimationProgress,
  isAnimationActive
} from './QuestAnimations'
import {
  QUEST_UI_BG_COLOR,
  QUEST_UI_TEXT_COLOR,
  QUEST_UI_SQUARE_INACTIVE,
  QUEST_UI_SQUARE_COMPLETE,
  QUEST_UI_PANEL_WIDTH,
  QUEST_UI_BORDER_RADIUS,
  QUEST_UI_ROW_HEIGHT_INACTIVE,
  QUEST_UI_ROW_HEIGHT_ACTIVE,
  QUEST_UI_SQUARE_SIZE_INACTIVE,
  QUEST_UI_SQUARE_SIZE_ACTIVE,
  QUEST_UI_TEXT_FONT_SIZE_INACTIVE,
  QUEST_UI_TEXT_FONT_SIZE_ACTIVE,
  QUEST_UI_ACTIVE_OPACITY,
  QUEST_UI_INACTIVE_OPACITY
} from '../utils/constants'

// Quest display data structure - mirrors old implementation
interface QuestDisplayData {
  petName: string
  quests: {
    text: string
    completed: boolean
    isActive: boolean
  }[]
}

// Cache quest data to avoid repeated calculations
let cachedQuestData: QuestDisplayData | null = null

/**
 * Update cached quest data from QuestModule state
 */
function updateQuestData() {
  const questModule = game.modules.find((m) => m.name === 'Quest') as QuestModule
  if (!questModule) {
    cachedQuestData = null
    return
  }

  const questState = questModule.getQuestState()
  if (!questState) {
    cachedQuestData = null
    return
  }

  // Get pet name
  let petName = 'Your Pet'
  if (game.state.pet && game.state.pet.data) {
    petName = game.state.pet.data.name
  }

  // Determine which quest is currently active (first incomplete)
  let activeIndex = -1
  const completionStates = [
    questState.feedCompleted,
    questState.playCompleted,
    questState.bathCompleted,
    questState.bedtimeCompleted
  ]

  for (let i = 0; i < completionStates.length; i++) {
    if (!completionStates[i]) {
      activeIndex = i
      break
    }
  }

  // All quests complete
  if (activeIndex === -1) {
    activeIndex = 4 // Beyond last quest (all done state)
  }

  cachedQuestData = {
    petName,
    quests: [
      {
        text: `Feed ${petName}`,
        completed: questState.feedCompleted,
        isActive: activeIndex === 0
      },
      {
        text: 'Play',
        completed: questState.playCompleted,
        isActive: activeIndex === 1
      },
      {
        text: 'Bath',
        completed: questState.bathCompleted,
        isActive: activeIndex === 2
      },
      {
        text: 'Bedtime',
        completed: questState.bedtimeCompleted,
        isActive: activeIndex === 3
      }
    ]
  }
}

/**
 * Quest Row Component - renders individual quest rows with status squares and animation support
 */
function QuestRow({
  text,
  completed,
  isActive,
  animationOpacity = 1.0,
  animationYOffset = 0
}: {
  text: string
  completed: boolean
  isActive: boolean
  animationOpacity?: number
  animationYOffset?: number
}) {
  const rowHeight = isActive ? QUEST_UI_ROW_HEIGHT_ACTIVE : QUEST_UI_ROW_HEIGHT_INACTIVE
  const baseOpacity = isActive ? QUEST_UI_ACTIVE_OPACITY : QUEST_UI_INACTIVE_OPACITY
  const finalOpacity = baseOpacity * animationOpacity
  const squareColor = completed ? QUEST_UI_SQUARE_COMPLETE : QUEST_UI_SQUARE_INACTIVE
  const squareSize = isActive ? QUEST_UI_SQUARE_SIZE_ACTIVE : QUEST_UI_SQUARE_SIZE_INACTIVE

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: rowHeight,
        flexDirection: 'row',
        alignItems: 'center',
        padding: { left: 8, right: 8 },
        margin: { bottom: 4, top: animationYOffset }
      }}
    >
      {/* Status Square */}
      <UiEntity
        uiTransform={{
          width: squareSize,
          height: squareSize,
          margin: { right: 10 }
        }}
        uiBackground={{ color: squareColor }}
      />

      {/* Quest Text */}
      <Label
        value={text}
        fontSize={isActive ? QUEST_UI_TEXT_FONT_SIZE_ACTIVE : QUEST_UI_TEXT_FONT_SIZE_INACTIVE}
        color={Color4.create(QUEST_UI_TEXT_COLOR.r, QUEST_UI_TEXT_COLOR.g, QUEST_UI_TEXT_COLOR.b, finalOpacity)}
        uiTransform={{ width: 'auto' }}
      />
    </UiEntity>
  )
}

/**
 * All Quests Complete Message Component
 */
function AllQuestsComplete() {
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: 60,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12
      }}
    >
      <Label value="All Done!" fontSize={18} color={QUEST_UI_SQUARE_COMPLETE} uiTransform={{ margin: { bottom: 4 } }} />
      <Label value="Come back tomorrow" fontSize={12} color={QUEST_UI_TEXT_COLOR} />
    </UiEntity>
  )
}

/**
 * Main Quest UI Component
 */
export function QuestUI() {
  // Don't show if no pet exists
  if (!game.state.pet) {
    return null
  }

  // Update quest data every render
  updateQuestData()

  // Update animations
  updateQuestAnimation(1 / 60) // Assume 60fps for UI updates

  // Don't show if no quest data
  if (!cachedQuestData) {
    return null
  }

  // Check if all quests are complete
  const allComplete = cachedQuestData.quests.every((q) => q.completed)

  // Get current animation progress
  const animationProgress = getAnimationProgress()

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 10, right: 10 },
        width: QUEST_UI_PANEL_WIDTH,
        flexDirection: 'column',
        padding: 12
      }}
      uiBackground={{ color: QUEST_UI_BG_COLOR }}
    >
      {/* Header */}
      <Label
        value="Daily Quests"
        fontSize={14}
        color={QUEST_UI_TEXT_COLOR}
        uiTransform={{
          width: '100%',
          height: 24,
          margin: { bottom: 8 }
        }}
      />

      {/* Quest Rows or All Complete Message */}
      {allComplete ? (
        <AllQuestsComplete />
      ) : (
        <UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
          {cachedQuestData.quests.map((quest, index) => {
            // Apply animation effects to the animating quest
            const isAnimatingThisQuest = animationProgress && animationProgress.questIndex === index
            const animationOpacity = isAnimatingThisQuest ? animationProgress.opacity : 1.0
            const animationYOffset = isAnimatingThisQuest ? animationProgress.yOffset : 0

            return (
              <QuestRow
                text={quest.text}
                completed={quest.completed}
                isActive={quest.isActive}
                animationOpacity={animationOpacity}
                animationYOffset={animationYOffset}
              />
            )
          })}
        </UiEntity>
      )}
    </UiEntity>
  )
}
