# Namma Metro DRIVER SIM — V2 MAX EFFORT (gpt-6-astra)

Upgrade `/workspace/namma-metro` in place. Keep Purple Whitefield→Challaghatta **all 37 consecutive stations** (no skips). Same Vite+TS+R3F stack. Do NOT git push/remotes (operator handles).

## Mission
Awesome Bengaluru **metro cab driving sim**. Someone from Bengaluru should recognize Namma Metro in <10s. Not a generic rail toy / not passenger coach.

## Non-negotiables
1. **Cab authenticity** — seated driver POV; dashboard (speedo, next stop, doors, ATP/trip lamp, master controller Power/Coast/Brake); windscreen **down the rails**; Purple livery cues.
2. **Track + stations** — rails/sleepers, platform yellow edge, elevated pier rhythm, underground tube Cubbon→Majestic stretch; bilingual English + Kannada-*look* boards with **exact Notion names**.
3. **Full soundscape** — door open/close + closing warning; departure beep; traction hum; soft brake; **PA before arrival** (“Next station: <name>” EN + KN-style speech or samples); platform murmur at stop; M mute. Prefer files in `public/audio/` (generate synth WAVs with ffmpeg/node if needed) + Web Audio.
4. **Drive feel** — inertia accel/brake; stop in platform marker; doors only stopped+aligned; passenger board tick; no teleport.
5. **Route** — existing 37 Purple order locked in tests.

## Assets / scrap (hard rules)
- Public only: Wikimedia already in `refs/images/` (schematic, network maps — use as **reference** for UI map strip / colors, not fullscreen unlicensed photo dumps).
- CC0/CC-BY audio or **procedural/synth** generated in-repo. No commercial game rips, no private CCTV, no login walls.
- Write **README Credits** table: URL/source, license, what used.
- Prefer procedural geometry + painted/canvas textures inspired by refs.

## Implementation order
1. Cab mesh/materials + dashboard HUD readability (metro cab, not toy)
2. Track/platform/elevated/tunnel kits that read as metro
3. Full audio bus + PA timing (~announce before braking zone / approach)
4. Drive inertia + stop-marker forgiveness tuning
5. Station boards authenticity + Bengaluru dusk city (trees, boards, traffic under viaduct)
6. Perf: keep nearby-chunk streaming; aim desktop ~60fps; DPR cap

## Acceptance
A Cab POV down-track  
B Looks like metro (rails, yellow edge, elevated/tunnel, Purple)  
C Audio suite + mute  
D Drive interlocks + full Purple order  
E Bengaluru read  
F README controls + Credits + Live: https://namma-metro-1a93.vercel.app  
G `npm test` + `npm run build` green  

## Deliverable
Summary of visual/audio upgrades, credits added, model gpt-6-astra, test/build results. No push.
