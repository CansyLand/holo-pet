# Holo Pet: Data-Oriented Architecture (ECS)

## 🏛️ The Philosophy: "Data Drives Behavior"

The previous architecture relied on a central `GameManager` "God Object" to orchestrate everything. This creates tight coupling and makes adding new features (like a new pet or a new interaction) risky.

We will shift to a **Pure ECS (Entity-Component-System)** architecture, native to Decentraland SDK 7.

**Core Tenets:**
1.  **Entities are IDs:** They don't hold methods. They just exist.
2.  **Components are Data:** They hold the *state* (e.g., `Mood: 80`, `isSleeping: true`).
3.  **Systems are Logic:** They read data, process it, and write new data.

---

## 🧱 The Data Model (Components)

We stop asking "What is this object?" and start asking "What data does this entity have?"

### 1. Core State
*   **`PetComponent`**: The heart of the pet.
    *   `species`: 'Dragon' | 'Cat' | 'Dog'
    *   `mood`: number (0-100)
    *   `energy`: number (0-100)
    *   `hunger`: number (0-100)
    *   `state`: 'EGG' | 'IDLE' | 'SLEEPING' | 'INTERACTING'
*   **`EggComponent`**: Marks an entity as an unhatched egg.
    *   `hatchProgress`: number (0-100)

### 2. Actions & Interactions
Instead of hardcoding "Pet" or "Feed", we make them data.
*   **`Interactable`**: Marks an entity as click-able.
    *   `type`: 'PET' | 'FEED' | 'HATCH'
    *   `cooldown`: number
*   **`InteractionEvent` (Transient)**: Added when a user clicks, removed after processing.
    *   `action`: 'PET'
    *   `source`: PlayerID

### 3. Visuals
*   **`MoodFeedback`**: Transient component to spawn particles/floating text.
    *   `value`: '+10 ❤️'

---

## ⚙️ The Systems (Logic)

Systems run every frame (or on specific intervals).

### 1. `InputSystem`
*   **Responsibility:** Detects player clicks on entities with `Interactable`.
*   **Output:** Attaches an `InteractionEvent` component to the entity.
*   *Note:* Does NOT execute the logic. Just records "Player clicked X".

### 2. `PetLogicSystem`
*   **Responsibility:** The brain.
*   **Input:** Entities with `PetComponent` and `InteractionEvent`.
*   **Process:**
    *   If `InteractionEvent == PET`: `Mood += 10`, `Energy -= 2`.
    *   If `InteractionEvent == FEED`: `Hunger -= 20`.
    *   Handles state transitions (e.g., if `Mood < 20` -> State = `SAD`).
*   **Output:** Updates `PetComponent` data. Removes `InteractionEvent`.

### 3. `TimeSystem`
*   **Responsibility:** The ticking clock.
*   **Process:** Every 10 seconds, decay stats.
    *   `Mood -= 1`
    *   `Hunger += 1`

### 4. `VisualSystem`
*   **Responsibility:** The eyes.
*   **Input:** `PetComponent`.
*   **Process:**
    *   If `state == SAD` && `Animation != SAD`, play Sad Animation.
    *   If `InteractionEvent` was processed, spawn Heart Particles.

### 5. `HUDSystem`
*   **Responsibility:** The UI.
*   **Input:** `PetComponent` (of the active pet).
*   **Process:** Update the 2D UI bars to match the data numbers.

---

## 📂 Directory Structure Refactor

```
src/
├── components/         # PURE DATA (Schemas)
│   ├── Pet.ts          # PetComponent, PetState
│   ├── Interaction.ts  # Interactable, InteractionEvent
│   └── Visuals.ts      # MoodFeedback
├── systems/            # PURE LOGIC (Functions)
│   ├── Input.ts        # InputSystem
│   ├── PetLogic.ts     # PetLogicSystem (Brain)
│   ├── Decay.ts        # TimeSystem
│   └── Render.ts       # VisualSystem (Animations/Particles)
├── factories/          # ENTITY CREATORS
│   ├── EggFactory.ts   # spawns the Egg
│   └── PetFactory.ts   # spawns the Pet
├── ui/                 # UI CODE
│   └── HUD.ts          # HUDSystem
└── index.ts            # SETUP ONLY
```

---

## 🚀 Migration Strategy (The "Strangler Fig" Pattern)

We won't delete `GameManager` immediately. We will strangle it.

1.  **Step 1:** Create `PetComponent`. Attach it to the pet spawned by `GameManager`.
2.  **Step 2:** Create `DecaySystem`. Move the `mood--` logic from `GameManager` to this system.
3.  **Step 3:** Create `InteractionSystem`. Move click handling out of `GameManager`.
4.  **Step 4:** Once `GameManager` is empty, delete it.

## 📝 Example: The "Petting" Flow

1.  **Player** clicks the Pet.
2.  **`InputSystem`** sees click, adds `InteractionEvent({ type: 'PET' })` to Pet Entity.
3.  **`PetLogicSystem`** sees `InteractionEvent`:
    *   Reads `PetComponent`.
    *   Updates `mood: 50` -> `60`.
    *   Sets `state: 'HAPPY_JUMP'`.
    *   Removes `InteractionEvent`.
4.  **`VisualSystem`** sees `state: 'HAPPY_JUMP'`:
    *   Triggers "Jump" animation.
    *   Spawns Heart Particles.
5.  **`HUDSystem`** sees `mood: 60`:
    *   Updates UI bar.

This is **elegant** because the "Input" doesn't need to know about the "UI". The "Logic" doesn't care about "Animations". Everything communicates through **Data**.

