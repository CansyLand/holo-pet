import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { PetComponent } from '../components/Pet'
import { PoopComponent, PoopPoolManager } from '../components/Poop'
import {
  POOP_INTERVAL,
  POOP_CHANCE,
  POOP_MOOD_PENALTY,
  POOP_POOL_SIZE,
  POOLED_POSITION_Y,
  MIN_MOOD,
  SCENE_CENTER_X,
  SCENE_CENTER_Z
} from '../utils/constants'

// =============================================================================
// POOP SYSTEM
// Manages the poop entity pool and spawning
// Uses entity pooling pattern - never creates/destroys, only toggles
// =============================================================================

let timeSinceLastPoopCheck = 0

// Reference to the pool (set by PoopPool factory)
let poopPool: Entity[] = []
let poolManagerEntity: Entity | null = null

/**
 * Initialize the poop system with the pre-created pool
 * Called from PoopPool factory after entities are created
 */
export function initializePoopSystem(pool: Entity[], managerEntity: Entity) {
  poopPool = pool
  poolManagerEntity = managerEntity
  console.log(`Poop system initialized with ${pool.length} pooled entities`)
}

export function poopSystem(dt: number) {
  if (poopPool.length === 0 || !poolManagerEntity) return

  timeSinceLastPoopCheck += dt

  // Only check periodically
  if (timeSinceLastPoopCheck < POOP_INTERVAL) {
    // Still apply mood penalty from active poops
    applyPoopMoodPenalty()
    return
  }
  timeSinceLastPoopCheck = 0

  // Check if pet should poop
  for (const [petEntity] of engine.getEntitiesWith(PetComponent)) {
    const pet = PetComponent.get(petEntity)

    // Pet needs to have eaten something to poop (hunger > 30 means they've been eating)
    if (pet.hunger > 30) {
      // Random chance to poop
      if (Math.random() < POOP_CHANCE) {
        spawnPoop(petEntity)
      }
    }
  }
}

function spawnPoop(petEntity: Entity) {
  // Find an inactive poop from the pool
  const inactivePoop = findInactivePoop()
  if (!inactivePoop) {
    console.log('Poop pool exhausted - no more inactive poops available')
    return
  }

  // Get pet position
  const petTransform = Transform.getOrNull(petEntity)
  if (!petTransform) return

  // Position poop behind the pet
  const poopPosition = Vector3.create(
    petTransform.position.x - 0.5 + Math.random() * 0.3,
    0.1, // Slightly above ground
    petTransform.position.z - 0.5 + Math.random() * 0.3
  )

  // Activate the poop
  const poopData = PoopComponent.getMutable(inactivePoop)
  poopData.isActive = true
  poopData.spawnedAt = Date.now() / 1000

  // Move to visible position
  const poopTransform = Transform.getMutable(inactivePoop)
  poopTransform.position = poopPosition

  // Update pool manager
  if (poolManagerEntity) {
    const manager = PoopPoolManager.getMutable(poolManagerEntity)
    manager.activeCount++
    manager.lastPoopTime = Date.now() / 1000
  }

  console.log(`💩 Pet pooped! Active poops: ${getActivePoopCount()}`)
}

function findInactivePoop(): Entity | null {
  for (const entity of poopPool) {
    const poopData = PoopComponent.getOrNull(entity)
    if (poopData && !poopData.isActive) {
      return entity
    }
  }
  return null
}

/**
 * Collect a poop (hide it and return to pool)
 * Called when player clicks on poop with COLLECT_POOP interaction
 */
export function collectPoop(poopEntity: Entity) {
  const poopData = PoopComponent.getMutableOrNull(poopEntity)
  if (!poopData || !poopData.isActive) return

  // Deactivate the poop
  poopData.isActive = false
  poopData.spawnedAt = 0

  // Move to hidden position
  const poopTransform = Transform.getMutable(poopEntity)
  poopTransform.position = Vector3.create(SCENE_CENTER_X, POOLED_POSITION_Y, SCENE_CENTER_Z)

  // Update pool manager
  if (poolManagerEntity) {
    const manager = PoopPoolManager.getMutable(poolManagerEntity)
    manager.activeCount = Math.max(0, manager.activeCount - 1)
  }

  console.log(`🧹 Poop collected! Active poops: ${getActivePoopCount()}`)
}

function applyPoopMoodPenalty() {
  const activeCount = getActivePoopCount()
  if (activeCount === 0) return

  // Apply mood penalty to all pets based on active poop count
  for (const [petEntity] of engine.getEntitiesWith(PetComponent)) {
    const petData = PetComponent.getMutable(petEntity)
    const penalty = activeCount * POOP_MOOD_PENALTY * 0.1 // Small ongoing penalty
    petData.mood = Math.max(MIN_MOOD, petData.mood - penalty)
  }
}

/**
 * Get count of active (visible) poops
 */
export function getActivePoopCount(): number {
  let count = 0
  for (const entity of poopPool) {
    const poopData = PoopComponent.getOrNull(entity)
    if (poopData && poopData.isActive) {
      count++
    }
  }
  return count
}

/**
 * Get all active poop entities (for cleanup or iteration)
 */
export function getActivePoops(): Entity[] {
  const active: Entity[] = []
  for (const entity of poopPool) {
    const poopData = PoopComponent.getOrNull(entity)
    if (poopData && poopData.isActive) {
      active.push(entity)
    }
  }
  return active
}

/**
 * Force the pet to poop immediately (for debug UI)
 */
export function forcePoop() {
  if (poopPool.length === 0) {
    console.log('Cannot force poop - pool not initialized')
    return
  }

  // Find the pet and spawn poop
  for (const [petEntity] of engine.getEntitiesWith(PetComponent)) {
    spawnPoop(petEntity)
    return
  }
  console.log('Cannot force poop - no pet found')
}

