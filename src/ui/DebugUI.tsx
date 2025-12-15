// EPIC: Game Flow Stories - Debug and Development Tools
// DebugUI with ALL the buttons to change game and pet states.
// Essential for development and testing all game mechanics.
// Restored from the old StatsUI with full functionality adapted to new architecture

import ReactEcs, { UiEntity, Label, Button } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { game, GamePhase } from '../Game'
import { TrustLevel } from '../Pet'

// Colors for UI
const HEADER_COLOR = Color4.create(0.2, 0.6, 0.9, 1)
const STAT_LABEL_COLOR = Color4.create(0.7, 0.7, 0.7, 1)
const STAT_VALUE_COLOR = Color4.White()
const BUTTON_COLOR = Color4.create(0.3, 0.3, 0.4, 1)
const SECONDARY_COLOR = Color4.create(0.8, 0.8, 0.8, 1)
const BACKGROUND_COLOR = Color4.create(0, 0, 0, 0.85)
const GREEN_COLOR = Color4.create(0.5, 0.8, 0.5, 1)

// Constants
const MAX_MOOD = 100
const MAX_HUNGER = 100
const MAX_ENERGY = 100
const MAX_BOND = 100
const MAX_CLEANLINESS = 100
const MIN_MOOD = 0
const MIN_HUNGER = 0
const MIN_ENERGY = 0
const MIN_BOND = 0
const MIN_CLEANLINESS = 0

// Panel state
let isCollapsed = false
let needsUIEnabled = false // Cached state for needs UI toggle

// Cached stats for display
interface PetStats {
  name: string
  mood: number
  hunger: number
  energy: number
  bond: number
  trustLevel: string
  cleanliness: number
  poopCount: number
  personalityTraits: {
    energy: number
    sociability: number
    cleanliness: number
    appetite: number
  }
  quests: {
    feed: boolean
    play: boolean
    bath: boolean
    bedtime: boolean
  }
}

let cachedStats: PetStats = {
  name: 'No Pet',
  mood: 0,
  hunger: 0,
  energy: 0,
  bond: 0,
  trustLevel: 'None',
  cleanliness: 0,
  poopCount: 0,
  personalityTraits: { energy: 0, sociability: 0, cleanliness: 0, appetite: 0 },
  quests: { feed: false, play: false, bath: false, bedtime: false }
} // Always has data now

/**
 * Find the active pet and cache its stats
 */
function updateCachedStats() {
  // Update needs UI state (placeholder - implement based on your needs UI system)
  // needsUIEnabled = isNeedsUIEnabled()

  // Get stats from current game state
  if (game.state.pet) {
    cachedStats = {
      name: game.state.pet.data.name,
      mood: Math.round(game.state.pet.data.mood),
      hunger: Math.round(game.state.pet.data.hunger),
      energy: Math.round(game.state.pet.data.energy),
      bond: Math.round(game.state.pet.data.bond),
      trustLevel: game.state.pet.getTrustLevel(),
      cleanliness: Math.round(game.state.pet.data.cleanliness),
      poopCount: game.getActivePoopCount(),
      personalityTraits: {
        energy: game.state.pet.data.personality.energy,
        sociability: game.state.pet.data.personality.sociability,
        cleanliness: game.state.pet.data.personality.cleanliness,
        appetite: game.state.pet.data.personality.appetite
      },
      quests: game.state.pet.data.quests
    }
  } else {
    // Show placeholder data when no pet (fallback - shouldn't happen in current architecture)
    cachedStats = {
      name: 'No Pet',
      mood: 0,
      hunger: 0,
      energy: 0,
      bond: 0,
      trustLevel: 'None',
      cleanliness: 0,
      poopCount: 0,
      personalityTraits: {
        energy: 0,
        sociability: 0,
        cleanliness: 0,
        appetite: 0
      },
      quests: {
        feed: false,
        play: false,
        bath: false,
        bedtime: false
      }
    }
  }
}

/**
 * Modify a stat by amount
 */
function modifyStat(stat: 'mood' | 'hunger' | 'energy' | 'bond' | 'cleanliness', delta: number) {
  if (!game.state.pet) return

  switch (stat) {
    case 'mood': {
      game.state.pet.data.mood = Math.max(MIN_MOOD, Math.min(MAX_MOOD, game.state.pet.data.mood + delta))
      break
    }
    case 'hunger': {
      game.state.pet.data.hunger = Math.max(MIN_HUNGER, Math.min(MAX_HUNGER, game.state.pet.data.hunger + delta))
      break
    }
    case 'energy': {
      game.state.pet.data.energy = Math.max(MIN_ENERGY, Math.min(MAX_ENERGY, game.state.pet.data.energy + delta))
      break
    }
    case 'bond': {
      game.state.pet.data.bond = Math.max(MIN_BOND, Math.min(MAX_BOND, game.state.pet.data.bond + delta))
      break
    }
    case 'cleanliness': {
      game.state.pet.data.cleanliness = Math.max(
        MIN_CLEANLINESS,
        Math.min(MAX_CLEANLINESS, game.state.pet.data.cleanliness + delta)
      )
      break
    }
  }
}

/**
 * Modify a personality trait by amount
 */
function modifyPersonality(trait: 'energy' | 'sociability' | 'cleanliness' | 'appetite', delta: number) {
  if (!game.state.pet) return

  const personality = game.state.pet.data.personality
  switch (trait) {
    case 'energy':
      personality.energy = Math.max(20, Math.min(80, personality.energy + delta))
      break
    case 'sociability':
      personality.sociability = Math.max(20, Math.min(80, personality.sociability + delta))
      break
    case 'cleanliness':
      personality.cleanliness = Math.max(20, Math.min(80, personality.cleanliness + delta))
      break
    case 'appetite':
      personality.appetite = Math.max(20, Math.min(80, personality.appetite + delta))
      break
  }
}

/**
 * Set all stats to max
 */
function maxAllStats() {
  if (!game.state.pet) return

  game.state.pet.data.mood = MAX_MOOD
  game.state.pet.data.hunger = MIN_HUNGER // 0 hunger = not hungry
  game.state.pet.data.energy = MAX_ENERGY
  game.state.pet.data.bond = MAX_BOND
  game.state.pet.data.cleanliness = MAX_CLEANLINESS
}

/**
 * Set all stats to critical (for testing)
 */
function minAllStats() {
  if (!game.state.pet) return

  game.state.pet.data.mood = 10
  game.state.pet.data.hunger = 90
  game.state.pet.data.energy = 10
  game.state.pet.data.bond = 15
  game.state.pet.data.cleanliness = 15
}

/**
 * Reset the game - reset pet stats, return to egg state
 */
function resetGame() {
  console.log('=== RESETTING GAME ===')

  // Hide bars before resetting state
  try {
    const needsModule = game.getModuleSafe('Needs') as any
    if (needsModule) {
      needsModule.setVisible(false)
      console.log('🔄 Reset: Bars hidden')
    }
  } catch (error) {
    console.error('🔄 Reset: Error hiding bars:', error)
  }

  // Reset pet stats but keep the pet object
  if (game.state.pet) {
    game.state.pet.data.name = 'Unnamed Pet'
    game.state.pet.data.mood = 100
    game.state.pet.data.hunger = 0 // 0 = not hungry
    game.state.pet.data.energy = 100
    game.state.pet.data.cleanliness = 100
    game.state.pet.data.bond = 50

    // Reset quests
    game.state.pet.data.quests = {
      feed: false,
      play: false,
      bath: false,
      bedtime: false
    }

    console.log('🐾 Pet stats reset, keeping pet object')
  }

  // Reset game state to EGG phase (pet stays but hidden by visibility system)
  game.setState({ phase: GamePhase.EGG })

  console.log('=== GAME RESET COMPLETE ===')
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

function StatRow({
  label,
  value,
  stat,
  showButtons = true
}: {
  label: string
  value: number | string
  stat?: 'mood' | 'hunger' | 'energy' | 'bond' | 'cleanliness'
  showButtons?: boolean
}) {
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Label value={label} fontSize={12} color={STAT_LABEL_COLOR} uiTransform={{ width: 80 }} />
      <Label value={String(value)} fontSize={14} color={STAT_VALUE_COLOR} uiTransform={{ width: 60 }} />
      {showButtons && stat && (
        <UiEntity
          uiTransform={{
            flexDirection: 'row',
            width: 80
          }}
        >
          <Button
            value="-10"
            variant="secondary"
            fontSize={10}
            uiTransform={{ width: 35, height: 22, margin: { right: 4 } }}
            onMouseDown={() => modifyStat(stat, -10)}
          />
          <Button
            value="+10"
            variant="secondary"
            fontSize={10}
            uiTransform={{ width: 35, height: 22 }}
            onMouseDown={() => modifyStat(stat, 10)}
          />
        </UiEntity>
      )}
    </UiEntity>
  )
}

function PersonalityRow({
  label,
  value,
  trait
}: {
  label: string
  value: number
  trait: 'energy' | 'sociability' | 'cleanliness' | 'appetite'
}) {
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Label value={label} fontSize={10} color={STAT_LABEL_COLOR} uiTransform={{ width: 80 }} />
      <Label value={String(value)} fontSize={11} color={GREEN_COLOR} uiTransform={{ width: 40 }} />
      <UiEntity
        uiTransform={{
          flexDirection: 'row',
          width: 80
        }}
      >
        <Button
          value="-10"
          variant="secondary"
          fontSize={10}
          uiTransform={{ width: 35, height: 22, margin: { right: 4 } }}
          onMouseDown={() => modifyPersonality(trait, -10)}
        />
        <Button
          value="+10"
          variant="secondary"
          fontSize={10}
          uiTransform={{ width: 35, height: 22 }}
          onMouseDown={() => modifyPersonality(trait, 10)}
        />
      </UiEntity>
    </UiEntity>
  )
}

export function DebugUI() {
  // Update stats every render
  updateCachedStats()

  // Show collapsed version
  if (isCollapsed) {
    return (
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: 10, right: 10 },
          width: 40,
          height: 30
        }}
      >
        <Button
          value="🐛"
          variant="secondary"
          fontSize={12}
          uiTransform={{ width: 50, height: 30 }}
          onMouseDown={() => {
            isCollapsed = false
          }}
        />
      </UiEntity>
    )
  }

  // Always show debug UI (even with placeholder data)

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { bottom: 10, right: 10 },
        width: 280,
        flexDirection: 'column',
        padding: 10
      }}
      uiBackground={{ color: BACKGROUND_COLOR }}
    >
      {/* Header */}
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 30,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: { bottom: 8 }
        }}
      >
        <Label value={`🐛 ${cachedStats.name}`} fontSize={16} color={HEADER_COLOR} />
        <Button
          value="−"
          variant="secondary"
          fontSize={16}
          uiTransform={{ width: 25, height: 25 }}
          onMouseDown={() => {
            isCollapsed = true
          }}
        />
      </UiEntity>

      {/* Stats Section */}
      <Label value="─── Stats ───" fontSize={10} color={STAT_LABEL_COLOR} uiTransform={{ height: 18 }} />

      <StatRow label="Mood" value={cachedStats.mood} stat="mood" />
      <StatRow label="Hunger" value={cachedStats.hunger} stat="hunger" />
      <StatRow label="Energy" value={cachedStats.energy} stat="energy" />
      <StatRow label="Bond" value={`${cachedStats.bond} (${cachedStats.trustLevel})`} stat="bond" />
      <StatRow label="Clean" value={cachedStats.cleanliness} stat="cleanliness" />
      <StatRow label="Poop Count" value={cachedStats.poopCount} showButtons={false} />

      {/* Personality Section */}
      <Label
        value="─── Personality ───"
        fontSize={10}
        color={STAT_LABEL_COLOR}
        uiTransform={{ height: 22, margin: { top: 6 } }}
      />

      <PersonalityRow label="Energy (T)" value={cachedStats.personalityTraits.energy} trait="energy" />
      <PersonalityRow label="Social (T)" value={cachedStats.personalityTraits.sociability} trait="sociability" />
      <PersonalityRow label="Clean (T)" value={cachedStats.personalityTraits.cleanliness} trait="cleanliness" />
      <PersonalityRow label="Appetite (T)" value={cachedStats.personalityTraits.appetite} trait="appetite" />

      {/* Action Buttons */}
      <Label
        value="─── Actions ───"
        fontSize={10}
        color={STAT_LABEL_COLOR}
        uiTransform={{ height: 22, margin: { top: 6 } }}
      />

      <UiEntity
        uiTransform={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          margin: { top: 4 }
        }}
      >
        <Button
          value="Max All"
          variant="primary"
          fontSize={11}
          uiTransform={{ width: 65, height: 26 }}
          onMouseDown={() => maxAllStats()}
        />
        <Button
          value="Crisis"
          variant="secondary"
          fontSize={11}
          uiTransform={{ width: 65, height: 26 }}
          onMouseDown={() => minAllStats()}
        />
        <Button
          value="Poop"
          variant="secondary"
          fontSize={11}
          uiTransform={{ width: 65, height: 26 }}
          onMouseDown={() => game.forceSpawnPoop()}
        />
      </UiEntity>

      {/* Needs UI Toggle */}
      <UiEntity
        uiTransform={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'center',
          margin: { top: 8 }
        }}
      >
        <Button
          value={needsUIEnabled ? 'Hide Bars' : 'Show Bars'}
          variant="secondary"
          fontSize={11}
          uiTransform={{ width: 120, height: 26 }}
          onMouseDown={() => {
            console.log('🔍 DebugUI: Show Bars button clicked')
            console.log('🔍 DebugUI: Current needsUIEnabled:', needsUIEnabled)
            console.log('🔍 DebugUI: Game modules count:', game.modules.length)
            console.log(
              '🔍 DebugUI: Game modules:',
              game.modules.map((m) => m.name)
            )

            needsUIEnabled = !needsUIEnabled
            console.log('🔍 DebugUI: New needsUIEnabled:', needsUIEnabled)

            try {
              const needsModule = game.getModuleSafe('Needs') as any
              console.log('🔍 DebugUI: Found needs module:', !!needsModule)

              if (needsModule) {
                if (needsUIEnabled) {
                  console.log('🔍 DebugUI: Setting bars visible')
                  needsModule.setVisible(true)
                } else {
                  console.log('🔍 DebugUI: Setting bars hidden')
                  needsModule.setVisible(false)
                }
              } else {
                console.log('🔍 DebugUI: Needs module not found!')
              }
            } catch (error) {
              console.error('🔍 DebugUI: Error accessing needs module:', error)
            }
          }}
        />
      </UiEntity>

      {/* Reset Button - Separate row for safety */}
      <UiEntity
        uiTransform={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'center',
          margin: { top: 8 }
        }}
      >
        <Button
          value="Reset Game"
          variant="secondary"
          fontSize={11}
          color={Color4.create(1, 0.3, 0.3, 1)}
          uiTransform={{ width: 120, height: 26 }}
          onMouseDown={() => resetGame()}
        />
      </UiEntity>
    </UiEntity>
  )
}
