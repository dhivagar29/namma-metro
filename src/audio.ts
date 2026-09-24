import { kannada, stations } from './routes';
import type { Control, Simulation } from './simulation';
import { audioEvents, type AudioEvent } from './audio-events';
import { audioMix } from './audio-physics';
type Sound = AudioEvent | 'traction' | 'brake' | 'platform' | 'rail' | 'pass';
// Keep the existing nine-file pack. Rail/air textures are tiny seeded buffers,
// generated once after the operator starts a duty; no asset fetch or paid API.
const sounds:Sound[]=['door-open','door-close','door-warning','departure','boarding-tick','pa-chime','traction','brake','platform'];
type Loop = {source:AudioBufferSourceNode;gain:GainNode;filter?:BiquadFilterNode};
class MetroAudio {
 private ctx?:AudioContext;
 private master?:GainNode;
 private buffers=new Map<Sound,AudioBuffer>();
 private loops=new Map<Sound,Loop>();
 private playing=new Set<AudioScheduledSourceNode>();
 private previous?:Simulation;
 private announced=new Set<number>();
 private active=false;
 private muted=false;
 private paUntil=0;
 private speechTimer?:ReturnType<typeof setTimeout>;
 private pendingStation?:number;
 private generation=0;
 private speechGeneration=0;
 private loading?:Promise<void>;
 private fallback?:{osc:OscillatorNode;gain:GainNode};
 start(initial:Simulation) {
  this.previous=initial;this.announced.clear();this.paUntil=0;this.pendingStation=undefined;this.generation++;
  this.cancelSpeech();this.stopOneShots();
  try {
   if(!this.ctx) {
    const ctx=this.ctx=new AudioContext();this.master=ctx.createGain();this.master.gain.value=0;this.master.connect(ctx.destination);
    const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
    osc.type='triangle';osc.frequency.value=50;filter.type='lowpass';filter.frequency.value=300;gain.gain.value=0;
    osc.connect(filter);filter.connect(gain);gain.connect(this.master);osc.start();this.fallback={osc,gain};
    this.makeProcedural();
    this.loading=Promise.all(sounds.map(async name=>{
     try {const response=await fetch(`/audio/${name}.wav`);if(!response.ok)throw new Error(name);const buffer=await ctx.decodeAudioData(await response.arrayBuffer());this.buffers.set(name,buffer);if(['traction','brake','platform'].includes(name))this.makeLoop(name,buffer);} catch { /* The procedural fallback remains available offline. */ }
    })).then(()=>{});
   }
   // A restarted duty cannot briefly play the old high-speed loops.
   for(const loop of this.loops.values()){loop.gain.gain.cancelScheduledValues(this.ctx.currentTime);loop.gain.gain.setValueAtTime(0,this.ctx.currentTime);}
   this.fallback?.gain.gain.cancelScheduledValues(this.ctx.currentTime);
   this.fallback?.gain.gain.setValueAtTime(0,this.ctx.currentTime);
   this.setActive(true);
   const generation=this.generation;
   void this.loading?.then(()=>{if(generation===this.generation&&this.active&&this.previous?.doors&&this.previous.dwell<.55)this.play('door-open');});
  } catch { /* A browser without Web Audio can still drive and read PA captions. */ }
 }
 private makeProcedural() {
  const ctx=this.ctx!;
  const noise=ctx.createBuffer(1,22050,22050),data=noise.getChannelData(0);
  let seed=713,low=0;
  for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;low=.74*low+.26*(seed/4294967296*2-1);data[i]=low;}
  this.makeLoop('rail',noise,550);this.makeLoop('pass',noise,1700);
  for(const [name,seconds] of [['rail-joint',.085],['pass-by',.32]] as const) {
   const buffer=ctx.createBuffer(1,Math.ceil(seconds*22050),22050),samples=buffer.getChannelData(0);
   for(let i=0;i<samples.length;i++) {
    const t=i/22050,envelope=Math.min(1,t/.006)*Math.exp(-t/(seconds*.22));
    samples[i]=(data[i%data.length]*.7+Math.sin(t*2*Math.PI*(name==='rail-joint'?145:65))*.17)*envelope;
   }
   this.buffers.set(name,buffer);
  }
 }
 private makeLoop(name:Sound,buffer:AudioBuffer,cutoff?:number) {
  const ctx=this.ctx!,source=ctx.createBufferSource(),gain=ctx.createGain();
  const filter=cutoff?ctx.createBiquadFilter():undefined;
  source.buffer=buffer;source.loop=true;gain.gain.value=0;
  if(filter&&cutoff!==undefined){filter.type='lowpass';filter.frequency.value=cutoff;source.connect(filter);filter.connect(gain);}else source.connect(gain);
  gain.connect(this.master!);source.start();this.loops.set(name,{source,gain,filter});
 }
 private cancelSpeech() {
  this.speechGeneration++;clearTimeout(this.speechTimer);
  if('speechSynthesis' in window) window.speechSynthesis.cancel();
 }
 private stopOneShots() {for(const source of this.playing){try{source.stop();}catch{ /* Already ended. */ }}this.playing.clear();}
 setActive(active:boolean) {
  this.active=active;
  if(!active){this.cancelSpeech();this.stopOneShots();}
  if(this.ctx&&this.master){if(active)void this.ctx.resume().catch(()=>{});this.master.gain.setTargetAtTime(active&&!this.muted?.55:0,this.ctx.currentTime,.04);}
  if(active&&this.pendingStation!==undefined&&!this.muted)this.speak(this.pendingStation);
 }
 setMute(muted:boolean) {
  this.muted=muted;
  if(muted){this.cancelSpeech();this.stopOneShots();this.pendingStation=undefined;this.paUntil=0;}
  if(this.ctx&&this.master)this.master.gain.setTargetAtTime(this.active&&!muted?.55:0,this.ctx.currentTime,.03);
 }
 private track(source:AudioScheduledSourceNode,nodes:AudioNode[]) {
  this.playing.add(source);
  source.onended=()=>{this.playing.delete(source);source.disconnect();nodes.forEach(node=>node.disconnect());};
 }
 private play(name:AudioEvent,level=1) {
  if(!this.ctx||!this.master||!this.active||this.muted)return;
  const ctx=this.ctx,buffer=this.buffers.get(name),gain=ctx.createGain();gain.gain.value=level;gain.connect(this.master);
  if(buffer){const source=ctx.createBufferSource();source.buffer=buffer;source.connect(gain);this.track(source,[gain]);source.start();}
  else {
   const osc=ctx.createOscillator();osc.frequency.value=name==='boarding-tick'?1200:760;
   gain.gain.setValueAtTime(.12*level,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.2);
   osc.connect(gain);this.track(osc,[gain]);osc.start();osc.stop(ctx.currentTime+.22);
  }
 }
 private speak(index:number) {
  if(!this.active||this.muted||!('speechSynthesis' in window))return;
  this.cancelSpeech();this.pendingStation=index;
  const generation=this.speechGeneration;
  this.speechTimer=setTimeout(()=>{
   if(!this.active||this.muted||generation!==this.speechGeneration)return;
   const synth=window.speechSynthesis,voices=synth.getVoices();
   const english=new SpeechSynthesisUtterance(`Next station: ${stations[index]}.`);
   const en=voices.find(v=>v.lang.toLowerCase()==='en-in')??voices.find(v=>v.lang.startsWith('en'));
   if(en)english.voice=en;english.lang='en-IN';english.rate=.87;english.volume=.75;
   const kn=voices.find(v=>v.lang.toLowerCase().startsWith('kn'));
   const local=new SpeechSynthesisUtterance(kn?`ಮುಂದಿನ ನಿಲ್ದಾಣ: ${kannada[index]}.`:`Mundina nildaana: ${stations[index]}.`);
   if(kn)local.voice=kn;else if(en)local.voice=en;
   local.lang=kn?'kn-IN':'en-IN';local.rate=.8;local.volume=.75;
   const done=()=>{if(generation===this.speechGeneration){this.pendingStation=undefined;this.paUntil=0;}};
   local.onend=done;local.onerror=done;
   synth.speak(english);synth.speak(local);
  },850);
 }
 update(next:Simulation,control:Control) {
  if(!this.active)return;
  const mix=audioMix(next,control);
  if(this.previous)for(const event of audioEvents(this.previous,next,this.announced)) {
   const duck=next.elapsed<this.paUntil?.35:1;
   this.play(event,(event==='rail-joint'?mix.joint:event==='pass-by'?.18:1)*duck);
   if(event==='pa-chime'){
    this.announced.add(next.target);
    if(!this.muted){this.paUntil=next.elapsed+16;this.speak(next.target);}
   }
  }
  this.previous=next;
  if(!this.ctx)return;
  const duck=next.elapsed<this.paUntil?.35:1;
  const levels:Partial<Record<Sound,number>>={traction:mix.traction,brake:mix.brake,platform:mix.platform,rail:mix.rail,pass:mix.pass};
  for(const [name,loop] of this.loops){
   loop.gain.gain.setTargetAtTime((levels[name]??0)*duck,this.ctx.currentTime,name==='pass'?.06:.12);
   if(name==='traction')loop.source.playbackRate.setTargetAtTime(mix.motorRate,this.ctx.currentTime,.15);
   if(name==='brake')loop.source.playbackRate.setTargetAtTime(mix.brakeRate,this.ctx.currentTime,.12);
   if(name==='pass')loop.source.playbackRate.setTargetAtTime(mix.passRate,this.ctx.currentTime,.15);
   if(name==='rail')loop.filter?.frequency.setTargetAtTime(260+next.speed*42,this.ctx.currentTime,.15);
  }
  if(this.fallback){this.fallback.gain.gain.setTargetAtTime(this.buffers.has('traction')?0:mix.traction*.3*duck,this.ctx.currentTime,.12);this.fallback.osc.frequency.setTargetAtTime(45+mix.motorRate*65,this.ctx.currentTime,.15);}
 }
}
export const audio=new MetroAudio();
