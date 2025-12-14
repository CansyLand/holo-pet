import { Schemas, engine } from '@dcl/sdk/ecs'

export enum SceneType {
  EGG = 'egg',
  PET = 'pet'
}

export const SceneElement = engine.defineComponent('SceneElement', {
  sceneType: Schemas.EnumString<SceneType>(SceneType, SceneType.EGG)
})
