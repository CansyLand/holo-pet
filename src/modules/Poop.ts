// EPIC: Pet Care Interactions - Autonomous Pet Behavior
// All poop mechanics together - spawning, collection, visual effects, cleanliness impact.
// Consolidates all poop-related code that was scattered before.

import { game } from '../Game'
import { GameModule } from '../Game'
import { visibility } from '../services/Visibility'

export class PoopModule implements GameModule {
  name = 'Poop'
  poopEntities: any[] = [] // Array of poop entities
  maxPoops = 7 // Maximum number of poop entities

  init() {
    console.log('💩 Poop module initialized')
    this.initializePoopEntities()
  }

  update(dt: number) {
    // Handle poop spawning based on pet stats
    this.handlePoopSpawning(dt)

    // Handle any poop animations or effects
  }

  // Spawn poop when pet gets too dirty
  private handlePoopSpawning(dt: number) {
    if (!game.state.pet) return

    // TODO: Check pet cleanliness and spawn poop periodically
    // TODO: Use random positions near pet
    // TODO: Don't exceed maxPoops
  }

  // Collect poop when clicked
  onPoopClick(poopEntity: any) {
    console.log('💩 Poop clicked - collecting')
    this.collectPoop(poopEntity)
  }

  private collectPoop(poopEntity: any) {
    // Hide the poop
    visibility.hideEntity(poopEntity)

    // Boost pet mood and cleanliness
    if (game.state.pet) {
      game.state.pet.data.mood = Math.min(100, game.state.pet.data.mood + 5)
      game.state.pet.data.cleanliness = Math.min(100, game.state.pet.data.cleanliness + 10)
      game.state.pet.recordInteraction()
    }

    // TODO: Play collection sound
    // TODO: Spawn positive particles

    console.log('💩 Poop collected successfully')
  }

  // Hide all poops (for environment switching)
  hideAllPoops() {
    this.poopEntities.forEach((entity) => {
      visibility.hideEntity(entity)
    })
    console.log('💩 All poops hidden')
  }

  // Show all active poops
  showActivePoops() {
    // TODO: Show only poops that should be visible
    console.log('💩 Active poops shown')
  }

  // Get random spawn position near pet
  private getRandomPoopPosition(): any {
    if (!game.state.pet) return { x: 0, y: 0, z: 0 }

    const petPos = game.state.pet.data.position
    // TODO: Add random offset around pet position
    return {
      x: petPos.x + (Math.random() - 0.5) * 4,
      y: petPos.y,
      z: petPos.z + (Math.random() - 0.5) * 4
    }
  }

  // Initialize poop entity references
  private initializePoopEntities() {
    // TODO: Find all poop entities by name (Poop_1 through Poop_7)
    // this.poopEntities = ['Poop_1', 'Poop_2', ...].map(name =>
    //   engine.getEntityOrNullByName(name)
    // ).filter(Boolean)

    console.log('💩 Poop entities initialized')
  }

  // Easy to remove: comment out one import, game still works
  cleanup() {
    console.log('💩 Poop module cleanup')
    this.hideAllPoops()
  }
}
