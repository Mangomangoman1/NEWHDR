import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/three.module.min.js';
import {buildPhone} from '../assets/repair-phone-model.mjs';
import {posePhone} from '../assets/repair-phone-rig.mjs';
import {createBalletView} from '../assets/repair-ballet-view.mjs';
import {cameraAt,cycleAt,powerAt,scrubTimeAt,CYCLE_SECONDS} from '../assets/repair-ballet-motion.mjs';

test('camera position and velocity flow continuously through the path and loop seam',()=>{
  const h=.0001;
  for(let t=0;t<=CYCLE_SECONDS;t+=.01){
    const before=cameraAt(t-h),at=cameraAt(t),after=cameraAt(t+h);
    for(const key of Object.keys(at)){
      assert.ok(Number.isFinite(at[key]));
      const incoming=(at[key]-before[key])/h,outgoing=(after[key]-at[key])/h;
      assert.ok(Math.abs(incoming-outgoing)<.001,`${key} velocity jumps at ${t}`);
    }
  }
  assert.deepEqual(cameraAt(0),cameraAt(CYCLE_SECONDS));
});

test('camera visits both sides, changes elevation and pushes in, then presents the lit screen',()=>{
  const poses=Array.from({length:201},(_,i)=>cameraAt(i/10));
  assert.ok(Math.max(...poses.map(p=>p.azimuth))>.9);
  assert.ok(Math.min(...poses.map(p=>p.azimuth))<-.8);
  assert.ok(Math.max(...poses.map(p=>p.elevation))>.35);
  assert.ok(Math.min(...poses.map(p=>p.elevation))<-.09);
  assert.ok(Math.max(...poses.map(p=>p.padding))-Math.min(...poses.map(p=>p.padding))>.15);
  for(let t=10.8;t<14;t+=.05){
    const pose=cameraAt(t);
    assert.ok(Math.abs(pose.azimuth)<.25&&Math.abs(pose.elevation)<.2,'screen wake must face the viewer');
    assert.equal(cycleAt(t),1);
    if(t>=11.5)assert.equal(powerAt(t),1);
  }
});

test('moving components stay in shot throughout the cycle on desktop and narrow phones',()=>{
  const model=buildPhone(),camera=new THREE.PerspectiveCamera(30,1,.1,80),view=createBalletView(model,camera);
  const corner=new THREE.Vector3(),pieces=[];
  model.phone.traverse(o=>{if(o.geometry)pieces.push(o);});
  for(const aspect of [.65,.84,1.05,1.7,2.1])for(const angle of [0,Math.PI/2,Math.PI])for(let t=0;t<=20;t+=.2){
    const p=cycleAt(t);posePhone(model,p,t);view.update(t,p,aspect,angle,{x:1,y:-1});camera.updateMatrixWorld(true);
    for(const mesh of pieces){
      if(mesh.isInstancedMesh)mesh.computeBoundingBox();else mesh.geometry.computeBoundingBox();const b=mesh.isInstancedMesh?mesh.boundingBox:mesh.geometry.boundingBox;
      for(let i=0;i<8;i++){
        corner.set(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).applyMatrix4(mesh.matrixWorld).project(camera);
        assert.ok(Math.abs(corner.x)<.92&&Math.abs(corner.y)<.92,`${mesh.name} clipped at ${t}, aspect ${aspect}, turn ${angle}`);
      }
    }
  }
});

test('a paused camera is deterministic after arbitrary seeks or inspection changes',()=>{
  const model=buildPhone(),camera=new THREE.PerspectiveCamera(30,1,.1,80),view=createBalletView(model,camera);
  const draw=t=>{posePhone(model,cycleAt(t),t);view.update(t,cycleAt(t),.84);camera.updateMatrixWorld(true);return [...camera.matrixWorld.elements,...camera.projectionMatrix.elements];};
  const before=draw(4.5);draw(19);camera.position.set(-20,3,4);model.phone.rotation.set(1,2,3);
  assert.deepEqual(draw(4.5),before);
});

test('scrubbing preserves either leg including endpoints, and resumes at matching progress',()=>{
  for(const reverse of [false,true])for(const p of [0,.01,.2,.62,.86,.99,1,0,.25]){
    const time=scrubTimeAt(p,reverse);
    assert.ok(Math.abs(cycleAt(time)-p)<1e-6);
    assert.equal(time>=14,reverse);
  }
});
