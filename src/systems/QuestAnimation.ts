import { engine } from '@dcl/sdk/ecs'
import { QuestAnimationComponent } from '../components/Quest'
import { QUEST_ANIMATION_DURATION } from '../utils/constants'

/**
 * Quest Animation System
 * Handles carousel-style animations when quests complete
 *
 * Animation flow:
 * 1. Complete: Square pulses (scale 1.0 -> 1.2 -> 1.0), color changes gray -> green
 * 2. Slide Out: Completed row slides up and fades out
 * 3. Slide In: Next quest slides into active position and scales up
 */

interface AnimationState {
  questIndex: number
  phase: 'pulse' | 'slideOut' | 'slideIn' | 'idle'
  elapsedTime: number
  startValues: {
    scale: number
    opacity: number
    yOffset: number
  }
  targetValues: {
    scale: number
    opacity: number
    yOffset: number
  }
}

// Track animation state (one animation at a time)
let currentAnimation: AnimationState | null = null

/**
 * Start a quest completion animation
 */
export function startQuestCompletionAnimation(questIndex: number) {
  if (currentAnimation) {
    console.log('Animation already in progress, skipping')
    return
  }

  currentAnimation = {
    questIndex,
    phase: 'pulse',
    elapsedTime: 0,
    startValues: { scale: 1.0, opacity: 1.0, yOffset: 0 },
    targetValues: { scale: 1.2, opacity: 1.0, yOffset: 0 }
  }

  console.log(`Starting quest completion animation for quest ${questIndex}`)
}

/**
 * Quest Animation System - runs every frame
 */
export function questAnimationSystem(dt: number) {
  if (!currentAnimation) return

  currentAnimation.elapsedTime += dt
  const progress = Math.min(currentAnimation.elapsedTime / QUEST_ANIMATION_DURATION, 1.0)

  switch (currentAnimation.phase) {
    case 'pulse':
      handlePulsePhase(progress)
      break
    case 'slideOut':
      handleSlideOutPhase(progress)
      break
    case 'slideIn':
      handleSlideInPhase(progress)
      break
  }
}

/**
 * Phase 1: Pulse animation (square scales up then down)
 */
function handlePulsePhase(progress: number) {
  if (!currentAnimation) return

  // Ease in-out quad
  const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

  // Scale up to 1.2, then back to 1.0 (ping-pong)
  const scale = progress < 0.5 ? 1.0 + easedProgress * 0.4 : 1.2 - (easedProgress - 0.5) * 0.4

  // Animation complete, move to slide out
  if (progress >= 1.0) {
    currentAnimation.phase = 'slideOut'
    currentAnimation.elapsedTime = 0
    currentAnimation.startValues = { scale: 1.0, opacity: 1.0, yOffset: 0 }
    currentAnimation.targetValues = { scale: 0.8, opacity: 0, yOffset: -20 }
    console.log('Pulse complete, starting slide out')
  }
}

/**
 * Phase 2: Slide out animation (completed row fades and slides up)
 */
function handleSlideOutPhase(progress: number) {
  if (!currentAnimation) return

  // Ease out
  const easedProgress = 1 - Math.pow(1 - progress, 2)

  const opacity = 1.0 - easedProgress
  const yOffset = -20 * easedProgress
  const scale = 1.0 - 0.2 * easedProgress

  // Animation complete, move to slide in
  if (progress >= 1.0) {
    currentAnimation.phase = 'slideIn'
    currentAnimation.elapsedTime = 0
    currentAnimation.startValues = { scale: 0.85, opacity: 0.5, yOffset: 20 }
    currentAnimation.targetValues = { scale: 1.0, opacity: 1.0, yOffset: 0 }
    console.log('Slide out complete, starting slide in')
  }
}

/**
 * Phase 3: Slide in animation (next quest becomes active)
 */
function handleSlideInPhase(progress: number) {
  if (!currentAnimation) return

  // Ease out
  const easedProgress = 1 - Math.pow(1 - progress, 2)

  const opacity = 0.5 + 0.5 * easedProgress
  const yOffset = 20 - 20 * easedProgress
  const scale = 0.85 + 0.15 * easedProgress

  // Animation complete
  if (progress >= 1.0) {
    console.log('Quest animation complete!')
    currentAnimation = null
  }
}

/**
 * Get current animation progress (for UI rendering)
 * Returns null if no animation active
 */
export function getAnimationProgress(): {
  questIndex: number
  phase: string
  scale: number
  opacity: number
  yOffset: number
} | null {
  if (!currentAnimation) return null

  const progress = Math.min(currentAnimation.elapsedTime / QUEST_ANIMATION_DURATION, 1.0)

  // Calculate current values based on phase
  let scale = 1.0
  let opacity = 1.0
  let yOffset = 0

  switch (currentAnimation.phase) {
    case 'pulse':
      const easedPulse = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
      scale = progress < 0.5 ? 1.0 + easedPulse * 0.4 : 1.2 - (easedPulse - 0.5) * 0.4
      opacity = 1.0
      yOffset = 0
      break

    case 'slideOut':
      const easedOut = 1 - Math.pow(1 - progress, 2)
      scale = 1.0 - 0.2 * easedOut
      opacity = 1.0 - easedOut
      yOffset = -20 * easedOut
      break

    case 'slideIn':
      const easedIn = 1 - Math.pow(1 - progress, 2)
      scale = 0.85 + 0.15 * easedIn
      opacity = 0.5 + 0.5 * easedIn
      yOffset = 20 - 20 * easedIn
      break
  }

  return {
    questIndex: currentAnimation.questIndex,
    phase: currentAnimation.phase,
    scale,
    opacity,
    yOffset
  }
}

/**
 * Reset animation system
 */
export function resetQuestAnimationSystem() {
  currentAnimation = null
  console.log('Quest animation system reset')
}



