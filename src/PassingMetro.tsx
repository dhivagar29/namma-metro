import { memo, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Blocks, type Block, type V3 } from './geometry';
import type { Simulation } from './simulation';
// A six-car eastbound service gives the adjacent track a recognizable Purple silhouette.
export const PassingMetro = memo(function PassingMetro({ simulation }: { simulation: MutableRefObject<Simulation> }) {
 const train=useRef<THREE.Group>(null);
 const blocks=useMemo(()=>{
  const items:Block[]=[];
  const add=(p:V3,s:V3,color:string)=>items.push({p,s,color});
  for(let car=0;car<6;car++) {
   const z=-car*21;
   add([0,2.08,z],[2.85,2.85,20],'#c6cdc9');
   add([0,3.58,z],[2.65,.3,19.5],'#d6dad3');
   add([0,1.03,z],[2.89,.58,20],'#784295');
   add([0,.51,z],[2.15,.35,17.5],'#35434d');
   add([0,2,z-10.3],[2.1,2.3,.55],'#36424a');
   for(const side of [-1,1]) for(let j=0;j<7;j++) {
    const windowZ=z-8+j*2.65;
    add([side*1.433,2.55,windowZ],[.03,.85,1.6],'#29424d');
    if(j%2===1) {
     add([side*1.454,1.95,windowZ],[.04,2.25,1.68],'#a9b6b8');
     add([side*1.48,2.55,windowZ],[.03,.85,1.4],'#304d57');
     add([side*1.482,1.95,windowZ],[.04,2.25,.035],'#46555d');
    }
   }
  }
  add([0,2.75,10.02],[2.32,1.06,.08],'#17303b');
  add([0,3.39,10.04],[1.65,.18,.05],'#25383e');
  add([0,1.7,10.04],[2.6,.55,.06],'#784295');
  return items;
 },[]);
 useFrame(()=>{
  const s=simulation.current;
  if(train.current)train.current.position.z=((s.elapsed*17+s.position+460)%3400)-570;
 });
 return <group ref={train} position={[-4.2,0,-110]}><Blocks items={blocks}/>{[-.94,.94].map(x=><mesh key={x} position={[x,1.25,10.1]}><circleGeometry args={[.12,12]}/><meshBasicMaterial color="#fff5ca"/></mesh>)}</group>;
});
