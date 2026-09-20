import { memo, useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Blocks, Box, type Block, type V3 } from './geometry';
import type { Control, Simulation } from './simulation';

// Original mesh work inspired by the Tyne & Wear and Tokyo 05R cab references.
// Cab coordinates stay fixed: the seated camera is at [0, 2.8, 3], looking -Z.
const labels = ['NAMMA METRO  /  PURPLE LINE', 'CAB 01', 'DOOR CIRCUIT', 'ATP / TRIP', 'TRACTION',
 'DOOR RELEASE', 'CLOSE', 'ACKNOWLEDGE', 'HORN', 'HEADLIGHTS', 'WIPER', 'CAB LIGHT',
 'MASTER CONTROLLER', 'P', 'N', 'B', 'EMERGENCY', 'TRAIN STATUS', '6 CAR  /  TCMS',
 'DOORS', 'INTERLOCK', 'POWER', 'SERVICE', 'RADIO', 'WESTBOUND', 'ISOLATE', 'OFF', 'ON'] as const;
type Legend = typeof labels[number];
const panelTilt: V3 = [-.38, 0, 0];

function Housing({ p, s, color, r = [0, 0, 0], radius = .025, rubber, metalness = .12, slope = 0 }: {
 p: V3; s: V3; color: string; r?: V3; radius?: number; rubber?: THREE.Texture; metalness?: number; slope?: number;
}) {
 const geometry = useMemo(() => {
  const g = new RoundedBoxGeometry(...s, 2, radius);
  if (slope) {
   // Shear the molded shell so the inclined fascia seats against it throughout.
   const vertices = g.getAttribute('position');
   for (let i = 0; i < vertices.count; i++) vertices.setZ(i, vertices.getZ(i) - vertices.getY(i) * slope);
   g.computeVertexNormals();
  }
  return g;
 }, [s[0], s[1], s[2], radius, slope]);
 useEffect(() => () => geometry.dispose(), [geometry]);
 return <mesh position={p} rotation={r} geometry={geometry}>
  <meshStandardMaterial color={color} roughness={rubber ? .93 : .64} metalness={metalness}
   bumpMap={rubber} bumpScale={rubber ? .0018 : 0}/>
 </mesh>;
}

// One locally painted atlas for engraved legends, with no photo/font downloads.
function makeLegends() {
 const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1024;
 const ctx = canvas.getContext('2d')!;
 ctx.fillStyle = '#dce5df'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 labels.forEach((label, i) => {
  ctx.font = `600 ${label.length > 22 ? 48 : 72}px sans-serif`;
  ctx.fillText(label, (i % 4) * 512 + 256, Math.floor(i / 4) * 128 + 64, 482);
 });
 const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
 texture.anisotropy = 4; return texture;
}
function Legend({ atlas, text, p, w = .38, h = .07, r = [0, 0, 0] }: {
 atlas: THREE.Texture; text: Legend; p: V3; w?: number; h?: number; r?: V3;
}) {
 const geometry = useMemo(() => {
  const index = labels.indexOf(text), col = index % 4, row = Math.floor(index / 4);
  const g = new THREE.PlaneGeometry(w, h), uv = g.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (col + uv.getX(i)) / 4, (7 - row + uv.getY(i)) / 8);
  return g;
 }, [text, w, h]);
 useEffect(() => () => geometry.dispose(), [geometry]);
 return <mesh position={p} rotation={r} geometry={geometry}>
  <meshBasicMaterial map={atlas} transparent depthWrite={false} toneMapped={false}/>
 </mesh>;
}
function Disc({ p, radius, depth, color, metal = false }: { p: V3; radius: number; depth: number; color: string; metal?: boolean }) {
 return <mesh position={p} rotation={[Math.PI / 2, 0, 0]}>
  <cylinderGeometry args={[radius, radius, depth, 24]}/>
  <meshStandardMaterial color={color} roughness={metal ? .35 : .62} metalness={metal ? .7 : .1}/>
 </mesh>;
}
function Panel({ p, s, children, rubber }: { p: V3; s: V3; children?: ReactNode; rubber?: THREE.Texture }) {
 const screws = useMemo<Block[]>(() => [-1, 1].flatMap(x => [-1, 1].flatMap(y => [
  { p: [x * (s[0] / 2 - .033), y * (s[1] / 2 - .028), s[2] / 2 + .002] as V3, s: [.017, .017, .006] as V3, color: '#97a4a1' },
  { p: [x * (s[0] / 2 - .033), y * (s[1] / 2 - .028), s[2] / 2 + .006] as V3, s: [.012, .0025, .002] as V3, color: '#202b2b' },
 ])), [s[0], s[1], s[2]]);
 return <group position={p}>
  <Housing p={[0, 0, 0]} s={s} color="#394544" radius={.018} rubber={rubber}/>
  <Blocks items={screws}/>{children}
 </group>;
}
function PushButton({ p, color, label, atlas }: { p: V3; color: string; label: Legend; atlas: THREE.Texture }) {
 return <group position={p}>
  <Disc p={[0, 0, 0]} radius={.066} depth={.026} color="#131b1c"/>
  <Disc p={[0, 0, .018]} radius={.052} depth={.017} color="#a5b0ac" metal/>
  <Disc p={[0, 0, .036]} radius={.043} depth={.023} color={color}/>
  <Legend atlas={atlas} text={label} p={[0, -.091, .019]} w={.24} h={.055}/>
 </group>;
}
function Toggle({ p, label, atlas, on = false }: { p: V3; label: Legend; atlas: THREE.Texture; on?: boolean }) {
 return <group position={p}>
  <Disc p={[0, 0, 0]} radius={.047} depth={.014} color="#151e20"/>
  <Disc p={[0, 0, .013]} radius={.033} depth={.025} color="#a6aaa2" metal/>
  <group rotation={[on ? -.38 : .38, 0, 0]}>
   <Disc p={[0, 0, .062]} radius={.013} depth={.1} color="#acb5b1" metal/>
   <Housing p={[0, 0, .117]} s={[.037, .04, .055]} color="#1b2425" radius={.012}/>
  </group>
  <Legend atlas={atlas} text={label} p={[0, -.08, .013]} w={.24} h={.055}/>
 </group>;
}
function makeDial(effort: boolean) {
 const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
 const ctx = canvas.getContext('2d')!;
 ctx.fillStyle = '#152526'; ctx.fillRect(0, 0, 512, 512);
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 // The physical needle uses this same 270-degree sweep, increasing clockwise.
 for (let i = 0; i <= 40; i++) {
  const angle = (-225 + i / 40 * 270) * Math.PI / 180;
  const major = i % 5 === 0;
  ctx.strokeStyle = !effort && i >= 32 ? '#e4a45f' : '#d8e7df'; ctx.lineWidth = major ? 4 : 2;
  ctx.beginPath(); ctx.moveTo(256 + Math.cos(angle) * (major ? 181 : 194), 256 + Math.sin(angle) * (major ? 181 : 194));
  ctx.lineTo(256 + Math.cos(angle) * 211, 256 + Math.sin(angle) * 211); ctx.stroke();
  if (major) {
   ctx.font = '27px sans-serif'; ctx.fillStyle = '#d8e7df';
   ctx.fillText(String(effort ? -3 + i / 10 : i * 2.5), 256 + Math.cos(angle) * 153, 256 + Math.sin(angle) * 153);
  }
 }
 ctx.fillStyle = '#a2bbb5'; ctx.font = '22px sans-serif'; ctx.fillText(effort ? 'EFFORT' : 'km/h', 256, 322);
 ctx.font = '16px sans-serif'; ctx.fillText(effort ? 'm/s²' : 'SPEED', 256, 355);
 const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
 return texture;
}
function Gauge({ p, radius, face, needle }: { p: V3; radius: number; face: THREE.Texture; needle: MutableRefObject<THREE.Group | null> }) {
 return <group position={p}>
  <Disc p={[0, 0, 0]} radius={radius + .022} depth={.052} color="#0c1316"/>
  <mesh position={[0, 0, .032]}><torusGeometry args={[radius, .009, 8, 48]}/><meshStandardMaterial color="#8f9e99" metalness={.65} roughness={.35}/></mesh>
  <mesh position={[0, 0, .034]}><circleGeometry args={[radius - .01, 48]}/><meshBasicMaterial map={face} toneMapped={false}/></mesh>
  <group ref={needle} position={[0, 0, .043]}>
   <Box p={[0, radius * .34, 0]} s={[.009, radius * .79, .007]} color="#f3d19a"/>
   <Disc p={[0, 0, .008]} radius={.019} depth={.012} color="#b6c1b5" metal/>
  </group>
 </group>;
}

export const Cab = memo(function Cab({ simulation, control }: { simulation: MutableRefObject<Simulation>; control: MutableRefObject<Control> }) {
 const lever = useRef<THREE.Group>(null), speedNeedle = useRef<THREE.Group>(null), effortNeedle = useRef<THREE.Group>(null);
 const doorLamp = useRef<THREE.MeshBasicMaterial>(null), tripLamp = useRef<THREE.MeshBasicMaterial>(null);
 const tractionLamp = useRef<THREE.MeshBasicMaterial>(null), screenDoors = useRef<THREE.MeshBasicMaterial>(null);
 const assets = useMemo(() => {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!, pixels = ctx.createImageData(128, 128);
  for (let i = 0; i < pixels.data.length; i += 4) {
   const grain = 95 + ((i * 73 ^ i >> 3) & 63);
   pixels.data.set([grain, grain, grain, 255], i);
  }
  ctx.putImageData(pixels, 0, 0);
  const rubber = new THREE.CanvasTexture(canvas); rubber.wrapS = rubber.wrapT = THREE.RepeatWrapping; rubber.repeat.set(6, 3);
  return { atlas: makeLegends(), speed: makeDial(false), effort: makeDial(true), rubber };
 }, []);
 useEffect(() => () => Object.values(assets).forEach(texture => texture.dispose()), [assets]);
 const { atlas, rubber } = assets;
 const details = useMemo<Block[]>(() => {
  const items: Block[] = [];
  // Demister grille and panel seams are instanced, including their screw slots.
  for (let x = -1.95; x < 2; x += .068) items.push({ p: [x, 2.278, -.32], s: [.027, .005, .11], color: '#141f22' });
  for (const x of [-2.25, 2.25]) for (let y = 1.85; y < 4.2; y += .43)
   items.push({ p: [x, y, .622], s: [.018, .018, .008], color: '#8b9691' });
  for (const x of [-1.1, .93]) items.push({ p: [x, 1.856, .82], s: [.007, .003, .64], color: '#172123' });
  // The controller's milled detents lie alongside its travel slot.
  for (let z = -.19; z <= .2; z += .065) {
   items.push({ p: [1.2, 1.921, .64 + z], s: [.09, .014, .018], color: '#82928d' });
   items.push({ p: [1.44, 1.921, .64 + z], s: [.045, .014, .018], color: '#82928d' });
  }
  // Speaker slots, monitor soft keys and a six-car door circuit mimic the refs.
  for (let i = 0; i < 8; i++) items.push({ p: [-1.71 + i * .047, 2.169, .252], s: [.018, .13, .025], color: '#101a1d', r: panelTilt });
  return items;
 }, []);
 useFrame((_, dt) => {
  const s = simulation.current, drive = control.current, unlocked = s.doors || s.closing > 0;
  // Preserve the existing power/coast/brake wiring and smooth mechanical travel.
  if (lever.current) lever.current.rotation.x = THREE.MathUtils.damp(lever.current.rotation.x, drive === 'power' ? -.35 : drive === 'coast' ? 0 : .35, 8, dt);
  if (doorLamp.current) doorLamp.current.color.set(unlocked ? '#ffb641' : '#8adf9b');
  if (tripLamp.current) tripLamp.current.color.set(s.atp || drive === 'emergency' ? '#ff8956' : '#284b3b');
  if (tractionLamp.current) tractionLamp.current.color.set(!unlocked && !s.atp && !s.complete && drive === 'power' ? '#a3e9cb' : '#263e3b');
  if (screenDoors.current) screenDoors.current.color.set(unlocked ? '#eeb358' : '#80c8a1');
  if (speedNeedle.current) speedNeedle.current.rotation.z = (135 - THREE.MathUtils.clamp(s.speed * 3.6 / 100, 0, 1) * 270) * Math.PI / 180;
  if (effortNeedle.current) effortNeedle.current.rotation.z = (135 - THREE.MathUtils.clamp((s.acceleration + 3) / 4, 0, 1) * 270) * Math.PI / 180;
 });
 return <group name="driver-cab">
  {/* Soft local fill falls off before the platform; no shadow/postprocessing cost. */}
  <pointLight position={[0, 3.7, 1.15]} color="#dce9df" intensity={2.1} distance={4.5} decay={2}/>
  <Housing p={[0, 4.31, .48]} s={[4.9, .46, 1.18]} color="#b6b9af" radius={.1}/>
  <Housing p={[0, 4.08, .1]} s={[4.38, .15, .21]} color="#202b2e" radius={.04}/>
  <Housing p={[0, 4.018, .216]} s={[4.34, .025, .027]} color="#74498d" radius={.009}/>
  <Legend atlas={atlas} text="NAMMA METRO  /  PURPLE LINE" p={[0, 4.09, .211]} w={1.75} h={.095}/>
  <Legend atlas={atlas} text="CAB 01" p={[1.7, 4.09, .211]} w={.35} h={.075}/>
  {[-1, 1].map(side => <group key={side}>
   <Housing p={[side * 2.27, 2.9, .41]} s={[.23, 2.75, .4]} r={[0, 0, -side * .06]} color="#b6bab1" radius={.065}/>
   <Housing p={[side * 2.135, 2.91, .175]} s={[.056, 2.64, .055]} r={[0, 0, -side * .06]} color="#111d23" radius={.02}/>
   <Housing p={[side * 2.41, 1.3, .69]} s={[.39, 1.09, 1.65]} color="#b0b4aa" radius={.085}/>
   <Housing p={[side * 2.32, 1.79, .91]} s={[.3, .12, 1.18]} color="#293536" radius={.048} rubber={rubber}/>
  </group>)}
  {/* Raised into the visible band above the unchanged 20dvh HTML desk. */}
  {/* Deep continuous molded worktop, rounded wrist edge and separate sloped fascia. */}
  <Housing p={[0, 1.525, .38]} s={[4.74, .55, 1.77]} color="#555f5a" radius={.12}/>
  <Housing p={[0, 1.78, .35]} s={[4.7, .16, 1.78]} color="#354240" radius={.075} rubber={rubber}/>
  <Housing p={[0, 1.805, 1.18]} s={[4.53, .13, .15]} color="#202d2e" radius={.058} rubber={rubber}/>
  <Housing p={[0, 1.665, 1.242]} s={[4.36, .025, .012]} color="#775185" radius={.005}/>
  <Housing p={[0, 2.004, -.12]} s={[4.51, .51, .69]} color="#283535" radius={.09} rubber={rubber} slope={.4}/>
  <Housing p={[0, 2.242, -.16]} s={[4.54, .075, .46]} color="#243232" radius={.032} rubber={rubber}/>
  <Blocks items={details}/>
  <group position={[0, 2.026, .24]} rotation={panelTilt}>
   <Panel p={[0, 0, 0]} s={[4.3, .48, .075]} rubber={rubber}>
    <Gauge p={[-.42, .005, .057]} radius={.189} face={assets.speed} needle={speedNeedle}/>
    <Gauge p={[-.96, .005, .057]} radius={.151} face={assets.effort} needle={effortNeedle}/>
    {/* Annunciators sit in individual recessed rubber/metal bezels. */}
    {([-1.73, -1.39, 1.86] as const).map((x, i) => <group key={x} position={[x, i === 2 ? .035 : -.1, .063]}>
     <Disc p={[0, 0, 0]} radius={.059} depth={.026} color="#151e20"/>
     <Disc p={[0, 0, .018]} radius={.047} depth={.012} color="#91a49a" metal/>
     <mesh position={[0, 0, .029]}><circleGeometry args={[.037, 24]}/><meshBasicMaterial ref={i === 0 ? doorLamp : i === 1 ? tripLamp : tractionLamp} color="#284b3b" toneMapped={false}/></mesh>
     <Legend atlas={atlas} text={i === 0 ? 'DOOR CIRCUIT' : i === 1 ? 'ATP / TRIP' : 'TRACTION'} p={[0, -.078, .02]} w={.29} h={.06}/>
    </group>)}
    <Legend atlas={atlas} text="RADIO" p={[-1.55, .15, .044]} w={.27} h={.06}/>
    <Housing p={[.47, .005, .049]} s={[.96, .402, .058]} color="#101b20" radius={.026}/>
    <Housing p={[.47, .015, .083]} s={[.81, .29, .012]} color="#172e33" radius={.006}/>
    <Legend atlas={atlas} text="TRAIN STATUS" p={[.47, .099, .091]} w={.6} h={.067}/>
    <Legend atlas={atlas} text="6 CAR  /  TCMS" p={[.47, -.084, .091]} w={.53} h={.052}/>
    <mesh position={[.47, .051, .093]}><planeGeometry args={[.72, .006]}/><meshBasicMaterial color="#a17cba" toneMapped={false}/></mesh>
    <mesh position={[.47, -.014, .095]}>
     {/* A single shape geometry keeps all six door-circuit cells in one draw. */}
     <shapeGeometry args={[Array.from({ length: 6 }, (_, i) => {
      const x = -.335 + i * .116, shape = new THREE.Shape();
      shape.moveTo(x, -.026); shape.lineTo(x + .09, -.026); shape.lineTo(x + .09, .026); shape.lineTo(x, .026); shape.closePath(); return shape;
     })]}/>
     <meshBasicMaterial ref={screenDoors} color="#eeb358" toneMapped={false}/>
    </mesh>
    <Toggle p={[1.2, .035, .063]} label="HEADLIGHTS" atlas={atlas} on/>
    <Toggle p={[1.52, .035, .063]} label="WIPER" atlas={atlas}/>
   </Panel>
  </group>
  {/* Left bank: tactile buttons inset into a replaceable inclined service plate. */}
  <group position={[-1.52, 1.882, .63]} rotation={[-Math.PI / 2 + .13, 0, 0]}>
   <Panel p={[0, 0, 0]} s={[1.05, .58, .035]}>
    <PushButton p={[-.32, .125, .029]} color="#c08d32" label="DOOR RELEASE" atlas={atlas}/>
    <PushButton p={[0, .125, .029]} color="#6d9c71" label="CLOSE" atlas={atlas}/>
    <PushButton p={[.32, .125, .029]} color="#b5bda9" label="ACKNOWLEDGE" atlas={atlas}/>
    <PushButton p={[-.32, -.14, .029]} color="#293638" label="HORN" atlas={atlas}/>
    <Toggle p={[0, -.14, .029]} label="CAB LIGHT" atlas={atlas} on/>
    <Toggle p={[.32, -.14, .029]} label="ISOLATE" atlas={atlas}/>
   </Panel>
  </group>
  {/* A shallow document tray adds worktop depth without raising the sightline. */}
  <Housing p={[-.08, 1.874, .77]} s={[1.59, .025, .55]} color="#17282b" radius={.03} rubber={rubber}/>
  <Housing p={[-.08, 1.894, .53]} s={[1.47, .025, .018]} color="#7a8c83" radius={.006}/>
  <Legend atlas={atlas} text="WESTBOUND" p={[-.08, 1.891, .79]} w={.7} h={.09} r={[-Math.PI / 2, 0, 0]}/>
  {/* Notched master controller: recessed gate, boot, metal shaft and palm grip. */}
  <Housing p={[1.31, 1.88, .66]} s={[.52, .07, .76]} color="#1b292d" radius={.035}/>
  <Housing p={[1.31, 1.919, .65]} s={[.092, .012, .55]} color="#090f13" radius={.01}/>
  <Legend atlas={atlas} text="MASTER CONTROLLER" p={[1.31, 1.923, .98]} w={.48} h={.073} r={[-Math.PI / 2, 0, 0]}/>
  {(['P', 'N', 'B'] as const).map((text, i) => <Legend key={text} atlas={atlas} text={text} p={[1.49, 1.923, .46 + i * .19]} w={.08} h={.08} r={[-Math.PI / 2, 0, 0]}/>)}
  <group position={[1.31, 1.93, .65]}>
   <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.075, .075, .14, 24]}/><meshStandardMaterial color="#222b2d" roughness={.82}/></mesh>
   <group ref={lever} name="master-controller-lever">
    <mesh position={[0, .16, 0]}><cylinderGeometry args={[.023, .031, .32, 16]}/><meshStandardMaterial color="#a0aaa3" metalness={.75} roughness={.3}/></mesh>
    <Housing p={[0, .33, 0]} s={[.32, .11, .135]} color="#141e22" radius={.043} rubber={rubber}/>
    <Housing p={[0, .385, -.012]} s={[.18, .015, .071]} color="#64736f" radius={.006}/>
   </group>
  </group>
  <group position={[1.94, 1.885, .76]} rotation={[-Math.PI / 2 + .1, 0, 0]}>
   <Disc p={[0, 0, 0]} radius={.12} depth={.016} color="#c4a052"/>
   <Disc p={[0, 0, .026]} radius={.078} depth={.04} color="#222c2c"/>
   <Disc p={[0, 0, .071]} radius={.105} depth={.06} color="#aa3f34"/>
   <Legend atlas={atlas} text="EMERGENCY" p={[0, -.165, .015]} w={.37} h={.073}/>
  </group>
  {/* Wiper stays parked at the sill; no blade crosses the central track view. */}
  <Disc p={[1.9, 2.32, -.36]} radius={.056} depth={.055} color="#233031"/>
  <Housing p={[1.46, 2.325, -.37]} s={[.85, .024, .03]} color="#182529" radius={.009}/>
  <Housing p={[.79, 2.297, -.38]} s={[.8, .038, .027]} color="#132024" r={[0, 0, .035]} radius={.009}/>
  <mesh position={[0, 3.13, -.41]}>
   <planeGeometry args={[4.33, 2.02]}/>
   <meshPhysicalMaterial color="#bdd9d9" transparent opacity={.026} roughness={.15} metalness={0} depthWrite={false}/>
  </mesh>
 </group>;
});
