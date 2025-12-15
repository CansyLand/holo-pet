// EPIC: Pet Care Interactions - Daily Quest System
// 3D floating stats bars that hover over the pet - mood, hunger, energy, cleanliness bars.
// State-aware: Shows/hides automatically based on game phase and focus state.
// Replaces the old NeedsUI system but in 3D space with rich visuals.

import { engine, Entity, Transform, MeshRenderer, Material, TextShape, Billboard, BillboardMode } from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { game, GamePhase } from '../Game'
import { GameModule } from '../Game'
import { visibility } from '../services/Visibility'

export class NeedsBarsModule implements GameModule {
  name = 'Needs'
  rootEntity: Entity | null = null
  barEntities: Entity[] = []
  barOffset = 6 // Height above pet

  // Configuration matching old system
  private readonly NEED_CONFIG = [
    {
      key: 'food' as const,
      label: 'F',
      iconColor: Color4.fromHexString('#ff7c7c'), // Red for food
      getFill: (pet: any) => Math.max(0, Math.min(1, (100 - pet.hunger) / 100)) // Low hunger = high fill
    },
    {
      key: 'mood' as const,
      label: 'M',
      iconColor: Color4.fromHexString('#ffd166'), // Yellow for mood
      getFill: (pet: any) => Math.max(0, Math.min(1, pet.mood / 100)) // High mood = high fill
    },
    {
      key: 'rest' as const,
      label: 'R',
      iconColor: Color4.fromHexString('#b084ff'), // Purple for rest/energy
      getFill: (pet: any) => Math.max(0, Math.min(1, pet.energy / 100)) // High energy = high fill
    },
    {
      key: 'bath' as const,
      label: 'B',
      iconColor: Color4.fromHexString('#7fffb9'), // Green for bath/cleanliness
      getFill: (pet: any) => Math.max(0, Math.min(1, pet.cleanliness / 100)) // High cleanliness = high fill
    }
  ]

  init() {
    console.log('📊 Needs bars module initialized')
    // Create bars once during init when pet entity is available
    this.createBars()
  }

  // Try to create bars if pet becomes available later
  tryCreateBars() {
    if (!this.rootEntity && game.state.pet?.entity) {
      this.createBars()
    }
  }

  // Single simple method - bars only show/hide when explicitly called
  setVisible(visible: boolean) {
    if (!this.rootEntity) return

    const scale = visible ? Vector3.create(1, 1, 1) : Vector3.create(0.001, 0.001, 0.001)
    Transform.getMutable(this.rootEntity).scale = scale
    console.log(`📊 Bars ${visible ? 'shown' : 'hidden'} manually`)
  }

  // Create bars once during init (when pet entity exists)
  createBars() {
    console.log('📊 Creating needs bars')
    this.createNeedsUI()
  }

  private createNeedsUI() {
    // Get pet entity for parenting
    const petEntity = game.state.pet?.entity
    if (!petEntity) {
      console.log('📊 Pet entity not available for parenting needs bars - will create bars when pet is available')
      return
    }

    // Create root entity with billboard and parent it to pet
    this.rootEntity = engine.addEntity()
    Transform.create(this.rootEntity, {
      parent: petEntity, // Parent to pet entity for automatic following
      position: Vector3.create(0, this.barOffset, 0), // Relative position
      scale: Vector3.create(0.001, 0.001, 0.001) // Start hidden
    })
    Billboard.create(this.rootEntity, { billboardMode: BillboardMode.BM_Y })

    const barSpacing = 0.35
    const offset = (this.NEED_CONFIG.length - 1) * barSpacing * 0.5

    this.NEED_CONFIG.forEach((config, index) => {
      const baseX = index * barSpacing - offset

      // Background tube (rounded cylinder like old system) - PARENT TO ROOT
      const slot = engine.addEntity()
      Transform.create(slot, {
        parent: this.rootEntity!,
        position: Vector3.create(baseX, 0, 0),
        scale: Vector3.create(0.08, 0.6, 0.08) // Thinner for tube look
      })
      MeshRenderer.setCylinder(slot)
      Material.setPbrMaterial(slot, {
        albedoColor: Color4.fromHexString('#20202880'),
        emissiveColor: Color4.fromHexString('#0a0a0f'),
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metallic: 0.5
      })

      // Fill tube (glowing, colored, like old system) - PARENT TO ROOT
      const fill = engine.addEntity()
      Transform.create(fill, {
        parent: this.rootEntity!, // Changed from slot to rootEntity
        position: Vector3.create(baseX, -0.3 + 0.15, 0), // Start at 50%, include baseX
        scale: Vector3.create(0.085, 0.3, 0.085) // 50% height initially
      })
      MeshRenderer.setCylinder(fill)
      const initialColor = this.getBarColor(0.5) // Start at 50%
      Material.setPbrMaterial(fill, {
        albedoColor: initialColor,
        emissiveColor: initialColor,
        emissiveIntensity: 1.5,
        roughness: 0.2,
        metallic: 0.1
      })

      // Icon background (like old system) - PARENT TO ROOT
      const iconBg = engine.addEntity()
      Transform.create(iconBg, {
        parent: this.rootEntity!, // Changed from slot to rootEntity
        position: Vector3.create(baseX, 0.3 + 0.09, 0), // Include baseX
        scale: Vector3.create(0.09, 0.09, 0.09)
      })
      MeshRenderer.setPlane(iconBg)
      Material.setPbrMaterial(iconBg, {
        albedoColor: config.iconColor,
        emissiveColor: config.iconColor,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metallic: 0.2
      })

      // Icon letter (like old system) - PARENT TO ROOT
      const label = engine.addEntity()
      Transform.create(label, {
        parent: this.rootEntity!, // Changed from iconBg to rootEntity
        position: Vector3.create(baseX, 0.3 + 0.09, -0.01), // Include baseX and Z offset
        scale: Vector3.create(0.3, 0.3, 0.3)
      })
      TextShape.create(label, {
        text: config.label,
        fontSize: 4,
        textColor: Color4.Black(),
        textAlign: 1 // TAM_MIDDLE_CENTER
      })

      this.barEntities.push(fill)
    })

    console.log('📊 Created 3D stat bars with rich visuals')
  }

  updateBar(fillEntity: Entity, fillPct: number) {
    const barHeight = 0.6
    const newHeight = Math.max(0.02, barHeight * fillPct)
    const fillTransform = Transform.getMutable(fillEntity)
    fillTransform.scale = Vector3.create(0.085, newHeight, 0.085)
    // Preserve the X position (baseX) while updating Y position for height
    const currentX = fillTransform.position.x
    fillTransform.position = Vector3.create(currentX, -barHeight / 2 + newHeight / 2, 0)

    const color = this.getBarColor(fillPct)
    Material.setPbrMaterial(fillEntity, {
      albedoColor: color,
      emissiveColor: color,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metallic: 0.1
    })
  }

  // Public method for updating all bars
  updateAllBars() {
    if (!game.state.pet) return

    this.NEED_CONFIG.forEach((config, index) => {
      const fillPct = config.getFill(game.state.pet!.data)
      this.updateBar(this.barEntities[index], fillPct)
    })
  }

  private getBarColor(fillPct: number): Color4 {
    if (fillPct > 0.66) {
      return Color4.fromHexString('#27f27d') // Green - good
    }
    if (fillPct > 0.33) {
      return Color4.fromHexString('#ffd166') // Yellow - medium
    }
    return Color4.fromHexString('#ff4d4f') // Red - bad
  }
}

// Automatic state-based update system for bars
let needsBarsModuleInstance: NeedsBarsModule | null = null
let lastUpdateTime = 0
const UPDATE_INTERVAL = 250 // 1/4 second (4 times per second)

export function initializeNeedsBarsSystem(module: NeedsBarsModule) {
  needsBarsModuleInstance = module
  console.log('📊 Needs bars system initialized (automatic state-based control)')
}

export function needsBarsSystem(dt: number) {
  if (!needsBarsModuleInstance) return

  // ✅ Try to create bars if pet entity becomes available
  needsBarsModuleInstance.tryCreateBars()

  // ✅ Check game state automatically 4 times per second
  const shouldBeVisible = game.state.phase === GamePhase.PET
  const isCurrentlyVisible =
    needsBarsModuleInstance.rootEntity && Transform.get(needsBarsModuleInstance.rootEntity).scale.x > 0.1

  // Auto-show/hide based on game state
  if (shouldBeVisible && !isCurrentlyVisible) {
    console.log('📊 Auto-showing needs bars (PET phase)')
    needsBarsModuleInstance.setVisible(true)
  } else if (!shouldBeVisible && isCurrentlyVisible) {
    console.log('📊 Auto-hiding needs bars (not PET phase)')
    needsBarsModuleInstance.setVisible(false)
  }

  // Update bars if they should be visible and pet exists and bars exist
  if (shouldBeVisible && game.state.pet && needsBarsModuleInstance.rootEntity) {
    const now = Date.now()
    if (now - lastUpdateTime >= UPDATE_INTERVAL) {
      lastUpdateTime = now
      needsBarsModuleInstance.updateAllBars()
    }
  }
}
