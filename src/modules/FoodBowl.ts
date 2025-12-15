// EPIC: Pet Care Interactions - Feeding Interaction Story
// Basic feeding mechanics - hunger modification and visual feedback.
// Ready for expansion: multiple food types, feeding animations, pet preference system.

import { engine, pointerEventsSystem, InputAction, MeshCollider, ColliderLayer } from '@dcl/sdk/ecs'
import { game } from '../Game'
import { GameModule } from '../Game'
import { EntityNames } from '../../assets/scene/entity-names'

export class FoodBowlModule implements GameModule {
  name = 'FoodBowl'
  bowlEntity: any = null // Will be the food bowl entity

  init() {
    console.log('🍽️ Food bowl module initialized')
    this.bowlEntity = engine.getEntityOrNullByName(EntityNames.Food_Bowl)
    if (!this.bowlEntity) {
      console.error('🍽️ Food bowl entity not found!')
      return
    }

    // Add collider to make it clickable
    MeshCollider.setBox(this.bowlEntity, ColliderLayer.CL_POINTER)

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
    const particleModule = game.getModuleSafe('Particle') as any
    if (particleModule && this.bowlEntity) {
      particleModule.spawnParticles(this.bowlEntity, 'green')
    }
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
    pointerEventsSystem.onPointerDown(
      {
        entity: this.bowlEntity!,
        opts: { button: InputAction.IA_POINTER, hoverText: 'Feed Pet' }
      },
      () => {
        console.log('🍽️ Food bowl clicked - triggering feed!')
        this.onClick()
      }
    )

    console.log('🍽️ Food bowl interactions set up')
  }

  cleanup() {
    console.log('🍽️ Food bowl module cleanup')
  }
}
