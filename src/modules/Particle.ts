// EPIC: Pet Care Interactions - Particle Effects Story
// Generic particle pool for various effects - hearts, sparkles, bubbles, etc.
// Uses efficient ECS pattern with custom Particle component and system updates.
// Large pool (30) allows rapid firing while still limiting to 3 particles per spawn.

import { engine, Transform, MeshRenderer, Material, Entity, Schemas } from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { game } from '../Game'
import { GameModule } from '../Game'

// Custom Particle component for efficient ECS queries
export const ParticleComponent = engine.defineComponent('ParticleComponent', {
  isActive: Schemas.Boolean,
  spawnTime: Schemas.Float,
  startPosition: Schemas.Vector3,
  lifetime: Schemas.Float,
  color: Schemas.String
})

export class ParticleModule implements GameModule {
  name = 'Particle'
  particlePoolSize = 30 // Larger pool for rapid firing
  particlesPerSpawn = 3 // Still only fire 3 at a time
  particleLifetime = 1.5 // Seconds each particle lives
  particleRiseSpeed = 2.0 // Units per second
  particleEntities: Entity[] = [] // Track all particle entities

  init() {
    console.log('✨ Particle module initialized with ECS pattern')
    this.initializeParticlePool()
    this.addParticleSystem()
  }

  update(dt: number) {
    // No longer needed - particleSystem handles updates via engine.addSystem()
  }

  // Spawn particles at position or entity position
  spawnParticles(target: Vector3 | Entity, color: string) {
    console.log(`✨ Spawning ${this.particlesPerSpawn} ${color} particles`)

    // Get target position
    let position: Vector3
    if (typeof target === 'object' && 'x' in target) {
      position = target as Vector3
    } else {
      const entity = target as Entity
      const transform = Transform.getOrNull(entity)
      if (!transform) return
      position = transform.position
    }

    // Find inactive particles to spawn
    let spawned = 0
    for (const entity of this.particleEntities) {
      if (spawned >= this.particlesPerSpawn) break

      const particle = ParticleComponent.getMutableOrNull(entity)
      if (!particle || particle.isActive) continue

      this.activateParticle(entity, position, color)
      spawned++
    }

    console.log(`✨ Spawned ${spawned} ${color} particles`)
  }

  private activateParticle(entity: Entity, position: Vector3, color: string) {
    const particle = ParticleComponent.getMutable(entity)
    particle.isActive = true
    particle.spawnTime = Date.now() / 1000
    particle.startPosition = Vector3.clone(position)
    particle.color = color

    // Position with random horizontal offset
    const offsetX = (Math.random() - 0.5) * 1.2
    const offsetZ = (Math.random() - 0.5) * 1.2

    const transform = Transform.getMutable(entity)
    transform.position = Vector3.create(
      position.x + offsetX,
      position.y + 1.0, // Start above target
      position.z + offsetZ
    )

    // Random slight scale variation
    const scale = 0.12 + Math.random() * 0.08
    transform.scale = Vector3.create(scale, scale, scale)

    // Set color
    this.setParticleColor(entity, color)
  }

  private setParticleColor(entity: Entity, color: string) {
    let particleColor: Color4

    switch (color.toLowerCase()) {
      case 'pink':
      case 'heart':
        particleColor = Color4.create(1.0, 0.4, 0.6, 1) // Rosa pink
        break
      case 'yellow':
      case 'play':
        particleColor = Color4.create(1.0, 0.9, 0.2, 1) // Bright yellow
        break
      case 'blue':
      case 'water':
        particleColor = Color4.create(0.3, 0.7, 1.0, 1) // Light blue
        break
      case 'green':
      case 'food':
        particleColor = Color4.create(0.4, 0.9, 0.4, 1) // Light green
        break
      case 'purple':
      case 'magic':
        particleColor = Color4.create(0.8, 0.4, 1.0, 1) // Purple
        break
      default:
        particleColor = Color4.create(1.0, 1.0, 1.0, 1) // White fallback
    }

    Material.setPbrMaterial(entity, {
      albedoColor: particleColor,
      emissiveColor: Color4.create(particleColor.r * 0.8, particleColor.g * 0.8, particleColor.b * 0.8, 1),
      emissiveIntensity: 0.3,
      roughness: 0.3
    })
  }

  // Efficient ECS particle system - runs automatically via engine
  private addParticleSystem() {
    const particleSystem = (dt: number) => {
      const now = Date.now() / 1000

      // Loop over all entities with ParticleComponent - this is the efficient ECS way!
      for (const [entity, particle] of engine.getEntitiesWith(ParticleComponent)) {
        if (!particle.isActive) continue

        const elapsed = now - particle.spawnTime

        // Check if lifetime expired
        if (elapsed >= particle.lifetime) {
          this.returnParticleToPool(entity)
          continue
        }

        // Get mutable transform for this entity
        const transform = Transform.getMutable(entity)

        // Animate: rise up with slight float
        const progress = elapsed / particle.lifetime

        // Ease out for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 2)

        // Rise up
        const newY = particle.startPosition.y + 1.0 + easeOut * this.particleRiseSpeed * particle.lifetime
        transform.position = Vector3.create(transform.position.x, newY, transform.position.z)

        // Scale down as it fades (simulate fading)
        const fadeScale = 0.15 * (1 - progress * 0.8)
        transform.scale = Vector3.create(fadeScale, fadeScale, fadeScale)
      }
    }

    engine.addSystem(particleSystem)
  }

  private returnParticleToPool(entity: Entity) {
    const particle = ParticleComponent.getMutable(entity)
    particle.isActive = false

    // Hide particle far away
    const transform = Transform.getMutable(entity)
    transform.position = Vector3.create(1000, -1000, 1000) // Hidden position
  }

  // Initialize larger particle pool for performance
  private initializeParticlePool() {
    console.log('✨ Initializing particle pool with ECS pattern')

    // Hidden position for pooled particles
    const pooledPosition = Vector3.create(1000, -1000, 1000)

    // Create larger pool of particle entities
    for (let i = 0; i < this.particlePoolSize; i++) {
      const entity = engine.addEntity()

      // Start in hidden position
      Transform.create(entity, {
        position: pooledPosition,
        scale: Vector3.create(0.15, 0.15, 0.15)
      })

      // Add custom Particle component
      ParticleComponent.create(entity, {
        isActive: false,
        spawnTime: 0,
        startPosition: Vector3.Zero(),
        lifetime: this.particleLifetime,
        color: 'white'
      })

      // Visual representation - cube
      MeshRenderer.setBox(entity)

      // Default material (will be changed when spawned)
      Material.setPbrMaterial(entity, {
        albedoColor: Color4.White(),
        roughness: 0.3
      })

      this.particleEntities.push(entity)
    }

    console.log(`✨ Created particle pool with ${this.particlePoolSize} particles using ECS pattern`)
  }

  // Ready for expansion: different particle shapes
  setParticleShape(shape: string) {
    // TODO: Support different shapes (hearts, stars, bubbles, etc.)
    console.log(`✨ Setting particle shape to ${shape}`)
  }

  // Ready for expansion: particle trails
  enableTrails(enabled: boolean) {
    // TODO: Add particle trail effects
    console.log(`✨ Particle trails ${enabled ? 'enabled' : 'disabled'}`)
  }

  cleanup() {
    console.log('✨ Particle module cleanup')
    // Hide all active particles
    for (const entity of this.particleEntities) {
      const particle = ParticleComponent.getMutableOrNull(entity)
      if (particle?.isActive) {
        this.returnParticleToPool(entity)
      }
    }
  }
}
