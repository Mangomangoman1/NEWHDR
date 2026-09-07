import * as THREE from './vendor/three/three.module.min.js';
import { cameraAt, CYCLE_SECONDS } from './repair-ballet-motion.mjs';

// Both views orbit at 14 units and zoom through FOV. Avoid wasting the depth
// buffer on space beside the lens: the laminated display needs this precision.
export function createPhoneCamera() {return new THREE.PerspectiveCamera(30,1,1,40);}

// Project cached geometry bounds, rather than vertices, to keep the complete
// moving assembly in shot at every viewport shape and during a manual turn.
export function createBalletView(model,camera) {
  const pieces=[];
  const flexible=new Set(model.rig.flexes.flatMap(f=>[f.geometry,f.traces]));
  model.phone.traverse(object=>{
    if(!object.geometry)return;
    if(object.isInstancedMesh)object.computeBoundingBox();else object.geometry.computeBoundingBox();
    pieces.push({object,box:object.isInstancedMesh?object.boundingBox:object.geometry.boundingBox,dynamic:flexible.has(object.geometry)});
  });
  const target=new THREE.Vector3(),offset=new THREE.Vector3(),corner=new THREE.Vector3();
  const matrix=new THREE.Matrix4(),rotation=new THREE.Matrix4();
  return {
    update(seconds,progress,aspect,angle=0,view={x:0,y:0}) {
      const pose=cameraAt(seconds),phone=model.phone;
      phone.rotation.set(view.y*.045,angle+view.x*.07,pose.roll+view.x*.02);
      // This drift is periodic too, so the loop has no hidden position jump.
      phone.position.y=Math.sin(seconds/CYCLE_SECONDS*Math.PI*2)*.025;
      target.set(0,0,(1-progress)*1.22).applyQuaternion(phone.quaternion);
      target.x+=pose.shift;target.y+=pose.lift+phone.position.y;
      offset.setFromSphericalCoords(14,Math.PI/2-pose.elevation,pose.azimuth);
      camera.position.copy(target).add(offset);camera.lookAt(target);
      rotation.makeRotationFromQuaternion(camera.quaternion).invert();
      phone.updateMatrixWorld(true);
      let extentX=0,extentY=0;
      for(const {object,box,dynamic} of pieces){
        if(dynamic)object.geometry.computeBoundingBox();
        matrix.copy(object.matrixWorld);
        matrix.elements[12]-=target.x;matrix.elements[13]-=target.y;matrix.elements[14]-=target.z;
        matrix.premultiply(rotation);
        for(let i=0;i<8;i++){
          corner.set(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).applyMatrix4(matrix);
          const perspective=camera.isPerspectiveCamera?14/Math.max(.1,14-corner.z):1;
          extentX=Math.max(extentX,Math.abs(corner.x)*perspective);extentY=Math.max(extentY,Math.abs(corner.y)*perspective);
        }
      }
      const width=extentX/aspect;
      // Smooth max avoids a lens-speed kink when horizontal fitting takes over
      // on a narrow screen. Padding varies independently along the camera path.
      const fit=Math.max(width,extentY)+Math.log1p(Math.exp(-12*Math.abs(width-extentY)))/12;
      const halfHeight=fit*pose.padding;
      if(camera.isPerspectiveCamera){camera.aspect=aspect;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(halfHeight/14));}
      else{camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;}
      camera.updateProjectionMatrix();
      return target;
    }
  };
}
