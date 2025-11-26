import { Schemas, engine } from '@dcl/sdk/ecs'

// Background Music Component
// Tracks the background music entity for potential future control (volume, pause/resume)
export const BackgroundMusicComponent = engine.defineComponent('BackgroundMusicComponent', {
  musicEntity: Schemas.Entity // Reference to the entity with AudioSource
})





