// EPIC: Pet Care Interactions - Daily Quest System
// 3D floating stats bars that hover over the pet - mood, hunger, energy, cleanliness bars.
// State-aware: Shows/hides automatically based on game phase and focus state.
// Replaces the old NeedsUI system but in 3D space.

import { engine, Entity, Transform, MeshRenderer, Material, TextShape } from '@dcl/sdk/ecs'
import { Vector3, Color4, Quaternion } from '@dcl/sdk/math'
import { game } from '../Game'
import { GameModule } from '../Game'
import { visibility } from '../services/Visibility'

export class NeedsBarsModule implements GameModule {
  name = 'Needs'
  bars: { [key: string]: Entity } = {} // Entity references for each stat bar
  barOffset = 2 // Height above pet to show bars

  init() {
    console.log('📊 Needs module initialized')
    this.createStatBars()
  }

  update(dt: number) {
    if (!game.state.pet) return

    // Update each stat bar based on current pet stats
    this.updateBar('mood', game.state.pet.data.mood)
    this.updateBar('hunger', game.state.pet.data.hunger)
    this.updateBar('energy', game.state.pet.data.energy)
    this.updateBar('cleanliness', game.state.pet.data.cleanliness)
  }

  private createStatBars() {
    const stats = [
      { name: 'mood', color: Color4.Red(), offset: 0 },
      { name: 'hunger', color: Color4.create(1, 0.5, 0, 1), offset: 0.3 }, // Orange
      { name: 'energy', color: Color4.Yellow(), offset: 0.6 },
      { name: 'cleanliness', color: Color4.Blue(), offset: 0.9 }
    ]

    stats.forEach((stat, index) => {
      const barEntity = this.createStatBar(stat.name, stat.color, index)
      this.bars[stat.name] = barEntity
    })

    console.log('📊 Created 3D stat bars')
  }

  private getBarColor(statName: string): Color4 {
    switch (statName) {
      case 'mood':
        return Color4.Red()
      case 'hunger':
        return Color4.create(1, 0.5, 0, 1) // Orange
      case 'energy':
        return Color4.Yellow()
      case 'cleanliness':
        return Color4.Blue()
      default:
        return Color4.Gray()
    }
  }

  private createStatBar(statName: string, color: Color4, index: number): Entity {
    const entity = engine.addEntity()

    // Create a simple box to represent the stat bar
    MeshRenderer.setBox(entity)
    Material.setPbrMaterial(entity, {
      albedoColor: color,
      metallic: 0.0,
      roughness: 0.5
    })

    // Position above pet (will be updated in update loop)
    Transform.create(entity, {
      position: Vector3.create(16, 2 + index * 0.3, 16),
      scale: Vector3.create(0.5, 0.1, 0.05) // Thin horizontal bar
    })

    return entity
  }

  private updateBar(statName: string, value: number) {
    const barEntity = this.bars[statName]
    if (!barEntity) return

    // Update bar scale based on value (0-100)
    const scale = Transform.getMutable(barEntity)
    scale.scale.x = Math.max(0.01, (value / 100) * 0.5) // Scale from 0 to 0.5

    // Update color intensity based on value - more transparent when low
    const alpha = value < 30 ? 0.7 : 1.0
    const currentColor = this.getBarColor(statName)
    const updatedColor = { ...currentColor, a: alpha }

    Material.setPbrMaterial(barEntity, {
      albedoColor: updatedColor,
      metallic: 0.0,
      roughness: 0.5
    })

    // Position bar relative to pet
    if (game.state.pet) {
      const petPos = game.state.pet.data.position
      const barTransform = Transform.getMutable(barEntity)
      const statIndex = Object.keys(this.bars).indexOf(statName)
      barTransform.position = Vector3.create(petPos.x, petPos.y + this.barOffset + statIndex * 0.3, petPos.z)
    }
  }

  // Show all stat bars
  showBars() {
    Object.values(this.bars).forEach((entity) => {
      visibility.showEntity(entity)
    })
    console.log('📊 Showing all stat bars')
  }

  // Hide all stat bars
  hideBars() {
    Object.values(this.bars).forEach((entity) => {
      visibility.hideEntity(entity)
    })
    console.log('📊 Hiding all stat bars')
  }

  // State-aware visibility - called by game state changes
  onGameStateChange() {
    if (game.state.phase === 'pet') {
      this.showBars()
    } else {
      this.hideBars()
    }
  }

  // Focus-aware visibility - hide when pet is being interacted with closely
  onFocusChange(isFocused: boolean) {
    if (isFocused) {
      this.hideBars() // Don't show bars when camera is focused on pet
    } else {
      this.showBars()
    }
  }

  cleanup() {
    console.log('📊 Needs module cleanup')
    this.hideBars()
  }
}
