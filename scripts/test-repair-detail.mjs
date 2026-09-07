import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/three.module.min.js';
import {buildPhone,PHONE} from '../assets/repair-phone-model.mjs';
import {posePhone} from '../assets/repair-phone-rig.mjs';
import {finishPhone} from '../assets/repair-phone-surfaces.mjs';
const bounds=object=>new THREE.Box3().setFromObject(object);

test('additional service hardware seats inside the front glass and enclosure width',()=>{
  const model=buildPhone();posePhone(model,1);model.phone.updateMatrixWorld(true);
  const ceiling=bounds(model.front).min.z;
  for(const {mesh,rest} of model.rig.details){
    assert.ok(mesh.position.distanceTo(rest)<1e-9,mesh.name+' must seat exactly');
    assert.deepEqual(mesh.rotation.toArray().slice(0,3),[0,0,0]);
    const b=bounds(mesh);assert.ok(b.max.z<ceiling,mesh.name+' protrudes through display');
    assert.ok(b.min.x>-PHONE.width/2&&b.max.x<PHONE.width/2,mesh.name+' protrudes through rail');
  }
});

test('three optical modules and integrated LiDAR remain one service assembly',()=>{
  const model=buildPhone(),carrier=model.rig.cameraAssembly;
  assert.equal(model.rig.cameras.length,3);
  assert.deepEqual(model.rig.cameras.map(p=>p.mesh.name),['ultrawide camera','main camera','telephoto camera']);
  assert.ok(carrier.getObjectByName('integrated LiDAR module'));
  for(const {mesh} of model.rig.cameras)assert.equal(mesh.parent,carrier);
  for(const progress of [0,.2,.4,1]){
    posePhone(model,progress);for(const {mesh,x,y} of model.rig.cameras){assert.equal(mesh.position.x,x);assert.equal(mesh.position.y,y);assert.equal(mesh.position.z,0);}
  }
  assert.equal(carrier.position.length(),0);
});

test('glass transmits light, coatings are dielectric, and transparent surfaces do not cast opaque shadows',()=>{
  const model=buildPhone(),dispose=finishPhone(model);
  let windows=0;
  model.phone.traverse(object=>{
    if(!object.isMesh)return;
    const material=object.material;
    if(material.transmission){windows++;assert.equal(material.metalness,0);assert.equal(object.castShadow,false);assert.equal(material.depthWrite,false);}
    if(object.name==='curved coated lens'){assert.ok(material.iridescence>0);assert.equal(material.metalness,0);}
  });
  assert.equal(windows,4,'one front glass and three sapphire windows');
  assert.ok(model.materials.titanium.bumpScale<.0002);
  assert.ok(model.materials.glassBack.bumpScale<.0003);
  dispose();
});

test('microgeometry has finite bounds and uses instancing within the triangle budget',()=>{
  const model=buildPhone();posePhone(model,0);model.phone.updateMatrixWorld(true);
  let placements=0,triangles=0;
  model.phone.traverse(object=>{
    if(!object.geometry)return;
    const count=object.isInstancedMesh?object.count:1;
    placements+=count;triangles+=(object.geometry.index?.count||object.geometry.attributes.position.count)/3*count;
    const b=bounds(object);assert.ok([...b.min.toArray(),...b.max.toArray()].every(Number.isFinite),object.name);
  });
  assert.ok(placements>2500);
  assert.ok(triangles<1000000,'small parts must use appropriate tessellation');
  assert.ok(model.phone.getObjectByName('ceramic capacitors and resistors').isInstancedMesh);
});
