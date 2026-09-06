/* Pure, deterministic choreography shared by the scene and its tests. */
export const CYCLE_SECONDS = 20;
export const clamp01 = value => Math.max(0, Math.min(1, value));
export function smooth(start, end, value) {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
const cycleTime=seconds=>((seconds%CYCLE_SECONDS)+CYCLE_SECONDS)%CYCLE_SECONDS;
export function cycleAt(seconds) {
  const t=cycleTime(seconds);
  if(t<2)return 0;
  if(t<6)return .62*smooth(2,6,t);
  if(t<6.5)return .62;
  if(t<8)return .62+.24*smooth(6.5,8,t);
  if(t<8.4)return .86;
  if(t<10.4)return .86+.14*smooth(8.4,10.4,t);
  if(t<14)return 1;
  return 1-smooth(14,20,t);
}
export function powerAt(seconds) {
  const t=cycleTime(seconds);
  return smooth(10.8,11.5,t)*(1-smooth(14,14.6,t));
}
export function assemblyTimeAt(progress) {
  if(progress>=1)return 10.4;
  let low=2,high=10.4;
  for(let i=0;i<26;i++){const mid=(low+high)/2;if(cycleAt(mid)<progress)low=mid;else high=mid;}
  return (low+high)/2;
}
export const layers = [
  { id:'housing', rest:0, spread:0, start:0, end:.45 },
  { id:'board', rest:-.020, spread:1.0, start:.05, end:.48 },
  { id:'battery', rest:0, spread:1.8, start:.18, end:.65 },
  { id:'frame', rest:.094, spread:2.45, start:.32, end:.79 },
  { id:'display', rest:.1125, spread:3.15, start:.43, end:.91 },
  { id:'backglass', rest:-.11475, spread:-.65, start:.10, end:.72 }
];
export function layerAt(layer, progress) {
  const seated = smooth(layer.start, layer.end, clamp01(progress));
  return { z:layer.rest + layer.spread * (1 - seated), open:1-seated };
}
export function phaseAt(progress) {
  if (progress < .08) return 'Every part has its place';
  if (progress < .48) return 'Finding their way home';
  if (progress < .91) return 'Coming together';
  if (progress < .99) return 'The finishing touch';
  return 'Good as new';
}
