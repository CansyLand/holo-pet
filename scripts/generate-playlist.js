const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function getAudioDuration(filePath) {
  try {
    // Use ffprobe to get duration (requires ffmpeg installed)
    const output = execSync(`ffprobe -v quiet -print_format json -show_format "${filePath}"`, { encoding: 'utf8' })
    const data = JSON.parse(output)
    return Math.round(parseFloat(data.format.duration))
  } catch (error) {
    console.warn(`Could not get duration for ${filePath}:`, error.message)
    return null
  }
}

function findAudioFiles(dir, files = []) {
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // Skip known documentation files, allow all other directories
      if (!item.endsWith('.rtf') && !item.endsWith('.webloc')) {
        findAudioFiles(fullPath, files)
      }
    } else if (item.endsWith('.ogg') || item.endsWith('.mp3') || item.endsWith('.wav')) {
      files.push(fullPath)
    }
  }

  return files
}

function generatePlaylist() {
  const musicDir = path.join(__dirname, '..', 'assets', 'music')
  const audioFiles = findAudioFiles(musicDir)

  console.log(`Found ${audioFiles.length} audio files in ${musicDir}`)

  const tracks = audioFiles.map((filePath) => {
    const relativePath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/')
    const duration = getAudioDuration(filePath)

    console.log(`Processing: ${relativePath} (${duration ? duration + 's' : 'duration unknown'})`)

    return {
      filename: relativePath,
      duration: duration || 0
    }
  })

  // Sort tracks by filename for consistent ordering
  tracks.sort((a, b) => a.filename.localeCompare(b.filename))

  const playlistContent = `import { Playlist } from './playlistPlayer'

export const playlist: Playlist = [
${tracks
  .map(
    (track) => `  {
    filename: '${track.filename}',
    duration: ${track.duration}
  }`
  )
  .join(',\n')}
]
`

  const outputPath = path.join(__dirname, '..', 'src', 'playlistPlayer', 'playlist.ts')
  fs.writeFileSync(outputPath, playlistContent, 'utf8')

  console.log(`✅ Generated playlist with ${tracks.length} tracks at ${outputPath}`)
}

if (require.main === module) {
  generatePlaylist()
}

module.exports = { generatePlaylist, findAudioFiles, getAudioDuration }






