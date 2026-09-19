import { memo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
export type V3 = [number, number, number];
export type Block = { p: V3; s: V3; color: string; r?: V3 };
export function Box({ p, s, color, r = [0, 0, 0] }: Block) {
 return <mesh position={p} rotation={r}><boxGeometry args={s}/><meshStandardMaterial color={color} roughness={.72} metalness={.12}/></mesh>;
}
// Hundreds of sleepers, tactile tiles and facade details share one draw call.
export const Blocks = memo(function Blocks({ items, glow = false }: { items: Block[]; glow?: boolean }) {
 const ref = useRef<THREE.InstancedMesh>(null);
 useLayoutEffect(() => {
  const mesh = ref.current!; const dummy = new THREE.Object3D(); const color = new THREE.Color();
  items.forEach((item, i) => {
   dummy.position.set(...item.p); dummy.scale.set(...item.s); dummy.rotation.set(...(item.r ?? [0, 0, 0])); dummy.updateMatrix();
   mesh.setMatrixAt(i, dummy.matrix); mesh.setColorAt(i, color.set(item.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
 }, [items]);
 return <instancedMesh ref={ref} args={[undefined, undefined, items.length]}>
  <boxGeometry/>{glow ? <meshBasicMaterial toneMapped={false}/> : <meshStandardMaterial roughness={.78} metalness={.1}/>}
 </instancedMesh>;
});
