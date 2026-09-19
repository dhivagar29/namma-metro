import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import World from './World';
import { stations, kannada, stationType } from './routes';
import { distanceToStop, DWELL, initialState, inZone, shouldAnnounce, step, toggleDoors, type Control } from './simulation';
import { audio } from './audio';
import './style.css';
const clock = (seconds:number) => `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;
const controls:Control[]=['brake','coast','power'];
function App() {
 const sim=useRef(initialState()),input=useRef<Control>('coast'),mutedRef=useRef(false);
 const [view,setView]=useState(sim.current),[started,setStarted]=useState(false),[paused,setPaused]=useState(false),[muted,setMuted]=useState(false),[control,setControl]=useState<Control>('coast');
 const [pa,setPa]=useState<number|null>(null),[routeOpen,setRouteOpen]=useState(false);
 const announced=useRef(new Set<number>());
 const setDrive=useCallback((value:Control)=>{input.current=value;setControl(value);},[]);
 const doors=useCallback(()=>{const next=toggleDoors(sim.current);sim.current=next;setView(next);setDrive('coast');},[setDrive]);
 const mute=useCallback(()=>{mutedRef.current=!mutedRef.current;audio.setMute(mutedRef.current);setMuted(mutedRef.current);},[]);
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{
   const driving=started&&!paused&&!sim.current.complete;
   if(driving&&['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
   if(!driving&&e.code==='Tab') {
    const modal=document.querySelector('.modal');
    const buttons=modal?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    if(buttons?.length){e.preventDefault();buttons[0].focus();}
   }
   if(e.repeat)return;
   if(e.code==='KeyM')mute();
   if(e.code==='Escape'&&started&&!sim.current.complete)setPaused(v=>!v);
   if(!started||paused||sim.current.complete)return;
   if(['KeyW','ArrowUp'].includes(e.code))setDrive('power');
   if(['KeyS','ArrowDown'].includes(e.code))setDrive('brake');
   if(e.code==='Space')setDrive('emergency');
   if(e.code==='KeyD')doors();
  };
  const up=(e:KeyboardEvent)=>{if(['KeyW','KeyS','ArrowUp','ArrowDown','Space'].includes(e.code))setDrive('coast');};
  const blur=()=>{setDrive('coast');if(started&&!sim.current.complete)setPaused(true);};
  const visibility=()=>{if(document.hidden)blur();};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
  return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
 },[started,paused,doors,mute,setDrive]);
 useEffect(()=>{
  setDrive('coast');audio.setActive(started&&!paused&&!view.complete);
  if(!started||paused||view.complete)return;
  let previous=performance.now(),accumulator=0,lastPaint=0,frame=0;
  const tick=(now:number)=>{
   accumulator+=Math.min((now-previous)/1000,.1);previous=now;
   while(accumulator>=.02){sim.current=step(sim.current,input.current,.02);accumulator-=.02;}
   if(now-lastPaint>80){
    setView(sim.current);audio.update(sim.current,input.current);lastPaint=now;
    if(shouldAnnounce(sim.current)&&!announced.current.has(sim.current.target)){announced.current.add(sim.current.target);setPa(sim.current.target);}
    if(sim.current.doors)setPa(null);
   }
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[started,paused,view.complete,setDrive]);
 const distance=distanceToStop(view),boarding=view.doors&&!view.serviced,closing=view.closing>0;
 const start=()=>{sim.current=initialState();setView(sim.current);setStarted(true);setPaused(false);setPa(null);setRouteOpen(false);announced.current.clear();setDrive('coast');audio.start(sim.current);};
 const status=view.complete?'DUTY COMPLETE':paused?'DUTY PAUSED':closing?'DOORS CLOSING · STAND CLEAR':boarding?'PASSENGERS BOARDING':view.doors?'BOARDING COMPLETE':inZone(view)?'ON MARKER · OPEN DOORS':view.atp?'ATP · STATION PROTECTION':control==='power'?'TRACTION APPLIED':control==='brake'||control==='emergency'?'BRAKING':'COASTING';
 const doorDisabled=!started||paused||view.complete||closing||(view.doors?!view.serviced:!inZone(view));
 const speed=Math.round(view.speed*3.6);
 return <main>
  <div className="world"><World simulation={sim} control={input} paused={!started||paused||view.complete}/></div>
  <div className="glass-vignette"/>
  <header>
   <div className="brand"><span className="logo" aria-hidden="true">m</span><div>NAMMA METRO<small lang="kn">ನಮ್ಮ ಮೆಟ್ರೋ <span> / DRIVER SIMULATOR</span></small></div></div>
   <div className="service"><i/>PURPLE LINE <span>WHITEFIELD → CHALLAGHATTA</span></div>
   <div className="header-actions"><button onClick={mute} aria-pressed={muted} aria-label={muted?'Unmute sound':'Mute sound'}>{muted?'◌ Sound off':'◖ Sound on'} <kbd>M</kbd></button><button onClick={()=>setPaused(v=>!v)} disabled={!started||view.complete}>{paused?'Resume':'Pause'} <kbd>ESC</kbd></button></div>
  </header>
  <section className="console" aria-label="Driver dashboard">
   <div className="console-top"><span>BMRCL <b>DRIVER DESK / 06</b></span><span className="console-status">● {status}</span><span lang="kn">ನಮ್ಮ ಮೆಟ್ರೋ</span><div className="view-label"><span className="live-dot"/> CAB 01 / SEATED DRIVER<small>BENGALURU · DUSK SERVICE</small><span className="cab-tag">6 CAR · PURPLE LIVERY</span></div></div>
   <div className="instruments">
    <aside className={`route-card ${routeOpen?'expanded':''}`} aria-label="Purple Line route">
     <div className="eyebrow">WESTBOUND <span>PL / 01</span></div>
     <h2>To Challaghatta <span>↗</span></h2><p>Every station. One continuous journey.</p>
     <div className="route-track" aria-label={`${view.stops} of 37 stations served`}>{stations.map((name,i)=><i key={name} title={`${i+1}. ${name}`} className={i<view.stops?'done':i===view.target?'active':''}/>)}</div>
     <div className="route-progress"><span>{String(view.stops).padStart(2,'0')} / 37 served</span><span>{(view.position/1000).toFixed(1)} / 43.2 km</span></div>
     <div className="upcoming">{stations.slice(Math.max(0,view.target-1),Math.min(37,view.target+3)).map(name=>{const i=stations.indexOf(name);return <div key={name} className={i===view.target?'current':''}><span>{i<view.stops?'✓':String(i+1).padStart(2,'0')}</span><b>{name}</b>{i===view.target&&<small>←</small>}</div>;})}</div>
     <div className="route-foot"><span>{stationType(view.target)}{view.target===22?' · ↔ Green Line':' · Bengaluru'}</span><button onClick={()=>setRouteOpen(v=>!v)} aria-expanded={routeOpen} aria-controls="all-stations">{routeOpen?'Close route':'All 37 stops'}</button></div>
     {routeOpen&&<ol id="all-stations" className="full-route">{stations.map((name,i)=><li key={name} className={i===view.target?'current':''}>{name}{i<view.stops?' ✓':''}</li>)}</ol>}
    </aside>
    <div className="journey-panel">
     <div className="destination"><div className="eyebrow">{view.doors?'AT STATION':'NEXT STATION'} <span>● PURPLE / {String(view.target+1).padStart(2,'0')}</span></div><h1>{stations[view.target]}</h1><div className="kannada-destination" lang="kn">{kannada[view.target]}</div><div className="trip-stats"><span><b>{view.passengers}</b> boarded</span><span><b>{clock(view.elapsed)}</b> duty</span><span className={view.atp?'amber':'green'}>● ATP {view.atp?'BRAKE':'READY'}</span></div></div>
     {started&&<div className={`alignment ${view.atp?'protecting':''}`}><span>{status}</span><strong>{closing?`${view.closing.toFixed(1)} s`:view.doors?`Platform ${String(view.target+1).padStart(2,'0')}`:`${Math.max(0,Math.round(distance))} m`}</strong><small>{closing?'Warning active · traction inhibited':boarding?`${Math.ceil(Math.max(0,DWELL-view.dwell))}s · passenger exchange`:view.doors?'Press D to close · wait for departure tone':inZone(view)?'Within ±8 m · press D to open':`Brake guide ${Math.ceil(view.speed**2/2.1+view.speed*.6)} m · limit 80 km/h`}</small>{boarding&&<div className="boarding-progress"><i style={{width:`${view.dwell/DWELL*100}%`}}/></div>}{!view.doors&&distance<100&&<div className="berth-track"><i style={{left:`${Math.max(0,Math.min(100,(1-distance/100)*100))}%`}}/><span>100 m</span><b>STOP</b></div>}</div>}
     {pa!==null&&started&&!paused&&<div className="pa-caption" role="status"><span>◖ STATION ANNOUNCEMENT</span><b>Next station: {stations[pa]}</b><small lang="kn">ಮುಂದಿನ ನಿಲ್ದಾಣ: {kannada[pa]}</small></div>}
    </div>
    <div className="driving-controls">
     <div className="speedometer"><div className="eyebrow">TRAIN SPEED <span>ATO OFF</span></div><div className="speed-dial" style={{'--speed':`${speed/80*240}deg`} as React.CSSProperties}><strong>{speed.toString().padStart(2,'0')}<small>km/h</small></strong></div><div className="scale"><span>0</span><span>MANUAL</span><span>80</span></div></div>
     <div className="door-controls"><div className="lamp-row"><span className={view.doors?'amber':'green'}>● DOORS {closing?'CLOSING':view.doors?'OPEN':'LOCKED'}</span><span className={view.atp?'amber':'dim'}>● TRIP</span></div><button onClick={doors} disabled={doorDisabled}>{closing?'Stand clear…':boarding?'Boarding…':view.doors?'Close doors':'Open doors'} <kbd>D</kbd></button><small>{closing?'Wait for the departure tone':boarding?'Passenger exchange in progress':view.doors?'Boarding complete · ready to close':inZone(view)?'Stopped and aligned · doors enabled':'Doors interlocked while moving'}</small><div className="passenger-tick">{boarding?'◦ ◦ ◦':'✓'} <span>{view.stops} station{view.stops===1?'':'s'} served</span></div></div>
     <div className="master-control"><div className="eyebrow">MASTER CONTROLLER <span>MC / 01</span></div><div className="notches">{controls.map(value=><button key={value} className={control===value?'selected':''} aria-pressed={control===value} disabled={!started||paused||view.complete} onClick={()=>setDrive(value)}>{value==='brake'?'S / ↓':value==='power'?'W / ↑':'○'}<span>{value}</span></button>)}</div><button className={`emergency ${control==='emergency'?'engaged':''}`} disabled={!started||paused||view.complete} onClick={()=>setDrive(control==='emergency'?'coast':'emergency')}>● Emergency brake <kbd>SPACE</kbd></button></div>
    </div>
   </div>
  </section>
  <footer><span><kbd>W / ↑</kbd> POWER <kbd>S / ↓</kbd> BRAKE <kbd>SPACE</kbd> E-BRAKE <kbd>D</kbd> DOORS</span><span>HOLD TO DRIVE · RELEASE TO COAST · DRAG TO LOOK · DOUBLE-CLICK TO CENTRE</span></footer>
  {(!started||paused||view.complete)&&<div className={`modal-shade ${!started?'welcome':''}`}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
   <div className="eyebrow">ನಮ್ಮ ಮೆಟ್ರೋ <span>DRIVER OPERATIONS / V2</span></div><div className="welcome-line">PURPLE LINE <span>ಬೆಂಗಳೂರು</span></div>
   <h2 id="dialog-title">{view.complete?'End of the line.':paused?'Duty on hold.':<>Your cab.<br/>Your city.</>}</h2>
   <p>{view.complete?`${view.stops} stations served · ${view.passengers} passengers boarded · ${clock(view.elapsed)} driving time.`:paused?'Your duty is paused. Resume from exactly where you left off.':'The evening rush. The familiar purple. Take Bengaluru home, one station at a time.'}</p>
   {!started&&<><div className="line-select"><i/><b>Whitefield <span>(Kadugodi)</span></b><span>→</span><b>Challaghatta</b></div><div className="briefing"><div><kbd>W</kbd><span>Power</span><kbd>S</kbd><span>Brake</span><kbd>D</kbd><span>Doors</span></div><p>Wait for boarding, close the doors, then drive. Stop within 8 m of each marker. ATP helps protect every approach.</p></div><div className="duty-details"><span>37 CONSECUTIVE STOPS</span><span>43.2 KM · ~50 MIN</span></div></>}
   <button className="primary" autoFocus onClick={paused&&!view.complete?()=>setPaused(false):start}>{view.complete?'Start a new duty':paused?'Resume duty':'Select Purple · Begin duty'} <span>→</span></button><small className="modal-note">{!started?'Headphones recommended · Sound begins with your duty':'W / S to drive · M to mute · Esc to pause'}</small>
  </section></div>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
