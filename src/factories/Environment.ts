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
// UNIFIED ENTITY GROUPS - SINGLE SOURCE OF TRUTH
// =============================================================================

export const ENTITY_GROUPS = {
  // Always visible entities (console, buttons)
  always: [EntityNames.Console, EntityNames.Button_1, EntityNames.Button_2, EntityNames.Button_3],

  // Egg phase entities
  egg: [EntityNames.Egg],

  // Pet phase entities (tiger, bed, bath, decoration, food bowl, ball)
  pet: [
    EntityNames.Tiger,
    EntityNames.Bed,
    EntityNames.Bath_Tub,
    EntityNames.Decoration,
    EntityNames.Food_Bowl,
    EntityNames.Ball
  ],

  // Dynamic entities (poops managed separately by Poop.ts)
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

  // Ensure pet-phase entities are hidden in egg state (scene editor may have them visible by default)
  const petEntitiesToHide = [EntityNames.Decoration, EntityNames.Ball]
  petEntitiesToHide.forEach((entityName) => {
    const entity = engine.getEntityOrNullByName(entityName as EntityNames)
    if (entity) {
      if (!VisibilityComponent.getOrNull(entity)) {
        VisibilityComponent.create(entity, { visible: false })
      } else {
        VisibilityComponent.getMutable(entity).visible = false
      }
    }
  })

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

  // Decoration - non-interactive tree, just has collision from GLTF model
  // (removed from setupPetEntity so it's not clickable)

  // Food Bowl
  setupPetEntity(EntityNames.Food_Bowl, InteractionType.FEED, 'Feed Pet')

  // Ball - for play interaction
  setupPetEntity(EntityNames.Ball, InteractionType.PLAY, 'Play with Ball')

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

// Old environment functions removed - replaced by switchEnvironment()

/**
 * UNIFIED FUNCTION: Manages all aspects of entity interactivity atomically
 * @param entity - The entity to modify
 * @param visible - Whether entity should be visible
 * @param interactive - Whether entity should be clickable/interactive (defaults to visible)
 */
export function setEntityInteractive(entity: Entity, visible: boolean, interactive: boolean = visible) {
  // 1. Set visibility
  const visibility = VisibilityComponent.getMutableOrNull(entity)
  if (visibility) {
    visibility.visible = visible
  }

  // 2. Configure collision masks for both GLTF and MeshCollider
  const gltfContainer = GltfContainer.getMutableOrNull(entity)
  const meshCollider = MeshCollider.getMutableOrNull(entity)

  const visibleCollisionMask = interactive ? ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS : ColliderLayer.CL_NONE
  const invisibleCollisionMask = ColliderLayer.CL_NONE // Always disable collision when invisible

  if (gltfContainer) {
    gltfContainer.visibleMeshesCollisionMask = visibleCollisionMask
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
    // This handles the case where entities were temporarily hidden and lost their PointerEvents
    const interactable = Interactable.getOrNull(entity)
    if (interactable) {
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
          hoverText = 'Pet Tiger'
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
            eventType: PointerEventType.PET_DOWN,
            eventInfo: {
              button: InputAction.IA_POINTER,
              hoverText: hoverText
            }
          }
        ]
      })
      console.log(`Recreated PointerEvents for entity ${entity} (${interactable.type})`)
    }
  }

  // 4. Check for player collision after making entity visible
  if (visible) {
    resolvePlayerCollision(entity)
  }

  console.log(`Entity ${entity}: visible=${visible}, interactive=${interactive}`)
}

/**
 * ENVIRONMENT STATE MANAGER: Switches between egg, pet, and reset states
 * This replaces all individual setEntityVisibility() calls
 */
export function switchEnvironment(state: 'egg' | 'pet' | 'reset') {
  console.log(`🔄 Switching to environment: ${state}`)

  // Helper function to show an entity group
  const showEntityGroup = (groupName: keyof typeof ENTITY_GROUPS, interactive: boolean = true) => {
    ENTITY_GROUPS[groupName].forEach((entityName) => {
      const entity = engine.getEntityOrNullByName(entityName as EntityNames)
      if (entity) {
        setEntityInteractive(entity, true, interactive)
      }
    })
  }

  // Helper function to hide an entity group
  const hideEntityGroup = (groupName: keyof typeof ENTITY_GROUPS) => {
    ENTITY_GROUPS[groupName].forEach((entityName) => {
      const entity = engine.getEntityOrNullByName(entityName as EntityNames)
      if (entity) {
        setEntityInteractive(entity, false, false)
      }
    })
  }

  // Hide all entities first, but don't hide entities that will be shown in target state
  // This prevents temporarily removing PointerEvents from entities we're about to show again
  switch (state) {
    case 'egg':
      // Hide pet entities and poops, but keep egg as-is (it should already be shown)
      hideEntityGroup('pet')
      hideAllPoops()
      // Ensure egg is visible and interactive
      showEntityGroup('egg', true)
      break

    case 'pet':
      // Hide egg entities and poops, but keep pet entities as-is
      hideEntityGroup('egg')
      hideAllPoops()
      // Ensure pet entities are visible and interactive
      showEntityGroup('pet', true)
      break

    case 'reset':
      // Hide all state-dependent entities
      hideEntityGroup('egg')
      hideEntityGroup('pet')
      hideAllPoops()
      break
  }

  console.log(`✅ Environment switched to: ${state}`)
}

// Legacy functions removed - all callers now use switchEnvironment() and setEntityInteractive()

/**
 * Hide all poop entities by name using unified visibility system
 * (doesn't require poop system initialization)
 */
function hideAllPoopsByName() {
  // Use the ENTITY_GROUPS to hide all poops - same logic as hideAllPoops()
  ENTITY_GROUPS.poops.forEach((poopName) => {
    const entity = engine.getEntityOrNullByName(poopName as EntityNames)
    if (entity) {
      // Ensure VisibilityComponent exists (poops may not have been initialized yet)
      if (!VisibilityComponent.getOrNull(entity)) {
        VisibilityComponent.create(entity, { visible: false })
      }
      setEntityInteractive(entity, false, false)
    }
  })
}

// =============================================================================
// DEBUG FUNCTIONS - CONSOLE BASED
// Use browser console to switch between egg/pet states for testing
// =============================================================================

/**
 * Debug function to show egg environment
 * Call from browser console: debugShowEgg()
 */
export function debugShowEgg() {
  console.log('🐣 Debug: Switching to Egg Environment')
  switchEnvironment('egg')
}

/**
 * Debug function to show pet environment
 * Call from browser console: debugShowPet()
 */
export function debugShowPet() {
  console.log('🐱 Debug: Switching to Pet Environment')
  switchEnvironment('pet')
}

/**
 * Debug function to reset environment
 * Call from browser console: debugReset()
 */
export function debugReset() {
  console.log('🔄 Debug: Resetting Environment')
  switchEnvironment('reset')
}

// Make debug functions available globally for console access
declare const window: any
if (typeof window !== 'undefined') {
  window.debugShowEgg = debugShowEgg
  window.debugShowPet = debugShowPet
  window.debugReset = debugReset
  console.log('🐛 Debug functions available: debugShowEgg(), debugShowPet(), debugReset()')
}
