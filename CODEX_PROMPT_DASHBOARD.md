# Namma Metro — DASHBOARD HUD ONLY (gpt-6-astra max)

Scope LOCKED. Work in `/workspace/namma-metro` on current main (V2 at 5f07dc7 baseline already in tree).

## Goal
Put **next station / traction / distance-to-next / westbound route card** (and similar floating HUD cards) **into the driver dashboard** (`.console` / instruments area) so the **forward Bengaluru windscreen view stays clear and enjoyable**.

## Do NOT change
- simulation.ts physics / ATP / doors / boarding logic
- audio.ts / audio-events / WAV assets / PA content rules
- World.tsx / Cab.tsx / geometry.tsx / PassingMetro.tsx visuals beyond what’s required to free FOV
- routes.ts station list
- Gameplay controls bindings (W/S/D/M/Esc) — may restyle buttons but keep behavior
- No new features, Green line, etc.

## Do change
- `src/main.tsx` layout: relocate `.route-card`, `.alignment` (traction/distance/status), and preferably `.pa-caption` into the cab dashboard chrome rather than floating over the 3D view
- `src/style.css`: restyle so instruments read as integrated dashboard panels; reduce/remove overlays that obscure the track ahead
- Keep all data the same (same numbers, same station names, same statuses) — **placement only**
- README: one short note that HUD cards live in the cab dashboard (don’t rewrite whole README)
- Keep Live URL line

## Acceptance
1. Forward view mostly unobstructed (no big left route card / mid overlay eating the scenery)
2. Next station, distance/traction status, westbound route info still visible **inside** dashboard
3. `npm test` still 14/14 (or same count if only CSS/layout)
4. `npm run build` green
5. No push (operator pushes)

## Deliverable
What moved where; files touched; test/build results; model gpt-6-astra.
