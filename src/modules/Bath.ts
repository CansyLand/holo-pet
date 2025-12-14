// EPIC: Pet Care Interactions - Bathing Interaction Story
// Basic cleanliness mechanics - bathing interaction and mood boost.
// Ready for expansion: bathing mini-game, water effects, bathing animations.

import { game } from '../Game'
import { GameModule } from '../Game'

export class BathModule implements GameModule {
  name = 'Bath'
  bathEntity: any = null // Will be the bath tub entity

  init() {
    console.log('🛁 Bath module initialized')
    // TODO: Find bath entity by name
    // this.bathEntity = engine.getEntityOrNullByName('Bath_Tub')
    this.setupInteractions()
  }

  update(dt: number) {
    // Handle any bath animations or water effects
  }

  onClick() {
    console.log('🛁 Bath clicked - bathing pet')
    this.bathePet()
  }

  private bathePet() {
    if (!game.state.pet) return

    // Trigger bathing in pet object
    game.bathePet()

    // Visual feedback - bubble particles
    this.spawnBubbleParticles()

    console.log('🛁 Pet bathed successfully')
  }

  private spawnBubbleParticles() {
    // TODO: Spawn blue bubble particles from bath
    // Rise up and pop effect
    console.log('🫧 Spawning bubble particles')
  }

  // Ready for expansion: bathing mini-game
  startBathingMiniGame() {
    // TODO: Player needs to click specific spots on pet
    // Progress bar fills as cleaning happens
    // Pet reacts to cleaning (happy animations)
    console.log('🛁 Starting bathing mini-game')
  }

  // Ready for expansion: water particle effects
  playWaterEffects() {
    // TODO: Water splash particles, ripples in bath
    console.log('💧 Playing water effects')
  }

  // Ready for expansion: bathing animations
  playBathingAnimation() {
    // TODO: Pet enters bath, sits down, splashing animations
    console.log('🛁 Playing bathing animation')
  }

  private setupInteractions() {
    // TODO: Register click handler with interaction service
    console.log('🛁 Bath interactions set up')
  }

  cleanup() {
    console.log('🛁 Bath module cleanup')
  }
}

