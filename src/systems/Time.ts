import { engine } from '@dcl/sdk/ecs'
import { PetComponent } from '../components/Pet'
import { GameState, GamePhase } from '../components/GameState'
import {
  TIME_UPDATE_INTERVAL,
  MOOD_DECAY_RATE,
  HUNGER_GROWTH_RATE,
  ENERGY_RECOVERY_RATE,
  MAX_MOOD,
  MAX_HUNGER,
  MAX_ENERGY,
  MIN_MOOD,
  MIN_HUNGER,
  MIN_ENERGY
} from '../utils/constants'

let timer = 0

export function timeSystem(dt: number) {
  timer += dt
  if (timer < TIME_UPDATE_INTERVAL) return // Run every TIME_UPDATE_INTERVAL seconds
  timer = 0

  // Decay logic
  for (const [entity] of engine.getEntitiesWith(PetComponent)) {
    const petData = PetComponent.getMutable(entity)

    // Mood decay
    if (petData.mood > MIN_MOOD) {
      petData.mood = Math.max(MIN_MOOD, petData.mood - MOOD_DECAY_RATE)
    }

    // Hunger growth
    if (petData.hunger < MAX_HUNGER) {
      petData.hunger = Math.min(MAX_HUNGER, petData.hunger + HUNGER_GROWTH_RATE)
    }

    // Energy recovery (when not playing, pet recovers energy)
    if (petData.energy < MAX_ENERGY) {
      petData.energy = Math.min(MAX_ENERGY, petData.energy + ENERGY_RECOVERY_RATE)
    }

    // console.log(`Time Update - Mood: ${petData.mood}, Hunger: ${petData.hunger}, Energy: ${petData.energy}`)
  }
}

/**
 * Reset the time system state
 * Called when resetting the game
 */
export function resetTimeSystem() {
  timer = 0
  console.log('Time system reset')
}
