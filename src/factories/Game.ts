import { engine } from '@dcl/sdk/ecs'
import { GameState, GamePhase } from '../components/GameState'

export function createGameEntity() {
  const entity = engine.addEntity()
  GameState.create(entity, {
    phase: GamePhase.EGG,
    activePetEntity: undefined // Will be set when hatched
  })
  return entity
}



