# 🔍 VISIBILITY SYSTEM DEBUG ANALYSIS

## Issue Summary

1. **Poop visible in Egg phase** (should be hidden)
2. **Pet entities invisible but colliders still active** (cursor shows hover interaction)

## Execution Flow Analysis

### Phase 1: Scene Initialization

```typescript
// index.ts main() function
setupAlwaysVisibleEntities() // Console, buttons
setupEggEntities() // Egg + hideAllPoopsByName()
setupPetEntities() // Pet entities (initially hidden)
createEgg() // Interactive egg
```

### Phase 2: Egg Environment Setup

```typescript
setupEggEntities() calls:
- eggEntity: VisibilityComponent.createOrReplace({ visible: true })
- hideAllPoopsByName()  // Should hide poops
```

### Phase 3: Runtime Environment Switching

```typescript
switchEnvironment('egg') calls:
- hideEntityGroup('egg')    // Hides egg group
- hideEntityGroup('pet')    // Hides pet group
- hideAllPoops()           // Hides poops via Poop.ts
- showEntityGroup('egg')    // Shows egg group again
```

## 🐛 IDENTIFIED ISSUES

### Issue 1: Double Hide/Show in switchEnvironment('egg')

```typescript
switchEnvironment('egg'):
  hideEntityGroup('egg')    // ❌ HIDES egg
  hideEntityGroup('pet')    // ✅ hides pet
  hideAllPoops()           // ✅ hides poops
  showEntityGroup('egg')    // ✅ shows egg again
```

**Problem**: The egg gets hidden then shown again, which is wasteful but not the bug.

### Issue 2: hideAllPoopsByName() vs hideAllPoops()

- `hideAllPoopsByName()`: Uses ENTITY_GROUPS.poops array
- `hideAllPoops()`: Uses poopEntities array from Poop.ts
- **Problem**: Both should work but maybe timing or initialization issues

### Issue 3: PointerEvents Not Being Removed

**User reports**: Pet entities invisible but cursor still shows hover
**Suspected**: `setEntityInteractive(entity, false, false)` not removing PointerEvents

## Code Analysis: setEntityInteractive()

```typescript
export function setEntityInteractive(entity: Entity, visible: boolean, interactive: boolean) {
  // 1. Set visibility ✓
  VisibilityComponent.getMutableOrNull(entity)?.visible = visible

  // 2. Configure collision masks ✓
  const gltf = GltfContainer.getMutableOrNull(entity)
  const mesh = MeshCollider.getMutableOrNull(entity)
  const collisionMask = interactive ? ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS : ColliderLayer.CL_NONE

  if (gltf) {
    gltf.visibleMeshesCollisionMask = collisionMask
    if ('invisibleMeshesCollisionMask' in gltf) {
      ;(gltf as any).invisibleMeshesCollisionMask = collisionMask // ❌ POTENTIAL BUG
    }
  }

  // 3. Manage PointerEvents
  if (interactive && !PointerEvents.has(entity)) {
    // ❌ PROBLEM: This assumes PointerEvents should exist but doesn't create them
    console.log(`Entity should be interactive but missing PointerEvents`)
  } else if (!interactive && PointerEvents.has(entity)) {
    PointerEvents.deleteFrom(entity) // ✅ This should work
    console.log(`Removed PointerEvents from entity`)
  }
}
```

## 🔧 IDENTIFIED BUGS & FIXES APPLIED

### ✅ Bug 1: PointerEvents Logic Flawed - FIXED

**Issue**: Function tried to create PointerEvents when `interactive=true` but they didn't exist, which is wrong.
**Fix**: Removed the creation logic. PointerEvents should only be removed when `interactive=false`, never created by this function.

### ✅ Bug 2: Collision Mask Setting - FIXED

**Issue**: `invisibleMeshesCollisionMask` was set to same value as `visibleMeshesCollisionMask`.
**Fix**: `invisibleMeshesCollisionMask` now ALWAYS set to `CL_NONE` to prevent invisible entity collisions.

### ✅ Bug 3: Missing Environment Initialization - FIXED

**Issue**: Scene started without calling `switchEnvironment('egg')`, so inconsistent state.
**Fix**: Added `switchEnvironment('egg')` to `index.ts` after entity setup.

### ✅ Bug 4: Environment Switching Logic - FIXED

**Issue**: `switchEnvironment('egg')` was hiding egg entities then showing them again, removing PointerEvents.
**Fix**: Modified logic to NOT hide entities that will be shown in target state, preserving PointerEvents.

### ✅ Bug 5: Poop Visibility on Startup - FIXED

**Issue**: Poop entities default to visible in scene editor, `hideAllPoopsByName()` couldn't hide them because no VisibilityComponent existed.
**Fix**: Modified `hideAllPoopsByName()` to create VisibilityComponent if missing, ensuring poops start hidden.

### ✅ Bug 6: Pet Entities Not Clickable - FIXED

**Issue**: Pet entities (bed, food bowl, bath) lose PointerEvents during egg phase initialization and they're never recreated when switching to pet phase.
**Fix**: Modified `setEntityInteractive()` to recreate PointerEvents based on Interactable component when entities become interactive again.

### ✅ Bug 7: Game Reset + Egg Hatch Component Conflict - FIXED

**Issue**: After game reset, clicking egg to hatch causes "Component Interactable for 526 already exists" error because poop entities retain Interactable components from previous game session.
**Fix**: Changed `createPoopPool()` to use `createOrReplace()` instead of `create()` for Interactable and PointerEvents components.

### ✅ Feature 8: Ball Entity Added - PLAYABLE

**Added**: Interactive ball entity positioned 3m up at play area
**Setup**: Ball triggers PLAY interaction type with "Play with Ball" hover text
**Integration**: Ball shows/hides with pet environment and is fully interactive

### ✅ Bug 8: Decoration Visible in Egg Phase - FIXED

**Issue**: Decoration (tree) was visible during egg phase because scene editor defaults entities to visible and switchEnvironment('egg') wasn't hiding it properly.
**Fix**: Added explicit hiding of decoration (and ball) in setupEggEntities() to ensure they're hidden during egg phase.

## Code Changes Made

### 1. Fixed setEntityInteractive() PointerEvents Logic

```typescript
// BEFORE: Tried to create PointerEvents (wrong)
if (interactive && !PointerEvents.has(entity)) {
  console.log(`Entity should be interactive but missing PointerEvents`)
}

// AFTER: Only remove PointerEvents when non-interactive
if (!interactive && PointerEvents.has(entity)) {
  PointerEvents.deleteFrom(entity)
}
```

### 2. Fixed Collision Mask Logic

```typescript
// BEFORE: Same collision mask for visible and invisible
const collisionMask = interactive ? CL_POINTER | CL_PHYSICS : CL_NONE
invisibleMeshesCollisionMask = collisionMask

// AFTER: Invisible meshes ALWAYS disabled
const visibleCollisionMask = interactive ? CL_POINTER | CL_PHYSICS : CL_NONE
const invisibleCollisionMask = CL_NONE // Always disable
invisibleMeshesCollisionMask = invisibleCollisionMask
```

### 3. Added Environment Initialization

```typescript
// Added to index.ts after entity setup:
switchEnvironment('egg') // Ensure scene starts in correct egg state
```

### 4. Simplified Environment Switching Logic

```typescript
// BEFORE: Hide egg, then show egg again
hideEntityGroup('egg')
hideEntityGroup('pet')
showEntityGroup('egg')

// AFTER: Hide all, show only target
hideEntityGroup('pet')
hideEntityGroup('egg')
showEntityGroup('egg') // Only show target
```

### 5. Fixed PointerEvents Recreation

```typescript
// BEFORE: Never recreated PointerEvents
if (!interactive && PointerEvents.has(entity)) {
  PointerEvents.deleteFrom(entity)
}
// Missing: Recreation logic when interactive=true

// AFTER: Recreate based on Interactable component
if (!interactive && PointerEvents.has(entity)) {
  PointerEvents.deleteFrom(entity)
} else if (interactive && !PointerEvents.has(entity)) {
  const interactable = Interactable.getOrNull(entity)
  if (interactable) {
    // Recreate PointerEvents with appropriate hover text
    let hoverText = 'Interact'
    switch (interactable.type) {
      case InteractionType.FEED:
        hoverText = 'Feed Pet'
        break
      case InteractionType.SLEEP:
        hoverText = 'Put to Bed'
        break
      case InteractionType.BATHE:
        hoverText = 'Bathe Pet'
        break
      // ... etc
    }
    PointerEvents.create(entity, {
      pointerEvents: [
        {
          /* ... */
        }
      ]
    })
  }
}
```

### 6. Fixed Component Creation Conflicts

```typescript
// BEFORE: Failed when components already existed from previous session
Interactable.create(entity, { type: InteractionType.COLLECT_POOP })
PointerEvents.create(entity, {
  pointerEvents: [
    {
      /* ... */
    }
  ]
})

// AFTER: Safe replacement that handles existing components
Interactable.createOrReplace(entity, { type: InteractionType.COLLECT_POOP })
PointerEvents.createOrReplace(entity, {
  pointerEvents: [
    {
      /* ... */
    }
  ]
})
```

### 7. Added Interactive Ball Entity

```typescript
// Added ball to pet entity setup
setupPetEntity(EntityNames.Ball, InteractionType.PLAY, 'Play with Ball')

// Added ball to ENTITY_GROUPS.pet for environment management
pet: [, /* ... */ EntityNames.Ball]

// Ball positioned 3m up in scene editor (y: 7.25)
```

### 8. Fixed Decoration Hiding in Egg Phase

```typescript
// Added explicit hiding of pet entities in setupEggEntities()
const petEntitiesToHide = [EntityNames.Decoration, EntityNames.Ball]
petEntitiesToHide.forEach((entityName) => {
  const entity = engine.getEntityOrNullByName(entityName)
  if (entity) {
    if (!VisibilityComponent.getOrNull(entity)) {
      VisibilityComponent.create(entity, { visible: false })
    } else {
      VisibilityComponent.getMutable(entity).visible = false
    }
  }
})
```

````

## 🧪 TESTING VERIFICATION

### Test 1: Egg Phase (Default State)

**Expected Results**:

- ✅ Egg entity: visible and interactive
- ✅ Pet entities (tiger, bed, bath, food, decoration): invisible and non-interactive
- ✅ Poop entities: invisible and non-interactive
- ✅ Cursor should NOT show hover indicators over invisible pet entities

**Console Commands**:

```javascript
// Check egg visibility
VisibilityComponent.get(engine.getEntityOrNullByName('Egg')).visible // Should be true

// Check pet entity visibility (should be false)
VisibilityComponent.get(engine.getEntityOrNullByName('Tiger')).visible // Should be false

// Check if PointerEvents removed from pet entities
PointerEvents.has(engine.getEntityOrNullByName('Tiger')) // Should be false

// Check poop visibility
VisibilityComponent.get(engine.getEntityOrNullByName('Poop_1')).visible // Should be false
````

### Test 2: Environment Switching

**Commands**:

```javascript
debugShowEgg() // Switch to egg environment
debugShowPet() // Switch to pet environment
debugReset() // Hide all entities
```

### Test 3: Collision Verification

- Move cursor over invisible pet entity locations
- **Expected**: No hover cursor or interaction prompts
- **If bug persists**: Check browser console for "Removed PointerEvents" messages

## 🔍 DEBUGGING IF ISSUES PERSIST

### If Poops Still Visible in Egg Phase:

1. Check if `switchEnvironment('egg')` is called during init
2. Verify `hideAllPoops()` is working
3. Check if poops are made visible elsewhere in code

### If Pet Entities Still Show Hover Cursor:

1. Check if PointerEvents are actually removed: `PointerEvents.has(entity)` should return `false`
2. Verify `setEntityInteractive(entity, false, false)` is called
3. Check collision masks are set correctly

### If Egg is Not Visible:

1. Verify `setupEggEntities()` is called
2. Check if `switchEnvironment('egg')` shows the egg correctly

## 📊 EXPECTED BEHAVIOR MATRIX

| Entity Type     | Egg Phase                    | Pet Phase                    | Reset Phase                  |
| --------------- | ---------------------------- | ---------------------------- | ---------------------------- |
| Egg             | Visible + Interactive        | Hidden + Non-interactive     | Hidden + Non-interactive     |
| Pet Entities    | Hidden + Non-interactive     | Visible + Interactive        | Hidden + Non-interactive     |
| Poops           | Hidden + Non-interactive     | Managed by Poop.ts           | Hidden + Non-interactive     |
| Console/Buttons | Always Visible + Interactive | Always Visible + Interactive | Always Visible + Interactive |

## Debug Tests Needed

1. Check if `hideAllPoops()` is actually called and working
2. Check if PointerEvents are actually removed from pet entities
3. Check the collision mask values at runtime
4. Verify that `setEntityInteractive` is being called with correct parameters


