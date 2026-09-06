import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/three.module.min.js';
import { buildPhone, PHONE, rounded } from '../assets/repair-phone-model.mjs';
import { posePhone } from '../assets/repair-phone-rig.mjs';
import { layers, layerAt, cycleAt, powerAt, assemblyTimeAt, CYCLE_SECONDS } from '../assets/repair-ballet-motion.mjs';
const near=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<tolerance,`${a} should equal ${b}`);
function assembled(){const model=buildPhone();posePhone(model,1);model.phone.updateMatrixWorld(true);return model;}
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
  near(cycleAt(10.4),1);near(cycleAt(14),1);near(cycleAt(0),cycleAt(CYCLE_SECONDS));
  for(let t=0;t<32;t+=.013){assert.ok(cycleAt(t)>=0&&cycleAt(t)<=1);assert.ok(Math.abs(cycleAt(t+.013)-cycleAt(t))<.005);}
});


test('mechanical assemblies settle under the display and ribbons meet their sockets',()=>{
  const model=assembled(),ceiling=bounds(model.front).min.z;
  for(const part of [...model.rig.cameras,...model.rig.modules]) {
    assert.ok(bounds(part.mesh).max.z<ceiling,`${part.mesh.name} must fit under the display`);
    near(part.mesh.rotation.x,0);near(part.mesh.rotation.y,0);near(part.mesh.rotation.z,0);
  }
  for(const flex of model.rig.flexes){
    near(flex.plug.position.x,flex.origin[0]-.31);near(flex.plug.position.z,flex.endRestZ);
    const plugPosition=flex.plug.getWorldPosition(new THREE.Vector3()),socketPosition=flex.socket.getWorldPosition(new THREE.Vector3());
    near(plugPosition.x,socketPosition.x);near(plugPosition.y,socketPosition.y);
    assert.ok(Math.abs(plugPosition.z-socketPosition.z)<.02,'connector must meet its socket');
    const p=flex.geometry.attributes.position;
    near((p.getX(p.count-1)+p.getX(p.count-2))/2,flex.plug.position.x);
    near(p.getZ(p.count-1),flex.plug.position.z);
    assert.ok(bounds(model.groups.battery).max.z<ceiling,'folded ribbon must not protrude through glass');
  }
});
test('mechanical motion can be scrubbed in either direction without drift or invalid ribbon normals',()=>{
  const model=buildPhone();
  const sample=()=>{
    model.phone.updateMatrixWorld(true);
    return [...model.rig.cameras,...model.rig.shields,...model.rig.modules].flatMap(({mesh})=>mesh.matrixWorld.elements)
      .concat(...model.rig.flexes.map(f=>Array.from(f.geometry.attributes.position.array)));
  };
  posePhone(model,.46,3);const first=sample();
  for(const p of [1,0,.75,.12,.97,.46])posePhone(model,p,3);
  assert.deepEqual(sample(),first,'same progress must produce the same complete pose');
  for(let step=0;step<=100;step++){
    posePhone(model,step/100);
    for(const f of model.rig.flexes){
      for(const value of f.geometry.attributes.position.array)assert.ok(Number.isFinite(value));
      const n=f.geometry.attributes.normal;
      for(let i=0;i<n.count;i++)near(Math.hypot(n.getX(i),n.getY(i),n.getZ(i)),1,1e-5);
    }
  }
});
test('two screws tighten sequentially after the display seats',()=>{
  const model=buildPhone();posePhone(model,.94);
  assert.ok(model.screws[0].mesh.position.z<model.screws[1].mesh.position.z);
  assert.ok(model.screws[0].mesh.rotation.z<model.screws[1].mesh.rotation.z);
  posePhone(model,1);
  for(const {mesh} of model.screws){near(mesh.position.z,.004);near(mesh.rotation.z,0);}
});


test('the screen wakes after fastening, with pauses at the connector and closure beats',()=>{
  near(cycleAt(6),cycleAt(6.5));near(cycleAt(8),cycleAt(8.4));
  near(powerAt(10.4),0);near(powerAt(10.8),0);near(powerAt(11.5),1);near(powerAt(14.6),0);
  for(let p=0;p<=1;p+=.01)near(cycleAt(assemblyTimeAt(p)),p,1e-6);
});
