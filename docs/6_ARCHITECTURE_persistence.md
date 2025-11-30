# Holo Pet: Persistence Architecture

Building on the Soul architecture, this document defines how pet data persists across sessions using **Express Server** with **Firestore** and **decentraland-crypto-middleware** for authentication.

## Core Philosophy: Server-Authoritative Persistence

- **Wallet = Identity**: The player's Ethereum wallet address is the unique identifier
- **One Pet Per Wallet**: Each wallet can own one pet (simplifies data model)
- **Server-Side Storage**: Firestore stores all persistent data securely
- **DCL Crypto Middleware**: Battle-tested authentication for Decentraland scenes

---

## Firestore Data Model

### Collection Structure

```
firestore/
└── pets/                          # Collection
    └── {walletAddress}/           # Document (lowercase wallet address)
        ├── identity: {...}        # Pet identity data
        ├── stats: {...}           # Current pet stats
        ├── personality: {...}     # Permanent personality traits
        ├── bond: {...}            # Relationship data
        ├── hygiene: {...}         # Cleanliness data
        └── meta: {...}            # Metadata
```

### Document Schema

```typescript
interface PetDocument {
  // Pet Identity
  identity: {
    name: string // Player-given name
    species: string // 'dog' | 'cat' | 'dragon'
    hatchedAt: number // Unix timestamp (milliseconds)
  }

  // Current Stats (mutable)
  stats: {
    mood: number // 0-100
    hunger: number // 0-100
    energy: number // 0-100
    state: string // 'idle' | 'eating' | 'sleeping' | 'sad'
  }

  // Personality (immutable after hatch)
  personality: {
    energy: number // 0-100, affects movement/hunger rate
    sociability: number // 0-100, affects petting boost
    cleanliness: number // 0-100, affects dirt rate
    appetite: number // 0-100, affects hunger rate
  }

  // Bond/Relationship
  bond: {
    bond: number // 0-100, relationship level
    trustLevel: string // 'stranger' | 'acquaintance' | 'friend' | 'bonded' | 'soulmate'
    lastVisitTime: number // Unix timestamp (seconds)
  }

  // Hygiene
  hygiene: {
    cleanliness: number // 0-100
    lastBathTime: number // Unix timestamp (seconds)
    lastBrushTime: number // Unix timestamp (seconds)
  }

  // Metadata
  meta: {
    version: string // Schema version for migrations (e.g., '1.0.0')
    createdAt: number // Document creation timestamp
    updatedAt: number // Last save timestamp
    activePoopCount: number // Number of active poops (for state restoration)
  }
}
```

---

## Server API

Using `decentraland-crypto-middleware` for authentication - the standard approach for DCL scenes.

### Project Structure

```
server/
├── src/
│   ├── index.ts              # Express server + routes
│   ├── security/
│   │   ├── securityChecks.ts # Parcel & realm validation
│   │   └── utils.ts          # Constants & types
│   └── db.ts                 # Firestore client
├── package.json
├── .env
└── tsconfig.json
```

### Endpoints

| Method | Path   | Description                   | Auth Required |
| ------ | ------ | ----------------------------- | ------------- |
| GET    | `/pet` | Load pet data for signed user | Yes           |
| POST   | `/pet` | Save pet data for signed user | Yes           |
| DELETE | `/pet` | Delete pet (reset) for user   | Yes           |

> **Note:** No wallet address in URL - it's extracted from the signed request via `req.auth`.

---

## Server Implementation

### `functions/package.json`

```json
{
  "name": "holo-pet-functions",
  "version": "1.0.0",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^11.8.0",
    "firebase-functions": "^4.3.1",
    "decentraland-crypto-middleware": "^3.0.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/cors": "^2.8.0",
    "firebase-functions-test": "^3.1.0"
  },
  "private": true
}
```

### `server/src/security/utils.ts`

```typescript
// Allow requests from localhost during development
export const TESTS_ENABLED = true

// Signature must be within 10 minutes
export const VALID_SIGNATURE_TOLERANCE_INTERVAL_MS = 10 * 60 * 1000

// Your scene's parcel coordinates (for anti-cheat)
export const VALID_PARCEL: number[] = [80, -8] // Update with your parcel!

// Margin of error for parcel check (player might be on adjacent parcels)
export const MARGIN_OF_ERROR = 2

// Accept requests from these realms without parcel check
export const REALM_WHITELIST = ['LocalPreview']

// DCL metadata type from signed requests
export type Metadata = {
  origin?: string
  sceneId?: string
  parcel?: string
  tld?: string
  network?: string
  isGuest?: boolean
  realm: {
    domain?: string
    hostname?: string
    serverName?: string
    layer?: string
    lighthouseVersion?: string
  }
}

export type PeerResponse = {
  ok: boolean
  peers: {
    id: string
    address: string
    lastPing: number
    parcel: [number, number]
    position: [number, number, number]
  }[]
}
```

### `server/src/security/securityChecks.ts`

```typescript
import { Request } from 'express'
import dcl from 'decentraland-crypto-middleware'
import { Metadata, MARGIN_OF_ERROR, REALM_WHITELIST, PeerResponse, TESTS_ENABLED } from './utils'

/**
 * Run security checks on the request
 * - Validates realm is allowed
 * - Optionally validates player is at the correct parcel (anti-cheat)
 */
export async function runChecks(req: Request & dcl.DecentralandSignatureData<Metadata>, validParcel: number[]) {
  // Allow localhost in dev mode
  if (TESTS_ENABLED && req.authMetadata?.realm?.serverName === 'LocalPreview') {
    return true
  }

  // Check realm whitelist
  if (REALM_WHITELIST.includes(req.authMetadata?.realm?.serverName || '')) {
    return true
  }

  // Validate player is at the scene's parcel (optional, stricter security)
  // Uncomment if you want to prevent requests from players not at your scene
  // const isAtParcel = await checkPlayerAtParcel(req.auth, req.authMetadata?.realm?.domain || '', validParcel)
  // if (!isAtParcel) {
  //   throw new Error('Player not at valid parcel')
  // }

  return true
}

/**
 * Check if player is at the expected parcel via catalyst server
 */
export async function checkPlayerAtParcel(playerId: string, realmDomain: string, parcel: number[]): Promise<boolean> {
  const url = `${realmDomain}/comms/peers`

  try {
    const response = await fetch(url)
    const data: PeerResponse = await response.json()

    if (data.ok) {
      const player = data.peers.find((peer) => peer.address && peer.address.toLowerCase() === playerId.toLowerCase())

      if (!player?.parcel) {
        return false
      }

      return checkCoords(player.parcel, parcel)
    }
  } catch (error) {
    console.error('Failed to check player parcel:', error)
    return false
  }

  return false
}

/**
 * Check coordinates within margin of error
 */
function checkCoords(coords: number[], parcel: number[]): boolean {
  const validMargin = (p: number, c: number) => Math.abs(p - c) <= MARGIN_OF_ERROR
  return validMargin(coords[0], parcel[0]) && validMargin(coords[1], parcel[1])
}
```

### `functions/src/index.ts` (Firebase Functions)

```typescript
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as express from 'express'
import * as cors from 'cors'
import dcl, { express as dclExpress } from 'decentraland-crypto-middleware'

admin.initializeApp()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

// Initialize Firestore
const db = admin.firestore()

// =============================================================================
// GET /pet - Load pet data
// =============================================================================
app.get(
  '/pet',
  dclExpress({ expiration: 10 * 60 * 1000 }), // 10 minutes
  async (req: Request & dcl.DecentralandSignatureData<any>, res: express.Response) => {
    try {
      // req.auth contains the verified wallet address (lowercase)
      const walletAddress = req.auth.toLowerCase()

      console.log('Loading pet for wallet:', walletAddress)

      const doc = await db.collection('pets').doc(walletAddress).get()

      if (!doc.exists) {
        console.log('No pet found for wallet:', walletAddress)
        return res.json({ success: true, pet: null })
      }

      console.log('Pet found for wallet:', walletAddress)
      return res.json({ success: true, pet: doc.data() })
    } catch (error) {
      console.error('Load pet error:', error)
      return res.status(500).json({ success: false, error: 'Failed to load pet' })
    }
  }
)

// =============================================================================
// POST /pet - Save pet data
// =============================================================================
app.post(
  '/pet',
  dclExpress({ expiration: 10 * 60 * 1000 }), // 10 minutes
  async (req: Request & dcl.DecentralandSignatureData<any>, res: express.Response) => {
    try {
      const walletAddress = req.auth.toLowerCase()
      const petData = req.body

      console.log('Saving pet for wallet:', walletAddress)

      // Add/update metadata
      petData.meta = {
        ...petData.meta,
        updatedAt: Date.now(),
        version: '1.0.0'
      }

      // Set createdAt only if new document
      const docRef = db.collection('pets').doc(walletAddress)
      const doc = await docRef.get()
      if (!doc.exists) {
        petData.meta.createdAt = Date.now()
      }

      await docRef.set(petData, { merge: true })

      console.log('Pet saved successfully for wallet:', walletAddress)
      return res.json({ success: true })
    } catch (error) {
      console.error('Save pet error:', error)
      return res.status(500).json({ success: false, error: 'Failed to save pet' })
    }
  }
)

// =============================================================================
// DELETE /pet - Delete pet (reset game)
// =============================================================================
app.delete(
  '/pet',
  dclExpress({ expiration: 10 * 60 * 1000 }), // 10 minutes
  async (req: Request & dcl.DecentralandSignatureData<any>, res: express.Response) => {
    try {
      const walletAddress = req.auth.toLowerCase()

      console.log('Deleting pet for wallet:', walletAddress)
      await db.collection('pets').doc(walletAddress).delete()

      console.log('Pet deleted successfully for wallet:', walletAddress)
      return res.json({ success: true })
    } catch (error) {
      console.error('Delete pet error:', error)
      return res.status(500).json({ success: false, error: 'Failed to delete pet' })
    }
  }
)

// =============================================================================
// Export for Firebase Functions
// =============================================================================
export const api = functions.https.onRequest(app)
```

### `server/.env`

```env
PORT=3006
BASE_URL=https://your-server.com
GOOGLE_CLOUD_PROJECT=your-firebase-project-id
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Pet documents - only accessible via server
    // Direct client access is blocked
    match /pets/{walletAddress} {
      allow read, write: if false;
    }
  }
}
```

> **Note:** All access goes through the server with signature verification, so we block direct Firestore access.

---

## Scene Integration

### New Files

```
src/
├── persistence/
│   ├── api.ts            # API client (signedFetch calls)
│   ├── serialization.ts  # Component <-> PetDocument conversion
│   └── triggers.ts       # Save/load trigger logic
└── utils/
    └── wallet.ts         # Wallet address utilities
```

### `src/persistence/api.ts`

```typescript
import { signedFetch } from '~system/SignedFetch'

const API_BASE_URL = 'https://your-server.com' // Update with your server URL

export interface PetDocument {
  identity: { name: string; species: string; hatchedAt: number }
  stats: { mood: number; hunger: number; energy: number; state: string }
  personality: { energy: number; sociability: number; cleanliness: number; appetite: number }
  bond: { bond: number; trustLevel: string; lastVisitTime: number }
  hygiene: { cleanliness: number; lastBathTime: number; lastBrushTime: number }
  meta: { version: string; createdAt: number; updatedAt: number; activePoopCount: number }
}

/**
 * Load pet data from server
 * Wallet address is automatically included in the signed request
 */
export async function loadPet(): Promise<PetDocument | null> {
  try {
    const response = await signedFetch({
      url: `${API_BASE_URL}/pet`,
      init: { method: 'GET' }
    })

    const data = JSON.parse(response.body)
    if (data.success && data.pet) {
      return data.pet as PetDocument
    }
    return null
  } catch (error) {
    console.error('Failed to load pet:', error)
    return null
  }
}

/**
 * Save pet data to server
 */
export async function savePet(petData: PetDocument): Promise<boolean> {
  try {
    const response = await signedFetch({
      url: `${API_BASE_URL}/pet`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData)
      }
    })

    const data = JSON.parse(response.body)
    return data.success === true
  } catch (error) {
    console.error('Failed to save pet:', error)
    return false
  }
}

/**
 * Delete pet data (reset game)
 */
export async function deletePet(): Promise<boolean> {
  try {
    const response = await signedFetch({
      url: `${API_BASE_URL}/pet`,
      init: { method: 'DELETE' }
    })

    const data = JSON.parse(response.body)
    return data.success === true
  } catch (error) {
    console.error('Failed to delete pet:', error)
    return false
  }
}
```

### `src/persistence/serialization.ts`

```typescript
import { Entity } from '@dcl/sdk/ecs'
import { PetComponent } from '../components/Pet'
import { PersonalityComponent, BondComponent, PetIdentityComponent } from '../components/Personality'
import { HygieneComponent } from '../components/Hygiene'
import { getActivePoopCount } from '../systems/Poop'
import { PetDocument } from './api'

/**
 * Serialize pet entity components to PetDocument for saving
 */
export function serializePet(petEntity: Entity): PetDocument | null {
  const pet = PetComponent.getOrNull(petEntity)
  const identity = PetIdentityComponent.getOrNull(petEntity)
  const personality = PersonalityComponent.getOrNull(petEntity)
  const bond = BondComponent.getOrNull(petEntity)
  const hygiene = HygieneComponent.getOrNull(petEntity)

  if (!pet || !identity || !personality || !bond || !hygiene) {
    return null
  }

  return {
    identity: {
      name: identity.name,
      species: pet.species,
      hatchedAt: identity.hatchedAt
    },
    stats: {
      mood: pet.mood,
      hunger: pet.hunger,
      energy: pet.energy,
      state: pet.state
    },
    personality: {
      energy: personality.energy,
      sociability: personality.sociability,
      cleanliness: personality.cleanliness,
      appetite: personality.appetite
    },
    bond: {
      bond: bond.bond,
      trustLevel: bond.trustLevel,
      lastVisitTime: bond.lastVisitTime
    },
    hygiene: {
      cleanliness: hygiene.cleanliness,
      lastBathTime: hygiene.lastBathTime,
      lastBrushTime: hygiene.lastBrushTime
    },
    meta: {
      version: '1.0.0',
      createdAt: identity.hatchedAt,
      updatedAt: Date.now(),
      activePoopCount: getActivePoopCount()
    }
  }
}

/**
 * Deserialize PetDocument to component values for loading
 */
export function deserializePet(doc: PetDocument) {
  return {
    pet: {
      species: doc.identity.species,
      mood: doc.stats.mood,
      hunger: doc.stats.hunger,
      energy: doc.stats.energy,
      state: doc.stats.state
    },
    identity: {
      name: doc.identity.name,
      hatchedAt: doc.identity.hatchedAt,
      ownerId: '' // Set from wallet on load
    },
    personality: {
      energy: doc.personality.energy,
      sociability: doc.personality.sociability,
      cleanliness: doc.personality.cleanliness,
      appetite: doc.personality.appetite
    },
    bond: {
      bond: doc.bond.bond,
      trustLevel: doc.bond.trustLevel,
      lastVisitTime: doc.bond.lastVisitTime
    },
    hygiene: {
      cleanliness: doc.hygiene.cleanliness,
      lastBathTime: doc.hygiene.lastBathTime,
      lastBrushTime: doc.hygiene.lastBrushTime
    },
    activePoopCount: doc.meta.activePoopCount
  }
}
```

### `src/utils/wallet.ts`

```typescript
import { getPlayer } from '@dcl/sdk/src/players'

/**
 * Get the current player's wallet address
 */
export function getWalletAddress(): string | null {
  const player = getPlayer()
  return player?.userId?.toLowerCase() || null
}

/**
 * Check if player is connected with a wallet
 */
export function isWalletConnected(): boolean {
  return getWalletAddress() !== null
}
```

---

## Save/Load Triggers

### When to Save

| Trigger                                    | Debounce   | Priority   |
| ------------------------------------------ | ---------- | ---------- |
| Player interaction (feed, pet, play, etc.) | 5 seconds  | Normal     |
| Pet state change (mood threshold)          | 10 seconds | Low        |
| Player leaves scene                        | Immediate  | High       |
| Periodic auto-save                         | 60 seconds | Background |

### When to Load

| Trigger           | Action                                      |
| ----------------- | ------------------------------------------- |
| Scene enters      | Load pet data, skip egg phase if pet exists |
| Player reconnects | Refresh data from server                    |

### Implementation: `src/systems/Persistence.ts`

```typescript
import { engine } from '@dcl/sdk/ecs'
import { onEnterScene, onLeaveScene } from '@dcl/sdk/observables'
import { loadPet, savePet, PetDocument } from '../persistence/api'
import { serializePet } from '../persistence/serialization'
import { getWalletAddress } from '../utils/wallet'
import { GameState, GamePhase } from '../components/GameState'

const AUTO_SAVE_INTERVAL = 60 // seconds
const DEBOUNCE_TIME = 5 // seconds

let lastSaveTime = 0
let pendingSave = false

/**
 * Initialize persistence system
 */
export function initPersistence() {
  // Load on scene enter
  onEnterScene.add(async () => {
    const wallet = getWalletAddress()
    if (!wallet) {
      console.log('No wallet connected, starting fresh')
      return
    }

    const petData = await loadPet()
    if (petData) {
      console.log('Loaded existing pet:', petData.identity.name)
      restorePetFromData(petData)
    } else {
      console.log('No saved pet, starting with egg')
    }
  })

  // Save on scene leave
  onLeaveScene.add(async () => {
    await triggerSave(true) // immediate = true
  })
}

/**
 * Trigger a save (debounced unless immediate)
 */
export async function triggerSave(immediate = false) {
  const now = Date.now() / 1000

  if (!immediate && now - lastSaveTime < DEBOUNCE_TIME) {
    pendingSave = true
    return
  }

  const wallet = getWalletAddress()
  if (!wallet) return

  // Find active pet
  for (const [_, gameState] of engine.getEntitiesWith(GameState)) {
    if (gameState.phase === GamePhase.PET && gameState.activePetEntity) {
      const petData = serializePet(gameState.activePetEntity)
      if (petData) {
        const success = await savePet(petData)
        if (success) {
          lastSaveTime = now
          pendingSave = false
          console.log('Pet saved successfully')
        }
      }
    }
  }
}

/**
 * Auto-save system (runs every frame, saves periodically)
 */
export function persistenceSystem(dt: number) {
  const now = Date.now() / 1000

  // Check for pending debounced save
  if (pendingSave && now - lastSaveTime >= DEBOUNCE_TIME) {
    triggerSave()
  }

  // Periodic auto-save
  if (now - lastSaveTime >= AUTO_SAVE_INTERVAL) {
    triggerSave()
  }
}

function restorePetFromData(data: PetDocument) {
  // Implementation: Set GameState to PET, create pet with loaded data
  // This would modify createPet() to accept initial values
  console.log('TODO: Implement pet restoration from saved data')
}
```

---

## Server Deployment Options

### Option 1: Google Cloud Run (Recommended)

```bash
# Build and deploy
gcloud run deploy holo-pet-server \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 2: Firebase Cloud Functions

Wrap the Express app in a Cloud Function:

```typescript
import * as functions from 'firebase-functions'
export const api = functions.https.onRequest(app)
```

### Option 3: Railway / Render / Fly.io

Any Node.js hosting platform works. Just deploy the Express server.

---

## Server Setup Checklist

### 1. Create Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project or use existing
3. Enable Firestore Database
4. Apply security rules (block direct access)

### 2. Set Up Server

```bash
# Create server directory
mkdir holo-pet-server && cd holo-pet-server

# Initialize package
npm init -y

# Install dependencies
npm install express cors dotenv @google-cloud/firestore decentraland-crypto-middleware
npm install -D typescript ts-node ts-node-dev @types/express @types/cors

# Initialize TypeScript
npx tsc --init

# Create .env file
echo "PORT=3006" >> .env
echo "BASE_URL=https://your-server.com" >> .env
echo "GOOGLE_CLOUD_PROJECT=your-project-id" >> .env
```

### 3. Configure Google Cloud Auth

```bash
# For local development
gcloud auth application-default login

# For production, use service account key
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

### 4. Run Locally

```bash
npm run dev
```

### 5. Deploy

Choose your deployment option and deploy the server.

---

## Migration Notes

### From Non-Persistent to Persistent

1. Existing players will start fresh (no migration needed)
2. New players get egg phase on first visit
3. Returning players load their saved pet

### Schema Versioning

The `meta.version` field allows future migrations:

```typescript
function migrateDocument(doc: PetDocument): PetDocument {
  const version = doc.meta?.version || '0.0.0'

  if (version < '1.1.0') {
    // Example migration: add new field
    doc.stats.happiness = doc.stats.mood
  }

  doc.meta.version = '1.1.0'
  return doc
}
```

---

## Testing Checklist

- [ ] New player: Shows egg, can hatch
- [ ] After hatch: Data saved to Firestore
- [ ] Reload scene: Pet restored with correct stats
- [ ] Modify stats: Changes persist after reload
- [ ] Reset game: Deletes Firestore document, shows egg again
- [ ] Different wallet: Shows different pet (or egg)
- [ ] No wallet: Works in local mode (no persistence)

---

## Constants

Add to `src/utils/constants.ts`:

```typescript
// =============================================================================
// PERSISTENCE CONSTANTS
// =============================================================================
export const API_BASE_URL = 'https://your-server.com'
export const AUTO_SAVE_INTERVAL = 60 // seconds
export const SAVE_DEBOUNCE_TIME = 5 // seconds
export const PERSISTENCE_VERSION = '1.0.0' // Schema version
```
