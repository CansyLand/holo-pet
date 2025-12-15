# Food Bowl Drinking Interaction Implementation Plan

## Overview

Implement a new interaction where clicking the food bowl makes the pet walk to it, play a drinking animation for 7 seconds, then actually feed the pet. This replaces the current immediate feeding behavior.

## Current State Analysis

- **FoodBowl.ts**: Currently calls `game.feedPet()` immediately on click
- **Pet.ts**: Has state machine with SEEKING_FOOD state that moves pet to bowl
- **Animation System**: Uses `Animator.playSingleAnimation()` for animations
- **State Duration**: Uses 8-15 second random durations, but drinking needs fixed 7 seconds

## Implementation Steps

### 1. Add DRINKING_FROM_BOWL State

**File**: `src/Pet.ts`
**Location**: PetState enum (line ~33)
**Change**: Add new state `DRINKING_FROM_BOWL = 'drinking_from_bowl'` after SEEKING_FOOD

### 2. Modify Food Bowl Click Handler

**File**: `src/modules/FoodBowl.ts`
**Methods to modify**:

- `onClick()`: Change from immediate feeding to triggering pet drinking
- Add `triggerPetToDrink()` method to initiate the drinking sequence

### 3. Add Drinking Animation Support

**File**: `src/Pet.ts`
**Location**: PetModule.setupPetEntity() (line ~898)
**Change**: Add 'Drinking' animation clip to the Animator.create() states array

### 4. Implement Drinking Logic in Activity Execution

**File**: `src/Pet.ts`
**Location**: executeCurrentActivity() method (line ~286)
**Change**: Add DRINKING_FROM_BOWL case that:

- Moves pet towards food bowl if not arrived
- Plays drinking animation once arrived
- Waits exactly 7 seconds then feeds pet and returns to idle

### 5. Add Helper Methods

**File**: `src/Pet.ts`
**New methods**:

- `startDrinkingFromBowl()`: Public method to initiate drinking state
- `playDrinkingAnimation()`: Play drinking animation with fallback
- `finishDrinking()`: Handle feeding, particles, and state transition

## Detailed Code Changes

### Step 1: PetState Enum

```typescript
export enum PetState {
  IDLE = 'idle',
  EATING = 'eating',
  SLEEPING = 'sleeping',
  SAD = 'sad',
  WANDERING = 'wandering',
  SEEKING_FOOD = 'seeking_food',
  DRINKING_FROM_BOWL = 'drinking_from_bowl', // NEW
  SEEKING_BATH = 'seeking_bath'
  // ... rest unchanged
}
```

### Step 2: FoodBowl Click Handler

```typescript
onClick() {
  console.log('🍽️ Food bowl clicked - pet will walk to drink')
  this.triggerPetToDrink()
}

private triggerPetToDrink() {
  if (!game.state.pet) return
  game.state.pet.startDrinkingFromBowl()
  console.log('🍽️ Pet triggered to drink from bowl')
}
```

### Step 3: Animator Setup

```typescript
Animator.create(this.petEntity, {
  states: [
    { clip: 'Idle', playing: true, loop: true },
    { clip: 'Walking', playing: false, loop: true },
    { clip: 'Sitting', playing: false, loop: true },
    { clip: 'Standing', playing: false, loop: false },
    { clip: 'Drinking', playing: false, loop: false } // NEW
  ]
})
```

### Step 4: Activity Execution Logic

```typescript
case PetState.DRINKING_FROM_BOWL:
  // Move towards food bowl if not already there
  const arrivedAtBowl = this.moveTowardsFoodBowl(dt)

  if (arrivedAtBowl) {
    // Arrived at bowl - play drinking animation
    this.playDrinkingAnimation()

    // Check if drinking time is up (7 seconds)
    const timeInDrinkingState = Date.now() - this.data.stateStartTime
    if (timeInDrinkingState >= 7000) { // 7 seconds
      this.finishDrinking()
    }
  }
  break
```

### Step 5: Helper Methods

```typescript
startDrinkingFromBowl() {
  this.changeState(PetState.DRINKING_FROM_BOWL)
  console.log('🐾 Pet starting to drink from bowl')
}

playDrinkingAnimation() {
  if (!this.entity) return
  try {
    Animator.playSingleAnimation(this.entity, 'Drinking')
    console.log('🥤 Playing drinking animation')
  } catch (error) {
    console.log('🥤 Drinking animation not available, using idle')
    this.playIdleAnimation()
  }
}

finishDrinking() {
  // Actually feed the pet (reduce hunger, boost stats)
  this.feed()

  // Spawn food particles for visual feedback
  const particleModule = game.getModuleSafe('Particle') as any
  if (particleModule) {
    const bowlPos = this.getStationPosition(EntityNames.Food_Bowl)
    if (bowlPos && this.entity) {
      particleModule.spawnParticles(this.entity, 'green')
    }
  }

  // Return to idle after drinking
  this.changeState(PetState.IDLE)
  console.log('🥤 Pet finished drinking from bowl')
}
```

## Testing Checklist

- [ ] Click food bowl → pet walks toward bowl
- [ ] Pet arrives at bowl → drinking animation plays
- [ ] Animation plays for exactly 7 seconds
- [ ] After 7 seconds → pet gets fed (hunger reduced, particles spawn)
- [ ] Pet returns to idle state
- [ ] 15-second activity timer still works for other behaviors
- [ ] Multiple clicks don't interrupt drinking sequence

## Dependencies

- 3D model must have 'Drinking' animation clip
- Existing movement system (`moveTowardsFoodBowl`)
- Existing particle system for visual feedback
- Existing feeding logic (`feed()` method)

## Edge Cases to Handle

- What if pet is already drinking and food bowl is clicked again?
- What if player moves away while pet is drinking?
- What if drinking animation doesn't exist in model?
- What if food bowl entity doesn't exist?

## Success Criteria

- Pet walks to food bowl when clicked
- Drinking animation plays for exactly 7 seconds
- Pet gets fed after drinking completes
- Visual feedback (particles) still works
- Existing 15-second activity timer behavior preserved
- No breaking changes to other pet interactions
