import { Schemas, engine } from '@dcl/sdk/ecs'

export enum GamePhase {
  EGG = 'egg',
  HATCHING = 'hatching',
  PET = 'pet'
}

export enum Theme {
  DEFAULT = 'default',
  CHRISTMAS = 'christmas',
  NEW_YEAR = 'new_year',
  SUMMER = 'summer',
  AUTUMN = 'autumn'
}

export const GameState = engine.defineComponent('GameState', {
  phase: Schemas.EnumString<GamePhase>(GamePhase, GamePhase.EGG),
  activePetEntity: Schemas.Entity,
  menuStateEntity: Schemas.Optional(Schemas.Entity),
  theme: Schemas.EnumString<Theme>(Theme, Theme.DEFAULT)
})
