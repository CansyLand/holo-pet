// 🚀 HOLO PET - MAIN ENTRY POINT
// This file contains both the modular architecture exports and the main application entry point.
// All modules are pluggable and the architecture is ready for Phase 2 implementation.

import { engine, PointerLock } from '@dcl/sdk/ecs'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { game } from './Game'
import { onPlayerDataReady } from './utils/playerUtils'
import { EggModule } from './modules/Egg'
import { NeedsBarsModule } from './modules/NeedsBars'
import { FoodBowlModule } from './modules/FoodBowl'
import { BathModule } from './modules/Bath'
import { BedModule } from './modules/Bed'
import { BallModule } from './modules/Ball'
import { DecorationModule } from './modules/Decoration'
import { PoopModule } from './modules/Poop'
import { ParticleModule } from './modules/Particle'
import { AvatarHiderModule } from './modules/AvatarHider'
import { QuestModule } from './modules/Quest'
import { PetModule } from './Pet'

// UI Components (will be implemented)
import { DebugUI } from './ui/DebugUI'
import { NamingUI } from './ui/Naming'
import { QuestUI } from './ui/Quest'

// Services
import { visibility } from './services/Visibility'
import { cursorFollowSystem } from './systems/CursorFollowSystem'
import { needsBarsSystem, initializeNeedsBarsSystem } from './modules/NeedsBars'
import { initPersistence, persistenceSystem } from './services/Persistence'

// Systems (legacy systems we'll keep for now)

// Combined UI renderer
function CombinedUI() {
  return [DebugUI(), NamingUI(), QuestUI()]
}

console.log('GAME STARTING')

// Register all modules with the game
export async function initializeGame() {
  console.log('🎮 Initializing Holo Pet - Modular Architecture')

  // Register pluggable modules
  game.registerModule(new EggModule())
  const needsBarsModule = new NeedsBarsModule()
  game.registerModule(needsBarsModule)
  initializeNeedsBarsSystem(needsBarsModule) // Initialize system reference
  game.registerModule(new FoodBowlModule())
  game.registerModule(new BathModule())
  game.registerModule(new BedModule())
  game.registerModule(new BallModule())
  game.registerModule(new DecorationModule())
  const poopModule = new PoopModule()
  game.registerModule(poopModule)
  game.registerPoopModule(poopModule)
  game.registerModule(new ParticleModule())
  game.registerModule(new AvatarHiderModule())
  game.registerModule(new QuestModule())
  game.registerModule(new PetModule())
  game.registerModule(new AvatarHiderModule())

  // Initialize all modules
  game.init()

  // Initialize visibility after modules are loaded (entities should be available now)
  console.log('🎮 Initializing visibility system after modules loaded')
  try {
    visibility.onGameStateChange({
      phase: game.state.phase,
      pet: game.state.pet,
      theme: game.state.theme
    })
    console.log('🎮 Visibility system initialized successfully')
  } catch (error) {
    console.error('🎮 Error initializing visibility system:', error)
  }

  console.log('✅ All modules registered and initialized')
  console.log(`📦 Total modules: ${game.modules.length}`)
  console.log('🎯 Ready for Phase 2: Module Implementation')
}

// Main application entry point (called by Decentraland)
export async function main() {
  // 1. Setup Core Systems
  // engine.addSystem(inputSystemCallback)
  // engine.addSystem(timeSystem)
  // engine.addSystem(renderSystem)
  // engine.addSystem(movementSystem)

  // 2. Initialize New Modular Game
  await initializeGame()

  // 2.3. Initialize Persistence System
  initPersistence()

  // 2.4. Load saved pet data after player data is ready
  onPlayerDataReady(async (userId: string) => {
    console.log('🎮 Player data ready, checking for saved pet data...')
    try {
      await game.loadSavedPet()
    } catch (error) {
      console.error('🎮 Error loading saved pet:', error)
    }
  })

  // 2.5. Add systems
  engine.addSystem(cursorFollowSystem)
  engine.addSystem(needsBarsSystem)
  engine.addSystem(persistenceSystem) // Handle failed save retries
  engine.addSystem((dt) => game.update(dt), 1, 'GameUpdateSystem')

  // 3. Setup ReactECS UI
  ReactEcsRenderer.setUiRenderer(CombinedUI)

  // 4. Setup Cursor State
  if (!PointerLock.getOrNull(engine.CameraEntity)) {
    PointerLock.create(engine.CameraEntity, { isPointerLocked: true })
  }

  console.log('🎮 Holo Pet initialized with new modular architecture!')
}

// Export everything for use in other parts of the game
export * from './Game'
export { Pet } from './Pet'
export * from './services/Visibility'
export * from './services/Interaction'
export * from './services/CameraFocus'
export * from './services/Pointer'
export * from './services/State'
