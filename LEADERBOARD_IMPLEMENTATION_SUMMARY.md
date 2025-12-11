# Leaderboard Feature - Implementation Summary

## ✅ What Was Implemented

### Scene-Side Changes (Complete ✓)

1. **Updated Type Definitions** (`src/persistence/api.ts`)

   - Extended `PetDocument` interface with new meta fields:
     - `visitStreak`: Consecutive days visited
     - `lastVisitDate`: ISO date string for streak tracking
     - `score`: Pre-calculated composite score
     - `ownerName`: Player display name for leaderboard
   - Added `LeaderboardEntry` interface
   - Added `LeaderboardResponse` interface
   - Added `fetchLeaderboard()` API function

2. **Updated Serialization** (`src/persistence/serialization.ts`)

   - Modified `serializePet()` to accept and preserve existing meta fields
   - Added automatic player name retrieval via `getLocalPlayerName()`
   - Server-calculated fields (streak, score) are preserved between saves

3. **Updated Player Utilities** (`src/utils/players.ts`)

   - Added `getLocalPlayerName()` function
   - Falls back to truncated wallet if name unavailable

4. **Updated Persistence System** (`src/systems/Persistence.ts`)

   - Added `currentPetMeta` tracking to preserve server-calculated values
   - Passes existing meta to `serializePet()` on saves

5. **Created Leaderboard UI** (`src/factories/LeaderboardUI.tsx`)

   - "🏆 Leaderboard" button at bottom-left (after Visit Players button)
   - Popup with:
     - Top 10 list with rank, player name, pet name, and score
     - Gold/Silver/Bronze colors for top 3
     - Your rank section (if you have a pet)
     - Score formula explanation
   - Loading and error states
   - Matches VisitUI styling

6. **Registered UI** (`src/index.ts`)
   - Added `LeaderboardUI` to combined UI renderer

### Server-Side Changes (Reference Provided 📄)

The complete server implementation is in **`SERVER_IMPLEMENTATION.md`**. You need to:

1. Update POST `/pet` endpoint to:

   - Calculate visit streaks (consecutive days)
   - Compute composite score: `(bond × 10) + (visitStreak × 50) + (petAgeDays × 5)`
   - Update meta fields on every save

2. Add GET `/leaderboard` endpoint to:

   - Return top 10 players ordered by score
   - Calculate and return requesting player's rank
   - Only include pets in "pet" phase (not egg)

3. Create Firestore composite index:
   - Fields: `meta.gamePhase` (Ascending), `meta.score` (Descending)

## 🎯 Score Formula

```
score = (bond × 10) + (visitStreak × 50) + (petAgeDays × 5)
```

### Breakdown:

- **Bond (0-1000 pts)**: Current bond level × 10
- **Visit Streak (50 pts/day)**: Consecutive days visited × 50
- **Pet Age (5 pts/day)**: Days since hatching × 5

### Example:

- Bond: 80/100 → 800 points
- Visit Streak: 10 days → 500 points
- Pet Age: 30 days → 150 points
- **Total: 1,450 points**

## 📋 Next Steps

### 1. Deploy Server Code

```bash
# Navigate to your Firebase Functions directory
cd path/to/firebase-functions

# Copy the code from SERVER_IMPLEMENTATION.md to functions/src/index.ts

# Deploy
firebase deploy --only functions
```

### 2. Create Firestore Index

After deploying, the first leaderboard query will provide a link to create the required index automatically. Or create it manually:

- Go to: Firebase Console → Firestore → Indexes
- Collection: `pets`
- Fields:
  1. `meta.gamePhase` (Ascending)
  2. `meta.score` (Descending)

### 3. Test in Development

```bash
# In your scene directory
npm run start

# Test the following:
# 1. Save your pet (watch console for visitStreak updates)
# 2. Open leaderboard (button at bottom-left)
# 3. Verify top 10 loads
# 4. Verify your rank shows correctly
```

### 4. Test Visit Streak Logic

- Day 1: Visit → Streak = 1
- Day 2: Visit → Streak = 2
- Day 3: Skip
- Day 4: Visit → Streak = 1 (reset)
- Day 5: Visit → Streak = 2

## 🎨 UI Layout

```
+--------------------------------------------------+
|                                                  |
|                                    [Stats Panel] |
|                                                  |
|                                                  |
|                                                  |
|                                                  |
|                                                  |
|                                                  |
| [Visit Players] [Go Home] [🏆 Leaderboard]      |
+--------------------------------------------------+
```

## 🧪 Testing Checklist

- [ ] Leaderboard button appears at bottom-left
- [ ] Clicking button opens popup
- [ ] Top 10 list displays (or "No entries" message)
- [ ] Player names and pet names show correctly
- [ ] Scores display correctly
- [ ] Your rank section shows (if you have a pet)
- [ ] Gold/Silver/Bronze colors for top 3
- [ ] Visit streak increments on consecutive days
- [ ] Visit streak resets after missing a day
- [ ] Score updates correctly after interactions
- [ ] Loading state shows while fetching
- [ ] Error state shows if fetch fails

## 🔍 Troubleshooting

### Leaderboard button doesn't appear

- Check browser console for errors
- Verify `LeaderboardUI` is imported in `src/index.ts`

### "Failed to load leaderboard" error

- Check that Firebase Functions are deployed
- Verify API_BASE_URL in `src/utils/constants.ts`
- Check Firebase Functions logs for errors

### Empty leaderboard even with pets

- Verify pets have `meta.gamePhase = 'pet'` (not 'egg')
- Check that scores are being calculated (server logs)
- Ensure Firestore index is created

### Visit streak not incrementing

- Check server logs during save
- Verify date comparison logic in POST /pet
- Ensure `lastVisitDate` is being saved correctly

### Player rank shows incorrect number

- Verify Firestore query in GET /leaderboard
- Check that score comparison is using correct field path
- Ensure composite index is active

## 📝 Files Modified

### Scene Files (Completed)

- `src/persistence/api.ts` - API types and fetch function
- `src/persistence/serialization.ts` - Serialize with meta preservation
- `src/utils/players.ts` - Get local player name
- `src/systems/Persistence.ts` - Track and pass meta
- `src/factories/LeaderboardUI.tsx` - UI component (NEW)
- `src/index.ts` - Register LeaderboardUI

### Server Files (You Need to Deploy)

- `functions/src/index.ts` - Add/modify endpoints
- Firestore indexes - Create composite index

## 🎊 Feature Complete!

All scene-side code is implemented and ready. Once you deploy the server code from `SERVER_IMPLEMENTATION.md`, the leaderboard will be fully functional!

The incentive structure rewards:

1. **Regular returns** (50 pts/day via visit streak)
2. **Pet care** (10 pts per bond point)
3. **Long-term commitment** (5 pts per day of pet age)

This should encourage players to return daily to maintain their streak and climb the leaderboard!
