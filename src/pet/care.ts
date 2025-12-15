// Pet care actions - player-triggered interactions

import { Transform, engine } from '@dcl/sdk/ecs'
import * as utils from '@dcl-sdk/utils'
import { game } from '../Game'
import { PetState } from './types'
import { changeState, decideNextActivity } from './behavior'
import { getStationPosition } from './movement'
import { playIdle, playDrinking } from './animations'
import { EntityNames } from '../../assets/scene/entity-names'
import type { Pet } from '../Pet'

// Record player interaction timestamp
export function recordInteraction(pet: Pet) {
  pet.data.lastVisit = Date.now()
}

// Feed the pet
export function feed(pet: Pet) {
  const hungerReduction = 40 * (1 + pet.data.personality.appetite / 100)
  pet.data.hunger = Math.max(0, pet.data.hunger - hungerReduction)
  pet.data.mood = Math.min(100, pet.data.mood + 15)
  pet.data.bond = Math.min(100, pet.data.bond + 5)
  pet.data.quests.feed = true
  recordInteraction(pet)
}

// Pet the pet (petting action)
export function petAction(pet: Pet) {
  // If in bath mode, handle cleaning instead
  if (pet.data.bathMode.isActive) {
    handleBathCleaning(pet)
    return
  }

  const moodBoost = 25 * (1 + pet.data.personality.sociability / 100)
  pet.data.mood = Math.min(100, pet.data.mood + moodBoost)

  const bondBoost = 8 * (1 + pet.data.personality.sociability / 100)
  pet.data.bond = Math.min(100, pet.data.bond + bondBoost)

  recordInteraction(pet)
}

// Play with the pet
export function play(pet: Pet) {
  pet.data.mood = Math.min(100, pet.data.mood + 30)
  pet.data.energy = Math.max(0, pet.data.energy - 20)
  pet.data.hunger = Math.min(100, pet.data.hunger + 15)
  pet.data.cleanliness = Math.max(0, pet.data.cleanliness - 10)
  pet.data.bond = Math.min(100, pet.data.bond + 10)
  pet.data.quests.play = true
  recordInteraction(pet)
}

// Brush the pet
export function brush(pet: Pet) {
  pet.data.cleanliness = Math.min(100, pet.data.cleanliness + 30)
  pet.data.mood = Math.min(100, pet.data.mood + 15)
  pet.data.bond = Math.min(100, pet.data.bond + 6)
  pet.data.lastBrushTime = Date.now()
  recordInteraction(pet)
}

// Start bath mode
export function startBath(pet: Pet) {
  pet.data.bathMode.isActive = true
  pet.data.bathMode.clickCount = 0

  const playerPos = Transform.get(engine.PlayerEntity).position
  pet.data.bathMode.startPosition = {
    x: playerPos.x,
    y: playerPos.y,
    z: playerPos.z
  }

  // Refresh pointer events
  const petModule = game.modules.find((m) => m.name === 'Pet') as any
  if (petModule && petModule.setupPointerEvents) {
    petModule.setupPointerEvents()
  }

  console.log('🛁 Pet entered bath mode - click 4 times to clean (25% per click)')
}

// Handle bath cleaning with incremental progress
function handleBathCleaning(pet: Pet) {
  pet.data.bathMode.clickCount++
  pet.data.cleanliness = Math.min(100, pet.data.cleanliness + 25)

  // Spawn blue particles
  const particleModule = game.getModuleSafe('Particle') as any
  if (particleModule && pet.entity) {
    particleModule.spawnParticles(pet.entity, 'blue')
  }

  if (pet.data.bathMode.clickCount >= 4) {
    finishBathCleaning(pet)
  }
}

// Complete the bath cleaning
function finishBathCleaning(pet: Pet) {
  pet.data.cleanliness = 100
  pet.data.mood = Math.min(100, pet.data.mood + 20)
  pet.data.bond = Math.min(100, pet.data.bond + 8)
  pet.data.lastBathTime = Date.now()
  pet.data.quests.bath = true
  recordInteraction(pet)

  utils.timers.setTimeout(() => {
    exitBath(pet)
  }, 2000)
}

// Exit bath mode
export function exitBath(pet: Pet) {
  if (!pet.data.bathMode.isActive) return

  console.log('🛁 Pet exiting bath mode')

  pet.data.bathMode.isActive = false
  pet.data.bathMode.clickCount = 0
  pet.data.bathMode.startPosition = { x: 0, y: 0, z: 0 }

  pet.disableCursorFollow()
}

// Put pet to sleep
export function sleep(pet: Pet) {
  changeState(pet, PetState.SLEEPING, 30000)
  pet.data.quests.bedtime = true
  recordInteraction(pet)
}

// Wake up pet
export function wakeUp(pet: Pet) {
  changeState(pet, PetState.IDLE)
  playIdle(pet)
}

// Start drinking from bowl
export function startDrinking(pet: Pet) {
  changeState(pet, PetState.DRINKING_FROM_BOWL)
  console.log('🐾 Pet starting to drink from bowl')
}

// Finish drinking
export function finishDrinking(pet: Pet) {
  pet.data.isDrinking = false
  feed(pet)

  // Spawn food particles
  const particleModule = game.getModuleSafe('Particle') as any
  if (particleModule) {
    const bowlPos = getStationPosition(EntityNames.Food_Bowl)
    if (bowlPos && pet.entity) {
      particleModule.spawnParticles(pet.entity, 'pink')
    }
  }

  decideNextActivity(pet)
  console.log('🥤 Pet finished drinking from bowl')
}

// Start seeking bed
export function startSeekingBed(pet: Pet) {
  changeState(pet, PetState.SEEKING_BED)
  pet.data.manualBedSeeking = true
  console.log('🐾 Pet starting to seek bed')
}

// Stop current activity
export function stopCurrentActivity(pet: Pet) {
  changeState(pet, PetState.IDLE, 10000)
}
