# FARM-TO-STARS PIVOT: AI-DRIVEN GRAND STRATEGY

## THE VISION
Transform this cozy farming/city-building game into a Pax Historia-style AI-driven grand strategy platform. 

**What stays:**
- The 4-phase progression (Homestead → Township → Nation → Stellar)
- 5 civilizations with unique bonuses and lore
- The narrative arc: humble farmer to interstellar civilization
- Pixel art aesthetic and worldbuilding

**What changes:**
- FROM: Direct control simulation (tilling, placing buildings, real-time)
- TO: Scenario-based grand strategy with AI-driven emergent narratives
- Players make high-level decisions as their civilization evolves
- AI generates outcomes, events, diplomatic responses, and story beats

## CURRENT STATE
- Homestead phase: Complete (farming, tools, livestock, weather, seasons)
- Township phase: 95% complete (zoning, utilities, population)
- Heavy TypeScript codebase with Phaser 3, 616 lint errors
- Well-structured data: buildings, crops, recipes, civilizations

## YOUR MISSION

### Phase 1: Foundation (Do This Now)
1. **Analyze** the current codebase structure in web/src/ - understand:
   - The civilization system (civilizations.ts, bonuses, lore)
   - The progression system (homestead → township → nation → stellar)
   - The data layer (buildings, crops, resources, recipes)
   
2. **Clean up** the 616 lint errors so CI passes:
   - Run: npm run lint:fix (fixes ~519 auto-fixable)
   - Manually fix remaining ~100 (test syntax, any types, etc.)
   - Verify: npm run lint passes

3. **Design doc**: Create PIVOT-DESIGN.md outlining:
   - Core gameplay loop for new format
   - AI integration architecture (LLM provider abstraction)
   - Scenario/preset system (like Pax Historia's user-created scenarios)
   - Migration path from simulation code

### Phase 2: Architecture (Next)
- Create AI service layer (provider-agnostic: OpenAI, Anthropic, local)
- Scenario engine (scenario definition format, validation, loading)
- Decision/event system (player makes choices, AI generates consequences)
- State management for new game type

### Phase 3: MVP (After)
- One playable scenario: "The First Township" (transition from homestead)
- Basic AI integration for narrative events
- Simple map view (reuse existing tile data)
- Save/load for new game state

## TECH CONSTRAINTS
- Keep TypeScript, strict mode
- Keep Vite build system
- Keep PWA capabilities
- Add AI provider abstraction (don't hardcode OpenAI)
- Design for token efficiency (this will be expensive if not careful)

## DELIVERABLES FOR THIS SESSION
1. Clean lint (CI passes)
2. PIVOT-DESIGN.md with architecture decisions
3. New directory structure plan
4. First implementation PR ready

## GET STARTED
1. Read the README.md and understand current state
2. Explore web/src/ structure
3. Run npm install in web/ directory (already done)
4. Fix lint errors
5. Write PIVOT-DESIGN.md

When finished, create a summary of what was done and what the next steps are.
