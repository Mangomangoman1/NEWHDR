export const PARTS = [
  {id:'all',name:'Whole phone',description:'An iPhone 16 Pro Max study. Drag to turn it; use the slider to bring every part home.'},
  {id:'display',name:'Display',description:'The thin OLED assembly, its graphite backing, and the flex cable that folds into the board.'},
  {id:'battery',name:'Battery',description:'One shaped power pack, with foil wrapping, pull tabs, and a small press-fit connector.'},
  {id:'cameras',name:'Cameras',description:'Three optical modules, their shared carrier and integrated LiDAR, with layered sapphire lens windows.'},
  {id:'board',name:'Logic board',description:'Fine copper routing, soldered components, and removable shields over the chip packages.'},
  {id:'haptic',name:'Taptic Engine',description:'The compact haptic assembly, tucked beside the speaker at the bottom of the enclosure.'},
  {id:'speakers',name:'Top speaker',description:'The upper acoustic chamber and antenna assembly, with shielding, contacts and mounting hardware.'},
  {id:'loudspeaker',name:'Bottom speaker',description:'The lower speaker chamber, its rubber seal and the fine perforations of the acoustic grille.'},
  {id:'charging',name:'Charging & mic',description:'The USB-C socket, dock flex cable, contact fingers and main microphone assembly.'},
  {id:'truedepth',name:'TrueDepth',description:'The front sensor bridge, with recessed optical windows and grounding contacts.'},
  {id:'backglass',name:'Rear glass',description:'Matte glass on the outside; the copper charging coil and its magnet ring on the inside.'}
];

export function createInspector({aside,stage,canvas,onOpen,onClose,onOrbit,onPan,onZoom,onPick,onPart,onAssembly,onReset}) {
  const opener=aside.querySelector('[data-rb-inspect]');
  const dialog=document.createElement('dialog');dialog.className='rb-inspector';dialog.id='repair-inspector';
  dialog.setAttribute('aria-labelledby','rbi-title');
  dialog.innerHTML=`
    <header class="rbi-header"><div><span class="rbi-kicker">A closer look</span><h2 id="rbi-title">Every part. Up close.</h2></div><button class="rbi-close" type="button" aria-label="Close inspection" autofocus>×</button></header>
    <div class="rbi-viewport"><p class="rbi-hint">Drag to turn · <span class="rbi-desktop-hint">Shift-drag to pan</span><span class="rbi-touch-hint">pinch to zoom</span></p><div class="rbi-tools" aria-label="Model view controls">
      <button type="button" data-orbit="-1" aria-label="Rotate left" title="Rotate left">↶</button><button type="button" data-orbit="1" aria-label="Rotate right" title="Rotate right">↷</button>
      <button type="button" data-zoom="0.8" aria-label="Zoom in" title="Zoom in">+</button><button type="button" data-zoom="1.25" aria-label="Zoom out" title="Zoom out">−</button>
      <button type="button" data-reset aria-label="Reset inspection view" title="Reset view">⤢</button>
    </div></div>
    <footer class="rbi-footer"><div class="rbi-parts" role="group" aria-label="Inspect a component">${PARTS.map(p=>`<button type="button" data-part="${p.id}" aria-pressed="${p.id==='all'}">${p.name}</button>`).join('')}</div>
      <div class="rbi-bottom"><div class="rbi-description" aria-live="polite"><h3>Whole phone</h3><p>${PARTS[0].description}</p></div>
      <label class="rb-scrubber rbi-scrubber"><span aria-hidden="true">Apart</span><span class="rb-sr-only">Inspection assembly</span><input type="range" min="0" max="100" value="0" step="1" aria-valuetext="0% assembled"/><span aria-hidden="true">Together</span></label></div>
    </footer>`;
  document.body.append(dialog);
  const viewport=dialog.querySelector('.rbi-viewport'),range=dialog.querySelector('input'),strip=dialog.querySelector('.rbi-parts'),pointers=new Map();
  function revealSelection(){
    if(!dialog.open)return;const selected=strip.querySelector('[aria-pressed="true"]'),outer=strip.getBoundingClientRect(),inner=selected.getBoundingClientRect();
    if(inner.left<outer.left)strip.scrollLeft-=outer.left-inner.left;else if(inner.right>outer.right)strip.scrollLeft+=inner.right-outer.right;
  }
  const stripObserver=new ResizeObserver(revealSelection);stripObserver.observe(strip);
  let placeholder=null,returnFocus=null,oldOverflow='',dragStart=null,pinched=false;
  function select(id,notify=true){
    const part=PARTS.find(p=>p.id===id)||PARTS[0];
    dialog.querySelectorAll('[data-part]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.part===part.id)));
    dialog.querySelector('.rbi-description h3').textContent=part.name;dialog.querySelector('.rbi-description p').textContent=part.description;
    revealSelection();if(notify)onPart(part.id);
  }
  function setProgress(progress){const percent=Math.round(progress*100);range.value=String(percent);range.style.setProperty('--rb-fill',`${percent}%`);range.setAttribute('aria-valuetext',`${percent}% assembled`);}
  function open(){
    if(dialog.open||opener.disabled)return;
    returnFocus=document.activeElement;oldOverflow=document.body.style.overflow;placeholder=document.createComment('repair-stage');stage.before(placeholder);viewport.prepend(stage);
    canvas.tabIndex=0;canvas.setAttribute('role','group');canvas.setAttribute('aria-label','3D phone inspection. Arrow keys rotate. Shift and arrow keys pan. Plus and minus zoom. Home resets the view.');
    dialog.showModal();document.body.style.overflow='hidden';opener.setAttribute('aria-expanded','true');select('all',false);onOpen();
  }
  function close(){dialog.close();}
  function finishClose(){
    pointers.clear();dragStart=null;pinched=false;
    placeholder?.replaceWith(stage);placeholder=null;document.body.style.overflow=oldOverflow;opener.setAttribute('aria-expanded','false');
    canvas.removeAttribute('tabindex');canvas.setAttribute('role','img');canvas.setAttribute('aria-label','An iPhone 16 Pro Max inspired repair animation.');onClose();
    if(returnFocus instanceof HTMLElement)returnFocus.focus({preventScroll:true});
  }
  function down(event){
    if(!dialog.open||event.button!==0)return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});canvas.setPointerCapture(event.pointerId);
    if(pointers.size===1)dragStart={x:event.clientX,y:event.clientY,moved:false};else pinched=true;
  }
  function move(event){
    if(!dialog.open||!pointers.has(event.pointerId))return;
    const old=pointers.get(event.pointerId),next={x:event.clientX,y:event.clientY};
    if(pointers.size===2){
      const other=[...pointers.entries()].find(([id])=>id!==event.pointerId)[1];
      const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(next.x-other.x,next.y-other.y);
      if(before>8&&after>8)onZoom(before/after);
      onPan((next.x-old.x)/(canvas.clientHeight*2),(next.y-old.y)/(canvas.clientHeight*2));
    }else{
      if(event.shiftKey)onPan((next.x-old.x)/canvas.clientHeight,(next.y-old.y)/canvas.clientHeight);
      else onOrbit((next.x-old.x)*.008,(next.y-old.y)*.008);
      if(dragStart&&Math.hypot(next.x-dragStart.x,next.y-dragStart.y)>5)dragStart.moved=true;
    }
    pointers.set(event.pointerId,next);
  }
  function up(event){
    if(!pointers.has(event.pointerId))return;
    const pick=event.type==='pointerup'&&!pinched&&dragStart&&!dragStart.moved;
    pointers.delete(event.pointerId);if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    if(pick){const id=onPick(event.clientX,event.clientY);if(id)select(id);}
    if(!pointers.size){dragStart=null;pinched=false;}
  }
  function wheel(event){if(dialog.open){event.preventDefault();onZoom(Math.exp(Math.max(-100,Math.min(100,event.deltaY))*.002));}}
  function key(event){
    if(!dialog.open)return;
    if(event.shiftKey&&event.key.startsWith('Arrow')){event.preventDefault();onPan(event.key==='ArrowLeft'?-.08:event.key==='ArrowRight'?.08:0,event.key==='ArrowUp'?-.08:event.key==='ArrowDown'?.08:0);return;}
    const actions={ArrowLeft:()=>onOrbit(-.2,0),ArrowRight:()=>onOrbit(.2,0),ArrowUp:()=>onOrbit(0,-.15),ArrowDown:()=>onOrbit(0,.15),'+':()=>onZoom(.8),'=':()=>onZoom(.8),'-':()=>onZoom(1.25),Home:onReset};
    if(actions[event.key]){event.preventDefault();actions[event.key]();}
  }
  function canvasClick(){if(!dialog.open)open();}
  opener.addEventListener('click',open);canvas.addEventListener('click',canvasClick);
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);
  dialog.querySelector('.rbi-close').addEventListener('click',close);dialog.addEventListener('close',finishClose);
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=[...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
  dialog.querySelectorAll('[data-part]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.part)));
  dialog.querySelectorAll('[data-orbit]').forEach(button=>button.addEventListener('click',()=>onOrbit(Number(button.dataset.orbit)*.32,0)));
  dialog.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>onZoom(Number(button.dataset.zoom))));
  dialog.querySelector('[data-reset]').addEventListener('click',onReset);
  range.addEventListener('input',()=>onAssembly(Number(range.value)/100));
  return {open,select,setProgress,get isOpen(){return dialog.open;},dispose(){
    stripObserver.disconnect();if(dialog.open)dialog.close();dialog.remove();opener.removeEventListener('click',open);canvas.removeEventListener('click',canvasClick);
    canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',key);
  }};
}
