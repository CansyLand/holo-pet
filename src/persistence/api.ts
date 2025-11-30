import { signedFetch } from '~system/SignedFetch'
import { API_BASE_URL } from '../utils/constants'

export interface PetDocument {
  identity: { name: string; species: string; hatchedAt: number }
  stats: { mood: number; hunger: number; energy: number; state: string }
  personality: { energy: number; sociability: number; cleanliness: number; appetite: number }
  bond: { bond: number; trustLevel: string; lastVisitTime: number }
  hygiene: { cleanliness: number; lastBathTime: number; lastBrushTime: number }
  meta: { version: string; createdAt: number; updatedAt: number; activePoopCount: number }
}

/**
 * Load pet data from your deployed Firebase functions
 * Uses signedFetch to automatically include wallet signature
 */
export async function loadPet(): Promise<PetDocument | null> {
  try {
    const response = await signedFetch({
      url: `${API_BASE_URL}/pet`,
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
  try {
    const response = await signedFetch({
      url: `${API_BASE_URL}/pet`,
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
 * Delete pet data (reset game) from your deployed Firebase functions
 */
export async function deletePet(): Promise<boolean> {
  try {
    const response = await signedFetch({
      url: `${API_BASE_URL}/pet`,
      init: {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      }
    })

    const data = JSON.parse(response.body)
    return data.success === true
  } catch (error) {
    console.error('Failed to delete pet:', error)
    return false
  }
}
