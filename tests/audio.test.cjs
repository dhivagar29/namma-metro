const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function load(name,cache={}) {
 if(cache[name])return cache[name].exports;
 const module=cache[name]={exports:{}};
 const source=ts.transpileModule(fs.readFileSync(`src/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('exports','module','require',source)(module.exports,module,path=>load(path.replace('./',''),cache));
 return module.exports;
}
test('audio bus mutes every loop, cancels speech on pause, resumes PA, and resets a new duty',async()=>{
 const saved={window:global.window,AudioContext:global.AudioContext,SpeechSynthesisUtterance:global.SpeechSynthesisUtterance,fetch:global.fetch,setTimeout:global.setTimeout,clearTimeout:global.clearTimeout};
 const gains=[],sources=[],utterances=[],timers=new Map();let nextTimer=0,cancelled=0;
 class Param {value=0;setTargetAtTime(v){this.value=v;}setValueAtTime(v){this.value=v;}exponentialRampToValueAtTime(v){this.value=v;}}
 class Node {gain=new Param();frequency=new Param();playbackRate=new Param();connect(){}start(){this.started=true;}stop(){this.stopped=true;this.onended?.();}}
 class Context {
  currentTime=0;destination={};resume(){return Promise.resolve();}
  createGain(){const n=new Node();gains.push(n);return n;}
  createOscillator(){return new Node();}createBiquadFilter(){return new Node();}
  createBufferSource(){const n=new Node();sources.push(n);return n;}
  decodeAudioData(buffer){return Promise.resolve(buffer);}
 }
 try {
  global.window={speechSynthesis:{cancel(){cancelled++;utterances.length=0;},getVoices(){return[{lang:'en-IN',name:'English'},{lang:'kn-IN',name:'Kannada'}];},speak(u){utterances.push(u);}}};
  global.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  global.AudioContext=Context;
  global.fetch=async url=>({ok:true,arrayBuffer:async()=>fs.readFileSync(`public${url}`).buffer});
  global.setTimeout=fn=>{timers.set(++nextTimer,fn);return nextTimer;};global.clearTimeout=id=>timers.delete(id);
  const {audio}=load('audio'),{initialState}=load('simulation');
  const initial=initialState();audio.start(initial);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(sources.filter(s=>s.loop).length,3);
  const master=gains[0];assert.equal(master.gain.value,.55);
  const approach={...initial,doors:false,target:1,position:650,speed:15,elapsed:40};
  audio.update(approach,'power');
  const callbacks=[...timers.values()];timers.clear();callbacks.forEach(fn=>fn());
  assert.equal(utterances.length,2);assert.match(utterances[0].text,/Next station: Hopefarm Channasandra/);
  assert.match(utterances[1].text,/ಮುಂದಿನ ನಿಲ್ದಾಣ/);
  const beforePause=cancelled;
  audio.setActive(false);assert.equal(master.gain.value,0);assert.ok(cancelled>beforePause);assert.equal(utterances.length,0);
  assert.ok(sources.filter(s=>!s.loop).every(s=>s.stopped));
  audio.setActive(true);assert.equal(master.gain.value,.55);assert.equal(timers.size,1,'paused announcement is rescheduled');
  audio.setMute(true);assert.equal(master.gain.value,0);assert.equal(timers.size,0,'mute clears delayed speech');
  audio.setActive(false);audio.setActive(true);assert.equal(master.gain.value,0,'resuming cannot bypass mute');
  audio.setMute(false);assert.equal(master.gain.value,.55);
  audio.start(initial);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(sources.filter(s=>s.loop).length,3,'restart does not duplicate loops');
  assert.equal(timers.size,0,'old station PA cannot leak into a new duty');
  audio.update(approach,'coast');assert.equal(timers.size,1,'new duty may announce the station again');
  audio.setActive(false);
 } finally {for(const [key,value] of Object.entries(saved)){if(value===undefined)delete global[key];else global[key]=value;}}
});
test('audio failure leaves controls usable and uses the synthesized tone fallback',async()=>{
 const saved={window:global.window,AudioContext:global.AudioContext,fetch:global.fetch};
 let oscillators=0;
 class Param{setTargetAtTime(){}setValueAtTime(){}exponentialRampToValueAtTime(){}}
 class Node{gain=new Param();frequency=new Param();connect(){}start(){}stop(){}}
 try{
  global.window={};global.fetch=async()=>{throw new Error('offline');};
  global.AudioContext=class{currentTime=0;destination={};createGain(){return new Node();}createOscillator(){oscillators++;return new Node();}createBiquadFilter(){return new Node();}resume(){return Promise.resolve();}};
  const {audio}=load('audio'),{initialState}=load('simulation');
  audio.start(initialState());await new Promise(resolve=>setImmediate(resolve));
  assert.ok(oscillators>=2,'persistent traction oscillator and one-shot door fallback');
  assert.doesNotThrow(()=>audio.update({...initialState(),doors:false,speed:10,target:1,position:500},'power'));
  audio.setMute(true);audio.setActive(false);
 }finally{for(const[key,value]of Object.entries(saved)){if(value===undefined)delete global[key];else global[key]=value;}}
});
