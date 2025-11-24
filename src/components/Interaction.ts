import { Schemas, engine } from '@dcl/sdk/ecs'

export enum InteractionType {
  PET = 'pet',
  FEED = 'feed',
  PLAY = 'play',
  CLEAN = 'clean',
  HATCH = 'hatch',
  CLOSE_MENU = 'close_menu'
}

// Tag for entities that can be interacted with
export const Interactable = engine.defineComponent('Interactable', {
  type: Schemas.EnumString<InteractionType>(InteractionType, InteractionType.PET)
})

// Transient event component added when interaction happens
export const InteractionEvent = engine.defineComponent('InteractionEvent', {
  type: Schemas.EnumString<InteractionType>(InteractionType, InteractionType.PET),
  source: Schemas.Entity // Who triggered it (optional, usually player)
})
