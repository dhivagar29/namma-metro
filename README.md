# Namma Metro — Driver Simulator
Live: https://namma-metro-1a93.vercel.app

Drive the complete Purple Line from **Whitefield (Kadugodi) to Challaghatta**, serving **all 37 consecutive stations**. A seated cab view looks down the rails, with a driver dashboard, speedometer, next-stop display, door lamps, ATP indicator, and master controller. Built with Vite, TypeScript, React, React Three Fiber, and Three.js. The passenger coach and platform-roaming game have been replaced.

## Run

Use Node.js 22.12+ (or 20.19+).

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

## Drive a duty

1. Select **Purple · Begin duty**. The train starts at Whitefield with its doors open.
2. Allow five seconds for passengers to board. Press **D** to close the doors.
3. Hold **W / Up** to accelerate. Release to coast. Hold **S / Down** to brake. Maximum speed is 80 km/h.
4. Use the distance and braking-distance guide to stop within **8 metres** of the next platform marker. Press **D** to open the doors; the train must be completely stationary.
5. Wait for boarding, close the doors, and repeat. Every station must be served in order.
6. Boarding at Challaghatta completes the duty and shows time, stops, and total passengers boarded. Restart from the summary.

**Space:** emergency brake. **M:** mute. **Esc:** pause/resume. Drag the windscreen for limited seated head movement (no pointer lock or walking). The dashboard Power/Coast/Brake buttons latch their selected setting; keyboard controls return to coast on release. Switching browser tabs or losing focus pauses the duty and clears traction. Resume from the overlay.

The stylized **ATP station protection** automatically intervenes if the train approaches an unserved station too quickly. It brakes continuously before the marker: no arrival teleport, reverse recovery, skipped stops, or automatic departure. Manual braking remains available at all times. Doors lock traction, and a completed boarding cycle is required before departure. Passenger totals cannot be increased by repeatedly toggling doors.

## Shipped Purple Line

1. Whitefield (Kadugodi)
2. Hopefarm Channasandra
3. Kadugodi Tree Park
4. Pattandur Agrahara
5. Sri Sathya Sai Hospital
6. Nallurhalli
7. Kundalahalli
8. Seetharamapalya
9. Hoodi
10. Garudacharpalya
11. Singayyanapalya
12. Krishnarajapura (KR Pura)
13. Benniganahalli
14. Baiyappanahalli — at-grade
15. Swami Vivekananda Road
16. Indiranagar
17. Halasuru
18. Trinity
19. Mahatma Gandhi Road
20. Cubbon Park — underground
21. Dr. B.R. Ambedkar Stn., Vidhana Soudha — underground
22. Sir M. Visvesvaraya Stn., Central College — underground
23. Nadaprabhu Kempegowda Stn., Majestic — underground; Green interchange signage
24. Krantivira Sangolli Rayanna Railway Station — underground
25. Magadi Road
26. Sri Balagangadharanatha Swamiji Stn., Hosahalli
27. Vijayanagara
28. Attiguppe
29. Deepanjali Nagar
30. Mysuru Road
31. Pantharapalya–Nayandahalli
32. Rajarajeshwari Nagar
33. Jnanabharathi
34. Pattanagere
35. Kengeri Bus Terminal
36. Kengeri
37. Challaghatta

All other stations are elevated. Station order follows the supplied brief; every hop is an illustrative 1.2 km, totaling 43.2 km. A duty takes approximately 50 minutes depending on driving. Green Line is not playable.

## World and performance

Procedural evening Bengaluru: Purple bilingual station boards, platform passengers who move toward the train during boarding, trees, buildings, roadside coffee boards, and vehicles below the viaduct. Ground rises around Baiyappanahalli. The Cubbon Park–KSR stretch has enclosed tunnel walls, station boxes, cooler light, and shorter visibility. Layouts, grades, distances, and ATP behavior are illustrative, not surveyed infrastructure or operational training.

Only nine nearby scenery chunks and stations within 650 m are mounted. The camera stays local while the world advances according to continuous physical distance; route length does not multiply the rendered scene. Pixel ratio is capped at 1.5. Geometry, signs, and sound are generated locally, without remote model/font services. Kannada glyph quality depends on installed fonts. Desktop keyboard/mouse and WebGL are recommended; dashboard buttons also support touch.

## Code and verification

- `src/routes.ts` — complete station order, Kannada labels, spacing, terrain
- `src/simulation.ts` — pure deterministic physics, boarding, station protection, terminal state
- `src/main.tsx` — input, fixed-step loop, selection, HUD, pause and summary
- `src/World.tsx` — cab viewpoint, nearby platforms, city, tunnel, limited head movement
- `src/audio.ts` — synthesized motor rumble and door chimes
- `tests/routes.test.cjs` — exact sequence, terrain, interlocks, controls, and complete 37-stop drive

`npm test` passes all five assertions suites, including a simulated end-to-end duty proving bounded continuous movement, no skipped stops, one boarding event per station, and terminal completion. `npm run build` passes TypeScript and Vite; Vite reports a non-fatal Three.js chunk-size warning.

Browser verification could not run in this environment: Vite's listening socket is denied (`EPERM`), and `agent-browser` is unavailable. Visual appearance, interactive browser input, audio, and measured frame rate therefore still need local playtesting.

Model: **gpt-6-astra**. No GitHub remote was created, no git push was run, and no deployment was made. Operator handles publishing.
