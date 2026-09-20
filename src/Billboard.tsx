import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Blocks, type Block } from './geometry';
import { groundHeight } from './corridor';
import { BOARD_HEIGHT, BOARD_WIDTH, LED_COPY, LED_FPS, type BillboardPlacement } from './billboards';

// Canvas producers (including a future GIF decoder) own their source; this
// component owns only its GPU texture. URL slots are still images.
export type BillboardSource = { kind: 'image'; url: string } |
 { kind: 'canvas'; canvas: HTMLCanvasElement; paint?: (seconds: number) => void };

function paintDemo(canvas: HTMLCanvasElement, seconds: number, animated: boolean) {
 const ctx = canvas.getContext('2d')!;
 const w = canvas.width, h = canvas.height;
 const hue = animated ? (seconds * 36) % 360 : 270;
 ctx.fillStyle = '#091323'; ctx.fillRect(0, 0, w, h);
 ctx.fillStyle = `hsl(${hue} 85% 53%)`; ctx.fillRect(20, 20, w - 40, 180);
 ctx.strokeStyle = `hsl(${(hue + 90) % 360} 95% 65%)`; ctx.lineWidth = 12;
 const radius = animated ? 62 + 20 * Math.sin(seconds * Math.PI) : 70;
 ctx.beginPath(); ctx.arc(w / 2, 110, radius, 0, Math.PI * 2); ctx.stroke();
 ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 65px Arial';
 ctx.fillText(LED_COPY.title.split(' ')[0], w / 2, 310, w - 36);
 ctx.font = '900 120px Arial'; ctx.fillText(LED_COPY.title.split(' ')[1], w / 2, 435, w - 36);
 ctx.fillStyle = '#9affec'; ctx.font = 'bold 39px Arial';
 ctx.fillText(animated ? LED_COPY.loop : LED_COPY.tagline, w / 2, 540, w - 40);
 ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Arial';
 const [fictional, swap] = LED_COPY.sub.split(' · ');
 ctx.fillText(fictional, w / 2, 641); ctx.font = '22px Arial'; ctx.fillText(swap, w / 2, 682);
 ctx.fillStyle = '#ffffff0b';
 for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 1);
}

const Screen = memo(function Screen({ source, animated, paused }: { source?: BillboardSource; animated: boolean; paused: boolean }) {
 const material = useRef<THREE.MeshBasicMaterial>(null);
 const slot = useRef<{ texture: THREE.Texture; tick?: (seconds: number) => void } | null>(null);
 const elapsed = useRef(0), last = useRef(-1);
 useEffect(() => {
  let alive = true;
  let texture: THREE.Texture;
  let tick: ((seconds: number) => void) | undefined;
  if (source?.kind === 'image') {
   texture = new THREE.TextureLoader().load(source.url, loaded => {
    if (!alive) { loaded.dispose(); return; }
    loaded.colorSpace = THREE.SRGBColorSpace;
   });
  } else {
   const canvas = source?.canvas ?? document.createElement('canvas');
   if (!source) { canvas.width = 512; canvas.height = 768; paintDemo(canvas, 0, animated); }
   texture = new THREE.CanvasTexture(canvas);
   if (animated) tick = source ? source.paint : seconds => paintDemo(canvas, seconds, true);
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter;
  slot.current = { texture, tick }; last.current = -1;
  if (material.current) { material.current.map = texture; material.current.needsUpdate = true; }
  return () => {
   alive = false; slot.current = null;
   if (material.current) { material.current.map = null; material.current.needsUpdate = true; }
   texture.dispose();
  };
 }, [source, animated]);
 useFrame((_, dt) => {
  if (paused) return;
  elapsed.current += dt;
  const frame = Math.floor(elapsed.current * LED_FPS);
  if (frame === last.current) return;
  last.current = frame;
  const current = slot.current;
  if (animated && current) {
   current.tick?.(elapsed.current);
   if (current.texture instanceof THREE.CanvasTexture) current.texture.needsUpdate = true;
  }
  // Subtle refresh shimmer also keeps still-image slots feeling like LEDs.
  material.current?.color.setScalar(.97 + .03 * Math.sin(elapsed.current * 5));
 });
 return <mesh position={[0, 0, .26]}>
  <planeGeometry args={[BOARD_WIDTH, BOARD_HEIGHT]}/>
  <meshBasicMaterial ref={material} toneMapped={false}/>
 </mesh>;
});

export const Billboard = memo(function Billboard({ board, paused, source }: { board: BillboardPlacement; paused: boolean; source?: BillboardSource }) {
 const { x, y, distance, side } = board;
 const frame = useMemo(() => {
  const ground = groundHeight(distance) - y;
  const items: Block[] = [
   { p: [0, 0, 0], s: [8.6, 12.6, .45], color: '#15212d' },
   { p: [-2.7, (ground - 6) / 2, -.12], s: [.35, -6 - ground, .4], color: '#35434e' },
   { p: [2.7, (ground - 6) / 2, -.12], s: [.35, -6 - ground, .4], color: '#35434e' },
  ];
  return items;
 }, [distance, y]);
 const rim = useMemo<Block[]>(() => [
  ...[-1, 1].map(sign => ({ p: [sign * 4.17, 0, .27] as [number, number, number], s: [.09, 12.4, .06] as [number, number, number], color: '#64fff0' })),
  ...[-1, 1].map(sign => ({ p: [0, sign * 6.17, .27] as [number, number, number], s: [8.4, .09, .06] as [number, number, number], color: '#e794ff' })),
 ], []);
 return <group name={`mid-hop-led:${board.hopIndex}`} position={[x, y, -distance]} rotation={[0, -side * .22, 0]}>
  <Blocks items={frame}/><Blocks items={rim} glow/>
  <Screen source={source} animated={board.animated} paused={paused}/>
 </group>;
});
