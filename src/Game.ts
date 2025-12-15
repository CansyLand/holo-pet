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
import { updateCurrentPetMeta } from './services/Persistence'
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

    // Initialize pet immediately (but keep it hidden)
    this.initializePet()

    // Note: Visibility initialization moved to initializeGame() after modules are loaded
    console.log('🎮 Game entity created with initial state')
  }

  private initializePet() {
    // Create pet data immediately
    const petData = new Pet(Species.TIGER)
    this.state.pet = petData

    // Assign existing tiger entity to pet
    Pet.assignEntityToPet(this.state.pet)

    console.log('🐾 Pet initialized and hidden at game start')
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

    // Try to assign pet entity if not already assigned
    // This retries until the Tiger entity is available (loads asynchronously)
    if (this.state.pet && !this.state.pet.entity) {
      const assigned = Pet.assignEntityToPet(this.state.pet)
      if (assigned) {
        console.log('🐾 Pet entity assigned successfully (retry successful)')
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

    console.log('🥚 Egg hatching → show existing pet')

    // Ensure bars are created (they should already be from init, but just in case)
    const needsModule = this.getModuleSafe('Needs') as any
    if (needsModule) {
      needsModule.tryCreateBars()
      // 🔄 NEW: Show bars by default when entering PET phase
      needsModule.setVisible(true)
    }

    // Switch to PET phase (Visibility will hide egg/show pet scene)
    this.setState({ phase: GamePhase.PET })
    console.log('🐾 Pet revealed + phase=PET (scene switch triggered)')

    // Show naming UI (save is handled internally by the UI)
    import('./ui/Naming').then(({ showNamingUI }) => {
      showNamingUI((name: string) => {
        console.log(`🐾 Pet naming initiated: ${name}`)
        game.state.pet?.setName(name)
        // Note: Save is now handled by the NamingUI component
      })
    })

    console.log('🐾 Pet revealed + naming prompt shown!')
  }

  // Handle pet care interactions
  feedPet() {
    if (!this.state.pet) return
    this.state.pet.feed()

    // Check quest completion
    const questModule = this.getModuleSafe('Quest') as any
    if (questModule) {
      questModule.checkQuestCompletion('feed', this.state.pet.data)
    }
  }

  petPet() {
    if (!this.state.pet) return
    this.state.pet.pet()

    // Spawn heart particles
    const particleModule = this.getModuleSafe('Particle') as any
    if (particleModule && this.state.pet?.entity) {
      particleModule.spawnParticles(this.state.pet.entity, 'pink')
    }
  }

  playWithPet() {
    if (!this.state.pet) return
    this.state.pet.play()

    // Check quest completion
    const questModule = this.getModuleSafe('Quest') as any
    if (questModule) {
      questModule.checkQuestCompletion('play', this.state.pet.data)
    }
  }

  bathePet() {
    if (!this.state.pet) return
    this.state.pet.bath()

    // Check quest completion
    const questModule = this.getModuleSafe('Quest') as any
    if (questModule) {
      questModule.checkQuestCompletion('bath', this.state.pet.data, this.state.pet.data)
    }
  }

  putPetToSleep() {
    if (!this.state.pet) return
    this.state.pet.sleep()

    // Check bedtime quest completion
    const questModule = this.getModuleSafe('Quest') as any
    if (questModule) {
      questModule.checkQuestCompletion('bedtime', this.state.pet.data)
    }
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

  // Load saved pet data and switch to pet phase if pet exists
  // Uses quest mode deserialization (low levels for quest completion)
  async loadSavedPet(): Promise<boolean> {
    try {
      // Get wallet address (should be available now that player data is ready)
      const { getWalletAddress } = await import('./utils/wallet')
      const userId = getWalletAddress()

      if (!userId) {
        console.log('🐾 No wallet address available, cannot load saved pet')
        return false
      }

      console.log('🐾 Loading saved pet data for:', userId.slice(0, 10) + '...')

      // Dynamic import to avoid circular dependencies
      const { loadPet } = await import('./persistence/api')
      const savedData = await loadPet()

      if (savedData && savedData.meta.gamePhase === 'pet' && this.state.pet) {
        console.log('🐾 Found saved pet data, loading in quest mode...')

        // Update persistence system with current meta data
        updateCurrentPetMeta(savedData.meta)

        // Import serialization function
        const { deserializePetForQuestMode } = await import('./persistence/serialization')

        // Load pet data with LOW levels for quest completion
        const petData = deserializePetForQuestMode(savedData)

        // Apply to existing pet
        Object.assign(this.state.pet.data, petData)

        // Update pet name in UI/hover text
        this.state.pet.setName(petData.name)

        // Set owner ID from wallet
        const { getWalletAddress } = await import('./utils/wallet')
        this.state.pet.setOwner(getWalletAddress() || '')

        // Switch to PET phase (egg disappears, pet appears, bars auto-show)
        this.setState({ phase: GamePhase.PET })

        console.log('🐾 Pet loaded with low levels - ready for quests!')
        return true
      }

      console.log('🐾 No saved pet data found for this wallet, staying in egg phase')
      return false
    } catch (error) {
      console.error('🐾 Failed to load saved pet:', error)
      return false
    }
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
