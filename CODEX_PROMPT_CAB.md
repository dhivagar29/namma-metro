# Namma Metro — Polish 5: REALISTIC DRIVER CAB (gpt-6-astra max)

## Goal
Redesign `src/Cab.tsx` (and tiny helpers if needed) so the seated cab reads as a **real metro driver desk**, not a toy box shell. Match public Wikimedia cab refs in `refs/images/cab/` (Tyne & Wear, Tokyo Metro series) — recreate with meshes/materials, don’t paste photos as fullscreen textures.

## Must look like
- Deep desk / console shelf under windscreen
- Master controller **lever** with notch feel (already animates to power/coast/brake — keep wiring)
- Clusters of **buttons**, **toggle switches**, **indicator lamps** (doors amber/green, ATP/trip, traction)
- A-pillars / window frame / header panel with Purple accent strip
- Soft cab lighting, rubberized desk materials, readable instrument bezels
- Optional parked wipers that don’t block track view
- Glass windscreen that still shows track + platform crowd ahead

## Hard constraints — DO NOT break
- HTML HUD stays **≤20dvh** bottom (`style.css` / `main.tsx` desk layout) — do not grow the webpage overlay
- Notion `interStationM` / routes untouched
- audio*, Passengers visibility fix (forward crowd) — don’t undo
- simulation physics untouched
- Camera remains seated cab looking down-track

## Files
Primary: `Cab.tsx`. Optional: small shared geometry in `geometry.tsx`. README Credits: list Wikimedia cab refs used for inspiration.

## Acceptance
1. Cab no longer reads as toy blocks
2. Lever/buttons/lights visibly “metro”
3. Forward view still clear; crowd still visible at platforms
4. HUD still ≤20dvh
5. `npm test` + `npm run build` green
6. No push

Model gpt-6-astra max effort.
