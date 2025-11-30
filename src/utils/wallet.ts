import { getPlayer } from '@dcl/sdk/src/players'

/**
 * Get the current player's wallet address
 * This returns the userId which is the Ethereum address in lowercase
 */
export function getWalletAddress(): string | null {
  const player = getPlayer()
  return player?.userId?.toLowerCase() || null
}

/**
 * Check if player is connected with a wallet
 */
export function isWalletConnected(): boolean {
  return getWalletAddress() !== null
}
