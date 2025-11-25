import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { InteractionEvent, InteractionType } from '../components/Interaction'
import { PetComponent, PetState, Species } from '../components/Pet'
import { GameState, GamePhase } from '../components/GameState'
import { MenuStateComponent, MenuElementComponent } from '../components/UIState'
import { createPet } from '../factories/Pet'
import { showMenu, hideMenu, activatePetCamera, deactivatePetCamera } from '../factories/UI'
import { removeSceneByType, createPetEnvironment } from '../factories/Environment'
import { SceneType } from '../components/Scene'
import { getCurrentTheme, getThemeDisplayName } from '../utils/theme'
import {
  MAX_MOOD,
  MAX_HUNGER,
  MIN_HUNGER,
  SAD_MOOD_THRESHOLD,
  PET_MOOD_BOOST,
  FEED_HUNGER_REDUCTION,
  FEED_MOOD_BOOST,
  PLAY_MOOD_BOOST,
  PLAY_HUNGER_INCREASE
} from '../utils/constants'

export function logicSystem(dt: number) {
  // 1. Process Interaction Events
  for (const [entity, event] of engine.getEntitiesWith(InteractionEvent)) {
    const petData = PetComponent.getMutableOrNull(entity)

    switch (event.type) {
      case InteractionType.HATCH:
        handleHatch(entity)
        break
      case InteractionType.PET:
        // Check if this entity has PetComponent (direct pet click) or is a menu button
        if (PetComponent.has(entity)) {
          // This is a direct pet entity click - show menu
          handlePetClick(entity)
        } else {
          // This is a menu button click - find the menu this button belongs to and update the pet's mood
          const menuElement = MenuElementComponent.getOrNull(entity)
          if (menuElement) {
            const menuStateEntity = menuElement.menuStateEntity
            const menuState = MenuStateComponent.get(menuStateEntity)
            const petEntity = menuState.petEntity
            const petData = PetComponent.getMutable(petEntity)
            const oldMood = petData.mood
            petData.mood = Math.min(MAX_MOOD, petData.mood + PET_MOOD_BOOST)
            console.log(`Pet button clicked: mood ${oldMood} -> ${petData.mood}`)
          }
        }
        break
      case InteractionType.FEED:
        if (petData) {
          petData.hunger = Math.max(MIN_HUNGER, petData.hunger - FEED_HUNGER_REDUCTION)
          petData.mood = Math.min(MAX_MOOD, petData.mood + FEED_MOOD_BOOST)
          console.log(`Pet fed. Hunger: ${petData.hunger}, Mood: ${petData.mood}`)
        }
        break
      case InteractionType.PLAY:
        if (petData) {
          petData.mood = Math.min(MAX_MOOD, petData.mood + PLAY_MOOD_BOOST)
          petData.hunger = Math.min(MAX_HUNGER, petData.hunger + PLAY_HUNGER_INCREASE) // Playing makes them hungry
        }
        break
      case InteractionType.CLEAN:
        // Implement clean logic
        break
      case InteractionType.CLOSE_MENU:
        handleCloseMenu(entity)
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

function handleHatch(eggEntity: any) {
  // Query the singleton GameState entity
  // Since we don't have a direct reference to the specific entity ID here without querying,
  // we'll iterate. There should be only one.
  for (const [gameEntity, gameState] of engine.getEntitiesWith(GameState)) {
    if (gameState.phase === GamePhase.EGG) {
      // Remove Egg
      engine.removeEntity(eggEntity)

      // Get current theme (UTC calendar or manual override)
      const theme = getCurrentTheme()

      // Switch from tech scene to pet scene with theme
      removeSceneByType(SceneType.TECH)
      createPetEnvironment(theme)

      // Spawn Pet
      const petResult = createPet(Species.DOG) // Defaulting to DOG for now, could be random

      // Update GameState
      const mutableState = GameState.getMutable(gameEntity)
      mutableState.phase = GamePhase.PET
      mutableState.activePetEntity = petResult.petEntity
      mutableState.menuStateEntity = petResult.menuStateEntity
      mutableState.theme = theme

      console.log(`Egg hatched into a Pet! Theme: ${getThemeDisplayName(theme)}`)
    }
  }
}
