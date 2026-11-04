import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const sceneRoot = document.querySelector('#scene');
const loading = document.querySelector('#loading');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 250);
camera.position.set(0, 0, 38);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneRoot.appendChild(renderer.domElement);

// Photographic paper backdrop, stored locally so GitHub Pages needs no runtime image service.
scene.background = new THREE.Color('#eeede9');
const paperTexture = new THREE.TextureLoader().load('./assets/paper-crumpled-unsplash.jpg');
paperTexture.colorSpace = THREE.SRGBColorSpace;
paperTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({map:paperTexture,roughness:1,metalness:0}));
backdrop.position.z = -5;
backdrop.receiveShadow = true;
scene.add(backdrop);

// Studio reflections give the coated wire and paper edges believable highlights.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xf7f4ee, 0x77736c, 1.05));
const keyLight = new THREE.DirectionalLight(0xfff8ee, 3.2);
keyLight.position.set(-8, 11, 13); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -17; keyLight.shadow.camera.right = 17;
keyLight.shadow.camera.top = 12; keyLight.shadow.camera.bottom = -12;
keyLight.shadow.camera.near = .5; keyLight.shadow.camera.far = 40;
keyLight.shadow.bias = -.00045; keyLight.shadow.normalBias = .025;
keyLight.target.position.set(0,0,-4); scene.add(keyLight,keyLight.target);
const fillLight = new THREE.DirectionalLight(0xffffff, .8);
fillLight.position.set(10, -6, 12); scene.add(fillLight);

const titles = [
  '午後的窗邊','雨天散步','一顆橘子','海風的形狀','植物觀察簿','星期日的市場','房間裡的光','給陌生人的花','小島地圖',
  '咖啡冷掉以前','夜行列車','山的背面','三點鐘的雲','口袋裡的石頭','城市速寫','沒有寄出的信','春天的標本','某個夏天',
  '夢的邊界','一隻慢吞吞的貓','舊書店','遠方的聲音','散步的理由','風把窗簾吹起','日常採集','看見一隻鳥','明天的草稿'
];
const descriptions = [
  '午後四點，陽光在桌面留下緩慢移動的格子。這本簿子收著窗台的植物、半杯茶，和一段沒有打算完成的速寫。',
  '把傘收起來之前，先記下路面反光的顏色。沿著巷子走，雨聲替每一扇窗加上了新的邊框。',
  '從果皮的弧線開始，練習把一點點酸甜留在紙上。',
  '試著用幾條線畫出吹過海岸的風，以及它帶走又送回來的東西。',
  '葉脈、陰影與不知名的小芽，是一份每天更新的微型田野筆記。',
  '籃子裡的花、剛出爐的麵包，還有早晨市場裡相遇的顏色。',
  '一間小房子在不同時刻的模樣。光經過之處，日常也有了新的形狀。',
  '把路邊遇見的花畫下來，留給某個還沒認識的人。',
  '沿著想像中的海岸線走一圈，為每個停留的地方取個名字。'
];

const books = [];
const pickTargets = [];
const bookW = 2.06, bookH = 2.76, bookD = 0.27;
function makeCoverGeometry() {
  const shape = new THREE.Shape();
  const w=bookW/2,h=bookH/2,r=.075;
  shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);
  shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);shape.lineTo(-w+r,h);
  shape.quadraticCurveTo(-w,h,-w,h-r);shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.022,bevelThickness:.018,curveSegments:5});
  geometry.translate(0,0,-.0275);
  return geometry;
}
const coverGeo = makeCoverGeometry();
const pageGeo = new THREE.BoxGeometry(bookW-.14, bookH-.14, bookD-.09);
const coverFaceGeo = new THREE.PlaneGeometry(bookW-.045, bookH-.045);
const ringGeo = new THREE.TorusGeometry(.125, .018, 8, 24);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function makePaperSurfaceMap() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#d4d4d4';ctx.fillRect(0,0,256,256);
  for(let i=0;i<5200;i++){
    const tone=170+Math.floor(Math.random()*72);ctx.fillStyle=`rgba(${tone},${tone},${tone},${.12+Math.random()*.32})`;
    ctx.fillRect(Math.random()*256,Math.random()*256,.4+Math.random()*1.4,.5+Math.random()*2.2);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,4);return texture;
}
const paperSurfaceMap=makePaperSurfaceMap();

function seededRandom(seed) {
  let state=seed>>>0;
  return ()=>{state=(state+0x6D2B79F5)|0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
function scatterPositions(count) {
  const random=seededRandom(20260319),positions=[],minDistance=2.65;
  let tries=0;
  while(positions.length<count&&tries<30000){tries++;
    const candidate={x:(random()-.5)*21.5,y:(random()-.5)*12.1,z:(random()-.5)*2.4};
    if(positions.every(p=>Math.hypot(p.x-candidate.x,p.y-candidate.y)>minDistance))positions.push(candidate);
  }
  // Deterministic fallback keeps all 27 positions available even after layout tuning.
  while(positions.length<count){const i=positions.length,a=i*2.39996,r=1.25*Math.sqrt(i+1);positions.push({x:Math.cos(a)*r,y:Math.sin(a)*r*.58,z:(i%5-2)*.35});}
  return positions;
}
const placements=scatterPositions(27);

function makeCoverTexture(index) {
  const c = document.createElement('canvas'); c.width=512; c.height=700;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#171717'; ctx.fillRect(0,0,512,700);
  const sheen=ctx.createLinearGradient(0,0,512,700);
  sheen.addColorStop(0,'rgba(255,255,255,.065)'); sheen.addColorStop(.48,'rgba(255,255,255,0)'); sheen.addColorStop(1,'rgba(0,0,0,.28)');
  ctx.fillStyle=sheen;ctx.fillRect(0,0,512,700);
  for(let i=0;i<9000;i++){const a=Math.random()*.045;ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.fillRect(Math.random()*512,Math.random()*700,1+Math.random()*2,1);}
  // A restrained product label with paper texture, barcode and volume number.
  const x=82,y=365,w=365,h=270;
  ctx.fillStyle='#111';ctx.fillRect(x-2,y-2,w+4,h+4);
  ctx.fillStyle='#e9e8e3';ctx.fillRect(x,y,w,h);
  ctx.fillStyle='#242424';ctx.font='500 17px "DM Mono",monospace';ctx.fillText('FIELD NOTES',x+17,y+27);
  ctx.textAlign='right';ctx.fillText(`NO. ${String(index+1).padStart(2,'0')}`,x+w-16,y+27);ctx.textAlign='left';
  ctx.strokeStyle='#777';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+16,y+39);ctx.lineTo(x+w-16,y+39);ctx.stroke();
  ctx.fillStyle='#252525';ctx.font='600 56px "Noto Sans TC",sans-serif';ctx.fillText('Sketch',x+16,y+105);
  ctx.font='500 14px "DM Mono",monospace';ctx.fillText('SKETCH PAPER  ·  ACID FREE',x+18,y+132);
  ctx.fillStyle='#292929';ctx.fillRect(x+17,y+153,w-34,70);
  ctx.fillStyle='#f5f4f0';ctx.fillRect(x+22,y+158,w-44,60);
  // Deterministic barcode-like line rhythm per volume.
  let bx=x+34; const barcodeEnd=x+w-28;
  while(bx<barcodeEnd){const bw=1+((Math.floor(bx*7+index*11)%4));ctx.fillStyle='#191919';ctx.fillRect(bx,y+162,bw,45);bx+=bw+1+((Math.floor(bx+index)%3));}
  ctx.fillStyle='#242424';ctx.font='12px "DM Mono",monospace';ctx.fillText(`0  45173  ${String(38004+index).slice(0,5)}  ${index%10}`,x+25,y+238);
  ctx.font='italic 17px "Ma Shan Zheng",cursive';ctx.fillText('慢慢觀察，仔細收藏。',x+17,y+260);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}

for(let i=0;i<27;i++){
  const group=new THREE.Group();
  const random=seededRandom(9100+i*71),position=placements[i];
  group.position.set(position.x,position.y,position.z);
  group.rotation.set((random()-.5)*.22,(random()-.5)*.3,(random()-.5)*.24);
  const initialScale=.82+random()*.25;group.scale.setScalar(initialScale);
  group.userData={index:i,phase:random()*Math.PI*2,baseX:group.position.x,baseY:group.position.y,baseZ:group.position.z,baseScale:initialScale,baseRx:group.rotation.x,baseRy:group.rotation.y,baseRz:group.rotation.z,selected:false};

  const coverMat=new THREE.MeshStandardMaterial({color:'#1b1b1b',roughness:.94,metalness:.015,roughnessMap:paperSurfaceMap,bumpMap:paperSurfaceMap,bumpScale:.012});
  const frontCover=new THREE.Mesh(coverGeo,coverMat);frontCover.position.z=.125;group.add(frontCover);
  const backCover=new THREE.Mesh(coverGeo,coverMat);backCover.position.z=-.125;group.add(backCover);
  const pageMat=new THREE.MeshStandardMaterial({color:'#e8e2d7',roughness:.98,roughnessMap:paperSurfaceMap,bumpMap:paperSurfaceMap,bumpScale:.008});
  const pages=new THREE.Mesh(pageGeo,pageMat);pages.position.set(.025,0,0);group.add(pages);
  // Thin sheet edges show along the exposed page block when the book turns.
  const edgeMat=new THREE.MeshStandardMaterial({color:'#d6cfc2',roughness:1});
  for(let line=0;line<15;line++){
    const y=-bookH*.43+line*(bookH*.86/14);
    const edge=new THREE.Mesh(new THREE.BoxGeometry(.008,.007,bookD-.1),edgeMat);
    edge.position.set(bookW*.46,y,0);group.add(edge);
  }
  const face=new THREE.Mesh(coverFaceGeo,new THREE.MeshStandardMaterial({map:makeCoverTexture(i),roughness:.93,metalness:.015}));
  face.position.z=.174;group.add(face);
  // Black coated wire loops along the left binding edge.
  const wireMat=new THREE.MeshStandardMaterial({color:'#111111',roughness:.28,metalness:.72});
  for(let loop=0;loop<11;loop++){
    const wire=new THREE.Mesh(ringGeo,wireMat);
    wire.position.set(-bookW/2-.055,-bookH*.43+loop*(bookH*.086),.18);
    wire.scale.y=1.35;group.add(wire);
  }
  // Small pressed holes at the binding make the wire feel threaded through the cover.
  const holeMat=new THREE.MeshStandardMaterial({color:'#080808',roughness:.9});
  for(let hole=0;hole<11;hole++){
    const punch=new THREE.Mesh(new THREE.CircleGeometry(.032,12),holeMat);
    punch.position.set(-bookW/2+.055,-bookH*.43+hole*(bookH*.086),.178);group.add(punch);
  }
  group.traverse(obj=>{if(obj.isMesh){obj.userData.bookIndex=i;obj.castShadow=true;obj.receiveShadow=true;pickTargets.push(obj);}});
  scene.add(group);books.push(group);
}

const detail=document.querySelector('#detail');
function openBook(index){
  document.querySelector('#detail-title').textContent=titles[index];
  document.querySelector('#detail-description').textContent=descriptions[index]||`一頁一頁收集下來的觀察與想像。${titles[index]} 是這座圖書館裡第 ${index+1} 本漂浮素描簿，裡面還留著許多等待被發現的線索。`;
  document.querySelector('#detail-index').textContent=`NO. ${String(index+1).padStart(2,'0')}`;
  detail.hidden=false;books.forEach((book,i)=>book.userData.selected=i===index);
}
function closeBook(){detail.hidden=true;books.forEach(book=>book.userData.selected=false);}
document.querySelector('#detail-close').addEventListener('click',closeBook);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeBook();setHelp(false);}});

let dragging=false,moved=false,pointerId=null,startX=0,startY=0,prevX=0,prevY=0;
let targetX=0,targetY=0;
sceneRoot.addEventListener('pointerdown',e=>{if(e.button!==0||!detail.hidden)return;dragging=true;moved=false;pointerId=e.pointerId;startX=prevX=e.clientX;startY=prevY=e.clientY;sceneRoot.setPointerCapture(pointerId);});
sceneRoot.addEventListener('pointermove',e=>{
  if(!dragging)return;const dx=e.clientX-prevX,dy=e.clientY-prevY;prevX=e.clientX;prevY=e.clientY;
  if(Math.hypot(e.clientX-startX,e.clientY-startY)>5)moved=true;
  const scale=38/camera.position.z;targetX=THREE.MathUtils.clamp(targetX+dx*scale*.055,-19,19);targetY=THREE.MathUtils.clamp(targetY-dy*scale*.055,-8,8);
});
sceneRoot.addEventListener('pointerup',e=>{
  if(!dragging)return;dragging=false;
  if(!moved){const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickTargets,false)[0];if(hit)openBook(hit.object.userData.bookIndex);}
});
sceneRoot.addEventListener('pointercancel',()=>{dragging=false;});

function resize(){
  const w=sceneRoot.clientWidth,h=sceneRoot.clientHeight;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=Math.max(29,29*(1.6/Math.max(.45,w/h)));camera.updateProjectionMatrix();
  const distance=camera.position.z-Math.min(backdrop.position.z,0);
  const viewHeight=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  backdrop.scale.set(viewHeight*camera.aspect*1.12,viewHeight*1.12,1);
}
window.addEventListener('resize',resize);resize();
function animate(time){requestAnimationFrame(animate);const t=time*.001;
  scene.position.x=THREE.MathUtils.damp(scene.position.x,targetX,5,.016);scene.position.y=THREE.MathUtils.damp(scene.position.y,targetY,5,.016);
  books.forEach(book=>{
    const p=book.userData.phase,selected=book.userData.selected?1:0;
    book.position.x=book.userData.baseX+Math.sin(t*.17+p)*.2;
    book.position.y=book.userData.baseY+Math.sin(t*.29+p)*.24;
    book.position.z=book.userData.baseZ+Math.cos(t*.2+p)*.18;
    book.rotation.x=book.userData.baseRx+Math.sin(t*.15+p)*.035;
    book.rotation.y=book.userData.baseRy+Math.cos(t*.13+p)*.05;
    book.rotation.z=book.userData.baseRz+Math.sin(t*.19+p)*.035;
    const scale=book.userData.baseScale*(selected?1.1:1);book.scale.setScalar(THREE.MathUtils.damp(book.scale.x,scale,7,.016));
  });
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);loading.remove();

const helpCard=document.querySelector('#help-card'),helpToggle=document.querySelector('#help-toggle');
function setHelp(open){helpCard.hidden=!open;helpToggle.setAttribute('aria-expanded',String(open));helpToggle.querySelector('span').textContent=open?'−':'＋';}
helpToggle.addEventListener('click',()=>setHelp(helpCard.hidden));
document.querySelector('#help-close').addEventListener('click',()=>setHelp(false));
