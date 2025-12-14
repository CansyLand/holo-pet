// EPIC: New Player Onboarding - Egg Hatching Story
// All egg-related logic in one place - hatching, animations, interactions.
// Easy to extend with color-changing animations or other egg features.
// Ready for mini-games when the egg becomes more interactive.

import { game } from '../Game'
import { GameModule } from '../Game'

export class EggModule implements GameModule {
  name = 'Egg'
  eggEntity: any = null // Will be the egg entity from Decentraland

  init() {
    console.log('🥚 Egg module initialized')
    // TODO: Find egg entity by name
    // this.eggEntity = engine.getEntityOrNullByName('Egg')
    this.setupEggInteractions()
  }

  update(dt: number) {
    // Handle any egg animations or effects
    // TODO: Update color pulse animation if active
  }

  // Easy to extend with animations
  onClick() {
    console.log('🥚 Egg clicked - starting hatch sequence')
    this.startHatchingAnimation()
  }

  // Hatching animation sequence
  private startHatchingAnimation() {
    // TODO: Play scale animation (1.2) then shrink to 0
    // TODO: Use tweens for smooth animation

    console.log('🥚 Starting egg hatching animation...')

    // After animation completes, trigger actual hatch
    setTimeout(() => {
      this.completeHatching()
    }, 2000) // Animation duration
  }

  // Complete the hatching process
  private completeHatching() {
    console.log('🥚 Egg hatched! Creating pet...')

    // Hide egg
    // TODO: visibility.hideEntity(this.eggEntity)

    // Tell game to hatch (will create pet and change phase)
    game.hatchEgg()
  }

  // Add color-changing animation easily
  startColorPulseAnimation() {
    console.log('🥚 Starting egg color pulse animation')
    // TODO: Simple animation code here
    // Can be triggered by game state or time
    // Easy to extend with different colors for different pet types
  }

  private setupEggInteractions() {
    // TODO: Register click handler with interaction service
    // interaction.registerHandler('egg_click', () => this.onClick())

    console.log('🥚 Egg interactions set up')
  }

  cleanup() {
    console.log('🥚 Egg module cleanup')
    // TODO: Remove any active animations or timers
  }
}

