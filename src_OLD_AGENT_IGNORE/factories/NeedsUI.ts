import {
  engine,
  Entity,
  Transform,
  Billboard,
  BillboardMode,
  MeshRenderer,
  MeshCollider,
  Material,
  TextShape,
  TextAlignMode,
  ColliderLayer
} from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { PetComponent } from '../components/Pet'
import { HygieneComponent } from '../components/Hygiene'
import { NeedsUIComponent } from '../components/NeedsUI'

// =============================================================================
// NEEDS UI FACTORY
// Creates optional cylindrical bars showing pet stats above the pet
// =============================================================================

// Constants for bar appearance
const BAR_HEIGHT = 0.6
const BAR_WIDTH = 0.08 // Thinner for tube/cylinder look
const BAR_DEPTH = 0.08
const BAR_SPACING = 0.35

// Color function based on fill percentage
function colorForFill(fill: number): Color4 {
  if (fill > 0.66) {
    return Color4.fromHexString('#27f27d') // Green - good
  }
  if (fill > 0.33) {
    return Color4.fromHexString('#ffd166') // Yellow - medium
  }
  return Color4.fromHexString('#ff4d4f') // Red - bad
}

// Utility function to clamp values between 0 and 1
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

// Configuration for each need bar
type NeedKey = 'food' | 'mood' | 'rest' | 'bath'

interface NeedConfig {
  key: NeedKey
  label: string
  iconColor: Color4
  getFill: (pet: any, hygiene: any) => number // 0..1
}

export const NEED_CONFIG: NeedConfig[] = [
  {
    key: 'food',
    label: 'F',
    iconColor: Color4.fromHexString('#ff7c7c'), // Red for food
    getFill: (pet, hygiene) => 1 - clamp01(pet.hunger / 100) // Low hunger = high fill
  },
  {
    key: 'mood',
    label: 'M',
    iconColor: Color4.fromHexString('#ffd166'), // Yellow for mood
    getFill: (pet, hygiene) => clamp01(pet.mood / 100) // High mood = high fill
  },
  {
    key: 'rest',
    label: 'R',
    iconColor: Color4.fromHexString('#b084ff'), // Purple for rest/energy
    getFill: (pet, hygiene) => clamp01(pet.energy / 100) // High energy = high fill
  },
  {
    key: 'bath',
    label: 'B',
    iconColor: Color4.fromHexString('#7fffb9'), // Green for bath/cleanliness
    getFill: (pet, hygiene) => clamp01(hygiene.cleanliness / 100) // High cleanliness = high fill
  }
]

/**
 * Creates the needs UI bars above a pet
 * Returns the root UI entity
 */
export function createNeedsUI(petEntity: Entity): Entity {
  // Create root entity with billboard
  const uiRoot = engine.addEntity()
  Transform.create(uiRoot, {
    parent: petEntity,
    position: Vector3.create(0, 1.8, 0)
  })
  Billboard.create(uiRoot, { billboardMode: BillboardMode.BM_Y })

  const barEntities: Entity[] = []
  const offset = (NEED_CONFIG.length - 1) * BAR_SPACING * 0.5

  NEED_CONFIG.forEach((config, index) => {
    // Background tube (rounded cylinder)
    const slot = engine.addEntity()
    Transform.create(slot, {
      parent: uiRoot,
      position: Vector3.create(index * BAR_SPACING - offset, 0, 0),
      scale: Vector3.create(BAR_WIDTH, BAR_HEIGHT + 0.1, BAR_WIDTH)
    })
    MeshRenderer.setCylinder(slot)
    MeshCollider.setCylinder(slot, ColliderLayer.CL_NONE)
    Material.setPbrMaterial(slot, {
      albedoColor: Color4.fromHexString('#20202880'),
      emissiveColor: Color4.fromHexString('#0a0a0f'),
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metallic: 0.5
    })

    // Fill tube (glowing, colored, slightly smaller)
    const fill = engine.addEntity()
    Transform.create(fill, {
      parent: slot,
      position: Vector3.create(0, -BAR_HEIGHT / 2 + BAR_HEIGHT * 0.25, 0), // Start at 50% (half)
      scale: Vector3.create(0.85, BAR_HEIGHT * 0.5, 0.85) // 50% height initially
    })
    MeshRenderer.setCylinder(fill)
    MeshCollider.setCylinder(fill, ColliderLayer.CL_NONE)
    const initialColor = colorForFill(0.5) // Start at 50%
    Material.setPbrMaterial(fill, {
      albedoColor: initialColor,
      emissiveColor: initialColor,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metallic: 0.1
    })

    // Icon background (rounded square plane)
    const iconBg = engine.addEntity()
    Transform.create(iconBg, {
      parent: slot,
      position: Vector3.create(0, BAR_HEIGHT / 2 + 0.18, 0),
      scale: Vector3.create(0.18, 0.18, 0.18)
    })
    MeshRenderer.setPlane(iconBg)
    MeshCollider.setPlane(iconBg, ColliderLayer.CL_NONE)
    Material.setPbrMaterial(iconBg, {
      albedoColor: config.iconColor,
      emissiveColor: config.iconColor,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metallic: 0.2
    })

    // Icon letter (compatible ASCII)
    const label = engine.addEntity()
    Transform.create(label, {
      parent: iconBg,
      position: Vector3.create(0, 0, -0.01),
      scale: Vector3.create(0.6, 0.6, 0.6)
    })
    TextShape.create(label, {
      text: config.label,
      fontSize: 4,
      textColor: Color4.Black(),
      width: 1,
      height: 1,
      textAlign: TextAlignMode.TAM_MIDDLE_CENTER
    })

    barEntities.push(fill)
  })

  // Attach component to track this UI instance
  NeedsUIComponent.create(uiRoot, {
    petEntity,
    rootEntity: uiRoot,
    barEntities
  })

  // Initially hide the UI (scale to near zero)
  const rootTransform = Transform.getMutable(uiRoot)
  rootTransform.scale = Vector3.create(0.001, 0.001, 0.001)

  return uiRoot
}

/**
 * Updates a single needs UI bar
 */
export function updateNeedsUIBar(fillEntity: Entity, fillPct: number) {
  const newHeight = Math.max(0.02, BAR_HEIGHT * fillPct)
  const fillTransform = Transform.getMutable(fillEntity)
  fillTransform.scale = Vector3.create(0.85, newHeight, 0.85) // Cylinder fill (85% of slot width)
  fillTransform.position = Vector3.create(0, -BAR_HEIGHT / 2 + newHeight / 2, 0)

  const color = colorForFill(fillPct)
  Material.setPbrMaterial(fillEntity, {
    albedoColor: color,
    emissiveColor: color,
    emissiveIntensity: 1.5, // Brighter glow
    roughness: 0.2,
    metallic: 0.1
  })
}

/**
 * Shows or hides the needs UI for a pet
 */
export function setNeedsUIVisible(needsUIEntity: Entity, visible: boolean) {
  const mutable = Transform.getMutable(needsUIEntity)
  if (!mutable.scale) {
    mutable.scale = Vector3.create(1, 1, 1)
  }
  if (visible) {
    mutable.scale.x = 1
    mutable.scale.y = 1
    mutable.scale.z = 1
    mutable.position.y = 1.8
  } else {
    mutable.scale.x = 0.001
    mutable.scale.y = 0.001
    mutable.scale.z = 0.001
  }
}
