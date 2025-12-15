// EPIC: Pet Care Interactions - Bathing Interaction Story
// Basic cleanliness mechanics - bathing interaction and mood boost.
// Ready for expansion: bathing mini-game, water effects, bathing animations.

import { engine, pointerEventsSystem, InputAction, MeshCollider, ColliderLayer, Transform } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { game } from '../Game'
import { GameModule } from '../Game'
import { EntityNames } from '../../assets/scene/entity-names'
import { cameraFocus } from '../services/CameraFocus'

export class BathModule implements GameModule {
  name = 'Bath'
  bathEntity: any = null // Will be the bath tub entity

  init() {
    console.log('🛁 Bath module initialized')
    this.bathEntity = engine.getEntityOrNullByName(EntityNames.Bath_Tub)
    if (!this.bathEntity) {
      console.error('🛁 Bath entity not found!')
      return
    }

    // Add collider to make it clickable
    MeshCollider.setBox(this.bathEntity, ColliderLayer.CL_POINTER)

    this.setupInteractions()
  }

  update(dt: number) {
    // Handle any bath animations or water effects
  }

  onClick() {
    console.log('🛁 Bath clicked - bathing pet')
    this.bathePet()
  }

  private bathePet() {
    if (!game.state.pet || !game.state.pet.entity) return

    // Place pet in bath position
    this.placePetInBath()

    // Focus camera on pet
    this.focusCameraOnPet()

    // Spawn blue particles
    this.spawnBubbleParticles()

    // Trigger bathing in pet object
    game.bathePet()

    console.log('🛁 Pet bathed successfully')
  }

  private placePetInBath() {
    if (!game.state.pet?.entity || !this.bathEntity) return

    const bathTransform = Transform.get(this.bathEntity)
    const petTransform = Transform.getMutable(game.state.pet.entity)

    // Place pet at bath position (adjust Y offset as needed)
    petTransform.position = Vector3.create(
      bathTransform.position.x,
      bathTransform.position.y + 0.5, // Slightly above bath
      bathTransform.position.z
    )

    // Rotate pet 90 degrees to face sideways (more like bathing experience)
    petTransform.rotation = Quaternion.fromEulerDegrees(0, 90, 0)

    // Stop pet movement and set to idle
    game.state.pet.stopCurrentActivity()
  }

  private focusCameraOnPet() {
    if (game.state.pet?.entity) {
      cameraFocus.focusOn(game.state.pet.entity)
    }
  }

  private spawnBubbleParticles() {
    const particleModule = game.getModuleSafe('Particle') as any
    if (particleModule && this.bathEntity) {
      particleModule.spawnParticles(this.bathEntity, 'blue')
    }
    console.log('🫧 Spawning bubble particles')
  }

  // Ready for expansion: bathing mini-game
  startBathingMiniGame() {
    // TODO: Player needs to click specific spots on pet
    // Progress bar fills as cleaning happens
    // Pet reacts to cleaning (happy animations)
    console.log('🛁 Starting bathing mini-game')
  }

  // Ready for expansion: water particle effects
  playWaterEffects() {
    // TODO: Water splash particles, ripples in bath
    console.log('💧 Playing water effects')
  }

  // Ready for expansion: bathing animations
  playBathingAnimation() {
    // TODO: Pet enters bath, sits down, splashing animations
    console.log('🛁 Playing bathing animation')
  }

  private setupInteractions() {
    pointerEventsSystem.onPointerDown(
      {
        entity: this.bathEntity!,
        opts: { button: InputAction.IA_POINTER, hoverText: 'Bathe Pet' }
      },
      () => {
        console.log('🛁 Bath clicked - triggering bath!')
        this.onClick()
      }
    )

    console.log('🛁 Bath interactions set up')
  }

  cleanup() {
    console.log('🛁 Bath module cleanup')
  }
}
