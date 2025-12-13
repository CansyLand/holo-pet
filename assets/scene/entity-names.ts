// Auto-generated entity names from the scene

/**
 * Entity Management Categories:
 *
 * PERMANENT ENVIRONMENT (always visible from start, no phase changes):
 * - Console: Tech environment centerpiece
 * - Button_1-3: Interactive buttons for UI controls
 *
 * EGG PHASE ENTITIES (visible only during egg phase):
 * - Egg: Holographic egg that hatches into pet
 *
 * PET PHASE ENTITIES (visible only during pet phase, visibility controlled by VisibilityComponent):
 * - Food_Bowl: Food bowl for feeding pet (GLB model)
 * - Bed: Bed for putting pet to sleep (GLB model)
 * - Bath_Tub: Bath tub for cleaning pet (GLB model)
 * - Decoration: Environmental decoration (GLB model)
 * - Tiger: Pet model (GLB model, replaces BlockDog)
 *
 * DYNAMIC POOL (managed by systems, visibility controlled by pooling):
 * - Poop_1-7: Pooled poop entities (GLB models, managed by PoopPool system)
 * - Poop_Collection: Collection point/area (may be unused)
 */

/**
 * Object containing all entity names in the scene for autocomplete support.
 * All entities are pre-placed in scene editor and managed by code.
 */
export enum EntityNames {
  // PERMANENT ENVIRONMENT - Always visible
  Console = 'Console',
  Button_1 = 'Button_1',
  Button_2 = 'Button_2',
  Button_3 = 'Button_3',

  // EGG PHASE ENTITIES - Visible only during egg phase
  Egg = 'Egg',

  // PET PHASE ENTITIES - Visible only during pet phase (VisibilityComponent controlled)
  Food_Bowl = 'Food Bowl', // GLB model - feeding station
  Bed = 'Bed', // GLB model - sleep station
  Bath_Tub = 'Bath Tub', // GLB model - bathing station
  Decoration = 'Decoration', // GLB model - environmental decoration
  Tiger = 'Tiger', // GLB model - pet model (replaces BlockDog)

  // DYNAMIC POOL - Managed by pooling systems
  Poop_Collection = 'Poop Collection', // Collection area (may be unused)
  Poop_1 = 'Poop_1', // GLB model - pooled poop entity
  Poop_2 = 'Poop_2', // GLB model - pooled poop entity
  Poop_3 = 'Poop_3', // GLB model - pooled poop entity
  Poop_4 = 'Poop_4', // GLB model - pooled poop entity
  Poop_5 = 'Poop_5', // GLB model - pooled poop entity
  Poop_6 = 'Poop_6', // GLB model - pooled poop entity
  Poop_7 = 'Poop_7' // GLB model - pooled poop entity
}
