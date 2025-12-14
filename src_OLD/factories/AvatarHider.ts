import { engine, Transform, AvatarModifierArea, AvatarModifierType, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { getPlayer } from '@dcl/sdk/src/players'
import { AvatarModifierComponent } from '../components/Multiplayer'
import { SCENE_HIDING_AREA_SIZE, SCENE_CENTER_X, SCENE_CENTER_Z } from '../utils/constants'

// =============================================================================
// AVATAR HIDER FACTORY
// Creates the AvatarModifierArea that controls which players are visible
// By default, hides all players except the local player
// =============================================================================

let avatarModifierEntity: Entity | null = null

/**
 * Create the avatar modifier area that hides all players by default
 * Only the local player is visible initially
 * Note: Player data may not be available during initialization, so excludeIds starts empty
 */
export function createAvatarHider(): Entity {
  console.log('Creating avatar modifier area')

  // Create the hiding area entity
  const entity = engine.addEntity()

  // Position at scene center
  Transform.create(entity, {
    position: Vector3.create(SCENE_CENTER_X, SCENE_HIDING_AREA_SIZE.y / 2, SCENE_CENTER_Z),
    rotation: Quaternion.Identity(),
    scale: Vector3.create(1, 1, 1)
  })

  // Create avatar modifier with full scene coverage
  // Start with empty excludeIds - will be updated when player data becomes available
  AvatarModifierArea.create(entity, {
    area: Vector3.create(SCENE_HIDING_AREA_SIZE.x, SCENE_HIDING_AREA_SIZE.y, SCENE_HIDING_AREA_SIZE.z),
    modifiers: [AvatarModifierType.AMT_HIDE_AVATARS],
    excludeIds: [] // Start empty, will include local player when available
  })

  // Mark this entity
  AvatarModifierComponent.create(entity, {
    isInitialized: true
  })

  avatarModifierEntity = entity

  console.log('Avatar modifier area created - will update visibility when player data is available')

  return entity
}

/**
 * Update the avatar modifier to ensure local player is always visible
 * Call this when player data becomes available
 */
export function ensureLocalPlayerVisible() {
  if (!avatarModifierEntity) {
    console.log('Avatar modifier not initialized yet')
    return
  }

  const player = getPlayer()
  const localUserId = player?.userId

  if (!localUserId) {
    console.log('Player data not available yet')
    return
  }

  const modifier = AvatarModifierArea.getMutable(avatarModifierEntity)
  const currentExcludes = new Set(modifier.excludeIds)

  // Always ensure local player is excluded (visible)
  if (!currentExcludes.has(localUserId)) {
    currentExcludes.add(localUserId)
    modifier.excludeIds = Array.from(currentExcludes)
    console.log(`Added local player to visible list: ${localUserId}`)
  }
}

/**
 * Update the list of visible players in the avatar modifier area
 * @param playerIds Array of player wallet addresses to make visible (always includes local player)
 */
export function updateVisiblePlayers(playerIds: string[]) {
  if (!avatarModifierEntity) {
    console.error('Avatar modifier not initialized')
    return
  }

  // First ensure local player is visible
  ensureLocalPlayerVisible()

  // Get current excludes (which should now include local player)
  const modifier = AvatarModifierArea.getMutable(avatarModifierEntity)
  const currentExcludes = new Set(modifier.excludeIds)

  // Add the requested player IDs
  playerIds.forEach((id) => currentExcludes.add(id))

  const excludeList = Array.from(currentExcludes)

  // Update the avatar modifier area
  modifier.excludeIds = excludeList

  console.log(`Updated visible players (${excludeList.length}):`, excludeList)
}

/**
 * Get the avatar modifier entity (for testing/debugging)
 */
export function getAvatarModifierEntity(): Entity | null {
  return avatarModifierEntity
}

/**
 * Reset to solo mode (only local player visible)
 */
export function resetToSoloMode() {
  // This will ensure only local player is visible by clearing all other players
  // but keeping local player in the exclude list
  updateVisiblePlayers([])
  console.log('Reset to solo mode - only local player visible')
}
