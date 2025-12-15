// EPIC: Pet Care Interactions - Particle Effects Story
// Generic particle pool for various effects - hearts, sparkles, bubbles, etc.
// Never destroys particles - just hides them in pool until needed.
// Simple spawn method with position/entity and color.

import { engine, Transform, MeshRenderer, Material, Entity } from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { game } from '../Game'
import { GameModule } from '../Game'

interface Particle {
  entity: Entity
  isActive: boolean
  spawnTime: number
  startPosition: Vector3
  lifetime: number
  color: string
}

export class ParticleModule implements GameModule {
  name = 'Particle'
  particlePool: Particle[] = []
  maxParticles = 3 // Pool size for performance
  particleLifetime = 1.5 // Seconds each particle lives
  particleRiseSpeed = 2.0 // Units per second

  init() {
    console.log('✨ Particle module initialized')
    this.initializeParticlePool()
  }

  update(dt: number) {
    this.updateParticles(dt)
  }

  // Spawn particles at position or entity position
  spawnParticles(target: Vector3 | Entity, color: string) {
    console.log(`✨ Spawning ${color} particles`)

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

    // Spawn multiple particles
    let spawned = 0
    for (const particle of this.particlePool) {
      if (spawned >= 5) break
      if (particle.isActive) continue

      this.activateParticle(particle, position, color)
      spawned++
    }

    console.log(`✨ Spawned ${spawned} ${color} particles`)
  }

  private activateParticle(particle: Particle, position: Vector3, color: string) {
    particle.isActive = true
    particle.spawnTime = Date.now() / 1000
    particle.startPosition = Vector3.clone(position)
    particle.color = color

    // Position with random horizontal offset
    const offsetX = (Math.random() - 0.5) * 1.2
    const offsetZ = (Math.random() - 0.5) * 1.2

    const transform = Transform.getMutable(particle.entity)
    transform.position = Vector3.create(
      position.x + offsetX,
      position.y + 1.0, // Start above target
      position.z + offsetZ
    )

    // Random slight scale variation
    const scale = 0.12 + Math.random() * 0.08
    transform.scale = Vector3.create(scale, scale, scale)

    // Set color
    this.setParticleColor(particle.entity, color)
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

  private updateParticles(dt: number) {
    const now = Date.now() / 1000

    for (const particle of this.particlePool) {
      if (!particle.isActive) continue

      const elapsed = now - particle.spawnTime

      // Check if lifetime expired
      if (elapsed >= particle.lifetime) {
        this.returnParticleToPool(particle)
        continue
      }

      // Animate: rise up with slight float
      const transform = Transform.getMutable(particle.entity)
      const progress = elapsed / particle.lifetime

      // Ease out for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 2)

      // Rise up
      const newY = particle.startPosition.y + 1.0 + easeOut * this.particleRiseSpeed * particle.lifetime
      transform.position.y = newY

      // Scale down as it fades (simulate fading)
      const fadeScale = 0.15 * (1 - progress * 0.8)
      transform.scale = Vector3.create(fadeScale, fadeScale, fadeScale)
    }
  }

  private returnParticleToPool(particle: Particle) {
    particle.isActive = false

    // Hide particle far away
    const transform = Transform.getMutable(particle.entity)
    transform.position = Vector3.create(1000, -1000, 1000) // Hidden position
  }

  // Initialize particle pool for performance
  private initializeParticlePool() {
    console.log('✨ Initializing particle pool')

    // Hidden position for pooled particles
    const pooledPosition = Vector3.create(1000, -1000, 1000)

    // Create pool of particle entities
    for (let i = 0; i < this.maxParticles; i++) {
      const entity = engine.addEntity()

      // Start in hidden position
      Transform.create(entity, {
        position: pooledPosition,
        scale: Vector3.create(0.15, 0.15, 0.15)
      })

      // Visual representation - cube
      MeshRenderer.setBox(entity)

      // Default material (will be changed when spawned)
      Material.setPbrMaterial(entity, {
        albedoColor: Color4.White(),
        roughness: 0.3
      })

      const particle: Particle = {
        entity,
        isActive: false,
        spawnTime: 0,
        startPosition: Vector3.Zero(),
        lifetime: this.particleLifetime,
        color: 'white'
      }

      this.particlePool.push(particle)
    }

    console.log(`✨ Created particle pool with ${this.maxParticles} particles`)
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
    for (const particle of this.particlePool) {
      if (particle.isActive) {
        this.returnParticleToPool(particle)
      }
    }
  }
}
