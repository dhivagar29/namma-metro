import { block, ENV_BUDGET, random, weathered, type SceneryKit } from './environment';

export function tree(k: SceneryKit, x: number, y: number, z: number, scale: number, color = '#405f48') {
 block(k.solid, [x, y + 2.7 * scale, z], [.5 * scale, 5.4 * scale, .48 * scale], '#6a5c49');
 block(k.solid, [x + .7 * scale, y + 4.1 * scale, z], [.28 * scale, 3 * scale, .3 * scale], '#776950', [0, 0, -.55]);
 block(k.foliage, [x - .8 * scale, y + 5.7 * scale, z], [3.7 * scale, 2.2 * scale, 3.3 * scale], color);
 block(k.foliage, [x + 2 * scale, y + 5.5 * scale, z + .8 * scale], [2.8 * scale, 1.9 * scale, 2.6 * scale], '#607653');
 block(k.foliage, [x + .4 * scale, y + 7 * scale, z - .5 * scale], [2.7 * scale, 1.5 * scale, 2.6 * scale], '#536e4c');
}

export function roofline(k: SceneryKit, x: number, y: number, z: number, w: number, d: number, seed: number, tank = false) {
 block(k.concrete, [x, y + .15, z], [w + .7, .3, d + .7], '#c6c2ae');
 block(k.solid, [x, y + .34, z], [w - .7, .06, d - .7], '#777d70');
 for (const side of [-1, 1]) {
  block(k.concrete, [x + side * w / 2, y + .65, z], [.24, 1, d], '#b6b6a3');
  block(k.concrete, [x, y + .65, z + side * d / 2], [w, 1, .24], '#b6b6a3');
 }
 block(k.solid, [x - w * .19, y + 1.7, z - d * .2], [w * .32, 2.7, d * .28], '#929887');
 block(k.concrete, [x - w * .19, y + 3.15, z - d * .2], [w * .35, .2, d * .31], '#d0cab5');
 if (tank) {
  block(k.concrete, [x + w * .24, y + .6, z], [3.5, .5, 3.5], '#a8a28d');
  // Reuse the rounded geometry for the familiar squat roof water cistern.
  block(k.round, [x + w * .24, y + 1.9, z], [1.45, 1.45, 1.45], '#47524b');
  block(k.steel, [x + w * .24, y + 1.9, z + 1.42], [1.7, .09, .06], '#92968a');
 } else {
  for (const offset of [-.1, .22]) {
   block(k.steel, [x + w * offset, y + .95, z + d * .23], [2.7, 1.1, 2], weathered('#989e94', seed + Math.round(offset * 100)));
   block(k.solid, [x + w * offset, y + 1.53, z + d * .23], [2.2, .07, 1.5], '#46544d');
  }
 }
}

export function windows(k: SceneryKit, x: number, y: number, z: number, w: number, h: number, depth: number, seed: number) {
 const rng = random(seed), rows = Math.min(ENV_BUDGET.facadeRows, Math.floor((h - 1) / 3.2));
 const front = z + depth / 2, facing = x > 0 ? -1 : 1;
 const base = weathered('#72796b', seed, 9);
 block(k.solid, [x, y + .7, z], [w + .14, 1.4, depth + .14], base);
 for (let i = 0; i < rows; i++) {
  const floor = 2.7 + i * (h - 3.5) / Math.max(1, rows - 1);
  const glass = ['#46666a', '#587c7d', '#688985'][Math.floor(rng() * 3)];
  block(k.glass, [x, y + floor, front + .055], [w - .8, 1.7, .1], glass);
  block(k.glass, [x + facing * (w / 2 + .055), y + floor, z], [.1, 1.7, depth - .8], glass);
  // Projecting sills provide a lit edge over a dark reveal without shadows.
  block(k.concrete, [x, y + floor - 1, front + .22], [w + .4, .18, .52], '#babba8');
  block(k.concrete, [x + facing * (w / 2 + .22), y + floor - 1, z], [.52, .18, depth], '#a9b2a1');
  if (i % 3 === seed % 3) block(k.glass, [x - w * .22, y + floor, front + .12], [w * .17, 1.65, .04], '#aaa58a');
 }
 const columns = Math.min(ENV_BUDGET.facadeColumns, Math.floor(w / 3));
 for (let i = 0; i <= columns; i++) {
  const dx = -w / 2 + .45 + i * (w - .9) / columns;
  block(k.solid, [x + dx, y + h / 2, front + .17], [.16, h - .6, .24], '#a4ae9f');
 }
 // A few broad rain streaks, inset from the sill edge, not a decal per window.
 for (const offset of [-.35, .25]) block(k.solid, [x + w * offset, y + .9, front + .08], [.35, 1.6, .045], '#697267');
}

// Distant skyline: fewer towers and facade bands, but a recognisable podium,
// shoulder and service crown. Never run the near-building window kit here.
export function horizonBuilding(k: SceneryKit, x: number, y: number, z: number, w: number, h: number, seed: number) {
 const palette = ['#aaa68e', '#b0a08a', '#82968e', '#b9b39d'];
 const color = weathered(palette[Math.abs(seed) % palette.length], seed);
 const facing = x > 0 ? -1 : 1, depth = 25;
 block(k.solid, [x, y + 2, z], [w + 5, 4, depth + 4], '#7f8778');
 block(k.solid, [x, y + h / 2, z], [w, h, depth], color);
 block(k.solid, [x - facing * w * .17, y + h + 1.9, z - 3], [w * .67, 3.8, 16], color);
 block(k.concrete, [x, y + h + .2, z], [w + .7, .4, depth + .7], '#c6c3ad');
 block(k.steel, [x, y + h + 4.25, z - 3], [w * .5, .7, 8], '#68776d');
 for (let floor = 5; floor < h - 1; floor += 7) {
  block(k.glass, [x, y + floor, z + 12.55], [w - 1, 2.9, .1], '#526f70');
  block(k.glass, [x + facing * (w / 2 + .05), y + floor, z], [.1, 2.9, 23], '#607b78');
 }
}
