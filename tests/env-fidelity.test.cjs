const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const ts = require('typescript');
const THREE = require('three');
const cache = new Map();
function load(name) {
 if (cache.has(name)) return cache.get(name);
 const file = `src/${name}.${fs.existsSync(`src/${name}.ts`) ? 'ts' : 'tsx'}`;
 const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
 } }).outputText;
 const module = { exports: {} };
 new Function('exports', 'module', 'require', source)(module.exports, module, id =>
  id.endsWith('.json') ? require(`../src/${id}`) : id.startsWith('./') ? load(id.slice(2)) : require(id));
 cache.set(name, module.exports); return module.exports;
}
const { emptyKit, BOX_SLOTS, ENV_FINISHES, ENV_BUDGET, weathered } = load('environment');
const { createCorridorAssets } = load('CorridorChunk');
const { createMineralTexture, mineralMaterial, MINERAL_TEXTURE_SIZE } = load('environment-materials');
const { runningTrack, guideway, parapetSpans, TRACK_CENTERS, RAIL_OFFSET, RAIL_TOP } = load('track-environment');
const { roofline, windows, horizonBuilding, tree } = load('building-details');
const { makeSurface, makeTunnel, LANDMARKS, landmarkPlacements } = load('landmarks');
const { corridor, nearbySlices, CHUNK_M, tunnelExitM } = load('corridor');
const { totalLengthM, stations, stationPosition } = load('routes');
const build = slice => slice.tunnel ? makeTunnel(slice) : makeSurface(slice);
const heads = kit => kit.steel.filter(b => b.p[1] === .21 && b.s[0] === .075 && b.s[1] === .035);
const sleepers = kit => kit.concrete.filter(b => b.p[1] === .005 && b.s[0] === 2.35 && b.s[1] === .14);

test('every finish has one reusable lit material, with different mineral / metal / glass responses', () => {
 const assets = createCorridorAssets(), kit = emptyKit();
 assert.deepEqual(BOX_SLOTS, ['solid', 'concrete', 'steel', 'glass', 'glow']);
 for (const slot of [...BOX_SLOTS, 'foliage', 'round']) assert.ok(Array.isArray(kit[slot]));
 for (const slot of Object.keys(ENV_FINISHES)) {
  assert.ok(assets[slot] instanceof THREE.MeshStandardMaterial, slot);
  assert.equal(assets[slot].roughness, ENV_FINISHES[slot].roughness);
  assert.equal(assets[slot].metalness, ENV_FINISHES[slot].metalness);
  assert.equal(assets[slot].transparent, false, 'no costly sorted alpha facade layer');
 }
 assert.ok(assets.concrete.roughness > assets.steel.roughness && assets.steel.roughness > assets.glass.roughness);
 assert.ok(assets.steel.metalness > assets.glass.metalness && assets.glass.metalness > assets.solid.metalness);
 assert.ok(assets.glow instanceof THREE.MeshBasicMaterial);
 assert.equal(assets.solid.map, assets.concrete.map, 'one shared mineral map');
 assert.equal(Object.values(assets).filter(a => a instanceof THREE.BufferGeometry).length, 3, 'original geometry pool');
 let disposed = 0;
 for (const asset of Object.values(assets)) { asset.addEventListener('dispose', () => disposed++); asset.dispose(); }
 assert.equal(disposed, Object.keys(assets).length);
 const renderer = fs.readFileSync('src/CorridorChunk.tsx', 'utf8');
 assert.match(renderer, /BOX_SLOTS\.map\(slot=>kit\[slot\]/);
 assert.match(renderer, /geometry=\{assets\.box\} material=\{assets\[slot\]\}/);
 assert.match(renderer, /Object\.values\(assets\)\.forEach\(asset => asset\.dispose\(\)\)/);
 assert.match(renderer, /return \(\) => \{ mesh\.dispose\(\); \}/);
});

test('mineral grain is a small deterministic mipmapped texture, fixed to instances rather than the moving camera', () => {
 const a = createMineralTexture(), b = createMineralTexture();
 assert.equal(MINERAL_TEXTURE_SIZE, 128);
 assert.equal(a.image.data.byteLength, 65536);
 assert.deepEqual(a.image.data, b.image.data);
 assert.equal(a.wrapS, THREE.RepeatWrapping); assert.equal(a.wrapT, THREE.RepeatWrapping);
 assert.equal(a.generateMipmaps, true); assert.equal(a.minFilter, THREE.LinearMipmapLinearFilter);
 assert.ok(new Set(a.image.data).size > 60, 'aggregate has tonal variation');
 const material = mineralMaterial(ENV_FINISHES.concrete, a);
 // Apply the hook to the installed Three.js shader, not an invented template.
 const shader = { vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader, uniforms: {} };
 material.onBeforeCompile(shader, {});
 assert.match(shader.vertexShader, /instanceMatrix \* mineralPosition/);
 assert.match(shader.vertexShader, /vMineralPosition = mineralPosition\.xyz/);
 assert.match(shader.fragmentShader, /texture2D\(map, mineralUv \* 0\.5\)/);
 assert.doesNotMatch(shader.fragmentShader, /#include <map_fragment>/);
 assert.equal((shader.vertexShader.match(/varying vec3 vMineralPosition;/g) || []).length, 1);
 assert.equal((shader.fragmentShader.match(/varying vec3 vMineralPosition;/g) || []).length, 1);
 assert.equal(material.customProgramCacheKey(), 'corridor-mineral-metres-v1');
 material.dispose(); a.dispose(); b.dispose();
});

test('rail gauge, running height and sleeper rhythm survive non-grid splits, without duplicates or gaps', () => {
 assert.equal(2 * RAIL_OFFSET, 1.435);
 assert.equal(RAIL_TOP, .2275);
 assert.equal(ENV_BUDGET.sleeperSpacing, .8);
 for (const [a, split, b] of [[-159.9, -12.2, 8.1], [159.73, 173.2, 184.1], [tunnelExitM - 1, tunnelExitM, tunnelExitM + 9]]) {
  const whole = emptyKit(), left = emptyKit(), right = emptyKit();
  runningTrack(whole, 0, 0, a, b, 0);
  runningTrack(left, 0, 0, a, split, 0);
  runningTrack(right, 0, 0, split, b, 0);
  assert.deepEqual([...sleepers(left), ...sleepers(right)], sleepers(whole));
  assert.equal(new Set(sleepers(whole).map(b => b.p[2])).size, sleepers(whole).length);
  const distances = sleepers(whole).map(b => -b.p[2]);
  for (let i = 1; i < distances.length; i++) assert.ok(Math.abs(distances[i] - distances[i - 1] - .8) < 1e-8);
  assert.equal(heads(whole).length, 2);
  for (const rail of heads(whole)) {
   assert.ok(Math.abs(-rail.p[2] - rail.s[2] / 2 - a) < 1e-8);
   assert.ok(Math.abs(-rail.p[2] + rail.s[2] / 2 - b) < 1e-8);
   assert.ok(Math.abs(rail.p[1] + rail.s[1] / 2 - RAIL_TOP) < 1e-10);
  }
 }
});

test('all streamed layouts retain four running heads, sleepers, correct foundations and landmark anchors', () => {
 for (const hop of corridor) {
  const slices = nearbySlices(hop.start + 200).filter(s => s.hop.i === hop.i);
  for (const slice of slices) {
   const kit = build(slice), rails = heads(kit);
   assert.equal(rails.length, 4, slice.key);
   assert.deepEqual(rails.map(b => b.p[0]), TRACK_CENTERS.flatMap(x => [-1, 1].map(side => x + side * RAIL_OFFSET)));
   assert.ok(sleepers(kit).length > 0);
   for (const rail of rails) assert.equal(rail.s[2], slice.end - slice.start);
   assert.equal(kit.plates.length, landmarkPlacements(hop).filter(p => p.distance >= slice.start && p.distance < slice.end && (!slice.tunnel || p.tag !== 'tunnel')).length);
   const track = emptyKit(); guideway(track, slice);
   if (slice.tunnel) {
    assert.equal(track.foliage.length, 0);
    assert.ok(track.concrete.some(b => b.s[0] === 3.35));
    assert.ok(!track.concrete.some(b => b.p[0] === 2.8 || b.p[0] === -6.9), 'outdoor parapet absent');
   } else {
    assert.ok(track.concrete.some(b => b.s[0] === 10.4), 'deck / formation');
    assert.ok(track.steel.some(b => b.p[0] === -2.1 && b.s[0] === .5), 'protected cable trough');
    if (hop.layout === 'at-grade') assert.ok(track.solid.some(b => b.s[0] === 2.8 && b.color === '#625f53'), 'ballast');
    else assert.ok(track.concrete.some(b => b.s[0] === 2.8 && b.s[1] === .16), 'slab plinth');
   }
  }
  for (const tag of hop.tags) assert.ok(LANDMARKS[tag], tag);
 }
 assert.equal(new Set(Object.values(LANDMARKS).map(l => l.kit)).size, 16);
});

test('raised guideway rails stop at every platform and stay below the cab sightline', () => {
 for (let i = 0; i < stations.length; i++) {
  const p = stationPosition(i);
  assert.deepEqual(parapetSpans(p - 200, p + 200), [{ start: p - 200, end: p - 126 }, { start: p + 48, end: p + 200 }]);
  assert.deepEqual(parapetSpans(p - 80, p + 30), []);
  for (const slice of nearbySlices(p).filter(s => !s.tunnel)) {
   const k = emptyKit(); guideway(k, slice);
   for (const b of k.steel.filter(b => b.p[0] === 2.8 || b.p[0] === -6.9)) {
    const distance = slice.start - b.p[2];
    assert.ok(distance + b.s[2] / 2 <= p - 126 || distance - b.s[2] / 2 >= p + 48);
    assert.ok(b.p[1] + b.s[1] / 2 < 1.2);
   }
  }
 }
});

test('bounded facade, roof and tree details provide layered geometry and repeatable muted wear', () => {
 const k = emptyKit(); windows(k, 40, -10, 0, 28, 60, 30, 84);
 assert.ok(k.glass.length <= ENV_BUDGET.facadeRows * 3);
 assert.ok(k.concrete.length <= ENV_BUDGET.facadeRows * 2);
 assert.ok(k.solid.length <= ENV_BUDGET.facadeColumns + 4);
 assert.ok(new Set(k.glass.map(b => b.color)).size >= 3);
 const roof = emptyKit(); roofline(roof, 40, 40, 0, 28, 30, 84, true);
 assert.ok(roof.round.length === 1 && roof.steel.length > 0);
 assert.ok(roof.concrete.some(b => b.s[1] === 1), 'parapets');
 const horizon = emptyKit(); horizonBuilding(horizon, 80, -10, 0, 18, 35, 84);
 assert.ok(Object.values(horizon).reduce((n, items) => n + items.length, 0) <= 16);
 assert.ok(horizon.solid.some(b => b.s[0] > 18), 'podium');
 assert.ok(horizon.solid.some(b => b.p[1] > 25 && b.s[0] < 18), 'setback');
 const foliage = emptyKit(); tree(foliage, 20, -10, 0, 1.2);
 assert.equal(foliage.foliage.length, 3); assert.equal(foliage.solid.length, 2);
 assert.ok(new Set(foliage.foliage.map(b => b.p[1])).size === 3);
 const shades = Array.from({ length: 30 }, (_, i) => weathered('#a19f8c', i, 9));
 assert.ok(new Set(shades).size > 8);
 assert.deepEqual(shades, Array.from({ length: 30 }, (_, i) => weathered('#a19f8c', i, 9)));
 for (const shade of shades) for (const channel of [1, 3, 5]) assert.ok(Math.abs(parseInt(shade.slice(channel, channel + 2), 16) - parseInt('#a19f8c'.slice(channel, channel + 2), 16)) <= 9);
});

test('every streaming cell, including portals, fits the original 15k / 54 scenery budget with track included', () => {
 let maxInstances = 0, maxBatches = 0, maxSlice = 0;
 const checked = new Set();
 // Window membership changes only at these grid boundaries. Testing every cell
 // also catches the mixed surface/tunnel and short hop-boundary slices.
 for (let distance = 0; distance <= totalLengthM; distance += CHUNK_M) {
  let instances = 0, batches = 0;
  for (const slice of nearbySlices(distance)) {
   const kit = build(slice);
   let count = 0;
   for (const [slot, items] of Object.entries(kit)) {
    count += items.length; batches += Number(items.length > 0);
    if (!checked.has(slice.key) && slot !== 'plates') for (const b of items) {
     assert.ok([...b.p, ...b.s, ...(b.r ?? [])].every(Number.isFinite), slice.key);
     assert.ok(b.s.every(n => n > 0), slice.key);
    }
   }
   checked.add(slice.key); instances += count; maxSlice = Math.max(maxSlice, count);
  }
  maxInstances = Math.max(maxInstances, instances); maxBatches = Math.max(maxBatches, batches);
 }
 assert.ok(maxInstances < 15000, `${maxInstances} instances`);
 assert.ok(maxBatches <= 54, `${maxBatches} batches`);
 assert.ok(maxSlice < 3000, `${maxSlice} instances in a slice`);
 console.log(`Environment budget, every 160 m: ${maxInstances} instances / ${maxBatches} batches; ${maxSlice} largest slice. Includes main track.`);
});

test('hard locks match baseline 1d5ec7a: route, CSS, ads, cab, simulation and liveliness', () => {
 // Fixed hashes work in source archives too; tests never need git or a network.
 const locks = {
  'src/routes.ts': '07ea13a28005c986517dd79b5cdb9d15330eac7e27d2ea5a2dc4ebd1abb277dd',
  'src/billboards.ts': '6382731f0d0742e10388f2709d38fe05c3a5e85aceee7a7bf006255f480b4b45',
  'src/Billboard.tsx': 'd835f602695f533a1e6a7e3b84a2431069da66dbc7cef60c338812959c83084b',
  'src/style.css': '9e9da87125dafd9a193bfd6cef69f225e7a33dbecb18318638af50a026944a9b',
  'src/corridor.ts': '2ab2c4f576596a03b270d0c9eba73421eacf533841de9f7bc3a30a8649a5c8f0',
  'src/Cab.tsx': '05c60bb10e1ee654d0983d88c396e1b3a21951cabf4fb88529ee643cd9d83e5c',
  'src/liveliness.ts': '9fb669275819c5c640c60c1a1531f1e40f2d892dfc8e1cc2e59d35e4b02e7e30',
  'src/simulation.ts': '2abc85e3683b91ca8878b8de47eff355d830b326e3d48a47a6d39a05153c6ae6',
  'src/Traffic.tsx': '42835959f30418d1fa9bf1ad942d307a7131f46c076a6bb7777c7bf217772986',
  'src/traffic.ts': '8e7c1f55e700e2ef88744f3abb96cee99adea3014e4959c4e760c176d7096536',
  'src/Passengers.tsx': '65c81ea8e77ac143a4548d4ede147d848f1894f40d4e03304fdf29db1f8a4b0a',
  'src/audio.ts': 'e1b38ed97db03f3ea4f77bc83902a519901133ee38ee86dcb65c94e95548e360',
  'src/audio-events.ts': '59701b86f57e7cab5bf3f7ac1ef9a01952408679928a0b33d3d19b60c1560f48',
  'src/audio-physics.ts': 'c3690b0e0171df910842d2cfca8d39958ed34a7d5b8505b0c568902a3ebc9a30',
  'src/main.tsx': '60f35764d5421bb75df957e0ce63517a5f00554581e5c6c4d0b96786c13aaa2d',
  'src/PassingMetro.tsx': '3422e9cef275795cb2d1a851ee26bb32e31c7e9077e9b2a46d190d1cf6de4134',
  'src/geometry.tsx': '42c3b8d212c1439ea60249dc9be1c4d53ae298dd604b3a379f921b8093c0b84b',
  'refs/notes/corridor-bible.json': 'cb86181d1dd6b91f7dcf3151868c321c4424c0f2123ca597ccb232f6a0fb6c96',
  'public/textures/hop1-swiggy-taste-meets-speed.png': 'f24c817f250c021d627cbed0274c83adfcdd5eb8ae57cb9561c4e779a456eb55',
 };
 const hash = data => createHash('sha256').update(data).digest('hex');
 for (const [file, expected] of Object.entries(locks)) assert.equal(hash(fs.readFileSync(file)), expected, file);
 const world = fs.readFileSync('src/World.tsx', 'utf8');
 const station = world.slice(world.indexOf('function Sign('), world.indexOf('function Scenery('));
 assert.equal(hash(station), '8e0fd86b9790241d9ec4f626af4550c91eff2a63a1461e025fbead4d3800f566', 'Kanaka Sign / Station unchanged');
 assert.match(world, /dpr=\{\[1,1\.5\]\}/);
 assert.match(world, /source=\{soldBoardSource\(board\.hopIndex\)\}/);
 assert.doesNotMatch(world, /<Track\s/, 'no duplicate camera-attached rail strip');
});
