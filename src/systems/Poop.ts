import { engine, Transform, Entity, VisibilityComponent } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { PetComponent } from '../components/Pet'
import { EntityNames } from '../../assets/scene/entity-names'
import { getTodayUTC } from '../components/Quest'

// =============================================================================
// SIMPLIFIED POOP SYSTEM
// Uses direct visibility control - no complex components or pooling manager
// =============================================================================

const POOP_SPAWN_INTERWAL_MIN = 10
const POOP_SPAWN_INTERWAL_MAX = 60

// Simple poop entity references (7 pre-placed entities)
const poopEntities: Entity[] = []

let timeSinceLastSpawn = 0
let nextSpawnInterval = getRandomSpawnInterval() // 10-60 seconds

/**
 * Initialize the poop system with the 7 pre-placed entities
 */
export function initializePoopSystem() {
  // Get the 7 pre-placed poop entities
  poopEntities.push(
    engine.getEntityOrNullByName(EntityNames.Poop_1)!,
    engine.getEntityOrNullByName(EntityNames.Poop_2)!,
    engine.getEntityOrNullByName(EntityNames.Poop_3)!,
    engine.getEntityOrNullByName(EntityNames.Poop_4)!,
    engine.getEntityOrNullByName(EntityNames.Poop_5)!,
    engine.getEntityOrNullByName(EntityNames.Poop_6)!,
    engine.getEntityOrNullByName(EntityNames.Poop_7)!
  )

  // Check persistence for yesterday's login - spawn all if needed
  checkYesterdayLogin()

  console.log('Poop system initialized with 7 entities')
}

/**
 * Check if last login was yesterday and spawn all poops if so
 */
function checkYesterdayLogin() {
  // This would need to be implemented based on your persistence system
  // For now, just check if there are any visible poops already
  const hasVisiblePoops = poopEntities.some((entity) => VisibilityComponent.get(entity).visible)

  // If no poops are visible, assume it's a fresh session
  // You would replace this with actual persistence check
  if (!hasVisiblePoops && shouldSpawnYesterdayPoops()) {
    console.log('Yesterday login detected - spawning all poops')
    poopEntities.forEach((entity) => makePoopVisible(entity))
  }
}

/**
 * Check if we should spawn yesterday's poops based on last visit date
 */
function shouldSpawnYesterdayPoops(): boolean {
  // This function should be called after persistence data is loaded
  // For now, we'll implement a simple check - in a real implementation,
  // this would check the saved lastVisitDate against today's date
  return false // Placeholder - will be updated when persistence is integrated
}

/**
 * Called from persistence system when pet data is restored
 * Checks if last login was yesterday and spawns all poops if needed
 */
export function checkYesterdayLoginOnLoad(lastVisitDate?: string) {
  if (!lastVisitDate) return

  const today = getTodayUTC()
  const yesterday = getYesterdayUTC()

  if (lastVisitDate === yesterday) {
    console.log('Yesterday login detected - spawning all poops')
    poopEntities.forEach((entity) => makePoopVisible(entity))
  }
}

/**
 * Get yesterday's date in UTC format (YYYY-MM-DD)
 */
function getYesterdayUTC(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

export function poopSystem(dt: number) {
  timeSinceLastSpawn += dt

  if (timeSinceLastSpawn >= nextSpawnInterval) {
    spawnRandomPoop()
    timeSinceLastSpawn = 0
    nextSpawnInterval = getRandomSpawnInterval()
  }
}

function getRandomSpawnInterval(): number {
  return POOP_SPAWN_INTERWAL_MIN + Math.random() * (POOP_SPAWN_INTERWAL_MAX - POOP_SPAWN_INTERWAL_MIN)
}

function spawnRandomPoop() {
  const invisiblePoops = getInvisiblePoops()
  if (invisiblePoops.length === 0) {
    console.log('All poops already visible - cannot spawn more')
    return
  }

  const randomPoop = invisiblePoops[Math.floor(Math.random() * invisiblePoops.length)]

  // Figure out later how to place poop nearby the pet
  // If at all needed. current distributon looks good.
  // Find pet position and place poop nearby
  // const petEntities = engine.getEntitiesWith(PetComponent)
  // const petEntity = Array.from(petEntities)[0]?.[0]
  // if (petEntity) {
  //   const petTransform = Transform.getOrNull(petEntity)
  //   if (petTransform) {
  //     const transform = Transform.getMutable(randomPoop)
  //     transform.position = Vector3.create(
  //       petTransform.position.x - 0.5 + Math.random() * 0.3,
  //       0.1, // Slightly above ground
  //       petTransform.position.z - 0.5 + Math.random() * 0.3
  //     )
  //   }
  // }

  makePoopVisible(randomPoop)
  console.log(`💩 Poop spawned! Active poops: ${getActivePoopCount()}`)
}

// Simple visibility helpers
function makePoopVisible(entity: Entity) {
  const visibility = VisibilityComponent.getMutable(entity)
  visibility.visible = true
}

function makePoopInvisible(entity: Entity) {
  const visibility = VisibilityComponent.getMutable(entity)
  visibility.visible = false
}

// Collection function (called when player clicks poop)
export function collectPoop(poopEntity: Entity) {
  // Only hide if it's currently visible
  if (!VisibilityComponent.get(poopEntity).visible) return

  makePoopInvisible(poopEntity)
  console.log(`🧹 Poop collected! Active poops: ${getActivePoopCount()}`)
}

// Utility functions
function getVisiblePoops(): Entity[] {
  return poopEntities.filter((entity) => VisibilityComponent.get(entity).visible)
}

function getInvisiblePoops(): Entity[] {
  return poopEntities.filter((entity) => !VisibilityComponent.get(entity).visible)
}

export function getActivePoopCount(): number {
  return getVisiblePoops().length
}

// Debug function (optional)
export function forceSpawnPoop() {
  spawnRandomPoop()
}

// Reset function (for game reset)
export function resetPoopSystem() {
  poopEntities.forEach((entity) => makePoopInvisible(entity))
  timeSinceLastSpawn = 0
  nextSpawnInterval = getRandomSpawnInterval()
  console.log('Poop system reset')
}
