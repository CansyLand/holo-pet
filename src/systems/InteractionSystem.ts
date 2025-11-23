import { engine, InputAction, PointerEventType, inputSystem, PointerEvents, Transform, Mesh, Material, Billboard, BillboardMode } from '@dcl/sdk/ecs'
import { GameManager, GameState, PetType } from '../systems/GameManager'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { spawnPetMenu } from '../components/PetMenu'

export function interactionSystem(dt: number) {
  const gameManager = GameManager.getInstance()
  
  // 1. Handle Egg Click
  if (gameManager.currentState === GameState.EGG && gameManager.eggEntity) {
    const cmd = inputSystem.getInputCommand(InputAction.IA_POINTER, PointerEventType.PET_DOWN)
    if (cmd && cmd.hits) {
      for (const hit of cmd.hits) {
        if (hit.entityId === gameManager.eggEntity) {
          hatchEgg()
        }
      }
    }
  }
  
  // 2. Handle Pet Click (Focus Mode)
  if (gameManager.currentState === GameState.PET && gameManager.petEntity && !gameManager.isFocusMode) {
     const cmd = inputSystem.getInputCommand(InputAction.IA_POINTER, PointerEventType.PET_DOWN)
     if (cmd && cmd.hits) {
      for (const hit of cmd.hits) {
        if (hit.entityId === gameManager.petEntity) {
          enterFocusMode()
        }
      }
    }
  }

  // 3. Handle Menu Interaction (Pet Button)
  // Note: PointerEvents on entities handle the click detection automatically for specific entities
  // But we need to detect the click event result to trigger logic
  if (gameManager.isFocusMode) {
     const cmd = inputSystem.getInputCommand(InputAction.IA_POINTER, PointerEventType.PET_DOWN)
     if (cmd && cmd.hits) {
       for (const hit of cmd.hits) {
         // check if hit entity is one of our menu buttons
         // Simplification: we just check if it has a pointer event and we know which one is active
         // In a real ECS, we'd query components. Here we just iterate our known active button.
         // But wait, the button has a PointerEvent component, so we can just attach a callback?
         // SDK7 recommended way is often systems polling or callbacks. 
         // Let's stick to checking if the hit entity is the "Pet" button.
         // We need to know which entity is the "Pet" button. 
         // Best way: Add a custom component or check ID against stored ID.
         
         // For MVP: We'll just check against the first entity in menuEntities (which we know is Pet button)
         if (gameManager.menuEntities.length > 0 && hit.entityId === gameManager.menuEntities[0]) {
           petTheAnimal()
         }
       }
     }
     
     // 4. Exit Focus Mode on movement
     // We can check if player position changes significantly
     const playerPos = Transform.get(engine.PlayerEntity).position
     // Simple check: if player moves more than 0.1m from where they started focus? 
     // Or just any movement input.
     if (inputSystem.isTriggered(InputAction.IA_FORWARD, PointerEventType.PET_DOWN) ||
         inputSystem.isTriggered(InputAction.IA_BACKWARD, PointerEventType.PET_DOWN) ||
         inputSystem.isTriggered(InputAction.IA_LEFT, PointerEventType.PET_DOWN) ||
         inputSystem.isTriggered(InputAction.IA_RIGHT, PointerEventType.PET_DOWN)) {
           exitFocusMode()
     }
  }
}

function hatchEgg() {
  const gameManager = GameManager.getInstance()
  
  // Remove egg
  if (gameManager.eggEntity) {
    engine.removeEntity(gameManager.eggEntity)
    gameManager.eggEntity = null
  }
  
  // Determine Pet Type
  const isDog = Math.random() > 0.5
  gameManager.petType = isDog ? PetType.DOG : PetType.CAT
  
  // Spawn pet
  gameManager.currentState = GameState.PET
  gameManager.petEntity = engine.addEntity()
  
  Transform.create(gameManager.petEntity, {
    position: Vector3.create(8, 1, 8),
    scale: Vector3.create(0.8, 0.8, 0.8)
  })
  
  Mesh.setBox(gameManager.petEntity)
  
  const color = isDog ? Color4.Green() : Color4.Purple()
  Material.setPbrMaterial(gameManager.petEntity, {
    albedoColor: color
  })
  
  // Add click interaction to Pet
  PointerEvents.create(gameManager.petEntity, {
      pointerEvents: [
        {
          eventType: PointerEventType.PET_DOWN,
          eventInfo: {
            button: InputAction.IA_POINTER,
            hoverText: 'Interact'
          }
        }
      ]
  })
  
  console.log(`Pet spawned! It's a ${gameManager.petType}`)
}

function enterFocusMode() {
  const gameManager = GameManager.getInstance()
  if (gameManager.isFocusMode) return
  
  gameManager.setFocusMode(true)
  spawnPetMenu()
}

function exitFocusMode() {
  const gameManager = GameManager.getInstance()
  if (!gameManager.isFocusMode) return
  
  gameManager.setFocusMode(false)
}

function petTheAnimal() {
  const gameManager = GameManager.getInstance()
  // Increase mood
  gameManager.mood = Math.min(100, gameManager.mood + 10)
  console.log("Petting! Mood:", gameManager.mood)
  
  // Visual feedback (jump)
  if (gameManager.petEntity) {
    const transform = Transform.getMutable(gameManager.petEntity)
    const startY = 1
    transform.position.y = startY + 0.5
    
    // Simple one-frame jump reset (in a real game use Tween)
    // For this MVP system, let's just log it. Animation would need a separate system/component.
  }
}
