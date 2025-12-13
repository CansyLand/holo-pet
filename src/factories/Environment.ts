import {
  engine,
  PointerEvents,
  PointerEventType,
  InputAction,
  VisibilityComponent,
  GltfContainer,
  MeshCollider,
  ColliderLayer,
  Transform,
  Entity
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'
import { Interactable, InteractionType } from '../components/Interaction'
import { EntityNames } from '../../assets/scene/entity-names'
import { hideAllPoops } from '../systems/Poop'

// =============================================================================
// ENVIRONMENT MANAGEMENT - SIMPLIFIED & OPTIMIZED
// All entities are pre-placed in scene editor and managed via visibility
// Includes collision optimization: invisible entities disable collision detection
// =============================================================================

/**
 * Setup entities that are always visible in the scene
 * Console and Button_1, Button_2, Button_3 are already set up in scene editor
 */
export function setupAlwaysVisibleEntities() {
  // Console, Button_1, Button_2, Button_3 are already properly set up in scene editor
  // with GLTF shapes, positions, colliders, and interactions
  // Just documenting here that these are always present - no additional setup needed
  console.log('Always visible entities confirmed: Console, Button_1, Button_2, Button_3')
}

// =============================================================================
// COLLISION PREVENTION HELPERS
// =============================================================================

// Minimum safe distance from player (in meters)
const SAFE_SPAWN_DISTANCE = 2.0

/**
 * Get the player's current position
 */
function getPlayerPosition(): Vector3 | null {
  try {
    const playerTransform = Transform.get(engine.PlayerEntity)
    return playerTransform.position
  } catch {
    return null
  }
}

/**
 * Resolve player collision by gently pushing them away from an entity
 */
function resolvePlayerCollision(entity: Entity) {
  const playerPos = getPlayerPosition()
  const entityTransform = Transform.getOrNull(entity)

  if (!playerPos || !entityTransform) return

  const distance = Vector3.distance(playerPos, entityTransform.position)
  if (distance < SAFE_SPAWN_DISTANCE) {
    // Calculate push direction (away from entity)
    const pushDirection = Vector3.normalize(Vector3.subtract(playerPos, entityTransform.position))

    // Move player 1 meter away
    const newPosition = Vector3.add(
      playerPos,
      Vector3.scale(pushDirection, 1.0) // Push 1.0 meters away
    )

    // Apply to player using movePlayerTo
    movePlayerTo({
      newRelativePosition: newPosition,
      cameraTarget: entityTransform.position // Keep camera looking at the entity
    })

    console.log('🚨 Player collision resolved - pushed away from entity')
  }
}

/**
 * Setup egg-related entities
 * Egg entity is pre-placed but needs visibility and interaction components
 */
export function setupEggEntities() {
  const eggEntity = engine.getEntityOrNullByName(EntityNames.Egg)
  if (!eggEntity) {
    console.error('Egg entity not found in scene!')
    return
  }

  // Add visibility component - initially visible until pet hatches
  if (!VisibilityComponent.getOrNull(eggEntity)) {
    VisibilityComponent.createOrReplace(eggEntity, { visible: true })
  }

  // Ensure all poop entities are hidden in egg state (they might be visible by default in scene editor)
  hideAllPoopsByName()

  // Note: Interactable and PointerEvents are already set up by createEgg() in Pet.ts
  // No need to add them here to avoid duplicates

  console.log('Egg entity setup complete')
}

/**
 * Setup pet-related entities
 * All pet entities are pre-placed but need visibility and interaction components
 */
export function setupPetEntities() {
  // Pet (Tiger)
  setupPetEntity(EntityNames.Tiger, InteractionType.PET, 'Pet Tiger')

  // Bed
  setupPetEntity(EntityNames.Bed, InteractionType.SLEEP, 'Put to Bed')

  // Bath Tub
  setupPetEntity(EntityNames.Bath_Tub, InteractionType.BATHE, 'Bathe Pet')

  // Decoration - using PET as placeholder since DECORATE doesn't exist
  setupPetEntity(EntityNames.Decoration, InteractionType.PET, 'Change Decoration')

  // Food Bowl
  setupPetEntity(EntityNames.Food_Bowl, InteractionType.FEED, 'Feed Pet')

  console.log('Pet entities setup complete')
}

/**
 * Helper function to setup a pet entity with visibility and interactions
 */
function setupPetEntity(entityName: string, interactionType: InteractionType, hoverText: string) {
  const entity = engine.getEntityOrNullByName(entityName as EntityNames)
  if (!entity) {
    console.error(`${entityName} entity not found in scene!`)
    return
  }

  // Add visibility component - initially hidden until pet state
  if (!VisibilityComponent.getOrNull(entity)) {
    VisibilityComponent.createOrReplace(entity, { visible: false })
  }

  // Make it clickable for pet interactions - only if not already set up
  if (!Interactable.getOrNull(entity)) {
    Interactable.createOrReplace(entity, {
      type: interactionType
    })
  }

  // Add pointer events - only if not already set up
  if (!PointerEvents.getOrNull(entity)) {
    PointerEvents.createOrReplace(entity, {
      pointerEvents: [
        {
          eventType: PointerEventType.PET_DOWN,
          eventInfo: {
            button: InputAction.IA_POINTER,
            hoverText: hoverText
          }
        }
      ]
    })
  }
}

// =============================================================================
// STATE MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Show egg environment - hide pet entities, show egg
 */
export function showEggEnvironment() {
  console.log('Switching to Egg Environment')

  // Hide all poops when switching to egg state
  hideAllPoops()
  hideAllPoopsByName() // Also hide by name in case poop system isn't initialized

  // Hide pet entities
  setEntityVisibility(EntityNames.Tiger, false)
  setEntityVisibility(EntityNames.Bed, false)
  setEntityVisibility(EntityNames.Bath_Tub, false)
  setEntityVisibility(EntityNames.Decoration, false)
  setEntityVisibility(EntityNames.Food_Bowl, false)

  // Show egg
  setEntityVisibility(EntityNames.Egg, true)
}

/**
 * Show pet environment - hide egg, show pet entities
 */
export function showPetEnvironment() {
  console.log('Switching to Pet Environment')

  // Hide egg
  setEntityVisibility(EntityNames.Egg, false)

  // Show pet entities
  setEntityVisibility(EntityNames.Tiger, true)
  setEntityVisibility(EntityNames.Bed, true)
  setEntityVisibility(EntityNames.Bath_Tub, true)
  setEntityVisibility(EntityNames.Decoration, true)
  setEntityVisibility(EntityNames.Food_Bowl, true)
}

/**
 * Reset environment - hide all state-dependent entities
 */
export function resetEnvironment() {
  console.log('Resetting Environment')

  // Hide all poops
  hideAllPoops()

  // Hide all state-dependent entities
  setEntityVisibility(EntityNames.Egg, false)
  setEntityVisibility(EntityNames.Tiger, false)
  setEntityVisibility(EntityNames.Bed, false)
  setEntityVisibility(EntityNames.Bath_Tub, false)
  setEntityVisibility(EntityNames.Decoration, false)
  setEntityVisibility(EntityNames.Food_Bowl, false)
}

/**
 * Helper function to set entity visibility with collision optimization
 * When invisible: disables collision detection for performance
 * When visible: enables collision detection and resolves player collisions
 */
function setEntityVisibility(entityName: string, visible: boolean) {
  const entity = engine.getEntityOrNullByName(entityName as EntityNames)
  if (!entity) return

  // Set visibility
  const visibility = VisibilityComponent.getMutable(entity)
  visibility.visible = visible

  // Optimize collision based on visibility for performance
  const gltfContainer = GltfContainer.getMutableOrNull(entity)
  const meshCollider = MeshCollider.getMutableOrNull(entity)

  if (visible) {
    // When visible: enable collisions for interaction and physics
    if (gltfContainer) {
      // For GLTF entities: set collision mask for visible state
      gltfContainer.visibleMeshesCollisionMask = ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS
    }

    if (meshCollider) {
      // For MeshCollider entities: enable collision layer
      meshCollider.collisionMask = ColliderLayer.CL_POINTER
    }

    // Check for player collision after making entity visible
    resolvePlayerCollision(entity)
  } else {
    // When invisible: disable collisions completely for performance
    if (gltfContainer) {
      // For GLTF entities: disable collision for invisible meshes
      // This overrides the scene editor's invisibleMeshesCollisionMask setting
      gltfContainer.visibleMeshesCollisionMask = ColliderLayer.CL_NONE
      // Also try to set invisibleMeshesCollisionMask if it exists
      if ('invisibleMeshesCollisionMask' in gltfContainer) {
        ;(gltfContainer as any).invisibleMeshesCollisionMask = ColliderLayer.CL_NONE
      }
    }

    if (meshCollider) {
      // For MeshCollider entities: disable collision layer
      meshCollider.collisionMask = ColliderLayer.CL_NONE
    }
  }
}

/**
 * Hide all poop entities by name with collision optimization
 * (doesn't require poop system initialization)
 */
function hideAllPoopsByName() {
  const poopNames = [
    EntityNames.Poop_1,
    EntityNames.Poop_2,
    EntityNames.Poop_3,
    EntityNames.Poop_4,
    EntityNames.Poop_5,
    EntityNames.Poop_6,
    EntityNames.Poop_7
  ]

  for (const poopName of poopNames) {
    const entity = engine.getEntityOrNullByName(poopName)
    if (entity) {
      // Set visibility with collision optimization
      const visibility = VisibilityComponent.getMutableOrNull(entity)
      if (visibility) {
        visibility.visible = false
      } else {
        // Create visibility component if it doesn't exist
        VisibilityComponent.create(entity, { visible: false })
      }

      // Disable collisions for invisible poops
      const gltfContainer = GltfContainer.getMutableOrNull(entity)
      if (gltfContainer) {
        gltfContainer.visibleMeshesCollisionMask = ColliderLayer.CL_NONE
        // Also try to set invisibleMeshesCollisionMask if it exists
        if ('invisibleMeshesCollisionMask' in gltfContainer) {
          ;(gltfContainer as any).invisibleMeshesCollisionMask = ColliderLayer.CL_NONE
        }
      }

      const meshCollider = MeshCollider.getMutableOrNull(entity)
      if (meshCollider) {
        meshCollider.collisionMask = ColliderLayer.CL_NONE
      }
    }
  }
}

// =============================================================================
// DEBUG FUNCTIONS - CONSOLE BASED
// Use browser console to switch between egg/pet states for testing
// =============================================================================

/**
 * Debug function to show egg environment
 * Call from browser console: showEggEnvironment()
 */
export function debugShowEgg() {
  console.log('🐣 Debug: Switching to Egg Environment')
  showEggEnvironment()
}

/**
 * Debug function to show pet environment
 * Call from browser console: showPetEnvironment()
 */
export function debugShowPet() {
  console.log('🐱 Debug: Switching to Pet Environment')
  showPetEnvironment()
}

/**
 * Debug function to reset environment
 * Call from browser console: resetEnvironment()
 */
export function debugReset() {
  console.log('🔄 Debug: Resetting Environment')
  resetEnvironment()
}

// Make debug functions available globally for console access
declare const window: any
if (typeof window !== 'undefined') {
  window.debugShowEgg = debugShowEgg
  window.debugShowPet = debugShowPet
  window.debugReset = debugReset
  console.log('🐛 Debug functions available: debugShowEgg(), debugShowPet(), debugReset()')
}
