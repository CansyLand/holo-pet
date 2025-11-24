import { engine, Transform } from '@dcl/sdk/ecs'
import { MenuStateComponent, MenuElementComponent, MoodBarComponent } from '../components/UIComponents'

export function menuPositionSystem(dt: number) {
  // Update positions of menu elements to follow their associated pets (only for visible menus)
  for (const [menuStateEntity, menuState] of engine.getEntitiesWith(MenuStateComponent)) {
    if (menuState.isVisible) {
      const petPos = Transform.get(menuState.petEntity).position
      const menuBasePos = [petPos.x, petPos.y + 1.5, petPos.z] // Same base position as when menu was created

      // Update all menu elements for this menu (except mood bars which are handled by render system)
      for (const [elementEntity, menuElement] of engine.getEntitiesWith(MenuElementComponent)) {
        if (menuElement.menuStateEntity === menuStateEntity && !MoodBarComponent.has(elementEntity)) {
          const elementTransform = Transform.getMutable(elementEntity)
          const currentPos = elementTransform.position

          // Calculate offset from menu base position
          const offsetX = currentPos.x - (petPos.x)
          const offsetY = currentPos.y - (petPos.y + 1.5)
          const offsetZ = currentPos.z - (petPos.z)

          // Update position to follow pet
          elementTransform.position.x = petPos.x + offsetX
          elementTransform.position.y = petPos.y + 1.5 + offsetY
          elementTransform.position.z = petPos.z + offsetZ
        }
      }
    }
  }
}
