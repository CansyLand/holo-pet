// EPIC: Pet Care Interactions - Daily Quest System
// 3D floating stats bars that hover over the pet - mood, hunger, energy, cleanliness bars.
// State-aware: Shows/hides automatically based on game phase and focus state.
// Replaces the old NeedsUI system but in 3D space.

import { game } from '../Game'
import { GameModule } from '../Game'
import { visibility } from '../services/Visibility'

export class NeedsModule implements GameModule {
  name = 'Needs'
  bars: { [key: string]: any } = {} // Entity references for each stat bar

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
    // TODO: Create 3D entities for each stat bar
    // Position them above the pet
    // Use billboards or 3D bars

    console.log('📊 Creating 3D stat bars')
    // this.bars.mood = createStatBar('mood', red color)
    // this.bars.hunger = createStatBar('hunger', orange color)
    // this.bars.energy = createStatBar('energy', yellow color)
    // this.bars.cleanliness = createStatBar('cleanliness', blue color)
  }

  private updateBar(statName: string, value: number) {
    const barEntity = this.bars[statName]
    if (!barEntity) return

    // TODO: Update bar visual based on value (0-100)
    // Scale the bar, change color, etc.
    console.log(`📊 Updating ${statName} bar: ${value}`)
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

