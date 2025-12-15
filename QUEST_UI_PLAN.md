# Quest UI Replication Plan

## Overview

This plan details the replication of the quest UI system from the old version (`src_OLD_AGENT_IGNORE`) into the new modular architecture. The old system featured a sophisticated daily quest tracking UI with animations and progressive quest unlocking.

## Current State Analysis

- **Old System**: Full-featured quest UI with animations, state management, and visual feedback
- **New System**: Basic placeholder QuestUI, functional QuestModule with logic but minimal UI

## Key Components to Implement

### 1. Quest UI State Management

**File**: `src/ui/Quest.tsx`

#### QuestDisplayData Interface

```typescript
interface QuestDisplayData {
  petName: string
  quests: {
    text: string
    completed: boolean
    isActive: boolean
  }[]
}
```

#### Functions to Implement

- `updateQuestData()`: Updates cached quest data from QuestModule state
- `getActiveQuestIndex()`: Determines which quest is currently active (first incomplete)

### 2. Quest Row Component

**Component**: `QuestRow`

#### Visual Elements

- **Status Square**: 16px (inactive) or 20px (active) colored square
  - Gray (`Color4.create(0.6, 0.6, 0.6, 1)`) for incomplete
  - Green (`Color4.create(0.2, 0.8, 0.2, 1)`) for completed
- **Quest Text**: Label with dynamic sizing and opacity
  - 14px font for inactive quests (50% opacity)
  - 16px font for active quest (100% opacity)

#### Layout

- Row height: 32px (inactive) or 40px (active)
- Horizontal layout: [Status Square] [Quest Text]
- 10px margin between square and text

### 3. Quest Completion States

#### Quest Types & Logic

1. **Feed Quest**: Always available first quest

   - Threshold: `hunger < 20`
   - Text: "Feed {petName}"

2. **Play Quest**: Unlocks after Feed completion

   - Threshold: `mood > 50 && energy < 30`
   - Text: "Play"

3. **Bath Quest**: Unlocks after Feed + Play completion

   - Threshold: `hygiene.cleanliness > 70`
   - Text: "Bath"

4. **Bedtime Quest**: Unlocks after all previous quests
   - No threshold (manual completion)
   - Text: "Bedtime"

#### All Complete State

- Shows "All Done!" message in green
- "Come back tomorrow" subtitle in gray
- Centered in 60px height container

### 4. Quest UI Panel Structure

#### Panel Properties

- **Position**: `position: { top: 10, right: 10 }`
- **Size**: `width: 220px`, dynamic height
- **Background**: White with 95% opacity
- **Border Radius**: 12px

#### Header

- "Daily Quests" title
- 14px font, dark gray text
- 8px bottom margin

#### Content Area

- Either quest rows OR all-complete message
- 8px left/right padding
- 4px bottom margin between rows

### 5. Animation System Integration

**File**: `src/ui/QuestAnimations.ts` (new)

#### Animation Phases

1. **Pulse Phase** (0.4s): Square scales 1.0 → 1.2 → 1.0
2. **Slide Out Phase** (0.4s): Completed row fades and slides up (-20px)
3. **Slide In Phase** (0.4s): Next quest scales up and fades in

#### Animation Triggers

- Called when `QuestModule.completeQuest()` is invoked
- Animation state managed per quest index (0=feed, 1=play, 2=bath, 3=bedtime)

#### Animation State Interface

```typescript
interface AnimationState {
  questIndex: number
  phase: 'pulse' | 'slideOut' | 'slideIn' | 'idle'
  elapsedTime: number
  startValues: { scale: number; opacity: number; yOffset: number }
  targetValues: { scale: number; opacity: number; yOffset: number }
}
```

### 6. Integration Points

#### QuestModule Integration

- `QuestUI` reads from `game.modules.find(m => m.name === 'Quest')` (QuestModule instance)
- `getQuestState()` method provides current completion status
- `checkQuestCompletion()` triggers UI updates

#### Constants Integration

**File**: `src/utils/constants.ts`

Add quest UI constants:

```typescript
// Quest UI Constants
export const QUEST_UI_BG_COLOR = Color4.create(1, 1, 1, 0.95)
export const QUEST_UI_TEXT_COLOR = Color4.create(0.3, 0.3, 0.3, 1)
export const QUEST_UI_SQUARE_INACTIVE = Color4.create(0.6, 0.6, 0.6, 1)
export const QUEST_UI_SQUARE_COMPLETE = Color4.create(0.2, 0.8, 0.2, 1)
export const QUEST_UI_PANEL_WIDTH = 220
export const QUEST_UI_BORDER_RADIUS = 12

// Animation Constants
export const QUEST_ANIMATION_DURATION = 0.4 // seconds
export const QUEST_PULSE_SCALE = 1.2
export const QUEST_SLIDE_DISTANCE = -20
```

### 7. Implementation Order

1. **Phase 1**: Core UI Structure

   - Implement `QuestDisplayData` interface and state management
   - Create `QuestRow` component with visual styling
   - Implement all-complete message component

2. **Phase 2**: Quest Logic Integration

   - Connect to `QuestModule.getQuestState()`
   - Implement quest progression logic (active quest determination)
   - Add pet name integration

3. **Phase 3**: Visual Polish

   - Add status squares with proper coloring
   - Implement active quest highlighting (size/opacity)
   - Style panel with proper positioning and background

4. **Phase 4**: Animation System

   - Create `QuestAnimations.ts` with animation state management
   - Implement pulse, slide-out, slide-in phases
   - Integrate animation triggers with quest completion

5. **Phase 5**: Testing & Refinement
   - Test all quest completion scenarios
   - Verify animation timing and smoothness
   - Ensure proper state updates and UI responsiveness

### 8. File Structure Changes

```
src/
├── ui/
│   ├── Quest.tsx (enhanced)
│   └── QuestAnimations.ts (new)
├── modules/
│   └── Quest.ts (existing - add UI integration hooks)
├── utils/
│   └── constants.ts (add quest UI constants)
```

### 9. Dependencies & Requirements

#### External Dependencies

- ReactEcs for UI rendering
- Color4 for color definitions
- Game module access for quest state

#### Internal Dependencies

- QuestModule for quest state data
- Constants for UI/animation values
- Pet identity for personalized quest text

### 10. Success Criteria

- [ ] Quest UI panel appears in top-right when pet exists
- [ ] Quest rows show with proper status squares (gray/green)
- [ ] Active quest is visually highlighted (larger, full opacity)
- [ ] Quest completion triggers visual feedback
- [ ] All quests complete shows "All Done!" message
- [ ] Daily reset properly updates UI state
- [ ] Animations play smoothly on quest completion
- [ ] UI integrates seamlessly with existing quest logic

## Notes

- Maintain backward compatibility with existing QuestModule logic
- Use existing color scheme and styling patterns
- Ensure UI is performant and doesn't impact game framerate
- Consider mobile/tablet responsiveness (though primarily desktop-focused)
- Animation system should be optional - disable if performance issues arise
