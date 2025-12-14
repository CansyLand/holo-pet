// EPIC: Pet Care Interactions - Camera Focus System
// Components for managing camera focus state and cursor follow behavior.

import { Schemas, engine } from '@dcl/sdk/ecs'

/**
 * Tracks camera focus state for Focus Mode
 * Used to manage cursor lock/unlock during pet interaction
 */
export const CameraFocusComponent = engine.defineComponent('CameraFocusComponent', {
  isCameraFocused: Schemas.Boolean, // true when in Focus Mode
  originalCursorLocked: Schemas.Optional(Schemas.Boolean), // Restore cursor state when exiting
  virtualCameraEntity: Schemas.Optional(Schemas.Entity) // Reference to the virtual camera
})

/**
 * Tracks cursor follow state for pet interaction
 * Controls whether pet looks at cursor when camera is focused
 */
export const CursorFollowComponent = engine.defineComponent('CursorFollowComponent', {
  isActive: Schemas.Boolean, // Only active when camera is focused
  baseRotation: Schemas.Quaternion, // Store pet's original rotation
  maxTiltAngle: Schemas.Number // Max rotation angle (degrees)
})
