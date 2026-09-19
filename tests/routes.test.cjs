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
const { initialState, step, toggleDoors, inZone, distanceToStop } = load('simulation');
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
 state = toggleDoors(state); assert.equal(state.target, 1); assert.equal(state.doors, false);
 assert.equal(toggleDoors(state), state);
});
test('power, coast, service brake, emergency brake and speed cap use continuous physics', () => {
 let state = toggleDoors(tick(initialState(), 'coast', 6));
 state = tick(state, 'power', 10); assert.ok(state.speed > 8 && state.position > 40);
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
  state = toggleDoors(state); assert.equal(state.target, index); assert.equal(state.position, before);
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
