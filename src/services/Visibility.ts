// EPIC: Game Flow Stories - New Player Onboarding, Pet Care Interactions
// Centralized visibility management service. Handles showing/hiding entities based on game state.
// No more scattered visibility logic - all state-based visibility rules live here.
// Modules can call visibility.showPetDecorations() without knowing implementation details.

import { GamePhase } from '../Game'

// Forward declarations for Decentraland types (will be imported when needed)
// type Entity = any

export class VisibilityManager {
  // Entity groups - single source of truth for what entities belong together
  private entityGroups = {
    // Always visible entities
    always: ['Console', 'Button_1', 'Button_2', 'Button_3'],

    // Egg phase entities
    egg: ['Egg'],

    // Pet phase entities
    pet: ['Tiger', 'Bed', 'Bath_Tub', 'Decoration', 'Food_Bowl', 'Ball'],

    // Dynamic entities (poops managed by Poop module)
    poops: ['Poop_1', 'Poop_2', 'Poop_3', 'Poop_4', 'Poop_5', 'Poop_6', 'Poop_7']
  }

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
  showEntity(entity: any) {
    // TODO: Use Decentraland VisibilityComponent
    // const visibility = VisibilityComponent.getMutableOrNull(entity)
    // if (visibility) {
    //   visibility.visible = true
    // }
    console.log(`👁️ Showing entity: ${entity}`)
  }

  hideEntity(entity: any) {
    // TODO: Use Decentraland VisibilityComponent
    // const visibility = VisibilityComponent.getMutableOrNull(entity)
    // if (visibility) {
    //   visibility.visible = false
    // }
    console.log(`🙈 Hiding entity: ${entity}`)
  }

  // Group visibility functions
  showGroup(groupName: string) {
    const entities = this.entityGroups[groupName as keyof typeof this.entityGroups]
    if (entities) {
      entities.forEach((entityName) => {
        // TODO: Get entity by name and show it
        console.log(`👁️ Showing group ${groupName}: ${entityName}`)
      })
    }
  }

  hideGroup(groupName: string) {
    const entities = this.entityGroups[groupName as keyof typeof this.entityGroups]
    if (entities) {
      entities.forEach((entityName) => {
        // TODO: Get entity by name and hide it
        console.log(`🙈 Hiding group ${groupName}: ${entityName}`)
      })
    }
  }

  // State-based visibility functions
  showEggDecorations() {
    console.log('🐣 Showing egg phase decorations')
    this.showGroup('egg')
    this.showGroup('always')
    this.hideGroup('pet')
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

