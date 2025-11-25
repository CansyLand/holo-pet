import { engine, PointerLock } from '@dcl/sdk/ecs'
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

export function main() {
  // 1. Setup Systems
  engine.addSystem(inputSystemCallback)
  engine.addSystem(logicSystem)
  engine.addSystem(timeSystem)
  engine.addSystem(renderSystem)
  engine.addSystem(movementSystem) // Movement system closes menu when player walks away
  engine.addSystem(animationSystem) // After Movement so menu state changes are processed
  engine.addSystem(menuPositionSystem)

  // 2. Initialize cursor state (locked by default)
  PointerLock.create(engine.CameraEntity, { isPointerLocked: true }) // Lock the cursor by default otherwise fame crashes

  // 3. Setup Scene
  createGameEntity()
  createBackgroundMusic()
  createTechEnvironment()
  createEgg()
}
