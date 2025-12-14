// EPIC: Game Flow Stories - New Player Onboarding, Pet Care Interactions, Daily Quest System
// This is the centerpiece of the Holo Pet game. It knows everything about the current game state
// and coordinates all the pluggable modules. Modules read game.state to know what to do.

export enum GamePhase {
  EGG = 'egg',
  HATCHING = 'hatching',
  PET = 'pet'
}

// Themes are cosmetic variations of the PET scene. They change colors and add decorations but don't affect gameplay.
// Will be implemented later. For now only default theme is available.
export enum Theme {
  DEFAULT = 'default',
  THEME_1 = 'theme_1',
  THEME_2 = 'theme_2'
}

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
export interface Pet {
  // This will be filled in when we create Pet.ts
}

// Import services and modules here (will be added as we create them)
// import { VisibilityManager } from './services/Visibility'
// import { InteractionManager } from './services/Interaction'
// import { FocusService } from './services/Focus'
// import { StateManager } from './services/State'

export class Game {
  // Current state - modules read this
  state: GameState = {
    phase: GamePhase.EGG,
    pet: null,
    theme: Theme.DEFAULT
  }

  // Modules register themselves
  modules: GameModule[] = []

  // Services (will be initialized when created)
  // visibility: VisibilityManager
  // interaction: InteractionManager
  // focus: FocusService
  // stateManager: StateManager

  constructor() {
    // Initialize services when they exist
    // this.visibility = new VisibilityManager()
    // this.interaction = new InteractionManager()
    // this.focus = new FocusService()
    // this.stateManager = new StateManager()
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

    // Notify modules of state change
    this.onStateChange(newState as GameState, oldState)
  }

  // Module coordination - called every frame
  update(dt: number) {
    // Update pet if we have one
    if (this.state.pet) {
      // this.state.pet.update(dt) // Will be implemented in Pet.ts
    }

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

    console.log('Egg hatching!')

    // Set hatching phase briefly for animations
    this.setState({ phase: GamePhase.HATCHING })

    // TODO: Play hatching animations

    // After animation, create pet and switch to pet phase
    // For tween animation check out the file dclcontext/Entity-Animation.md
    // I think we need a tewwn animation sequence for the egg
    // But alos this shoudl be handled in the egg file as egg stuff belogs into eg file
  }

  // Handle pet care interactions
  feedPet() {
    if (!this.state.pet) return
    // TODO: this.state.pet.feed()
  }

  petPet() {
    if (!this.state.pet) return
    // TODO: this.state.pet.pet()
  }

  playWithPet() {
    if (!this.state.pet) return
    // TODO: this.state.pet.play()
  }

  bathePet() {
    if (!this.state.pet) return
    // TODO: this.state.pet.bath()
  }

  putPetToSleep() {
    if (!this.state.pet) return
    // TODO: this.state.pet.sleep()
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
