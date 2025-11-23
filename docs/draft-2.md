# Holo Pet - Companion: Organized Requirements & Execution Plan

_Refined from draft-1.md - Focus on core deliverables and execution_

## 🎯 Core Mission

Create a **bare-bones deliverable** Tamagotchi-style holographic pet game in Decentraland that feels **complete at every stage** of development.

## 📋 5-Day MVP Core Features

### 1. Pet Interaction Loop (Day 1 Foundation)

- **Click Egg → Pet Spawns**: Instant gratification
- **Pet Interaction**: Click pet → visual response
- **Mood System**: Number 0-100 displayed at top of screen
- **Mood Decay**: Automatically decreases over time

### 2. Simple State Management (Days 2-3)

- **Pet State**: Spawned/Idle animations
- **Mood Tracking**: Increases on interaction, decreases passively
- **Visual Feedback**: Pet reacts to mood level
- **Firebase Persistence**: Save pet state to cloud database using wallet as ID

## 🏗️ Technical Architecture Principles

### Modular Design (Non-negotiable)

```
/components
  /egg
  /pets
  /ui
  /interactions
/systems
  /persistence
  /state-management
  /testing-utils
```

### Testing Strategy

- **Each feature = separate testable module**
- **Mock data injection** for testing different pet states
- **Environment isolation** - load specific scenarios on demand
- **AI-assisted testing** workflow

### Development Constraints

- **Time-boxed features**: 1-2 features per 4-hour session
- **Always deliverable**: Each commit should be playable
- **Incremental growth**: New features plug into existing system
- **Refactor-friendly**: Assume AI will help restructure as needed

## 🎮 5-Day MVP Experience

### Exact MVP Scope:

1. **Click Egg**: Pet instantly spawns (no hatching animation)
2. **Click Pet**: Mood increases (+10), pet plays happy animation
3. **Mood Display**: Simple number (0-100) at top of screen
4. **Passive Decay**: Mood decreases -1 every 10 seconds
5. **Visual States**: Pet looks happy (mood >50) or sad (mood <50)

### Success Criteria:

- **Day 1**: Click egg → pet appears → click pet → mood goes up
- **Day 5**: Complete, polished interaction loop that feels rewarding
- **Always**: Simple code that can be tweaked without refactoring

## 📈 Future Feature Expansion (Post-5-Day MVP)

### Phase 2: Egg Hatching Experience

- Replace instant spawn with hatching animation
- Color roulette selection system
- Cracking and light effects
- Different pet types based on egg color

### Phase 3: Extended Care Loop

- Additional interactions (feed, play, brush)
- Multiple mood states (hungry, tired, playful)
- Pet personality traits
- Environmental reactions

### Phase 4: Social & Viral Features

- Photo sharing system
- Username integration for reminders
- Pet naming system
- Multi-pet scenarios

## 🛠️ Implementation Approach

### Development Workflow

1. **Feature Planning**: Define single, testable feature
2. **Isolated Development**: Build feature independently
3. **Integration**: Plug into main system
4. **Testing**: Verify in isolation and integrated
5. **Deploy**: Always maintain working state

### Code Philosophy

- **No code is best code** - Use existing solutions when possible
- **Readable over clever** - Future maintainability priority
- **Modular over monolithic** - Each feature = separate concern
- **Testable over complex** - Simple, predictable interactions

## 🎨 Visual & UX Guidelines

### Holo Pet Aesthetic

- **Environment**: Simple 2x2 scene, warm lighting
- **Holographic Effects**: Subtle glows, particles (performance-conscious)
- **Pet Design**: Clear silhouettes readable at Decentraland distances
- **UI**: Minimal, contextual, non-intrusive

### User Psychology

- **Immediate gratification** in first interaction
- **Clear progression** feedback
- **Emotional safety** - no negative consequences
- **Memorable moments** - shareable interactions

## ⚡ 5-Day Execution Plan

### Monday (Day 1): Core Mechanics

- [ ] Basic scene setup with egg entity
- [ ] Click egg → pet spawns logic
- [ ] Click pet → mood increase (+10)
- [ ] Mood number display (0-100) in UI

### Tuesday (Day 2): Visual Feedback

- [ ] Pet idle animation
- [ ] Pet happy animation (on click)
- [ ] Mood-based pet states (happy/sad visuals)
- [ ] Basic environmental setup

### Wednesday (Day 3): Persistence & Passive Systems

- [ ] Firebase database setup and API integration
- [ ] Save/load pet state using wallet address as ID
- [ ] Mood decay over time (-1/10sec)
- [ ] Pet state changes based on mood

### Thursday (Day 4): Enhancement & Polish

- [ ] Improve animations and timing
- [ ] Add holographic effects to egg/pet
- [ ] Refine mood system balance
- [ ] Test and debug

### Friday (Day 5): Final Polish & Future Setup

- [ ] Performance optimization
- [ ] Code cleanup and documentation
- [ ] Prepare architecture for egg hatching (future)
- [ ] Deploy and test final version

## 🔧 Technical Stack

### Required Technologies

- **Decentraland SDK** (latest stable)
- **State Management**: Simple, testable approach
- **Firebase Database**: Cloud persistence via REST API
- **Testing Framework**: For component isolation

### Performance Constraints

- **2x2 scene optimization**
- **Mobile-friendly** interactions
- **Holographic effects** without performance impact

## 📝 Success Metrics

### Deliverable Criteria

- **Stage 1**: Playable, engaging single interaction
- **Each Stage**: Feels complete, not like a demo
- **Always**: Maintainable codebase, easy to extend

### Long-term Vision

- **Viral potential**: Shareable moments
- **Community building**: Social features
- **Franchise ready**: Expandable to other scenes/games

---

_This document prioritizes **execution over perfection**. Start with the smallest possible complete experience and grow incrementally._
