// Pet type definitions - enums and interfaces

import { Vector3 } from '@dcl/sdk/math'

export enum Species {
  TIGER = 'tiger' // For now only tiger is supported
}

export enum PetState {
  IDLE = 'idle',
  EATING = 'eating',
  SLEEPING = 'sleeping',
  SAD = 'sad',
  WANDERING = 'wandering',
  SEEKING_FOOD = 'seeking_food',
  DRINKING_FROM_BOWL = 'drinking_from_bowl',
  SEEKING_BATH = 'seeking_bath',
  SEEKING_BED = 'seeking_bed',
  SEEKING_BALL = 'seeking_ball',
  SEEKING_DECORATION = 'seeking_decoration',
  SEEKING_POOP = 'seeking_poop',
  FOLLOWING_PLAYER = 'following_player'
}

export enum TrustLevel {
  STRANGER = 'stranger', // 0-20: Pet avoids player
  ACQUAINTANCE = 'acquaintance', // 21-40: Pet tolerates player
  FRIEND = 'friend', // 41-60: Pet approaches player
  BONDED = 'bonded', // 61-80: Pet follows player, occasional hearts
  SOULMATE = 'soulmate' // 81-100: Constant hearts, special animations
}

export interface PetPersonality {
  energy: number // High = moves more, hunger grows faster
  sociability: number // High = seeks player, bigger petting boost
  cleanliness: number // High = gets dirty faster, hates being dirty
  appetite: number // High = hungry faster, loves food more
}

export interface CursorFollowConfig {
  isActive: boolean
  baseRotation: { x: number; y: number; z: number; w: number }
  maxTiltAngle: number
}

export interface BathModeConfig {
  isActive: boolean
  clickCount: number
  startPosition: { x: number; y: number; z: number }
}

export interface PetQuests {
  feed: boolean
  play: boolean
  bath: boolean
  bedtime: boolean
}

export interface PetData {
  // Identity
  name: string
  species: Species
  hatchedAt: number
  ownerId: string

  // Core stats (0-100 scale)
  mood: number
  hunger: number // 0 = full, 100 = starving
  energy: number // 0 = exhausted, 100 = full energy
  cleanliness: number // 0 = filthy, 100 = pristine
  bond: number // 0-100 relationship level

  // Personality traits (permanent, generated at hatch)
  personality: PetPersonality

  // State and behavior
  state: PetState
  position: { x: number; y: number; z: number }
  lastVisit: number
  lastBathTime: number
  lastBrushTime: number

  // State timing for flexibility
  stateStartTime: number
  stateDuration: number

  // Quest progress
  quests: PetQuests

  // Cursor follow config (for focus mode)
  cursorFollow: CursorFollowConfig

  // Bath mode config
  bathMode: BathModeConfig

  // Autonomous behavior system
  activityTimer: number
  cachedPoopPosition: Vector3 | null
  isMoving: boolean
  isDrinking: boolean
  manualBedSeeking: boolean
  lastDistanceLog?: number // For debug logging
}

// Create initial pet data with default values
export function createInitialPetData(species: Species): PetData {
  return {
    name: 'Unnamed Pet',
    species,
    hatchedAt: Date.now(),
    ownerId: '',

    mood: 100,
    hunger: 0,
    energy: 100,
    cleanliness: 100,
    bond: 50,

    personality: {
      energy: 50,
      sociability: 70,
      cleanliness: 40,
      appetite: 60
    },

    state: PetState.IDLE,
    position: { x: 16, y: 0, z: 16 },
    lastVisit: Date.now(),
    lastBathTime: Date.now(),
    lastBrushTime: Date.now(),

    stateStartTime: Date.now(),
    stateDuration: 10000,

    quests: {
      feed: false,
      play: false,
      bath: false,
      bedtime: false
    },

    cursorFollow: {
      isActive: false,
      baseRotation: { x: 0, y: 0, z: 0, w: 1 },
      maxTiltAngle: 15
    },

    bathMode: {
      isActive: false,
      clickCount: 0,
      startPosition: { x: 0, y: 0, z: 0 }
    },

    activityTimer: 0,
    cachedPoopPosition: null,
    isMoving: false,
    isDrinking: false,
    manualBedSeeking: false
  }
}
