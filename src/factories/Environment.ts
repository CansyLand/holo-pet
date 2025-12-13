import {
  engine,
  Transform,
  GltfContainer,
  MeshCollider,
  MeshRenderer,
  Material,
  ColliderLayer,
  PointerEvents,
  PointerEventType,
  InputAction,
  VisibilityComponent
} from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { SceneElement, SceneType } from '../components/Scene'
import { Theme } from '../components/GameState'
import { Interactable, InteractionType } from '../components/Interaction'
import { getThemeDisplayName } from '../utils/theme'
import { EntityNames } from '../../assets/scene/entity-names'

// =============================================================================
// SCENE CONSTANTS (2x2 parcels = 32m x 32m)
// =============================================================================
const SCENE_CENTER_X = 16
const SCENE_CENTER_Z = 16
const GROUND_SIZE = 30 // Slightly smaller than 32 to leave border

// =============================================================================
// THEME COLOR PALETTES
// =============================================================================
const THEME_COLORS = {
  [Theme.DEFAULT]: {
    ground: Color4.create(0.2, 0.6, 0.2, 1), // Green grass
    accent1: Color4.create(0.8, 0.2, 0.2, 1), // Red bowl
    accent2: Color4.create(0.2, 0.4, 0.9, 1), // Blue bowl
    toy: Color4.create(1, 0.85, 0.1, 1) // Yellow ball
  },
  [Theme.CHRISTMAS]: {
    ground: Color4.create(0.9, 0.95, 1, 1), // Snow white
    accent1: Color4.create(0.8, 0.1, 0.1, 1), // Christmas red
    accent2: Color4.create(0.1, 0.5, 0.1, 1), // Christmas green
    toy: Color4.create(1, 0.8, 0, 1) // Gold
  },
  [Theme.NEW_YEAR]: {
    ground: Color4.create(0.85, 0.9, 1, 1), // Light snow
    accent1: Color4.create(1, 0.84, 0, 1), // Gold
    accent2: Color4.create(0.75, 0.75, 0.8, 1), // Silver
    toy: Color4.create(0.9, 0.1, 0.5, 1) // Party pink
  },
  [Theme.SUMMER]: {
    ground: Color4.create(0.3, 0.7, 0.3, 1), // Vibrant green
    accent1: Color4.create(1, 0.5, 0.2, 1), // Orange
    accent2: Color4.create(0.2, 0.7, 0.9, 1), // Sky blue
    toy: Color4.create(1, 0.3, 0.5, 1) // Beach ball pink
  },
  [Theme.AUTUMN]: {
    ground: Color4.create(0.6, 0.4, 0.2, 1), // Brown earth
    accent1: Color4.create(0.9, 0.4, 0.1, 1), // Orange
    accent2: Color4.create(0.7, 0.2, 0.1, 1), // Dark red
    toy: Color4.create(0.9, 0.7, 0.2, 1) // Golden yellow
  }
}

// =============================================================================
// TECH ENVIRONMENT (EGG PHASE)
// =============================================================================

/**
 * Creates the tech environment scene (computers, holographic pad)
 * Used during the EGG phase before hatching
 */
export function createTechEnvironment() {
  // Computer 01 - positioned on the left side
  const computer1 = engine.addEntity()
  Transform.create(computer1, {
    position: Vector3.create(SCENE_CENTER_X - 4, 0, SCENE_CENTER_Z - 2),
    scale: Vector3.create(1, 1, 1)
  })
  GltfContainer.create(computer1, {
    src: 'assets/models/Computer_01.glb'
  })
  MeshCollider.setBox(computer1, ColliderLayer.CL_PHYSICS)
  SceneElement.create(computer1, { sceneType: SceneType.TECH })

  // Computer 02 - positioned on the right side
  const computer2 = engine.addEntity()
  Transform.create(computer2, {
    position: Vector3.create(SCENE_CENTER_X + 4, 0, SCENE_CENTER_Z - 2),
    scale: Vector3.create(1, 1, 1)
  })
  GltfContainer.create(computer2, {
    src: 'assets/models/Computer_02.glb'
  })
  MeshCollider.setBox(computer2, ColliderLayer.CL_PHYSICS)
  SceneElement.create(computer2, { sceneType: SceneType.TECH })

  // Digital Table - positioned in the center
  const digitalTable = engine.addEntity()
  Transform.create(digitalTable, {
    position: Vector3.create(SCENE_CENTER_X, 0, SCENE_CENTER_Z),
    scale: Vector3.create(1, 1, 1)
  })
  GltfContainer.create(digitalTable, {
    src: 'assets/models/DigitalTable_01.glb'
  })
  MeshCollider.setBox(digitalTable, ColliderLayer.CL_PHYSICS)
  SceneElement.create(digitalTable, { sceneType: SceneType.TECH })

  return { computer1, computer2, digitalTable }
}

// =============================================================================
// PET ENVIRONMENT (PET PHASE) - THEME AWARE
// =============================================================================

/**
 * Creates the pet environment scene with theme-specific styling
 * Used during the PET phase after hatching
 */
export function createPetEnvironment(theme: Theme = Theme.DEFAULT) {
  const colors = THEME_COLORS[theme]
  console.log(`Creating pet environment with theme: ${getThemeDisplayName(theme)}`)

  // Base elements (always present, colors vary by theme)
  const foodBowl = createFoodBowl(colors.accent1)
  const waterBowl = createWaterBowl(colors.accent2)
  const toyBall = createToyBall(colors.toy)
  const bed = createBed()
  const bathTub = createBathTub()

  // Theme-specific decorations
  const decorations = createThemeDecorations(theme)

  return { foodBowl, waterBowl, toyBall, bed, bathTub, ...decorations }
}

// -----------------------------------------------------------------------------
// Base Elements (present in all themes)
// -----------------------------------------------------------------------------

function createFoodBowl(color: Color4) {
  // Use pre-placed Food Bowl entity instead of creating new one
  const entity = engine.getEntityOrNullByName(EntityNames.Food_Bowl)
  if (!entity) {
    console.error('Food Bowl entity not found in scene!')
    return engine.addEntity() // Return dummy entity to prevent crashes
  }

  // Skip Transform and GLTF creation - Food Bowl is already positioned in scene editor
  MeshCollider.setCylinder(entity, ColliderLayer.CL_POINTER)
  SceneElement.create(entity, { sceneType: SceneType.PET })

  // Add visibility component - visible by default in PET phase
  VisibilityComponent.create(entity, { visible: true })

  // Make it clickable for feeding
  Interactable.create(entity, {
    type: InteractionType.FEED
  })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: 'Feed Pet'
        }
      }
    ]
  })

  return entity
}

function createBed() {
  // Use pre-placed Bed entity instead of creating new one
  const entity = engine.getEntityOrNullByName(EntityNames.Bed)
  if (!entity) {
    console.error('Bed entity not found in scene!')
    return engine.addEntity() // Return dummy entity to prevent crashes
  }

  // Skip Transform and GLTF creation - Bed is already positioned in scene editor
  MeshCollider.setBox(entity, ColliderLayer.CL_POINTER)
  SceneElement.create(entity, { sceneType: SceneType.PET })

  // Add visibility component - visible by default in PET phase
  VisibilityComponent.create(entity, { visible: true })

  // Make it clickable for sleeping
  Interactable.create(entity, {
    type: InteractionType.SLEEP
  })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: 'Put to Bed'
        }
      }
    ]
  })

  return entity
}

function createBathTub() {
  // Use pre-placed Bath Tub entity instead of creating new one
  const entity = engine.getEntityOrNullByName(EntityNames.Bath_Tub)
  if (!entity) {
    console.error('Bath Tub entity not found in scene!')
    return engine.addEntity() // Return dummy entity to prevent crashes
  }

  // Skip Transform and GLTF creation - Bath Tub is already positioned in scene editor
  MeshCollider.setBox(entity, ColliderLayer.CL_POINTER)
  SceneElement.create(entity, { sceneType: SceneType.PET })

  // Add visibility component - visible by default in PET phase
  VisibilityComponent.create(entity, { visible: true })

  // Make it clickable for bathing
  Interactable.create(entity, {
    type: InteractionType.BATHE
  })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: 'Bathe Pet'
        }
      }
    ]
  })

  return entity
}

function createWaterBowl(color: Color4) {
  const entity = engine.addEntity()
  Transform.create(entity, {
    position: Vector3.create(SCENE_CENTER_X + 2, 0.15, SCENE_CENTER_Z + 2),
    scale: Vector3.create(0.6, 0.3, 0.6)
  })
  MeshRenderer.setCylinder(entity)
  Material.setPbrMaterial(entity, {
    albedoColor: color,
    metallic: 0.3,
    roughness: 0.5
  })
  MeshCollider.setCylinder(entity, ColliderLayer.CL_POINTER)
  SceneElement.create(entity, { sceneType: SceneType.PET })

  // Make it clickable for drinking
  Interactable.create(entity, {
    type: InteractionType.DRINK_WATER
  })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: 'Give Water'
        }
      }
    ]
  })

  return entity
}

function createToyBall(color: Color4) {
  const entity = engine.addEntity()
  Transform.create(entity, {
    position: Vector3.create(SCENE_CENTER_X - 3, 0.3, SCENE_CENTER_Z - 2),
    scale: Vector3.create(0.5, 0.5, 0.5)
  })
  MeshRenderer.setSphere(entity)
  Material.setPbrMaterial(entity, {
    albedoColor: color,
    metallic: 0.1,
    roughness: 0.3
  })
  MeshCollider.setSphere(entity, ColliderLayer.CL_POINTER)
  SceneElement.create(entity, { sceneType: SceneType.PET })

  // Make it clickable for play
  Interactable.create(entity, {
    type: InteractionType.PLAY
  })

  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          button: InputAction.IA_POINTER,
          hoverText: 'Play with Pet'
        }
      }
    ]
  })

  return entity
}

// -----------------------------------------------------------------------------
// Theme-Specific Decorations
// -----------------------------------------------------------------------------

function createThemeDecorations(theme: Theme): Record<string, ReturnType<typeof engine.addEntity>> {
  switch (theme) {
    case Theme.CHRISTMAS:
      return createChristmasDecorations()
    case Theme.NEW_YEAR:
      return createNewYearDecorations()
    case Theme.SUMMER:
      return createSummerDecorations()
    case Theme.AUTUMN:
      return createAutumnDecorations()
    default:
      return createDefaultDecorations()
  }
}

function createDefaultDecorations() {
  // Simple flower placeholder
  const flower = engine.addEntity()
  Transform.create(flower, {
    position: Vector3.create(SCENE_CENTER_X + 3, 0.3, SCENE_CENTER_Z - 3),
    scale: Vector3.create(0.3, 0.5, 0.3)
  })
  MeshRenderer.setCylinder(flower)
  Material.setPbrMaterial(flower, {
    albedoColor: Color4.create(1, 0.4, 0.6, 1), // Pink
    roughness: 0.8
  })
  SceneElement.create(flower, { sceneType: SceneType.PET })

  return { flower }
}

function createChristmasDecorations() {
  // Christmas tree (cone placeholder)
  const tree = engine.addEntity()
  Transform.create(tree, {
    position: Vector3.create(SCENE_CENTER_X + 6, 1, SCENE_CENTER_Z + 6),
    scale: Vector3.create(1.5, 2, 1.5)
  })
  MeshRenderer.setCylinder(tree) // Will look like a cylinder, placeholder for tree
  Material.setPbrMaterial(tree, {
    albedoColor: Color4.create(0.1, 0.4, 0.1, 1), // Dark green
    roughness: 0.9
  })
  SceneElement.create(tree, { sceneType: SceneType.PET })

  // Present box
  const present = engine.addEntity()
  Transform.create(present, {
    position: Vector3.create(SCENE_CENTER_X + 5, 0.25, SCENE_CENTER_Z + 5),
    scale: Vector3.create(0.5, 0.5, 0.5)
  })
  MeshRenderer.setBox(present)
  Material.setPbrMaterial(present, {
    albedoColor: Color4.create(0.8, 0.1, 0.1, 1), // Red
    metallic: 0.2,
    roughness: 0.6
  })
  SceneElement.create(present, { sceneType: SceneType.PET })

  // Star on top (small gold sphere)
  const star = engine.addEntity()
  Transform.create(star, {
    position: Vector3.create(SCENE_CENTER_X + 6, 2.2, SCENE_CENTER_Z + 6),
    scale: Vector3.create(0.3, 0.3, 0.3)
  })
  MeshRenderer.setSphere(star)
  Material.setPbrMaterial(star, {
    albedoColor: Color4.create(1, 0.84, 0, 1), // Gold
    emissiveColor: Color4.create(1, 0.84, 0, 1),
    emissiveIntensity: 0.5
  })
  SceneElement.create(star, { sceneType: SceneType.PET })

  return { tree, present, star }
}

function createNewYearDecorations() {
  // Disco ball (shiny sphere)
  const discoBall = engine.addEntity()
  Transform.create(discoBall, {
    position: Vector3.create(SCENE_CENTER_X, 4, SCENE_CENTER_Z),
    scale: Vector3.create(0.8, 0.8, 0.8)
  })
  MeshRenderer.setSphere(discoBall)
  Material.setPbrMaterial(discoBall, {
    albedoColor: Color4.create(0.9, 0.9, 0.95, 1), // Silver
    metallic: 1,
    roughness: 0.1
  })
  SceneElement.create(discoBall, { sceneType: SceneType.PET })

  // Champagne bottle placeholder (cylinder)
  const champagne = engine.addEntity()
  Transform.create(champagne, {
    position: Vector3.create(SCENE_CENTER_X - 5, 0.4, SCENE_CENTER_Z + 5),
    scale: Vector3.create(0.2, 0.8, 0.2)
  })
  MeshRenderer.setCylinder(champagne)
  Material.setPbrMaterial(champagne, {
    albedoColor: Color4.create(0.1, 0.3, 0.1, 1), // Dark green bottle
    metallic: 0.8,
    roughness: 0.2
  })
  SceneElement.create(champagne, { sceneType: SceneType.PET })

  // Party hat (cone-like)
  const partyHat = engine.addEntity()
  Transform.create(partyHat, {
    position: Vector3.create(SCENE_CENTER_X + 5, 0.5, SCENE_CENTER_Z - 5),
    scale: Vector3.create(0.4, 0.6, 0.4)
  })
  MeshRenderer.setCylinder(partyHat)
  Material.setPbrMaterial(partyHat, {
    albedoColor: Color4.create(0.9, 0.1, 0.5, 1), // Party pink
    roughness: 0.7
  })
  SceneElement.create(partyHat, { sceneType: SceneType.PET })

  return { discoBall, champagne, partyHat }
}

function createSummerDecorations() {
  // Beach umbrella pole
  const umbrellaPole = engine.addEntity()
  Transform.create(umbrellaPole, {
    position: Vector3.create(SCENE_CENTER_X - 6, 1, SCENE_CENTER_Z - 5),
    scale: Vector3.create(0.1, 2, 0.1)
  })
  MeshRenderer.setCylinder(umbrellaPole)
  Material.setPbrMaterial(umbrellaPole, {
    albedoColor: Color4.create(0.8, 0.6, 0.4, 1), // Wooden
    roughness: 0.8
  })
  SceneElement.create(umbrellaPole, { sceneType: SceneType.PET })

  // Umbrella top (flat cylinder)
  const umbrellaTop = engine.addEntity()
  Transform.create(umbrellaTop, {
    position: Vector3.create(SCENE_CENTER_X - 6, 2.1, SCENE_CENTER_Z - 5),
    scale: Vector3.create(1.5, 0.1, 1.5)
  })
  MeshRenderer.setCylinder(umbrellaTop)
  Material.setPbrMaterial(umbrellaTop, {
    albedoColor: Color4.create(1, 0.3, 0.3, 1), // Red/orange stripes (solid for placeholder)
    roughness: 0.9
  })
  SceneElement.create(umbrellaTop, { sceneType: SceneType.PET })

  // Sunflower
  const sunflower = engine.addEntity()
  Transform.create(sunflower, {
    position: Vector3.create(SCENE_CENTER_X + 6, 0.6, SCENE_CENTER_Z - 4),
    scale: Vector3.create(0.5, 0.5, 0.1)
  })
  MeshRenderer.setSphere(sunflower)
  Material.setPbrMaterial(sunflower, {
    albedoColor: Color4.create(1, 0.85, 0, 1), // Bright yellow
    emissiveColor: Color4.create(1, 0.85, 0, 1),
    emissiveIntensity: 0.2
  })
  SceneElement.create(sunflower, { sceneType: SceneType.PET })

  return { umbrellaPole, umbrellaTop, sunflower }
}

function createAutumnDecorations() {
  // Pumpkin
  const pumpkin = engine.addEntity()
  Transform.create(pumpkin, {
    position: Vector3.create(SCENE_CENTER_X + 5, 0.35, SCENE_CENTER_Z + 5),
    scale: Vector3.create(0.7, 0.5, 0.7)
  })
  MeshRenderer.setSphere(pumpkin)
  Material.setPbrMaterial(pumpkin, {
    albedoColor: Color4.create(1, 0.5, 0.1, 1), // Orange
    roughness: 0.8
  })
  SceneElement.create(pumpkin, { sceneType: SceneType.PET })

  // Fallen leaves pile (flat box)
  const leavesPile = engine.addEntity()
  Transform.create(leavesPile, {
    position: Vector3.create(SCENE_CENTER_X - 6, 0.1, SCENE_CENTER_Z + 4),
    scale: Vector3.create(1.5, 0.2, 1.5)
  })
  MeshRenderer.setBox(leavesPile)
  Material.setPbrMaterial(leavesPile, {
    albedoColor: Color4.create(0.8, 0.4, 0.1, 1), // Orange-brown
    roughness: 1
  })
  SceneElement.create(leavesPile, { sceneType: SceneType.PET })

  // Bare tree trunk
  const treeTrunk = engine.addEntity()
  Transform.create(treeTrunk, {
    position: Vector3.create(SCENE_CENTER_X + 7, 1, SCENE_CENTER_Z - 6),
    scale: Vector3.create(0.3, 2, 0.3)
  })
  MeshRenderer.setCylinder(treeTrunk)
  Material.setPbrMaterial(treeTrunk, {
    albedoColor: Color4.create(0.4, 0.25, 0.1, 1), // Brown bark
    roughness: 1
  })
  SceneElement.create(treeTrunk, { sceneType: SceneType.PET })

  return { pumpkin, leavesPile, treeTrunk }
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Removes all entities belonging to a specific scene type
 */
export function removeSceneByType(sceneType: SceneType) {
  const entitiesToRemove: ReturnType<typeof engine.addEntity>[] = []

  // Collect entities to remove (can't modify while iterating)
  for (const [entity, sceneElement] of engine.getEntitiesWith(SceneElement)) {
    if (sceneElement.sceneType === sceneType) {
      entitiesToRemove.push(entity)
    }
  }

  // Remove collected entities
  for (const entity of entitiesToRemove) {
    engine.removeEntity(entity)
  }

  console.log(`Removed ${entitiesToRemove.length} entities from ${sceneType} scene`)
}

// Keep the old function name for backwards compatibility during migration
export const createEnvironment = createTechEnvironment
