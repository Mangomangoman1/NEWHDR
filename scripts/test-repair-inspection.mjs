import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/three.module.min.js';
import {buildPhone} from '../assets/repair-phone-model.mjs';
import {posePhone} from '../assets/repair-phone-rig.mjs';
import {createInspectionView} from '../assets/repair-inspection-view.mjs';
import {createQualityGovernor} from '../assets/repair-render-quality.mjs';

function setup(){const model=buildPhone(),camera=new THREE.PerspectiveCamera(30,1,.1,80);posePhone(model,0);return {model,camera,view:createInspectionView(model,camera)};}
function visibleMeshes(model){const meshes=[];model.phone.traverse(o=>{if(o.isMesh&&o.visible)meshes.push(o);});return meshes;}

test('each isolated part fits the initial inspection frame in portrait and landscape',()=>{
  const {model,camera,view}=setup();view.open();
  for(const id of ['all','display','battery','cameras','board','haptic','backglass','speakers','loudspeaker','charging','truedepth'])for(const aspect of [.65,1.7]){
    view.select(id);view.update(aspect,1/60,true);camera.updateMatrixWorld();
    const box=new THREE.Box3();for(const mesh of visibleMeshes(model))box.union(new THREE.Box3().setFromObject(mesh));
    for(let i=0;i<8;i++){
      const point=new THREE.Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).project(camera);
      assert.ok(Math.abs(point.x)<=1.001&&Math.abs(point.y)<=1.001,`${id} should fit at aspect ${aspect}`);
    }
  }
});
test('closing inspection restores every model mesh after isolating components',()=>{
  const {model,view}=setup();const original=visibleMeshes(model).length;view.open();view.select('haptic');
  assert.ok(visibleMeshes(model).length<original/4);view.close();assert.equal(visibleMeshes(model).length,original);
});
test('orbit and zoom remain finite at their limits and converge when released',()=>{
  const {camera,view}=setup();view.open();view.update(1,1/60,true);view.rotate(200,200);view.zoom(.00001);
  for(let i=0;i<160;i++)view.update(1,1/60);
  assert.equal(view.moving,false);assert.ok(camera.position.toArray().every(Number.isFinite));assert.ok(camera.fov>0&&camera.fov<100);
});
test('quality remains unchanged at normal frame rates or after background stalls',()=>{
  const governor=createQualityGovernor(2);
  for(let i=0;i<500;i++)assert.equal(governor.sample(16.7),null);
  for(let i=0;i<100;i++)assert.equal(governor.sample(500),null);
  assert.deepEqual(governor.current,{pixelRatio:2,shadows:true});
});
test('sustained slow rendering reduces resolution with a cooldown before dropping shadows',()=>{
  const governor=createQualityGovernor(2);let first=null;
  for(let i=0;i<72;i++)first=governor.sample(40)||first;
  assert.deepEqual(first,{pixelRatio:1.6,shadows:true});
  for(let i=0;i<120;i++)assert.equal(governor.sample(40),null);
  for(let i=0;i<1000;i++)governor.sample(40);
  assert.deepEqual(governor.current,{pixelRatio:1,shadows:false});
  governor.resetSamples();for(let i=0;i<200;i++)governor.sample(16.7);
  assert.equal(governor.current.pixelRatio,1,'quality must not oscillate');
});


test('late-added decorative lines follow component isolation',()=>{
  const {model,view}=setup();
  const cracks=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial());model.groups.display.add(cracks);
  view.open();view.select('battery');assert.equal(cracks.visible,false);
  view.select('display');assert.equal(cracks.visible,true);
});


test('panning enables inspection after zooming and reset restores the original framing',()=>{
  const {camera,view}=setup();view.open();view.update(1,1/60,true);const start=camera.position.clone();
  view.pan(.2,.15);view.update(1,1/60,true);assert.ok(camera.position.distanceTo(start)>.1);
  view.reset();view.update(1,1/60,true);assert.ok(camera.position.distanceTo(start)<1e-6);
});
