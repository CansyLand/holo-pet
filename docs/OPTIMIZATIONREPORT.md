# Holo Pet - Modular Architecture Optimization

## Vision: Modular, Maintainable, Fun-to-Code Game

**Goal**: Refactor to a modular architecture where things that belong together are grouped together. Make the game **pluggable** - you can remove modules without breaking the game, but when present, they work seamlessly together.

**Approach**: Structure for future complexity now, even if current implementations are simple. Each interactive object gets its own module, ready for mini-games and advanced features.

---

## Core Philosophy

### 1. **One File Per Major Feature** (Like Snow.ts)

Each major game feature gets its own file containing everything related to that feature:

- **Snow.ts** - All snow particle logic, spawning, physics, controls
- **Poop.ts** - All poop mechanics, spawning, collection, effects
- **Pet.ts** - All pet data, actions, and behavior (as an object)
- **Focus.ts** - All camera focus mechanics, cursor locking/unlocking
- **HeartParticle.ts** - All heart particle effects

### 2. **Game.ts as the Centerpiece**

Game.ts knows the current state and coordinates modules. Modules read game state and react accordingly.

### 3. **Pluggable Modules**

- Game works without most modules
- Modules can be added/removed without breaking core functionality
- Clean imports - modules use centralized services when needed

### 4. **Centralized Services**

Core game mechanics that multiple modules need:

- **VisibilityManager** - Handles showing/hiding entities based on game state
- **InteractionManager** - Handles input and interactions
- **StateManager** - Manages game state and notifications

---

## Proposed Architecture

```
src/
├── Game.ts              # 🎯 Centerpiece - game state & coordination
├── Pet.ts               # 🐾 Pet object - all pet logic in one place
├── modules/             # Pluggable features
│   ├── Snow.ts          # ❄️ Snow particles (already good!)
│   ├── Poop.ts          # 💩 Poop system
│   ├── HeartParticle.ts # ❤️ Heart effects
│   ├── Egg.ts           # 🥚 Egg hatching & animations
│   ├── Needs.ts         # 📊 3D Stats bars hovering over pet
│   ├── Ball.ts          # 🏀 Physics, fetching mini-game, pet AI interaction
│   ├── FoodBowl.ts      # 🍽️ Feeding animations, multiple food types
│   ├── Bath.ts          # 🛁 Bathing mini-game, water effects
│   ├── Bed.ts           # 🛏️ Sleep cycle, dreams, energy recharge
│   ├── Decoration.ts    # 🎄 Seasonal changes, interactions
│   └── Visit.ts         # 👥 Multiplayer visits
├── services/            # Shared utilities
│   ├── Visibility.ts    # 👁️ Centralized visibility management
│   ├── Interaction.ts   # 🖱️ Input handling
│   ├── Focus.ts         # 🎥 Camera focus mechanics (lock unlock cursor manager)
│   └── State.ts         # 📊 Game state management
├── ui/                  # UI components
│   ├── DebugUI          # DebugUI with all the buttons to change game and pet states
│   ├── Leaderboard.ts   # Leaderboard UI
│   ├── Naming.ts        # 🐶 Name the Pet
│   ├── Quest.ts         # 🏆 UI indicating the current and next quest
│   └── MenuUI.ts        # 🎛️ Pet menu
├── persistence/         # 💾 Save/load (keep as-is)
└── utils/               # 🛠️ Utilities
```

---

## Detailed Module Breakdown

### 🎯 Game.ts - The Centerpiece

**Role**: Knows everything about game state, coordinates modules, handles state transitions.

```typescript
export class Game {
  // Current state - modules read this
  state = {
    phase: 'egg' | 'pet', // Modules react to this
    pet: Pet | null,
    theme: 'default' | 'christmas'
  }

  // Modules register themselves
  modules: GameModule[] = []

  // State change notifications
  onStateChange(callback: (newState, oldState) => void) {}

  // Module coordination
  update(dt: number) {
    // Update pet
    if (this.pet) this.pet.update(dt)

    // Update modules
    this.modules.forEach((module) => module.update?.(dt))

    // Handle interactions
    this.handleInteractions()
  }
}
```

**Why this works**:

- Modules can read `game.state` to know what to do
- When state changes (egg → pet), modules automatically react
- Clean separation - Game doesn't know module internals

### 🐾 Pet.ts - Pet as an Object

**Everything pet-related in one file**:

```typescript
export class Pet {
  // All pet data in one place (no scattered ECS components)
  data = {
    name: 'Fluffy',
    species: 'tiger',
    stats: { mood: 100, hunger: 0, energy: 100, cleanliness: 100, bond: 50 },
    personality: { energy: 50, sociability: 70, cleanliness: 40, appetite: 60 },
    quests: { feed: false, play: false, bath: false, bedtime: false },
    position: { x: 16, y: 0, z: 16 },
    lastVisit: Date.now()
  }

  // All pet actions
  feed() {
    /* ... */
  }
  pet() {
    /* ... */
  }
  play() {
    /* ... */
  }
  bath() {
    /* ... */
  }

  // Behavior update
  update(dt: number) {
    this.decayStats(dt)
    this.updateBehavior(dt)
  }
}
```

**Migration**: Consolidate PetComponent, PersonalityComponent, BondComponent, etc. into this single Pet object.

### 👁️ Visibility.ts - Centralized Visibility Management

**Problem**: Currently visibility logic is scattered. Decorations should show/hide based on game state.

```typescript
export class VisibilityManager {
  // Game state listeners
  onGameStateChange(newState: GameState) {
    if (newState.phase === 'egg') {
      this.hidePetDecorations()
      this.showEggDecorations()
    } else {
      this.showPetDecorations()
      this.hideEggDecorations()
    }
  }

  // Utility functions modules can use
  showEntity(entity: Entity) {
    /* ... */
  }
  hideEntity(entity: Entity) {
    /* ... */
  }
  showGroup(groupName: string) {
    /* ... */
  }
}
```

**Benefits**:

- One place to manage visibility rules
- Easy to add new state-based visibility (e.g., "show Christmas decor only in winter")
- Modules can call `visibility.showPetDecorations()` without knowing details

### 🎥 Focus.ts - Camera Focus Service

**Centralized focus mechanics** - camera movement, cursor locking/unlocking for any interactive entity.

```typescript
export class FocusService {
  currentFocus: Entity | null = null

  // Focus on any entity
  focusOn(entity: Entity, options?: FocusOptions) {
    // Lock cursor
    // Move camera
    // Set focus state
  }

  // Unfocus
  unfocus() {
    // Unlock cursor
    // Reset camera
    // Clear focus state
  }

  // Check if currently focused
  isFocused(entity: Entity): boolean {
    return this.currentFocus === entity
  }
}
```

**Usage**:

- Click pet → `focus.focusOn(petEntity)`
- Click food bowl → `focus.focusOn(foodBowlEntity)`
- Later: Click bathtub → `focus.focusOn(bathEntity)`

### 🥚 Egg.ts - Egg Module

**All egg-related logic** - hatching, animations, interactions.

```typescript
export class EggModule {
  eggEntity: Entity

  // Easy to extend with animations
  onClick() {
    this.startHatchingAnimation()
  }

  // Add color-changing animation easily
  startColorChangeAnimation() {
    // Simple animation logic here
    // Can be triggered by game state or time
  }

  update(dt: number) {
    // Handle animations, effects, etc.
  }
}
```

### 📊 Needs.ts - 3D Stats Display

**3D floating stats bars** - mood, hunger, energy, cleanliness bars that hover over the pet.

```typescript
export class NeedsModule {
  bars: { [key: string]: Entity } = {}

  update(dt: number) {
    if (!game.pet) return

    this.updateBar('mood', game.pet.data.stats.mood)
    this.updateBar('hunger', game.pet.data.stats.hunger)
    this.updateBar('energy', game.pet.data.stats.energy)
    this.updateBar('cleanliness', game.pet.data.stats.cleanliness)
  }

  showBars() {
    Object.values(this.bars).forEach((entity) => visibility.showEntity(entity))
  }

  hideBars() {
    Object.values(this.bars).forEach((entity) => visibility.hideEntity(entity))
  }
}
```

**State-aware**: Shows/hides automatically based on game phase and focus state.

### 🏀 Ball.ts - Interactive Object Module

**Simple placeholder for now** - ready for future fetching mini-games.

```typescript
export class BallModule {
  ballEntity: Entity

  // Currently: basic interaction placeholder
  onClick() {
    // For now: just trigger basic interaction
    // Future: physics, pet fetching AI, mini-games
  }

  // Ready for expansion:
  // - Ball physics and trajectory
  // - Pet AI to chase and fetch
  // - Throwing mechanics
}
```

### 🍽️ FoodBowl.ts - Feeding Module

**Basic feeding mechanics** - hunger modification and visual feedback.

```typescript
export class FoodBowlModule {
  bowlEntity: Entity

  onClick() {
    // Simple for now: reduce pet hunger
    game.pet.feed()

    // Ready for expansion:
    // - Multiple food types
    // - Feeding animations
    // - Food particles/effects
    // - Pet preference system
  }
}
```

### 🛁 Bath.ts - Bathing Module

**Basic cleanliness mechanics** - bathing interaction and mood boost.

```typescript
export class BathModule {
  bathEntity: Entity

  onClick() {
    // Simple for now: clean pet
    game.pet.bath()

    // Ready for expansion:
    // - Bathing mini-game
    // - Water particle effects
    // - Bathing animations
    // - Water sound effects
  }
}
```

### 🛏️ Bed.ts - Sleep Module

**Basic energy recharge** - sleep interaction and rest mechanics.

```typescript
export class BedModule {
  bedEntity: Entity

  onClick() {
    // Simple for now: put pet to sleep
    game.pet.sleep()

    // Ready for expansion:
    // - Sleep cycle simulation
    // - Dream sequences
    // - Energy recharge over time
    // - Wake up animations
  }
}
```

### 🎄 Decoration.ts - Seasonal Module

**Basic decoration interactions** - placeholder for seasonal content.

```typescript
export class DecorationModule {
  decorationEntity: Entity

  onClick() {
    // Simple for now: basic interaction
    // Future: seasonal changes, special effects
  }

  // Ready for expansion:
  // - Seasonal decoration swaps
  // - Holiday-specific interactions
  // - Decoration animations
  // - Theme-based effects
}
```

### ❄️ Snow.ts - Already Perfect!

**This file is exactly what we want** - self-contained, pluggable, everything in one place.

### 💩 Poop.ts - All Poop Logic Together

**Consolidate all poop-related code**:

- Spawning logic
- Collection interactions
- Visual effects
- Cleanliness impact

### ❤️ HeartParticle.ts - Pluggable Effects

**All heart particle logic**:

- Spawning hearts
- Animation
- Pooling
- Trigger conditions

**Easy to remove**: Comment out one import, game still works.

---

## Migration Strategy

### Phase 1: Core Consolidation (Week 1)

1. **Create Game.ts centerpiece**

   - Move game state logic from GameState component
   - Add module registration system

2. **Create Pet.ts object**

   - Consolidate all pet components into Pet class
   - Move pet actions from Logic.ts into Pet methods
   - Keep old system working alongside

3. **Create Visibility.ts service**
   - Extract visibility logic from Environment.ts
   - Add state-based visibility rules

### Phase 2: Module Extraction (Week 2)

1. **Create Focus.ts service**

   - Extract focus logic from UIState, CameraFocus components
   - Make it a centralized service for cursor/camera management

2. **Create Egg.ts module**

   - Extract egg logic from Pet factory
   - Add animation hooks for easy extension

3. **Create Needs.ts module**

   - Extract 3D stats bars from NeedsUI system
   - Make them state-aware (show/hide based on game phase)

4. **Create Object Modules (Simple for now)**

   - **FoodBowl.ts**: Basic feeding interaction (hunger modification)
   - **Bath.ts**: Basic bathing interaction (cleanliness modification)
   - **Bed.ts**: Basic sleep interaction (energy recharge)
   - **Ball.ts**: Basic ball interaction placeholder
   - **Decoration.ts**: Basic decoration no iteraction needed

5. **Create Poop.ts module**

   - Consolidate poop spawning, collection, effects

6. **Create HeartParticle.ts module**
   - Extract heart logic from HeartParticle system

### Phase 3: UI Organization (Week 3)

1. **Create Visit.ts module**

   - Extract multiplayer visit logic
   - Make it DLC-optional for single-player mode

2. **Organize UI components**

   - Move DebugUI, Leaderboard, Naming, Quest UI to ui/ folder
   - Extract from factories into dedicated UI files
   - Keep React components for complex interfaces

### Phase 4: Clean Up (Week 4)

1. **Remove old ECS components**

   - Replace with direct Pet object usage
   - Remove scattered systems

2. **Simplify main.ts**

   - Register modules instead of 20+ systems
   - Clean game loop

3. **Update imports**
   - Modules import what they need from services

---

## Key Benefits

### 🎯 **Easy Feature Addition**

**Add new pet interaction**:

```typescript
// In Pet.ts
dance() {
  this.data.stats.mood += 10
  this.playAnimation('dance')
}
```

**Add egg color animation**:

```typescript
// In Egg.ts
startColorPulse() {
  // Simple animation code
}
```

**Add ball fetching mini-game**:

```typescript
// In Ball.ts (already structured for expansion)
throwBall(targetPosition: Vector3) {
  // Physics simulation
  // Trigger pet chasing behavior
  // Complex mini-game logic
}
```

### 🔧 **Easy Modification**

**Change heart effects**: Edit only `HeartParticle.ts`
**Modify focus behavior**: Edit only `Focus.ts`
**Add new poop mechanics**: Edit only `Poop.ts`

### 🧹 **Easy Removal**

**Remove snow**: Delete `Snow.ts`, comment one import
**Remove hearts**: Delete `HeartParticle.ts`, comment one import
**Game keeps working**

### 🎮 **State-Driven Behavior**

**Modules react to state changes**:

```typescript
// In any module
game.onStateChange((newState) => {
  if (newState.phase === 'pet') {
    this.showPetFeatures()
  }
})
```

### 👥 **Fun to Work With**

**New developer**: "Where's the pet logic?" → Open `Pet.ts`
**Add feature**: Find relevant module, add code
**Debug issue**: Look in the obvious file

---

## No Features Lost

✅ **All current interactions work**
✅ **All UI elements remain**
✅ **Persistence unchanged**
✅ **Multiplayer visits as DLC**
✅ **All stats and quests preserved**

---

## Technical Details

### Module Interface

```typescript
interface GameModule {
  name: string
  init?: () => void
  update?: (dt: number) => void
  cleanup?: () => void
}
```

### State Management

```typescript
interface GameState {
  phase: 'egg' | 'pet'
  pet: Pet | null
  theme: string
  // Add new state as needed
}
```

### Service Pattern

**Services are utilities modules can import**:

- `Visibility.showEntity(entity)`
- `Interaction.registerHandler(type, callback)`
- `State.getCurrent()`

---

## Success Metrics

| Aspect                          | Before    | After         |
| ------------------------------- | --------- | ------------- |
| Files to modify for new feature | 5-8       | 1-2           |
| Time to add interaction         | 2-3 hours | 15-30 minutes |
| Files to understand pet logic   | 12+       | 1 (Pet.ts)    |
| Game works without modules      | ❌        | ✅            |
| Easy to add animations          | ❌        | ✅            |
| Easy to add mini-games          | ❌        | ✅            |
| Fun to code                     | 🤔        | 😊            |

---

## Implementation Guide

**📋 See STORIES.md** for detailed user stories, behavior specifications, and technical requirements.

---

## Conclusion

This architecture gives you the **best of both worlds**:

1. **Modular**: Things that belong together are together
2. **Pluggable**: Remove modules without breaking the game
3. **Maintainable**: Easy to find and modify code
4. **Extensible**: Simple to add new features like egg animations
5. **Future-ready**: Object modules structured for mini-games even when simple now
6. **State-driven**: Clean communication between modules
7. **Fun**: Script-kiddie friendly, but powerful

The game becomes a **collection of focused modules** orbiting around a central Game.ts, with shared services for common needs. Each module is self-contained but can communicate through the game state.

**Start with Game.ts and Pet.ts** - once those are solid, extracting modules becomes straightforward and the architecture will feel natural and enjoyable to work with.</contents>
