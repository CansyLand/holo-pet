import { engine, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { GameManager, GameState } from './GameManager'

// Timer for 1 second intervals
let timer = 0

export function moodSystem(dt: number) {
  const gameManager = GameManager.getInstance()

  // Only run if pet exists
  if (gameManager.currentState !== GameState.PET) return

  // Accumulate time
  timer += dt

  // Execute every 1 second (approx)
  if (timer >= 1.0) {
    timer = 0

    // Decay mood: 100 to 0 in 20 seconds -> 5 per second
    if (gameManager.mood > 0) {
      gameManager.mood = Math.max(0, gameManager.mood - 5)
      // console.log("Mood:", gameManager.mood)
    }
  }
}
