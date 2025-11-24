import { engine, Transform, GltfContainer, MeshCollider, ColliderLayer } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

export function createEnvironment() {
  // Computer 01 - positioned on the left side
  const computer1 = engine.addEntity()
  Transform.create(computer1, {
    position: Vector3.create(4, 0, 6),
    scale: Vector3.create(1, 1, 1)
  })
  GltfContainer.create(computer1, {
    src: 'assets/models/Computer_01.glb'
  })
  MeshCollider.setBox(computer1, ColliderLayer.CL_PHYSICS)

  // Computer 02 - positioned on the right side
  const computer2 = engine.addEntity()
  Transform.create(computer2, {
    position: Vector3.create(12, 0, 6),
    scale: Vector3.create(1, 1, 1)
  })
  GltfContainer.create(computer2, {
    src: 'assets/models/Computer_02.glb'
  })
  MeshCollider.setBox(computer2, ColliderLayer.CL_PHYSICS)

  // Digital Table - positioned in the center
  const digitalTable = engine.addEntity()
  Transform.create(digitalTable, {
    position: Vector3.create(8, 0, 8),
    scale: Vector3.create(1, 1, 1)
  })
  GltfContainer.create(digitalTable, {
    src: 'assets/models/DigitalTable_01.glb'
  })
  MeshCollider.setBox(digitalTable, ColliderLayer.CL_PHYSICS)

  return { computer1, computer2, digitalTable }
}
