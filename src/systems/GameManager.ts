import { engine, Transform, Mesh, Material, Entity, Schemas, CameraMode, CameraType } from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'

export enum GameState {
  EGG = 'egg',
  PET = 'pet'
}

export enum PetType {
  DOG = 'dog',
  CAT = 'cat'
}

export class GameManager {
  private static instance: GameManager
  public currentState: GameState = GameState.EGG

  // Entities
  public eggEntity: Entity | null = null
  public petEntity: Entity | null = null
  public petType: PetType | null = null

  // UI Entities
  public menuEntities: Entity[] = []
  public moodBarEntity: Entity | null = null
  public moodBarBgEntity: Entity | null = null

  // State
  public mood: number = 100
  public isFocusMode: boolean = false

  private constructor() {
    console.log('GameManager initialized')
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager()
    }
    return GameManager.instance
  }

  public spawnEgg() {
    if (this.eggEntity) return

    this.eggEntity = engine.addEntity()
    Transform.create(this.eggEntity, {
      position: Vector3.create(8, 1, 8),
      scale: Vector3.create(1, 1, 1)
    })
    Mesh.setSphere(this.eggEntity)
    Material.setPbrMaterial(this.eggEntity, {
      albedoColor: Color4.create(0.5, 0.8, 1, 0.8),
      metallic: 0.5,
      roughness: 0.1,
      emissiveColor: Color4.create(0.2, 0.5, 1, 1),
      emissiveIntensity: 0.5
    })

    console.log('Egg spawned')
  }

  public setFocusMode(enabled: boolean) {
    this.isFocusMode = enabled

    // Lock camera by forcing first person if possible or handling inputs
    // Note: True input locking requires AvatarModifierArea which we can set up later
    // For now, we'll just handle the UI visibility

    if (enabled) {
      console.log('Focus Mode: ON')
      // Logic to show menu is handled in PetMenu.ts via GameManager check
    } else {
      console.log('Focus Mode: OFF')
      this.clearMenu()
    }
  }

  public clearMenu() {
    // Clean up all menu entities
    for (const entity of this.menuEntities) {
      engine.removeEntity(entity)
    }
    this.menuEntities = []

    if (this.moodBarEntity) {
      engine.removeEntity(this.moodBarEntity)
      this.moodBarEntity = null
    }
    if (this.moodBarBgEntity) {
      engine.removeEntity(this.moodBarBgEntity)
      this.moodBarBgEntity = null
    }
  }
}
