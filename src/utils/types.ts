// Shared Type Definitions

import { Entity } from '@dcl/sdk/ecs'

// Common entity creation result types
export interface PetCreationResult {
  petEntity: Entity
  menuStateEntity: Entity
}

export interface MenuCreationResult {
  menuStateEntity: Entity
  menuRootEntity: Entity
  moodBarEntity: Entity
  petButtonEntity: Entity
  feedButtonEntity: Entity
  playButtonEntity: Entity
  closeButtonEntity: Entity
}

// Utility types for component queries
export type ComponentQuery<T> = [Entity, T]

// Position vector type (matching DCL SDK)
export interface Vector3 {
  x: number
  y: number
  z: number
}

// Color type (matching DCL SDK)
export interface Color4 {
  r: number
  g: number
  b: number
  a: number
}
