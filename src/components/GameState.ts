import { Schemas, engine } from '@dcl/sdk/ecs'

export enum GamePhase {
  EGG = 'egg',
  HATCHING = 'hatching', // is this needed?
  PET = 'pet'
}

export enum Theme {
  DEFAULT = 'default',
  THEME_1 = 'theme_1',
  THEME_2 = 'theme_2'
}

export const GameStateComponent = engine.defineComponent('GameStateComponent', {
  phase: Schemas.EnumString<GamePhase>(GamePhase, GamePhase.EGG),
  activePetEntity: Schemas.Optional(Schemas.Entity),
  menuStateEntity: Schemas.Optional(Schemas.Entity),
  theme: Schemas.EnumString<Theme>(Theme, Theme.DEFAULT)
})
