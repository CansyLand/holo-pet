# Holo Pet Persistence System Implementation Plan

## Overview

Restore the missing persistence functionality by implementing save triggers throughout the game. The current version has all the API functions but never calls them.

## Core Functions Needed (Lookup)

### 1. Persistence System (`src/services/Persistence.ts`)

**Core Functions:**

- `initPersistence()` - Initialize persistence on game start
- `triggerSave()` - Immediate save of current pet state
- `persistenceSystem(dt)` - Handle failed save retries
- `shutdownPersistence()` - Cleanup on game end

**State Variables:**

- `isSaving` - Prevent concurrent saves
- `lastSaveTime` - Track last successful save
- `lastRetryTime` - Track failed save retry attempts
- `currentPetMeta` - Store latest server-calculated meta data

### 2. Enhanced Game.ts Functions

**New/Updated Functions:**

- `savePetData()` - Save current pet data with error handling
- `loadSavedPet()` - Enhanced with proper error handling (already exists)
- `onSceneExit()` - Trigger save when player leaves scene
- `onPlayerDisconnect()` - Emergency save on disconnect

### 3. Enhanced Naming System (`src/ui/Naming.tsx`)

**New Functions:**

- `savePetAfterNaming()` - Save pet data after successful naming
- Error handling for save failures during naming
- Loading states during save operations

### 4. Quest System Save Triggers (`src/modules/Quest.ts`)

**New Functions:**

- `triggerQuestSave()` - Save after quest completion
- `triggerQuestResetSave()` - Save after daily quest reset
- `saveQuestProgress()` - Save quest state changes

### 5. Pet Care Action Save Triggers

**Functions to add to care modules:**

- `Bath.ts` - `saveAfterBath()`
- `FoodBowl.ts` - `saveAfterFeed()`
- `Bed.ts` - `saveAfterSleep()`
- `Ball.ts` - `saveAfterPlay()`

### 6. Enhanced Serialization (`src/persistence/serialization.ts`)

**New Functions:**

- `serializePetForSave(pet, existingMeta)` - Enhanced serialization with meta preservation
- `updatePetMetaFromServer()` - Update local meta with server response

## Save Trigger Points

### 1. Pet Naming (`src/ui/Naming.tsx`)

```typescript
// After player enters name and clicks "Name Pet"
await savePetAfterNaming(petName)
// Only close UI after successful save
```

### 2. Quest Completions (`src/modules/Quest.ts`)

```typescript
// After each quest completion
completeQuest(questType) {
  // Mark quest complete
  // Award XP
  triggerQuestSave() // NEW: Save immediately
}
```

### 3. Daily Quest Reset (`src/modules/Quest.ts`)

```typescript
// After resetting quests for new day
resetDailyQuests() {
  // Reset all quests to incomplete
  triggerQuestResetSave() // NEW: Save reset state
}
```

### 4. Pet Care Actions (Various modules)

```typescript
// After feeding pet
handleFeed() {
  // Update hunger/mood
  // Check quest completion
  saveAfterFeed() // NEW: Save after feeding
}

// After playing with pet
handlePlay() {
  // Update mood/energy/hunger
  // Make pet dirty
  saveAfterPlay() // NEW: Save after playing
}

// After bathing pet
handleBath() {
  // Clean pet, boost mood
  saveAfterBath() // NEW: Save after bathing
}

// After putting pet to bed
handleSleep() {
  // Start sleeping state
  saveAfterSleep() // NEW: Save after sleep command
}
```

### 5. Scene Transitions (`src/Game.ts`)

```typescript
// When player leaves scene boundary
onLeaveScene() {
  triggerSave() // Emergency save
}

// When player disconnects (browser close/network)
onPlayerDisconnected() {
  triggerSave() // Emergency save
}
```

### 6. Game State Changes (`src/Game.ts`)

```typescript
// After hatching new pet
hatchEgg() {
  // Create pet
  // Show naming UI (which will save)
}

// After pet dies/resets
resetPet() {
  // Reset to egg phase
  saveAfterReset() // NEW: Save reset state
}
```

## Implementation Steps

### Phase 1: Core Persistence System

1. Create `src/services/Persistence.ts` with core functions
2. Add `initPersistence()` and `triggerSave()` functions
3. Implement retry logic for failed saves

### Phase 2: Naming Save Integration

1. Update `src/ui/Naming.tsx` to call save after naming
2. Add error handling and loading states
3. Test naming → save → close UI flow

### Phase 3: Quest Save Integration

1. Update `src/modules/Quest.ts` to trigger saves on completion
2. Add save triggers for daily resets
3. Test quest completion → save flow

### Phase 4: Care Action Save Integration

1. Add save triggers to Bath, FoodBowl, Bed, Ball modules
2. Update interaction handlers to call save functions
3. Test each care action → save flow

### Phase 5: Scene Exit Save Integration

1. Add scene exit/disconnect handlers in `src/Game.ts`
2. Integrate with persistence system
3. Test scene exit → automatic save

### Phase 6: Game Initialization Updates

1. Initialize persistence system in `src/index.ts`
2. Update `src/Game.ts` to use persistence system
3. Add cleanup on game end

### Phase 7: Testing & Validation

1. Test complete save/load cycle
2. Test error handling for network failures
3. Test data integrity across restarts
4. Performance testing for save frequency

## Data Flow Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Game Events   │ -> │  Save Triggers   │ -> │  Persistence    │
│                 │    │                  │    │   System        │
│ • Pet Naming    │    │ • triggerSave()  │    │                 │
│ • Quest Complete│    │ • Error Handling │    │ • serializePet()│
│ • Care Actions  │    │ • Retry Logic    │    │ • savePet()     │
│ • Scene Exit    │    │                  │    │ • API Calls     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        v
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Firebase      │    │   Server-side    │    │   Database      │
│   Functions     │    │   Validation     │    │   Storage       │
│                 │    │                  │    │                 │
│ • Signed Auth   │    │ • Score Calc     │    │ • Pet Data      │
│ • Data Storage  │    │ • Streak Tracking│    │ • Leaderboard   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Error Handling Strategy

### Save Failure Scenarios:

1. **Network Timeout** - Retry after delay
2. **Server Validation Error** - Show user-friendly message
3. **Invalid Data** - Log error, don't retry
4. **Wallet Disconnect** - Queue save until reconnect

### User Feedback:

- Loading indicators during saves
- Error messages for failed saves
- Retry notifications for recoverable errors
- Offline mode indicators

## Performance Considerations

### Save Frequency:

- **Immediate saves** for important events (naming, quest completion)
- **Scene exit saves** for data protection
- **No auto-save** to avoid performance impact
- **Retry delays** to prevent spam

### Data Size:

- Only serialize active pet data
- Preserve server-calculated meta fields
- Compress data if needed (future optimization)

## Migration from Old System

### Key Changes:

- **Modular Architecture** - Save triggers distributed across modules
- **Error Handling** - Better user feedback on save failures
- **Retry Logic** - Automatic retry for failed saves
- **Meta Preservation** - Maintain server-calculated fields

### Compatibility:

- Same API endpoints and data structures
- Enhanced serialization with meta preservation
- Backward compatible with existing saved data

## Testing Checklist

### Unit Tests:

- [ ] Serialization functions work correctly
- [ ] Save API calls handle all error cases
- [ ] Retry logic works as expected
- [ ] Meta data preservation

### Integration Tests:

- [ ] Pet naming saves successfully
- [ ] Quest completions trigger saves
- [ ] Care actions save progress
- [ ] Scene exit saves work
- [ ] Load/save cycle preserves data

### End-to-End Tests:

- [ ] Complete game flow: hatch → name → care → quest → save → restart → load
- [ ] Error scenarios: network failure, invalid data, server errors
- [ ] Performance: save frequency doesn't impact gameplay
- [ ] Data integrity: no data loss across sessions

## Dependencies

### Existing Files to Modify:

- `src/Game.ts` - Add save triggers and persistence integration
- `src/ui/Naming.tsx` - Add save after naming
- `src/modules/Quest.ts` - Add quest save triggers
- `src/modules/Bath.ts` - Add bath save trigger
- `src/modules/FoodBowl.ts` - Add feed save trigger
- `src/modules/Bed.ts` - Add sleep save trigger
- `src/modules/Ball.ts` - Add play save trigger
- `src/index.ts` - Initialize persistence system

### New Files to Create:

- `src/services/Persistence.ts` - Core persistence system

### Existing Files (No Changes):

- `src/persistence/api.ts` - API functions already exist
- `src/persistence/serialization.ts` - Serialization functions exist
- `src/utils/constants.ts` - Constants already defined
