// EPIC: Game Flow Stories - Debug and Development Tools
// DebugUI with all the buttons to change game and pet states.
// Essential for development and testing all game mechanics.

import React from 'react'
import { game } from '../Game'

export function DebugUI() {
  const [isVisible, setIsVisible] = React.useState(false)

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          padding: '10px',
          backgroundColor: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🐛 Debug
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '300px',
        fontSize: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3>🐛 Debug Panel</h3>
        <button onClick={() => setIsVisible(false)}>✕</button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>Game State</h4>
        <button onClick={() => game.hatchEgg()}>🥚 Hatch Egg</button>
        <button onClick={() => game.setState({ phase: 'egg' })}>Reset to Egg</button>
      </div>

      {game.state.pet && (
        <div style={{ marginBottom: '15px' }}>
          <h4>Pet Controls</h4>
          <button onClick={() => game.feedPet()}>🍽️ Feed</button>
          <button onClick={() => game.petPet()}>🐾 Pet</button>
          <button onClick={() => game.playWithPet()}>🏀 Play</button>
          <button onClick={() => game.bathePet()}>🛁 Bath</button>
          <button onClick={() => game.putPetToSleep()}>🛏️ Sleep</button>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h4>Pet Stats</h4>
        {game.state.pet ? (
          <div>
            <div>Mood: {game.state.pet.data.mood}</div>
            <div>Hunger: {game.state.pet.data.hunger}</div>
            <div>Energy: {game.state.pet.data.energy}</div>
            <div>Cleanliness: {game.state.pet.data.cleanliness}</div>
            <div>Bond: {game.state.pet.data.bond}</div>
            <div>State: {game.state.pet.data.state}</div>
          </div>
        ) : (
          <div>No pet active</div>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>Quests</h4>
        {game.state.pet ? (
          <div>
            <div>Feed: {game.state.pet.data.quests.feed ? '✅' : '❌'}</div>
            <div>Play: {game.state.pet.data.quests.play ? '✅' : '❌'}</div>
            <div>Bath: {game.state.pet.data.quests.bath ? '✅' : '❌'}</div>
            <div>Bedtime: {game.state.pet.data.quests.bedtime ? '✅' : '❌'}</div>
          </div>
        ) : (
          <div>No quests</div>
        )}
      </div>

      <div>
        <h4>Modules</h4>
        <div>Active modules: {game.modules.length}</div>
        {game.modules.map((module, index) => (
          <div key={index}>• {module.name}</div>
        ))}
      </div>
    </div>
  )
}
