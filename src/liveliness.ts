import { MAX_SPEED, tractionLoad, type Control, type Simulation } from './simulation';

export const PASS_SPEED = 16.5; // Opposing set: 59 km/h; relative speed includes our train.
export const PASS_SPACING = 3600;
export const PASS_APPROACH = 620;
export const PASS_LENGTH = 125;
export const RAIL_JOINT_M = 18;
export const passDistance = (s: Pick<Simulation, 'position' | 'elapsed'>) => s.position + s.elapsed * PASS_SPEED;

// The recycle happens far behind the camera. Visuals and sound share this clock,
// so stopping, pausing, or restarting cannot detach the whoosh from the train.
export function passingMetro(s: Pick<Simulation, 'position' | 'elapsed'>) {
 const nose = passDistance(s) % PASS_SPACING - PASS_APPROACH;
 const approach = Math.max(0, Math.min(1, (nose + 170) / 170));
 const tail = Math.max(0, Math.min(1, (PASS_LENGTH + 105 - nose) / 105));
 return { nose, z: nose - 10, visible: nose >= -650 && nose < PASS_LENGTH + 130,
  air: approach * approach * tail * tail,
  light: Math.max(0, 1 - Math.abs(nose + 12) / 85) };
}

export function cabMotion(s: Simulation, control: Control) {
 const speed = Math.min(1, s.speed / MAX_SPEED), load = tractionLoad(s, control);
 const jointPhase = s.position % RAIL_JOINT_M;
 const joint = (Math.exp(-jointPhase * 4) + (jointPhase >= 2.1 ? Math.exp(-(jointPhase - 2.1) * 4) : 0)) * speed;
 const motor = Math.sin(s.elapsed * 32 + s.position * 2.1) * load * Math.min(1, s.speed / 2);
 return {
  x: Math.sin(s.position * .105) * .009 * speed,
  y: Math.sin(s.position * .21) * .009 * speed + joint * .002,
  pitch: -s.acceleration * .0015 + motor * .00013,
  roll: Math.sin(s.position * .105 + .4) * .00085 * speed,
  panel: motor * .0006 + Math.sin(s.position * 2.4) * speed * .0006 + joint * .0007,
 };
}

// Roughly one duty from warm dusk to blue hour; bounded on very slow duties.
export function dutyLight(elapsed: number) {
 const t = Math.max(0, Math.min(1, elapsed / 3000));
 const dusk = t * t * (3 - 2 * t);
 return { dusk, ambient: .95 - dusk * .12, sky: 1.2 - dusk * .2, sun: 2.15 - dusk * .65 };
}
