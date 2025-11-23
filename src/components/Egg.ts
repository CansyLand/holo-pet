import { engine, PointerEvents, InputAction, PointerEventType, Transform, Mesh, Material } from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { GameManager, GameState } from './GameManager'

export function createEgg() {
  const gameManager = GameManager.getInstance()
  gameManager.spawnEgg()
  
  if (gameManager.eggEntity) {
    PointerEvents.create(gameManager.eggEntity, {
      pointerEvents: [
        {
          eventType: PointerEventType.PET_DOWN,
          eventInfo: {
            button: InputAction.IA_POINTER,
            hoverText: 'Hatch Egg'
          }
        }
      ]
    })
  }
}

