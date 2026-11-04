import * as THREE from 'three';

const sceneRoot = document.querySelector('#scene');
const loading = document.querySelector('#loading');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f7f6f1');
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 250);
camera.position.set(0, 0, 38);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
sceneRoot.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 2.1));
const keyLight = new THREE.DirectionalLight(0xfff5df, 3.3);
keyLight.position.set(-8, 12, 18);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
rimLight.position.set(9, -5, 12);
scene.add(rimLight);

const palette = ['#d9573f','#e6b34e','#537b79','#d98978','#637398','#bd9e6b','#779477','#bd6a50','#777f68'];
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
const coverGeo = new THREE.BoxGeometry(bookW, bookH, bookD);
const coverCanvasGeo = new THREE.PlaneGeometry(bookW - 0.12, bookH - 0.12);
const pageGeo = new THREE.BoxGeometry(bookW - 0.08, bookH - 0.08, bookD - 0.035);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function coverTexture(index, color) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 700;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f4eddd'; ctx.fillRect(0, 0, c.width, c.height);
  // subtle paper grain
  for (let i = 0; i < 1500; i++) { ctx.fillStyle = `rgba(90,75,52,${Math.random() * .045})`; ctx.fillRect(Math.random()*512, Math.random()*700, 1+Math.random()*2, 1); }
  ctx.strokeStyle = color; ctx.lineWidth = 9; ctx.strokeRect(32, 32, 448, 636);
  ctx.fillStyle = '#292722'; ctx.font = '500 25px "DM Mono", monospace'; ctx.fillText(`FIELD NOTES  /  ${String(index+1).padStart(2,'0')}`, 62, 91);
  ctx.strokeStyle = '#d8cfc0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(62, 115); ctx.lineTo(450, 115); ctx.stroke();
  // hand-drawn botanical / geometric sketch
  ctx.save(); ctx.translate(256, 365); ctx.rotate((index%5-2)*.055);
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-10, 180); ctx.bezierCurveTo(10, 40, -35, -45, 3, -180); ctx.stroke();
  const count = 5 + index%4;
  for (let j=0;j<count;j++) { const y=-140+j*42, side=j%2?1:-1;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(side*30,y-7,side*58,y-38,side*78,y-32); ctx.bezierCurveTo(side*68,y+1,side*30,y+12,0,y); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, -190, 12+(index%3)*4, 0, Math.PI*2); ctx.stroke();
  if(index%3===1){ctx.beginPath();ctx.arc(0,0,88,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,62,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
  ctx.fillStyle = '#777165'; ctx.font = 'italic 30px "Ma Shan Zheng", cursive'; ctx.fillText('慢慢觀察', 62, 590);
  ctx.fillStyle = color; ctx.font = '500 22px "DM Mono", monospace'; ctx.fillText(`VOL. ${String(index+1).padStart(2,'0')}`, 62, 633);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

for (let i=0;i<27;i++) {
  const group = new THREE.Group();
  const col = i % 9, row = Math.floor(i/9);
  group.position.set((col-4)*2.72, (1-row)*3.28, (col%3)*0.12);
  group.rotation.set((row-1)*-.035, (col%2 ? -.045 : .035), ((col+row)%3-1)*.035);
  const accent = palette[(i*5 + Math.floor(i/3)) % palette.length];
  const coverMat = new THREE.MeshStandardMaterial({color:accent, roughness:.86});
  const cover = new THREE.Mesh(coverGeo, coverMat); group.add(cover);
  const pageMat = new THREE.MeshStandardMaterial({color:'#eee6d6', roughness:1});
  const pages = new THREE.Mesh(pageGeo, pageMat); pages.position.z = .012; group.add(pages);
  const tex = coverTexture(i, accent);
  const front = new THREE.Mesh(coverCanvasGeo, new THREE.MeshStandardMaterial({map:tex, roughness:.98}));
  front.position.z = bookD/2 + .008; group.add(front);
  // narrow colored spine detail
  const spine = new THREE.Mesh(new THREE.BoxGeometry(.095,bookH-.1,.012),new THREE.MeshStandardMaterial({color:accent,roughness:.8}));
  spine.position.set(-bookW/2+.025,0,bookD/2+.015); group.add(spine);
  group.userData = {index:i, phase:i*1.31, baseY:group.position.y};
  group.traverse(obj=>{if(obj.isMesh){obj.userData.bookIndex=i;obj.castShadow=false;obj.receiveShadow=false;pickTargets.push(obj);}});
  scene.add(group); books.push(group);
}

const detail = document.querySelector('#detail');
const detailTitle = document.querySelector('#detail-title');
const detailDescription = document.querySelector('#detail-description');
function openBook(index) {
  detailTitle.textContent = titles[index];
  detailDescription.textContent = descriptions[index] || `一頁一頁收集下來的觀察與想像。${titles[index]} 是這座圖書館裡第 ${index+1} 本漂浮素描簿，裡面還留著許多等待被發現的線索。`;
  document.querySelector('#detail-index').textContent = `NO. ${String(index+1).padStart(2,'0')}`;
  detail.hidden = false;
  books.forEach((b,i)=>b.userData.selected=i===index);
}
function closeBook(){ detail.hidden=true; books.forEach(b=>b.userData.selected=false); }
document.querySelector('#detail-close').addEventListener('click',closeBook);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeBook();setHelp(false);}});

let dragging=false, moved=false, pointerId=null, startX=0, startY=0, prevX=0, prevY=0;
let targetX=0,targetY=0;
sceneRoot.addEventListener('pointerdown',e=>{
  if(e.button!==0 || !detail.hidden) return;
  dragging=true;moved=false;pointerId=e.pointerId;startX=prevX=e.clientX;startY=prevY=e.clientY;
  sceneRoot.setPointerCapture(pointerId);
});
sceneRoot.addEventListener('pointermove',e=>{
  if(!dragging) return;
  const dx=e.clientX-prevX,dy=e.clientY-prevY; prevX=e.clientX;prevY=e.clientY;
  if(Math.hypot(e.clientX-startX,e.clientY-startY)>5)moved=true;
  const scale=38/camera.position.z;
  targetX+=dx*scale*.055; targetY-=dy*scale*.055;
  targetX=THREE.MathUtils.clamp(targetX,-19,19);targetY=THREE.MathUtils.clamp(targetY,-8,8);
});
sceneRoot.addEventListener('pointerup',e=>{
  if(!dragging)return; dragging=false;
  if(!moved){const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickTargets,false)[0];if(hit)openBook(hit.object.userData.bookIndex);}
});
sceneRoot.addEventListener('pointercancel',()=>{dragging=false;});

function resize(){const w=sceneRoot.clientWidth,h=sceneRoot.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=Math.max(29, 29*(1.6/Math.max(.45,w/h)));camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
function animate(time){requestAnimationFrame(animate);const t=time*.001;
  scene.position.x=THREE.MathUtils.damp(scene.position.x,targetX,5,.016);scene.position.y=THREE.MathUtils.damp(scene.position.y,targetY,5,.016);
  books.forEach((b,i)=>{const phase=b.userData.phase;b.position.y=b.userData.baseY+Math.sin(t*0.8+phase)*.11;b.rotation.z=Math.sin(t*.48+phase)*.012;
    const scale=b.userData.selected?1.11:1;const current=b.scale.x;b.scale.setScalar(THREE.MathUtils.damp(current,scale,7,.016));
  });renderer.render(scene,camera);
}
requestAnimationFrame(animate);loading.remove();

const helpCard=document.querySelector('#help-card'),helpToggle=document.querySelector('#help-toggle');
function setHelp(open){helpCard.hidden=!open;helpToggle.setAttribute('aria-expanded',String(open));helpToggle.querySelector('span').textContent=open?'−':'＋';}
helpToggle.addEventListener('click',()=>setHelp(helpCard.hidden));
document.querySelector('#help-close').addEventListener('click',()=>setHelp(false));
