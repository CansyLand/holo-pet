import { Schemas, engine } from '@dcl/sdk/ecs'

export const MoodBarComponent = engine.defineComponent('MoodBarComponent', {
  targetPet: Schemas.Entity // Optional: link to specific pet if multiple
})

export const MenuStateComponent = engine.defineComponent('MenuStateComponent', {
  isVisible: Schemas.Boolean,
  petEntity: Schemas.Entity,
  menuRootEntity: Schemas.Entity,
  virtualCameraEntity: Schemas.Optional(Schemas.Entity)
})

export const MenuElementComponent = engine.defineComponent('MenuElementComponent', {
  menuStateEntity: Schemas.Entity // Reference to the menu state this element belongs to
})
