Open Discord

======= ENVIRONMENT SYSTEM - COMPLETED ✅ (UPDATED)
COMPLETED: Unified Visibility & Collision Management System (src/factories/Environment.ts)

- **MAJOR REFACTOR**: Replaced scattered visibility functions with unified `setEntityInteractive()` system
- **Atomic Operations**: Visibility, collision, and interaction changes happen together (no forgotten aspects)
- **Centralized State**: `ENTITY_GROUPS` defines all entity groupings in one place
- **Environment Manager**: `switchEnvironment('egg'|'pet'|'reset')` replaces individual visibility calls
- **Collision Safety**: Invisible entities have `CL_NONE` collision masks to prevent phantom interactions
- **PointerEvents Management**: Automatically removes/creates PointerEvents based on interactive state
- **Component Safety**: Uses `createOrReplace()` to handle reset scenarios and prevent conflicts
- **Entity Groups**:
  - Always Visible: Console, Button_1, Button_2, Button_3
  - Egg State: Egg
  - Pet State: Tiger, Bed, Bath_Tub, Decoration, Food_Bowl, Ball
  - Dynamic: Poops (managed by Poop.ts)
- **Debug Tools**: Console commands `debugShowEgg()`, `debugShowPet()`, `debugReset()` for testing
- **Performance**: Proper collision disabling improves rendering performance
- **Maintainable**: Single source of truth for all visibility logic

**Key Functions:**

- `setEntityInteractive(entity, visible, interactive)` - Unified visibility/collision/interaction management
- `switchEnvironment(state)` - Environment state manager
- `setupAlwaysVisibleEntities()` - Console/buttons setup
- `setupEggEntities()` - Egg environment + hiding pet entities
- `setupPetEntities()` - Interactive pet entities setup

**Migration Summary (v1.0 → v2.0):**

- ✅ **Removed**: `setEntityVisibility()`, `setOptimizedVisibility()`, `showEggEnvironment()`, `showPetEnvironment()`, `updateEntityVisibilityForPhase()`
- ✅ **Added**: `setEntityInteractive()`, `switchEnvironment()`, `ENTITY_GROUPS` constant
- ✅ **Changed**: Poop entities use `createOrReplace()` for components
- ✅ **Fixed**: 8+ critical bugs in visibility/collision management
- ✅ **Performance**: Improved collision optimization for invisible entities

======= CODE????
change color -> egg, hologram,

play ball

mini games - pet- brush - feed?

======= BLENDER

pet texture hearts, hunger, stink
Symbols. hunger, stink

======== AUDIO

audo effects

Make UI Look good

=====

photobooth, photo mode image selsection + poses 🤔

visit a friends pet - merge holopets

scene Image

======

crypto middleware / security

Analytics with dashboard on my website

=====

show UI under pet camera that says pet type,name an XP
What kind of pet is this?

- ask prompt?

=======
FIXED: Save game after pet naming (prevents data loss)
FIXED: Handle server validation rejections in UI (shows error messages for invalid names)
FIXED: Removed emojis from UI components (Decentraland compatibility)
FIXED: Removed Random name button from naming UI (requires explicit name entry)
FIXED: Improved profane name error message (shows "Try a different name" instead of generic network error) - handles signedFetch exceptions for 4xx responses
