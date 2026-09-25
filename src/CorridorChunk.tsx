import { createContext, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { Block } from './geometry';
import type { CorridorSlice } from './corridor';
import { makeSurface, makeTunnel, type Plate } from './landmarks';
import { BOX_SLOTS, ENV_FINISHES } from './environment';
import { createMineralTexture, mineralMaterial } from './environment-materials';

export function createCorridorAssets() {
 const mineral = createMineralTexture();
 return {
  mineral,
  box: new THREE.BoxGeometry(), canopy: new THREE.IcosahedronGeometry(1, 1), round: new THREE.SphereGeometry(1, 16, 10),
  solid: mineralMaterial(ENV_FINISHES.solid, mineral),
  concrete: mineralMaterial(ENV_FINISHES.concrete, mineral),
  steel: new THREE.MeshStandardMaterial(ENV_FINISHES.steel),
  glass: new THREE.MeshStandardMaterial(ENV_FINISHES.glass),
  glow: new THREE.MeshBasicMaterial({ toneMapped: false }),
  foliage: new THREE.MeshStandardMaterial(ENV_FINISHES.foliage),
 };
}
type Assets = ReturnType<typeof createCorridorAssets>;
const AssetsContext = createContext<Assets | null>(null);
export function CorridorAssets({ children }: { children: ReactNode }) {
 const assets = useMemo(createCorridorAssets, []);
 useEffect(() => () => Object.values(assets).forEach(asset => asset.dispose()), [assets]);
 return <AssetsContext.Provider value={assets}>{children}</AssetsContext.Provider>;
}
const Instances = memo(function Instances({ items, geometry, material }: { items: Block[]; geometry: THREE.BufferGeometry; material: THREE.Material }) {
 const ref = useRef<THREE.InstancedMesh>(null);
 useLayoutEffect(() => {
  const mesh = ref.current!; const dummy = new THREE.Object3D(); const color = new THREE.Color();
  items.forEach((item, i) => {
   dummy.position.set(...item.p); dummy.rotation.set(...(item.r ?? [0, 0, 0])); dummy.scale.set(...item.s); dummy.updateMatrix();
   mesh.setMatrixAt(i, dummy.matrix); mesh.setColorAt(i, color.set(item.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  // Shared geometries/materials belong to CorridorAssets. Instance buffers
  // belong to this chunk and must be released when it leaves the window.
  return () => { mesh.dispose(); };
 }, [items]);
 return <instancedMesh ref={ref} args={[geometry, material, items.length]} dispose={null}/>;
});

function makePlates(plates: Plate[]) {
 const canvas = document.createElement('canvas');
 canvas.width = 1024; canvas.height = THREE.MathUtils.ceilPowerOfTwo(Math.max(1, plates.length) * 160);
 const ctx = canvas.getContext('2d')!;
 const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
 plates.forEach((plate, i) => {
  const row=i*160;
  ctx.fillStyle=plate.color;ctx.fillRect(0,row,1024,160);
  ctx.fillStyle='rgba(6,18,25,.24)';ctx.fillRect(0,row,1024,153);
  ctx.fillStyle='#d5b878';ctx.fillRect(0,row+153,1024,7);
  ctx.textAlign='center';ctx.fillStyle='#fff5df';
  let fontSize=70;
  do {ctx.font=`600 ${fontSize--}px Arial, sans-serif`;} while(ctx.measureText(plate.text).width>958&&fontSize>20);
  ctx.shadowColor='#10191e';ctx.shadowBlur=3;ctx.shadowOffsetY=2;
  ctx.fillText(plate.text,512,row+91);ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.font='24px Arial, sans-serif';ctx.fillStyle='#c9d7d1';ctx.fillText(plate.sub,512,row+132,955);
  const [x,y,z]=plate.p,w=plate.width,h=w*160/1024,v=vertices.length/3;
  vertices.push(x-w/2,y-h/2,z, x+w/2,y-h/2,z, x+w/2,y+h/2,z, x-w/2,y+h/2,z);
  const top=1-row/canvas.height,bottom=1-(row+160)/canvas.height;
  uvs.push(0,bottom,1,bottom,1,top,0,top);indices.push(v,v+1,v+2,v,v+2,v+3);
 });
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeBoundingSphere();
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=4;
 const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,toneMapped:false});
 return {geometry,texture,material};
}
const Plates = memo(function Plates({ items }: { items: Plate[] }) {
 const atlas=useMemo(()=>makePlates(items),[items]);
 useEffect(()=>()=>{atlas.geometry.dispose();atlas.texture.dispose();atlas.material.dispose();},[atlas]);
 return <mesh geometry={atlas.geometry} material={atlas.material} dispose={null}/>;
});
export const CorridorChunk = memo(function CorridorChunk({ slice }: { slice: CorridorSlice }) {
 const assets=useContext(AssetsContext)!;
 const kit=useMemo(()=>slice.tunnel?makeTunnel(slice):makeSurface(slice),[slice]);
 return <group name={`corridor:${slice.key}:${slice.tunnel?'tunnel':slice.hop.layout}`} position={[0,0,-slice.start]}>
  {BOX_SLOTS.map(slot=>kit[slot].length>0&&<Instances key={slot} items={kit[slot]} geometry={assets.box} material={assets[slot]}/>)}
  {kit.foliage.length>0&&<Instances items={kit.foliage} geometry={assets.canopy} material={assets.foliage}/>}
  {kit.round.length>0&&<Instances items={kit.round} geometry={assets.round} material={assets.solid}/>}
  {kit.plates.length>0&&<Plates items={kit.plates}/>}
 </group>;
},(a,b)=>a.slice.key===b.slice.key&&a.slice.start===b.slice.start&&a.slice.end===b.slice.end);
