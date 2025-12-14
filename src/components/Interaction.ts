import { Schemas, engine } from '@dcl/sdk/ecs'

export enum InteractionType {
  // Existing interactions
  PET = 'pet',
  FEED = 'feed',
  PLAY = 'play',
  HATCH = 'hatch',
  CLOSE_MENU = 'close_menu',
  BATHE = 'bathe',
  BRUSH = 'brush',
  GIVE_TREAT = 'give_treat',
  COLLECT_POOP = 'collect_poop',
  NAME_PET = 'name_pet',
  SLEEP = 'sleep' // Put pet to bed
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
