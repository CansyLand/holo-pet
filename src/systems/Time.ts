import { engine } from '@dcl/sdk/ecs'
import { PetComponent } from '../components/Pet'
import { GameState, GamePhase } from '../components/GameState'

let timer = 0

export function timeSystem(dt: number) {
  timer += dt
  if (timer < 1.0) return // Run every 1 second
  timer = 0

  // Decay logic
  for (const [entity] of engine.getEntitiesWith(PetComponent)) {
    const petData = PetComponent.getMutable(entity)

    // Mood decay
    if (petData.mood > 0) {
      petData.mood = Math.max(0, petData.mood - 1)
    }

    // Hunger growth
    if (petData.hunger < 100) {
      petData.hunger = Math.min(100, petData.hunger + 1)
    }

    // console.log(`Time Update - Mood: ${petData.mood}, Hunger: ${petData.hunger}`)
  }
}
