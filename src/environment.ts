import type { Block, V3 } from './geometry';

export type Plate = { text: string; sub: string; p: V3; width: number; color: string };
export const BOX_SLOTS = ['solid', 'concrete', 'steel', 'glass', 'glow'] as const;
export type SceneryKit = Record<typeof BOX_SLOTS[number] | 'foliage' | 'round', Block[]> & { plates: Plate[] };
export const emptyKit = (): SceneryKit => ({ solid: [], concrete: [], steel: [], glass: [], glow: [], foliage: [], round: [], plates: [] });

// One shared material per finish, never per object. Colours live on instances.
// Glass keeps a diffuse component: it must read without an environment map.
export const ENV_FINISHES = Object.freeze({
 solid: { roughness: .88, metalness: .02 },
 concrete: { roughness: .98, metalness: 0 },
 steel: { roughness: .38, metalness: .68 },
 glass: { roughness: .23, metalness: .32 },
 foliage: { roughness: 1, metalness: 0 },
});
export const ENV_BUDGET = Object.freeze({ horizonSpacing: 80, facadeRows: 9, facadeColumns: 6, sleeperSpacing: .8, yardSleeperSpacing: 1.6 });

export function random(seed: number): () => number {
 let n = seed >>> 0;
 return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
}
export function block(list: Block[], p: V3, s: V3, color: string, r?: V3) { list.push({ p, s, color, r }); }
// Integer, seeded per-instance pigment variation; no frame work.
export function weathered(color: string, seed: number, amount = 12): string {
 const offset = Math.round((random(Math.imul(seed, 0x9e3779b1))() - .5) * amount * 2);
 return '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, parseInt(color.slice(i, i + 2), 16) + offset)).toString(16).padStart(2, '0')).join('');
}
