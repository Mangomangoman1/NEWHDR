import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/three.module.min.js';
import { buildPhone, PHONE, rounded } from '../assets/repair-phone-model.mjs';
import { layers, layerAt, cycleAt, CYCLE_SECONDS } from '../assets/repair-ballet-motion.mjs';
const near=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<tolerance,`${a} should equal ${b}`);
function assembled(){const model=buildPhone();for(const l of layers)model.groups[l.id].position.z=layerAt(l,1).z;model.phone.updateMatrixWorld(true);return model;}
const bounds=object=>new THREE.Box3().setFromObject(object);

test('beveled enclosure retains the published 77.6 × 163 mm proportions',()=>{
  const {chassis}=assembled();const size=bounds(chassis).getSize(new THREE.Vector3());
  near(size.x,77.6*.03);near(size.y,163*.03);
  const geometry=rounded(2,4,.02,.3);geometry.computeBoundingBox();near(geometry.boundingBox.max.z-geometry.boundingBox.min.z,.02);
});
test('front and rear glass close into one 8.25 mm body, with internals below the display',()=>{
  const model=assembled();const front=bounds(model.front),rear=bounds(model.rear),rail=bounds(model.chassis);
  assert.ok(front.max.z-rear.min.z<=PHONE.depth+1e-6);
  assert.ok(front.min.z<rail.max.z,'front glass seats within the rail');
  assert.ok(rear.max.z>rail.min.z,'rear glass seats within the rail');
  for(const id of ['board','battery','frame']){const box=bounds(model.groups[id]);assert.ok(box.max.z<front.min.z,`${id} must fit underneath display`);assert.ok(box.min.z>rear.max.z,`${id} must fit above rear glass`);}
});
test('only two fastening screws, mounted at the bottom edge',()=>{
  const model=assembled();assert.equal(model.screws.length,2);
  for(const {mesh} of model.screws){const world=mesh.getWorldPosition(new THREE.Vector3());near(world.y,-PHONE.height/2-.005);near(Math.abs(world.x),.30);}
});
test('lock-screen texture spans normalized UV coordinates',()=>{
  const model=buildPhone({screenUI:new THREE.MeshBasicMaterial()});const ui=model.phone.getObjectByName('lock screen');const uv=ui.geometry.attributes.uv;
  for(let i=0;i<uv.count;i++){assert.ok(uv.getX(i)>=-1e-7&&uv.getX(i)<=1+1e-7);assert.ok(uv.getY(i)>=-1e-7&&uv.getY(i)<=1+1e-7);}
});
test('every component reaches its exact seated position with a continuous repeat',()=>{
  for(const l of layers){near(layerAt(l,1).z,l.rest);near(layerAt(l,1).open,0);near(layerAt(l,0).z,l.rest+l.spread);}
  near(cycleAt(8),1);near(cycleAt(11),1);near(cycleAt(0),cycleAt(CYCLE_SECONDS));
  for(let t=0;t<32;t+=.013){assert.ok(cycleAt(t)>=0&&cycleAt(t)<=1);assert.ok(Math.abs(cycleAt(t+.013)-cycleAt(t))<.005);}
});
