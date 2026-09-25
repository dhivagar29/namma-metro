import type { CorridorSlice } from './corridor';
import { groundHeight } from './corridor';
import { stations, stationPosition } from './routes';
import { block, ENV_BUDGET, weathered, type SceneryKit } from './environment';

export const TRACK_CENTERS = [0, -4.2] as const;
export const RAIL_OFFSET = .7175;
export const RAIL_TOP = .2275; // Existing rail, train and camera datum is unchanged.

export function parapetSpans(start: number, end: number) {
 const spans: { start: number; end: number }[] = [];
 let cursor = start;
 for (let i = 0; i < stations.length; i++) {
  const a = stationPosition(i) - 126, b = stationPosition(i) + 48;
  if (b <= cursor || a >= end) continue;
  if (a > cursor) spans.push({ start: cursor, end: a });
  cursor = Math.min(end, Math.max(cursor, b));
 }
 if (cursor < end) spans.push({ start: cursor, end });
 return spans;
}

// All longitudinal spans end exactly at their slice boundaries. Sleeper indices
// are global, so both their spacing and pigment survive arbitrary hop splits.
export function runningTrack(k: SceneryKit, x: number, y: number, start: number, end: number, base: number, yard = false) {
 const length = end - start, z = base - (start + end) / 2;
 for (const side of [-1, 1]) {
  const rail = x + side * RAIL_OFFSET;
  block(k.solid, [rail, y + .12, z], [.06, .17, length], '#715c4b');
  block(k.steel, [rail, y + .055, z], [.15, .04, length], '#625e56');
  block(k.steel, [rail, y + .21, z], [.075, .035, length], '#c5ccc6');
 }
 const cadence = yard ? ENV_BUDGET.yardSleeperSpacing : ENV_BUDGET.sleeperSpacing;
 for (let i = Math.ceil(start / cadence); i * cadence < end; i++) {
  const dz = base - i * cadence;
  block(k.concrete, [x, y + .005, dz], [2.35, .14, .25], weathered('#a19f8c', i, 9));
  // Yard fastenings are implied; running lines retain two seats per sleeper.
  if (!yard) for (const side of [-1, 1]) block(k.steel, [x + side * RAIL_OFFSET, y + .075, dz], [.24, .04, .31], '#56584f');
 }
}

export function ballastBed(k: SceneryKit, x: number, y: number, start: number, end: number, base: number) {
 const length = end - start, z = base - (start + end) / 2;
 block(k.solid, [x, y - .17, z], [2.8, .2, length], '#625f53');
 for (const side of [-1, 1]) block(k.solid, [x + side * 1.53, y - .23, z], [.55, .18, length], '#827864', [0, 0, side * -.22]);
 // Broad, low relief aggregate patches read at cab distance; individual stones
 // would add thousands of invisible triangles and shimmer under motion.
 for (let d = Math.ceil(start / 8) * 8; d < end; d += 8) {
  const span = Math.min(3.6, end - d);
  for (const side of [-1, 1]) block(k.solid, [x + side * 1.33, y - .07, base - d - span / 2], [.34, .035, span], weathered('#777163', Math.floor(d) + side, 14));
 }
}

export function guideway(k: SceneryKit, slice: CorridorSlice) {
 const { start, end, tunnel, hop } = slice, length = end - start, z = -(length / 2);
 const yard = hop.layout === 'at-grade' && !tunnel;
 if (tunnel) {
  // Independent floors stay inside the oval bores; no outdoor parapet clipping
  // through a tunnel wall or through a station platform.
  for (const x of TRACK_CENTERS) {
   block(k.concrete, [x, -.47, z], [3.35, .4, length], '#59615f');
   block(k.solid, [x, -.245, z], [.55, .045, length], '#303d3c');
  }
 } else {
  block(k.concrete, [-2.1, -.65, z], [10.4, .8, length], yard ? '#8d8978' : '#a39f8c');
  block(k.solid, [-2.1, -.235, z], [9.6, .03, length], '#56584e');
 }
 for (const x of TRACK_CENTERS) {
  if (yard) ballastBed(k, x, 0, start, end, start);
  else {
   block(k.concrete, [x, -.15, z], [2.8, .16, length], tunnel ? '#7d837c' : '#b5b2a1');
   // Dark drainage channels give the slab a readable edge and thickness.
   for (const side of [-1, 1]) block(k.solid, [x + side * 1.53, -.19, z], [.19, .1, length], '#424b47');
  }
  runningTrack(k, x, 0, start, end, start);
  block(k.steel, [x, 5.7, z], [.013, .013, length], '#485651');
 }
 if (tunnel) return;
 for (const x of [-6.9, 2.8]) {
  block(k.concrete, [x, .23, z], [.32, .7, length], '#b1ae98');
  block(k.concrete, [x, .61, z], [.4, .1, length], '#d2ccb7');
  block(k.solid, [x + (x > 0 ? -.17 : .17), .02, z], [.035, .24, length], '#696c5d');
 }
 // Protected cable trough on the median, outside either train envelope.
 block(k.concrete, [-2.1, -.035, z], [.46, .28, length], '#878b7b');
 block(k.steel, [-2.1, .12, z], [.5, .035, length], '#b0b2a0');
 for (let d = Math.ceil(start / 8) * 8; d < end; d += 8) {
  const dz = start - d;
  for (const x of [-6.9, 2.8]) {
   block(k.solid, [x + (x > 0 ? -.167 : .167), .29, dz], [.015, .25, .8], '#b5a16d');
  }
  block(k.solid, [-2.1, .143, dz], [.49, .012, .035], '#535c54');
 }
 // The raised handrail stops before every platform; the low concrete edge is
 // below platform level. It must never poke through the boarding surface.
 for (const span of parapetSpans(start, end)) for (const x of [-6.9, 2.8]) {
  block(k.steel, [x, 1.16, start - (span.start + span.end) / 2], [.07, .065, span.end - span.start], '#727a70');
  for (let d = Math.ceil((span.start + .04) / 8) * 8; d + .04 < span.end; d += 8) block(k.steel, [x, .91, start - d], [.065, .54, .065], '#666e65');
 }
 // Panel joints and rain marks on the exposed viaduct fascia, below rail level.
 if (!yard) for (let d = Math.ceil(start / 20) * 20; d < end; d += 20) {
  if (groundHeight(d) > -2) continue;
  for (const x of [-7.31, 3.11]) block(k.solid, [x, -.67, start - d], [.025, .65, .065], '#747767');
 }
}
