import { memo, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Simulation } from './simulation';
import { TRAFFIC_COUNT, trafficPose } from './traffic';

// Two fixed instanced draws: body/cab and front/rear lights. No per-car lights,
// shadows, textures, React animation state, or route-sized geometry caches.
export const Traffic = memo(function Traffic({ simulation }: { simulation: MutableRefObject<Simulation> }) {
 const solid=useRef<THREE.InstancedMesh>(null), lamps=useRef<THREE.InstancedMesh>(null), last=useRef(-1);
 const scratch=useMemo(()=>({dummy:new THREE.Object3D(),color:new THREE.Color()}),[]);
 useLayoutEffect(()=>{
  for(const mesh of [solid.current!,lamps.current!])mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for(let i=0;i<TRAFFIC_COUNT;i++) {
   solid.current!.setColorAt(i*2,scratch.color.set(['#baad8b','#8babb0','#ad6560','#d3d6c6','#527f6c','#bfa25d'][i%6]));
   solid.current!.setColorAt(i*2+1,scratch.color.set(i%5===0?'#b9a654':'#304952'));
   for(let j=0;j<4;j++)lamps.current!.setColorAt(i*4+j,scratch.color.set(j<2?'#ffe2a4':'#d95b43'));
  }
  solid.current!.instanceColor!.needsUpdate=true;lamps.current!.instanceColor!.needsUpdate=true;
 },[scratch]);
 useFrame(()=>{
  const s=simulation.current,tick=Math.floor(s.elapsed*30);
  if(last.current===tick)return;
  last.current=tick;
  let visible=0;
  const {dummy}=scratch;
  for(let i=0;i<TRAFFIC_COUNT;i++) {
   const car=trafficPose(i,s.position,s.elapsed), auto=i%5===0;
   if(car.visible)visible++;
   const length=auto?2.7:3.9,width=auto?1.45:1.7;
   const set=(mesh:THREE.InstancedMesh,slot:number,x:number,y:number,z:number,w:number,h:number,d:number)=>{
    dummy.position.set(car.x+x,car.y+y,-car.distance+z);
    dummy.scale.set(w,car.visible?h:0,d);dummy.updateMatrix();mesh.setMatrixAt(slot,dummy.matrix);
   };
   set(solid.current!,i*2,0,.55,0,width,.72,length);
   set(solid.current!,i*2+1,0,1.1,.2*car.direction,width*.86,auto?.85:.55,length*.53);
   for(let j=0;j<4;j++)set(lamps.current!,i*4+j,(j%2?1:-1)*width*.33,.59,(j<2?-1:1)*car.direction*(length/2+.025),.27,.14,.045);
  }
  for(const mesh of [solid.current!,lamps.current!]){mesh.visible=visible>0;mesh.instanceMatrix.needsUpdate=true;}
 });
 return <group name="corridor-traffic">
  <instancedMesh ref={solid} args={[undefined,undefined,TRAFFIC_COUNT*2]} frustumCulled={false}><boxGeometry/><meshStandardMaterial roughness={.8}/></instancedMesh>
  <instancedMesh ref={lamps} args={[undefined,undefined,TRAFFIC_COUNT*4]} frustumCulled={false}><boxGeometry/><meshBasicMaterial toneMapped={false}/></instancedMesh>
 </group>;
});
