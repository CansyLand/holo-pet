import { engine } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { UiEntity, Label, Button } from '@dcl/sdk/react-ecs'
import { VisitStateComponent } from '../components/Multiplayer'
import { getOnlinePlayers, getPlayerName, OnlinePlayer } from '../utils/players'
import { visitPlayer, goHome, getVisitStateEntity } from '../systems/Visit'

// =============================================================================
// VISIT UI
// UI for visiting other players and their pets
// Shows "Visit Players" button and player list popup
// =============================================================================

// UI Colors
const BG_COLOR = Color4.create(0.1, 0.1, 0.15, 0.9)
const BUTTON_BG = Color4.create(0.25, 0.25, 0.3, 0.95)
const BUTTON_HOVER_BG = Color4.create(0.35, 0.35, 0.4, 0.95)
const PRIMARY_COLOR = Color4.create(0.2, 0.6, 0.9, 1)
const TEXT_COLOR = Color4.White()
const SECONDARY_TEXT_COLOR = Color4.create(0.7, 0.7, 0.7, 1)

// State
let isPopupOpen = false
let onlinePlayers: OnlinePlayer[] = []

/**
 * Open the player list popup
 */
function openPopup() {
  // Refresh player list
  onlinePlayers = getOnlinePlayers()
  isPopupOpen = true
  console.log('Visit popup opened with', onlinePlayers.length, 'players')
}

/**
 * Close the player list popup
 */
function closePopup() {
  isPopupOpen = false
}

/**
 * Handle clicking "Visit" on a player
 */
function handleVisit(userId: string, playerName: string) {
  console.log(`Visiting player ${playerName} (${userId})`)
  visitPlayer(userId)
  closePopup()
}

/**
 * Handle clicking "Go Home"
 */
function handleGoHome() {
  console.log('Going home (returning to solo mode)')
  goHome()
}

/**
 * Get current visit state
 */
function getVisitState(): { isVisiting: boolean; hostUserId: string } {
  const visitEntity = getVisitStateEntity()
  if (!visitEntity) {
    return { isVisiting: false, hostUserId: '' }
  }

  const state = VisitStateComponent.getOrNull(visitEntity)
  if (!state) {
    return { isVisiting: false, hostUserId: '' }
  }

  return {
    isVisiting: state.isVisiting,
    hostUserId: state.hostUserId
  }
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

/**
 * Main Visit UI - Always visible buttons
 */
export function VisitUI() {
  const visitState = getVisitState()

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        positionType: 'absolute'
      }}
    >
      {/* Bottom-center control buttons */}
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: 10 },
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {/* Visit Players Button - always visible */}
        <Button
          value="Visit Players"
          variant="primary"
          fontSize={14}
          uiTransform={{
            width: 120,
            height: 35,
            margin: { right: 8 }
          }}
          onMouseDown={openPopup}
        />

        {/* Go Home Button - only visible when visiting */}
        {visitState.isVisiting && (
          <Button
            value="Go Home"
            variant="secondary"
            fontSize={14}
            uiTransform={{
              width: 100,
              height: 35,
              margin: { right: 8 }
            }}
            onMouseDown={handleGoHome}
          />
        )}
      </UiEntity>

      {/* Status label - show who we're visiting (above buttons) */}
      {visitState.isVisiting && (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            position: { bottom: 50 },
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'center'
          }}
        >
          <Label
            value={`Visiting: ${getPlayerName(visitState.hostUserId) || 'Unknown'}`}
            fontSize={12}
            color={SECONDARY_TEXT_COLOR}
            uiTransform={{
              width: 'auto',
              height: 35
            }}
          />
        </UiEntity>
      )}

      {/* Player List Popup */}
      {isPopupOpen && <PlayerListPopup currentHost={visitState.hostUserId} />}
    </UiEntity>
  )
}

/**
 * Player List Popup Component
 */
function PlayerListPopup({ currentHost }: { currentHost: string }) {
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
          width: 350,
          height: 400,
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
          <Label value="Online Players" fontSize={20} color={PRIMARY_COLOR} />
          <Button
            value="✕"
            variant="secondary"
            fontSize={18}
            uiTransform={{ width: 30, height: 30 }}
            onMouseDown={closePopup}
          />
        </UiEntity>

        {/* Player list */}
        <UiEntity
          uiTransform={{
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            overflow: 'scroll'
          }}
        >
          {onlinePlayers.length === 0 ? (
            <Label
              value="No other players in the scene"
              fontSize={14}
              color={SECONDARY_TEXT_COLOR}
              uiTransform={{ width: '100%', height: 30, margin: { top: 20 } }}
            />
          ) : (
            onlinePlayers.map((player, index) => (
              <PlayerRow
                player={player}
                isCurrentHost={player.userId === currentHost}
                onVisit={() => handleVisit(player.userId, player.name)}
              />
            ))
          )}
        </UiEntity>
      </UiEntity>
    </UiEntity>
  )
}

/**
 * Individual Player Row Component
 */
function PlayerRow({
  player,
  isCurrentHost,
  onVisit
}: {
  player: OnlinePlayer
  isCurrentHost: boolean
  onVisit: () => void
}) {
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
      {/* Player name */}
      <UiEntity
        uiTransform={{
          width: '60%',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <Label value={player.name} fontSize={14} color={TEXT_COLOR} uiTransform={{ width: '100%' }} />
        {isCurrentHost && (
          <Label value="(currently visiting)" fontSize={10} color={PRIMARY_COLOR} uiTransform={{ width: '100%' }} />
        )}
      </UiEntity>

      {/* Visit button */}
      {!isCurrentHost && (
        <Button
          value="Visit"
          variant="primary"
          fontSize={12}
          uiTransform={{ width: 70, height: 30 }}
          onMouseDown={onVisit}
        />
      )}
    </UiEntity>
  )
}
