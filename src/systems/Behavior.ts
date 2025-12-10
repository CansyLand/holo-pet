import { engine, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { PetComponent } from '../components/Pet'
import { PersonalityComponent, BondComponent, TrustLevel, PetIdentityComponent } from '../components/Personality'
import { HygieneComponent } from '../components/Hygiene'
import { MenuStateComponent } from '../components/UIState'
import { STATION_POSITIONS } from '../factories/Station'
import { VisitStateComponent } from '../components/Multiplayer'
import { getWalletAddress } from '../utils/wallet'
import { PlayerIdentityData } from '@dcl/sdk/ecs'
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
  WAITING_AT_STATION = 'waiting_at_station', // Sitting at station until need is satisfied
  POOPING = 'pooping',
  // Multiplayer behaviors
  LOOKING_AT_PET = 'looking_at_pet', // Looking at another visible pet
  FOLLOWING_PET = 'following_pet', // Following another pet around
  LOOKING_AT_PLAYER = 'looking_at_player' // Looking at a visible player (not owner)
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
        followLastPlayerPos: null
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
  },
  now: number,
  playerNearby: boolean,
  currentPos: Vector3
): BehaviorState {
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

  // Priority 4: Social pet interacts with nearby pets or players
  if (personality.sociability >= 50 && pet.energy > ENERGY_REST_THRESHOLD) {
    // Check for nearby pets first
    const nearbyPet = getNearbyPet(currentData.state as any, currentPos) // Pass entity ID
    if (nearbyPet) {
      // 50% chance to follow, 50% chance to just look
      if (Math.random() > 0.5) {
        return BehaviorState.FOLLOWING_PET
      } else {
        return BehaviorState.LOOKING_AT_PET
      }
    }

    // Check for nearby visible players (not owner)
    const nearbyPlayer = getNearbyVisiblePlayer(currentPos)
    if (nearbyPlayer && Math.random() > 0.7) {
      // 30% chance to look at visible player
      return BehaviorState.LOOKING_AT_PLAYER
    }
  }

  // Priority 5: Energetic pet wanders when bored (and has energy)
  if (currentData.state === BehaviorState.IDLE && pet.energy > ENERGY_REST_THRESHOLD) {
    currentData.idleTime += 1
    // Bored threshold modified by energy - high energy pets get bored faster
    const adjustedBoredThreshold = BORED_THRESHOLD * (1.5 - personality.energy / 100)
    if (currentData.idleTime > adjustedBoredThreshold) {
      currentData.idleTime = 0
      return BehaviorState.WANDERING
    }
  }

  // Priority 6: Even low-energy pets should do SOMETHING after very long idle
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

    case BehaviorState.FOLLOWING_PET:
    case BehaviorState.LOOKING_AT_PET:
      // Target is the nearby pet's position
      const nearbyPet = getNearbyPet(0 as any, currentPos) // Entity ID will be passed correctly from caller
      if (nearbyPet) {
        if (state === BehaviorState.FOLLOWING_PET) {
          // Get position near pet but not on top of them
          const direction = Vector3.subtract(currentPos, nearbyPet.position)
          const normalized = Vector3.normalize(direction)
          return Vector3.add(nearbyPet.position, Vector3.scale(normalized, PET_APPROACH_DISTANCE))
        } else {
          // Just looking, stay in place but will face pet
          return null
        }
      }
      return null

    case BehaviorState.LOOKING_AT_PLAYER:
      // Just looking, stay in place but will face player
      return null

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
  },
  personality: ReturnType<typeof PersonalityComponent.get>,
  dt: number,
  now: number
) {
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

/**
 * Find nearby pets (excluding self)
 * Returns the closest pet entity and its position if one exists within proximity
 */
function getNearbyPet(selfEntity: number, currentPos: Vector3): { entity: number; position: Vector3 } | null {
  const localUserId = getWalletAddress()
  if (!localUserId) return null

  let closestPet: { entity: number; position: Vector3 } | null = null
  let closestDistance = Infinity

  // Find all pet entities
  for (const [entity] of engine.getEntitiesWith(PetComponent, PetIdentityComponent, Transform)) {
    // Skip self
    if (entity === selfEntity) continue

    const identity = PetIdentityComponent.get(entity)
    const transform = Transform.get(entity)

    // Check if this pet is visible (owner is in our visible list or is us)
    if (identity.ownerId && identity.ownerId !== localUserId) {
      // Check if this owner is visible
      const visitState = getVisitState()
      if (!visitState || !visitState.visiblePlayerIds.includes(identity.ownerId)) {
        continue // This pet's owner is not visible, skip it
      }
    }

    const distance = Vector3.distance(currentPos, transform.position)
    if (distance < PLAYER_PROXIMITY_RADIUS && distance < closestDistance) {
      closestDistance = distance
      closestPet = { entity, position: transform.position }
    }
  }

  return closestPet
}

/**
 * Find nearby visible players (excluding self)
 * Returns the closest visible player position if one exists within proximity
 */
function getNearbyVisiblePlayer(currentPos: Vector3): Vector3 | null {
  const localUserId = getWalletAddress()
  if (!localUserId) return null

  const visitState = getVisitState()
  if (!visitState || visitState.visiblePlayerIds.length === 0) {
    return null // No visible players
  }

  let closestPlayerPos: Vector3 | null = null
  let closestDistance = Infinity

  // Find all player entities
  for (const [entity] of engine.getEntitiesWith(PlayerIdentityData, Transform)) {
    const identity = PlayerIdentityData.get(entity)
    const playerUserId = identity.address?.toLowerCase()

    // Skip self
    if (playerUserId === localUserId) continue

    // Check if this player is visible
    if (!visitState.visiblePlayerIds.includes(playerUserId)) {
      continue
    }

    const transform = Transform.get(entity)
    const distance = Vector3.distance(currentPos, transform.position)

    if (distance < PLAYER_PROXIMITY_RADIUS && distance < closestDistance) {
      closestDistance = distance
      closestPlayerPos = transform.position
    }
  }

  return closestPlayerPos
}

/**
 * Get the current visit state (for checking visible players)
 */
function getVisitState(): { visiblePlayerIds: string[] } | null {
  for (const [_, visitState] of engine.getEntitiesWith(VisitStateComponent)) {
    return {
      visiblePlayerIds: visitState.visiblePlayerIds
    }
  }
  return null
}

// Export for other systems to check pet behavior
export function getPetBehaviorState(entity: number): BehaviorState | undefined {
  return petBehaviorState.get(entity)?.state
}

/**
 * Reset the behavior system state
 * Called when resetting the game
 */
export function resetBehaviorSystem() {
  petBehaviorState.clear()
  console.log('Behavior system reset')
}
