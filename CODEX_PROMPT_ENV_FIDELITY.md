# Polish: Environment fidelity — Far Cry–grade corridor assets (Astra max effort)

## Context
Namma Metro FP Purple Line cab sim at `/workspace/namma-metro`. Live: https://namma-metro-1a93.vercel.app.
Baseline HEAD: `1d5ec7a` (liveliness). Backup: branch+tag `v4.2-pre-env-fidelity-2026-09-24` @ `1d5ec7a` — do not rewrite that tag.

User (Dhivagar): tracks, buildings, and other world assets still read “early 2000s greybox.” Make them feel closer to a modern open-world look (**Far Cry–class**: readable silhouette, material contrast, dirt/wear, layered detail) while staying a **browser** R3F/Three.js sim. Not a remake of Far Cry; borrow the *visual language* (readable mid-distance geometry, grounded materials, not PS2 boxes).

## Primary targets (in order)
1. **Running rail + sleepers + ballast + guideway** (elevated deck, at-grade yard rails, tunnel floor/rails if present)
2. **Buildings / landmarks** (`landmarks.ts` kits: office, mall, hospital, residential, industrial, hub, etc.)
3. **Corridor filler** (horizon towers, parapets, poles, barriers, trees) in `makeSurface` / `makeTunnel`
4. **Materials / lighting response** in `CorridorChunk.tsx` shared assets (roughness/metalness variety, not one plastic shader for everything)

Do **not** rebuild cab, simulation physics, audio packs, billboards architecture, passenger system, or traffic system unless a tiny hook is required for lighting. Cab/liveliness stays.

## Visual goals (Far Cry language, procedural)
- **Silhouette first:** buildings need setbacks, rooftop AC/tanks/parapets, podium+tower, uneven heights — not single extruded boxes.
- **Material read at 30–120 m:** concrete warm/cool variation, glass vs cladding contrast, rusty/oxidized rail steel, dirty ballast, painted parapet stripes, weathered plaster for residential.
- **Micro-detail without texture packs:** use extra **instanced** blocks (ledges, window mullions, rail chairs, sleeper spacing, ballast shoulders, cable trays, AC units, water tanks, facade fins). Prefer reusing `BoxGeometry` / existing `canopy` / `round` — optional one extra shared geometry (e.g. thin cylinder for poles) if it earns its draw.
- **Color discipline:** Bengaluru dusty daylight — muted ochres, green-greys, concrete, teal glass. Avoid neon candy or oversaturated plastic.
- **Dirt / wear:** slight color noise via seed (already have `random(seed)`); darker building bases, lighter roofs, rail with darker web + lighter head if cheap.
- **Tracks specifically:** dual running rails with sleeper cadence, ballast bed width, concrete plinth on elevated, third-rail/cable tray suggestion if it does not confuse clearance, fence/parapet on elevated outer edge. At-grade yard rails already exist — upgrade quality to match.
- **Trees:** keep instanced foliage; improve trunk+canopy massing slightly (not billboard sprites).

## Architecture constraints (hard)
- Keep **instanced** drawing model in `CorridorChunk` (`Instances` + shared materials). Do not explode to per-mesh materials.
- You MAY add **more material slots** on `CorridorAssets` (e.g. `concrete`, `steel`, `glass`, `foliage`, `glow`) if kits route blocks into them — still shared, still few draw calls.
- Streamed corridor window unchanged; do not allocate unbounded arrays per frame.
- **No** shadow maps, **no** post-processing stack, **no** HDRI downloads, **no** GLTF mega-packs, **no** paid APIs.
- Cold-load: procedural / canvas only. Optional small canvas atlas for facade panels is OK if capped and disposed.
- Target **60fps** desktop Chrome; mobile must not melt. Cap new instance growth — if a kit gets denser, cull far horizon detail or thin every-Nth filler.
- DPR stay ≤1.5 (do not change renderer policy unless already wrong).

## Hard locks (do not break)
- Console CSS ≤20dvh / overflow hidden (`style.css` — prefer **0 diff**).
- Kanaka wall Sign logic; hop-0 Swiggy `soldBoardSource(0)` image URL.
- Mid-hop LED architecture (alt L/R, underground skip, ≤2 animated).
- `routes.ts` inter-station metres / station strings — **0 diff** unless a test forces it (should not).
- `billboards.ts` — prefer **0 diff**.
- Existing tests must pass; **extend** tests for any new environment helpers/constants.
- No git commit/push, no Vercel API (Ken ships).
- No new real commercial brand marks beyond existing Swiggy sold creative + fictional Kanaka / ADVERTISE HERE.

## Process
1. Read `landmarks.ts`, `CorridorChunk.tsx`, `corridor.ts`, `World.tsx`, `geometry.tsx`, relevant tests.
2. Implement environment upgrades in focused modules (prefer extending `landmarks.ts` kits + `CorridorChunk` materials; extract helpers if file bloats).
3. Add `tests/env-fidelity.test.cjs` (or extend existing) asserting: material slots exist, surface kits still produce rails/sleepers/landmarks, landmark kits still register all tags, no routes/billboard drift if you snapshot hashes or file equality vs baseline expectations.
4. `npm test` + `npm run build` must go green.
5. Short README note under environment / visual fidelity.
6. Summarize: files touched, visual wins, intentional skips for frame budget, confirmation of locks.

## Acceptance
A. From cab, **rails/guideway** read as metro infrastructure, not flat grey strips.
B. Named landmarks and horizon buildings have **layered massing** (podium/tower/roof junk) and better glass/concrete contrast.
C. Materials respond to existing lights (not flat MeshBasic everywhere for solids).
D. Frame budget respected — no unbounded instance explosion; tunnel + elevated still stream.
E. Locks above intact; tests + build green.
F. Feel closer to modern open-world environmental readability (Far Cry–class silhouette/material), still stylized Bengaluru — not photogrammetry.

## Explicit non-goals
- Do not rewrite liveliness/audio/cab feel from the previous pass.
- Do not invent unpaid real brand logos on buildings.
- Do not add a scoreboard or HUD growth.
