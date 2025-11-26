import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { InteractionEvent, InteractionType } from '../components/Interaction'
import { PetComponent, PetState, Species } from '../components/Pet'
import { GameState, GamePhase } from '../components/GameState'
import { MenuStateComponent, MenuElementComponent, CameraFocusComponent } from '../components/UIState'
import { BondComponent, PersonalityComponent } from '../components/Personality'
import { HygieneComponent } from '../components/Hygiene'
import { PoopComponent } from '../components/Poop'
import { createPet } from '../factories/Pet'
import { showMenu, hideMenu, activatePetCamera, deactivatePetCamera } from '../factories/UI'
import { removeSceneByType, createPetEnvironment } from '../factories/Environment'
import { SceneType } from '../components/Scene'
import { getCurrentTheme, getThemeDisplayName } from '../utils/theme'
import { addBond, recordPlayerVisit } from './Bond'
import { applyBath, applyBrush } from './Hygiene'
import { collectPoop } from './Poop'
import { spawnHearts } from './HeartParticle'
import {
  MAX_MOOD,
  MAX_HUNGER,
  MAX_ENERGY,
  MAX_CLEANLINESS,
  MIN_ENERGY,
  MIN_HUNGER,
  MIN_CLEANLINESS,
  SAD_MOOD_THRESHOLD,
  PET_MOOD_BOOST,
  PET_BOND_BOOST,
  FEED_HUNGER_REDUCTION,
  FEED_MOOD_BOOST,
  FEED_BOND_BOOST,
  PLAY_MOOD_BOOST,
  PLAY_HUNGER_INCREASE,
  PLAY_ENERGY_DECREASE,
  PLAY_BOND_BOOST,
  PLAY_CLEANLINESS_DECREASE,
  TREAT_HUNGER_REDUCTION,
  TREAT_MOOD_BOOST,
  TREAT_BOND_BOOST,
  BATHE_CLEANLINESS_BOOST,
  BATHE_MOOD_BOOST,
  BATHE_BOND_BOOST,
  BRUSH_CLEANLINESS_BOOST,
  BRUSH_MOOD_BOOST,
  BRUSH_BOND_BOOST,
  COLLECT_POOP_MOOD_BOOST,
  COLLECT_POOP_CLEANLINESS_BOOST,
  COLLECT_POOP_BOND_BOOST,
  WATER_MOOD_BOOST,
  WATER_BOND_BOOST
} from '../utils/constants'

// Track if naming popup should be shown
let pendingNamingEntity: Entity | null = null

export function logicSystem(dt: number) {
  // 1. Process Interaction Events
  for (const [entity, event] of engine.getEntitiesWith(InteractionEvent)) {
    const petData = PetComponent.getMutableOrNull(entity)

    switch (event.type) {
      case InteractionType.HATCH:
        handleHatch(entity)
        break

      case InteractionType.PET:
        handlePetInteraction(entity)
        break

      case InteractionType.FEED:
        handleFeed(entity, petData)
        break

      case InteractionType.PLAY:
        handlePlay(entity, petData)
        break

      case InteractionType.GIVE_TREAT:
        handleTreat(entity)
        break

      case InteractionType.BATHE:
        handleBathe(entity)
        break

      case InteractionType.BRUSH:
        handleBrush(entity)
        break

      case InteractionType.COLLECT_POOP:
        handleCollectPoop(entity)
        break

      case InteractionType.DRINK_WATER:
        handleDrinkWater(entity)
        break

      case InteractionType.CLEAN:
        // Legacy clean - redirect to brush
        handleBrush(entity)
        break

      case InteractionType.CLOSE_MENU:
        handleCloseMenu(entity)
        break

      case InteractionType.NAME_PET:
        // Handled separately by naming UI
        break
    }

    // Remove the event immediately after processing so it doesn't run again next frame
    InteractionEvent.deleteFrom(entity)
  }

  // 2. State Transitions & Checks
  for (const [entity] of engine.getEntitiesWith(PetComponent)) {
    const petData = PetComponent.getMutable(entity)

    // Example state update based on thresholds
    if (petData.mood < SAD_MOOD_THRESHOLD) {
      petData.state = PetState.SAD
    } else if (petData.state === PetState.SAD && petData.mood >= SAD_MOOD_THRESHOLD) {
      petData.state = PetState.IDLE
    }
  }
}

// =============================================================================
// INTERACTION HANDLERS
// =============================================================================

function handlePetInteraction(entity: Entity) {
  // Check if this entity has PetComponent (direct pet click) or is a menu button
  if (PetComponent.has(entity)) {
    // Check if we're in focused mode (camera is active)
    let isFocusedMode = false
    for (const [cameraEntity, focusComponent] of engine.getEntitiesWith(CameraFocusComponent)) {
      if (focusComponent.isCameraFocused) {
        isFocusedMode = true
        break
      }
    }

    if (isFocusedMode) {
      // In focused mode, petting the pet directly increases mood instead of showing menu
      const petData = PetComponent.getMutable(entity)

      // Get personality modifier for petting
      const personality = PersonalityComponent.getOrNull(entity)
      const socialModifier = personality ? personality.sociability / 50 : 1

      const oldMood = petData.mood
      petData.mood = Math.min(MAX_MOOD, petData.mood + PET_MOOD_BOOST * socialModifier)

      // Add bond
      addBond(entity, PET_BOND_BOOST * socialModifier)
      recordPlayerVisit(entity)

      // Spawn heart particles!
      spawnHearts(entity)

      console.log(`Pet directly petted in focused mode: mood ${oldMood} -> ${petData.mood}`)
    } else {
      // Not in focused mode - show menu and activate camera
      handlePetClick(entity)
    }
  } else {
    // This is a menu button click - find the menu this button belongs to and update the pet's mood
    const menuElement = MenuElementComponent.getOrNull(entity)
    if (menuElement) {
      const menuStateEntity = menuElement.menuStateEntity
      const menuState = MenuStateComponent.get(menuStateEntity)
      const petEntity = menuState.petEntity
      const petData = PetComponent.getMutable(petEntity)

      // Get personality modifier for petting
      const personality = PersonalityComponent.getOrNull(petEntity)
      const socialModifier = personality ? personality.sociability / 50 : 1

      const oldMood = petData.mood
      petData.mood = Math.min(MAX_MOOD, petData.mood + PET_MOOD_BOOST * socialModifier)

      // Add bond
      addBond(petEntity, PET_BOND_BOOST * socialModifier)
      recordPlayerVisit(petEntity)

      // Spawn heart particles!
      spawnHearts(petEntity)

      console.log(`Pet button clicked: mood ${oldMood} -> ${petData.mood}`)
    }
  }
}

function handleFeed(entity: Entity, petData: ReturnType<typeof PetComponent.getMutableOrNull>) {
  // Find the active pet if not directly on pet entity
  const targetPet = findActivePet()
  if (!targetPet) return

  const targetPetData = PetComponent.getMutable(targetPet)
  const personality = PersonalityComponent.getOrNull(targetPet)
  const appetiteModifier = personality ? personality.appetite / 50 : 1

  targetPetData.hunger = Math.max(MIN_HUNGER, targetPetData.hunger - FEED_HUNGER_REDUCTION)
  targetPetData.mood = Math.min(MAX_MOOD, targetPetData.mood + FEED_MOOD_BOOST * appetiteModifier)

  addBond(targetPet, FEED_BOND_BOOST)
  recordPlayerVisit(targetPet)

  console.log(`Pet fed. Hunger: ${targetPetData.hunger}, Mood: ${targetPetData.mood}`)
}

function handlePlay(entity: Entity, petData: ReturnType<typeof PetComponent.getMutableOrNull>) {
  const targetPet = findActivePet()
  if (!targetPet) return

  const targetPetData = PetComponent.getMutable(targetPet)
  const hygieneData = HygieneComponent.getMutableOrNull(targetPet)

  targetPetData.mood = Math.min(MAX_MOOD, targetPetData.mood + PLAY_MOOD_BOOST)
  targetPetData.hunger = Math.min(MAX_HUNGER, targetPetData.hunger + PLAY_HUNGER_INCREASE)
  targetPetData.energy = Math.max(MIN_ENERGY, targetPetData.energy - PLAY_ENERGY_DECREASE)

  // Playing makes pet dirty
  if (hygieneData) {
    hygieneData.cleanliness = Math.max(MIN_CLEANLINESS, hygieneData.cleanliness - PLAY_CLEANLINESS_DECREASE)
  }

  addBond(targetPet, PLAY_BOND_BOOST)
  recordPlayerVisit(targetPet)

  console.log(`Played with pet. Mood: ${targetPetData.mood}, Energy: ${targetPetData.energy}`)
}

function handleTreat(entity: Entity) {
  const targetPet = findActivePet()
  if (!targetPet) return

  const petData = PetComponent.getMutable(targetPet)
  const personality = PersonalityComponent.getOrNull(targetPet)
  const appetiteModifier = personality ? personality.appetite / 50 : 1

  // Treats: less hunger reduction, more mood and bond
  petData.hunger = Math.max(MIN_HUNGER, petData.hunger - TREAT_HUNGER_REDUCTION)
  petData.mood = Math.min(MAX_MOOD, petData.mood + TREAT_MOOD_BOOST * appetiteModifier)

  addBond(targetPet, TREAT_BOND_BOOST)
  recordPlayerVisit(targetPet)

  console.log(`Gave treat. Mood: ${petData.mood}, Bond increased by ${TREAT_BOND_BOOST}`)
}

function handleBathe(entity: Entity) {
  const targetPet = findActivePet()
  if (!targetPet) return

  const petData = PetComponent.getMutable(targetPet)

  applyBath(targetPet, BATHE_CLEANLINESS_BOOST)
  petData.mood = Math.min(MAX_MOOD, petData.mood + BATHE_MOOD_BOOST)

  addBond(targetPet, BATHE_BOND_BOOST)
  recordPlayerVisit(targetPet)

  console.log(`Bathed pet. Cleanliness restored, Mood: ${petData.mood}`)
}

function handleBrush(entity: Entity) {
  const targetPet = findActivePet()
  if (!targetPet) return

  const petData = PetComponent.getMutable(targetPet)

  applyBrush(targetPet, BRUSH_CLEANLINESS_BOOST)
  petData.mood = Math.min(MAX_MOOD, petData.mood + BRUSH_MOOD_BOOST)

  addBond(targetPet, BRUSH_BOND_BOOST)
  recordPlayerVisit(targetPet)

  console.log(`Brushed pet. Cleanliness +${BRUSH_CLEANLINESS_BOOST}, Mood: ${petData.mood}`)
}

function handleCollectPoop(poopEntity: Entity) {
  // Check if this is actually a poop entity
  const poopData = PoopComponent.getOrNull(poopEntity)
  if (!poopData || !poopData.isActive) return

  // Collect the poop
  collectPoop(poopEntity)

  // Find the active pet and boost mood
  const targetPet = findActivePet()
  if (targetPet) {
    const petData = PetComponent.getMutable(targetPet)
    const hygieneData = HygieneComponent.getMutableOrNull(targetPet)

    petData.mood = Math.min(MAX_MOOD, petData.mood + COLLECT_POOP_MOOD_BOOST)

    if (hygieneData) {
      hygieneData.cleanliness = Math.min(MAX_CLEANLINESS, hygieneData.cleanliness + COLLECT_POOP_CLEANLINESS_BOOST)
    }

    addBond(targetPet, COLLECT_POOP_BOND_BOOST)
    recordPlayerVisit(targetPet)

    console.log(`Collected poop. Mood: ${petData.mood}`)
  }
}

function handleDrinkWater(entity: Entity) {
  const targetPet = findActivePet()
  if (!targetPet) return

  const petData = PetComponent.getMutable(targetPet)

  petData.mood = Math.min(MAX_MOOD, petData.mood + WATER_MOOD_BOOST)

  addBond(targetPet, WATER_BOND_BOOST)
  recordPlayerVisit(targetPet)

  console.log(`Gave water to pet. Mood: ${petData.mood}`)
}

// =============================================================================
// MENU HANDLERS
// =============================================================================

function handlePetClick(petEntity: Entity) {
  // Find the menu state for this pet
  for (const [menuStateEntity, menuState] of engine.getEntitiesWith(MenuStateComponent)) {
    if (menuState.petEntity === petEntity) {
      // Show menu and activate camera
      showMenu(menuStateEntity)
      if (menuState.virtualCameraEntity) {
        activatePetCamera(menuState.virtualCameraEntity)
      }

      // Update menu state
      const mutableMenuState = MenuStateComponent.getMutable(menuStateEntity)
      mutableMenuState.isVisible = true

      // Record player visit on pet click
      recordPlayerVisit(petEntity)

      console.log('Pet menu opened')
      break
    }
  }
}

function handleCloseMenu(buttonEntity: Entity) {
  // Find the menu state that contains this button
  for (const [menuStateEntity, menuState] of engine.getEntitiesWith(MenuStateComponent)) {
    // Check if this button belongs to this menu (using MenuElementComponent)
    const menuElement = MenuElementComponent.getOrNull(buttonEntity)
    if (menuElement && menuElement.menuStateEntity === menuStateEntity) {
      // Hide menu and deactivate camera
      hideMenu(menuStateEntity)
      deactivatePetCamera()

      // Update menu state
      const mutableMenuState = MenuStateComponent.getMutable(menuStateEntity)
      mutableMenuState.isVisible = false

      console.log('Pet menu closed')
      break
    }
  }
}

// =============================================================================
// HATCH HANDLER
// =============================================================================

function handleHatch(eggEntity: any) {
  // Query the singleton GameState entity
  for (const [gameEntity, gameState] of engine.getEntitiesWith(GameState)) {
    if (gameState.phase === GamePhase.EGG) {
      // Remove Egg
      engine.removeEntity(eggEntity)

      // Get current theme (UTC calendar or manual override)
      const theme = getCurrentTheme()

      // Switch from tech scene to pet scene with theme
      removeSceneByType(SceneType.TECH)
      createPetEnvironment(theme)

      // Spawn Pet with personality
      const petResult = createPet(Species.DOG) // Defaulting to DOG for now, could be random

      // Update GameState
      const mutableState = GameState.getMutable(gameEntity)
      mutableState.phase = GamePhase.PET
      mutableState.activePetEntity = petResult.petEntity
      mutableState.menuStateEntity = petResult.menuStateEntity
      mutableState.theme = theme

      // Set pending naming - UI system will handle showing the popup
      pendingNamingEntity = petResult.petEntity

      console.log(`Egg hatched into a Pet! Theme: ${getThemeDisplayName(theme)}`)
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Find the currently active pet entity
 */
function findActivePet(): Entity | null {
  for (const [gameEntity, gameState] of engine.getEntitiesWith(GameState)) {
    if (gameState.phase === GamePhase.PET && gameState.activePetEntity) {
      return gameState.activePetEntity
    }
  }
  return null
}

/**
 * Get the pet entity pending naming (after hatch)
 */
export function getPendingNamingEntity(): Entity | null {
  return pendingNamingEntity
}

/**
 * Clear the pending naming entity (after name is set)
 */
export function clearPendingNaming() {
  pendingNamingEntity = null
}
