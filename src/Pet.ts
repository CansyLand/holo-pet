// EPIC: Pet Care Interactions - Autonomous Pet Behavior
// This is the Pet object that consolidates ALL pet-related logic in one place.
// No more scattered ECS components - everything pet-related lives here.
// This replaces PetComponent, PersonalityComponent, BondComponent, HygieneComponent, etc.

import { Entity, engine, MeshCollider, ColliderLayer, pointerEventsSystem, InputAction, Animator } from '@dcl/sdk/ecs'
import { game, GameModule } from './Game'
import { EntityNames } from '../assets/scene/entity-names'
import { cameraFocus } from './services/CameraFocus'
import { CursorFollowComponent } from './services/CameraFocus'
import { PrimaryPointerInfo, UiCanvasInformation, Transform } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

/**
 * 
 * Animations:
 *  Idle
 *  Sitting (sits down)
 *  Standing  (stands up
 *  Walking
 * 
 
 */

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
  SEEKING_BALL = 'seeking_ball',
  SEEKING_DECORATION = 'seeking_decoration',
  SEEKING_POOP = 'seeking_poop',
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
  // Reference to the ECS entity (set by PetModule)
  entity: Entity | null = null

  // Static method to find and assign pet entity
  static assignEntityToPet(pet: Pet): boolean {
    const tigerEntity = engine.getEntityOrNullByName(EntityNames.Tiger)
    if (tigerEntity) {
      pet.entity = tigerEntity
      console.log('🐾 Pet entity reference set')
      return true
    } else {
      console.error('🐾 Tiger entity not found!')
      return false
    }
  }

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
    },

    // Cursor follow config (for focus mode)
    cursorFollow: {
      isActive: false,
      baseRotation: { x: 0, y: 0, z: 0, w: 1 },
      maxTiltAngle: 15 // degrees
    },

    // Autonomous behavior system
    activityTimer: 0,
    cachedPoopPosition: null as Vector3 | null,
    isMoving: false // Track if pet is currently moving
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
    this.updateCursorFollow(dt)
  }

  // Stats decay over time (modified by personality)
  private decayStats(dt: number) {
    const decayRate = dt / 1000 // Convert to seconds

    // Hunger grows faster with high appetite personality
    const hungerModifier = 1000 + this.data.personality.appetite / 100
    this.data.hunger = Math.min(100, this.data.hunger + decayRate * hungerModifier)

    // Energy decays (slightly affected by energy personality)
    const energyModifier = 100 + this.data.personality.energy / 500 // Less effect on decay
    this.data.energy = Math.max(0, this.data.energy - decayRate * energyModifier)

    // Cleanliness decays faster with high cleanliness personality
    const cleanlinessModifier = 100 + this.data.personality.cleanliness / 200
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
      // Clear poop cache when changing away from SEEKING_POOP
      if (this.data.state === PetState.SEEKING_POOP && newState !== PetState.SEEKING_POOP) {
        this.data.cachedPoopPosition = null
      }

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

  // Decide next activity based on current needs (called every 10 seconds)
  private decideNextActivity() {
    console.log('🐾 Checking what to do next...')

    // Check needs in priority order
    if (this.data.hunger > 80) {
      this.changeState(PetState.SEEKING_FOOD)
      console.log('🐾 Decided: seeking food (hungry!)')
    } else if (this.getPlayerDistance() < 4) {
      this.changeState(PetState.FOLLOWING_PLAYER)
      console.log('🐾 Decided: following player (owner nearby!)')
    } else if (this.data.energy < 20) {
      this.changeState(PetState.SEEKING_BED)
      console.log('🐾 Decided: seeking bed (tired)')
    } else if (this.data.cleanliness < 40 && this.data.personality.cleanliness > 75) {
      this.changeState(PetState.SEEKING_BATH)
      console.log('🐾 Decided: seeking bath (dirty - clean freak personality)')
    } else {
      // No urgent needs - pick fun activity based on personality
      this.pickFunActivity()
    }
  }

  // Pick fun activity when no needs (personality-driven)
  private pickFunActivity() {
    const roll = Math.random() * 100
    const p = this.data.personality

    console.log(
      `🐾 Picking fun activity (roll: ${roll.toFixed(1)}, personality: energy=${p.energy}, appetite=${
        p.appetite
      }, cleanliness=${p.cleanliness})`
    )

    if (roll < p.appetite * 0.2) {
      this.changeState(PetState.SEEKING_FOOD)
      console.log('🐾 Fun activity: seeking food (likes eating)')
    } else if (roll < 25 + p.energy * 0.3) {
      this.changeState(PetState.SEEKING_BALL)
      console.log('🐾 Fun activity: seeking ball (energetic)')
    } else if (roll < 45 + p.cleanliness * 0.3) {
      this.changeState(PetState.SEEKING_BATH)
      console.log('🐾 Fun activity: seeking bath (clean freak)')
    } else if (roll < 65) {
      this.changeState(PetState.SEEKING_DECORATION)
      console.log('🐾 Fun activity: seeking decoration (curious)')
    } else {
      this.changeState(PetState.SEEKING_POOP)
      console.log('🐾 Fun activity: seeking poop (sniffing around)')
    }
  }

  // Execute current activity with exit conditions
  private executeCurrentActivity(dt: number) {
    switch (this.data.state) {
      case PetState.SEEKING_FOOD:
        if (this.data.hunger > 60) {
          // Still hungry enough - keep moving
          if (this.moveTowardsFoodBowl(dt)) {
            // Arrived at food bowl
            console.log('🐾 Arrived at food bowl!')
          }
        } else {
          this.changeState(PetState.IDLE) // Done eating
          console.log('🐾 Finished seeking food (not hungry anymore)')
        }
        break

      case PetState.SEEKING_BED:
        if (this.data.energy < 15) {
          // Still tired enough - keep moving
          if (this.moveTowardsBed(dt)) {
            // Arrived at bed
            console.log('🐾 Arrived at bed!')
          }
        } else {
          this.changeState(PetState.IDLE) // Rested enough
          console.log('🐾 Finished seeking bed (not tired anymore)')
        }
        break

      case PetState.SEEKING_BATH:
        if (this.data.cleanliness < 35) {
          // Still dirty enough - keep moving
          if (this.moveTowardsBath(dt)) {
            // Arrived at bath
            console.log('🐾 Arrived at bath!')
          }
        } else {
          this.changeState(PetState.IDLE) // Clean enough
          console.log('🐾 Finished seeking bath (clean enough)')
        }
        break

      case PetState.SEEKING_BALL:
        if (this.moveTowardsBall(dt)) {
          // Arrived at ball - stay there until timer changes activity
          console.log('🐾 Arrived at ball - play time!')
        }
        break

      case PetState.SEEKING_DECORATION:
        if (this.moveTowardsDecoration(dt)) {
          // Arrived at decoration - stay there until timer changes activity
          console.log('🐾 Arrived at decoration - curious!')
        }
        break

      case PetState.SEEKING_POOP:
        if (this.moveTowardsPoop(dt)) {
          // Arrived at poop - clear cache and stay there until timer changes activity
          this.data.cachedPoopPosition = null
          console.log('🐾 Arrived at poop - sniffing!')
        }
        break

      case PetState.FOLLOWING_PLAYER:
        if (this.getPlayerDistance() < 5) {
          // Player still nearby - move towards player
          this.followPlayerBehavior(dt)
        } else {
          this.changeState(PetState.IDLE) // Player moved away
          console.log('🐾 Stopped following player (moved away)')
        }
        break

      case PetState.IDLE:
      default:
        this.idleBehavior(dt) // Idle continues until timer changes it
        // Make sure idle animation is playing when idle
        if (this.data.isMoving) {
          this.playIdleAnimation()
        }
        break
    }
  }

  // Get distance to player
  private getPlayerDistance(): number {
    const playerPos = Transform.get(engine.PlayerEntity).position
    const petPos = this.entity ? Transform.get(this.entity).position : this.data.position
    return Vector3.distance(playerPos, petPos)
  }

  // Look at player when nearby
  private lookAtPlayer() {
    if (!this.entity) return
    const playerPos = Transform.get(engine.PlayerEntity).position
    const petTransform = Transform.getMutable(this.entity)
    const direction = Vector3.subtract(playerPos, petTransform.position)
    petTransform.rotation = Quaternion.lookRotation(direction)
  }

  // Move towards target (stub - implement actual movement)
  private goTo(target: string) {
    console.log(`🐾 Pet going to: ${target}`)
    // TODO: Get target position and move pet there
  }

  // Get position of a station entity
  private getStationPosition(entityName: string): Vector3 | null {
    const entity = engine.getEntityOrNullByName(entityName)
    if (!entity) return null

    try {
      const transform = Transform.get(entity)
      return transform.position
    } catch {
      return null
    }
  }

  // Get random poop position from the 7 available poop entities
  private getRandomPoopPosition(): Vector3 | null {
    const poopNames = [
      EntityNames.Poop_1,
      EntityNames.Poop_2,
      EntityNames.Poop_3,
      EntityNames.Poop_4,
      EntityNames.Poop_5,
      EntityNames.Poop_6,
      EntityNames.Poop_7
    ]

    // Pick a random poop entity
    const randomPoop = poopNames[Math.floor(Math.random() * poopNames.length)]
    return this.getStationPosition(randomPoop)
  }

  // Play walking animation
  private playWalkingAnimation() {
    if (!this.entity || this.data.isMoving) return

    // Check if Animator component exists
    try {
      const animator = Animator.getClip(this.entity, 'Walking')
      if (!animator) return // Animator not set up yet
    } catch {
      return // Animator component doesn't exist
    }

    this.data.isMoving = true
    try {
      Animator.playSingleAnimation(this.entity, 'Walking')
      console.log('🐾 Playing walking animation')
    } catch (error) {
      console.log('🐾 Walking animation not found')
    }
  }

  // Play idle animation
  private playIdleAnimation() {
    if (!this.entity) return

    // Only switch to idle if currently moving
    if (!this.data.isMoving) return

    // Check if Animator component exists
    try {
      const animator = Animator.getClip(this.entity, 'Idle')
      if (!animator) return // Animator not set up yet
    } catch {
      return // Animator component doesn't exist
    }

    this.data.isMoving = false
    try {
      Animator.playSingleAnimation(this.entity, 'Idle')
      console.log('🐾 Playing idle animation')
    } catch (error) {
      console.log('🐾 Idle animation not found')
    }
  }

  // Simple movement towards target position
  private moveTowards(targetPos: Vector3, dt: number): boolean {
    if (!this.entity) return false

    const transform = Transform.getMutable(this.entity)
    const currentPos = transform.position
    const distance = Vector3.distance(currentPos, targetPos)

    // Arrived at destination?
    if (distance < 0.5) {
      console.log('🐾 Arrived at destination!')
      this.playIdleAnimation() // Stop moving, play idle
      return true // Signal we arrived
    }

    // Start walking animation if not already moving
    this.playWalkingAnimation()

    // Simple lerp movement
    const moveSpeed = 2.0 * dt // Units per second
    const direction = Vector3.normalize(Vector3.subtract(targetPos, currentPos))

    transform.position = Vector3.add(currentPos, Vector3.scale(direction, Math.min(moveSpeed, distance)))

    // Face movement direction
    this.faceDirection(direction)

    return false // Still moving
  }

  // Face a direction (simple XZ plane rotation)
  private faceDirection(direction: Vector3) {
    if (!this.entity || (direction.x === 0 && direction.z === 0)) return

    const angle = Math.atan2(direction.x, direction.z)
    const transform = Transform.getMutable(this.entity)
    transform.rotation = Quaternion.fromEulerDegrees(0, (angle * 180) / Math.PI, 0)
  }

  // Simplified autonomous behavior system
  private updateBehavior(dt: number) {
    // Don't disturb sleep
    if (this.data.state === PetState.SLEEPING) return

    // Always look at player when close
    if (this.getPlayerDistance() < 4) {
      this.lookAtPlayer()
    }

    // Simple timer for activity changes (faster state switching)
    this.data.activityTimer += dt
    if (this.data.activityTimer > 15) {
      // Changed from 10 to 5 seconds for faster state changes
      this.data.activityTimer = 0
      this.decideNextActivity()
    }

    // Execute current activity with exit conditions
    this.executeCurrentActivity(dt)
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

  // Cursor follow functionality (for focus mode)
  enableCursorFollow() {
    if (this.data.cursorFollow.isActive || !this.entity) return

    // Capture current rotation as base
    const currentTransform = Transform.get(this.entity)
    this.data.cursorFollow.baseRotation = {
      x: currentTransform.rotation.x,
      y: currentTransform.rotation.y,
      z: currentTransform.rotation.z,
      w: currentTransform.rotation.w
    }
    this.data.cursorFollow.isActive = true
    console.log('👁️ Cursor follow enabled for pet')
  }

  disableCursorFollow() {
    if (!this.data.cursorFollow.isActive || !this.entity) return

    // Reset rotation to base rotation
    const petTransform = Transform.getMutable(this.entity)
    petTransform.rotation = {
      x: this.data.cursorFollow.baseRotation.x,
      y: this.data.cursorFollow.baseRotation.y,
      z: this.data.cursorFollow.baseRotation.z,
      w: this.data.cursorFollow.baseRotation.w
    }

    this.data.cursorFollow.isActive = false
    console.log('👁️ Cursor follow disabled for pet - rotation reset')
  }

  updateCursorFollow(dt: number) {
    if (!this.data.cursorFollow.isActive || !this.entity) return

    // Get cursor position as percentage of canvas
    const pointerInfo = PrimaryPointerInfo.get(engine.RootEntity)
    if (!pointerInfo?.screenCoordinates) return

    const cursorPos = pointerInfo.screenCoordinates
    const canvas = UiCanvasInformation.get(engine.RootEntity)
    if (!canvas) return

    const percentX = (cursorPos.x / canvas.width) * 100
    const percentY = (cursorPos.y / canvas.height) * 100

    // Normalize cursor to -1 to 1 range (center = 0)
    const normalizedX = (percentX / 100 - 0.5) * 2 // -1 (left) to 1 (right)
    const normalizedY = (percentY / 100 - 0.5) * 2 // -1 (top) to 1 (bottom)

    // Get pet transform
    const petTransform = Transform.getMutable(this.entity)

    // Calculate target rotations based on cursor position (in degrees)
    const targetRotY = -normalizedX * this.data.cursorFollow.maxTiltAngle
    const targetRotX = -normalizedY * (this.data.cursorFollow.maxTiltAngle * 0.5) // Less vertical tilt

    // Create target rotation by modifying the base rotation
    const tiltRotation = Quaternion.fromEulerDegrees(targetRotX, targetRotY, 0)
    petTransform.rotation = Quaternion.multiply(this.data.cursorFollow.baseRotation, tiltRotation)
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
  private moveTowardsFoodBowl(dt: number): boolean {
    const targetPos = this.getStationPosition(EntityNames.Food_Bowl)
    if (!targetPos) return true // Can't find food bowl, consider arrived

    console.log('🐾 Pet seeking food bowl')
    return this.moveTowards(targetPos, dt)
  }

  private moveTowardsBed(dt: number): boolean {
    const targetPos = this.getStationPosition(EntityNames.Bed)
    if (!targetPos) return true // Can't find bed, consider arrived

    console.log('🐾 Pet seeking bed')
    return this.moveTowards(targetPos, dt)
  }

  private moveTowardsBath(dt: number): boolean {
    const targetPos = this.getStationPosition(EntityNames.Bath_Tub)
    if (!targetPos) return true // Can't find bath, consider arrived

    console.log('🐾 Pet seeking bath')
    return this.moveTowards(targetPos, dt)
  }

  private moveTowardsBall(dt: number): boolean {
    const targetPos = this.getStationPosition(EntityNames.Ball)
    if (!targetPos) return true // Can't find ball, consider arrived

    console.log('🐾 Pet seeking ball')
    return this.moveTowards(targetPos, dt)
  }

  private moveTowardsDecoration(dt: number): boolean {
    const targetPos = this.getStationPosition(EntityNames.Decoration)
    if (!targetPos) return true // Can't find decoration, consider arrived

    console.log('🐾 Pet seeking decoration')
    return this.moveTowards(targetPos, dt)
  }

  private moveTowardsPoop(dt: number): boolean {
    // Cache the poop position when first starting to seek poop
    if (!this.data.cachedPoopPosition) {
      this.data.cachedPoopPosition = this.getRandomPoopPosition()
      if (!this.data.cachedPoopPosition) return true // Can't find any poop, consider arrived
    }

    console.log('🐾 Pet seeking poop')
    return this.moveTowards(this.data.cachedPoopPosition, dt)
  }

  private idleBehavior(dt: number) {
    // Pet is idle - just standing still, looking around
    // The timer will pick a new activity soon
    // No movement, just waiting for next activity decision
  }

  private followPlayerBehavior(dt: number) {
    const playerPos = Transform.get(engine.PlayerEntity).position
    if (!this.entity) return

    const transform = Transform.getMutable(this.entity)
    const currentPos = transform.position
    const distance = Vector3.distance(currentPos, playerPos)

    // Don't get too close - stop at a comfortable distance
    if (distance < 2.0) {
      // Close enough - just face the player
      this.lookAtPlayer()
      return
    }

    // Move towards player
    console.log('🐾 Pet is following player')
    const targetPos = playerPos
    this.moveTowards(targetPos, dt)
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

export class PetModule implements GameModule {
  name = 'Pet'
  petEntity: Entity | null = null

  init() {
    console.log('🐾 PetModule init')
    this.setupPetEntity()
  }

  private setupPetEntity() {
    this.petEntity = engine.getEntityOrNullByName(EntityNames.Tiger)
    if (!this.petEntity) {
      console.error('🐾 Tiger not found')
      return
    }

    // Set entity reference on the pet object
    if (game.state.pet) {
      game.state.pet.entity = this.petEntity
    }

    // Set up Animator component for pet animations
    try {
      Animator.create(this.petEntity, {
        states: [
          {
            clip: 'Idle',
            playing: true,
            loop: true
          },
          {
            clip: 'Walking',
            playing: false,
            loop: true
          },
          {
            clip: 'Sitting',
            playing: false,
            loop: true
          },
          {
            clip: 'Standing',
            playing: false,
            loop: false
          }
        ]
      })
      console.log('🐾 Animator component set up')
    } catch (error) {
      console.log('🐾 Animator setup failed (animations may not exist in model):', error)
    }

    // if (!MeshCollider.has(this.petEntity)) {
    //   MeshCollider.setSphere(this.petEntity, ColliderLayer.CL_POINTER)
    // }

    this.setupPointerEvents()

    console.log('🐾 Tiger set up!')
  }

  setupPointerEvents() {
    if (!this.petEntity) {
      console.error('🐾 Cannot set up pointer events - pet entity not found!')
      return
    }

    pointerEventsSystem.onPointerDown(
      { entity: this.petEntity, opts: { button: InputAction.IA_POINTER, hoverText: 'Pet companion 🐾' } },
      () => {
        console.log('🐾 Tiger clicked!')
        cameraFocus.focusOn(this.petEntity!)
      }
    )

    console.log('🐾 Pet pointer events set up')
  }

  update(dt: number) {
    game.state.pet?.update(dt)
  }
}
