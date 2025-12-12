# Holo Pet: The "Crystal" Architecture (Consensus)

Based on the analysis of Gemini, Claude, GPT-5.1, and Grok proposals, this architecture crystalizes the best practices into a cohesive, scalable, and Decentraland-native (SDK 7) approach.

## 💎 Core Philosophy: Data-Driven ECS

We reject the "God Object" (`GameManager` class) in favor of a **Pure ECS (Entity-Component-System)** approach.
*   **Data is Truth:** The state of the game exists solely in **Components**.
*   **Behavior is Logic:** **Systems** read components, perform logic, and update components.
*   **Visuals are Reactive:** The view (meshes, UI, particles) updates *only* when data changes.

### The "Holy Trinity" of Separation
1.  **Components (Data):** "What is this?" (e.g., `Mood`, `PetState`, `InteractionEvent`).
2.  **Systems (Logic):** "How does it behave?" (e.g., `DecaySystem`, `PetLogicSystem`).
3.  **Factories (Composition):** "How is it built?" (e.g., `createPet`, `createUI`).

---

## 🏗️ Directory Structure

```text
src/
├── components/         # PURE DATA SCHEMAS
│   ├── GameState.ts    # Global state (Singleton component)
│   ├── Pet.ts          # Pet-specific data (Mood, Species)
│   ├── Interaction.ts  # InteractionEvent, Interactable
│   └── Visuals.ts      # MoodFeedback, Animations
├── systems/            # PURE LOGIC FUNCTIONS
│   ├── Input.ts        # Captures clicks -> Adds InteractionEvent
│   ├── Logic.ts        # Consumes InteractionEvent -> Updates Data
│   ├── Time.ts         # Handles decay/growth over time
│   └── Render.ts       # Syncs Visuals/UI to Data
├── factories/          # ENTITY CREATORS
│   ├── Game.ts         # Sets up global entities
│   ├── Pet.ts          # Spawns Pet entities + meshes
│   └── UI.ts           # Spawns HUD/Menu
├── utils/              # HELPERS & CONSTANTS
│   ├── constants.ts
│   └── types.ts
└── index.ts            # ENTRY POINT (Setup only)
```

---

## 🧩 1. The Data (Components)

Components are pure data schemas defined with `engine.defineComponent`.

### A. Global State (`GameState`)
Instead of a `GameManager` class, we use a singleton entity with a `GameState` component.
*   `phase`: 'EGG' | 'HATCHING' | 'PET'
*   `activePetEntity`: EntityID

### B. Entity State (`PetComponent`)
*   `species`: 'DOG' | 'CAT' | 'DRAGON'
*   `mood`: number (0-100)
*   `hunger`: number (0-100)
*   `state`: 'IDLE' | 'EATING' | 'SLEEPING'

### C. The "Event" Component (`InteractionEvent`)
**Key Innovation:** To decouple Input from Logic, we use **Transient Components**.
*   `type`: 'PET' | 'FEED' | 'PLAY'
*   `source`: PlayerID
*   *Lifecycle:* Added by `InputSystem` in Frame X, Processed & Removed by `LogicSystem` in Frame X+1.

---

## ⚙️ 2. The Logic (Systems)

Systems run every frame. They are stateless functions.

### A. `InputSystem` (The Listener)
*   **Role:** Detects clicks on entities with `Interactable`.
*   **Action:** Does NOT change mood. It simply **adds** an `InteractionEvent` component to the entity.

### B. `PetLogicSystem` (The Brain)
*   **Role:** Processes events and manages state transitions.
*   **Action:** 
    1.  Queries entities with `InteractionEvent`.
    2.  If `type == 'FEED'`: `hunger -= 10`, `mood += 5`.
    3.  Removes `InteractionEvent`.
    4.  Checks thresholds: If `mood < 20`, set `state = 'SAD'`.

### C. `DecaySystem` (The Clock)
*   **Role:** Handles time-based changes.
*   **Action:** Every 5 seconds, `mood -= 1`, `hunger += 1`.

### D. `RenderSystem` (The Eyes)
*   **Role:** Syncs visuals to data.
*   **Action:**
    *   **Visuals:** If `Pet.state` changed to 'SAD', play Sad Animation.
    *   **UI:** Update the Health Bar scale based on `Pet.mood`.
    *   **Feedback:** If `InteractionEvent` was processed, spawn particle hearts.

---

## 🚀 3. Execution Flow (The "Petting" Example)

1.  **User Clicks Pet.**
2.  **`InputSystem`**: Detects click. Adds `InteractionEvent({ action: 'PET' })` to Pet.
3.  **`PetLogicSystem`**: 
    *   Sees `InteractionEvent`. 
    *   Updates `PetComponent.mood` (50 -> 60).
    *   Removes `InteractionEvent`.
4.  **`RenderSystem`**:
    *   Sees `PetComponent.mood` is 60.
    *   Updates UI Bar to 60%.
    *   Triggers "Happy" animation.

---

## 📝 Migration Strategy (Strangler Pattern)

We move from the current `GameManager` to this architecture in steps:

1.  **Define Components:** Create `Pet.ts` and `Interaction.ts` schemas.
2.  **Hybrid Phase:** Attach `PetComponent` to the entity managed by `GameManager`.
3.  **System Extraction:** 
    *   Move "Input" code from `GameManager` -> `InputSystem`.
    *   Move "Mood Decay" code -> `DecaySystem`.
4.  **Kill the God:** Remove `GameManager` once all logic is in systems.

---

## 🏆 Why This Wins (Consensus)
*   **From Gemini:** The "Event as Component" pattern decouples Input from Logic perfectly.
*   **From Claude:** The "Factory" pattern ensures cleaner entity creation code.
*   **From GPT-5.1:** The "Single Source of Truth" is preserved but moved to ECS (GameState Component).
*   **From Grok:** The modularity allows adding new Pets/Systems (e.g., `DragonFlightSystem`) without touching existing code.

