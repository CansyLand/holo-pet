import { getPlayer } from '@dcl/sdk/src/players'
import { MAX_SYNC_ENTITY_ID } from './constants'

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

/**
 * Hash a wallet address to a unique entity ID for syncEntity
 * Converts a wallet address (0x...) to a number in range 1-8000
 * This ensures each player's pet has a consistent ID across all clients
 *
 * @param address Wallet address (e.g. "0x1234...")
 * @returns Unique ID between 1 and MAX_SYNC_ENTITY_ID (8000)
 */
export function hashWalletToId(address: string): number {
  if (!address) {
    console.log('Empty address provided to hashWalletToId, using random ID')
    return Math.floor(Math.random() * MAX_SYNC_ENTITY_ID) + 1
  }

  // Remove 0x prefix if present
  const cleanAddress = address.toLowerCase().replace('0x', '')

  // Simple hash function: sum character codes and modulo
  let hash = 0
  for (let i = 0; i < cleanAddress.length; i++) {
    const char = cleanAddress.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Ensure positive and within valid range (1 to MAX_SYNC_ENTITY_ID)
  const id = (Math.abs(hash) % MAX_SYNC_ENTITY_ID) + 1

  return id
}
