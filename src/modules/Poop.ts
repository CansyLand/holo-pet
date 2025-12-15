// EPIC: Pet Care Interactions - Autonomous Pet Behavior
// All poop mechanics together - spawning, collection, visual effects, cleanliness impact.
// Consolidates all poop-related code that was scattered before.

import { engine, Entity, pointerEventsSystem, InputAction } from '@dcl/sdk/ecs'
import { game, GameModule } from '../Game'
import { GamePhase } from '../components/GameState'
import { EntityNames } from '../../assets/scene/entity-names'
import { visibility } from '../services/Visibility'

export class PoopModule implements GameModule {
  name = 'Poop'
  poopEntities: Entity[] = []
  activePoops: Entity[] = []
  maxPoops = 7
  lastSpawnTime = 0
  spawnInterval = 5000 // 30 seconds for testing, can adjust to 10-60 seconds

  init() {
    console.log('💩 Poop module initialized')
    this.initializePoopEntities()
    this.setupPointerEvents()
  }

  update(dt: number) {
    // Only spawn poop when in pet phase
    if (game.state.phase === GamePhase.PET) {
      this.handlePoopSpawning(dt)
    }
  }

  // Spawn poop automatically based on time
  private handlePoopSpawning(dt: number) {
    if (!game.state.pet) return

    const now = Date.now()
    if (now - this.lastSpawnTime > this.spawnInterval) {
      this.spawnPoop()
      this.lastSpawnTime = now
      // Randomize next spawn interval (10-60 seconds)
      this.spawnInterval = 10000 + Math.random() * 50000
    }
  }

  // Manual spawn function (called from DebugUI)
  forceSpawnPoop() {
    if (game.state.phase === GamePhase.PET) {
      this.spawnPoop()
    }
  }

  // Spawn a single poop at random position
  private spawnPoop() {
    if (this.activePoops.length >= this.maxPoops) {
      console.log('💩 Max poops reached, not spawning more')
      return
    }

    // Find an available poop entity
    const availablePoop = this.poopEntities.find((poop) => !this.activePoops.includes(poop))
    if (!availablePoop) {
      console.log('💩 No available poop entities')
      return
    }

    // Add to active poops and show it
    this.activePoops.push(availablePoop)
    visibility.showEntity(availablePoop)

    // Make pet dirty when poop appears
    if (game.state.pet) {
      game.state.pet.data.cleanliness = Math.max(0, game.state.pet.data.cleanliness - 10)
      console.log(`💩 Pet got dirty! Cleanliness reduced by 10, now: ${game.state.pet.data.cleanliness}`)
    }

    console.log(`💩 Spawned poop, active count: ${this.activePoops.length}`)
  }

  // Collect poop when clicked
  onPoopClick(poopEntity: Entity) {
    console.log('💩 Poop clicked - collecting')
    this.collectPoop(poopEntity)
  }

  private collectPoop(poopEntity: Entity) {
    // Hide the poop
    visibility.hideEntity(poopEntity)

    // Remove from active poops
    this.activePoops = this.activePoops.filter((poop) => poop !== poopEntity)

    // Boost pet mood and cleanliness
    if (game.state.pet) {
      game.state.pet.data.mood = Math.min(100, game.state.pet.data.mood + 5)
      game.state.pet.data.cleanliness = Math.min(100, game.state.pet.data.cleanliness + 10)
      game.state.pet.recordInteraction()
    }

    console.log('💩 Poop collected successfully')
  }

  // Get count of active poops (for DebugUI)
  getActivePoopCount(): number {
    return this.activePoops.length
  }

  // Hide all poops (for environment switching)
  hideAllPoops() {
    this.activePoops.forEach((entity) => {
      visibility.hideEntity(entity)
    })
    this.activePoops = []
    console.log('💩 All poops hidden')
  }

  // Setup click interactions for all poop entities
  private setupPointerEvents() {
    this.poopEntities.forEach((poopEntity) => {
      pointerEventsSystem.onPointerDown(
        {
          entity: poopEntity,
          opts: { button: InputAction.IA_POINTER, hoverText: 'Collect Poop' }
        },
        () => {
          this.onPoopClick(poopEntity)
        }
      )
    })
    console.log('💩 Poop pointer events set up')
  }

  // Initialize poop entity references
  private initializePoopEntities() {
    // Get all poop entities by name
    this.poopEntities = [
      EntityNames.Poop_1,
      EntityNames.Poop_2,
      EntityNames.Poop_3,
      EntityNames.Poop_4,
      EntityNames.Poop_5,
      EntityNames.Poop_6,
      EntityNames.Poop_7
    ]
      .map((name) => engine.getEntityOrNullByName(name))
      .filter(Boolean) as Entity[]

    console.log(`💩 Initialized ${this.poopEntities.length} poop entities`)
  }

  // Easy to remove: comment out one import, game still works
  cleanup() {
    console.log('💩 Poop module cleanup')
    this.hideAllPoops()
  }
}
