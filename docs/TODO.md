Open Discord

======= ENVIRONMENT SYSTEM - COMPLETED ✅
COMPLETED: Simplified Environment Factory with Collision Optimization & Player Safety (src/factories/Environment.ts)

- Removed complex theme system and color management
- Implemented visibility-based entity management (never create/destroy entities)
- Environment system ONLY handles visibility - no creation/destruction of entities
- Added COLLISION OPTIMIZATION: Invisible entities disable collision detection for performance
- GLTF entities use visibleMeshesCollisionMask, MeshCollider entities use collisionMask
- Added PLAYER COLLISION PREVENTION: Automatically pushes player 1m away if stuck in spawned entities
- Uses movePlayerTo() from RestrictedActions for safe player repositioning
- Added state-based functions: setupAlwaysVisibleEntities(), setupEggEntities(), setupPetEntities()
- Added state management: showEggEnvironment(), showPetEnvironment(), resetEnvironment()
- Added safety checks to prevent duplicate component creation
- Added poop hiding functions to ensure poops are hidden in egg state
- Added debug console functions: debugShowEgg(), debugShowPet(), debugReset()
- Updated all visibility systems (Environment, Poop, Logic) for collision optimization
- FIXED: Reset game no longer removes pet entities - entities are non-destructible and only hidden
- FIXED: Pet running away now hides pet instead of removing it - maintains non-destructible principle
- FIXED: Pet creation now uses createOrReplace for all components - handles persistent entities correctly
- FIXED: Scene editor collision masks now properly overridden - invisible entities have CL_NONE collision
- FIXED: PointerLock component duplicate creation prevented with existence check
- All entities are pre-placed in scene editor and managed via VisibilityComponent

Always Visible: Console, Button_1, Button_2, Button_3
Egg State: Egg
Pet State: Tiger, Bed, Poop_Collection, Bath_Tub, Decoration, Food_Bowl

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
