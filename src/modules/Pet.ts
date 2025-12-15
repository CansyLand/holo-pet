// PetModule - ECS integration for the Pet class
// Handles entity setup, animations, and pointer events

import { Entity, engine, pointerEventsSystem, InputAction, Animator } from '@dcl/sdk/ecs'
import { game, GameModule } from '../Game'
import { EntityNames } from '../../assets/scene/entity-names'
import { cameraFocus } from '../services/CameraFocus'

export class PetModule implements GameModule {
  name = 'Pet'
  petEntity: Entity | null = null

  init() {
    this.setupPetEntity()
  }

  private setupPetEntity() {
    this.petEntity = engine.getEntityOrNullByName(EntityNames.Tiger)
    if (!this.petEntity) {
      return
    }

    // Set entity reference on the pet object
    if (game.state.pet) {
      game.state.pet.entity = this.petEntity
    }

    // Set up Animator component for pet animations
    try {
      Animator.create(this.petEntity, {
        states: [
          { clip: 'Idle', playing: true, loop: true },
          { clip: 'Walking', playing: false, loop: true },
          { clip: 'Sitting', playing: false, loop: true },
          { clip: 'Standing', playing: false, loop: false },
          { clip: 'Drinking', playing: false, loop: true },
          { clip: 'Sleep', playing: false, loop: true }
        ]
      })
    } catch (error) {
      // Animator setup failed (animations may not exist in model)
    }

    this.setupPointerEvents()
  }

  setupPointerEvents() {
    if (!this.petEntity) {
      return
    }

    pointerEventsSystem.onPointerDown(
      {
        entity: this.petEntity,
        opts: {
          button: InputAction.IA_POINTER,
          hoverText: this.getHoverText()
        }
      },
      () => {
        // Check if pet is in bath mode
        if (game.state.pet?.data.bathMode.isActive) {
          console.log('🛁 Bath mode active - triggering cleaning')
          game.state.pet.pet()
          return
        }

        // Check if camera is already focused on this pet
        if (cameraFocus.isFocused(this.petEntity)) {
          console.log('💗 Camera focused - spawning pink particles')
          const particleModule = game.modules.find((module) => module.name === 'Particle') as any
          particleModule?.spawnParticles(this.petEntity, 'pink')
        } else {
          console.log('🎥 Focusing camera on pet')
          cameraFocus.focusOn(this.petEntity!)
          game.state.pet?.stopCurrentActivity()
        }
      }
    )
  }

  getHoverText(): string {
    if (game.state.pet?.data.bathMode.isActive) {
      return 'Scrub scrub'
    }

    if (cameraFocus.isFocused(this.petEntity)) {
      return 'Pet'
    }

    return game.state.pet?.data.name || 'Unknown'
  }

  update(dt: number) {
    game.state.pet?.update(dt)
  }
}
