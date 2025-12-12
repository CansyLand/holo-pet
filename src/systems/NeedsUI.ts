import { engine } from '@dcl/sdk/ecs'
import { PetComponent } from '../components/Pet'
import { HygieneComponent } from '../components/Hygiene'
import { NeedsUIEnabledComponent, NeedsUIComponent } from '../components/NeedsUI'
import { updateNeedsUIBar, setNeedsUIVisible, NEED_CONFIG } from '../factories/NeedsUI'

// =============================================================================
// NEEDS UI SYSTEM
// Updates cylindrical bars above pets to show their current stats
// Only runs when needs UI is globally enabled
// =============================================================================

/**
 * Main needs UI update system
 * Runs every frame to sync visual bars with pet stats
 */
export function needsUISystem(dt: number) {
  // Check if needs UI is globally enabled
  let uiEnabled = false
  for (const [_, enabled] of engine.getEntitiesWith(NeedsUIEnabledComponent)) {
    uiEnabled = enabled.enabled
    break
  }

  if (!uiEnabled) {
    // Hide all needs UIs when disabled
    for (const [uiEntity] of engine.getEntitiesWith(NeedsUIComponent)) {
      setNeedsUIVisible(uiEntity, false)
    }
    return
  }

  // Update all active needs UIs
  for (const [uiEntity, ui] of engine.getEntitiesWith(NeedsUIComponent)) {
    // Show the UI since it's enabled
    setNeedsUIVisible(uiEntity, true)

    // Get pet stats
    const pet = PetComponent.getOrNull(ui.petEntity)
    const hygiene = HygieneComponent.getOrNull(ui.petEntity)

    if (!pet || !hygiene) continue

    // Update each bar based on current stats
    NEED_CONFIG.forEach((config, index) => {
      const fillEntity = ui.barEntities[index]
      if (!fillEntity) return

      const fillPct = config.getFill(pet, hygiene)
      updateNeedsUIBar(fillEntity, fillPct)
    })
  }
}

/**
 * Enables the needs UI system globally
 */
export function enableNeedsUI() {
  // Update existing global state or create new one
  for (const [entity] of engine.getEntitiesWith(NeedsUIEnabledComponent)) {
    NeedsUIEnabledComponent.getMutable(entity).enabled = true
    return
  }

  // Create global enabled state if it doesn't exist
  const globalEntity = engine.addEntity()
  NeedsUIEnabledComponent.create(globalEntity, { enabled: true })
}

/**
 * Disables the needs UI system globally
 */
export function disableNeedsUI() {
  for (const [entity] of engine.getEntitiesWith(NeedsUIEnabledComponent)) {
    NeedsUIEnabledComponent.getMutable(entity).enabled = false
  }
}

/**
 * Toggles the needs UI system on/off
 */
export function toggleNeedsUI() {
  let currentState = false

  // Find current state
  for (const [_, enabled] of engine.getEntitiesWith(NeedsUIEnabledComponent)) {
    currentState = enabled.enabled
    break
  }

  // Toggle the state
  if (currentState) {
    disableNeedsUI()
  } else {
    enableNeedsUI()
  }
}

/**
 * Checks if needs UI is currently enabled
 */
export function isNeedsUIEnabled(): boolean {
  for (const [_, enabled] of engine.getEntitiesWith(NeedsUIEnabledComponent)) {
    return enabled.enabled
  }
  return false
}
