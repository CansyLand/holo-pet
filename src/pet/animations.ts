// Animation control - play animations with error handling

import { Animator } from '@dcl/sdk/ecs'
import type { Pet } from '../Pet'

// Play walking animation
export function playWalking(pet: Pet) {
  if (!pet.entity || pet.data.isMoving) return

  // Check if Animator component exists
  try {
    const animator = Animator.getClip(pet.entity, 'Walking')
    if (!animator) return // Animator not set up yet
  } catch {
    return // Animator component doesn't exist
  }

  pet.data.isMoving = true
  try {
    Animator.playSingleAnimation(pet.entity, 'Walking')
  } catch (error) {
    // Walking animation not found
  }
}

// Play idle animation
export function playIdle(pet: Pet) {
  if (!pet.entity) return

  // Only switch to idle if currently moving
  if (!pet.data.isMoving) return

  // Check if Animator component exists
  try {
    const animator = Animator.getClip(pet.entity, 'Idle')
    if (!animator) return // Animator not set up yet
  } catch {
    return // Animator component doesn't exist
  }

  pet.data.isMoving = false
  try {
    Animator.playSingleAnimation(pet.entity, 'Idle')
  } catch (error) {
    // Idle animation not found
  }
}

// Play sleep animation
export function playSleep(pet: Pet) {
  if (!pet.entity) return

  // Check if Animator component exists
  try {
    const animator = Animator.getClip(pet.entity, 'Sleep')
    if (!animator) return // Animator not set up yet
  } catch {
    return // Animator component doesn't exist
  }

  try {
    Animator.playSingleAnimation(pet.entity, 'Sleep')
  } catch (error) {
    // Sleep animation not found
  }
}

// Play drinking animation
export function playDrinking(pet: Pet) {
  if (!pet.entity) return

  try {
    // Use playSingleAnimation - it properly stops other animations and starts this one
    // The isDrinking flag ensures this only runs once, so no continuous restarting
    Animator.playSingleAnimation(pet.entity, 'Drinking')
    console.log('🥤 Playing drinking animation (looping)')
  } catch (error) {
    console.log('🥤 Drinking animation not available, using idle')
    playIdle(pet)
  }
}
