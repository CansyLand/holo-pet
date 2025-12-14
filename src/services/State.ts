// EPIC: Game Flow Stories - All game state management
// Centralized game state management and notifications.
// Modules can subscribe to state changes and react accordingly.

import { GameState } from '../Game'

export interface StateChangeCallback {
  (newState: GameState, oldState: GameState): void
}

export class StateManager {
  private currentState: GameState
  private listeners: StateChangeCallback[] = []

  constructor(initialState: GameState) {
    this.currentState = { ...initialState }
    console.log('📊 State manager initialized')
  }

  // Get current state (read-only copy)
  getCurrent(): Readonly<GameState> {
    return { ...this.currentState }
  }

  // Update state and notify listeners
  setState(newState: Partial<GameState>) {
    const oldState = { ...this.currentState }
    this.currentState = { ...this.currentState, ...newState }

    // Notify all listeners
    this.notifyListeners(this.currentState, oldState)

    console.log('📊 State updated:', newState)
  }

  // Subscribe to state changes
  subscribe(callback: StateChangeCallback): () => void {
    this.listeners.push(callback)
    console.log('📊 State listener added')

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
        console.log('📊 State listener removed')
      }
    }
  }

  // Notify all listeners of state change
  private notifyListeners(newState: GameState, oldState: GameState) {
    this.listeners.forEach((callback) => {
      try {
        callback(newState, oldState)
      } catch (error) {
        console.error('📊 Error in state change listener:', error)
      }
    })
  }

  // Check if state matches condition
  matches(condition: Partial<GameState>): boolean {
    return Object.entries(condition).every(([key, value]) => {
      return this.currentState[key as keyof GameState] === value
    })
  }

  // Wait for state to match condition (returns promise)
  waitFor(condition: Partial<GameState>): Promise<GameState> {
    return new Promise((resolve) => {
      if (this.matches(condition)) {
        resolve(this.currentState)
        return
      }

      const unsubscribe = this.subscribe((newState) => {
        if (this.matches(condition)) {
          unsubscribe()
          resolve(newState)
        }
      })
    })
  }

  // Get state value by path (e.g., 'pet.data.mood')
  getValue(path: string): any {
    const keys = path.split('.')
    let value: any = this.currentState

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key]
      } else {
        return undefined
      }
    }

    return value
  }

  // Set state value by path
  setValue(path: string, value: any) {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    let obj: any = this.currentState

    // Navigate to the parent object
    for (const key of keys) {
      if (!obj[key] || typeof obj[key] !== 'object') {
        obj[key] = {}
      }
      obj = obj[key]
    }

    // Set the value
    obj[lastKey] = value

    // Trigger state change notification
    this.notifyListeners(this.currentState, this.currentState)
  }

  // Reset state to initial values
  reset(initialState: GameState) {
    const oldState = { ...this.currentState }
    this.currentState = { ...initialState }

    this.notifyListeners(this.currentState, oldState)
    console.log('📊 State reset to initial values')
  }

  // Get number of active listeners (for debugging)
  getListenerCount(): number {
    return this.listeners.length
  }

  // Clear all listeners (for cleanup)
  clearListeners() {
    this.listeners = []
    console.log('📊 All state listeners cleared')
  }
}

// Global instance (will be initialized with game state)
export let stateManager: StateManager

// Initialize with default state
export function initializeStateManager(initialState: GameState) {
  stateManager = new StateManager(initialState)
}

