import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { UiEntity, Label, Button } from '@dcl/sdk/react-ecs'
import { fetchLeaderboard, LeaderboardEntry, LeaderboardResponse } from '../persistence/api'

// =============================================================================
// LEADERBOARD UI
// Displays top 10 players + your rank
// Shows composite score based on bond, visit streak, and pet age
// =============================================================================

// UI Colors (matching VisitUI style)
const BG_COLOR = Color4.create(0.1, 0.1, 0.15, 0.9)
const BUTTON_BG = Color4.create(0.25, 0.25, 0.3, 0.95)
const BUTTON_HOVER_BG = Color4.create(0.35, 0.35, 0.4, 0.95)
const PRIMARY_COLOR = Color4.create(0.2, 0.6, 0.9, 1)
const TEXT_COLOR = Color4.White()
const SECONDARY_TEXT_COLOR = Color4.create(0.7, 0.7, 0.7, 1)
const GOLD_COLOR = Color4.create(1, 0.84, 0, 1)
const SILVER_COLOR = Color4.create(0.75, 0.75, 0.75, 1)
const BRONZE_COLOR = Color4.create(0.8, 0.5, 0.2, 1)

// State
let isPopupOpen = false
let leaderboardData: LeaderboardResponse | null = null
let isLoading = false

/**
 * Open the leaderboard popup and fetch data
 */
async function openPopup() {
  isPopupOpen = true
  isLoading = true
  console.log('Leaderboard popup opened, fetching data...')

  leaderboardData = await fetchLeaderboard()
  isLoading = false

  if (leaderboardData) {
    console.log('Leaderboard loaded:', leaderboardData.top10.length, 'entries')
  } else {
    console.error('Failed to load leaderboard')
  }
}

/**
 * Close the leaderboard popup
 */
function closePopup() {
  isPopupOpen = false
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

/**
 * Main Leaderboard UI - Button at bottom-left (next to Visit Players)
 */
export function LeaderboardUI() {
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        positionType: 'absolute'
      }}
    >
      {/* Leaderboard Button - bottom center, above visit buttons */}
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: 55 },
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Button
          value="Leaderboard"
          variant="primary"
          fontSize={14}
          uiTransform={{
            width: 140,
            height: 35
          }}
          onMouseDown={openPopup}
        />
      </UiEntity>

      {/* Leaderboard Popup */}
      {isPopupOpen && <LeaderboardPopup />}
    </UiEntity>
  )
}

/**
 * Leaderboard Popup Component
 */
function LeaderboardPopup() {
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        positionType: 'absolute'
      }}
    >
      {/* Dark overlay */}
      <UiEntity
        uiTransform={{
          width: '100%',
          height: '100%',
          positionType: 'absolute'
        }}
        uiBackground={{ color: Color4.create(0, 0, 0, 0.7) }}
        onMouseDown={closePopup}
      />

      {/* Popup container */}
      <UiEntity
        uiTransform={{
          width: 500,
          height: 550,
          flexDirection: 'column',
          padding: 20
        }}
        uiBackground={{ color: BG_COLOR }}
      >
        {/* Header */}
        <UiEntity
          uiTransform={{
            width: '100%',
            height: 40,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: { bottom: 10 }
          }}
        >
          <Label value="Leaderboard" fontSize={22} color={PRIMARY_COLOR} />
          <Button
            value="✕"
            variant="secondary"
            fontSize={18}
            uiTransform={{ width: 30, height: 30 }}
            onMouseDown={closePopup}
          />
        </UiEntity>

        {/* Loading state */}
        {isLoading && (
          <Label
            value="Loading leaderboard..."
            fontSize={14}
            color={SECONDARY_TEXT_COLOR}
            uiTransform={{ width: '100%', height: 30, margin: { top: 20 } }}
          />
        )}

        {/* Error state */}
        {!isLoading && !leaderboardData && (
          <Label
            value="Failed to load leaderboard. Try again later."
            fontSize={14}
            color={Color4.create(1, 0.3, 0.3, 1)}
            uiTransform={{ width: '100%', height: 30, margin: { top: 20 } }}
          />
        )}

        {/* Leaderboard content */}
        {!isLoading && leaderboardData && (
          <UiEntity
            uiTransform={{
              width: '100%',
              flexDirection: 'column'
            }}
          >
            {/* Column headers */}
            <UiEntity
              uiTransform={{
                width: '100%',
                height: 30,
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: { left: 8, right: 8 },
                margin: { bottom: 5 }
              }}
              uiBackground={{ color: Color4.create(0.15, 0.15, 0.2, 0.8) }}
            >
              <Label value="#" fontSize={12} color={SECONDARY_TEXT_COLOR} uiTransform={{ width: 30 }} />
              <Label value="Player" fontSize={12} color={SECONDARY_TEXT_COLOR} uiTransform={{ width: 120 }} />
              <Label value="Pet" fontSize={12} color={SECONDARY_TEXT_COLOR} uiTransform={{ width: 120 }} />
              <Label value="Score" fontSize={12} color={SECONDARY_TEXT_COLOR} uiTransform={{ width: 70 }} />
            </UiEntity>

            {/* Top 10 list */}
            <UiEntity
              uiTransform={{
                width: '100%',
                height: 360,
                flexDirection: 'column',
                overflow: 'scroll'
              }}
            >
              {leaderboardData.top10.length === 0 ? (
                <Label
                  value="No leaderboard entries yet. Be the first!"
                  fontSize={14}
                  color={SECONDARY_TEXT_COLOR}
                  uiTransform={{ width: '100%', height: 30, margin: { top: 20 } }}
                />
              ) : (
                leaderboardData.top10.map((entry, index) => <LeaderboardRow entry={entry} />)
              )}
            </UiEntity>

            {/* Player rank section */}
            {leaderboardData.playerRank && (
              <UiEntity
                uiTransform={{
                  width: '100%',
                  flexDirection: 'column'
                }}
              >
                {/* Separator */}
                <UiEntity
                  uiTransform={{
                    width: '100%',
                    height: 2,
                    margin: { top: 10, bottom: 10 }
                  }}
                  uiBackground={{ color: PRIMARY_COLOR }}
                />

                {/* Your rank */}
                <UiEntity
                  uiTransform={{
                    width: '100%',
                    height: 50,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 8
                  }}
                  uiBackground={{ color: Color4.create(0.2, 0.25, 0.35, 0.95) }}
                >
                  <Label
                    value={`Your Rank: #${leaderboardData.playerRank.rank}`}
                    fontSize={14}
                    color={PRIMARY_COLOR}
                    uiTransform={{ width: '100%' }}
                  />
                  <Label
                    value={`${leaderboardData.playerRank.ownerName} • ${leaderboardData.playerRank.petName} • ${leaderboardData.playerRank.score} pts`}
                    fontSize={12}
                    color={TEXT_COLOR}
                    uiTransform={{ width: '100%' }}
                  />
                </UiEntity>

                {/* Score legend */}
                <UiEntity
                  uiTransform={{
                    width: '100%',
                    height: 40,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    margin: { top: 10 }
                  }}
                >
                  <Label
                    value="Score = (Bond × 10) + (Visit Streak × 50) + (Pet Age Days × 5)"
                    fontSize={10}
                    color={SECONDARY_TEXT_COLOR}
                    uiTransform={{ width: '100%' }}
                  />
                </UiEntity>
              </UiEntity>
            )}
          </UiEntity>
        )}
      </UiEntity>
    </UiEntity>
  )
}

/**
 * Individual Leaderboard Row Component
 */
function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  // Get rank color for top 3
  let rankColor = TEXT_COLOR
  if (entry.rank === 1) rankColor = GOLD_COLOR
  else if (entry.rank === 2) rankColor = SILVER_COLOR
  else if (entry.rank === 3) rankColor = BRONZE_COLOR

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 8,
        margin: { bottom: 4 }
      }}
      uiBackground={{ color: BUTTON_BG }}
    >
      {/* Rank */}
      <Label value={`#${entry.rank}`} fontSize={14} color={rankColor} uiTransform={{ width: 30 }} />

      {/* Player name */}
      <Label value={entry.ownerName} fontSize={13} color={TEXT_COLOR} uiTransform={{ width: 120 }} />

      {/* Pet name */}
      <Label value={entry.petName} fontSize={12} color={SECONDARY_TEXT_COLOR} uiTransform={{ width: 120 }} />

      {/* Score */}
      <Label value={`${entry.score}`} fontSize={13} color={PRIMARY_COLOR} uiTransform={{ width: 70 }} />
    </UiEntity>
  )
}


