// Game Constants - Magic numbers extracted for maintainability

// Time System Constants
export const TIME_UPDATE_INTERVAL = 1.0 // seconds between time updates
export const MOOD_DECAY_RATE = 5 // mood points lost per update
export const HUNGER_GROWTH_RATE = 1 // hunger points gained per update

// Pet Stats Constants
export const MAX_MOOD = 100
export const MAX_HUNGER = 100
export const MIN_MOOD = 0
export const MIN_HUNGER = 0
export const SAD_MOOD_THRESHOLD = 20 // mood below this = SAD state

// Interaction Constants
export const PET_MOOD_BOOST = 10 // mood increase when petting
export const FEED_HUNGER_REDUCTION = 20 // hunger decrease when feeding
export const FEED_MOOD_BOOST = 5 // mood increase when feeding
export const PLAY_MOOD_BOOST = 15 // mood increase when playing
export const PLAY_HUNGER_INCREASE = 5 // hunger increase when playing

// Movement System Constants
export const PLAYER_MOVEMENT_THRESHOLD = 0.1 // units of movement before menu closes

// Render System Constants
export const MOOD_BAR_MAX_SCALE = 1.5 // maximum width of mood bar
export const MOOD_BAR_MIN_SCALE = 0.01 // minimum width to avoid invisible bar

// Menu Position Constants
export const MENU_HEIGHT_OFFSET = 1.5 // units above pet position
