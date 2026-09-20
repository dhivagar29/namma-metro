const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const THREE = require('three');
const cache = new Map();
function load(name) {
 if (cache.has(name)) return cache.get(name);
 const code = ts.transpileModule(fs.readFileSync(`src/${name}.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
 }).outputText;
 const module = { exports: {} };
 new Function('exports', 'module', 'require', code)(module.exports, module, id =>
  id.endsWith('.json') ? require('../refs/notes/corridor-bible.json') : id.startsWith('./') ? load(id.slice(2)) : require(id));
 cache.set(name, module.exports); return module.exports;
}
const { corridor, nearbySlices } = load('corridor');
const { totalLengthM } = load('routes');
const { landmarkPlacements } = load('landmarks');
const { boardSide, boardForHop, nearbyBillboards, MAX_ANIMATED_BOARDS, LED_COPY, BOARD_WIDTH, BOARD_HEIGHT } = load('billboards');

test('hop parity alternates one side; outdoor boards stay mid-span clear of both tracks and landmark anchors', () => {
 for (const hop of corridor) {
  assert.equal(boardSide(hop.i), hop.i % 2 ? 1 : -1);
  if (hop.i) assert.equal(boardSide(hop.i), -boardSide(hop.i - 1));
  const board = boardForHop(hop);
  if (!board) continue;
  const fraction = (board.distance - hop.start) / hop.m;
  assert.ok(fraction >= .3999 && fraction <= .6001);
  assert.ok(Math.abs(board.x) - BOARD_WIDTH / 2 > 10);
  assert.ok(board.distance - hop.start > 150 && hop.end - board.distance > 150);
  for (const p of landmarkPlacements(hop)) assert.ok(Math.abs(p.distance - board.distance) > 55, `landmark clearance hop ${hop.i}`);
 }
});
test('underground hops emit no board, including within the nearby window', () => {
 for (const hop of corridor.filter(h => h.layout === 'underground')) {
  assert.equal(boardForHop(hop), null);
  assert.ok(!nearbyBillboards((hop.start + hop.end) / 2).some(b => b.hopIndex === hop.i));
 }
 for (const hop of corridor.filter(h => h.layout === 'at-grade')) assert.ok(boardForHop(hop));
});
test('streaming uses the corridor window and caps animated screens throughout the route', () => {
 let sawLoop = false, sawStill = false;
 for (let distance = 0; distance <= totalLengthM; distance += 37) {
  const boards = nearbyBillboards(distance), slices = nearbySlices(distance);
  assert.ok(boards.filter(b => b.animated).length <= MAX_ANIMATED_BOARDS);
  assert.ok(boards.length <= 3);
  assert.equal(new Set(boards.map(b => b.hopIndex)).size, boards.length);
  for (const board of boards) {
   assert.ok(slices.some(s => !s.tunnel && board.distance >= s.start && board.distance < s.end));
   assert.equal(board.distance, boardForHop(corridor[board.hopIndex]).distance);
   if (board.animated) { sawLoop = true; assert.equal(board.hopIndex % 2, 1); } else sawStill = true;
  }
 }
 assert.ok(sawLoop && sawStill);
});
test('all LED copy is fictional with the required placeholder and sample loop', () => {
 assert.equal(LED_COPY.title, 'ADVERTISE HERE');
 assert.equal(LED_COPY.sub, 'FICTIONAL DEMO · SWAP IMAGE/GIF LATER');
 assert.equal(LED_COPY.loop, 'SAMPLE LOOP');
 assert.doesNotMatch(Object.values(LED_COPY).join(' '), /BMRCL|NAMMA|KANAKA/i);
});
test('both board faces point into the approach and fit the forward cab view for a 60 m approach interval', () => {
 for (const hop of [corridor[0], corridor[1], corridor[12], corridor[13]]) {
  const b = boardForHop(hop), rotation = new THREE.Euler(0, -b.side * .22, 0);
  for (const approach of [60, 80, 100, 120]) {
   const camera = new THREE.PerspectiveCamera(66, 1440 / 1000, .08, 850);
   camera.position.set(0, 2.8, -b.distance + approach); camera.rotation.x = -.035; camera.updateMatrixWorld();
   const center = new THREE.Vector3(b.x, b.y, -b.distance);
   const normal = new THREE.Vector3(0, 0, 1).applyEuler(rotation);
   assert.ok(normal.dot(camera.position.clone().sub(center).normalize()) > .9);
   for (const x of [-BOARD_WIDTH / 2, BOARD_WIDTH / 2]) for (const y of [-BOARD_HEIGHT / 2, BOARD_HEIGHT / 2]) {
    const point = new THREE.Vector3(x, y, 0).applyEuler(rotation).add(center);
    const ndc = point.clone().project(camera);
    assert.ok(Math.abs(ndc.x) < .85 && ndc.y < .85 && ndc.y > -.6);
   }
  }
 }
});
