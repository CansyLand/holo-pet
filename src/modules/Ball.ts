// EPIC: Pet Care Interactions - Play Interaction Story
// Interactive ball for play. Pet gets tired and dirty from playing!
// Future: ball physics, pet AI to chase and fetch, throwing mechanics.

import { engine, pointerEventsSystem, InputAction, MeshCollider, ColliderLayer } from '@dcl/sdk/ecs'
import { game } from '../Game'
import { GameModule } from '../Game'
import { EntityNames } from '../../assets/scene/entity-names'

export class BallModule implements GameModule {
  name = 'Ball'
  ballEntity: any = null // Will be the ball entity

  init() {
    console.log('🏀 Ball module initialized')
    this.ballEntity = engine.getEntityOrNullByName(EntityNames.Ball)
    if (!this.ballEntity) {
      console.error('🏀 Ball entity not found!')
      return
    }

    // Add collider to make it clickable
    MeshCollider.setBox(this.ballEntity, ColliderLayer.CL_POINTER)

    this.setupInteractions()
  }

  update(dt: number) {
    // Handle ball physics, pet chasing, etc.
  }

  onClick() {
    console.log('🏀 Ball clicked - playing with pet')
    this.playWithPet()
  }

  private playWithPet() {
    if (!game.state.pet) return

    // Trigger play in pet object
    game.playWithPet()

    // Visual feedback - yellow particles from ball
    this.spawnPlayParticles()

    console.log('🏀 Play interaction completed')
  }

  private spawnPlayParticles() {
    const particleModule = game.getModuleSafe('Particle') as any
    if (particleModule && this.ballEntity) {
      particleModule.spawnParticles(this.ballEntity, 'yellow')
    }
    console.log('⭐ Spawning play particles')
  }

  // Ready for expansion: ball physics and trajectory
  throwBall(targetPosition: any) {
    // TODO: Physics simulation for ball throwing
    // TODO: Calculate trajectory
    // TODO: Move ball through air
    console.log(`🏀 Throwing ball to position: ${targetPosition}`)
  }

  // Ready for expansion: pet AI to chase and fetch
  startFetchMiniGame() {
    // TODO: Throw ball, pet chases it
    // TODO: Pet picks up ball and brings it back
    // TODO: Multiple throws create fetch session
    console.log('🏀 Starting fetch mini-game')
  }

  // Ready for expansion: throwing mechanics
  calculateThrowTrajectory(startPos: any, targetPos: any) {
    // TODO: Physics calculations for realistic ball arc
    return {
      // trajectory points, velocity, etc.
    }
  }

  private setupInteractions() {
    pointerEventsSystem.onPointerDown(
      {
        entity: this.ballEntity!,
        opts: { button: InputAction.IA_POINTER, hoverText: 'Play with Pet' }
      },
      () => {
        console.log('🏀 Ball clicked - triggering play!')
        this.onClick()
      }
    )

    console.log('🏀 Ball interactions set up')
  }

  cleanup() {
    console.log('🏀 Ball module cleanup')
  }
}
