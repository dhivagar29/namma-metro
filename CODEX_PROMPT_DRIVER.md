# Namma Metro DRIVER SIM — replace passenger product

Rebuild `/workspace/namma-metro` as a **cab-driver metro sim** (truck-sim energy). DELETE/replace passenger coach free-look gameplay. Keep Vite+TS+R3F stack. Do NOT create a new GitHub remote (operator pushes).

## Fantasy (non-negotiable)
- POV: **driver’s seat** — dashboard lower FOV, windscreen looking **down the tracks**
- Controls: throttle/brake/coast — **NOT** WASD platform walking / coach roam
- Stop at **every consecutive station** in the shipped segment; doors; passengers board; depart
- Feel like Bengaluru: real Notion names, Purple identity, elevated vs underground, city cues

## Purple Line FULL order (East→West) — ship as many as frame budget allows
Prefer **full 37** if performant. Minimum v1: **≥8–12 consecutive** starting at Whitefield (Kadugodi) OR a long mid segment that still never skips. Best target: full line.

1 Whitefield (Kadugodi) ★ Elevated
2 Hopefarm Channasandra Elevated
3 Kadugodi Tree Park Elevated
4 Pattandur Agrahara Elevated
5 Sri Sathya Sai Hospital Elevated
6 Nallurhalli Elevated
7 Kundalahalli Elevated
8 Seetharamapalya Elevated
9 Hoodi Elevated
10 Garudacharpalya Elevated
11 Singayyanapalya Elevated
12 Krishnarajapura (KR Pura) Elevated
13 Benniganahalli Elevated
14 Baiyappanahalli At-grade
15 Swami Vivekananda Road Elevated
16 Indiranagar Elevated
17 Halasuru Elevated
18 Trinity Elevated
19 Mahatma Gandhi Road Elevated
20 Cubbon Park Underground
21 Dr. B.R. Ambedkar Stn., Vidhana Soudha Underground
22 Sir M. Visvesvaraya Stn., Central College Underground
23 Nadaprabhu Kempegowda Stn., Majestic Underground (↔ Green)
24 Krantivira Sangolli Rayanna Railway Station Underground
25 Magadi Road Elevated
26 Sri Balagangadharanatha Swamiji Stn., Hosahalli Elevated
27 Vijayanagara Elevated
28 Attiguppe Elevated
29 Deepanjali Nagar Elevated
30 Mysuru Road Elevated
31 Pantharapalya–Nayandahalli Elevated
32 Rajarajeshwari Nagar Elevated
33 Jnanabharathi Elevated
34 Pattanagere Elevated
35 Kengeri Bus Terminal Elevated
36 Kengeri Elevated
37 Challaghatta ★ Elevated

Spacing ~1.2 km/hop for timing. Underground stretch Cubbon→KSR.

Optional: Green Madavara→Silk Institute as second line tab after Purple works (32 stations) — only if time.

## Loop
1. Select Purple → spawn cab at first station, doors open
2. Close doors → throttle → drive along rails to next
3. Brake into platform marker → doors → passenger count up → repeat to terminal
4. Summary (time, stops, passengers) → restart

## Controls
W/Up accelerate · S/Down brake · Space e-brake optional · D/button doors when stopped in zone · mouse limited cab look · M mute · Esc pause

## HUD
Speed km/h · next station · distance/alignment · doors · passengers · line color + destination · optional simple signal

## Visuals
- Cab: speedo, door lamp, next-stop strip, stylized ATP lamp
- Outside elevated: trees, boards, traffic below, evening light, bilingual boards
- Underground: tunnel, cooler light, station boxes
- Rails ahead always primary

## Acceptance
Cab POV down-track · throttle/brake drive · stop every station in order no teleport · doors+passengers · Bengaluru read · README · `npm test` locks sequence · `npm run build` green

## Deliverable
Summary of stations shipped, model gpt-6-astra, test/build results. No git push/remotes.
