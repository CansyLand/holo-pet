import { engine, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { PlaylistPlayer, PlaylistPlayerSettings } from './playlistPlayer'
import { playlist } from './playlist'

export function createHeadlessPlayer() {
  // Create jukebox entity
  const jukebox = engine.addEntity()

  Transform.create(jukebox, {
    position: Vector3.create(3, 1, 3)
  })

  // Define the jukebox settings
  const settings: PlaylistPlayerSettings = {
    playlist: playlist,
    autoplay: true, // defines wheter next track is played automaticaly
    isPlaying: true, // defines if music is autoplaying on scene start
    global: true, // whether the audio plays at constant volume across the scene.
    volume: 0.2, // a number between 0 - 1
    currentTrackIndex: Math.floor(Math.random() * playlist.length), // random starting track
    loopPlaylist: true,
    loopTrack: false,
    shufflePlaylist: true,
    synced: false
  }

  // Create and return the playlist player attached to the jukebox entity
  const headlessPlaylistPlayer = new PlaylistPlayer(settings, jukebox)
  console.log('Jukebox playlist player initialized with', playlist.length, 'tracks')

  return headlessPlaylistPlayer
}
