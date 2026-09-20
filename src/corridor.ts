import bible from '../refs/notes/corridor-bible.json';
import { interStationM, stations, stationPosition, totalLengthM } from './routes';

export type CorridorLayout = 'elevated' | 'at-grade' | 'underground';
export type CorridorHop = Readonly<{
 i: number; from: string; to: string; m: number; layout: CorridorLayout;
 tags: readonly string[]; start: number; end: number;
}>;

// The bible is the data, not a second hand-maintained copy of the route.
if (bible.hops.length !== interStationM.length) throw new Error('Corridor hop count does not match Purple Line');
export const corridor: readonly CorridorHop[] = bible.hops.map((hop, i) => {
 if (hop.i !== i || hop.from !== stations[i] || hop.to !== stations[i + 1] || hop.m !== interStationM[i]) {
  throw new Error(`Corridor bible is out of alignment at hop ${i}`);
 }
 if (!['elevated', 'at-grade', 'underground'].includes(hop.layout)) throw new Error(`Unknown layout at hop ${i}`);
 return Object.freeze({ ...hop, tags: Object.freeze([...hop.tags]), layout: hop.layout as CorridorLayout,
  start: stationPosition(i), end: stationPosition(i + 1) });
});

// Half-open intervals: a boundary belongs to the departing hop, including when
// it isn't a multiple of the streaming grid. Clamp the terminal to the last hop.
export function hopAt(distance: number): CorridorHop {
 return corridor.find(hop => distance < hop.end) ?? corridor[corridor.length - 1];
}
export const isUnderground = (distance: number) => hopAt(distance).layout === 'underground';
export const tunnelExitM = stationPosition(23) + 48;
// KSR's platform extends beyond its stop marker. Keep its last 48 m enclosed
// before the brief portal onto the elevated Magadi Road hop.
export const isEnclosed = (distance: number) => distance >= stationPosition(18) && distance < tunnelExitM;

export const CHUNK_M = 160;
export const VIEW_AHEAD_M = 800;
export const VIEW_BEHIND_M = 160;
export type CorridorSlice = Readonly<{ key: string; hop: CorridorHop; start: number; end: number; tunnel: boolean }>;

export function nearbySlices(distance: number): CorridorSlice[] {
 const cell = Math.floor(Math.max(0, distance) / CHUNK_M);
 const start = Math.max(-CHUNK_M, cell * CHUNK_M - VIEW_BEHIND_M);
 const end = Math.min(totalLengthM + CHUNK_M, cell * CHUNK_M + VIEW_AHEAD_M);
 const slices: CorridorSlice[] = [];
 for (let grid = start; grid < end; grid += CHUNK_M) {
  for (const hop of corridor) {
   const a = Math.max(grid, hop.i === 0 ? -CHUNK_M : hop.start);
   const b = Math.min(grid + CHUNK_M, hop.i === corridor.length - 1 ? totalLengthM + CHUNK_M : hop.end);
   if (b > a) {
    const edges = a < tunnelExitM && b > tunnelExitM ? [a, tunnelExitM, b] : [a, b];
    edges.slice(0, -1).forEach((from, index) => slices.push({ key: `${hop.i}:${grid}:${index}`, hop,
     start: from, end: edges[index + 1], tunnel: isEnclosed((from + edges[index + 1]) / 2) }));
   }
  }
 }
 return slices;
}

// Keep the rail and cab coordinates fixed. The streets descend/rise below the
// viaduct across the ends of the two at-grade hops, without changing physics.
export function groundHeight(distance: number): number {
 const a = corridor[12].start, b = corridor[13].end, ramp = 200;
 const t = Math.max(0, Math.min(1, (distance - a + ramp) / ramp, (b + ramp - distance) / ramp));
 return -10 + 9 * t * t * (3 - 2 * t);
}

export function stationChamberAt(distance: number): boolean {
 return stations.some((_, i) => i >= 18 && i <= 23 && distance >= stationPosition(i) - 126 && distance <= stationPosition(i) + 48);
}

// Split on chamber edges, not at arbitrary grid centers: tubes cannot slice
// through platforms or leave a gap when the next chunk mounts.
export function tunnelSections(start: number, end: number) {
 const edges = [start, end];
 for (let i = 18; i <= 23; i++) for (const d of [stationPosition(i) - 126, stationPosition(i) + 48]) {
  if (d > start && d < end) edges.push(d);
 }
 edges.sort((a, b) => a - b);
 return edges.slice(0, -1).map((a, i) => ({ start: a, end: edges[i + 1], chamber: stationChamberAt((a + edges[i + 1]) / 2) }));
}
