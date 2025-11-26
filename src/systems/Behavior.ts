import { engine, Transform } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { PetComponent, PetState } from '../components/Pet'
import { PersonalityComponent, BondComponent, TrustLevel } from '../components/Personality'
import { HygieneComponent } from '../components/Hygiene'
import { MenuStateComponent } from '../components/UIState'
import {
  HUNGRY_THRESHOLD,
  NEEDS_BATH_THRESHOLD,
  BORED_THRESHOLD,
  PLAYER_PROXIMITY_RADIUS,
  PET_MOVE_SPEED,
  PET_WANDER_RADIUS,
  PET_APPROACH_DISTANCE,
  ENERGY_REST_THRESHOLD,
  SCENE_CENTER_X,
  SCENE_CENTER_Z
} from '../utils/constants'

// =============================================================================
// BEHAVIOR SYSTEM
// Personality-driven pet movement and autonomous behavior
// =============================================================================

// Behavior states for the pet
export enum BehaviorState {
  IDLE = 'idle',
  SEEKING_FOOD = 'seeking_food',
  SEEKING_BATH = 'seeking_bath',
  APPROACHING_PLAYER = 'approaching_player',
  WANDERING = 'wandering',
  SITTING = 'sitting',
  POOPING = 'pooping'
}

// Track behavior state per pet
const petBehaviorState: Map<number, {
  state: BehaviorState
  targetPosition: Vector3 | null
  idleTime: number
  lastStateChange: number
}> = new Map()

// Station positions (will be set by factories)
export const FOOD_BOWL_POSITION = Vector3.create(SCENE_CENTER_X - 2, 0.5, SCENE_CENTER_Z + 2)
export const BATHTUB_POSITION = Vector3.create(SCENE_CENTER_X + 4, 0.5, SCENE_CENTER_Z - 3)

export function behaviorSystem(dt: number) {
  // Skip if menu is open (pet should be sitting)
  for (const [_, menuState] of engine.getEntitiesWith(MenuStateComponent)) {
    if (menuState.isVisible) return
  }

  // Process each pet
  for (const [entity] of engine.getEntitiesWith(PetComponent, PersonalityComponent)) {
    const pet = PetComponent.get(entity)
    const personality = PersonalityComponent.get(entity)
    const transform = Transform.getMutableOrNull(entity)
    const hygiene = HygieneComponent.getOrNull(entity)
    const bond = BondComponent.getOrNull(entity)

    if (!transform) continue

    // Initialize behavior state if not exists
    if (!petBehaviorState.has(entity)) {
      petBehaviorState.set(entity, {
        state: BehaviorState.IDLE,
        targetPosition: null,
        idleTime: 0,
        lastStateChange: Date.now()
      })
    }

    const behaviorData = petBehaviorState.get(entity)!

    // Determine next behavior based on priority
    const newState = determineBehavior(pet, personality, hygiene, bond, behaviorData)

    // State changed - update target
    if (newState !== behaviorData.state) {
      behaviorData.state = newState
      behaviorData.lastStateChange = Date.now()
      behaviorData.targetPosition = getTargetPosition(newState, transform.position, personality)
    }

    // Execute current behavior
    executeBehavior(entity, transform, behaviorData, personality, dt)
  }
}

function determineBehavior(
  pet: ReturnType<typeof PetComponent.get>,
  personality: ReturnType<typeof PersonalityComponent.get>,
  hygiene: ReturnType<typeof HygieneComponent.getOrNull>,
  bond: ReturnType<typeof BondComponent.getOrNull>,
  currentData: { state: BehaviorState; idleTime: number }
): BehaviorState {
  // Priority 1: Hungry pet seeks food
  if (pet.hunger > HUNGRY_THRESHOLD) {
    return BehaviorState.SEEKING_FOOD
  }

  // Priority 2: Dirty pet seeks bath (modified by cleanliness trait)
  if (hygiene && hygiene.cleanliness < NEEDS_BATH_THRESHOLD) {
    // High cleanliness personality = more likely to seek bath
    const seekBathChance = personality.cleanliness / 100
    if (Math.random() < seekBathChance || hygiene.cleanliness < 20) {
      return BehaviorState.SEEKING_BATH
    }
  }

  // Priority 3: Social pet approaches player (if bond is high enough and has energy)
  if (bond && bond.trustLevel !== TrustLevel.STRANGER && pet.energy > ENERGY_REST_THRESHOLD) {
    const playerPos = getPlayerPosition()
    if (playerPos && isPlayerNearby(playerPos)) {
      // High sociability = more likely to approach
      const approachChance = personality.sociability / 100
      if (Math.random() < approachChance) {
        return BehaviorState.APPROACHING_PLAYER
      }
    }
  }

  // Priority 4: Energetic pet wanders when bored (and has energy)
  if (currentData.state === BehaviorState.IDLE && pet.energy > ENERGY_REST_THRESHOLD) {
    currentData.idleTime += 1
    if (currentData.idleTime > BORED_THRESHOLD) {
      // High energy = more likely to wander
      const wanderChance = personality.energy / 100
      if (Math.random() < wanderChance) {
        currentData.idleTime = 0
        return BehaviorState.WANDERING
      }
    }
  }

  // Default: Stay idle
  return BehaviorState.IDLE
}

function getTargetPosition(
  state: BehaviorState,
  currentPos: Vector3,
  personality: ReturnType<typeof PersonalityComponent.get>
): Vector3 | null {
  switch (state) {
    case BehaviorState.SEEKING_FOOD:
      // Position pet 1m in front of the food bowl (along the scene's forward direction)
      return Vector3.create(FOOD_BOWL_POSITION.x, FOOD_BOWL_POSITION.y, FOOD_BOWL_POSITION.z - 1.0)

    case BehaviorState.SEEKING_BATH:
      return BATHTUB_POSITION

    case BehaviorState.APPROACHING_PLAYER:
      const playerPos = getPlayerPosition()
      if (playerPos) {
        // Get position near player but not on top of them
        const direction = Vector3.subtract(currentPos, playerPos)
        const normalized = Vector3.normalize(direction)
        return Vector3.add(playerPos, Vector3.scale(normalized, PET_APPROACH_DISTANCE))
      }
      return null

    case BehaviorState.WANDERING:
      // Random position within wander radius from scene center
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * PET_WANDER_RADIUS
      return Vector3.create(
        SCENE_CENTER_X + Math.cos(angle) * radius,
        currentPos.y,
        SCENE_CENTER_Z + Math.sin(angle) * radius
      )

    default:
      return null
  }
}

function executeBehavior(
  entity: number,
  transform: ReturnType<typeof Transform.getMutable>,
  behaviorData: { state: BehaviorState; targetPosition: Vector3 | null; idleTime: number },
  personality: ReturnType<typeof PersonalityComponent.get>,
  dt: number
) {
  if (!behaviorData.targetPosition) {
    behaviorData.idleTime += dt
    return
  }

  const currentPos = transform.position
  const targetPos = behaviorData.targetPosition
  const distance = Vector3.distance(currentPos, targetPos)

  // Arrived at destination
  if (distance < 0.5) {
    behaviorData.state = BehaviorState.IDLE
    behaviorData.targetPosition = null
    behaviorData.idleTime = 0
    return
  }

  // Move toward target
  const direction = Vector3.normalize(Vector3.subtract(targetPos, currentPos))

  // Speed modified by energy trait
  const speedModifier = 0.5 + (personality.energy / 100) * 0.5
  const moveSpeed = PET_MOVE_SPEED * speedModifier * dt

  transform.position = Vector3.add(
    currentPos,
    Vector3.scale(direction, Math.min(moveSpeed, distance))
  )

  // Face movement direction
  if (direction.x !== 0 || direction.z !== 0) {
    const angle = Math.atan2(direction.x, direction.z)
    transform.rotation = { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) }
  }
}

function getPlayerPosition(): Vector3 | null {
  try {
    const playerTransform = Transform.get(engine.PlayerEntity)
    return playerTransform.position
  } catch {
    return null
  }
}

function isPlayerNearby(playerPos: Vector3): boolean {
  // Check if player is within proximity radius of scene center
  const distanceFromCenter = Vector3.distance(
    playerPos,
    Vector3.create(SCENE_CENTER_X, playerPos.y, SCENE_CENTER_Z)
  )
  return distanceFromCenter < PLAYER_PROXIMITY_RADIUS
}

// Export for other systems to check pet behavior
export function getPetBehaviorState(entity: number): BehaviorState | undefined {
  return petBehaviorState.get(entity)?.state
}

