import { engine, Entity } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { UiEntity, Label, Button } from '@dcl/sdk/react-ecs'
import { PetComponent } from '../components/Pet'
import { PersonalityComponent, BondComponent, PetIdentityComponent, TrustLevel } from '../components/Personality'
import { HygieneComponent } from '../components/Hygiene'
import { GameState, GamePhase } from '../components/GameState'
import { getActivePoopCount, forcePoop } from '../systems/Poop'
import {
  MAX_MOOD,
  MAX_HUNGER,
  MAX_ENERGY,
  MAX_BOND,
  MAX_CLEANLINESS,
  MIN_MOOD,
  MIN_HUNGER,
  MIN_ENERGY,
  MIN_BOND,
  MIN_CLEANLINESS
} from '../utils/constants'

// =============================================================================
// DEBUG STATS UI
// Always-visible panel showing pet stats with editable controls
// Position: Top-right corner
// =============================================================================

// Colors
const BG_COLOR = Color4.create(0.1, 0.1, 0.15, 0.85)
const HEADER_COLOR = Color4.create(0.2, 0.6, 0.9, 1)
const STAT_LABEL_COLOR = Color4.create(0.7, 0.7, 0.7, 1)
const STAT_VALUE_COLOR = Color4.White()
const BUTTON_COLOR = Color4.create(0.3, 0.3, 0.4, 1)

// Panel state
let isCollapsed = false

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
}

let cachedStats: PetStats | null = null
let activePetEntity: Entity | null = null

/**
 * Find the active pet and cache its stats
 */
function updateCachedStats() {
  // Find game state to get active pet
  for (const [_, gameState] of engine.getEntitiesWith(GameState)) {
    if (gameState.phase === GamePhase.PET && gameState.activePetEntity) {
      activePetEntity = gameState.activePetEntity

      const pet = PetComponent.getOrNull(activePetEntity)
      const identity = PetIdentityComponent.getOrNull(activePetEntity)
      const personality = PersonalityComponent.getOrNull(activePetEntity)
      const bond = BondComponent.getOrNull(activePetEntity)
      const hygiene = HygieneComponent.getOrNull(activePetEntity)

      if (pet) {
        cachedStats = {
          name: identity?.name || 'Unnamed',
          mood: Math.round(pet.mood),
          hunger: Math.round(pet.hunger),
          energy: Math.round(pet.energy),
          bond: bond ? Math.round(bond.bond) : 0,
          trustLevel: bond?.trustLevel || TrustLevel.STRANGER,
          cleanliness: hygiene ? Math.round(hygiene.cleanliness) : 100,
          poopCount: getActivePoopCount(),
          personalityTraits: personality
            ? {
                energy: personality.energy,
                sociability: personality.sociability,
                cleanliness: personality.cleanliness,
                appetite: personality.appetite
              }
            : {
                energy: 50,
                sociability: 50,
                cleanliness: 50,
                appetite: 50
              }
        }
      }
      return
    }
  }
  cachedStats = null
  activePetEntity = null
}

/**
 * Modify a stat by amount
 */
function modifyStat(stat: 'mood' | 'hunger' | 'energy' | 'bond' | 'cleanliness', delta: number) {
  if (!activePetEntity) return

  switch (stat) {
    case 'mood': {
      const pet = PetComponent.getMutableOrNull(activePetEntity)
      if (pet) {
        pet.mood = Math.max(MIN_MOOD, Math.min(MAX_MOOD, pet.mood + delta))
      }
      break
    }
    case 'hunger': {
      const pet = PetComponent.getMutableOrNull(activePetEntity)
      if (pet) {
        pet.hunger = Math.max(MIN_HUNGER, Math.min(MAX_HUNGER, pet.hunger + delta))
      }
      break
    }
    case 'energy': {
      const pet = PetComponent.getMutableOrNull(activePetEntity)
      if (pet) {
        pet.energy = Math.max(MIN_ENERGY, Math.min(MAX_ENERGY, pet.energy + delta))
      }
      break
    }
    case 'bond': {
      const bond = BondComponent.getMutableOrNull(activePetEntity)
      if (bond) {
        bond.bond = Math.max(MIN_BOND, Math.min(MAX_BOND, bond.bond + delta))
      }
      break
    }
    case 'cleanliness': {
      const hygiene = HygieneComponent.getMutableOrNull(activePetEntity)
      if (hygiene) {
        hygiene.cleanliness = Math.max(MIN_CLEANLINESS, Math.min(MAX_CLEANLINESS, hygiene.cleanliness + delta))
      }
      break
    }
  }
}

/**
 * Set all stats to max
 */
function maxAllStats() {
  if (!activePetEntity) return

  const pet = PetComponent.getMutableOrNull(activePetEntity)
  if (pet) {
    pet.mood = MAX_MOOD
    pet.hunger = MIN_HUNGER // 0 hunger = not hungry
  }

  const bond = BondComponent.getMutableOrNull(activePetEntity)
  if (bond) {
    bond.bond = MAX_BOND
  }

  const hygiene = HygieneComponent.getMutableOrNull(activePetEntity)
  if (hygiene) {
    hygiene.cleanliness = MAX_CLEANLINESS
  }
}

/**
 * Set all stats to critical (for testing)
 */
function minAllStats() {
  if (!activePetEntity) return

  const pet = PetComponent.getMutableOrNull(activePetEntity)
  if (pet) {
    pet.mood = 10
    pet.hunger = 90
  }

  const bond = BondComponent.getMutableOrNull(activePetEntity)
  if (bond) {
    bond.bond = 15
  }

  const hygiene = HygieneComponent.getMutableOrNull(activePetEntity)
  if (hygiene) {
    hygiene.cleanliness = 15
  }
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

function PersonalityRow({ label, value }: { label: string; value: number }) {
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: 20,
        flexDirection: 'row',
        alignItems: 'center'
      }}
    >
      <Label value={label} fontSize={10} color={STAT_LABEL_COLOR} uiTransform={{ width: 80 }} />
      <Label value={String(value)} fontSize={11} color={Color4.create(0.5, 0.8, 0.5, 1)} uiTransform={{ width: 40 }} />
    </UiEntity>
  )
}

/**
 * Main Debug Stats UI Component
 */
export function StatsUI() {
  // Update stats every render
  updateCachedStats()

  // Don't show if no pet exists
  if (!cachedStats) {
    return null
  }

  if (isCollapsed) {
    return (
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { top: 10, right: 10 },
          width: 40,
          height: 30
        }}
      >
        <Button
          value="📊"
          variant="secondary"
          fontSize={16}
          uiTransform={{ width: 40, height: 30 }}
          onMouseDown={() => {
            isCollapsed = false
          }}
        />
      </UiEntity>
    )
  }

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 10, right: 10 },
        width: 240,
        flexDirection: 'column',
        padding: 10
      }}
      uiBackground={{ color: BG_COLOR }}
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
        <Label value={`PET: ${cachedStats.name}`} fontSize={16} color={HEADER_COLOR} />
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

      <PersonalityRow label="Energy (T)" value={cachedStats.personalityTraits.energy} />
      <PersonalityRow label="Social (T)" value={cachedStats.personalityTraits.sociability} />
      <PersonalityRow label="Clean (T)" value={cachedStats.personalityTraits.cleanliness} />
      <PersonalityRow label="Appetite (T)" value={cachedStats.personalityTraits.appetite} />

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
          onMouseDown={() => forcePoop()}
        />
      </UiEntity>
    </UiEntity>
  )
}
