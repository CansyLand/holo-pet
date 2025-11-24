import { engine, Transform } from '@dcl/sdk/ecs'
import { MenuStateComponent } from '../components/UIComponents'
import { hideMenu, deactivatePetCamera } from '../factories/UI'

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
  const movementThreshold = 0.1
  const hasMoved =
    Math.abs(currentPosition.x - lastPlayerPosition.x) > movementThreshold ||
    Math.abs(currentPosition.y - lastPlayerPosition.y) > movementThreshold ||
    Math.abs(currentPosition.z - lastPlayerPosition.z) > movementThreshold

  if (hasMoved) {
    // Player has moved - check if any menu is open and close it
    for (const [menuStateEntity, menuState] of engine.getEntitiesWith(MenuStateComponent)) {
      if (menuState.isVisible) {
        // Close the menu
        hideMenu(menuState.menuRootEntity)
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
