# Namma Metro — Light sponsorship: station wall partner board (gpt-6-astra)

## Goal
Replace the large pink/purple overhead **“NAMMA METRO / PURPLE LINE”** station board (World.tsx Sign at ~`[-2.1, 6.38, -36.6]`, width 16) with a **Partner board** on the **wall/overhead** — only **after the first station** (station index ≥ 1). Whitefield (index 0) may keep the line identity board.

## Copy (placeholder — no real brand deal yet)
- Main: `PARTNER BOARD`
- Sub: `YOUR BRAND HERE · STATION WALL`
- Color: keep purple-pink family OR a clear ad-panel look — still wall-mounted, not cab.
- **Forbidden:** BMRCL logo, fake Nike/Samsung/etc., any trademarked brand without written OK.

## Placement rules
- Same approximate world position as today’s Purple Line board (platform overhead wall) — **never** desk/glass/HUD.
- Does not block windscreen FOV / controls.
- Lazy: no new network fetch required for v1 (procedural canvas plate is fine).

## Do NOT touch
Cab.tsx, Passengers.tsx, routes.ts metres, style.css ≤20dvh desk, audio, simulation physics.

## Files
Likely `World.tsx` Sign branch by `index`; optional tiny helper. README: one line under Credits — “Partner board is a placeholder ad slot; no third-party marks.”

## Acceptance
1. After station 1+, pink Purple Line board spot shows Partner Board placeholder
2. Whitefield still readable as line start (Purple identity OK there)
3. No BMRCL marks on the partner panel
4. Locked systems untouched
5. `npm test` + `npm run build` green
6. No push; no Vercel create_*

Model gpt-6-astra.
