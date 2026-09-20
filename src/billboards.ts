import { corridor, nearbySlices, type CorridorHop } from './corridor';
import { landmarkPlacements } from './landmarks';
import type { BillboardSource } from './Billboard';

const HOP_1_SOLD_SOURCE: BillboardSource = { kind: 'image', url: '/textures/hop1-swiggy-taste-meets-speed.png' };

export function soldBoardSource(hopIndex: number): BillboardSource | undefined {
 return hopIndex === 0 ? HOP_1_SOLD_SOURCE : undefined;
}

export const LED_COPY = {
 title: 'ADVERTISE HERE', sub: 'FICTIONAL DEMO · SWAP IMAGE/GIF LATER', loop: 'SAMPLE LOOP', tagline: 'YOUR NEXT BIG IDEA',
} as const;
export const MAX_ANIMATED_BOARDS = 2;
export const LED_FPS = 10;
export const BOARD_WIDTH = 8;
export const BOARD_HEIGHT = 12;
export const boardSide = (hopIndex: number) => hopIndex % 2 === 0 ? -1 : 1;
export type BillboardPlacement = { hopIndex: number; side: number; x: number; y: number; distance: number; animated: boolean };

export function boardForHop(hop: CorridorHop): BillboardPlacement | null {
 if (hop.layout === 'underground') return null;
 const side = boardSide(hop.i);
 const landmarks = landmarkPlacements(hop);
 // Maximize separation from landmark kits, with a central anchor as tie-breaker.
 const candidates = [.5, .4, .6, .45, .55].map(t => hop.start + hop.m * t);
 const clearance = (d: number) => Math.min(...landmarks.map(p => Math.abs(p.distance - d)));
 const distance = candidates.reduce((best, d) => clearance(d) > clearance(best) ? d : best);
 return { hopIndex: hop.i, side, x: side < 0 ? -18 : 16, y: 8, distance, animated: false };
}

export function nearbyBillboards(distance: number): BillboardPlacement[] {
 const slices = nearbySlices(distance);
 const boards = corridor.map(boardForHop).filter((b): b is BillboardPlacement => b !== null &&
  slices.some(s => !s.tunnel && b.distance >= s.start && b.distance < s.end));
 const live = new Set(boards.filter(b => b.hopIndex % 2 === 1)
  .sort((a, b) => Math.abs(a.distance - distance) - Math.abs(b.distance - distance))
  .slice(0, MAX_ANIMATED_BOARDS).map(b => b.hopIndex));
 return boards.map(b => ({ ...b, animated: !soldBoardSource(b.hopIndex) && live.has(b.hopIndex) }));
}
