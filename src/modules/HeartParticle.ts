// EPIC: Pet Care Interactions - Petting Interaction Story
// All heart particle logic together - spawning, animation, pooling, trigger conditions.
// Easy to remove: comment out one import, game still works.
// Pluggable effects system ready for expansion.

import { game } from '../Game'
import { GameModule } from '../Game'

export class HeartParticleModule implements GameModule {
  name = 'HeartParticle'
  activeParticles: any[] = []
  particlePool: any[] = []
  maxParticles = 20 // Pool size for performance

  init() {
    console.log('❤️ Heart particle module initialized')
    this.initializeParticlePool()
  }

  update(dt: number) {
    // Update all active particles
    this.updateParticles(dt)
  }

  // Spawn hearts when petting occurs
  spawnHearts(targetEntity: any) {
    console.log('❤️ Spawning heart particles')

    // Spawn multiple hearts
    for (let i = 0; i < 5; i++) {
      this.createHeartParticle(targetEntity)
    }
  }

  private createHeartParticle(targetEntity: any) {
    // Get particle from pool or create new one
    let particle = this.particlePool.pop()
    if (!particle) {
      particle = this.createNewParticle()
    }

    // Position near target
    // TODO: Set particle position above target entity

    // Set particle properties
    // TODO: Set velocity upward, lifetime, color (red/pink)

    // Add to active particles
    this.activeParticles.push(particle)

    console.log('❤️ Heart particle created')
  }

  private createNewParticle(): any {
    // TODO: Create new particle entity
    // TODO: Add necessary components (Transform, Visibility, etc.)
    return {} // Placeholder
  }

  // Update particle animations
  private updateParticles(dt: number) {
    // Update each active particle
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i]

      // TODO: Update particle position (float upward)
      // TODO: Update particle lifetime
      // TODO: Fade out as lifetime expires

      // Return to pool when done
      // if (particle.lifetime <= 0) {
      //   this.returnParticleToPool(particle)
      //   this.activeParticles.splice(i, 1)
      // }
    }
  }

  private returnParticleToPool(particle: any) {
    // Reset particle properties
    // TODO: Reset position, velocity, lifetime, visibility

    // Return to pool
    this.particlePool.push(particle)
  }

  // Initialize particle pool for performance
  private initializeParticlePool() {
    console.log('❤️ Initializing heart particle pool')

    // Pre-create particles
    for (let i = 0; i < this.maxParticles; i++) {
      const particle = this.createNewParticle()
      this.particlePool.push(particle)
    }
  }

  // Trigger conditions for heart spawning
  onPetInteraction() {
    // TODO: Get pet entity
    // this.spawnHearts(petEntity)
  }

  // Easy to add new particle types
  spawnCustomParticles(type: string, targetEntity: any) {
    // TODO: Support different particle types (hearts, stars, bubbles, etc.)
    console.log(`✨ Spawning ${type} particles`)
  }

  // Easy to remove: comment out one import, game still works
  cleanup() {
    console.log('❤️ Heart particle module cleanup')
    // Hide all active particles
    this.activeParticles.forEach((particle) => {
      // TODO: Hide particle
    })
    this.activeParticles = []
  }
}

