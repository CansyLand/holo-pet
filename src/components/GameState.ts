import { Schemas, engine } from '@dcl/sdk/ecs'

export enum GamePhase {
  EGG = 'egg',
  HATCHING = 'hatching',
  PET = 'pet'
}

export const GameState = engine.defineComponent('GameState', {
  phase: Schemas.EnumString<GamePhase>(GamePhase, GamePhase.EGG),
  activePetEntity: Schemas.Entity,
  menuStateEntity: Schemas.Optional(Schemas.Entity)
})
