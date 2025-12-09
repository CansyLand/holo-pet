import { signedFetch } from '~system/SignedFetch'
import { API_BASE_URL } from '../utils/constants'
import { getWalletAddress } from '../utils/wallet'

export interface PetDocument {
  identity: { name: string; species: string; hatchedAt: number }
  stats: { mood: number; hunger: number; energy: number; state: string }
  personality: { energy: number; sociability: number; cleanliness: number; appetite: number }
  bond: { bond: number; trustLevel: string; lastVisitTime: number }
  hygiene: { cleanliness: number; lastBathTime: number; lastBrushTime: number }
  meta: { version: string; createdAt: number; updatedAt: number; activePoopCount: number; gamePhase: 'egg' | 'pet'; hatchCount: number }
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
    const currentHatchCount = (loadData.success && loadData.pet) ? loadData.pet.meta.hatchCount || 0 : 0

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
