(async function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div id="err">The 3D engine could not load. Check your connection and reload.</div>');return;}
const W=window.WORLD,LM=window.LANDMARKS;
try{await Promise.race([document.fonts.load('800 48px "Baloo 2"'),new Promise(r=>setTimeout(r,1500))]);}catch(e){}
const VERSION='Beta v1.01.29';

/* ================= storage + config ================= */
const store={get(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const {REGIONS,FEST_DEFAULT,EVENT_DEFAULT,BILL_DEFAULT,DEFAULTS,THEMES,mergeCfg}=window.IBCONF;
// Beta v1.0.0 is the first public beta: no change history for it, the game's features are listed in Settings → Features.
// Later updates add their notes here (or in Admin → Changelog) and players see a What's new pop-up once.
// The changelog lives in js/config.js (IBCONF.CHANGELOG) so the admin page can show and edit it.
const CHANGELOG=window.IBCONF.CHANGELOG;
let CFG=mergeCfg(DEFAULTS,store.get('ib.cfg'));let savedCFG=CFG;
const price=b=>Math.max(5,Math.round(b*CFG.priceMul/5)*5);
// Price of a catalogue item: the admin's price from /admin → Time and prices, else the default (js/prices.js), times Prices ×.
const rawCost=(key,def)=>{const o=CFG.prices&&CFG.prices[key];if(o!=null&&o!==''&&isFinite(+o)&&+o>=0)return +o;if(def!=null)return def;const P0=window.PRICES;return P0&&P0.DEF[key]!=null?P0.DEF[key]:0;};
const cost=(key,def)=>price(rawCost(key,def));
const inr=n=>(n<0?'−':'')+'₹'+Math.abs(Math.round(n)).toLocaleString('en-IN');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

/* ================= clocks ================= */
// the shared clock (Beta v1.01.12): the online server's time, so everyone has the same Bay time, weather and events
const bayNow=()=>Date.now()+(+window.__ibClockOff||0);
function gameMin(){return bayNow()/1000*CFG.timeSpeed+(+CFG.timeOffset||0);}
let clockH=0,gameDay=0;
function tickClock(){const g=gameMin();clockH=((g/60)%24+24)%24;gameDay=Math.floor(g/1440);}
const IST=(()=>{try{return{d:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',weekday:'short',day:'numeric',month:'short',year:'numeric'}),iso:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}),m:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',month:'numeric'})};}catch(e){return null;}})();
function istText(){const d=new Date();if(!IST)return d.toDateString();const p=IST.d.formatToParts(d),g=t=>(p.find(x=>x.type===t)||{}).value||'';return `${g('weekday')}, ${g('day')} ${g('month')} ${g('year')}`;}
function istISO(){const d=new Date();return IST?IST.iso.format(d):d.toISOString().slice(0,10);}
function istMonth(){return IST?+IST.m.format(new Date()):new Date().getMonth()+1;}
const bayTime=()=>{const h=Math.floor(clockH),m=Math.floor((clockH-h)*60);return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;};

/* ================= renderer ================= */
let renderer;
const isTouch=matchMedia('(hover: none)').matches;
/* Beta v1.01.29: graphics levels, so phones stay cool. Phones start on "Battery saver": 30 frames a second, a sharp but
   lighter resolution, a little less traffic and a shorter view; menus and sheets draw at 12 frames a second. The game
   also lowers the resolution by itself if the phone can't keep up. Settings → Graphics changes it. */
const GFX=(()=>{let s=null;try{s=localStorage.getItem('ib.gfx');}catch(e){}const lvl=s==='high'||s==='balanced'||s==='saver'?s:isTouch?'saver':'high';
  const L={saver:{dpr:1.15,fps:30,idle:12,k:.65,fog:.72,mini:6,clouds:12,plants:.55},balanced:{dpr:1.4,fps:45,idle:20,k:.85,fog:.86,mini:3,clouds:18,plants:.8},high:{dpr:isTouch?1.75:2,fps:0,idle:30,k:1,fog:1,mini:2,clouds:26,plants:1}}[lvl];
  return Object.assign({lvl,scale:1,phone:isTouch},L);})();
for(const ev of ['pointerdown','keydown','touchstart'])addEventListener(ev,()=>{GFX.lastIn=performance.now();},{passive:true,capture:true});GFX.lastIn=performance.now();
try{renderer=new THREE.WebGLRenderer({canvas:$('#c'),antialias:true,powerPreference:GFX.lvl==='high'&&!isTouch?'high-performance':'default'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div id="err">Your browser has 3D graphics turned off. Try Chrome or Safari on a newer device.</div>');return;}
function gfxDpr(){return Math.max(.6,Math.min(devicePixelRatio,GFX.dpr)*GFX.scale);}
renderer.setPixelRatio(gfxDpr());
renderer.shadowMap.enabled=!isTouch;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xf3a65a,180,700);scene.background=new THREE.Color();
const camera=new THREE.PerspectiveCamera(62,1,0.1,4000);
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<1?74:62;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const rnd=mulberry32(2026);
const R=(a,b)=>a+rnd()*(b-a),pick=a=>a[Math.floor(rnd()*a.length)];
const MR=(a,b)=>a+Math.random()*(b-a),mpick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrapA=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
const hash=n=>{let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const maxAniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
function canvasTex(w,h,draw,repeat=true){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);if(repeat)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=maxAniso;return t;}

/* ================= textures + materials ================= */
const winTex=canvasTex(128,128,x=>{x.fillStyle='#fff';x.fillRect(0,0,128,128);for(let i=0;i<8;i++)for(let j=0;j<8;j++){const cx=i*16,cy=j*16;x.fillStyle='#2c3444';x.fillRect(cx+4,cy+3,8,9);x.fillStyle='#d8d2c6';x.fillRect(cx+3,cy+12,10,2);if(rnd()<.13){x.fillStyle='#c4c8cc';x.fillRect(cx+10,cy+8,5,4);}}});
const litTex=canvasTex(128,128,x=>{x.fillStyle='#000';x.fillRect(0,0,128,128);for(let i=0;i<8;i++)for(let j=0;j<8;j++){if(rnd()<.42){x.fillStyle=pick(['#ffd27a','#ffe9b8','#ffb85c','#cfe4ff','#ffc98a']);x.fillRect(i*16+4,j*16+3,8,9);}}});
const oldTex=canvasTex(128,128,x=>{x.fillStyle='#fff';x.fillRect(0,0,128,128);for(let i=0;i<4;i++)for(let j=0;j<4;j++){const cx=i*32,cy=j*32;if(rnd()<.8){x.fillStyle='#3a3030';x.fillRect(cx+10,cy+12,12,14);x.beginPath();x.arc(cx+16,cy+12,6,Math.PI,0);x.fill();x.fillStyle='rgba(0,0,0,.12)';x.fillRect(cx+8,cy+26,16,2);}}});
const oldLit=canvasTex(128,128,x=>{x.fillStyle='#000';x.fillRect(0,0,128,128);for(let i=0;i<4;i++)for(let j=0;j<4;j++){if(rnd()<.45){x.fillStyle=pick(['#ffd27a','#ffb85c','#ffe9b8']);x.fillRect(i*32+10,j*32+12,12,14);}}});
// Asphalt with grain, patches, tyre-worn lanes and crisp markings (repeats every 16 m along the road).
function asphalt(x,w,h,base){x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const v=rnd();x.fillStyle=v<.45?'rgba(255,255,255,.05)':v<.9?'rgba(0,0,0,.09)':'rgba(120,110,95,.12)';const s=rnd()<.9?1:2;x.fillRect(rnd()*w,rnd()*h,s,s);}
  for(let i=0;i<5;i++){x.fillStyle=rnd()<.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.035)';x.fillRect(rnd()*w,rnd()*h,20+rnd()*60,14+rnd()*50);}
  x.fillStyle='rgba(0,0,0,.10)';for(const c of [.2,.34,.66,.8])x.fillRect(w*c-6,0,12,h);}
const roadTex=canvasTex(256,512,x=>{asphalt(x,256,512,'#3c3d42');x.fillStyle='#e6e1d3';x.fillRect(7,0,5,512);x.fillRect(244,0,5,512);x.fillStyle='#f0e7c4';x.fillRect(125,24,6,220);x.fillRect(125,280,6,220);});
const hwTex=canvasTex(256,512,x=>{asphalt(x,256,512,'#36373c');x.fillStyle='#ece7d8';x.fillRect(10,0,7,512);x.fillRect(239,0,7,512);x.fillStyle='#f2c94c';x.fillRect(120,0,5,512);x.fillRect(131,0,5,512);
  x.fillStyle='rgba(236,231,216,.85)';x.fillRect(62,40,4,180);x.fillRect(62,300,4,180);x.fillRect(190,40,4,180);x.fillRect(190,300,4,180);});
const zebraTex=canvasTex(128,64,x=>{x.clearRect(0,0,128,64);x.fillStyle='rgba(238,234,224,.92)';for(let i=4;i<128;i+=16)x.fillRect(i,4,9,56);},false);
const seaTex=canvasTex(128,128,x=>{x.fillStyle='#fff';x.fillRect(0,0,128,128);for(let i=0;i<70;i++){x.fillStyle='rgba(120,170,210,.35)';x.fillRect(rnd()*128,rnd()*128,R(6,22),1);}});
const LMat=(c,o={})=>new THREE.MeshLambertMaterial(Object.assign({color:c},o));
const M={kerb:LMat('#b9b2a2'),zebra:new THREE.MeshLambertMaterial({map:zebraTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),ground:LMat('#8c8676'),pave:LMat('#bdb4a4'),earth:LMat('#b8a58a'),road:LMat('#ffffff',{map:roadTex}),hw:LMat('#ffffff',{map:hwTex}),asphalt:LMat('#3a3b41'),grass:LMat('#5f9a45'),dirt:LMat('#c9a26b'),sand:LMat('#e2cf9f'),wall:LMat('#9c958a'),concrete:LMat('#aaa59b'),
  trunk:LMat('#7a5a3a'),leaf:LMat('#3e8c3a'),tree:LMat('#4f8f3e'),treeDry:LMat('#7f8a3c'),treeDark:LMat('#2f6b33'),pole:LMat('#3b3a40'),tank:LMat('#202226'),stone:LMat('#d6b47c'),plaza:LMat('#cfc09e'),temple:LMat('#e2b77e'),gold:LMat('#f2c14e'),station:LMat('#a8704a'),cream:LMat('#f1e2c2'),
  awn:['#d9483b','#2f7fc1','#e8a628','#3aa66b','#9b4fb5'].map(c=>LMat(c)),boat:LMat('#e4572e'),boat2:LMat('#2e86ab'),white:LMat('#f3f1ec'),blue:LMat('#2d5fb3'),red:LMat('#c8102e'),kiosk:LMat('#e8a628'),wc:LMat('#3b82c4'),lamp:new THREE.MeshBasicMaterial({color:0x666055}),
  lampBox:new THREE.MeshBasicMaterial({color:0xfff6d8}),marble:LMat('#f4f0e6'),ballast:LMat('#7d7468'),steel:LMat('#8d939a'),wood:LMat('#6b4a32'),roofTin:LMat('#8a8f86'),dark:LMat('#24211f'),basalt:LMat('#55504a'),redstone:LMat('#b5562f'),blackstone:LMat('#3a3638'),
  waterBox:new THREE.MeshPhongMaterial({color:0x2f78a8,shininess:80}),bronze:LMat('#6f6550'),glassBox:LMat('#86a9c4'),tile:LMat('#a84a2a'),rock:LMat('#8a6a4a'),pink:LMat('#e08a6c'),pinkLight:LMat('#efb59c'),gold2:LMat('#d9b26a'),runway:LMat('#2e2f33'),apron:LMat('#5b5d61'),canopy:LMat('#f3f1ec'),
  cow:LMat('#efe8dc'),lion:LMat('#c99a52'),tiger:LMat('#e08a2a'),camel:LMat('#c8a06a'),roofRed:LMat('#a8402a'),plane:LMat('#f4f6f8'),planeTail:LMat('#ff7a1a')};
const styleCache=new Map();
function bmat(col,old){const k=col+(old?'o':'m');if(!styleCache.has(k))styleCache.set(k,LMat(col,{map:old?oldTex:winTex,emissiveMap:old?oldLit:litTex,emissive:0xffffff,emissiveIntensity:0}));return styleCache.get(k);}
const glassMat=LMat('#86a9c4',{map:winTex,emissiveMap:litTex,emissive:0xffffff,emissiveIntensity:0});styleCache.set('glass',glassMat);
const STYLES={metro:{cols:['#efe3c8','#f2b8a2','#bfe0cf','#a9cfe8','#e8c070','#f4f1ea','#cfc6dc','#e7a46b','#f6d7a7'],h:[12,46],tower:.08,lots:2},mid:{cols:['#efe3c8','#e9d6bd','#cfd8d6','#f2c6a0','#d9cfe0','#f4f1ea'],h:[10,32],tower:.05,lots:2},
  gujarat:{cols:['#e9dcc4','#d9c2a0','#c8d7d9','#efe3c8','#f2c6a0','#d0d6c2'],h:[10,38],tower:.06,lots:2},pink:{cols:['#e8967a','#e3a083','#d98a6d','#eda98f'],h:[6,14],old:true,lots:3,chhatri:.25},
  blue:{cols:['#5b8fd6','#7aa7e0','#4a7ec9','#9cc0ea','#f0ece2'],h:[5,12],old:true,lots:3},gold:{cols:['#d9b26a','#cfa45a','#e3bf7a'],h:[5,11],old:true,lots:3,chhatri:.15},
  white:{cols:['#f4f1ea','#efe8da','#e9e2d0','#f2d7a7'],h:[6,16],old:true,lots:3,dome:.15},town:{cols:['#f2b8a2','#bfe0cf','#a9cfe8','#e8c070','#f4f1ea','#cfc6dc','#f6d7a7'],h:[5,14],old:true,lots:3},
  hill:{cols:['#f1e2c2','#e8d6b0','#d9c7a8'],h:[4,7],old:true,lots:2,cottage:true},
  goa:{cols:['#f2d16b','#7fb7d9','#e98b7f','#f4f1ea','#9fd3a5','#d9a0c8','#f2b8a2'],h:[5,9],old:true,lots:3,cottage:true},
  kerala:{cols:['#f4f1ea','#efe8da','#f2d7a7','#cfe3c8','#e9c9a0','#d7e6ef'],h:[5,11],old:true,lots:3,cottage:true}};

/* ================= static batching in chunks ================= */
const CH=400;const chunks=new Map();const farGroups=[];let lmCollect=null;
function chunkOf(x,z){const k=Math.floor(x/CH)+','+Math.floor(z/CH);let c=chunks.get(k);if(!c){c={k,cx:(Math.floor(x/CH)+.5)*CH,cz:(Math.floor(z/CH)+.5)*CH,group:new THREE.Group(),pend:new Map()};scene.add(c.group);chunks.set(k,c);}return c;}
function addStatic(g,mat,cast=true,receive=true){if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;const x=(b.min.x+b.max.x)/2,z=(b.min.z+b.max.z)/2;
  if(lmCollect){lmCollect.push([g,mat,cast,receive]);return;}const c=chunkOf(x,z);const key=mat.uuid+(cast?1:0)+(receive?1:0);let p=c.pend.get(key);if(!p){p={mat,geoms:[],cast,receive};c.pend.set(key,p);}p.geoms.push(g);}
function merge(geoms){let vc=0,ic=0;for(const g of geoms){vc+=g.attributes.position.count;ic+=g.index?g.index.count:g.attributes.position.count;}
  const pos=new Float32Array(vc*3),nor=new Float32Array(vc*3),uv=new Float32Array(vc*2),idx=new Uint32Array(ic);let vo=0,io=0;
  for(const g of geoms){const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;pos.set(p.array,vo*3);if(n)nor.set(n.array,vo*3);if(u)uv.set(u.array,vo*2);if(g.index){const a=g.index.array;for(let i=0;i<a.length;i++)idx[io++]=a[i]+vo;}else{for(let i=0;i<p.count;i++)idx[io++]=vo+i;}vo+=p.count;g.dispose();}
  const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.BufferAttribute(pos,3));o.setAttribute('normal',new THREE.BufferAttribute(nor,3));o.setAttribute('uv',new THREE.BufferAttribute(uv,2));o.setIndex(new THREE.BufferAttribute(idx,1));o.computeBoundingSphere();return o;}
function flushStatic(){for(const c of chunks.values()){for(const p of c.pend.values()){if(!p.geoms.length)continue;const m=new THREE.Mesh(merge(p.geoms),p.mat);m.castShadow=p.cast;m.receiveShadow=p.receive;m.matrixAutoUpdate=false;m.updateMatrix();c.group.add(m);}c.pend.clear();}}
function flushFar(list,x,z){const by=new Map();for(const [g,mat,cast,recv] of list){const k=mat.uuid+(cast?1:0);let p=by.get(k);if(!p){p={mat,geoms:[],cast,recv};by.set(k,p);}p.geoms.push(g);}
  const grp=new THREE.Group();for(const p of by.values()){const m=new THREE.Mesh(merge(p.geoms),p.mat);m.castShadow=p.cast;m.receiveShadow=p.recv;m.matrixAutoUpdate=false;m.updateMatrix();grp.add(m);}scene.add(grp);farGroups.push({group:grp,x,z});}
function updChunks(px,pz){const r=scene.fog.far+120,rf=Math.min(2600,scene.fog.far*2.6+300);for(const c of chunks.values()){c.group.visible=Math.abs(c.cx-px)<r+CH/2&&Math.abs(c.cz-pz)<r+CH/2;}for(const f of farGroups){f.group.visible=Math.hypot(f.x-px,f.z-pz)<rf;}}
function box(w,h,d,x,y,z,mat,cast,recv){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);addStatic(g,mat,cast!==false,recv!==false);return g;}
function boxRot(w,h,d,x,y,z,ry,mat,cast,recv){const g=new THREE.BoxGeometry(w,h,d);g.rotateY(ry);g.translate(x,y,z);addStatic(g,mat,cast!==false,recv!==false);return g;}

/* ================= land, water, roads ================= */
function pip(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const xi=p[i][0],zi=p[i][1],xj=p[j][0],zj=p[j][1];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))c=!c;}return c;}
const LG=20,LGW=Math.ceil(W.W/LG)+1,LGH=Math.ceil(W.H/LG)+1;const landGrid=new Uint8Array(LGW*LGH);
for(let j=0;j<LGH;j++)for(let i=0;i<LGW;i++){const x=i*LG,z=j*LG;let l=pip(x,z,W.land)?1:0;landGrid[j*LGW+i]=l;}
for(const is of W.islands)for(let j=Math.floor((is.z-is.r)/LG);j<=Math.ceil((is.z+is.r)/LG);j++)for(let i=Math.floor((is.x-is.r)/LG);i<=Math.ceil((is.x+is.r)/LG);i++){if(Math.hypot(i*LG-is.x,j*LG-is.z)<=is.r&&i>=0&&j>=0&&i<LGW&&j<LGH)landGrid[j*LGW+i]=2;}
function isLand(x,z){if(x<0||z<0||x>W.W||z>W.H)return false;const i=Math.round(x/LG),j=Math.round(z/LG);return landGrid[j*LGW+i]>0;}
function onIsland(x,z){for(const is of W.islands)if(Math.hypot(x-is.x,z-is.z)<is.r)return true;return false;}
function segD(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz;let t=l2?((px-ax)*dx+(pz-az)*dz)/l2:0;t=clamp(t,0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
function inLake(x,z){for(const l of W.lakes){const dx=(x-l.x)/l.rx,dz=(z-l.z)/l.rz;if(dx*dx+dz*dz<1&&!onIsland(x,z))return l;}return null;}
function inRiver(x,z){for(const r of W.rivers){const p=r.pts;for(let k=0;k<p.length-1;k++)if(segD(x,z,p[k][0],p[k][1],p[k+1][0],p[k+1][1])<r.w/2)return r;}return null;}
// Beta v1.01.23: pools that landmarks draw (a plunge pool under falls, a palace tank) are real water: you swim in them and vehicles stop at the edge
const POOLS=[];function addPool(x,z,rx,rz,rect){POOLS.push({x,z,rx,rz,rect:!!rect});}
function inPool(x,z){for(const q of POOLS){const dx=(x-q.x)/q.rx,dz=(z-q.z)/q.rz;if(q.rect?Math.abs(dx)<1&&Math.abs(dz)<1:dx*dx+dz*dz<1)return q;}return null;}
function isWater(x,z){return !isLand(x,z)||!!inLake(x,z)||!!inRiver(x,z)||(POOLS.length>0&&!!inPool(x,z));}
const EDGES=[];const RH=50,rHash=new Map();const ROADS=[];
function addRoad(pts,w,kind,name){const r={pts,w,kind,name,edges:[]};ROADS.push(r);for(let k=0;k<pts.length-1;k++){const [ax,az]=pts[k],[bx,bz]=pts[k+1];const len=Math.hypot(bx-ax,bz-az);if(len<1)continue;
    const e={id:EDGES.length,ax,az,bx,bz,len,dx:(bx-ax)/len,dz:(bz-az)/len,w,kind,road:r,k,lane:w>=16?4:w>=12?3.5:1.6};if(kind!=='city'&&kind!=='coast'&&kind!=='service'&&w>=12){e.multi=true;e.laneO=w*.355;e.laneI=w*.135;e.lane=e.laneO;}EDGES.push(e);/* v1.01.22: highways have 2 lanes each way (left slow, right fast) */r.edges.push(e);
    for(let t=0,st=Math.min(RH/4,6),hw2=w/2+1;t<=len+st;t+=st){const tt=Math.min(t,len),x=ax+e.dx*tt,z=az+e.dz*tt;for(const ox of [-1,0,1])for(const oz of [-1,0,1]){const key=Math.floor((x+ox*hw2)/RH)+','+Math.floor((z+oz*hw2)/RH);/* v1.01.22: samples every 6 m so diagonal roads over water have no gaps */let a=rHash.get(key);if(!a)rHash.set(key,a=[]);if(a[a.length-1]!==e.id&&!a.includes(e.id))a.push(e.id);}}}return r;}
function edgesNear(x,z){return rHash.get(Math.floor(x/RH)+','+Math.floor(z/RH))||[];}
function roadAt(x,z,m=0){for(const id of edgesNear(x,z)){const e=EDGES[id];if(segD(x,z,e.ax,e.az,e.bx,e.bz)<e.w/2+m)return e;}return null;}
function nearestRoadPoint(x,z,maxR=400){let best=null,bd=1e9;for(let r=RH;r<=maxR;r+=RH){for(let ox=-r;ox<=r;ox+=RH)for(let oz=-r;oz<=r;oz+=RH){for(const id of edgesNear(x+ox,z+oz)){const e=EDGES[id];const l2=e.len*e.len;let t=((x-e.ax)*(e.bx-e.ax)+(z-e.az)*(e.bz-e.az))/l2;t=clamp(t,0,1);const px=e.ax+(e.bx-e.ax)*t,pz=e.az+(e.bz-e.az)*t;const d=Math.hypot(px-x,pz-z);if(d<bd){bd=d;best={x:px,z:pz,e,t:t*e.len};}}}if(best)return best;}return best;}
/* Beta v1.01.24: water with a margin, for people: the coast you see is drawn more coarsely than isWater, so keep 5 m off it */
function wetNear(x,z,m=5){return isWater(x,z)||isWater(x+m,z)||isWater(x-m,z)||isWater(x,z+m)||isWater(x,z-m);}
function drivable(x,z){if(POOLS.length&&inPool(x,z))return false;return !!roadAt(x,z,.5)||(!isWater(x,z)&&x>2&&z>2&&x<W.W-2&&z<W.H-2);}

/* colliders */
const CHS=64,cHash=new Map();const colliders=[];
function addCol(x,z,hw,hd,veh=true,foot=true){const c={x,z,hw,hd,veh,foot};colliders.push(c);for(let i=Math.floor((x-hw)/CHS);i<=Math.floor((x+hw)/CHS);i++)for(let j=Math.floor((z-hd)/CHS);j<=Math.floor((z+hd)/CHS);j++){const k=i+','+j;let a=cHash.get(k);if(!a)cHash.set(k,a=[]);a.push(c);}return c;}
function collide(p,r,foot){let hit=false;const seen=new Set();for(let i=Math.floor((p.x-r)/CHS);i<=Math.floor((p.x+r)/CHS);i++)for(let j=Math.floor((p.z-r)/CHS);j<=Math.floor((p.z+r)/CHS);j++){const a=cHash.get(i+','+j);if(!a)continue;let onRd=null;for(const c of a){if(seen.has(c))continue;seen.add(c);if(foot?!c.foot:!c.veh)continue;if(c.hw>8&&c.hd>8){if(onRd===null){const re=roadAt(p.x,p.z,-.6);onRd=!!re;if(re&&(re.stopB!=null||re.stopA!=null)){const sx=(p.x-re.ax)*re.dx+(p.z-re.az)*re.dz;if((re.stopB!=null&&sx>re.stopB+2)||(re.stopA!=null&&sx<re.stopA-2))onRd=false;}}if(onRd)continue;}/* v1.01.22: roads run through big fort and falls footprints */
    const dx=p.x-c.x,dz=p.z-c.z,ex=c.hw+r,ez=c.hd+r;if(Math.abs(dx)<ex&&Math.abs(dz)<ez){const px=ex-Math.abs(dx),pz=ez-Math.abs(dz);if(px<pz)p.x+=Math.sign(dx||1)*px;else p.z+=Math.sign(dz||1)*pz;hit=true;}}}return hit;}

/* ================= terrain ================= */
function inE(b,x,z){const dx=(x-b.x)/b.rx,dz=(z-b.z)/b.rz;return dx*dx+dz*dz;}
const zoneRects=W.zones.map(z=>({z,x0:z.x0-24,z0:z.z0-24,x1:z.x0+z.nx*80+24,z1:z.z0+z.nz*80+24}));
function zoneAt(x,z,m=0){for(const r of zoneRects)if(x>r.x0-m&&x<r.x1+m&&z>r.z0-m&&z<r.z1+m)return r.z;return null;}
const cA=new THREE.Color(),cB2=new THREE.Color();
function biomeColor(x,z,out){const n=hash(Math.floor(x/90)*31.7+Math.floor(z/90)*7.3),n2=hash(Math.floor(x/23)+Math.floor(z/23)*57);
  if(!isLand(x,z)&&!onIsland(x,z))return out.set('#6c7d74');
  let coast=false;for(const [ox,oz] of [[60,0],[-60,0],[0,60],[0,-60]])if(!isLand(x+ox,z+oz)){coast=true;break;}
  if(coast)return out.set('#e2cf9f').offsetHSL(0,0,(n2-.5)*.04);
  for(const b of W.biomes){const e=inE(b,x,z);if(e<1){if(b.kind==='rann')return out.set('#f2f0e8').offsetHSL(0,0,(n2-.5)*.03);if(b.kind==='desert')return out.set(e<.6?'#dcb878':'#cfb07a').offsetHSL((n-.5)*.02,0,(n2-.5)*.05);
      if(b.kind==='forest')return out.set(n<.5?'#5f7d3a':'#6f8a40').offsetHSL(0,0,(n2-.5)*.05);if(b.kind==='ghats')return out.set(n<.5?'#4f7a36':'#5d8a3c').offsetHSL(0,0,(n2-.5)*.06);if(b.kind==='scrub')return out.set('#b8a46a').offsetHSL(0,0,(n2-.5)*.06);
      if(b.kind==='laterite')return out.set(n<.4?'#b0643c':'#8f8a45').offsetHSL(0,0,(n2-.5)*.05);if(b.kind==='coffee')return out.set(n<.5?'#3f6b30':'#4b7a35').offsetHSL(0,0,(n2-.5)*.05);
      if(b.kind==='tea')return out.set(Math.floor(z/14)%2?'#5aa83c':'#4c9433').offsetHSL(0,0,(n2-.5)*.04);if(b.kind==='paddy')return out.set(n<.5?'#8fc24a':'#a6cf55').offsetHSL(0,0,(n2-.5)*.04);
      if(b.kind==='coconut')return out.set(n<.5?'#6f9a3e':'#7ea845').offsetHSL(0,0,(n2-.5)*.04);if(b.kind==='deccan')return out.set(n<.4?'#8f8262':n<.7?'#a99a62':'#9aa04e').offsetHSL(0,0,(n2-.5)*.05);}}
  const zz=zoneAt(x,z,10);if(zz)return out.set(zz.style==='gold'||zz.style==='pink'?'#c7ad86':'#9a937f');
  const fields=['#8aa84f','#a8b85a','#c2b46a','#7e9a48','#b39a5c','#9fae55'];return out.set(fields[Math.floor(n*fields.length)]).offsetHSL(0,0,(n2-.5)*.04);}
const TG=40;
// Beta v1.01.29: the ground is cut into 800 m tiles, so only the tiles near you are drawn (it was one mesh of 200,000
// triangles drawn every frame). Each vertex height and colour is the same as before.
{const TT=800,mat=new THREE.MeshLambertMaterial({vertexColors:true});const nTx=Math.ceil(W.W/TT),nTz=Math.ceil(W.H/TT);const hgt=(x,z)=>isLand(x,z)||onIsland(x,z)?0:-4;
  for(let ti=0;ti<nTx;ti++)for(let tj=0;tj<nTz;tj++){const x0=ti*TT,z0=tj*TT,w=Math.min(TT,W.W-x0),d=Math.min(TT,W.H-z0);const g=new THREE.PlaneGeometry(w,d,Math.max(1,Math.round(w/TG)),Math.max(1,Math.round(d/TG)));g.rotateX(-Math.PI/2);g.translate(w/2,0,d/2);
    const pos=g.attributes.position;const col=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){const x=pos.getX(i)+x0,z=pos.getZ(i)+z0;pos.setY(i,hgt(x,z));biomeColor(x,z,cA);col[i*3]=cA.r;col[i*3+1]=cA.g;col[i*3+2]=cA.b;}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
    // normals along the tile edges look across the edge too, so neighbouring tiles shade the same
    const nor=g.attributes.normal;for(let i=0;i<pos.count;i++){const lx=pos.getX(i),lz=pos.getZ(i);if(lx>.1&&lx<w-.1&&lz>.1&&lz<d-.1)continue;const x=lx+x0,z=lz+z0;const sx=hgt(x-TG,z)-hgt(x+TG,z),sz=hgt(x,z-TG)-hgt(x,z+TG);const n=new THREE.Vector3(sx,2*TG,sz).normalize();nor.setXYZ(i,n.x,n.y,n.z);}
    const m=new THREE.Mesh(g,mat);m.position.set(x0,0,z0);m.receiveShadow=true;m.matrixAutoUpdate=false;m.updateMatrix();scene.add(m);}}
// The sea is split into many small triangles so its depth stays exact near the camera (one huge quad can poke through the land).
const outer=new THREE.Mesh(new THREE.PlaneGeometry(W.W*5,W.H*5,120,Math.round(120*W.H/W.W)),GFX.lvl==='saver'?new THREE.MeshLambertMaterial({color:0x3479a0,map:seaTex}):new THREE.MeshPhongMaterial({color:0x2a6f97,map:seaTex,shininess:90,specular:0x99bbdd}));
seaTex.repeat.set(140,180);outer.rotation.x=-Math.PI/2;outer.position.set(W.W/2,-1.1,W.H/2);scene.add(outer);
const edgeLand=new THREE.Mesh(new THREE.PlaneGeometry(W.W*3,W.H*3),LMat('#c7b089'));edgeLand.rotation.x=-Math.PI/2;edgeLand.position.set(W.W/2,-0.12,-W.H*1.5+2);scene.add(edgeLand);
const edgeE=new THREE.Mesh(new THREE.PlaneGeometry(W.W*2,W.H*4),LMat('#9fae55'));edgeE.rotation.x=-Math.PI/2;edgeE.position.set(W.W+W.W-2,-0.12,W.H/2);scene.add(edgeE);
const waterMat=new THREE.MeshPhongMaterial({color:0x2f78a8,shininess:90,specular:0x88aacc,transparent:true,opacity:.92});
for(const l of W.lakes){const g=new THREE.CircleGeometry(1,40);g.rotateX(-Math.PI/2);g.scale(l.rx,1,l.rz);g.translate(l.x,.04,l.z);addStatic(g,waterMat,false,true);}
for(const r of W.rivers){const p=r.pts;for(let k=0;k<p.length-1;k++){const [ax,az]=p[k],[bx,bz]=p[k+1];const len=Math.hypot(bx-ax,bz-az),a=Math.atan2(bx-ax,bz-az);const g=new THREE.PlaneGeometry(r.w,len+r.w*.6);g.rotateX(-Math.PI/2);g.rotateY(a);g.translate((ax+bx)/2,.012,(az+bz)/2);addStatic(g,waterMat,false,true);}}
for(const is of W.islands){const g=new THREE.CircleGeometry(is.r,24);g.rotateX(-Math.PI/2);g.translate(is.x,.06,is.z);addStatic(g,M.sand,false,true);}

/* ================= decoration helpers ================= */
function palm(x,z){const h=R(7,9.5),tilt=R(-.15,.15);const tr=new THREE.CylinderGeometry(.22,.38,h,6);tr.translate(0,h/2,0);tr.rotateZ(tilt);tr.translate(x,0,z);addStatic(tr,M.trunk);const tx=x-Math.sin(tilt)*h,ty=Math.cos(tilt)*h;
  for(let k=0;k<7;k++){const l=new THREE.BoxGeometry(.5,.06,4.2);l.translate(0,0,2);l.rotateX(.45+R(0,.25));l.rotateY(k*Math.PI*2/7+R(0,.4));l.translate(tx,ty,z);addStatic(l,M.leaf);}}
function tree(x,z,s=1,mat){const t=new THREE.CylinderGeometry(.25*s,.35*s,3*s,5);t.translate(x,1.5*s,z);addStatic(t,M.trunk);const f=new THREE.IcosahedronGeometry(2.4*s*R(.85,1.15),0);f.translate(x,4*s,z);addStatic(f,mat||M.tree);}
const flags=[];const flagGeo=new THREE.BufferGeometry();flagGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,-1.6,0,3,-.8,0],3));flagGeo.computeVertexNormals();const flagMat=new THREE.MeshLambertMaterial({color:0xff8a1c,side:THREE.DoubleSide});
function addFlag(x,y,z,big){const f=new THREE.Mesh(flagGeo,flagMat);f.position.set(x,y,z);if(big)f.scale.setScalar(2.2);scene.add(f);flags.push(f);box(.08,big?6:3.5,.08,x,y-(big?2.5:1.7),z,M.pole);}
const signTexCache=[];
// the India Bay logo for boards in the world (Beta v1.01.29): drawn when the image has loaded
const LOGO_IMG=new Image();LOGO_IMG.src='assets/logo-board.jpg';const logoWait=[];LOGO_IMG.onload=()=>{for(const f of logoWait.splice(0))try{f();}catch(e){}};
function logoTex(w,h,line){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const t=new THREE.CanvasTexture(c);
  const draw=()=>{const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#123d4c');g.addColorStop(1,'#1d5f73');x.fillStyle=g;x.fillRect(0,0,w,h);const sq=Math.min(h*.92,w*.45);if(LOGO_IMG.complete&&LOGO_IMG.naturalWidth)x.drawImage(LOGO_IMG,(h-sq)/2,(h-sq)/2,sq,sq);
    const tx=(h-sq)/2*2+sq,tw=w-tx-h*.06;if(tw>w*.25){x.fillStyle='#ffc93c';x.textAlign='left';x.textBaseline='middle';let f=Math.round(h*.24);x.font=`900 ${f}px "Baloo 2",sans-serif`;while(x.measureText('INDIA BAY').width>tw&&f>10){f--;x.font=`900 ${f}px "Baloo 2",sans-serif`;}x.fillText('INDIA BAY',tx,h*.38);x.fillStyle='#fff6d8';let f2=Math.round(h*.11);x.font=`700 ${f2}px "Baloo 2",sans-serif`;while(x.measureText(line).width>tw&&f2>8){f2--;x.font=`700 ${f2}px "Baloo 2",sans-serif`;}x.fillText(line,tx,h*.62);}t.needsUpdate=true;};
  draw();if(!(LOGO_IMG.complete&&LOGO_IMG.naturalWidth))logoWait.push(draw);return t;}
function signTex(t,fg,bg,w=512,h=128){return canvasTex(w,h,x=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=fg;x.lineWidth=Math.max(4,h/20);x.strokeRect(h/14,h/14,w-h/7,h-h/7);x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';const L=String(t).split('|').map(q=>q.trim()).filter(Boolean).slice(0,2);if(L.length>1){const fit=(q,sz,wt)=>{x.font=`${wt} ${sz}px "Baloo 2", sans-serif`;while(x.measureText(q).width>w*.8&&sz>8){sz-=2;x.font=`${wt} ${sz}px "Baloo 2", sans-serif`;}return sz;};const f1=fit(L[0],Math.round(h*.34),800);x.fillText(L[0],w/2,h*.4);fit(L[1],Math.round(Math.max(Math.min(h*.2,f1*1.05),h*.14)),700);x.fillText(L[1],w/2,h*.71);return;}t=L[0]||'';let s=h*.55;x.font=`800 ${s}px "Baloo 2", sans-serif`;while(x.measureText(t).width>w*.86&&s>12){s-=4;x.font=`800 ${s}px "Baloo 2", sans-serif`;}x.fillText(t,w/2,h*.56);},false);}
// a text board readable from both sides: the back gets its own copy, so it is never seen mirrored (Beta v1.01.29)
function twoSided(m){const mt=m.material;if(!mt||!mt.map)return m;mt.side=THREE.FrontSide;const b=new THREE.Mesh(m.geometry,mt.clone());b.material.side=THREE.FrontSide;b.rotation.y=Math.PI;b.position.z=-.012;b.userData=m.userData;m.add(b);return m;}
function addSign(text,x,y,z,ry,w,h,fg,bg){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:signTex(text,fg,bg,512,Math.round(512*h/w))}));twoSided(m);m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);return m;}
const clockTex=canvasTex(128,128,x=>{x.fillStyle='#f6f1e3';x.beginPath();x.arc(64,64,60,0,6.29);x.fill();x.strokeStyle='#2a2420';x.lineWidth=6;x.stroke();x.lineWidth=5;x.beginPath();x.moveTo(64,64);x.lineTo(64,24);x.moveTo(64,64);x.lineTo(92,70);x.stroke();},false);

/* ================= city + building generation ================= */
let curZone=null,curStyle=STYLES.metro;
const BLDS=[];/* Beta v1.01.24: every city building, so features can let you walk in */
const BLDH=[];function building(x,z,w,d,h,mat,opts={}){if(!opts.noEnter)BLDS.push({x,z,w,d,h,old:!!opts.old});BLDH.push([x,z,w/2,d/2,h]);const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv;
  for(let f=0;f<6;f++)for(let k=0;k<4;k++){const i=f*4+k;let u=uv.getX(i),v=uv.getY(i);if(f===2||f===3){u=.01;v=.01;}else{const fw=f<2?d:w;u*=fw/(opts.old?24:32);v*=h/(opts.old?24:32);}uv.setXY(i,u,v);}
  g.translate(x,h/2+.3,z);addStatic(g,mat);addCol(x,z,w/2+.15,d/2+.15,true,true);
  if(opts.cottage){const r=new THREE.CylinderGeometry(0,Math.max(w,d)*.75,3,4,1);r.rotateY(Math.PI/4);r.scale(w/Math.max(w,d),1,d/Math.max(w,d));r.translate(x,h+1.8,z);addStatic(r,M.roofRed);return;}
  box(w+.4,.6,d+.4,x,h+.6,z,M.cream);
  // Beta v1.01.03 detail: floor ledges, balconies with railings, AC units, a shop band and signboard at street level
  if(h<70&&!opts.plain){for(let y=6.7;y<h-1&&y<36;y+=6.4)box(w+.24,.16,d+.24,x,y+.3,z,M.cream,false,false);
    const fs=rnd()<.5?1:-1,nB=Math.min(3,Math.floor(h/6.4));for(let k=0;k<nB;k++){const by=4+k*6.4+3.2,bx=x+R(-w/4,w/4);box(2.6,.14,1,bx,by+.3,z+fs*(d/2+.5),M.cream,false,false);box(2.6,.7,.06,bx,by+.65,z+fs*(d/2+.98),M.steel,false,false);}
    for(let k=0;k<2;k++){const ay=3.6+R(1,h-4)|0;box(.8,.5,.35,x+R(-w/3,w/3),Math.min(h-1,ay)+.3,z-fs*(d/2+.2),M.white,false,false);}
    if(h<40){box(w+.08,3.2,d+.08,x,1.9,z,M.basalt,false,false);const sw=w*.7;box(sw,.85,.14,x,4.1,z+fs*(d/2+.12),pick(M.awn),false,false);}}
  if(!opts.old&&rnd()<.5){const t=new THREE.CylinderGeometry(.9,.9,1.6,8);t.translate(x+R(-w/4,w/4),h+1.7,z+R(-d/4,d/4));addStatic(t,M.tank);}
  if(opts.chhatri&&rnd()<opts.chhatri){const cx=x+R(-w/4,w/4),cz=z+R(-d/4,d/4);for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const p=new THREE.CylinderGeometry(.12,.12,1.6,4);p.translate(cx+dx*.9,h+1.6,cz+dz*.9);addStatic(p,mat);}const dm=new THREE.SphereGeometry(1.3,8,5,0,Math.PI*2,0,Math.PI/2);dm.translate(cx,h+2.4,cz);addStatic(dm,mat);}
  if(opts.dome&&rnd()<opts.dome){const dm=new THREE.SphereGeometry(Math.min(w,d)*.25,10,6,0,Math.PI*2,0,Math.PI/2);dm.translate(x,h+.9,z);addStatic(dm,M.white);}
  if(opts.awn&&h<70){const a=pick(M.awn);if(opts.awn[0])box(.9,.25,d*.8,x+opts.awn[0]*(w/2+.45),3.6,z,a);else box(w*.8,.25,.9,x,3.6,z+opts.awn[1]*(d/2+.45),a);}}
function ctxBuilding(x,z,w,d,h,kind){const S=curStyle;if(kind==='glass')return building(x,z,w,d,h,glassMat,{});building(x,z,w,d,h,bmat(pick(S.cols),S.old),{old:S.old});}
const LCTX={THREE,M,rnd,pick,add:(g,m,c,r)=>addStatic(g,m,c!==false,r!==false),box:(w,h,d,x,y,z,m,c,r)=>{if(m===M.waterBox&&y-h/2<1&&w*d>40)addPool(x,z,w/2,d/2,true);return box(w,h,d,x,y,z,m,c,r);},pool:(x,z,rx,rz)=>addPool(x,z,rx,rz),boxRot:(w,h,d,x,y,z,ry,m,c,r)=>boxRot(w,h,d,x,y,z,ry,m,c,r),
  cyl:(rt,rb,h,x,y,z,m,seg=10)=>{const g=new THREE.CylinderGeometry(rt,rb,h,seg);g.translate(x,y,z);addStatic(g,m);},
  cone:(r,h,x,y,z,m,seg=8)=>{const g=new THREE.ConeGeometry(r,h,seg);if(seg===4)g.rotateY(Math.PI/4);g.translate(x,y,z);addStatic(g,m);},
  sph:(r,x,y,z,m)=>{const g=new THREE.SphereGeometry(r,12,8);g.translate(x,y,z);addStatic(g,m);},
  dome:(r,x,y,z,m)=>{const g=new THREE.SphereGeometry(r,14,8,0,Math.PI*2,0,Math.PI/2);g.translate(x,y,z);addStatic(g,m);},
  torus:(R1,r,x,y,z,m)=>{const g=new THREE.TorusGeometry(R1,r,8,16,Math.PI);g.rotateY(Math.PI/2);g.translate(x,y,z);addStatic(g,m);},
  roof:(w,h,d,x,y,z,m)=>{const g=new THREE.CylinderGeometry(0,1,h,4,1);g.rotateY(Math.PI/4);g.scale(w*.71,1,d*.71);g.translate(x,y+h/2,z);addStatic(g,m);},
  wedge:(w,h,d,x,y,z,m)=>{const s=new THREE.Shape();s.moveTo(-d/2,0);s.lineTo(d/2,0);s.lineTo(d/2,h);s.lineTo(-d/2,0);const g=new THREE.ExtrudeGeometry(s,{depth:w,bevelEnabled:false});g.rotateY(Math.PI/2);g.translate(x-w/2,y,z);addStatic(g,m);},
  sign:(t,x,y,z,ry,w,h,fg,bg)=>addSign(t,x,y,z,ry,w,h,fg,bg),
  clock:(x,y,z,ry)=>{const m=new THREE.Mesh(new THREE.CircleGeometry(2.2,20),new THREE.MeshBasicMaterial({map:clockTex}));m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);},
  cable:(x1,y1,z1,x2,y2,z2)=>{const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1,y1,z1),new THREE.Vector3(x2,y2,z2)]);scene.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0xdddddd})));},
  flag:(x,y,z,big)=>addFlag(x,y,z,big),tree:(x,z,s)=>tree(x,z,s),palm:(x,z)=>palm(x,z),building:ctxBuilding,col:(x,z,hw,hd)=>{const b=LCTX._blk;if(b){const x0=Math.max(x-hw,b.x-30.5),x1=Math.min(x+hw,b.x+30.5),z0=Math.max(z-hd,b.z-30.5),z1=Math.min(z+hd,b.z+30.5);if(x1<=x0||z1<=z0)return;return addCol((x0+x1)/2,(z0+z1)/2,(x1-x0)/2,(z1-z0)/2);}return addCol(x,z,hw,hd);},far:()=>{LCTX._far=true;}};

/* roads first so buildings avoid them */
/* Beta v1.01.07: tidy the highway lines before they are built.
   1. A road never runs off into the sea: each end is trimmed back to dry land (bridges and causeways are left alone).
   2. Sharp bends become smooth curves: a corner is replaced by a short arc, except where another road joins at that point. */
{const wet=(x,z)=>!isLand(x,z)||!!inLake(x,z);
  const hwPtNear=(h,x,z,r)=>W.highways.some(o=>o!==h&&(o.pts.some(p=>Math.hypot(p[0]-x,p[1]-z)<r)||o.pts.some((p,i)=>i<o.pts.length-1&&segD(x,z,p[0],p[1],o.pts[i+1][0],o.pts[i+1][1])<r*.6)))||W.zones.some(q=>x>q.x0-r&&x<q.x0+q.nx*80+r&&z>q.z0-r&&z<q.z0+q.nz*80+r)||W.airports.some(a=>a.access.some(p=>Math.hypot(p[0]-x,p[1]-z)<r));
  function trimEnd(P){// walk in from the first point until the road is on land, then keep 3 m of margin
    let i=0,acc=null;while(i<P.length-1){const a=P[i],b=P[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);let hit=-1;for(let t=0;t<=L;t+=3){if(!wet(a[0]+(b[0]-a[0])*t/L,a[1]+(b[1]-a[1])*t/L)){hit=t;break;}}if(hit<0){i++;continue;}
      if(i===0&&hit===0)return P;const t=Math.min(L,hit+3);acc=[a[0]+(b[0]-a[0])*t/L,a[1]+(b[1]-a[1])*t/L];return [acc].concat(P.slice(i+1));}return null;}
  W.highways=W.highways.filter(h=>{if(h.kind==='bridge'||h.fly)return true;let P=trimEnd(h.pts);if(!P||P.length<2)return false;P=trimEnd(P.slice().reverse());if(!P||P.length<2)return false;P=P.reverse();
    const L=P.reduce((s,p,i)=>i?s+Math.hypot(p[0]-P[i-1][0],p[1]-P[i-1][1]):0,0);if(L<12)return false;h.pts=P;return true;});
  for(const h of W.highways){if(h.fly||h.kind==='bridge'||h.pts.length<3)continue;const P=h.pts,out=[P[0]];
    for(let i=1;i<P.length-1;i++){const a=P[i-1],b=P[i],c=P[i+1];const l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]);
      const u=[(b[0]-a[0])/l1,(b[1]-a[1])/l1],v=[(c[0]-b[0])/l2,(c[1]-b[1])/l2];const turn=Math.acos(clamp(u[0]*v[0]+u[1]*v[1],-1,1));
      if(turn<.12||l1<24||l2<24||hwPtNear(h,b[0],b[1],22)){out.push(b);continue;}
      const r=Math.min(l1*.38,l2*.38,18+turn*30);const p0=[b[0]-u[0]*r,b[1]-u[1]*r],p2=[b[0]+v[0]*r,b[1]+v[1]*r];const n=Math.max(3,Math.ceil(turn*6));const arc=[];
      for(let k=0;k<=n;k++){const t=k/n,q=[(1-t)*(1-t)*p0[0]+2*(1-t)*t*b[0]+t*t*p2[0],(1-t)*(1-t)*p0[1]+2*(1-t)*t*b[1]+t*t*p2[1]];arc.push(q);}
      if(arc.some(q=>wet(q[0],q[1]))&&!wet(b[0],b[1])){out.push(b);continue;}out.push(...arc);}
    out.push(P[P.length-1]);h.pts=out;}}
// coast roads (Marine Drive): the grid stops at the coast road instead of running through it into the sea
const COASTS=W.highways.filter(h=>h.kind==='coast').map(h=>{const segs=[];for(let k=0;k<h.pts.length-1;k++){const [ax,az]=h.pts[k],[bx,bz]=h.pts[k+1];const l=Math.hypot(bx-ax,bz-az);segs.push({ax,az,dx:(bx-ax)/l,dz:(bz-az)/l,l});}
  const m=segs[Math.floor(segs.length/2)];const mx=m.ax+m.dx*m.l/2,mz=m.az+m.dz*m.l/2;const sea=isLand(mx-m.dz*40,mz+m.dx*40)?-1:1;return {segs,sea};});
function seaOfCoast(x,z){for(const c of COASTS){let best=1e9,side=0;for(const s of c.segs){const px=x-s.ax,pz=z-s.az;const t=clamp(px*s.dx+pz*s.dz,0,s.l);const d=Math.hypot(px-s.dx*t,pz-s.dz*t);if(d<best){best=d;side=(-px*s.dz+pz*s.dx);}}if(best<70&&side*c.sea>.5)return true;}return false;}
for(const z of W.zones){const x1=z.x0+z.nx*80,z1=z.z0+z.nz*80;
  const clip=(pts,w,name)=>{let run=[];const out=[];const [a,b]=pts;const len=Math.hypot(b[0]-a[0],b[1]-a[1]);const n=Math.ceil(len/5);for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,zz=a[1]+(b[1]-a[1])*t;if(isLand(x,zz)&&!inLake(x,zz)&&!seaOfCoast(x,zz))run.push([x,zz]);else{if(run.length>1)out.push(run);run=[];}}if(run.length>1)out.push(run);
    for(const r of out)addRoad([r[0],r[r.length-1]],w,'city',name);};
  for(let i=0;i<=z.nx;i++)clip([[z.x0+i*80,z.z0],[z.x0+i*80,z1]],16,z.name);for(let j=0;j<=z.nz;j++)clip([[z.x0,z.z0+j*80],[x1,z.z0+j*80]],16,z.name);}
// highway ends meet a town at a grid junction, arriving square to the edge (no long shallow overlaps with the grid)
const onOtherHw=(h,x,z)=>W.highways.some(o=>o!==h&&o.pts.some((p,i)=>i<o.pts.length-1&&segD(x,z,p[0],p[1],o.pts[i+1][0],o.pts[i+1][1])<12));
function snapEnds(h){const P=h.pts;for(const end of [0,1]){const k=end?P.length-1:0,nb=end?P.length-2:1;const [x,z]=P[k];if(h._keep&&h._keep[end])continue;let J=null,jd=60,Z=null;
    for(const zn of W.zones){const x1=zn.x0+zn.nx*80,z1=zn.z0+zn.nz*80;if(x<zn.x0-60||x>x1+60||z<zn.z0-60||z>z1+60)continue;const i=clamp(Math.round((x-zn.x0)/80),0,zn.nx),j=clamp(Math.round((z-zn.z0)/80),0,zn.nz);const jx=zn.x0+i*80,jz=zn.z0+j*80,d=Math.hypot(jx-x,jz-z);if(d<jd&&isLand(jx,jz)&&!inLake(jx,jz)&&!inRiver(jx,jz)){jd=d;J=[jx,jz,i,j];Z=zn;}}
    if(!J)continue;P[k]=[J[0],J[1]];const [px,pz]=P[nb];const vx=px-J[0],vz=pz-J[1],vl=Math.hypot(vx,vz);if(vl<45)continue;
    const ns=[];if(J[2]===0)ns.push([-1,0]);if(J[2]===Z.nx)ns.push([1,0]);if(J[3]===0)ns.push([0,-1]);if(J[3]===Z.nz)ns.push([0,1]);if(!ns.length)continue;
    let n=ns[0];for(const q of ns)if(q[0]*vx+q[1]*vz>n[0]*vx+n[1]*vz)n=q;const dot=(n[0]*vx+n[1]*vz)/vl;if(dot<=0||dot>.8)continue;   // only when it comes in at a shallow angle from outside
    const q=[J[0]+n[0]*28,J[1]+n[1]*28];if(end)P.splice(k,0,q);else P.splice(1,0,q);}}
for(const h of W.highways){const P=h.pts;h._keep=[onOtherHw(h,P[0][0],P[0][1])||W.highways.some(o=>o!==h&&o.pts.some(p=>Math.hypot(p[0]-P[0][0],p[1]-P[0][1])<40)),onOtherHw(h,P[P.length-1][0],P[P.length-1][1])||W.highways.some(o=>o!==h&&o.pts.some(p=>Math.hypot(p[0]-P[P.length-1][0],p[1]-P[P.length-1][1])<40))];}
const hwLen=h=>h.pts.reduce((s,p,i)=>i?s+Math.hypot(p[0]-h.pts[i-1][0],p[1]-h.pts[i-1][1]):0,0);
for(const h of W.highways)if(!h.fly&&h.kind!=='coast'&&h.kind!=='bridge'&&hwLen(h)>150)snapEnds(h);
for(const h of W.highways){const w=h.w||(h.kind==='exp'?16:h.kind==='bridge'?14:14);const r=addRoad(h.pts,w,h.kind==='bridge'?'bridge':h.kind==='coast'?'coast':'hw',h.name);
  if(h.fly){r.fly=true;let s=0;for(const e of r.edges){e.s0=s;s+=e.len;e.fly=r;}r.len=s;}}
/* Flyovers (v4.2): a highway marked fly rises on ramps to FLYH and runs above the roads and town below. */
const FLYH=7.5,FLYRAMP=70;
function flyY(e,t){const r=e&&e.fly;if(!r)return 0;const s=e.s0+t;const k=Math.max(0,Math.min(1,s/FLYRAMP,(r.len-s)/FLYRAMP));return FLYH*k*k*(3-2*k);}
function onRoadOf(r,x,z){let best=null;for(const e of r.edges){let t=(x-e.ax)*e.dx+(z-e.az)*e.dz;t=Math.max(0,Math.min(e.len,t));const px=e.ax+e.dx*t,pz=e.az+e.dz*t;const lat=Math.hypot(x-px,z-pz);if(!best||lat<best.lat)best={e,t,lat,px,pz,s:e.s0+t};}return best;}
/* Service roads (v4.2): narrow roads on both sides of an expressway near a city, joined back to it by slip roads. */
for(const h of W.highways){if(h.kind!=='exp'||h.fly)continue;for(let k=0;k<h.pts.length-1;k++){const [ax,az]=h.pts[k],[bx,bz]=h.pts[k+1];const L=Math.hypot(bx-ax,bz-az);if(L<160)continue;const mx=(ax+bx)/2,mz=(az+bz)/2;
    const box=(z,m)=>mx>z.x0-m&&mx<z.x0+z.nx*80+m&&mz>z.z0-m&&mz<z.z0+z.nz*80+m;if(!W.zones.some(z=>z.size!=='small'&&box(z,520))||W.zones.some(z=>box(z,60)))continue;
    const dx=(bx-ax)/L,dz=(bz-az)/L,o=(h.w||16)/2+7.5,t0=L*.2,t1=L*.8;
    for(const sd of [-1,1]){const P=(t,off)=>[ax+dx*t+dz*off*sd,az+dz*t-dx*off*sd];const pts=[P(t0-26,0),P(t0,o),P(t1,o),P(t1+26,0)];
      if(pts.some(([x,z])=>!isLand(x,z)||inLake(x,z)||inRiver(x,z)))continue;const nearTown=([x,z])=>W.zones.some(q=>x>q.x0-180&&x<q.x0+q.nx*80+180&&z>q.z0-180&&z<q.z0+q.nz*80+180);if(nearTown(pts[0])||nearTown(pts[3]))continue;let clash=false;for(let t=t0;t<=t1&&!clash;t+=10){const [x,z]=P(t,o);for(const id of edgesNear(x,z)){const f=EDGES[id];if(f.road.name===h.name)continue;if(segD(x,z,f.ax,f.az,f.bx,f.bz)<f.w/2+5){clash=true;break;}}}
      if(!clash)addRoad(pts,7,'service',h.name+' service road');}}}
for(const a of W.airports)addRoad(a.access,12,'city',a.name+' road');
// Parts of a highway that are not already covered by a parallel road (a city edge road or an earlier highway),
// so two road surfaces never lie on top of each other.
function hwSpans(e,ri){const st=3,keep=[];let a=-1;const covered=t=>{const x=e.ax+e.dx*t,z=e.az+e.dz*t;for(const id of edgesNear(x,z)){const f=EDGES[id];if(f===e||f.road===e.road||f.fly)continue;if(f.kind!=='city'&&ROADS.indexOf(f.road)>ri)continue;
      if(Math.abs(e.dx*f.dx+e.dz*f.dz)<.94)continue;if(segD(x,z,f.ax,f.az,f.bx,f.bz)<Math.max(f.w,e.w)/2-1)return true;}return false;};
  for(let t=0;t<=e.len+.01;t+=st){const tt=Math.min(t,e.len);const c=covered(tt);if(!c&&a<0)a=tt;if(c&&a>=0){if(tt-a>2)keep.push([a,tt]);a=-1;}}if(a>=0&&e.len-a>2)keep.push([a,e.len]);return keep;}
const FLY_ADS=[];
function flyDeck(r){const pos=[],uv=[],idx=[],dpos=[],didx=[];const w=r.w,step=5;let base=0;const pts=[];
  for(const e of r.edges){for(let t=0;t<e.len;t+=step)pts.push({x:e.ax+e.dx*t,z:e.az+e.dz*t,e,t});}const le=r.edges[r.edges.length-1];pts.push({x:le.bx,z:le.bz,e:le,t:le.len});
  pts.forEach((p,i)=>{const q=pts[Math.min(pts.length-1,i+1)],o=pts[Math.max(0,i-1)];let dx=q.x-o.x,dz=q.z-o.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;p.nx=dz;p.nz=-dx;p.y=flyY(p.e,p.t)+.06;p.s=p.e.s0+p.t;});
  const strip=(arr,ix,off0,off1,y0,y1,useUv)=>{const b=arr.length/3;pts.forEach(p=>{arr.push(p.x+p.nx*off0,p.y+y0,p.z+p.nz*off0,p.x+p.nx*off1,p.y+y1,p.z+p.nz*off1);if(useUv)uv.push(0,p.s/16,1,p.s/16);});for(let i=0;i<pts.length-1;i++){const a=b+i*2;ix.push(a,a+2,a+1,a+1,a+2,a+3);}};
  strip(pos,idx,-w/2,w/2,0,0,true);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  // keep the road face pointing up
  const nrm=g.attributes.normal;if(nrm.count&&nrm.getY(0)<0){idx.reverse();g.setIndex(idx);g.computeVertexNormals();}addStatic(g,M.hw,false,true);
  // concrete deck underneath, side faces and parapets
  const W2=w/2+.6;strip(dpos,didx,-W2,W2,-.9,-.9);strip(dpos,didx,-W2,-W2,-.9,.05);strip(dpos,didx,W2,W2,.05,-.9);strip(dpos,didx,-W2,-W2,.05,.95);strip(dpos,didx,W2,W2,.95,.05);strip(dpos,didx,-W2+.35,-W2+.35,.95,.05);strip(dpos,didx,W2-.35,W2-.35,.05,.95);
  const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.Float32BufferAttribute(dpos,3));dg.setIndex(didx);dg.computeVertexNormals();const cm=M.concrete.clone();cm.side=THREE.DoubleSide;addStatic(dg,cm,false,true);
  // pillars where the deck is high, and lamp posts on the parapet
  pts.forEach((p,i)=>{if(i%6||p.y<2.2)return;const h=p.y-.9;const c=new THREE.CylinderGeometry(.9,1.05,h,10);c.translate(p.x,h/2,p.z);addStatic(c,M.concrete);const cap=new THREE.BoxGeometry(w*.7,.7,1.6);cap.rotateY(Math.atan2(-p.nz,p.nx));cap.translate(p.x,p.y-1.25,p.z);addStatic(cap,M.concrete);});
  // local ads: flex wraps on some pillars, banners on the outer face of the parapets (registered once SLOTS exist)
  pts.forEach((p,i)=>{if(p.y<6)return;if(i%18===0)FLY_ADS.push({id:`fp:${r.name}:${i}`,x:p.x,y:0,z:p.z,rot:Math.atan2(-p.nz,p.nx)+Math.PI/2,kind:'pillar',road:'flyover',zone:null,bw:1.7,bh:2.4,y0:p.y-3.6,off:1.1});
    if(i%30===15){const sd=(i/30|0)%2?1:-1;FLY_ADS.push({id:`fb:${r.name}:${i}`,x:p.x+p.nx*sd*(w/2+.66),y:0,z:p.z+p.nz*sd*(w/2+.66),rot:Math.atan2(p.nx*sd,p.nz*sd),kind:'parapet',road:'flyover',zone:null,bw:9,bh:1.1,y0:p.y+.35});}});
  pts.forEach((p,i)=>{if(i%8!==4)return;const sd=(i/8|0)%2?1:-1;const lp=new THREE.CylinderGeometry(.1,.12,6,5);lp.translate(p.x+p.nx*sd*(w/2+.3),p.y+3,p.z+p.nz*sd*(w/2+.3));addStatic(lp,M.pole);});}
function roadRibbons(){ROADS.forEach((r,ri)=>{if(r.fly){flyDeck(r);return;}const isCity=r.kind==='city';const mat=isCity||r.kind==='coast'||r.kind==='service'?M.road:M.hw;
  // each highway gets its own small height so two highways that cross never flicker against each other
  const y=isCity?(Math.abs(r.pts[0][0]-r.pts[1][0])<1?.02:.026):r.kind==='bridge'?.08:r.kind==='coast'?.03:.036+(ri%6)*.006;
  for(const e of r.edges){const spans=isCity?[[0,e.len]]:hwSpans(e,ri);for(const [u0,u1] of spans){const seg=Math.ceil((u1-u0)/160);for(let s=0;s<seg;s++){const t0=u0+(u1-u0)*s/seg,t1=u0+(u1-u0)*(s+1)/seg,l=t1-t0+(isCity?0:e.w*.5);const g=new THREE.PlaneGeometry(e.w,l);g.rotateX(-Math.PI/2);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*l/16);g.rotateY(Math.atan2(e.dx,e.dz));
      const mx=e.ax+e.dx*(t0+t1)/2,mz=e.az+e.dz*(t0+t1)/2;g.translate(mx,y,mz);addStatic(g,mat,false,true);
      if(r.kind==='bridge'){const d=new THREE.BoxGeometry(e.w+1,1.2,l);d.rotateY(Math.atan2(e.dx,e.dz));d.translate(mx,-.55,mz);addStatic(d,M.concrete,false,true);}}}
    if(r.kind!=='bridge')riverBridges(e,y);
    if(isCity)kerbsAndCrossings(e,y);}});}
// City roads run straight across the whole grid, so kerbs and zebra crossings are placed block by block between junctions.
function kerbsAndCrossings(e,y){const zz=zoneAt((e.ax+e.bx)/2,(e.az+e.bz)/2,0);const vert=Math.abs(e.dx)<.01,ang=Math.atan2(e.dx,e.dz);
  if(!zz||!(vert||Math.abs(e.dz)<.01)){return;}const o0=vert?zz.z0:zz.x0,a0=vert?e.az:e.ax,sgn=Math.sign(vert?e.dz:e.dx)||1;const trim=e.w/2+1.4,big=zz.size==='big'||zz.size==='mid';
  const c0=Math.min(a0,a0+sgn*e.len),c1=Math.max(a0,a0+sgn*e.len);
  for(let n=Math.floor((c0-o0)/80);n*80+o0<c1;n++){const g0=o0+n*80,g1=g0+80;const s0=Math.max(g0,c0),s1=Math.min(g1,c1);const k0=s0+(s0===g0?trim:.5),k1=s1-(s1===g1?trim:.5);if(k1-k0<4)continue;
    const mid=(k0+k1)/2,l=k1-k0;const cx=vert?e.ax:mid,cz=vert?mid:e.az;
    for(const sd of [-1,1]){const ox=e.dz*sd*(e.w/2+.15),oz=-e.dx*sd*(e.w/2+.15);let r0=-1;const put=(a,b)=>{if(b-a<1.5)return;const m=(a+b)/2;const k=new THREE.BoxGeometry(.3,.15,b-a);k.rotateY(ang);k.translate((vert?e.ax:m)+ox,.075,(vert?m:e.az)+oz);addStatic(k,M.kerb,false,true);};
      for(let q=k0;q<=k1+.01;q+=1.5){const qq=Math.min(q,k1);const px=(vert?e.ax:qq)+ox,pz=(vert?qq:e.az)+oz;let blocked=false;for(const id of edgesNear(px,pz)){const f=EDGES[id];if(f===e)continue;if(segD(px,pz,f.ax,f.az,f.bx,f.bz)<f.w/2+.6){blocked=true;break;}}
        if(!blocked&&r0<0)r0=qq;if(blocked&&r0>=0){put(r0,qq-.4);r0=-1;}}if(r0>=0)put(r0,k1);}
    if(big)for(const [edge,at] of [[s0===g0,k0+1.2],[s1===g1,k1-1.2]]){if(!edge)continue;const zx=vert?e.ax:at,zz2=vert?at:e.az;const zg=new THREE.PlaneGeometry(e.w*.86,3);zg.rotateX(-Math.PI/2);zg.rotateY(ang);zg.translate(zx,y+.004,zz2);addStatic(zg,M.zebra,false,true);}}}
// Where a road crosses a river or lake, add a concrete deck with side walls and pillars under it.
function riverBridges(e,y){const st=6;let t0=-1;const ang=Math.atan2(e.dx,e.dz);const span=(a,b)=>{a=Math.max(0,a-10);b=Math.min(e.len,b+10);const l=b-a;if(l<8)return;const mx=e.ax+e.dx*(a+b)/2,mz=e.az+e.dz*(a+b)/2;
    const d=new THREE.BoxGeometry(e.w+1.4,.9,l);d.rotateY(ang);d.translate(mx,y-.47,mz);addStatic(d,M.concrete,false,true);
    for(const sd of [-1,1]){let r0=-1;const wall=(u0,u1)=>{if(u1-u0<1.5)return;const wl=new THREE.BoxGeometry(.35,.75,u1-u0);wl.rotateY(ang);const um=(u0+u1)/2;wl.translate(e.ax+e.dx*um+e.dz*sd*(e.w/2+.5),y+.36,e.az+e.dz*um-e.dx*sd*(e.w/2+.5));addStatic(wl,M.concrete,false,true);};
      for(let q=a;q<=b+.01;q+=1.5){const qq=Math.min(q,b);const px=e.ax+e.dx*qq+e.dz*sd*(e.w/2+.5),pz=e.az+e.dz*qq-e.dx*sd*(e.w/2+.5);let open=false;for(const id of edgesNear(px,pz)){const f=EDGES[id];if(f===e||f.road===e.road||f.fly)continue;if(segD(px,pz,f.ax,f.az,f.bx,f.bz)<f.w/2+1.2){open=true;break;}}
        if(!open&&r0<0)r0=qq;if(open&&r0>=0){wall(r0,qq-.6);r0=-1;}}if(r0>=0)wall(r0,b);}
    for(let q=a+8;q<b-4;q+=28){const px=e.ax+e.dx*q,pz=e.az+e.dz*q;const pl=new THREE.BoxGeometry(e.w*.6,4,1.6);pl.rotateY(ang);pl.translate(px,y-2.8,pz);addStatic(pl,M.concrete,false,true);}};
  for(let t=0;t<=e.len;t+=st){const w=isWater(e.ax+e.dx*t,e.az+e.dz*t);if(w&&t0<0)t0=t;if(!w&&t0>=0){span(t0,t);t0=-1;}}if(t0>=0)span(t0,e.len);}
roadRibbons();
{const disc=new Map();for(const r of ROADS){if(r.fly||r.kind==='city'||r.kind==='service')continue;for(const p of r.pts){const k=Math.round(p[0]/3)+','+Math.round(p[1]/3);const w=r.w/2;if(!disc.has(k)||disc.get(k).w<w)disc.set(k,{x:p[0],z:p[1],w,m:r.kind==='coast'?M.road:M.hw,y:r.kind==='bridge'?.075:.031});}}
  for(const d of disc.values()){if(isWater(d.x,d.z)&&d.y<.07)continue;const g=new THREE.CircleGeometry(d.w,18);g.rotateX(-Math.PI/2);g.translate(d.x,d.y,d.z);addStatic(g,d.m,false,true);}}
for(const z of W.zones)for(let i=0;i<=z.nx;i++)for(let j=0;j<=z.nz;j++){const x=z.x0+i*80,zz=z.z0+j*80;if(!isLand(x,zz)||inLake(x,zz))continue;const p=new THREE.PlaneGeometry(16,16);p.rotateX(-Math.PI/2);p.translate(x,.04,zz);addStatic(p,M.asphalt,false,true);}
function nearHighway(x,z,r){for(const id of edgesNear(x,z)){const e=EDGES[id];if(e.kind==='city')continue;if(segD(x,z,e.ax,e.az,e.bx,e.bz)<e.w/2+r)return true;}for(const [ox,oz] of [[r,0],[-r,0],[0,r],[0,-r]])for(const id of edgesNear(x+ox,z+oz)){const e=EDGES[id];if(e.kind==='city')continue;if(segD(x,z,e.ax,e.az,e.bx,e.bz)<e.w/2+r)return true;}return false;}

/* services are planned before buildings so lots can be reserved */
const pois=[];const blocks=[];const zoneData=new Map();
const SVC_LOT=new Set(['pump','cng','station','bus']);
for(const z of W.zones){const zd={z,blocks:[],tallRoofs:[],slots:[]};zoneData.set(z.id,zd);
  for(let i=0;i<z.nx;i++)for(let j=0;j<z.nz;j++){const bx=z.x0+i*80+40,bz=z.z0+j*80+40;const sp=z.specials[i+','+j];const land=!isWater(bx,bz)&&!isWater(bx-28,bz-28)&&!isWater(bx+28,bz+28)&&!isWater(bx-28,bz+28)&&!isWater(bx+28,bz-28);
    const b={zone:z,i,j,x:bx,z:bz,sp,land,reserved:new Set(),open:false,hasBld:false};zd.blocks.push(b);blocks.push(b);}
  const free=zd.blocks.filter(b=>b.land&&!b.sp&&!nearHighway(b.x,b.z,8));const r2=mulberry32(z.x0*7+z.z0);const sides=['n','s','e','w'];
  let svc=(W.serviceSets[z.size]||W.serviceSets.small).slice();if(z.station&&!svc.includes('station'))svc.push('station');
  if(z.id==='mumbai')svc=svc.filter(s=>s!=='station');
  const used=new Set();
  for(const type of svc){if(!free.length)break;let b,side,t,tries=0;do{b=free[Math.floor(r2()*free.length)];side=sides[Math.floor(r2()*4)];t=[-18,0,18][Math.floor(r2()*3)];tries++;}while((used.has(b.i+','+b.j+side+t)||(SVC_LOT.has(type)&&b.reserved.size>=2))&&tries<40);
    used.add(b.i+','+b.j+side+t);used.add(b.i+','+b.j+side+(t+18));used.add(b.i+','+b.j+side+(t-18));
    let lot=null;if(SVC_LOT.has(type)){const lx=side==='e'?1:side==='w'?-1:(t>=0?1:-1),lz=side==='s'?1:side==='n'?-1:(t>=0?1:-1);lot=[lx,lz];b.reserved.add(lx+','+lz);if(side==='n'||side==='s')t=lx*14;else t=lz*14;}
    zd.slots.push({type,b,side,t,lot});}
}
function edgePos(cx,cz,side,t,off=29.5){switch(side){case'n':return[cx+t,cz-off,Math.PI];case's':return[cx+t,cz+off,0];case'w':return[cx-off,cz+t,-Math.PI/2];default:return[cx+off,cz+t,Math.PI/2];}}

/* build cities */
for(const z of W.zones){const zd=zoneData.get(z.id);curZone=z;curStyle=STYLES[z.style]||STYLES.town;const S=curStyle;
  for(const b of zd.blocks){if(!b.land){continue;}const groundMat=S.old?M.earth:M.pave;
    if(b.sp){const [kind,arg]=b.sp.split(':');const fn=LM[kind];box(64,.3,64,b.x,.15,b.z,groundMat,false,true);
      if(fn){LCTX._far=false;LCTX._blk=b;const res=fn(LCTX,b.x,b.z,{arg,zone:z})||{};LCTX._blk=null;b.open=!!res.open;
        for(const p of res.poi||[])zd.slots.push({type:p.type,name:p.name,b,side:p.side,t:p.t||0,extra:p.extra,x:p.x,z:p.z,rot:p.rot});}continue;}
    box(64,.3,64,b.x,.15,b.z,groundMat,false,true);
    const n=S.lots,ls=60/n;let any=false;
    for(let li=0;li<n;li++)for(let lj=0;lj<n;lj++){const ox=-30+ls*(li+.5),oz=-30+ls*(lj+.5);const lx=b.x+ox,lz=b.z+oz;
      const key=(n===2?(li?1:-1):(li===0?-1:li===n-1?1:0))+','+(n===2?(lj?1:-1):(lj===0?-1:lj===n-1?1:0));
      if(b.reserved.has(key)||(n===2&&b.reserved.has(key))){continue;}
      if(n===3&&[...b.reserved].some(k=>{const [a,c]=k.split(',').map(Number);return Math.abs(li-1-a)<=0.5&&Math.abs(lj-1-c)<=0.5;}))continue;
      if(isWater(lx,lz)||nearHighway(lx,lz,ls/2))continue;
      if(S.cottage&&rnd()<.35){tree(lx,lz,1);continue;}
      const w=ls*R(.62,.88),d=ls*R(.62,.88);let h=R(S.h[0],S.h[1]);if(S.tower&&rnd()<S.tower)h=R(55,z.tall?95:75);
      const face=Math.abs(ox)>Math.abs(oz)?[Math.sign(ox),0]:[0,Math.sign(oz)];
      building(lx,lz,w,d,h,bmat(pick(S.cols),S.old),{old:S.old,chhatri:S.chhatri,dome:S.dome,cottage:S.cottage,awn:!S.cottage&&rnd()<.45?face:null});any=true;if(h>20)zd.tallRoofs.push([lx,h+.6,lz]);}
    b.hasBld=any;}
  if(z.id==='mumbai'||z.id==='surat'||z.id==='daman'||z.id==='alibaug'){}}
curZone=null;

/* Marine Drive and seafront lamps */
const lampGeoms=[];
function lampsAlong(pts,side,step){for(let k=0;k<pts.length-1;k++){const [ax,az]=pts[k],[bx,bz]=pts[k+1];const len=Math.hypot(bx-ax,bz-az),dx=(bx-ax)/len,dz=(bz-az)/len;const nx=dz*side,nz=-dx*side;
  for(let t=0;t<len;t+=step){const x=ax+dx*t+nx*9,z=az+dz*t+nz*9;if(isWater(x,z))continue;const p=new THREE.CylinderGeometry(.12,.16,6.6,5);p.translate(x,3.3,z);addStatic(p,M.pole);const bl=new THREE.SphereGeometry(.34,6,5);bl.translate(x-nx*1.4,6.3,z-nz*1.4);lampGeoms.push(bl);if(rnd()<.6)palm(x+nx*3,z+nz*3);}}}
lampsAlong(W.highways.find(h=>h.name==='Marine Drive').pts,-1,16);
lampsAlong([[2540,8100],[2540,8690]],1,18);
/* Street lights (Beta v1.01.03): poles with an arm over the road on every city street and along the highways.
   At night the heads glow and each lamp throws a soft pool of light on the road (a cheap additive decal, no real lights). */
const poolTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(255,214,150,1)');g.addColorStop(.45,'rgba(255,200,130,.45)');g.addColorStop(1,'rgba(255,190,120,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const poolMat=new THREE.MeshBasicMaterial({map:poolTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
const LAMPS=[];
function streetLamp(x,z,ax,az,h,arm,pool){const p=new THREE.CylinderGeometry(.1,.16,h,5);p.translate(x,h/2,z);addStatic(p,M.pole,false,false);
  const ex=x+ax*arm,ez=z+az*arm;const a=new THREE.BoxGeometry(.12,.12,arm);a.rotateY(Math.atan2(ax,az));a.translate(x+ax*arm/2,h-.1,z+az*arm/2);addStatic(a,M.pole,false,false);
  const hd=new THREE.BoxGeometry(.9,.18,.42);hd.rotateY(Math.atan2(ax,az)+Math.PI/2);hd.translate(ex,h-.22,ez);lampGeoms.push(hd);
  const q=new THREE.PlaneGeometry(pool,pool);q.rotateX(-Math.PI/2);q.translate(ex,.07,ez);addStatic(q,poolMat,false,false);LAMPS.push([ex,ez]);}
{const seen=new Set();const key=(x,z)=>Math.round(x/12)+','+Math.round(z/12);
  for(const e of EDGES){if(e.fly||e.road.fly)continue;const city=e.kind==='city',hw=!city&&e.kind!=='service';const step=city?30:44;const nx=e.dz,nz=-e.dx;
    for(let t=city?14:20;t<e.len-6;t+=step){const side=city?((Math.floor(t/step)+e.id)%2?1:-1):(e.id%2?1:-1);const off=e.w/2+(e.kind==='bridge'?-.5:1.3);
      const x=e.ax+e.dx*t+nx*off*side,z=e.az+e.dz*t+nz*off*side;if(e.kind!=='bridge'&&isWater(x,z))continue;const k=key(x,z);if(seen.has(k))continue;seen.add(k);
      if(roadAt(x,z,-.5)&&e.kind!=='bridge')continue;   // a pole would stand on another road
      streetLamp(x,z,-nx*side,-nz*side,city?7.4:9.5,city?2.6:3.6,city?15:19);}}}
for(const g of lampGeoms)addStatic(g,M.lamp,false,false);   // Beta v1.01.29: lamp heads go into the city chunks (drawn only near you)

/* free-standing landmarks */
const lmPois=[];
// beaches and shacks sit on the sand at the shore, never out in the sea (Beta v1.01.07)
{const landFrac=(x,z)=>{let n=0,k=0;for(let r=8;r<=30;r+=11)for(let a=0;a<6.28;a+=.78){k++;if(!isWater(x+Math.cos(a)*r,z+Math.sin(a)*r))n++;}return n/k;};
  for(const l of W.landmarks){if(!/beach|shack|lagoon/i.test(l.kind))continue;if(!isWater(l.x,l.z)&&landFrac(l.x,l.z)>=.6)continue;let best=null,bd=1e9;
    for(let r=10;r<=240&&!best;r+=10)for(let a=0;a<6.28;a+=.3){const x=l.x+Math.cos(a)*r,z=l.z+Math.sin(a)*r;if(isWater(x,z))continue;const f=landFrac(x,z);if(f>=.6&&r<bd){bd=r;best=[x,z];}}
    if(best){const dx=best[0]-l.x,dz=best[1]-l.z;for(const pl of W.places)if(Math.hypot(pl[1]-l.x,pl[2]-l.z)<40){pl[1]+=dx;pl[2]+=dz;}l.x=best[0];l.z=best[1];}}}
for(const l of W.landmarks){const [lk,...la]=l.kind.split(':');const fn=LM[lk];if(!fn)continue;LCTX._far=false;lmCollect=[];const res=fn(LCTX,l.x,l.z,{arg:la.join(':')})||{};const list=lmCollect;lmCollect=null;
  if(LCTX._far)flushFar(list,l.x,l.z);else for(const a of list)addStatic(...a);for(const p of res.poi||[])lmPois.push(p);}

/* airports */
const planeGeo=(()=>{const g=new THREE.Group();return g;})();
// An airliner (Beta v1.01.03): a rounded fuselage with a tapered nose and tail, cockpit windows, a row of cabin
// windows and doors, swept wings with winglets and two engines with fans, a swept tail in the India Bay orange,
// and landing gear.
function buildPlane(){const g=new THREE.Group();const add=(geo,m,x,y,z,rx,ry,rz)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);if(rx)o.rotation.x=rx;if(ry)o.rotation.y=ry;if(rz)o.rotation.z=rz;g.add(o);return o;};
  const prof=[[0,-12.6],[.9,-12],[1.6,-10.6],[2.1,-8],[2.25,-4],[2.25,6],[2.15,8.6],[1.85,10.6],[1.2,11.9],[.45,12.6],[0,12.8]];
  const fus=new THREE.LatheGeometry(prof.map(([r,z])=>new THREE.Vector2(r,z)),16);fus.rotateX(Math.PI/2);add(fus,M.plane,0,0,0);
  const dark=new THREE.MeshLambertMaterial({color:0x1f2a36}),stripe=M.planeTail,grey=M.steel;
  add(new THREE.BoxGeometry(1.7,.38,.9),dark,0,.85,11.2,-.45);                                   // cockpit windscreen
  for(const s of [-1,1]){const w=new THREE.BoxGeometry(.06,.26,17);w.translate(s*2.22,.55,.4);g.add(new THREE.Mesh(w,dark));    // cabin window row
    for(const zz of [9.2,-9.4]){const d=new THREE.BoxGeometry(.07,1.3,.7);d.translate(s*2.23,.15,zz);g.add(new THREE.Mesh(d,new THREE.MeshLambertMaterial({color:0xd9dee4})));}
    const st=new THREE.BoxGeometry(.05,.22,21);st.translate(s*2.24,-.25,0);g.add(new THREE.Mesh(st,stripe));}                    // cheatline
  for(const s of [-1,1]){const wing=new THREE.BoxGeometry(14,.42,4.6);wing.translate(s*7.6,0,0);const m=add(wing,M.plane,0,-.9,1.4,0,s*.32,s*-.05);m.rotation.order='YXZ';
    const wl=new THREE.BoxGeometry(.2,1.5,1.2);wl.translate(s*14.6,.6,-1.3);const wlm=new THREE.Mesh(wl,stripe);wlm.rotation.y=s*.32;wlm.position.set(0,-.9,1.4);g.add(wlm);
    const en=new THREE.CylinderGeometry(.95,.8,3.4,14,1,true);en.rotateX(Math.PI/2);add(en,grey,s*6,-1.95,3.4).material.side=THREE.DoubleSide;
    add(new THREE.CylinderGeometry(.75,.75,.1,14).rotateX(Math.PI/2),dark,s*6,-1.95,5);const fan=add(new THREE.BoxGeometry(1.4,.12,.05),grey,s*6,-1.95,4.95);g.userData.fans=(g.userData.fans||[]).concat(fan);
    add(new THREE.BoxGeometry(.25,.9,1.2),grey,s*6,-1.2,3.3);                                         // pylon
    const hs=new THREE.BoxGeometry(5,.3,2.2);hs.translate(s*2.6,0,0);const h=add(hs,M.plane,0,.4,-11,0,s*.35);}
  const fin=new THREE.BoxGeometry(.4,5.2,3.6);fin.translate(0,2.6,0);add(fin,stripe,0,1.4,-10.6,-.42);                               // tail fin
  add(new THREE.BoxGeometry(.42,.8,1.2),M.plane,0,5.4,-12.6,-.42);
  for(const [x,z] of [[0,9],[-2.2,0],[2.2,0]]){add(new THREE.CylinderGeometry(.08,.08,1.6,5),grey,x,-2.6,z);for(const s of [-.22,.22])add(new THREE.CylinderGeometry(.42,.42,.3,10).rotateZ(Math.PI/2),dark,x+s,-3.4,z);}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
const G0={cyl:new THREE.CylinderGeometry(1,1,1,10)};
const airportPlanes=[];
// Airports: runway with markings, parallel taxiway, apron with parked planes and jet bridges, a terminal with a
// curved roof, a control tower and a hangar. A few airports get their own touch (Kochi's solar farm,
// Bengaluru's garden terminal, Mumbai's big white roof).
const AIRLOOK={COK:{solar:true},BLR:{garden:true,roof:'#6f9a52'},BOM:{wide:1.4,roof:'#f4f1ea'},GOX:{roof:'#c75b3a'},GOI:{},TRV:{roof:'#c75b3a'},AMD:{},JAI:{roof:'#e8967a'},UDR:{roof:'#f4f1ea'}};
const termGlass=LMat('#7fa6c4',{map:winTex,emissiveMap:litTex,emissive:0xffffff,emissiveIntensity:0});
function curvedRoof(len,r,x,y,z,mat,flat){const g=new THREE.CylinderGeometry(r,r,len,16,1,true,0,Math.PI);g.rotateZ(Math.PI/2);g.rotateY(Math.PI/2);g.rotateY(Math.PI/2);g.scale(1,flat,1);g.translate(x,y,z);addStatic(g,mat);
  const cap=new THREE.BoxGeometry(len+2,.4,r*2+2);cap.translate(x,y-.2,z);addStatic(cap,mat);}
for(const a of W.airports){const s=a.side;const look=AIRLOOK[a.id]||{};const roofM=LMat(look.roof||'#e9e6df');
  box(a.L,.12,30,a.x,.05,a.z,M.runway,false,true);for(let t=-a.L/2+16;t<a.L/2-16;t+=18)box(8,.02,.8,a.x+t,.12,a.z,M.white,false,true);
  for(const e of [-1,1]){for(let k=0;k<6;k++)box(9,.02,1.4,a.x+e*(a.L/2-6),.12,a.z-10+k*4,M.white,false,true);box(3,.02,26,a.x+e*(a.L/2-14),.12,a.z,M.white,false,true);
    for(let k=1;k<=4;k++)box(.6,.4,8,a.x+e*(a.L/2+k*7),.2,a.z,LMat('#d9d2b8'),false,true);}
  box(a.L*.7,.1,14,a.x,.05,a.z+s*24,M.runway,false,true);for(let t=-a.L*.35;t<a.L*.35;t+=10)box(4,.02,.35,a.x+t,.11,a.z+s*24,LMat('#f2c14e'),false,true);
  for(const e of [-1,1])box(10,.1,10,a.x+e*a.L*.3,.05,a.z+s*12,M.runway,false,true);
  const TW=120*(look.wide||1);box(a.L*.5,.1,24,a.x,.06,a.z+s*36,M.apron,false,true);
  // terminal: glass hall under a curved roof, with a drop-off canopy on the landside
  box(TW,9,16,a.x,4.5,a.z+s*48,termGlass);curvedRoof(TW+4,10.5,a.x,9,a.z+s*48,roofM,.42);box(TW*.8,.5,8,a.x,6,a.z+s*60,roofM);for(let t=-TW*.38;t<=TW*.38;t+=TW*.19)box(.5,6,.5,a.x+t,3,a.z+s*63,M.steel);
  addSign(a.name.toUpperCase(),a.x,8,a.z+s*56.3,s>0?0:Math.PI,Math.min(40,TW*.4),2.4,'#ffffff','#1b3a6b');
  // jet bridges and parked planes at the gates
  const gates=[-TW*.3,0,TW*.3];for(const gx of gates){const jb=new THREE.BoxGeometry(2.6,2.6,12);jb.translate(a.x+gx,4,a.z+s*34);addStatic(jb,M.concrete);const rot=new THREE.CylinderGeometry(2,2,3.2,10);rot.translate(a.x+gx,3.4,a.z+s*28);addStatic(rot,M.concrete);box(.6,3,.6,a.x+gx,1.5,a.z+s*28,M.steel);}
  for(const gx of gates.slice(0,2)){const pp=buildPlane();pp.position.set(a.x+gx+TW*.15,2.6,a.z+s*24);pp.rotation.y=s>0?Math.PI:0;scene.add(pp);}
  // control tower and hangar
  const tx=a.x+TW/2+22,tz=a.z+s*44;{const g=new THREE.CylinderGeometry(1.8,2.4,28,10);g.translate(tx,14,tz);addStatic(g,M.concrete);const cab=new THREE.CylinderGeometry(4.6,3.8,3.4,8);cab.translate(tx,29.6,tz);addStatic(cab,M.glassBox);const rf=new THREE.CylinderGeometry(5,5,.6,8);rf.translate(tx,31.6,tz);addStatic(rf,M.white);box(.2,4,.2,tx,34,tz,M.steel);}
  addCol(tx,tz,3,3);const hx=a.x-TW/2-34,hz=a.z+s*40;box(34,9,24,hx,4.5,hz,M.roofTin);curvedRoof(34,12,hx,9,hz,M.roofTin,.35);box(24,8,.3,hx,4,hz-s*12.2,M.dark);addCol(hx,hz,17,12);
  addCol(a.x,a.z+s*48,TW/2,8);
  if(look.solar){const sol=LMat('#1f3a6b');for(let r=0;r<6;r++)for(let k=0;k<10;k++){const g=new THREE.BoxGeometry(9,.2,3.2);g.rotateX(-.4*s);g.translate(a.x-a.L/2+20+k*11,1,a.z-s*(32+r*6));addStatic(g,sol,false,true);}addSign('SOLAR POWERED AIRPORT',a.x-a.L/2+70,3,a.z-s*70,s>0?Math.PI:0,20,2,'#ffffff','#1f6f4a');}
  if(look.garden){for(let k=0;k<26;k++)tree(a.x-TW/2+k*(TW/25),a.z+s*(70+(k%3)*4),1.1,M.treeDark);box(TW,.1,10,a.x,.06,a.z+s*72,M.grass,false,true);}
  const pl=buildPlane();pl.position.set(a.x-30,2.6,a.z+s*34);pl.rotation.y=Math.PI/2;scene.add(pl);const fly=buildPlane();fly.visible=false;scene.add(fly);airportPlanes.push({a,fly,t:-1,next:MR(10,40)});
  lmPois.push({type:'airport',name:a.name,x:a.x,z:a.z+s*64,rot:s>0?0:Math.PI,extra:a.id});}

/* hills, dunes, forests */
function freeSpot(x,z,r){return !roadAt(x,z,r)&&!isWater(x,z)&&!zoneAt(x,z,r)&&!colliders.slice(-1).length||(!roadAt(x,z,r)&&!isWater(x,z)&&!zoneAt(x,z,r));}
const hillMats=[LMat('#6f7f45'),LMat('#7d8a4c'),LMat('#8a7a5a'),LMat('#5f7340')];
const HILLS_TRY=[];window.__HILLS=HILLS_TRY;
// A hill only goes where its whole base is clear: no road within its radius, no city, airport, famous place or water under it.
function hillClear(x,z,rad){if(zoneAt(x,z,rad+30)||isWater(x,z))return false;
  for(const e of EDGES){const m=e.w/2+rad*.95+8;if(Math.min(e.ax,e.bx)-m>x||Math.max(e.ax,e.bx)+m<x||Math.min(e.az,e.bz)-m>z||Math.max(e.az,e.bz)+m<z)continue;if(segD(x,z,e.ax,e.az,e.bx,e.bz)<m)return false;}
  for(const a of W.airports)if(Math.hypot(x-a.x,z-a.z)<a.L/2+rad+60)return false;
  for(const pl of W.places)if(Math.hypot(x-pl[1],z-pl[2])<rad+50)return false;
  let wet=0;for(let i=0;i<8;i++){const an=i*.785;if(isWater(x+Math.cos(an)*rad*.85,z+Math.sin(an)*rad*.85))wet++;}return wet<2;}
for(const h of W.hills){for(let i=0;i<h.n;i++){const a=rnd()*6.283,rr=Math.sqrt(rnd());const x=h.x+Math.cos(a)*h.rx*rr,z=h.z+Math.sin(a)*h.rz*rr;const H=R(h.h[0],h.h[1]),rad=H*R(1.2,1.8);
  HILLS_TRY.push({x,z,rad,H,ok:hillClear(x,z,rad)});if(!HILLS_TRY[HILLS_TRY.length-1].ok)continue;const g=new THREE.ConeGeometry(rad,H,7,1);g.translate(x,H/2-.5,z);
  lmCollect=[];addStatic(g,pick(hillMats));const l=lmCollect;lmCollect=null;flushFar(l,x,z);addCol(x,z,rad*.55,rad*.55);}}
const duneMat=LMat('#d9b676');
for(const d of W.dunes){for(let i=0;i<d.n;i++){const a=rnd()*6.283,rr=Math.sqrt(rnd());const x=d.x+Math.cos(a)*d.rx*rr,z=d.z+Math.sin(a)*d.rz*rr;const s=R(8,22);if(roadAt(x,z,s+4)||zoneAt(x,z,s))continue;
  const g=new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2);g.scale(s*R(1.4,2.4),s*R(.25,.45),s);g.rotateY(R(0,3));g.translate(x,-.2,z);addStatic(g,duneMat,false,true);}}
for(const f of W.forests){const mat=f.kind==='dry'?M.treeDry:M.treeDark;for(let i=0;i<f.n;i++){const a=rnd()*6.283,rr=Math.sqrt(rnd());const x=f.x+Math.cos(a)*f.rx*rr,z=f.z+Math.sin(a)*f.rz*rr;if(roadAt(x,z,3)||zoneAt(x,z)||isWater(x,z))continue;tree(x,z,R(.8,1.4),mat);}}
for(const g of W.palms||[]){for(let i=0;i<g.n;i++){const a=rnd()*6.283,rr=Math.sqrt(rnd());const x=g.x+Math.cos(a)*g.rx*rr,z=g.z+Math.sin(a)*g.rz*rr;if(isWater(x,z)||roadAt(x,z,4)||zoneAt(x,z,6))continue;palm(x,z);}}
for(let i=0,nT=Math.round(2600*W.H/11000);i<nT;i++){const x=R(50,W.W-50),z=R(50,W.H-50);if(isWater(x,z)||roadAt(x,z,4)||zoneAt(x,z,10))continue;let skip=false;for(const b of W.biomes)if((b.kind==='desert'||b.kind==='rann')&&inE(b,x,z)<1){skip=rnd()<.85;break;}if(skip)continue;tree(x,z,R(.7,1.2));}
for(let i=0;i<14;i++){const bx=R(2350,2470),bz=R(8150,8900),ry=R(0,3);if(isLand(bx,bz))continue;const g=new THREE.BoxGeometry(2.2,1,7);g.rotateY(ry);g.translate(bx,-0.3,bz);addStatic(g,i%2?M.boat:M.boat2);(window.IB_BOATS=window.IB_BOATS||[]).push({x:bx,z:bz,ry,kind:'fish',y:.2});const c=new THREE.BoxGeometry(1.6,1.2,2);c.rotateY(ry);c.translate(bx,0.6,bz);addStatic(c,M.cream);}

/* highway stops: pump, dhaba and toilet every ~1.7 km */
const hwStops=[];
for(const r of ROADS){if(r.kind!=='hw'&&r.kind!=='exp')continue;let acc=0;const total=r.edges.reduce((a,e)=>a+e.len,0);if(total<1300)continue;let next=650;
  for(const e of r.edges){while(next<acc+e.len){const t=next-acc;const x=e.ax+e.dx*t,z=e.az+e.dz*t;const nx=e.dz,nz=-e.dx;const sx=x+nx*(e.w/2+12),sz=z+nz*(e.w/2+12);
      if(!isWater(sx,sz)&&!zoneAt(sx,sz,30)){const ang=Math.atan2(e.dx,e.dz);boxRot(22,.25,16,sx,.12,sz,ang,M.pave,false,true);boxRot(14,.5,8,sx,5.2,sz-0,ang,M.canopy);
        for(const k of [-4,4]){const g=new THREE.BoxGeometry(.6,4.8,.6);g.rotateY(ang);g.translate(sx+e.dx*k,2.6,sz+e.dz*k);addStatic(g,M.pole);}
        const hx=sx+nx*9,hz=sz+nz*9;boxRot(12,4,7,hx,2,hz,ang,M.kiosk);boxRot(13,.4,8,hx,4.2,hz,ang,M.awn[0]);addCol(hx,hz,5,5);
        const px=x+nx*(e.w/2+3),pz=z+nz*(e.w/2+3);hwStops.push({x:px,z:pz,rot:ang,road:r.name});
        lmPois.push({type:'pump',name:'Highway fuel',x:px,z:pz,rot:ang,drive:true},{type:'food',name:'Highway dhaba',x:px+e.dx*9,z:pz+e.dz*9,rot:ang,extra:'HW'},{type:'lodge',name:'Highway motel',x:px-e.dx*9,z:pz-e.dz*9,rot:ang});}
      next+=1700;}acc+=e.len;}}
