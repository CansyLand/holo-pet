// Game Constants - Magic numbers extracted for maintainability

// =============================================================================
// TIME SYSTEM CONSTANTS
// =============================================================================
export const TIME_UPDATE_INTERVAL = 1.0 // seconds between time updates
export const MOOD_DECAY_RATE = 5 // mood points lost per update
export const HUNGER_GROWTH_RATE = 1 // hunger points gained per update
export const ENERGY_RECOVERY_RATE = 2 // energy points gained per update when resting

// =============================================================================
// PET STATS CONSTANTS
// =============================================================================
export const MAX_MOOD = 100
export const MAX_HUNGER = 100
export const MAX_ENERGY = 100
export const MAX_CLEANLINESS = 100
export const MAX_BOND = 100
export const MIN_MOOD = 0
export const MIN_HUNGER = 0
export const MIN_ENERGY = 0
export const MIN_CLEANLINESS = 0
export const MIN_BOND = 0
export const SAD_MOOD_THRESHOLD = 20 // mood below this = SAD state

// =============================================================================
// PERSONALITY CONSTANTS
// =============================================================================
export const PERSONALITY_MIN = 20 // Minimum trait value (avoid extremes)
export const PERSONALITY_MAX = 80 // Maximum trait value (avoid extremes)

// =============================================================================
// BOND SYSTEM CONSTANTS
// =============================================================================
export const BOND_DECAY_RATE = 5 // Bond points lost per check when abandoned
export const ABANDON_THRESHOLD = 86400 // 24 hours in seconds before bond starts decaying
export const BOND_CHECK_INTERVAL = 60 // Check bond every 60 seconds

// Trust Level Thresholds
export const TRUST_STRANGER = 20
export const TRUST_ACQUAINTANCE = 40
export const TRUST_FRIEND = 60
export const TRUST_BONDED = 80

// =============================================================================
// HYGIENE SYSTEM CONSTANTS
// =============================================================================
export const HYGIENE_DECAY_RATE = 2 // Cleanliness lost per interval
export const HYGIENE_INTERVAL = 30 // Seconds between cleanliness decay
export const DIRTY_THRESHOLD = 40 // Show stink effect below this
export const FILTHY_THRESHOLD = 20 // Show flies below this
export const DIRTY_MOOD_PENALTY = 2 // Mood penalty per update when dirty
export const FILTHY_MOOD_PENALTY = 5 // Mood penalty per update when filthy

// =============================================================================
// POOP SYSTEM CONSTANTS
// =============================================================================
export const POOP_POOL_SIZE = 10 // Number of pre-allocated poop entities
export const POOP_INTERVAL = 120 // Seconds between poop chances
export const POOP_CHANCE = 0.3 // 30% chance per interval
export const POOP_MOOD_PENALTY = 5 // Mood penalty per active poop
export const POOLED_POSITION_Y = -10 // Y position for hidden pooled entities

// =============================================================================
// INTERACTION CONSTANTS - EXISTING
// =============================================================================
export const PET_MOOD_BOOST = 10 // mood increase when petting
export const PET_BOND_BOOST = 3 // bond increase when petting
export const FEED_HUNGER_REDUCTION = 30 // hunger decrease when feeding (bowl)
export const FEED_MOOD_BOOST = 5 // mood increase when feeding
export const FEED_BOND_BOOST = 2 // bond increase when feeding
export const PLAY_MOOD_BOOST = 15 // mood increase when playing
export const PLAY_HUNGER_INCREASE = 5 // hunger increase when playing
export const PLAY_ENERGY_DECREASE = 20 // energy decrease when playing
export const ENERGY_REST_THRESHOLD = 20 // energy below this = pet only sits
export const PLAY_BOND_BOOST = 3 // bond increase when playing
export const PLAY_CLEANLINESS_DECREASE = 5 // cleanliness decrease when playing

// =============================================================================
// INTERACTION CONSTANTS - NEW (TAMAGOTCHI)
// =============================================================================
// Treats
export const TREAT_HUNGER_REDUCTION = 10 // Less effective than food bowl
export const TREAT_MOOD_BOOST = 15 // But more satisfying
export const TREAT_BOND_BOOST = 5 // And builds more trust

// Bathing
export const BATHE_CLEANLINESS_BOOST = 50 // Full bath
export const BATHE_MOOD_BOOST = 10
export const BATHE_BOND_BOOST = 2

// Brushing
export const BRUSH_CLEANLINESS_BOOST = 20 // Quick groom
export const BRUSH_MOOD_BOOST = 5
export const BRUSH_BOND_BOOST = 1

// Poop Collection
export const COLLECT_POOP_MOOD_BOOST = 10
export const COLLECT_POOP_CLEANLINESS_BOOST = 5
export const COLLECT_POOP_BOND_BOOST = 1

// Poop Cleanliness Penalty (per active poop)
export const POOP_CLEANLINESS_PENALTY = 10

// Water Bowl
export const WATER_MOOD_BOOST = 3
export const WATER_BOND_BOOST = 1

// =============================================================================
// MOVEMENT SYSTEM CONSTANTS
// =============================================================================
export const PLAYER_MOVEMENT_THRESHOLD = 0.1 // units of movement before menu closes
export const PET_MOVE_SPEED = 2.0 // Units per second for pet movement
export const PET_WANDER_RADIUS = 5.0 // Max distance from center for wandering
export const PET_APPROACH_DISTANCE = 2.0 // How close pet gets to player

// =============================================================================
// BEHAVIOR SYSTEM CONSTANTS
// =============================================================================
export const HUNGRY_THRESHOLD = 70 // Hunger above this = seek food
export const NEEDS_BATH_THRESHOLD = 40 // Cleanliness below this = seek bath
export const BORED_THRESHOLD = 30 // Seconds idle before wandering
export const PLAYER_PROXIMITY_RADIUS = 8.0 // Distance to detect player nearby
export const BEHAVIOR_COMMITMENT_TIME = 5.0 // Seconds to commit to a behavior before re-evaluating
export const PLAYER_IDLE_PREFERENCE_TIME = 20.0 // Seconds of player inactivity before seeking preferred activity
export const FOLLOW_THINKING_DELAY = 2.0 // Seconds pet "thinks" before starting to follow player
export const FOLLOW_UPDATE_INTERVAL = 1.5 // How often to update follow target (seconds)
export const FOLLOW_HYSTERESIS_DISTANCE = 3.0 // Minimum distance player must move before pet reacts

// =============================================================================
// RENDER SYSTEM CONSTANTS
// =============================================================================
export const MOOD_BAR_MAX_SCALE = 1.5 // maximum width of mood bar
export const MOOD_BAR_MIN_SCALE = 0.01 // minimum width to avoid invisible bar

// =============================================================================
// CURSOR FOLLOW SYSTEM CONSTANTS
// =============================================================================
export const CURSOR_FOLLOW_MAX_TILT = 15 // Max tilt in degrees
export const CURSOR_FOLLOW_LERP_SPEED = 5 // Smoothing factor

// =============================================================================
// MENU POSITION CONSTANTS
// =============================================================================
export const MENU_HEIGHT_OFFSET = 1.5 // units above pet position

// =============================================================================
// SCENE CONSTANTS
// =============================================================================
export const SCENE_CENTER_X = 16 // Center of 2x2 parcel
export const SCENE_CENTER_Z = 16
export const PLAY_AREA_POSITION_X = SCENE_CENTER_X - 3 // X position of play area (toy ball)
export const PLAY_AREA_POSITION_Z = SCENE_CENTER_Z - 2 // Z position of play area (toy ball)

// =============================================================================
// PERSISTENCE CONSTANTS
// =============================================================================
export const API_BASE_URL = 'https://us-central1-cansy-decentraland.cloudfunctions.net/petApi'
export const AUTO_SAVE_INTERVAL = 60 // seconds
export const SAVE_DEBOUNCE_TIME = 30 // Increased debounce time (min time between saves)
export const SAVE_RETRY_DELAY = 10 // seconds to wait before retrying failed saves
export const PERSISTENCE_VERSION = '1.0.0' // Schema version
