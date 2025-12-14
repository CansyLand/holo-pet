# Server Implementation for Leaderboard Feature

This file contains the Firebase Functions code you need to deploy to enable the leaderboard feature.

## Changes Required

### 1. Update POST /pet Endpoint

Add streak calculation and score computation to your existing `/pet` POST endpoint in `functions/src/index.ts`:

```typescript
// =============================================================================
// POST /pet - Save pet data (UPDATED)
// =============================================================================
app.post(
  '/pet',
  dclExpress({ expiration: 10 * 60 * 1000 }), // 10 minutes
  async (req: Request & dcl.DecentralandSignatureData<any>, res: express.Response) => {
    try {
      const walletAddress = req.auth.toLowerCase()
      const petData = req.body

      console.log('Saving pet for wallet:', walletAddress)

      const docRef = db.collection('pets').doc(walletAddress)
      const doc = await docRef.get()

      // Calculate visit streak
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const existingData = doc.exists ? doc.data() : null

      let visitStreak = 1
      let lastVisitDate = today

      if (existingData?.meta?.lastVisitDate) {
        const lastDate = existingData.meta.lastVisitDate
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (lastDate === today) {
          // Same day visit - preserve streak
          visitStreak = existingData.meta.visitStreak || 1
        } else if (lastDate === yesterdayStr) {
          // Consecutive day - increment streak
          visitStreak = (existingData.meta.visitStreak || 0) + 1
        } else {
          // Streak broken - reset to 1
          visitStreak = 1
        }
      }

      // Calculate composite score
      // score = (bond × 10) + (visitStreak × 50) + (petAgeDays × 5)
      const bond = petData.bond?.bond || 0
      const hatchedAt = petData.identity?.hatchedAt || Date.now()
      const petAgeDays = Math.floor((Date.now() - hatchedAt) / (1000 * 60 * 60 * 24))
      const score = bond * 10 + visitStreak * 50 + petAgeDays * 5

      // Update meta with calculated values
      petData.meta = {
        ...petData.meta,
        updatedAt: Date.now(),
        version: '1.0.0',
        visitStreak: visitStreak,
        lastVisitDate: lastVisitDate,
        score: Math.round(score)
      }

      // Set createdAt only if new document
      if (!doc.exists) {
        petData.meta.createdAt = Date.now()
      }

      await docRef.set(petData, { merge: true })

      console.log(`Pet saved successfully for wallet: ${walletAddress} (Streak: ${visitStreak}, Score: ${score})`)
      return res.json({ success: true })
    } catch (error) {
      console.error('Save pet error:', error)
      return res.status(500).json({ success: false, error: 'Failed to save pet' })
    }
  }
)
```

### 2. Add GET /leaderboard Endpoint

Add this new endpoint after your existing endpoints:

```typescript
// =============================================================================
// GET /leaderboard - Fetch top 10 + player rank
// =============================================================================
app.get(
  '/leaderboard',
  dclExpress({ expiration: 10 * 60 * 1000 }), // 10 minutes
  async (req: Request & dcl.DecentralandSignatureData<any>, res: express.Response) => {
    try {
      const walletAddress = req.auth.toLowerCase()

      console.log('Fetching leaderboard for wallet:', walletAddress)

      // Get top 10 players ordered by score
      const top10Snapshot = await db
        .collection('pets')
        .where('meta.gamePhase', '==', 'pet') // Only include active pets
        .orderBy('meta.score', 'desc')
        .limit(10)
        .get()

      const top10: any[] = []
      top10Snapshot.forEach((doc, index) => {
        const data = doc.data()
        top10.push({
          rank: index + 1,
          petName: data.identity?.name || 'Unnamed',
          ownerName: data.meta?.ownerName || `${doc.id.slice(0, 6)}...${doc.id.slice(-4)}`,
          score: data.meta?.score || 0,
          bond: data.bond?.bond || 0,
          visitStreak: data.meta?.visitStreak || 0
        })
      })

      // Find player's rank
      let playerRank = null
      const playerDoc = await db.collection('pets').doc(walletAddress).get()

      if (playerDoc.exists) {
        const playerData = playerDoc.data()
        const playerScore = playerData?.meta?.score || 0

        // Count how many players have a higher score
        const higherScoreCount = await db
          .collection('pets')
          .where('meta.gamePhase', '==', 'pet')
          .where('meta.score', '>', playerScore)
          .count()
          .get()

        const rank = higherScoreCount.data().count + 1

        playerRank = {
          rank: rank,
          score: playerScore,
          petName: playerData?.identity?.name || 'Unnamed',
          ownerName: playerData?.meta?.ownerName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        }
      }

      console.log(`Leaderboard fetched: ${top10.length} entries, player rank: ${playerRank?.rank || 'N/A'}`)

      return res.json({
        success: true,
        leaderboard: {
          top10: top10,
          playerRank: playerRank
        }
      })
    } catch (error) {
      console.error('Leaderboard fetch error:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' })
    }
  }
)
```

## Firestore Index Required

For the leaderboard query to work efficiently, you need to create a composite index in Firestore:

**Index Configuration:**

- Collection: `pets`
- Fields:
  1. `meta.gamePhase` (Ascending)
  2. `meta.score` (Descending)

**How to Create:**

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Add the fields above
4. Click "Create"

Alternatively, when you first run the leaderboard query, Firebase will provide a link to automatically create the index.

## Testing Checklist

After deploying these changes:

- [ ] Test POST /pet - verify visitStreak increments correctly
- [ ] Test POST /pet - verify score calculation is correct
- [ ] Test GET /leaderboard - verify top 10 is returned
- [ ] Test GET /leaderboard - verify player rank is calculated correctly
- [ ] Test streak reset after missing a day
- [ ] Test with multiple players to verify ranking order

## Score Formula Reference

```
score = (bond × 10) + (visitStreak × 50) + (petAgeDays × 5)
```

- **Bond (max 1000 pts)**: Rewards maintaining relationship (0-100 bond × 10)
- **Visit Streak (50 pts/day)**: Main incentive for daily returns
- **Pet Age (5 pts/day)**: Rewards long-term commitment

## Example Scores

| Bond | Streak | Age (days) | Total Score |
| ---- | ------ | ---------- | ----------- |
| 100  | 10     | 30         | 1650        |
| 80   | 5      | 15         | 1125        |
| 60   | 1      | 5          | 675         |
| 40   | 0      | 2          | 410         |

## Deployment

```bash
# Navigate to your Firebase Functions directory
cd functions

# Deploy the updated functions
firebase deploy --only functions
```
