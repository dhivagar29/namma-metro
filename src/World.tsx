import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { kannada, stations, stationPosition } from './routes';
import type { Control, Simulation } from './simulation';
import { Cab } from './Cab';
import { PassingMetro } from './PassingMetro';
import { Passengers } from './Passengers';
import { Blocks, Box, type Block, type V3 } from './geometry';
type Props = { simulation: MutableRefObject<Simulation>; control: MutableRefObject<Control>; paused: boolean };
const PURPLE = '#71358f';
const isUnderground = (distance: number) => distance >= stationPosition(19) - 480 && distance <= stationPosition(23) + 480;
const mod = (n: number, m: number) => ((n % m) + m) % m;
function Sign({ text, sub, p, width = 8, color = PURPLE }: { text: string; sub: string; p: V3; width?: number; color?: string }) {
 const texture = useMemo(() => {
  const canvas = document.createElement('canvas'); canvas.width = 1536; canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  const paint = () => {
   ctx.fillStyle = color; ctx.fillRect(0, 0, 1536, 320);
   ctx.fillStyle = '#e9e0c9'; ctx.fillRect(0, 304, 1536, 16);
   ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
   let size = 74;
   do { ctx.font = `600 ${size--}px Arial, "Noto Sans Kannada", "Nirmala UI", sans-serif`; } while (ctx.measureText(text).width > 1440 && size > 20);
   ctx.fillText(text, 768, 144);
   ctx.font = '48px "Noto Sans Kannada", "Nirmala UI", Tunga, sans-serif'; ctx.fillText(sub, 768, 248, 1440);
  };
  paint();
  const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace; result.anisotropy = 4;
  result.userData.repaint = paint;
  return result;
 }, [text, sub, color]);
 useEffect(() => {
  let disposed=false;
  const repaint=()=>{if(!disposed){texture.userData.repaint();texture.needsUpdate=true;}};
  document.fonts.addEventListener('loadingdone',repaint);
  void document.fonts.load('48px "Noto Sans Kannada"').then(repaint).catch(()=>{});
  return()=>{disposed=true;document.fonts.removeEventListener('loadingdone',repaint);texture.dispose();};
 }, [texture]);
 return <mesh position={p}><planeGeometry args={[width, width * 320 / 1536]}/><meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false}/></mesh>;
}
const Station = memo(function Station({ index, simulation }: { index: number; simulation: MutableRefObject<Simulation> }) {
 const underground = index >= 19 && index <= 23;
 const kit = useMemo(() => {
  const blocks: Block[] = [];
  const add = (p:V3,s:V3,color:string,r?:V3)=>blocks.push({p,s,color,r});
  for(const side of [-1,1]) {
   const center = side===1 ? 5 : -9.2, edge=side===1 ? 2.12 : -6.32;
   add([center,.4,38],[5.9,.9,152],'#9ca5a5');
   add([edge,.88,38],[.25,.06,152],'#f6cf58');
   add([center,.88,38],[4.9,.035,152],'#c9c5b6');
   add([center+side*2.4,3.2,38],[.15,4.7,152],underground?'#8b999f':'#657d7b');
   add([center+side*2.3,2,38],[.08,.4,152],PURPLE);
   add([center,5.8,38],[6.6,.22,158],underground?'#52616e':'#bdc5c1');
   add([center,5.53,-40],[6.6,.4,.4],PURPLE);
   for(let z=-35;z<=112;z+=14) {
    add([center+side*.8,3.25,z],[.42,5,.5],'#aeb6b3');
    add([center+side*.8,1.65,z],[.46,.8,.54],PURPLE);
    add([center,5.5,z],[6.5,.23,.24],'#6c7d80');
    add([center,5.64,z+3],[.18,.04,7],'#f9eed2');
    add([center+side,1.33,z+5],[1.7,.13,.5],'#596a73');
    add([center+side,1.62,z+5.22],[1.7,.55,.08],'#596a73');
   }
   for(let z=-37;z<114;z+=1.4) add([edge+side*.26,.9,z],[.19,.04,.65],'#e7c574');
   for(let z=-35;z<110;z+=3.5) add([center,.904,z],[5.65,.01,.025],'#a9aaa3');
  }
  add([-2.1,6.3,-37],[19.7,.4,.55],'#8a9898');
  add([0,.16,0],[1.7,.04,.38],'#f5d35f');
  add([1.73,1.3,-1],[.055,2.6,.055],'#c4ceca');
  add([1.75,2.2,-1],[.7,.85,.13],'#242f34');
  return blocks;
 }, [underground]);
 return <group position={[0,0,-stationPosition(index)]}>
  <Blocks items={kit}/>
  {[-28,14,64,108].map(z=><group key={z}>
   <Sign text={stations[index]} sub={kannada[index]} p={[5,4.25,z]} width={6.1}/>
   <Sign text={stations[index]} sub={kannada[index]} p={[-9.2,4.25,z]} width={6.1}/>
  </group>)}
  <Sign text={index===22 ? 'MAJESTIC  ↔  GREEN LINE' : 'NAMMA METRO · ನಮ್ಮ ಮೆಟ್ರೋ'} sub={index===22 ? 'ಹಸಿರು ಮಾರ್ಗ  /  INTERCHANGE' : 'PURPLE LINE  /  ಚಲ್ಲಘಟ್ಟ →'} p={[-2.1,6.38,-36.6]} width={16}/>
  <Sign text="S" sub="6 CAR" p={[1.75,2.2,-.92]} width={.64} color="#283a40"/>
  <Sign text="EXIT →" sub="ನಿರ್ಗಮನ" p={[6.1,2.8,-20]} width={1.3} color="#24674c"/>
  <Passengers index={index} simulation={simulation}/>
 </group>;
});
const Tunnel = memo(function Tunnel({ stationBox }: { stationBox:boolean }) {
 const blocks = useMemo(()=>{
  const list:Block[]=[];
  if(stationBox) {
   list.push({p:[-2.1,8.6,0],s:[24,.6,80],color:'#333c48'});
   for(const x of [-14,10]) list.push({p:[x,4,0],s:[.5,9,80],color:'#354451'});
  } else {
   // Faceted concrete tube, with radial segment joints and cable troughs.
   for(let j=0;j<18;j++) {
    const a=j/18*Math.PI*2, x=-2.1+6.5*Math.cos(a), y=2+6.5*Math.sin(a);
    list.push({p:[x,y,0],s:[.3,2.35,80],r:[0,0,a],color:j%2?'#3d4952':'#424e58'});
    for(let z=-40;z<40;z+=8) list.push({p:[x*.99,y,z],s:[.38,2.4,.12],r:[0,0,a],color:'#5b676e'});
   }
   for(const x of [-7.9,3.8]) {
    list.push({p:[x,1.5,0],s:[.22,.45,80],color:'#28383f'});
    list.push({p:[x,2.65,0],s:[.09,.05,80],color:'#d5aa65'});
   }
  }
  return list;
 },[stationBox]);
 return <><Blocks items={blocks}/>{[-32,0,32].map(z=><group key={z}>
  <Box p={[stationBox?8.8:3.5,4,z]} s={[.07,.16,3]} color="#d5e9df"/>
  <mesh position={[stationBox?-12:-7.8,3.5,z]}><boxGeometry args={[.07,.16,2]}/><meshBasicMaterial color="#c1e4e6"/></mesh>
 </group>)}</>;
});
const CityChunk = memo(function CityChunk({ n, simulation }: { n:number; simulation:MutableRefObject<Simulation> }) {
 const traffic=useRef<THREE.Group>(null);
 const under=isUnderground(n*80);
 const stationBox=stations.some((_,index)=>Math.abs(n*80-stationPosition(index))<170);
 const gradeLift = Math.max(0,1-Math.abs(n*80-stationPosition(13))/600)*8.5;
 const infrastructure=useMemo(()=>{
  const list:Block[]=[{p:[3.55,3,-20],s:[.2,6,.22],color:'#667677'},{p:[1.5,5.75,-20],s:[4.2,.13,.15],color:'#4e616a'}];
  if(gradeLift<7) for(const z of [-20,20]) {
   list.push({p:[-2.1,-5.4+gradeLift/2,z],s:[1.7,8.4-gradeLift,2.2],color:'#a6aaa2'});
   list.push({p:[-2.1,-1.4,z],s:[8.5,1,2.7],color:'#b3b6ae'});
  }
  return list;
 },[gradeLift]);
 const blocks=useMemo(()=>{
  const list:Block[]=[]; const add=(p:V3,s:V3,color:string,r?:V3)=>list.push({p,s,color,r});
  if(under) return list;
  add([0,-10,0],[220,.4,80],'#555f53');
  add([14,-9.72,0],[16,.09,80],'#424d52');
  add([-18,-9.72,0],[10,.09,80],'#465153');
  for(let z=-36;z<40;z+=12) {add([14,-9.65,z],[.2,.02,5],'#d8d0b6');add([6,-9.5,z],[.35,.25,5],'#ddd6bd');}
  for(const side of [-1,1]) for(let b=0;b<3;b++) {
   const seed=mod(n*17+b*13+side,19), height=9+seed*1.15, x=side*(23+seed*.65), z=b*27-28;
   add([x,height/2-9.5,z],[10,height,18],['#afb5ac','#b4a69b','#8b9c9d','#bcb39e'][seed%4]);
   add([x,height-9.3,z],[10.7,.4,18.7],'#626d70');
   add([x+2,height-8.6,z+3],[2,1.4,2],'#bac0b2');
   for(let y=-6;y<height-10;y+=3) for(let col=-3;col<=3;col+=2) {
    add([x+col,y,z+9.04],[1.1,1.4,.04],mod(seed+col+Math.floor(y),4)===0?'#d6b270':'#526b74');
   }
   add([x,-6.9,z+9.06],[9,1,.08],seed%2?PURPLE:'#407565');
  }
  for(const side of [-1,1]) for(let z=-32;z<40;z+=24) add([side*10,-5.7,z],[.45,7,.45],'#726452');
  return list;
 },[n,under]);
 useFrame(()=> {if(traffic.current) traffic.current.position.z=mod(simulation.current.elapsed*5+n*7,54)-27;});
 return <group position={[0,0,-n*80]}>{under?<Tunnel stationBox={stationBox}/>:<>
  <Blocks items={infrastructure}/>
  <group position={[0,gradeLift,0]}><Blocks items={blocks}/>
   {[-1,1].flatMap(side=>[-32,-8,16].map(z=><group key={`${side}-${z}`} position={[side*10,-1.6,z]}>
    <mesh scale={[1.25,.72,1]}><icosahedronGeometry args={[3.6,1]}/><meshStandardMaterial color={z===-8?'#4d7060':'#405f51'} roughness={1}/></mesh>
   </group>))}
   <group ref={traffic}>{[0,1,2].map(i=><group key={i} position={[i===1?18:10,-8.9,i*19-19]}>
    <Box p={[0,0,0]} s={[1.7,1.2,i===1?5:2.5]} color={i===0?'#dab848':i===1?'#7199ac':'#cad0c7'}/>
    <Box p={[0,.72,0]} s={[1.6,.38,1.9]} color={i===0?'#366747':'#263e49'}/>
    <Box p={[0,.1,-1.27]} s={[1.3,.18,.04]} color="#faeac2"/>
   </group>)}</group>
   {mod(n,3)===0&&<Sign text={mod(n,2)===0?'ಬೆಂಗಳೂರು  BENGALURU':'DARSHINI · FILTER COFFEE'} sub={mod(n,2)===0?'ನಮ್ಮ ಊರು · OUR CITY':'ದರ್ಶಿನಿ  •  ಕಾಫಿ  •  ತಿಂಡಿ'} p={[-22,3.5,12]} width={12} color={mod(n,2)===0?'#315b53':'#894d47'}/>}
  </group>
 </>}</group>;
});
const Track = memo(function Track({ simulation }: { simulation:MutableRefObject<Simulation> }) {
 const moving=useRef<THREE.Group>(null);
 const sleepers=useMemo(()=>{
  const list:Block[]=[];
  for(let z=25;z>-565;z-=.8) for(const center of [0,-4.2]) list.push({p:[center,.005,z],s:[2.2,.14,.22],color:'#7c817c'});
  return list;
 },[]);
 useFrame(()=>{if(moving.current) moving.current.position.z=simulation.current.position%.8;});
 return <>
  <Box p={[-2.1,-.65,-240]} s={[10.4,.8,650]} color="#8c938f"/>
  <Box p={[-2.1,-.17,-240]} s={[9.6,.2,650]} color="#515d60"/>
  {[-6.9,2.8].map(x=><Box key={x} p={[x,.32,-240]} s={[.27,.85,650]} color="#b1b4a6"/>)}
  {[0,-4.2].flatMap(center=>[-.7175,.7175].map(x=><group key={center+x}>
   <Box p={[center+x,.12,-240]} s={[.075,.17,650]} color="#555f63"/>
   <mesh position={[center+x,.21,-240]}><boxGeometry args={[.075,.035,650]}/><meshStandardMaterial color="#d7dbd5" metalness={.85} roughness={.28}/></mesh>
  </group>))}
  <group ref={moving}><Blocks items={sleepers}/></group>
  <Box p={[0,5.7,-240]} s={[.013,.013,650]} color="#405661"/>
  <Box p={[-4.2,5.7,-240]} s={[.013,.013,650]} color="#405661"/>
 </>;
});
function Scenery({ simulation, control, paused }: Props) {
 const moving=useRef<THREE.Group>(null); const [chunk,setChunk]=useState(0);
 const {camera,gl,scene}=useThree(); const look=useRef({x:0,y:0,dragging:false});
 const dusk=useMemo(()=>new THREE.Color('#c3a3a0'),[]), dark=useMemo(()=>new THREE.Color('#182a39'),[]);
 useEffect(()=>{
  const canvas=gl.domElement;
  const down=(e:PointerEvent)=>{look.current.dragging=true;canvas.setPointerCapture(e.pointerId);};
  const up=()=>{look.current.dragging=false;};
  const move=(e:PointerEvent)=>{if(look.current.dragging&&!paused){look.current.x=THREE.MathUtils.clamp(look.current.x-e.movementX*.001,-.19,.19);look.current.y=THREE.MathUtils.clamp(look.current.y-e.movementY*.001,-.09,.08);}};
  const center=()=>{look.current.x=0;look.current.y=0;};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointermove',move);canvas.addEventListener('lostpointercapture',up);canvas.addEventListener('dblclick',center);
  return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('lostpointercapture',up);canvas.removeEventListener('dblclick',center);};
 },[gl,paused]);
 useFrame((_,dt)=>{
  const s=simulation.current;
  if(moving.current) moving.current.position.z=s.position;
  const nextChunk=Math.floor(s.position/80);if(nextChunk!==chunk)setChunk(nextChunk);
  camera.rotation.order='YXZ';camera.rotation.y=THREE.MathUtils.damp(camera.rotation.y,look.current.x,8,dt);
  camera.rotation.x=THREE.MathUtils.damp(camera.rotation.x,-.035+look.current.y,8,dt);
  camera.position.y=2.8+(paused?0:Math.sin(s.position*.2)*Math.min(.009,s.speed*.0004));
  const under=isUnderground(s.position);(scene.background as THREE.Color).lerp(under?dark:dusk,Math.min(1,dt*2));
  if(scene.fog instanceof THREE.Fog){scene.fog.color.copy(scene.background as THREE.Color);scene.fog.far=under?175:490;scene.fog.near=under?45:95;}
 });
 const under=isUnderground(chunk*80);
 const nearby=stations.map((_,i)=>i).filter(i=>Math.abs(stationPosition(i)-chunk*80)<660);
 return <>
  <color attach="background" args={['#c3a3a0']}/><fog attach="fog" args={['#c3a3a0',95,490]}/>
  <ambientLight intensity={under?.75:1.15} color={under?'#97bbd4':'#f6e2d5'}/>
  <hemisphereLight args={[under?'#91b6ca':'#edc5ac','#3e4c5d',1.35]}/>
  <directionalLight position={[-25,40,-120]} intensity={under?.25:2.3} color="#ffc78e"/>
  {!under&&<mesh position={[-145,78,-470]}><sphereGeometry args={[18,24,16]}/><meshBasicMaterial color="#ffd6a0" fog={false}/></mesh>}
  <Track simulation={simulation}/>
  <PassingMetro simulation={simulation}/>
  <group ref={moving}>{Array.from({length:9},(_,i)=><CityChunk key={chunk+i-2} n={chunk+i-2} simulation={simulation}/>)}{nearby.map(index=><Station key={index} index={index} simulation={simulation}/>)}</group>
  <Cab simulation={simulation} control={control}/>
 </>;
}
export default memo(function World(props: Props) {
 return <Canvas camera={{fov:66,near:.08,far:650,position:[0,2.8,3]}} dpr={[1,1.5]} gl={{antialias:true,powerPreference:'high-performance'}}><Scenery {...props}/></Canvas>;
});
