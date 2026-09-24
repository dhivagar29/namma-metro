import { groundHeight, isEnclosed, VIEW_AHEAD_M, VIEW_BEHIND_M } from './corridor';
import { totalLengthM } from './routes';

export const TRAFFIC_COUNT = 24;
export const TRAFFIC_INSTANCES = TRAFFIC_COUNT * 6;
const WINDOW_M = VIEW_AHEAD_M + VIEW_BEHIND_M;
// Four lanes, six vehicles each. Slots wrap outside the fog/behind the cab and
// never accumulate with route length. All positions follow the existing roads.
export function trafficPose(slot: number, position: number, elapsed: number) {
 const lane = slot % 4, direction = lane % 2 ? -1 : 1;
 const speed = 7 + lane * .7 + (slot % 3) * .65;
 const travel = Math.floor(slot / 4) * 160 + lane * 37 + elapsed * speed * direction;
 const start = position - VIEW_BEHIND_M;
 const distance = start + ((travel - start) % WINDOW_M + WINDOW_M) % WINDOW_M;
 const visible = distance >= -VIEW_BEHIND_M && distance <= totalLengthM + VIEW_BEHIND_M && !isEnclosed(distance);
 return { distance, x: [12.3,15.7,-16.3,-19.7][lane], y: groundHeight(distance), direction, visible };
}
