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

export function buildPhone({batteryMap=null,screenMaterial=null,screenUI=null}={}) {
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
    screws.push({mesh:screw,x});
  }
  // Camera bodies: three shielded modules in the top-right from the FRONT viewpoint.
  const cameraShield=add(housing,rounded(1.31,1.40,.047,.16),shield,.43,1.63,-.017);
  const cameraCenters=[[.75,1.99],[.75,1.29],[.12,1.64]];
  cameraCenters.forEach(([x,y])=>{
    add(housing,rounded(.53,.53,.053,.08),graphite,x,y,-.045);
    add(housing,rounded(.46,.46,.018,.06),shield,x,y,-.008);
    // Rear-facing optics sit below the camera module's shielded front.
    add(housing,circle(.22,.08),black,x,y,-.12);
  });
  // Logic board is beside the battery, with photographed layout proportions.
  const boardShape=new THREE.Shape().moveTo(-1.025,-1.01).lineTo(-.53,-1.01).lineTo(-.53,1.47).lineTo(-.04,1.47).lineTo(-.04,2.16).lineTo(-1.025,2.16).closePath();
  const bg=new THREE.ExtrudeGeometry(boardShape,{depth:.018,bevelEnabled:false});bg.translate(0,0,-.009);add(board,bg,pcb);
  [[-.79,-.62,.35,.56],[-.78,.10,.37,.54],[-.76,.74,.4,.55],[-.72,1.49,.43,.68],[-.30,1.95,.36,.30]].forEach(([x,y,w,h],i)=>{
    add(board,rounded(w,h,.035,.035),black,x,y,.019);
    add(board,rounded(w-.024,h-.024,.006,.025),i%2?shield:graphite,x,y,.040);
  });
  const contacts=new THREE.InstancedMesh(new THREE.BoxGeometry(.026,.015,.014),gold,56);board.add(contacts);
  const matrix=new THREE.Matrix4();for(let i=0;i<56;i++){matrix.makeTranslation(-.997+(i%2)*.43,-.94+Math.floor(i/2)*.105,.013);contacts.setMatrixAt(i,matrix);}
  const resistors=new THREE.InstancedMesh(new THREE.BoxGeometry(.048,.023,.018),graphite,32);board.add(resistors);
  for(let i=0;i<32;i++){matrix.makeTranslation(-.965+(i%4)*.09,1.04+Math.floor(i/4)*.085,.027);resistors.setMatrixAt(i,matrix);}
  // One shaped battery pack, not two generic separate rectangular cells.
  const bs=new THREE.Shape().moveTo(-.44,.96).quadraticCurveTo(-.47,.99,-.42,1.0).lineTo(.98,1.0).quadraticCurveTo(1.03,1.0,1.03,.94).lineTo(1.03,-1.95).quadraticCurveTo(1.03,-2.00,.98,-2.00).lineTo(-1.0,-2.00).quadraticCurveTo(-1.04,-2.,-1.04,-1.95).lineTo(-1.04,-1.03).quadraticCurveTo(-1.04,-.98,-.99,-.98).lineTo(-.49,-.98).quadraticCurveTo(-.44,-.98,-.44,-.92).closePath();
  const batteryGeometry=new THREE.ExtrudeGeometry(bs,{depth:.082,bevelEnabled:true,bevelSegments:3,bevelSize:.009,bevelThickness:.006,curveSegments:16});batteryGeometry.translate(0,0,-.041);
  add(battery,batteryGeometry,black);
  if(batteryMap)add(battery,new THREE.PlaneGeometry(1.28,2.84),new THREE.MeshStandardMaterial({map:batteryMap,roughness:.56,metalness:.06}),.29,-.50,.048);
  for(const x of [-.68,0,.72])add(battery,rounded(.13,.18,.008,.02),ceramic,x,-1.92,.048);
  const flexShape=new THREE.Shape().moveTo(-.49,-.83).lineTo(-.85,-.83).lineTo(-.85,-.63).lineTo(-.70,-.63).lineTo(-.70,-.72).lineTo(-.49,-.72).closePath();
  add(battery,new THREE.ExtrudeGeometry(flexShape,{depth:.007,bevelEnabled:false}),copper,0,0,.015);
  // Taptic Engine, loudspeaker, and receiver remain inside the rail.
  add(housing,rounded(.80,.25,.075,.05),shield,-.61,-2.18,-.007);
  add(housing,rounded(.88,.27,.08,.065),black,.62,-2.17,-.01);
  add(housing,rounded(.81,.095,.051,.035),black,-.12,2.24,-.015);
  // A gasket, not a second metal body; disappears completely into the glass seam.
  add(frame,rounded(W-.073,H-.073,.006,R-.035,[W-.13,H-.13,R-.065],.001),black);
  const front=add(display,rounded(W-.024,H-.024,.021,R-.012,null,.004),black,0,0,0,'front glass substrate');
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
    add(backglass,circle(.281,.048),titanium,x,y,-.066);
    add(backglass,new THREE.TorusGeometry(.263,.008,8,64),edge,x,y,-.092);
    add(backglass,circle(.245,.006),black,x,y,-.093);
    add(backglass,circle(.205,.008),optical,x,y,-.098);
    add(backglass,new THREE.TorusGeometry(.153,.008,8,64),graphite,x,y,-.104);
    add(backglass,circle(.126,.002),new THREE.MeshPhysicalMaterial({color:i===1?0x101d31:0x0c1324,metalness:.32,roughness:.055,clearcoat:1}),x,y,-.106);
    add(backglass,circle(.054,.001),new THREE.MeshBasicMaterial({color:i===2?0x162d29:0x13213d}),x+.028,y+.017,-.1075);
    add(backglass,circle(.012,.001),new THREE.MeshBasicMaterial({color:0x58647c}),x-.041,y-.034,-.108);
  });
  add(backglass,circle(.094,.004),new THREE.MeshStandardMaterial({color:0xd4d2b9,roughness:.28}),.11,2.12,-.055);
  add(backglass,circle(.099,.004),optical,.10,1.13,-.055);
  add(backglass,circle(.015,.001),black,-.10,1.22,-.055);
  // Wireless induction coil on the inside of the removable rear cover.
  for(let i=0;i<16;i++)add(backglass,new THREE.TorusGeometry(.43+i*.018,.004,4,72),copper,0,-.50,.014);
  for(let i=0;i<18;i++){const a=i*Math.PI*2/18;const magnet=add(backglass,rounded(.135,.067,.01,.015),shield,Math.sin(a)*.82,-.5+Math.cos(a)*.82,.012);magnet.rotation.z=-a;}
  add(backglass,rounded(.09,.27,.01,.02),shield,0,-1.56,.012);
  return {phone,groups,screws,screenSize:new THREE.Vector2(screenW,screenH),chassis,front,rear,materials};
}
