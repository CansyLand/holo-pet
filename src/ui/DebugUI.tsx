// EPIC: Game Flow Stories - Debug and Development Tools
// DebugUI with all the buttons to change game and pet states.
// Essential for development and testing all game mechanics.

import ReactEcs, { UiEntity, Label, Button } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { game, GamePhase } from '../Game'

// Colors for UI
const HEADER_COLOR = Color4.White()
const BUTTON_COLOR = Color4.create(0.2, 0.6, 1, 1)
const SECONDARY_COLOR = Color4.create(0.8, 0.8, 0.8, 1)
const BACKGROUND_COLOR = Color4.create(0, 0, 0, 0.8)

export function DebugUI() {
  return (
    <UiEntity
      uiTransform={{
        position: { top: '10px', right: '10px' },
        positionType: 'absolute',
        width: 300,
        height: 500
      }}
      uiBackground={{
        color: BACKGROUND_COLOR
      }}
    >
      {/* Header */}
      <UiEntity
        uiTransform={{
          positionType: 'relative',
          width: '100%',
          height: 30,
          margin: { bottom: 10 }
        }}
      >
        <Label value="🐛 Debug Panel" fontSize={16} color={HEADER_COLOR} uiTransform={{ positionType: 'relative' }} />
      </UiEntity>

      {/* Game State Section */}
      <UiEntity uiTransform={{ positionType: 'relative', width: '100%', margin: { bottom: 15 } }}>
        <Label value="Game State" fontSize={14} color={HEADER_COLOR} uiTransform={{ margin: { bottom: 5 } }} />
        <UiEntity uiTransform={{ flexDirection: 'row' }}>
          <Button
            value="🥚 Hatch Egg"
            onMouseDown={() => game.hatchEgg()}
            uiTransform={{ width: 100, height: 25, margin: { right: 5 } }}
            variant="primary"
            fontSize={12}
          />
          <Button
            value="Reset to Egg"
            onMouseDown={() => game.setState({ phase: GamePhase.EGG })}
            uiTransform={{ width: 100, height: 25 }}
            variant="primary"
            fontSize={12}
          />
        </UiEntity>
      </UiEntity>

      {/* Pet Controls Section */}
      {game.state.pet && (
        <UiEntity uiTransform={{ positionType: 'relative', width: '100%', margin: { bottom: 15 } }}>
          <Label value="Pet Controls" fontSize={14} color={HEADER_COLOR} uiTransform={{ margin: { bottom: 5 } }} />
          <UiEntity uiTransform={{ flexDirection: 'column' }}>
            <UiEntity uiTransform={{ flexDirection: 'row', margin: { bottom: 3 } }}>
              <Button
                value="🍽️ Feed"
                onMouseDown={() => game.feedPet()}
                uiTransform={{ width: 70, height: 25, margin: { right: 3 } }}
                variant="primary"
                fontSize={12}
              />
              <Button
                value="🐾 Pet"
                onMouseDown={() => game.petPet()}
                uiTransform={{ width: 70, height: 25, margin: { right: 3 } }}
                variant="primary"
                fontSize={12}
              />
              <Button
                value="🏀 Play"
                onMouseDown={() => game.playWithPet()}
                uiTransform={{ width: 70, height: 25 }}
                variant="primary"
                fontSize={12}
              />
            </UiEntity>
            <UiEntity uiTransform={{ flexDirection: 'row' }}>
              <Button
                value="🛁 Bath"
                onMouseDown={() => game.bathePet()}
                uiTransform={{ width: 70, height: 25, margin: { right: 3 } }}
                variant="primary"
                fontSize={12}
              />
              <Button
                value="🛏️ Sleep"
                onMouseDown={() => game.putPetToSleep()}
                uiTransform={{ width: 70, height: 25 }}
                variant="primary"
                fontSize={12}
              />
            </UiEntity>
          </UiEntity>
        </UiEntity>
      )}

      {/* Pet Stats Section */}
      <UiEntity uiTransform={{ positionType: 'relative', width: '100%', margin: { bottom: 15 } }}>
        <Label value="Pet Stats" fontSize={14} color={HEADER_COLOR} uiTransform={{ margin: { bottom: 5 } }} />
        {game.state.pet ? (
          <UiEntity uiTransform={{ flexDirection: 'column' }}>
            <Label value={`Mood: ${game.state.pet.data.mood}`} fontSize={12} color={SECONDARY_COLOR} />
            <Label value={`Hunger: ${game.state.pet.data.hunger}`} fontSize={12} color={SECONDARY_COLOR} />
            <Label value={`Energy: ${game.state.pet.data.energy}`} fontSize={12} color={SECONDARY_COLOR} />
            <Label value={`Cleanliness: ${game.state.pet.data.cleanliness}`} fontSize={12} color={SECONDARY_COLOR} />
            <Label value={`Bond: ${game.state.pet.data.bond}`} fontSize={12} color={SECONDARY_COLOR} />
            <Label value={`State: ${game.state.pet.data.state}`} fontSize={12} color={SECONDARY_COLOR} />
          </UiEntity>
        ) : (
          <Label value="No pet active" fontSize={12} color={SECONDARY_COLOR} />
        )}
      </UiEntity>

      {/* Quests Section */}
      <UiEntity uiTransform={{ positionType: 'relative', width: '100%', margin: { bottom: 15 } }}>
        <Label value="Quests" fontSize={14} color={HEADER_COLOR} uiTransform={{ margin: { bottom: 5 } }} />
        {game.state.pet ? (
          <UiEntity uiTransform={{ flexDirection: 'column' }}>
            <Label
              value={`Feed: ${game.state.pet.data.quests.feed ? 'OK' : 'X'}`}
              fontSize={12}
              color={SECONDARY_COLOR}
            />
            <Label
              value={`Play: ${game.state.pet.data.quests.play ? 'OK' : 'X'}`}
              fontSize={12}
              color={SECONDARY_COLOR}
            />
            <Label
              value={`Bath: ${game.state.pet.data.quests.bath ? 'OK' : 'X'}`}
              fontSize={12}
              color={SECONDARY_COLOR}
            />
            <Label
              value={`Bedtime: ${game.state.pet.data.quests.bedtime ? 'OK' : 'X'}`}
              fontSize={12}
              color={SECONDARY_COLOR}
            />
          </UiEntity>
        ) : (
          <Label value="No quests" fontSize={12} color={SECONDARY_COLOR} />
        )}
      </UiEntity>

      {/* Modules Section */}
      <UiEntity uiTransform={{ positionType: 'relative', width: '100%' }}>
        <Label value="Modules" fontSize={14} color={HEADER_COLOR} uiTransform={{ margin: { bottom: 5 } }} />
        <Label
          value={`Active modules: ${game.modules.length}`}
          fontSize={12}
          color={SECONDARY_COLOR}
          uiTransform={{ margin: { bottom: 3 } }}
        />
        <UiEntity uiTransform={{ flexDirection: 'column' }}>
          {game.modules.map((module, index) => (
            <Label key={index} value={`• ${module.name}`} fontSize={10} color={SECONDARY_COLOR} />
          ))}
        </UiEntity>
      </UiEntity>
    </UiEntity>
  )
}
