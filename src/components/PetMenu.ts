import {
  engine,
  Transform,
  Mesh,
  Material,
  PointerEvents,
  PointerEventType,
  InputAction,
  Billboard,
  BillboardMode,
  Entity
} from '@dcl/sdk/ecs'
import { Vector3, Color4, Quaternion } from '@dcl/sdk/math'
import { GameManager } from '../systems/GameManager'

export function spawnPetMenu() {
  const gameManager = GameManager.getInstance()
  if (!gameManager.petEntity) return

  const petPos = Transform.get(gameManager.petEntity).position

  // 1. Create Menu Container (Billboard to face player)
  // Positioned slightly above the pet
  const menuCenter = Vector3.add(petPos, Vector3.create(0, 1.5, 0))

  // --- Create Buttons ---

  // Button 1: Pet (Yellow - Active)
  const btnPet = createButton(Vector3.add(menuCenter, Vector3.create(-0.6, 0, 0)), Color4.Yellow(), 'Pet Me!', true)

  // Button 2: Feed (Gray)
  const btnFeed = createButton(
    Vector3.add(menuCenter, Vector3.create(-0.2, 0, 0)),
    Color4.Gray(),
    'Feed (Locked)',
    false
  )

  // Button 3: Play (Gray)
  const btnPlay = createButton(
    Vector3.add(menuCenter, Vector3.create(0.2, 0, 0)),
    Color4.Gray(),
    'Play (Locked)',
    false
  )

  // Button 4: Clean (Gray)
  const btnClean = createButton(
    Vector3.add(menuCenter, Vector3.create(0.6, 0, 0)),
    Color4.Gray(),
    'Clean (Locked)',
    false
  )

  gameManager.menuEntities.push(btnPet, btnFeed, btnPlay, btnClean)

  // --- Create Mood Bar ---

  const barPos = Vector3.add(menuCenter, Vector3.create(0, 0.4, 0))

  // Background Bar (Gray)
  const bgBar = engine.addEntity()
  Transform.create(bgBar, {
    position: barPos,
    scale: Vector3.create(1.5, 0.15, 0.05)
  })
  Mesh.setBox(bgBar)
  Material.setPbrMaterial(bgBar, { albedoColor: Color4.Gray() })
  Billboard.create(bgBar, { billboardMode: BillboardMode.BM_Y })

  // Foreground Bar (Green)
  const fgBar = engine.addEntity()
  // Parent it to a container or handle positioning manually in system
  // Here we position relative to world but will update in system
  Transform.create(fgBar, {
    position: Vector3.add(barPos, Vector3.create(0, 0, -0.01)), // Slightly in front
    scale: Vector3.create(1.5, 0.15, 0.05)
  })
  Mesh.setBox(fgBar)
  Material.setPbrMaterial(fgBar, { albedoColor: Color4.Green(), emissiveColor: Color4.Green(), emissiveIntensity: 0.5 })
  Billboard.create(fgBar, { billboardMode: BillboardMode.BM_Y }) // Billboard to match bg

  gameManager.moodBarBgEntity = bgBar
  gameManager.moodBarEntity = fgBar
}

function createButton(pos: Vector3, color: Color4, hoverText: string, active: boolean): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, {
    position: pos,
    scale: Vector3.create(0.3, 0.3, 0.1)
  })
  Mesh.setBox(entity)
  Material.setPbrMaterial(entity, { albedoColor: color })
  Billboard.create(entity, { billboardMode: BillboardMode.BM_Y })

  if (active) {
    PointerEvents.create(entity, {
      pointerEvents: [
        {
          eventType: PointerEventType.PET_DOWN,
          eventInfo: {
            button: InputAction.IA_POINTER,
            hoverText: hoverText
          }
        }
      ]
    })
  }

  return entity
}

export function updateMoodBarSystem(dt: number) {
  const gameManager = GameManager.getInstance()
  if (gameManager.moodBarEntity) {
    const transform = Transform.getMutable(gameManager.moodBarEntity)
    // Scale X represents percentage (0 to 1)
    // Original scale is 1, so we just multiply by percentage
    const percentage = gameManager.mood / 100
    transform.scale.x = percentage * 1.5 // Original scale was 1.5

    // Optional: Shift position to keep left-aligned if scaling from center
    // Assuming bar width 1.5 centered at 0.
    // Center X = 0. Left edge = -0.75.
    // New center = Left edge + (New Width / 2)
    // New center = -0.75 + ((1.5 * percentage) / 2)
    transform.position.x = -0.75 + (1.5 * percentage) / 2

    // Important: Billboard keeps rotation correct, but position logic assumes local space relative to billboard rotation
    // Since the bar is a Billboard itself (BM_Y), it always faces player.
    // However, scaling and repositioning works in local space.
    // NOTE: SDK7 Billboards rotate the entity. Moving X moves it along the camera plane.
    // This should work fine visually.
  }
}
