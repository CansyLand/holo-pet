import { engine } from '@dcl/sdk/ecs'
import { onEnterScene, onLeaveScene } from '@dcl/sdk/observables'
import { loadPet, savePet, resetPet, PetDocument } from '../persistence/api'
import { serializePet, deserializePet } from '../persistence/serialization'
import { getWalletAddress } from '../utils/wallet'
import { GameState, GamePhase } from '../components/GameState'
import { PetComponent, Species, PetState } from '../components/Pet'
import { createPet, updatePetHoverText } from '../factories/Pet'
import { removeSceneByType, createPetEnvironment } from '../factories/Environment'
import { SceneType } from '../components/Scene'
import { getThemeDisplayName, getCurrentTheme } from '../utils/theme'
import { PersonalityComponent, BondComponent, PetIdentityComponent, TrustLevel } from '../components/Personality'
import { HygieneComponent } from '../components/Hygiene'
import { AUTO_SAVE_INTERVAL, SAVE_DEBOUNCE_TIME, SAVE_RETRY_DELAY } from '../utils/constants'

let lastSaveTime = 0
let pendingSave = false
let isSaving = false
let persistenceInitialized = false

/**
 * Initialize persistence system - called once in main()
 */
export function initPersistence() {
  if (persistenceInitialized) return
  persistenceInitialized = true

  console.log('🔄 Initializing persistence system...')

  // Load on scene enter
  onEnterScene.add(async () => {
    console.log('🎮 Scene entered, checking for saved pet...')
    await loadPetData()
  })

  // Save on scene leave
  onLeaveScene.add(async () => {
    console.log('👋 Scene left, saving pet...')
    await triggerSave(true) // immediate = true
  })
}

/**
 * Load pet data from Firebase functions
 */
async function loadPetData() {
  const wallet = getWalletAddress()
  if (!wallet) {
    console.log('⚠️  No wallet connected, starting fresh')
    return
  }

  console.log('🔍 Loading pet for wallet:', wallet.substring(0, 8) + '...')

  try {
    const petData = await loadPet()
    if (petData) {
      const gamePhase = petData.meta?.gamePhase || 'pet'
      if (gamePhase === 'pet') {
        console.log('✅ Found saved pet:', petData.identity.name)
        await restorePetFromData(petData)
      } else {
        console.log('🐣 Game in egg phase, showing egg')
        // Game stays in egg phase, no pet restoration needed
      }
    } else {
      console.log('🐣 No saved data found, starting fresh with egg')
    }
  } catch (error) {
    console.error('❌ Failed to load pet data:', error)
  }
}

/**
 * Restore pet from saved data
 */
async function restorePetFromData(data: PetDocument) {
  // Query current game state
  for (const [gameEntity, gameState] of engine.getEntitiesWith(GameState)) {
    if (gameState.phase === GamePhase.EGG) {
      // Remove egg and tech environment
      removeSceneByType(SceneType.TECH)

      // Switch to pet environment
      const theme = getCurrentTheme()
      createPetEnvironment(theme)

      // Create pet with loaded data
      const petResult = createPet(data.identity.species as Species)

      // Apply loaded data to components
      const deserialized = deserializePet(data)

      // Update components with loaded values
      if (petResult.petEntity) {
        // Set pet stats
        const petComp = PetComponent.getMutable(petResult.petEntity)
        petComp.mood = deserialized.pet.mood
        petComp.hunger = deserialized.pet.hunger
        petComp.energy = deserialized.pet.energy
        petComp.state = deserialized.pet.state as PetState

        // Set personality (immutable)
        const personalityComp = PersonalityComponent.getMutable(petResult.petEntity)
        personalityComp.energy = deserialized.personality.energy
        personalityComp.sociability = deserialized.personality.sociability
        personalityComp.cleanliness = deserialized.personality.cleanliness
        personalityComp.appetite = deserialized.personality.appetite

        // Set bond
        const bondComp = BondComponent.getMutable(petResult.petEntity)
        bondComp.bond = deserialized.bond.bond
        bondComp.trustLevel = deserialized.bond.trustLevel as TrustLevel
        bondComp.lastVisitTime = deserialized.bond.lastVisitTime

        // Set hygiene
        const hygieneComp = HygieneComponent.getMutable(petResult.petEntity)
        hygieneComp.cleanliness = deserialized.hygiene.cleanliness
        hygieneComp.lastBathTime = deserialized.hygiene.lastBathTime
        hygieneComp.lastBrushTime = deserialized.hygiene.lastBrushTime

        // Set identity
        const identityComp = PetIdentityComponent.getMutable(petResult.petEntity)
        identityComp.name = deserialized.identity.name
        identityComp.hatchedAt = deserialized.identity.hatchedAt
        identityComp.ownerId = getWalletAddress() || ''

        // Update hover text to show the pet's name
        updatePetHoverText(petResult.petEntity, deserialized.identity.name)

        console.log(`🐾 Pet "${deserialized.identity.name}" restored with ${deserialized.bond.bond}% bond`)
      }

      // Update game state
      const mutableState = GameState.getMutable(gameEntity)
      mutableState.phase = GamePhase.PET
      mutableState.activePetEntity = petResult.petEntity
      mutableState.menuStateEntity = petResult.menuStateEntity
      mutableState.theme = theme

      console.log(`🌟 Game phase changed to PET with theme: ${getThemeDisplayName(theme)}`)
    }
  }
}

/**
 * Trigger a save (debounced unless immediate)
 */
export async function triggerSave(immediate = false) {
  const now = Date.now() / 1000

  // Prevent concurrent saves
  if (isSaving) return

  if (!immediate && now - lastSaveTime < SAVE_DEBOUNCE_TIME) {
    pendingSave = true
    return
  }

  const wallet = getWalletAddress()
  if (!wallet) return

  isSaving = true

  // Find active pet
  for (const [_, gameState] of engine.getEntitiesWith(GameState)) {
    if (gameState.phase === GamePhase.PET && gameState.activePetEntity) {
      const petData = serializePet(gameState.activePetEntity)
      if (petData) {
        try {
          const success = await savePet(petData)
          if (success) {
            lastSaveTime = now
            pendingSave = false
            console.log('💾 Pet saved to Firebase successfully')
          } else {
            console.error('❌ Failed to save pet to Firebase')
            // Update lastSaveTime even on failure to prevent immediate retry
            // Use a shorter retry interval for failed saves
            lastSaveTime = now - (AUTO_SAVE_INTERVAL - SAVE_RETRY_DELAY)
          }
        } catch (error) {
          console.error('❌ Save error:', error)
          // Update lastSaveTime even on exception to prevent immediate retry
          lastSaveTime = now - (AUTO_SAVE_INTERVAL - SAVE_RETRY_DELAY)
        }
      }
    }
    break // Only process the first (and should be only) GameState entity
  }

  isSaving = false
}

/**
 * Persistence system - auto-saves every 60 seconds + handles scene leave saves
 */
export function persistenceSystem(dt: number) {
  const now = Date.now() / 1000

  // Process pending debounced saves first
  if (pendingSave && now - lastSaveTime >= SAVE_DEBOUNCE_TIME) {
    triggerSave()
    return // Exit early to prevent double-triggering in same frame
  }

  // Periodic auto-save (only if no pending save is being processed and not currently saving)
  if (!pendingSave && !isSaving && now - lastSaveTime >= AUTO_SAVE_INTERVAL) {
    triggerSave()
  }
}
