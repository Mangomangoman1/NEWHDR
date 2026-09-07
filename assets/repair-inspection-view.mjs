import * as THREE from './vendor/three/three.module.min.js';

export function createInspectionView(model,camera) {
  const parts={all:[model.phone],display:[model.groups.display],battery:[model.groups.battery],cameras:[model.rig.cameraAssembly,...model.rig.lensCovers],board:[model.groups.board],haptic:[model.rig.modules[0].mesh],backglass:[model.groups.backglass],speakers:[model.detailParts.speakers[0]],loudspeaker:[model.detailParts.speakers[1]],charging:[model.detailParts.dock,model.detailParts.microphone,model.phone.getObjectByName('USB-C socket body')],truedepth:[model.rig.modules[2].mesh]};
  const renderables=[];
  function refresh(){renderables.length=0;model.phone.traverse(object=>{if(object.isMesh||object.isLine)renderables.push(object);});}
  refresh();
  const bounds=new THREE.Box3(),partBox=new THREE.Box3(),center=new THREE.Vector3(),smoothedCenter=new THREE.Vector3(),corner=new THREE.Vector3(),inverse=new THREE.Quaternion(),offset=new THREE.Vector3();
  const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),pan=new THREE.Vector3(),framingCenter=new THREE.Vector3(),axis=new THREE.Vector3();
  let selected='all',theta=.55,phi=1.20,targetTheta=theta,targetPhi=phi,zoom=1,halfHeight=3.6,moving=false,snap=true;
  function belongs(object,roots){for(let parent=object;parent;parent=parent.parent)if(roots.includes(parent))return true;return false;}
  function show(id){selected=parts[id]?id:'all';for(const object of renderables)object.visible=selected==='all'||belongs(object,parts[selected]);}
  function reset(){targetTheta=selected==='backglass'||selected==='cameras'?Math.PI+.38:.55;targetPhi=1.20;zoom=1;pan.set(0,0,0);moving=true;}
  return {
    get moving(){return moving;},
    get selected(){return selected;},
    open(){refresh();show('all');theta=targetTheta=.55;phi=targetPhi=1.20;zoom=1;pan.set(0,0,0);snap=true;moving=true;},
    close(){show('all');moving=false;},
    select(id){show(id);reset();},
    reset,
    rotate(dx,dy){targetTheta-=dx;targetPhi=THREE.MathUtils.clamp(targetPhi-dy,.13,Math.PI-.13);moving=true;},
    pan(dx,dy){
      axis.set(1,0,0).applyQuaternion(camera.quaternion);pan.addScaledVector(axis,-dx*halfHeight*2);
      axis.set(0,1,0).applyQuaternion(camera.quaternion);pan.addScaledVector(axis,dy*halfHeight*2);pan.clampLength(0,8);moving=true;
    },
    zoom(factor){zoom=THREE.MathUtils.clamp(zoom*factor,.45,2.1);moving=true;},
    update(aspect,delta=1/60,reduced=false){
      model.phone.updateMatrixWorld(true);bounds.makeEmpty();for(const root of parts[selected])bounds.union(partBox.setFromObject(root));bounds.getCenter(framingCenter);center.copy(framingCenter).add(pan);
      const follow=snap||reduced?1:1-Math.exp(-delta*9);
      theta+=(targetTheta-theta)*follow;phi+=(targetPhi-phi)*follow;smoothedCenter.lerp(center,follow);
      offset.setFromSphericalCoords(14,phi,theta);camera.position.copy(smoothedCenter).add(offset);camera.lookAt(smoothedCenter);
      inverse.copy(camera.quaternion).invert();let fit=.25;
      for(let i=0;i<8;i++){
        corner.set(i&1?bounds.max.x:bounds.min.x,i&2?bounds.max.y:bounds.min.y,i&4?bounds.max.z:bounds.min.z).sub(framingCenter).applyQuaternion(inverse);
        const perspective=camera.isPerspectiveCamera?14/Math.max(.1,14-corner.z):1;
        fit=Math.max(fit,Math.abs(corner.y)*1.17*perspective,Math.abs(corner.x)*1.17*perspective/aspect);
      }
      const desired=fit*zoom;halfHeight+=(desired-halfHeight)*follow;
      if(camera.isPerspectiveCamera){camera.aspect=aspect;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(halfHeight/14));}
      else{camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;}
      camera.updateProjectionMatrix();
      moving=Math.abs(targetTheta-theta)>.0005||Math.abs(targetPhi-phi)>.0005||smoothedCenter.distanceTo(center)>.001||Math.abs(desired-halfHeight)>.001;snap=false;
    },
    pick(clientX,clientY,rect){
      mouse.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);camera.updateMatrixWorld();raycaster.setFromCamera(mouse,camera);
      const hit=raycaster.intersectObjects(renderables.filter(o=>o.isMesh&&o.visible),false)[0];if(!hit)return null;
      for(const id of ['display','battery','cameras','board','haptic','backglass','speakers','loudspeaker','charging','truedepth'])if(belongs(hit.object,parts[id]))return id;
      return 'all';
    }
  };
}
