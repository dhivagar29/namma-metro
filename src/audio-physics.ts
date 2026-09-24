import { brakeLoad, MAX_SPEED, tractionLoad, type Control, type Simulation } from './simulation';
import { passingMetro } from './liveliness';

// Pure mix targets make the audible physics testable without a browser/device.
export function audioMix(s: Simulation, control: Control) {
 const speed=s.complete?0:Math.min(1,s.speed/MAX_SPEED), load=tractionLoad(s,control), braking=brakeLoad(s,control);
 const pass=passingMetro(s);
 return {
  traction: s.complete?0:(.025+speed*.35)*load + speed*.085,
  motorRate: .62+speed*1.9+load*.12,
  brake: Math.min(1,s.speed/.65)*braking*(.12+.13*(1-speed)),
  brakeRate: .8+speed*.55,
  rail: speed**.8*.17,
  platform: s.doors&&s.closing===0?.55*(s.serviced?.7:1):0,
  pass: s.complete?0:pass.air*.42,
  passRate: pass.nose<0?1.12:.86,
  joint: .025+speed*.065,
 };
}
