// Movement system - movement, pathfinding, station navigation

import { Entity, engine, Transform } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import type { Pet } from '../Pet'
import { EntityNames } from '../../assets/scene/entity-names'
import * as animations from './animations'

// Simple movement towards target position
export function moveTowards(pet: Pet, targetPos: Vector3, dt: number): boolean {
  if (!pet.entity) return false

  const transform = Transform.getMutable(pet.entity)
  const currentPos = transform.position
  const distance = Vector3.distance(currentPos, targetPos)

  // Arrived at destination?
  if (distance < 0.5) {
    animations.playIdle(pet) // Stop moving, play idle
    return true // Signal we arrived
  }

  // Start walking animation if not already moving
  animations.playWalking(pet)

  // Simple lerp movement with tiredness modifier
  const baseSpeed = 2.0
  const tirednessModifier = Math.max(0.3, (pet.data.energy + pet.data.mood) / 200) // 0.3 to 1.0 based on average mood/energy
  const moveSpeed = baseSpeed * tirednessModifier * dt // Units per second
  const direction = Vector3.normalize(Vector3.subtract(targetPos, currentPos))

  transform.position = Vector3.add(currentPos, Vector3.scale(direction, Math.min(moveSpeed, distance)))

  // Face movement direction
  faceDirection(pet, direction)

  return false // Still moving
}

// Generic station movement (replaces 7 duplicate methods)
export function moveToStation(pet: Pet, entityName: string, dt: number): boolean {
  const targetPos = getStationPosition(entityName)
  if (!targetPos) return true // Can't find station, consider arrived
  return moveTowards(pet, targetPos, dt)
}

// Get position of a station entity
export function getStationPosition(entityName: string): Vector3 | null {
  const entity = engine.getEntityOrNullByName(entityName)
  if (!entity) return null

  try {
    const transform = Transform.get(entity)
    return transform.position
  } catch {
    return null
  }
}

// Get random poop position from the 7 available poop entities
export function getRandomPoopPosition(): Vector3 | null {
  const poopNames = [
    EntityNames.Poop_1,
    EntityNames.Poop_2,
    EntityNames.Poop_3,
    EntityNames.Poop_4,
    EntityNames.Poop_5,
    EntityNames.Poop_6,
    EntityNames.Poop_7
  ]

  // Pick a random poop entity
  const randomPoop = poopNames[Math.floor(Math.random() * poopNames.length)]
  return getStationPosition(randomPoop)
}

// Face a direction (simple XZ plane rotation)
export function faceDirection(pet: Pet, direction: Vector3) {
  if (!pet.entity || (direction.x === 0 && direction.z === 0)) return

  const angle = Math.atan2(direction.x, direction.z)
  const transform = Transform.getMutable(pet.entity)
  transform.rotation = Quaternion.fromEulerDegrees(0, (angle * 180) / Math.PI, 0)
}

// Get distance to player
export function getPlayerDistance(pet: Pet): number {
  const playerPos = Transform.get(engine.PlayerEntity).position
  const petPos = pet.entity ? Transform.get(pet.entity).position : pet.data.position
  return Vector3.distance(playerPos, petPos)
}

// Look at player when nearby
export function lookAtPlayer(pet: Pet) {
  if (!pet.entity) return
  const playerPos = Transform.get(engine.PlayerEntity).position
  const petTransform = Transform.getMutable(pet.entity)
  const direction = Vector3.subtract(playerPos, petTransform.position)
  petTransform.rotation = Quaternion.lookRotation(direction)
}

// Follow player behavior
export function followPlayer(pet: Pet, dt: number) {
  const playerPos = Transform.get(engine.PlayerEntity).position
  if (!pet.entity) return

  const transform = Transform.getMutable(pet.entity)
  const currentPos = transform.position
  const distance = Vector3.distance(currentPos, playerPos)

  // Don't get too close - stop at a comfortable distance
  if (distance < 2.0) {
    // Close enough - just face the player
    lookAtPlayer(pet)
    return
  }

  // Move towards player
  moveTowards(pet, playerPos, dt)
}

// Move towards cached poop position
export function moveTowardsPoop(pet: Pet, dt: number): boolean {
  // Cache the poop position when first starting to seek poop
  if (!pet.data.cachedPoopPosition) {
    pet.data.cachedPoopPosition = getRandomPoopPosition()
    if (!pet.data.cachedPoopPosition) return true // Can't find any poop
  }

  return moveTowards(pet, pet.data.cachedPoopPosition, dt)
}
