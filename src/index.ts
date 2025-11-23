import { engine } from '@dcl/sdk/ecs'
import { createEgg } from './components/Egg'
import { interactionSystem } from './systems/InteractionSystem'
import { moodSystem } from './systems/MoodSystem'
import { updateMoodBarSystem } from './components/PetMenu'

export function main() {
  // 1. Setup Systems
  engine.addSystem(interactionSystem)
  engine.addSystem(moodSystem)
  engine.addSystem(updateMoodBarSystem)
  
  // 2. Setup Scene
  createEgg()
}
