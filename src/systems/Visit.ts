import { engine, Entity } from '@dcl/sdk/ecs'
import { MessageBus } from '@dcl/sdk/message-bus'
import { VisitStateComponent } from '../components/Multiplayer'
import { updateVisiblePlayers, resetToSoloMode } from '../factories/AvatarHider'
import { getWalletAddress } from '../utils/wallet'
import { MAX_VISIBLE_PETS } from '../utils/constants'
import { PetComponent } from '../components/Pet'
import { PetIdentityComponent } from '../components/Personality'
import { GameState, GamePhase } from '../components/GameState'
import { syncPetForVisibility, getPetEntityForOwner } from '../factories/Pet'

// =============================================================================
// VISIT SYSTEM
// Manages player visits and pet visibility using MessageBus for coordination
// =============================================================================

// Message Bus for coordinating visits between players
const visitMessageBus = new MessageBus()

// Visit state entity (singleton)
let visitStateEntity: Entity | null = null

// Message types
type VisitRequestMessage = {
  visitorId: string // Wallet address of visitor
  hostId: string // Wallet address of host
}

type VisitLeaveMessage = {
  visitorId: string // Wallet address of visitor
  hostId: string // Wallet address of host (for cleanup)
}

/**
 * Initialize the visit system
 * Creates the global visit state entity and sets up message listeners
 */
export function initVisitSystem() {
  // Create visit state entity if it doesn't exist
  if (!visitStateEntity) {
    visitStateEntity = engine.addEntity()
    VisitStateComponent.create(visitStateEntity, {
      isVisiting: false,
      hostUserId: '',
      visiblePlayerIds: [],
      visiblePetCount: 0
    })
    console.log('Visit system initialized')
  }

  // Listen for visit requests from other players
  visitMessageBus.on('visit_request', (msg: VisitRequestMessage) => {
    handleVisitRequest(msg)
  })

  // Listen for visit leave messages
  visitMessageBus.on('visit_leave', (msg: VisitLeaveMessage) => {
    handleVisitLeave(msg)
  })
}

/**
 * Get the visit state entity (for UI queries)
 */
export function getVisitStateEntity(): Entity | null {
  return visitStateEntity
}

/**
 * Visit another player's space
 * @param hostUserId Wallet address of player to visit
 */
export function visitPlayer(hostUserId: string) {
  if (!visitStateEntity) {
    console.error('Visit system not initialized')
    return
  }

  const localUserId = getWalletAddress()
  if (!localUserId) {
    console.error('No local wallet address')
    return
  }

  if (hostUserId === localUserId) {
    console.error('Cannot visit yourself')
    return
  }

  console.log(`[VISIT] Starting visit to ${hostUserId}`)

  // Update local state
  const visitState = VisitStateComponent.getMutable(visitStateEntity)
  visitState.isVisiting = true
  visitState.hostUserId = hostUserId
  visitState.visiblePlayerIds = [hostUserId] // Start with just the host

  // Update avatar visibility
  updateVisiblePlayers([hostUserId])

  // Sync our pet so the host can see it
  const ourPetEntity = getPetEntityForOwner(localUserId)
  if (ourPetEntity) {
    syncPetForVisibility(ourPetEntity)
  }

  // Broadcast visit request to all players
  visitMessageBus.emit('visit_request', {
    visitorId: localUserId,
    hostId: hostUserId
  })

  console.log(`[VISIT] Visit started - now visiting ${hostUserId}`)
}

/**
 * Return to solo mode (only see own pet)
 */
export function goHome() {
  if (!visitStateEntity) {
    console.error('Visit system not initialized')
    return
  }

  const localUserId = getWalletAddress()
  if (!localUserId) {
    console.error('No local wallet address')
    return
  }

  const visitState = VisitStateComponent.get(visitStateEntity)

  if (!visitState.isVisiting) {
    console.log('Already at home')
    return
  }

  console.log(`[VISIT] Leaving visit to ${visitState.hostUserId}`)

  // Broadcast leave message
  visitMessageBus.emit('visit_leave', {
    visitorId: localUserId,
    hostId: visitState.hostUserId
  })

  // Update local state
  const mutableState = VisitStateComponent.getMutable(visitStateEntity)
  mutableState.isVisiting = false
  mutableState.hostUserId = ''
  mutableState.visiblePlayerIds = []
  mutableState.visiblePetCount = 0

  // Reset to solo mode
  resetToSoloMode()

  console.log('[VISIT] Returned home - solo mode active')
}

/**
 * Handle incoming visit request from another player
 */
function handleVisitRequest(msg: VisitRequestMessage) {
  const localUserId = getWalletAddress()
  if (!localUserId || !visitStateEntity) return

  console.log(`[VISIT] Received visit request: ${msg.visitorId} wants to visit ${msg.hostId}`)

  const visitState = VisitStateComponent.get(visitStateEntity)

  // Case 1: We are the host being visited
  if (msg.hostId === localUserId) {
    console.log(`[VISIT] ${msg.visitorId} is visiting us`)

    // Add visitor to visible players
    const mutableState = VisitStateComponent.getMutable(visitStateEntity)
    if (!mutableState.visiblePlayerIds.includes(msg.visitorId)) {
      mutableState.visiblePlayerIds = [...mutableState.visiblePlayerIds, msg.visitorId]
      updateVisiblePlayers(mutableState.visiblePlayerIds)
    }

    // Sync our pet so the visitor can see it
    const ourPetEntity = getPetEntityForOwner(localUserId)
    if (ourPetEntity) {
      syncPetForVisibility(ourPetEntity)
    }
  }

  // Case 2: We are also visiting the same host
  if (visitState.isVisiting && visitState.hostUserId === msg.hostId) {
    console.log(`[VISIT] ${msg.visitorId} is also visiting ${msg.hostId}`)

    // Add the new visitor to our visible list
    const mutableState = VisitStateComponent.getMutable(visitStateEntity)
    if (!mutableState.visiblePlayerIds.includes(msg.visitorId)) {
      mutableState.visiblePlayerIds = [...mutableState.visiblePlayerIds, msg.visitorId]
      updateVisiblePlayers(mutableState.visiblePlayerIds)
    }
  }

  // Update pet visibility count
  updatePetVisibility()
}

/**
 * Handle incoming visit leave message
 */
function handleVisitLeave(msg: VisitLeaveMessage) {
  const localUserId = getWalletAddress()
  if (!localUserId || !visitStateEntity) return

  console.log(`Received visit leave: ${msg.visitorId} left ${msg.hostId}`)

  const visitState = VisitStateComponent.get(visitStateEntity)

  // Remove the leaving player from our visible list
  if (visitState.visiblePlayerIds.includes(msg.visitorId)) {
    const mutableState = VisitStateComponent.getMutable(visitStateEntity)
    mutableState.visiblePlayerIds = mutableState.visiblePlayerIds.filter((id) => id !== msg.visitorId)
    updateVisiblePlayers(mutableState.visiblePlayerIds)
  }

  // Case 1: Visitor left us (we were the host)
  if (msg.hostId === localUserId) {
    console.log(`[VISIT] ${msg.visitorId} left our space`)
    // Note: We don't unsync our pet here - it stays synced for future visitors
  }

  // Case 2: Visitor left the same host we're visiting
  if (visitState.isVisiting && visitState.hostUserId === msg.hostId) {
    console.log(`${msg.visitorId} left the same space we're visiting`)
    // Note: The visitor's pet will remain synced but that's okay
  }

  // Update pet visibility count
  updatePetVisibility()
}

/**
 * Update pet visibility based on current visitor count
 * Enforces MAX_VISIBLE_PETS limit (3 pets max for performance)
 */
function updatePetVisibility() {
  if (!visitStateEntity) return

  const visitState = VisitStateComponent.get(visitStateEntity)
  const localUserId = getWalletAddress()
  if (!localUserId) return

  // Count visible pets: own pet + pets of visible players
  let visiblePetOwners: string[] = [localUserId] // Always include own pet

  // Add host pet if visiting
  if (visitState.isVisiting && visitState.hostUserId) {
    visiblePetOwners.push(visitState.hostUserId)
  }

  // Add other visible players' pets (up to MAX_VISIBLE_PETS total)
  for (const playerId of visitState.visiblePlayerIds) {
    if (visiblePetOwners.length >= MAX_VISIBLE_PETS) break
    if (!visiblePetOwners.includes(playerId)) {
      visiblePetOwners.push(playerId)
    }
  }

  // Update pet visibility count
  const mutableState = VisitStateComponent.getMutable(visitStateEntity)
  mutableState.visiblePetCount = visiblePetOwners.length

  console.log(`[VISIT] Pet visibility updated: ${visiblePetOwners.length} pets visible`, visiblePetOwners)

  // Sync pets that should be visible and ensure they're synced
  for (const ownerId of visiblePetOwners) {
    const petEntity = getPetEntityForOwner(ownerId)
    if (petEntity) {
      syncPetForVisibility(petEntity)
    }
  }

  // Note: We don't unsync pets that are no longer visible because:
  // 1. DCL SDK doesn't provide a way to unsync entities
  // 2. It's okay if pets remain synced - they'll only be visible when
  //    players are in the same space and have visibility permissions
  // 3. The avatar hiding already prevents players from seeing each other
  //    when they shouldn't
}

/**
 * Check if the local player is currently visiting someone
 */
export function isVisiting(): boolean {
  if (!visitStateEntity) return false
  const state = VisitStateComponent.getOrNull(visitStateEntity)
  return state?.isVisiting || false
}

/**
 * Check if we can interact with stations (only at home, not when visiting)
 */
export function canInteractWithStations(): boolean {
  return !isVisiting()
}

/**
 * Get current host being visited (empty string if at home)
 */
export function getCurrentHost(): string {
  if (!visitStateEntity) return ''
  const state = VisitStateComponent.getOrNull(visitStateEntity)
  return state?.hostUserId || ''
}


