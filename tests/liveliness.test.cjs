const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const cache = new Map();
function load(name) {
 if(cache.has(name))return cache.get(name);
 const module={exports:{}};
 const source=ts.transpileModule(fs.readFileSync(`src/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function('exports','module','require',source)(module.exports,module,id=>id.endsWith('.json')?require(`../src/${id}`):load(id.slice(2)));
 cache.set(name,module.exports);return module.exports;
}
const sim=load('simulation'),life=load('liveliness'),{audioEvents}=load('audio-events'),{audioMix}=load('audio-physics');
const {stationPosition,totalLengthM}=load('routes'),{isEnclosed,groundHeight,corridor,tunnelExitM}=load('corridor');
const {trafficPose,TRAFFIC_COUNT,TRAFFIC_INSTANCES}=load('traffic');
const run=(state,control,seconds,dt=.02)=>{for(let i=0;i<Math.round(seconds/dt);i++)state=sim.step(state,control,dt);return state;};
const rolling=(overrides={})=>({...sim.initialState(),doors:false,target:1,...overrides});

test('power builds with bounded jerk; service has a quicker bite and a softer final stop',()=>{
 for(const dt of [.01,.02,.05]) {
  let state=rolling();
  for(let i=0;i<1/dt;i++) {
   const next=sim.step(state,'power',dt);
   assert.ok(next.acceleration-state.acceleration<=sim.TRACTION_JERK*dt+1e-9);
   state=next;
  }
  assert.ok(state.speed>.2&&state.speed<.4,'deliberate first second, not instant full effort');
  state=run(rolling(),'power',10,dt);
  assert.ok(state.speed>7.5&&state.speed<8.3,`${dt}: useful acceleration within ten seconds`);
  const brake=sim.step(state,'brake',dt);
  assert.equal(brake.acceleration,-sim.BRAKE_JERK*dt,'traction cuts at once, then pressure builds');
  assert.equal(sim.step(state,'emergency',dt).acceleration,-sim.EMERGENCY_BRAKE);
  const low=sim.step(rolling({speed:.6,acceleration:-sim.SERVICE_BRAKE}),'brake',dt);
  assert.ok(low.acceleration>-sim.SERVICE_BRAKE,'release near standstill');
  assert.equal(run(state,'brake',15,dt).speed,0);
 }
 assert.ok(sim.BRAKE_JERK>sim.TRACTION_JERK);
 const coast=run(rolling({speed:15}),'coast',10);
 assert.ok(coast.speed>14.3&&coast.speed<15,'coasting retains heavy-train momentum');
});

test('brake guide covers service ramp and low-speed release at all driving speeds',()=>{
 for(const speed of [1,3,8,15,sim.MAX_SPEED])for(const dt of [.01,.02,.05]) {
  // Far from a marker so this measures manual service braking without ATP help.
  let state=rolling({speed,target:36,acceleration:sim.TRACTION_ACCEL}),count=0;
  while(state.speed>0&&count++<10000)state=sim.step(state,'brake',dt);
  const guide=sim.brakeGuide(speed);
  assert.ok(count<10000);
  assert.ok(state.position<=guide,`${speed}m/s: guide ${guide} covers ${state.position}`);
  assert.ok(guide-state.position<5,'guide remains useful for a precise manual stop');
 }
});

test('traction feedback follows doors, closing, ATP and completion, never the selected notch alone',()=>{
 const initial=sim.initialState(),ready=run(initial,'coast',5.1),closing=sim.toggleDoors(ready);
 for(const [state,reason] of [[initial,'doors'],[closing,'closing'],[rolling({atp:true}),'atp'],[{...initial,complete:true},'complete']]) {
  assert.equal(sim.tractionBlock(state),reason);assert.equal(sim.tractionLoad(state,'power'),0);
 }
 assert.equal(run(closing,'power',2).speed,0);
 assert.equal(sim.tractionBlock(run(closing,'coast',2.6)),null);
 const state=run(rolling(),'power',2);
 assert.ok(sim.tractionLoad(state,'power')>.9);
 assert.equal(sim.tractionLoad(state,'coast'),0);
 assert.equal(sim.brakeLoad(state,'coast'),0);
 assert.ok(sim.brakeLoad({...state,atp:true,acceleration:-1},'power')>.8);
});

test('clean-stop acknowledgement uses signed distance, requires standstill, and distinguishes ATP assistance',()=>{
 for(const offset of [-8,-5,0,5,8]) {
  const state=rolling({position:stationPosition(1)+offset});
  assert.equal(sim.berthQuality(state),Math.abs(offset)<=5?'clean':'aligned');
  assert.equal(sim.berthQuality({...state,speed:.01}),null);
 }
 assert.equal(sim.berthQuality(rolling({position:stationPosition(1)+8.01})),null);
 let protectedStop=rolling({position:stationPosition(1)-3.2,speed:.1,atp:true});
 protectedStop=run(protectedStop,'power',2);
 assert.equal(sim.berthQuality(protectedStop),'protected');
 protectedStop=run(sim.toggleDoors(protectedStop),'coast',5.1);
 assert.equal(protectedStop.atp,false);assert.equal(protectedStop.assisted,true);
 assert.equal(sim.berthQuality(protectedStop),'protected','door release cannot turn an assisted stop into a clean one');
 const departed=run(sim.toggleDoors(protectedStop),'coast',2.6);
 assert.equal(departed.assisted,false,'the next station is a fresh approach');
 // A clean berth is actually reachable under manual service, outside the ATP envelope.
 const manual=run(rolling({position:stationPosition(1)-5.05,speed:.22}),'brake',1);
 assert.equal(manual.assisted,false);assert.equal(sim.berthQuality(manual),'clean');
});

test('opposing train crosses continuously and emits exactly one pass cue per encounter, including while we dwell',()=>{
 for(const speed of [0,10,sim.MAX_SPEED]) {
  let previous=rolling({target:36,speed}),passes=0;
  for(let i=1;i<=6000;i++) {
   const next={...previous,elapsed:i*.08,position:i*.08*speed};
   const a=life.passingMetro(previous),b=life.passingMetro(next);
   if(b.nose<a.nose)assert.ok(!a.visible,'recycle is entirely behind the camera');
   else assert.ok(Math.abs(b.nose-a.nose-(speed+life.PASS_SPEED)*.08)<1e-8);
   const events=audioEvents(previous,next,new Set());
   if(events.includes('pass-by')){passes++;assert.ok(b.nose>=0&&b.nose<(speed+life.PASS_SPEED)*.081);assert.ok(b.air>.98);}
   previous=next;
  }
  assert.equal(passes,Math.floor((life.passDistance(previous)-life.PASS_APPROACH)/life.PASS_SPACING)+1);
  assert.deepEqual(audioEvents(previous,previous,new Set()),[],'pause creates no pass or rail cue');
  assert.deepEqual(audioEvents(previous,rolling({target:36}),new Set()),[],'restart re-arms without replay');
 }
});

test('joint ticks follow physical distance, stop with the train, and never replay after a jump',()=>{
 const counts=[];
 for(const speed of [2,10,20]) {
  let previous=rolling({target:36,speed}),ticks=0;
  for(let i=1;i<=125;i++) {
   const next={...previous,elapsed:i*.08,position:i*.08*speed};
   if(audioEvents(previous,next,new Set()).includes('rail-joint'))ticks++;
   previous=next;
  }
  assert.equal(ticks,Math.floor(speed*10/life.RAIL_JOINT_M));counts.push(ticks);
  assert.ok(!audioEvents(previous,{...previous,elapsed:20,position:1000},new Set()).includes('rail-joint'));
 }
 assert.ok(counts[0]<counts[1]&&counts[1]<counts[2]);
 const state=rolling({position:17.9,elapsed:1,speed:0});
 assert.ok(!audioEvents(state,{...state,position:18.1,elapsed:1.1},new Set()).includes('rail-joint'));
});

test('sound load follows applied effort and brakes; doors silence motion and keep their platform bed',()=>{
 const state=rolling({speed:12,acceleration:sim.TRACTION_ACCEL,elapsed:80});
 const power=audioMix(state,'power'),coast=audioMix(state,'coast');
 assert.ok(power.traction>coast.traction*3);assert.ok(power.motorRate>coast.motorRate);
 assert.equal(power.rail,coast.rail,'rail bed survives the power cut');assert.equal(coast.brake,0);
 const atp=audioMix({...state,atp:true,acceleration:-1.2},'power');
 assert.ok(atp.brake>0);assert.equal(atp.traction,coast.traction);
 assert.ok(audioMix({...state,speed:20},'coast').rail>coast.rail);
 const doors=audioMix(sim.initialState(),'power');
 assert.equal(doors.traction,0);assert.equal(doors.rail,0);assert.equal(doors.brake,0);assert.ok(doors.platform>0);
 assert.equal(audioMix({...sim.initialState(),closing:2},'power').platform,0);
 assert.equal(audioMix({...state,speed:0},'brake').brake,0);
});

test('camera and panel motion are small, deterministic, and still at rest; dusk is bounded',()=>{
 for(const control of ['coast','power','brake','emergency'])for(let i=0;i<400;i++) {
  const state=rolling({position:i*1.37,elapsed:i*.31,speed:sim.MAX_SPEED,acceleration:control==='power'?.88:-2.6});
  const pose=life.cabMotion(state,control);
  assert.deepEqual(pose,life.cabMotion({...state},control));
  assert.ok(Math.abs(pose.x)<=.009&&Math.abs(pose.y)<=.0111);
  assert.ok(Math.abs(pose.pitch)<.0041&&Math.abs(pose.roll)<.00086&&Math.abs(pose.panel)<.002);
 }
 const rest=life.cabMotion(sim.initialState(),'coast');
 assert.ok(Object.values(rest).every(n=>n===0));
 let previous=life.dutyLight(0);
 for(let elapsed=1;elapsed<=6000;elapsed++) {
  const light=life.dutyLight(elapsed);
  assert.ok(light.dusk>=previous.dusk&&light.dusk<=1);
  assert.ok(light.ambient>=.83&&light.sun>=1.5&&light.sky>=1);
  assert.ok(Math.abs(light.sun-previous.sun)<.001);previous=light;
 }
 assert.deepEqual(life.dutyLight(6000),life.dutyLight(3000));
});

test('traffic is capped, streamed, on existing road lanes, and absent inside every tunnel/portal section',()=>{
 assert.equal(TRAFFIC_COUNT,24);assert.equal(TRAFFIC_INSTANCES,144);
 const positions=[0,totalLengthM,...Array.from({length:69},(_,i)=>i*640),...corridor.flatMap(h=>[h.start-1,h.start,h.start+1]),tunnelExitM-1,tunnelExitM,tunnelExitM+1];
 for(const position of positions)for(let slot=0;slot<TRAFFIC_COUNT;slot++) {
  const car=trafficPose(slot,position,position/14);
  assert.ok(car.distance>=position-160-1e-8&&car.distance<position+800+1e-8);
  assert.equal(car.visible,car.distance>=-160&&car.distance<=totalLengthM+160&&!isEnclosed(car.distance));
  assert.equal(car.y,groundHeight(car.distance));
  assert.ok((car.x>10.5&&car.x<17.5)||(car.x>-21.5&&car.x<-14.5));
  assert.deepEqual(car,trafficPose(slot,position,position/14));
  const shifted=trafficPose(slot,position+20,position/14);
  if(car.distance-position>-100&&car.distance-position<630)assert.ok(Math.abs(shifted.distance-car.distance)<1e-8,'streaming cannot move a visible car');
 }
 const a=trafficPose(0,200,30),b=trafficPose(0,200,30.1);
 assert.ok(b.distance>a.distance&&b.distance-a.distance<1,'traffic keeps moving with our train stationary');
});
