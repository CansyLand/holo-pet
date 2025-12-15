// EPIC: Game Flow Stories - New Player Onboarding, Pet Care Interactions, Daily Quest System
// This is the centerpiece of the Holo Pet game. It knows everything about the current game state
// and coordinates all the pluggable modules. Modules read game.state to know what to do.

import { engine, Entity } from '@dcl/sdk/ecs'
import { Pet, Species } from './Pet'
import { GameStateComponent, GamePhase, Theme } from './components/GameState'

export { GamePhase, Theme }

export interface GameState {
  phase: GamePhase
  pet: Pet | null
  theme: Theme
  // Add new state as needed
}

export interface GameModule {
  name: string
  init?: () => void
  update?: (dt: number) => void
  cleanup?: () => void
}

// Forward declaration for Pet (will be defined in Pet.ts)
// Pet class imported from ./Pet.ts - no forward declaration needed

// Import services and modules here (will be added as we create them)
import { visibility } from './services/Visibility'
import { pointer } from './services/Pointer'
// import { InteractionManager } from './services/Interaction'
// import { FocusService } from './services/Focus'
// import { StateManager } from './services/State'

export class Game {
  // Game entity that holds the global game state
  gameEntity: Entity

  // Current state - modules read this
  state: GameState = {
    phase: GamePhase.EGG,
    pet: null,
    theme: Theme.DEFAULT
  }

  // Modules register themselves
  modules: GameModule[] = []

  // Poop module reference (set when registered)
  poopModule: any = null

  constructor() {
    // Create the game entity that holds global state
    this.gameEntity = engine.addEntity()
    GameStateComponent.create(this.gameEntity, {
      phase: GamePhase.EGG,
      activePetEntity: undefined,
      theme: Theme.DEFAULT
    })

    // Note: Visibility initialization moved to initializeGame() after modules are loaded
    console.log('🎮 Game entity created with initial state')
  }

  // Register a module with the game
  registerModule(module: GameModule) {
    this.modules.push(module)
    console.log(`Module registered: ${module.name}`)
  }

  // Initialize all registered modules
  init() {
    for (const module of this.modules) {
      if (module.init) {
        module.init()
      }
    }
    console.log('All game modules initialized')
  }

  // State change notifications
  onStateChange(callback: (newState: GameState, oldState: GameState) => void) {
    // TODO: Implement state change notification system
    // This will notify modules when game state changes
  }

  // Update game state
  setState(newState: Partial<GameState>) {
    const oldState = { ...this.state }
    this.state = { ...this.state, ...newState }

    // Update the ECS component
    const gameStateComp = GameStateComponent.getMutable(this.gameEntity)
    gameStateComp.phase = this.state.phase
    gameStateComp.theme = this.state.theme
    if (this.state.pet) {
      // TODO: Set activePetEntity when we have pet entities
      // gameStateComp.activePetEntity = this.state.pet.entity
    }

    // Notify modules of state change
    this.notifyStateChange(newState as GameState, oldState)
  }

  private notifyStateChange(newState: GameState, oldState: GameState) {
    // Notify modules that care about state changes
    console.log(`🔄 Game state changed: ${oldState.phase} → ${newState.phase}`)

    // Update visibility based on new game state
    visibility.onGameStateChange({
      phase: newState.phase,
      pet: newState.pet,
      theme: newState.theme
    })
  }

  // Safe module access (avoids collection enumeration errors)
  getModuleSafe(name: string): GameModule | null {
    try {
      return this.modules.find((m) => m.name === name) || null
    } catch (error) {
      console.error('❌ Game.getModuleSafe error:', error)
      return null
    }
  }

  // Module coordination - called every frame
  update(dt: number) {
    // Modules handle pet.update(dt)
    // Update all registered modules
    for (const module of this.modules) {
      if (module.update) {
        module.update(dt)
      }
    }

    // Handle interactions (will use interaction service)
    this.handleInteractions()
  }

  // Handle player interactions
  private handleInteractions() {
    // TODO: Process interaction events using interaction service
    // This will replace the old logic system
  }

  // Transition from egg to pet phase
  hatchEgg() {
    if (this.state.phase !== GamePhase.EGG) return

    console.log('🥚 Egg hatching → directly to PET phase')

    // Create Pet DATA immediately
    const petData = new Pet(Species.TIGER)
    this.state.pet = petData

    // ASSIGN PET ENTITY (clean call to Pet class)
    Pet.assignEntityToPet(this.state.pet)

    // CREATE NEEDS BARS now that pet entity exists
    const needsModule = this.getModuleSafe('Needs') as any
    if (needsModule) {
      needsModule.createBarsWhenPetReady()
    }

    // Switch directly to PET (Visibility will hide egg/show pet scene)
    this.setState({ phase: GamePhase.PET })
    console.log('🐾 Pet DATA + phase=PET (scene switch triggered)')

    // Show naming UI
    import('./ui/Naming').then(({ showNamingUI }) => {
      showNamingUI((name: string) => {
        console.log(`🐾 Pet named: ${name}`)
        game.state.pet?.setName(name)
        pointer.restorePointerState()
      })
    })

    console.log('🐾 Direct to PET + naming complete!')
  }

  // Handle pet care interactions
  feedPet() {
    if (!this.state.pet) return
    this.state.pet.feed()
  }

  petPet() {
    if (!this.state.pet) return
    this.state.pet.pet()
  }

  playWithPet() {
    if (!this.state.pet) return
    this.state.pet.play()
  }

  bathePet() {
    if (!this.state.pet) return
    this.state.pet.bath()
  }

  putPetToSleep() {
    if (!this.state.pet) return
    this.state.pet.sleep()
  }

  // Get active poop count for DebugUI
  getActivePoopCount(): number {
    return this.poopModule ? this.poopModule.getActivePoopCount() : 0
  }

  // Force spawn poop for DebugUI
  forceSpawnPoop() {
    if (this.poopModule) {
      this.poopModule.forceSpawnPoop()
    }
  }

  // Register the poop module when it's added
  registerPoopModule(poopModule: any) {
    this.poopModule = poopModule
  }

  // Cleanup when game ends or resets
  cleanup() {
    for (const module of this.modules) {
      if (module.cleanup) {
        module.cleanup()
      }
    }
    console.log('Game cleanup completed')
  }
}

// Global game instance
export const game = new Game()
