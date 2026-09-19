# Namma Metro — Polish 3: REAL INTER-STATION DISTANCES ONLY (gpt-6-astra max)

## Goal
Replace flat `HOP = 1200` with Notion Purple Line inter-station metres (36 segments, sum **43377**). Shortest 787 (Cubbon→Vidhana Soudha), longest 2073 (Kengeri→Challaghatta). HUD distance + track spacing must vary hop-to-hop.

## Exact metres (Whitefield → Challaghatta, segment i is distance from station i to i+1)
```
[1046,969,1034,1499,735,1016,928,1032,1609,1241,1762,1081,1918,1035,1317,1391,1190,1144,1253,787,940,1330,814,1089,1140,1043,1091,1221,1090,801,831,806,1999,1595,1527,2073]
```
Source: Notion bible / Vonter GTFS shapes. Keep existing `stations[]` spelling (do not rename for Notion typos).

## Implementation
1. `src/routes.ts`: export `interStationM` (36 numbers), `stationPosition(index)` = cumulative sum of prior segments (0 at Whitefield), remove constant `HOP=1200`. Export total length 43377.
2. Update **all** callers that assumed `index * 1200` (simulation, World underground band, tests, any HUD copy saying 43.2 km → 43.377 km if present).
3. Tests: assert array length 36, sum 43377, min 787, max 2073, and that consecutive stationPosition deltas match the array. Update full-route drive test to use cumulative positions (no teleport).
4. Physics constants (accel/brake rates) may stay; only spacing changes. Do **not** retune feel unless tests break.

## Do NOT change
- Passengers.tsx, dashboard HUD layout (main/style), audio, Cab, boarding rules beyond distance math
- Station name strings / order

## Acceptance
- No flat 1200 between every stop
- Cubbon→Vidhana = 787 m in data + HUD when that hop is next
- Kengeri→Challaghatta = 2073 m
- `npm test` + `npm run build` green
- No push

Model gpt-6-astra. Deliverable: files touched + test counts.
