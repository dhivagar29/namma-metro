const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const THREE = require('three');
function load(name) {
 const path = `src/${name}.${name === 'Passengers' ? 'tsx' : 'ts'}`;
 const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
 } }).outputText;
 const module = { exports: {} };
 new Function('exports', 'module', 'require', source)(module.exports, module, id => id.startsWith('./') ? load(id.slice(2)) : require(id));
 return module.exports;
}
const { makeCrowd } = load('Passengers');
// Same seated camera and glass opening as World/Cab. Test world coordinates,
// projected adult size and the sightline through the physical windscreen.
function visible(traveler, distance, width, height, minPixels) {
 const camera = new THREE.PerspectiveCamera(66, width / height, .08, 650);
 camera.position.set(0, 2.8, 3); camera.rotation.x = -.035; camera.updateMatrixWorld();
 const feet = new THREE.Vector3(traveler.x, .92, traveler.z - distance);
 const head = feet.clone(); head.y += 1.77 * traveler.height;
 const chest = feet.clone(); chest.y += 1.185 * traveler.height;
 const ray = chest.clone().sub(camera.position);
 const glass = camera.position.clone().addScaledVector(ray, (.05 - camera.position.z) / ray.z);
 const a = feet.project(camera), b = head.project(camera);
 return ray.z < 0 && Math.abs(a.x) < .95 && Math.abs(b.x) < .95
  && a.y > -.6 && b.y < .95 && a.z > -1 && b.z < 1
  && Math.abs(glass.x) < 2.05 && glass.y > 1.9 && glass.y < 4
  && (b.y - a.y) * height / 2 >= minPixels;
}
test('leading queue is readable through seated windscreen at every station', () => {
 for (let index = 0; index < 37; index++) {
  const crowd = makeCrowd(index);
  const queue = crowd.travelers.filter(t => t.boarder && t.z < 0);
  assert.equal(queue.length, 3);
  assert.ok(queue.every(t => t.x > 2.5 && t.z >= -38));
  for (const [w, h] of [[1440, 900], [390, 844]]) {
   assert.equal(queue.filter(t => visible(t, 0, w, h, 40)).length, 3, `station ${index}, ${w}x${h}`);
  }
 }
});
test('waiting crowd stays in view during approach and throughout completed boarding', () => {
 for (let index = 0; index < 37; index++) {
  // Non-boarders retain their positions at all dwell times, including serviced.
  const waiting = makeCrowd(index).travelers.filter(t => !t.boarder && t.x > 0);
  assert.equal(waiting.length, 5);
  for (const [w, h] of [[1440, 900], [390, 844]]) {
   for (const distance of [60, 25, 8, 0, -8]) {
    const visibleCount = waiting.filter(t => visible(t, distance, w, h, 12)).length;
    assert.ok(visibleCount >= 3, `station ${index}, ${w}x${h}, ${distance}m: ${visibleCount} visible`);
   }
  }
 }
});
