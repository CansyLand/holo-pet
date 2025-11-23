# Technical Planning: Holo Pet 5-Day MVP

## 🏗️ Code Structure Overview

```
/src
  index.ts              # Main scene entry point
  /systems
    GameManager.ts      # Core game state controller
    MoodSystem.ts       # Mood tracking and decay
    InteractionSystem.ts # Click handlers and responses
  /components
    Egg.ts              # Egg entity and spawn logic
    Pet.ts              # Pet entity, animations, states
    MoodUI.ts           # Simple mood number display
  /utils
    PersistenceUtils.ts # Wallet-based state saving
    TimerUtils.ts       # Mood decay timing
```

## 🔄 Element Communication Strategy

### Simple Event-Based Communication

```typescript
// Central event bus for loose coupling
class GameEvents {
  static EGG_CLICKED = 'egg_clicked'
  static PET_CLICKED = 'pet_clicked'
  static MOOD_CHANGED = 'mood_changed'
  static PET_SPAWNED = 'pet_spawned'
}

// Components listen and emit events
GameManager.subscribe(GameEvents.PET_CLICKED, () => {
  MoodSystem.increaseMood(10)
})
```

### Direct References for Performance

```typescript
// GameManager holds references to key systems
class GameManager {
  moodSystem: MoodSystem
  pet: Pet
  moodUI: MoodUI

  // Direct calls for immediate responses
  onPetClick() {
    this.moodSystem.increaseMood(10)
    this.pet.playHappyAnimation()
    this.moodUI.updateDisplay(this.moodSystem.currentMood)
  }
}
```

## 📊 State Management Architecture

### Single Source of Truth

```typescript
interface GameState {
  petSpawned: boolean
  currentMood: number // 0-100
  petState: 'happy' | 'sad' | 'idle'
  lastInteractionTime: number
  lastSaveTime: number // For Firebase sync tracking
}

class GameManager {
  private state: GameState = {
    petSpawned: false,
    currentMood: 50,
    petState: 'idle',
    lastInteractionTime: Date.now(),
    lastSaveTime: Date.now()
  }

  private playerWallet: string = '' // Decentraland wallet as player ID

  async initializePlayer() {
    // Get wallet address from Decentraland
    this.playerWallet = await getUserData().userId

    // Load existing state from Firebase
    const savedState = await PersistenceUtils.loadState(this.playerWallet)
    if (savedState) {
      this.state = savedState
    }
  }

  async saveGameState() {
    this.state.lastSaveTime = Date.now()
    await PersistenceUtils.saveState(this.playerWallet, this.state)
  }
}
```

### State Transitions

```typescript
// Clear state machine for what happens when
enum GameStage {
  EGG_WAITING, // Initial state, egg visible
  PET_ACTIVE, // Pet spawned, interactions enabled
  PET_IDLE // Background mood decay running
}

class GameManager {
  private currentStage: GameStage = GameStage.EGG_WAITING

  transitionTo(newStage: GameStage) {
    this.currentStage = newStage
    this.handleStageTransition()
  }

  private handleStageTransition() {
    switch (this.currentStage) {
      case GameStage.EGG_WAITING:
        this.showEgg()
        break
      case GameStage.PET_ACTIVE:
        this.spawnPet()
        this.startMoodDecay()
        break
    }
  }
}
```

## ⏰ Timing & Passive Systems

### Mood Decay Implementation

```typescript
class MoodSystem {
  private decayInterval: number = 10000 // 10 seconds
  private decayAmount: number = 1
  private moodDecayTimer: Timer | null = null

  startDecay() {
    this.moodDecayTimer = utils.setInterval(() => {
      this.decreaseMood(this.decayAmount)
    }, this.decayInterval)
  }

  stopDecay() {
    if (this.moodDecayTimer) {
      this.moodDecayTimer.stop()
    }
  }
}
```

## 💾 Persistence Strategy

### Firebase Database Storage

```typescript
class PersistenceUtils {
  private static FIREBASE_API_URL = 'https://your-project.firebaseio.com'
  private static COLLECTION_NAME = 'holopet_players'

  static async saveState(playerWallet: string, state: GameState) {
    // Use Firebase REST API with wallet address as player ID
    const response = await fetch(`${this.FIREBASE_API_URL}/${this.COLLECTION_NAME}/${playerWallet}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...state,
        lastUpdated: Date.now(),
        walletAddress: playerWallet // Store for reference
      })
    })
    return response.ok
  }

  static async loadState(playerWallet: string): Promise<GameState | null> {
    try {
      const response = await fetch(`${this.FIREBASE_API_URL}/${this.COLLECTION_NAME}/${playerWallet}.json`)

      if (response.ok) {
        const data = await response.json()
        return data || null
      }
      return null
    } catch (error) {
      console.error('Failed to load player state:', error)
      return null
    }
  }

  // Auto-save functionality for seamless experience
  static startAutoSave(playerWallet: string, getStateCallback: () => GameState) {
    setInterval(() => {
      const currentState = getStateCallback()
      this.saveState(playerWallet, currentState)
    }, 30000) // Auto-save every 30 seconds
  }
}
```

## 🎮 Interaction Flow

### Click Event Handling

```typescript
// Simple, direct click handlers
class InteractionSystem {
  setupEggInteraction(egg: Entity) {
    egg.addComponent(
      new OnPointerDown(() => {
        GameManager.onEggClick()
      })
    )
  }

  setupPetInteraction(pet: Entity) {
    pet.addComponent(
      new OnPointerDown(() => {
        GameManager.onPetClick()
      })
    )
  }
}
```

## 🔧 Maintainable Configuration

### Tweakable Values in One Place

```typescript
// Easy to modify without code changes
const CONFIG = {
  MOOD: {
    INITIAL_VALUE: 50,
    MAX_VALUE: 100,
    MIN_VALUE: 0,
    CLICK_INCREASE: 10,
    DECAY_RATE: 1,
    DECAY_INTERVAL_MS: 10000
  },

  ANIMATIONS: {
    HAPPY_DURATION: 2000,
    IDLE_LOOP: true,
    SPAWN_DELAY: 500
  },

  UI: {
    MOOD_POSITION: { x: 0, y: 8, z: 0 },
    MOOD_SCALE: 2
  }
}
```

## 🚀 Implementation Philosophy

### Straightforward Scene Scripting

- **No complex frameworks**: Direct Decentraland SDK usage
- **Readable code**: Clear function names and simple logic flows
- **Modular but simple**: Each system has one clear responsibility
- **Easily tweakable**: Numbers and timings in config objects
- **Debug-friendly**: Console logs and state inspection tools

### Extension Points for Future Features

```typescript
// Designed to easily add new interaction types
interface InteractionType {
  name: string
  moodChange: number
  animation: string
  cooldownMs?: number
}

const INTERACTIONS: InteractionType[] = [
  { name: 'pet', moodChange: 10, animation: 'happy' }
  // Easy to add: feed, play, brush, etc.
]
```

## 📝 Key Architectural Decisions

1. **Single GameManager**: Central controller for simplicity
2. **Event system**: Loose coupling where needed
3. **Direct calls**: Performance for immediate responses
4. **Config-driven**: All values easily adjustable
5. **State machine**: Clear transitions between game phases
6. **Timer-based**: Passive systems use Decentraland timers
7. **Firebase persistence**: Wallet address as player ID, cloud storage

This architecture prioritizes **simplicity and maintainability** over complex patterns, making it easy to add features incrementally without major refactors.

## 🎮 Game Design Research & Principles

### Classic Game Analysis: What Makes Simple Games Addictive

#### Pong (1972) - The Essence Distillation

**Core Elements**: Paddle + Ball + Score

- **Immediate feedback**: Ball responds instantly to paddle
- **Clear objective**: Don't let ball pass
- **Progressive difficulty**: Ball speeds increase
- **Perfect loop**: Failure → Try again instantly

**Applied to Holo Pet**:

- **Immediate feedback**: Pet responds instantly to clicks
- **Clear objective**: Keep pet happy
- **Progressive engagement**: Mood system creates stakes
- **Perfect loop**: Low mood → Pet again → Satisfaction

#### Super Mario Bros (1985) - Learning by Playing

**Teaching Without Words**:

- Level 1-1 teaches ALL mechanics through environmental design
- Goomba teaches jumping, Coins teach collection, Pipes teach exploration
- **No tutorials**: Pure interactive learning

**Applied to Holo Pet**:

```typescript
// Environmental teaching through design
- Egg placement: Central, obvious interaction target
- Visual feedback: Pet responds immediately, teaching cause-effect
- UI design: Mood number visible but non-intrusive
- Pet states: Happy/sad visually obvious, no explanation needed
```

#### Tamagotchi (1996) - Emotional Attachment Engine

**Psychological Hooks**:

- **Responsibility**: "This creature depends on me"
- **Guilt mechanism**: Neglect has visible consequences
- **Routine building**: Regular check-ins become habit
- **Personalization**: Naming creates ownership

**Applied to Holo Pet**:

```typescript
const EMOTIONAL_HOOKS = {
  RESPONSIBILITY: 'Pet mood decreases without care',
  VISUAL_FEEDBACK: 'Pet looks sad when mood is low',
  ROUTINE: '10-second decay creates return motivation',
  ATTACHMENT: 'Pet responds uniquely to each player'
}
```

### Psychological Engagement Patterns

#### Variable Ratio Reinforcement (Skinner Box Principle)

**Research**: Most addictive reward pattern is unpredictable timing
**Application**:

```typescript
// Future enhancement: Randomize pet responses
const RESPONSE_VARIATIONS = [
  { animation: 'happy_jump', probability: 0.7 },
  { animation: 'happy_spin', probability: 0.2 },
  { animation: 'happy_dance', probability: 0.1 } // Rare, special
]
```

#### Flow State Requirements (Csikszentmihalyi)

1. **Clear goals**: Keep pet happy (mood > 50)
2. **Immediate feedback**: Mood number and pet animation
3. **Balance challenge/skill**: Simple click, but timing matters
4. **Sense of control**: Player actions directly affect outcomes

#### Loss Aversion (Kahneman & Tversky)

**Research**: People feel loss 2x stronger than equivalent gains
**Application**:

- Mood decay creates sense of "losing" progress
- Visual pet sadness triggers emotional response
- Player motivated to "rescue" pet from sad state

### Successful Pet Care Games Analysis

#### Nintendogs (2005)

**Key Mechanics**:

- **Touch-based interaction**: Direct, tactile connection
- **Personality system**: Each dog feels unique
- **Care routine**: Walking, feeding, training creates ritual
- **Photo sharing**: Social validation encourages return

#### Animal Crossing Series

**Engagement Drivers**:

- **Real-time world**: Changes happen even when away
- **Daily events**: Reason to return regularly
- **Social elements**: Sharing experiences with others
- **No failure state**: Pure positive reinforcement

#### Minecraft Pet System

**Attachment Methods**:

- **Taming process**: Effort invested creates ownership
- **Following behavior**: Pet stays close, shows loyalty
- **Unique traits**: Each pet has individual characteristics
- **Loss consequences**: Pet death creates genuine sadness

### iPhone 1 Design Philosophy Applied

#### Jobs' Principle: "Simplicity is the Ultimate Sophistication"

**What iPhone 1 Did Right**:

- **One finger interaction**: No stylus, no complexity
- **Immediate response**: Touch felt direct and magical
- **Visual clarity**: Interface elements were obvious
- **Hidden complexity**: Sophisticated tech, simple interaction

**Applied to Holo Pet**:

```typescript
const JOBS_PRINCIPLES = {
  ONE_INPUT: 'Single click interaction - no complex gestures',
  IMMEDIATE_RESPONSE: 'Pet responds within 100ms of click',
  VISUAL_CLARITY: 'Mood number large and clear',
  HIDDEN_COMPLEXITY: 'State management invisible to player'
}
```

### Scientific Basis for Our Design Decisions

#### Why This Architecture Works Psychologically

**1. Operant Conditioning**

```typescript
// Positive reinforcement loop
Click → Mood Increase → Happy Animation → Dopamine Release
```

**2. Intermittent Reinforcement Schedule**

```typescript
// Mood decay creates unpredictable timing need
TimePassing → MoodDecay → VisualSadness → MotivatedReturn
```

**3. Cognitive Load Theory**

```typescript
// Minimize mental overhead
interface SimpleCognition {
  visualState: 'happy' | 'sad' // Binary, clear
  numberFeedback: number // Quantified progress
  singleAction: 'click' // One interaction type
}
```

**4. Endowment Effect**

```typescript
// Ownership psychology
Pet persists per wallet → "This is MY pet" → Emotional investment
```

### Master Game Mechanic Extraction

#### The "Perfect Loop" Formula

```typescript
// Distilled from Pong, Tetris, Pac-Man
class PerfectLoop {
  action: () => void // Simple, repeatable input
  feedback: () => void // Immediate, clear response
  progression: () => void // Sense of forward movement
  restart: () => void // Failure recoverable instantly
}

// Applied to Holo Pet
const HOLO_PET_LOOP = {
  action: 'Click pet',
  feedback: 'Mood +10, happy animation',
  progression: 'Pet becomes visibly happier',
  restart: 'Mood decay gives reason to return'
}
```

#### Tetris Principle: "Easy to Learn, Impossible to Master"

- **Entry barrier**: One-click interaction
- **Depth emergence**: Timing optimization, mood management
- **Skill development**: Learning optimal interaction patterns
- **Endless engagement**: No final "win" state

### Research-Based Implementation Priorities

#### Week 1: Psychological Foundation

```typescript
// Establish basic dopamine loop
PRIORITY_1: 'Click → Response latency < 100ms'
PRIORITY_2: 'Visual feedback must be satisfying'
PRIORITY_3: 'Mood number creates progress sensation'
```

#### Week 2-3: Engagement Refinement

```typescript
// Build habit formation
PRIORITY_4: 'Decay timing optimized for return motivation'
PRIORITY_5: 'Pet personality emerges through animation variety'
PRIORITY_6: 'Environmental polish supports immersion'
```

This research foundation ensures our simple mechanics tap into proven psychological patterns that create lasting engagement without complexity.
