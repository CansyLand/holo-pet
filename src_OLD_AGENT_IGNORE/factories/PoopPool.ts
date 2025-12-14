import {
  engine,
  MeshCollider,
  PointerEvents,
  PointerEventType,
  InputAction,
  ColliderLayer,
  Entity,
  VisibilityComponent
} from '@dcl/sdk/ecs'
import { Interactable, InteractionType } from '../components/Interaction'
import { initializePoopSystem } from '../systems/Poop'
import { EntityNames } from '../../assets/scene/entity-names'

// =============================================================================
// SIMPLIFIED POOP POOL FACTORY
// Just initializes the 7 pre-placed poop entities with basic interaction components
// =============================================================================

/**
 * Initialize the poop entities with interaction components
 * Called once when the pet environment is set up
 */
export function createPoopPool(): void {
  // Get pre-placed poop entities and add interaction components
  const poopEntityNames = [
    EntityNames.Poop_1,
    EntityNames.Poop_2,
    EntityNames.Poop_3,
    EntityNames.Poop_4,
    EntityNames.Poop_5,
    EntityNames.Poop_6,
    EntityNames.Poop_7
  ]

  // Set up each poop entity
  for (const entityName of poopEntityNames) {
    const entity = engine.getEntityOrNullByName(entityName)
    if (!entity) {
      console.error(`Poop entity ${entityName} not found in scene!`)
      continue
    }

    // Collision for click detection
    MeshCollider.setSphere(entity, ColliderLayer.CL_POINTER)

    // Visibility component - start hidden (use createOrReplace in case it already exists)
    VisibilityComponent.createOrReplace(entity, { visible: false })

    // Make it interactable (collect poop) - use createOrReplace to handle reset scenarios
    Interactable.createOrReplace(entity, {
      type: InteractionType.COLLECT_POOP
    })

    // Pointer events for collection - use createOrReplace to handle reset scenarios
    PointerEvents.createOrReplace(entity, {
      pointerEvents: [
        {
          eventType: PointerEventType.PET_DOWN,
          eventInfo: {
            button: InputAction.IA_POINTER,
            hoverText: 'Collect'
          }
        }
      ]
    })
  }

  // Initialize the poop system
  initializePoopSystem()

  console.log('Poop pool initialized with 7 entities')
}
