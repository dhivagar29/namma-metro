import { boardingProgress, shouldAnnounce, type Simulation } from './simulation';
import { passDistance, PASS_APPROACH, PASS_SPACING, RAIL_JOINT_M } from './liveliness';
export type AudioEvent = 'door-open' | 'door-warning' | 'door-close' | 'departure' | 'boarding-tick' | 'pa-chime' | 'rail-joint' | 'pass-by';
export function audioEvents(previous: Simulation, next: Simulation, announced: ReadonlySet<number>): AudioEvent[] {
 const events:AudioEvent[]=[];
 if(!previous.doors&&next.doors) events.push('door-open');
 if(previous.closing===0&&next.closing>0) events.push('door-warning');
 if(previous.closing>1.2&&next.closing<=1.2) events.push('door-close');
 if(previous.doors&&!next.doors) events.push('departure');
 if((next.doors&&!next.serviced&&Math.floor(boardingProgress(next.dwell)*4)>Math.floor(boardingProgress(previous.dwell)*4))||next.stops>previous.stops) events.push('boarding-tick');
 if(shouldAnnounce(next)&&!announced.has(next.target)) events.push('pa-chime');
 // Sampled at the audio update rate. Never replay a backlog after a seek/restart.
 const continuous=next.elapsed>previous.elapsed&&next.elapsed-previous.elapsed<=.5;
 if(continuous&&!next.doors&&next.speed>0&&Math.floor(next.position/RAIL_JOINT_M)>Math.floor(previous.position/RAIL_JOINT_M))events.push('rail-joint');
 if(continuous&&Math.floor((passDistance(next)-PASS_APPROACH)/PASS_SPACING)>Math.floor((passDistance(previous)-PASS_APPROACH)/PASS_SPACING))events.push('pass-by');
 return events;
}
