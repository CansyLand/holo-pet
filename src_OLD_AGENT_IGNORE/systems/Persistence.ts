import { engine } from '@dcl/sdk/ecs'
import { onEnterScene, onLeaveScene, onPlayerDisconnectedObservable } from '@dcl/sdk/observables'
import { getPlayer } from '@dcl/sdk/players'
import { loadPet, savePet, resetPet, PetDocument } from '../persistence/api'
import { serializePet, deserializePet } from '../persistence/serialization'
import { getWalletAddress } from '../utils/wallet'
import { GameState, GamePhase } from '../components/GameState'
import { PetComponent, Species, PetState } from '../components/Pet'
import { DailyQuestComponent } from '../components/Quest'
import { createPet, updatePetHoverText } from '../factories/Pet'
import { switchEnvironment } from '../factories/Environment'
import { SceneType } from '../components/Scene'
import { PersonalityComponent, BondComponent, PetIdentityComponent, TrustLevel } from '../components/Personality'
import { HygieneComponent } from '../components/Hygiene'
import { getQuestStateEntity } from './Quest'
import { checkYesterdayLoginOnLoad } from './Poop'
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

  // Load on scene enter
  onEnterScene.add(async () => {
    console.log('🎮 Scene entered, checking for saved pet...')
    await loadPetData()
  })

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
  // Store meta for future saves
  currentPetMeta = data.meta

  // Query current game state
  for (const [gameEntity, gameState] of engine.getEntitiesWith(GameState)) {
    // Switch to pet environment (entities are already set up, just show them)
    switchEnvironment('pet')

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

    // Restore quest state
    const questEntity = getQuestStateEntity()
    if (questEntity && deserialized.dailyQuests) {
      const questComp = DailyQuestComponent.getMutable(questEntity)
      questComp.feedCompleted = deserialized.dailyQuests.feedCompleted
      questComp.playCompleted = deserialized.dailyQuests.playCompleted
      questComp.bathCompleted = deserialized.dailyQuests.bathCompleted
      questComp.bedtimeCompleted = deserialized.dailyQuests.bedtimeCompleted
      questComp.lastResetDate = deserialized.dailyQuests.lastResetDate
      console.log(`📋 Quest state restored (last reset: ${deserialized.dailyQuests.lastResetDate})`)
    }

    // Check if we need to spawn yesterday's poops
    checkYesterdayLoginOnLoad(data.meta.lastVisitDate)

    // Update game state
    const mutableState = GameState.getMutable(gameEntity)
    mutableState.phase = GamePhase.PET
    mutableState.activePetEntity = petResult.petEntity
    mutableState.menuStateEntity = petResult.menuStateEntity

    console.log('🌟 Game phase changed to PET')
  }
}

/**
 * Trigger a save (immediate only - no debouncing)
 */
export async function triggerSave() {
  // Prevent concurrent saves
  if (isSaving) {
    console.log('💾 Save already in progress, skipping...')
    return
  }

  const wallet = getWalletAddress()
  if (!wallet) return

  const now = Date.now() / 1000
  isSaving = true

  // Find active pet
  for (const [_, gameState] of engine.getEntitiesWith(GameState)) {
    if (gameState.phase === GamePhase.PET && gameState.activePetEntity) {
      const petData = serializePet(gameState.activePetEntity, currentPetMeta)
      if (petData) {
        // Update current meta with the new values (server will update them further)
        currentPetMeta = petData.meta
        const success = await savePet(petData)
        if (success) {
          lastSaveTime = now
          console.log('💾 Pet saved to Firebase successfully')
        } else {
          console.error('❌ Failed to save pet to Firebase')
          // Mark for retry
          lastRetryTime = now
        }
      }
    }
    break // Only process the first (and should be only) GameState entity
  }

  isSaving = false
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
