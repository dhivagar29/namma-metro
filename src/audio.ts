import { kannada, stations } from './routes';
import type { Control, Simulation } from './simulation';
import { audioEvents, type AudioEvent } from './audio-events';
type Sound = AudioEvent | 'traction' | 'brake' | 'platform';
const sounds:Sound[]=['door-open','door-close','door-warning','departure','boarding-tick','pa-chime','traction','brake','platform'];
class MetroAudio {
 private ctx?:AudioContext;
 private master?:GainNode;
 private buffers=new Map<Sound,AudioBuffer>();
 private loops=new Map<Sound,{source:AudioBufferSourceNode;gain:GainNode}>();
 private playing=new Set<AudioBufferSourceNode>();
 private previous?:Simulation;
 private announced=new Set<number>();
 private active=false;
 private muted=false;
 private paUntil=0;
 private speechTimer?:ReturnType<typeof setTimeout>;
 private pendingStation?:number;
 private generation=0;
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
    this.loading=Promise.all(sounds.map(async name=>{
     try {const response=await fetch(`/audio/${name}.wav`);if(!response.ok)throw new Error(name);const buffer=await ctx.decodeAudioData(await response.arrayBuffer());this.buffers.set(name,buffer);if(['traction','brake','platform'].includes(name))this.makeLoop(name,buffer);} catch { /* Synth fallback keeps controls usable offline or without assets. */ }
    })).then(()=>{});
   }
   this.setActive(true);
   const generation=this.generation;
   void this.loading?.then(()=>{if(generation===this.generation&&this.active)this.play('door-open');});
  } catch { /* A browser without Web Audio can still drive and read PA captions. */ }
 }
 private makeLoop(name:Sound,buffer:AudioBuffer) {
  const ctx=this.ctx!,source=ctx.createBufferSource(),gain=ctx.createGain();
  source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(this.master!);source.start();this.loops.set(name,{source,gain});
 }
 private cancelSpeech() {
  clearTimeout(this.speechTimer);
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
  if(muted)this.cancelSpeech();
  if(this.ctx&&this.master)this.master.gain.setTargetAtTime(this.active&&!muted?.55:0,this.ctx.currentTime,.03);
 }
 private play(name:AudioEvent) {
  if(!this.ctx||!this.master||!this.active)return;
  const buffer=this.buffers.get(name);
  if(buffer){const source=this.ctx.createBufferSource();source.buffer=buffer;source.connect(this.master);this.playing.add(source);source.onended=()=>this.playing.delete(source);source.start();}
  else {
   const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=name==='boarding-tick'?1200:760;gain.gain.setValueAtTime(.12,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.2);osc.connect(gain);gain.connect(this.master);osc.start();osc.stop(ctx.currentTime+.22);
  }
 }
 private speak(index:number) {
  if(!this.active||this.muted||!('speechSynthesis' in window))return;
  this.cancelSpeech();this.pendingStation=index;
  this.speechTimer=setTimeout(()=>{
   if(!this.active||this.muted)return;
   const synth=window.speechSynthesis,voices=synth.getVoices();
   const english=new SpeechSynthesisUtterance(`Next station: ${stations[index]}.`);
   const en=voices.find(v=>v.lang.toLowerCase()==='en-in')??voices.find(v=>v.lang.startsWith('en'));
   if(en)english.voice=en;english.lang='en-IN';english.rate=.87;english.volume=.75;
   const kn=voices.find(v=>v.lang.toLowerCase().startsWith('kn'));
   // Kannada when installed; otherwise Kannada-style transliteration using the
   // English voice. No external voice API or downloaded station recordings.
   const local=new SpeechSynthesisUtterance(kn?`ಮುಂದಿನ ನಿಲ್ದಾಣ: ${kannada[index]}.`:`Mundina nildaana: ${stations[index]}.`);
   if(kn)local.voice=kn;else if(en)local.voice=en;
   local.lang=kn?'kn-IN':'en-IN';local.rate=.8;local.volume=.75;
   local.onend=()=>{this.pendingStation=undefined;this.paUntil=0;};
   local.onerror=()=>{this.pendingStation=undefined;this.paUntil=0;};
   synth.speak(english);synth.speak(local);
  },850);
 }
 update(next:Simulation,control:Control) {
  if(!this.active)return;
  if(this.previous)for(const event of audioEvents(this.previous,next,this.announced)) {
   this.play(event);
   if(event==='pa-chime'){this.announced.add(next.target);this.paUntil=next.elapsed+16;this.speak(next.target);}
  }
  this.previous=next;
  if(!this.ctx)return;
  const speed=next.complete?0:next.speed/(80/3.6),duck=next.elapsed<this.paUntil?.35:1;
  const levels:Partial<Record<Sound,number>>={traction:speed*(control==='power'?.6:.35)*duck,brake:next.speed>.05&&(control==='brake'||control==='emergency'||next.atp)?.22*duck:0,platform:next.doors&&next.closing===0?.65:0};
  for(const [name,loop] of this.loops){loop.gain.gain.setTargetAtTime(levels[name]??0,this.ctx.currentTime,.15);if(name==='traction')loop.source.playbackRate.setTargetAtTime(.7+speed*1.9,this.ctx.currentTime,.2);}
  if(this.fallback){this.fallback.gain.gain.setTargetAtTime(this.buffers.has('traction')?0:speed*.1*duck,this.ctx.currentTime,.2);this.fallback.osc.frequency.setTargetAtTime(45+speed*100,this.ctx.currentTime,.2);}
 }
}
export const audio=new MetroAudio();
