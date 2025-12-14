# Holo Pet: The "Multiplayer" Architecture

Building on the Soul architecture, this document defines the **Multiplayer Visit System** - enabling social interactions between players and their pets while maintaining privacy and performance.

## 🌐 Core Philosophy: Private by Default, Social by Choice

Players maintain privacy by default while having meaningful social interactions:

- **Privacy First**: Players and pets are hidden from others unless explicitly visiting
- **Visit-Based Social**: Players can visit each other's pets, seeing both player and pet
- **Pet-to-Pet Interactions**: Pets can interact with other visible pets (looking, following)
- **Performance Conscious**: Only sync entities when they need to be visible
- **MessageBus Coordination**: Use Decentraland's MessageBus for reliable cross-player communication

> **Core Promise:** Players can enjoy their pets privately, but also share and visit friends socially. Pets become social creatures that can interact with each other.

---

## 📖 Terminology

### Visit States

| State        | Description                  | Avatar Visibility       | Pet Visibility             | UI Elements                         |
| ------------ | ---------------------------- | ----------------------- | -------------------------- | ----------------------------------- |
| **Solo**     | Player alone with their pet  | Only self visible       | Only own pet visible       | "Visit Players" button              |
| **Visiting** | Player visiting someone else | Self + host visible     | Own + host pets visible    | "Visit Players" + "Go Home" buttons |
| **Host**     | Someone visiting the player  | Self + visitors visible | Own + visitor pets visible | No special UI                       |

### Visit Roles

| Role         | Description                       | Permissions                                  |
| ------------ | --------------------------------- | -------------------------------------------- |
| **Visitor**  | Player who initiated the visit    | Can pet host's pet, cannot use stations      |
| **Host**     | Player being visited              | Full control, can use all stations           |
| **Observer** | Additional players in group visit | Can pet any visible pet, cannot use stations |

### Sync States

| Entity Type  | Sync Condition                      | Sync Components                                         |
| ------------ | ----------------------------------- | ------------------------------------------------------- |
| **Pets**     | Only when owner is visiting/hosting | Transform, Animator, PetComponent, PetIdentityComponent |
| **Players**  | Controlled by AvatarModifierArea    | N/A (handled by DCL)                                    |
| **Stations** | Never synced                        | N/A (local only)                                        |
| **UI**       | Never synced                        | N/A (local only)                                        |

---

## 🧩 Components

### A. Multiplayer Components

#### VisitStateComponent

```typescript
// Tracks local player's visit state (NOT synced)
export const VisitStateComponent = engine.defineComponent('VisitStateComponent', {
  isVisiting: Schemas.Boolean, // Currently visiting someone
  hostUserId: Schemas.String, // Wallet of player being visited
  visiblePlayerIds: Schemas.Array(Schemas.String), // Players visible to us
  visiblePetCount: Schemas.Number // Performance tracking (max 3)
})
```

#### AvatarModifierComponent

```typescript
// Marks the avatar modifier area entity
export const AvatarModifierComponent = engine.defineComponent('AvatarModifierComponent', {
  isInitialized: Schemas.Boolean
})
```

### B. Enhanced PetIdentityComponent

```typescript
// Enhanced with ownerId for multiplayer matching
export const PetIdentityComponent = engine.defineComponent('PetIdentityComponent', {
  name: Schemas.String,
  hatchedAt: Schemas.Number,
  ownerId: Schemas.String // Wallet address - CRITICAL for multiplayer
})
```

---

## ⚙️ Systems

### A. Visit System (Core Coordination)

**Purpose**: Manages visit lifecycle and player/pet visibility coordination

#### Key Functions:

- `visitPlayer(hostUserId)`: Start visiting another player
- `goHome()`: Return to solo mode
- `handleVisitRequest()`: Process incoming visit requests
- `handleVisitLeave()`: Process visitor departures

#### MessageBus Protocol:

```typescript
// Visit request from visitor to host
type VisitRequestMessage = {
  visitorId: string // Wallet of visitor
  hostId: string // Wallet of host
}

// Leave notification
type VisitLeaveMessage = {
  visitorId: string
  hostId: string
}
```

#### Visit Flow:

1. **Initiate Visit**: Visitor calls `visitPlayer()`, sends `visit_request`
2. **Host Response**: Host receives request, adds visitor to visible list, syncs their pet
3. **Visibility Update**: Both players update AvatarModifierArea excludeIds
4. **Pet Syncing**: Pets are synced only when they should be visible
5. **Leave Process**: Visitor calls `goHome()`, sends `visit_leave`, both update visibility

### B. Avatar Hider System

**Purpose**: Controls which player avatars are visible using AvatarModifierArea

#### Key Functions:

- `createAvatarHider()`: Creates scene-wide avatar modifier
- `updateVisiblePlayers(playerIds)`: Updates which players are visible
- `ensureLocalPlayerVisible()`: Always keeps local player visible
- `resetToSoloMode()`: Hides all players except self

#### Technical Details:

- Uses `AvatarModifierArea` with `AMT_HIDE_AVATARS` modifier
- `excludeIds` array controls which players are visible
- Always includes local player in excludeIds
- Covers entire scene (32x32 meters, 10 units high)

### C. Enhanced Behavior System

**Purpose**: Adds pet-to-pet and pet-to-player social interactions

#### New Behaviors:

```typescript
enum BehaviorState {
  // ... existing behaviors
  LOOKING_AT_PET = 'looking_at_pet', // Pet faces another pet
  FOLLOWING_PET = 'following_pet', // Pet follows another pet
  LOOKING_AT_PLAYER = 'looking_at_player' // Pet faces visible player
}
```

#### Behavior Priority (Enhanced):

1. **Critical Needs**: Hunger, bathroom (unchanged)
2. **Social Interactions**: Look at/follow nearby pets/players
3. **Player Attention**: Approach/follow owner (existing)
4. **Exploration**: Wander when bored (existing)

#### Social Behavior Logic:

- **Sociability Check**: Only social pets (sociability > 50) initiate interactions
- **Visibility Check**: Only interact with pets whose owners are visible
- **Distance Limits**: Only interact within PLAYER_PROXIMITY_RADIUS (8m)
- **Random Chance**: Adds natural variation to social behaviors

### D. Input System (Modified)

**Purpose**: Blocks station interactions when visiting

#### Interaction Blocking:

```typescript
const STATION_INTERACTIONS = [
  InteractionType.FEED,
  InteractionType.PLAY,
  InteractionType.CLEAN,
  InteractionType.BATHE,
  InteractionType.BRUSH,
  InteractionType.GIVE_TREAT,
  InteractionType.COLLECT_POOP
]

// Block station interactions when visiting
if (STATION_INTERACTIONS.includes(type) && isVisiting()) {
  console.log(`Interaction blocked while visiting: ${type}`)
  return // Don't process interaction
}
```

---

## 🚀 UI Components

### VisitUI Component

**State-Based UI**:

- **Solo Mode**: "Visit Players" button (bottom-left)
- **Visiting Mode**: "Visit Players" + "Go Home" buttons + status label

**Player Selection Popup**:

- Title: "Online Players"
- Scrollable list of players (excluding self)
- "Visit" buttons for each player
- Current host marked with "(visiting)" indicator
- Close button (X)

### Integration with CombinedUI:

```typescript
function CombinedUI() {
  return [NamingUI(), StatsUI(), VisitUI()]
}
```

---

## 📡 Network Architecture

### Sync Strategy: Conditional Syncing

**Philosophy**: Never sync entities by default. Only sync when visibility is required.

#### Pet Syncing Rules:

```typescript
// Pets are synced ONLY when:
1. Player is visiting someone (own pet visible to host)
2. Player is being visited (own pet visible to visitors)
3. Player is observing a group visit (can see all pets in visit)

// Pets remain synced even after visits end
// This prevents sync thrashing and is acceptable since
// visibility is controlled by the avatar modifier
```

#### Entity Sync IDs:

```typescript
// Use wallet address hash for consistent IDs across clients
function hashWalletToId(address: string): number {
  // Convert wallet to number in range 1-8000
  // Same wallet always gets same ID
}
```

### MessageBus Communication

**Reliability**: MessageBus ensures messages are delivered to all players in the scene
**Scope**: Messages are scene-local (not cross-scene)
**Timing**: Messages are processed in next frame, not synchronously

**Message Patterns**:

- **Visit Requests**: One-way, expect no response
- **Leave Notifications**: Informational, no response expected
- **State Sync**: Implicit through entity syncing

---

## 🎯 Interaction Rules

### When Visiting (Visitor Mode)

| Action                 | Allowed | Reason             |
| ---------------------- | ------- | ------------------ |
| **Pet other pets**     | ✅ Yes  | Social interaction |
| **Feed own pet**       | ❌ No   | Stations blocked   |
| **Use stations**       | ❌ No   | Stations blocked   |
| **See host player**    | ✅ Yes  | Avatar modifier    |
| **See other visitors** | ✅ Yes  | Avatar modifier    |
| **Pet own pet**        | ✅ Yes  | Always allowed     |

### When Hosting (Host Mode)

| Action               | Allowed | Reason           |
| -------------------- | ------- | ---------------- |
| **Use all stations** | ✅ Yes  | Full control     |
| **See visitors**     | ✅ Yes  | Avatar modifier  |
| **Pet any pet**      | ✅ Yes  | Host privileges  |
| **Initiate visits**  | ✅ Yes  | Can visit others |

### Pet-to-Pet Interactions

| Behavior           | Trigger                                  | Duration             |
| ------------------ | ---------------------------------------- | -------------------- |
| **Look at pet**    | Nearby pet + sociability > 50            | Until pet moves away |
| **Follow pet**     | Nearby pet + random chance               | 5-15 seconds         |
| **Look at player** | Nearby visible player + sociability > 70 | Until player moves   |

---

## 🏗️ File Structure

```
src/
├── components/
│   ├── Multiplayer.ts         # VisitState, AvatarModifier components
│   └── ...existing
├── systems/
│   ├── Visit.ts               # Visit coordination system
│   ├── Behavior.ts            # MODIFIED: Social behaviors
│   ├── Input.ts               # MODIFIED: Interaction blocking
│   └── ...existing
├── factories/
│   ├── AvatarHider.ts         # Avatar visibility control
│   ├── VisitUI.tsx           # Visit interface
│   └── ...existing
├── utils/
│   ├── players.ts             # Online player queries
│   └── ...existing
└── index.ts                   # MODIFIED: Visit system initialization
```

---

## 🔧 Implementation Details

### Initialization Order

```typescript
export function main() {
  // 1. Core systems
  // 2. Persistence
  // 3. Visit system (MessageBus setup)
  // 4. Avatar hider (visibility control)
  // 5. UI (including VisitUI)
  // 6. Scene setup
}
```

### Error Handling

- **Wallet Missing**: Visit system gracefully degrades
- **MessageBus Failures**: Logged, system continues
- **Sync Failures**: Pets remain local-only
- **Player Queries**: Handle empty results

### Performance Considerations

- **Pet Limit**: Max 3 visible pets per player
- **Sync Throttling**: Pets stay synced to prevent thrashing
- **Message Frequency**: Visit messages are rare (user-initiated)
- **UI Updates**: Only when visit state changes

---

## 🏆 Design Decisions

### Why AvatarModifierArea?

- **Scene-wide control**: Single entity controls all avatar visibility
- **DCL Native**: Uses official Decentraland APIs
- **Performance**: More efficient than per-player visibility toggles

### Why Conditional Pet Syncing?

- **Privacy**: Pets aren't visible to everyone by default
- **Performance**: Fewer synced entities when not needed
- **Complexity**: Avoided trying to hide already-synced entities

### Why MessageBus for Coordination?

- **Reliability**: DCL handles message delivery
- **Simplicity**: No server needed for basic coordination
- **Scope**: Perfect for scene-local social features

### Why Block Station Interactions?

- **Ownership**: Visitors shouldn't modify host's game state
- **Balance**: Prevents griefing and maintains host control
- **UX**: Clear distinction between visiting and playing

---

## 🧪 Testing Scenarios

### Basic Visit Flow

1. Player A has pet, Player B has egg
2. Player B sees "Visit Players" → opens player list
3. Player B selects Player A → sends visit request
4. Player A receives request, adds Player B to visible list
5. Both players see each other and pets
6. Player B can pet Player A's pet but not use stations
7. Player B clicks "Go Home" → visibility reset

### Group Visits

1. Player A visits Player B
2. Player C visits Player B
3. All three players visible to each other
4. Max 3 pets visible (performance limit)

### Pet Social Behaviors

1. Two pets in same visit space
2. High sociability pets look at/follow each other
3. Natural, randomized interactions

---

## 🚨 Known Limitations

### MessageBus Reliability

- Messages may be lost if players leave mid-visit
- No acknowledgment system (fire-and-forget)
- Race conditions possible during rapid visit/leave

### Pet Visibility

- Pets stay synced after visits (acceptable trade-off)
- No per-pet visibility control (all-or-nothing)
- Performance limit of 3 visible pets

### UI/UX

- No "decline visit" option (always accept)
- No persistent friend lists yet
- No cross-scene visiting

---

## 🔄 Future Extensions

### Friendship System

- Persistent friend lists in Firebase
- Mutual friendship requirements
- Always-visible friends (even when not visiting)

### Advanced Social Features

- Pet breeding between friends
- Shared mini-games
- Visit history and statistics

### Performance Optimizations

- Dynamic pet visibility (show/hide synced pets)
- Visit area zoning (only sync nearby players)
- MessageBus compression for complex interactions
