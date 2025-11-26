import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { HeartParticleComponent, HeartPoolManager } from '../components/HeartParticle'
import { PetComponent } from '../components/Pet'
import { POOLED_POSITION_Y, SCENE_CENTER_X, SCENE_CENTER_Z } from '../utils/constants'
import { HEART_RISE_SPEED, HEARTS_PER_PET, HEART_LIFETIME, HEART_SPAWN_COOLDOWN } from '../factories/HeartPool'

// =============================================================================
// HEART PARTICLE SYSTEM
// Animates hearts rising from the pet when petted
// Handles spawning, animation, and returning to pool
// =============================================================================

// Module-level references to the pool (set by initializeHeartSystem)
let heartPool: Entity[] = []
let managerEntity: Entity | null = null

/**
 * Initialize the heart system with the pre-created pool
 * Called by HeartPool factory
 */
export function initializeHeartSystem(pool: Entity[], manager: Entity) {
  heartPool = pool
  managerEntity = manager
  console.log('Heart particle system initialized')
}

/**
 * Spawn hearts above the pet's position
 * Called when player pets the pet
 */
export function spawnHearts(petEntity: Entity) {
  if (!managerEntity) {
    console.log('Warning: Heart system not initialized')
    return
  }

  const manager = HeartPoolManager.getMutable(managerEntity)
  const now = Date.now() / 1000

  // Check cooldown
  if (now - manager.lastSpawnTime < HEART_SPAWN_COOLDOWN) {
    return
  }
  manager.lastSpawnTime = now

  // Get pet position
  const petTransform = Transform.getOrNull(petEntity)
  if (!petTransform) return

  const petPos = petTransform.position

  // Find inactive hearts and spawn them
  let spawned = 0
  for (const entity of heartPool) {
    if (spawned >= HEARTS_PER_PET) break

    const heart = HeartParticleComponent.getMutableOrNull(entity)
    if (!heart || heart.isActive) continue

    // Activate this heart
    heart.isActive = true
    heart.spawnTime = now
    heart.startY = petPos.y + 1.0  // Start above pet's base

    // Position with random horizontal offset for spread
    const offsetX = (Math.random() - 0.5) * 1.2
    const offsetZ = (Math.random() - 0.5) * 1.2

    const transform = Transform.getMutable(entity)
    transform.position = Vector3.create(
      petPos.x + offsetX,
      heart.startY,
      petPos.z + offsetZ
    )

    // Random slight scale variation
    const scale = 0.12 + Math.random() * 0.08
    transform.scale = Vector3.create(scale, scale, scale)

    spawned++
  }

  if (spawned > 0) {
    console.log(`Spawned ${spawned} hearts`)
  }
}

/**
 * Heart particle system - animates active hearts and returns them to pool
 */
export function heartParticleSystem(dt: number) {
  const now = Date.now() / 1000
  const pooledPosition = Vector3.create(SCENE_CENTER_X, POOLED_POSITION_Y, SCENE_CENTER_Z)

  // Update all active hearts
  for (const [entity] of engine.getEntitiesWith(HeartParticleComponent)) {
    const heart = HeartParticleComponent.getMutable(entity)

    if (!heart.isActive) continue

    const elapsed = now - heart.spawnTime

    // Check if lifetime expired
    if (elapsed >= heart.lifetime) {
      // Return to pool
      heart.isActive = false
      const transform = Transform.getMutable(entity)
      transform.position = pooledPosition
      continue
    }

    // Animate: rise up with slight float
    const transform = Transform.getMutable(entity)
    const progress = elapsed / heart.lifetime

    // Ease out for smooth deceleration
    const easeOut = 1 - Math.pow(1 - progress, 2)

    // Rise up
    const newY = heart.startY + (easeOut * HEART_RISE_SPEED * heart.lifetime)
    transform.position.y = newY

    // Scale down as it fades (simulate fading since we can't do opacity)
    // Use base scale of 0.15, shrink to 0 at end
    const fadeScale = 0.15 * (1 - progress * 0.8)
    transform.scale = Vector3.create(fadeScale, fadeScale, fadeScale)
  }
}

