import { engine, inputSystem, InputAction, PointerEventType, Entity } from '@dcl/sdk/ecs'
import { Interactable, InteractionEvent, InteractionType } from '../components/Interaction'

export function inputSystemCallback(dt: number) {
  // Iterate over all interactable entities
  for (const [entity, interactable] of engine.getEntitiesWith(Interactable)) {
    // Check if this entity was clicked
    // Note: In SDK7, for simple clicks we often use PointerEvents with callbacks or check commands.
    // Here we check the input command for the specific entity.

    const cmd = inputSystem.getInputCommand(InputAction.IA_POINTER, PointerEventType.PET_DOWN, entity)
    if (cmd) {
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
}
