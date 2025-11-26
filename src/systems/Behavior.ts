import { engine, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { PetComponent } from '../components/Pet'
import { PersonalityComponent, BondComponent, TrustLevel } from '../components/Personality'
import { HygieneComponent } from '../components/Hygiene'
import { MenuStateComponent } from '../components/UIState'
import { STATION_POSITIONS } from '../factories/Station'
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
  SCENE_CENTER_Z,
  BEHAVIOR_COMMITMENT_TIME,
  PLAYER_IDLE_PREFERENCE_TIME,
  PLAY_AREA_POSITION_X,
  PLAY_AREA_POSITION_Z,
  FOLLOW_THINKING_DELAY,
  FOLLOW_UPDATE_INTERVAL,
  FOLLOW_HYSTERESIS_DISTANCE
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
  SEEKING_PREFERRED = 'seeking_preferred', // New: personality-based preference
  APPROACHING_PLAYER = 'approaching_player',
  WANDERING = 'wandering',
  SITTING = 'sitting',
  POOPING = 'pooping',
  WAITING_AT_STATION = 'waiting_at_station' // Sitting at station until need is satisfied
}

// Station types the pet can wait at
export enum WaitingStationType {
  FOOD = 'food',
  BATH = 'bath',
  NONE = 'none'
}

// Preferred activity types based on personality
enum PreferredActivity {
  FOOD = 'food',
  BATH = 'bath',
  PLAY = 'play'
}

// Track behavior state per pet
const petBehaviorState: Map<
  number,
  {
    state: BehaviorState
    targetPosition: Vector3 | null
    idleTime: number
    lastStateChange: number
    commitmentEndTime: number // Timestamp when commitment expires
    playerIdleTime: number // Accumulated time without player nearby/interaction
    preferredActivity: PreferredActivity | null // Cached preferred activity
    // Following behavior tracking
    followThinkingStart: number // When pet started "thinking" about following
    followLastUpdate: number // Last time follow target was updated
    followLastPlayerPos: Vector3 | null // Last known player position for hysteresis
    // Station waiting behavior
    waitingStationType: WaitingStationType // Which station type pet is waiting at
    shouldFacePlayer: boolean // 50/50 decision for facing player, set once per wait session
  }
> = new Map()

// Station positions (using imported values from Station.ts)
export const FOOD_BOWL_POSITION = STATION_POSITIONS.FOOD_BOWL
export const BATHTUB_POSITION = STATION_POSITIONS.BATHTUB
export const PLAY_AREA_POSITION = Vector3.create(PLAY_AREA_POSITION_X, 0.5, PLAY_AREA_POSITION_Z)

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
        lastStateChange: Date.now(),
        commitmentEndTime: 0,
        playerIdleTime: 0,
        preferredActivity: null,
        followThinkingStart: 0,
        followLastUpdate: 0,
        followLastPlayerPos: null,
        waitingStationType: WaitingStationType.NONE,
        shouldFacePlayer: false
      })
    }

    const behaviorData = petBehaviorState.get(entity)!
    const now = Date.now()

    // Track player idle time (when player is nearby but pet is just idling)
    const playerPos = getPlayerPosition()
    const playerNearby = playerPos !== null && isPlayerNearby(playerPos)

    if (playerNearby && behaviorData.state === BehaviorState.IDLE) {
      // Player is nearby and pet is idle - accumulate idle time
      behaviorData.playerIdleTime += dt
    } else if (!playerNearby) {
      // Player left the area - also accumulate (they're not interacting)
      behaviorData.playerIdleTime += dt
    }
    // Note: playerIdleTime is reset when pet starts a new activity

    // Determine next behavior based on priority
    const newState = determineBehavior(
      pet,
      personality,
      hygiene,
      bond,
      behaviorData,
      now,
      playerNearby,
      transform.position
    )

    // State changed - update target and set commitment
    if (newState !== behaviorData.state) {
      behaviorData.state = newState
      behaviorData.lastStateChange = now
      behaviorData.commitmentEndTime = now + BEHAVIOR_COMMITMENT_TIME * 1000
      behaviorData.targetPosition = getTargetPosition(
        newState,
        transform.position,
        personality,
        behaviorData.preferredActivity
      )
      behaviorData.idleTime = 0 // Reset idle time when starting new behavior

      // Reset player idle time when pet starts moving (they're doing something)
      if (newState !== BehaviorState.IDLE) {
        behaviorData.playerIdleTime = 0
      }

      // Reset following timers when not approaching player
      if (newState !== BehaviorState.APPROACHING_PLAYER) {
        behaviorData.followThinkingStart = 0
        behaviorData.followLastPlayerPos = null
      }
    }

    // Execute current behavior
    executeBehavior(entity, transform, behaviorData, personality, dt, now)
  }
}

/**
 * Get the pet's preferred activity based on its highest personality trait
 */
function getPreferredActivity(personality: ReturnType<typeof PersonalityComponent.get>): PreferredActivity {
  const traits = {
    [PreferredActivity.FOOD]: personality.appetite,
    [PreferredActivity.BATH]: personality.cleanliness,
    [PreferredActivity.PLAY]: personality.energy
  }

  let highest = PreferredActivity.PLAY
  let highestValue = 0

  for (const [activity, value] of Object.entries(traits)) {
    if (value > highestValue) {
      highestValue = value
      highest = activity as PreferredActivity
    }
  }

  return highest
}

function determineBehavior(
  pet: ReturnType<typeof PetComponent.get>,
  personality: ReturnType<typeof PersonalityComponent.get>,
  hygiene: ReturnType<typeof HygieneComponent.getOrNull>,
  bond: ReturnType<typeof BondComponent.getOrNull>,
  currentData: {
    state: BehaviorState
    idleTime: number
    commitmentEndTime: number
    playerIdleTime: number
    preferredActivity: PreferredActivity | null
    followThinkingStart: number
    followLastUpdate: number
    followLastPlayerPos: Vector3 | null
    waitingStationType: WaitingStationType
    shouldFacePlayer: boolean
  },
  now: number,
  playerNearby: boolean,
  currentPos: Vector3
): BehaviorState {
  // ==========================================================================
  // WAITING AT STATION CHECK: Stay waiting until need is satisfied
  // ==========================================================================
  if (currentData.state === BehaviorState.WAITING_AT_STATION) {
    // Check if need is satisfied and we can exit waiting state
    if (currentData.waitingStationType === WaitingStationType.FOOD) {
      // Exit food station if hunger is below threshold
      if (pet.hunger < HUNGRY_THRESHOLD) {
        currentData.waitingStationType = WaitingStationType.NONE
        return BehaviorState.IDLE
      }
      // Still hungry - keep waiting
      return BehaviorState.WAITING_AT_STATION
    } else if (currentData.waitingStationType === WaitingStationType.BATH) {
      // Exit bath station if cleanliness is above threshold
      if (hygiene && hygiene.cleanliness >= NEEDS_BATH_THRESHOLD) {
        currentData.waitingStationType = WaitingStationType.NONE
        return BehaviorState.IDLE
      }
      // Still dirty - keep waiting
      return BehaviorState.WAITING_AT_STATION
    }
  }
  // ==========================================================================
  // CRITICAL OVERRIDE: Very hungry pet seeks food (unless already at food station)
  // ==========================================================================
  if (pet.hunger > HUNGRY_THRESHOLD) {
    // If already at food station, stay idle and wait for player to feed
    if (!isNearFoodStation(currentPos)) {
      return BehaviorState.SEEKING_FOOD
    }
    // Already at food station - stay idle (will face player when they approach)
  }

  // ==========================================================================
  // COMMITMENT CHECK: If committed to current behavior, don't change
  // ==========================================================================
  if (now < currentData.commitmentEndTime && currentData.state !== BehaviorState.IDLE) {
    return currentData.state
  }

  // ==========================================================================
  // PRIORITY ORDER (only evaluated when commitment expired)
  // ==========================================================================

  // Priority 1: Dirty pet seeks bath (modified by cleanliness trait)
  if (hygiene && hygiene.cleanliness < NEEDS_BATH_THRESHOLD) {
    // High cleanliness personality = always seeks bath when dirty
    // Low cleanliness personality = only seeks bath when very dirty (<20)
    if (personality.cleanliness >= 40 || hygiene.cleanliness < 20) {
      // If already at bath station, stay idle and wait for player
      if (!isNearBathStation(currentPos)) {
        return BehaviorState.SEEKING_BATH
      }
    }
  }

  // Priority 2: Player has been idle for 20+ seconds - seek preferred activity
  if (currentData.playerIdleTime >= PLAYER_IDLE_PREFERENCE_TIME) {
    // Calculate and cache preferred activity
    currentData.preferredActivity = getPreferredActivity(personality)
    currentData.playerIdleTime = 0 // Reset so we don't spam
    return BehaviorState.SEEKING_PREFERRED
  }

  // Priority 3: Social pet approaches player (if bond is high enough and has energy)
  if (playerNearby && bond && bond.trustLevel !== TrustLevel.STRANGER && pet.energy > ENERGY_REST_THRESHOLD) {
    // Sociability affects likelihood - higher sociability = more likely to approach
    // Threshold: sociability 30+ means pet will approach
    if (personality.sociability >= 30) {
      // Check if pet is already "thinking" about following
      const thinkingElapsed = now - currentData.followThinkingStart
      if (currentData.followThinkingStart === 0 || thinkingElapsed >= FOLLOW_THINKING_DELAY * 1000) {
        // Start thinking phase or continue to following
        if (currentData.followThinkingStart === 0) {
          currentData.followThinkingStart = now
          return BehaviorState.IDLE // Stay idle while "thinking"
        } else {
          // Thinking delay passed, now follow
          return BehaviorState.APPROACHING_PLAYER
        }
      } else {
        // Still thinking, stay idle
        return BehaviorState.IDLE
      }
    }
  } else {
    // Not approaching player, reset thinking timer
    currentData.followThinkingStart = 0
  }

  // Priority 4: Energetic pet wanders when bored (and has energy)
  if (currentData.state === BehaviorState.IDLE && pet.energy > ENERGY_REST_THRESHOLD) {
    currentData.idleTime += 1
    // Bored threshold modified by energy - high energy pets get bored faster
    const adjustedBoredThreshold = BORED_THRESHOLD * (1.5 - personality.energy / 100)
    if (currentData.idleTime > adjustedBoredThreshold) {
      currentData.idleTime = 0
      return BehaviorState.WANDERING
    }
  }

  // Priority 5: Even low-energy pets should do SOMETHING after very long idle
  if (currentData.state === BehaviorState.IDLE && currentData.idleTime > BORED_THRESHOLD * 2) {
    currentData.idleTime = 0
    return BehaviorState.WANDERING
  }

  // Default: Stay idle
  return BehaviorState.IDLE
}

function getTargetPosition(
  state: BehaviorState,
  currentPos: Vector3,
  personality: ReturnType<typeof PersonalityComponent.get>,
  preferredActivity: PreferredActivity | null
): Vector3 | null {
  switch (state) {
    case BehaviorState.SEEKING_FOOD:
      // Position pet 1m in front of the food bowl (along the scene's forward direction)
      return Vector3.create(FOOD_BOWL_POSITION.x, FOOD_BOWL_POSITION.y, FOOD_BOWL_POSITION.z - 1.0)

    case BehaviorState.SEEKING_BATH:
      return Vector3.create(BATHTUB_POSITION.x, BATHTUB_POSITION.y, BATHTUB_POSITION.z - 0.5)

    case BehaviorState.SEEKING_PREFERRED:
      // Go to location based on preferred activity
      switch (preferredActivity) {
        case PreferredActivity.FOOD:
          return Vector3.create(FOOD_BOWL_POSITION.x, FOOD_BOWL_POSITION.y, FOOD_BOWL_POSITION.z - 1.0)
        case PreferredActivity.BATH:
          return Vector3.create(BATHTUB_POSITION.x, BATHTUB_POSITION.y, BATHTUB_POSITION.z - 0.5)
        case PreferredActivity.PLAY:
          return Vector3.create(PLAY_AREA_POSITION.x, PLAY_AREA_POSITION.y, PLAY_AREA_POSITION.z)
        default:
          return null
      }

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
  behaviorData: {
    state: BehaviorState
    targetPosition: Vector3 | null
    idleTime: number
    followThinkingStart: number
    followLastUpdate: number
    followLastPlayerPos: Vector3 | null
    waitingStationType: WaitingStationType
    shouldFacePlayer: boolean
  },
  personality: ReturnType<typeof PersonalityComponent.get>,
  dt: number,
  now: number
) {
  // Handle WAITING_AT_STATION state - pet sits and optionally faces player
  if (behaviorData.state === BehaviorState.WAITING_AT_STATION) {
    behaviorData.idleTime += dt
    const currentPos = transform.position
    const playerPos = getPlayerPosition()

    // Only face player if the 50/50 decision was "yes"
    if (behaviorData.shouldFacePlayer && playerPos) {
      const toPlayer = Vector3.subtract(playerPos, currentPos)
      const distToPlayer = Vector3.length(toPlayer)

      // Face player when they're close enough
      if (distToPlayer < PLAYER_PROXIMITY_RADIUS) {
        faceDirection(transform, toPlayer)
      }
    }
    return
  }

  if (!behaviorData.targetPosition) {
    behaviorData.idleTime += dt

    // When idle at a station (food bowl or bath), face the player if they come near
    const currentPos = transform.position
    if (isNearStation(currentPos)) {
      const playerPos = getPlayerPosition()
      if (playerPos) {
        const toPlayer = Vector3.subtract(playerPos, currentPos)
        const distToPlayer = Vector3.length(toPlayer)

        // If player is close enough, face them (waiting for interaction)
        if (distToPlayer < PLAYER_PROXIMITY_RADIUS) {
          faceDirection(transform, toPlayer)
        }
      }
    }
    return
  }

  const currentPos = transform.position
  let targetPos = behaviorData.targetPosition

  // For APPROACHING_PLAYER, update target thoughtfully (not every frame)
  if (behaviorData.state === BehaviorState.APPROACHING_PLAYER) {
    const playerPos = getPlayerPosition()
    if (playerPos) {
      const toPlayer = Vector3.subtract(playerPos, currentPos)
      const distToPlayer = Vector3.length(toPlayer)

      // If close enough to player, stop following
      if (distToPlayer <= PET_APPROACH_DISTANCE) {
        behaviorData.state = BehaviorState.IDLE
        behaviorData.targetPosition = null
        behaviorData.idleTime = 0
        behaviorData.followThinkingStart = 0 // Reset thinking timer
        behaviorData.followLastPlayerPos = null
        // Face the player when stopped
        faceDirection(transform, toPlayer)
        return
      }

      // Check if enough time has passed since last update (less reactive)
      const timeSinceLastUpdate = (now - behaviorData.followLastUpdate) / 1000
      if (timeSinceLastUpdate >= FOLLOW_UPDATE_INTERVAL) {
        // Check hysteresis - only update if player moved significantly
        let shouldUpdateTarget = true
        if (behaviorData.followLastPlayerPos) {
          const playerMovement = Vector3.distance(behaviorData.followLastPlayerPos, playerPos)
          shouldUpdateTarget = playerMovement >= FOLLOW_HYSTERESIS_DISTANCE
        }

        if (shouldUpdateTarget) {
          // Update target position to track player thoughtfully
          const dirFromPlayer = Vector3.normalize(Vector3.subtract(currentPos, playerPos))
          targetPos = Vector3.add(playerPos, Vector3.scale(dirFromPlayer, PET_APPROACH_DISTANCE))
          behaviorData.targetPosition = targetPos
          behaviorData.followLastUpdate = now
          behaviorData.followLastPlayerPos = playerPos
        }
      }

      // Face the player (not the movement direction) - do this every frame for smooth rotation
      faceDirection(transform, toPlayer)
    }
  }

  const distance = Vector3.distance(currentPos, targetPos)

  // Arrived at destination
  if (distance < 0.5) {
    // Check if arriving at a need-driven station - transition to WAITING_AT_STATION
    if (behaviorData.state === BehaviorState.SEEKING_FOOD) {
      behaviorData.state = BehaviorState.WAITING_AT_STATION
      behaviorData.waitingStationType = WaitingStationType.FOOD
      behaviorData.shouldFacePlayer = Math.random() >= 0.5 // 50/50 chance to face player
      behaviorData.targetPosition = null
      behaviorData.idleTime = 0
      // Face toward the food bowl (station)
      const toStation = Vector3.subtract(FOOD_BOWL_POSITION, currentPos)
      faceDirection(transform, toStation)
      return
    } else if (behaviorData.state === BehaviorState.SEEKING_BATH) {
      behaviorData.state = BehaviorState.WAITING_AT_STATION
      behaviorData.waitingStationType = WaitingStationType.BATH
      behaviorData.shouldFacePlayer = Math.random() >= 0.5 // 50/50 chance to face player
      behaviorData.targetPosition = null
      behaviorData.idleTime = 0
      // Face toward the bathtub (station)
      const toStation = Vector3.subtract(BATHTUB_POSITION, currentPos)
      faceDirection(transform, toStation)
      return
    }

    // Normal arrival - transition to IDLE
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

  transform.position = Vector3.add(currentPos, Vector3.scale(direction, Math.min(moveSpeed, distance)))

  // Face movement direction (for non-player-approaching behaviors)
  if (behaviorData.state !== BehaviorState.APPROACHING_PLAYER) {
    faceDirection(transform, direction)
  }
}

/**
 * Rotate the transform to face a direction in the XZ plane
 */
function faceDirection(transform: ReturnType<typeof Transform.getMutable>, direction: Vector3) {
  if (direction.x !== 0 || direction.z !== 0) {
    const angle = Math.atan2(direction.x, direction.z)
    transform.rotation = { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) }
  }
}

/**
 * Check if position is near a station (food bowl, bathtub, or play area)
 * Used to make pet face player when waiting at these locations
 */
const STATION_PROXIMITY = 2.0 // Distance to consider "at" a station

function isNearFoodStation(pos: Vector3): boolean {
  const dist = Vector3.distance(
    Vector3.create(pos.x, 0, pos.z),
    Vector3.create(FOOD_BOWL_POSITION.x, 0, FOOD_BOWL_POSITION.z)
  )
  return dist < STATION_PROXIMITY
}

function isNearBathStation(pos: Vector3): boolean {
  const dist = Vector3.distance(
    Vector3.create(pos.x, 0, pos.z),
    Vector3.create(BATHTUB_POSITION.x, 0, BATHTUB_POSITION.z)
  )
  return dist < STATION_PROXIMITY
}

function isNearStation(pos: Vector3): boolean {
  const stations = [FOOD_BOWL_POSITION, BATHTUB_POSITION, PLAY_AREA_POSITION]
  for (const station of stations) {
    const dist = Vector3.distance(Vector3.create(pos.x, 0, pos.z), Vector3.create(station.x, 0, station.z))
    if (dist < STATION_PROXIMITY) {
      return true
    }
  }
  return false
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
  const distanceFromCenter = Vector3.distance(playerPos, Vector3.create(SCENE_CENTER_X, playerPos.y, SCENE_CENTER_Z))
  return distanceFromCenter < PLAYER_PROXIMITY_RADIUS
}

// Export for other systems to check pet behavior
export function getPetBehaviorState(entity: number): BehaviorState | undefined {
  return petBehaviorState.get(entity)?.state
}
