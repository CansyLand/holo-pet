import { engine } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { UiEntity, Label } from '@dcl/sdk/react-ecs'
import { DailyQuestComponent } from '../components/Quest'
import { PetIdentityComponent } from '../components/Personality'
import { GameState, GamePhase } from '../components/GameState'
import { getQuestStateEntity } from '../systems/Quest'

// =============================================================================
// QUEST UI - Top-right notification panel
// =============================================================================

// Colors
const BG_COLOR = Color4.create(1, 1, 1, 0.95) // White background
const TEXT_COLOR = Color4.create(0.3, 0.3, 0.3, 1) // Dark gray text
const SQUARE_INACTIVE = Color4.create(0.6, 0.6, 0.6, 1) // Gray square
const SQUARE_COMPLETE = Color4.create(0.2, 0.8, 0.2, 1) // Green square
const BORDER_RADIUS = 12

// Quest state cache
interface QuestDisplayData {
  petName: string
  quests: {
    text: string
    completed: boolean
    isActive: boolean
  }[]
}

let cachedQuestData: QuestDisplayData | null = null

/**
 * Update cached quest data from components
 */
function updateQuestData() {
  const questEntity = getQuestStateEntity()
  if (!questEntity) {
    cachedQuestData = null
    return
  }

  const questState = DailyQuestComponent.getOrNull(questEntity)
  if (!questState) {
    cachedQuestData = null
    return
  }

  // Get pet name
  let petName = 'Your Pet'
  for (const [_, gameState] of engine.getEntitiesWith(GameState)) {
    if (gameState.phase === GamePhase.PET && gameState.activePetEntity) {
      const identity = PetIdentityComponent.getOrNull(gameState.activePetEntity)
      if (identity) {
        petName = identity.name
      }
      break
    }
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
 * Quest Row Component
 */
function QuestRow({ text, completed, isActive }: { text: string; completed: boolean; isActive: boolean }) {
  const rowHeight = isActive ? 40 : 32
  const opacity = isActive ? 1.0 : 0.5
  const squareColor = completed ? SQUARE_COMPLETE : SQUARE_INACTIVE
  const squareSize = isActive ? 20 : 16

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: rowHeight,
        flexDirection: 'row',
        alignItems: 'center',
        padding: { left: 8, right: 8 },
        margin: { bottom: 4 }
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
        fontSize={isActive ? 16 : 14}
        color={Color4.create(TEXT_COLOR.r, TEXT_COLOR.g, TEXT_COLOR.b, opacity)}
        uiTransform={{ width: 'auto' }}
      />
    </UiEntity>
  )
}

/**
 * All Quests Complete Message
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
      <Label value="All Done!" fontSize={18} color={SQUARE_COMPLETE} uiTransform={{ margin: { bottom: 4 } }} />
      <Label value="Come back tomorrow" fontSize={12} color={TEXT_COLOR} />
    </UiEntity>
  )
}

/**
 * Main Quest UI Component
 */
export function QuestUI() {
  // Update quest data every render
  updateQuestData()

  // Don't show if no pet exists or no quest data
  if (!cachedQuestData) {
    return null
  }

  // Check if all quests are complete
  const allComplete = cachedQuestData.quests.every((q) => q.completed)

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 10, right: 10 },
        width: 220,
        flexDirection: 'column',
        padding: 12
      }}
      uiBackground={{ color: BG_COLOR }}
    >
      {/* Header */}
      <Label
        value="Daily Quests"
        fontSize={14}
        color={TEXT_COLOR}
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
          {cachedQuestData.quests.map((quest, index) => (
            <QuestRow text={quest.text} completed={quest.completed} isActive={quest.isActive} />
          ))}
        </UiEntity>
      )}
    </UiEntity>
  )
}



