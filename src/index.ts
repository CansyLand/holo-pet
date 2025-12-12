import { engine, PointerLock } from '@dcl/sdk/ecs'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { createGameEntity } from './factories/Game'
import { createEgg } from './factories/Pet'
import { createTechEnvironment } from './factories/Environment'
import { createHeadlessPlayer } from './playlistPlayer/jukeboxHeadless'
import { inputSystemCallback } from './systems/Input'
import { logicSystem } from './systems/Logic'
import { timeSystem } from './systems/Time'
import { renderSystem } from './systems/Render'
import { movementSystem } from './systems/Movement'
import { menuPositionSystem } from './systems/MenuPosition'
import { animationSystem } from './systems/Animation'
import { cursorFollowSystem } from './systems/CursorFollow'
// Tamagotchi systems
import { behaviorSystem } from './systems/Behavior'
import { bondSystem } from './systems/Bond'
import { hygieneSystem } from './systems/Hygiene'
import { poopSystem } from './systems/Poop'
import { heartParticleSystem } from './systems/HeartParticle'
import { snowSystem } from './systems/Snow'
import { namingSystem, NamingUI } from './factories/NamingUI'
import { StatsUI } from './factories/StatsUI'
import { VisitUI } from './factories/VisitUI'
import { LeaderboardUI } from './factories/LeaderboardUI'
import { QuestUI } from './factories/QuestUI'
// Persistence system
import { initPersistence, persistenceSystem } from './systems/Persistence'
// Multiplayer system
import { initVisitSystem } from './systems/Visit'
import { createAvatarHider, ensureLocalPlayerVisible } from './factories/AvatarHider'
// Snow system
import { createSnowPool } from './factories/SnowPool'
import { shouldSnowBeActive } from './utils/theme'
// Needs UI system
import { needsUISystem } from './systems/NeedsUI'
// Quest system
import { initQuestSystem, checkDailyQuestReset, sleepSystem } from './systems/Quest'
import { questAnimationSystem } from './systems/QuestAnimation'

// =============================================================================
// SYSTEMS
// =============================================================================

/**
 * System to ensure local player avatar is always visible
 * Player data may not be available during initialization
 */
function avatarVisibilitySystem() {
  ensureLocalPlayerVisible()
}

// Combined UI renderer that shows all UI components
function CombinedUI() {
  return [NamingUI(), StatsUI(), VisitUI(), LeaderboardUI(), QuestUI()]
}

export function main() {
  // 1. Setup Core Systems
  engine.addSystem(inputSystemCallback)
  engine.addSystem(logicSystem)
  engine.addSystem(timeSystem)
  engine.addSystem(renderSystem)
  engine.addSystem(movementSystem) // Movement system closes menu when player walks away
  engine.addSystem(animationSystem) // After Movement so menu state changes are processed
  engine.addSystem(menuPositionSystem)
  engine.addSystem(cursorFollowSystem) // Cursor follow when camera is focused
  engine.addSystem(needsUISystem) // Optional cylindrical bars above pet

  // 2. Setup Tamagotchi Systems (Personality & Care)
  engine.addSystem(behaviorSystem) // Pet autonomous movement
  engine.addSystem(bondSystem) // Bond decay and runaway
  engine.addSystem(hygieneSystem) // Cleanliness decay
  engine.addSystem(poopSystem) // Poop spawning and collection
  engine.addSystem(heartParticleSystem) // Heart particles when petting
  engine.addSystem(snowSystem) // Snow particle system
  engine.addSystem(namingSystem) // Pet naming popup trigger

  // 3. Setup Quest System (Daily Quests)
  initQuestSystem() // Initialize quest state
  checkDailyQuestReset() // Check for daily reset on load
  engine.addSystem(sleepSystem) // Handle pet sleeping energy recharge
  engine.addSystem(questAnimationSystem) // Quest UI animations

  // 4. Setup Persistence System
  engine.addSystem(persistenceSystem)
  initPersistence() // Initialize persistence

  // 5. Setup Multiplayer System
  initVisitSystem() // Initialize visit coordination
  createAvatarHider() // Create avatar hiding area
  engine.addSystem(avatarVisibilitySystem) // Ensure local player is always visible

  // 6. Setup ReactECS UI (naming popup + debug stats + visit UI + leaderboard + quests)
  ReactEcsRenderer.setUiRenderer(CombinedUI)

  // 7. Initialize cursor state (locked by default)
  PointerLock.create(engine.CameraEntity, { isPointerLocked: true })

  // 8. Setup Scene
  createGameEntity()
  createHeadlessPlayer() // Initialize the playlist player jukebox
  createTechEnvironment()
  createEgg()

  // 9. Setup Snow System (theme-based activation)
  if (shouldSnowBeActive()) {
    createSnowPool() // Creates 50 billboarded snow particles
  }

  console.log('Holo Pet initialized with multiplayer, quests, persistence, and snow')
}
