# Ship: hop-1 mid-hop LED = sold Swiggy creative

## Goal
Only the **first mid-hop LED** (hopIndex `0`, Whitefield→next elevated hop) shows the sold creative. All other mid-hop LEDs stay default ADVERTISE HERE / SAMPLE LOOP.

## Asset (already on disk)
`public/textures/hop1-swiggy-taste-meets-speed.png` — Swiggy “Taste Meets Speed” creative supplied by Dhivagar as sold inventory. Do not regenerate or invent another logo.

## Implementation
1. Add a small sold-board registry in `src/billboards.ts`, e.g. `soldBoardSource(hopIndex): BillboardSource | undefined` returning `{ kind: 'image', url: '/textures/hop1-swiggy-taste-meets-speed.png' }` **only for hopIndex === 0**.
2. In `src/World.tsx`, when mounting `<Billboard …>`, pass `source={soldBoardSource(board.hopIndex)}` (or equivalent). Unsold boards: omit source so demo paint continues.
3. Sold hop-1 must use the **still image** (not SAMPLE LOOP animation). Prefer forcing `animated: false` for hop 0 in `nearbyBillboards` / placement, or ensure Screen treats image source as still.
4. Export helper + unit test: hop 0 has sold URL; hop ≥1 has no sold source; LED_COPY unchanged for unsold; underground still skipped.
5. README one-liner: first mid-hop LED is sold Swiggy creative; others remain ADVERTISE HERE demo slots.

## Hard locks
Do not touch Cab.tsx, Passengers.tsx, style.css, routes.ts metres, simulation.ts, Kanaka wall Sign. No Vercel. No git commit/push.

## Verify
`npm test` + `npm run build` green. Summarize files changed.
