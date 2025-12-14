# Holo Pet - Simplification Report

> **Goal**: Make code **easy, not smart**. Easy to add features without refactoring.

---

## The Core Problem

Your codebase has **50+ files** doing what could be done in **~10 files**. It uses "smart" patterns (ECS, event systems, factories) when simple functions would work better.

**Current reality:**

- To add a new interaction → touch 5-6 files
- To understand how the pet works → read 12+ files
- To debug a bug → trace through multiple systems

**What we want:**

- To add a new interaction → add one function in one file
- To understand how the pet works → read 1-2 files
- To debug a bug → look in the obvious place

---

## What's Actually Happening (Simplified View)

Strip away all the abstractions, and your game does this:

```
1. Player enters scene
2. Load pet data from server (or show egg)
3. Pet exists with stats (mood, hunger, energy, cleanliness, bond)
4. Stats decay over time
5. Player interacts → stats change
6. Pet moves around based on needs
7. Save pet data on exit
```

That's it. Everything else is implementation details.

---

## Current Architecture Problems

### Problem 1: Scattered Pet Data

Pet state lives in 6+ separate ECS components:

```
PetComponent      → mood, hunger, energy, state
PersonalityComponent → energy, sociability, cleanliness, appetite
BondComponent     → bond, trustLevel, lastVisitTime
HygieneComponent  → cleanliness, lastBathTime, lastBrushTime
PetIdentityComponent → name, hatchedAt, ownerId
DailyQuestComponent → feedCompleted, playCompleted, etc.
```

**Why this is bad:**

- To read pet status, you query 6 different components
- To save the pet, you serialize 6 different components
- To add a new stat, you create a whole new component

**Simple solution:**

```typescript
// One object with all pet data
const pet = {
  name: 'Fluffy',
  stats: { mood: 80, hunger: 20, energy: 100, cleanliness: 90, bond: 60 },
  personality: { energy: 50, sociability: 70, cleanliness: 40, appetite: 60 },
  quests: { feed: false, play: false, bath: false, bedtime: false },
  lastVisit: Date.now()
}
```

### Problem 2: Too Many Systems

You have 20+ systems running every frame:

```typescript
// From index.ts - systems registered:
inputSystemCallback
logicSystem // 480 lines
timeSystem
renderSystem
movementSystem
animationSystem
menuPositionSystem
cursorFollowSystem
behaviorSystem // 880 lines
bondSystem
hygieneSystem
poopSystem
heartParticleSystem
snowSystem
namingSystem
sleepSystem
questAnimationSystem
persistenceSystem
avatarVisibilitySystem
needsUISystem
```

**Why this is bad:**

- Each system has its own file, state, and logic
- Systems have hidden dependencies on each other
- Hard to understand the order of execution

**Simple solution:**
One main update loop with clear sections:

```typescript
function gameLoop(dt: number) {
  // 1. Process player input
  handleInput()

  // 2. Update pet stats (decay/recovery)
  updatePetStats(dt)

  // 3. Update pet behavior (movement, AI)
  updatePetBehavior(dt)

  // 4. Update visuals
  updateVisuals(dt)
}
```

### Problem 3: Event-Driven Interactions

Current flow for a simple "Feed" action:

```
1. Player clicks food bowl
2. inputSystem adds PointerEventsResult
3. Input.ts reads PointerEventsResult, finds Interactable component
4. Input.ts creates InteractionEvent component on entity
5. logicSystem runs, sees InteractionEvent
6. logicSystem calls handleFeed()
7. handleFeed() calls findActivePet()
8. handleFeed() updates PetComponent
9. handleFeed() calls addBond() (different file)
10. handleFeed() calls checkQuestCompletion() (different file)
11. InteractionEvent is deleted
```

**Why this is bad:**

- 11 steps for a simple action
- Logic scattered across 5+ files
- Adding a new interaction requires understanding the whole chain

**Simple solution:**

```typescript
function feedPet() {
  pet.stats.hunger = Math.max(0, pet.stats.hunger - 30)
  pet.stats.mood = Math.min(100, pet.stats.mood + 5)
  pet.stats.bond = Math.min(100, pet.stats.bond + 2)
  checkQuest('feed')
  save()
}
```

### Problem 4: Factory Overload

You have 16+ factory files:

```
factories/
├── Audio.ts
├── AvatarHider.ts
├── Environment.ts
├── Game.ts
├── HeartPool.ts
├── LeaderboardUI.tsx
├── NamingUI.tsx
├── NeedsUI.ts
├── Pet.ts
├── PoopPool.ts
├── QuestUI.tsx
├── SnowPool.ts
├── Station.ts
├── StatsUI.tsx
├── UI.ts
└── VisitUI.tsx
```

**Why this is bad:**

- `createPet()` doesn't just create a pet—it creates menu, camera, poop pool, heart pool, stations, and needs UI
- Hard to know what factory creates what
- Adding a visual effect means creating a new factory

**Simple solution:**
Inline creation or use simple helper functions. A pet is just an entity with components—create it where you need it.

---

## Proposed Simplified Structure

```
src/
├── index.ts          # Entry point, game loop
├── pet.ts            # All pet data and actions (THE core file)
├── behavior.ts       # Pet AI/movement (simplified)
├── persistence.ts    # Save/load (keep as-is, it's good)
├── ui.ts             # All UI in one file
├── constants.ts      # All numbers in one place
├── types.ts          # TypeScript types
└── utils/
    ├── wallet.ts     # Wallet helper (keep as-is)
    └── dcl.ts        # DCL SDK helpers
```

**8 files instead of 50+**

---

## The New Pet File (Core of Everything)

```typescript
// src/pet.ts - Everything about your pet in one file

import { Entity } from '@dcl/sdk/ecs'
import * as C from './constants'

// =============================================================================
// PET DATA - Simple object, not scattered components
// =============================================================================

export interface PetData {
  entity: Entity
  name: string
  species: 'tiger'

  stats: {
    mood: number // 0-100
    hunger: number // 0-100 (0 = full, 100 = starving)
    energy: number // 0-100
    cleanliness: number // 0-100
    bond: number // 0-100
  }

  personality: {
    energy: number
    sociability: number
    cleanliness: number
    appetite: number
  }

  quests: {
    feed: boolean
    play: boolean
    bath: boolean
    bedtime: boolean
    lastReset: string // YYYY-MM-DD
  }

  lastVisit: number // timestamp
}

// The pet - just one global variable
export let pet: PetData | null = null

// =============================================================================
// PET CREATION
// =============================================================================

export function createPet(entity: Entity, name: string): PetData {
  pet = {
    entity,
    name,
    species: 'tiger',
    stats: {
      mood: 100,
      hunger: 0,
      energy: 100,
      cleanliness: 100,
      bond: 50
    },
    personality: generatePersonality(),
    quests: {
      feed: false,
      play: false,
      bath: false,
      bedtime: false,
      lastReset: getTodayDate()
    },
    lastVisit: Date.now()
  }
  return pet
}

function generatePersonality() {
  const rand = () => 20 + Math.floor(Math.random() * 60) // 20-80
  return {
    energy: rand(),
    sociability: rand(),
    cleanliness: rand(),
    appetite: rand()
  }
}

// =============================================================================
// PET ACTIONS - Add new interactions here!
// =============================================================================

export function petAction(action: string) {
  if (!pet) return

  switch (action) {
    case 'pet':
      pet.stats.mood = clamp(pet.stats.mood + C.PET_MOOD_BOOST)
      pet.stats.bond = clamp(pet.stats.bond + C.PET_BOND_BOOST)
      spawnHearts()
      break

    case 'feed':
      pet.stats.hunger = clamp(pet.stats.hunger - C.FEED_HUNGER_REDUCTION, 0, 100)
      pet.stats.mood = clamp(pet.stats.mood + C.FEED_MOOD_BOOST)
      pet.stats.bond = clamp(pet.stats.bond + C.FEED_BOND_BOOST)
      checkQuest('feed')
      break

    case 'play':
      pet.stats.mood = clamp(pet.stats.mood + C.PLAY_MOOD_BOOST)
      pet.stats.energy = clamp(pet.stats.energy - C.PLAY_ENERGY_DECREASE, 0, 100)
      pet.stats.hunger = clamp(pet.stats.hunger + C.PLAY_HUNGER_INCREASE)
      pet.stats.cleanliness = clamp(pet.stats.cleanliness - C.PLAY_CLEANLINESS_DECREASE, 0, 100)
      pet.stats.bond = clamp(pet.stats.bond + C.PLAY_BOND_BOOST)
      checkQuest('play')
      break

    case 'bath':
      pet.stats.cleanliness = clamp(pet.stats.cleanliness + C.BATHE_CLEANLINESS_BOOST)
      pet.stats.mood = clamp(pet.stats.mood + C.BATHE_MOOD_BOOST)
      pet.stats.bond = clamp(pet.stats.bond + C.BATHE_BOND_BOOST)
      checkQuest('bath')
      break

    case 'sleep':
      // Pet starts sleeping, energy recharges in update loop
      break

    // === ADD NEW ACTIONS HERE ===
    // case 'dance':
    //   pet.stats.mood = clamp(pet.stats.mood + 20)
    //   playAnimation('dance')
    //   break
  }

  pet.lastVisit = Date.now()
  scheduleSave()
}

// =============================================================================
// PET UPDATE - Called every frame
// =============================================================================

let updateTimer = 0

export function updatePet(dt: number) {
  if (!pet) return

  updateTimer += dt
  if (updateTimer < 1.0) return // Update every second
  updateTimer = 0

  // Stats decay
  pet.stats.mood = clamp(pet.stats.mood - C.MOOD_DECAY_RATE, 0, 100)
  pet.stats.hunger = clamp(pet.stats.hunger + C.HUNGER_GROWTH_RATE, 0, 100)
  pet.stats.cleanliness = clamp(pet.stats.cleanliness - C.HYGIENE_DECAY_RATE, 0, 100)

  // Energy recovery when resting
  if (pet.stats.energy < 100) {
    pet.stats.energy = clamp(pet.stats.energy + C.ENERGY_RECOVERY_RATE)
  }

  // Bond decay if abandoned
  const hoursSinceVisit = (Date.now() - pet.lastVisit) / (1000 * 60 * 60)
  if (hoursSinceVisit > 24) {
    pet.stats.bond = clamp(pet.stats.bond - C.BOND_DECAY_RATE, 0, 100)
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function checkQuest(action: string) {
  if (!pet) return
  // Quest logic here - simple and contained
}

function spawnHearts() {
  // Particle effect - can be a simple function
}

function scheduleSave() {
  // Debounced save trigger
}
```

---

## How to Add a New Feature

### Example: Add a "Dance" interaction

**Old way (current architecture):**

1. Add `DANCE = 'dance'` to `InteractionType` enum in `Interaction.ts`
2. Add constants `DANCE_MOOD_BOOST`, `DANCE_ENERGY_COST` to `constants.ts`
3. Add `case InteractionType.DANCE:` in `logicSystem` in `Logic.ts`
4. Create `handleDance()` function in `Logic.ts`
5. Add dance animation logic in `Animation.ts`
6. Maybe create a dance station in `Station.ts`
7. Update serialization if needed in `serialization.ts`
8. Test across all files

**New way (simplified):**

```typescript
// In pet.ts, add one case:
case 'dance':
  pet.stats.mood = clamp(pet.stats.mood + 20)
  pet.stats.energy = clamp(pet.stats.energy - 10, 0, 100)
  playAnimation(pet.entity, 'Dance')
  break
```

**Done.** One file, one place.

---

## Migration Strategy

Don't rewrite everything at once. Migrate in layers:

### Phase 1: Consolidate Data (Low Risk)

1. Create `PetData` interface in a new `pet.ts`
2. Keep existing components but read/write through PetData
3. Test that everything still works

### Phase 2: Consolidate Actions (Medium Risk)

1. Move all interaction handlers from `Logic.ts` into `pet.ts` as `petAction()`
2. Keep the old `logicSystem` but have it just call `petAction()`
3. Test each interaction

### Phase 3: Simplify Systems (Medium Risk)

1. Merge `timeSystem`, `bondSystem`, `hygieneSystem` into `updatePet()`
2. Merge `behaviorSystem` into a simpler `updateBehavior()`
3. Remove empty system files

### Phase 4: Simplify Factories (Low Risk)

1. Inline simple factory calls
2. Keep complex ones (like Environment.ts) but simplify
3. Remove unused factory files

---

## What to Keep As-Is

Not everything needs to change. These are **already good**:

1. **`persistence/api.ts`** - Clean API wrapper, well-structured
2. **`utils/wallet.ts`** - Simple utility, does one thing
3. **`utils/constants.ts`** - Good practice to centralize magic numbers
4. **`factories/Environment.ts`** - Entity groups and visibility logic is clean
5. **UI React components** - React is fine for UI, keep the TSX files

---

## Specific Recommendations

### 1. Kill the Event Component Pattern

**Current:**

```typescript
// Input creates event
InteractionEvent.create(entity, { type: InteractionType.FEED })

// System processes event later
for (const [entity, event] of engine.getEntitiesWith(InteractionEvent)) {
  handleFeed()
  InteractionEvent.deleteFrom(entity)
}
```

**Better:**

```typescript
// Direct call when input happens
if (clickedEntity === foodBowl) {
  petAction('feed')
}
```

### 2. Flatten the Component Hierarchy

**Current:**

```typescript
const petComp = PetComponent.getMutable(entity)
const personality = PersonalityComponent.get(entity)
const bond = BondComponent.getMutable(entity)
const hygiene = HygieneComponent.getMutable(entity)
```

**Better:**

```typescript
const pet = getPet() // Returns the one pet object
pet.stats.mood += 10
pet.stats.bond += 5
```

---

---

---

---

---

### 3. Remove Behavior State Machine Complexity

Your `behaviorSystem` has 14 behavior states:

```typescript
enum BehaviorState {
  IDLE,
  SEEKING_FOOD,
  SEEKING_FOOD_WAITING,
  SEEKING_FOOD_SITTING,
  SEEKING_BATH,
  SEEKING_PREFERRED,
  APPROACHING_PLAYER,
  WANDERING,
  SITTING,
  WAITING_AT_STATION,
  POOPING,
  LOOKING_AT_PET,
  FOLLOWING_PET,
  LOOKING_AT_PLAYER
}
```

**Simplify to 4:**

```typescript
type BehaviorState = 'idle' | 'walking' | 'sitting' | 'sleeping'
```

The pet either:

- Stands around (idle)
- Walks to a target (walking)
- Sits at a station (sitting)
- Sleeps in bed (sleeping)

---

---

---

---

---

### 4. One File for All UI

Merge `NamingUI.tsx`, `StatsUI.tsx`, `VisitUI.tsx`, `LeaderboardUI.tsx`, `QuestUI.tsx` into one `ui.tsx`:

```typescript
// ui.tsx
export function GameUI() {
  return (
    <>
      {showNaming && <NamingDialog />}
      {showStats && <StatsPanel />}
      {showVisit && <VisitPanel />}
      {showLeaderboard && <LeaderboardPanel />}
      {showQuests && <QuestsPanel />}
    </>
  )
}
```

---

## Success Metrics

| Metric                         | Current   | Target     |
| ------------------------------ | --------- | ---------- |
| Source files                   | 50+       | ~10        |
| Lines of code                  | 8000+     | ~3000      |
| Files to touch for new feature | 5-6       | 1-2        |
| Time to understand codebase    | 2 days    | 2 hours    |
| Time to add new interaction    | 2-3 hours | 15 minutes |

---

## Summary

Your code is **technically impressive** but **practically difficult**. It uses advanced patterns (ECS, event systems, factories) that add complexity without adding value for a game this size.

**The fix is not to add more abstraction—it's to remove abstraction.**

1. **One pet object** instead of 6+ components
2. **One petAction() function** instead of scattered handlers
3. **One updatePet() function** instead of 8+ systems
4. **Direct function calls** instead of event components

The result: Code that anyone can read, understand, and extend in minutes instead of hours.

---

## Quick Start

If you want to start simplifying today:

1. Create `src/pet.ts` with the `PetData` interface
2. Add `petAction()` with your existing interactions
3. Have `Logic.ts` call `petAction()` instead of individual handlers
4. See how much simpler debugging becomes

Once you're comfortable, gradually move more logic into `pet.ts` until `Logic.ts` becomes unnecessary.
