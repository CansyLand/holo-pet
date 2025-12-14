// EPIC: Pet Care Interactions - Feeding Interaction Story
// Basic feeding mechanics - hunger modification and visual feedback.
// Ready for expansion: multiple food types, feeding animations, pet preference system.

import { engine } from '@dcl/sdk/ecs'
import { game } from '../Game'
import { GameModule } from '../Game'

export class FoodBowlModule implements GameModule {
  name = 'FoodBowl'
  bowlEntity: any = null // Will be the food bowl entity

  init() {
    console.log('🍽️ Food bowl module initialized')
    this.bowlEntity = engine.getEntityOrNullByName('Food_Bowl')
    this.setupInteractions()
  }

  update(dt: number) {
    // Handle any bowl animations or effects
  }

  onClick() {
    console.log('🍽️ Food bowl clicked - feeding pet')
    this.feedPet()
  }

  private feedPet() {
    if (!game.state.pet) return

    // Trigger feeding in pet object
    game.feedPet()

    // Visual feedback - particles from bowl
    this.spawnFoodParticles()

    console.log('🍽️ Pet fed successfully')
  }

  private spawnFoodParticles() {
    // TODO: Spawn food particles from bowl
    // Similar to pet/bath particles but different color (maybe brown/orange)
    console.log('✨ Spawning food particles')
  }

  // Ready for expansion: multiple food types
  feedSpecialFood(foodType: string) {
    // TODO: Different foods with different stat effects
    // Premium food: more mood boost
    // Treat: less hunger reduction, more bond
    // Medicine: cleanliness boost
    console.log(`🍽️ Feeding special food: ${foodType}`)
  }

  // Ready for expansion: feeding animations
  playFeedingAnimation() {
    // TODO: Pet walks to bowl, eating animation, bowl empties slightly
    console.log('🍽️ Playing feeding animation')
  }

  // Ready for expansion: pet preference system
  getPetFoodPreference(): string {
    // TODO: Based on pet personality, return preferred food type
    return 'standard' // Placeholder
  }

  private setupInteractions() {
    // TODO: Register click handler with interaction service
    console.log('🍽️ Food bowl interactions set up')
  }

  cleanup() {
    console.log('🍽️ Food bowl module cleanup')
  }
}
