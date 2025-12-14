// EPIC: New Player Onboarding - Pet Naming Story
// Naming UI dialog that appears after egg hatching.
// Allows players to enter a custom name for their pet.

import React, { useState } from 'react'
import { game } from '../Game'

interface NamingUIProps {
  isVisible: boolean
  onNameSubmit: (name: string) => void
}

export function NamingUI({ isVisible, onNameSubmit }: NamingUIProps) {
  const [petName, setPetName] = useState('')

  if (!isVisible) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (petName.trim()) {
      onNameSubmit(petName.trim())
      setPetName('')
    }
  }

  const handleRandomName = () => {
    const randomNames = [
      'Fluffy',
      'Tiger',
      'Spark',
      'Luna',
      'Max',
      'Bella',
      'Charlie',
      'Daisy',
      'Oliver',
      'Lucy',
      'Buddy',
      'Molly',
      'Jack',
      'Sophie',
      'Rocky',
      'Lily'
    ]
    const randomName = randomNames[Math.floor(Math.random() * randomNames.length)]
    setPetName(randomName)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%'
      }}
    >
      <h2 style={{ color: '#333', marginBottom: '20px' }}>🐾 Name Your Pet!</h2>

      <p style={{ color: '#666', marginBottom: '25px' }}>
        Your egg has hatched! What would you like to name your new companion?
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Enter pet name..."
          maxLength={20}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            marginBottom: '15px',
            textAlign: 'center'
          }}
          autoFocus
        />

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleRandomName}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🎲 Random Name
          </button>

          <button
            type="submit"
            disabled={!petName.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: petName.trim() ? '#2196F3' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: petName.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            ✅ Name Pet
          </button>
        </div>
      </form>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
        This name will be permanent and shown to other players!
      </div>
    </div>
  )
}

// Manager class for the naming UI
export class NamingUIManager {
  private isVisible = false
  private onNameSubmitCallback?: (name: string) => void

  constructor() {
    console.log('🏷️ Naming UI manager initialized')
  }

  show(onNameSubmit: (name: string) => void) {
    this.isVisible = true
    this.onNameSubmitCallback = onNameSubmit
    this.render()
    console.log('🏷️ Naming UI shown')
  }

  hide() {
    this.isVisible = false
    this.onNameSubmitCallback = undefined
    this.render()
    console.log('🏷️ Naming UI hidden')
  }

  private handleNameSubmit(name: string) {
    if (this.onNameSubmitCallback) {
      this.onNameSubmitCallback(name)
    }
    this.hide()
  }

  private render() {
    // TODO: Render using ReactEcsRenderer.setUiRenderer
    // The actual rendering will be handled by the main UI renderer
  }

  isCurrentlyVisible(): boolean {
    return this.isVisible
  }
}

export const namingUI = new NamingUIManager()
