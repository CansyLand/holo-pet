import { Schemas, engine } from '@dcl/sdk/ecs'

export enum Species {
  DOG = 'dog',
  CAT = 'cat',
  DRAGON = 'dragon'
}

export enum PetState {
  IDLE = 'idle',
  EATING = 'eating',
  SLEEPING = 'sleeping',
  SAD = 'sad'
}

export const PetComponent = engine.defineComponent('PetComponent', {
  species: Schemas.EnumString<Species>(Species, Species.DOG),
  mood: Schemas.Number, // 0-100
  hunger: Schemas.Number, // 0-100
  energy: Schemas.Number, // 0-100 - reduces with play, pet sits when low
  state: Schemas.EnumString<PetState>(PetState, PetState.IDLE)
})
