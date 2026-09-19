import { stations, stationPosition } from './routes';
export type Control = 'power' | 'coast' | 'brake' | 'emergency';
export type Simulation = { position: number; speed: number; target: number; doors: boolean; dwell: number; serviced: boolean; stops: number; passengers: number; elapsed: number; complete: boolean; atp: boolean };
export const DWELL = 5;
export const initialState = (): Simulation => ({ position: 0, speed: 0, target: 0, doors: true, dwell: 0, serviced: false, stops: 0, passengers: 0, elapsed: 0, complete: false, atp: false });
export const distanceToStop = (s: Simulation) => stationPosition(s.target) - s.position;
export const inZone = (s: Simulation) => Math.abs(distanceToStop(s)) <= 8 && s.speed === 0;
export function toggleDoors(s: Simulation): Simulation {
 if (s.complete) return s;
 if (s.doors) {
  if (!s.serviced) return s;
  return { ...s, doors: false, target: s.target + 1, serviced: false, dwell: 0 };
 }
 return inZone(s) ? { ...s, doors: true, dwell: 0 } : s;
}
// Fixed small steps; position is metres and speed is metres/second. ATP's
// braking envelope prevents passing an unserved stop, without teleportation.
export function step(s: Simulation, control: Control, dt: number): Simulation {
 if (s.complete || dt <= 0) return s;
 dt = Math.min(dt, .05);
 const next = { ...s, elapsed: s.elapsed + dt };
 if (s.doors) {
  next.speed = 0;
  next.dwell = Math.min(DWELL, s.dwell + dt);
  if (!s.serviced && next.dwell >= DWELL) {
   next.serviced = true; next.stops++; next.passengers += 24 + (s.target * 13) % 43;
   next.complete = s.target === stations.length - 1;
  }
  return next;
 }
 const distance = Math.max(0, distanceToStop(s));
 const envelope = Math.sqrt(2 * 1.05 * Math.max(0, distance - 2));
 next.atp = s.speed > envelope || (distance <= 2.1 && control === 'power');
 const acceleration = control === 'emergency' ? -2.6 : next.atp ? -1.5 : control === 'brake' ? -1.2 : control === 'power' ? .85 : -.055;
 next.speed = Math.max(0, Math.min(80 / 3.6, s.speed + acceleration * dt));
 next.position += (s.speed + next.speed) * .5 * dt;
 return next;
}
