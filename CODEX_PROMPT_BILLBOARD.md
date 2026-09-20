# Polish: Mid-hop digital LED billboards (Times Square energy, Bengaluru elevated)

## Goal
Add tall **digital LED billboard frames mid-span between stations** so the drive feels like Times Square energy scaled to Bengaluru elevated Purple Line. Ship playable, cinematic, 60fps-aware.

## Feel (must land)
- Tall LED frames **mid-hop** (roughly 40–60% along each hop), not on platforms and not station-wall Kanaka boards.
- **Alternate left / right each hop** (`hopIndex % 2`) so both sides never wall the corridor.
- Glow rim + slight screen refresh / scanline pulse so it reads as a live LED, not a static poster.
- Readable ~2–4s at cruise (board face toward track, large enough from cab windscreen).
- Never on glass/desk/cab. Never block track centerline. Do not smother landmark kits.
- **Skip underground hops** (Cubbon–KSR tunnels etc.) — outdoor/elevated/at-grade only. At-grade OK if clear of rails.

## Content v1 (fictional only)
1. Default still: bold **ADVERTISE HERE** + small sub **FICTIONAL DEMO · SWAP IMAGE/GIF LATER** (Kannada optional short line OK).
2. One looped **sample animation** on a subset of boards (or every other board) — procedural canvas/VideoTexture or tiny generated GIF under `public/textures/` — cycling colors / geometric pulse / “SAMPLE LOOP”. Clearly fake. **No real brands. No BMRCL / Namma Metro marks on the LED face.**
3. Architecture: screen is a **swappable texture slot** (URL or canvas source) so later we drop in real image/GIF without remeshing the frame.

## Tech / frame budget (Mafee)
- Lazy: create/animate boards only for nearby hops (same streaming window as corridor chunks, or ±1–2 hops from player). Do **not** bake GIFs into cold boot / initial JS.
- Cap concurrent **animated** boards (e.g. max 2–3 alive). Distant boards can be still or unmounted.
- Prefer efficient anim: CanvasTexture updated at ~8–12 fps OR a small VideoTexture / sprite sheet — not 10 full-res GIF decoders.
- Instanced frame geometry where possible; unique materials only for live screens.
- Dispose textures/materials on unmount.

## Integration points (existing code)
- Repo: `/workspace/namma-metro` (Vite + R3F + Three).
- Corridor streaming: `src/corridor.ts` (`nearbySlices`, `hopAt`, layout), `src/CorridorChunk.tsx`, `src/World.tsx` Scenery group that moves with track.
- Station wall Kanaka board in `World.tsx` `Sign` — **do not change** that partner board logic.
- Prefer new module e.g. `src/Billboard.tsx` + optional `src/billboards.ts` helpers; mount from `World.tsx` inside the moving corridor group (same space as `CorridorChunk` / stations) so boards stay world-fixed relative to hops.
- Position: lateral offset ~±12–18m from track center (pick what clears existing elevated columns/landmarks), height ~6–12m, face toward cab; mid Z of hop via `stationPosition(i)` + `interStationM[i] * 0.5`.

## Hard locks (do not touch)
- `src/Cab.tsx`, `src/Passengers.tsx`, `src/style.css` console ≤20dvh, `src/routes.ts` metres tables, physics/`simulation.ts` constants unless a test forces a tiny import-only fix.
- Kanaka Filters station-wall Sign behavior.
- Do not call Vercel APIs. Push is Ken’s job after you finish.

## Tests / README
- Add focused unit tests (CJS like existing) for: hop → side L/R alternate; underground hops emit no board; nearby window caps animated count; content strings are fictional (no BMRCL/Namma on LED copy).
- README: one short note under features/credits that mid-hop LEDs are fictional ADVERTISE HERE demo slots (image/GIF swappable).

## Acceptance
A. Mid-hop boards visible from cab on elevated/at-grade hops, alternate sides.
B. Underground hops have none.
C. ADVERTISE HERE + sample loop readable; clearly fictional.
D. Cab / desk / crowd / metres / Kanaka wall unchanged.
E. `npm test` + `npm run build` green.
F. No real brand / BMRCL / Namma marks on LED assets.
G. Cold-load not bloated by GIF pack; anim lazy.

## Deliverable
Implement fully. Run `npm test` and `npm run build`. Do not git commit/push (Ken will). Summarize files changed + how to swap a future image/GIF.
