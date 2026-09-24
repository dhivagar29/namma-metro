# Polish: Liveliness / realism / sim-feel stack (Astra max effort)

## Context
Namma Metro FP Purple Line cab sim (`/workspace/namma-metro`). Live: https://namma-metro-1a93.vercel.app. Backup frozen at `ea4b9f6` / tag `v4.1-pre-liveliness-2026-09-24` — do not rewrite that tag.

User asked to improve **all** liveliness layers Ken named. Ship one coherent pass that raises “alive world / real train / Bengaluru” without tanking 60fps Chrome.

## Layers to improve (all of them — prioritize high feel / low cost)

### 1. Motion that keeps going (liveliness)
- Stronger **PassingMetro** presence: more believable approach/pass timing, light + sound cue when another set passes.
- Subtle **corridor life**: moving road traffic / distant vehicle lights where elevated/at-grade kits allow (instanced, capped).
- Station dwell **life**: passenger stagger already exists — tighten boarding timing vs doors; optional one more boarding cue without doubling crowd draw.
- Soft **world clock** feel: dusk/ambient already exists — add gentle time-of-run progression (ambient/sky intensity drift over duty) without new assets.

### 2. Body feel (cab / loco)
- Tune **inertia / notch / brake bite** in `simulation.ts` for heavier metro mass feel (still controllable). Keep ATP/door interlocks correct; update tests if numbers change.
- Cab **micro-sway / vibration** already tiny — improve coupling to speed + notch (not drunk cam). Pointer-look damp stays.
- Master controller / lamp response in `Cab.tsx` should track sim state more clearly (notch lamps, brake glow) without HUD layout change.

### 3. Sound as physics
- Enrich motor load / brake / door / rail bed coupling to speed & notch in `audio.ts` / events — still lazy after Power, mute/cancel clean, pack size discipline.
- Optional short **pass-by whoosh** when PassingMetro crosses (procedural or tiny WAV via existing generate path). No third-party commercial samples.

### 4. Place (already strong — polish only)
- Do **not** rebuild corridor bible. Small readability wins only: landmark plate contrast, fog distances, elevated vs tunnel transition smoothness if cheap.
- Keep Notion metres / `interStationM` / hop tags intact.

### 5. Rules with teeth
- Clearer feedback when traction blocked (doors open / ATP) — desk strip or lamp, **not** bigger console (≤20dvh lock).
- Tighter stop-zone / dwell UX so a good stop *feels* earned without a full scoreboard (scoreboard still backlog unless trivial).

### 6. People at eye height
- Keep `Passengers.tsx` architecture. Improve silhouette variety / boarding readability from seated cab; **do not** explode instance count. Cap crowd.

### 7. Honest dirt
- Keep LED shimmer. Add subtle rail/joint tick frequency vs speed; slight cab panel vibration. Avoid film-grain post (too costly).

### 8. Frame budget (hard)
- Target 60fps desktop Chrome. Cap new instances. Stream with corridor window. No shadow maps, no post stack. DPR stay ≤1.5.
- Cold-load: no fat new texture packs; reuse procedural/canvas.

## Hard locks
- Console CSS ≤20dvh / no scroll (`style.css`).
- Kanaka wall Sign logic; hop-0 Swiggy sold `soldBoardSource(0)` image URL.
- Mid-hop LED architecture (alt L/R, underground skip, ≤2 animated).
- `routes.ts` inter-station metres tables (read-only unless test-forced).
- Do not break existing tests; extend them.
- No Vercel API, no git push (Ken pushes).
- No real brand marks beyond existing sold Swiggy asset + fictional Kanaka/ADVERTISE HERE.

## Process
1. Read current `simulation.ts`, `audio.ts`, `Cab.tsx`, `PassingMetro.tsx`, `Passengers.tsx`, `World.tsx`, `style.css` (console only if needed).
2. Implement layered improvements in focused modules; prefer tuning + small additive systems over rewrites.
3. Add/extend tests for any new sim constants / interlocks / audio event contracts.
4. `npm test` + `npm run build` green.
5. README short “Liveliness” note of what changed.
6. Summarize files + feel wins + any intentional skips for frame budget.

## Acceptance
A. Train feels heavier/notchier without becoming unplayable.
B. World feels less static (pass-by and/or traffic/life).
C. Audio tracks speed/notch/doors better; mute still clean.
D. Cab lamps/feedback clearer; windscreen ≥80% clear; desk ≤20dvh.
E. Crowd still readable; not a FPS bomb.
F. Locks above intact; tests+build green.
G. No spend / no cloud / no new paid APIs.
