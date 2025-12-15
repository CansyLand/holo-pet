// Pet class - orchestrates all pet subsystems
// This is the main Pet object that coordinates behavior, stats, movement, etc.

import { Entity, engine } from '@dcl/sdk/ecs'
import { EntityNames } from '../assets/scene/entity-names'
import { game } from './Game'

// Re-export types for external use
export { Species, PetState, TrustLevel } from './pet/types'
import { Species, PetState, PetData, createInitialPetData } from './pet/types'

// Import subsystems
import { decayStats, getTrustLevel, generatePersonality } from './pet/stats'
import { updateBehavior, checkStateTransitions, changeState } from './pet/behavior'
import { enableCursorFollow, disableCursorFollow, updateCursorFollow } from './pet/cursorFollow'
import * as care from './pet/care'

export class Pet {
  // Reference to the ECS entity
  entity: Entity | null = null

  // All pet data in one place
  data: PetData

  constructor(species: Species = Species.TIGER) {
    this.data = createInitialPetData(species)
    this.data.personality = generatePersonality()
    console.log(`Pet created: ${species} with personality`, this.data.personality)
  }

  // Static method to find and assign pet entity
  static assignEntityToPet(pet: Pet): boolean {
    const tigerEntity = engine.getEntityOrNullByName(EntityNames.Tiger)
    if (tigerEntity) {
      pet.entity = tigerEntity
      console.log('🐾 Pet entity reference set')
      return true
    }
    return false
  }

  // Main update loop - called every frame
  update(dt: number) {
    decayStats(this, dt)
    updateBehavior(this, dt)
    checkStateTransitions(this)
    updateCursorFollow(this, dt)
  }

  // Calculate trust level from bond value
  getTrustLevel() {
    return getTrustLevel(this.data.bond)
  }

  // Cursor follow
  enableCursorFollow() {
    enableCursorFollow(this)
  }

  disableCursorFollow() {
    disableCursorFollow(this)
  }

  updateCursorFollow(dt: number) {
    updateCursorFollow(this, dt)
  }

  // Care actions (delegate to care module)
  feed() {
    care.feed(this)
  }

  pet() {
    care.petAction(this)
  }

  play() {
    care.play(this)
  }

  brush() {
    care.brush(this)
  }

  bath() {
    care.startBath(this)
  }

  exitBath() {
    care.exitBath(this)
  }

  sleep() {
    care.sleep(this)
  }

  wakeUp() {
    care.wakeUp(this)
  }

  startDrinkingFromBowl() {
    care.startDrinking(this)
  }

  finishDrinking() {
    care.finishDrinking(this)
  }

  startSeekingBed() {
    care.startSeekingBed(this)
  }

  stopCurrentActivity() {
    care.stopCurrentActivity(this)
  }

  recordInteraction() {
    care.recordInteraction(this)
  }

  // Set pet name
  setName(name: string) {
    this.data.name = name

    // Refresh pointer events to update hover text
    const petModule = game.modules.find((m) => m.name === 'Pet') as any
    if (petModule && petModule.setupPointerEvents) {
      petModule.setupPointerEvents()
    }

    changeState(this, PetState.IDLE)
  }

  // Set owner ID
  setOwner(ownerId: string) {
    this.data.ownerId = ownerId
  }

  // Get current stats for UI/debugging
  getStats() {
    return {
      ...this.data,
      trustLevel: this.getTrustLevel()
    }
  }
}
