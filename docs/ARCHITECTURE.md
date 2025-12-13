# Holo Pet: The "Crystal" Architecture (Consensus)

Based on the analysis of Gemini, Claude, GPT-5.1, and Grok proposals, this architecture crystalizes the best practices into a cohesive, scalable, and Decentraland-native (SDK 7) approach.

## 💎 Core Philosophy: Data-Driven ECS

We reject the "God Object" (`GameManager` class) in favor of a **Pure ECS (Entity-Component-System)** approach.

- **Data is Truth:** The state of the game exists solely in **Components**.
- **Behavior is Logic:** **Systems** read components, perform logic, and update components.
- **Visuals are Reactive:** The view (meshes, UI, particles) updates _only_ when data changes.

### The "Holy Trinity" of Separation

1.  **Components (Data):** "What is this?" (e.g., `Mood`, `PetState`, `InteractionEvent`).
2.  **Systems (Logic):** "How does it behave?" (e.g., `DecaySystem`, `PetLogicSystem`).
3.  **Factories (Composition):** "How is it built?" (e.g., `createPet`, `createUI`).

---

## 📖 Terminology (Shared Vocabulary)

Use these terms when discussing game states and modes:

### Game Phases (`GameState.phase`)

| Phase        | Description                            | Scene Type |
| ------------ | -------------------------------------- | ---------- |
| **EGG**      | Initial state - egg on holographic pad | TECH       |
| **HATCHING** | Transition animation (egg cracking)    | TECH → PET |
| **PET**      | Pet has hatched, player can interact   | PET        |

### Interaction Modes (within PET phase)

| Mode           | Description                                             | `MenuStateComponent.isVisible` |
| -------------- | ------------------------------------------------------- | ------------------------------ |
| **Idle Mode**  | Normal gameplay - pet wanders, free camera              | `false`                        |
| **Focus Mode** | Player clicked pet - camera zooms, menu shows, pet sits | `true`                         |

**Focus Mode** includes:

- Camera attached to virtual camera (`MainCamera.virtualCameraEntity` set)
- Pet animation is "Sitting"
- Cursor unlocked for menu interaction
- 3D menu buttons visible

### Scene Types (`SceneElement.sceneType`)

| Type   | Description                             | When Active |
| ------ | --------------------------------------- | ----------- |
| `TECH` | Computers, holographic pad, digital lab | EGG phase   |
| `PET`  | Grass, bowls, toys, theme decorations   | PET phase   |

### Themes (`GameState.theme`)

Themes are **cosmetic variations** of the PET scene. They change colors and add decorations but don't affect gameplay.

| Theme       | Ground Color  | Decorations                | Calendar Period  | Snow |
| ----------- | ------------- | -------------------------- | ---------------- | ---- |
| `DEFAULT`   | Green grass   | Pink flower                | Spring (default) | ✅   |
| `CHRISTMAS` | White snow    | Tree, presents, gold star  | Dec 15-26        | ✅   |
| `NEW_YEAR`  | Light snow    | Disco ball, champagne, hat | Dec 27 - Jan 7   | ✅   |
| `SUMMER`    | Vibrant green | Beach umbrella, sunflower  | Jun 1 - Aug 31   | ❌   |
| `AUTUMN`    | Brown earth   | Pumpkin, leaves, bare tree | Sep 1 - Nov 14   | ❌   |

Theme selection uses UTC time so all players see the same environment globally.

**Manual Override:** Edit `THEME_OVERRIDE` in `src/utils/theme.ts` to force a specific theme during development.

**Snow Override:** Edit `SNOW_OVERRIDE` in `src/utils/constants.ts` to force snow on/off regardless of theme.

---

## 🏗️ Directory Structure

```text
src/
├── components/         # PURE DATA SCHEMAS
│   ├── GameState.ts    # Global state (phase, theme, activePet)
│   ├── Pet.ts          # Pet-specific data (Mood, Species)
│   ├── Scene.ts        # SceneElement tag for environment entities
│   ├── Interaction.ts  # InteractionEvent, Interactable
│   └── UIState.ts      # Menu state, mood bar, camera focus, animations
├── systems/            # PURE LOGIC FUNCTIONS
│   ├── Input.ts        # Captures clicks -> Adds InteractionEvent
│   ├── Logic.ts        # Consumes InteractionEvent -> Updates Data
│   ├── Time.ts         # Handles decay/growth over time
│   ├── CameraFocus.ts  # Manages cursor during Focus Mode
│   ├── Render.ts       # Syncs Visuals/UI to Data
│   └── Snow.ts         # Snow particle system (entity pooling)
├── factories/          # ENTITY CREATORS
│   ├── Game.ts         # Sets up global entities
│   ├── Environment.ts  # Creates TECH/PET scenes with themes
│   ├── Pet.ts          # Spawns Pet entities + meshes
│   ├── SnowPool.ts     # Creates 50 billboarded snow particles
│   └── UI.ts           # Spawns HUD/Menu, camera controls
├── utils/              # HELPERS & CONSTANTS
│   ├── constants.ts
│   ├── theme.ts        # UTC calendar + manual override for themes
│   └── types.ts
└── index.ts            # ENTRY POINT (Setup only)
```

## 🎯 Entity Management Strategy

### Pre-placed Entity Approach

**All entities are positioned in the scene editor** and just need interaction components attached by code:

- **Permanent Environment**: Console + Button_1-3 (always visible from start, no phase changes)
- **Pre-placed Strategy**: All entities positioned in scene editor, code only attaches interactions
- **Conditional Entities**: Egg, Food Bowl, Bed, Bath Tub, Decoration (visibility controlled by phase)
- **Simple Visibility**: Poop_1-7 entities with direct visibility control
- **No Creation/Destruction**: All entities exist from scene start, only visibility changes

### Entity Categories

| Category        | Entities                                  | Management                    | When Active          |
| --------------- | ----------------------------------------- | ----------------------------- | -------------------- |
| **Permanent**   | Console, Button_1-3                       | Always visible                | Environment backdrop |
| **Conditional** | Egg, Food Bowl, Bed, Bath Tub, Decoration | VisibilityComponent           | Phase-dependent      |
| **Dynamic**     | Poop_1-7                                  | VisibilityComponent           | Random spawn/collect |

### Visibility System

- **Component**: `VisibilityComponent.visible` (boolean) - built-in DCL SDK7 component
- **Logic**: `updateEntityVisibilityForPhase()` called during phase transitions
- **Poop**: `poopSystem()` handles random spawning and visibility toggling
- **Rendering**: Game engine handles visibility automatically (no manual transform manipulation)
- **EGG Phase**: Egg visible, PET entities hidden
- **PET Phase**: Egg removed (during hatch), PET entities visible
- **Poop**: Simple visibility toggling - visible when spawned, hidden when collected

---

## 🧩 1. The Data (Components)

Components are pure data schemas defined with `engine.defineComponent`.

### A. Global State (`GameState`)

Instead of a `GameManager` class, we use a singleton entity with a `GameState` component.

- `phase`: 'EGG' | 'HATCHING' | 'PET'
- `activePetEntity`: EntityID
- `menuStateEntity`: EntityID (optional)
- `theme`: 'DEFAULT' | 'CHRISTMAS' | 'NEW_YEAR' | 'SUMMER' | 'AUTUMN'

### B. Entity State (`PetComponent`)

- `species`: 'DOG' | 'CAT' | 'DRAGON'
- `mood`: number (0-100)
- `hunger`: number (0-100)
- `state`: 'IDLE' | 'EATING' | 'SLEEPING'

### C. Snow Particles (`SnowComponent`)

- `isActive`: boolean (pooling state)
- `poolIndex`: number (entity pool management)
- `velocityX/Y/Z`: number (physics simulation)
- `size`: number (visual scale variation)
- `rotationSpeed`: number (spin variation)

### C. The "Event" Component (`InteractionEvent`)

**Key Innovation:** To decouple Input from Logic, we use **Transient Components**.

- `type`: 'PET' | 'FEED' | 'PLAY'
- `source`: PlayerID
- _Lifecycle:_ Added by `InputSystem` in Frame X, Processed & Removed by `LogicSystem` in Frame X+1.

---

## ⚙️ 2. The Logic (Systems)

Systems run every frame. They are stateless functions.

### A. `InputSystem` (The Listener)

- **Role:** Detects clicks on entities with `Interactable`.
- **Action:** Does NOT change mood. It simply **adds** an `InteractionEvent` component to the entity.

### B. `PetLogicSystem` (The Brain)

- **Role:** Processes events and manages state transitions.
- **Action:**
  1.  Queries entities with `InteractionEvent`.
  2.  If `type == 'FEED'`: `hunger -= 10`, `mood += 5`.
  3.  Removes `InteractionEvent`.
  4.  Checks thresholds: If `mood < 20`, set `state = 'SAD'`.

### C. `DecaySystem` (The Clock)

- **Role:** Handles time-based changes.
- **Action:** Every 5 seconds, `mood -= 1`, `hunger += 1`.

### D. `RenderSystem` (The Eyes)

- **Role:** Syncs visuals to data.
- **Action:**
  - **Visuals:** If `Pet.state` changed to 'SAD', play Sad Animation.
  - **UI:** Update the Health Bar scale based on `Pet.mood`.
  - **Feedback:** If `InteractionEvent` was processed, spawn particle hearts.

### E. `SnowSystem` (The Weather)

- **Role:** Manages falling snow particles with wind effects.
- **Action:**
  - **Pooling:** Recycles 50 billboarded snow planes (no entity creation/destruction).
  - **Physics:** Applies gravity, wind drift, and rotation for natural movement.
  - **Theme Integration:** Activates during DEFAULT, CHRISTMAS, and NEW_YEAR themes.
  - **Performance:** Continuous spawning with automatic cleanup below ground level.

---

## 🚀 3. Execution Flow (The "Petting" Example)

1.  **User Clicks Pet.**
2.  **`InputSystem`**: Detects click. Adds `InteractionEvent({ action: 'PET' })` to Pet.
3.  **`PetLogicSystem`**:
    - Sees `InteractionEvent`.
    - Updates `PetComponent.mood` (50 -> 60).
    - Removes `InteractionEvent`.
4.  **`RenderSystem`**:
    - Sees `PetComponent.mood` is 60.
    - Updates UI Bar to 60%.
    - Triggers "Happy" animation.

---

## 📝 Migration Strategy (Strangler Pattern)

We move from the current `GameManager` to this architecture in steps:

1.  **Define Components:** Create `Pet.ts` and `Interaction.ts` schemas.
2.  **Hybrid Phase:** Attach `PetComponent` to the entity managed by `GameManager`.
3.  **System Extraction:**
    - Move "Input" code from `GameManager` -> `InputSystem`.
    - Move "Mood Decay" code -> `DecaySystem`.
4.  **Kill the God:** Remove `GameManager` once all logic is in systems.

---

## 🏆 Why This Wins (Consensus)

- **From Gemini:** The "Event as Component" pattern decouples Input from Logic perfectly.
- **From Claude:** The "Factory" pattern ensures cleaner entity creation code.
- **From GPT-5.1:** The "Single Source of Truth" is preserved but moved to ECS (GameState Component).
- **From Grok:** The modularity allows adding new Pets/Systems (e.g., `DragonFlightSystem`) without touching existing code.
