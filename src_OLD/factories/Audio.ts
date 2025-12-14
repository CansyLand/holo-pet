import { engine, AudioSource, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { BackgroundMusicComponent } from '../components/Audio'

/**
 * Creates a background music entity that plays on loop
 * Following the Crystal Architecture: Factory pattern for entity creation
 *
 * Note: AudioSource requires a Transform component for 3D positioning.
 * Positioned at origin (0,0,0) for global ambient audio.
 */
export function createBackgroundMusic() {
  const musicEntity = engine.addEntity()

  // Create Transform component (required for AudioSource)
  Transform.create(musicEntity, {
    position: Vector3.create(0, 0, 0)
  })

  // Create AudioSource component with looping enabled
  // Note: Path is relative to assets folder (Decentraland SDK 7 convention)
  AudioSource.create(musicEntity, {
    audioClipUrl: 'assets/music/A Jazzy Christmas Eve.ogg',
    playing: true,
    loop: true,
    volume: 1,
    global: true
  })

  // Track the music entity with our component
  BackgroundMusicComponent.create(musicEntity, {
    musicEntity: musicEntity
  })

  console.log('Background music initialized:', musicEntity, 'at position (0,0,0)')
  return musicEntity
}
