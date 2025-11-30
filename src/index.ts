import { engine, PointerLock } from '@dcl/sdk/ecs'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { createGameEntity } from './factories/Game'
import { createEgg } from './factories/Pet'
import { createTechEnvironment } from './factories/Environment'
import { createBackgroundMusic } from './factories/Audio'
import { inputSystemCallback } from './systems/Input'
import { logicSystem } from './systems/Logic'
import { timeSystem } from './systems/Time'
import { renderSystem } from './systems/Render'
import { movementSystem } from './systems/Movement'
import { menuPositionSystem } from './systems/MenuPosition'
import { animationSystem } from './systems/Animation'
import { cursorFollowSystem } from './systems/CursorFollow'
// Tamagotchi systems
import { behaviorSystem } from './systems/Behavior'
import { bondSystem } from './systems/Bond'
import { hygieneSystem } from './systems/Hygiene'
import { poopSystem } from './systems/Poop'
import { heartParticleSystem } from './systems/HeartParticle'
import { namingSystem, NamingUI } from './factories/NamingUI'
import { StatsUI } from './factories/StatsUI'
// Persistence system
import { initPersistence, persistenceSystem } from './systems/Persistence'

// Combined UI renderer that shows all UI components
function CombinedUI() {
  return [NamingUI(), StatsUI()]
}

export function main() {
  // 1. Setup Core Systems
  engine.addSystem(inputSystemCallback)
  engine.addSystem(logicSystem)
  engine.addSystem(timeSystem)
  engine.addSystem(renderSystem)
  engine.addSystem(movementSystem) // Movement system closes menu when player walks away
  engine.addSystem(animationSystem) // After Movement so menu state changes are processed
  engine.addSystem(menuPositionSystem)
  engine.addSystem(cursorFollowSystem) // Cursor follow when camera is focused

  // 2. Setup Tamagotchi Systems (Personality & Care)
  engine.addSystem(behaviorSystem) // Pet autonomous movement
  engine.addSystem(bondSystem) // Bond decay and runaway
  engine.addSystem(hygieneSystem) // Cleanliness decay
  engine.addSystem(poopSystem) // Poop spawning and collection
  engine.addSystem(heartParticleSystem) // Heart particles when petting
  engine.addSystem(namingSystem) // Pet naming popup trigger

  // 3. Setup Persistence System
  engine.addSystem(persistenceSystem)
  initPersistence() // Initialize persistence

  // 4. Setup ReactECS UI (naming popup + debug stats)
  ReactEcsRenderer.setUiRenderer(CombinedUI)

  // 5. Initialize cursor state (locked by default)
  PointerLock.create(engine.CameraEntity, { isPointerLocked: true })

  // 6. Setup Scene
  createGameEntity()
  createBackgroundMusic()
  createTechEnvironment()
  createEgg()

  console.log('Holo Pet initialized with persistence (local scene → production Firebase)')
}
