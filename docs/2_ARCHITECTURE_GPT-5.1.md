## Holo Pet – Architecture (GPT‑5.1 Edition)

This document captures a **clean, minimal architecture** for the Holo Pet scene that:

- **Matches how the current code actually works**
- **Stays small and hackathon‑friendly**
- **Scales as a “Lego” system** for future features and new pets

The focus is: **one simple game loop, a tiny core, and feature modules that can be added or removed without fear.**

---

## 1. High‑level mental model

At the highest level, the scene is just three layers:

- **Core** – owns global state and lifecycle (`GameManager`).
- **Systems** – pure logic that runs every frame or on a timer (`InteractionSystem`, `MoodSystem`, UI update systems, etc.).
- **Components** – visual or UI building blocks (egg, pet, menu, mood bar).

Think of it as:

- **Core:** “What is true right now?” (state)
- **Systems:** “What should happen next?” (behavior)
- **Components:** “How does it look and feel?” (presentation)

No system is allowed to own the world by itself; it always **talks through the core state** or **through small, focused helpers**.

---

## 2. Runtime flow: from boot to bonding

### 2.1 Scene boot (`index.ts`)

- **Responsibility:** Wire systems and spawn starting entities.
- Current behavior:
  - Registers `interactionSystem`, `moodSystem`, and `updateMoodBarSystem` with the `engine`.
  - Calls `createEgg()` to spawn the holographic egg via `GameManager`.

**Rule:** `index.ts` should stay **almost empty** and only do composition:

- **Add or remove systems**
- **Trigger initial setup (spawning egg, environment, basic UI)**  

No game rules, no feature logic here.

---

### 2.2 Core state (`GameManager`)

`GameManager` is the **single source of truth** for gameplay:

- **Scene phase:** `GameState.EGG` or `GameState.PET`
- **Current pet:** which pet exists, via `petEntity` and `petType`
- **UI entities:** menu buttons and mood bar entities
- **Emotional state:** `mood` as a number from 0–100
- **Mode flags:** e.g. `isFocusMode`

Responsibilities:

- **Spawn / remove** key entities:
  - `spawnEgg()` – create the egg entity with visuals
  - Future: `spawnPet()`, `despawnPet()`, `spawnEnvironment()`, etc.
- **Track ownership** of “important” entities (egg, pet, UI)
- **Expose simple methods** (`setFocusMode`, `clearMenu`, future `setPetMood`, etc.)

Non‑goals:

- No direct input handling
- No time‑based updates
- No visual layout logic

It is a **state container + small factory**, not a “god system”.

---

### 2.3 Systems (logic)

Systems are **small functions** that:

- Run every frame (`dt`) or on simple timers
- Read/write `GameManager` state
- Operate on ECS entities that already exist

Current systems:

- **`interactionSystem`**
  - Reads player pointer input.
  - If egg is active and clicked → calls `hatchEgg()` logic.
  - If pet is active and clicked → calls `enterFocusMode()` and then shows the menu.
  - When the menu is visible, checks which menu button was clicked and calls `petTheAnimal()`.
  - Exits focus mode on movement input.
- **`moodSystem`**
  - Ticks every ~1 second.
  - Decreases `mood` over time while the pet exists.
- **`updateMoodBarSystem`**
  - Reads `GameManager.mood` and rescales the mood bar entity.

Guidelines for systems:

- **One responsibility per system.**
- Systems should **not** create complex entities directly; instead they:
  - Call methods on `GameManager` (`setFocusMode`, future `selectPet`, `setMood`, etc.), or
  - Call small component helpers (`spawnPetMenu`, `createEgg`, etc.).
- Systems **never import each other**. They only import:
  - `GameManager` (for state)
  - Components/helpers (for visuals)

---

### 2.4 Components (visuals & UI)

Components in this project are **helper modules**, not ECS components:

- **`Egg.ts`**
  - `createEgg()`:
    - Asks `GameManager` to `spawnEgg()`.
    - Attaches pointer events (`Hatch Egg`) so the egg is clickable.
- **`PetMenu.ts`**
  - `spawnPetMenu()`:
    - Reads pet position.
    - Spawns 4 button entities (Pet, Feed, Play, Clean).
    - Creates mood bar background and foreground, registers them in `GameManager`.
  - `updateMoodBarSystem()`:
    - Reads `GameManager.mood` and computes correct scale/position for the bar.

Design rules:

- Components **own the visual composition** (position, colors, billboards, hover texts).
- All important entities they create must be **registered in `GameManager`** or clearly returned to the caller, so that:
  - Other systems know they exist.
  - Cleanup is easy (`clearMenu`, future `destroyPet`, etc.).
- No input polling inside components; that belongs in systems.

---

## 3. Clean module boundaries

To keep the project extendable for years, draw **sharp lines** between modules:

- **Core (`GameManager`)**
  - Knows: “What exists?” and “What is the current game phase and mood?”
  - Does: spawn/despawn key entities, manage UI ownership, simple setters.
- **Systems (`systems/*`)**
  - Know: “What inputs / time events are happening?”.
  - Do: orchestration – decide when to call into `GameManager` and components.
- **Components (`components/*`)**
  - Know: “How should this look and feel?”.
  - Do: build and update visuals/UX.

Dependencies should be **one‑way**:

- `index.ts` → `systems/*`, `components/*`
- `systems/*` → `GameManager`, `components/*`
- `components/*` → `GameManager` (for state/ids)

No circular arrows. This keeps refactors cheap and local.

---

## 4. Extending the game like Lego

The architecture is intentionally small so that **every new feature becomes “just another brick”**.

### 4.1 Adding a new pet type

Goal: support giraffe / collie / cat / dragon without tangling logic.

Steps:

- Extend `PetType` in `GameManager`.
- Create a new **pet factory helper**, e.g. `components/PetFactory.ts`:
  - `createPet(petType: PetType)`: builds the right mesh, size, colors, idle animation.
- Update `hatchEgg()` (or a future `PetSpawnSystem`) so it **only**:
  - Picks the `PetType`.
  - Calls `createPet(petType)` and stores the resulting entity on `GameManager`.

No other system needs to know “how a dragon looks” – only the factory does.

---

### 4.2 Adding a new care action (e.g. Feed)

Goal: add new verbs without breaking existing ones.

- Add a new **system** for the mechanic if it has time‑based logic:
  - `feedingSystem(dt)` – handles cooldowns, long‑term effects, etc.
- Add a **handler function** that updates state:
  - `feedPet()` – purely state change + optionally kicking off animations.
- Wire it:
  - `interactionSystem` identifies the correct button entity (by id or via a tiny tag component).
  - On click, calls `feedPet()`.
  - `feedPet()` only uses `GameManager` and maybe an animation helper; it doesn’t touch input.

This keeps input, state, and visuals clearly separated.

---

### 4.3 Persistence & “come back tomorrow” hooks

Later, when you add persistence:

- Create a **`PersistenceSystem`**:
  - Responsible only for reading/writing simple data (e.g. chosen pet, last visit, last mood).
  - Talks to a small utility (`utils/persistence.ts`) that hides Firebase or any other backend.
- On scene load:
  - `index.ts` adds `persistenceSystem`.
  - `persistenceSystem` rehydrates `GameManager` (pet type, mood, etc.).
- Other systems remain unchanged; they just react to whatever `GameManager` says.

Evergreen behavior (mood changes over days, special greetings) can be layered as separate systems that read:

- Last visit timestamp
- Current mood
- Pet type

and then apply small, additive effects.

---

## 5. Testing and debuggability

To keep this scene “10‑year maintainable” and AI‑friendly:

- **Small, pure systems:** Functions that only depend on `dt` and `GameManager` can be unit‑tested in isolation.
- **Clear seams:** Every new feature lives in:
  - One state extension in `GameManager`
  - One or two new systems
  - One new visual helper in `components/`
- **Feature toggles by file:** Commenting out a system registration in `index.ts` should disable a feature without breaking others.

For human and AI coders:

- Each file should answer a **single, obvious question**:
  - `MoodSystem.ts` → “How does mood change over time?”
  - `InteractionSystem.ts` → “How does input turn into game actions?”
  - `PetMenu.ts` → “How does the radial care menu look and update?”

If a file cannot be described in one sentence, split it.

---

## 6. Summary

- **Core (GameManager):** central truth, owns entities and simple state transitions.
- **Systems:** thin, focused logic layers that respond to time and input.
- **Components:** visual builders and UI pieces wired to that state.

This architecture keeps your scene:

- Simple enough for a hackathon
- Clear enough for AI to work on safely
- Modular enough to keep adding pets, care actions, and evergreen behaviors over the coming years


