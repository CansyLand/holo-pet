// Quest Animation System - Carousel-style animations for quest completion
// Based on the old implementation with pulse, slide out, and slide in phases

import { QUEST_ANIMATION_DURATION, QUEST_COMPLETE_SCALE_PULSE, QUEST_SLIDE_DISTANCE } from '../utils/constants'

/**
 * Animation state interface - tracks current animation progress
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

/**
 * Animation progress return type for UI rendering
 */
export interface AnimationProgress {
  questIndex: number
  phase: string
  scale: number
  opacity: number
  yOffset: number
}

// Track animation state (one animation at a time)
let currentAnimation: AnimationState | null = null

/**
 * Start a quest completion animation
 * Called when a quest is completed to trigger the animation sequence
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
    targetValues: { scale: QUEST_COMPLETE_SCALE_PULSE, opacity: 1.0, yOffset: 0 }
  }

  console.log(`Starting quest completion animation for quest ${questIndex}`)
}

/**
 * Update animation state - called every frame by the UI system
 */
export function updateQuestAnimation(dt: number) {
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
 * Creates a satisfying "pop" effect when quest completes
 */
function handlePulsePhase(progress: number) {
  if (!currentAnimation) return

  // Ease in-out quad for smooth scaling
  const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

  // Scale up to QUEST_COMPLETE_SCALE_PULSE, then back to 1.0 (ping-pong effect)
  // Note: This phase doesn't actually change visual properties - it's just timing
  // The actual visual pulse would be handled by the UI component using getAnimationProgress

  // Animation complete, move to slide out
  if (progress >= 1.0) {
    currentAnimation.phase = 'slideOut'
    currentAnimation.elapsedTime = 0
    currentAnimation.startValues = { scale: 1.0, opacity: 1.0, yOffset: 0 }
    currentAnimation.targetValues = { scale: 0.8, opacity: 0, yOffset: QUEST_SLIDE_DISTANCE }
    console.log('Pulse complete, starting slide out')
  }
}

/**
 * Phase 2: Slide out animation (completed row fades and slides up)
 * Makes room for the next quest to slide into the active position
 */
function handleSlideOutPhase(progress: number) {
  if (!currentAnimation) return

  // Ease out for smooth exit
  const easedProgress = 1 - Math.pow(1 - progress, 2)

  // Animation complete, move to slide in
  if (progress >= 1.0) {
    currentAnimation.phase = 'slideIn'
    currentAnimation.elapsedTime = 0
    currentAnimation.startValues = { scale: 0.85, opacity: 0.5, yOffset: QUEST_SLIDE_DISTANCE }
    currentAnimation.targetValues = { scale: 1.0, opacity: 1.0, yOffset: 0 }
    console.log('Slide out complete, starting slide in')
  }
}

/**
 * Phase 3: Slide in animation (next quest becomes active)
 * Brings the next quest into focus with a smooth entrance
 */
function handleSlideInPhase(progress: number) {
  if (!currentAnimation) return

  // Ease out for smooth entrance
  const easedProgress = 1 - Math.pow(1 - progress, 2)

  // Animation complete
  if (progress >= 1.0) {
    console.log('Quest animation complete!')
    currentAnimation = null
  }
}

/**
 * Get current animation progress for UI rendering
 * Returns null if no animation is active
 */
export function getAnimationProgress(): AnimationProgress | null {
  if (!currentAnimation) return null

  const progress = Math.min(currentAnimation.elapsedTime / QUEST_ANIMATION_DURATION, 1.0)

  // Calculate current values based on phase
  let scale = 1.0
  let opacity = 1.0
  let yOffset = 0

  switch (currentAnimation.phase) {
    case 'pulse':
      // Pulse: Scale oscillates between 1.0 and QUEST_COMPLETE_SCALE_PULSE
      const easedPulse = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
      scale =
        progress < 0.5
          ? 1.0 + easedPulse * (QUEST_COMPLETE_SCALE_PULSE - 1.0)
          : QUEST_COMPLETE_SCALE_PULSE - (easedPulse - 0.5) * (QUEST_COMPLETE_SCALE_PULSE - 1.0)
      opacity = 1.0
      yOffset = 0
      break

    case 'slideOut':
      // Slide out: Fade and slide up while scaling down
      const easedOut = 1 - Math.pow(1 - progress, 2)
      scale = 1.0 - 0.2 * easedOut
      opacity = 1.0 - easedOut
      yOffset = QUEST_SLIDE_DISTANCE * easedOut
      break

    case 'slideIn':
      // Slide in: Fade in, slide down, and scale up
      const easedIn = 1 - Math.pow(1 - progress, 2)
      scale = 0.85 + 0.15 * easedIn
      opacity = 0.5 + 0.5 * easedIn
      yOffset = QUEST_SLIDE_DISTANCE - QUEST_SLIDE_DISTANCE * easedIn
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
 * Check if an animation is currently active
 */
export function isAnimationActive(): boolean {
  return currentAnimation !== null
}

/**
 * Reset animation system (for cleanup)
 */
export function resetQuestAnimationSystem() {
  currentAnimation = null
  console.log('Quest animation system reset')
}

/**
 * Force complete current animation (for debugging/testing)
 */
export function forceCompleteAnimation() {
  if (currentAnimation) {
    currentAnimation.elapsedTime = QUEST_ANIMATION_DURATION
    // Let the next update call finish the animation
  }
}
