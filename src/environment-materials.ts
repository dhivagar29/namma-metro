import * as THREE from 'three';
import { random } from './environment';

export const MINERAL_TEXTURE_SIZE = 128;

// 64 KiB before mipmaps, generated once for the entire corridor. Low-frequency
// pigment plus aggregate flecks, tiled seamlessly; no network or texture pack.
export function createMineralTexture() {
 const size = MINERAL_TEXTURE_SIZE, rng = random(0x51a9);
 const coarse = Array.from({ length: 64 }, () => rng());
 const pixels = new Uint8Array(size * size * 4);
 for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  const u = x * 8 / size, v = y * 8 / size, ix = Math.floor(u), iy = Math.floor(v);
  const a = u - ix, b = v - iy;
  const sample = (dx: number, dy: number) => coarse[((iy + dy) % 8) * 8 + (ix + dx) % 8];
  const cloud = (sample(0, 0) * (1 - a) + sample(1, 0) * a) * (1 - b) + (sample(0, 1) * (1 - a) + sample(1, 1) * a) * b;
  const fleck = rng(), pigment = fleck > .96 ? .59 + cloud * .17 : .82 + cloud * .13 + fleck * .05;
  const offset = (y * size + x) * 4, value = Math.round(pigment * 255);
  pixels.set([value, value, value, 255], offset);
 }
 const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
 texture.name = 'shared procedural mineral grain';
 texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
 texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps = true; texture.needsUpdate = true;
 return texture;
}

// Box UVs stretch over a whole 160 m slab. Project in instance-local metres
// instead: fine aggregate stays the same size on a sleeper, roof or tunnel wall
// and cannot swim when the world group moves past the stationary cab camera.
// One lookup on the dominant face, with ordinary mipmapping; no triplanar cost.
export function mineralMaterial(finish: THREE.MeshStandardMaterialParameters, texture: THREE.Texture) {
 const material = new THREE.MeshStandardMaterial({ ...finish, map: texture });
 material.onBeforeCompile = shader => {
  const varyings = '\nvarying vec3 vMineralPosition;\nvarying vec3 vMineralNormal;\n';
  shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>' + varyings)
   .replace('#include <begin_vertex>', `#include <begin_vertex>
    vec4 mineralPosition = vec4(position, 1.0);
    vec3 mineralNormal = normal;
    #ifdef USE_INSTANCING
     mineralPosition = instanceMatrix * mineralPosition;
     mat3 mineralBasis = mat3(instanceMatrix);
     mineralNormal /= vec3(dot(mineralBasis[0], mineralBasis[0]), dot(mineralBasis[1], mineralBasis[1]), dot(mineralBasis[2], mineralBasis[2]));
     mineralNormal = mineralBasis * mineralNormal;
    #endif
    vMineralPosition = mineralPosition.xyz;
    vMineralNormal = normalize(mineralNormal);`);
  shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>' + varyings)
   .replace('#include <map_fragment>', `
    vec3 mineralAxis = abs(vMineralNormal);
    vec2 mineralUv = mineralAxis.y > max(mineralAxis.x, mineralAxis.z) ? vMineralPosition.xz
     : (mineralAxis.x > mineralAxis.z ? vMineralPosition.zy : vMineralPosition.xy);
    diffuseColor.rgb *= texture2D(map, mineralUv * 0.5).rgb;`);
 };
 material.customProgramCacheKey = () => 'corridor-mineral-metres-v1';
 return material;
}
