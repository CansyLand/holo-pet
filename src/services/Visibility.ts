// EPIC: Game Flow Stories - New Player Onboarding, Pet Care Interactions
// Centralized visibility management service. Handles showing/hiding entities based on game state.
// No more scattered visibility logic - all state-based visibility rules live here.
// Modules can call visibility.showPetDecorations() without knowing implementation details.

import {
  engine,
  Entity,
  VisibilityComponent,
  GltfContainer,
  MeshCollider,
  PointerEvents,
  ColliderLayer,
  Transform
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'
import { GamePhase } from '../components/GameState'
import { Interactable, InteractionType } from '../components/Interaction'
import { EntityNames } from '../../assets/scene/entity-names'

export class VisibilityManager {
  // Entity groups - single source of truth for what entities belong together
  private entityGroups = {
    // Always visible entities
    always: [EntityNames.Console, EntityNames.Button_1, EntityNames.Button_2, EntityNames.Button_3],

    // Egg phase entities
    egg: [EntityNames.Egg],

    // Pet phase entities
    pet: [
      EntityNames.Tiger,
      EntityNames.Bed,
      EntityNames.Bath_Tub,
      EntityNames.Decoration,
      EntityNames.Food_Bowl,
      EntityNames.Ball
    ],

    // Dynamic entities (poops managed by Poop module)
    poops: [
      EntityNames.Poop_1,
      EntityNames.Poop_2,
      EntityNames.Poop_3,
      EntityNames.Poop_4,
      EntityNames.Poop_5,
      EntityNames.Poop_6,
      EntityNames.Poop_7
    ]
  }

  // Collision prevention constants
  private readonly SAFE_SPAWN_DISTANCE = 2.0
  private readonly PUSH_DISTANCE = 1.0

  constructor() {
    console.log('VisibilityManager initialized')
  }

  // Game state listeners - called when game state changes
  onGameStateChange(gameState: { phase: GamePhase; pet: any; theme: string }) {
    console.log(`🎭 Visibility: Game state changed to ${gameState.phase}`)

    if (gameState.phase === GamePhase.EGG) {
      this.hidePetDecorations()
      this.showEggDecorations()
    } else if (gameState.phase === GamePhase.PET) {
      this.showPetDecorations()
      this.hideEggDecorations()
    }
  }

  // Utility functions modules can use
  showEntity(entity: Entity) {
    this.setEntityInteractive(entity, true, true)
  }

  hideEntity(entity: Entity) {
    this.setEntityInteractive(entity, false, false)
  }

  // =============================================================================
  // COLLISION PREVENTION HELPERS
  // =============================================================================

  private getPlayerPosition(): Vector3 | null {
    try {
      const playerTransform = Transform.get(engine.PlayerEntity)
      return playerTransform.position
    } catch {
      return null
    }
  }

  private resolvePlayerCollision(entity: Entity) {
    const playerPos = this.getPlayerPosition()
    const entityTransform = Transform.getOrNull(entity)

    if (!playerPos || !entityTransform) return

    const distance = Vector3.distance(playerPos, entityTransform.position)
    if (distance < this.SAFE_SPAWN_DISTANCE) {
      // Calculate push direction (away from entity)
      const pushDirection = Vector3.normalize(Vector3.subtract(playerPos, entityTransform.position))

      // Move player away from the entity
      const newPosition = Vector3.add(playerPos, Vector3.scale(pushDirection, this.PUSH_DISTANCE))

      // Apply to player using movePlayerTo
      movePlayerTo({
        newRelativePosition: newPosition,
        cameraTarget: entityTransform.position // Keep camera looking at the entity
      })

      console.log('🚨 Player collision resolved - pushed away from entity')
    }
  }

  // Core visibility function - replaces the old setEntityInteractive from Environment.ts
  private setEntityInteractive(entity: Entity, visible: boolean, interactive: boolean = visible) {
    console.log(`🎭 Visibility: Setting entity ${entity} visible=${visible}, interactive=${interactive}`)

    // 1. Set visibility using VisibilityComponent
    let visibility = VisibilityComponent.getMutableOrNull(entity)
    if (!visibility) {
      VisibilityComponent.create(entity, { visible: visible })
    } else {
      visibility.visible = visible
    }

    // 2. Configure collision masks for both GLTF and MeshCollider
    const gltfContainer = GltfContainer.getMutableOrNull(entity)
    const meshCollider = MeshCollider.getMutableOrNull(entity)

    const visibleCollisionMask = interactive
      ? ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS
      : ColliderLayer.CL_NONE
    const invisibleCollisionMask = ColliderLayer.CL_NONE // Always disable collision when invisible

    if (gltfContainer) {
      gltfContainer.visibleMeshesCollisionMask = visible ? visibleCollisionMask : invisibleCollisionMask
      // For invisible meshes, ALWAYS disable collision to prevent cursor interaction
      if ('invisibleMeshesCollisionMask' in gltfContainer) {
        ;(gltfContainer as any).invisibleMeshesCollisionMask = invisibleCollisionMask
      }
    }

    if (meshCollider) {
      meshCollider.collisionMask = interactive ? ColliderLayer.CL_POINTER : ColliderLayer.CL_NONE
    }

    // 3. Manage PointerEvents
    if (!interactive && PointerEvents.has(entity)) {
      // Remove PointerEvents if shouldn't be interactive
      PointerEvents.deleteFrom(entity)
      console.log(`Removed PointerEvents from entity ${entity}`)
    } else if (interactive && !PointerEvents.has(entity)) {
      // Recreate PointerEvents if should be interactive but they're missing
      const interactable = Interactable.getOrNull(entity)
      if (interactable) {
        this.recreatePointerEvents(entity, interactable)
      }
    }

    // Check for player collision after making entity visible
    if (visible) {
      this.resolvePlayerCollision(entity)
    }

    console.log(`Entity ${entity}: visible=${visible}, interactive=${interactive}`)
  }

  private recreatePointerEvents(entity: Entity, interactable: any) {
    // Recreate PointerEvents based on interaction type
    let hoverText = 'Interact'
    switch (interactable.type) {
      case InteractionType.HATCH:
        hoverText = 'Hatch Egg'
        break
      case InteractionType.PLAY:
        hoverText = 'Play with Ball'
        break
      case InteractionType.PET:
        hoverText = 'Pet Pet'
        break
      case InteractionType.FEED:
        hoverText = 'Feed Pet'
        break
      case InteractionType.SLEEP:
        hoverText = 'Put to Bed'
        break
      case InteractionType.BATHE:
        hoverText = 'Bathe Pet'
        break
      case InteractionType.COLLECT_POOP:
        hoverText = 'Collect'
        break
      default:
        hoverText = 'Interact'
    }

    PointerEvents.create(entity, {
      pointerEvents: [
        {
          eventType: 1, // PET_DOWN
          eventInfo: {
            button: 0, // IA_POINTER
            hoverText: hoverText
          }
        }
      ]
    })
    console.log(`Recreated PointerEvents for entity ${entity} (${interactable.type})`)
  }

  // Group visibility functions
  showGroup(groupName: string) {
    console.log(`🎭 Visibility: Showing group ${groupName}`)
    const entities = this.entityGroups[groupName as keyof typeof this.entityGroups]
    if (entities) {
      entities.forEach((entityName) => {
        const entity = engine.getEntityOrNullByName(entityName as EntityNames)
        if (entity) {
          this.showEntity(entity)
        } else {
          console.log(`🎭 Visibility: WARNING - Entity ${entityName} not found!`)
        }
      })
    }
  }

  hideGroup(groupName: string) {
    console.log(`🎭 Visibility: Hiding group ${groupName}`)
    const entities = this.entityGroups[groupName as keyof typeof this.entityGroups]
    if (entities) {
      entities.forEach((entityName) => {
        const entity = engine.getEntityOrNullByName(entityName as EntityNames)
        if (entity) {
          this.hideEntity(entity)
        } else {
          console.log(`🎭 Visibility: WARNING - Entity ${entityName} not found!`)
        }
      })
    }
  }

  // State-based visibility functions
  showEggDecorations() {
    console.log('🐣 Showing egg phase decorations')
    this.showGroup('egg')
    this.showGroup('always')
    this.hideGroup('pet')
    this.hideGroup('poops') // Also hide poops in egg phase
  }

  hideEggDecorations() {
    console.log('🐣 Hiding egg phase decorations')
    this.hideGroup('egg')
  }

  showPetDecorations() {
    console.log('🐾 Showing pet phase decorations')
    this.showGroup('pet')
    this.showGroup('always')
    this.hideGroup('egg')
  }

  hidePetDecorations() {
    console.log('🐾 Hiding pet phase decorations')
    this.hideGroup('pet')
  }

  // Theme-based visibility (for seasonal changes)
  applyTheme(theme: string) {
    console.log(`🎨 Applying theme: ${theme}`)

    // TODO: Show/hide seasonal decorations based on theme
    // if (theme === 'christmas') {
    //   this.showChristmasDecorations()
    // } else {
    //   this.hideChristmasDecorations()
    // }
  }

  // Special visibility states
  showVisitMode() {
    console.log("👥 Showing visit mode (other player's pet)")
    // TODO: Hide local pet, show visiting pet
    // TODO: Hide local pet's decorations, show visitor's decorations
  }

  hideVisitMode() {
    console.log('🏠 Hiding visit mode (return to own pet)')
    // TODO: Hide visiting pet, show local pet
  }

  // Debug function to show all entities
  showAll() {
    console.log('🐛 Debug: Showing all entities')
    this.showGroup('always')
    this.showGroup('egg')
    this.showGroup('pet')
  }

  // Debug function to hide all entities
  hideAll() {
    console.log('🐛 Debug: Hiding all entities')
    this.hideGroup('egg')
    this.hideGroup('pet')
    // Note: 'always' entities should never be hidden
  }

  // Check if entity is currently visible
  isVisible(entity: any): boolean {
    // TODO: Check VisibilityComponent
    return true // Placeholder
  }

  // Get all visible entities (for debugging)
  getVisibleEntities(): string[] {
    // TODO: Query all entities with VisibilityComponent.visible = true
    return [] // Placeholder
  }
}

// Global instance
export const visibility = new VisibilityManager()
