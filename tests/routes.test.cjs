const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
function load(name) {
 const source = ts.transpileModule(fs.readFileSync(`src/${name}.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
 const module = { exports: {} };
 new Function('exports', 'module', 'require', source)(module.exports, module, path => load(path.replace('./', '')));
 return module.exports;
}
const { stations, kannada, stationType, stationPosition } = load('routes');
const { initialState, step, toggleDoors, inZone, distanceToStop, DOOR_CLOSE_TIME, shouldAnnounce } = load('simulation');
const expected = ['Whitefield (Kadugodi)', 'Hopefarm Channasandra', 'Kadugodi Tree Park', 'Pattandur Agrahara', 'Sri Sathya Sai Hospital', 'Nallurhalli', 'Kundalahalli', 'Seetharamapalya', 'Hoodi', 'Garudacharpalya', 'Singayyanapalya', 'Krishnarajapura (KR Pura)', 'Benniganahalli', 'Baiyappanahalli', 'Swami Vivekananda Road', 'Indiranagar', 'Halasuru', 'Trinity', 'Mahatma Gandhi Road', 'Cubbon Park', 'Dr. B.R. Ambedkar Stn., Vidhana Soudha', 'Sir M. Visvesvaraya Stn., Central College', 'Nadaprabhu Kempegowda Stn., Majestic', 'Krantivira Sangolli Rayanna Railway Station', 'Magadi Road', 'Sri Balagangadharanatha Swamiji Stn., Hosahalli', 'Vijayanagara', 'Attiguppe', 'Deepanjali Nagar', 'Mysuru Road', 'Pantharapalya–Nayandahalli', 'Rajarajeshwari Nagar', 'Jnanabharathi', 'Pattanagere', 'Kengeri Bus Terminal', 'Kengeri', 'Challaghatta'];
const tick = (state, control, seconds) => { for (let i = 0; i < Math.ceil(seconds / .02); i++) state = step(state, control, .02); return state; };
test('locks all 37 consecutive East–West stations, spacing, and terrain', () => {
 assert.deepEqual(stations, expected); assert.equal(kannada.length, 37);
 assert.equal(stationPosition(36), 43200);
 assert.deepEqual(stations.map((_, i) => stationType(i)).filter(t => t === 'Underground'), Array(5).fill('Underground'));
 for (let i = 0; i < 37; i++) { assert.equal(stationType(i), i >= 19 && i <= 23 ? 'Underground' : i === 13 ? 'At-grade' : 'Elevated'); if (i) assert.equal(stationPosition(i) - stationPosition(i - 1), 1200); }
});
test('boarding locks traction and door closing until dwell completes; cannot farm passengers', () => {
 let state = initialState(); assert.equal(toggleDoors(state), state);
 state = tick(state, 'power', 3); assert.equal(state.position, 0); assert.equal(state.passengers, 0);
 state = tick(state, 'power', 3); assert.equal(state.stops, 1); assert.equal(state.passengers, 24);
 assert.equal(tick(state, 'power', 20).passengers, 24);
 state = toggleDoors(state); assert.equal(state.target, 0); assert.equal(state.doors, true);
 assert.equal(state.closing, DOOR_CLOSE_TIME); assert.equal(toggleDoors(state), state);
 state = tick(state, 'power', 2); assert.equal(state.position, 0); assert.equal(state.doors, true);
 state = tick(state, 'coast', 1); assert.equal(state.target, 1); assert.equal(state.doors, false);
 assert.equal(toggleDoors(state), state);
});
test('power, coast, service brake, emergency brake and speed cap use continuous physics', () => {
 let state = tick(toggleDoors(tick(initialState(), 'coast', 6)), 'coast', 3);
 state = tick(state, 'power', 10); assert.ok(state.speed > 8 && state.position > 38);
 const coast = tick(state, 'coast', 1), brake = tick(state, 'brake', 1), emergency = tick(state, 'emergency', 1);
 assert.ok(coast.speed < state.speed && coast.speed > brake.speed && brake.speed > emergency.speed);
 assert.equal(tick(state, 'brake', 15).speed, 0);
 assert.equal(toggleDoors(state), state);
 const max = tick(state, 'power', 25); assert.ok(max.speed <= 80 / 3.6);
});
test('drives the entire route without skips or teleportation, boarding once per stop, then terminal summary', () => {
 let state = tick(initialState(), 'coast', 6), total = 24, protectedStops = 0;
 for (let index = 1; index < 37; index++) {
  const before = state.position;
  state = toggleDoors(state); assert.equal(state.target, index - 1); assert.equal(state.position, before);
  state = tick(state, 'coast', 3); assert.equal(state.target, index); assert.equal(state.position, before);
  let frames = 0, protection = false;
  while (!inZone(state) && frames++ < 20000) {
   const previous = state;
   state = step(state, 'power', .02); protection ||= state.atp;
   assert.ok(state.position >= previous.position);
   assert.ok(state.position - previous.position <= (80 / 3.6) * .02 + .00001, 'no position snapping');
   assert.ok(state.position <= stationPosition(index), 'never passes mandatory stop');
   assert.equal(state.stops, index);
  }
  assert.ok(frames < 20000, `station ${index} reachable`); assert.ok(protection); protectedStops++;
  assert.ok(Math.abs(distanceToStop(state)) <= 8);
  state = toggleDoors(state); assert.equal(state.doors, true);
  state = tick(state, 'power', 6); total += 24 + (index * 13) % 43;
  assert.equal(state.stops, index + 1); assert.equal(state.passengers, total);
 }
 assert.equal(protectedStops, 36); assert.equal(state.complete, true); assert.equal(state.stops, 37);
 assert.equal(toggleDoors(state), state); assert.equal(step(state, 'power', .02), state);
 assert.ok(state.elapsed > 2000);
});
test('door zone rejects moving trains and distant stops; zero time freezes simulation', () => {
 const state = {...initialState(), doors: false, target: 1, position: 1196, speed: .01};
 assert.equal(toggleDoors(state), state);
 assert.equal(toggleDoors({...state, speed: 0}).doors, true);
 assert.equal(toggleDoors({...state, speed: 0, position: 1180}).doors, false);
 assert.equal(step(state, 'power', 0), state);
});
test('door closing is a timed traction interlock and cannot retrigger or skip a station', () => {
 let state = tick(initialState(), 'coast', 6);
 state = toggleDoors(state);
 for(let i=0;i<100;i++) {
  assert.equal(toggleDoors(state), state);
  state = step(state,'power',.02);
  assert.equal(state.target,0);assert.equal(state.speed,0);assert.equal(state.position,0);
 }
 state=tick(state,'coast',1);
 assert.equal(state.target,1);assert.equal(state.closing,0);assert.equal(state.doors,false);
 assert.equal(toggleDoors(state),state);
});
test('traction ramps with inertia and manual stops work across the forgiving platform berth', () => {
 let state = tick(toggleDoors(tick(initialState(),'coast',6)),'coast',3);
 state=step(state,'power',.02);
 assert.ok(state.acceleration>0&&state.acceleration<.1);
 state=tick(state,'power',8);
 const powerAcceleration=state.acceleration;
 state=step(state,'brake',.02);
 assert.ok(state.acceleration<powerAcceleration && state.acceleration<0 && state.acceleration>-.1,'brake cuts power immediately and ramps service pressure');
 const emergency=step(state,'emergency',.02);
 assert.equal(emergency.acceleration,-2.6);
 for(const position of [1192,1197,1200,1208]) {
  const berthed={...state,position,speed:0,target:1};
  assert.equal(inZone(berthed),true);assert.equal(toggleDoors(berthed).doors,true);
 }
 for(const position of [1191.99,1208.01]) assert.equal(inZone({...state,position,speed:0,target:1}),false);
});
test('ATP captures approaches at multiple speeds and step sizes without position correction', () => {
 for(const speed of [2,7,15,80/3.6]) for(const dt of [.01,.02,.05]) {
  let state={...initialState(),doors:false,target:1,position:650,speed};
  let count=0;
  while(!inZone(state)&&count++<30000) {
   const before=state;
   state=step(state,'power',dt);
   assert.ok(state.position>=before.position);
   assert.ok(state.position-before.position<=(80/3.6)*dt+.00001);
   assert.ok(state.position<=1200);
  }
  assert.ok(count<30000);assert.ok(distanceToStop(state)>=0&&distanceToStop(state)<=8);
 }
});
test('approach PA is before the braking zone and never at origin, while closing, or after berthing', () => {
 const state={...initialState(),doors:false,target:1,position:640,speed:80/3.6};
 assert.equal(shouldAnnounce(state),true);
 assert.ok(distanceToStop(state)>state.speed**2/(2*.95)+100);
 assert.equal(shouldAnnounce({...state,position:639}),false);
 assert.equal(shouldAnnounce({...state,position:1196}),false);
 assert.equal(shouldAnnounce({...state,closing:1}),false);
 assert.equal(shouldAnnounce(initialState()),false);
});
const {audioEvents}=load('audio-events');
test('audio events follow actual door, boarding, departure, and once-per-station PA transitions', () => {
 const initial=initialState(),announced=new Set();
 let ready=tick(initial,'coast',6);
 assert.deepEqual(audioEvents(initial,ready,announced),['boarding-tick']);
 let closing=toggleDoors(ready);
 assert.deepEqual(audioEvents(ready,closing,announced),['door-warning']);
 let shut=tick(closing,'coast',1.4);
 assert.deepEqual(audioEvents(closing,shut,announced),['door-close']);
 let departed=tick(shut,'coast',1.2);
 assert.deepEqual(audioEvents(shut,departed,announced),['departure']);
 const approach={...departed,position:640};
 assert.deepEqual(audioEvents(departed,approach,announced),['pa-chime']);
 announced.add(1);
 assert.deepEqual(audioEvents(approach,{...approach,position:800},announced),[]);
 const stopped={...approach,position:1197,speed:0};
 assert.deepEqual(audioEvents(stopped,toggleDoors(stopped),announced),['door-open']);
});
test('the entire duty announces every future station once and warns before every departure', () => {
 let state=initialState(),previous=state,announced=new Set(),warnings=0,departures=0,closes=0;
 for(let frame=0;frame<250000&&!state.complete;frame++) {
  if(state.doors&&state.serviced&&state.closing===0)state=toggleDoors(state);
  else if(!state.doors&&inZone(state))state=toggleDoors(state);
  for(const event of audioEvents(previous,state,announced)) {
   if(event==='pa-chime')announced.add(state.target);
   if(event==='door-warning')warnings++;
   if(event==='door-close')closes++;
   if(event==='departure')departures++;
  }
  previous=state;state=step(state,'power',.02);
 }
 assert.equal(state.complete,true);assert.equal(warnings,36);assert.equal(closes,36);assert.equal(departures,36);
 assert.deepEqual([...announced],Array.from({length:36},(_,i)=>i+1));
});
test('all procedural audio assets are valid, non-silent PCM with a source and license', () => {
 for(const name of ['door-open','door-close','door-warning','departure','pa-chime','boarding-tick','brake','traction','platform']) {
  const data=fs.readFileSync(`public/audio/${name}.wav`);
  assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WAVE');
  assert.equal(data.readUInt32LE(24),22050);assert.equal(data.readUInt16LE(22),1);assert.equal(data.length,44+data.readUInt32LE(40));
  let peak=0;for(let offset=44;offset<data.length;offset+=2)peak=Math.max(peak,Math.abs(data.readInt16LE(offset)));
  assert.ok(peak>1000&&peak<32767,`${name}: audible without clipping`);
 }
 assert.match(fs.readFileSync('public/audio/LICENSE.txt','utf8'),/CC0/);
 assert.ok(fs.existsSync('scripts/generate-audio.mjs'));
});
