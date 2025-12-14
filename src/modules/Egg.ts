// EPIC: New Player Onboarding - Egg Hatching Story
// All egg-related logic in one place - hatching, animations, interactions.
// Easy to extend with color-changing animations or other egg features.
// Ready for mini-games when the egg becomes more interactive.

import {
  engine,
  Entity,
  PointerEvents,
  PointerEventType,
  InputAction,
  MeshCollider,
  ColliderLayer,
  pointerEventsSystem
} from '@dcl/sdk/ecs'
import { game } from '../Game'
import { GameModule } from '../Game'
import { SceneElement, SceneType } from '../components/Scene'
import { EntityNames } from '../../assets/scene/entity-names'
import { pointer } from '../services/Pointer'

export class EggModule implements GameModule {
  name = 'Egg'
  eggEntity: Entity | null = null

  init() {
    console.log('🥚 Egg module initialized')
    this.setupEggEntity()
    this.setupPointerEvents()
  }

  // Easy to extend with animations
  onClick() {
    console.log('🥚 Egg clicked - starting hatch sequence')

    // Unlock pointer for UI interaction before showing naming modal
    pointer.rememberPointerState() // Remember current state to restore later
    pointer.unlockPointer() // Unlock so user can interact with naming UI

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

    // Hide egg manually (PET phase will reinforce via Visibility)
    if (this.eggEntity) {
      import('../services/Visibility').then(({ visibility }) => {
        visibility.hideEntity(this.eggEntity!)
      })
    }

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

    SceneElement.create(this.eggEntity, { sceneType: SceneType.EGG })

    console.log('🥚 Egg entity configured')
  }

  setupPointerEvents() {
    if (!this.eggEntity) {
      console.error('🥚 Cannot set up pointer events - egg entity not found!')
      return
    }

    pointerEventsSystem.onPointerDown(
      {
        entity: this.eggEntity,
        opts: { button: InputAction.IA_POINTER, hoverText: 'Hatch Egg' }
      },
      () => {
        console.log('🥚 Egg clicked - triggering hatch!')
        this.onClick()
      }
    )

    console.log('🥚 Egg pointer events set up')
  }

  update(dt: number) {
    // Handle any egg animations or effects
    // TODO: Update color pulse animation if active
  }

  cleanup() {
    console.log('🥚 Egg module cleanup')
    // TODO: Remove any active animations or timers
  }
}
