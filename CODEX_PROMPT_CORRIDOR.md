# Namma Metro — Polish 6 CRITICAL: PER-HOP BENGALURU CORRIDOR (gpt-6-astra MAX)

## Mission
Kill the static lookalike corridor. Every Purple hop’s windscreen scenery must read as that Bengaluru stretch from Notion. Cinematic density in browser WebGL; stay playable.

## Source of truth
`refs/notes/corridor-bible.json` — **36 hops**, each with `layout` (`elevated`|`at-grade`|`underground`) + landmark `tags`.
Also matches Notion: https://app.notion.com/p/3e13fc78756e81a8bba2df5e172dbff2

## Implementation plan
1. Add `src/corridor.ts` exporting typed hop data from the bible (import JSON or inline the 36 entries). Keep station index alignment with `stations[]` / `interStationM`.
2. Rebuild scenery in `World.tsx` (and new modules if needed e.g. `src/landmarks.tsx`, `src/CorridorChunk.tsx`):
   - For each hop between station i → i+1, spawn **distinct** landmark kits along `stationPosition(i)` … `stationPosition(i+1)` based on tags.
   - **elevated**: street/viaduct, glass IT towers, hospitals, malls, temples, lakes, markets, residential — stylized but recognizable (colors, massing, signage plates with landmark names).
   - **at-grade** (Baiyappanahalli approaches): rail yards / depot sheds / lower horizon.
   - **underground** (stations 18–22 hops / Cubbon→KSR): **tunnel tubes**, no streetscape; optional brief portal transition; surface landmarks only as orientation boards if any — never fake outdoor city in tunnel.
3. Chunk/stream nearby hops only (perf). Reuse shared geometries/materials; instance where possible. Target desktop ~60fps.
4. Lighting: dusk Bengaluru for elevated; cooler fluorescent tunnels.
5. README Credits: Notion corridor page + OSM note; no copyrighted photo dumps as fullscreen textures. Procedural meshes preferred.

## DO NOT TOUCH
- `style.css` / HTML HUD ≤20dvh
- `routes.ts` distances (`interStationM`)
- `Passengers.tsx` windscreen crowd system
- `Cab.tsx` realistic desk
- audio / simulation physics
- Restore tags v3.0

## Acceptance
- No two elevated hops look identical (tag-driven variance)
- Underground hops are tunnels
- Spot landmarks readable (e.g. ITPB east, Phoenix/VR, MG Road, tunnel mid, RVCE west, Challaghatta fringe)
- `npm test` + `npm run build` green
- No push

Model gpt-6-astra maximum effort. Deliver files + test counts.
