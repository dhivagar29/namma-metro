# Namma Metro — Polish 2: PLATFORM PASSENGERS ONLY (gpt-6-astra max)

Work in `/workspace/namma-metro` current main.

## Goal
Replace static Lego-style platform figures with **authentic Indian / Bengaluru metro travelers** (dress, silhouettes, boarding motion). Station platforms should read as Namma Metro stops with realistic boarders.

## Scope LOCKED — only change passenger/platform presentation
Allowed files (prefer minimal):
- `src/World.tsx` (crowd group / platform people)
- Optionally new `src/Passengers.tsx` (or similar) imported by World
- Light `src/geometry.tsx` only if needed for shared humanoid helpers
- README: short Credits note if any public refs used

## Do NOT change
- main.tsx / style.css dashboard HUD (polish 1)
- simulation.ts, audio*, routes.ts, Cab.tsx, PassingMetro.tsx
- Physics, doors logic, boarding numbers, PA, controls
- No new gameplay features

## Visual direction
- Varied Indian metro crowd: kurtas, saree/drape silhouettes, shirts, jeans, backpacks, helmets optional, phones — stylized low-poly OK but **not** toy bricks
- Skin tones / clothing colors that read South Indian urban evening
- Boarding motion when doors open at current station (existing dwell-driven slide can be improved, not removed)
- Crowd visible on platforms for upcoming stations; boarding toward train when doors open
- Keep frame budget: instance/reuse materials; don’t explode draw calls

## Public assets
- Prefer procedural meshes. If textures: Wikimedia/CC0 only + Credits in README.
- No commercial game rips.

## Acceptance
1. Platforms show recognizable Indian travelers, not Lego
2. Boarding motion readable when doors open
3. Dashboard/physics/audio/route unchanged
4. `npm test` 14/14 + `npm run build` green
5. No push (operator pushes)

## Deliverable
What you changed; model gpt-6-astra; test/build results.
