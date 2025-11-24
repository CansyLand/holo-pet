import { engine, Transform } from '@dcl/sdk/ecs'
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

import { MoodBarComponent } from '../components/UIComponents' // We'll need to create this

export function renderSystem(dt: number) {
  // 1. Sync Mood Bar
  // Find the active pet to get mood
  let currentMood = 0
  for (const [entity, pet] of engine.getEntitiesWith(PetComponent)) {
    currentMood = pet.mood
  }

  // Find mood bar and update scale
  for (const [entity, moodBar] of engine.getEntitiesWith(MoodBarComponent)) {
    const transform = Transform.getMutable(entity)
    const percentage = currentMood / 100

    // Update scale (assuming X axis scaling)
    transform.scale.x = percentage * 1.5 // 1.5 is max width

    // Update position to keep left aligned (optional, same math as before)
    // Center X = -0.75 + (Width / 2)
    transform.position.x = -0.75 + (1.5 * percentage) / 2
  }

  // 2. Sync Animations (Future)
  // Check Pet State -> Play Animation
}
