import { engine, inputSystem, InputAction, PointerEventType, Entity } from '@dcl/sdk/ecs'
import { Interactable, InteractionEvent, InteractionType } from '../components/Interaction'
import { canInteractWithStations } from './Visit'
import { CameraFocusComponent } from '../components/UIState'
import { deactivatePetCamera } from '../factories/UI'

// Interactions that are blocked when visiting (stations and care actions)
const STATION_INTERACTIONS = [
  InteractionType.FEED,
  InteractionType.PLAY,
  InteractionType.CLEAN,
  InteractionType.BATHE,
  InteractionType.BRUSH,
  InteractionType.GIVE_TREAT,
  InteractionType.COLLECT_POOP
]

export function inputSystemCallback(dt: number) {
  // Iterate over all interactable entities
  for (const [entity, interactable] of engine.getEntitiesWith(Interactable)) {
    // Check if this entity was clicked
    // Note: In SDK7, for simple clicks we often use PointerEvents with callbacks or check commands.
    // Here we check the input command for the specific entity.

    const cmd = inputSystem.getInputCommand(InputAction.IA_POINTER, PointerEventType.PET_DOWN, entity)
    if (cmd) {
      // Block station interactions when visiting someone
      if (STATION_INTERACTIONS.includes(interactable.type) && !canInteractWithStations()) {
        console.log(`Interaction blocked while visiting: ${interactable.type}`)
        continue
      }

      // Add InteractionEvent to the entity
      // This event will be consumed by the LogicSystem
      if (!InteractionEvent.getOrNull(entity)) {
        InteractionEvent.create(entity, {
          type: interactable.type,
          source: engine.PlayerEntity
        })
        console.log(`Input detected: ${interactable.type} on entity ${entity}`)
      }
    }
  }

  // Check for F key press to unfocus camera when in Focus Mode
  if (inputSystem.isTriggered(InputAction.IA_SECONDARY, PointerEventType.PET_DOWN)) {
    // Check if any camera is currently focused
    for (const [entity, focusComponent] of engine.getEntitiesWith(CameraFocusComponent)) {
      if (focusComponent.isCameraFocused) {
        console.log('F key pressed - unfocusing camera')
        deactivatePetCamera()
        break
      }
    }
  }
}
