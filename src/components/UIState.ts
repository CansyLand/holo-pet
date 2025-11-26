import { Schemas, engine } from '@dcl/sdk/ecs'

// =============================================================================
// UI STATE COMPONENTS
// Components that track the state of UI elements, menus, and interaction modes
// =============================================================================

// -----------------------------------------------------------------------------
// Menu Components
// -----------------------------------------------------------------------------

/**
 * Tracks the state of a pet's interaction menu (Focus Mode)
 * Created per-pet to manage their individual menu visibility
 */
export const MenuStateComponent = engine.defineComponent('MenuStateComponent', {
  isVisible: Schemas.Boolean,                          // true = Focus Mode, false = Idle Mode
  petEntity: Schemas.Entity,                           // The pet this menu belongs to
  menuRootEntity: Schemas.Entity,                      // Root entity for menu positioning
  virtualCameraEntity: Schemas.Optional(Schemas.Entity) // Camera used during Focus Mode
})

/**
 * Tags an entity as part of a menu (buttons, bars, etc.)
 * Used to show/hide all menu elements together
 */
export const MenuElementComponent = engine.defineComponent('MenuElementComponent', {
  menuStateEntity: Schemas.Entity // Reference to the MenuStateComponent this element belongs to
})

/**
 * Mood bar UI element - scales based on pet mood
 */
export const MoodBarComponent = engine.defineComponent('MoodBarComponent', {
  targetPet: Schemas.Entity // The pet whose mood this bar displays
})

// -----------------------------------------------------------------------------
// Camera & Interaction State
// -----------------------------------------------------------------------------

/**
 * Tracks camera focus state for Focus Mode
 * Used to manage cursor lock/unlock during pet interaction
 */
export const CameraFocusComponent = engine.defineComponent('CameraFocusComponent', {
  isCameraFocused: Schemas.Boolean,                      // true when in Focus Mode
  originalCursorLocked: Schemas.Optional(Schemas.Boolean) // Restore cursor state when exiting
})

// -----------------------------------------------------------------------------
// Animation State
// -----------------------------------------------------------------------------

/**
 * Tracks pet animation state for smooth transitions
 * Handles Idle <-> Sitting transitions when entering/exiting Focus Mode
 */
export const PetAnimationStateComponent = engine.defineComponent('PetAnimationStateComponent', {
  currentAnimation: Schemas.String,   // Current clip: 'Idle', 'Sitting', 'Standing'
  lastMenuVisible: Schemas.Boolean,   // Detects menu visibility changes
  isTransitioning: Schemas.Boolean,   // True during Standing animation
  transitionStartTime: Schemas.Number // When Standing animation started
})

/**
 * Generic animation component for any animated entity
 */
export const AnimationComponent = engine.defineComponent('AnimationComponent', {
  currentAnimation: Schemas.String,
  isPlaying: Schemas.Boolean,
  loop: Schemas.Boolean,
  speed: Schemas.Number
})

// -----------------------------------------------------------------------------
// Visual Feedback
// -----------------------------------------------------------------------------

/**
 * Visual feedback for mood changes (particles, animations)
 */
export const MoodFeedbackComponent = engine.defineComponent('MoodFeedbackComponent', {
  particleEntity: Schemas.Optional(Schemas.Entity), // Associated particle effect
  animationState: Schemas.String,                    // Current animation name
  lastFeedbackTime: Schemas.Number                   // Timestamp for cooldowns
})



