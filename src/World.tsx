import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { kannada, stations, stationPosition } from './routes';
import type { Simulation } from './simulation';
type Props = { simulation: MutableRefObject<Simulation>; paused: boolean };
function Box({ p, s, color }: { p: [number, number, number]; s: [number, number, number]; color: string }) {
 return <mesh position={p}><boxGeometry args={s}/><meshStandardMaterial color={color} roughness={.8}/></mesh>;
}
function Sign({ text, sub, p, width = 8 }: { text: string; sub: string; p: [number, number, number]; width?: number }) {
 const texture = useMemo(() => {
  const canvas = document.createElement('canvas'); canvas.width = 1536; canvas.height = 256;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#652b87'; ctx.fillRect(0, 0, 1536, 256);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `600 ${text.length > 36 ? 38 : 58}px sans-serif`; ctx.fillText(text, 768, 110);
  ctx.font = '38px sans-serif'; ctx.fillText(sub, 768, 187);
  const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace; return result;
 }, [text, sub]);
 useEffect(() => () => texture.dispose(), [texture]);
 return <mesh position={p}><planeGeometry args={[width, width / 6]}/><meshBasicMaterial map={texture} side={THREE.DoubleSide}/></mesh>;
}
const Station = memo(function Station({ index, simulation }: { index: number; simulation: MutableRefObject<Simulation> }) {
 const crowd = useRef<THREE.Group>(null);
 useFrame(() => {
  if (!crowd.current) return;
  const state = simulation.current;
  const boarding = state.target === index && state.doors;
  crowd.current.visible = state.stops <= index;
  crowd.current.scale.x = boarding ? Math.max(.55, 1 - state.dwell * .09) : 1;
 });
 const underground = index >= 19 && index <= 23;
 return <group position={[0, 0, -stationPosition(index)]}>
  {[-1, 1].map(side => <group key={side}>
   <Box p={[side * 6, .1, 40]} s={[7, .8, 140]} color="#a5aaa9"/>
   <Box p={[side * 2.65, .52, 40]} s={[.22, .04, 140]} color="#e4b85d"/>
   <Box p={[side * 6, 6.6, 40]} s={[8.5, .25, 146]} color={underground ? '#5f6976' : '#b1b7b4'}/>
   {[-24, 0, 24, 48, 72, 96].map(z => <group key={z}>
    <Box p={[side * 7.5, 3.5, z]} s={[.55, 6, .6]} color="#bec5c3"/>
    <Box p={[side * 7.5, 2.1, z]} s={[.58, .5, .63]} color="#8646a9"/>
    <Box p={[side * 5, 6.4, z]} s={[.2, .04, 8]} color="#f6ecd5"/>
    <Sign text={stations[index]} sub={kannada[index]} p={[side * 6.4, 4.7, z + .4]} width={6.4}/>
   </group>)}
   {side === 1 && <group ref={crowd}>{[12, 20, 31, 42, 51, 69, 79].map((z, i) => <group key={z} position={[side * (3.7 + i % 2), .52, z]}>
    <Box p={[0, .9, 0]} s={[.48, .85, .3]} color={['#dda264', '#719d9e', '#9d739e'][i % 3]}/>
    <mesh position={[0, 1.55, 0]}><sphereGeometry args={[.19, 8, 8]}/><meshStandardMaterial color="#986b4b"/></mesh>
    <Box p={[-.13, .25, 0]} s={[.14, .5, .2]} color="#343c4c"/><Box p={[.13, .25, 0]} s={[.14, .5, .2]} color="#343c4c"/>
   </group>)}</group>}
  </group>)}
  <Sign text={index === 22 ? 'MAJESTIC  ↔  GREEN LINE' : 'ನಮ್ಮ ಮೆಟ್ರೋ  ·  NAMMA METRO'} sub="WESTBOUND   /   CHALLAGHATTA" p={[0, 7, -25]} width={15}/>
  <Box p={[0, 6.2, -25]} s={[20, .16, .4]} color="#657472"/>
  <Box p={[0, .035, 0]} s={[2, .06, .35]} color="#f4d06c"/>
  <Sign text="S" sub="STOP" p={[2, 1.5, -2]} width={.9}/>
 </group>;
});
const CityChunk = memo(function CityChunk({ n }: { n: number }) {
 const z = -n * 80;
 const underground = n * 80 >= 19 * 1200 - 500 && n * 80 <= 23 * 1200 + 500;
 if (underground) return <group position={[0, 0, z]}>
  <Box p={[-11, 4, 0]} s={[.5, 10, 80]} color="#29353f"/><Box p={[11, 4, 0]} s={[.5, 10, 80]} color="#29353f"/>
  <Box p={[0, 8.6, 0]} s={[22, .5, 80]} color="#28333e"/>
  {[-30, -10, 10, 30].map(k => <group key={k}><Box p={[-10.6, 5, k]} s={[.08, .15, 6]} color="#b2e8f1"/><Box p={[10.6, 5, k]} s={[.08, .15, 6]} color="#b2e8f1"/><Box p={[-10.5, 4, k]} s={[.3, 9, .3]} color="#4a5661"/></group>)}
 </group>;
 const gradeLift = Math.max(0, 1 - Math.abs(n * 80 - 13 * 1200) / 600) * 9;
 return <group position={[0, gradeLift, z]}>
  <Box p={[0, -10, 0]} s={[180, .5, 80]} color="#6e7d69"/>
  <Box p={[17, -9.7, 0]} s={[13, .1, 80]} color="#5d6263"/>
  <Box p={[17, -9.6, 0]} s={[.2, .02, 65]} color="#d4cbb3"/>
  <Box p={[0, -5, 0]} s={[1.8, 9, 2]} color="#94958e"/>
  {[-1, 1].map(side => <group key={side}>
   <Box p={[side * (30 + n % 3 * 5), -2, 0]} s={[12, 15 + n % 4 * 5, 22]} color={['#bab3a2', '#999f9b', '#bdac98', '#9fa8ab'][Math.abs(n) % 4]}/>
   {[0, 1, 2, 3].map(i => <Box key={i} p={[side * (30 + n % 3 * 5), i * 3 - 4, 11.1]} s={[10, 1.1, .05]} color="#6e8287"/>)}
   {[-24, 20].map(k => <group key={k}><Box p={[side * 12, -6, k]} s={[.5, 6, .5]} color="#7c715e"/><mesh position={[side * 12, -2.5, k]}><icosahedronGeometry args={[4.2, 1]}/><meshStandardMaterial color="#4f7961"/></mesh></group>)}
  </group>)}
  <Box p={[14, -8.9, n % 3 * 15]} s={[1.8, 1.5, 3.4]} color="#d9b33e"/><Box p={[20, -8.9, -20]} s={[2, 1.3, 4]} color="#8b4456"/>
  {n % 3 === 0 && <Sign text={n % 2 === 0 ? 'ಬೆಂಗಳೂರು · BENGALURU' : 'FILTER COFFEE  /  ದರ್ಶಿನಿ'} sub={n % 2 === 0 ? 'THE GARDEN CITY' : 'A little break in a busy city'} p={[-24, 6, 12]} width={13}/>}
 </group>;
});
function Scenery({ simulation, paused }: Props) {
 const moving = useRef<THREE.Group>(null), railBed = useRef<THREE.Group>(null);
 const [chunk, setChunk] = useState(0);
 const { camera, gl, scene } = useThree();
 const look = useRef({ x: 0, y: 0, dragging: false });
 useEffect(() => {
  const canvas = gl.domElement;
  const down = (e: PointerEvent) => { look.current.dragging = true; canvas.setPointerCapture(e.pointerId); };
  const up = () => { look.current.dragging = false; };
  const move = (e: PointerEvent) => { if (look.current.dragging && !paused) { look.current.x = THREE.MathUtils.clamp(look.current.x - e.movementX * .0015, -.24, .24); look.current.y = THREE.MathUtils.clamp(look.current.y - e.movementY * .001, -.12, .1); } };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointermove', move); canvas.addEventListener('lostpointercapture', up);
  return () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('lostpointercapture', up); };
 }, [gl, paused]);
 useFrame((_, dt) => {
  const position = simulation.current.position;
  if (moving.current) moving.current.position.z = position;
  if (railBed.current) railBed.current.position.z = position % 4;
  const nextChunk = Math.floor(position / 80); if (nextChunk !== chunk) setChunk(nextChunk);
  camera.rotation.order = 'YXZ'; camera.rotation.y = THREE.MathUtils.damp(camera.rotation.y, look.current.x, 8, dt); camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, -.035 + look.current.y, 8, dt);
  const under = position >= 19 * 1200 - 500 && position <= 23 * 1200 + 500;
  const color = new THREE.Color(under ? '#17232f' : '#d9c0a5');
  (scene.background as THREE.Color).lerp(color, Math.min(1, dt * 2));
  if (scene.fog instanceof THREE.Fog) { scene.fog.color.copy(scene.background as THREE.Color); scene.fog.far = under ? 160 : 460; }
 });
 const underground = chunk * 80 >= 19 * 1200 - 500 && chunk * 80 <= 23 * 1200 + 500;
 const nearby = stations.map((_, i) => i).filter(i => Math.abs(stationPosition(i) - chunk * 80) < 650);
 return <>
  <color attach="background" args={['#d9c0a5']}/><fog attach="fog" args={['#d9c0a5', 70, 460]}/>
  <ambientLight intensity={underground ? .9 : 1.5} color={underground ? '#a9d5f0' : '#ffffff'}/><hemisphereLight args={[underground ? '#a6d8ee' : '#ffe3bd', '#505c68', 1.5]}/><directionalLight position={[-20, 30, -100]} intensity={underground ? .3 : 2.8} color={underground ? '#b2d6ed' : '#ffcb92'}/>
  <Box p={[0, -.45, -180]} s={[10, .7, 500]} color="#777c77"/>
  {[-4.8, 4.8].map(x => <Box key={x} p={[x, .5, -180]} s={[.3, 1.3, 500]} color="#a5a69c"/>)}
  {[-.78, .78, -3.6, -2.1].map(x => <Box key={x} p={[x, .075, -180]} s={[.085, .15, 500]} color="#b9c6c6"/>)}
  <group ref={railBed}>{Array.from({length: 100}, (_, i) => <Box key={i} p={[-1.45, -.025, 20 - i * 4]} s={[5.5, .08, .3]} color="#4b5558"/>)}</group>
  <group ref={moving}>{Array.from({length: 9}, (_, i) => <CityChunk key={chunk + i - 2} n={chunk + i - 2}/>)}{nearby.map(index => <Station key={index} index={index} simulation={simulation}/>)}</group>
  <Box p={[-2.3, 2.7, 1]} s={[.24, 5.7, 1]} color="#28363e"/><Box p={[2.3, 2.7, 1]} s={[.24, 5.7, 1]} color="#28363e"/>
  <Box p={[0, 4.6, 1]} s={[5, .5, 1]} color="#28363e"/><Box p={[0, 1.1, 1]} s={[5, .65, 1.7]} color="#25353d"/>
 </>;
}
export default function World(props: Props) {
 return <Canvas camera={{fov: 65, near: .1, far: 650, position: [0, 2.8, 3]}} dpr={[1, 1.5]} gl={{antialias: true}}><Scenery {...props}/></Canvas>;
}
