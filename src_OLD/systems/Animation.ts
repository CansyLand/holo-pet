import { engine, Animator } from '@dcl/sdk/ecs'
import { PetComponent } from '../components/Pet'
import { MenuStateComponent, PetAnimationStateComponent } from '../components/UIState'
import { getPetBehaviorState, BehaviorState } from './Behavior'

/**
 * Animation System - Handles pet animations based on menu visibility and behavior state
 * Sources of truth: MenuStateComponent.isVisible and BehaviorState.WAITING_AT_STATION
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

    // Check if pet is waiting at a station (behavior-driven sitting)
    const behaviorState = getPetBehaviorState(petEntity)
    const isWaitingAtStation = behaviorState === BehaviorState.WAITING_AT_STATION
    const wasWaitingAtStation = animState.lastWaitingAtStation

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

    // Priority: Menu visibility takes precedence over station waiting
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
        // But only if pet is not waiting at a station
        if (!isWaitingAtStation) {
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
        // If still waiting at station, stay sitting (handled below)
      }
    }

    // Handle station waiting state changes (only when menu is not visible)
    if (!isMenuVisible && isWaitingAtStation !== wasWaitingAtStation) {
      if (isWaitingAtStation) {
        // Started waiting at station → play Sitting animation
        if (animState.currentAnimation !== 'Sitting') {
          Animator.playSingleAnimation(petEntity, 'Sitting', true)
          animState.currentAnimation = 'Sitting'
          animState.isTransitioning = false
        }
      } else {
        // Stopped waiting at station → play Standing animation, then Idle
        const standingClip = Animator.getClip(petEntity, 'Standing')
        if (standingClip) {
          Animator.stopAllAnimations(petEntity)
          Animator.playSingleAnimation(petEntity, 'Standing', true)
          animState.currentAnimation = 'Standing'
          animState.isTransitioning = true
          animState.transitionStartTime = 0
        } else {
          Animator.playSingleAnimation(petEntity, 'Idle', true)
          animState.currentAnimation = 'Idle'
          animState.isTransitioning = false
        }
      }
    }

    // Update last states
    animState.lastMenuVisible = isMenuVisible
    animState.lastWaitingAtStation = isWaitingAtStation
  }
}
