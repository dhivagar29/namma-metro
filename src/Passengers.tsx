import { memo, useCallback, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { boardingProgress, type Simulation } from './simulation';
import type { V3 } from './geometry';
import { stationPosition } from './routes';

type Shape = 'round' | 'taper' | 'cloth' | 'detail' | 'drape';
type Joint = 'body' | 'leftLeg' | 'leftShin' | 'rightLeg' | 'rightShin' | 'leftArm' | 'leftForearm' | 'rightArm' | 'rightForearm';
type Part = { shape: Shape; joint: Joint; matrix: THREE.Matrix4; color: string; slot: number };
type Traveler = {
 parts: Part[]; x: number; z: number; doorZ: number; facing: number; height: number; width: number;
 boarder: boolean; delay: number; phase: number; phone: boolean; saree: boolean;
};
const SHAPES: Shape[] = ['round', 'taper', 'cloth', 'detail', 'drape'];
const JOINTS: Joint[] = ['body', 'leftLeg', 'leftShin', 'rightLeg', 'rightShin', 'leftArm', 'leftForearm', 'rightArm', 'rightForearm'];
const SKIN = ['#70452f', '#8c5639', '#a56c48', '#bd855e', '#654334', '#98603e'];
const CLOTHES = ['#317c79', '#b45262', '#c19143', '#546c9d', '#e0c9a1', '#78475e', '#789382', '#b36442'];
export const CROWD_CAP = 32;
const INK = '#242a35', HAIR = '#25201f', GOLD = '#d4af65';
const smooth = (t: number) => t * t * (3 - 2 * t);

// A folded pallu: hip to left shoulder, then hanging down the back.
// The folds are geometry, so the cloth stays legible without texture downloads.
function drapeGeometry() {
 const rows = [
  [[-.13,.91,.145],[.015,.93,.19],[.15,.96,.15]],
  [[-.225,1.35,.14],[-.105,1.23,.19],[.035,1.11,.17]],
  [[-.245,1.445,.015],[-.14,1.465,.04],[-.025,1.425,.025]],
  [[-.255,1.28,-.16],[-.14,1.29,-.2],[-.025,1.26,-.16]],
  [[-.25,.66,-.18],[-.135,.64,-.225],[-.005,.69,-.18]],
 ];
 const vertices: number[] = [], indices: number[] = [];
 rows.forEach(row => row.forEach(point => vertices.push(...point)));
 for (let row = 0; row < rows.length - 1; row++) for (let col = 0; col < 2; col++) {
  const a = row * 3 + col; indices.push(a,a+3,a+1,a+1,a+3,a+4);
 }
 return { positions: new Float32Array(vertices), indices: new Uint16Array(indices) };
}

export function makeCrowd(index: number) {
 const counts: Record<Shape, number> = { round: 0, taper: 0, cloth: 0, detail: 0, drape: 0 };
 const travelers: Traveler[] = [];
 const dummy = new THREE.Object3D();
 for (let i = 0; i < CROWD_CAP; i++) {
  const seed = i + index * 7, outfit = seed % 6, saree = outfit === 0, kurta = outfit === 1 || outfit === 4;
  const skin = SKIN[(seed * 5 + Math.floor(seed / 6)) % SKIN.length], shirt = CLOTHES[(seed * 3 + Math.floor(seed / 6)) % CLOTHES.length];
  const accent = saree ? GOLD : CLOTHES[(seed * 3 + 3) % CLOTHES.length];
  const trousers = kurta ? '#d6c6aa' : seed % 2 ? '#364761' : '#424246';
  const boarder = i < 18, opposite = i >= 23, row = i % 3, lane = Math.floor(i / 3);
  const doorZ = 3.1 + lane * 20;
  // The seated camera is at z=+3 and looks down -Z. Positive platform Z is
  // behind the cab at the stop marker, so keep the leading queue ahead of it.
  // These positions remain on the platform, clear of its x=2.12 edge/columns.
  const leadingQueue = boarder && lane === 0;
  const waitingAhead = !boarder && !opposite;
  const traveler: Traveler = {
   parts: [], boarder, saree, phone: outfit === 2 || outfit === 4,
   x: leadingQueue ? 2.85 + row * .38 : boarder ? 3.05 + row * .67 : opposite ? -7.3 - (i % 2) * .8 : 2.85 + (i % 2) * .65,
   z: leadingQueue ? -8 - row * 2.2 : boarder ? doorZ - 1.3 + row * .35 : opposite ? -24 + (i - 23) * 15.5 : -12 - (i - 18) * 3.6,
   // Waiting travelers face partly toward the arriving cab; they stay visible
   // throughout dwell, including after the boarding queue has entered the train.
   doorZ, facing: waitingAhead ? -.45 + (i % 3) * .3 : opposite ? Math.PI / 2 - .2 : -Math.PI / 2 + (i % 3 - 1) * .22,
   height: .92 + (seed % 6) * .036, width: .88 + (seed % 5) * .06,
   delay: row * .32 + (lane % 3) * .1, phase: seed * 1.71,
  };
  const add = (shape: Shape, p: V3, s: V3, color: string, joint: Joint = 'body', r: V3 = [0,0,0]) => {
   dummy.position.set(...p); dummy.scale.set(...s); dummy.rotation.set(...r); dummy.updateMatrix();
   traveler.parts.push({ shape, joint, color, matrix: dummy.matrix.clone(), slot: counts[shape]++ });
  };
  // Adult proportions: shaped shoulders/waist, neck, oval face, ears and a small nose.
  add('taper', [0,1.185,0], [.215,.45,.135], shirt);
  add('round', [0,1.37,0], [seed % 3 === 0 ? .24 : .21,.095,.137], shirt);
  add('taper', [0,1.455,0], [.058,.13,.059], skin);
  add('round', [0,1.615,.012], [.116,.157,.105], skin);
  add('round', [0,1.696,-.017], [.12,seed % 4 === 0 ? .065 : .1,.106], seed % 9 === 0 ? '#827e73' : HAIR);
  add('round', [0,1.625,.115], [.025,.035,.035], skin);
  for (const side of [-1,1]) {
   add('round', [side*.113,1.61,.002], [.025,.043,.027], skin);
   add('round', [side*.044,1.649,.105], [.011,.009,.007], HAIR);
  }
  if (saree || kurta) {
   add('round', [0,1.605,-.09], [.107,.12,.05], HAIR);
   add('round', [0,1.56,-.145], [.073,.068,.063], HAIR);
   if (saree) for (const side of [-1,1]) add('round', [side*.126,1.572,.013], [.018,.028,.017], GOLD);
  } else if (seed % 3 === 0) {
   add('round', [0,1.535,.071], [.075,.04,.053], '#352a25');
  }
  if (saree) {
   add('cloth', [0,.535,0], [.265,.91,.175], shirt);
   add('cloth', [0,.12,0], [.27,.07,.18], accent);
   // Narrow pleats down the front and a contrasting shoulder border.
   for (const x of [-.065,0,.065]) add('taper', [x,.5,.165], [.014,.69,.016], accent);
   add('drape', [0,0,0], [1,1,1], accent);
  } else if (kurta) {
   add('cloth', [0,.9,0], [.245,.46,.16], shirt);
   add('cloth', [0,.695,0], [.247,.035,.162], accent);
   add('detail', [0,1.26,.137], [.018,.25,.012], accent);
   // Dupatta over one shoulder and down the front.
   if (outfit === 4) {
    add('detail', [-.135,1.115,.158], [.095,.66,.025], accent, 'body', [0,0,-.07]);
    add('detail', [-.135,1.1,-.16], [.105,.69,.025], accent, 'body', [.06,0,.06]);
   }
  } else {
   add('round', [0,.94,0], [.179,.13,.13], trousers);
   add('detail', [0,1.19,.139], [.012,.36,.01], '#d7c9b3');
   for (const side of [-1,1]) add('detail', [side*.044,1.375,.14], [.063,.092,.015], '#e0d7c7', 'body', [0,0,side*.42]);
  }
  for (const side of [-1,1]) {
   const leg: Joint = side === -1 ? 'leftLeg' : 'rightLeg', shin: Joint = side === -1 ? 'leftShin' : 'rightShin';
   const arm: Joint = side === -1 ? 'leftArm' : 'rightArm', forearm: Joint = side === -1 ? 'leftForearm' : 'rightForearm';
   add('taper', [0,-.185,0], [.083,.37,.085], saree ? skin : trousers, leg);
   add('round', [0,0,0], [.067,.068,.067], saree ? skin : trousers, shin);
   add('taper', [0,-.19,0], [.065,.38,.066], saree ? skin : trousers, shin);
   add('round', [0,-.37,.046], [.072,.046,.135], saree || kurta ? '#514033' : INK, shin);
   if (saree || kurta) add('detail', [0,-.343,.072], [.124,.022,.041], GOLD, shin);
   add('round', [0,-.02,0], [.071,.086,.075], shirt, arm);
   add('taper', [0,-.105,0], [.068,.21,.069], shirt, arm);
   add('taper', [0,-.226,0], [.047,.065,.048], skin, arm);
   add('round', [0,0,0], [.047,.05,.048], skin, forearm);
   add('taper', [0,-.11,0], [.045,.22,.047], skin, forearm);
   add('round', [0,-.245,.005], [.043,.063,.032], skin, forearm);
   if (saree) add('taper', [0,-.192,0], [.049,.029,.05], GOLD, forearm);
  }
  if (traveler.phone) {
   add('detail', [0,-.258,.025], [.077,.139,.017], INK, 'rightForearm', [-.2,0,0]);
   add('detail', [0,-.255,.038], [.059,.107,.006], '#90b4bb', 'rightForearm', [-.2,0,0]);
  }
  if (outfit === 2 || outfit === 3 || outfit === 5) {
   add('round', [0,1.145,-.21], [.175,.245,.105], outfit === 3 ? '#ac774d' : '#35434a');
   add('round', [0,1.065,-.298], [.12,.105,.031], '#59636a');
   for (const side of [-1,1]) add('detail', [side*.144,1.225,.126], [.033,.37,.03], '#30393d', 'body', [0,0,side*-.1]);
  } else {
   add('cloth', [.26,seed % 2 ? .82 : .88,-.015], [.09,seed % 2 ? .39 : .28,.16], seed % 2 ? '#c5b594' : '#985e3f');
   add('detail', [.206,1.16,0], [.025,.5,.028], '#5a4034', 'body', [0,0,.12]);
  }
  travelers.push(traveler);
 }
 return { travelers, counts };
}

export const Passengers = memo(function Passengers({ index, simulation }: { index: number; simulation: MutableRefObject<Simulation> }) {
 const meshes = useRef<Partial<Record<Shape, THREE.InstancedMesh>>>({});
 const crowd = useMemo(() => makeCrowd(index), [index]);
 const drape = useMemo(drapeGeometry, []);
 const material = useRef<THREE.MeshStandardMaterial>(null);
 const scratch = useMemo(() => ({
  root: new THREE.Object3D(), joint: new THREE.Object3D(), matrix: new THREE.Matrix4(), color: new THREE.Color(),
  bones: Object.fromEntries(JOINTS.map(joint => [joint, new THREE.Matrix4()])) as Record<Joint, THREE.Matrix4>,
 }), []);
 const last = useRef('');

 const pose = useCallback((elapsed: number, dwell: number, boarding: boolean, departed: boolean) => {
  const { root, joint, matrix, bones } = scratch;
  for (const traveler of crowd.travelers) {
   const progress = traveler.boarder && boarding ? boardingProgress(dwell, traveler.delay) : 0;
   const hidden = traveler.boarder && (departed || progress >= 1);
   // Walk along the platform first, then turn across the threshold behind the cab.
   const along = smooth(Math.min(1, progress / .68)), across = smooth(Math.max(0, (progress - .55) / .45));
   const x = THREE.MathUtils.lerp(traveler.x, 1.48, across), z = THREE.MathUtils.lerp(traveler.z, traveler.doorZ, along);
   const distance = Math.abs(z - traveler.z) + Math.abs(x - traveler.x);
   const walking = progress > 0 && progress < 1 ? Math.sin(Math.min(1, progress * 8) * Math.PI / 2) : 0;
   const stride = Math.sin(distance * 9) * .43 * walking;
   const idle = Math.sin(elapsed * 1.25 + traveler.phase) * .012;
   const alongT = Math.min(1, progress / .68), acrossT = Math.max(0, (progress - .55) / .45);
   const dx = (1.48 - traveler.x) * 6 * acrossT * (1 - acrossT) / .45;
   const dz = (traveler.doorZ - traveler.z) * 6 * alongT * (1 - alongT) / .68;
   const heading = progress >= .68 ? -Math.PI / 2 : Math.atan2(dx, dz);
   const yaw = THREE.MathUtils.lerp(traveler.facing, heading, smooth(Math.min(1, progress / .12)));
   root.position.set(x, .92 + Math.abs(Math.sin(distance * 9)) * .018 * walking, z);
   root.rotation.set(walking * .025, yaw, idle * (1 - walking));
   root.scale.set(hidden ? 0 : traveler.width, hidden ? 0 : traveler.height, hidden ? 0 : 1);
   root.updateMatrix(); bones.body.copy(root.matrix);
   const bone = (name: Joint, parent: Joint, p: V3, angle: number, roll = 0) => {
    joint.position.set(...p); joint.rotation.set(angle, 0, roll); joint.updateMatrix();
    bones[name].multiplyMatrices(bones[parent], joint.matrix);
   };
   for (const side of [-1,1]) {
    const leg = side === -1 ? 'leftLeg' : 'rightLeg', shin = side === -1 ? 'leftShin' : 'rightShin';
    const arm = side === -1 ? 'leftArm' : 'rightArm', forearm = side === -1 ? 'leftForearm' : 'rightForearm';
    const step = stride * side * (traveler.saree ? .65 : 1);
    bone(leg, 'body', [side*.095,.83,0], step);
    bone(shin, leg, [0,-.38,0], Math.max(0,-step) * .8);
    bone(arm, 'body', [side*.224,1.355,0], -step * .65 + idle, side*.075);
    bone(forearm, arm, [0,-.265,0], traveler.phone && side === 1 ? -1.35 + walking*.85 : -.12);
   }
   for (const part of traveler.parts) {
    matrix.multiplyMatrices(bones[part.joint], part.matrix);
    meshes.current[part.shape]!.setMatrixAt(part.slot, matrix);
   }
  }
  SHAPES.forEach(shape => { meshes.current[shape]!.instanceMatrix.needsUpdate = true; });
 }, [crowd, scratch]);

 useLayoutEffect(() => {
  SHAPES.forEach(shape => {
   const mesh = meshes.current[shape]!;
   mesh.material = material.current!;
   mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   // Fixed platform envelope includes every walking pose; no per-frame bounds rebuild.
   mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(-2,2,38), 79);
  });
  crowd.travelers.forEach(traveler => traveler.parts.forEach(part => {
   meshes.current[part.shape]!.setColorAt(part.slot, scratch.color.set(part.color));
  }));
  SHAPES.forEach(shape => { meshes.current[shape]!.instanceColor!.needsUpdate = true; });
  const s = simulation.current;
  pose(s.elapsed, s.dwell, s.target === index && s.doors, s.stops > index);
  last.current = '';
 }, [crowd, index, pose, scratch, simulation]);

 useFrame(() => {
  const s = simulation.current;
  // Simulation time freezes with pause; upload at 30 Hz instead of every render.
  const hz = Math.abs(s.position - stationPosition(index)) < 150 ? 30 : 10;
  const tick = `${Math.floor(s.elapsed * hz)}:${s.target}:${s.doors}:${s.stops}:${Math.floor(s.dwell * hz)}`;
  if (last.current === tick) return;
  last.current = tick;
  pose(s.elapsed, s.dwell, s.target === index && s.doors, s.stops > index);
 });

 return <group name={`platform-travelers-${index}`}>
  {SHAPES.map(shape => <instancedMesh key={shape} name={`travelers-${shape}`} ref={mesh => { if (mesh) meshes.current[shape] = mesh; }} args={[undefined, undefined, crowd.counts[shape]]}>
   {shape === 'round' && <sphereGeometry args={[1,10,8]}/>}
   {shape === 'taper' && <cylinderGeometry args={[1,.76,1,8]}/>}
   {shape === 'cloth' && <cylinderGeometry args={[.66,1,1,10]}/>}
   {shape === 'detail' && <boxGeometry/>}
   {shape === 'drape' && <bufferGeometry onUpdate={geometry => geometry.computeVertexNormals()}>
    <bufferAttribute attach="attributes-position" args={[drape.positions,3]}/>
    <bufferAttribute attach="index" args={[drape.indices,1]}/>
   </bufferGeometry>}
   {shape === 'round' && <meshStandardMaterial ref={material} roughness={.94} side={THREE.DoubleSide}/>}
  </instancedMesh>)}
 </group>;
});
