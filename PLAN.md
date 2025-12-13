# Holo Pet: GLB Model Integration Plan

## 🎯 Overview

Replace current 3D placeholders with new Entites defined in assets/scene/entity-names.ts while maintaining the existing ECS architecture. All models are pre-placed in the scene editor and just need interaction components attached.

## 📋 Current State Analysis

- **Permanent Environment**: Console + Button_1-3 are always visible (no phase changes)
- **Pre-placed Entities**: Bed, Egg, Food Bowl, Bath Tub, Decoration are positioned in scene with GLB models (Entites already setup)
- **Missing Interactions**: Entities exist but lack click handlers and pointer events
- **Pet Model**: Currently uses `BlockDog.glb`, will be replaced with Tiger model for all pet types
  - Entity: `engine.getEntityOrNullByName(EntityNames.Tiger)`
- **Poop System**: Uses brown spheres, will use pre-placed Poop_1-7 entities
- **Ball**: Keep existing sphere renderer (no GLTF available)

## 🛠️ Implementation Plan

### Phase 1: Core Model Updates

#### 1.1 Update Pet Factory (`src/factories/Pet.ts`)

- **Task**: Replace Dog Entity with Tiger model for all pet types
- **Entity**: engine.getEntityOrNullByName(EntityNames.Tiger)
- **Change**:

```typescript
// Replace BlockDog with Tiger model
engine.getEntityOrNullByName(EntityNames.Food_Bowl)
```

- **Rationale**: Use Tiger model for all pets until proper dog/cat/dragon models are available

#### 1.2 Update Poop Pool (`src/factories/PoopPool.ts`)

- **Task**: Replace brown sphere placeholders with poop Entites
- **File**: `src/factories/PoopPool.ts` (lines 46-52)
- **Change**:

```typescript
// Replace sphere with entity

 engine.getEntityOrNullByName(EntityNames.Poop_1)
 …
 engine.getEntityOrNullByName(EntityNames.Poop_7)

// Remove MeshRenderer and Material components
```

- **Rationale**: Maintains existing pooling system but with proper 3D model

### Phase 2: Pre-placed Entity Interactions

#### 2.1 Add Food Bowl Interactions (`src/factories/Environment.ts`)

- **Task**: Attach interaction components to existing Food Bowl entity
- **File**: `src/factories/Environment.ts`
- **Change**: Modify `createFoodBowl()` to:
  - Get entity by name: `engine.getEntityOrNullByName(EntityNames.Food_Bowl)`
  - Skip Transform/GLTF creation (already exists)
  - Add `Interactable` and `PointerEvents` components
  - Keep existing scale/position
- **Rationale**: Entity is pre-placed with GLTF, just needs interaction logic

#### 2.2 Add Egg Interactions (`src/factories/Pet.ts`)

- **Task**: Attach interaction components to existing Egg entity
- **File**: `src/factories/Pet.ts`
- **Change**: Modify `createEgg()` to:
  - Get entity by name: `engine.getEntityOrNullByName(EntityNames.Egg)`
  - Skip Transform/GLTF creation (already exists)
  - Add `Interactable` and `PointerEvents` components
  - Remove sphere renderer/material
- **Rationale**: Entity is pre-placed with GLTF, just needs interaction logic

#### 2.3 Add Bed Interactions (`src/factories/Environment.ts`)

- **Task**: Attach interaction components to existing Bed entity
- **File**: `src/factories/Environment.ts`
- **Change**: Add new `createBed()` function:
  - Get entity by name: `engine.getEntityOrNullByName(EntityNames.Bed)`
  - Add `Interactable` (SLEEP) and `PointerEvents` components
- **Rationale**: Bed entity exists, needs sleep interaction

#### 2.4 Add Bath Tub Interactions (`src/factories/Environment.ts`)

- **Task**: Attach interaction components to existing Bath Tub entity
- **File**: `src/factories/Environment.ts`
- **Change**: Add new `createBathTub()` function:
  - Get entity by name: `engine.getEntityOrNullByName(EntityNames.Bath_Tub)`
  - Add `Interactable` (BATH) and `PointerEvents` components
- **Rationale**: Bath tub entity exists, needs bathing interaction

### Phase 3: Visibility Management

#### 3.1 Create Visibility Component (`src/components/Visibility.ts`)

- **Task**: Add standardized visibility component
- **File**: `src/components/Visibility.ts` (new)
- **Schema**:

```typescript
export const VisibilityComponent = engine.defineComponent('VisibilityComponent', {
  isVisible: Schemas.Boolean // Controls visibility state
})
```

- **Rationale**: Standardize visibility management across entities

#### 3.2 Update Environment Creation (`src/factories/Environment.ts`)

- **Task**: Attach VisibilityComponent to pre-placed entities
- **File**: `src/factories/Environment.ts`
- **Change**: In `createPetEnvironment()`:
  - Attach `VisibilityComponent` to Food Bowl, Bed, Bath Tub entities
  - Set `isVisible: true` by default (they should be visible in PET phase)
- **Rationale**: Enable visibility control for phase transitions

#### 3.3 Update Game Phase Transitions (`src/systems/GameState.ts`)

- **Task**: Control entity visibility based on game phase
- **File**: `src/systems/GameState.ts`
- **Change**: Add `updateEntityVisibilityForPhase()` function:
  - EGG phase: Show Egg, hide PET entities (Food Bowl, Bed, Bath Tub, Decoration)
  - PET phase: Hide Egg, show PET entities
- **Rationale**: Proper phase-based entity visibility

### Phase 4: Documentation Updates

#### 4.1 Update Architecture Docs (`docs/4_ARCHITECTURE_crystal.md`)

- **Task**: Document new entity management approach
- **File**: `docs/4_ARCHITECTURE_crystal.md`
- **Change**: Add "Entity Management" section with:
  - **Permanent Environment**: Console + Button_1-3 (always visible from start, no phase changes)
  - **Pre-placed Strategy**: All entities positioned in scene editor, code only attaches interactions
  - **Conditional Entities**: Egg, Food Bowl, Bed, Bath Tub, Decoration (visibility controlled by phase)
  - **Dynamic Pooling**: Poop_1-7 entities managed by pooling system
  - **No Creation/Destruction**: All entities exist from scene start, only visibility changes
  - **Entity Categories**:
    - Permanent: Console, Buttons (environment backdrop)
    - Conditional: Egg/PET entities (phase-dependent)
    - Dynamic: Poop entities (system-managed pooling)

#### 4.2 Update Entity Names Comments (`assets/scene/entity-names.ts`)

- **Task**: Update comments to reflect permanent vs conditional entities
- **File**: `assets/scene/entity-names.ts`
- **Change**: Add comprehensive documentation:
  - **PERMANENT ENVIRONMENT** (always visible): Console, Button_1-3
  - **EGG PHASE ENTITIES** (visible only during egg phase): Egg
  - **PET PHASE ENTITIES** (visible only during pet phase): Food Bowl, Bed, Bath Tub, Decoration
  - **DYNAMIC POOL** (managed by systems): Poop_1-7 (pooled entities)
- **Change**: Update enum comments to reflect current usage and GLB models

## 🎯 Implementation Priority

1. **Phase 1**: Core model replacements (Pet, Poop) - Highest impact
2. **Phase 2**: Entity interactions - Makes models functional
3. **Phase 3**: Visibility management - Phase transitions work correctly
4. **Phase 4**: Documentation - Future maintenance

## 🧪 Testing Checklist

### Visual Tests

- [ ] Pet shows Tiger model instead of BlockDog
- [ ] Poop shows GLB model instead of brown spheres
- [ ] Egg shows GLB model instead of blue sphere
- [ ] Food Bowl shows GLB model (already does)
- [ ] Bed shows GLB model (already does)
- [ ] Bath Tub shows GLB model (already does)

### Interaction Tests

- [ ] Clicking Egg triggers hatch (EGG phase only)
- [ ] Clicking Food Bowl triggers feed action
- [ ] Clicking Bed triggers sleep action
- [ ] Clicking Bath Tub triggers bath action
- [ ] Poop collection works with GLB model

### Phase Transition Tests

- [ ] EGG phase: Only Egg visible, PET entities hidden
- [ ] PET phase: Egg hidden, PET entities visible
- [ ] Phase transitions work smoothly

### Performance Tests

- [ ] No performance degradation with GLB models
- [ ] Entity pooling still works for poop
- [ ] Memory usage remains stable

## ⚠️ Important Notes

- **No Position Changes**: All entities are pre-placed correctly in scene editor
- **Keep Existing Logic**: Only add missing interaction components, don't replace working systems
- **Ball Unchanged**: Keep sphere renderer for play interaction (no GLTF available)
- **Visibility**: Don't move entities below ground - they're already invisible when needed
- **Tiger Model**: Use for all pet species until proper models are available

## 🔍 Review Points

- [ ] Entity names match scene editor exactly
- [ ] No breaking changes to existing systems
- [ ] Visibility logic doesn't conflict with existing behavior
- [ ] Performance impact is minimal
- [ ] Documentation accurately reflects implementation

---

**Ready for Implementation Review** ✅
