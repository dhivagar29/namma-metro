# Namma Metro — Polish 4 dashboard + polish 2 windscreen passengers (gpt-6-astra max)

Two tasks in one pass. Do not touch distances/routes data, audio, simulation physics beyond passenger visibility.

## Task A — Cab dashboard realism (PRIORITY)
Current bug: `.console { max-height:46dvh; overflow:auto }` — looks like a webpage with scrollbars, eats ~half the screen.

Requirements:
1. Console pinned to **bottom**, total HUD band **≤20% of viewport height** (`max-height: 20dvh` or equivalent; no page scroll on console).
2. **No scrollbars** anywhere in the cab UI (no `overflow:auto` on `.console`, `.route-card`, `.full-route`). Collapse route list to a compact strip / 2–3 next stops only; full route can be a tiny expandable that doesn’t scroll the page—or remove scroll entirely.
3. Dense instrument row: speed | next station | distance/traction status | doors/master — reads as **metro cab desk**, not cards on a website.
4. Forward windscreen ≥80% clear.
5. Keep all info available: next station, distance, traction/coast/brake status, westbound/progress, doors — just compact.

Files: mainly `src/style.css`, `src/main.tsx` layout tweaks only as needed.

## Task B — Passengers visible through windscreen
Mafee: HUD boarding works but **no figures in cab POV**. Fix `Passengers.tsx` / `World.tsx` so when stopped at a platform with doors open (and when approaching), travelers are clearly visible **ahead / to the side through the windscreen** from the seated cab camera.

Likely issues: wrong world offsets (too far left/right/behind camera), too small, z-fighting, culled, or only on platform behind cab. Place a readable cluster near the platform edge in camera frustum when `s.target === index` and near station / doors open. Keep Indian dress variety. Do not reintroduce Lego boxes.

## Do NOT change
- `routes.ts` interStationM / stationPosition
- audio*, simulation physics constants (except if passenger visibility needs dwell-driven motion already there)
- Cab mesh beyond tiny FOV help if required

## Acceptance
A Console ≤20vh bottom, no scrollbars, cab-like
B Crowd visible from windscreen at platforms
C Distances still Notion metres; tests green
D `npm test` + `npm run build`
E No push

Model gpt-6-astra. Report files + results.
