import { Entity, PointerLock, engine } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { ReactEcsRenderer, UiEntity, Input, Label, Button } from '@dcl/sdk/react-ecs'
import { PetIdentityComponent } from '../components/Personality'
import { getPendingNamingEntity, clearPendingNaming } from '../systems/Logic'
import { setPetName } from './Pet'
import { startCameraFocusMonitoring } from '../systems/CameraFocus'

// =============================================================================
// PET NAMING UI
// Text input popup shown after hatching to name the pet
// Uses DCL's ReactECS UI system for text input
// =============================================================================

// State
let isNamingActive = false
let currentName = ''
let targetPetEntity: Entity | null = null
let originalCursorLocked = true // Store original cursor state

// Default names for random selection if player doesn't want to type
const DEFAULT_NAMES = [
  'Buddy', 'Max', 'Luna', 'Charlie', 'Bella',
  'Cooper', 'Daisy', 'Rocky', 'Lucy', 'Bear',
  'Milo', 'Sadie', 'Duke', 'Molly', 'Tucker',
  'Bailey', 'Maggie', 'Winston', 'Sophie', 'Bentley'
]

// Delay timer for showing popup
let namingDelayTimer = 0
const NAMING_DELAY = 0.5 // seconds

/**
 * Start the naming process for a pet
 */
export function startNaming(petEntity: Entity) {
  targetPetEntity = petEntity
  currentName = ''
  isNamingActive = true

  // Detach cursor like when focusing on pet
  originalCursorLocked = PointerLock.get(engine.CameraEntity).isPointerLocked
  PointerLock.getMutable(engine.CameraEntity).isPointerLocked = false
  startCameraFocusMonitoring()

  console.log(`Naming popup opened, cursor unlocked (was ${originalCursorLocked ? 'locked' : 'unlocked'})`)
}

/**
 * Submit the name and close the popup
 */
function submitName() {
  if (!targetPetEntity) return

  // Use random name if empty
  const finalName = currentName.trim() || getRandomName()

  // Set the pet's name and update hover text
  setPetName(targetPetEntity, finalName)

  // Restore cursor state
  PointerLock.getMutable(engine.CameraEntity).isPointerLocked = originalCursorLocked

  // Clear state
  isNamingActive = false
  currentName = ''
  targetPetEntity = null
  clearPendingNaming()

  console.log(`Naming completed, cursor restored to ${originalCursorLocked ? 'locked' : 'unlocked'}`)
}

/**
 * Get a random default name
 */
function getRandomName(): string {
  return DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)]
}

/**
 * Update the current name (called from input change)
 */
function updateName(value: string) {
  // Limit name length
  currentName = value.substring(0, 20)
}

/**
 * Check if naming is currently active
 */
export function isNamingPopupActive(): boolean {
  return isNamingActive
}

// =============================================================================
// UI COMPONENT (ReactECS)
// =============================================================================

/**
 * The naming UI component rendered with ReactECS
 */
export function NamingUI() {
  if (!isNamingActive) {
    return null
  }

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        positionType: 'absolute'
      }}
    >
      {/* Dark overlay */}
      <UiEntity
        uiTransform={{
          width: '100%',
          height: '100%',
          positionType: 'absolute'
        }}
        uiBackground={{ color: Color4.create(0, 0, 0, 0.7) }}
      />

      {/* Popup container */}
      <UiEntity
        uiTransform={{
          width: 400,
          height: 250,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: 20
        }}
        uiBackground={{
          color: Color4.create(0.15, 0.15, 0.2, 0.95)
        }}
      >
        {/* Title */}
        <Label
          value="Name Your Pet!"
          fontSize={28}
          color={Color4.White()}
          uiTransform={{ height: 40 }}
        />

        {/* Subtitle */}
        <Label
          value="Give your new companion a name"
          fontSize={16}
          color={Color4.create(0.7, 0.7, 0.7, 1)}
          uiTransform={{ height: 25 }}
        />

        {/* Text input */}
        <Input
          placeholder="Enter name..."
          placeholderColor={Color4.create(0.5, 0.5, 0.5, 1)}
          color={Color4.Black()}
          fontSize={20}
          onChange={(value) => updateName(value)}
          uiTransform={{
            width: 300,
            height: 45
          }}
          uiBackground={{
            color: Color4.create(0.25, 0.25, 0.3, 1)
          }}
        />

        {/* Buttons row */}
        <UiEntity
          uiTransform={{
            width: '100%',
            height: 50,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {/* Random name button */}
          <Button
            value="Random"
            variant="secondary"
            fontSize={16}
            uiTransform={{
              width: 100,
              height: 40,
              margin: { right: 10 }
            }}
            onMouseDown={() => {
              currentName = getRandomName()
            }}
          />

          {/* Confirm button */}
          <Button
            value="Confirm"
            variant="primary"
            fontSize={16}
            uiTransform={{
              width: 120,
              height: 40
            }}
            onMouseDown={() => submitName()}
          />
        </UiEntity>

        {/* Hint */}
        <Label
          value="(Leave empty for a random name)"
          fontSize={12}
          color={Color4.create(0.5, 0.5, 0.5, 1)}
          uiTransform={{ height: 20 }}
        />
      </UiEntity>
    </UiEntity>
  )
}

// =============================================================================
// NAMING SYSTEM
// Checks for pending naming and triggers the popup
// =============================================================================

let pendingNamingTriggered = false

export function namingSystem(dt: number) {
  // Check if there's a pet waiting to be named
  const pendingEntity = getPendingNamingEntity()

  if (pendingEntity && !isNamingActive && !pendingNamingTriggered) {
    // Use timer instead of setTimeout (not available in DCL)
    namingDelayTimer += dt
    if (namingDelayTimer >= NAMING_DELAY) {
      pendingNamingTriggered = true
      namingDelayTimer = 0
      startNaming(pendingEntity)
    }
  }

  // Reset when no pending entity
  if (!pendingEntity) {
    pendingNamingTriggered = false
    namingDelayTimer = 0
  }
}
