import { engine, Transform } from '@dcl/sdk/ecs'
import { MenuStateComponent } from '../components/UIState'
import { hideMenu, deactivatePetCamera } from '../factories/UI'
import { PLAYER_MOVEMENT_THRESHOLD } from '../utils/constants'

let lastPlayerPosition = { x: 0, y: 0, z: 0 }
let isInitialized = false

export function movementSystem(dt: number) {
  // Get current player position
  const playerTransform = Transform.get(engine.PlayerEntity)
  const currentPosition = playerTransform.position

  if (!isInitialized) {
    // Initialize with current position
    lastPlayerPosition.x = currentPosition.x
    lastPlayerPosition.y = currentPosition.y
    lastPlayerPosition.z = currentPosition.z
    isInitialized = true
    return
  }

  // Check if player has moved (with small threshold to avoid floating point issues)
  const hasMoved =
    Math.abs(currentPosition.x - lastPlayerPosition.x) > PLAYER_MOVEMENT_THRESHOLD ||
    Math.abs(currentPosition.y - lastPlayerPosition.y) > PLAYER_MOVEMENT_THRESHOLD ||
    Math.abs(currentPosition.z - lastPlayerPosition.z) > PLAYER_MOVEMENT_THRESHOLD

  if (hasMoved) {
    // Player has moved - check if any menu is open and close it
    for (const [menuStateEntity, menuState] of engine.getEntitiesWith(MenuStateComponent)) {
      if (menuState.isVisible) {
        // Close the menu
        hideMenu(menuStateEntity)
        deactivatePetCamera()

        // Update menu state
        const mutableMenuState = MenuStateComponent.getMutable(menuStateEntity)
        mutableMenuState.isVisible = false

        console.log('Menu closed due to player movement')
      }
    }
  }

  // Update last position
  lastPlayerPosition.x = currentPosition.x
  lastPlayerPosition.y = currentPosition.y
  lastPlayerPosition.z = currentPosition.z
}
