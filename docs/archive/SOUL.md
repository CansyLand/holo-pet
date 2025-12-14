# Holo Pet: The "Soul" Architecture

Building on the Crystal architecture, this document introduces the **Personality System** and **Tamagotchi Mechanics** - giving pets unique personalities, care requirements, and meaningful player-pet relationships.

## 💫 Core Philosophy: Living Companions

Pets are no longer simple state machines. They have:

- **Personality** - Unique traits that affect behavior and needs
- **Relationships** - A bond that grows with care and decays with neglect
- **Needs** - Hunger, cleanliness, and the call of nature
- **Autonomy** - Movement and behavior driven by personality and state

> **Core Promise:** Your pet feels alive. Neglect has consequences. Care builds trust.

---

## 📖 Terminology

### Stats

| Stat            | Type         | Decay      | Description                                       |
| --------------- | ------------ | ---------- | ------------------------------------------------- |
| **Mood**        | Temporary    | Yes (fast) | Current happiness, affected by all needs          |
| **Bond**        | Relationship | Yes (slow) | Trust level with owner. At 0: pet runs away       |
| **Hunger**      | Need         | Grows      | Increases over time, reduced by feeding           |
| **Cleanliness** | Need         | Decays     | Decreases over time, restored by bathing/brushing |

### Trust Levels (Bond Thresholds)

| Level          | Bond Range | Visual Cue                            |
| -------------- | ---------- | ------------------------------------- |
| `stranger`     | 0-20       | Pet avoids player                     |
| `acquaintance` | 21-40      | Pet tolerates player                  |
| `friend`       | 41-60      | Pet approaches player                 |
| `bonded`       | 61-80      | Pet follows player, occasional hearts |
| `soulmate`     | 81-100     | Constant hearts, special animations   |

### Personality Traits

Generated at hatch, permanent for the pet's lifetime (0-100 scale):

| Trait         | High Value Effect                         | Low Value Effect                   |
| ------------- | ----------------------------------------- | ---------------------------------- |
| `energy`      | Moves more, hunger grows faster           | Lazy, hunger grows slower          |
| `sociability` | Seeks player, big mood boost from petting | Independent, smaller petting boost |
| `cleanliness` | Gets dirty faster, hates being dirty      | Tolerates dirt, slower decay       |
| `appetite`    | Gets hungry faster, loves food            | Eats less, smaller food boost      |

---

## 🧩 Components

### A. Pet Identity (`PetIdentityComponent`)

```typescript
name: string // Player-given name after hatch
hatchedAt: number // Unix timestamp
ownerId: string // Wallet address for persistence
```

### B. Personality (`PersonalityComponent`)

```typescript
energy: number // 0-100, affects movement and hunger rate
sociability: number // 0-100, affects player-seeking and petting boost
cleanliness: number // 0-100, affects dirt rate and dirt penalty
appetite: number // 0-100, affects hunger rate and food boost
```

### C. Bond (`BondComponent`)

```typescript
bond: number // 0-100, relationship level
trustLevel: string // 'stranger' | 'acquaintance' | 'friend' | 'bonded' | 'soulmate'
lastVisitTime: number // Timestamp of last player interaction
```

**Key Mechanic:** Bond decays when player is absent. If bond reaches 0, pet runs away (game over state).

### D. Hygiene (`HygieneComponent`)

```typescript
cleanliness: number // 0-100, current cleanliness level
lastBathTime: number // Timestamp
lastBrushTime: number // Timestamp
```

### E. Poop (`PoopComponent`) - Entity Pooling Pattern

```typescript
isActive: boolean // false = pooled/hidden, true = visible
spawnedAt: number // When this poop appeared
poolIndex: number // Index in pre-allocated pool (0-9)
```

**Entity Pooling:** Pre-create 7 poop entities at scene load. Never create/destroy - visibility managed by `VisibilityComponent` synced with `isActive` state.

---

## ⚙️ Systems

### A. `BehaviorSystem` - Personality-Driven Movement

The pet autonomously moves based on personality traits and current needs:

```
Priority Order:
1. Hungry > 70 → Walk to food bowl, sit and wait
2. Cleanliness < 40 → Walk toward bathtub
3. Needs to poop → Find spot, sit, spawn poop
4. Player nearby + sociability > 50 → Approach player
5. Idle too long + energy > 50 → Random wander
6. Default → Idle animation
```

Movement speed and decision frequency modified by `energy` trait.

### B. `PoopSystem` - Entity Pool Management

```
Every POOP_INTERVAL seconds:
  If hunger > 30 AND random chance:
    Find inactive poop entity from pool
    Set isActive = true
    Position behind pet
    Play pet sitting animation

Every frame:
  Sync VisibilityComponent.visible with PoopComponent.isActive

On COLLECT_POOP interaction:
  Set isActive = false
  VisibilityComponent handles hiding automatically
  Boost mood
```

### C. `HygieneSystem` - Cleanliness Decay

```
Every HYGIENE_INTERVAL seconds:
  cleanliness -= HYGIENE_DECAY_RATE * (personality.cleanliness / 50)

  If cleanliness < 40:
    Show stink visual effect
    Apply mood penalty

  If cleanliness < 20:
    Show flies visual effect
```

### D. `BondSystem` - Relationship Management

```
On any player interaction:
  lastVisitTime = now()
  bond += INTERACTION_BOND_BOOST

Every BOND_CHECK_INTERVAL:
  timeSinceVisit = now() - lastVisitTime

  If timeSinceVisit > ABANDON_THRESHOLD:
    bond -= BOND_DECAY_RATE

  If bond <= 0:
    Trigger PET_RAN_AWAY state (game over)

  Update trustLevel based on bond thresholds
```

---

## 🎨 Visual Feedback (No UI Bars)

All pet states are communicated through visual cues in the game world:

| State      | Visual Cue           | Implementation                     |
| ---------- | -------------------- | ---------------------------------- |
| Dirty      | Stink lines + flies  | GLB animation attached to pet      |
| High Bond  | Hearts floating      | Particle system / animated sprites |
| Hungry     | Sits at food bowl    | BehaviorSystem navigation          |
| Needs Bath | Walks to bathtub     | BehaviorSystem navigation          |
| Pooping    | Sits down            | Animation + poop spawn             |
| Happy      | Wagging tail, bouncy | Animation state                    |
| Sad        | Droopy, slow         | Animation state                    |
| Ran Away   | Empty scene          | Pet entity removed                 |

---

## 🔄 Interactions

### Extended `InteractionType` Enum

```typescript
export enum InteractionType {
  // Existing
  PET = 'pet',
  FEED = 'feed',
  PLAY = 'play',
  CLEAN = 'clean',
  HATCH = 'hatch',
  CLOSE_MENU = 'close_menu',

  // New
  BATHE = 'bathe',
  BRUSH = 'brush',
  GIVE_TREAT = 'give_treat',
  COLLECT_POOP = 'collect_poop',
  NAME_PET = 'name_pet'
}
```

### Interaction Effects

| Action       | Hunger | Cleanliness | Mood | Bond | Notes                   |
| ------------ | ------ | ----------- | ---- | ---- | ----------------------- |
| Feed (bowl)  | -30    | -           | +5   | +2   | Healthy                 |
| Give Treat   | -10    | -           | +15  | +5   | Less healthy, more love |
| Pet          | -      | -           | +10  | +3   | Boosted by sociability  |
| Play         | +5     | -5          | +15  | +3   | Makes hungry and dirty  |
| Bathe        | -      | +50         | +10  | +2   | Full bath               |
| Brush        | -      | +20         | +5   | +1   | Quick groom             |
| Collect Poop | -      | +5          | +10  | +1   | Per poop collected      |

---

## 🏗️ Factories

### A. `PoopPool.ts` - Entity Pooling

```typescript
const POOP_POOL_SIZE = 7 // Matches pre-placed entities Poop_1-7

function createPoopPool(): Entity {
  // Get pre-placed poop entities from scene editor
  const poopEntityNames = [
    EntityNames.Poop_1,
    EntityNames.Poop_2,
    EntityNames.Poop_3,
    EntityNames.Poop_4,
    EntityNames.Poop_5,
    EntityNames.Poop_6,
    EntityNames.Poop_7
  ]

  for (let i = 0; i < POOP_POOL_SIZE; i++) {
    const entity = engine.getEntityOrNullByName(poopEntityNames[i])
    if (!entity) continue

    PoopComponent.create(entity, { isActive: false, poolIndex: i })
    VisibilityComponent.create(entity, { visible: false }) // Start hidden
    Interactable.create(entity, { type: InteractionType.COLLECT_POOP })
  }
}
```

### B. `Station.ts` - Care Stations

Creates interactive stations in the pet environment:

- **Food Bowl** - Already exists, add `Interactable` with `FEED` type
- **Treat Dispenser** - New, `GIVE_TREAT` interaction
- **Bathtub** - New, `BATHE` interaction when pet is inside
- **Grooming Brush** - New, `BRUSH` interaction

---

## 🏷️ Pet Naming

After hatch, show a text input popup:

```typescript
// Using DCL UI system
function showNamingPopup(petEntity: Entity) {
  // Create UI with text input
  // On submit: PetIdentityComponent.name = inputValue
  // Close popup and start game
}
```

---

## 📊 Constants

```typescript
// Personality Generation
export const PERSONALITY_MIN = 20
export const PERSONALITY_MAX = 80

// Bond System
export const BOND_DECAY_RATE = 5 // Per check interval when abandoned
export const ABANDON_THRESHOLD = 86400 // 24 hours in seconds
export const BOND_CHECK_INTERVAL = 60 // Check every minute

// Trust Level Thresholds
export const TRUST_STRANGER = 20
export const TRUST_ACQUAINTANCE = 40
export const TRUST_FRIEND = 60
export const TRUST_BONDED = 80

// Hygiene System
export const HYGIENE_DECAY_RATE = 2
export const HYGIENE_INTERVAL = 30 // Seconds between decay
export const DIRTY_THRESHOLD = 40 // Show stink effect
export const FILTHY_THRESHOLD = 20 // Show flies

// Poop System
export const POOP_POOL_SIZE = 7 // Matches pre-placed Poop_1-7 entities
export const POOP_INTERVAL = 120 // Seconds between poop chances
export const POOP_CHANCE = 0.3 // 30% chance per interval
export const POOP_MOOD_PENALTY = 5 // Per active poop

// Interaction Boosts
export const TREAT_HUNGER_REDUCTION = 10
export const TREAT_MOOD_BOOST = 15
export const TREAT_BOND_BOOST = 5
export const BATHE_CLEANLINESS_BOOST = 50
export const BATHE_MOOD_BOOST = 10
export const BRUSH_CLEANLINESS_BOOST = 20
export const BRUSH_MOOD_BOOST = 5
export const COLLECT_POOP_MOOD_BOOST = 10
export const COLLECT_POOP_CLEANLINESS_BOOST = 5
```

---

## 📁 File Structure

```text
src/
├── components/
│   ├── GameState.ts      # (existing)
│   ├── Pet.ts            # MODIFY: Add PetIdentityComponent
│   ├── Personality.ts    # NEW: PersonalityComponent, BondComponent
│   ├── Hygiene.ts        # NEW: HygieneComponent
│   ├── Poop.ts           # NEW: PoopComponent
│   ├── Scene.ts          # (existing)
│   ├── Interaction.ts    # MODIFY: Add new interaction types
│   └── UIState.ts        # (existing)
├── systems/
│   ├── Behavior.ts       # NEW: Personality-driven movement
│   ├── Bond.ts           # NEW: Bond decay and runaway
│   ├── Hygiene.ts        # NEW: Cleanliness decay
│   ├── Poop.ts           # NEW: Poop pool management
│   ├── Logic.ts          # MODIFY: Handle new interactions
│   ├── Time.ts           # (existing)
│   └── ...
├── factories/
│   ├── Pet.ts            # MODIFY: Generate personality at hatch
│   ├── PoopPool.ts       # NEW: Pre-allocate poop entities
│   ├── Station.ts        # NEW: Care station entities
│   └── ...
└── utils/
    ├── constants.ts      # MODIFY: Add new constants
    └── ...
```

---

## 🔀 Migration from Crystal

1. **Phase 1:** Add new components (Personality, Bond, Hygiene, Poop)
2. **Phase 2:** Implement new systems (Behavior, Bond, Hygiene, Poop)
3. **Phase 3:** Create factories (PoopPool, Station)
4. **Phase 4:** Update Logic system for new interactions
5. **Phase 5:** Add pet naming UI
6. **Phase 6:** Add visual feedback (stink, hearts, flies)

---

## 💾 Persistence

Pet data is persisted across sessions using Firebase (Firestore + Cloud Functions). For full implementation details, see [6_ARCHITECTURE_persistence.md](6_ARCHITECTURE_persistence.md).

### Persisted vs Transient Data

| Component              | Persisted | Notes                              |
| ---------------------- | --------- | ---------------------------------- |
| `PetIdentityComponent` | Yes       | Name, hatch time, owner wallet     |
| `PetComponent`         | Yes       | Mood, hunger, energy, state        |
| `PersonalityComponent` | Yes       | Generated once, never changes      |
| `BondComponent`        | Yes       | Bond level, trust, last visit time |
| `HygieneComponent`     | Yes       | Cleanliness, bath/brush timestamps |
| `PoopComponent`        | Partial   | Only `activePoopCount` saved       |
| `MenuStateComponent`   | No        | UI state is always fresh           |
| `CameraFocusComponent` | No        | Camera state resets on load        |

### Key Concepts

- **Wallet = Identity**: Player's Ethereum wallet address identifies their pet
- **One Pet Per Wallet**: Simplifies data model, one document per player
- **Server-Side Storage**: Firestore stores data securely via Cloud Functions
- **Signed Requests**: DCL's `signedFetch` ensures wallet ownership

### Save/Load Triggers

| Trigger            | Action                                 |
| ------------------ | -------------------------------------- |
| Scene enter        | Load pet data (skip egg if pet exists) |
| Player interaction | Debounced save (5 second window)       |
| Scene exit         | Immediate save                         |
| Periodic           | Auto-save every 60 seconds             |

---

## 🏆 Design Decisions

- **Entity Pooling for Poop:** Prevents hitting entity limits, better performance
- **No UI Bars:** Visual feedback creates more immersive experience
- **Bond Decay:** Creates urgency to return, emotional stakes
- **Personality Permanence:** Each pet is unique, encourages attachment
- **Trust Levels:** Progressive relationship building with visible milestones
- **Server-Authoritative Persistence:** Prevents cheating, enables cross-device play
