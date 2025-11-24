import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { InteractionEvent, InteractionType } from '../components/Interaction'
import { PetComponent, PetState, Species } from '../components/Pet'
import { GameState, GamePhase } from '../components/GameState'
import { MenuStateComponent } from '../components/UIComponents'
import { createPet } from '../factories/Pet'
import { showMenu, hideMenu, activatePetCamera, deactivatePetCamera } from '../factories/UI'

export function logicSystem(dt: number) {
  // 1. Process Interaction Events
  for (const [entity, event] of engine.getEntitiesWith(InteractionEvent)) {
    const petData = PetComponent.getMutableOrNull(entity)

    switch (event.type) {
      case InteractionType.HATCH:
        handleHatch(entity)
        break
      case InteractionType.PET:
        // First check if this is a menu button click (on pet entity with menu)
        const menuState = MenuStateComponent.getMutableOrNull(entity)
        if (menuState) {
          // This is a menu button click - handle pet interaction
          if (petData) {
            petData.mood = Math.min(100, petData.mood + 10)
            console.log(`Pet mood increased to ${petData.mood}`)
          }
        } else {
          // This is a pet entity click - show menu
          handlePetClick(entity)
        }
        break
      case InteractionType.FEED:
        if (petData) {
          petData.hunger = Math.max(0, petData.hunger - 20)
          petData.mood = Math.min(100, petData.mood + 5)
          console.log(`Pet fed. Hunger: ${petData.hunger}, Mood: ${petData.mood}`)
        }
        break
      case InteractionType.PLAY:
        if (petData) {
          petData.mood = Math.min(100, petData.mood + 15)
          petData.hunger = Math.min(100, petData.hunger + 5) // Playing makes them hungry
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
    if (petData.mood < 20) {
      petData.state = PetState.SAD
    } else if (petData.state === PetState.SAD && petData.mood >= 20) {
      petData.state = PetState.IDLE
    }
  }
}

function handlePetClick(petEntity: Entity) {
  // Find the menu state for this pet
  for (const [menuStateEntity, menuState] of engine.getEntitiesWith(MenuStateComponent)) {
    if (menuState.petEntity === petEntity) {
      // Show menu and activate camera
      showMenu(menuState.menuRootEntity)
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
    // Check if this button is a child of the menu root
    const buttonTransform = Transform.get(buttonEntity)
    if (buttonTransform.parent === menuState.menuRootEntity) {
      // Hide menu and deactivate camera
      hideMenu(menuState.menuRootEntity)
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

      // Spawn Pet
      const petResult = createPet(Species.DOG) // Defaulting to DOG for now, could be random

      // Update GameState
      const mutableState = GameState.getMutable(gameEntity)
      mutableState.phase = GamePhase.PET
      mutableState.activePetEntity = petResult.petEntity
      mutableState.menuStateEntity = petResult.menuStateEntity

      console.log('Egg hatched into a Pet!')
    }
  }
}
