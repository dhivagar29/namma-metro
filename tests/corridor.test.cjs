const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const THREE = require('three');
const bible = require('../refs/notes/corridor-bible.json');
const cache = new Map();
function load(name) {
 if (cache.has(name)) return cache.get(name);
 const source = ts.transpileModule(fs.readFileSync(`src/${name}.ts`, 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
 } }).outputText;
 const module = { exports: {} };
 new Function('exports', 'module', 'require', source)(module.exports, module, id =>
  id.endsWith('.json') ? bible : id.startsWith('./') ? load(id.slice(2)) : require(id));
 cache.set(name, module.exports);return module.exports;
}
const { stations, interStationM, stationPosition, totalLengthM } = load('routes');
const { corridor, hopAt, nearbySlices, groundHeight, isUnderground, isEnclosed, tunnelSections, tunnelExitM, CHUNK_M } = load('corridor');
const { LANDMARKS, landmarkPlacements, makeSurface, makeTunnel } = load('landmarks');
const sliceFor = hop => ({ key:`test:${hop.i}`,hop,start:hop.start,end:hop.end,tunnel:hop.layout==='underground' });
function meshesFor(kit, start) {
 const geometries={solid:new THREE.BoxGeometry(),concrete:new THREE.BoxGeometry(),steel:new THREE.BoxGeometry(),foliage:new THREE.IcosahedronGeometry(1,1),round:new THREE.SphereGeometry(1,16,10)};
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 const meshes=Object.entries(geometries).filter(([key])=>kit[key].length).map(([key,geometry])=>{
  const items=kit[key],mesh=new THREE.InstancedMesh(geometry,material,items.length),obj=new THREE.Object3D();
  items.forEach((item,i)=>{obj.position.set(...item.p);obj.rotation.set(...(item.r??[0,0,0]));obj.scale.set(...item.s);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);});
  mesh.position.z=-start;mesh.computeBoundingSphere();mesh.updateMatrixWorld();return mesh;
 });
 return {meshes,dispose:()=>{Object.values(geometries).forEach(g=>g.dispose());material.dispose();meshes.forEach(m=>m.dispose());}};
}

test('all 36 typed hops preserve the exact bible, station order and route distances', () => {
 assert.equal(corridor.length,36);
 for(const [i,hop] of corridor.entries()) {
  assert.equal(hop.i,i);assert.equal(hop.from,stations[i]);assert.equal(hop.to,stations[i+1]);
  assert.equal(hop.m,interStationM[i]);assert.equal(hop.end-hop.start,hop.m);
  assert.deepEqual(hop.tags,bible.hops[i].tags);assert.equal(hop.layout,bible.hops[i].layout);
 }
 assert.equal(corridor[35].end,totalLengthM);
});
test('layout switches at exact hop boundaries, including MG Road and both depot approaches', () => {
 for(let i=1;i<36;i++) {assert.equal(hopAt(stationPosition(i)-.001).i,i-1);assert.equal(hopAt(stationPosition(i)).i,i);}
 assert.deepEqual(corridor.filter(h=>h.layout==='at-grade').map(h=>h.i),[12,13]);
 assert.deepEqual(corridor.filter(h=>h.layout==='underground').map(h=>h.i),[18,19,20,21,22]);
 assert.equal(hopAt(-100).i,0);assert.equal(hopAt(totalLengthM+100).i,35);
 assert.equal(isUnderground(stationPosition(18)),true);assert.equal(isUnderground(stationPosition(23)),false);
});
test('streaming covers the camera continuously, stays bounded, and clips exact layout boundaries', () => {
 for(let distance=0;distance<=totalLengthM;distance+=37) {
  const slices=nearbySlices(distance);
  assert.ok(slices.length<=9,`unbounded streaming at ${distance}`);
  assert.ok(slices.some(s=>s.start<=distance&&s.end>distance));
  assert.ok(slices.at(-1).end>=Math.min(totalLengthM+CHUNK_M,distance+640));
  for(let i=0;i<slices.length;i++) {
   const s=slices[i];assert.ok(s.end>s.start&&s.end-s.start<=CHUNK_M);
   if(i)assert.equal(s.start,slices[i-1].end,'no overlaps or cracks');
   assert.equal(hopAt((s.start+s.end)/2).i,s.hop.i);
   assert.equal(s.tunnel,isEnclosed((s.start+s.end)/2));
  }
 }
});
test('a streamed chunk keeps the same key, placement, and geometry as the train advances', () => {
 for(const hop of corridor) {
  const a=nearbySlices(hop.start+300),b=nearbySlices(hop.start+460),shared=a.filter(s=>b.some(t=>t.key===s.key));
  assert.ok(shared.length>=4);
  for(const s of shared) {
   const other=b.find(t=>t.key===s.key);assert.deepEqual(s,other);
   const build=s.tunnel?makeTunnel:makeSurface;assert.deepEqual(build(s),build(other));
  }
 }
});
test('every bible tag has an explicit kit, and landmark anchors occur once inside their hop', () => {
 for(const hop of corridor) {
  const specs=landmarkPlacements(hop);assert.equal(specs.length,hop.tags.length);
  for(const spec of specs) {
   assert.ok(LANDMARKS[spec.tag]);assert.ok(spec.distance>hop.start+90&&spec.distance<hop.end-90);
   const owning=nearbySlices(spec.distance).filter(s=>s.hop.i===hop.i&&s.start<=spec.distance&&s.end>spec.distance);
   assert.equal(owning.length,1);
  }
 }
});
test('all 29 elevated hops have different physical scenery, not only different labels', () => {
 const signatures=new Set();
 for(const hop of corridor.filter(h=>h.layout==='elevated')) {
  const kit=makeSurface(sliceFor(hop));
  const physical=JSON.stringify([kit.solid,kit.concrete,kit.steel,kit.glass,kit.foliage,kit.round]);
  assert.ok(!signatures.has(physical),`duplicate scenery at hop ${hop.i}`);signatures.add(physical);
  assert.equal(kit.plates.length,hop.tags.length);
 }
 assert.equal(signatures.size,29);
 assert.notEqual(LANDMARKS.ITPB.kit,LANDMARKS.Phoenix_MarketCity.kit);
 assert.notEqual(LANDMARKS.RVCE.kit,LANDMARKS.peri_urban.kit);
});
test('underground kits cannot create streets, vegetation, water or outdoor landmarks', () => {
 for(const hop of corridor.filter(h=>h.layout==='underground')) {
  const slice=sliceFor(hop),surface=makeSurface(slice),tunnel=makeTunnel(slice);
  assert.ok(Object.values(surface).every(items=>items.length===0));
  assert.ok(tunnel.solid.length>0&&tunnel.glow.length>0);
  for(const key of ['foliage','round','glass'])assert.equal(tunnel[key].length,0);
  assert.ok(tunnel.plates.every(p=>p.sub.includes('SURFACE WAYFINDING')));
 }
});
test('KSR remains enclosed to the end of its platform, then the Magadi portal opens', () => {
 assert.equal(isEnclosed(stationPosition(23)+47.99),true);assert.equal(isEnclosed(tunnelExitM),false);
 const slices=nearbySlices(stationPosition(23));
 assert.ok(slices.some(s=>s.tunnel&&s.end===tunnelExitM));
 assert.ok(slices.some(s=>!s.tunnel&&s.start===tunnelExitM));
});
test('station chambers cover full platforms and split exactly at their tube transitions', () => {
 for(let i=19;i<=23;i++) {
  const p=stationPosition(i),sections=tunnelSections(p-180,p+90);
  assert.deepEqual(sections.map(s=>[s.start,s.end,s.chamber]),[[p-180,p-126,false],[p-126,p+48,true],[p+48,p+90,false]]);
  for(const relative of [-114,-40,0,40])assert.ok(sections.some(s=>s.chamber&&s.start<=p+relative&&s.end>=p+relative));
 }
});
test('twin tunnel bores block every outward ray and leave train sightlines clear', () => {
 const hop=corridor[20],start=hop.start+200,slice={key:'ray',hop,start,end:start+160,tunnel:true};
 const built=meshesFor(makeTunnel(slice),start);
 for(const center of [0,-4.2]) {
  const origin=new THREE.Vector3(center,2.4,-start-80);
  for(let i=0;i<180;i++) {
   const angle=i/180*Math.PI*2,dir=new THREE.Vector3(Math.cos(angle),Math.sin(angle),0);
   const hits=new THREE.Raycaster(origin,dir,0,12).intersectObjects(built.meshes);
   assert.ok(hits.length>0,`lining leak at ${angle}`);assert.ok(hits[0].distance>1.7,'train clearance');
  }
  assert.equal(new THREE.Raycaster(origin,new THREE.Vector3(0,0,-1),0,60).intersectObjects(built.meshes).length,0);
 }
 built.dispose();
});
test('Baiyappanahalli ground rises smoothly to the tracks and depot horizons stay low', () => {
 assert.equal(groundHeight(stationPosition(12)), -1);assert.equal(groundHeight(stationPosition(14)),-1);
 assert.equal(groundHeight(stationPosition(12)-201),-10);assert.equal(groundHeight(stationPosition(14)+201),-10);
 for(const edge of [stationPosition(12)-200,stationPosition(12),stationPosition(14),stationPosition(14)+200])assert.ok(Math.abs(groundHeight(edge+.01)-groundHeight(edge-.01))<.002);
 for(const i of [12,13]) {
  const kit=makeSurface(sliceFor(corridor[i]));
  assert.ok(kit.plates.some(p=>p.text.includes('DEPOT')||p.text.includes('YARD')));
  assert.ok(!kit.solid.some(b=>b.p[0]===-2.1&&b.p[1]<-2&&b.s[1]>2),'no elevated pillars');
 }
});
test('spot landmark plates have a clear readable approach through the existing cab windscreen', () => {
 for(const [index,needle] of [[2,'ITPB'],[9,'PHOENIX'],[9,'VR BENGALURU'],[17,'MG ROAD'],[32,'RV COLLEGE'],[35,'CHALLAGHATTA · CITY EDGE']]) {
  const hop=corridor[index],kit=makeSurface(sliceFor(hop)),plate=kit.plates.find(p=>p.text.includes(needle));assert.ok(plate,needle);
  const objects=meshesFor(kit,hop.start);
  const target=new THREE.Vector3(...plate.p);target.z-=hop.start;
  let readable=false;
  for(const approach of [60,80,100,130,160]) {
   const camera=new THREE.PerspectiveCamera(66,1440/1000,.08,850);
   camera.position.set(0,2.8,target.z+approach);camera.rotation.x=-.035;camera.updateMatrixWorld();
   const ray=target.clone().sub(camera.position),glass=camera.position.clone().addScaledVector(ray,2.95/approach);
   const a=target.clone().add(new THREE.Vector3(-plate.width/2,0,0)).project(camera),b=target.clone().add(new THREE.Vector3(plate.width/2,0,0)).project(camera);
   const px=(b.x-a.x)*720,py=plate.width*160/1024/approach*1000/(2*Math.tan(33*Math.PI/180));
   const clear=new THREE.Raycaster(camera.position,ray.clone().normalize(),0,ray.length()-.3).intersectObjects(objects.meshes).length===0;
   readable ||= Math.abs(glass.x)<2.05&&glass.y>1.9&&glass.y<4&&px>120&&py>24&&clear;
  }
  objects.dispose();assert.ok(readable,`${needle}: sign obscured or too small`);
 }
});
test('streamed scenery stays within an explicit instance and draw-call budget across the route', () => {
 let maxInstances=0,maxBatches=0;
 for(let distance=0;distance<totalLengthM;distance+=640) {
  let instances=0,batches=0;
  for(const slice of nearbySlices(distance)) {
   const kit=slice.tunnel?makeTunnel(slice):makeSurface(slice);
   for(const items of Object.values(kit)) {instances+=items.length;batches+=Number(items.length>0);}
  }
  maxInstances=Math.max(maxInstances,instances);maxBatches=Math.max(maxBatches,batches);
 }
 assert.ok(maxInstances<15000,`${maxInstances} instances`);assert.ok(maxBatches<=54,`${maxBatches} batches`);
 console.log(`Corridor budget: ${maxInstances} peak instances, ${maxBatches} peak batches (route sampled every 640 m).`);
});
