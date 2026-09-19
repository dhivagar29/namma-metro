import { shouldAnnounce, type Simulation } from './simulation';
export type AudioEvent = 'door-open' | 'door-warning' | 'door-close' | 'departure' | 'boarding-tick' | 'pa-chime';
export function audioEvents(previous: Simulation, next: Simulation, announced: ReadonlySet<number>): AudioEvent[] {
 const events:AudioEvent[]=[];
 if(!previous.doors&&next.doors) events.push('door-open');
 if(previous.closing===0&&next.closing>0) events.push('door-warning');
 if(previous.closing>1.2&&next.closing<=1.2) events.push('door-close');
 if(previous.doors&&!next.doors) events.push('departure');
 if((next.doors&&!next.serviced&&Math.floor(next.dwell)>Math.floor(previous.dwell))||next.stops>previous.stops) events.push('boarding-tick');
 if(shouldAnnounce(next)&&!announced.has(next.target)) events.push('pa-chime');
 return events;
}
