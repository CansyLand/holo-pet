import { onEnterScene, onLeaveScene, onPlayerDisconnectedObservable } from '@dcl/sdk/observables'
import { getPlayer } from '@dcl/sdk/players'
import { savePet, savePetWithDetails, PetDocument } from '../persistence/api'
import { serializePet } from '../persistence/serialization'
import { game } from '../Game'
import { SAVE_RETRY_DELAY } from '../utils/constants'

let lastSaveTime = 0
let isSaving = false
let persistenceInitialized = false
let currentPetMeta: PetDocument['meta'] | undefined = undefined
let lastRetryTime = 0 // Track retry attempts

/**
 * Initialize persistence system - called once in main()
 */
export function initPersistence() {
  if (persistenceInitialized) return
  persistenceInitialized = true

  console.log('🔄 Initializing persistence system...')

  // Load on scene enter (handled by Game.loadSavedPet())

  // Save on scene leave (teleport/walk out)
  onLeaveScene.add(async ({ userId }: { userId: string }) => {
    const localPlayer = getPlayer()
    if (localPlayer && userId === localPlayer.userId) {
      console.log('👋 Local player left scene boundary, saving pet...')
      await triggerSave() // immediate save
    }
  })

  // Save on player disconnection (browser close/network issues)
  onPlayerDisconnectedObservable.add(async (playerData) => {
    const localPlayer = getPlayer()
    if (localPlayer && playerData.userId === localPlayer.userId) {
      console.log('🔌 Local player disconnected, emergency save...')
      await triggerSave() // immediate save
    }
  })

  console.log('✅ Persistence system initialized')
}

/**
 * Trigger a save (immediate only - no debouncing)
 */
export async function triggerSave(): Promise<boolean> {
  // Prevent concurrent saves
  if (isSaving) {
    console.log('💾 Save already in progress, skipping...')
    return false
  }

  if (!game.state.pet) {
    console.log('💾 No pet to save')
    return false
  }

  const now = Date.now() / 1000
  isSaving = true

  try {
    // Serialize pet data for saving
    const petData = serializePet(game.state.pet, currentPetMeta)
    if (!petData) {
      console.error('❌ Failed to serialize pet data')
      isSaving = false
      return false
    }

    // Update current meta with the new values (server will update them further)
    currentPetMeta = petData.meta
    const success = await savePet(petData)

    if (success) {
      lastSaveTime = now
      console.log('💾 Pet saved to Firebase successfully')
      return true
    } else {
      console.error('❌ Failed to save pet to Firebase')
      // Mark for retry
      lastRetryTime = now
      return false
    }
  } catch (error) {
    console.error('❌ Save operation failed:', error)
    lastRetryTime = now
    return false
  } finally {
    isSaving = false
  }
}

/**
 * Trigger a save with detailed error reporting (for UI interactions)
 */
export async function triggerSaveWithDetails(): Promise<{ success: boolean; error?: string }> {
  if (isSaving) {
    return { success: false, error: 'Save already in progress' }
  }

  if (!game.state.pet) {
    return { success: false, error: 'No pet to save' }
  }

  isSaving = true

  try {
    const petData = serializePet(game.state.pet, currentPetMeta)
    if (!petData) {
      isSaving = false
      return { success: false, error: 'Failed to prepare pet data' }
    }

    currentPetMeta = petData.meta
    const result = await savePetWithDetails(petData)

    if (result.success) {
      lastSaveTime = Date.now() / 1000
      console.log('💾 Pet saved with detailed feedback')
      return { success: true }
    } else {
      lastRetryTime = Date.now() / 1000
      return result
    }
  } catch (error: any) {
    console.error('❌ Save operation failed:', error)
    lastRetryTime = Date.now() / 1000
    return { success: false, error: 'Network error - please try again' }
  } finally {
    isSaving = false
  }
}

/**
 * Update the current pet meta data (called after successful load)
 */
export function updateCurrentPetMeta(meta: PetDocument['meta']) {
  currentPetMeta = meta
}

/**
 * Get current pet meta data
 */
export function getCurrentPetMeta(): PetDocument['meta'] | undefined {
  return currentPetMeta
}

/**
 * Check if a save is currently in progress
 */
export function isSaveInProgress(): boolean {
  return isSaving
}

/**
 * Persistence system - handles failed save retries only (no auto-save)
 */
export function persistenceSystem(dt: number) {
  // Retry failed saves after delay
  if (lastRetryTime > 0 && !isSaving) {
    const now = Date.now() / 1000
    if (now - lastRetryTime >= SAVE_RETRY_DELAY) {
      console.log('🔄 Retrying failed save...')
      lastRetryTime = 0 // Reset before attempting
      triggerSave()
    }
  }
}

/**
 * Shutdown persistence system (cleanup)
 */
export function shutdownPersistence() {
  persistenceInitialized = false
  isSaving = false
  currentPetMeta = undefined
  lastSaveTime = 0
  lastRetryTime = 0
  console.log('🔄 Persistence system shutdown')
}
