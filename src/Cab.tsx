import { memo, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Blocks, Box, type Block } from './geometry';
import type { Control, Simulation } from './simulation';
export const Cab = memo(function Cab({ simulation, control }: { simulation: MutableRefObject<Simulation>; control: MutableRefObject<Control> }) {
 const lever = useRef<THREE.Group>(null), doorLamp = useRef<THREE.MeshBasicMaterial>(null), tripLamp = useRef<THREE.MeshBasicMaterial>(null);
 const details = useMemo(() => {
  const items: Block[] = [];
  for (const x of [-2.21, 2.21]) {
   items.push({p:[x, 2.9, .72], s:[.16, 3.45, .38], color:'#c4c7c1', r:[0,0,-Math.sign(x)*.08]});
   items.push({p:[x*.95, 2.95, .5], s:[.05, 2.8, .06], color:'#10181e', r:[0,0,-Math.sign(x)*.08]});
   for(let y=1.7;y<4.2;y+=.5) items.push({p:[x,y,.94],s:[.025,.025,.02],color:'#607178'});
  }
  for(let x=-1.7;x<1.8;x+=.095) items.push({p:[x,1.65,-.13],s:[.043,.015,.23],color:'#0d1820'});
  for(const x of [-1.65,-.85,.2,1.3]) items.push({p:[x,1.27,.95],s:[.035,.035,.02],color:'#b9c5c5'});
  return items;
 }, []);
 useFrame((_, dt) => {
  if(lever.current) lever.current.rotation.x = THREE.MathUtils.damp(lever.current.rotation.x, control.current==='power' ? -.35 : control.current==='coast' ? 0 : .35, 8, dt);
  if(doorLamp.current) doorLamp.current.color.set(simulation.current.doors || simulation.current.closing>0 ? '#ffb641' : '#8adf9b');
  if(tripLamp.current) tripLamp.current.color.set(simulation.current.atp ? '#ff8956' : '#284b3b');
 });
 return <group>
  <Box p={[0,4.35,.7]} s={[4.9,.48,1.5]} color="#b6bbb5"/>
  <Box p={[0,4.1,.14]} s={[4.15,.2,.14]} color="#141f27"/>
  <Box p={[0,4.18,1.48]} s={[4.2,.045,.06]} color="#714296"/>
  <Blocks items={details}/>
  <Box p={[0,1.32,.7]} s={[4.9,.5,1.8]} color="#29363c"/>
  <Box p={[0,1.58,.52]} s={[4.7,.13,1.55]} color="#58676a" r={[-.12,0,0]}/>
  <Box p={[0,1.48,1.27]} s={[4.65,.11,.14]} color="#7b4393"/>
  <Box p={[-2.22,1.16,1.4]} s={[.45,.9,1.4]} color="#262f34"/>
  <Box p={[2.22,1.16,1.4]} s={[.45,.9,1.4]} color="#262f34"/>
  <group position={[-1.65,1.75,.22]} rotation={[-.18,0,0]}>
   <Box p={[0,0,0]} s={[.7,.3,.12]} color="#18242a"/>
   {[-.2,0,.2].map((x,i)=><mesh key={x} position={[x,0,.07]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.045,.045,.025,16]}/><meshBasicMaterial ref={i===0?doorLamp:i===1?tripLamp:undefined} color={i===2?'#b7debc':'#e6a652'}/></mesh>)}
  </group>
  <group position={[1.75,1.72,.58]}>
   <Box p={[0,-.03,0]} s={[.38,.11,.62]} color="#101c23"/>
   <group ref={lever}><Box p={[0,.15,0]} s={[.045,.32,.045]} color="#a1aeb0"/><Box p={[0,.32,0]} s={[.3,.12,.16]} color="#101820"/></group>
  </group>
  <mesh position={[1.11,1.73,.68]}><cylinderGeometry args={[.075,.095,.08,20]}/><meshStandardMaterial color="#ca473e"/></mesh>
  {/* Parked wiper arms hug the glass, leaving the sightline down the track clear. */}
  <Box p={[.73,1.9,.13]} s={[1.4,.025,.035]} color="#172128" r={[0,0,.2]}/>
  <Box p={[1.61,2.09,.13]} s={[.65,.04,.035]} color="#172128" r={[0,0,.08]}/>
  <mesh position={[0,2.9,.05]}><planeGeometry args={[4.15,2.3]}/><meshPhysicalMaterial color="#adcbd1" transparent opacity={.035} roughness={.1} depthWrite={false}/></mesh>
 </group>;
});
