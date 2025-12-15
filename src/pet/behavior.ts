// Pet behavior - state machine and AI decision making

import { Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { EntityNames } from '../../assets/scene/entity-names'
import { cameraFocus } from '../services/CameraFocus'
import { PetState } from './types'
import { restoreEnergy } from './stats'
import {
  moveToStation,
  moveTowardsPoop,
  followPlayer,
  getPlayerDistance,
  lookAtPlayer,
  getStationPosition
} from './movement'
import { playIdle, playSleep, playDrinking } from './animations'
import type { Pet } from '../Pet'

// Get random duration for state (8-15 seconds)
function getRandomStateDuration(): number {
  return 8000 + Math.random() * 7000
}

// Change pet state and update timing
export function changeState(pet: Pet, newState: PetState, customDuration?: number) {
  if (pet.data.state !== newState) {
    console.log(
      `🔄 State change: ${pet.data.state} → ${newState}${customDuration ? ` (duration: ${customDuration}ms)` : ''}`
    )

    // Clear poop cache when changing away from SEEKING_POOP
    if (pet.data.state === PetState.SEEKING_POOP && newState !== PetState.SEEKING_POOP) {
      pet.data.cachedPoopPosition = null
    }

    pet.data.state = newState
    pet.data.stateStartTime = Date.now()
    pet.data.stateDuration = customDuration || getRandomStateDuration()
  }
}

// Check if pet is in a task-focused state that shouldn't be interrupted
export function isInTaskFocusedState(pet: Pet): boolean {
  return (
    pet.data.state === PetState.DRINKING_FROM_BOWL ||
    pet.data.state === PetState.SEEKING_BATH ||
    pet.data.state === PetState.SEEKING_BED ||
    pet.data.state === PetState.SLEEPING
  )
}

// Pick fun activity when no urgent needs
function pickFunActivity(pet: Pet) {
  const roll = Math.random() * 100
  const p = pet.data.personality

  if (roll < p.appetite * 0.2) {
    changeState(pet, PetState.SEEKING_FOOD)
  } else if (roll < 25 + p.energy * 0.3) {
    changeState(pet, PetState.SEEKING_BALL)
  } else if (roll < 45 + p.cleanliness * 0.3) {
    changeState(pet, PetState.SEEKING_BATH)
  } else if (roll < 65) {
    changeState(pet, PetState.SEEKING_DECORATION)
  } else {
    changeState(pet, PetState.SEEKING_POOP)
  }
}

// Decide next activity based on current needs
export function decideNextActivity(pet: Pet) {
  if (pet.data.hunger > 80) {
    changeState(pet, PetState.SEEKING_FOOD)
  } else if (getPlayerDistance(pet) < 4) {
    changeState(pet, PetState.FOLLOWING_PLAYER)
  } else if (pet.data.energy < 20) {
    changeState(pet, PetState.SEEKING_BED)
  } else if (pet.data.cleanliness < 40 && pet.data.personality.cleanliness > 75) {
    changeState(pet, PetState.SEEKING_BATH)
  } else {
    pickFunActivity(pet)
  }
}

// Execute current activity with exit conditions
export function executeCurrentActivity(pet: Pet, dt: number) {
  switch (pet.data.state) {
    case PetState.SEEKING_FOOD:
      if (pet.data.hunger > 60) {
        moveToStation(pet, EntityNames.Food_Bowl, dt)
      } else {
        changeState(pet, PetState.IDLE)
      }
      break

    case PetState.DRINKING_FROM_BOWL:
      handleDrinkingState(pet, dt)
      break

    case PetState.SEEKING_BED:
      handleSeekingBedState(pet, dt)
      break

    case PetState.SEEKING_BATH:
      if (pet.data.cleanliness < 35) {
        moveToStation(pet, EntityNames.Bath_Tub, dt)
      } else {
        changeState(pet, PetState.IDLE)
      }
      break

    case PetState.SEEKING_BALL:
      moveToStation(pet, EntityNames.Ball, dt)
      break

    case PetState.SEEKING_DECORATION:
      moveToStation(pet, EntityNames.Decoration, dt)
      break

    case PetState.SEEKING_POOP:
      if (moveTowardsPoop(pet, dt)) {
        pet.data.cachedPoopPosition = null
      }
      break

    case PetState.FOLLOWING_PLAYER:
      if (getPlayerDistance(pet) < 5) {
        followPlayer(pet, dt)
      } else {
        changeState(pet, PetState.IDLE)
      }
      break

    case PetState.SLEEPING:
      // Energy restoration is now handled in updateBehavior to ensure it runs
      break

    case PetState.IDLE:
    default:
      if (pet.data.isMoving) {
        playIdle(pet)
      }
      break
  }
}

// Handle drinking state
function handleDrinkingState(pet: Pet, dt: number) {
  const arrivedAtBowl = moveToStation(pet, EntityNames.Food_Bowl, dt)

  if (arrivedAtBowl) {
    if (!pet.data.isDrinking) {
      playDrinking(pet)
      pet.data.isDrinking = true
    }

    const timeInDrinkingState = Date.now() - pet.data.stateStartTime
    if (timeInDrinkingState >= 3000) {
      pet.finishDrinking()
    }
  }
}

// Handle seeking bed state
function handleSeekingBedState(pet: Pet, dt: number) {
  const arrivedAtBed = moveToStation(pet, EntityNames.Bed, dt)

  // Debug logging
  const bedPos = getStationPosition(EntityNames.Bed)
  const petPos = pet.entity ? Transform.get(pet.entity).position : pet.data.position
  const distance = bedPos ? Vector3.distance(petPos, bedPos) : 'NO_BED_POS'

  console.log(
    `🐾 Seeking bed - Pet pos: (${petPos.x.toFixed(2)},${petPos.y.toFixed(2)},${petPos.z.toFixed(2)}), Bed pos: ${
      bedPos ? `(${bedPos.x.toFixed(2)},${bedPos.y.toFixed(2)},${bedPos.z.toFixed(2)})` : 'NOT_FOUND'
    }, Distance: ${distance}, arrivedAtBed: ${arrivedAtBed}, manualBedSeeking: ${
      pet.data.manualBedSeeking
    }, energy: ${pet.data.energy.toFixed(1)}`
  )

  if (arrivedAtBed) {
    console.log(
      `🛏️ Pet arrived at bed! Energy: ${pet.data.energy.toFixed(1)}, manualBedSeeking: ${pet.data.manualBedSeeking}`
    )
    if (pet.data.energy < 30 || pet.data.manualBedSeeking) {
      console.log(`💤 Starting to sleep - changing state to SLEEPING`)
      changeState(pet, PetState.SLEEPING, 30000)
      playSleep(pet)
      pet.data.manualBedSeeking = false
    } else {
      console.log(`😴 Not tired enough to sleep (energy >= 30 and not manual), going idle`)
      changeState(pet, PetState.IDLE)
    }
  }
}

// Check for state transitions based on thresholds
export function checkStateTransitions(pet: Pet) {
  if (isInTaskFocusedState(pet)) return

  if (pet.data.mood < 30 && pet.data.state !== PetState.SAD) {
    changeState(pet, PetState.SAD, 5000)
  } else if (pet.data.mood >= 30 && pet.data.state === PetState.SAD) {
    changeState(pet, PetState.IDLE)
  }

  if (pet.data.energy < 5 && pet.data.state !== PetState.SLEEPING) {
    changeState(pet, PetState.SLEEPING, 20000)
  }
}

// Main behavior update loop
export function updateBehavior(pet: Pet, dt: number) {
  // Handle sleep timer expiration and energy restoration
  if (pet.data.state === PetState.SLEEPING) {
    const timeInSleep = Date.now() - pet.data.stateStartTime

    // Gradually restore energy during sleep
    const energyBefore = pet.data.energy
    const fullyRested = restoreEnergy(pet, dt)
    const energyAfter = pet.data.energy

    console.log(
      `💤 Sleeping - Energy: ${energyBefore.toFixed(1)} → ${energyAfter.toFixed(1)}, time: ${timeInSleep.toFixed(
        0
      )}ms/${pet.data.stateDuration}ms, fullyRested: ${fullyRested}`
    )

    // Wake up if timer expired OR fully rested (whichever comes first)
    if (timeInSleep >= pet.data.stateDuration) {
      console.log(`⏰ Sleep timer expired, waking up`)
      pet.wakeUp()
      return
    }

    if (fullyRested) {
      console.log(`🌅 Energy fully restored, waking up naturally`)
      pet.wakeUp()
      return
    }

    return // Continue sleeping
  }

  // Immediate player proximity check (don't interrupt task-focused states)
  if (getPlayerDistance(pet) < 4 && !cameraFocus.isFocused(pet.entity) && !isInTaskFocusedState(pet)) {
    if (pet.data.state !== PetState.FOLLOWING_PLAYER) {
      changeState(pet, PetState.FOLLOWING_PLAYER)
      return
    }
  }

  // Always look at player when close, but not during task-focused states
  if (getPlayerDistance(pet) < 4 && !isInTaskFocusedState(pet)) {
    lookAtPlayer(pet)
  }

  // Timer for activity changes
  pet.data.activityTimer += dt
  if (pet.data.activityTimer > 15) {
    if (!cameraFocus.isFocused(pet.entity) && !isInTaskFocusedState(pet)) {
      pet.data.activityTimer = 0
      decideNextActivity(pet)
    } else {
      pet.data.activityTimer = 0
    }
  }

  executeCurrentActivity(pet, dt)
}
