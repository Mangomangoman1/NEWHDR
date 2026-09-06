import * as THREE from './vendor/three/three.module.min.js';

// Apple iPhone 16 Pro Max envelope, excluding the rear camera protrusion.
// https://support.apple.com/en-au/121032
export const PHONE = Object.freeze({ width:77.6*.03, height:163*.03, depth:8.25*.03, radius:.35 });
export function outline(width,height,radius) {
  const x=-width/2,y=-height/2,r=radius;
  return new THREE.Shape().moveTo(x+r,y).lineTo(x+width-r,y)
    .quadraticCurveTo(x+width,y,x+width,y+r).lineTo(x+width,y+height-r)
    .quadraticCurveTo(x+width,y+height,x+width-r,y+height).lineTo(x+r,y+height)
    .quadraticCurveTo(x,y+height,x,y+height-r).lineTo(x,y+r)
    .quadraticCurveTo(x,y,x+r,y);
}
// Unlike the first model, bevels are INSIDE the specified dimensions.
export function rounded(w,h,d,r=.08,hole=null,bevel=.005) {
  const b=Math.min(bevel,d*.24,r*.3);
  const shape=outline(w-2*b,h-2*b,r-b);
  if(hole)shape.holes.push(new THREE.Path(outline(...hole).getPoints(16).reverse()));
  const geo=new THREE.ExtrudeGeometry(shape,{depth:d-2*b,bevelEnabled:true,bevelSegments:4,bevelSize:b,bevelThickness:b,curveSegments:20,steps:1});
  geo.translate(0,0,-(d-2*b)/2);return geo;
}
function add(parent,geometry,material,x=0,y=0,z=0,name='') {
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.name=name;parent.add(mesh);return mesh;
}
function circle(radius,depth) {return new THREE.CylinderGeometry(radius,radius,depth,48).rotateX(Math.PI/2);}

export function buildPhone({batteryMap=null,screenMaterial=null,screenUI=null,detailMap=null}={}) {
  const {width:W,height:H,depth:D,radius:R}=PHONE;
  const phone=new THREE.Group();phone.name='iPhone 16 Pro Max study';
  const materials={
    titanium:new THREE.MeshStandardMaterial({color:0x928f88,metalness:.97,roughness:.31}),
    edge:new THREE.MeshStandardMaterial({color:0xb4b1a9,metalness:1,roughness:.25}),
    glassBack:new THREE.MeshPhysicalMaterial({color:0x55544f,metalness:.15,roughness:.48,clearcoat:.22,clearcoatRoughness:.32,envMapIntensity:.65}),
    black:new THREE.MeshStandardMaterial({color:0x080b10,metalness:.05,roughness:.43}),
    shield:new THREE.MeshStandardMaterial({color:0x888f96,metalness:.95,roughness:.38}),
    graphite:new THREE.MeshStandardMaterial({color:0x20242b,metalness:.4,roughness:.44}),
    pcb:new THREE.MeshStandardMaterial({color:0x15322d,metalness:.25,roughness:.5}),
    gold:new THREE.MeshStandardMaterial({color:0xb19963,metalness:.9,roughness:.3}),
    copper:new THREE.MeshStandardMaterial({color:0xaa7545,metalness:.85,roughness:.4}),
    ceramic:new THREE.MeshStandardMaterial({color:0x424443,roughness:.6,metalness:.1}),
    optical:new THREE.MeshPhysicalMaterial({color:0x070d19,metalness:.15,roughness:.08,clearcoat:1,clearcoatRoughness:.045}),
  };
  const {titanium,edge,glassBack,black,shield,graphite,pcb,gold,copper,ceramic,optical}=materials;
  const rig={ cameras:[], lensCovers:[], shields:[], flexes:[], modules:[] };
  const groups={};for(const id of ['housing','board','battery','frame','display','backglass']){groups[id]=new THREE.Group();groups[id].name=id;phone.add(groups[id]);}
  const {housing,board,battery,frame,display,backglass}=groups;
  // One hollow titanium rail. Front and rear glass occupy the remaining 0.025 units.
  const chassis=add(housing,rounded(W,H,D-.025,R,[W-.078,H-.078,R-.039],.01),titanium,0,0,0,'single titanium enclosure');
  add(housing,rounded(W-.10,H-.10,.014,R-.05),graphite,0,0,-.070,'internal support');
  add(housing,rounded(W-.028,H-.028,.006,R-.014,[W-.078,H-.078,R-.039],.001),edge,0,0,.105);
  // Side buttons are modeled on YZ, flush along the flat titanium side rail.
  function sideButton(side,y,height,width=.078,mat=titanium) {
    const button=add(housing,rounded(width,height,.014,width*.45),mat,side*(W/2+.004),y,0);
    button.rotation.y=side*Math.PI/2;return button;
  }
  sideButton(-1,1.52,.21); // Action button
  sideButton(-1,.98,.40);sideButton(-1,.42,.40); // separate volume buttons
  sideButton(1,.91,.65); // Side button
  sideButton(1,-1.13,.58,.112,ceramic); // flush Camera Control surface
  // Narrow nonmetallic antenna breaks across the rail.
  for(const x of [-1,1])for(const y of [-1.90,1.92])add(housing,new THREE.BoxGeometry(.014,.018,D-.032),ceramic,x*(W/2+.001),y,0);
  // USB-C has a recessed oval, metal lip and central contact tongue on the BOTTOM edge.
  const bottom=new THREE.Group();bottom.position.set(0,-H/2-.001,0);bottom.rotation.x=Math.PI/2;housing.add(bottom);
  add(bottom,rounded(.276,.094,.004,.043),black);
  add(bottom,rounded(.291,.107,.004,.049,[.276,.094,.043],.001),edge,0,0,.003);
  add(bottom,rounded(.197,.021,.005,.008),graphite,0,0,.004);
  for(let i=0;i<7;i++)add(bottom,new THREE.BoxGeometry(.012,.006,.002),gold,-.077+i*.026,0,.008);
  for(const side of [-1,1])for(let i=0;i<(side===1?6:5);i++)add(bottom,circle(.020,.005),black,side*(.43+i*.080),0,.004);
  // Two pentalobe security screws live beside USB-C, not in the display corners.
  const screws=[];
  for(const x of [-.30,.30]) {
    const screw=new THREE.Group();bottom.add(screw);screw.position.set(x,0,.004);
    add(screw,circle(.026,.007),edge);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;add(screw,circle(.005,.001),black,Math.sin(a)*.009,Math.cos(a)*.009,.004);}
    add(screw,circle(.012,.07),titanium,0,0,-.035);
    const threadPoints=[];
    for(let i=0;i<=100;i++){const t=i/100,a=t*Math.PI*10;threadPoints.push(new THREE.Vector3(Math.cos(a)*.014,Math.sin(a)*.014,-.012-t*.054));}
    add(screw,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(threadPoints),100,.0028,4,false),edge,0,0,0,'helical screw thread');
    screws.push({mesh:screw,x});
  }
  // Independently seated camera cans, with stepped shielding and folded flex tails.
  add(housing,rounded(1.31,1.40,.016,.16),graphite,.43,1.63,-.047);
  const cameraCenters=[[.75,1.99],[.75,1.29],[.12,1.64]];
  cameraCenters.forEach(([x,y],i)=>{
    const module=new THREE.Group();module.position.set(x,y,0);module.name=['main camera','ultrawide camera','telephoto camera'][i];housing.add(module);
    add(module,rounded(.53,.53,.053,.065),graphite,0,0,-.045);
    add(module,rounded(.50,.50,.015,.055),shield,0,0,-.014);
    add(module,rounded(.43,.43,.008,.045),titanium,0,0,-.003);
    add(module,rounded(.34,.34,.003,.022),graphite,0,0,.002);
    for(const sign of [-1,1])add(module,new THREE.BoxGeometry(.025,.29,.008),edge,sign*.237,0,-.002);
    add(module,circle(.22,.08),black,0,0,-.12);
    add(module,circle(.175,.003),optical,0,0,-.163);
    add(module,new THREE.TorusGeometry(.151,.007,8,48),titanium,0,0,-.166);
    add(module,circle(.080,.002),optical,0,0,-.168);
    add(module,circle(.019,.001),new THREE.MeshBasicMaterial({color:0x293f62}),-.033,.027,-.1695);
    // Conductive shielding seam and gold flex contacts are actual geometry.
    add(module,new THREE.BoxGeometry(.13,.14,.007),copper,-.13,-.285,-.022);
    for(let pin=0;pin<5;pin++)add(module,new THREE.BoxGeometry(.015,.061,.002),gold,-.175+pin*.022,-.31,-.017);
    rig.cameras.push({mesh:module,x,y,index:i});
  });
  // Logic board is beside the battery, with photographed layout proportions.
  const boardShape=new THREE.Shape().moveTo(-1.025,-1.01).lineTo(-.53,-1.01).lineTo(-.53,1.47).lineTo(-.04,1.47).lineTo(-.04,2.16).lineTo(-1.025,2.16).closePath();
  const bg=new THREE.ExtrudeGeometry(boardShape,{depth:.018,bevelEnabled:false});bg.translate(0,0,-.009);add(board,bg,pcb);
  function decal(parent,slot,w,h,x,y,z) {
    if(!detailMap)return;
    const geo=new THREE.PlaneGeometry(w,h),uv=geo.attributes.uv;
    // Four labels share one atlas and material; each slot occupies a quarter.
    for(let i=0;i<uv.count;i++)uv.setY(i,(uv.getY(i)+3-slot)/4);
    const label=add(parent,geo,labelMaterial,x,y,z);if(z<0)label.rotation.y=Math.PI;
  }
  const labelMaterial=detailMap?new THREE.MeshBasicMaterial({map:detailMap,transparent:true,depthWrite:false,toneMapped:false}):null;
  [[-.79,-.62,.35,.56],[-.78,.10,.37,.54],[-.76,.74,.4,.55],[-.72,1.49,.43,.68],[-.30,1.95,.36,.30]].forEach(([x,y,w,h],i)=>{
    add(board,rounded(w,h,.030,.035),black,x,y,.019);
    decal(board,i===3?0:1,w*.79,h*.55,x,y,.035);
    const cover=new THREE.Group();cover.position.set(x,y,.040);cover.name='logic board shielding';board.add(cover);
    add(cover,rounded(w-.024,h-.024,.006,.025),i%2?shield:graphite);
    // Embossed rim catches a fine highlight around each shield.
    add(cover,rounded(w-.036,h-.036,.002,.018,[w-.064,h-.064,.008],.0003),titanium,0,0,.004);
    decal(cover,1,w*.75,h*.40,0,0,.0055);
    rig.shields.push({mesh:cover,z:.040,index:i});
  });
  const contacts=new THREE.InstancedMesh(new THREE.BoxGeometry(.026,.015,.014),gold,56);board.add(contacts);
  const matrix=new THREE.Matrix4();for(let i=0;i<56;i++){matrix.makeTranslation(-.997+(i%2)*.43,-.94+Math.floor(i/2)*.105,.013);contacts.setMatrixAt(i,matrix);}
  const resistors=new THREE.InstancedMesh(new THREE.BoxGeometry(.048,.023,.018),graphite,32);board.add(resistors);
  for(let i=0;i<32;i++){matrix.makeTranslation(-.965+(i%4)*.09,1.04+Math.floor(i/4)*.085,.027);resistors.setMatrixAt(i,matrix);}
  // Fine PCB routing, plated vias, and soldered passive components.
  const routeVertices=[];
  for(let i=0;i<15;i++){
    const x=-1.014+i*.006,y=-.96+i*.04;
    const points=[[x,y,.010],[x,y+1.87,.010],[x+.085,y+1.955,.010],[x+.085,2.12-i*.008,.010]];
    for(let j=1;j<points.length;j++)routeVertices.push(...points[j-1],...points[j]);
  }
  const routeGeo=new THREE.BufferGeometry();routeGeo.setAttribute('position',new THREE.Float32BufferAttribute(routeVertices,3));
  board.add(new THREE.LineSegments(routeGeo,new THREE.LineBasicMaterial({color:0x9d8955,transparent:true,opacity:.48})));
  const vias=new THREE.InstancedMesh(new THREE.RingGeometry(.006,.012,8),gold,64);vias.name='plated circuit vias';board.add(vias);
  for(let i=0;i<64;i++){matrix.makeTranslation(-.97+(i%2)*.40,-.90+Math.floor(i/2)*.094,.010);vias.setMatrixAt(i,matrix);}
  const solder=new THREE.InstancedMesh(new THREE.BoxGeometry(.014,.008,.011),shield,112);solder.name='solder terminations';board.add(solder);
  const passives=new THREE.InstancedMesh(new THREE.BoxGeometry(.012,.032,.017),ceramic,56);board.add(passives);
  for(let i=0;i<56;i++){
    const x=i%2?-.548:-.998,y=-.94+Math.floor(i/2)*.074;
    matrix.makeTranslation(x,y,.022);passives.setMatrixAt(i,matrix);
    for(let j=0;j<2;j++){matrix.makeTranslation(x,y+(j?1:-1)*.021,.019);solder.setMatrixAt(i*2+j,matrix);}
  }
  // Standoffs sit inside the existing rail, not through the front glass.
  const mountPoints=[[-1.06,1.95],[-1.06,.85],[-1.06,-.85],[-1.02,-2.19],[1.05,.92],[1.05,-1.75],[.1,2.27]];
  const mounts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.031,.037,.031,16).rotateX(Math.PI/2),shield,mountPoints.length);housing.add(mounts);
  mountPoints.forEach(([x,y],i)=>{matrix.makeTranslation(x,y,-.041);mounts.setMatrixAt(i,matrix);});
  const mountSockets=new THREE.InstancedMesh(new THREE.RingGeometry(.012,.025,12),black,mountPoints.length);housing.add(mountSockets);
  mountPoints.forEach(([x,y],i)=>{matrix.makeTranslation(x,y,-.025);mountSockets.setMatrixAt(i,matrix);});
  // One shaped battery pack, not two generic separate rectangular cells.
  const bs=new THREE.Shape().moveTo(-.44,.96).quadraticCurveTo(-.47,.99,-.42,1.0).lineTo(.98,1.0).quadraticCurveTo(1.03,1.0,1.03,.94).lineTo(1.03,-1.95).quadraticCurveTo(1.03,-2.00,.98,-2.00).lineTo(-1.0,-2.00).quadraticCurveTo(-1.04,-2.,-1.04,-1.95).lineTo(-1.04,-1.03).quadraticCurveTo(-1.04,-.98,-.99,-.98).lineTo(-.49,-.98).quadraticCurveTo(-.44,-.98,-.44,-.92).closePath();
  const batteryGeometry=new THREE.ExtrudeGeometry(bs,{depth:.082,bevelEnabled:true,bevelSegments:3,bevelSize:.009,bevelThickness:.006,curveSegments:16});batteryGeometry.translate(0,0,-.041);
  add(battery,batteryGeometry,black.clone(),0,0,0,'battery foil');
  if(batteryMap)add(battery,new THREE.PlaneGeometry(1.28,2.84),new THREE.MeshStandardMaterial({map:batteryMap,roughness:.56,metalness:.06}),.29,-.50,.048,'battery label');
  for(const x of [-.68,0,.72])add(battery,rounded(.13,.18,.008,.02),ceramic,x,-1.92,.048);
  // A ribbon has a real curved surface. Its plug folds down only after the pack seats.
  const socket=add(board,rounded(.12,.17,.018,.018),black,-.78,-.26,.045,'battery socket');
  add(board,rounded(.096,.14,.003,.012,[.062,.11,.008],.0004),gold,-.78,-.26,.055);
  function flexCable(parent,origin,width,index,endRestZ=.037,direction=1,socketMesh=socket) {
    const segments=24,geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array((segments+1)*2*3),3));
    geo.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array((segments+1)*2*3),3));
    const indices=[];for(let i=0;i<segments;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}geo.setIndex(indices);
    const ribbon=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x8c562b,metalness:.65,roughness:.34,side:THREE.DoubleSide}));ribbon.name='folding flex ribbon';parent.add(ribbon);
    const plug=new THREE.Group();plug.name='press-fit flex connector';parent.add(plug);
    add(plug,rounded(.096,width+.018,.014,.012),black);
    add(plug,rounded(.082,width,.003,.009),shield,0,0,.009);
    const traces=new THREE.BufferGeometry();traces.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(segments*2*3*5),3));
    const traceLines=new THREE.LineSegments(traces,new THREE.LineBasicMaterial({color:0xc6a369}));parent.add(traceLines);
    rig.flexes.push({geometry:geo,traces,plug,origin,width,segments,index,endRestZ,direction,socket:socketMesh});
  }
  flexCable(battery,[-.47,-.26,.032],.115,0);
  // The motor and speaker have their own seating paths and small construction details.
  const haptic=new THREE.Group();haptic.position.set(-.61,-2.18,-.007);haptic.name='Taptic Engine';housing.add(haptic);
  add(haptic,rounded(.80,.25,.075,.05),shield);
  add(haptic,rounded(.70,.18,.004,.026),graphite,0,0,.04);
  decal(haptic,2,.58,.12,0,0,.043);
  for(const x of [-.34,.34])add(haptic,new THREE.BoxGeometry(.017,.17,.004),edge,x,0,.044);
  const speaker=new THREE.Group();speaker.position.set(.62,-2.17,-.01);speaker.name='loudspeaker chamber';housing.add(speaker);
  add(speaker,rounded(.88,.27,.08,.065),black);
  add(speaker,rounded(.70,.14,.003,.05),graphite,0,0,.042);
  add(speaker,rounded(.60,.085,.002,.035,[.54,.04,.015],.0003),titanium,0,0,.044);
  const speakerMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.008,.063,.001),shield,26);speaker.add(speakerMesh);
  for(let i=0;i<26;i++){matrix.makeTranslation(-.27+i*.021,0,.045);speakerMesh.setMatrixAt(i,matrix);}
  for(const x of [-.37,.37])add(speaker,circle(.025,.003),titanium,x,0,.043);
  rig.modules.push({mesh:haptic,rest:haptic.position.clone(),index:0},{mesh:speaker,rest:speaker.position.clone(),index:1});
  add(housing,rounded(.81,.095,.051,.035),black,-.12,2.24,-.015);
  const trueDepth=new THREE.Group();trueDepth.position.set(0,2.10,.067);trueDepth.name='TrueDepth sensor bridge';housing.add(trueDepth);
  add(trueDepth,rounded(.76,.15,.025,.04),graphite);
  for(const [x,r] of [[-.25,.036],[-.08,.045],[.11,.032],[.26,.039]]) {
    add(trueDepth,circle(r+.009,.008),titanium,x,0,.014);
    add(trueDepth,circle(r,.005),optical,x,0,.020);
    add(trueDepth,circle(r*.35,.001),new THREE.MeshBasicMaterial({color:0x183447}),x-.008,.008,.023);
  }
  rig.modules.push({mesh:trueDepth,rest:trueDepth.position.clone(),index:2});
  // Internal USB-C socket and the short bottom microphone flex.
  add(housing,rounded(.31,.15,.092,.025),shield,0,-2.34,-.025,'USB-C socket body');
  add(housing,rounded(1.64,.067,.009,.015),copper,0,-2.363,.028,'bottom microphone flex');
  for(const x of [-.74,.74]){
    add(housing,rounded(.15,.09,.014,.018),black,x,-2.346,.040);
    add(housing,circle(.022,.002),shield,x,-2.346,.049);
    add(housing,circle(.010,.001),black,x,-2.346,.0505);
  }
  // A gasket, not a second metal body; disappears completely into the glass seam.
  add(frame,rounded(W-.073,H-.073,.006,R-.035,[W-.13,H-.13,R-.065],.001),black);
  const front=add(display,rounded(W-.024,H-.024,.021,R-.012,null,.004),black,0,0,0,'front glass substrate');
  add(display,rounded(W-.17,H-.17,.003,R-.08),graphite,0,0,-.0125,'display graphite backing');
  decal(display,3,.65,.26,0,-1.70,-.0143);
  const displaySocket=add(board,rounded(.10,.070,.012,.012),black,-.79,.42,.052,'display flex socket');
  flexCable(display,[-.48,.42,-.026],.060,1,-.0745,-1,displaySocket);
  // Raster dimensions reflect the screen's published 1320:2868 aspect ratio.
  const screenW=2.207,screenH=screenW*2868/1320;
  const faceGeometry=new THREE.ShapeGeometry(outline(screenW,screenH,R-.067),28);
  if(screenMaterial)add(display,faceGeometry,screenMaterial,0,0,.0108,'OLED image');
  else add(display,faceGeometry,black,0,0,.0108,'OLED image');
  const glass=new THREE.MeshPhysicalMaterial({color:0x9aabc4,metalness:.1,roughness:.055,clearcoat:1,clearcoatRoughness:.06,transparent:true,opacity:.035,depthWrite:false});
  add(display,new THREE.ShapeGeometry(outline(W-.031,H-.031,R-.016),28),glass,0,0,.0112,'cover-glass reflection');
  if(screenUI) {
    const uiGeometry=faceGeometry.clone();const uv=uiGeometry.attributes.uv,positions=uiGeometry.attributes.position;
    for(let i=0;i<uv.count;i++)uv.setXY(i,positions.getX(i)/screenW+.5,positions.getY(i)/screenH+.5);
    add(display,uiGeometry,screenUI,0,0,.0116,'lock screen');
  }
  // TrueDepth island: black capsule, camera lens and discreet reflected catchlight.
  add(display,rounded(.65,.187,.003,.093,null,.0006),black,0,2.105,.013,'Dynamic Island');
  add(display,circle(.042,.002),optical,.232,2.105,.015);
  add(display,circle(.018,.001),new THREE.MeshBasicMaterial({color:0x12273e}),.232,2.105,.0162);
  add(display,rounded(.51,.014,.001,.006),new THREE.MeshBasicMaterial({color:0xe1e4e8}),0,-2.235,.013);
  // Microscopic earpiece slit is in the top bezel, not a notch.
  add(display,rounded(.54,.007,.001,.003),black,0,2.409,.013);
  // Rear cover and camera plateau, including lens covers, flash and LiDAR.
  const rear=add(backglass,rounded(W-.025,H-.025,.018,R-.012,null,.003),glassBack,0,0,0,'matte back glass');
  // A shallow reflective maker's mark, inset visually into the matte glass.
  const mark=new THREE.Group();mark.position.set(0,.04,-.0096);mark.scale.setScalar(.68);mark.rotation.y=Math.PI;backglass.add(mark);
  const apple=new THREE.Shape().moveTo(0,.19)
    .bezierCurveTo(-.09,.20,-.13,.27,-.23,.22).bezierCurveTo(-.43,.13,-.28,-.23,-.17,-.30)
    .bezierCurveTo(-.10,-.36,-.06,-.28,0,-.28).bezierCurveTo(.08,-.28,.11,-.35,.18,-.29)
    .bezierCurveTo(.23,-.25,.28,-.16,.30,-.10).bezierCurveTo(.16,-.05,.15,.08,.29,.14)
    .bezierCurveTo(.20,.29,.09,.22,0,.19);
  const markMaterial=new THREE.MeshStandardMaterial({color:0x44433e,metalness:.9,roughness:.26});
  add(mark,new THREE.ShapeGeometry(apple,24),markMaterial);
  const leaf=new THREE.Shape().moveTo(.015,.24).bezierCurveTo(.005,.35,.09,.42,.17,.42).bezierCurveTo(.17,.32,.11,.24,.015,.24);
  add(mark,new THREE.ShapeGeometry(leaf,20),markMaterial);
  add(backglass,rounded(1.39,1.49,.043,.235),glassBack,.43,1.63,-.030);
  cameraCenters.forEach(([x,y],i)=>{
    const cover=new THREE.Group();cover.name='camera lens cover';backglass.add(cover);rig.lensCovers.push(cover);
    add(cover,circle(.281,.048),titanium,x,y,-.066);
    add(cover,new THREE.TorusGeometry(.263,.008,8,64),edge,x,y,-.092);
    add(cover,circle(.245,.006),black,x,y,-.093);
    add(cover,circle(.205,.008),optical,x,y,-.098);
    add(cover,new THREE.TorusGeometry(.153,.008,8,64),graphite,x,y,-.104);
    add(cover,circle(.126,.002),new THREE.MeshPhysicalMaterial({color:i===1?0x101d31:0x0c1324,metalness:.32,roughness:.055,clearcoat:1}),x,y,-.106);
    add(cover,circle(.054,.001),new THREE.MeshBasicMaterial({color:i===2?0x162d29:0x13213d}),x+.028,y+.017,-.1075);
    add(cover,circle(.012,.001),new THREE.MeshBasicMaterial({color:0x58647c}),x-.041,y-.034,-.108);
  });
  add(backglass,circle(.094,.004),new THREE.MeshStandardMaterial({color:0xd4d2b9,roughness:.28}),.11,2.12,-.055);
  add(backglass,circle(.099,.004),optical,.10,1.13,-.055);
  add(backglass,circle(.015,.001),black,-.10,1.22,-.055);
  // Wireless induction coil on the inside of the removable rear cover.
  for(let i=0;i<16;i++)add(backglass,new THREE.TorusGeometry(.43+i*.018,.004,4,72),copper,0,-.50,.014);
  for(let i=0;i<18;i++){const a=i*Math.PI*2/18;const magnet=add(backglass,rounded(.135,.067,.01,.015),shield,Math.sin(a)*.82,-.5+Math.cos(a)*.82,.012);magnet.rotation.z=-a;}
  add(backglass,rounded(.09,.27,.01,.02),shield,0,-1.56,.012);
  return {phone,groups,screws,rig,screenSize:new THREE.Vector2(screenW,screenH),chassis,front,rear,materials};
}
