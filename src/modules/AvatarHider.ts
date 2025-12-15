import { engine, Transform, AvatarModifierArea, AvatarModifierType, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { getPlayer } from '@dcl/sdk/src/players'
import { game } from '../Game'
import { GameModule } from '../Game'
import { waitForPlayerData } from '../utils/playerUtils'

export class AvatarHiderModule implements GameModule {
  name = 'AvatarHider'
  avatarModifierEntity: Entity | null = null

  init() {
    console.log('👥 Avatar hider module initialized')
    this.createAvatarHider()
  }

  update(dt: number) {
    // Update visibility if needed
  }

  private createAvatarHider() {
    console.log('👥 Creating avatar modifier area')

    // Create the hiding area entity
    const entity = engine.addEntity()

    // Position at scene center
    Transform.create(entity, {
      position: Vector3.create(16, 8, 16),
      rotation: Quaternion.Identity(),
      scale: Vector3.create(1, 1, 1)
    })

    // Create avatar modifier with full scene coverage
    AvatarModifierArea.create(entity, {
      area: Vector3.create(16, 16, 16),
      modifiers: [AvatarModifierType.AMT_HIDE_AVATARS],
      excludeIds: [] // Start empty, will include local player when available
    })

    this.avatarModifierEntity = entity
    console.log('👥 Avatar modifier area created')

    // Wait for player data, then make player visible
    waitForPlayerData((userId) => {
      this.makePlayerVisible(userId)
    })
  }

  // Make player visible by userId
  makePlayerVisible(userId: string) {
    if (!this.avatarModifierEntity) {
      console.log('👥 Avatar modifier not ready')
      return
    }

    const modifier = AvatarModifierArea.getMutable(this.avatarModifierEntity)
    const currentExcludes = new Set(modifier.excludeIds)

    if (!currentExcludes.has(userId)) {
      currentExcludes.add(userId)
      modifier.excludeIds = Array.from(currentExcludes)
      console.log(`👥 Player visible: ${userId}`)
    }
  }

  // Update visible players list
  updateVisiblePlayers(playerIds: string[]) {
    if (!this.avatarModifierEntity) {
      console.error('👥 Avatar modifier not initialized')
      return
    }

    const modifier = AvatarModifierArea.getMutable(this.avatarModifierEntity)
    const currentExcludes = new Set(modifier.excludeIds)

    // Add requested players
    playerIds.forEach((id) => currentExcludes.add(id))

    const excludeList = Array.from(currentExcludes)
    modifier.excludeIds = excludeList

    console.log(`👥 Updated visible players (${excludeList.length}):`, excludeList)
  }

  // Reset to solo mode
  resetToSoloMode() {
    this.updateVisiblePlayers([])
    console.log('👥 Reset to solo mode')
  }

  // Get entity for debugging
  getEntity(): Entity | null {
    return this.avatarModifierEntity
  }

  cleanup() {
    console.log('👥 Avatar hider module cleanup')
  }
}
