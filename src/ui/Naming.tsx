// EPIC: New Player Onboarding - Pet Naming Story
// Naming UI dialog that appears after egg hatching.
// Allows players to enter a custom name for their pet.

import ReactEcs, { UiEntity, Label, Button, Input } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { game } from '../Game'
import { triggerSaveWithDetails } from '../services/Persistence'
import { pointer } from '../services/Pointer'

// State (module-level, not React hooks)
let isVisible = false
let currentName = ''
let onNameSubmitCallback: ((name: string) => void) | null = null
let saveError: string | null = null // Error message state
let isSaving = false // Loading state

// Colors for UI
const HEADER_COLOR = Color4.White()
const SECONDARY_COLOR = Color4.create(0.7, 0.7, 0.7, 1)
const BUTTON_COLOR = Color4.create(0.2, 0.6, 1, 1)
const INPUT_BG_COLOR = Color4.create(0.25, 0.25, 0.3, 1)
const OVERLAY_COLOR = Color4.create(0, 0, 0, 0.7)
const PANEL_BG_COLOR = Color4.create(0.15, 0.15, 0.2, 0.95)

export function showNamingUI(onNameSubmit: (name: string) => void) {
  isVisible = true
  currentName = ''
  onNameSubmitCallback = onNameSubmit
}

export function hideNamingUI() {
  isVisible = false
  currentName = ''
  onNameSubmitCallback = null
  saveError = null
  isSaving = false
}

async function handleNameSubmit() {
  if (!currentName.trim() || isSaving) return

  // Clear any previous errors
  saveError = null
  isSaving = true

  try {
    // Set the pet's name first
    if (onNameSubmitCallback) {
      onNameSubmitCallback(currentName.trim())
    }

    // Try to save with detailed error handling
    const result = await triggerSaveWithDetails()

    if (result.success) {
      // Success! Close the popup
      pointer.restorePointerState()
      hideNamingUI()
      console.log(`🐾 Pet named and saved successfully: ${currentName.trim()}`)
    } else {
      // Validation failed - show error and keep popup open
      saveError = result.error || 'Save failed'
      console.error('🐾 Pet naming save failed:', saveError)
    }
  } catch (error) {
    saveError = 'Network error - please try again'
    console.error('🐾 Save operation failed:', error)
  } finally {
    isSaving = false
  }
}

function handleRandomName() {
  const randomNames = [
    'Fluffy',
    'Tiger',
    'Spark',
    'Luna',
    'Max',
    'Bella',
    'Charlie',
    'Daisy',
    'Oliver',
    'Lucy',
    'Buddy',
    'Molly',
    'Jack',
    'Sophie',
    'Rocky',
    'Lily'
  ]
  currentName = randomNames[Math.floor(Math.random() * randomNames.length)]
}

function updateName(value: string) {
  currentName = value
}

export function NamingUI() {
  if (!isVisible) return null

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
        uiBackground={{ color: OVERLAY_COLOR }}
      />

      {/* Popup container */}
      <UiEntity
        uiTransform={{
          width: 400,
          height: 280,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: 20
        }}
        uiBackground={{ color: PANEL_BG_COLOR }}
      >
        {/* Title */}
        <Label value="🐾 Name Your Pet!" fontSize={28} color={HEADER_COLOR} uiTransform={{ height: 40 }} />

        {/* Subtitle */}
        <Label
          value="Your egg has hatched! What would you like to name your new companion?"
          fontSize={16}
          color={SECONDARY_COLOR}
          uiTransform={{ height: 40, width: 350 }}
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
          placeholder="Enter pet name..."
          placeholderColor={Color4.create(0.5, 0.5, 0.5, 1)}
          color={Color4.Black()}
          fontSize={20}
          onChange={(value) => updateName(value)}
          uiTransform={{
            width: 300,
            height: 45
          }}
          uiBackground={{
            color: INPUT_BG_COLOR
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
          <Button
            value="🎲 Random Name"
            variant="secondary"
            fontSize={14}
            uiTransform={{
              width: 120,
              height: 40,
              margin: { right: 10 }
            }}
            onMouseDown={() => handleRandomName()}
          />
          <Button
            value={isSaving ? 'Saving...' : '✅ Name Pet'}
            variant="primary"
            fontSize={14}
            disabled={!currentName.trim() || isSaving}
            uiTransform={{
              width: 120,
              height: 40
            }}
            onMouseDown={() => handleNameSubmit()}
          />
        </UiEntity>

        {/* Hint */}
        <Label
          value="This name will be permanent and shown to other players!"
          fontSize={12}
          color={Color4.create(0.5, 0.5, 0.5, 1)}
          uiTransform={{ height: 20 }}
        />
      </UiEntity>
    </UiEntity>
  )
}

// Functions are already exported above
// export { showNamingUI, hideNamingUI }
