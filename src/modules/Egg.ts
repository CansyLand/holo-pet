// EPIC: New Player Onboarding - Egg Hatching Story
// All egg-related logic in one place - hatching, animations, interactions.
// Easy to extend with color-changing animations or other egg features.
// Ready for mini-games when the egg becomes more interactive.

import { engine, Entity, PointerEvents, PointerEventType, InputAction, MeshCollider, ColliderLayer } from '@dcl/sdk/ecs'
import { game } from '../Game'
import { GameModule } from '../Game'
import { Interactable, InteractionType } from '../components/Interaction'
import { SceneElement, SceneType } from '../components/Scene'
import { EntityNames } from '../../assets/scene/entity-names'

export class EggModule implements GameModule {
  name = 'Egg'
  eggEntity: Entity | null = null

  init() {
    console.log('🥚 Egg module initialized')
    this.setupEggEntity()
    this.setupEggInteractions()
  }

  update(dt: number) {
    // Handle any egg animations or effects
    // TODO: Update color pulse animation if active
  }

  // Easy to extend with animations
  onClick() {
    console.log('🥚 Egg clicked - starting hatch sequence')
    this.startHatchingAnimation()
  }

  // Hatching animation sequence
  private startHatchingAnimation() {
    // TODO: Play scale animation (1.2) then shrink to 0
    // TODO: Use tweens for smooth animation
    // Check dclcontext/Entity-Animation.md for tween examples

    console.log('🥚 Starting egg hatching animation...')

    // After animation completes, trigger actual hatch
    // For now, complete immediately (animations can be added later)
    this.completeHatching()
  }

  // Complete the hatching process
  private completeHatching() {
    console.log('🥚 Egg hatched! Creating pet...')

    // Hide egg
    if (this.eggEntity) {
      // TODO: Use visibility service to hide egg
      // visibility.hideEntity(this.eggEntity)
    }

    // Tell game to hatch (will create pet and change phase)
    game.hatchEgg()
  }

  // Add color-changing animation easily
  startColorPulseAnimation() {
    console.log('🥚 Starting egg color pulse animation')
    // TODO: Simple animation code here
    // Can be triggered by game state or time
    // Easy to extend with different colors for different pet types
  }

  private setupEggEntity() {
    // Use pre-placed Egg entity instead of creating new one
    this.eggEntity = engine.getEntityOrNullByName(EntityNames.Egg)
    if (!this.eggEntity) {
      console.error('🥚 Egg entity not found in scene!')
      return
    }

    // Skip Transform and GLTF creation - Egg is already positioned in scene editor
    // Add collision for interaction (check if it already exists first)
    if (!MeshCollider.has(this.eggEntity)) {
      MeshCollider.setSphere(this.eggEntity, ColliderLayer.CL_POINTER)
    }

    Interactable.create(this.eggEntity, {
      type: InteractionType.HATCH
    })

    SceneElement.create(this.eggEntity, { sceneType: SceneType.TECH })

    console.log('🥚 Egg entity configured')
  }

  private setupEggInteractions() {
    if (!this.eggEntity) return

    // TODO: Register click handler with interaction service
    // For now, we'll handle this through the interaction system
    // interaction.registerHandler('egg_click', () => this.onClick())

    PointerEvents.create(this.eggEntity, {
      pointerEvents: [
        {
          eventType: PointerEventType.PET_DOWN,
          eventInfo: {
            button: InputAction.IA_POINTER,
            hoverText: 'Hatch Egg'
          }
        }
      ]
    })

    console.log('🥚 Egg interactions set up')
  }

  cleanup() {
    console.log('🥚 Egg module cleanup')
    // TODO: Remove any active animations or timers
  }
}
