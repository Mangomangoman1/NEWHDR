import * as THREE from './vendor/three/three.module.min.js';

// Detail follows the visible service assemblies in Apple's 120821 internal view.
// The tiny routing, lens cross-sections and solder patterns are authored studies,
// not undocumented manufacturing dimensions or electrical schematics.
function mesh(parent,geometry,material,x=0,y=0,z=0,name='') {
  const object=new THREE.Mesh(geometry,material);object.position.set(x,y,z);object.name=name;parent.add(object);return object;
}
function instances(parent,geometry,material,positions,name) {
  const object=new THREE.InstancedMesh(geometry,material,positions.length),matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(1,1,1),position=new THREE.Vector3();
  positions.forEach(([x,y,z,angle=0],i)=>{position.set(x,y,z);rotation.setFromAxisAngle(new THREE.Vector3(0,0,1),angle);matrix.compose(position,rotation,scale);object.setMatrixAt(i,matrix);});
  object.name=name;object.computeBoundingBox();object.computeBoundingSphere();parent.add(object);return object;
}
const disc=(r,d,segments=48)=>new THREE.CylinderGeometry(r,r,d,segments).rotateX(Math.PI/2);
function routes(parent,paths,material,width=.0024) {
  // Actual copper ribbons instead of resolution-dependent WebGL hairlines.
  const positions=[],normals=[];
  for(const path of paths)for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),nx=-dy/length*width,ny=dx/length*width;
    const corners=[[a[0]+nx,a[1]+ny,a[2]],[a[0]-nx,a[1]-ny,a[2]],[b[0]-nx,b[1]-ny,b[2]],[b[0]+nx,b[1]+ny,b[2]]];
    for(const j of [0,1,2,0,2,3]){positions.push(...corners[j]);normals.push(0,0,1);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  mesh(parent,geometry,material,0,0,0,'etched copper routing');
}

export function opticalStack(parent,radius,materials,{x=0,y=0,z=0,index=0,cover=false}={}) {
  const group=new THREE.Group();group.name=cover?'sapphire lens window':'coated lens barrel';group.position.set(x,y,z);parent.add(group);
  const {black,edge,optical,graphite}=materials;
  // Negative Z faces the back of the device. The shallow lathed meniscus gives
  // the coating real changing normals, so reflected softboxes move over glass.
  const profile=[];
  for(let i=0;i<=24;i++){const r=radius*i/24;profile.push(new THREE.Vector2(r,-.005-.013*(1-(r/radius)**2)));}
  const lensGeometry=new THREE.LatheGeometry(profile,96).rotateX(Math.PI/2);
  const lens=optical.clone();lens.color.setHex([0x101723,0x101821,0x13151b][index]);lens.iridescence=.32;lens.iridescenceIOR=1.38;lens.iridescenceThicknessRange=[190+index*25,340+index*25];lens.ior=1.52;lens.envMapIntensity=.32;lens.metalness=0;lens.roughness=.055;lens.clearcoat=1;lens.clearcoatRoughness=.035;
  // Annular machining, iris stop and nested glass surfaces are recessed behind
  // a raised retaining ring rather than painted concentric circles.
  mesh(group,disc(radius*1.10,.027),black,0,0,.008,'anodized optical barrel');
  for(let i=0;i<4;i++)mesh(group,new THREE.TorusGeometry(radius*(1.06-i*.07),.0018,6,96),i===0?edge:graphite,0,0,-.006-i*.002,'lens retaining groove');
  mesh(group,lensGeometry,lens,0,0,-.009,'curved coated lens');
  mesh(group,new THREE.RingGeometry(radius*.34,radius*.61,96),black,0,0,-.029,'fixed aperture stop').rotation.y=Math.PI;
  const inner=lens.clone();inner.color.setHex(index===2?0x172620:0x111b31);inner.roughness=.12;
  const core=mesh(group,lensGeometry.clone(),inner,0,0,-.032,'recessed inner optical element');core.scale.set(.33,.33,.35);
  if(cover){
    const sapphire=new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:0,roughness:.035,ior:1.76,envMapIntensity:.28,transmission:1,thickness:.001,depthWrite:false,clearcoat:1,clearcoatRoughness:.025});
    mesh(group,new THREE.CircleGeometry(radius*1.07,96),sapphire,0,0,-.038,'sapphire surface reflection').rotation.y=Math.PI;
  }
  return group;
}

export function addPhoneDetails(model,{rounded,outline,decal}) {
  const {groups,rig,materials,phone}=model,{housing,board,battery,display,backglass}=groups;
  const {shield,edge,black,graphite,gold,copper,pcb,ceramic}=materials;
  const nickel=new THREE.MeshStandardMaterial({color:0xb3b4b0,metalness:1,roughness:.24});
  const polymer=new THREE.MeshStandardMaterial({color:0x121418,metalness:0,roughness:.72});
  const solderMat=new THREE.MeshStandardMaterial({color:0x9eaaa9,metalness:1,roughness:.27});
  const kapton=new THREE.MeshPhysicalMaterial({color:0x633b16,metalness:.30,roughness:.37,clearcoat:.3});
  const silkscreen=new THREE.MeshStandardMaterial({color:0x90958b,roughness:.8});
  Object.assign(materials,{nickel,polymer,solderMat,kapton});
  const detailParts={};model.detailParts=detailParts;
  function microBox(w,h,d,r) {
    const b=Math.min(d*.2,r*.25),shape=outline(w-2*b,h-2*b,r-b);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:d-2*b,bevelEnabled:true,bevelSegments:2,bevelSize:b,bevelThickness:b,curveSegments:3,steps:1});geometry.translate(0,0,-(d-2*b)/2);return geometry;
  }
  function fasteners(parent,points,r=.023) {
    instances(parent,disc(r,.007,24),nickel,points,'internal screw heads');
    const slots=[];for(const [x,y,z] of points){slots.push([x,y,z+.004,0],[x,y,z+.004,Math.PI/2]);}
    instances(parent,new THREE.BoxGeometry(r*1.12,r*.18,.001),black,slots,'crosshead screw recesses');
    instances(parent,new THREE.RingGeometry(r*1.06,r*1.38,24),graphite,points.map(([x,y,z])=>[x,y,z-.001]),'screw shoulder washers');
  }
  function connector(parent,x,y,z,width=.15,height=.07,pins=12) {
    mesh(parent,rounded(width,height,.012,.008),polymer,x,y,z,'board-to-board connector');
    mesh(parent,rounded(width-.01,height-.01,.003,.005,[width-.025,height-.029,.002],.0003),nickel,x,y,z+.008,'connector shell');
    const tips=[];for(let i=0;i<pins;i++)for(const side of [-1,1])tips.push([x-width*.40+i*width*.80/(pins-1),y+side*height*.31,z+.009]);
    instances(parent,new THREE.BoxGeometry(width/(pins*2.1),.014,.004),gold,tips,'connector contact fingers');
  }
  function movingPart(name,parent,x,y,z,start,end,lift=.38) {
    const group=new THREE.Group();group.name=name;group.position.set(x,y,z);parent.add(group);
    rig.details.push({mesh:group,rest:group.position.clone(),start,end,lift});return group;
  }
  rig.details=[];

  // Common camera carrier and integrated LiDAR, as in the service camera unit.
  const carrier=rig.cameraAssembly;
  const plate=outline(1.28,1.35,.10);
  for(const [x,y,r] of [[.32,.37,.225],[.32,-.33,.235],[-.31,.02,.222]]){const hole=new THREE.Path();hole.absarc(x,y,r,0,Math.PI*2,true);plate.holes.push(hole);}
  mesh(carrier,new THREE.ExtrudeGeometry(plate,{depth:.010,bevelEnabled:false}),shield,.43,1.62,-.076,'formed camera carrier shield');

  const rearFixings=new THREE.Group();rearFixings.rotation.y=Math.PI;carrier.add(rearFixings);
  fasteners(rearFixings,[[-1.04,2.18,.080],[-1.03,1.02,.080],[.18,2.16,.080]],.025);
  // Fine formed lips surround the optical cutouts in the stamped carrier.
  for(const [x,y,r] of [[.75,1.99,.225],[.75,1.29,.235],[.12,1.64,.222]])mesh(carrier,new THREE.TorusGeometry(r,.006,8,96),nickel,x,y,-.081,'formed optical carrier lip');
  // Separate stamped mounting ears; three attachment points in the assembly.
  for(const [x,y] of [[1.04,2.18],[1.03,1.02],[-.18,2.16]])mesh(carrier,rounded(.13,.11,.017,.04),shield,x,y,-.04,'camera mounting ear');
  fasteners(carrier,[[1.04,2.18,-.025],[1.03,1.02,-.025],[-.18,2.16,-.025]],.025);
  const lidar=new THREE.Group();lidar.name='integrated LiDAR module';lidar.position.set(.10,1.13,-.034);carrier.add(lidar);
  mesh(lidar,rounded(.22,.28,.040,.035),shield);
  mesh(lidar,rounded(.15,.22,.003,.02),black,0,0,-.022);
  for(const y of [-.047,.047])opticalStack(lidar,.037,materials,{y,z:-.025,index:2});
  for(const {mesh:camera,index:i} of rig.cameras){
    const welds=[];for(let j=0;j<10;j++)for(const side of [-1,1])welds.push([side*.238,-.20+j*.043,-.004]);
    instances(camera,disc(.0035,.001,8),graphite,welds,'laser spot-weld seam');
    connector(camera,-.13,-.31,-.012,.145,.067,12);
    mesh(camera,rounded(.26,.16,.002,.013),polymer,.04,.06,.004,'camera shielding film');
    decal(camera,1,.22,.11,.04,.06,.006);
  }

  // Populate the visible board margins and pads between shield cans. Repeated
  // details are instanced; hundreds of placements take only a few draw calls.
  const components=[],ends=[],viaPoints=[],testPads=[],marks=[];
  for(let lane=0;lane<2;lane++)for(let row=0;row<45;row++){
    const x=lane?-.545:-1.005,y=-.94+row*.065;
    for(let j=0;j<2;j++){
      const xx=x+(lane?-1:1)*j*.032;components.push([xx,y,.016]);
      ends.push([xx,y-.017,.016],[xx,y+.017,.016]);
      viaPoints.push([xx+.014,y+.028,.010]);
    }
  }
  for(let row=0;row<5;row++)for(let col=0;col<11;col++){
    const x=-.975+col*.079,y=1.83+row*.066;
    if(x<-.51||y>2.04){components.push([x,y,.016,Math.PI/2]);ends.push([x-.017,y,.016],[x+.017,y,.016]);}
  }
  instances(board,microBox(.014,.027,.009,.002),ceramic,components,'ceramic capacitors and resistors');
  instances(board,microBox(.014,.007,.010,.001),solderMat,ends,'reflow solder fillets');
  instances(board,new THREE.RingGeometry(.0026,.0058,10),gold,viaPoints,'microvia annuli');
  for(let row=0;row<14;row++){testPads.push([-.576,-.90+row*.20,.011]);marks.push([-.556,-.86+row*.20,.011]);}
  instances(board,disc(.008,.001,16),gold,testPads,'exposed gold test points');
  instances(board,new THREE.PlaneGeometry(.011,.003),silkscreen,marks,'board silkscreen registration');
  const copperPaths=[];
  for(let i=0;i<24;i++){
    const x=-1.016+i*.0025,y=-.91+i*.011;
    copperPaths.push([[x,y,.0105],[x,y+.48,.0105],[x+.052,y+.532,.0105],[x+.052,y+.82,.0105]]);
  }
  routes(board,copperPaths,copper,.0007);
  // Fine ball grid on the underside of the largest processor package, visible
  // when looking through the separated layers, never protruding beyond the case.
  const balls=[];for(let y=0;y<14;y++)for(let x=0;x<11;x++)balls.push([-.89+x*.033,1.23+y*.036,-.012]);
  instances(board,new THREE.SphereGeometry(.0055,8,6),solderMat,balls,'processor solder ball array');
  mesh(board,rounded(.38,.59,.008,.025),black,-.72,1.49,-.020,'rear processor package');
  // Keep shield attachment frames visible after their covers float away.
  for(const {mesh:cover,index:i} of rig.shields){
    const base=cover.children[0].geometry;base.computeBoundingBox();const b=base.boundingBox,w=b.max.x-b.min.x,h=b.max.y-b.min.y;
    mesh(board,rounded(w+.014,h+.014,.007,.025,[w-.012,h-.012,.013],.001),nickel,cover.position.x,cover.position.y,.028,'shield solder frame');
    const dimples=[];for(let j=0;j<6;j++)for(const side of [-1,1])dimples.push([side*(w/2-.019),-h*.36+j*h*.144,.004]);
    instances(cover,disc(.004,.001,12),graphite,dimples,'shield staking dimples');
  }
  connector(board,-.47,1.68,.023,.18,.077,14);
  connector(board,-.42,1.88,.023,.18,.077,14);
  connector(board,-.34,2.08,.023,.18,.077,14);
  fasteners(board,[[-.99,2.08,.021],[-.56,.91,.021],[-.56,-.89,.021]],.018);

  // Separate stamped connector cowlings, with curled edges and screw ears.
  for(const [name,x,y,w,h] of [['display connector cowling',-.79,.42,.17,.13],['battery connector cowling',-.78,-.26,.19,.21],['back glass upper cowling',-.49,1.37,.24,.13],['ambient light sensor cowling',-.38,2.19,.16,.10]]){
    const cover=movingPart(name,board,x,y,.062,.53,.79,.28);
    mesh(cover,rounded(w,h,.005,.02),shield);
    mesh(cover,new THREE.BoxGeometry(.006,h-.03,.011),nickel,w/2-.004,0,-.004,'folded cowling lip');
    fasteners(cover,[[w*.32,0,.005]],.013);
  }

  // Battery pouch perimeter fold and three broad adhesive strips beneath it.
  const batterySeam=[[-.41,.97,.042],[.97,.97,.042],[1.,.93,.042],[1.,-1.94,.042],[.96,-1.972,.042],[-.98,-1.972,.042],[-1.012,-1.93,.042],[-1.012,-1.04,.042],[-.98,-1.009,.042],[-.465,-1.009,.042],[-.465,.93,.042],[-.41,.97,.042]];
  routes(battery,[batterySeam],graphite,.0035);
  for(const [i,x] of [-.67,0,.70].entries()){
    const length=i===0?.82:2.75,centerY=i===0?-1.48:-.57;
    mesh(battery,rounded(.22,length,.003,.025),polymer,x,centerY,-.049,'stretch-release battery adhesive');
    mesh(battery,rounded(.145,.07,.002,.009),black,x,-1.92,.054,'folded adhesive pull tab');
  }
  mesh(battery,rounded(.058,1.78,.002,.022),graphite,-.442,-.02,.043,'battery pouch folded edge');
  // Flex connector has actual sockets and gold contact fingers under the cap.
  for(const flex of rig.flexes){connector(flex.plug,0,0,-.004,.080,flex.width*.82,10);}

  // Speaker, microphone and top antenna are separate photographed service parts.
  const top=movingPart('top speaker',housing,-.79,1.73,.050,.14,.40,.68);detailParts.speakers=[top,rig.modules[1].mesh];
  mesh(top,rounded(.39,.93,.048,.07),polymer);
  mesh(top,rounded(.25,.72,.002,.035),graphite,0,0,.027,'top speaker acoustic chamber');
  mesh(top,rounded(.32,.24,.004,.03),shield,0,-.28,.030,'top speaker termination plate');
  decal(top,1,.25,.14,0,-.28,.033);
  fasteners(top,[[-.135,.39,.028],[.135,.39,.028],[-.135,-.39,.028],[.135,-.39,.028]],.017);
  const antenna=movingPart('back glass 1 antenna',top,0,.02,.032,.30,.51,.20);detailParts.antenna=antenna;
  mesh(antenna,rounded(.24,.59,.010,.03),black);
  const antennaPaths=[];for(let i=0;i<7;i++)antennaPaths.push([[-.095+i*.029,-.24,.007],[-.095+i*.029,.18,.007],[-.06+i*.025,.23,.007]]);
  routes(antenna,antennaPaths,graphite,.003);
  // Dock cable runs along the board edge, with its reinforced contact ends.
  const dock=movingPart('dock flex cable',housing,-.98,-1.38,.028,.24,.56,.40);detailParts.dock=dock;
  mesh(dock,rounded(.115,1.25,.005,.022),kapton);
  const dockPaths=[];for(let i=0;i<10;i++)dockPaths.push([[-.045+i*.010,-.57,.004],[-.045+i*.010,.57,.004]]);
  routes(dock,dockPaths,gold,.0008);connector(dock,0,.53,.005,.14,.09,10);
  // The motor stays sealed. Its mounting plate, welds, cowling and flex are
  // visible service hardware; no invented exposed moving motor is added.
  const haptic=rig.modules[0].mesh;
  const motorWelds=[];for(let i=0;i<15;i++)for(const y of [-.10,.10])motorWelds.push([-.30+i*.043,y,.041]);
  instances(haptic,disc(.0035,.001,8),graphite,motorWelds,'Taptic Engine laser welds');
  const cowling=movingPart('Taptic Engine connector cowling',haptic,.24,-.04,.049,.48,.73,.24);
  mesh(cowling,rounded(.20,.16,.005,.027),shield);fasteners(cowling,[[-.066,-.047,.005],[.066,.047,.005]],.015);
  for(const [x,y] of [[-.36,-.074],[.36,.074]])fasteners(haptic,[[x,y,.043]],.020);
  const speaker=rig.modules[1].mesh;
  mesh(speaker,rounded(.72,.17,.002,.04),polymer,0,0,-.044,'speaker rubber gasket');
  const pores=[];for(let row=0;row<5;row++)for(let col=0;col<35;col++)pores.push([-.275+col*.0162,-.033+row*.0165,.046]);
  instances(speaker,disc(.0028,.001,8),black,pores,'woven acoustic grille perforations');
  const microphone=movingPart('main microphone',housing,-.51,-2.33,.026,.16,.40,.36);detailParts.microphone=microphone;
  mesh(microphone,rounded(.32,.14,.022,.03),pcb);
  mesh(microphone,rounded(.12,.092,.013,.015),nickel,-.035,0,.016,'MEMS microphone shield');
  mesh(microphone,disc(.009,.001,20),black,-.035,0,.023,'microphone acoustic inlet');
  connector(microphone,.09,0,.012,.10,.065,8);

  const trueDepth=rig.modules[2].mesh;
  const sensorContacts=[];for(let i=0;i<22;i++)sensorContacts.push([-.31+i*.030,-.062,.012]);
  instances(trueDepth,new THREE.BoxGeometry(.011,.018,.003),gold,sensorContacts,'TrueDepth contact fingers');
  for(const [x,y] of [[-.335,0],[.335,0]])fasteners(trueDepth,[[x,y,.018]],.012);
  mesh(trueDepth,rounded(.18,.09,.002,.01),polymer,-.08,0,-.014,'sensor shielding tape');
  const receiverGrille=[];for(let i=0;i<54;i++)receiverGrille.push([-.257+i*.0096,2.409,.0135]);
  instances(display,new THREE.BoxGeometry(.003,.004,.001),nickel,receiverGrille,'earpiece grille slots');
  // Shielded button flex on the inner rail, with its paired contact pads.
  for(const [side,ys] of [[-1,[1.52,.98,.42]],[1,[.91,-1.13]]]){
    const railFlex=new THREE.Group();railFlex.position.set(side*1.102,0,-.016);railFlex.rotation.y=side*Math.PI/2;housing.add(railFlex);
    mesh(railFlex,rounded(.066,3.38,.003,.012),kapton,0,.15,0,'side button flex');
    for(const y of ys){
      mesh(railFlex,rounded(.052,.115,.005,.01),polymer,0,y,.003,'button switch housing');
      mesh(railFlex,disc(.018,.002,20),nickel,0,y,.007,'tactile switch dome');
    }
  }

  // Housing grounding fingers and a continuous adhesive seam beneath each glass.
  const springPositions=[];for(const side of [-1,1])for(let i=0;i<13;i++)springPositions.push([side*1.089,-1.92+i*.32,.058,side*Math.PI/2]);
  const springShape=new THREE.Shape().moveTo(-.017,-.042).lineTo(.017,-.042).lineTo(.017,.025).lineTo(.006,.042).lineTo(-.006,.042).lineTo(-.017,.025).closePath();
  const springGeo=new THREE.ExtrudeGeometry(springShape,{depth:.003,bevelEnabled:false});
  instances(housing,springGeo,nickel,springPositions,'enclosure grounding springs');
  const caseScrews=[];for(const side of [-1,1])for(const y of [-2.12,-1.57,-.80,.02,.92,2.19])caseScrews.push([side*1.064,y,.054]);
  fasteners(housing,caseScrews,.017);
  mesh(backglass,rounded(2.258,4.82,.002,.319,[2.23,4.792,.305],.0003),polymer,0,0,.010,'back glass adhesive seal');
  mesh(display,rounded(2.24,4.80,.002,.31,[2.215,4.775,.298],.0003),polymer,0,0,-.016,'display perimeter adhesive');
  // Graphite spreader with a central induction coil opening, below the copper.
  mesh(backglass,rounded(1.96,3.15,.002,.17,[1.62,1.66,.80],.0003),graphite,0,-.50,.0105,'wireless charging graphite spreader');
  const charging=movingPart('wireless charging connector',backglass,-.86,.03,.025,.20,.63,.15);
  mesh(charging,rounded(.115,.52,.005,.018),kapton);
  connector(charging,0,.22,.005,.14,.08,10);
  // Tightly wound litz strands share one merged ribbon geometry.
  const winding=[];for(let j=0;j<=6480;j++){const turns=j/180,r=.405+turns*.0083,a=turns*Math.PI*2;winding.push([Math.cos(a)*r,-.50+Math.sin(a)*r,.019]);}
  routes(backglass,[winding],copper,.0017);
  const flash=new THREE.Group();flash.name='True Tone flash diffuser';flash.position.set(.11,2.12,-.061);backglass.add(flash);
  const phosphor=new THREE.MeshStandardMaterial({color:0xe0d8b4,roughness:.38});
  mesh(flash,disc(.079,.003,64),phosphor);
  const flashCells=[];for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)flashCells.push([x*.035,y*.035,-.003]);
  instances(flash,microBox(.027,.027,.001,.004),silkscreen,flashCells,'flash emitter array');
  for(let i=0;i<5;i++)mesh(flash,new THREE.TorusGeometry(.030+i*.010,.0012,4,64),phosphor,0,0,-.005,'flash fresnel diffuser');
  phone.userData.reference='Apple iPhone 16 Pro Max 120821 / 121032; authored internal microgeometry';
}
