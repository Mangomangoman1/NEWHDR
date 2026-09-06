import * as THREE from './vendor/three/three.module.min.js';

// Seeded, tileable microstructure; no downloads and no per-frame noise work.
function finishMap(brushed=false) {
  const size=256,data=new Uint8Array(size*size*4);let seed=9137;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const grain=Array.from({length:size},()=>random());
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const noise=brushed?grain[x]*.82+random()*.18:random();
    const value=Math.round(210+noise*43),at=(y*size+x)*4;
    data[at]=data[at+1]=data[at+2]=value;data[at+3]=255;
  }
  const map=new THREE.DataTexture(data,size,size);map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.needsUpdate=true;return map;
}
export function finishPhone(model) {
  const brushed=finishMap(true),grain=finishMap();
  for(const id of ['titanium','edge','shield']){
    const material=model.materials[id];material.roughnessMap=brushed;material.bumpMap=brushed;material.bumpScale=.005;
  }
  const matte=model.materials.glassBack;matte.roughness=.57;matte.roughnessMap=grain;matte.bumpMap=grain;matte.bumpScale=.003;
  model.phone.traverse(object=>{
    if(!object.isMesh)return;
    object.castShadow=!object.material.transparent;object.receiveShadow=true;
    if(object.name==='battery foil'||object.name==='battery label'){
      object.material.roughness=.44;object.material.roughnessMap=grain;object.material.bumpMap=grain;object.material.bumpScale=.012;
    }
  });
  return ()=>{brushed.dispose();grain.dispose();};
}
