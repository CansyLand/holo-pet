// Simple helper that waits for player data using Decentraland timers
import { engine } from '@dcl/sdk/ecs'
import { getPlayer } from '@dcl/sdk/src/players'
import { PlayerIdentityData, AvatarBase } from '@dcl/sdk/ecs'
import * as utils from '@dcl-sdk/utils'

// Simple helper that waits for player data
export function waitForPlayerData(callback: (userId: string) => void, maxRetries = 10) {
  let retries = 0

  const checkPlayer = () => {
    const player = getPlayer()
    const userId = player?.userId

    if (userId) {
      console.log('👤 Player data ready:', userId)
      callback(userId)
      return
    }

    retries++
    if (retries < maxRetries) {
      console.log(`👤 Waiting for player data... (${retries}/${maxRetries})`)
      utils.timers.setTimeout(checkPlayer, 1000) // Check every 1 second
    } else {
      console.log('👤 Player data timeout - giving up')
    }
  }

  checkPlayer()
}

/**
 * Call a callback when player data becomes available
 * @param callback Function to call with the userId when player data is ready
 */
export function onPlayerDataReady(callback: (userId: string) => void) {
  waitForPlayerData(callback)
}

/**
 * Get a player's display name by their userId
 * @param userId Player's wallet address
 * @returns Display name or null if not found
 */
export function getPlayerName(userId: string): string | null {
  const targetUserId = userId.toLowerCase()

  // Query all player entities in the scene
  for (const [entity] of engine.getEntitiesWith(PlayerIdentityData, AvatarBase)) {
    const identity = PlayerIdentityData.get(entity)
    const avatar = AvatarBase.get(entity)

    const playerUserId = identity.address?.toLowerCase()

    if (playerUserId === targetUserId && avatar.name) {
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
