// EPIC: Pet Care Interactions - All interaction types
// Centralized input handling service. Modules register handlers for different interaction types.
// Clean communication between user input and game modules.

export interface InteractionHandler {
  (entity: any, event: any): void
}

export class InteractionManager {
  private handlers: { [key: string]: InteractionHandler[] } = {}

  constructor() {
    console.log('🖱️ Interaction manager initialized')
  }

  // Register a handler for a specific interaction type
  registerHandler(interactionType: string, handler: InteractionHandler) {
    if (!this.handlers[interactionType]) {
      this.handlers[interactionType] = []
    }
    this.handlers[interactionType].push(handler)
    console.log(`🖱️ Registered ${interactionType} handler`)
  }

  // Unregister a handler
  unregisterHandler(interactionType: string, handler: InteractionHandler) {
    const typeHandlers = this.handlers[interactionType]
    if (typeHandlers) {
      const index = typeHandlers.indexOf(handler)
      if (index > -1) {
        typeHandlers.splice(index, 1)
        console.log(`🖱️ Unregistered ${interactionType} handler`)
      }
    }
  }

  // Process an interaction event
  processInteraction(interactionType: string, entity: any, event: any) {
    const typeHandlers = this.handlers[interactionType]
    if (typeHandlers) {
      typeHandlers.forEach((handler) => {
        try {
          handler(entity, event)
        } catch (error) {
          console.error(`🖱️ Error in ${interactionType} handler:`, error)
        }
      })
    } else {
      console.log(`🖱️ No handlers registered for ${interactionType}`)
    }
  }

  // Common interaction types (used by modules)
  static readonly INTERACTION_TYPES = {
    EGG_CLICK: 'egg_click',
    PET_CLICK: 'pet_click',
    FOOD_BOWL_CLICK: 'food_bowl_click',
    BATH_CLICK: 'bath_click',
    BED_CLICK: 'bed_click',
    BALL_CLICK: 'ball_click',
    DECORATION_CLICK: 'decoration_click',
    POOP_CLICK: 'poop_click',
    MENU_BUTTON_CLICK: 'menu_button_click'
  } as const

  // Helper to register common module handlers
  registerModuleHandlers(moduleName: string, handlers: { [key: string]: InteractionHandler }) {
    Object.entries(handlers).forEach(([type, handler]) => {
      this.registerHandler(`${moduleName}_${type}`, handler)
    })
    console.log(`🖱️ Registered ${Object.keys(handlers).length} handlers for ${moduleName}`)
  }

  // Get all registered interaction types (for debugging)
  getRegisteredTypes(): string[] {
    return Object.keys(this.handlers)
  }

  // Clear all handlers (for cleanup)
  clearAllHandlers() {
    this.handlers = {}
    console.log('🖱️ All interaction handlers cleared')
  }
}

// Global instance
export const interaction = new InteractionManager()
