import { engine, Animator } from '@dcl/sdk/ecs'
import { PetComponent } from '../components/Pet'
import { MenuStateComponent, PetAnimationStateComponent } from '../components/UIState'

/**
 * Animation System - Handles pet animations based on menu visibility state
 * Single source of truth: MenuStateComponent.isVisible
 */
export function animationSystem(dt: number) {
  // Query all pets
  for (const [petEntity, pet] of engine.getEntitiesWith(PetComponent)) {
    // Get animation state component
    const animState = PetAnimationStateComponent.getMutableOrNull(petEntity)
    if (!animState) continue

    // Find the menu state for this pet
    let menuState: any = null
    for (const [, menu] of engine.getEntitiesWith(MenuStateComponent)) {
      if (menu.petEntity === petEntity) {
        menuState = menu
        break
      }
    }

    if (!menuState) continue

    const isMenuVisible = menuState.isVisible
    const wasMenuVisible = animState.lastMenuVisible

    // Handle Standing→Idle transition (wait 1.5 seconds for Standing animation to play)
    if (animState.isTransitioning) {
      const elapsedTime = dt * 1000 // Convert to milliseconds
      animState.transitionStartTime += elapsedTime

      // Wait 1.5 seconds for Standing animation to complete, then transition to Idle
      if (animState.transitionStartTime >= 1500) {
        Animator.playSingleAnimation(petEntity, 'Idle', true)
        animState.currentAnimation = 'Idle'
        animState.isTransitioning = false
        animState.transitionStartTime = 0
      }
    }

    // Detect menu visibility changes
    if (isMenuVisible !== wasMenuVisible) {
      if (isMenuVisible) {
        // Menu became visible → play Sitting animation once
        if (animState.currentAnimation !== 'Sitting') {
          Animator.playSingleAnimation(petEntity, 'Sitting', true)
          animState.currentAnimation = 'Sitting'
          animState.isTransitioning = false
        }
      } else {
        // Menu became hidden → play Standing animation, then transition to Idle
        const standingClip = Animator.getClip(petEntity, 'Standing')
        if (standingClip) {
          // Stop any currently playing animations first
          Animator.stopAllAnimations(petEntity)
          // Play Standing animation
          Animator.playSingleAnimation(petEntity, 'Standing', true)
          animState.currentAnimation = 'Standing'
          animState.isTransitioning = true
          animState.transitionStartTime = 0 // Reset timer
        } else {
          // Fallback to Idle if Standing doesn't exist
          Animator.playSingleAnimation(petEntity, 'Idle', true)
          animState.currentAnimation = 'Idle'
          animState.isTransitioning = false
        }
      }
    }

    // Update last menu visible state
    animState.lastMenuVisible = isMenuVisible
  }
}
