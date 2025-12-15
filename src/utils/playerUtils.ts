// Simple helper that waits for player data using Decentraland timers
import { getPlayer } from '@dcl/sdk/src/players'
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
