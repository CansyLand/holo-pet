import { Schemas, engine } from '@dcl/sdk/ecs'

// UI Visual Components
export const MoodBarComponent = engine.defineComponent('MoodBarComponent', {
  targetPet: Schemas.Entity // Optional: link to specific pet if multiple
})

export const MenuStateComponent = engine.defineComponent('MenuStateComponent', {
  isVisible: Schemas.Boolean,
  petEntity: Schemas.Entity,
  menuRootEntity: Schemas.Entity,
  virtualCameraEntity: Schemas.Optional(Schemas.Entity)
})

export const MenuElementComponent = engine.defineComponent('MenuElementComponent', {
  menuStateEntity: Schemas.Entity // Reference to the menu state this element belongs to
})

// Visual Feedback Components (for animations, particles, etc.)
export const MoodFeedbackComponent = engine.defineComponent('MoodFeedbackComponent', {
  particleEntity: Schemas.Optional(Schemas.Entity), // Associated particle effect
  animationState: Schemas.String, // Current animation name
  lastFeedbackTime: Schemas.Number // Timestamp for cooldowns
})

export const AnimationComponent = engine.defineComponent('AnimationComponent', {
  currentAnimation: Schemas.String,
  isPlaying: Schemas.Boolean,
  loop: Schemas.Boolean,
  speed: Schemas.Number
})
