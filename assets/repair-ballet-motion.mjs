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
  // One uninterrupted sweep. The rig supplies the overlapping component beats.
  if(t<10.4)return smooth(0,10.4,t);
  if(t<14)return 1;
  return 1-smooth(14,20,t);
}
export function powerAt(seconds) {
  const t=cycleTime(seconds);
  return smooth(10.8,11.5,t)*(1-smooth(14,14.6,t));
}
export function assemblyTimeAt(progress) {
  if(progress>=1)return 10.4;
  let low=0,high=10.4;
  for(let i=0;i<26;i++){const mid=(low+high)/2;if(cycleAt(mid)<progress)low=mid;else high=mid;}
  return (low+high)/2;
}
export function scrubTimeAt(progress,reverse=false) {
  return reverse?14+6*assemblyTimeAt(1-clamp01(progress))/10.4:progress>=1?11.5:assemblyTimeAt(progress);
}

// A periodic cubic Hermite path: shared tangents carry the camera through each
// waypoint instead of easing to a stop there. Angles are radians, lift/shift are
// scene units, and padding controls the dolly-like orthographic push-in.
const cameraKeys = [
  // time, azimuth, elevation, lift, shift, padding, roll
  [0,     .78,  .24,  .12,  0,    1.28, -.16],
  [2.8,  1.02,  .40,  .38, -.10,  1.15, -.12],
  [5.6,   .12,  .24,  .23, -.06,  1.12, -.08],
  [8,    -.38, -.10, -.22,  .04,  1.13, -.10],
  [10.8,  0,    .025, 0,    0,    1.22, -.08],
  [13,    .045, .045, .02,  0,    1.23, -.07],
  [15.4, -.56,  .24,  .20,  .08,  1.17, -.10],
  [17.3, -.86,  .34,  .34,  .10,  1.18, -.14]
];
export function cameraAt(seconds) {
  const t=cycleTime(seconds),count=cameraKeys.length;
  const key=i=>{
    const value=cameraKeys[(i%count+count)%count];
    return [value[0]+Math.floor(i/count)*CYCLE_SECONDS,...value.slice(1)];
  };
  let i=0;while(i<count-1&&t>=cameraKeys[i+1][0])i++;
  const a=key(i-1),b=key(i),c=key(i+1),d=key(i+2);
  const span=c[0]-b[0],u=(t-b[0])/span,u2=u*u,u3=u2*u;
  const values=b.slice(1).map((value,j)=>{
    const n=j+1,m0=(c[n]-a[n])/(c[0]-a[0]),m1=(d[n]-b[n])/(d[0]-b[0]);
    return (2*u3-3*u2+1)*value+(u3-2*u2+u)*span*m0+(-2*u3+3*u2)*c[n]+(u3-u2)*span*m1;
  });
  const [azimuth,elevation,lift,shift,padding,roll]=values;
  return {azimuth,elevation,lift,shift,padding,roll};
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
