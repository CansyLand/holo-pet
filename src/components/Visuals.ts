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

// Pet Animation State Component for tracking pet animation transitions
export const PetAnimationStateComponent = engine.defineComponent('PetAnimationStateComponent', {
  currentAnimation: Schemas.String, // Current clip name: 'Idle', 'Sitting', 'Standing'
  lastMenuVisible: Schemas.Boolean, // To detect menu visibility changes
  isTransitioning: Schemas.Boolean, // True when Standing is playing, waiting to transition to Idle
  transitionStartTime: Schemas.Number // Timestamp when Standing animation started
})

// Camera Focus Component for managing cursor state during camera focus
export const CameraFocusComponent = engine.defineComponent('CameraFocusComponent', {
  isCameraFocused: Schemas.Boolean,
  originalCursorLocked: Schemas.Optional(Schemas.Boolean) // Store original cursor state before focus
})
