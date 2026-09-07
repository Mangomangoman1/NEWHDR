import * as THREE from './vendor/three/three.module.min.js';
import { createStudioEnvironment } from './repair-studio-lighting.mjs';
import { buildPhone } from './repair-phone-model.mjs?v=display-depth';
import { posePhone } from './repair-phone-rig.mjs?v=realism';
import { createInspector } from './repair-inspector.js?v=realism';
import { createInspectionView } from './repair-inspection-view.mjs?v=realism';
import { createBalletView, createPhoneCamera } from './repair-ballet-view.mjs?v=display-depth';
import { finishPhone } from './repair-phone-surfaces.mjs?v=realism';
import { createQualityGovernor } from './repair-render-quality.mjs';
import { cycleAt, powerAt, scrubTimeAt, CYCLE_SECONDS, smooth, phaseAt } from './repair-ballet-motion.mjs';

const PAUSE='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zm5 0h3v10H9z"/></svg>';
const PLAY='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5 13 8 4 13.5z"/></svg>';
function texture(width,height,paint) {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  paint(canvas.getContext('2d'),width,height);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map;
}
function batteryTexture() {
  return texture(384,852,(ctx,w,h)=>{
    ctx.fillStyle='#72777b';ctx.font='19px sans-serif';ctx.fillText('Rechargeable Li-ion Battery',27,564);
    ctx.font='14px sans-serif';ctx.fillText('Li-ion',27,594);
    ctx.fillStyle='#52585e';ctx.font='10px sans-serif';
    ['Handle with care.','Do not disassemble, puncture, crush,','heat or burn. Service by trained personnel.','Recycle according to local regulations.'].forEach((line,i)=>ctx.fillText(line,27,632+i*16));
    ctx.font='25px sans-serif';ctx.fillText('↻',27,746);
    for(let i=0;i<34;i++)ctx.fillRect(90+i*4,721,i%3===0?2:1,25);
  });
}
function componentTexture() {
  return texture(512,1024,(ctx,w)=>{
    ctx.textAlign='center';ctx.fillStyle='rgba(185,192,192,.70)';
    ctx.font='500 62px -apple-system, sans-serif';ctx.fillText('A18',w/2,95);
    ctx.font='500 25px sans-serif';ctx.fillText('PRO',w/2,136);
    ctx.font='15px monospace';ctx.fillText('APL1V07',w/2,185);
    ctx.fillStyle='rgba(160,169,175,.68)';ctx.font='18px monospace';ctx.fillText('339S   •   024',w/2,356);
    ctx.font='13px monospace';ctx.fillText('SHIELDED ASSEMBLY',w/2,390);
    // A tiny matrix-like manufacturing mark, authored with the model.
    for(let y=0;y<9;y++)for(let x=0;x<9;x++)if(x===0||y===8||((x*7+y*11)%5<2))ctx.fillRect(231+x*5,412+y*5,4,4);
    ctx.fillStyle='rgba(191,196,202,.8)';ctx.font='500 47px sans-serif';ctx.fillText('TAPTIC ENGINE',w/2,655);
    ctx.fillStyle='rgba(138,150,165,.58)';ctx.font='22px monospace';ctx.fillText('DISPLAY ASSEMBLY',w/2,862);
    ctx.font='14px monospace';ctx.fillText('FLEX • OLED • SHIELD',w/2,902);
    for(let i=0;i<68;i++)ctx.fillRect(120+i*4,925,i%3===0?2:1,29);
  });
}
function lockTexture() {
  return texture(660,1434,(ctx,w,h)=>{
    ctx.textAlign='center';ctx.fillStyle='#f4e5d9';
    ctx.font='500 25px -apple-system, BlinkMacSystemFont, sans-serif';ctx.fillText('Wednesday, September 9',w/2,208);
    ctx.font='300 138px -apple-system, BlinkMacSystemFont, sans-serif';ctx.fillText('9:41',w/2,337);
    ctx.fillStyle='rgba(244,229,217,.76)';ctx.font='15px sans-serif';ctx.fillText('Swipe up to open',w/2,h-116);
    // Quiet, familiar lock-screen controls, drawn rather than loaded as assets.
    for(const x of [89,w-89]){ctx.fillStyle='rgba(12,10,10,.48)';ctx.beginPath();ctx.arc(x,h-127,34,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#e1d4c9';ctx.fillStyle='#e1d4c9';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(80,h-141);ctx.lineTo(98,h-141);ctx.lineTo(94,h-130);ctx.lineTo(94,h-113);ctx.lineTo(84,h-113);ctx.lineTo(84,h-130);ctx.closePath();ctx.stroke();
    ctx.strokeRect(w-103,h-137,28,21);ctx.beginPath();ctx.arc(w-89,h-126,6,0,Math.PI*2);ctx.stroke();ctx.fillRect(w-96,h-141,14,4);
  });
}
export function createRepairBallet(aside) {
  const stage=aside.querySelector('.rb-stage'),slider=aside.querySelector('input[type="range"]');
  const playButton=aside.querySelector('[data-rb-play]'),replayButton=aside.querySelector('[data-rb-replay]'),turnButton=aside.querySelector('[data-rb-turn]'),phase=aside.querySelector('.rb-phase');
  const inspectButton=aside.querySelector('[data-rb-inspect]');
  const quality=createQualityGovernor(window.devicePixelRatio||1);
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setClearColor(0x0d1117,0);renderer.setPixelRatio(quality.current.pixelRatio);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const canvas=renderer.domElement;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','An iPhone 16 Pro Max inspired repair animation, with a titanium enclosure, shaped battery, logic board, display and three rear cameras.');stage.append(canvas);
  const scene=new THREE.Scene(),camera=createPhoneCamera();
  camera.position.set(7.6,5.7,11.5);camera.lookAt(0,0,0);
  const environment=createStudioEnvironment(renderer);
  scene.environment=environment.texture;scene.environmentIntensity=1.15;
  scene.add(new THREE.HemisphereLight(0xe4ecfa,0x282019,.38));
  for(const [color,intensity,position] of [[0xf3f5ff,2.6,[-3,6,7]],[0xc1d6f4,.9,[4,-2,3]],[0xffe2c2,1.2,[-5,-2,-4]]]) {
    const light=new THREE.DirectionalLight(color,intensity);light.position.set(...position);scene.add(light);
    if(position[1]===6){light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.5,far:24});light.shadow.bias=-.00008;light.shadow.normalBias=.002;light.shadow.radius=3;}
  }
  const screenUniforms={uPower:{value:0},uSize:{value:new THREE.Vector2(2.207,2.207*2868/1320)}};
  // Warm, glass-like elliptical ribbons echo the phone's titanium finish.
  const screenMaterial=new THREE.ShaderMaterial({uniforms:screenUniforms,
    vertexShader:`varying vec2 vScreen; uniform vec2 uSize; void main(){vScreen=position.xy/uSize+.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vScreen; uniform float uPower;
    void main(){vec2 uv=vScreen;float boot=uPower;
      vec3 col=vec3(.005,.004,.005);vec2 p=(uv-.5)*vec2(1.,2.1727);
      for(int i=0;i<3;i++){
        float f=float(i);vec2 q=p-vec2(.12-f*.075,-.12+f*.08);
        q=mat2(.92,-.39,.39,.92)*q;
        float d=length(q/vec2(.43+f*.21,.84+f*.32));
        float edge=exp(-abs(d-1.)*34.);
        float band=exp(-pow((d-.91)*9.,2.));
        float light=.26+.74*smoothstep(-.7,.7,q.x-q.y*.42);
        col+=vec3(.36,.22,.15)*band*light+vec3(.80,.61,.43)*edge*light;
      }
      col*=.02+boot*.98;
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const batteryMap=batteryTexture(),lockMap=lockTexture(),detailMap=componentTexture();
  for(const map of [batteryMap,lockMap,detailMap])map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const screenUI=new THREE.MeshBasicMaterial({map:lockMap,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
  const model=buildPhone({batteryMap,screenMaterial,screenUI,detailMap});
  const {phone,groups}=model;scene.add(phone);
  const disposeFinishes=finishPhone(model,renderer.capabilities.getMaxAnisotropy()),inspectionView=createInspectionView(model,camera);
  const paths=[[[.64,-.62],[.27,-.32],[.10,.34],[-.19,.65],[-.36,1.62]],[[.64,-.62],[.86,.02],[.94,.67]],[[.64,-.62],[-.03,-.83],[-.51,-1.40],[-.82,-1.9]],[[.64,-.62],[.81,-1.28],[.59,-1.99]],[[.27,-.32],[-.44,-.13],[-.97,.23]],[[-.19,.65],[.27,.98],[.6,1.48]],[[.64,-.62],[.99,-.93]]];
  const cracks=[];paths.forEach(path=>{for(let i=1;i<path.length;i++)cracks.push(...path[i-1],.0134,...path[i],.0134);});
  const crackGeometry=new THREE.BufferGeometry();crackGeometry.setAttribute('position',new THREE.Float32BufferAttribute(cracks,3));
  const crackMaterial=new THREE.LineBasicMaterial({color:0x9bb4cf,transparent:true,opacity:.5,depthWrite:false});groups.display.add(new THREE.LineSegments(crackGeometry,crackMaterial));
  const haloMap=texture(256,256,(ctx)=>{const gradient=ctx.createRadialGradient(128,128,0,128,128,128);gradient.addColorStop(0,'rgba(73,122,187,.18)');gradient.addColorStop(.45,'rgba(44,78,137,.10)');gradient.addColorStop(1,'rgba(13,17,23,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);});
  const backdrop=new THREE.Group();scene.add(backdrop);backdrop.quaternion.copy(camera.quaternion);backdrop.position.copy(camera.position).normalize().multiplyScalar(-2);
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(8.4,8.4),new THREE.MeshBasicMaterial({map:haloMap,transparent:true,depthWrite:false}));backdrop.add(halo);
  const orbitMaterial=new THREE.MeshBasicMaterial({color:0x7da4dc,transparent:true,opacity:.13,depthWrite:false});
  backdrop.add(new THREE.Mesh(new THREE.TorusGeometry(2.95,.004,4,160),orbitMaterial));
  const rippleMaterial=new THREE.MeshBasicMaterial({color:0x8bbbff,transparent:true,opacity:0,depthWrite:false});
  const ripple=new THREE.Mesh(new THREE.TorusGeometry(2.7,.008,5,144),rippleMaterial);backdrop.add(ripple);
  const balletView=createBalletView(model,camera);
  let time=motion.matches?11.5:0,progress=motion.matches?1:0,playing=!motion.matches,visible=false,lastTime=null,disposed=false,contextLost=false;
  let inspecting=false,savedState=null,manualPower=motion.matches,heldPower=null,reverseScrub=false;
  let rearView=false,angle=0,targetAngle=0,turning=false,aspect=1,lastUI=-1;
  const pointer={x:0,y:0},view={x:0,y:0},backdropOffset=new THREE.Vector3();
  function syncControls() {
    playButton.innerHTML=playing?PAUSE:PLAY;playButton.setAttribute('aria-label',playing?'Pause repair animation':'Play repair animation');playButton.setAttribute('aria-pressed',String(playing));
    turnButton.setAttribute('aria-label',rearView?'View front of phone':'View back of phone');turnButton.setAttribute('aria-pressed',String(rearView));
    const percent=Math.round(progress*100);slider.value=String(percent);slider.style.setProperty('--rb-fill',`${percent}%`);slider.setAttribute('aria-valuetext',`${percent}% assembled`);phase.textContent=phaseAt(progress);
  }
  function draw(delta=1/60) {
    if(disposed||contextLost)return;
    posePhone(model,progress,time);
    if(inspecting){
      phone.rotation.set(0,0,0);phone.position.y=0;inspectionView.update(aspect,delta,motion.matches);backdrop.visible=false;
    }else{
      const target=balletView.update(time,progress,aspect,angle,view);
      // Keep the halo behind the hardware as the camera travels around it.
      backdrop.visible=true;backdrop.quaternion.copy(camera.quaternion);
      backdropOffset.copy(camera.position).sub(target).normalize();
      backdrop.position.copy(target).addScaledVector(backdropOffset,-6);
    }
    const power=manualPower?smooth(.94,1,progress):heldPower??powerAt(time);
    screenUniforms.uPower.value=power;screenUI.opacity=power;crackMaterial.opacity=.45*(1-smooth(.60,.95,progress));
    const pulse=smooth(.91,1,progress);ripple.scale.setScalar(1+pulse*.32);rippleMaterial.opacity=Math.sin(pulse*Math.PI)*.20;
    renderer.render(scene,camera);aside.dataset.rendered='true';
    if(Math.round(progress*100)!==lastUI){lastUI=Math.round(progress*100);syncControls();if(inspecting)inspector.setProgress(progress);}
  }
  function tick(now) {
    const elapsed=lastTime===null?0:now-lastTime,delta=Math.min(elapsed/1000,.06);lastTime=now;
    if(playing&&!inspecting){time+=delta;progress=cycleAt(time);const follow=1-Math.exp(-delta*5);view.x+=(pointer.x-view.x)*follow;view.y+=(pointer.y-view.y)*follow;}
    if(turning){angle+=(targetAngle-angle)*(1-Math.exp(-delta*6));if(Math.abs(angle-targetAngle)<.0005){angle=targetAngle;turning=false;}}
    draw(delta);
    if(playing&&!inspecting){const next=quality.sample(elapsed);if(next){renderer.setPixelRatio(next.pixelRatio);renderer.shadowMap.enabled=next.shadows;resize();}}
    if((inspecting&&!inspectionView.moving)||(!inspecting&&!playing&&!turning))updateLoop();
  }
  let running=false;
  function updateLoop(){
    const rect=aside.getBoundingClientRect();visible=rect.bottom>0&&rect.top<window.innerHeight;
    const active=(inspecting?inspectionView.moving:(playing||turning)&&visible)&&!document.hidden&&!contextLost&&!disposed;
    if(active!==running){running=active;lastTime=null;quality.resetSamples();renderer.setAnimationLoop(active?tick:null);}
  }
  function resize(){const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;aspect=width/height;renderer.setSize(width,height,false);draw();updateLoop();}
  function setPlaying(value){if(!value&&playing&&!manualPower)heldPower=powerAt(time);playing=value;syncControls();updateLoop();}
  function onPlay(){if(!playing){manualPower=false;heldPower=null;}setPlaying(!playing);}
  function onReplay(){time=0;progress=0;rearView=false;angle=targetAngle=0;turning=false;manualPower=false;heldPower=null;setPlaying(true);draw();}
  function onScrub(){
    if(!manualPower)reverseScrub=time%CYCLE_SECONDS>=14;
    progress=Number(slider.value)/100;manualPower=true;heldPower=null;setPlaying(false);
    // Retain the current leg so touching the slider during disassembly does not
    // teleport the camera to the other side of the device.
    time=scrubTimeAt(progress,reverseScrub);
    draw();
  }
  function onTurn(){rearView=!rearView;targetAngle=rearView?Math.PI:0;turning=!motion.matches;if(!turning)angle=targetAngle;syncControls();draw();updateLoop();}
  function onPointer(event){if(inspecting)return;const bounds=stage.getBoundingClientRect();pointer.x=(event.clientX-bounds.left)/bounds.width*2-1;pointer.y=(event.clientY-bounds.top)/bounds.height*2-1;}
  function onLeave(){pointer.x=0;pointer.y=0;}
  function onMotion(){if(motion.matches){angle=targetAngle;turning=false;view.x=0;view.y=0;setPlaying(false);draw();}}
  function onLost(event){event.preventDefault();contextLost=true;aside.dataset.rendered='false';aside.dataset.state='unavailable';updateLoop();}
  function onRestore(){contextLost=false;aside.dataset.state='ready';resize();updateLoop();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;updateLoop();},{threshold:.02});visibilityObserver.observe(aside);
  playButton.addEventListener('click',onPlay);replayButton.addEventListener('click',onReplay);turnButton.addEventListener('click',onTurn);slider.addEventListener('input',onScrub);
  stage.addEventListener('pointermove',onPointer,{passive:true});stage.addEventListener('pointerleave',onLeave);document.addEventListener('visibilitychange',updateLoop);window.addEventListener('scroll',updateLoop,{passive:true});motion.addEventListener('change',onMotion);
  canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestore);
  for(const control of [playButton,replayButton,turnButton,slider,inspectButton])control.disabled=false;
  function inspectionChange(action){action();draw();updateLoop();}
  const inspector=createInspector({aside,stage,canvas,
    onOpen(){
      savedState={time,progress,playing,rearView,angle,targetAngle,turning,manualPower,heldPower,y:phone.position.y};
      inspecting=true;playing=false;turning=false;manualPower=true;heldPower=null;progress=0;inspectionView.open();inspector.setProgress(0);syncControls();resize();
    },
    onClose(){
      inspecting=false;inspectionView.close();({time,progress,playing,rearView,angle,targetAngle,turning,manualPower,heldPower}=savedState);phone.position.y=savedState.y;
      syncControls();resize();updateLoop();
    },
    onOrbit:(dx,dy)=>inspectionChange(()=>inspectionView.rotate(dx,dy)),
    onPan:(dx,dy)=>inspectionChange(()=>inspectionView.pan(dx,dy)),
    onZoom:factor=>inspectionChange(()=>inspectionView.zoom(factor)),
    onPart:id=>inspectionChange(()=>inspectionView.select(id)),
    onAssembly:value=>inspectionChange(()=>{progress=value;manualPower=true;inspector.setProgress(value);}),
    onReset:()=>inspectionChange(()=>inspectionView.reset()),
    onPick:(x,y)=>inspectionView.pick(x,y,canvas.getBoundingClientRect())
  });
  aside.dataset.state='ready';syncControls();resize();
  function dispose(event) {
    if(event.persisted){renderer.setAnimationLoop(null);running=false;lastTime=null;return;}
    disposed=true;inspector.dispose();renderer.setAnimationLoop(null);visibilityObserver.disconnect();resizeObserver.disconnect();document.removeEventListener('visibilitychange',updateLoop);window.removeEventListener('scroll',updateLoop);motion.removeEventListener('change',onMotion);window.removeEventListener('pageshow',updateLoop);window.removeEventListener('pagehide',dispose);
    const geometries=new Set(),materials=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());disposeFinishes();batteryMap.dispose();lockMap.dispose();detailMap.dispose();haloMap.dispose();environment.dispose();renderer.dispose();
  }
  window.addEventListener('pagehide',dispose);window.addEventListener('pageshow',updateLoop);
}
