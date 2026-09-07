import * as THREE from './vendor/three/three.module.min.js';

// Seeded, tileable microstructure, generated once. Values remain in linear data
// space; the sub-millimetre bump amplitudes are expressed in model scene units.
function finishMap(kind='grain',anisotropy=1) {
  const size=256,data=new Uint8Array(size*size*4);let seed=9137;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const grain=Array.from({length:size},()=>random());
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let noise=kind==='brushed'?grain[x]*.9+random()*.1:random();
    if(kind==='foil')noise=.50+.12*Math.sin(x*.25+Math.sin(y*.049)*2)+.10*Math.sin(y*.46+x*.09)+random()*.14;
    const value=Math.round(185+noise*69),at=(y*size+x)*4;
    data[at]=data[at+1]=data[at+2]=value;data[at+3]=255;
  }
  const map=new THREE.DataTexture(data,size,size);map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.anisotropy=Math.min(8,anisotropy);map.needsUpdate=true;return map;
}
export function finishPhone(model,anisotropy=1) {
  const brushed=finishMap('brushed',anisotropy),grain=finishMap('grain',anisotropy),foil=finishMap('foil',anisotropy);
  brushed.repeat.set(6,6);grain.repeat.set(4,4);
  for(const id of ['titanium','edge','shield','nickel']){
    const material=model.materials[id];material.roughnessMap=brushed;material.bumpMap=brushed;material.bumpScale=id==='shield'?.00025:.00012;
  }
  const matte=model.materials.glassBack;matte.roughness=.54;matte.roughnessMap=grain;matte.bumpMap=grain;matte.bumpScale=.00018;
  model.materials.pcb.roughnessMap=grain;
  model.phone.traverse(object=>{
    if(!object.isMesh)return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    object.castShadow=materials.every(m=>!m.transparent&&!m.transmission);object.receiveShadow=true;
    if(object.name==='battery foil'){
      object.material.roughness=.48;object.material.metalness=.12;object.material.roughnessMap=foil;object.material.bumpMap=foil;object.material.bumpScale=.0009;
    }
  });
  return ()=>{brushed.dispose();grain.dispose();foil.dispose();};
}
