# Holo Pet - User Stories & Requirements

## Game Flow Stories

### EPIC: New Player Onboarding

**As a new player entering the Decentraland scene for the first time, I want to experience a smooth onboarding flow so that I can quickly start playing with my pet.**

#### Story: Egg Hatching

**Given** I am a new player entering the scene
**When** I see the giant egg for the first time
**Then** I can click it to initiate the hatching process
**And** the egg shows hatching animations (scale 1.2) then shrinks to scale 0 using tweens
https://docs.decentraland.org/creator/scenes-sdk7/3d-essentials/move-entities
**Then** Egg turns invisible -> pets scene items are made visible. pet, bed, bath, decoration, ball

#### Story: Pet Naming

**Given** my egg has hatched into a pet
**When** the pet appears
**Then** a naming UI dialog appears
**And** I can enter a custom name for my pet
**And** the pet is assigned that name permanently

#### Story: First Interaction

**Given** I have named my pet
**When** the naming dialog closes
**Then** I can immediately interact with my pet
**And** all basic game mechanics are available

---

### EPIC: Pet Care Interactions

**As a pet owner, I want to perform various care interactions so that I can keep my pet happy and healthy.**

#### Story: Petting Interaction

**Given** my pet is visible in the scene
**When** I click on my pet
**Then** the camera smoothly zooms in on the pet
**And** my cursor detaches from player movement
**And** I can click the pet to pet it
**And** heart particles appear with each pet
**And** the pet's bond and mood stats increase

#### Story: Petting - Exit Focus

**Given** I am in petting focus mode
**When** I right-click, press F, or walk away
**Then** the camera smoothly returns to normal
**And** my cursor reattaches to player movement
**And** I can move around normally again

#### Story: Bathing Interaction

**Given** my pet needs cleaning
**When** I click the bath tub
**Then** my pet automatically walks to the bath
**And** sits down in the bath tub
**And** the camera focuses on the pet in the bath
**And** I can click the pet to clean it
**And** bubble particles appear with each cleaning click
**And** the pet's cleanliness stat increases

#### Story: Feeding Interaction

**Given** my pet is hungry
**When** I click the food bowl
**Then** my pet's hunger stat decreases
**And** I get visual feedbackfrom bwol that feeding occurred particel appeat on click similar to pet and bath
**And** the pet's mood may increase slightly

#### Story: Play Interaction

**Given** I want to play with my pet
**When** I click the ball
**Then** my pet's mood increases significantly
**And** some stats decrease (energy, hunger, cleanliness)
**And** I get immediate feedback that play occurred yellow particles spawn from ball

---

### EPIC: Daily Quest System

**As a player who wants progression and routine, I want daily quests so that I feel accomplished and have goals.**

#### Story: Quest Tracking

**Given** I enter the scene
**When** I check my quests
**Then** I see 4 daily quests: Feed, Play, Bath, Bedtime
**And** each quest shows completion status
**And** I can track my progress

#### Story: Quest Completion

**Given** I complete a quest interaction
**When** the interaction finishes
**Then** the corresponding quest marks as completed
**And** I get visual feedback -> how its done in the ui pefore
**And** my overall progress updates

#### Story: Quest Reset

**Given** it's a new day (different date)
**When** I enter the scene
**Then** all quests reset to incomplete
**And** I can complete them again for the new day

---

### EPIC: Social Features

**As a social player, I want to visit other players so that I can see their pets and feel connected to the community.**

#### Story: Visit Player Selection

**Given** I want to visit another player
**When** I click the "Visit Player" option
**Then** I see a UI listing active players with pets
**And** I can select which player to visit
**And** their pet loads into the scene

#### Story: Visiting Experience

**Given** I have selected a player to visit
**When** their pet loads
**Then** the other player becomes visible in the scene
**And** I can see their pet but cannot modify it
**And** I can observe their pet's behavior and stats
**And** the scene shows I'm in "visit mode"

#### Story: Returning Home

**Given** I am visiting another player's scene
**When** I click "Go Home" or exit visit mode
**Then** the other player's pet is removed
**And** the other player becomes invisible
**And** I return to my own scene with my pet

---

## Pet Behavior Stories

### EPIC: Autonomous Pet Behavior

**As a pet with personality, I want to show realistic behaviors so that I feel alive and responsive to my environment.**

#### Story: Hunger-Driven Behavior

**Given** my hunger is very high (>80)
**When** I have autonomy
**Then** I automatically walk to the food bowl
**And** sit/wait at the bowl location
**And** face the bowl expectantly
**And** show hunger animation or indicator a billboard plane above my head showing a food item

#### Story: Hunger - Player Response

**Given** I am waiting at the food bowl due to hunger
**When** the player approaches within interaction range
**Then** I turn to face the player
**And** play anticipation audio
**And** become ready for feeding interaction

#### Story: Tiredness Behavior

**Given** my energy is very low (<20)
**When** I have autonomy
**Then** I move slower than normal
**And** seek out the bed when energy is critically low (<10)

#### Story: Sleep Behavior

**Given** I am at the bed due to low energy
**When** the player initiates sleep interaction
**Then** I enter sleep mode
**And** my energy gradually recharges over time
**And** I show sleep gltf animation and an ZZZ over my head
**And** I wake up refreshed when energy is full

#### Story: Personality - Energy Influence

**Given** I have high energy personality
**When** I have autonomy
**Then** I move faster and more actively
**And** I initiate play behaviors more often (staying in front of ball (similar to food bowl))
**And** I get tired less quickly from activities

#### Story: Personality - Sociability Influence

**Given** I have high sociability personality
**When** the player is nearby
**Then** I follow the player more closely
**And** I respond more enthusiastically to interactions
**And** I seek out player attention more actively

#### Story: Personality - Cleanliness Influence

**Given** I have high cleanliness preference
**When** my cleanliness is low
**Then** I seek out the bath more proactively
**And** I show stinky lines above me when dirty
**And** I respond more positively to cleaning

#### Story: Personality - Appetite Influence

**Given** I have high appetite personality
**When** I need feeding
**Then** I get hungry faster than average pets
**And** I show stronger hunger indicators
**And** I seek food more aggressively

#### Story: Bonding - Owner Recognition

**Given** my bond level is high (>70)
**When** my owner enters the scene
**Then** I show excited greeting behavior
**And** I follow them more closely
**And** I respond more enthusiastically to interactions

For now on hold this will be implemented later[

#### Story: Bonding - Abandonment Response

**Given** I haven't seen my owner for 1 month
**When** I have autonomy
**Then** I walk away
**And** and game resets
**And** Player sees egg
]

#### Story: Idle Wandering

**Given** I have nothing specific to do
**When** I have autonomy and moderate energy
**Then** I occasionally wander to random nearby locations
**And** I look around curiously
**And** I interact with environmental objects
**And** I return to central area periodically

#### Story: Player Proximity Response

**Given** I am in idle or wandering state
**When** the player comes within 3 meters
**Then** I stop current activity
**And** I turn to face the player
**And** I show attention/getting ready to interact
**And** I wait for player input
**If** Player moves slowly away I follow
**If** PLayer runs fast away I do my agency what i want

#### Story: Multiplayer Awareness

**Given** there are other pets/players in the scene
**When** I have autonomy
**Then** I occasionally look at other pets
**And** I may approach other pets if very social
**And** I show curiosity about other players
**And** I maintain appropriate social distance 1m.

---

## Technical Requirements

### Performance Requirements

- All interactions should respond within 100ms
- Pet behavior updates should run at 30fps minimum
- Particle effects should not drop below 20fps
- Scene loading should complete within 3 seconds
- **Proximity detection**: Player proximity response within 3 meters
- **Social distancing**: Maintain 1 meter distance from other pets/players

### Visual Requirements (For now just cubes. Different color based on the type. Hearts ping, bubbles blue etc) (there is only 1 particle pool, the colors are adjusted dynamically based on the current interaction.) (zzz are alwso particles -> white)

- **Heart particles**: Red/pink, float upward, fade out (petting interaction)
- **Bubble particles**: Blue/white, rise from bath, pop effect (bathing interaction)
- **Food particles**: Appear from food bowl on feeding click (similar to pet/bath particles)
- **Yellow particles**: Spawn from ball on play interaction
- **Hunger indicator**: Billboard plane above pet head showing food item when very hungry
- **Sleep indicator**: ZZZ text above pet head during sleep
- **Dirty indicator**: Stinky lines above pet head when cleanliness is low
- **Camera transitions**: Smooth 1-second transitions
- **UI elements**: Clear, readable, mobile-friendly

### Audio Requirements

- **Petting**: Soft happy sound effects
- **Bathing**: Water/bubble sound effects
- **Feeding**: Eating/chewing sounds
- **Hunger anticipation**: Audio cue when pet faces player at food bowl
- **Background**: Looping ambient music

### Save/Load Requirements

- All pet stats persist between sessions
- Quest progress saves immediately
- Personality traits never change
- Visit history tracks last interaction times
- **Abandonment reset**: Game resets to egg state after 1 month without owner visits

---

## Future Enhancement Stories

### EPIC: Mini-Games (Future)

**As a player who wants more engagement, I want mini-games for each interaction so that activities feel more involved.**

#### Story: Ball Physics Mini-Game

**Given** I click the ball
**When** the mini-game activates
**Then** I can throw the ball with physics
**And** the pet chases and fetches it
**And** multiple throws create a fetch session

#### Story: Bath Time Mini-Game

**Given** I initiate bathing
**When** the mini-game activates
**Then** I need to click specific spots on the pet
**And** water particles show cleaning progress
**And** the pet reacts to the cleaning

#### Story: Feeding Variety Mini-Game

**Given** I click the food bowl
**When** the mini-game activates
**Then** I can choose different food types
**And** each food has different stat effects
**And** the pet shows preference animations

---

## Quality Assurance Stories

### EPIC: Bug Prevention

**As a developer, I want comprehensive testing so that the game works reliably.**

#### Story: State Validation

**Given** the game is running
**When** any state change occurs
**Then** all related systems validate the change
**And** invalid states are corrected automatically
**And** warnings are logged for debugging

#### Story: Performance Monitoring

**Given** the game is running
**When** performance drops below thresholds
**Then** less critical systems disable automatically
**And** visual quality reduces gracefully
**And** core gameplay remains functional
