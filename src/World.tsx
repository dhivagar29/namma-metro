import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { routes, type Line } from './routes';
export type SceneState = { line: Line; index: number; progress: number; speed: number; traveling: boolean; platform: boolean; paused: boolean; doors: boolean };
function Box({ p, s, color, metal = false }: { p: [number,number,number]; s: [number,number,number]; color: string; metal?: boolean }) { return <mesh position={p}><boxGeometry args={s}/><meshStandardMaterial color={color} roughness={metal ? .3 : .8} metalness={metal ? .65 : .05}/></mesh>; }
function Sign({ text, sub = '', p, width = 3.2, color = '#5b326f', rotation = 0 }: {text:string;sub?:string;p:[number,number,number];width?:number;color?:string;rotation?:number}) {
 const texture = useMemo(() => { const c = document.createElement('canvas'); c.width=1536;c.height=256;const x=c.getContext('2d')!;x.fillStyle=color;x.fillRect(0,0,c.width,c.height);x.fillStyle='#ffffff';x.textAlign='center';x.font=`bold ${text.length>32?43:64}px sans-serif`;x.fillText(text,768,108);x.font='35px sans-serif';x.fillText(sub,768,183);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t; },[text,sub,color]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <mesh position={p} rotation={[0,rotation,0]}><planeGeometry args={[width,width/6]}/><meshBasicMaterial map={texture} side={THREE.DoubleSide}/></mesh>;
}
function Pole({x,z}:{x:number;z:number}) {return <mesh position={[x,1.65,z]}><cylinderGeometry args={[.035,.035,3.1,12]}/><meshStandardMaterial color="#c2c9c7" metalness={.9} roughness={.22}/></mesh>}
function Coach({state}:{state:SceneState}) {
 const door=useRef<THREE.Group>(null); const r=routes[state.line];
 useFrame((_,dt)=>{if(door.current) door.current.position.z=THREE.MathUtils.damp(door.current.position.z,state.doors?1.6:0,4,dt)});
 return <group>
 <Box p={[0,-.13,0]} s={[3.7,.25,19]} color="#67767a"/><Box p={[0,3.3,0]} s={[3.7,.18,19]} color="#e2e3d8"/>
 {[-1,1].map(side=><group key={side}>
 <Box p={[side*1.85,.42,0]} s={[.12,.85,19]} color="#bcc7c7"/><Box p={[side*1.85,2.9,0]} s={[.14,.7,19]} color="#d4dbd5"/>
 {[-7,-3.7,3.7,7].map(z=><group key={z}>
 <Box p={[side*1.85,1.7,z]} s={[.12,1.8,.15]} color="#d8ded9"/>
 <Box p={[side*1.85,2.52,z+1.55]} s={[.16,.1,2.9]} color="#637d80"/>
 <Box p={[side*1.85,.97,z+1.55]} s={[.16,.1,2.9]} color="#637d80"/>
 </group>)}
 {[-6,-3.4,3.4,6].map(z=><group key={z}><Box p={[side*1.48,.51,z]} s={[.62,.18,2.2]} color={state.line==='purple'?'#7975a1':'#568b7c'}/><Box p={[side*1.73,.89,z]} s={[.16,.72,2.2]} color={state.line==='purple'?'#9290b2':'#71a38e'}/><Box p={[side*1.45,.22,z]} s={[.12,.48,1.7]} color="#8c9898" metal/></group>)}
 <Box p={[side*1.85,1.5,-1.18]} s={[.13,2.95,.12]} color="#d3d9d5"/><Box p={[side*1.85,1.5,1.18]} s={[.13,2.95,.12]} color="#d3d9d5"/>
 </group>)}
 <group ref={door}><Box p={[1.84,1.45,0]} s={[.08,2.8,2.2]} color="#aabbbd"/><Sign text="← DOORS →" sub="Mind the gap" p={[1.79,1.9,0]} width={1.6} rotation={-Math.PI/2} color="#263a43"/></group>
 <Box p={[-1.84,1.45,0]} s={[.08,2.8,2.2]} color="#9bacad"/>
 {[-6,-2,2,6].map(z=><group key={z}><Pole x={.72} z={z}/><Pole x={-.72} z={z}/>{[-1,1].map(x=><mesh key={x} position={[x*.72,2.63,z+.65]}><torusGeometry args={[.115,.025,8,16]}/><meshStandardMaterial color="#dcce98"/></mesh>)}</group>)}
 {[-1,1].map(x=><Box key={x} p={[x*.9,3.17,0]} s={[.12,.03,18]} color="#fff2c8"/>)}
 <Box p={[0,1.6,-9.4]} s={[3.7,3.2,.15]} color="#c8d0ce"/><Box p={[0,1.4,-9.28]} s={[1,2.5,.08]} color="#697f82"/>
 <Sign text="NAMMA METRO" sub={r.name+' • '+r.terminals} p={[0,2.65,-9.18]} width={3.2} color={r.color}/>
 <Sign text={r.stations.join('  •  ')} sub="● ━━━ ● ━━━ ● ━━━ ●    ನಮ್ಮ ಮೆಟ್ರೋ" p={[0,2.94,-5.3]} width={3.3} color={state.line==='purple'?'#644482':'#316c58'}/>
 </group>
}
function Environment({state}:{state:SceneState}) {
 const r=routes[state.line];const underground=state.traveling ? (state.progress>.55?r.underground[state.index+1]:r.underground[state.index]) : r.underground[state.index];
 const scenery=useRef<THREE.Group>(null);
 useFrame((_,dt)=>{if(scenery.current)scenery.current.position.z=(scenery.current.position.z+dt*state.speed*21)%16;});
 return <>
 <color attach="background" args={[underground?'#18272e':'#d6b597']}/><fog attach="fog" args={[underground?'#18272e':'#d6b597',18,100]}/>
 <ambientLight intensity={underground?.9:1.3} color={underground?'#a8d2dc':'#ffe2b6'}/><directionalLight position={[-8,12,-15]} intensity={underground?.3:2.5} color="#ffd29f"/>
 <pointLight position={[0,2.8,-3]} intensity={22} distance={16} color={underground?'#d2f6ff':'#fff0cf'}/>
 <Box p={[0,-1,0]} s={[8,1,240]} color="#505e60"/>
 <group ref={scenery}>
 {Array.from({length:20},(_,i)=>{const z=(i-12)*16;return underground?<group key={i}><Box p={[-3,2,z]} s={[.4,7,15.9]} color="#334346"/><Box p={[6,2,z]} s={[.4,7,15.9]} color="#334346"/><Box p={[1.5,5.3,z]} s={[10,.4,16]} color="#2f3b40"/><Box p={[-2.72,2.7,z]} s={[.07,.12,3]} color="#b0e3e4"/></group>:<group key={i}>{[-1,1].map(side=><group key={side}><Box p={[side*(12+i%3*5),1+(i%4),z]} s={[5,7+i%4*3,7]} color={['#ba9f8c','#758e8c','#afa9a2','#c3b19b'][i%4]}/>{[0,1,2].map(j=><Box key={j} p={[side*(9.4+i%3*5),j*2+1,z]} s={[.06,.7,4.8]} color="#e8ce99"/>)}<mesh position={[side*8,-1,z+5]}><cylinderGeometry args={[.15,.25,5,6]}/><meshStandardMaterial color="#756e54"/></mesh><mesh position={[side*8,2,z+5]}><icosahedronGeometry args={[2.1,1]}/><meshStandardMaterial color="#657e66"/></mesh></group>)}</group>})}
 </group>
 {(!state.traveling || state.progress<.1 || state.progress>.9)&&<group position={[0,0,state.traveling?(state.progress<.5?state.progress*600:(state.progress-1)*600):0]}>
 <Box p={[4.8,-.13,0]} s={[5.8,.24,48]} color="#a7ada9"/><Box p={[2.13,.006,0]} s={[.28,.022,48]} color="#e2bc4e"/>
 {Array.from({length:24},(_,i)=><Box key={i} p={[5,.003,i*2-24]} s={[5.6,.008,.023]} color="#788783"/>)}
 {[-18,-9,0,9,18].map(z=><group key={z}><Box p={[6.4,1.9,z]} s={[.65,3.9,.65]} color="#c5c9ba"/><Box p={[6.39,1.55,z]} s={[.67,.3,.67]} color={r.color}/><Sign text={r.stations[state.traveling&&state.progress>.5?state.index+1:state.index]} sub={r.kannada[state.traveling&&state.progress>.5?state.index+1:state.index]} p={[5.9,2.6,z]} width={4.5} rotation={-Math.PI/2} color={state.line==='purple'?'#63427e':'#286249'}/></group>)}
 <Box p={[4.9,4,0]} s={[6,.16,48]} color="#c1c5ba"/>
 {[-16,-8,0,8,16].map(z=><Box key={z} p={[4.3,3.87,z]} s={[.18,.04,3.8]} color="#eaffef"/>)}
 <Sign text="EXIT ↗" sub={state.line==='green'&&state.index===0?'Purple Line ↔ Green Line':'ನಿರ್ಗಮನ • Way out'} p={[5.1,2.9,-13]} width={3}/>
 {Array.from({length:12},(_,i)=><Box key={i} p={[5.5,i*.13, -17-i*.28]} s={[1.5,.15,.3]} color="#536865"/>)}
 </group>}
 </>
}
function CameraRig({state,onLock,onUnlock}:{state:SceneState;onLock:()=>void;onUnlock:()=>void}) {
 const {camera}=useThree(); const keys=useRef(new Set<string>());
 useEffect(()=>{camera.position.set(state.platform?3.2:0,1.65,state.platform?0:5.8);camera.rotation.set(0,state.platform?-Math.PI/2:0,0)},[state.platform,state.line,camera]);
 useEffect(()=>{const down=(e:KeyboardEvent)=>keys.current.add(e.code),up=(e:KeyboardEvent)=>keys.current.delete(e.code),clear=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear)}},[]);
 useFrame((_,dt)=>{if(!state.platform||state.paused||!document.pointerLockElement)return;const direction=new THREE.Vector3();camera.getWorldDirection(direction);direction.y=0;direction.normalize();const right=new THREE.Vector3().crossVectors(direction,new THREE.Vector3(0,1,0));const move=new THREE.Vector3();if(keys.current.has('KeyW'))move.add(direction);if(keys.current.has('KeyS'))move.sub(direction);if(keys.current.has('KeyD'))move.add(right);if(keys.current.has('KeyA'))move.sub(right);camera.position.addScaledVector(move.normalize(),Math.min(dt,.05)*2.6);camera.position.x=THREE.MathUtils.clamp(camera.position.x,2.5,5.6);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-14,14)});
 return <PointerLockControls selector="#look-button" onLock={onLock} onUnlock={onUnlock}/>;
}
export default function World({state,onLock,onUnlock}:{state:SceneState;onLock:()=>void;onUnlock:()=>void}) {return <Canvas camera={{fov:68,near:.05,far:180,position:[0,1.65,5.8]}} dpr={[1,1.5]} gl={{antialias:true}}><Environment state={state}/><Coach state={state}/><CameraRig state={state} onLock={onLock} onUnlock={onUnlock}/></Canvas>}
