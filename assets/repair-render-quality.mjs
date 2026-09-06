// One-way reductions avoid oscillating quality. Samples only come from active
// animation, excluding navigation, pauses, and background-tab stalls.
export function createQualityGovernor(maxRatio=2) {
  let ratio=Math.min(2,Math.max(1,maxRatio)),shadows=true,count=0,total=0,cooldown=12;
  return {
    get current(){return {pixelRatio:ratio,shadows};},
    sample(ms){
      if(ms<4||ms>120)return null;
      if(cooldown>0){cooldown--;return null;}
      total+=ms;count++;
      if(count<60)return null;
      const average=total/count;count=0;total=0;
      if(average<28)return null;
      if(ratio>1){ratio=Math.max(1,Math.round(ratio*.8*100)/100);}
      else if(shadows&&average>34){shadows=false;}
      else return null;
      cooldown=120;return {pixelRatio:ratio,shadows};
    },
    resetSamples(){count=0;total=0;cooldown=12;}
  };
}
