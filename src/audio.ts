class MetroAudio {
 ctx?: AudioContext; gain?: GainNode; rumble?: GainNode; muted = false;
 start() {
  if (this.ctx) { void this.ctx.resume(); return; }
  const ctx = this.ctx = new AudioContext(); this.gain = ctx.createGain(); this.gain.gain.value = this.muted ? 0 : .18; this.gain.connect(ctx.destination);
  this.rumble = ctx.createGain(); this.rumble.gain.value = .03; this.rumble.connect(this.gain);
  const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 48;
  const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 160; osc.connect(filter); filter.connect(this.rumble); osc.start();
 }
 setMute(value: boolean) { this.muted = value; if (this.gain && this.ctx) this.gain.gain.setTargetAtTime(value ? 0 : .18, this.ctx.currentTime, .05); if (value && 'speechSynthesis' in window) speechSynthesis.cancel(); }
 speed(value: number) { if(this.rumble && this.ctx) this.rumble.gain.setTargetAtTime(.03 + value * .7, this.ctx.currentTime, .3); }
 chime(station?: string) {
  this.start(); const ctx = this.ctx!;
  [660, 880, 550].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * .23; o.frequency.value = f; g.gain.setValueAtTime(.001,t); g.gain.linearRampToValueAtTime(.3,t+.02); g.gain.exponentialRampToValueAtTime(.001,t+.4); o.connect(g); g.connect(this.gain!); o.start(t); o.stop(t+.45); });
  if (station && !this.muted && 'speechSynthesis' in window) { speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(`Arriving at ${station}. Please mind the gap.`); utterance.rate = .88; utterance.volume = .5; speechSynthesis.speak(utterance); }
 }
}
export const audio = new MetroAudio();
