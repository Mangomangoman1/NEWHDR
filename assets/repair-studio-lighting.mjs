import * as THREE from './vendor/three/three.module.min.js';

// A photographic light tent, baked once into a floating-point PMREM. Broad
// diffusion panels describe the glass; narrow stripboxes trace the metal edges.
// These luminous cards never enter the visible scene or incur per-frame draws.
export function createStudioEnvironment(renderer) {
  const studio=new THREE.Scene();studio.background=new THREE.Color(.065,.074,.087);
  const geometry=new THREE.PlaneGeometry(1,1),materials=[];
  const cards=[
    {p:[-4.5,3.8,5.5],size:[3.2,7.0],color:0xf2f5ff,power:4.5},
    {p:[4.8,1.2,3.2],size:[.72,6.5],color:0xdbe9ff,power:5.0},
    {p:[.2,6.0,-.8],size:[5.5,3.0],color:0xffffff,power:3.2},
    {p:[-3.4,.8,-5],size:[1.2,6.0],color:0xffebd4,power:4.3},
    {p:[3.0,-1.4,-5.0],size:[3.8,4.5],color:0xe5edff,power:2.1},
    {p:[-1.0,-5,2],size:[4,2.2],color:0xb6c4dd,power:.8}
  ];
  for(const {p,size,color,power} of cards){
    const material=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(power),side:THREE.DoubleSide,toneMapped:false});materials.push(material);
    const card=new THREE.Mesh(geometry,material);card.position.set(...p);card.scale.set(...size,1);card.lookAt(0,0,0);studio.add(card);
  }
  const generator=new THREE.PMREMGenerator(renderer);
  const environment=generator.fromScene(studio,.018,.1,30,{size:512});
  generator.dispose();geometry.dispose();materials.forEach(m=>m.dispose());
  return environment;
}
