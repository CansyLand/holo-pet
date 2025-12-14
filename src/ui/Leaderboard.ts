// EPIC: Social Features - Visit Player Selection
// Leaderboard UI for showing top players and their pet stats.
// Displays active players with pets that can be visited.

import { game } from '../Game'

export class LeaderboardUI {
  private isVisible = false
  private leaderboardData: any[] = []

  constructor() {
    console.log('🏆 Leaderboard UI initialized')
  }

  show() {
    this.isVisible = true
    this.loadLeaderboardData()
    this.render()
    console.log('🏆 Leaderboard shown')
  }

  hide() {
    this.isVisible = false
    // TODO: Hide UI elements
    console.log('🏆 Leaderboard hidden')
  }

  private loadLeaderboardData() {
    // TODO: Fetch leaderboard data from server
    // For now, mock data
    this.leaderboardData = [
      { name: 'Alice', petName: 'Fluffy', bond: 95, questsCompleted: 28 },
      { name: 'Bob', petName: 'Tiger', bond: 87, questsCompleted: 24 },
      { name: 'Charlie', petName: 'Dragon', bond: 92, questsCompleted: 31 }
    ]
    console.log('🏆 Leaderboard data loaded')
  }

  private render() {
    // TODO: Render leaderboard UI using ReactEcsRenderer
    console.log('🏆 Rendering leaderboard')
  }

  // Handle player selection for visiting
  onPlayerSelect(playerName: string) {
    console.log(`🏆 Selected player to visit: ${playerName}`)
    // TODO: Initiate visit to selected player
    // TODO: Load their pet data
    // TODO: Switch to visit mode
  }

  // Update leaderboard (called periodically)
  update() {
    if (this.isVisible) {
      this.loadLeaderboardData()
      this.render()
    }
  }

  // Get current player's ranking
  getCurrentPlayerRank(): number {
    // TODO: Calculate current player's position
    return 1 // Placeholder
  }
}

export const leaderboardUI = new LeaderboardUI()
