import { layers, layerAt, smooth } from './repair-ballet-motion.mjs';

// All movements are functions of assembly progress. Scrubbing backwards follows
// exactly the same path, including the folded ribbons and helical fasteners.
export function posePhone(model,progress,time=0) {
  const {groups,rig,screws}=model;
  layers.forEach((layer,i)=>{
    const group=groups[layer.id],pose=layerAt(layer,progress),open=pose.open;
    group.position.set(Math.sin(i*1.2)*open*.055,Math.sin(time*.65+i*.65)*open*.018,pose.z);
    group.rotation.set(0,0,Math.sin(time*.4+i)*open*.010);
    if(layer.id==='display') {
      // Fan the glass away enough to reveal the hardware behind it.
      group.position.x-=open*.50;
      group.rotation.y=-open*.44;
      group.rotation.z-=open*.055;
    }
    if(layer.id==='backglass'){group.position.x+=open*.16;group.rotation.y=open*.13;}
  });
  rig.cameras.forEach(({mesh,x,y,index:i})=>{
    const open=1-smooth(.12+i*.055,.38+i*.055,progress);
    mesh.position.set(x+open*(.20+i*.10),y+open*(.18+i*.06),open*(.94+i*.14));
    mesh.rotation.set(-open*.13,open*(.12+i*.07),open*(i-1)*.09);
  });
  rig.shields.forEach(({mesh,z,index:i})=>{
    const open=1-smooth(.34+i*.018,.55+i*.018,progress);
    mesh.position.z=z+open*(.27+i*.025);
    mesh.rotation.set(open*.15,open*.10,open*(i%2?-.10:.10));
  });
  rig.modules.forEach(({mesh,rest,index:i})=>{
    const open=1-smooth(.10+i*.06,.36+i*.06,progress);
    mesh.position.set(rest.x+open*(i===2?-.05:i?.22:-.18),rest.y+open*(i===2?.35:-.24),rest.z+open*(i===2?1.32:.64+i*.12));
    mesh.rotation.set(open*.18,open*(i?-.12:.12),open*(i?.12:-.12));
  });
  rig.flexes.forEach(flex=>poseFlex(flex,1-smooth(.65+flex.index*.08,.79+flex.index*.07,progress)));
  screws.forEach(({mesh,x},i)=>{
    const approach=1-smooth(.81+i*.025,.91+i*.020,progress);
    const turns=1-smooth(.91+i*.020,.975+i*.025,progress);
    mesh.position.set(x+Math.sign(x)*approach*.08,approach*.025,.004+approach*.70+turns*.070);
    mesh.rotation.set(0,0,turns*Math.PI*6);
  });
}

function poseFlex({geometry,traces,plug,origin,width,segments,endRestZ,direction},open) {
  const [x,y,z]=origin;
  const endX=x-.31+open*.11,endZ=endRestZ+direction*open*.29;
  const c1x=x-.105,c1z=z+direction*open*.19;
  const c2x=endX+.095,c2z=endZ+direction*open*.11;
  const vertices=geometry.attributes.position,normals=geometry.attributes.normal,tracks=traces.attributes.position;
  let previousX=x,previousZ=z,previousNX=0,previousNZ=1;
  for(let i=0;i<=segments;i++){
    const t=i/segments,u=1-t;
    const px=u*u*u*x+3*u*u*t*c1x+3*u*t*t*c2x+t*t*t*endX;
    const pz=u*u*u*z+3*u*u*t*c1z+3*u*t*t*c2z+t*t*t*endZ;
    const dx=3*u*u*(c1x-x)+6*u*t*(c2x-c1x)+3*t*t*(endX-c2x);
    const dz=3*u*u*(c1z-z)+6*u*t*(c2z-c1z)+3*t*t*(endZ-c2z);
    const length=Math.hypot(dx,dz),nx=dz/length,nz=-dx/length;
    for(let side=0;side<2;side++){
      vertices.setXYZ(i*2+side,px,y+(side?1:-1)*width/2,pz);
      normals.setXYZ(i*2+side,nx,0,nz);
    }
    if(i)for(let line=0;line<5;line++){
      const offset=(line-2)*width*.15,at=((i-1)*5+line)*2;
      tracks.setXYZ(at,previousX+previousNX*.0012,y+offset,previousZ+previousNZ*.0012);
      tracks.setXYZ(at+1,px+nx*.0012,y+offset,pz+nz*.0012);
    }
    previousX=px;previousZ=pz;previousNX=nx;previousNZ=nz;
  }
  plug.position.set(endX,y,endZ);plug.rotation.y=-direction*open*.85;
  vertices.needsUpdate=true;normals.needsUpdate=true;tracks.needsUpdate=true;
  // Curved geometry changes size as it folds; stale bounds can cull it incorrectly.
  geometry.computeBoundingSphere();traces.computeBoundingSphere();
}
