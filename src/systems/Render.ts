import { engine, Transform, MeshRenderer } from '@dcl/sdk/ecs'
import { PetComponent } from '../components/Pet'
import { GameState } from '../components/GameState'

// We need a way to identify the mood bar.
// In a pure ECS, we might have a 'UIComponent' or tag.
// For this step, we'll define a simple tag component locally or export it if reused.
// Let's assume the UI Factory adds a specific tag/component or we store the reference.
// Since we don't have a 'UIComponent' yet, let's handle it by identifying the bar.

// Better approach: The 'MoodBar' entity should have a component that links it to the pet or just a 'MoodBar' tag.
// Let's modify the UI Factory plan to include a UI component later.
// For now, let's assume we can find the bar.

import { MoodBarComponent } from '../components/UIState'
import { MOOD_BAR_MAX_SCALE, MOOD_BAR_MIN_SCALE } from '../utils/constants'

export function renderSystem(dt: number) {
  // 1. Sync Mood Bar
  // Find the active pet to get mood
  let currentMood = 0
  let petCount = 0
  for (const [entity, pet] of engine.getEntitiesWith(PetComponent)) {
    currentMood = pet.mood
    petCount++
  }

  // Find mood bar and update scale
  let moodBarCount = 0
  for (const [entity, moodBar] of engine.getEntitiesWith(MoodBarComponent)) {
    moodBarCount++
    const transform = Transform.getMutable(entity)
    const percentage = currentMood / 100

    // Update scale (X axis scaling for width)
    const newScaleX = Math.max(MOOD_BAR_MIN_SCALE, percentage * MOOD_BAR_MAX_SCALE)
    transform.scale.x = newScaleX
  }

  // 2. Sync Animations (Future)
  // Check Pet State -> Play Animation
}
