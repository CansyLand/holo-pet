import { signedFetch } from '~system/SignedFetch'
import { API_BASE_URL } from '../utils/constants'
import { getWalletAddress } from '../utils/wallet'

export interface PetDocument {
  identity: { name: string; species: string; hatchedAt: number }
  stats: { mood: number; hunger: number; energy: number; state: string }
  personality: { energy: number; sociability: number; cleanliness: number; appetite: number }
  bond: { bond: number; trustLevel: string; lastVisitTime: number }
  hygiene: { cleanliness: number; lastBathTime: number; lastBrushTime: number }
  meta: {
    version: string
    createdAt: number
    updatedAt: number
    activePoopCount: number
    gamePhase: 'egg' | 'pet'
    hatchCount: number
    visitStreak: number // Consecutive days visited
    lastVisitDate: string // ISO date (YYYY-MM-DD) for streak calculation
    score: number // Pre-calculated composite score for leaderboard
    ownerName: string // Player display name for leaderboard
    dailyQuests: {
      feedCompleted: boolean
      playCompleted: boolean
      bathCompleted: boolean
      bedtimeCompleted: boolean
      lastResetDate: string // ISO date (YYYY-MM-DD)
    }
  }
}

/**
 * Load pet data from your deployed Firebase functions
 * Uses signedFetch to automatically include wallet signature
 */
export async function loadPet(): Promise<PetDocument | null> {
  const userId = getWalletAddress()
  if (!userId) {
    console.error('No wallet connected')
    return null
  }

  try {
    const response = await signedFetch({
      url: `${API_BASE_URL}/pet/${userId}`,
      init: {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    })

    const data = JSON.parse(response.body)
    if (data.success && data.pet) {
      return data.pet as PetDocument
    }
    return null
  } catch (error) {
    console.error('Failed to load pet:', error)
    return null
  }
}

/**
 * Result of save operation with detailed error info
 */
export interface SaveResult {
  success: boolean
  error?: string
}

/**
 * Save pet data to your deployed Firebase functions
 */
export async function savePet(petData: PetDocument): Promise<boolean> {
  const userId = getWalletAddress()
  if (!userId) {
    console.error('No wallet connected')
    return false
  }

  try {
    const response = await signedFetch({
      url: `${API_BASE_URL}/pet/${userId}`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData)
      }
    })

    const data = JSON.parse(response.body)
    return data.success === true
  } catch (error) {
    console.error('Failed to save pet:', error)
    return false
  }
}

/**
 * Save pet data with detailed error reporting for validation
 */
export async function savePetWithDetails(petData: PetDocument): Promise<SaveResult> {
  const userId = getWalletAddress()
  if (!userId) {
    return { success: false, error: 'No wallet connected' }
  }

  try {
    const response = await signedFetch({
      url: `${API_BASE_URL}/pet/${userId}`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData)
      }
    })

    // Check if response has a body (might be empty for some errors)
    if (!response.body || response.body.trim() === '') {
      return { success: false, error: 'Network error - please try again' }
    }

    // Try to parse as JSON first
    let data
    try {
      data = JSON.parse(response.body)
    } catch (parseError) {
      // If JSON parsing fails, the body might be plain text error message
      const plainTextError = response.body.trim()
      console.log('Received plain text error response:', plainTextError)

      if (plainTextError.includes('inappropriate content')) {
        return { success: false, error: 'Try a different name' }
      } else if (plainTextError.includes('cannot be empty')) {
        return { success: false, error: 'Pet name cannot be empty' }
      } else if (plainTextError.includes('too long')) {
        return { success: false, error: 'Pet name is too long (max 12 characters)' }
      } else {
        return { success: false, error: plainTextError || 'Save failed' }
      }
    }

    if (data.success === true) {
      return { success: true }
    } else {
      // Return server validation error - use specific message for profane names
      const errorMessage = data.error || 'Save failed'
      if (errorMessage.includes('inappropriate content')) {
        return { success: false, error: 'Try a different name' }
      }
      return { success: false, error: errorMessage }
    }
  } catch (error: any) {
    console.error('Failed to save pet:', error)

    // Check if the error message contains server validation response
    const errorMessage = error?.message || error?.toString() || ''
    console.log('Error message content:', errorMessage)

    if (errorMessage.includes('Pet name contains inappropriate content')) {
      return { success: false, error: 'Try a different name' }
    } else if (errorMessage.includes('Pet name cannot be empty')) {
      return { success: false, error: 'Pet name cannot be empty' }
    } else if (errorMessage.includes('Pet name is too long')) {
      return { success: false, error: 'Pet name is too long (max 12 characters)' }
    }

    return { success: false, error: 'Network error - please try again' }
  }
}

/**
 * Leaderboard entry for display
 */
export interface LeaderboardEntry {
  rank: number
  petName: string // Pet name
  ownerName: string // Player display name
  score: number
  bond: number
  visitStreak: number
}

/**
 * Leaderboard response structure
 */
export interface LeaderboardResponse {
  top10: LeaderboardEntry[]
  playerRank: { rank: number; score: number; petName: string; ownerName: string } | null
}

/**
 * Fetch leaderboard data (top 10 + player's rank)
 */
export async function fetchLeaderboard(): Promise<LeaderboardResponse | null> {
  try {
    const response = await signedFetch({
      url: `${API_BASE_URL}/leaderboard`,
      init: {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    })

    const data = JSON.parse(response.body)
    if (data.success) {
      return data.leaderboard as LeaderboardResponse
    }
    return null
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return null
  }
}

/**
 * Reset pet to egg stage (doesn't delete data, tracks hatch count)
 */
export async function resetPet(): Promise<boolean> {
  const userId = getWalletAddress()
  if (!userId) {
    console.error('No wallet connected')
    return false
  }

  try {
    // First load current data to get existing hatch count
    const loadResponse = await signedFetch({
      url: `${API_BASE_URL}/pet/${userId}`,
      init: {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    })

    const loadData = JSON.parse(loadResponse.body)
    const currentHatchCount = loadData.success && loadData.pet ? loadData.pet.meta.hatchCount || 0 : 0

    // Create reset data with incremented hatch count
    const resetData = {
      meta: {
        version: '1.0.0',
        updatedAt: Date.now(),
        gamePhase: 'egg',
        hatchCount: currentHatchCount + 1,
        activePoopCount: 0
      }
    }

    const response = await signedFetch({
      url: `${API_BASE_URL}/pet/${userId}`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      }
    })

    const data = JSON.parse(response.body)
    return data.success === true
  } catch (error) {
    console.error('Failed to reset pet:', error)
    return false
  }
}
