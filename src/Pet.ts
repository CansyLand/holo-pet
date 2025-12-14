// EPIC: Pet Care Interactions - Autonomous Pet Behavior
// This is the Pet object that consolidates ALL pet-related logic in one place.
// No more scattered ECS components - everything pet-related lives here.
// This replaces PetComponent, PersonalityComponent, BondComponent, HygieneComponent, etc.

export enum Species {
  // DOG = 'dog',
  // CAT = 'cat',
  // DRAGON = 'dragon',
  TIGER = 'tiger' // For now only tiger is supported
}

export enum PetState {
  IDLE = 'idle',
  EATING = 'eating',
  SLEEPING = 'sleeping',
  SAD = 'sad',
  WANDERING = 'wandering',
  SEEKING_FOOD = 'seeking_food',
  SEEKING_BATH = 'seeking_bath',
  SEEKING_BED = 'seeking_bed',
  FOLLOWING_PLAYER = 'following_player'
}

export enum TrustLevel {
  STRANGER = 'stranger', // 0-20: Pet avoids player
  ACQUAINTANCE = 'acquaintance', // 21-40: Pet tolerates player
  FRIEND = 'friend', // 41-60: Pet approaches player
  BONDED = 'bonded', // 61-80: Pet follows player, occasional hearts
  SOULMATE = 'soulmate' // 81-100: Constant hearts, special animations
}

export class Pet {
  // All pet data in one place (no scattered ECS components)
  data = {
    // Identity
    name: 'Unnamed Pet',
    species: Species.TIGER,
    hatchedAt: Date.now(),
    ownerId: '', // Will be set from wallet

    // Core stats (0-100 scale)
    mood: 100,
    hunger: 0, // 0 = full, 100 = starving
    energy: 100, // 0 = exhausted, 100 = full energy
    cleanliness: 100, // 0 = filthy, 100 = pristine
    bond: 50, // 0-100 relationship level

    // Personality traits (permanent, generated at hatch)
    personality: {
      energy: 50, // High = moves more, hunger grows faster
      sociability: 70, // High = seeks player, bigger petting boost
      cleanliness: 40, // High = gets dirty faster, hates being dirty
      appetite: 60 // High = hungry faster, loves food more
    },

    // State and behavior
    state: PetState.IDLE,
    position: { x: 16, y: 0, z: 16 },
    lastVisit: Date.now(),
    lastBathTime: Date.now(),
    lastBrushTime: Date.now(),

    // State timing for flexibility
    stateStartTime: Date.now(), // When current state began
    stateDuration: 10000, // How long to stay in current state (10 seconds default)

    // Quest progress
    quests: {
      feed: false,
      play: false,
      bath: false,
      bedtime: false
    }
  }

  // Reference to game instance (will be set when created)
  // private game: Game

  constructor(species: Species = Species.TIGER) {
    this.data.species = species
    this.generatePersonality()
    console.log(`Pet created: ${species} with personality`, this.data.personality)
  }

  // Generate random personality traits (20-80 range to avoid extremes)
  private generatePersonality() {
    const min = 20
    const max = 80
    const range = max - min

    this.data.personality = {
      energy: Math.floor(Math.random() * range) + min,
      sociability: Math.floor(Math.random() * range) + min,
      cleanliness: Math.floor(Math.random() * range) + min,
      appetite: Math.floor(Math.random() * range) + min
    }
  }

  // Calculate trust level from bond value
  getTrustLevel(): TrustLevel {
    const bond = this.data.bond
    if (bond <= 20) return TrustLevel.STRANGER
    if (bond <= 40) return TrustLevel.ACQUAINTANCE
    if (bond <= 60) return TrustLevel.FRIEND
    if (bond <= 80) return TrustLevel.BONDED
    return TrustLevel.SOULMATE
  }

  // Main update loop - called every frame
  update(dt: number) {
    this.decayStats(dt)
    this.updateBehavior(dt)
    this.checkStateTransitions()
  }

  // Stats decay over time (modified by personality)
  private decayStats(dt: number) {
    const decayRate = dt / 1000 // Convert to seconds

    // Hunger grows faster with high appetite personality
    const hungerModifier = 1 + this.data.personality.appetite / 100
    this.data.hunger = Math.min(100, this.data.hunger + decayRate * hungerModifier)

    // Energy decays (slightly affected by energy personality)
    const energyModifier = 0.8 + this.data.personality.energy / 500 // Less effect on decay
    this.data.energy = Math.max(0, this.data.energy - decayRate * energyModifier)

    // Cleanliness decays faster with high cleanliness personality
    const cleanlinessModifier = 1 + this.data.personality.cleanliness / 200
    this.data.cleanliness = Math.max(0, this.data.cleanliness - decayRate * cleanlinessModifier)

    // Bond decays when player is absent (1 month = game reset)
    const timeSinceVisit = Date.now() - this.data.lastVisit
    if (timeSinceVisit > 24 * 60 * 60 * 1000) {
      // 24 hours
      this.data.bond = Math.max(0, this.data.bond - decayRate * 2)
    }
  }

  // Change pet state and update timing
  private changeState(newState: PetState, customDuration?: number) {
    if (this.data.state !== newState) {
      this.data.state = newState
      this.data.stateStartTime = Date.now()
      this.data.stateDuration = customDuration || this.getRandomStateDuration()
      console.log(`Pet state changed to ${newState}, duration: ${this.data.stateDuration}ms`)
    }
  }

  // Get random duration for state (8-15 seconds for flexibility)
  private getRandomStateDuration(): number {
    return 8000 + Math.random() * 7000 // 8-15 seconds
  }

  // Check if current state should switch (food priority overrides timer)
  private shouldSwitchState(): boolean {
    // Food is ALWAYS top priority - never switch away if hungry
    if (this.data.hunger > 80 && this.data.state !== PetState.SEEKING_FOOD) {
      return false // Stay in current state, will switch to SEEKING_FOOD in updateBehavior
    }

    const timeInState = Date.now() - this.data.stateStartTime
    return timeInState >= this.data.stateDuration
  }

  // Decide what to do next when state timer expires
  private decideNextState() {
    const rand = Math.random()

    // Weighted random selection based on personality and current stats
    if (this.data.energy < 30 && rand < 0.3) {
      // 30% chance to seek bed if tired
      this.changeState(PetState.SEEKING_BED)
    } else if (this.data.cleanliness < 50 && this.data.personality.cleanliness > 70 && rand < 0.4) {
      // High cleanliness personality + dirty = higher chance to seek bath
      this.changeState(PetState.SEEKING_BATH)
    } else if (this.data.personality.sociability > 70 && rand < 0.5) {
      // Social pets more likely to follow player
      this.changeState(PetState.FOLLOWING_PLAYER)
    } else {
      // Default to wandering
      this.changeState(PetState.WANDERING)
    }
  }

  // Update autonomous behavior based on stats and personality
  // FOOD is top priority - pet will ALWAYS seek food when hungry, regardless of current state
  // After ~10 seconds in current state, pet can flexibly switch to new behaviors
  // This creates more lifelike, less predictable pet behavior
  private updateBehavior(dt: number) {
    // FOOD IS TOP PRIORITY - always seek food if hungry, regardless of current state
    if (this.data.hunger > 80) {
      this.changeState(PetState.SEEKING_FOOD)
      this.moveTowardsFoodBowl()
      return
    }

    // Check if it's time to switch states for more flexibility
    if (this.shouldSwitchState()) {
      this.decideNextState()
    }

    // Execute current state behavior
    switch (this.data.state) {
      case PetState.SEEKING_FOOD:
        this.moveTowardsFoodBowl()
        break
      case PetState.SEEKING_BED:
        if (this.data.energy < 10) {
          this.moveTowardsBed()
        } else {
          // Energy improved, can switch states
          this.decideNextState()
        }
        break
      case PetState.SEEKING_BATH:
        if (this.data.cleanliness < 30 && this.data.personality.cleanliness > 60) {
          this.moveTowardsBath()
        } else {
          // Clean enough, can switch states
          this.decideNextState()
        }
        break
      case PetState.FOLLOWING_PLAYER:
        this.followPlayerBehavior(dt)
        break
      case PetState.WANDERING:
        this.wanderBehavior(dt)
        break
      case PetState.IDLE:
      default:
        this.idleBehavior(dt)
        break
    }
  }

  // Check for state transitions based on thresholds
  private checkStateTransitions() {
    // Become sad when mood is low
    if (this.data.mood < 30 && this.data.state !== PetState.SAD) {
      this.changeState(PetState.SAD, 5000) // Stay sad for 5 seconds minimum
    } else if (this.data.mood >= 30 && this.data.state === PetState.SAD) {
      this.changeState(PetState.IDLE)
    }

    // Become sleeping when energy is critically low
    if (this.data.energy < 5 && this.data.state !== PetState.SLEEPING) {
      this.changeState(PetState.SLEEPING, 20000) // Sleep for 20 seconds when exhausted
      console.log('Pet is very tired and fell asleep')
    }
  }

  // Pet care actions (called by game interactions)
  feed() {
    // Reduce hunger based on appetite personality
    const hungerReduction = 40 * (1 + this.data.personality.appetite / 100)
    this.data.hunger = Math.max(0, this.data.hunger - hungerReduction)

    // Mood boost (smaller than petting)
    this.data.mood = Math.min(100, this.data.mood + 15)

    // Bond increase
    this.data.bond = Math.min(100, this.data.bond + 5)

    this.data.quests.feed = true
    this.recordInteraction()

    console.log(`Fed pet. Hunger: ${this.data.hunger}, Mood: ${this.data.mood}`)
  }

  pet() {
    // Mood boost modified by sociability
    const moodBoost = 25 * (1 + this.data.personality.sociability / 100)
    this.data.mood = Math.min(100, this.data.mood + moodBoost)

    // Bond increase
    const bondBoost = 8 * (1 + this.data.personality.sociability / 100)
    this.data.bond = Math.min(100, this.data.bond + bondBoost)

    this.recordInteraction()

    // TODO: Spawn heart particles
    console.log(`Petted pet. Mood: ${this.data.mood}, Bond: ${this.data.bond}`)
  }

  play() {
    // Big mood boost
    this.data.mood = Math.min(100, this.data.mood + 30)

    // But playing costs energy and makes pet hungry/dirty
    this.data.energy = Math.max(0, this.data.energy - 20)
    this.data.hunger = Math.min(100, this.data.hunger + 15)
    this.data.cleanliness = Math.max(0, this.data.cleanliness - 10)

    // Bond increase
    this.data.bond = Math.min(100, this.data.bond + 10)

    this.data.quests.play = true
    this.recordInteraction()

    // TODO: Spawn yellow particles from ball
    console.log(`Played with pet. Stats updated`)
  }

  bath() {
    // Restore cleanliness
    this.data.cleanliness = 100

    // Mood boost
    this.data.mood = Math.min(100, this.data.mood + 20)

    // Bond increase
    this.data.bond = Math.min(100, this.data.bond + 8)

    this.data.lastBathTime = Date.now()
    this.data.quests.bath = true
    this.recordInteraction()

    // TODO: Spawn bubble particles
    console.log(`Bathed pet. Cleanliness: ${this.data.cleanliness}`)
  }

  brush() {
    // Partial cleanliness restore
    this.data.cleanliness = Math.min(100, this.data.cleanliness + 30)

    // Mood boost
    this.data.mood = Math.min(100, this.data.mood + 15)

    // Bond increase
    this.data.bond = Math.min(100, this.data.bond + 6)

    this.data.lastBrushTime = Date.now()
    this.recordInteraction()

    console.log(`Brushed pet. Cleanliness: ${this.data.cleanliness}`)
  }

  sleep() {
    this.changeState(PetState.SLEEPING, 30000) // Sleep for 30 seconds
    this.data.quests.bedtime = true
    this.recordInteraction()

    // TODO: Show ZZZ particles, start energy recharge
    console.log('Pet went to sleep')
  }

  // Wake up pet (called after sleep timer or player interaction)
  wakeUp() {
    this.changeState(PetState.IDLE)
    this.data.energy = 100 // Full energy after sleep
    console.log('Pet woke up refreshed')
  }

  // Autonomous movement behaviors
  private moveTowardsFoodBowl() {
    // TODO: Move pet towards food bowl position
    // Show hunger indicator above head
    console.log('Pet seeking food bowl')
  }

  private moveTowardsBed() {
    // TODO: Move pet towards bed position
    console.log('Pet seeking bed')
  }

  private moveTowardsBath() {
    // TODO: Move pet towards bath position
    console.log('Pet seeking bath')
  }

  private idleBehavior(dt: number) {
    // TODO: Idle animation - look around, small movements
    // Check for player proximity to potentially follow
    console.log('Pet is idle')
  }

  private wanderBehavior(dt: number) {
    // TODO: Random wandering movement to nearby locations
    // Periodically return to central area as per stories
    console.log('Pet is wandering')
  }

  private followPlayerBehavior(dt: number) {
    // TODO: Move towards player if they're within range and moving slowly
    // Stop following if player moves too fast or gets too far
    console.log('Pet is following player')
  }

  // Record player interaction
  recordInteraction() {
    this.data.lastVisit = Date.now()
  }

  // Set pet name (called after hatching)
  setName(name: string) {
    this.data.name = name
    // Start with proper state timing after naming
    this.changeState(PetState.IDLE)
    console.log(`Pet named: ${name}`)
  }

  // Set owner ID (from wallet)
  setOwner(ownerId: string) {
    this.data.ownerId = ownerId
  }

  // Get current stats for UI/debugging
  getStats() {
    return {
      ...this.data,
      trustLevel: this.getTrustLevel()
    }
  }
}
