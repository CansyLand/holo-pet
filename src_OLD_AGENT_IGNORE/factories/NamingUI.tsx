import { Entity, PointerLock, engine } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { ReactEcsRenderer, UiEntity, Input, Label, Button } from '@dcl/sdk/react-ecs'
import { PetIdentityComponent } from '../components/Personality'
import { getPendingNamingEntity, clearPendingNaming } from '../systems/Logic'
import { setPetName } from './Pet'
import { startCameraFocusMonitoring } from '../systems/CameraFocus'
import { serializePet } from '../persistence/serialization'
import { savePetWithDetails, SaveResult } from '../persistence/api'

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
let saveError: string | null = null // Error message state
let isSaving = false // Loading state

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
async function submitName() {
  if (!targetPetEntity || isSaving) return

  // Require explicit name entry
  const finalName = currentName.trim()

  // Clear any previous errors
  saveError = null
  isSaving = true

  // Set the pet's name and update hover text
  setPetName(targetPetEntity, finalName)

  try {
    // Get pet data for saving
    const petData = serializePet(targetPetEntity)
    if (!petData) {
      saveError = 'Failed to prepare pet data'
      isSaving = false
      return
    }

    // Try to save with detailed error handling
    const result: SaveResult = await savePetWithDetails(petData)

    if (result.success) {
      // Success! Close the popup
      PointerLock.getMutable(engine.CameraEntity).isPointerLocked = originalCursorLocked
      isNamingActive = false
      currentName = ''
      targetPetEntity = null
      clearPendingNaming()
      console.log(`Naming completed and saved successfully`)
    } else {
      // Validation failed - show error and keep popup open
      saveError = result.error || 'Unknown error occurred'
      console.error('Pet naming validation failed:', saveError)
    }
  } catch (error) {
    saveError = 'Network error - please try again'
    console.error('Save operation failed:', error)
  } finally {
    isSaving = false
  }
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
        <Label value="Name Your Pet!" fontSize={28} color={Color4.White()} uiTransform={{ height: 40 }} />

        {/* Subtitle */}
        <Label
          value="Give your new companion a name"
          fontSize={16}
          color={Color4.create(0.7, 0.7, 0.7, 1)}
          uiTransform={{ height: 25 }}
        />

        {/* Error message - only show if there's an error */}
        {saveError && (
          <UiEntity
            uiTransform={{
              width: 350,
              height: 40,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: { left: 10, right: 10 }
            }}
            uiBackground={{ color: Color4.create(0.8, 0.2, 0.2, 0.9) }}
          >
            <Label value={`${saveError}`} fontSize={14} color={Color4.White()} uiTransform={{ width: '100%' }} />
          </UiEntity>
        )}

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
          {/* Confirm button */}
          <Button
            value={isSaving ? 'Saving...' : 'Confirm'}
            variant="primary"
            fontSize={16}
            disabled={isSaving}
            uiTransform={{
              width: 120,
              height: 40
            }}
            onMouseDown={() => submitName()}
          />
        </UiEntity>

        {/* Hint */}
        <Label
          value="Enter your pet's name"
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

/**
 * Reset the naming system state
 * Called when resetting the game
 */
export function resetNamingSystem() {
  isNamingActive = false
  currentName = ''
  targetPetEntity = null
  saveError = null
  isSaving = false
  namingDelayTimer = 0
  pendingNamingTriggered = false
  console.log('Naming system reset')
}
