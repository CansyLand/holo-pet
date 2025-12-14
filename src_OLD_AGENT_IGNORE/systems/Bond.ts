import { engine, Entity, VisibilityComponent } from '@dcl/sdk/ecs'
import { PetComponent } from '../components/Pet'
import { BondComponent, getTrustLevel, TrustLevel } from '../components/Personality'
import { GameState, GamePhase } from '../components/GameState'
import { BOND_DECAY_RATE, ABANDON_THRESHOLD, BOND_CHECK_INTERVAL, MIN_BOND, MAX_BOND } from '../utils/constants'

// =============================================================================
// BOND SYSTEM
// Manages the pet-owner relationship
// - Bond grows from interactions (handled in Logic.ts)
// - Bond DECAYS when player is absent for too long
// - If bond reaches 0, pet runs away (game over)
// =============================================================================

let timeSinceLastCheck = 0

// Game over state
export enum GameOverReason {
  PET_RAN_AWAY = 'pet_ran_away'
}

let gameOverTriggered = false

export function bondSystem(dt: number) {
  timeSinceLastCheck += dt

  // Only check periodically
  if (timeSinceLastCheck < BOND_CHECK_INTERVAL) return
  timeSinceLastCheck = 0

  // Process each pet with bond component
  for (const [entity] of engine.getEntitiesWith(PetComponent, BondComponent)) {
    const bondData = BondComponent.getMutable(entity)
    const currentTime = Date.now() / 1000 // Convert to seconds

    // Calculate time since last visit
    const timeSinceVisit = currentTime - bondData.lastVisitTime

    // If player has been absent too long, decay bond
    if (timeSinceVisit > ABANDON_THRESHOLD) {
      // Calculate decay amount based on how long they've been gone
      const abandonmentPeriods = Math.floor((timeSinceVisit - ABANDON_THRESHOLD) / BOND_CHECK_INTERVAL)
      const decayAmount = Math.min(BOND_DECAY_RATE, bondData.bond)

      if (decayAmount > 0) {
        bondData.bond = Math.max(MIN_BOND, bondData.bond - decayAmount)
        console.log(`Bond decaying due to absence. Bond: ${bondData.bond}`)
      }
    }

    // Update trust level based on current bond
    const newTrustLevel = getTrustLevel(bondData.bond)
    if (newTrustLevel !== bondData.trustLevel) {
      const oldLevel = bondData.trustLevel
      bondData.trustLevel = newTrustLevel
      console.log(`Trust level changed: ${oldLevel} -> ${newTrustLevel}`)
    }

    // Check for game over condition
    if (bondData.bond <= 0 && !gameOverTriggered) {
      triggerPetRunaway(entity)
    }
  }
}

function triggerPetRunaway(petEntity: Entity) {
  gameOverTriggered = true
  console.log('💔 Pet has run away! Bond reached 0.')

  // Update game state to indicate game over
  for (const [gameEntity] of engine.getEntitiesWith(GameState)) {
    const gameState = GameState.getMutable(gameEntity)
    if (gameState.phase === GamePhase.PET) {
      console.log('Game Over: Pet ran away due to neglect')

      // Hide the pet entity (don't remove it - entities are non-destructible)
      const visibility = VisibilityComponent.getMutableOrNull(petEntity)
      if (visibility) {
        visibility.visible = false
      }

      // Return to egg state
      gameState.phase = GamePhase.EGG
      gameState.activePetEntity = 0 as Entity

      // TODO: Show game over UI, offer to restart with new egg
    }
  }
}

/**
 * Call this when player interacts with pet to update last visit time
 * Should be called from Logic.ts on any interaction
 */
export function recordPlayerVisit(petEntity: Entity) {
  const bondData = BondComponent.getMutableOrNull(petEntity)
  if (bondData) {
    bondData.lastVisitTime = Date.now() / 1000
  }
}

/**
 * Add bond points from an interaction
 * Clamps to MAX_BOND and updates trust level
 */
export function addBond(petEntity: Entity, amount: number) {
  const bondData = BondComponent.getMutableOrNull(petEntity)
  if (bondData) {
    bondData.bond = Math.min(MAX_BOND, bondData.bond + amount)
    bondData.trustLevel = getTrustLevel(bondData.bond)
    bondData.lastVisitTime = Date.now() / 1000 // Also update visit time
  }
}

/**
 * Check if pet has run away (for UI/other systems)
 */
export function hasGameEnded(): boolean {
  return gameOverTriggered
}

/**
 * Reset game over state (for restarting)
 */
export function resetGameOver() {
  gameOverTriggered = false
}

/**
 * Reset the bond system state completely
 * Called when resetting the game
 */
export function resetBondSystem() {
  gameOverTriggered = false
  timeSinceLastCheck = 0
  console.log('Bond system reset')
}
