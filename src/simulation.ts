import { stations, stationPosition } from './routes';
export type Control = 'power' | 'coast' | 'brake' | 'emergency';
export type Simulation = { position: number; speed: number; acceleration: number; target: number; doors: boolean; closing: number; dwell: number; serviced: boolean; stops: number; passengers: number; elapsed: number; complete: boolean; atp: boolean };
export const DWELL = 5;
export const DOOR_CLOSE_TIME = 2.5;
export const STOP_TOLERANCE = 8;
export const MAX_SPEED = 80 / 3.6;
export const initialState = (): Simulation => ({ position: 0, speed: 0, acceleration: 0, target: 0, doors: true, closing: 0, dwell: 0, serviced: false, stops: 0, passengers: 0, elapsed: 0, complete: false, atp: false });
export const distanceToStop = (s: Simulation) => stationPosition(s.target) - s.position;
export const inZone = (s: Simulation) => Math.abs(distanceToStop(s)) <= STOP_TOLERANCE && s.speed === 0;
export const shouldAnnounce = (s: Simulation) => !s.doors && s.closing === 0 && !s.serviced && s.target > 0 && distanceToStop(s) <= 560 && distanceToStop(s) > STOP_TOLERANCE;
export function toggleDoors(s: Simulation): Simulation {
 if (s.complete || s.closing > 0) return s;
 if (s.doors) return s.serviced ? { ...s, closing: DOOR_CLOSE_TIME } : s;
 return inZone(s) ? { ...s, doors: true, dwell: 0, acceleration: 0, atp: false } : s;
}
// Fixed time steps, physical metres, no position correction or station teleport.
export function step(s: Simulation, control: Control, dt: number): Simulation {
 if (s.complete || dt <= 0 || !Number.isFinite(dt)) return s;
 dt = Math.min(dt, .05);
 const next = { ...s, elapsed: s.elapsed + dt };
 if (s.closing > 0) {
  next.speed = 0; next.acceleration = 0; next.closing = Math.max(0, s.closing - dt);
  if (next.closing === 0) { next.doors = false; next.target++; next.serviced = false; next.dwell = 0; }
  return next;
 }
 if (s.doors) {
  next.speed = 0; next.acceleration = 0; next.dwell = Math.min(DWELL, s.dwell + dt);
  if (!s.serviced && next.dwell >= DWELL) {
   next.serviced = true; next.stops++; next.passengers += 24 + (s.target * 13) % 43;
   next.complete = s.target === stations.length - 1;
  }
  return next;
 }
 const distance = distanceToStop(s);
 // ATP latches throughout the approach. A conservative envelope leaves space for
 // service-brake ramp-up; the 3 m aim point sits inside the forgiving 8 m berth.
 const envelope = Math.sqrt(2 * .95 * Math.max(0, distance - 4));
 next.atp = (s.atp && s.speed > 0) || s.speed > envelope || (distance <= 4.1 && control === 'power');
 const desired = control === 'emergency' ? -2.6 : next.atp ? -Math.min(1.5, Math.max(.12, s.speed ** 2 / (2 * Math.max(.3, distance - 3)))) : control === 'brake' ? -1.2 : control === 'power' ? .92 - s.speed * .006 : -.055 - s.speed * .001;
 // Emergency and ATP act immediately; manual traction/service braking ramp up.
 const jerk = 1.25 * dt;
 const previousAcceleration = control === 'brake' ? Math.min(0, s.acceleration) : s.acceleration;
 next.acceleration = next.atp || control === 'emergency' || control === 'coast' ? desired : previousAcceleration + Math.max(-jerk, Math.min(jerk, desired - previousAcceleration));
 next.speed = Math.max(0, Math.min(MAX_SPEED, s.speed + next.acceleration * dt));
 if (next.speed === 0) next.acceleration = 0;
 next.position += (s.speed + next.speed) * .5 * dt;
 return next;
}
