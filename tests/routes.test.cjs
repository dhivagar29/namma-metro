const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
const source=ts.transpileModule(fs.readFileSync('src/routes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const routeModule={exports:{}};new Function('exports','module',source)(routeModule.exports,routeModule);
const {routes,duration,motion}=routeModule.exports;
test('locked station order and underground transitions',()=>{
 assert.deepEqual(routes.purple.stations,['Indiranagar','Halasuru','Trinity','Mahatma Gandhi Road','Cubbon Park']);
 assert.deepEqual(routes.green.stations,['Nadaprabhu Kempegowda Stn., Majestic','Chickpete','Krishna Rajendra Market','National College']);
 assert.deepEqual(routes.purple.underground,[false,false,false,false,true]);
 assert.deepEqual(routes.green.underground,[true,true,true,false]);
});
test('every hop progresses continuously through acceleration, coast, braking and arrival',()=>{
 for(const r of Object.values(routes)){
  assert.equal(r.km.length,r.stations.length-1);
  for(const km of r.km){
   const total=duration(km);assert.ok(total>=66&&total<=78);
   assert.deepEqual(motion(0,total),{progress:0,speed:0});
   assert.deepEqual(motion(total,total),{progress:1,speed:0});
   let previous=0;
   for(let t=.1;t<total;t+=.1){const {progress,speed}=motion(t,total);assert.ok(progress>previous);assert.ok(progress<=1);assert.ok(speed>0&&speed<=1);previous=progress;}
   assert.ok(motion(6,total).speed<motion(12,total).speed);
   assert.ok(motion(total-6,total).speed<motion(total-12,total).speed);
   assert.ok(Math.abs(motion(total/2,total).progress-.5)<1e-8);
  }
 }
});
