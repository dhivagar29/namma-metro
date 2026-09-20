import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { kannada, stations, stationPosition } from './routes';
import type { Control, Simulation } from './simulation';
import { Cab } from './Cab';
import { PassingMetro } from './PassingMetro';
import { Passengers } from './Passengers';
import { Blocks, Box, type Block, type V3 } from './geometry';
import { CHUNK_M, isEnclosed, nearbySlices } from './corridor';
import { CorridorAssets, CorridorChunk } from './CorridorChunk';
import { Billboard } from './Billboard';
import { nearbyBillboards, soldBoardSource } from './billboards';
type Props = { simulation: MutableRefObject<Simulation>; control: MutableRefObject<Control>; paused: boolean };
const PURPLE = '#71358f';
function Sign({ text, sub, p, width = 8, color = PURPLE, mark }: { text: string; sub: string; p: V3; width?: number; color?: string; mark?: 'kanaka' }) {
 const texture = useMemo(() => {
  const canvas = document.createElement('canvas'); canvas.width = 1536; canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  const paint = () => {
   ctx.fillStyle = color; ctx.fillRect(0, 0, 1536, 320);
   ctx.fillStyle = '#e9e0c9'; ctx.fillRect(0, 304, 1536, 16);
   // Fictional Kanaka Filters mark — geometric only, not a real trademark.
   if (mark === 'kanaka') {
    ctx.fillStyle = '#1f2d33'; ctx.beginPath(); ctx.moveTo(118, 70); ctx.lineTo(198, 70); ctx.lineTo(158, 138); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f0c96a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(158, 168, 36, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f0c96a'; ctx.beginPath(); ctx.arc(158, 168, 14, 0, Math.PI * 2); ctx.fill();
   }
   ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
   const textX = mark === 'kanaka' ? 860 : 768;
   let size = 74;
   do { ctx.font = `600 ${size--}px Arial, "Noto Sans Kannada", "Nirmala UI", sans-serif`; } while (ctx.measureText(text).width > (mark === 'kanaka' ? 1180 : 1440) && size > 20);
   ctx.fillText(text, textX, 144);
   ctx.font = '48px "Noto Sans Kannada", "Nirmala UI", Tunga, sans-serif'; ctx.fillText(sub, textX, 248, mark === 'kanaka' ? 1180 : 1440);
  };
  paint();
  const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace; result.anisotropy = 4;
  result.userData.repaint = paint;
  return result;
 }, [text, sub, color, mark]);
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
  <Sign text={index===22 ? 'MAJESTIC  ↔  GREEN LINE' : index>=1 ? 'KANAKA FILTERS' : 'NAMMA METRO · ನಮ್ಮ ಮೆಟ್ರೋ'} sub={index===22 ? 'ಹಸಿರು ಮಾರ್ಗ  /  INTERCHANGE' : index>=1 ? 'FICTIONAL DEMO · NOT A REAL BRAND' : 'PURPLE LINE  /  ಚಲ್ಲಘಟ್ಟ →'} p={[-2.1,6.38,-36.6]} width={16} mark={index>=1 && index!==22 ? 'kanaka' : undefined} color={index>=1 && index!==22 ? '#6b3d7a' : PURPLE}/>
  <Sign text="S" sub="6 CAR" p={[1.75,2.2,-.92]} width={.64} color="#283a40"/>
  <Sign text="EXIT →" sub="ನಿರ್ಗಮನ" p={[6.1,2.8,-20]} width={1.3} color="#24674c"/>
  <Passengers index={index} simulation={simulation}/>
 </group>;
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
 const dusk=useMemo(()=>new THREE.Color('#bda49d'),[]), dark=useMemo(()=>new THREE.Color('#101f2a'),[]);
 const ambient=useRef<THREE.AmbientLight>(null), sky=useRef<THREE.HemisphereLight>(null), sunLight=useRef<THREE.DirectionalLight>(null), sun=useRef<THREE.Mesh>(null), fluorescent=useRef<THREE.PointLight>(null);
 const warm=useMemo(()=>new THREE.Color('#f6d7b7'),[]), cool=useMemo(()=>new THREE.Color('#99c6de'),[]);
 const slices=useMemo(()=>nearbySlices(chunk*CHUNK_M),[chunk]);
 const billboards=useMemo(()=>nearbyBillboards(chunk*CHUNK_M),[chunk]);
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
  const nextChunk=Math.floor(s.position/CHUNK_M);if(nextChunk!==chunk)setChunk(nextChunk);
  camera.rotation.order='YXZ';camera.rotation.y=THREE.MathUtils.damp(camera.rotation.y,look.current.x,8,dt);
  camera.rotation.x=THREE.MathUtils.damp(camera.rotation.x,-.035+look.current.y,8,dt);
  camera.position.y=2.8+(paused?0:Math.sin(s.position*.2)*Math.min(.009,s.speed*.0004));
  const under=isEnclosed(s.position);(scene.background as THREE.Color).lerp(under?dark:dusk,Math.min(1,dt*2));
  if(scene.fog instanceof THREE.Fog){scene.fog.color.copy(scene.background as THREE.Color);scene.fog.far=under?160:640;scene.fog.near=under?25:140;}
  const blend=Math.min(1,dt*4);
  if(ambient.current){ambient.current.color.lerp(under?cool:warm,blend);ambient.current.intensity=THREE.MathUtils.damp(ambient.current.intensity,under?.85:.95,4,dt);}
  if(sky.current)sky.current.color.lerp(under?cool:warm,blend);
  if(sunLight.current)sunLight.current.intensity=THREE.MathUtils.damp(sunLight.current.intensity,under?.1:2.15,4,dt);
  if(sun.current)sun.current.visible=!under;
  if(fluorescent.current)fluorescent.current.intensity=under?18:0;
 });
 const nearby=stations.map((_,i)=>i).filter(i=>Math.abs(stationPosition(i)-chunk*CHUNK_M)<850);
 return <>
  <color attach="background" args={['#bda49d']}/><fog attach="fog" args={['#bda49d',140,640]}/>
  <ambientLight ref={ambient} intensity={.95} color="#f6d7b7"/>
  <hemisphereLight ref={sky} args={['#f6d7b7','#354b61',1.2]}/>
  <directionalLight ref={sunLight} position={[-25,40,-120]} intensity={2.15} color="#ffc78e"/>
  <pointLight ref={fluorescent} position={[0,4,-16]} color="#acd9ed" intensity={0} distance={55} decay={1.2}/>
  <mesh ref={sun} position={[-145,78,-600]}><sphereGeometry args={[18,24,16]}/><meshBasicMaterial color="#ffd6a0" fog={false}/></mesh>
  <Track simulation={simulation}/>
  <PassingMetro simulation={simulation}/>
  <group ref={moving}><CorridorAssets>{slices.map(slice=><CorridorChunk key={slice.key} slice={slice}/>)}</CorridorAssets>{billboards.map(board=><Billboard key={board.hopIndex} board={board} paused={paused} source={soldBoardSource(board.hopIndex)}/>)}{nearby.map(index=><Station key={index} index={index} simulation={simulation}/>)}</group>
  <Cab simulation={simulation} control={control}/>
 </>;
}
export default memo(function World(props: Props) {
 return <Canvas camera={{fov:66,near:.08,far:850,position:[0,2.8,3]}} dpr={[1,1.5]} gl={{antialias:true,powerPreference:'high-performance'}}><Scenery {...props}/></Canvas>;
});
