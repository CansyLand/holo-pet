// 🏗️ HOLO PET - MODULAR ARCHITECTURE SETUP COMPLETE
// This is the main entry point for the refactored game.
// All modules are now pluggable and the architecture is ready for Phase 2 implementation.

import { game } from './Game'
import { EggModule } from './modules/Egg'
import { NeedsModule } from './modules/Needs'
import { FoodBowlModule } from './modules/FoodBowl'
import { BathModule } from './modules/Bath'
import { BedModule } from './modules/Bed'
import { BallModule } from './modules/Ball'
import { DecorationModule } from './modules/Decoration'
import { PoopModule } from './modules/Poop'
import { HeartParticleModule } from './modules/HeartParticle'

// Register all modules with the game
export function initializeGame() {
  console.log('🎮 Initializing Holo Pet - Modular Architecture')

  // Register pluggable modules
  game.registerModule(new EggModule())
  game.registerModule(new NeedsModule())
  game.registerModule(new FoodBowlModule())
  game.registerModule(new BathModule())
  game.registerModule(new BedModule())
  game.registerModule(new BallModule())
  game.registerModule(new DecorationModule())
  game.registerModule(new PoopModule())
  game.registerModule(new HeartParticleModule())

  // Initialize all modules
  game.init()

  console.log('✅ All modules registered and initialized')
  console.log(`📦 Total modules: ${game.modules.length}`)
  console.log('🎯 Ready for Phase 2: Module Implementation')
}

// Export everything for use in main game file
export * from './Game'
export * from './Pet'
export * from './services/Visibility'
export * from './services/Interaction'
export * from './services/Focus'
export * from './services/State'
