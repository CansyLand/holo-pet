import { engine } from '@dcl/sdk/ecs'
import { getPlayer } from '@dcl/sdk/src/players'
import { PlayerIdentityData, AvatarBase } from '@dcl/sdk/ecs'

// =============================================================================
// PLAYER UTILITIES
// Helper functions for querying player information in the scene
// =============================================================================

export interface OnlinePlayer {
  userId: string // Wallet address
  name: string // Display name
}

/**
 * Get list of all online players in the scene (excluding local player)
 * This is called on-demand when the visit UI opens, not continuously
 * @returns Array of online players with userId and name
 */
export function getOnlinePlayers(): OnlinePlayer[] {
  const players: OnlinePlayer[] = []
  const localPlayer = getPlayer()
  const localUserId = localPlayer?.userId?.toLowerCase()

  console.log('Querying online players, local player:', localUserId)

  // Query all player entities in the scene
  for (const [entity] of engine.getEntitiesWith(PlayerIdentityData, AvatarBase)) {
    const identity = PlayerIdentityData.get(entity)
    const avatar = AvatarBase.get(entity)

    const playerUserId = identity.address?.toLowerCase()

    // Exclude self and ensure we have valid data
    if (playerUserId && playerUserId !== localUserId && avatar.name) {
      players.push({
        userId: playerUserId,
        name: avatar.name
      })
    }
  }

  console.log(`Found ${players.length} online players:`, players)

  return players
}

/**
 * Get a player's display name by their userId
 * @param userId Player's wallet address
 * @returns Display name or null if not found
 */
export function getPlayerName(userId: string): string | null {
  const targetUserId = userId.toLowerCase()

  for (const [entity] of engine.getEntitiesWith(PlayerIdentityData, AvatarBase)) {
    const identity = PlayerIdentityData.get(entity)
    const avatar = AvatarBase.get(entity)

    if (identity.address?.toLowerCase() === targetUserId) {
      return avatar.name
    }
  }

  return null
}

/**
 * Get the local player's display name
 * @returns Display name or truncated wallet as fallback
 */
export function getLocalPlayerName(): string {
  const localPlayer = getPlayer()
  if (!localPlayer) {
    return 'Unknown'
  }

  // Try to get name from PlayerIdentityData
  const localUserId = localPlayer.userId?.toLowerCase()
  if (localUserId) {
    const name = getPlayerName(localUserId)
    if (name) {
      return name
    }
    // Fallback: truncate wallet address
    return `${localUserId.slice(0, 6)}...${localUserId.slice(-4)}`
  }

  return 'Unknown'
}
