import * as THREE from './vendor/three/three.module.min.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { cycleAt, layerAt, layers, smooth, phaseAt } from './repair-ballet-motion.mjs';

const PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zm5 0h3v10H9z"/></svg>';
const PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5 13 8 4 13.5z"/></svg>';

// XY outlines extrude toward the camera. Dimensions are illustrative, not a device schematic.
function outline(width, height, radius) {
  const x=-width/2, y=-height/2, r=radius;
  return new THREE.Shape().moveTo(x+r,y).lineTo(x+width-r,y)
    .quadraticCurveTo(x+width,y,x+width,y+r).lineTo(x+width,y+height-r)
    .quadraticCurveTo(x+width,y+height,x+width-r,y+height).lineTo(x+r,y+height)
    .quadraticCurveTo(x,y+height,x,y+height-r).lineTo(x,y+r)
    .quadraticCurveTo(x,y,x+r,y);
}
function rounded(width,height,depth,radius=.12, hole=null) {
  const shape=outline(width,height,radius);
  if(hole) shape.holes.push(new THREE.Path(outline(hole[0],hole[1],hole[2]).getPoints(12).reverse()));
  const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.017,bevelThickness:.012,curveSegments:12});
  geometry.translate(0,0,-depth/2);
  return geometry;
}
function place(parent,geometry,material,x=0,y=0,z=0) {
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  parent.add(mesh);
  return mesh;
}
function labelTexture() {
  const canvas=document.createElement('canvas'); canvas.width=256;canvas.height=512;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#161b22';ctx.fillRect(0,0,256,512);
  ctx.strokeStyle='#303944';ctx.lineWidth=2;ctx.strokeRect(12,12,232,488);
  ctx.fillStyle='#8494a5';ctx.font='500 23px monospace';ctx.fillText('HDR',30,65);
  ctx.fillStyle='#4f5d6b';ctx.font='14px monospace';ctx.fillText('Li-ion',30,92);
  ctx.fillStyle='#53616e';ctx.font='10px monospace';ctx.fillText('RECHARGEABLE',30,350);
  ctx.fillText('HANDLE WITH CARE',30,370);
  for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#414b58':'#313c49';ctx.fillRect(30,393+i*10,100+(i%3)*24,3);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}
function haloTexture() {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const ctx=canvas.getContext('2d');const gradient=ctx.createRadialGradient(128,128,0,128,128,128);
  gradient.addColorStop(0,'rgba(73,122,187,.18)');gradient.addColorStop(.45,'rgba(44,78,137,.10)');gradient.addColorStop(1,'rgba(13,17,23,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export function createRepairBallet(aside) {
  const stage=aside.querySelector('.rb-stage');
  const slider=aside.querySelector('input[type="range"]');
  const playButton=aside.querySelector('[data-rb-play]');
  const replayButton=aside.querySelector('[data-rb-replay]');
  const phase=aside.querySelector('.rb-phase');
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setClearColor(0x0d1117,0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.25;
  const canvas=renderer.domElement;
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','A stylized phone separating into its frame, circuit board, battery, screen, and screws, then reassembling.');
  stage.append(canvas);
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-5,5,3.8,-3.8,.1,80);
  camera.position.set(7.6,5.7,11.5);camera.lookAt(0,0,1.2);
  const room=new RoomEnvironment();
  const pmrem=new THREE.PMREMGenerator(renderer);
  const environment=pmrem.fromScene(room,.035);
  scene.environment=environment.texture;scene.environmentIntensity=1.45;
  room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xdcecff,0x0d1423,2));
  const key=new THREE.DirectionalLight(0xe4eeff,3.7);key.position.set(-3,6,7);scene.add(key);
  const rim=new THREE.DirectionalLight(0x78aaff,2.6);rim.position.set(4,-2,3);scene.add(rim);
  const warm=new THREE.DirectionalLight(0xffdcb2,1.6);warm.position.set(-5,-2,2);scene.add(warm);

  const titanium=new THREE.MeshStandardMaterial({color:0x8997ab,metalness:1,roughness:.26});
  const polished=new THREE.MeshStandardMaterial({color:0xc5ceda,metalness:1,roughness:.18});
  const black=new THREE.MeshStandardMaterial({color:0x0d1521,metalness:.42,roughness:.38});
  const graphite=new THREE.MeshStandardMaterial({color:0x17202c,metalness:.55,roughness:.31});
  const pcb=new THREE.MeshStandardMaterial({color:0x184a44,metalness:.44,roughness:.38});
  const copper=new THREE.MeshStandardMaterial({color:0xc58f5e,metalness:.92,roughness:.3});
  const gold=new THREE.MeshStandardMaterial({color:0xd7b877,metalness:.88,roughness:.23});
  const lens=new THREE.MeshPhysicalMaterial({color:0x122641,metalness:.7,roughness:.12,clearcoat:1});
  const phone=new THREE.Group();scene.add(phone);phone.rotation.z=-.28;
  const groups=layers.map(()=>new THREE.Group());groups.forEach(g=>phone.add(g));
  const [housing,board,battery,frame,display]=groups;
  place(housing,rounded(2.34,4.64,.15,.25),titanium);
  place(housing,rounded(2.17,4.47,.025,.21),black,0,0,.09);
  // Machined edge, side controls, and tiny speaker perforations.
  for(const x of [-1.19,1.19]) place(housing,rounded(.045,.64,.06,.018),polished,x,.67,0);
  const holeGeometry=new THREE.CylinderGeometry(.019,.019,.025,8);holeGeometry.rotateX(Math.PI/2);
  const perforations=new THREE.InstancedMesh(holeGeometry,black,14);housing.add(perforations);
  const matrix=new THREE.Matrix4();
  for(let i=0;i<14;i++){matrix.makeTranslation((i<7?-.82:.38)+(i%7)*.075,-2.326,.02);perforations.setMatrixAt(i,matrix);}
  place(housing,rounded(.34,.085,.055,.035),black,0,-2.316,.025);
  // Copper induction coil lives under the battery; revealed in the exploded view.
  for(let i=0;i<13;i++) place(housing,new THREE.TorusGeometry(.30+i*.024,.009,5,64),copper,0,-.45,.12);
  const boardShape=new THREE.Shape().moveTo(-.99,-2.02).lineTo(-.53,-2.02).lineTo(-.53,1.0).lineTo(.99,1.0).lineTo(.99,2.02).lineTo(-.99,2.02).closePath();
  const boardGeometry=new THREE.ExtrudeGeometry(boardShape,{depth:.055,bevelEnabled:true,bevelThickness:.008,bevelSize:.01,bevelSegments:1});
  place(board,boardGeometry,pcb);
  // Layered chip packages with gold feet, kept deliberately legible at small sizes.
  [[-.7,1.45,.4,.64],[.15,1.48,.65,.66],[-.75,.48,.28,.42],[-.75,-.35,.28,.55],[-.75,-1.2,.29,.55]].forEach(([x,y,w,h])=>{
    place(board,rounded(w,h,.075,.028),graphite,x,y,.1);
    place(board,rounded(w*.7,h*.68,.008,.018),titanium,x,y,.145);
    for(let j=0;j<5;j++) for(const side of [-1,1]) place(board,new THREE.BoxGeometry(.042,.035,.025),gold,x+side*(w/2+.028),y-h*.36+j*h*.18,.09);
  });
  const traces=[];
  for(let i=0;i<12;i++) {
    const x=-.94+i*.026,y=-1.88+i*.09;
    traces.push(x,y,.067,x,y+1.92,.067,x,y+1.92,.067,x+.08,y+2.0,.067);
  }
  for(let i=0;i<9;i++) {
    const y=1.13+i*.08;traces.push(-.44,y,.067,.73,y,.067,.73,y,.067,.87,y+.12,.067);
  }
  const traceGeometry=new THREE.BufferGeometry();traceGeometry.setAttribute('position',new THREE.Float32BufferAttribute(traces,3));
  board.add(new THREE.LineSegments(traceGeometry,new THREE.LineBasicMaterial({color:0xa89462,transparent:true,opacity:.57})));
  const cameraPod=new THREE.Group();cameraPod.position.set(.68,1.65,.11);board.add(cameraPod);
  for(const y of [-.22,.22]) {
    place(cameraPod,new THREE.CylinderGeometry(.20,.20,.11,32).rotateX(Math.PI/2),black,0,y,0);
    place(cameraPod,new THREE.CylinderGeometry(.135,.135,.012,32).rotateX(Math.PI/2),lens,0,y,.065);
    place(cameraPod,new THREE.TorusGeometry(.16,.012,6,32),polished,0,y,.068);
  }
  const batteryMap=labelTexture();
  const labelMaterial=new THREE.MeshStandardMaterial({map:batteryMap,roughness:.5,metalness:.15});
  for(const x of [-.1,.6]) {
    place(battery,rounded(.65,2.75,.10,.08),black,x,-.55,0);
    place(battery,new THREE.PlaneGeometry(.61,2.67),labelMaterial,x,-.55,.062);
    place(battery,new THREE.BoxGeometry(.16,.22,.028),copper,x,.88,-.025);
  }
  place(frame,rounded(2.26,4.56,.042,.235,[2.06,4.34,.19]),polished);
  for(const y of [-2.15,2.15]) place(frame,new THREE.BoxGeometry(1.1,.06,.02),graphite,0,y,-.014);
  place(display,rounded(2.24,4.5,.09,.23),polished);
  place(display,rounded(2.17,4.43,.045,.21),black,0,0,.06);

  const screenUniforms={uTime:{value:0},uRepair:{value:0},uSize:{value:new THREE.Vector2(2.05,4.23)}};
  const screenMaterial=new THREE.ShaderMaterial({uniforms:screenUniforms,
    vertexShader:`varying vec2 vScreen; uniform vec2 uSize; void main(){vScreen=position.xy/uSize+.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vScreen;uniform float uTime;uniform float uRepair;
    float segment(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;return length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.,1.));}
    void main(){vec2 uv=vScreen;float boot=smoothstep(.86,1.,uRepair);
      vec3 col=mix(vec3(.008,.015,.028),vec3(.018,.037,.075),uv.y);
      float curve=.42+.2*sin(uv.y*4.6+uTime*.2)+uv.y*.13;
      float wave=exp(-pow((uv.x-curve)*5.8,2.));
      float filament=exp(-pow((uv.x-curve+.025)*63.,2.));
      col+=vec3(.035,.12,.3)*wave*(.32+boot*.9);
      col+=vec3(.24,.45,.8)*filament*(.15+boot*.7);
      col+=vec3(.045,.12,.22)*exp(-pow((uv.x-curve-.15)*15.,2.));
      vec2 p=(uv-vec2(.5,.51))*vec2(1.,2.06);
      float ring=1.-smoothstep(.006,.012,abs(length(p)-.19));
      float check=min(segment(p,vec2(-.075,0.),vec2(-.012,-.05)),segment(p,vec2(-.012,-.05),vec2(.09,.07)));
      col+=vec3(.46,.72,1.)*(ring*.65+(1.-smoothstep(.008,.014,check)))*boot;
      float scan=exp(-pow((uv.y-(1.0-uRepair))*70.,2.))*(1.-boot)*smoothstep(.15,.45,uRepair);
      col+=vec3(.14,.37,.6)*scan;
      col+=vec3(.045,.065,.09)*pow(uv.x*uv.y,2.);
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  place(display,new THREE.ShapeGeometry(outline(2.05,4.23,.17)),screenMaterial,0,0,.087);
  place(display,rounded(.43,.095,.007,.045),black,0,1.91,.105);
  place(display,rounded(.56,.016,.003,.008),new THREE.MeshBasicMaterial({color:0x7893b9}),0,-1.96,.1);
  const cracks=[];
  const paths=[[[.64,-.62],[.27,-.32],[.10,.34],[-.19,.65],[-.36,1.62]],[[.64,-.62],[.86,.02],[.94,.67]],[[.64,-.62],[-.03,-.83],[-.51,-1.40],[-.82,-1.9]],[[.64,-.62],[.81,-1.28],[.59,-1.99]],[[.27,-.32],[-.44,-.13],[-.97,.23]],[[-.19,.65],[.27,.98],[.6,1.48]],[[.64,-.62],[.99,-.93]]];
  paths.forEach(path=>{for(let i=1;i<path.length;i++) cracks.push(...path[i-1],.108,...path[i],.108);});
  const crackGeometry=new THREE.BufferGeometry();crackGeometry.setAttribute('position',new THREE.Float32BufferAttribute(cracks,3));
  const crackMaterial=new THREE.LineBasicMaterial({color:0x9bb4cf,transparent:true,opacity:.7});
  display.add(new THREE.LineSegments(crackGeometry,crackMaterial));

  const screws=[];
  for(const x of [-1.02,1.02]) for(const y of [-2.04,2.04]) {
    const screw=new THREE.Group();phone.add(screw);
    place(screw,new THREE.CylinderGeometry(.034,.034,.15,10).rotateX(Math.PI/2),titanium,0,0,-.045);
    place(screw,new THREE.CylinderGeometry(.073,.073,.035,20).rotateX(Math.PI/2),polished,0,0,.045);
    place(screw,new THREE.BoxGeometry(.089,.017,.004),black,0,0,.065);
    place(screw,new THREE.BoxGeometry(.017,.089,.004),black,0,0,.065);
    for(let i=0;i<4;i++) place(screw,new THREE.TorusGeometry(.035,.006,4,12),graphite,0,0,-.10+i*.025);
    screws.push({mesh:screw,x,y,index:screws.length});
  }
  // A restrained orbital halo catches the final assembly, rather than confetti.
  const haloMap=haloTexture();
  const halo=place(phone,new THREE.PlaneGeometry(8.4,8.4),new THREE.MeshBasicMaterial({map:haloMap,transparent:true,depthWrite:false}),0,0,-.25);
  const orbitMaterial=new THREE.MeshBasicMaterial({color:0x7da4dc,transparent:true,opacity:.18,depthWrite:false});
  const orbit=place(phone,new THREE.TorusGeometry(3.07,.006,4,160),orbitMaterial,0,0,-.21);
  const rippleMaterial=new THREE.MeshBasicMaterial({color:0x8bbbff,transparent:true,opacity:0,depthWrite:false});
  const ripple=place(phone,new THREE.TorusGeometry(2.7,.011,5,144),rippleMaterial,0,0,-.18);
  const sparkGeometry=new THREE.BufferGeometry();const sparkPositions=[];
  for(let i=0;i<22;i++){const a=i*2.399963;sparkPositions.push(Math.cos(a)*(2.85+(i%3)*.12),Math.sin(a)*(2.85+(i%3)*.12),-.2+(i%4)*.04);}
  sparkGeometry.setAttribute('position',new THREE.Float32BufferAttribute(sparkPositions,3));
  const sparks=new THREE.Points(sparkGeometry,new THREE.PointsMaterial({color:0x9abce9,size:.022,transparent:true,opacity:.5}));phone.add(sparks);

  let time=0,progress=motion.matches?.42:0,playing=!motion.matches,visible=false,lastTime=null,disposed=false,contextLost=false;
  const pointer={x:0,y:0},view={x:0,y:0};
  let lastUI=-1;
  function syncControls() {
    playButton.innerHTML=playing?PAUSE:PLAY;
    playButton.setAttribute('aria-label',playing?'Pause repair animation':'Play repair animation');
    playButton.setAttribute('aria-pressed',String(playing));
    const percent=Math.round(progress*100);
    slider.value=String(percent);slider.style.setProperty('--rb-fill',`${percent}%`);
    slider.setAttribute('aria-valuetext',`${percent}% assembled`);
    phase.textContent=phaseAt(progress);
  }
  function draw() {
    if(disposed||contextLost) return;
    groups.forEach((group,i)=>{
      const position=layerAt(layers[i],progress);
      group.position.z=position.z;
      group.position.x=Math.sin(i*1.2)*position.open*.085;
      group.position.y=Math.sin(time*.65+i*.65)*position.open*.025;
      group.rotation.z=Math.sin(time*.4+i)*position.open*.016;
    });
    const fasten=smooth(.79,1,progress);
    screws.forEach(({mesh,x,y,index})=>{
      const open=1-fasten;
      const angle=open*Math.PI*4+index;
      mesh.position.set(x+Math.cos(angle)*open*.24,y+Math.sin(angle)*open*.24,.37+open*(3.1+index*.08));
      mesh.rotation.set(open*.14*Math.sin(angle),open*.15,open*Math.PI*8);
      mesh.scale.setScalar(1+open*.20);
    });
    phone.rotation.x=-.07+view.y*.10;
    phone.rotation.y=.10+view.x*.16;
    phone.rotation.z=-.28+view.x*.05;
    phone.position.y=Math.sin(time*.7)*.055;
    screenUniforms.uTime.value=time;screenUniforms.uRepair.value=progress;
    crackMaterial.opacity=.5*(1-smooth(.60,.95,progress));
    const pulse=smooth(.91,1,progress);
    ripple.scale.setScalar(1+pulse*.32);
    rippleMaterial.opacity=Math.sin(pulse*Math.PI)*.27;
    orbitMaterial.opacity=.13+Math.sin(time*.5)*.035;
    sparks.rotation.z=time*.018;
    renderer.render(scene,camera);
    if(aside.dataset.rendered!=='true') aside.dataset.rendered='true';
    const percent=Math.round(progress*100);
    if(percent!==lastUI){lastUI=percent;slider.value=String(percent);slider.style.setProperty('--rb-fill',`${percent}%`);slider.setAttribute('aria-valuetext',`${percent}% assembled`);phase.textContent=phaseAt(progress);}
  }
  function tick(now) {
    const delta=lastTime===null?0:Math.min((now-lastTime)/1000,.06);lastTime=now;
    time+=delta;progress=cycleAt(time);
    const follow=1-Math.exp(-delta*5);
    view.x+=(pointer.x-view.x)*follow;view.y+=(pointer.y-view.y)*follow;
    draw();
  }
  function updateLoop() {
    lastTime=null;
    renderer.setAnimationLoop(playing&&visible&&!document.hidden&&!contextLost&&!disposed?tick:null);
  }
  function resize() {
    const {width,height}=stage.getBoundingClientRect();if(!width||!height) return;
    const aspect=width/height;
    const halfHeight=Math.max(3.65,3.45/aspect);
    camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);draw();
  }
  function setPlaying(value) { playing=value;syncControls();updateLoop(); }
  function onPlay() {
    if(!playing) {
      // Find the assembly leg at the scrubbed position; resume without a jump.
      let low=2,high=8;
      for(let i=0;i<24;i++){const mid=(low+high)/2;if(cycleAt(mid)<progress)low=mid;else high=mid;}
      time=progress>=1?8:(low+high)/2;
    }
    setPlaying(!playing);
  }
  function onReplay(){time=0;progress=0;draw();setPlaying(true);}
  function onScrub(){progress=Number(slider.value)/100;setPlaying(false);draw();}
  function onPointer(event){const bounds=stage.getBoundingClientRect();pointer.x=(event.clientX-bounds.left)/bounds.width*2-1;pointer.y=(event.clientY-bounds.top)/bounds.height*2-1;}
  function onLeave(){pointer.x=0;pointer.y=0;}
  function onMotion(){if(motion.matches){setPlaying(false);view.x=0;view.y=0;draw();}}
  function onLost(event){event.preventDefault();contextLost=true;aside.dataset.rendered='false';aside.dataset.state='unavailable';updateLoop();}
  function onRestore(){contextLost=false;aside.dataset.state='ready';resize();updateLoop();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;updateLoop();},{threshold:.02});visibilityObserver.observe(aside);
  playButton.addEventListener('click',onPlay);replayButton.addEventListener('click',onReplay);
  slider.addEventListener('input',onScrub);
  stage.addEventListener('pointermove',onPointer,{passive:true});stage.addEventListener('pointerleave',onLeave);
  document.addEventListener('visibilitychange',updateLoop);
  motion.addEventListener('change',onMotion);
  canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestore);
  for(const button of [playButton,replayButton,slider]) button.disabled=false;
  aside.dataset.state='ready';syncControls();resize();
  function dispose(event) {
    if(event.persisted) {renderer.setAnimationLoop(null);lastTime=null;return;}
    disposed=true;renderer.setAnimationLoop(null);visibilityObserver.disconnect();resizeObserver.disconnect();
    document.removeEventListener('visibilitychange',updateLoop);motion.removeEventListener('change',onMotion);
    window.removeEventListener('pageshow',updateLoop);
    const geometries=new Set(),materials=new Set();
    scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    batteryMap.dispose();haloMap.dispose();environment.dispose();renderer.dispose();
  }
  window.addEventListener('pagehide',dispose);
  window.addEventListener('pageshow',updateLoop);
}
