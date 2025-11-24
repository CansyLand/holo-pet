import { engine } from '@dcl/sdk/ecs'
import { createGameEntity } from './factories/Game'
import { createEgg } from './factories/Pet'
import { inputSystemCallback } from './systems/Input'
import { logicSystem } from './systems/Logic'
import { timeSystem } from './systems/Time'
import { renderSystem } from './systems/Render'
import { movementSystem } from './systems/Movement'
import { menuPositionSystem } from './systems/MenuPosition'

export function main() {
  // 1. Setup Systems
  engine.addSystem(inputSystemCallback)
  engine.addSystem(logicSystem)
  engine.addSystem(timeSystem)
  engine.addSystem(renderSystem)
  engine.addSystem(movementSystem)
  engine.addSystem(menuPositionSystem)
  
  // 2. Setup Scene
  createGameEntity()
  createEgg()
  
  console.log("Crystal Architecture Initialized")
}
