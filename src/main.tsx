import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import World from './World';
import { stations, stationType } from './routes';
import { distanceToStop, DWELL, initialState, inZone, step, toggleDoors, type Control } from './simulation';
import { audio } from './audio';
import './style.css';
const clock = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
function App() {
 const sim = useRef(initialState());
 const [view, setView] = useState(sim.current), [started, setStarted] = useState(false), [paused, setPaused] = useState(false), [muted, setMuted] = useState(false), [control, setControl] = useState<Control>('coast');
 const input = useRef<Control>('coast');
 const setDrive = useCallback((value: Control) => { input.current = value; setControl(value); }, []);
 const doors = useCallback(() => { const next = toggleDoors(sim.current); if (next.doors !== sim.current.doors) audio.chime(); sim.current = next; setView(next); setDrive('coast'); }, [setDrive]);
 const mute = useCallback(() => setMuted(v => { audio.setMute(!v); return !v; }), []);
 useEffect(() => {
  const down = (e: KeyboardEvent) => {
   if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
   if (e.repeat) return;
   if (e.code === 'KeyM') mute();
   if (e.code === 'Escape' && started) setPaused(v => !v);
   if (!started || paused || sim.current.complete) return;
   if (['KeyW', 'ArrowUp'].includes(e.code)) setDrive('power');
   if (['KeyS', 'ArrowDown'].includes(e.code)) setDrive('brake');
   if (e.code === 'Space') setDrive('emergency');
   if (e.code === 'KeyD') doors();
  };
  const up = (e: KeyboardEvent) => { if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) setDrive('coast'); };
  const blur = () => { setDrive('coast'); if (started) setPaused(true); };
  const visibility = () => { if (document.hidden) blur(); };
  window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
  return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); };
 }, [started, paused, doors, mute, setDrive]);
 useEffect(() => {
  setDrive('coast');
  if (!started || paused) { audio.speed(0); return; }
  let previous = performance.now(), accumulator = 0, lastPaint = 0, frame = 0;
  const tick = (now: number) => {
   accumulator += Math.min((now - previous) / 1000, .1); previous = now;
   while (accumulator >= .02) { sim.current = step(sim.current, input.current, .02); accumulator -= .02; }
   if (now - lastPaint > 80) { setView(sim.current); audio.speed(sim.current.complete ? 0 : sim.current.speed / 22.22); lastPaint = now; }
   frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
 }, [started, paused, setDrive]);
 const distance = distanceToStop(view), boarding = view.doors && !view.serviced;
 const start = () => { sim.current = initialState(); setView(sim.current); setStarted(true); setPaused(false); setDrive('coast'); audio.start(); };
 const status = view.complete ? 'DUTY COMPLETE' : paused ? 'SIMULATION PAUSED' : boarding ? 'PASSENGERS BOARDING' : view.doors ? 'READY TO DEPART' : inZone(view) ? 'ALIGNED · OPEN DOORS' : view.atp ? 'ATP · STATION PROTECTION' : control === 'power' ? 'TRACTION APPLIED' : control === 'brake' || control === 'emergency' ? 'BRAKING' : 'COASTING';
 return <main>
  <div className="world"><World simulation={sim} paused={!started || paused || view.complete}/></div>
  <header><div className="brand"><span className="logo">m</span><div>NAMMA METRO<small>ನಮ್ಮ ಮೆಟ್ರೋ · DRIVER SIMULATOR</small></div></div><div className="service"><i/> PURPLE LINE <span>PL / 01</span></div><div className="header-actions"><button onClick={mute} aria-label={muted ? 'Unmute sound' : 'Mute sound'}>{muted ? 'Sound off' : 'Sound on'} <kbd>M</kbd></button><button onClick={() => setPaused(v => !v)} disabled={!started || view.complete}>{paused ? 'Resume' : 'Pause'} <kbd>ESC</kbd></button></div></header>
  <aside className="route-card"><div className="eyebrow">WESTBOUND SERVICE <span>37 STOPS</span></div><h2>To Challaghatta <span>↗</span></h2><p>Whitefield (Kadugodi) → Challaghatta</p><div className="route-track">{stations.map((name, i) => <i key={name} title={name} className={i < view.stops ? 'done' : i === view.target ? 'active' : ''}/>)}</div><div className="route-progress"><span>{String(view.stops).padStart(2, '0')} / 37 served</span><span>43.2 km</span></div><div className="upcoming">{stations.slice(Math.max(0, view.target - 1), Math.min(37, view.target + 3)).map(name => { const i = stations.indexOf(name); return <div key={name} className={i === view.target ? 'current' : ''}><span>{i < view.stops ? '✓' : String(i + 1).padStart(2, '0')}</span><b>{name}</b>{i === view.target && <small>←</small>}</div>; })}</div><div className="route-foot">{stationType(view.target)}{view.target === 22 ? ' · ↔ Green Line' : ' · Bengaluru, KA'}</div></aside>
  <div className="view-label"><span className="live-dot"/> CAB 01 · DRIVER VIEW<small>EVENING DUTY / 17:42</small></div>
  <div className="alignment"><span>{status}</span><strong>{view.doors ? `Platform ${String(view.target + 1).padStart(2, '0')}` : `${Math.max(0, Math.round(distance))} m`}</strong><small>{view.doors ? `${Math.ceil(Math.max(0, DWELL - view.dwell))}s boarding · doors open` : distance < 9 ? 'Stop marker · press D when stationary' : `Brake guide ${Math.ceil(view.speed ** 2 / 2.4)} m · limit 80 km/h`}</small></div>
  <section className="console" aria-label="Driver dashboard"><div className="console-top"><span>BMRCL <b>ROLLING STOCK / 06</b></span><span className="console-status">● {status}</span><span>ನಮ್ಮ ಮೆಟ್ರೋ</span></div><div className="instruments"><div className="speedometer"><div className="eyebrow">TRAIN SPEED</div><strong>{Math.round(view.speed * 3.6).toString().padStart(2, '0')}<small>km/h</small></strong><div className="speed-bar"><i style={{width: `${view.speed * 3.6 / 80 * 100}%`}}/></div><div className="scale"><span>0</span><span>40</span><span>80</span></div></div><div className="destination"><div className="eyebrow">{view.doors ? 'AT STATION' : 'NEXT STATION'} <span>● PURPLE</span></div><h1>{stations[view.target]}</h1><div className="trip-stats"><span><b>{view.passengers}</b> boarded</span><span><b>{clock(view.elapsed)}</b> duty time</span><span className={view.atp ? 'amber' : 'green'}>● ATP {view.atp ? 'BRAKE' : 'ACTIVE'}</span></div></div><div className="door-controls"><span className={view.doors ? 'amber' : 'green'}>● DOORS {view.doors ? 'OPEN' : 'LOCKED'}</span><button onClick={doors} disabled={!started || paused || view.complete || (view.doors ? !view.serviced : !inZone(view))}>{boarding ? 'Boarding…' : view.doors ? 'Close doors' : 'Open doors'} <kbd>D</kbd></button><small>{boarding ? 'Please wait for boarding' : view.doors ? 'Close doors, then apply power' : 'Release traction to coast'}</small></div><div className="master-control"><div className="eyebrow">MASTER CONTROLLER</div><div className="notches">{(['brake', 'coast', 'power'] as Control[]).map(value => <button key={value} className={control === value ? 'selected' : ''} disabled={!started || paused || view.complete} onClick={() => setDrive(value)}>{value === 'brake' ? 'S / ↓' : value === 'power' ? 'W / ↑' : '○'}<span>{value}</span></button>)}</div></div></div></section>
  <footer><span><kbd>W / ↑</kbd> POWER <kbd>S / ↓</kbd> BRAKE <kbd>SPACE</kbd> E-BRAKE <kbd>D</kbd> DOORS</span><span>HOLD KEYS TO DRIVE · RELEASE TO COAST · DRAG WINDSCREEN TO LOOK</span></footer>
  {(!started || paused || view.complete) && <div className="modal-shade"><section className="modal"><div className="eyebrow">NAMMA METRO / DRIVER OPERATIONS</div><h2>{view.complete ? 'End of the line.' : paused ? 'Duty on hold.' : 'The city is in your hands.'}</h2><p>{view.complete ? `${view.stops} stations served · ${view.passengers} passengers boarded · ${clock(view.elapsed)} driving time.` : paused ? 'Your train is secured. Resume when you’re ready.' : 'Take the driver’s seat. Carry Bengaluru west, one station at a time.'}</p>{!started && <><div className="line-select"><i/> <b>Purple Line</b><span>37 consecutive stations</span></div><p className="briefing">Wait for boarding. Close doors with D. Hold W to accelerate, release to coast, and hold S to brake. Stop within 8 m of each marker, then open doors. ATP protects every stop.</p><div className="duty-details"><span>WHITEFIELD → CHALLAGHATTA</span><span>43.2 KM · ~50 MIN</span></div></>}<button className="primary" onClick={paused && !view.complete ? () => setPaused(false) : start}>{view.complete ? 'Start a new duty' : paused ? 'Resume duty' : 'Select Purple · Begin duty'} <span>→</span></button></section></div>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
