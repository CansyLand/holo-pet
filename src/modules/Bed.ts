// EPIC: Pet Care Interactions - Sleep Interaction Story
// Basic sleep mechanics - manual bed interaction and visual feedback.
// Ready for expansion: sleep quality, bed preferences, bedtime routines.

import { engine, pointerEventsSystem, InputAction, MeshCollider, ColliderLayer } from '@dcl/sdk/ecs'
import { game } from '../Game'
import { GameModule } from '../Game'
import { EntityNames } from '../../assets/scene/entity-names'
import { PetState } from '../Pet'

export class BedModule implements GameModule {
  name = 'Bed'
  bedEntity: any = null // Will be the bed entity

  init() {
    console.log('🛏️ Bed module initialized')
    this.bedEntity = engine.getEntityOrNullByName(EntityNames.Bed)
    if (!this.bedEntity) {
      console.error('🛏️ Bed entity not found!')
      return
    }

    // Add collider to make it clickable
    MeshCollider.setBox(this.bedEntity, ColliderLayer.CL_POINTER)

    this.setupInteractions()
  }

  update(dt: number) {
    // Handle any bed animations or effects
  }

  onClick() {
    console.log('🛏️ Bed clicked - pet will go to bed')
    this.triggerPetToBed()
  }

  private triggerPetToBed() {
    if (!game.state.pet) return

    // If pet is already seeking bed, let it continue
    if (game.state.pet.data.state === PetState.SEEKING_BED) {
      console.log('🛏️ Pet already going to bed')
      return
    }

    // Otherwise, trigger pet to seek the bed
    game.state.pet.startSeekingBed()

    console.log('🛏️ Pet triggered to go to bed')
  }

  private spawnSleepParticles() {
    const particleModule = game.getModuleSafe('Particle') as any
    if (particleModule && this.bedEntity) {
      particleModule.spawnParticles(this.bedEntity, 'blue') // ZZZ particles?
    }
    console.log('💤 Spawning sleep particles')
  }

  // Ready for expansion: different bed types
  upgradeBed(bedType: string) {
    // TODO: Different beds with different comfort levels
    // Luxury bed: faster energy restoration
    // Cozy bed: better mood boost
    // Smart bed: tracks sleep patterns
    console.log(`🛏️ Upgrading bed to: ${bedType}`)
  }

  // Ready for expansion: bedtime routines
  playBedtimeRoutine() {
    // TODO: Pet walks to bed, bedtime animation, lights dim slightly
    console.log('🛏️ Playing bedtime routine')
  }

  // Ready for expansion: sleep quality system
  getSleepQuality(): number {
    // TODO: Based on pet stats, time of day, bed type
    return 0.8 // Placeholder - 80% sleep quality
  }

  private setupInteractions() {
    pointerEventsSystem.onPointerDown(
      {
        entity: this.bedEntity!,
        opts: { button: InputAction.IA_POINTER, hoverText: 'Send Pet to Bed' }
      },
      () => {
        console.log('🛏️ Bed clicked - triggering sleep!')
        this.onClick()
      }
    )

    console.log('🛏️ Bed interactions set up')
  }

  cleanup() {
    console.log('🛏️ Bed module cleanup')
  }
}
