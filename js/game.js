(async function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div id="err">The 3D engine could not load. Check your connection and reload.</div>');return;}
const W=window.WORLD,LM=window.LANDMARKS;
// Beta v2.00.00: the map reaches north of the old top edge (Delhi, Punjab, the Himalaya), so z can be negative down to W.Z0
const Z0=W.Z0||0;
try{await Promise.race([document.fonts.load('800 48px "Baloo 2"'),new Promise(r=>setTimeout(r,1500))]);}catch(e){}
const VERSION='Beta v2.05.00';

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
/* Beta v1.01.30: graphics levels, so phones stay cool. Phones start on "Battery saver": 30 frames a second, a sharp but
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
const M={kerb:LMat('#b9b2a2'),zebra:new THREE.MeshLambertMaterial({map:zebraTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),ground:LMat('#8c8676'),pave:LMat('#bdb4a4'),earth:LMat('#b8a58a'),road:LMat('#ffffff',{map:roadTex,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-8}),hw:LMat('#ffffff',{map:hwTex,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-8}),asphalt:LMat('#3a3b41'),grass:LMat('#5f9a45'),dirt:LMat('#c9a26b'),sand:LMat('#e2cf9f'),wall:LMat('#9c958a'),concrete:LMat('#aaa59b'),
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
  kerala:{cols:['#f4f1ea','#efe8da','#f2d7a7','#cfe3c8','#e9c9a0','#d7e6ef'],h:[5,11],old:true,lots:3,cottage:true},
  // Beta v2.00.00: the north and the east
  pahadi:{cols:['#d9c3a0','#c9b08a','#e6d2b0','#b99c78','#efe3c8'],h:[5,10],old:true,lots:2,cottage:true},
  ladakh:{cols:['#f3efe6','#efe7d8','#e8dcc6','#f6f2ea'],h:[4,8],old:true,lots:3},
  kashmir:{cols:['#c9a27a','#b88d66','#d8bb93','#a87d58','#e0cfb0'],h:[6,12],old:true,lots:2,cottage:true},
  mughal:{cols:['#c9734f','#d98a62','#efe3c8','#e3b48a','#f2d7a7'],h:[6,16],old:true,lots:3,chhatri:.18,dome:.08},
  awadh:{cols:['#efe0c0','#e8cfa0','#d9b98a','#f2e6cf','#e6c79a'],h:[6,15],old:true,lots:3,dome:.12},
  // Beta v2.01.00: the East and the North-East
  kolkata:{cols:['#d9a07a','#e8c98f','#c9d6c0','#f0e2c4','#c98a6a','#e6d3b3','#b9c9d9'],h:[8,26],old:true,lots:3,tower:.03},
  bihar:{cols:['#efe3c8','#e9d6bd','#f2c6a0','#d9c7a8','#e3b48a','#cfd8d6'],h:[6,16],old:true,lots:3},
  assam:{cols:['#f4f1ea','#e6d8be','#cfe3c8','#d7e6ef','#f2d7a7'],h:[4,10],old:true,lots:3,cottage:true},
  nehill:{cols:['#e8c070','#a9cfe8','#f2b8a2','#bfe0cf','#f4f1ea','#d9cfe0','#e98b7f'],h:[6,14],old:true,lots:2,cottage:true}};

/* ================= static batching in chunks ================= */
const CH=400;const chunks=new Map();const farGroups=[];let lmCollect=null;
function chunkOf(x,z){const k=Math.floor(x/CH)+','+Math.floor(z/CH);let c=chunks.get(k);if(!c){c={k,cx:(Math.floor(x/CH)+.5)*CH,cz:(Math.floor(z/CH)+.5)*CH,group:new THREE.Group(),pend:new Map()};scene.add(c.group);chunks.set(k,c);}return c;}
function addStatic(g,mat,cast=true,receive=true){if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;const x=(b.min.x+b.max.x)/2,z=(b.min.z+b.max.z)/2;
  if(lmCollect){lmCollect.push([g,mat,cast,receive]);return;}const c=chunkOf(x,z);const key=mat.uuid+(cast?1:0)+(receive?1:0);let p=c.pend.get(key);if(!p){p={mat,geoms:[],cast,receive};c.pend.set(key,p);}p.geoms.push(g);}
function merge(geoms){let vc=0,ic=0;for(const g of geoms){vc+=g.attributes.position.count;ic+=g.index?g.index.count:g.attributes.position.count;}
  const pos=new Float32Array(vc*3),nor=new Float32Array(vc*3),uv=new Float32Array(vc*2),idx=new Uint32Array(ic),hasC=!!geoms[0].attributes.color,col=hasC?new Uint8Array(vc*3):null;let vo=0,io=0;
  for(const g of geoms){const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;pos.set(p.array,vo*3);if(n)nor.set(n.array,vo*3);if(u)uv.set(u.array,vo*2);if(hasC)col.set(g.attributes.color.array,vo*3);if(g.index){const a=g.index.array;for(let i=0;i<a.length;i++)idx[io++]=a[i]+vo;}else{for(let i=0;i<p.count;i++)idx[io++]=vo+i;}vo+=p.count;g.dispose();}
  const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.BufferAttribute(pos,3));o.setAttribute('normal',new THREE.BufferAttribute(nor,3));o.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(hasC)o.setAttribute('color',new THREE.BufferAttribute(col,3,true));o.setIndex(new THREE.BufferAttribute(idx,1));o.computeBoundingSphere();return o;}
// Beta v1.01.30: the merged city and landscape geometry never changes, so once it is on the graphics card the copy in
// memory is let go (about a third less memory, which matters on phones). Its bounds are worked out first.
function lean(g){g.computeBoundingBox();if(!g.boundingSphere)g.computeBoundingSphere();const free=function(){this.array=null;};for(const k in g.attributes)g.attributes[k].onUpload(free);if(g.index)g.index.onUpload(free);return g;}
// Beta v2.00.00: the merged geometry is stored small: positions as 16-bit numbers inside a box per chunk (the mesh is
// moved and scaled back), normals as 8-bit, no texture coordinates where the material has no texture, and 16-bit
// indices where they fit. About half the memory of the city and landscape meshes, on the phone and on the graphics card.
function packFrame(list){let x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9;for(const g of list){if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;if(b.min.x<x0)x0=b.min.x;if(b.min.y<y0)y0=b.min.y;if(b.min.z<z0)z0=b.min.z;if(b.max.x>x1)x1=b.max.x;if(b.max.y>y1)y1=b.max.y;if(b.max.z>z1)z1=b.max.z;}
  // heights use one fixed 5 mm step everywhere (so flat things at the same height match exactly in every chunk: no flicker)
  const f={cx:(x0+x1)/2,cy:0,cz:(z0+z1)/2,sx:Math.max(4,(x1-x0)/2*1.001),sy:32767/200,sz:Math.max(4,(z1-z0)/2*1.001)};f.ok=f.sx<1600&&f.sz<1600&&y0>-160&&y1<160;return f;}
const hasTex=m=>!!(m&&(m.map||m.alphaMap||m.emissiveMap||m.lightMap||m.bumpMap||m.normalMap||m.specularMap||m.aoMap));
function packMesh(geoms,mat,f){const g=merge(geoms);if(!f.ok)return new THREE.Mesh(lean(g),mat);
  const pa=g.attributes.position.array,na=g.attributes.normal.array,n=pa.length/3;const q=new Int16Array(n*3),qn=new Int8Array(n*3);const ix=32767/f.sx,iy=32767/f.sy,iz=32767/f.sz;
  for(let i=0,k=0;i<n;i++,k+=3){q[k]=Math.round((pa[k]-f.cx)*ix);q[k+1]=Math.round((pa[k+1]-f.cy)*iy);q[k+2]=Math.round((pa[k+2]-f.cz)*iz);
    // the normal in the scaled box: multiply by the scale, the shader divides it out again
    let a=na[k]*f.sx,b=na[k+1]*f.sy,c=na[k+2]*f.sz;const L=Math.hypot(a,b,c)||1;qn[k]=Math.round(a/L*127);qn[k+1]=Math.round(b/L*127);qn[k+2]=Math.round(c/L*127);}
  const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.BufferAttribute(q,3,true));o.setAttribute('normal',new THREE.BufferAttribute(qn,3,true));if(hasTex(mat))o.setAttribute('uv',g.attributes.uv);if(g.attributes.color)o.setAttribute('color',g.attributes.color);
  const ia=g.index.array;o.setIndex(new THREE.BufferAttribute(n<65536?Uint16Array.from(ia):ia,1));g.dispose();
  o.boundingBox=new THREE.Box3(new THREE.Vector3(-1,-1,-1),new THREE.Vector3(1,1,1));o.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1.7321);
  const free=function(){this.array=null;};for(const k in o.attributes)o.attributes[k].onUpload(free);o.index.onUpload(free);
  const m=new THREE.Mesh(o,mat);m.position.set(f.cx,f.cy,f.cz);m.scale.set(f.sx,f.sy,f.sz);return m;}
// Beta v2.01.00: plain single-colour materials in a chunk are merged into one mesh with the colour stored per point
// (vertex colours). A chunk used to hold a mesh for every colour; with the whole country that was over 50,000 meshes
// and about 100 MB just for the mesh objects. Materials the game changes later (the street lamp glow) are left as they are.
let VCM=null,MKEEP=null;
function plainMat(m){if(!MKEEP){MKEEP=new Set([M.lamp]);VCM=new THREE.MeshLambertMaterial({vertexColors:true});}
  return !!m&&m.type==='MeshLambertMaterial'&&!hasTex(m)&&!m.transparent&&!m.vertexColors&&m.side===THREE.FrontSide&&m.opacity===1&&(!m.emissive||m.emissive.getHex()===0)&&!MKEEP.has(m)&&!(m.userData&&m.userData.keep);}
function tint(g,col){const n=g.attributes.position.count,a=new Uint8Array(n*3),r=Math.round(col.r*255),gg=Math.round(col.g*255),b=Math.round(col.b*255);for(let i=0;i<n*3;i+=3){a[i]=r;a[i+1]=gg;a[i+2]=b;}g.setAttribute('color',new THREE.BufferAttribute(a,3,true));}
function batchBy(entries){const out=new Map();for(const e of entries){const plain=plainMat(e.mat);const k=plain?'vc'+(e.cast?1:0)+(e.receive?1:0):e.mat.uuid+(e.cast?1:0)+(e.receive?1:0);let p=out.get(k);if(!p){p={mat:plain?VCM:e.mat,geoms:[],cast:e.cast,receive:e.receive};out.set(k,p);}
  for(const g of e.geoms){if(plain)tint(g,e.mat.color);else if(g.attributes.color)g.deleteAttribute('color');p.geoms.push(g);}}return out.values();}
function flushStatic(){for(const c of chunks.values()){const all=[];for(const p of c.pend.values())all.push(...p.geoms);const f=all.length?packFrame(all):null;for(const p of batchBy(c.pend.values())){if(!p.geoms.length)continue;const m=packMesh(p.geoms,p.mat,f);m.castShadow=p.cast;m.receiveShadow=p.receive;m.matrixAutoUpdate=false;m.updateMatrix();c.group.add(m);}c.pend.clear();}}
function flushFar(list,x,z){const by=new Map();for(const [g,mat,cast,recv] of list){const k=mat.uuid+(cast?1:0);let p=by.get(k);if(!p){p={mat,geoms:[],cast,receive:recv};by.set(k,p);}p.geoms.push(g);}
  const grp=new THREE.Group();const f=packFrame(list.map(a=>a[0]));for(const p of batchBy(by.values())){const m=packMesh(p.geoms,p.mat,f);m.castShadow=p.cast;m.receiveShadow=p.receive;m.matrixAutoUpdate=false;m.updateMatrix();grp.add(m);}scene.add(grp);farGroups.push({group:grp,x,z});}
function updChunks(px,pz){const r=scene.fog.far+120,rf=Math.min(2600,scene.fog.far*2.6+300);for(const c of chunks.values()){c.group.visible=Math.abs(c.cx-px)<r+CH/2&&Math.abs(c.cz-pz)<r+CH/2;}for(const f of farGroups){f.group.visible=Math.hypot(f.x-px,f.z-pz)<rf;}}
function box(w,h,d,x,y,z,mat,cast,recv){const g=BoxG(w,h,d);g.translate(x,y,z);addStatic(g,mat,cast!==false,recv!==false);return g;}
function boxRot(w,h,d,x,y,z,ry,mat,cast,recv){const g=BoxG(w,h,d);g.rotateY(ry);g.translate(x,y,z);addStatic(g,mat,cast!==false,recv!==false);return g;}


/* Beta v2.00.00: the static world is built from copies of a few template shapes (a box, a tree trunk and crown):
   copying typed arrays is much quicker than building each shape point by point, and the map is twice the size now */
const _UB=new THREE.BoxGeometry(1,1,1),_UBP=_UB.attributes.position.array,_UBN=_UB.attributes.normal.array,_UBU=_UB.attributes.uv.array,_UBI=_UB.index.array;
function BoxG(w,h,d,a,b,c){if(a||b||c)return new THREE.BoxGeometry(w,h,d,a,b,c);const p=new Float32Array(72);for(let i=0;i<72;i+=3){p[i]=_UBP[i]*w;p[i+1]=_UBP[i+1]*h;p[i+2]=_UBP[i+2]*d;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(_UBN.slice(),3));g.setAttribute('uv',new THREE.BufferAttribute(_UBU.slice(),2));g.setIndex(new THREE.BufferAttribute(_UBI.slice(),1));g.parameters={width:w,height:h,depth:d};return g;}
function tplCopy(t,sx,sy,sz){const P=t.attributes.position.array,n=P.length,p=new Float32Array(n);for(let i=0;i<n;i+=3){p[i]=P[i]*sx;p[i+1]=P[i+1]*sy;p[i+2]=P[i+2]*sz;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
  g.setAttribute('normal',new THREE.BufferAttribute(t.attributes.normal.array.slice(),3));if(t.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(t.attributes.uv.array.slice(),2));if(t.index)g.setIndex(new THREE.BufferAttribute(t.index.array.slice(),1));return g;}
const _TRK=new THREE.CylinderGeometry(.25,.35,3,5),_CRN=new THREE.IcosahedronGeometry(2.4,0);
/* ================= land, water, roads ================= */
function pip(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const xi=p[i][0],zi=p[i][1],xj=p[j][0],zj=p[j][1];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))c=!c;}return c;}
const LG=20,LGW=Math.ceil(W.W/LG)+1,LGH=Math.ceil((W.H-Z0)/LG)+1;const landGrid=new Uint8Array(LGW*LGH);
// Beta v2.00.00: filled row by row (where each row crosses the outline) instead of a point-in-polygon test per cell.
// W.foreign: land across the border (Pakistan, China, Nepal). It is drawn as land but you cannot go there (value 3).
function fillPoly(P,val,keep){for(let j=0;j<LGH;j++){const z=Z0+j*LG;const xs=[];for(let a=0,b=P.length-1;a<P.length;b=a++){const za=P[a][1],zb=P[b][1];if((za>z)!==(zb>z))xs.push((P[b][0]-P[a][0])*(z-za)/(zb-za)+P[a][0]);}if(!xs.length)continue;xs.sort((p,q)=>p-q);
  for(let k=0;k+1<xs.length;k+=2){const i0=Math.max(0,Math.ceil(xs[k]/LG)),i1=Math.min(LGW-1,Math.ceil(xs[k+1]/LG)-1);for(let i=i0;i<=i1;i++){const o=j*LGW+i;if(!keep||!landGrid[o])landGrid[o]=val;}}}}
fillPoly(W.land,1,false);for(const P of W.foreign||[])fillPoly(P,3,true);
for(const is of W.islands)for(let j=Math.floor((is.z-is.r-Z0)/LG);j<=Math.ceil((is.z+is.r-Z0)/LG);j++)for(let i=Math.floor((is.x-is.r)/LG);i<=Math.ceil((is.x+is.r)/LG);i++){if(Math.hypot(i*LG-is.x,Z0+j*LG-is.z)<=is.r&&i>=0&&j>=0&&i<LGW&&j<LGH)landGrid[j*LGW+i]=2;}
function isLand(x,z){if(x<0||z<Z0||x>W.W||z>W.H)return false;const v=landGrid[Math.round((z-Z0)/LG)*LGW+Math.round(x/LG)];return v===1||v===2;}
function isForeign(x,z){if(x<0||z<Z0||x>W.W||z>W.H)return false;return landGrid[Math.round((z-Z0)/LG)*LGW+Math.round(x/LG)]===3;}
function onIsland(x,z){for(const is of W.islands)if(Math.hypot(x-is.x,z-is.z)<is.r)return true;return false;}
function segD(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz;let t=l2?((px-ax)*dx+(pz-az)*dz)/l2:0;t=clamp(t,0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const LKG=new Map();for(const l of W.lakes)for(let i=Math.floor((l.x-l.rx)/100);i<=Math.floor((l.x+l.rx)/100);i++)for(let j=Math.floor((l.z-l.rz)/100);j<=Math.floor((l.z+l.rz)/100);j++){const key=i*8192+j;let a=LKG.get(key);if(!a)LKG.set(key,a=[]);a.push(l);}
function inLake(x,z){const ls=LKG.get(Math.floor(x/100)*8192+Math.floor(z/100));if(!ls)return null;for(const l of ls){const dx=(x-l.x)/l.rx,dz=(z-l.z)/l.rz;if(dx*dx+dz*dz<1&&!onIsland(x,z))return l;}return null;}
// Beta v1.01.30: a bounding box per polyline (cached by its points array) so the many "is it near this road or river?"
// checks during the world build skip the far ones straight away
const PBOX=new WeakMap();function pbox(P){let b=PBOX.get(P);if(!b){b=[1e9,1e9,-1e9,-1e9];for(const p of P){if(p[0]<b[0])b[0]=p[0];if(p[1]<b[1])b[1]=p[1];if(p[0]>b[2])b[2]=p[0];if(p[1]>b[3])b[3]=p[1];}PBOX.set(P,b);}return b;}
const outBox=(P,x,z,m)=>{const b=pbox(P);return x<b[0]-m||x>b[2]+m||z<b[1]-m||z>b[3]+m;};
// Beta v2.00.00: river pieces and lakes are found through a 100 m grid instead of testing every river and lake
const RVG=100,rvGrid=new Map();for(const r of W.rivers){const p=r.pts;for(let k=0;k<p.length-1;k++){const m=r.w/2+2,x0=Math.min(p[k][0],p[k+1][0])-m,x1=Math.max(p[k][0],p[k+1][0])+m,z0=Math.min(p[k][1],p[k+1][1])-m,z1=Math.max(p[k][1],p[k+1][1])+m;
  for(let i=Math.floor(x0/RVG);i<=Math.floor(x1/RVG);i++)for(let j=Math.floor(z0/RVG);j<=Math.floor(z1/RVG);j++){const key=i*8192+j;let a=rvGrid.get(key);if(!a)rvGrid.set(key,a=[]);a.push(r,k);}}}
function inRiver(x,z){const a=rvGrid.get(Math.floor(x/RVG)*8192+Math.floor(z/RVG));if(!a)return null;for(let n=0;n<a.length;n+=2){const r=a[n],p=r.pts,k=a[n+1];if(segD(x,z,p[k][0],p[k][1],p[k+1][0],p[k+1][1])<r.w/2)return r;}return null;}
// Beta v1.01.23: pools that landmarks draw (a plunge pool under falls, a palace tank) are real water: you swim in them and vehicles stop at the edge
const POOLS=[];function addPool(x,z,rx,rz,rect){POOLS.push({x,z,rx,rz,rect:!!rect});}
function inPool(x,z){for(const q of POOLS){const dx=(x-q.x)/q.rx,dz=(z-q.z)/q.rz;if(q.rect?Math.abs(dx)<1&&Math.abs(dz)<1:dx*dx+dz*dz<1)return q;}return null;}
function isWater(x,z){return (!isLand(x,z)&&!isForeign(x,z))||!!inLake(x,z)||!!inRiver(x,z)||(POOLS.length>0&&!!inPool(x,z));}
const EDGES=[];const RH=50,rHash=new Map();const ROADS=[];
function addRoad(pts,w,kind,name){const r={pts,w,kind,name,edges:[]};ROADS.push(r);for(let k=0;k<pts.length-1;k++){const [ax,az]=pts[k],[bx,bz]=pts[k+1];const len=Math.hypot(bx-ax,bz-az);if(len<1)continue;
    const e={id:EDGES.length,ax,az,bx,bz,len,dx:(bx-ax)/len,dz:(bz-az)/len,w,kind,road:r,k,lane:w>=16?4:w>=12?3.5:1.6};if(kind!=='city'&&kind!=='coast'&&kind!=='service'&&w>=12){e.multi=true;e.laneO=w*.355;e.laneI=w*.135;e.lane=e.laneO;}EDGES.push(e);/* v1.01.22: highways have 2 lanes each way (left slow, right fast) */r.edges.push(e);
    for(let t=0,st=Math.min(RH/4,6),hw2=w/2+1;t<=len+st;t+=st){const tt=Math.min(t,len),x=ax+e.dx*tt,z=az+e.dz*tt;for(const ox of [-1,0,1])for(const oz of [-1,0,1]){const key=Math.floor((x+ox*hw2)/RH)+','+Math.floor((z+oz*hw2)/RH);/* v1.01.22: samples every 6 m so diagonal roads over water have no gaps */let a=rHash.get(key);if(!a)rHash.set(key,a=[]);if(a[a.length-1]!==e.id&&!a.includes(e.id))a.push(e.id);}}}return r;}
function edgesNear(x,z){return rHash.get(Math.floor(x/RH)+','+Math.floor(z/RH))||[];}
function roadAt(x,z,m=0){for(const id of edgesNear(x,z)){const e=EDGES[id];if(segD(x,z,e.ax,e.az,e.bx,e.bz)<e.w/2+m)return e;}return null;}
function nearestRoadPoint(x,z,maxR=400){let best=null,bd=1e9;for(let r=RH;r<=maxR;r+=RH){for(let ox=-r;ox<=r;ox+=RH)for(let oz=-r;oz<=r;oz+=RH){for(const id of edgesNear(x+ox,z+oz)){const e=EDGES[id];const l2=e.len*e.len;let t=((x-e.ax)*(e.bx-e.ax)+(z-e.az)*(e.bz-e.az))/l2;t=clamp(t,0,1);const px=e.ax+(e.bx-e.ax)*t,pz=e.az+(e.bz-e.az)*t;const d=Math.hypot(px-x,pz-z);if(d<bd){bd=d;best={x:px,z:pz,e,t:t*e.len};}}}if(best)return best;}return best;}
/* Beta v1.01.24: water with a margin, for people: the coast you see is drawn more coarsely than isWater, so keep 5 m off it */
function wetNear(x,z,m=5){return isWater(x,z)||isWater(x+m,z)||isWater(x-m,z)||isWater(x,z+m)||isWater(x,z-m);}
function drivable(x,z){if(POOLS.length&&inPool(x,z))return false;return !!roadAt(x,z,.5)||(!isWater(x,z)&&!isForeign(x,z)&&x>2&&z>Z0+2&&x<W.W-2&&z<W.H-2);}

/* colliders */
const CHS=64,cHash=new Map();const colliders=[];
function addCol(x,z,hw,hd,veh=true,foot=true){const c={x,z,hw,hd,veh,foot};colliders.push(c);for(let i=Math.floor((x-hw)/CHS);i<=Math.floor((x+hw)/CHS);i++)for(let j=Math.floor((z-hd)/CHS);j<=Math.floor((z+hd)/CHS);j++){const k=i+','+j;let a=cHash.get(k);if(!a)cHash.set(k,a=[]);a.push(c);}return c;}
function collide(p,r,foot){let hit=false;const seen=new Set();for(let i=Math.floor((p.x-r)/CHS);i<=Math.floor((p.x+r)/CHS);i++)for(let j=Math.floor((p.z-r)/CHS);j<=Math.floor((p.z+r)/CHS);j++){const a=cHash.get(i+','+j);if(!a)continue;let onRd=null;for(const c of a){if(seen.has(c))continue;seen.add(c);if(foot?!c.foot:!c.veh)continue;if(c.hw>8&&c.hd>8){if(onRd===null){const re=roadAt(p.x,p.z,-.6);onRd=!!re;if(re&&(re.stopB!=null||re.stopA!=null)){const sx=(p.x-re.ax)*re.dx+(p.z-re.az)*re.dz;if((re.stopB!=null&&sx>re.stopB+2)||(re.stopA!=null&&sx<re.stopA-2))onRd=false;}}if(onRd)continue;}/* v1.01.22: roads run through big fort and falls footprints */
    const dx=p.x-c.x,dz=p.z-c.z,ex=c.hw+r,ez=c.hd+r;if(Math.abs(dx)<ex&&Math.abs(dz)<ez){const px=ex-Math.abs(dx),pz=ez-Math.abs(dz);if(px<pz)p.x+=Math.sign(dx||1)*px;else p.z+=Math.sign(dz||1)*pz;hit=true;}}}return hit;}

/* ================= terrain ================= */
function inE(b,x,z){const dx=(x-b.x)/b.rx,dz=(z-b.z)/b.rz;return dx*dx+dz*dz;}
const zoneRects=W.zones.map(z=>({z,x0:z.x0-24,z0:z.z0-24,x1:z.x0+z.nx*80+24,z1:z.z0+z.nz*80+24}));
// Beta v2.00.00: zones are looked up through a 250 m grid (the map has over 450 towns now)
const ZG=250,zGrid=new Map();for(const r of zoneRects)for(let i=Math.floor(r.x0/ZG);i<=Math.floor(r.x1/ZG);i++)for(let j=Math.floor(r.z0/ZG);j<=Math.floor(r.z1/ZG);j++){const k=i*4096+j;let a=zGrid.get(k);if(!a)zGrid.set(k,a=[]);a.push(r);}
function zoneAt(x,z,m=0){if(m>0){const r=zoneAt(x,z,0);if(r)return r;}const i0=Math.floor((x-m)/ZG),i1=Math.floor((x+m)/ZG),j0=Math.floor((z-m)/ZG),j1=Math.floor((z+m)/ZG);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const a=zGrid.get(i*4096+j);if(a)for(const r of a)if(x>r.x0-m&&x<r.x1+m&&z>r.z0-m&&z<r.z1+m)return r.z;}return null;}
const cA=new THREE.Color(),cB2=new THREE.Color();
function biomeColor(x,z,out){const n=hash(Math.floor(x/90)*31.7+Math.floor(z/90)*7.3),n2=hash(Math.floor(x/23)+Math.floor(z/23)*57);
  const fr=isForeign(x,z);if(!fr&&!isLand(x,z)&&!onIsland(x,z))return out.set('#6c7d74');
  let coast=false;if(!fr)for(const [ox,oz] of [[60,0],[-60,0],[0,60],[0,-60]])if(!isLand(x+ox,z+oz)&&!isForeign(x+ox,z+oz)){coast=true;break;}
  if(coast)return out.set('#e2cf9f').offsetHSL(0,0,(n2-.5)*.04);
  for(const b of W.biomes){const e=inE(b,x,z);if(e<1){if(b.kind==='rann')return out.set('#f2f0e8').offsetHSL(0,0,(n2-.5)*.03);if(b.kind==='desert')return out.set(e<.6?'#dcb878':'#cfb07a').offsetHSL((n-.5)*.02,0,(n2-.5)*.05);
      if(b.kind==='forest')return out.set(n<.5?'#5f7d3a':'#6f8a40').offsetHSL(0,0,(n2-.5)*.05);if(b.kind==='ghats')return out.set(n<.5?'#4f7a36':'#5d8a3c').offsetHSL(0,0,(n2-.5)*.06);if(b.kind==='scrub')return out.set('#b8a46a').offsetHSL(0,0,(n2-.5)*.06);
      if(b.kind==='laterite')return out.set(n<.4?'#b0643c':'#8f8a45').offsetHSL(0,0,(n2-.5)*.05);if(b.kind==='coffee')return out.set(n<.5?'#3f6b30':'#4b7a35').offsetHSL(0,0,(n2-.5)*.05);
      if(b.kind==='tea')return out.set(Math.floor(z/14)%2?'#5aa83c':'#4c9433').offsetHSL(0,0,(n2-.5)*.04);if(b.kind==='paddy')return out.set(n<.5?'#8fc24a':'#a6cf55').offsetHSL(0,0,(n2-.5)*.04);
      if(b.kind==='coconut')return out.set(n<.5?'#6f9a3e':'#7ea845').offsetHSL(0,0,(n2-.5)*.04);
      // Beta v2.00.00: the north and the east
      if(b.kind==='snow')return out.set(e<.55?'#f4f6f8':n<.5?'#dfe4ea':'#c9cfd6').offsetHSL(0,0,(n2-.5)*.03);if(b.kind==='colddesert')return out.set(n<.35?'#a88f72':n<.7?'#b59c7c':'#9a8070').offsetHSL((n-.5)*.03,0,(n2-.5)*.05);
      if(b.kind==='alpine')return out.set(n<.5?'#7f9a55':'#90a862').offsetHSL(0,0,(n2-.5)*.05);if(b.kind==='pine')return out.set(n<.5?'#3d5f34':'#466b3a').offsetHSL(0,0,(n2-.5)*.05);
      if(b.kind==='wheat')return out.set(n<.3?'#c9b85a':n<.65?'#a9b84e':'#d2c46a').offsetHSL(0,0,(n2-.5)*.04);if(b.kind==='mustard')return out.set(n<.5?'#d9c23a':'#c9b83f').offsetHSL(0,0,(n2-.5)*.04);
      if(b.kind==='ravine')return out.set(n<.5?'#a8835a':'#96764f').offsetHSL(0,0,(n2-.5)*.07);if(b.kind==='sal')return out.set(n<.5?'#4c7034':'#58803a').offsetHSL(0,0,(n2-.5)*.05);
      if(b.kind==='terai')return out.set(n<.5?'#9cb85a':'#86a64a').offsetHSL(0,0,(n2-.5)*.05);if(b.kind==='orchard')return out.set(Math.floor(x/12)%2?'#6d9440':'#5f8838').offsetHSL(0,0,(n2-.5)*.04);
      if(b.kind==='mangrove')return out.set(n<.5?'#3f6a3c':'#4a7444').offsetHSL(0,0,(n2-.5)*.04);if(b.kind==='mine')return out.set(n<.5?'#5a4a3e':'#6e5a48').offsetHSL(0,0,(n2-.5)*.05);if(b.kind==='deccan')return out.set(n<.4?'#8f8262':n<.7?'#a99a62':'#9aa04e').offsetHSL(0,0,(n2-.5)*.05);}}
  if(fr)return out.set(n<.5?'#b3a684':'#a99c7a').offsetHSL(0,0,(n2-.5)*.04);
  const zz=zoneAt(x,z,10);if(zz)return out.set(zz.style==='gold'||zz.style==='pink'?'#c7ad86':'#9a937f');
  const fields=['#8aa84f','#a8b85a','#c2b46a','#7e9a48','#b39a5c','#9fae55'];return out.set(fields[Math.floor(n*fields.length)]).offsetHSL(0,0,(n2-.5)*.04);}
const TG=40;
// Beta v1.01.30: the ground is cut into 800 m tiles, so only the tiles near you are drawn (it was one mesh of 200,000
// triangles drawn every frame). Each vertex height and colour is the same as before.
{const TT=800,mat=new THREE.MeshLambertMaterial({vertexColors:true});const nTx=Math.ceil(W.W/TT),nTz=Math.ceil((W.H-Z0)/TT);const hgt=(x,z)=>isLand(x,z)||onIsland(x,z)||isForeign(x,z)?0:-4;
  for(let ti=0;ti<nTx;ti++)for(let tj=0;tj<nTz;tj++){const x0=ti*TT,z0=Z0+tj*TT,w=Math.min(TT,W.W-x0),d=Math.min(TT,W.H-z0);const g=new THREE.PlaneGeometry(w,d,Math.max(1,Math.round(w/TG)),Math.max(1,Math.round(d/TG)));g.rotateX(-Math.PI/2);g.translate(w/2,0,d/2);
    const pos=g.attributes.position;const col=new Float32Array(pos.count*3);let anyL=0;for(let i=0;i<pos.count;i++){const x=pos.getX(i)+x0,z=pos.getZ(i)+z0;const hh=hgt(x,z);pos.setY(i,hh);if(hh===0)anyL=1;biomeColor(x,z,cA);col[i*3]=cA.r;col[i*3+1]=cA.g;col[i*3+2]=cA.b;}
    // Beta v2.01.00: tiles that are all open sea are hidden under the sea plane anyway, so they are not built
    if(!anyL){g.dispose();continue;}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
    // normals along the tile edges look across the edge too, so neighbouring tiles shade the same
    const nor=g.attributes.normal;for(let i=0;i<pos.count;i++){const lx=pos.getX(i),lz=pos.getZ(i);if(lx>.1&&lx<w-.1&&lz>.1&&lz<d-.1)continue;const x=lx+x0,z=lz+z0;const sx=hgt(x-TG,z)-hgt(x+TG,z),sz=hgt(x,z-TG)-hgt(x,z+TG);const n=new THREE.Vector3(sx,2*TG,sz).normalize();nor.setXYZ(i,n.x,n.y,n.z);}
    const m=new THREE.Mesh(lean(g),mat);m.position.set(x0,0,z0);m.receiveShadow=true;m.matrixAutoUpdate=false;m.updateMatrix();scene.add(m);}}
// The sea is split into many small triangles so its depth stays exact near the camera (one huge quad can poke through the land).
const outer=new THREE.Mesh(new THREE.PlaneGeometry(W.W*5,(W.H-Z0)*5,120,Math.round(120*(W.H-Z0)/W.W)),GFX.lvl==='saver'?new THREE.MeshLambertMaterial({color:0x3479a0,map:seaTex}):new THREE.MeshPhongMaterial({color:0x2a6f97,map:seaTex,shininess:90,specular:0x99bbdd}));
seaTex.repeat.set(140,180);outer.rotation.x=-Math.PI/2;outer.position.set(W.W/2,-1.1,(W.H+Z0)/2);scene.add(outer);
const edgeLand=new THREE.Mesh(new THREE.PlaneGeometry(W.W*3,W.H*3),LMat('#c7b089'));edgeLand.rotation.x=-Math.PI/2;edgeLand.position.set(W.W/2,-0.12,Z0-W.H*1.5+2);scene.add(edgeLand);
// the land beyond the east edge of the map; Beta v1.01.30: only north of the Bay of Bengal (W.eastSeaZ), the sea stays open below it
const eZ1=W.eastSeaZ||W.H*2.5,eZ0=Z0-W.H*1.5;const edgeE=new THREE.Mesh(new THREE.PlaneGeometry(W.W*2,eZ1-eZ0),LMat('#9fae55'));edgeE.rotation.x=-Math.PI/2;edgeE.position.set(W.W+W.W-2,-0.12,(eZ0+eZ1)/2);scene.add(edgeE);
const waterMat=new THREE.MeshPhongMaterial({color:0x2f78a8,shininess:90,specular:0x88aacc,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});
for(const l of W.lakes){const g=new THREE.CircleGeometry(1,40);g.rotateX(-Math.PI/2);g.scale(l.rx,1,l.rz);g.translate(l.x,.04,l.z);addStatic(g,waterMat,false,true);}
for(const r of W.rivers){const p=r.pts;for(let k=0;k<p.length-1;k++){const [ax,az]=p[k],[bx,bz]=p[k+1];const len=Math.hypot(bx-ax,bz-az),a=Math.atan2(bx-ax,bz-az);const g=new THREE.PlaneGeometry(r.w,len+r.w*.6);g.rotateX(-Math.PI/2);g.rotateY(a);g.translate((ax+bx)/2,.012,(az+bz)/2);addStatic(g,waterMat,false,true);}}
for(const is of W.islands){const g=new THREE.CircleGeometry(is.r,24);g.rotateX(-Math.PI/2);g.translate(is.x,.06,is.z);addStatic(g,M.sand,false,true);}

/* ================= decoration helpers ================= */
function palm(x,z){const h=R(7,9.5),tilt=R(-.15,.15);const tr=new THREE.CylinderGeometry(.22,.38,h,6);tr.translate(0,h/2,0);tr.rotateZ(tilt);tr.translate(x,0,z);addStatic(tr,M.trunk);const tx=x-Math.sin(tilt)*h,ty=Math.cos(tilt)*h;
  for(let k=0;k<7;k++){const l=BoxG(.5,.06,4.2);l.translate(0,0,2);l.rotateX(.45+R(0,.25));l.rotateY(k*Math.PI*2/7+R(0,.4));l.translate(tx,ty,z);addStatic(l,M.leaf);}}
function tree(x,z,s=1,mat){const t=tplCopy(_TRK,s,s,s);t.translate(x,1.5*s,z);addStatic(t,M.trunk);const k=s*R(.85,1.15),f=tplCopy(_CRN,k,k,k);f.translate(x,4*s,z);addStatic(f,mat||M.tree);}
const flags=[];const flagGeo=new THREE.BufferGeometry();flagGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,-1.6,0,3,-.8,0],3));flagGeo.computeVertexNormals();const flagMat=new THREE.MeshLambertMaterial({color:0xff8a1c,side:THREE.DoubleSide});
function addFlag(x,y,z,big){const f=new THREE.Mesh(flagGeo,flagMat);f.position.set(x,y,z);if(big)f.scale.setScalar(2.2);scene.add(f);flags.push(f);box(.08,big?6:3.5,.08,x,y-(big?2.5:1.7),z,M.pole);}
const signTexCache=[];
// the India Bay logo for boards in the world (Beta v1.01.30): drawn when the image has loaded
const LOGO_IMG=new Image();LOGO_IMG.src='assets/logo-board.jpg';const logoWait=[];LOGO_IMG.onload=()=>{for(const f of logoWait.splice(0))try{f();}catch(e){}};
function logoTex(w,h,line){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const t=new THREE.CanvasTexture(c);
  const draw=()=>{const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#123d4c');g.addColorStop(1,'#1d5f73');x.fillStyle=g;x.fillRect(0,0,w,h);const sq=Math.min(h*.92,w*.45);if(LOGO_IMG.complete&&LOGO_IMG.naturalWidth)x.drawImage(LOGO_IMG,(h-sq)/2,(h-sq)/2,sq,sq);
    const tx=(h-sq)/2*2+sq,tw=w-tx-h*.06;if(tw>w*.25){x.fillStyle='#ffc93c';x.textAlign='left';x.textBaseline='middle';let f=Math.round(h*.24);x.font=`900 ${f}px "Baloo 2",sans-serif`;while(x.measureText('INDIA BAY').width>tw&&f>10){f--;x.font=`900 ${f}px "Baloo 2",sans-serif`;}x.fillText('INDIA BAY',tx,h*.38);x.fillStyle='#fff6d8';let f2=Math.round(h*.11);x.font=`700 ${f2}px "Baloo 2",sans-serif`;while(x.measureText(line).width>tw&&f2>8){f2--;x.font=`700 ${f2}px "Baloo 2",sans-serif`;}x.fillText(line,tx,h*.62);}t.needsUpdate=true;};
  draw();if(!(LOGO_IMG.complete&&LOGO_IMG.naturalWidth))logoWait.push(draw);return t;}
function signTex(t,fg,bg,w=512,h=128){return canvasTex(w,h,x=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=fg;x.lineWidth=Math.max(4,h/20);x.strokeRect(h/14,h/14,w-h/7,h-h/7);x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';const L=String(t).split('|').map(q=>q.trim()).filter(Boolean).slice(0,2);if(L.length>1){const fit=(q,sz,wt)=>{x.font=`${wt} ${sz}px "Baloo 2", sans-serif`;while(x.measureText(q).width>w*.8&&sz>8){sz-=2;x.font=`${wt} ${sz}px "Baloo 2", sans-serif`;}return sz;};const f1=fit(L[0],Math.round(h*.34),800);x.fillText(L[0],w/2,h*.4,w*.9);fit(L[1],Math.round(Math.max(Math.min(h*.2,f1*1.05),h*.14)),700);x.fillText(L[1],w/2,h*.71,w*.9);return;}t=L[0]||'';let s=h*.55;x.font=`800 ${s}px "Baloo 2", sans-serif`;while(x.measureText(t).width>w*.86&&s>12){s-=4;x.font=`800 ${s}px "Baloo 2", sans-serif`;}x.fillText(t,w/2,h*.56,w*.9);},false);}
// a text board readable from both sides: the back gets its own copy, so it is never seen mirrored (Beta v1.01.30)
function twoSided(m){const mt=m.material;if(!mt||!mt.map)return m;mt.side=THREE.FrontSide;const b=new THREE.Mesh(m.geometry,mt.clone());b.material.side=THREE.FrontSide;b.rotation.y=Math.PI;b.position.z=-.012;b.userData=m.userData;m.add(b);return m;}
function addSign(text,x,y,z,ry,w,h,fg,bg){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:signTex(text,fg,bg,512,Math.round(512*h/w))}));twoSided(m);m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);return m;}
const clockTex=canvasTex(128,128,x=>{x.fillStyle='#f6f1e3';x.beginPath();x.arc(64,64,60,0,6.29);x.fill();x.strokeStyle='#2a2420';x.lineWidth=6;x.stroke();x.lineWidth=5;x.beginPath();x.moveTo(64,64);x.lineTo(64,24);x.moveTo(64,64);x.lineTo(92,70);x.stroke();},false);

/* ================= city + building generation ================= */
let curZone=null,curStyle=STYLES.metro;
const BLDS=[];/* Beta v1.01.24: every city building, so features can let you walk in */
const BLDH=[];function building(x,z,w,d,h,mat,opts={}){if(!opts.noEnter)BLDS.push({x,z,w,d,h,old:!!opts.old});BLDH.push([x,z,w/2,d/2,h]);const g=BoxG(w,h,d);const uv=g.attributes.uv;
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
  const hwPtNear=(h,x,z,r)=>W.highways.some(o=>o!==h&&!outBox(o.pts,x,z,r)&&(o.pts.some(p=>Math.hypot(p[0]-x,p[1]-z)<r)||o.pts.some((p,i)=>i<o.pts.length-1&&segD(x,z,p[0],p[1],o.pts[i+1][0],o.pts[i+1][1])<r*.6)))||W.zones.some(q=>x>q.x0-r&&x<q.x0+q.nx*80+r&&z>q.z0-r&&z<q.z0+q.nz*80+r)||W.airports.some(a=>a.access.some(p=>Math.hypot(p[0]-x,p[1]-z)<r));
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
// Beta v2.03.00: highways stop at the edge of a town and join its street grid at a junction. Before, a highway could
// run through the blocks at an angle, or alongside the town's outer road a few metres off it, so the roads did not line up.
// Every highway is cut where it enters a town (its rectangle plus 9 m), and each cut end is snapped to the nearest grid
// junction below (snapEnds). Inside the town you drive on the grid streets. Flyovers, bridges and coast roads are kept whole.
{const HM=9;const inTown=(x,z)=>{const a=zGrid.get(Math.floor(x/ZG)*4096+Math.floor(z/ZG));if(a)for(const r of a){const q=r.z;if(x>q.x0-HM&&x<q.x0+q.nx*80+HM&&z>q.z0-HM&&z<q.z0+q.nz*80+HM)return true;}return false;};
  const plen=P=>P.reduce((s,p,i)=>i?s+Math.hypot(p[0]-P[i-1][0],p[1]-P[i-1][1]):0,0);const out=[];
  for(const h of W.highways){if(h.fly||h.kind==='bridge'||h.kind==='coast'){out.push(h);continue;}const P=h.pts;const runs=[];let cur=[],cutS=false,prevIn=inTown(P[0][0],P[0][1]);if(!prevIn)cur.push(P[0]);else cutS=true;let cuts=prevIn?1:0;
    for(let i=0;i<P.length-1;i++){const a2=P[i],b=P[i+1],L=Math.hypot(b[0]-a2[0],b[1]-a2[1]),n=Math.max(1,Math.ceil(L/4));
      for(let t=1;t<=n;t++){const x=a2[0]+(b[0]-a2[0])*t/n,z=a2[1]+(b[1]-a2[1])*t/n;const isIn=inTown(x,z);if(isIn===prevIn)continue;cuts++;
        if(isIn){cur.push([x,z]);runs.push({pts:cur,cs:cutS,ce:true});cur=[];}else{cur=[[x,z]];cutS=true;}prevIn=isIn;}
      if(!prevIn){const l=cur[cur.length-1];if(!l||Math.hypot(l[0]-b[0],l[1]-b[1])>1)cur.push(b);}}
    if(cur.length)runs.push({pts:cur,cs:cutS,ce:false});
    if(!cuts){out.push(h);continue;}
    for(const r of runs){if(r.pts.length<2||plen(r.pts)<30)continue;out.push(Object.assign({},h,{pts:r.pts,_cut:[r.cs,r.ce]}));}}
  W.highways=out;}
// highway ends meet a town at a grid junction, arriving square to the edge (no long shallow overlaps with the grid)
const onOtherHw=(h,x,z)=>W.highways.some(o=>o!==h&&!outBox(o.pts,x,z,14)&&o.pts.some((p,i)=>i<o.pts.length-1&&segD(x,z,p[0],p[1],o.pts[i+1][0],o.pts[i+1][1])<12));
function snapEnds(h){const P=h.pts;for(const end of [0,1]){const k=end?P.length-1:0,nb=end?P.length-2:1;const [x,z]=P[k];if(h._keep&&h._keep[end])continue;let J=null,jd=60,Z=null;
    for(const zn of W.zones){const x1=zn.x0+zn.nx*80,z1=zn.z0+zn.nz*80;if(x<zn.x0-60||x>x1+60||z<zn.z0-60||z>z1+60)continue;const i=clamp(Math.round((x-zn.x0)/80),0,zn.nx),j=clamp(Math.round((z-zn.z0)/80),0,zn.nz);const jx=zn.x0+i*80,jz=zn.z0+j*80,d=Math.hypot(jx-x,jz-z);if(d<jd&&isLand(jx,jz)&&!inLake(jx,jz)&&!inRiver(jx,jz)){jd=d;J=[jx,jz,i,j];Z=zn;}}
    if(!J)continue;P[k]=[J[0],J[1]];const [px,pz]=P[nb];const vx=px-J[0],vz=pz-J[1],vl=Math.hypot(vx,vz);if(vl<45)continue;
    const ns=[];if(J[2]===0)ns.push([-1,0]);if(J[2]===Z.nx)ns.push([1,0]);if(J[3]===0)ns.push([0,-1]);if(J[3]===Z.nz)ns.push([0,1]);if(!ns.length)continue;
    let n=ns[0];for(const q of ns)if(q[0]*vx+q[1]*vz>n[0]*vx+n[1]*vz)n=q;const dot=(n[0]*vx+n[1]*vz)/vl;if(dot<=0||dot>.8)continue;   // only when it comes in at a shallow angle from outside
    const q=[J[0]+n[0]*28,J[1]+n[1]*28];if(end)P.splice(k,0,q);else P.splice(1,0,q);}}
for(const h of W.highways){const P=h.pts,C=h._cut||[];h._keep=[!C[0]&&(onOtherHw(h,P[0][0],P[0][1])||W.highways.some(o=>o!==h&&o.pts.some(p=>Math.hypot(p[0]-P[0][0],p[1]-P[0][1])<40))),!C[1]&&(onOtherHw(h,P[P.length-1][0],P[P.length-1][1])||W.highways.some(o=>o!==h&&o.pts.some(p=>Math.hypot(p[0]-P[P.length-1][0],p[1]-P[P.length-1][1])<40)))];}
const hwLen=h=>h.pts.reduce((s,p,i)=>i?s+Math.hypot(p[0]-h.pts[i-1][0],p[1]-h.pts[i-1][1]):0,0);
for(const h of W.highways)if(!h.fly&&h.kind!=='coast'&&h.kind!=='bridge'&&(hwLen(h)>150||h._cut))snapEnds(h);
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
  pts.forEach((p,i)=>{if(i%6||p.y<2.2)return;const h=p.y-.9;const c=new THREE.CylinderGeometry(.9,1.05,h,10);c.translate(p.x,h/2,p.z);addStatic(c,M.concrete);const cap=BoxG(w*.7,.7,1.6);cap.rotateY(Math.atan2(-p.nz,p.nx));cap.translate(p.x,p.y-1.25,p.z);addStatic(cap,M.concrete);});
  // local ads: flex wraps on some pillars, banners on the outer face of the parapets (registered once SLOTS exist)
  pts.forEach((p,i)=>{if(p.y<6)return;if(i%18===0)FLY_ADS.push({id:`fp:${r.name}:${i}`,x:p.x,y:0,z:p.z,rot:Math.atan2(-p.nz,p.nx)+Math.PI/2,kind:'pillar',road:'flyover',zone:null,bw:1.7,bh:2.4,y0:p.y-3.6,off:1.1});
    if(i%30===15){const sd=(i/30|0)%2?1:-1;FLY_ADS.push({id:`fb:${r.name}:${i}`,x:p.x+p.nx*sd*(w/2+.66),y:0,z:p.z+p.nz*sd*(w/2+.66),rot:Math.atan2(p.nx*sd,p.nz*sd),kind:'parapet',road:'flyover',zone:null,bw:9,bh:1.1,y0:p.y+.35});}});
  pts.forEach((p,i)=>{if(i%8!==4)return;const sd=(i/8|0)%2?1:-1;const lp=new THREE.CylinderGeometry(.1,.12,6,5);lp.translate(p.x+p.nx*sd*(w/2+.3),p.y+3,p.z+p.nz*sd*(w/2+.3));addStatic(lp,M.pole);});}
function roadRibbons(){ROADS.forEach((r,ri)=>{if(r.fly){flyDeck(r);return;}const isCity=r.kind==='city';const mat=isCity||r.kind==='coast'||r.kind==='service'?M.road:M.hw;
  // each highway gets its own small height so two highways that cross never flicker against each other
  const y=isCity?(Math.abs(r.pts[0][0]-r.pts[1][0])<1?.02:.026):r.kind==='bridge'?.08:r.kind==='coast'?.03:.036+(ri%6)*.006;
  for(const e of r.edges){const spans=isCity?[[0,e.len]]:hwSpans(e,ri);for(const [u0,u1] of spans){const seg=Math.ceil((u1-u0)/160);for(let s=0;s<seg;s++){const t0=u0+(u1-u0)*s/seg,t1=u0+(u1-u0)*(s+1)/seg,l=t1-t0+(isCity?0:e.w*.5);const g=new THREE.PlaneGeometry(e.w,l);g.rotateX(-Math.PI/2);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*l/16);g.rotateY(Math.atan2(e.dx,e.dz));
      const mx=e.ax+e.dx*(t0+t1)/2,mz=e.az+e.dz*(t0+t1)/2;g.translate(mx,y,mz);addStatic(g,mat,false,true);
      if(r.kind==='bridge'){const d=BoxG(e.w+1,1.2,l);d.rotateY(Math.atan2(e.dx,e.dz));d.translate(mx,-.55,mz);addStatic(d,M.concrete,false,true);}}}
    if(r.kind!=='bridge')riverBridges(e,y);
    if(isCity)kerbsAndCrossings(e,y);}});}
// City roads run straight across the whole grid, so kerbs and zebra crossings are placed block by block between junctions.
function kerbsAndCrossings(e,y){const zz=zoneAt((e.ax+e.bx)/2,(e.az+e.bz)/2,0);const vert=Math.abs(e.dx)<.01,ang=Math.atan2(e.dx,e.dz);
  if(!zz||!(vert||Math.abs(e.dz)<.01)){return;}const o0=vert?zz.z0:zz.x0,a0=vert?e.az:e.ax,sgn=Math.sign(vert?e.dz:e.dx)||1;const trim=e.w/2+1.4,big=zz.size==='big'||zz.size==='mid';
  const c0=Math.min(a0,a0+sgn*e.len),c1=Math.max(a0,a0+sgn*e.len);
  for(let n=Math.floor((c0-o0)/80);n*80+o0<c1;n++){const g0=o0+n*80,g1=g0+80;const s0=Math.max(g0,c0),s1=Math.min(g1,c1);const k0=s0+(s0===g0?trim:.5),k1=s1-(s1===g1?trim:.5);if(k1-k0<4)continue;
    const mid=(k0+k1)/2,l=k1-k0;const cx=vert?e.ax:mid,cz=vert?mid:e.az;
    for(const sd of [-1,1]){const ox=e.dz*sd*(e.w/2+.15),oz=-e.dx*sd*(e.w/2+.15);let r0=-1;const put=(a,b)=>{if(b-a<1.5)return;const m=(a+b)/2;const k=BoxG(.3,.15,b-a);k.rotateY(ang);k.translate((vert?e.ax:m)+ox,.075,(vert?m:e.az)+oz);addStatic(k,M.kerb,false,true);};
      for(let q=k0;q<=k1+.01;q+=1.5){const qq=Math.min(q,k1);const px=(vert?e.ax:qq)+ox,pz=(vert?qq:e.az)+oz;let blocked=false;for(const id of edgesNear(px,pz)){const f=EDGES[id];if(f===e)continue;if(segD(px,pz,f.ax,f.az,f.bx,f.bz)<f.w/2+.6){blocked=true;break;}}
        if(!blocked&&r0<0)r0=qq;if(blocked&&r0>=0){put(r0,qq-.4);r0=-1;}}if(r0>=0)put(r0,k1);}
    if(big)for(const [edge,at] of [[s0===g0,k0+1.2],[s1===g1,k1-1.2]]){if(!edge)continue;const zx=vert?e.ax:at,zz2=vert?at:e.az;const zg=new THREE.PlaneGeometry(e.w*.86,3);zg.rotateX(-Math.PI/2);zg.rotateY(ang);zg.translate(zx,y+.004,zz2);addStatic(zg,M.zebra,false,true);}}}
// Where a road crosses a river or lake, add a concrete deck with side walls and pillars under it.
function riverBridges(e,y){const st=6;let t0=-1;const ang=Math.atan2(e.dx,e.dz);const span=(a,b)=>{a=Math.max(0,a-10);b=Math.min(e.len,b+10);const l=b-a;if(l<8)return;const mx=e.ax+e.dx*(a+b)/2,mz=e.az+e.dz*(a+b)/2;
    const d=BoxG(e.w+1.4,.9,l);d.rotateY(ang);d.translate(mx,y-.47,mz);addStatic(d,M.concrete,false,true);
    for(const sd of [-1,1]){let r0=-1;const wall=(u0,u1)=>{if(u1-u0<1.5)return;const wl=BoxG(.35,.75,u1-u0);wl.rotateY(ang);const um=(u0+u1)/2;wl.translate(e.ax+e.dx*um+e.dz*sd*(e.w/2+.5),y+.36,e.az+e.dz*um-e.dx*sd*(e.w/2+.5));addStatic(wl,M.concrete,false,true);};
      for(let q=a;q<=b+.01;q+=1.5){const qq=Math.min(q,b);const px=e.ax+e.dx*qq+e.dz*sd*(e.w/2+.5),pz=e.az+e.dz*qq-e.dx*sd*(e.w/2+.5);let open=false;for(const id of edgesNear(px,pz)){const f=EDGES[id];if(f===e||f.road===e.road||f.fly)continue;if(segD(px,pz,f.ax,f.az,f.bx,f.bz)<f.w/2+1.2){open=true;break;}}
        if(!open&&r0<0)r0=qq;if(open&&r0>=0){wall(r0,qq-.6);r0=-1;}}if(r0>=0)wall(r0,b);}
    for(let q=a+8;q<b-4;q+=28){const px=e.ax+e.dx*q,pz=e.az+e.dz*q;const pl=BoxG(e.w*.6,4,1.6);pl.rotateY(ang);pl.translate(px,y-2.8,pz);addStatic(pl,M.concrete,false,true);}};
  for(let t=0;t<=e.len;t+=st){const w=isWater(e.ax+e.dx*t,e.az+e.dz*t);if(w&&t0<0)t0=t;if(!w&&t0>=0){span(t0,t);t0=-1;}}if(t0>=0)span(t0,e.len);}
roadRibbons();
{const disc=new Map();for(const r of ROADS){if(r.fly||r.kind==='city'||r.kind==='service')continue;for(const p of r.pts){const k=Math.round(p[0]/3)+','+Math.round(p[1]/3);const w=r.w/2;if(!disc.has(k)||disc.get(k).w<w)disc.set(k,{x:p[0],z:p[1],w,m:r.kind==='coast'?M.road:M.hw,y:r.kind==='bridge'?.075:.031});}}
  for(const d of disc.values()){if(isWater(d.x,d.z)&&d.y<.07)continue;const g=new THREE.CircleGeometry(d.w,18);g.rotateX(-Math.PI/2);g.translate(d.x,d.y,d.z);addStatic(g,d.m,false,true);}}
for(const z of W.zones)for(let i=0;i<=z.nx;i++)for(let j=0;j<=z.nz;j++){const x=z.x0+i*80,zz=z.z0+j*80;if(!isLand(x,zz)||inLake(x,zz))continue;const p=new THREE.PlaneGeometry(16,16);p.rotateX(-Math.PI/2);p.translate(x,.04,zz);addStatic(p,M.asphalt,false,true);}
function nearHighway(x,z,r){for(const id of edgesNear(x,z)){const e=EDGES[id];if(e.kind==='city')continue;if(segD(x,z,e.ax,e.az,e.bx,e.bz)<e.w/2+r)return true;}for(const [ox,oz] of [[r,0],[-r,0],[0,r],[0,-r]])for(const id of edgesNear(x+ox,z+oz)){const e=EDGES[id];if(e.kind==='city')continue;if(segD(x,z,e.ax,e.az,e.bx,e.bz)<e.w/2+r)return true;}return false;}

/* services are planned before buildings so lots can be reserved */
const pois=[];const blocks=[];const zoneData=new Map();
const SVC_LOT=new Set(['pump','cng','station','bus']);
const GUN_ZONE=new Set();{const by={};for(const z of W.zones){const sc={big:3,mid:2,small:1}[z.size]*1000+z.nx*z.nz+(W.startZones&&W.startZones[z.st]===z.id?500:0);if(!by[z.st]||sc>by[z.st][0])by[z.st]=[sc,z.id];}for(const k in by)GUN_ZONE.add(by[k][1]);for(const z of W.zones)if(z.size==='big'&&!z.island)GUN_ZONE.add(z.id);} // Beta v2.02.00: and one in every big city
for(const z of W.zones){const zd={z,blocks:[],tallRoofs:[],slots:[]};zoneData.set(z.id,zd);
  for(let i=0;i<z.nx;i++)for(let j=0;j<z.nz;j++){const bx=z.x0+i*80+40,bz=z.z0+j*80+40;const sp=z.specials[i+','+j];const land=!isWater(bx,bz)&&!isWater(bx-28,bz-28)&&!isWater(bx+28,bz+28)&&!isWater(bx-28,bz+28)&&!isWater(bx+28,bz-28);
    const b={zone:z,i,j,x:bx,z:bz,sp,land,reserved:new Set(),open:false,hasBld:false};zd.blocks.push(b);blocks.push(b);}
  const free=zd.blocks.filter(b=>b.land&&!b.sp&&!nearHighway(b.x,b.z,8));const r2=mulberry32(z.x0*7+z.z0);const sides=['n','s','e','w'];
  let svc=(W.serviceSets[z.size]||W.serviceSets.small).slice();if(z.station&&!svc.includes('station'))svc.push('station');
  // Beta v2.01.00: every state and union territory has a gun shop (Hathiyar Ghar), in its biggest city, placed early so it always fits
  if(GUN_ZONE.has(z.id)){svc=svc.filter(q=>q!=='guns');svc.splice(3,0,'guns');}
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
  const ex=x+ax*arm,ez=z+az*arm;const a=BoxG(.12,.12,arm);a.rotateY(Math.atan2(ax,az));a.translate(x+ax*arm/2,h-.1,z+az*arm/2);addStatic(a,M.pole,false,false);
  const hd=BoxG(.9,.18,.42);hd.rotateY(Math.atan2(ax,az)+Math.PI/2);hd.translate(ex,h-.22,ez);lampGeoms.push(hd);
  const q=new THREE.PlaneGeometry(pool,pool);q.rotateX(-Math.PI/2);q.translate(ex,.07,ez);addStatic(q,poolMat,false,false);LAMPS.push([ex,ez]);}
{const seen=new Set();const key=(x,z)=>Math.round(x/12)+','+Math.round(z/12);
  for(const e of EDGES){if(e.fly||e.road.fly)continue;const city=e.kind==='city',hw=!city&&e.kind!=='service';const step=city?30:44;const nx=e.dz,nz=-e.dx;
    for(let t=city?14:20;t<e.len-6;t+=step){const side=city?((Math.floor(t/step)+e.id)%2?1:-1):(e.id%2?1:-1);const off=e.w/2+(e.kind==='bridge'?-.5:1.3);
      const x=e.ax+e.dx*t+nx*off*side,z=e.az+e.dz*t+nz*off*side;if(e.kind!=='bridge'&&isWater(x,z))continue;const k=key(x,z);if(seen.has(k))continue;seen.add(k);
      if(roadAt(x,z,-.5)&&e.kind!=='bridge')continue;   // a pole would stand on another road
      streetLamp(x,z,-nx*side,-nz*side,city?7.4:9.5,city?2.6:3.6,city?15:19);}}}
for(const g of lampGeoms)addStatic(g,M.lamp,false,false);   // Beta v1.01.30: lamp heads go into the city chunks (drawn only near you)

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
  add(BoxG(1.7,.38,.9),dark,0,.85,11.2,-.45);                                   // cockpit windscreen
  for(const s of [-1,1]){const w=BoxG(.06,.26,17);w.translate(s*2.22,.55,.4);g.add(new THREE.Mesh(w,dark));    // cabin window row
    for(const zz of [9.2,-9.4]){const d=BoxG(.07,1.3,.7);d.translate(s*2.23,.15,zz);g.add(new THREE.Mesh(d,new THREE.MeshLambertMaterial({color:0xd9dee4})));}
    const st=BoxG(.05,.22,21);st.translate(s*2.24,-.25,0);g.add(new THREE.Mesh(st,stripe));}                    // cheatline
  for(const s of [-1,1]){const wing=BoxG(14,.42,4.6);wing.translate(s*7.6,0,0);const m=add(wing,M.plane,0,-.9,1.4,0,s*.32,s*-.05);m.rotation.order='YXZ';
    const wl=BoxG(.2,1.5,1.2);wl.translate(s*14.6,.6,-1.3);const wlm=new THREE.Mesh(wl,stripe);wlm.rotation.y=s*.32;wlm.position.set(0,-.9,1.4);g.add(wlm);
    const en=new THREE.CylinderGeometry(.95,.8,3.4,14,1,true);en.rotateX(Math.PI/2);add(en,grey,s*6,-1.95,3.4).material.side=THREE.DoubleSide;
    add(new THREE.CylinderGeometry(.75,.75,.1,14).rotateX(Math.PI/2),dark,s*6,-1.95,5);const fan=add(BoxG(1.4,.12,.05),grey,s*6,-1.95,4.95);g.userData.fans=(g.userData.fans||[]).concat(fan);
    add(BoxG(.25,.9,1.2),grey,s*6,-1.2,3.3);                                         // pylon
    const hs=BoxG(5,.3,2.2);hs.translate(s*2.6,0,0);const h=add(hs,M.plane,0,.4,-11,0,s*.35);}
  const fin=BoxG(.4,5.2,3.6);fin.translate(0,2.6,0);add(fin,stripe,0,1.4,-10.6,-.42);                               // tail fin
  add(BoxG(.42,.8,1.2),M.plane,0,5.4,-12.6,-.42);
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
  const cap=BoxG(len+2,.4,r*2+2);cap.translate(x,y-.2,z);addStatic(cap,mat);}
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
  const gates=[-TW*.3,0,TW*.3];for(const gx of gates){const jb=BoxG(2.6,2.6,12);jb.translate(a.x+gx,4,a.z+s*34);addStatic(jb,M.concrete);const rot=new THREE.CylinderGeometry(2,2,3.2,10);rot.translate(a.x+gx,3.4,a.z+s*28);addStatic(rot,M.concrete);box(.6,3,.6,a.x+gx,1.5,a.z+s*28,M.steel);}
  for(const gx of gates.slice(0,2)){const pp=buildPlane();pp.position.set(a.x+gx+TW*.15,2.6,a.z+s*24);pp.rotation.y=s>0?Math.PI:0;scene.add(pp);}
  // control tower and hangar
  const tx=a.x+TW/2+22,tz=a.z+s*44;{const g=new THREE.CylinderGeometry(1.8,2.4,28,10);g.translate(tx,14,tz);addStatic(g,M.concrete);const cab=new THREE.CylinderGeometry(4.6,3.8,3.4,8);cab.translate(tx,29.6,tz);addStatic(cab,M.glassBox);const rf=new THREE.CylinderGeometry(5,5,.6,8);rf.translate(tx,31.6,tz);addStatic(rf,M.white);box(.2,4,.2,tx,34,tz,M.steel);}
  addCol(tx,tz,3,3);const hx=a.x-TW/2-34,hz=a.z+s*40;box(34,9,24,hx,4.5,hz,M.roofTin);curvedRoof(34,12,hx,9,hz,M.roofTin,.35);box(24,8,.3,hx,4,hz-s*12.2,M.dark);addCol(hx,hz,17,12);
  addCol(a.x,a.z+s*48,TW/2,8);
  if(look.solar){const sol=LMat('#1f3a6b');for(let r=0;r<6;r++)for(let k=0;k<10;k++){const g=BoxG(9,.2,3.2);g.rotateX(-.4*s);g.translate(a.x-a.L/2+20+k*11,1,a.z-s*(32+r*6));addStatic(g,sol,false,true);}addSign('SOLAR POWERED AIRPORT',a.x-a.L/2+70,3,a.z-s*70,s>0?Math.PI:0,20,2,'#ffffff','#1f6f4a');}
  if(look.garden){for(let k=0;k<26;k++)tree(a.x-TW/2+k*(TW/25),a.z+s*(70+(k%3)*4),1.1,M.treeDark);box(TW,.1,10,a.x,.06,a.z+s*72,M.grass,false,true);}
  const pl=buildPlane();pl.position.set(a.x-30,2.6,a.z+s*34);pl.rotation.y=Math.PI/2;scene.add(pl);const fly=buildPlane();fly.visible=false;scene.add(fly);airportPlanes.push({a,fly,t:-1,next:MR(10,40)});
  lmPois.push({type:'airport',name:a.name,x:a.x,z:a.z+s*64,rot:s>0?0:Math.PI,extra:a.id});}

/* hills, dunes, forests */
function freeSpot(x,z,r){return !roadAt(x,z,r)&&!isWater(x,z)&&!zoneAt(x,z,r)&&!colliders.slice(-1).length||(!roadAt(x,z,r)&&!isWater(x,z)&&!zoneAt(x,z,r));}
const hillMats=[LMat('#6f7f45'),LMat('#7d8a4c'),LMat('#8a7a5a'),LMat('#5f7340')];
// Beta v2.00.00: Himalayan ranges: kind 'snow' (green-grey slopes with a snow cap), 'rock' (the bare Ladakh and Spiti mountains), 'pine' (dark forested hills)
const HMAT={snow:[LMat('#6b6f5e'),LMat('#5f6b55'),LMat('#77766a')],rock:[LMat('#9a7f66'),LMat('#8a6f60'),LMat('#a58b6e'),LMat('#7d6a5c')],pine:[LMat('#3f5e36'),LMat('#486a3c'),LMat('#3a5532')]},snowMat=LMat('#f3f6f9');
const HILLS_TRY=[];window.__HILLS=HILLS_TRY;
// A hill only goes where its whole base is clear: no road within its radius, no city, airport, famous place or water under it.
function hillClear(x,z,rad){if(zoneAt(x,z,rad+30)||isWater(x,z))return false;
  for(const e of EDGES){const m=e.w/2+rad*.95+8;if(Math.min(e.ax,e.bx)-m>x||Math.max(e.ax,e.bx)+m<x||Math.min(e.az,e.bz)-m>z||Math.max(e.az,e.bz)+m<z)continue;if(segD(x,z,e.ax,e.az,e.bx,e.bz)<m)return false;}
  for(const a of W.airports)if(Math.hypot(x-a.x,z-a.z)<a.L/2+rad+60)return false;
  for(const pl of W.places)if(Math.hypot(x-pl[1],z-pl[2])<rad+50)return false;
  let wet=0;for(let i=0;i<8;i++){const an=i*.785;if(isWater(x+Math.cos(an)*rad*.85,z+Math.sin(an)*rad*.85))wet++;}return wet<2;}
for(const h of W.hills){for(let i=0;i<h.n;i++){const a=rnd()*6.283,rr=Math.sqrt(rnd());const x=h.x+Math.cos(a)*h.rx*rr,z=h.z+Math.sin(a)*h.rz*rr;const H=R(h.h[0],h.h[1]),rad=H*(h.steep?R(h.steep[0],h.steep[1]):R(1.2,1.8));
  HILLS_TRY.push({x,z,rad,H,ok:hillClear(x,z,rad)});if(!HILLS_TRY[HILLS_TRY.length-1].ok)continue;const g=new THREE.ConeGeometry(rad,H,7,1);g.translate(x,H/2-.5,z);
  lmCollect=[];addStatic(g,pick(HMAT[h.kind]||hillMats));if((h.kind==='snow'||h.kind==='rock'&&H>h.h[0]+(h.h[1]-h.h[0])*.5)&&H>60){const cf=h.kind==='snow'?.42:.22;const c=new THREE.ConeGeometry(rad*cf*1.02,H*cf,7,1);c.translate(x,H-H*cf/2-.5+.05,z);addStatic(c,snowMat);}const l=lmCollect;lmCollect=null;flushFar(l,x,z);addCol(x,z,rad*.55,rad*.55);}}
const duneMat=LMat('#d9b676');
for(const d of W.dunes){for(let i=0;i<d.n;i++){const a=rnd()*6.283,rr=Math.sqrt(rnd());const x=d.x+Math.cos(a)*d.rx*rr,z=d.z+Math.sin(a)*d.rz*rr;const s=R(8,22);if(roadAt(x,z,s+4)||zoneAt(x,z,s))continue;
  const g=new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2);g.scale(s*R(1.4,2.4),s*R(.25,.45),s);g.rotateY(R(0,3));g.translate(x,-.2,z);addStatic(g,duneMat,false,true);}}
for(const f of W.forests){const mat=f.kind==='dry'?M.treeDry:M.treeDark;for(let i=0;i<f.n;i++){const a=rnd()*6.283,rr=Math.sqrt(rnd());const x=f.x+Math.cos(a)*f.rx*rr,z=f.z+Math.sin(a)*f.rz*rr;if(roadAt(x,z,3)||zoneAt(x,z)||isWater(x,z))continue;tree(x,z,R(.8,1.4),mat);}}
for(const g of W.palms||[]){for(let i=0;i<g.n;i++){const a=rnd()*6.283,rr=Math.sqrt(rnd());const x=g.x+Math.cos(a)*g.rx*rr,z=g.z+Math.sin(a)*g.rz*rr;if(isWater(x,z)||roadAt(x,z,4)||zoneAt(x,z,6))continue;palm(x,z);}}
for(let i=0,nT=Math.round(2600*(W.H-Z0)/11000);i<nT;i++){const x=R(50,W.W-50),z=R(Z0+50,W.H-50);if(isWater(x,z)||roadAt(x,z,4)||zoneAt(x,z,10))continue;let skip=isForeign(x,z)&&rnd()<.7;if(!skip)for(const b of W.biomes)if((b.kind==='desert'||b.kind==='rann'||b.kind==='colddesert'||b.kind==='snow'||b.kind==='mine')&&inE(b,x,z)<1){skip=rnd()<(b.kind==='desert'||b.kind==='rann'?.85:.97);break;}if(skip)continue;tree(x,z,R(.7,1.2));}
// Beta v2.00.00: the border fence (Pakistan, the LoC and LAC, Nepal): posts every 10 m and two wires
if(W.borderLine){const fm=LMat('#5d6066');for(const P of [W.borderLine].concat(W.borderLines||[]))for(let k=0;k<P.length-1;k++){const [ax,az]=P[k],[bx,bz]=P[k+1];const L=Math.hypot(bx-ax,bz-az);if(L<1)continue;const dx=(bx-ax)/L,dz=(bz-az)/L,ang=Math.atan2(dx,dz);
  for(let t=0;t<L;t+=10){const x=ax+dx*t,z=az+dz*t;box(.16,2.6,.16,x,1.3,z,fm,false,false);}for(let t=0;t<L;t+=120){const l=Math.min(120,L-t),mx=ax+dx*(t+l/2),mz=az+dz*(t+l/2);for(const y of [1.1,2.3])boxRot(.05,.06,l,mx,y,mz,ang,fm,false,false);}}}
for(let i=0;i<14;i++){const bx=R(2350,2470),bz=R(8150,8900),ry=R(0,3);if(isLand(bx,bz))continue;const g=BoxG(2.2,1,7);g.rotateY(ry);g.translate(bx,-0.3,bz);addStatic(g,i%2?M.boat:M.boat2);(window.IB_BOATS=window.IB_BOATS||[]).push({x:bx,z:bz,ry,kind:'fish',y:.2});const c=BoxG(1.6,1.2,2);c.rotateY(ry);c.translate(bx,0.6,bz);addStatic(c,M.cream);}

/* highway stops: pump, dhaba and toilet every ~1.7 km */
const hwStops=[];
for(const r of ROADS){if(r.kind!=='hw'&&r.kind!=='exp')continue;let acc=0;const total=r.edges.reduce((a,e)=>a+e.len,0);if(total<1300)continue;let next=650;
  for(const e of r.edges){while(next<acc+e.len){const t=next-acc;const x=e.ax+e.dx*t,z=e.az+e.dz*t;const nx=e.dz,nz=-e.dx;const sx=x+nx*(e.w/2+12),sz=z+nz*(e.w/2+12);
      if(!isWater(sx,sz)&&!zoneAt(sx,sz,30)){const ang=Math.atan2(e.dx,e.dz);boxRot(22,.25,16,sx,.12,sz,ang,M.pave,false,true);boxRot(14,.5,8,sx,5.2,sz-0,ang,M.canopy);
        for(const k of [-4,4]){const g=BoxG(.6,4.8,.6);g.rotateY(ang);g.translate(sx+e.dx*k,2.6,sz+e.dz*k);addStatic(g,M.pole);}
        const hx=sx+nx*9,hz=sz+nz*9;boxRot(12,4,7,hx,2,hz,ang,M.kiosk);boxRot(13,.4,8,hx,4.2,hz,ang,M.awn[0]);addCol(hx,hz,5,5);
        const px=x+nx*(e.w/2+3),pz=z+nz*(e.w/2+3);hwStops.push({x:px,z:pz,rot:ang,road:r.name});
        lmPois.push({type:'pump',name:'Highway fuel',x:px,z:pz,rot:ang,drive:true},{type:'food',name:'Highway dhaba',x:px+e.dx*9,z:pz+e.dz*9,rot:ang,extra:'HW'},{type:'lodge',name:'Highway motel',x:px-e.dx*9,z:pz-e.dz*9,rot:ang});}
      next+=1700;}acc+=e.len;}}

/* ================= places you can use ================= */
const PCOL={stadium:'#3ddc97',bank:'#3ddc97',food:'#ff9f1c',toilet:'#5fb4ff',pump:'#2fc4b2',cng:'#7fd858',hospital:'#ff6b6b',police:'#5f8bff',rto:'#c9a227',jobs:'#ffb347',cars:'#c38bff',bikes:'#ff8fd0',clothes:'#ff6fa8',furniture:'#d8a46a',mobile:'#6fc3ff',guns:'#ff5d73',realty:'#ffc93c',mechanic:'#9aa5b1',station:'#e07b39',bus:'#e85d5d',lodge:'#b38bff',home:'#ffe08a',airport:'#7ad0ff',local:'#ff9a3c',ferry:'#4fb3ff',safari:'#9bd36a',camel:'#e3b26a',cricket:'#3ddc97',mall:'#ff6fa8',metro:'#c38bff',bullet:'#1b4f9c',gig:'#e0a030',helipad:'#ffd36a',activity:'#3fd0c9',zoo:'#7cc96a'};
const PICON={heritage:'📜',stadium:'⚽',bank:'🏦',food:'🍛',toilet:'🚻',pump:'⛽',cng:'🟢',hospital:'🏥',police:'🚓',rto:'🪪',jobs:'💼',cars:'🚗',bikes:'🏍',clothes:'👕',furniture:'🛋',mobile:'📱',guns:'🔫',realty:'🏘',mechanic:'🔧',station:'🚆',bus:'🚌',lodge:'🛏',home:'🏡',airport:'✈',local:'🚉',ferry:'⛴',safari:'🦁',camel:'🐪',cricket:'🏏',mall:'🛍',metro:'Ⓜ',bullet:'🚄',gig:'🛠',helipad:'🚁',activity:'🪂',zoo:'🦒'};
const PLABEL={stadium:'Football stadium',bank:'Bank and ATM',food:'Food and chai',toilet:'Public toilet',pump:'Petrol and diesel',cng:'CNG pump',hospital:'Hospital',police:'Police station',rto:'RTO (licences)',jobs:'Job agent',cars:'Car showroom',bikes:'Two-wheeler dealer',clothes:'Clothes shop',furniture:'Furniture',mobile:'Mobile shop',guns:'Gun shop',realty:'Homes for sale',mechanic:'Mechanic',station:'Railway station',bus:'Bus stand',lodge:'Lodge to sleep',home:'Home',airport:'Airport',local:'Mumbai local',ferry:'Ferry',safari:'Lion safari',camel:'Camel ride',cricket:'Cricket stadium',mall:'Shopping mall',metro:'Metro station',bullet:'Bullet train station',gig:'Local work',helipad:'Helipad',activity:'Adventure activity',zoo:'Zoo'};
const VALUE={cycle:4000,rickshaw:15000,bike:65000,sportsbike:180000,auto:12000,car:45000,sedan:85000,suv:120000,sports:250000,taxi:40000};
const PNAME={bank:'Bharat Bay Bank',toilet:'Public toilet',pump:'Petrol pump',cng:'CNG pump',hospital:'Hospital',police:'Police station',rto:'RTO office',jobs:'Rozgar job agent',cars:'Bay Motors',bikes:'Do-Pahiya two-wheelers',clothes:'Kapda Bazaar',furniture:'Ghar Sajao furniture',mobile:'Mobile Point',guns:'Hathiyar Ghar · Weapons',realty:'Sapna Homes',mechanic:'Mechanic garage',station:'Railway station',bus:'ST bus stand',lodge:'Lodge'};
const FOODNAME={MH:['Chai tapri','Vada pav stall','Udupi canteen'],GJ:['Chai tapri','Farsan house','Gujarati thali house'],RJ:['Chai tapri','Kachori corner','Rajasthani bhojanalaya'],DD:['Coconut stall','Seafood shack','Beach cafe']};
// Beta v2.01.00: the name tag over a shop or place is as wide as its name (it used to be cut off after about 15 letters)
const _lblCtx=document.createElement('canvas').getContext('2d');
function labelTex(t,col){let fs=27;_lblCtx.font=`800 ${fs}px "Baloo 2", sans-serif`;let tw=_lblCtx.measureText(t).width;while(tw>600&&fs>15){fs--;_lblCtx.font=`800 ${fs}px "Baloo 2", sans-serif`;tw=_lblCtx.measureText(t).width;}
  const W=Math.max(96,Math.min(660,Math.ceil(tw+48)));const tex=canvasTex(W,56,x=>{x.font=`800 ${fs}px "Baloo 2", sans-serif`;const w=W-6,l=3;x.fillStyle='rgba(20,15,38,.84)';x.beginPath();x.moveTo(l+15,3);x.arcTo(l+w,3,l+w,53,15);x.arcTo(l+w,53,l,53,15);x.arcTo(l,53,l,3,15);x.arcTo(l,3,l+w,3,15);x.fill();
    x.fillStyle=col;x.fillRect(l+11,20,7,16);x.fillStyle='#fff4e2';x.textAlign='center';x.textBaseline='middle';x.fillText(t,W/2+7,30,W-40);},false);tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;tex.userData={w:W};return tex;}
const ringGeo=new THREE.RingGeometry(1.1,1.5,24);ringGeo.rotateX(-Math.PI/2);const ringMats={};
function makePoi(o){const col=o.color||PCOL[o.type]||'#ffffff';if(!ringMats[col])ringMats[col]=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.85,side:THREE.DoubleSide});
  const ring=new THREE.Mesh(ringGeo,ringMats[col]);ring.position.set(o.x,.36,o.z);scene.add(ring);
  const p=Object.assign({icon:PICON[o.type]||'•',color:col,ring,sp:null,zone:zoneAt(o.x,o.z,40)},o);pois.push(p);return p;}
function lotCenter(b,lot){const n=STYLES[b.zone.style]?STYLES[b.zone.style].lots:3;const o=n===2?15:20;return[b.x+lot[0]*o,b.z+lot[1]*o];}
for(const [id,zd] of zoneData){const z=zd.z;let foodN=0;
  for(const s of zd.slots){let x,zz,rot;if(s.x!=null){x=s.x;zz=s.z;rot=s.rot||0;}else{[x,zz,rot]=edgePos(s.b.x,s.b.z,s.side,s.t);}
    let name=s.name,extra=s.extra;
    if(s.type==='food'&&!name){const nm=FOODNAME[z.food]||(W.foodNames||{})[z.food]||FOODNAME.MH;name=nm[foodN%3];extra=foodN===2?'HW':z.food;foodN++;}
    if(!name)name=s.type==='station'?z.name+' Railway Station':s.type==='bus'?z.name+' ST stand':s.type==='lodge'?(z.st==='RJ'||z.id==='shirdi'?z.name+' dharamshala':z.name+' lodge'):PNAME[s.type]||s.type;
    if(s.lot){const [cx,cz]=lotCenter(s.b,s.lot);const n=STYLES[z.style]?STYLES[z.style].lots:3;const sz=n===2?26:18;
      if(s.type==='pump'||s.type==='cng'){box(sz,.1,sz,cx,.32,cz,M.concrete,false,true);box(sz*.8,.5,sz*.55,cx,5.4,cz,M.canopy);box(sz*.8,.7,sz*.57,cx,5.0,cz,s.type==='cng'?M.awn[3]:M.awn[1]);for(const k of [-1,1]){box(.5,5,.5,cx+k*sz*.25,2.8,cz,M.pole);box(1,1.6,.6,cx+k*sz*.25,1.1,cz+2,M.white);}}
      if(s.type==='station'){building(cx,cz,sz*.9,sz*.7,9,bmat('#c97a4a',true),{old:true});box(sz*.95,.6,sz*.75,cx,9.6,cz,M.cream);addSign(z.name.toUpperCase(),cx,7,cz+(s.side==='s'?sz*.36:-sz*.36),0,sz*.6,1.6,'#1d1433','#ffd04a');}
      if(s.type==='bus'){box(sz*.7,.4,4,cx,3.2,cz,M.roofTin);for(const k of [-1,1])box(.3,3,.3,cx+k*sz*.3,1.8,cz,M.pole);box(sz*.6,.6,1,cx,.6,cz,M.wood);}}
    makePoi({type:s.type,name,x,z:zz,rot,extra,drive:s.type==='pump'||s.type==='cng'||s.type==='mechanic'});}}
for(const p of lmPois)makePoi(p);
{const NEED=[['food','food'],['pump','pump'],['lodge','lodge']];for(const z of W.zones){for(const [t] of NEED){if(pois.some(p=>p.type===t&&p.zone===z))continue;const cx=z.x0+z.nx*40+(t==='pump'?24:t==='lodge'?-24:0),cz=z.z0+z.nz*40+12;const r=nearestRoadPoint(cx,cz,300);if(!r)continue;const nx=r.e.dz,nz=-r.e.dx,o=r.e.w/2+3.5;const x=r.x+nx*o,zz=r.z+nz*o;
  makePoi({zone:z,type:t,name:t==='food'?(FOODNAME[z.food]||FOODNAME.MH)[0]:t==='pump'?PNAME.pump:(z.st==='RJ'?z.name+' dharamshala':z.name+' lodge'),x,z:zz,rot:Math.atan2(-nx,-nz),extra:t==='food'?z.food:undefined,drive:t==='pump'});}}}
for(const h of W.homes){const zd=zoneData.get(h.zone);const b=zd.blocks.find(b=>b.land&&b.hasBld&&!b.used&&!pois.some(p=>Math.hypot(p.x-b.x,p.z-b.z)<20))||zd.blocks.find(b=>b.land&&b.hasBld);if(!b)continue;b.used=true;
  const [x,zz,rot]=edgePos(b.x,b.z,'s',-8);makePoi({type:'home',name:h.name,x,z:zz,rot,extra:h.id});}
flushStatic();

/* rooftop billboards near the player */
function playerAge(){return IBCONF.ageFromDob(P&&P.dob);}
/* ================= billboards and ads =================
   Slots: up to 4 rooftop boards per city, up to 3 roadside boards on city roads, and roadside boards along highways.
   Each slot shows a running collaborator ad (admin → Billboards, entries with an advertiser) if one fits,
   otherwise an India Bay "house ad" for something real nearby: homes for sale, vehicles, food, jobs and more.
   Tapping a board opens it; house ads give directions, collaborator ads have a Visit link. */
const billboardMeshes=[];let SLOTS=null;const adShown=new Map(),houseCount=new Map();
function collabAds(zid){const iso=istISO(),age=playerAge(),kid=age==null||age<18;
  return CFG.billboards.filter(b=>b.advertiser&&String(b.advertiser).trim()&&(()=>{const zs=String(b.zone||'all').split(',').map(x=>x.trim());return zs.includes('all')||zs.includes(zid);})()&&(!b.start||b.start<=iso)&&(!b.end||b.end>=iso)&&!IBCONF.adBlocked(b.category)&&(kid?IBCONF.kidSafe(b.category):IBCONF.ageOK(b.ages,age)));}
function activeBillboards(zid){return collabAds(zid);}
function buildSlots(){SLOTS=[];
  // v4.2: no rooftop boards any more, only roadside ones (up to 6 on each city's roads)
  for(const [id,zd] of zoneData){
    const z=zd.z,x1=z.x0+z.nx*80,z1=z.z0+z.nz*80;let n=0;
    const maxN=z.size==='small'?2:z.size==='mid'?4:6;for(const e of EDGES){if(n>=maxN)break;if(e.kind!=='city'||e.len<60)continue;const mx=(e.ax+e.bx)/2,mz=(e.az+e.bz)/2;if(mx<z.x0-5||mx>x1+5||mz<z.z0-5||mz>z1+5)continue;
      const edge=Math.min(Math.abs(mx-z.x0),Math.abs(mx-x1),Math.abs(mz-z.z0),Math.abs(mz-z1));if(hash(e.id*1.7)>(edge>12?.25:.6))continue;
      const o=e.w/2+6,sx=mx-e.dz*o,sz=mz+e.dx*o;if(isWater(sx,sz)||roadAt(sx,sz,4)||collide(new THREE.Vector3(sx,0,sz),5,false))continue;SLOTS.push({id:`c:${e.id}`,x:sx,y:0,z:sz,rot:Math.atan2(e.dx,e.dz),kind:'road',road:'city road',zone:id,bw:9,bh:4.5});n++;}}
  for(const e of EDGES){if(e.kind!=='hw'||e.len<200)continue;const step=1600,cnt=Math.max(1,Math.floor(e.len/step));for(let j=0;j<cnt;j++){if(hash(e.id*7.31+j)>.6)continue;const t=Math.min(e.len-60,60+(j+.5)*(e.len-120)/cnt),side=hash(e.id+j*3.3)<.5?1:-1;const mx=e.ax+e.dx*t,mz=e.az+e.dz*t,o=(e.w/2+13)*side,sx=mx-e.dz*o,sz=mz+e.dx*o;if(isWater(sx,sz)||roadAt(sx,sz,6)||zoneAt(sx,sz,10))continue;
    const zz=zoneAt(sx,sz,8000);SLOTS.push({id:`h:${e.id}:${j}`,x:sx,y:0,z:sz,rot:Math.atan2(e.dx,e.dz),kind:'road',road:/express/i.test(e.road&&e.road.name||'')?'expressway':'highway',zone:zz?zz.id:null,bw:10,bh:5});}}
  // street flex boards: small banners on two bamboo poles by the footpath near junctions (local shops, events)
  for(const [id,zd] of zoneData){const z=zd.z;let n=0;const maxN=z.size==='big'?10:z.size==='mid'?6:3;for(const e of EDGES){if(n>=maxN)break;if(e.kind!=='city'||e.len<60||hash(e.id*3.9)>.3)continue;const mx=e.ax+e.dx*12,mz=e.az+e.dz*12;if(zoneAt(mx,mz,2)!==z)continue;
      const o=e.w/2+2.2,sx=mx-e.dz*o,sz=mz+e.dx*o;if(isWater(sx,sz)||roadAt(sx,sz,.5)||collide(new THREE.Vector3(sx,0,sz),2,false))continue;SLOTS.push({id:`f:${e.id}`,x:sx,y:0,z:sz,rot:Math.atan2(e.dx,e.dz),kind:'flex',road:'city road',zone:id,bw:3.6,bh:1.6,y0:2.2});n++;}}
  for(const s of FLY_ADS)SLOTS.push(s);for(const s of EXTRA_SLOTS)SLOTS.push(s);}
/* India Bay's own ads, made from real places near the board */
const HOUSE=[
  ['realty',p=>{const h=W.homes.find(q=>!q.starter&&q.zone===p.zone&&!(P.homes||[]).includes(q.id)&&p.extra===q.id);return h?{title:'FOR SALE: '+h.name.toUpperCase(),line2:inr(cost('home.'+h.id,h.price))+' · ready to move in',desc:`${h.name} is for sale. Visit it to buy and move in.`,cat:'Homes',fg:'#ffffff',bg:'#2f6b4f'}:null},'home'],
  ['cars',p=>({title:'NEW SEDANS FROM '+inr(cost('veh.sedan',VALUE.sedan)),line2:p.name,desc:`Cars, SUVs and sports cars at ${p.name}. Test drive today.`,cat:'Vehicles',fg:'#ffffff',bg:'#1f4fa8'})],
  ['bikes',p=>({title:'BIKES FROM '+inr(cost('veh.bike',VALUE.bike)),line2:p.name,desc:`Motorbikes, sports bikes and helmets at ${p.name}.`,cat:'Vehicles',fg:'#1d1433',bg:'#ffc93c'})],
  ['food',p=>({title:'HUNGRY? EAT HERE',line2:p.name,desc:`Hot local food at ${p.name}. Filling up keeps your health up.`,cat:'Food',fg:'#ffffff',bg:'#d9483b'})],
  ['jobs',p=>({title:'DRIVERS WANTED',line2:'Earn every trip · '+p.name,desc:`Delivery, auto, cab, truck and bus jobs. Sign up at ${p.name}.`,cat:'Jobs',fg:'#1d1433',bg:'#3ddc97'})],
  ['mechanic',p=>({title:'REPAIRS AND SERVICE',line2:p.name,desc:`Fix damage and get a quick service at ${p.name}.`,cat:'Vehicles',fg:'#ffffff',bg:'#5b4636'})],
  ['clothes',p=>({title:'NEW KURTAS IN STOCK',line2:p.name,desc:`Kurtas, sarees, sneakers and sunglasses at ${p.name}.`,cat:'Fashion',fg:'#1d1433',bg:'#ff9ecb'})],
  ['mobile',p=>({title:'DATA PACKS AND COVERS',line2:p.name,desc:`Recharges and phone covers at ${p.name}. Order anything else on BayCart.`,cat:'Mobiles',fg:'#ffffff',bg:'#3b2f8f'})],
  ['furniture',p=>({title:'FURNITURE SALE',line2:p.name,desc:`Beds, sofas and TVs for your home at ${p.name}.`,cat:'Home',fg:'#2a1600',bg:'#f6d7a7'})],
  ['station',p=>({title:'TRAINS ACROSS WEST INDIA',line2:p.name,desc:`Sleeper and AC tickets at ${p.name}.`,cat:'Travel',fg:'#ffffff',bg:'#7a2e2e'})],
  ['stadium',p=>{const F=window.FOOTBALL;if(!F)return null;const t=F.byId(p.extra);if(!t)return null;const n=F.nextHome(t.id,gameDay);if(!n)return null;return{title:n.inDays?'NEXT HOME MATCH · '+t.short+' v '+n.f.away.short:'MATCHDAY · '+t.short+' v '+n.f.away.short,line2:(n.inDays?'In '+n.inDays+' Bay day'+(n.inDays>1?'s':'')+' · ':'Tonight · ')+'7:30 pm · '+p.name,desc:`${t.name} play ${n.f.away.name} at ${p.name}. Tickets, jerseys and the ${t.fans} fan club at the stadium gate.`,cat:'Sports',fg:t.col2==='#ffffff'?'#ffffff':t.col2,bg:t.col};}],
  ['airport',p=>({title:'FLY ACROSS INDIA',line2:p.name,desc:`Flights between West India's cities from ${p.name}.`,cat:'Travel',fg:'#ffffff',bg:'#1b6aa5'})],
  ['bank',p=>({title:'KEEP CASH SAFE',line2:p.name,desc:`Cash in the bank is safe from robbers. Deposit at ${p.name}.`,cat:'Banking',fg:'#ffffff',bg:'#0f5f5f'})],
  ['pump',p=>({title:'FUEL UP HERE',line2:p.name,desc:`Petrol and diesel at ${p.name}. Fill up before long drives.`,cat:'Fuel',fg:'#1d1433',bg:'#ff9f1c'})],
  ['lodge',p=>({title:'ROOMS FOR TONIGHT',line2:p.name,desc:`A bed to sleep in at ${p.name}.`,cat:'Travel',fg:'#ffffff',bg:'#6b3fa0'})]];
const SAFETY=[{title:'WEAR A HELMET',line2:'Road safety · India Bay',desc:'Helmets save lives, and traffic police fine riders without one.',cat:'Road safety',fg:'#ffffff',bg:'#c0392b'},
  {title:'STOP AT RED',line2:'Road safety · India Bay',desc:'Red means stop. Wait for green.',cat:'Road safety',fg:'#1d1433',bg:'#ffffff'}];
const EXTRA_ADS=[];   // features add house ads here (Beta v1.01.12: hero sightings)
function houseAd(slot,n){const R=slot.kind==='road'&&slot.road!=='city road'?4000:1600;const near=pois.filter(p=>Math.abs(p.x-slot.x)<R&&Math.abs(p.z-slot.z)<R);
  const opts=[];for(const f of EXTRA_ADS){try{const a=f(slot);if(a){opts.push(a);opts.push(a);}}catch(e){}}for(const [type,f,alt] of HOUSE){const list=near.filter(p=>p.type===type||(alt&&p.type===alt)).sort((a,b)=>Math.hypot(a.x-slot.x,a.z-slot.z)-Math.hypot(b.x-slot.x,b.z-slot.z));for(const p of list){const ad=f(p);if(ad){opts.push(Object.assign(ad,{target:{x:p.x,z:p.z,name:p.name}}));break;}}}
  // spread the variety: each board in an area takes the next kind of ad; every 5th is a road-safety or advertise-here board
  const key=slot.zone||'hw',c=houseCount.get(key)||0;houseCount.set(key,c+1);const off=Math.floor(hash(key.length*13.1+(slot.zone?slot.zone.charCodeAt(0):7))*97);
  if(c%7===3)return{house:true,logo:true,title:'India Bay',line2:'Reclaim your kingdom',text:'INDIA BAY|Reclaim your kingdom',fg:'#ffc93c',bg:'#123d4c'};const pick=!opts.length||c%5===4?SAFETY[(c+off)%SAFETY.length]:opts[(c+off)%opts.length];return Object.assign({house:true},pick);}
function chooseAd(slot,n){const list=collabAds(slot.zone);for(let i=0;i<list.length;i++){const b=list[(i+n)%list.length];const key=b.advertiser+'|'+b.text;const c=adShown.get(key)||0;if(c<3){adShown.set(key,c+1);const L=String(b.text||'').split('|');return{collab:true,title:L[0]||b.advertiser,line2:L[1]||'',text:b.text,fg:b.fg||'#1d1433',bg:b.bg||'#ffffff',advertiser:b.advertiser,link:b.link||'',cat:IBCONF.adLabel(b.category)};}}
  return houseAd(slot,n);}
// Green and blue are kept for road signs (welcome and direction boards), so ads never use them as a background.
const AD_SAFE=['#7b2a5e','#c2185b','#e4572e','#ffc93c','#ffffff','#1d1433','#8d5a2b','#5b3fa0','#d9483b','#f6d7a7'];
function adBg(c){const col=new THREE.Color();try{col.set(c||'#ffffff');}catch(e){return '#ffffff';}const h={};col.getHSL(h);const hue=h.h*360;if(h.s>.22&&h.l>.12&&h.l<.82&&hue>=75&&hue<=255)return AD_SAFE[Math.floor(hash(hue*3.7+h.l*11)*AD_SAFE.length)%AD_SAFE.length];return c;}
function adFg(bg,fg){const col=new THREE.Color(bg);const L=.2126*col.r+.7152*col.g+.0722*col.b;const f=new THREE.Color(fg||'#ffffff');const Lf=.2126*f.r+.7152*f.g+.0722*f.b;return Math.abs(L-Lf)<.35?(L>.5?'#1d1433':'#ffffff'):fg;}
const postMat=LMat('#3b3a40'),frameMat=LMat('#202226');
function buildBoard(slot,n){const ad=slot.ad||(slot.ad=chooseAd(slot,n));if(!ad.safe){ad.safe=1;const nb=adBg(ad.bg);if(nb!==ad.bg){ad.bg=nb;ad.fg=adFg(nb,ad.fg);}}const g=new THREE.Group();g.position.set(slot.x,slot.y,slot.z);g.rotation.y=slot.rot;
  const small=slot.kind==='pillar'||slot.kind==='flex',tall=slot.kind==='pillar';const tex=ad.logo?logoTex(tall?160:small?320:512,tall?256:small?144:256,'Reclaim your kingdom'):signTex(ad.text||(ad.line2?ad.title+'|'+ad.line2:ad.title),ad.fg,ad.bg,tall?160:small?320:512,tall?256:small?144:256);const board=new THREE.Mesh(new THREE.PlaneGeometry(slot.bw,slot.bh),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
  board.userData.ad=ad;board.userData.slot=slot;g.add(board);billboardMeshes.push(board);if(!['road','pillar','parapet','flex'].includes(slot.kind)){twoSided(board);billboardMeshes.push(board.children[0]);}
  // v1.0: the two legs stop at the bottom edge of the board and stand well behind both faces, so they never show over the ad
  if(slot.kind==='road'){const top=6+slot.bh/2;board.position.set(0,top,.3);board.material.side=THREE.FrontSide;board.material.polygonOffset=true;board.material.polygonOffsetFactor=-2;board.material.polygonOffsetUnits=-2;
    const back=new THREE.Mesh(board.geometry,new THREE.MeshBasicMaterial({map:tex,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));back.position.set(0,top,-.3);back.rotation.y=Math.PI;back.userData=board.userData;g.add(back);billboardMeshes.push(back);
    const bottom=top-slot.bh/2-.3;for(const sx of [-slot.bw*.3,slot.bw*.3])part(G.box,postMat,.24,bottom,.24,sx,bottom/2,0,g);part(G.box,frameMat,slot.bw+.4,slot.bh+.4,.3,0,top,0,g);part(G.box,frameMat,slot.bw*.7,.25,.25,0,bottom-.12,0,g);}
  // v1.01.03 local ads: flex wraps on metro and flyover pillars, banners along flyover parapets and street flex boards on two poles
  if(slot.kind==='pillar'){board.position.set(0,slot.y0,slot.off);board.material.side=THREE.FrontSide;const back=new THREE.Mesh(board.geometry,new THREE.MeshBasicMaterial({map:tex}));back.position.set(0,slot.y0,-slot.off);back.rotation.y=Math.PI;back.userData=board.userData;g.add(back);billboardMeshes.push(back);
    for(const s of [-1,1])part(G.box,frameMat,slot.bw+.1,.08,.06,0,slot.y0+s*slot.bh/2,slot.off,g);}
  if(slot.kind==='parapet'){board.position.set(0,slot.y0,0);board.material.side=THREE.FrontSide;board.material.polygonOffset=true;board.material.polygonOffsetFactor=-2;}
  if(slot.kind==='flex'){board.material.side=THREE.FrontSide;board.position.set(0,slot.y0,.06);const back=new THREE.Mesh(board.geometry,new THREE.MeshBasicMaterial({map:tex}));back.position.set(0,slot.y0,-.06);back.rotation.y=Math.PI;back.userData=board.userData;g.add(back);billboardMeshes.push(back);
    for(const sx of [-slot.bw/2-.06,slot.bw/2+.06])part(G.box,postMat,.07,slot.y0+slot.bh/2+.2,.07,sx,(slot.y0+slot.bh/2+.2)/2,0,g);for(const s of [-1,1])part(G.cyl,LMat('#d9d2c4'),.03,slot.bw+.1,.03,0,slot.y0+s*slot.bh/2,0,g).rotation.z=Math.PI/2;}
  scene.add(g);return g;}
const EXTRA_SLOTS=[];function addAdSlot(s){EXTRA_SLOTS.push(s);if(SLOTS)SLOTS.push(s);}
function freeBoard(g){scene.remove(g);g.traverse(o=>{if(o.isMesh&&o.material.map){o.material.map.dispose();o.material.dispose();const i=billboardMeshes.indexOf(o);if(i>=0)billboardMeshes.splice(i,1);if(o.geometry.dispose)o.geometry.dispose();}});}
const boardOf=new Map();
function refreshBillboards(){for(const g of boardOf.values())freeBoard(g);boardOf.clear();adShown.clear();houseCount.clear();if(SLOTS)for(const s of SLOTS)s.ad=null;}
// Hide a board while the camera is right next to it, so its posts and frame never fill the screen.
// Beta v1.01.21: a board counts as seen when you pass within 90 m of it facing it (once every 10 minutes): Admin → Dashboards → Ads
const adSeen=new Map();
// v1.01.22: a board near the camera hides only if it stands between the camera and you (so pillar ads no longer vanish as you drive up)
function blocksView(bx,bz,hw){const c=camera.position,p=ppos();const vx=p.x-c.x,vz=p.z-c.z,L2=vx*vx+vz*vz||1;const t=((bx-c.x)*vx+(bz-c.z)*vz)/L2;if(t<-.05||t>1.05)return false;const qx=c.x+vx*t-bx,qz=c.z+vz*t-bz;const r=hw+1.4;return qx*qx+qz*qz<r*r;}
function fadeBoards(){const c=camera.position;const now=performance.now();const fx=Math.sin(player.mode==='drive'&&player.veh?player.veh.h:player.h),fz=Math.cos(player.mode==='drive'&&player.veh?player.veh.h:player.h);for(const [id,g] of boardOf){const dx=g.position.x-c.x,dz=g.position.z-c.z;const d2=dx*dx+dz*dz;g.visible=!(d2<5*5||(d2<20*20&&blocksView(g.position.x,g.position.z,g.userData.hw||3)));
  if(started&&d2<90*90&&dx*fx+dz*fz>0&&g.userData.adRef&&now-(adSeen.get(id)||-1e9)>600000){adSeen.set(id,now);emit('adView',g.userData.adRef);}}}
function updBillboards(px,pz){if(!SLOTS)buildSlots();SLOTS.forEach((s,i)=>{const d=Math.hypot(s.x-px,s.z-pz),has=boardOf.has(s.id);if(d<700&&!has){const g=buildBoard(s,i);g.userData.adRef=s.ad||null;{const bx=new THREE.Box3().setFromObject(g),sz=bx.getSize(new THREE.Vector3());g.userData.hw=Math.max(.8,Math.max(sz.x,sz.z)/2);}boardOf.set(s.id,g);}else if(d>950&&has){freeBoard(boardOf.get(s.id));boardOf.delete(s.id);}});}
const adRay=new THREE.Raycaster();
function pickBillboard(cx,cy){if(!billboardMeshes.length)return false;const r=renderer.domElement.getBoundingClientRect();adRay.setFromCamera({x:(cx-r.left)/r.width*2-1,y:-((cy-r.top)/r.height)*2+1},camera);adRay.far=220;
  const hit=adRay.intersectObjects(billboardMeshes,false)[0];if(!hit)return false;adSheet(hit.object.userData.ad,hit.object.userData.slot);return true;}
function adSheet(ad,slot){const pp=ppos();/* v1.01.22: a click counts only when the player takes Directions or visits the site */const d=ad.target?Math.hypot(ad.target.x-pp.x,ad.target.z-pp.z):0;const dist=d<1000?Math.round(d/10)*10+' m':(d/1000).toFixed(1)+' km';
  const clicked=()=>{emit('adClick',ad);P.extra.adClicks=P.extra.adClicks||{};if(ad.collab){const k=ad.advertiser;P.extra.adClicks[k]=(P.extra.adClicks[k]||0)+1;}};
  openSheet(ad.collab?esc(ad.advertiser):'India Bay',ad.collab?esc(ad.cat||'')||'India Bay':esc(ad.cat||'India Bay'),`<div class="adprev" style="background:${esc(ad.bg)};color:${esc(ad.fg)};border-color:${esc(ad.fg)}"><b>${esc(ad.title)}</b>${ad.line2?`<span>${esc(ad.line2)}</span>`:''}</div>
    ${ad.desc?`<p class="note" style="color:var(--ink);font-size:14.5px">${esc(ad.desc)}</p>`:''}${ad.target?`<p class="note">${esc(ad.target.name)} · ${dist} away</p>`:''}
    <div class="btnrow">${ad.target?'<button class="go" data-id="dir">Directions</button>':''}${ad.collab&&/^https:\/\//.test(ad.link)?'<button class="go" data-id="visit">Visit</button>':''}<button class="buy ghost" data-id="close">Close</button></div>
    ${ad.collab?'<p class="note">Sponsored · opens their website in a new tab.</p>':''}`,s=>s.onclick=e=>{const id=e.target.dataset.id;if(!id)return;if(id==='close')return closeSheet();
      if(id==='dir'){clicked();closeSheet();if(api.TRAVEL&&api.TRAVEL.go)api.TRAVEL.go(ad.target.x,ad.target.z,ad.target.name);return;}
      if(id==='visit'){clicked();window.open(ad.link,'_blank','noopener');closeSheet();}});}

/* ================= vehicles ================= */
const G={wheel:new THREE.CylinderGeometry(.36,.36,.26,12).rotateZ(Math.PI/2),thin:new THREE.CylinderGeometry(.33,.33,.08,14).rotateZ(Math.PI/2),box:new THREE.BoxGeometry(1,1,1),sph:new THREE.SphereGeometry(1,10,8),cyl:new THREE.CylinderGeometry(1,1,1,8)};
const VM={black:LMat('#1c1c20'),yellow:LMat('#ffc61a'),green:LMat('#1f8a4c'),glass:new THREE.MeshLambertMaterial({color:0x9fc6dd,transparent:true,opacity:.55}),light:new THREE.MeshBasicMaterial({color:0xfff2c8}),tail:new THREE.MeshBasicMaterial({color:0xff3b30}),seat:LMat('#3a2a22'),skin:LMat('#a86b4a'),hair:LMat('#1a1414'),
  red:LMat('#c8102e'),white:LMat('#eeeeea'),silver:LMat('#b9bec4'),orange:LMat('#f08a24'),blue:LMat('#2d6cdf'),maroon:LMat('#6d1a2a'),teal:LMat('#1f8a8a'),sirR:new THREE.MeshBasicMaterial({color:0xff2a2a}),sirB:new THREE.MeshBasicMaterial({color:0x2a5bff}),dark:new THREE.MeshBasicMaterial({color:0x222222}),chrome:LMat('#cfd3d6')};
const hornTex=canvasTex(256,256,x=>{x.fillStyle='#ffe066';x.fillRect(0,0,256,256);x.fillStyle='#d9483b';x.fillRect(0,0,256,30);x.fillRect(0,226,256,30);x.fillStyle='#1d1433';x.textAlign='center';x.font='800 50px "Baloo 2", sans-serif';x.fillText('HORN',128,100);x.fillText('OK',128,150);x.font='800 40px "Baloo 2", sans-serif';x.fillStyle='#1f8a4c';x.fillText('PLEASE',128,200);},false);
const policeTex=canvasTex(256,64,x=>{x.fillStyle='#ffffff';x.fillRect(0,0,256,64);x.fillStyle='#1d3f9a';x.font='800 44px "Baloo 2", sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('POLICE',128,34);},false);
function part(geo,mat,sx,sy,sz,x,y,z,parent){const m=new THREE.Mesh(geo,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
function wheels(g,pts,s=1,geo=G.wheel){return pts.map(([x,y,z])=>{const w=new THREE.Mesh(geo,VM.black);w.position.set(x,y,z);w.scale.setScalar(s);g.add(w);return w;});}
const SPEC={
  cycle:{max:9,acc:4,turn:2.6,len:1.8,wid:.6,two:true,fuel:null,lic:null,fp:[0,1.75,.25],cam:3.6,label:'Cycle',seat:[0,.95,-.15],pedal:true},
  rickshaw:{max:7,acc:3,turn:1.7,len:2.8,wid:1.3,fuel:null,lic:null,fp:[0,1.85,.75],cam:4.5,label:'Cycle rickshaw',seat:[0,1.05,.85],pedal:true},
  bike:{max:28,acc:14,turn:2.4,len:2.1,wid:.8,two:true,fuel:'petrol',tank:10,range:35000,lic:'two',fp:[0,1.65,.2],cam:4,label:'Motorbike',seat:[0,.9,-.2]},
  sportsbike:{max:48,acc:24,turn:2.6,len:2.1,wid:.8,two:true,fuel:'petrol',tank:14,range:30000,lic:'two',fp:[0,1.55,.25],cam:4,label:'Sports bike',seat:[0,.9,-.25]},
  auto:{max:26,acc:15,turn:1.9,len:3.2,wid:1.7,fuel:'cng',tank:8,range:20000,lic:null,fp:[0,1.95,.55],cam:4.5,label:'Auto rickshaw'},
  taxi:{max:32,acc:16,turn:1.7,len:4.2,wid:1.9,fuel:'cng',tank:10,range:25000,lic:'lmv',fp:[-.4,1.45,.15],cam:5,label:'Kaali-peeli taxi'},
  car:{max:33,acc:16,turn:1.7,len:4.2,wid:1.9,fuel:'petrol',tank:35,range:30000,lic:'lmv',fp:[-.4,1.45,.15],cam:5,label:'Hatchback'},
  sedan:{max:38,acc:18,turn:1.7,len:4.7,wid:1.95,fuel:'petrol',tank:40,range:32000,lic:'lmv',fp:[-.4,1.45,.1],cam:5.3,label:'Sedan'},
  suv:{max:36,acc:18,turn:1.6,len:4.4,wid:2.0,fuel:'diesel',tank:50,range:30000,lic:'lmv',fp:[-.45,1.9,.25],cam:5.5,label:'SUV'},
  sports:{max:46,acc:26,turn:2.0,len:4.3,wid:2.0,fuel:'petrol',tank:50,range:22000,lic:'lmv',fp:[-.4,1.15,0],cam:5,label:'Sports coupe'},
  police:{max:38,acc:20,turn:1.8,len:4.4,wid:2.0,fuel:'diesel',tank:50,range:30000,lic:'lmv',fp:[-.45,1.9,.25],cam:5.5,label:'Police jeep'},
  bus:{max:34,acc:8,turn:1.1,len:10.5,wid:2.6,fuel:'diesel',tank:150,range:60000,lic:'heavy',fp:[-.8,2.6,4.4],cam:9,label:'BEST-style bus'},
  truck:{max:30,acc:9,turn:1.2,len:7.6,wid:2.4,fuel:'diesel',tank:150,range:60000,lic:'heavy',fp:[-.6,2.5,2.9],cam:8,label:'Goods truck'},
  // Beta v1.01.24: more vehicles
  mpv:{max:34,acc:16,turn:1.6,len:4.7,wid:1.95,fuel:'diesel',tank:55,range:32000,lic:'lmv',fp:[-.45,1.85,.3],cam:5.5,label:'MPV',shape:'mpv',car:true},
  van:{max:26,acc:12,turn:1.7,len:3.8,wid:1.6,fuel:'petrol',tank:35,range:25000,lic:'lmv',fp:[-.35,1.6,1.1],cam:5,label:'Van',shape:'van',car:true},
  coupe:{max:44,acc:24,turn:1.9,len:4.4,wid:1.95,fuel:'petrol',tank:50,range:24000,lic:'lmv',fp:[-.4,1.2,0],cam:5,label:'Coupe',shape:'coupe',car:true},
  convertible:{max:42,acc:22,turn:1.9,len:4.4,wid:1.95,fuel:'petrol',tank:50,range:24000,lic:'lmv',fp:[-.4,1.25,0],cam:5,label:'Convertible',shape:'conv',car:true},
  limo:{max:34,acc:14,turn:1.3,len:6.2,wid:2.0,fuel:'petrol',tank:70,range:30000,lic:'lmv',fp:[-.45,1.45,1.0],cam:7,label:'Limousine',shape:'limo',car:true},
  ambulance:{max:36,acc:16,turn:1.5,len:5.0,wid:2.0,fuel:'diesel',tank:60,range:30000,lic:'lmv',fp:[-.45,1.9,1.6],cam:6,label:'Ambulance',shape:'amb',car:true},
  camper:{max:28,acc:11,turn:1.4,len:5.4,wid:2.1,fuel:'diesel',tank:80,range:40000,lic:'lmv',fp:[-.45,1.95,1.8],cam:6.5,label:'Camper van',shape:'camper',car:true},
  pickup:{max:32,acc:15,turn:1.6,len:4.8,wid:1.9,fuel:'diesel',tank:60,range:32000,lic:'lmv',fp:[-.45,1.8,.6],cam:5.5,label:'Pickup',shape:'pickup',car:true},
  lorry:{max:26,acc:8,turn:1.2,len:7.6,wid:2.4,fuel:'diesel',tank:150,range:60000,lic:'heavy',fp:[-.6,2.5,2.9],cam:8,label:'Lorry',truck:'lorry'},
  tanker:{max:26,acc:8,turn:1.2,len:7.6,wid:2.4,fuel:'diesel',tank:150,range:60000,lic:'heavy',fp:[-.6,2.5,2.9],cam:8,label:'Tanker',truck:'tanker'},
  towtruck:{max:30,acc:10,turn:1.3,len:6.6,wid:2.3,fuel:'diesel',tank:100,range:50000,lic:'heavy',fp:[-.6,2.5,2.4],cam:7.5,label:'Tow truck',truck:'tow'},
  firetruck:{max:32,acc:10,turn:1.2,len:7.6,wid:2.4,fuel:'diesel',tank:150,range:50000,lic:'heavy',fp:[-.6,2.5,2.9],cam:8,label:'Fire engine',truck:'fire'},
  tractor:{max:12,acc:6,turn:1.5,len:3.6,wid:1.9,fuel:'diesel',tank:40,range:30000,lic:'lmv',fp:[0,2.35,-.5],cam:5,label:'Tractor'},
  scooter:{max:24,acc:12,turn:2.4,len:1.8,wid:.7,two:true,fuel:'petrol',tank:5,range:30000,lic:'two',fp:[0,1.55,.1],cam:4,label:'Scooter',seat:[0,.82,-.2]},
  atv:{max:20,acc:12,turn:2.0,len:2.0,wid:1.2,fuel:'petrol',tank:10,range:15000,lic:null,fp:[0,1.6,-.1],cam:4.2,label:'ATV quad',seat:[0,.95,-.15]},
  golfcart:{max:10,acc:5,turn:1.9,len:2.5,wid:1.3,fuel:null,lic:null,fp:[-.3,1.45,0],cam:4.5,label:'Golf cart'},
  erickshaw:{max:10,acc:5,turn:1.8,len:2.9,wid:1.3,fuel:null,lic:null,fp:[0,1.75,.7],cam:4.5,label:'E-rickshaw'},
  // Beta v1.01.28: an electric car that flies (features/skycar.js draws it and flies it)
  skycar:{max:44,acc:24,turn:1.9,len:4.6,wid:2.1,fuel:null,lic:'lmv',fp:[-.38,1.25,.1],cam:5.4,label:'Aerion flying car',flies:true},
  // Beta v2.04.00: a speedboat for the story (features/boats.js draws it). It only moves on water.
  speedboat:{max:30,acc:14,turn:1.5,len:6.2,wid:2.3,fuel:null,lic:null,fp:[0,1.5,-.6],cam:6.5,label:'Speedboat',boat:true}};
/* ---------- realistic vehicle parts ---------- */
// Beta v1.01.23: vehicles reflect the sky (a small cube map), so paint, glass and chrome look glossy. ENVM keeps each
// material's day strength; core-3 dims them at night.
const ENV=(()=>{const f=(top,mid,bot)=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,top);g.addColorStop(.48,mid);g.addColorStop(.52,'#8d8878');g.addColorStop(1,bot);x.fillStyle=g;x.fillRect(0,0,64,64);return c;};
  const side=f('#7fb2e0','#e8eef3','#4a463e'),up=document.createElement('canvas');up.width=up.height=64;{const x=up.getContext('2d');x.fillStyle='#86b8e6';x.fillRect(0,0,64,64);}const dn=document.createElement('canvas');dn.width=dn.height=64;{const x=dn.getContext('2d');x.fillStyle='#45423b';x.fillRect(0,0,64,64);}
  const t=new THREE.CubeTexture([side,side,up,dn,side,side]);t.needsUpdate=true;return t;})();
const ENVM=[];function envd(m,r){m.envMap=ENV;m.reflectivity=r;m.combine=THREE.MixOperation;m.userData.envR=r;ENVM.push(m);return m;}
const PAINT=new Map();function paint(c){c=typeof c==='string'?c:'#'+c.color.getHexString();if(!PAINT.has(c))PAINT.set(c,envd(new THREE.MeshPhongMaterial({color:c,shininess:95,specular:0x555555}),.16));return PAINT.get(c);}
const VX={tire:new THREE.MeshPhongMaterial({color:0x17171a,shininess:12,specular:0x111111}),rim:envd(new THREE.MeshPhongMaterial({color:0xc9ccd1,shininess:110,specular:0x888888}),.5),chrome:envd(new THREE.MeshPhongMaterial({color:0xd8dade,shininess:120,specular:0x999999}),.65),drl:new THREE.MeshBasicMaterial({color:0xf4f8ff}),handle:LMat('#3a3b40'),seam:LMat('#141417'),arch:LMat('#121214'),trim:LMat('#26272b'),grille:LMat('#141416'),
  glass:envd(new THREE.MeshPhongMaterial({color:0x1d2a35,shininess:140,specular:0x99aabb,transparent:true,opacity:.82}),.42),plateW:LMat('#f2f2ee'),plateY:LMat('#f4c430'),canvas:LMat('#1d1d1f'),seatC:LMat('#3b2b23')};
function wheelGeo(r,w,rimR){const t=new THREE.CylinderGeometry(r,r,w,24);t.rotateZ(Math.PI/2);const sw=new THREE.TorusGeometry(r-.035,.04,6,24);sw.rotateY(Math.PI/2);const sw2=sw.clone();sw.translate(w/2-.03,0,0);sw2.translate(-w/2+.03,0,0);
  const rim=new THREE.CylinderGeometry(rimR,rimR,w+.02,18);rim.rotateZ(Math.PI/2);const hub=new THREE.CylinderGeometry(rimR*.32,rimR*.32,w+.06,10);hub.rotateZ(Math.PI/2);
  // five spokes on each face, and a dark dish behind them (Beta v1.01.23)
  const rp=[rim,hub];for(const sx of [-1,1]){const dish=new THREE.CylinderGeometry(rimR*.9,rimR*.9,.012,18);dish.rotateZ(Math.PI/2);dish.translate(sx*(w/2+.006),0,0);rp.push(dish);for(let i=0;i<5;i++){const b=new THREE.BoxGeometry(.03,rimR*.95,rimR*.2);b.translate(0,rimR*.47,0);b.rotateX(i*Math.PI*2/5);b.translate(sx*(w/2+.018),0,0);rp.push(b);}}
  const tparts=[t,sw,sw2];const T2=merge(tparts);const tc=T2.index.count;let rc=0;for(const q of rp)rc+=q.index.count;const g=merge([T2,...rp]);g.clearGroups();g.addGroup(0,tc,0);g.addGroup(tc,rc,1);return g;}
function spokeGeo(r){const t=new THREE.TorusGeometry(r,.035,6,20);t.rotateY(Math.PI/2);const parts=[];for(let i=0;i<4;i++){const b=new THREE.BoxGeometry(.012,r*2,.012);b.rotateX(i*Math.PI/4);parts.push(b);}const hub=new THREE.CylinderGeometry(.05,.05,.08,8);hub.rotateZ(Math.PI/2);parts.push(hub);
  const tc=t.index.count;let rc=0;for(const q of parts)rc+=q.index.count;const g=merge([t,...parts]);g.clearGroups();g.addGroup(0,tc,0);g.addGroup(tc,rc,1);return g;}
const WG={car:wheelGeo(.34,.24,.22),big:wheelGeo(.36,.28,.22),heavy:wheelGeo(.5,.34,.3),moto:wheelGeo(.33,.12,.24),auto:wheelGeo(.3,.16,.18),cycle:spokeGeo(.32)};
function wheels2(g,pts,geo){return pts.map(([x,y,z])=>{const w=new THREE.Mesh(geo,[VX.tire,VX.rim]);w.position.set(x,y,z);w.castShadow=true;g.add(w);return w;});}
// Side profile (z = along the car, y = up) extruded across the width, with rounded edges.
function sideBody(pts,width,mat,g,bevel=.07,segs=2){const sh=new THREE.Shape();pts.forEach(([z,y],i)=>i?sh.lineTo(z,y):sh.moveTo(z,y));sh.closePath();
  const geo=new THREE.ExtrudeGeometry(sh,{depth:Math.max(.05,width-2*bevel),bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel*.8,bevelSegments:segs,curveSegments:3});
  geo.translate(0,0,-(width-2*bevel)/2);geo.rotateY(-Math.PI/2);const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
const CAR_SHAPES={   // Beta v1.01.23: rounder noses, tails and bonnets
  car:{body:[[-2,.36],[2,.36],[2.06,.5],[2.07,.66],[2.0,.8],[1.85,.9],[1.4,.96],[.95,1.0],[-1.7,1.03],[-1.95,1.0],[-2.05,.88],[-2.07,.6]],cab:[[.98,.98],[.28,1.46],[-1.45,1.46],[-1.86,1.0]],belt:1.0,roof:1.46},
  sedan:{body:[[-2.3,.36],[2.3,.36],[2.36,.52],[2.36,.68],[2.28,.82],[2.1,.9],[1.6,.95],[1.05,.98],[-1.6,.98],[-2.0,1.0],[-2.28,.98],[-2.38,.86],[-2.4,.6]],cab:[[1.08,.96],[.35,1.44],[-1.0,1.44],[-1.7,.98]],belt:.98,roof:1.44},
  suv:{body:[[-2.15,.42],[2.15,.42],[2.22,.6],[2.22,.88],[2.12,1.06],[1.9,1.14],[1.2,1.18],[-2.1,1.2],[-2.2,1.12],[-2.23,.7]],cab:[[1.22,1.16],[.62,1.84],[-2.0,1.86],[-2.12,1.18]],belt:1.18,roof:1.86},
  sports:{len:4.3,body:[[-2.1,.3],[2.1,.3],[2.17,.42],[2.12,.56],[1.9,.68],[1.3,.77],[.6,.84],[-1.6,.86],[-1.95,.84],[-2.15,.72],[-2.18,.5]],cab:[[.62,.82],[-.1,1.16],[-1.1,1.16],[-1.75,.86]],belt:.84,roof:1.16},
  mpv:{len:4.7,big:true,body:[[-2.35,.42],[2.35,.42],[2.4,.6],[2.4,.85],[2.25,1.0],[1.6,1.08],[1.1,1.12],[-2.3,1.15],[-2.4,1.05],[-2.42,.7]],cab:[[1.12,1.1],[.45,1.75],[-2.2,1.78],[-2.32,1.12]],belt:1.12,roof:1.78},
  van:{len:3.8,body:[[-1.9,.36],[1.9,.36],[1.95,.6],[1.95,1.05],[1.85,1.12],[-1.85,1.12],[-1.95,1.0],[-1.95,.5]],cab:[[1.88,1.1],[1.6,1.8],[-1.85,1.82],[-1.9,1.12]],belt:1.1,roof:1.82},
  coupe:{len:4.4,two:true,body:[[-2.2,.33],[2.2,.33],[2.26,.48],[2.22,.66],[2.0,.78],[1.3,.86],[.7,.9],[-1.7,.92],[-2.05,.9],[-2.25,.76],[-2.28,.52]],cab:[[.72,.88],[-.15,1.3],[-1.2,1.3],[-1.85,.92]],belt:.9,roof:1.3},
  conv:{len:4.4,two:true,open:true,body:[[-2.2,.33],[2.2,.33],[2.26,.48],[2.22,.66],[2.0,.78],[1.3,.86],[.7,.9],[-1.7,.92],[-2.05,.9],[-2.25,.76],[-2.28,.52]],cab:[[.72,.88],[.38,1.22],[.2,1.22],[.5,.88]],belt:.9,roof:1.22},
  limo:{len:6.2,body:[[-3.1,.36],[3.1,.36],[3.16,.52],[3.16,.68],[3.08,.82],[2.9,.9],[2.4,.95],[1.85,.98],[-2.4,.98],[-2.8,1.0],[-3.08,.98],[-3.18,.86],[-3.2,.6]],cab:[[1.88,.96],[1.15,1.44],[-1.8,1.44],[-2.5,.98]],belt:.98,roof:1.44},
  amb:{len:5.0,big:true,box:[.55,-2.5,2.3],body:[[-2.5,.42],[2.5,.42],[2.55,.62],[2.55,1.0],[2.35,1.15],[1.5,1.22],[-2.5,1.26],[-2.55,1.0],[-2.55,.6]],cab:[[1.5,1.2],[1.05,2.05],[.6,2.08],[.6,1.22]],belt:1.22,roof:2.05},
  camper:{len:5.4,big:true,box:[.7,-2.7,2.55],body:[[-2.7,.45],[2.7,.45],[2.75,.65],[2.75,1.0],[2.55,1.15],[1.65,1.25],[-2.7,1.3],[-2.75,1.0],[-2.75,.6]],cab:[[1.65,1.22],[1.15,2.1],[.75,2.12],[.75,1.25]],belt:1.25,roof:2.1},
  pickup:{len:4.8,big:true,bed:[-.65,-2.35],body:[[-2.4,.42],[2.4,.42],[2.45,.6],[2.45,.88],[2.3,1.02],[1.6,1.1],[-2.35,1.12],[-2.42,1.0],[-2.44,.62]],cab:[[1.15,1.1],[.55,1.75],[-.45,1.78],[-.6,1.12]],belt:1.12,roof:1.78}};
CAR_SHAPES.car.len=4.2;CAR_SHAPES.sedan.len=4.7;CAR_SHAPES.suv.len=4.4;CAR_SHAPES.suv.big=true;
function buildCar(type,colorMat,g){const sp=SPEC[type],shape=sp.shape||(type==='taxi'?'car':type==='police'?'suv':type),S=CAR_SHAPES[shape];const L=sp.len,W=sp.wid-.05,k=L/(S.len||4.2);
  const sc=pts=>pts.map(([z,y])=>[z*k,y]);
  let body,top;if(type==='taxi'){body=paint('#151517');top=paint('#f6c90e');}else if(type==='police'){body=paint('#f4f4f2');top=body;}
  else{const pal={car:['#f2f2ee','#b9bec4','#c8102e','#2d5fb8','#6b6f75'],sedan:['#f2f2ee','#b9bec4','#6d1a2a','#1c1c20','#1f6f6f'],suv:['#1c1c20','#b9bec4','#f2f2ee','#8a1c1c','#3d4a3a'],sports:['#d0101e','#f2b705','#f07c1a','#1b6fd6'],mpv:['#f2f2ee','#b9bec4','#6b6f75','#1c1c20','#7a1f2a'],van:['#f2f2ee','#d8d8d4','#b9bec4','#c8102e'],coupe:['#1b6fd6','#d0101e','#1c1c20','#f2f2ee'],conv:['#d0101e','#f2b705','#2d5fb8','#f2f2ee'],limo:['#141416','#f2f2ee'],amb:['#f4f4f2'],camper:['#efe6d2','#f2f2ee'],pickup:['#f2f2ee','#b9bec4','#8a1c1c','#3d4a3a','#1c1c20']}[shape]||['#b9bec4'];body=colorMat?paint(colorMat):paint(mpick(pal));top=body;}
  sideBody(sc(S.body),W,body,g,.11,3);sideBody(sc(S.cab),W-.16,VX.glass,g,.06,2);
  // roof skin and pillars in paint so the glass reads as windows (a convertible has only its windscreen)
  const r1=sc(S.cab);if(!S.open){const roof=[[r1[1][0]-.05,S.roof-.07],[r1[1][0]+.02,S.roof+.02],[r1[2][0]-.02,S.roof+.02],[r1[2][0]+.08,S.roof-.07]];sideBody(roof,W-.1,top,g,.04);
  const pz=[(r1[0][0]+r1[1][0])/2,(r1[2][0]+r1[3][0])/2,(r1[1][0]+r1[2][0])/2];for(const z of pz){const p=part(G.box,top,W-.12,S.roof-S.belt,.12,0,(S.roof+S.belt)/2,z,g);}}
  else{part(G.box,VX.seatC,W*.38,.5,.5,W*.22,S.belt+.15,-.3*k,g);part(G.box,VX.seatC,W*.38,.5,.5,-W*.22,S.belt+.15,-.3*k,g);part(G.box,VX.trim,W-.1,.08,1.0,0,S.belt+.02,-1.4*k,g);}
  if(S.box){const [z0,z1,yt]=S.box;sideBody([[z1*k,S.belt-.05],[z0*k,S.belt-.05],[z0*k,yt],[z1*k+.05,yt]],W,body,g,.06,2);for(const sx of [-1,1]){part(G.box,VX.glass,.03,.4,(z0-z1)*k*.35,sx*(W/2+.01),S.belt+.55,(z0+z1)/2*k,g);}}
  if(S.bed){const [b0,b1]=S.bed;part(G.box,VX.trim,W-.24,.04,(b0-b1)*k-.15,0,S.belt+.005,(b0+b1)/2*k,g);for(const sx of [-1,1])part(G.box,body,.08,.28,(b0-b1)*k,sx*(W/2-.04),S.belt+.14,(b0+b1)/2*k,g);part(G.box,body,W,.28,.08,0,S.belt+.14,b1*k+.04,g);part(G.box,body,W,.28,.08,0,S.belt+.14,b0*k-.04,g);}
  if(sp.extra)sp.extra(g,{S,r1,L,W,k,body,top});
  const fz=L/2,bz=-L/2;part(G.box,VX.trim,W+.04,.2,.18,0,.47,fz-.02,g);part(G.box,VX.trim,W+.04,.2,.18,0,.47,bz+.02,g);part(G.box,VX.grille,W*.5,.16,.05,0,.66,fz+.02,g);
  for(const sx of [-1,1]){part(G.box,VM.light,.34,.13,.05,sx*(W/2-.3),.8,fz+.01,g);part(G.box,VM.tail,.3,.13,.05,sx*(W/2-.28),.84,bz-.01,g);part(G.box,top,.14,.1,.2,sx*(W/2+.06),S.belt+.06,r1[0][0]-.15,g);}
  const yel=type==='taxi';platePart(g,yel,.5,.13,.03,0,.5,fz+.12);platePart(g,yel,.5,.13,.03,0,.62,bz-.04);
  if(type==='taxi'){const m=[TAXIM.y,TAXIM.y,TAXIM.y,TAXIM.y,TAXIM.s,TAXIM.s];const sg=new THREE.Mesh(new THREE.BoxGeometry(.78,.24,.34),m);sg.position.set(0,S.roof+.15,-.3*k);g.add(sg);part(G.box,VX.trim,.82,.04,.38,0,S.roof+.03,-.3*k,g);}
  if(type==='sports')part(G.box,body,W*.9,.06,.42,0,S.belt+.28,bz+.25,g);
  if(type==='police'){part(G.box,paint('#1d3f9a'),W+.02,.18,L*.92,0,.82,0,g);const r=part(G.box,VM.sirR,.55,.16,.3,-.32,S.roof+.1,-.2,g),bl=part(G.box,VM.sirB,.55,.16,.3,.32,S.roof+.1,-.2,g);g.userData.lights=[r,bl];
    const p=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.36),new THREE.MeshBasicMaterial({map:policeTex}));p.position.set(W/2+.04,1.0,0);p.rotation.y=Math.PI/2;g.add(p);const p2=p.clone();p2.position.x=-W/2-.04;p2.rotation.y=-Math.PI/2;g.add(p2);}
  const wz=L/2-.78*k,wx=W/2-.12,wg=S.big?WG.big:WG.car,wy=S.big?.36:.34;
  carDetails(g,type,shape,S,r1,L,W,k,wz,wy,body);
  return wheels2(g,[[-wx,wy,wz],[wx,wy,wz],[-wx,wy,-wz],[wx,wy,-wz]],wg);}
// Beta v1.01.23: the small things that make a car read as real: black wheel arches, door shut lines and handles, a
// side skirt, wipers, a lower air intake, daytime running lights and a light bar across the back.
function carDetails(g,type,shape,S,r1,L,W,k,wz,wy,body){const two=shape==='sports'||!!S.two,R=S.big?.42:.4;
  for(const sx of [-1,1])for(const z of [wz,-wz]){const a=new THREE.RingGeometry(R,R+.09,14,1,0,Math.PI);a.rotateY(sx*Math.PI/2);a.translate(sx*(W/2+.012),wy,z);const m=new THREE.Mesh(a,VX.arch);g.add(m);}
  const bot=S.big?.5:.42,belt=S.belt;const doors=two?[r1[0][0]-.05,r1[3][0]+.25]:[r1[0][0]-.05,(r1[1][0]+r1[2][0])/2+.1*k,r1[3][0]+.2];
  for(const sx of [-1,1]){const x=sx*(W/2+.004);for(const z of doors)part(G.box,VX.seam,.012,belt-bot,.018,x,(belt+bot)/2,z,g);
    for(let i=0;i<doors.length-1;i++)part(G.box,VX.handle,.03,.035,.16,sx*(W/2+.02),belt-.1,doors[i+1]+.22,g);
    part(G.box,VX.trim,.03,.11,L*.56,sx*(W/2+.01),bot+.04,0,g);}
  const wsz=r1[0][0]+.04,wsy=S.belt+.03;for(const sx of [-.28,.28]){const w=part(G.box,VX.seam,W*.36,.022,.03,sx*W,wsy,wsz,g);w.rotation.z=sx>0?-.08:.08;}
  const fz=L/2;part(G.box,VX.grille,W*.62,.1,.05,0,.44,fz+.06,g);for(const sx of [-1,1]){part(G.box,VX.drl,.3,.025,.03,sx*(W/2-.3),.72,fz+.04,g);}
  if(shape!=='car')part(G.box,VM.tail,W*.55,.05,.03,0,.86,-L/2-.01,g);
  part(G.box,VX.chrome,.04,.04,.04,0,S.roof+.03,-L*.22,g);}
// Beta v1.01.23: a motorbike from real parts: frame tubes, an engine with cooling fins, raked forks, mudguards, a
// round headlight, mirrors, rear shocks and a chrome exhaust. The sports bike adds a fairing and a belly pan.
function tube(g,ax,ay,az,bx,by,bz,r,mat){const L=Math.hypot(bx-ax,by-ay,bz-az);const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,8),mat);c.position.set((ax+bx)/2,(ay+by)/2,(az+bz)/2);c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(bx-ax,by-ay,bz-az).normalize());c.castShadow=true;g.add(c);return c;}
function guard(g,mat,z,r,from,len){const c=new THREE.CylinderGeometry(r,r,.13,14,1,true,from,len);c.rotateZ(Math.PI/2);if(mat.side!==THREE.DoubleSide){mat.userData.ds=mat.userData.ds||(()=>{const q=mat.clone();q.side=THREE.DoubleSide;if(mat.envMap){q.userData={envR:mat.userData.envR};ENVM.push(q);}return q;})();mat=mat.userData.ds;}const m=new THREE.Mesh(c,mat);m.position.set(0,.34,z);g.add(m);return m;}
const BIKEM={frame:LMat('#2a2b30'),engine:new THREE.MeshPhongMaterial({color:0x8a8d93,shininess:60,specular:0x444444}),fin:LMat('#5d6066'),seat:new THREE.MeshPhongMaterial({color:0x151517,shininess:30,specular:0x222222})};
BIKEM.guard=new THREE.MeshPhongMaterial({color:0x222226,shininess:40,side:THREE.DoubleSide});
function buildBike(g,b,sp){const M=BIKEM;
  tube(g,0,1.02,.56,0,.55,.18,.035,M.frame);tube(g,0,1.02,.56,0,.88,-.42,.032,M.frame);tube(g,0,.55,.18,0,.5,-.2,.03,M.frame);tube(g,0,.5,-.2,0,.88,-.42,.028,M.frame);
  part(G.box,M.engine,.26,.26,.34,0,.5,.06,g);for(let i=0;i<5;i++)part(G.box,M.fin,.3,.018,.2,0,.62+i*.035,.12,g);part(G.box,M.engine,.2,.14,.16,.12,.46,.02,g);
  const tank=new THREE.Mesh(G.sph,b);tank.scale.set(.2,.14,.34);tank.position.set(0,.99,.24);tank.castShadow=true;g.add(tank);part(G.box,VX.chrome,.06,.03,.06,0,1.12,.3,g);
  part(G.box,b,.24,.17,.3,0,.76,-.24,g);const seat=new THREE.Mesh(G.sph,M.seat);seat.scale.set(.13,.06,.36);seat.position.set(0,.95,-.3);g.add(seat);
  tube(g,-.14,.97,-.48,.14,.97,-.48,.012,VX.chrome);part(G.box,VM.tail,.14,.06,.05,0,.9,-.7,g);platePart(g,false,.22,.12,.02,0,.74,-.76);
  guard(g,b,-.68,.39,Math.PI*.15,Math.PI*.85);guard(g,M.guard,.72,.38,Math.PI*.12,Math.PI*.6);
  for(const sx of [-1,1]){tube(g,sx*.085,.36,.72,sx*.085,1.06,.53,.022,VX.chrome);tube(g,sx*.12,.4,-.62,sx*.12,.86,-.42,.02,sx>0?VX.chrome:M.frame);}
  if(!sp){const hl=new THREE.Mesh(new THREE.CylinderGeometry(.1,.08,.1,14),M.frame);hl.rotation.x=Math.PI/2;hl.position.set(0,1.0,.66);g.add(hl);part(G.cyl,VM.light,.085,.02,.085,0,1.0,.715,g).rotation.x=Math.PI/2;
    tube(g,-.36,1.16,.5,.36,1.16,.5,.016,VX.chrome);for(const sx of [-1,1]){part(G.cyl,M.seat,.025,.12,.025,sx*.38,1.16,.5,g).rotation.z=Math.PI/2;tube(g,sx*.26,1.16,.5,sx*.3,1.36,.46,.008,VX.chrome);part(G.cyl,VX.glass,.055,.012,.055,sx*.3,1.38,.46,g).rotation.x=Math.PI/2;}}
  else{const fr=part(G.box,b,.4,.38,.5,0,1.02,.6,g);fr.rotation.x=-.5;part(G.box,VX.glass,.3,.16,.02,0,1.24,.55,g).rotation.x=-.9;part(G.box,VM.light,.22,.06,.03,0,1.0,.84,g);part(G.box,b,.3,.2,.5,0,.85,-.55,g);part(G.box,b,.28,.12,.4,0,.36,.1,g);
    tube(g,-.26,1.05,.46,.26,1.05,.46,.016,M.frame);}
  tube(g,.15,.44,.1,.17,.44,-.35,.032,VX.chrome);const muf=tube(g,.17,.44,-.3,.18,.52,-.72,.05,VX.chrome);
  part(G.box,M.frame,.03,.05,.5,-.11,.38,-.36,g);}
// Beta v1.01.23: buses and trucks get mirrors on arms, wipers, number plates, a door, a roof AC pod, mud flaps,
// a fuel tank and an exhaust stack, and black arches over the wheels
function mirrorArm(g,sx,x,y,z){tube(g,sx*x,y,z,sx*(x+.32),y+.05,z+.1,.02,VX.trim);part(G.box,VX.trim,.08,.42,.16,sx*(x+.34),y-.12,z+.1,g);part(G.box,VX.glass,.02,.36,.12,sx*(x+.34),y-.12,z+.19,g);}
function heavyArches(g,wx,zs){for(const sx of [-1,1])for(const z of zs){const a=new THREE.RingGeometry(.56,.68,14,1,0,Math.PI);a.rotateY(sx*Math.PI/2);a.translate(sx*wx,.5,z);g.add(new THREE.Mesh(a,VX.arch));}}
function busDetails(g,h,dd,noAC){const top=.6+h;for(const sx of [-1,1])mirrorArm(g,sx,1.27,top-.6,4.95);for(const sx of [-.45,.45]){const w=part(G.box,VX.seam,.85,.03,.03,sx,.6+h-(dd?2.7:1.5),5.2,g);w.rotation.z=sx>0?-.5:.5;}
  platePart(g,true,.6,.16,.03,0,.55,5.4);platePart(g,true,.6,.16,.03,0,.9,-5.37);part(G.box,VX.glass,.04,1.8,1.0,-1.29,1.65,4.1,g);part(G.box,VX.trim,.05,.06,1.04,-1.29,2.58,4.1,g);
  if(!dd&&!noAC){part(G.box,LMat('#e9e7e2'),1.5,.28,2.6,0,top+.14,-.6,g);part(G.box,VX.grille,1.3,.04,2.3,0,top+.3,-.6,g);}
  heavyArches(g,1.285,[3.5,-3.4]);}
function truckDetails(g){for(const sx of [-1,1])mirrorArm(g,sx,1.2,2.3,3.4);tube(g,1.0,1.2,1.25,1.0,3.6,1.25,.07,VX.chrome);part(G.cyl,VX.trim,.09,.12,.09,1.0,3.66,1.25,g);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,1.0,14),VX.chrome);t.rotation.x=Math.PI/2;t.position.set(-1.05,.82,1.6);g.add(t);
  for(const sx of [-1,1]){part(G.box,VX.seam,.5,.5,.02,sx*1.05,.42,-3.55,g);}platePart(g,true,.6,.16,.03,0,.6,3.86);platePart(g,true,.6,.16,.03,0,.95,-3.72);
  for(const sx of [-.4,.4]){const w=part(G.box,VX.seam,.8,.03,.03,sx,1.75,3.76,g);w.rotation.z=sx>0?-.5:.5;}heavyArches(g,1.2,[2.7]);}
/* Beta v1.01.24: buses that look like the real ones. A shaped body (rounded roof and front), the operator's livery
   painted on both sides (so the text reads the right way on each side, with the door on the left), a front with a
   big windscreen, the destination board, a grille panel and twin round headlights, and a back with tail lights.
   Styles: KL (KSRTC Kerala red and yellow), KA (KSRTC Karnataka red and silver), GJ (GSRTC silver and blue),
   MH (MSRTC red Lal Pari), GA (Kadamba green), RJ (green and cream), city buses in their colours, 'volvo' (white
   AC coach with one long black window band) and BEST double-deckers, plus the open-top city tour bus. */
const BUSL=10.4,BUSW=2.55;const BUSTEX=new Map();
function busKey(LV){return LV?(LV.style||LV.key||'city'):'city';}
function busSideTex(LV,style,side,dd,open){const k=[style,LV&&LV.body,LV&&LV.band,LV&&LV.text,side,dd,open].join('|');if(BUSTEX.has(k))return BUSTEX.get(k);
  const H=dd?512:256;const t=canvasTex(1024,H,(x,w,h)=>{const body=(LV&&LV.body)||'#b8202a',band=(LV&&LV.band)||'#f3efe6',txt=(LV&&LV.text)||'';const front=side==='L'?0:1;const fx=u=>front===0?u:w-u;   // u measured from the front
    const win=(y0,y1,pill,frame,glassC)=>{x.fillStyle=frame;x.fillRect(0,y0-6,w,y1-y0+12);const n=Math.round(w/pill);for(let i=0;i<n;i++){const a=i*w/n;x.fillStyle=glassC||'#1d2731';x.fillRect(a+6,y0,w/n-12,y1-y0);x.fillStyle='rgba(255,255,255,.13)';x.fillRect(a+10,y0+4,(w/n-12)*.35,y1-y0-8);}};
    const winTop=dd?h*.07:h*.1,winBot=dd?h*.27:h*.5,y2a=h*.55,y2b=h*.78;
    if(style==='KL'){x.fillStyle='#ffcf2a';x.fillRect(0,0,w,h);win(winTop,winBot,92,'#c8102e');x.fillStyle='#c8102e';x.fillRect(0,winBot+8,w,h*.1);x.fillRect(0,h*.78,w,h*.22);x.fillStyle='#ffcf2a';x.fillRect(0,h*.82,w,h*.035);
      x.fillStyle='#c8102e';x.font='italic 800 34px sans-serif';x.textAlign='center';x.fillText('KSRTC',w*.5,h*.72);x.font='700 18px sans-serif';x.fillText('FAST PASSENGER',w*.5,h*.765);}
    else if(style==='KA'){x.fillStyle='#c9cbcf';x.fillRect(0,0,w,h);x.fillStyle='#c8202a';x.fillRect(0,0,w,winTop-6);win(winTop,winBot,96,'#151618','#10151b');x.fillStyle='#c8202a';x.fillRect(0,h*.79,w,h*.21);x.fillStyle='#f2c230';x.fillRect(0,h*.765,w,h*.025);
      x.fillStyle='#1d4fb0';x.font='800 34px sans-serif';x.textAlign='center';x.fillText('KSRTC',w*.56,h*.68);x.font='700 24px "Nirmala UI","Noto Sans Kannada",sans-serif';x.fillText('ಕರ್ನಾಟಕ ಸಾರಿಗೆ',w*.3,h*.68);x.strokeStyle='#d0202a';x.lineWidth=4;x.beginPath();x.arc(w*.45,h*.66,16,0,6.3);x.stroke();}
    else if(style==='GJ'){x.fillStyle='#e9eaec';x.fillRect(0,0,w,h);win(winTop,winBot,96,'#d5d7da');const g2=x.createLinearGradient(0,0,w,0);g2.addColorStop(0,'#5aa9e6');g2.addColorStop(1,'#1f5fa8');x.fillStyle=g2;x.beginPath();x.moveTo(0,h*.6);x.bezierCurveTo(w*.3,h*.55,w*.6,h*.72,w,h*.62);x.lineTo(w,h*.7);x.bezierCurveTo(w*.6,h*.8,w*.3,h*.63,0,h*.7);x.fill();
      x.fillStyle='#e8a628';x.fillRect(0,h*.535,w,h*.012);x.fillStyle='#4a4d52';x.fillRect(0,h*.84,w,h*.16);x.fillStyle='#c8202a';x.font='800 30px sans-serif';x.textAlign='center';x.fillText('GSRTC',fx(w*.72),h*.8);}
    else if(style==='volvo'){x.fillStyle='#f6f6f4';x.fillRect(0,0,w,h);x.fillStyle='#111316';x.fillRect(0,h*.06,w,h*.47);x.fillStyle='rgba(255,255,255,.08)';x.fillRect(0,h*.08,w,h*.1);for(let i=1;i<9;i++){x.fillStyle='#0b0c0e';x.fillRect(i*w/9-2,h*.06,4,h*.47);}
      x.strokeStyle='#d9a63a';x.lineWidth=5;x.beginPath();x.moveTo(0,h*.6);x.bezierCurveTo(w*.35,h*.58,w*.6,h*.7,w,h*.64);x.stroke();x.fillStyle='#c8202a';x.font='700 26px sans-serif';x.textAlign='center';x.fillText((txt||'STATE')+' · AC INTERCITY',fx(w*.6),h*.78);x.fillStyle='#5a5d62';x.fillRect(0,h*.88,w,h*.12);}
    else if(style==='team'){x.fillStyle=body;x.fillRect(0,0,w,h);x.fillStyle='#0d1014';x.fillRect(0,h*.06,w,h*.45);for(let i=1;i<9;i++){x.fillStyle='#07080a';x.fillRect(i*w/9-2,h*.06,4,h*.45);}x.fillStyle='rgba(255,255,255,.07)';x.fillRect(0,h*.08,w,h*.09);
      const g3=x.createLinearGradient(0,0,w,0);g3.addColorStop(0,band);g3.addColorStop(1,body);x.fillStyle=g3;x.beginPath();x.moveTo(0,h*.56);x.bezierCurveTo(w*.4,h*.52,w*.7,h*.66,w,h*.58);x.lineTo(w,h*.64);x.bezierCurveTo(w*.7,h*.72,w*.4,h*.6,0,h*.62);x.fill();
      x.fillStyle=band;let f=58;x.font=`900 ${f}px sans-serif`;while(x.measureText(txt).width>w*.86&&f>20){f-=3;x.font=`900 ${f}px sans-serif`;}x.textAlign='center';x.fillText(txt,w*.5,h*.8);x.font='700 20px sans-serif';x.fillText('OFFICIAL TEAM BUS',w*.5,h*.92);}
    else{ // MH / GA / RJ / city and BEST
      x.fillStyle=style==='GA'?'#f4f1ea':body;x.fillRect(0,0,w,h);const bnd=style==='MH'?'#f2c230':band;
      if(dd){win(h*.06,h*.24,92,body);win(h*.52,h*.7,92,body);x.fillStyle=bnd;x.fillRect(0,h*.36,w,h*.05);x.fillRect(0,h*.82,w,h*.04);x.fillStyle=bnd;x.font='800 40px sans-serif';x.textAlign='center';x.fillText(txt,w*.5,h*.47);}
      else if(open){win(h*.48,h*.72,92,body);x.fillStyle=bnd;x.fillRect(0,h*.8,w,h*.05);x.fillStyle=bnd;x.font='800 44px sans-serif';x.textAlign='center';x.fillText('CITY TOUR',w*.5,h*.3);x.font='700 22px sans-serif';x.fillText('HOP ON · HOP OFF',w*.5,h*.38);}
      else{win(winTop,winBot,92,style==='GA'?'#1b7f5c':body);if(style==='GA'){x.fillStyle='#1b7f5c';x.fillRect(0,h*.6,w,h*.4);}x.fillStyle=bnd;x.fillRect(0,h*.58,w,h*.05);x.fillStyle=style==='GA'?'#f4f1ea':bnd;x.font='800 32px sans-serif';x.textAlign='center';x.fillText(txt,w*.5,h*.78);}}
    // the passenger door on the left side, near the front
    if(side==='L'){const d0=w*.05,d1=w*.13;x.fillStyle='#22262b';x.fillRect(d0,dd?h*.5:h*.08,d1-d0,h);x.fillStyle='#1d2731';x.fillRect(d0+5,dd?h*.52:h*.1,(d1-d0)/2-8,dd?h*.3:h*.6);x.fillRect(d0+(d1-d0)/2+3,dd?h*.52:h*.1,(d1-d0)/2-8,dd?h*.3:h*.6);x.fillStyle='#f2c230';x.fillRect(d0,h*.97,d1-d0,h*.03);}
    // wheel arches are cut out of the side so the wheels show
    x.globalCompositeOperation='destination-out';for(const zz of [3.5,-3.4]){const u=front===0?(BUSL/2-zz)/BUSL*w:(zz+BUSL/2)/BUSL*w;x.beginPath();x.arc(u,h+(dd?.02:.05)*h,(.68/(dd?4.3:2.45))*h,Math.PI,0);x.fill();}x.globalCompositeOperation='source-over';},false);
  BUSTEX.set(k,t);return t;}
function busFrontTex(LV,style,dd){const k='F'+[style,LV&&LV.body,LV&&LV.band,LV&&LV.text,dd].join('|');if(BUSTEX.has(k))return BUSTEX.get(k);
  const t=canvasTex(512,dd?768:512,(x,w,h)=>{const body=(LV&&LV.body)||'#b8202a',txt=(LV&&LV.text)||'BUS';const silver=style==='KA'||style==='GJ'||style==='volvo';
    x.fillStyle=style==='KL'?'#ffcf2a':style==='volvo'?'#f6f6f4':silver?'#c9cbcf':body;x.fillRect(0,0,w,h);const top=dd?h*.42:0;
    if(dd){x.fillStyle='#151a20';x.fillRect(w*.06,h*.05,w*.88,h*.25);x.fillStyle=body;x.fillRect(0,h*.32,w,h*.08);}
    x.fillStyle='#0e1013';x.fillRect(w*.04,top+h*(dd?.01:.02),w*.92,h*(dd?.07:.12));x.fillStyle='#ff9a1a';x.font=`700 ${dd?40:44}px monospace`;x.textAlign='center';x.fillText(style==='KA'?'ಕ ರಾ ರ ಸಾ ನಿ':txt,w/2,top+h*(dd?.065:.11));
    const g=x.createLinearGradient(0,top+h*.15,0,top+h*.55);g.addColorStop(0,'#2a3946');g.addColorStop(1,'#141c24');x.fillStyle=g;x.fillRect(w*.05,top+h*(dd?.09:.15),w*.9,h*(dd?.22:.4));x.fillStyle='rgba(255,255,255,.12)';x.beginPath();x.moveTo(w*.1,top+h*.17);x.lineTo(w*.35,top+h*.17);x.lineTo(w*.2,top+h*(dd?.3:.5));x.lineTo(w*.06,top+h*(dd?.3:.5));x.fill();
    if(style!=='volvo'){x.fillStyle='#22262b';x.fillRect(w*.49,top+h*(dd?.09:.15),w*.02,h*(dd?.22:.4));}
    x.strokeStyle='#111';x.lineWidth=5;x.beginPath();x.moveTo(w*.15,top+h*(dd?.3:.53));x.lineTo(w*.45,top+h*(dd?.26:.45));x.moveTo(w*.55,top+h*(dd?.3:.53));x.lineTo(w*.85,top+h*(dd?.26:.45));x.stroke();
    const gy=top+h*(dd?.35:.62);x.fillStyle=style==='KL'?'#c8102e':style==='KA'?'#b9bcc1':style==='volvo'?'#e6e6e3':body;x.fillRect(0,gy-h*.04,w,h*.03);
    x.fillStyle='#222429';x.fillRect(w*.32,gy,w*.36,h*(dd?.1:.16));x.fillStyle='#b9bcc1';for(let i=0;i<4;i++)x.fillRect(w*.33,gy+h*.02+i*h*(dd?.022:.035),w*.34,h*.008);
    for(const s of [w*.13,w*.87]){x.fillStyle='#1b1d21';x.fillRect(s-w*.12,gy+h*.01,w*.24,h*(dd?.07:.11));for(const o of [-w*.05,w*.05]){x.fillStyle='#d9dde2';x.beginPath();x.arc(s+o,gy+h*(dd?.045:.065),h*(dd?.026:.04),0,6.3);x.fill();x.fillStyle='#fffbe8';x.beginPath();x.arc(s+o,gy+h*(dd?.045:.065),h*(dd?.017:.026),0,6.3);x.fill();}}
    x.fillStyle=style==='KL'||style==='KA'?'#c8102e':style==='GJ'?'#4a4d52':style==='volvo'?'#5a5d62':body;x.fillRect(0,h*.88,w,h*.12);},false);
  BUSTEX.set(k,t);return t;}
function buildBus(g,LV){const style=busKey(LV);const volvo=style==='volvo';const tour=!!(LV&&LV.open);const dd=!tour&&(LV?(LV.dd?Math.random()<.5:false):false);
  const top=dd?4.85:tour?2.95:volvo?3.55:3.42,L=BUSL,W=BUSW,body=paint(style==='KL'?'#c8102e':style==='KA'?'#c8202a':style==='GJ'||volvo?'#eeeeec':style==='GA'?'#1b7f5c':(LV&&LV.body)||'#b8202a');
  const prof=volvo?[[-5.2,.55],[5.2,.55],[5.3,.95],[5.25,2.4],[5.05,3.2],[4.6,top],[-4.9,top],[-5.18,top-.18],[-5.24,2.9],[-5.24,.95]]:
    [[-5.2,.55],[5.2,.55],[5.26,.95],[5.26,top-.5],[5.12,top-.14],[4.75,top],[-4.85,top],[-5.18,top-.17],[-5.24,top-.5],[-5.24,.95]];
  sideBody(prof,W,body,g,.08,2);
  const sh=top-.55-(tour?0:.25),sy=.55+sh/2;
  for(const [side,sx] of [['L',1],['R',-1]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(L-.3,sh),new THREE.MeshLambertMaterial({map:busSideTex(LV,style,side,dd,tour),transparent:true,alphaTest:.5}));m.rotation.y=sx*Math.PI/2;m.position.set(sx*(W/2+.012),sy,-.05);g.add(m);}
  const fh=dd?3.6:top-1.25,fm=new THREE.Mesh(new THREE.PlaneGeometry(W-.1,fh),new THREE.MeshLambertMaterial({map:busFrontTex(LV,style,dd)}));fm.position.set(0,.95+fh/2,5.355+(volvo?.03:0));if(volvo)fm.rotation.x=-.08;g.add(fm);
  const rm=new THREE.Mesh(new THREE.PlaneGeometry(W-.1,top-1.1),paint(style==='KL'?'#c8102e':style==='KA'?'#c8202a':style==='GJ'||volvo?'#eeeeec':(LV&&LV.body)||'#b8202a'));rm.position.set(0,.95+(top-1.1)/2,-5.335);rm.rotation.y=Math.PI;g.add(rm);
  part(G.box,VX.glass,W-.4,.7,.03,0,top-.75,-5.345,g);for(const s of [-1,1]){part(G.box,VM.tail,.22,.42,.05,s*1.0,1.25,-5.35,g);part(G.box,VM.light,.12,.12,.05,s*1.0,.95,-5.35,g);}
  part(G.box,VX.trim,W+.06,.34,.24,0,.72,5.2,g);part(G.box,VX.trim,W+.06,.34,.24,0,.72,-5.2,g);
  if(tour){// open top deck: waist-high side walls, a rail, rows of seats and a stair hatch at the back
    const up=paint((LV&&LV.body)||'#b8202a');for(const s of [-1,1]){part(G.box,up,.1,.62,L-.4,s*(W/2-.05),top+.31,-.05,g);part(G.box,VX.chrome,.05,.05,L-.4,s*(W/2-.05),top+1.0,-.05,g);for(let z=-4.8;z<=4.9;z+=1.2)part(G.box,VX.chrome,.04,.4,.04,s*(W/2-.05),top+.8,z,g);}part(G.box,up,W-.1,.62,.1,0,top+.31,5.0,g);part(G.box,up,W-.1,.62,.1,0,top+.31,-5.1,g);
    part(G.box,LMat('#4a4f57'),W-.2,.05,L-.6,0,top+.02,0,g);const seat=LMat('#2f5f8a');for(let z=-4.2;z<4.6;z+=.9)for(const x of [-.72,.72]){part(G.box,seat,.9,.1,.45,x,top+.45,z,g);part(G.box,seat,.9,.5,.08,x,top+.72,z-.22,g);}g.userData.topRiders=[];for(let i=0;i<5;i++){const p=buildPerson(mpick(['#e8573e','#2f7fc1','#f2c14e','#3aa66b','#ff6fa8']),{});p.position.set(mpick([-.85,-.55,.55,.85]),top-.17,-3.8+i*1.8);p.userData.legs.forEach(l=>l.rotation.x=-1.45);g.add(p);g.userData.topRiders.push(p);}}
  busDetails(g,dd?4.3:top-.6,dd,tour);return wheels2(g,[[-1.15,.5,3.5],[1.15,.5,3.5],[-1.15,.5,-3.4],[1.15,.5,-3.4]],WG.heavy);}
/* Beta v1.01.24: number plates. Every plate is a small texture: yellow with black letters for taxis, buses, trucks
   and autos, white for private vehicles. Traffic gets a random BAY plate; your vehicles show your own plate
   (Profile → Number plate), which is unique in the game and linked to your username. */
const PLATET=new Map();
function plateTex(text,yel){const k=text+'|'+yel;if(PLATET.has(k))return PLATET.get(k);const t=canvasTex(256,64,(x,w,h)=>{x.fillStyle=yel?'#f4c430':'#f4f4f0';x.fillRect(0,0,w,h);x.strokeStyle='#1b1b1b';x.lineWidth=5;x.strokeRect(3,3,w-6,h-6);
  x.fillStyle='#141414';let f=42;x.font=`800 ${f}px "Arial Narrow",Arial,sans-serif`;while(x.measureText(text).width>w-24&&f>18){f-=2;x.font=`800 ${f}px "Arial Narrow",Arial,sans-serif`;}x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,h/2+2);},false);
  const m=new THREE.MeshLambertMaterial({map:t});PLATET.set(k,m);if(PLATET.size>400){const first=PLATET.keys().next().value;PLATET.delete(first);}return m;}
function botPlate(){const L='ABCDEFGHJKLMNPRSTUVWXYZ';return 'BAY '+String(10+Math.floor(Math.random()*90))+' '+L[Math.floor(Math.random()*L.length)]+' '+String(1000+Math.floor(Math.random()*9000));}
function platePart(g,yel,w,h,d,x,y,z){const ud=g.userData;if(!ud.plateText)ud.plateText=botPlate();ud.plateYel=yel;const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),plateTex(ud.plateText,yel));m.position.set(x,y,z);g.add(m);(ud.plates=ud.plates||[]).push(m);return m;}
function setPlate(v,text){const g=v.m||v;const ud=g.userData;if(!ud.plates||!text)return;ud.plateText=text;for(const m of ud.plates)m.material=plateTex(text,ud.plateYel);}
const TAXIM={y:new THREE.MeshLambertMaterial({color:'#f6c90e'}),s:new THREE.MeshBasicMaterial({map:canvasTex(256,80,(x,w,h)=>{const gr=x.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#ffe25a');gr.addColorStop(1,'#f2b705');x.fillStyle=gr;x.fillRect(0,0,w,h);x.fillStyle='#111';x.fillRect(w*.12,h*.14,w*.76,h*.72);x.fillStyle='#ffd23a';x.font='900 52px Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('TAXI',w/2,h/2+3);},false)})};
const AMBT=canvasTex(512,128,x=>{x.clearRect(0,0,512,128);x.fillStyle='#d7261e';x.fillRect(0,92,512,14);x.fillStyle='#d7261e';x.fillRect(40,18,24,72);x.fillRect(16,42,72,24);x.font='900 46px Arial,sans-serif';x.fillStyle='#1d4fb0';x.fillText('AMBULANCE',120,72);x.font='700 22px Arial';x.fillStyle='#d7261e';x.fillText('108 · EMERGENCY',122,100);},false);
SPEC.ambulance.extra=(g,c)=>{const m=new THREE.MeshLambertMaterial({map:AMBT,transparent:true,alphaTest:.3});for(const sx of [-1,1]){const p2=new THREE.Mesh(new THREE.PlaneGeometry(2.9,.72),m);p2.rotation.y=sx*Math.PI/2;p2.position.set(sx*(c.W/2+.015),1.45,-.85*c.k);g.add(p2);}
  const r=part(G.box,VM.sirR,.5,.14,.25,-.3,c.S.box[2]*1+.08,.4*c.k,g),bl=part(G.box,VM.sirB,.5,.14,.25,.3,c.S.box[2]+.08,.4*c.k,g);g.userData.lights=[r,bl];};
SPEC.camper.extra=(g,c)=>{for(const sx of [-1,1]){part(G.box,LMat('#c0732a'),.02,.12,c.L*.9,sx*(c.W/2+.012),1.35,0,g);part(G.box,LMat('#3a7d6e'),.02,.06,c.L*.9,sx*(c.W/2+.012),1.5,0,g);}part(G.box,LMat('#e2d9c4'),.5,.3,2.2,c.W/2+.2,2.3,-.9,g);};
/* Beta v1.01.24: more trucks and small vehicles */
const lorryTex=canvasTex(512,128,x=>{x.fillStyle='#e8a628';x.fillRect(0,0,512,128);for(let i=0;i<8;i++){x.fillStyle=['#c0392b','#2d6cdf','#1f8a4c','#8e44ad'][i%4];x.fillRect(8+i*63,14,54,100);x.fillStyle='#f4f1ea';x.beginPath();x.arc(35+i*63,64,16,0,6.3);x.fill();x.fillStyle=['#ffd23a','#e8573e'][i%2];x.beginPath();x.arc(35+i*63,64,8,0,6.3);x.fill();}x.strokeStyle='#5a3b22';x.lineWidth=6;x.strokeRect(3,3,506,122);},false);
const lorryBack=canvasTex(256,128,x=>{x.fillStyle='#e8a628';x.fillRect(0,0,256,128);x.fillStyle='#c0392b';x.fillRect(0,0,256,26);x.fillStyle='#1b1b1b';x.font='900 30px sans-serif';x.textAlign='center';x.fillText('HORN OK',128,66);x.fillText('PLEASE',128,100);x.fillStyle='#2d6cdf';x.fillRect(0,110,256,18);},false);
function buildTruck2(g,kind){const fire=kind==='fire';const cab=paint(fire?'#c8102e':kind==='tow'?'#f2b705':kind==='tanker'?'#f4f4f2':mpick(['#e8761e','#2f6fb5','#1f8a4c','#d9483b']));
  sideBody([[1.4,.6],[3.75,.6],[3.8,1.6],[3.55,2.75],[1.4,2.8]],2.3,cab,g,.1);part(G.box,VX.glass,2.0,.85,.05,0,2.15,3.72,g);part(G.box,VX.trim,2.4,.3,.25,0,.7,3.75,g);part(G.box,VX.grille,1.4,.45,.05,0,1.2,3.82,g);
  for(const s2 of [-1,1]){part(G.box,VM.light,.35,.2,.05,s2*.85,1.0,3.8,g);part(G.box,VX.glass,.03,.6,.9,s2*1.16,2.15,2.6,g);}part(G.box,VX.trim,2.3,.25,6.9,0,.7,-.5,g);
  if(kind==='lorry'){const side=new THREE.MeshLambertMaterial({map:lorryTex});part(G.box,LMat('#5a3b22'),2.4,.12,5.2,0,1.3,-1.1,g);for(const s2 of [-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(.08,1.1,5.2),side);m.position.set(s2*1.18,1.9,-1.1);g.add(m);}
    const b=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.1,.08),[side,side,side,side,new THREE.MeshLambertMaterial({map:lorryBack}),new THREE.MeshLambertMaterial({map:lorryBack})]);b.position.set(0,1.9,-3.7);g.add(b);part(G.box,LMat('#c0392b'),2.4,1.1,.08,0,1.9,1.5,g);
    for(let i=0;i<3;i++){const sk=part(G.box,LMat(['#2f6f3a','#8a6a44','#2d5fb8'][i]),.9,.6,1.2,(i-1)*.7,1.66,-1.5+i*.9,g);sk.rotation.y=i*.3;}}
  else if(kind==='tanker'){part(G.box,VX.trim,1.6,.3,5.4,0,1.15,-1.1,g);const t=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,5.2,20),envd(new THREE.MeshPhongMaterial({color:0xdfe2e6,shininess:110,specular:0x777777}),.4));t.rotation.x=Math.PI/2;t.position.set(0,2.15,-1.1);t.castShadow=true;g.add(t);
    for(const z of [-3.2,-1.1,1.0]){const r=new THREE.Mesh(new THREE.TorusGeometry(1.06,.05,6,20),LMat('#c8102e'));r.position.set(0,2.15,z);g.add(r);}part(G.box,VX.chrome,.4,.12,.4,0,3.25,-1.1,g);for(const s2 of [-1,1])part(G.box,LMat('#c8102e'),.02,.3,3.4,s2*1.06,2.15,-1.1,g);}
  else if(kind==='tow'){part(G.box,LMat('#3a3b40'),2.3,.15,4.4,0,1.3,-1.6,g);for(const s2 of [-1,1])part(G.box,LMat('#f2b705'),.1,.25,4.4,s2*1.12,1.45,-1.6,g);tube(g,0,1.5,-2.9,0,3.0,-4.0,.1,LMat('#f2b705'));tube(g,0,3.0,-4.0,0,1.6,-4.5,.03,VX.trim);part(G.box,VX.chrome,.15,.25,.1,0,1.5,-4.5,g);
    part(G.box,LMat('#ff9a1a'),.6,.16,.3,0,2.95,2.4,g);g.userData.beacon=true;}
  else if(kind==='fire'){const red=cab;part(G.box,red,2.4,2.0,5.4,0,1.95,-1.1,g);for(const s2 of [-1,1]){for(let i=0;i<3;i++)part(G.box,VX.chrome,.02,1.5,1.4,s2*1.21,1.85,-3.0+i*1.7,g);part(G.box,LMat('#f4f4f2'),.02,.16,5.4,s2*1.215,1.0,-1.1,g);}
    for(const s2 of [-.45,.45])part(G.box,VX.chrome,.07,.07,6.2,s2,3.15,-.9,g);for(let z=-3.8;z<2.2;z+=.4)part(G.box,VX.chrome,.9,.05,.05,0,3.15,z,g);
    const r=part(G.box,VM.sirR,.6,.16,.3,-.4,2.95,2.6,g),bl=part(G.box,VM.sirR,.6,.16,.3,.4,2.95,2.6,g);g.userData.lights=[r,bl];const reel=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.3,14),LMat('#8a8d93'));reel.rotation.z=Math.PI/2;reel.position.set(0,2.0,-3.85);g.add(reel);}
  truckDetails(g);return wheels2(g,[[-1.1,.5,2.7],[1.1,.5,2.7],[-1.1,.5,-2.0],[1.1,.5,-2.0],[-1.1,.5,-3.0],[1.1,.5,-3.0]],WG.heavy);}
const WGX={trac:wheelGeo(.75,.42,.45),tracF:wheelGeo(.42,.24,.28),small:wheelGeo(.22,.16,.14),atv:wheelGeo(.3,.28,.17)};
function buildTractor(g,colorMat){const b=paint(colorMat||mpick(['#d0101e','#1f6fb5','#2f8a3a','#f07c1a']));const blk=LMat('#222326');
  sideBody([[-.3,.6],[1.75,.6],[1.8,1.0],[1.65,1.35],[.2,1.4],[-.3,1.3]],1.0,b,g,.08,2);part(G.box,VX.grille,.9,.55,.05,0,.95,1.82,g);for(const s2 of [-1,1])part(G.box,VM.light,.14,.14,.06,s2*.3,1.25,1.8,g);
  part(G.box,blk,1.1,.35,1.3,0,.75,-.95,g);part(G.box,b,1.0,.12,1.0,0,1.05,-.95,g);const seat=part(G.box,VX.seatC,.5,.12,.45,0,1.55,-1.05,g);part(G.box,VX.seatC,.5,.45,.1,0,1.8,-1.3,g);
  part(G.box,blk,.06,.6,.06,0,1.6,-.45,g);const wh=new THREE.Mesh(new THREE.TorusGeometry(.2,.025,8,18),blk);wh.position.set(0,1.95,-.5);wh.rotation.x=-1.0;g.add(wh);
  tube(g,.3,1.35,.9,.3,2.6,.9,.05,VX.chrome);for(const s2 of [-1,1]){const fe=new THREE.CylinderGeometry(.82,.82,.5,18,1,true,0,Math.PI);fe.rotateZ(Math.PI/2);const fm=b.clone();fm.side=THREE.DoubleSide;const f=new THREE.Mesh(fe,fm);f.position.set(s2*.75,.75,-1.0);g.add(f);}
  platePart(g,true,.36,.12,.02,0,.65,-1.66);return wheels2(g,[[-.62,.42,1.25],[.62,.42,1.25]],WGX.tracF).concat(wheels2(g,[[-.82,.75,-1.0],[.82,.75,-1.0]],WGX.trac));}
function buildScooter(g,colorMat){const b=paint(colorMat||mpick(['#f2f2ee','#c8102e','#1b6fd6','#3aa66b','#f2b705','#1c1c20']));
  part(G.box,b,.42,.75,.12,0,.85,.48,g).rotation.x=-.25;part(G.box,LMat('#2a2b30'),.36,.08,.75,0,.42,0,g);const body=new THREE.Mesh(G.sph,b);body.scale.set(.24,.24,.48);body.position.set(0,.62,-.42);body.castShadow=true;g.add(body);
  const seat=new THREE.Mesh(G.sph,BIKEM.seat);seat.scale.set(.14,.06,.34);seat.position.set(0,.86,-.38);g.add(seat);tube(g,0,.4,.62,0,1.12,.45,.03,VX.chrome);tube(g,-.3,1.12,.45,.3,1.12,.45,.018,VX.chrome);
  const hl=new THREE.Mesh(new THREE.CylinderGeometry(.08,.07,.06,12),b);hl.rotation.x=Math.PI/2;hl.position.set(0,1.05,.52);g.add(hl);part(G.cyl,VM.light,.06,.02,.06,0,1.05,.555,g).rotation.x=Math.PI/2;
  for(const sx of [-1,1]){tube(g,sx*.22,1.12,.45,sx*.26,1.3,.42,.008,VX.chrome);part(G.cyl,VX.glass,.045,.012,.045,sx*.26,1.32,.42,g).rotation.x=Math.PI/2;}part(G.box,VM.tail,.12,.05,.04,0,.78,-.86,g);platePart(g,false,.2,.1,.02,0,.6,-.88);
  guard(g,b,.58,.26,Math.PI*.1,Math.PI*.65);return wheels2(g,[[0,.24,.58],[0,.24,-.62]],WGX.small);}
function buildAtv(g,colorMat){const b=paint(colorMat||mpick(['#d0101e','#f2b705','#3aa66b','#1c1c20']));part(G.box,LMat('#2a2b30'),.7,.25,1.5,0,.55,0,g);const t=new THREE.Mesh(G.sph,b);t.scale.set(.42,.18,.7);t.position.set(0,.85,.1);g.add(t);
  for(const z of [.65,-.65]){const f=part(G.box,b,1.15,.08,.55,0,.72,z,g);}const seat=new THREE.Mesh(G.sph,BIKEM.seat);seat.scale.set(.16,.07,.4);seat.position.set(0,1.0,-.3);g.add(seat);
  tube(g,0,.9,.5,0,1.2,.42,.03,VX.chrome);tube(g,-.35,1.2,.42,.35,1.2,.42,.02,VX.chrome);part(G.box,VM.light,.3,.08,.04,0,.85,.95,g);platePart(g,false,.2,.1,.02,0,.62,-.96);
  return wheels2(g,[[-.5,.3,.65],[.5,.3,.65],[-.5,.3,-.65],[.5,.3,-.65]],WGX.atv);}
function buildGolf(g){const w2=LMat('#f4f4f2'),gr=LMat('#2f8a3a');part(G.box,w2,1.2,.35,2.3,0,.5,0,g);part(G.box,w2,1.15,.4,.6,0,.8,.85,g);part(G.box,gr,1.0,.12,.5,0,.85,-.25,g);part(G.box,gr,1.0,.5,.1,0,1.1,-.5,g);
  for(const sx of [-.5,.5])for(const z of [.65,-.75])part(G.box,VX.chrome,.04,1.3,.04,sx,1.5,z,g);part(G.box,w2,1.25,.06,1.7,0,2.15,-.05,g);part(G.box,VX.glass,1.0,.6,.03,0,1.5,.68,g);
  const wh=new THREE.Mesh(new THREE.TorusGeometry(.14,.02,8,16),LMat('#222'));wh.position.set(-.3,1.15,.4);wh.rotation.x=-1.0;g.add(wh);part(G.box,LMat('#5a3b22'),.3,.6,.3,0,.95,-.95,g);
  return wheels2(g,[[-.55,.22,.75],[.55,.22,.75],[-.55,.22,-.75],[.55,.22,-.75]],WGX.small);}
function buildErick(g){const gr=paint(mpick(['#1f8a4c','#2d5fb8','#c8102e'])),blk=LMat('#2a2b30');part(G.box,blk,1.2,.12,2.6,0,.45,0,g);part(G.box,gr,1.25,.45,1.5,0,.75,-.45,g);part(G.box,VX.seatC,1.15,.12,.45,0,1.05,-.6,g);part(G.box,VX.seatC,1.15,.12,.45,0,1.05,-.05,g);
  part(G.box,gr,.5,.55,.25,0,.8,.95,g);tube(g,0,.5,1.15,0,1.25,1.05,.03,VX.chrome);tube(g,-.3,1.25,1.05,.3,1.25,1.05,.018,VX.chrome);part(G.cyl,VM.light,.07,.03,.07,0,1.0,1.1,g).rotation.x=Math.PI/2;
  for(const sx of [-.6,.6])for(const z of [1.0,-1.2])part(G.box,VX.chrome,.035,1.25,.035,sx,1.55,z,g);const roof=part(G.box,LMat('#1d1e22'),1.35,.08,2.4,0,2.2,-.1,g);part(G.box,VX.glass,.9,.5,.03,0,1.75,1.05,g);platePart(g,true,.3,.1,.02,0,.55,-1.32);
  const d=new THREE.Group();part(G.sph,VM.skin,.16,.19,.17,0,1.62,.85,d);part(G.box,paint('#d9d4c4'),.45,.5,.28,0,1.25,.85,d);g.add(d);g.userData.driver=d;return wheels2(g,[[0,.28,1.15],[-.6,.28,-.8],[.6,.28,-.8]],WG.auto);}
// state bus liveries (Beta v1.01.12): a feature sets vehLivery to {body, band, text} before a bus is built
let vehLivery=null;const LIVTEX=new Map();
function liveryTex(L){const k=L.body+L.band+L.text;if(LIVTEX.has(k))return LIVTEX.get(k);const t=canvasTex(512,128,x=>{x.fillStyle=L.body;x.fillRect(0,0,512,128);x.fillStyle=L.band;x.fillRect(0,82,512,20);x.fillRect(0,8,512,4);
  for(let i=0;i<9;i++){x.fillStyle='#1d2a34';x.fillRect(14+i*55,16,46,56);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(16+i*55,18,18,52);}if(L.text){x.fillStyle=L.textC||L.body;x.font='bold 17px sans-serif';x.textAlign='center';x.fillText(L.text,256,98);}},false);LIVTEX.set(k,t);return t;}
const busSide=canvasTex(512,128,x=>{x.fillStyle='#b8202a';x.fillRect(0,0,512,128);x.fillStyle='#f3efe6';x.fillRect(0,92,512,14);for(let i=0;i<9;i++){x.fillStyle='#1d2a34';x.fillRect(14+i*55,14,46,58);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(16+i*55,16,18,54);}},false);
const truckBox=canvasTex(256,128,x=>{const c=mpick(['#2f6fb5','#e0a21b','#2d8a4e','#b5432f']);x.fillStyle=c;x.fillRect(0,0,256,128);x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=3;for(let i=12;i<256;i+=22){x.beginPath();x.moveTo(i,0);x.lineTo(i,128);x.stroke();}x.fillStyle='#ffe066';x.font='800 22px "Baloo 2", sans-serif';x.fillText('BHARAT TRANSPORT',22,70);},false);
function buildVeh(type,colorMat){if(SPEC[type]&&SPEC[type].build){const g0=SPEC[type].build(colorMat);g0.userData.wheels=g0.userData.wheels||[];return g0;}const g=new THREE.Group();let w;g.userData={};
  if(type==='cycle'){const f=colorMat||mpick([VM.red,VM.blue,VM.black,VM.green]);part(G.box,f,.05,.05,1.05,0,.72,0,g);part(G.box,f,.05,.62,.05,0,.6,-.18,g);part(G.box,f,.05,.6,.05,0,.65,.44,g);part(G.box,VM.black,.56,.04,.04,0,1.05,.5,g);part(G.box,VM.seat,.16,.06,.26,0,.98,-.2,g);
    w=wheels2(g,[[0,.34,.6],[0,.34,-.6]],WG.cycle);}
  else if(type==='rickshaw'){part(G.box,VM.black,.07,.07,1.4,0,.8,.7,g);part(G.box,VM.seat,.2,.06,.3,0,1.02,.85,g);part(G.box,paint(mpick(['#2d5fb8','#1f8a4c','#6d1a2a'])),1.3,.5,.8,0,.85,-.55,g);part(G.box,VM.seat,1.2,.15,.6,0,1.15,-.55,g);
    const hood=new THREE.Mesh(new THREE.SphereGeometry(.75,12,6,0,Math.PI,0,Math.PI/2),LMat('#2a2a2a'));hood.rotation.y=Math.PI/2;hood.scale.set(1,1.2,.9);hood.position.set(0,1.3,-.75);hood.castShadow=true;g.add(hood);
    w=wheels2(g,[[0,.34,1.35],[-.68,.34,-.55],[.68,.34,-.55]],WG.cycle);}
  else if(type==='bike'||type==='sportsbike'){const sp=type==='sportsbike';const b=paint(colorMat?colorMat:sp?mpick(['#d0101e','#1b6fd6','#f2b705','#1f8a4c']):mpick(['#1c1c20','#c8102e','#6d1a2a','#2d5fb8']));buildBike(g,b,sp);
    w=wheels2(g,[[0,.34,.72],[0,.34,-.68]],WG.moto);}
  else if(type==='auto'){const body=colorMat?paint(colorMat):Math.random()<.7?paint('#1f8a4c'):paint(mpick(['#1c1c20','#2d5fb8']));const yel=paint('#f6c90e');
    part(G.box,body,1.5,.42,2.9,0,.62,-.05,g);const nose=new THREE.Mesh(G.sph,body);nose.scale.set(.72,.62,.55);nose.position.set(0,1.05,1.05);nose.castShadow=true;g.add(nose);
    const cg=new THREE.CylinderGeometry(.86,.86,2.75,16,1,false,Math.PI/2,Math.PI);cg.rotateX(Math.PI/2);cg.scale(1,.42,1);const cano=new THREE.Mesh(cg,yel);cano.position.set(0,2.0,-.1);cano.castShadow=true;g.add(cano);
    part(G.box,VX.canvas,1.72,1.2,.08,0,1.48,-1.43,g);part(G.box,yel,1.74,.14,2.78,0,2.0,-.1,g);
    for(const [x,z] of [[-.8,1.05],[.8,1.05],[-.8,-1.35],[.8,-1.35]])part(G.box,VX.trim,.06,1.45,.06,x,1.4,z,g);
    part(G.box,VX.glass,1.25,.7,.04,0,1.8,1.32,g);part(G.box,VM.seat,1.38,.45,.65,0,1.08,-.78,g);part(G.sph,VM.light,.15,.15,.08,0,1.15,1.58,g);part(G.box,VM.tail,.22,.11,.05,-.58,.75,-1.52,g);part(G.box,VM.tail,.22,.11,.05,.58,.75,-1.52,g);platePart(g,true,.42,.13,.03,0,.55,-1.53);
    const d=new THREE.Group();part(G.sph,VM.skin,.17,.2,.18,0,1.8,.42,d);part(G.sph,VM.hair,.18,.11,.18,0,1.9,.4,d);part(G.box,paint('#d9d4c4'),.5,.55,.3,0,1.35,.42,d);g.add(d);g.userData.driver=d;
    const pax=new THREE.Group();part(G.box,VM.red,.5,.5,.3,0,1.38,-.78,pax);part(G.sph,VM.skin,.16,.19,.17,0,1.82,-.78,pax);pax.visible=false;g.add(pax);g.userData.pax=pax;
    w=wheels2(g,[[0,.3,1.18],[-.8,.3,-.95],[.8,.3,-.95]],WG.auto);}
  else if(['taxi','car','suv','police','sports','sedan'].includes(type)||(SPEC[type]&&SPEC[type].car)){w=buildCar(type,colorMat,g);}
  else if(type==='tractor'){w=buildTractor(g,colorMat);}else if(type==='scooter'){w=buildScooter(g,colorMat);}else if(type==='atv'){w=buildAtv(g,colorMat);}else if(type==='golfcart'){w=buildGolf(g);}else if(type==='erickshaw'){w=buildErick(g);}
  else if(type==='bus'){w=buildBus(g,vehLivery);}
  else if(SPEC[type]&&SPEC[type].truck){w=buildTruck2(g,SPEC[type].truck);}
  else{const cab=paint(mpick(['#e8761e','#d9483b','#2f6fb5']));const box=new THREE.MeshLambertMaterial({map:truckBox});
    sideBody([[1.4,.6],[3.75,.6],[3.8,1.6],[3.55,2.75],[1.4,2.8]],2.3,cab,g,.1);part(G.box,VX.glass,2.0,.85,.05,0,2.15,3.72,g);part(G.box,VX.trim,2.4,.3,.25,0,.7,3.75,g);part(G.box,VX.grille,1.4,.45,.05,0,1.2,3.82,g);
    part(G.box,VM.light,.35,.2,.05,-.85,1.0,3.8,g);part(G.box,VM.light,.35,.2,.05,.85,1.0,3.8,g);
    const cargo=new THREE.Mesh(new THREE.BoxGeometry(2.4,2.5,5.2),[box,box,LMat('#5a3b22'),LMat('#3b2a1c'),box,box]);cargo.position.set(0,2.0,-1.1);cargo.castShadow=true;g.add(cargo);part(G.box,VX.trim,2.3,.25,6.9,0,.7,-.5,g);
    const back=new THREE.Mesh(new THREE.PlaneGeometry(2.3,2.4),new THREE.MeshLambertMaterial({map:hornTex}));back.position.set(0,2.0,-3.71);back.rotation.y=Math.PI;g.add(back);
    truckDetails(g);w=wheels2(g,[[-1.1,.5,2.7],[1.1,.5,2.7],[-1.1,.5,-2.0],[1.1,.5,-2.0],[-1.1,.5,-3.0],[1.1,.5,-3.0]],WG.heavy);}
  g.userData.wheels=w;bakeVeh(g);return g;}
function bakeVeh(g){const keep=new Set(g.userData.wheels||[]);if(g.userData.lights)g.userData.lights.forEach(m=>keep.add(m));const by=new Map();
  for(const c of g.children.slice()){if(!c.isMesh||keep.has(c)||Array.isArray(c.material)||c.material.transparent||c.material.map)continue;c.updateMatrix();const geo=c.geometry.clone();geo.applyMatrix4(c.matrix);if(!geo.index){}const k=c.material.uuid;if(!by.has(k))by.set(k,{mat:c.material,geos:[]});by.get(k).geos.push(geo);g.remove(c);}
  for(const {mat,geos} of by.values()){const m=new THREE.Mesh(merge(geos),mat);m.castShadow=true;g.add(m);}}
const vehicles=[];
const headL=new THREE.SpotLight(0xfff1c8,0,70,.55,.6,1),headT=new THREE.Object3D();headL.target=headT;scene.add(headL);scene.add(headT);
// the same seed builds the same-looking vehicle on every device (shared traffic, Beta v1.01.16)
function withSeed(seed,f){const R=Math.random;let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};try{return f();}finally{Math.random=R;}}
function makeVeh(type,x,z,h,state='parked',opts={}){const seed=opts.seed!=null?opts.seed:(Math.random()*4294967295)>>>0;const m=withSeed(seed,()=>{const o=vehLivery;if(opts.livery)vehLivery=opts.livery;try{return buildVeh(type,opts.colorMat);}finally{vehLivery=o;}});m.position.set(x,0,z);m.rotation.y=h;scene.add(m);
  const v={m,seed,type,spec:SPEC[type],v:0,h,steer:0,pos:m.position,state,owned:false,hp:opts.hp!=null?opts.hp:100,fuel:opts.fuel!=null?opts.fuel:MR(35,95),stopT:0,blockT:0,lane:null,ai:null,dead:false,fallen:false,lean:0,smokeT:0,company:!!opts.company};
  if(!m.userData.driver&&(state==='traffic'||state==='net'||state==='svc'))addDriver(v);
  if(m.userData.driver)m.userData.driver.visible=state==='traffic'||state==='net'||state==='svc';vehicles.push(v);return v;}
// Beta v1.01.26: every vehicle on the road has someone driving it — car and bus drivers sit behind the wheel (on the right,
// Indian style), the cycle-rickshaw wallah pedals, the tractor driver sits up high.
const DRV_SHIRTS=['#f4f1ea','#2f7fc1','#3aa66b','#e8a628','#8b5e3c','#5c6b8a','#d9483b','#9b4fb5'];
function addDriver(v){const sp=v.spec;if(!sp||sp.two||sp.animal||sp.fly||sp.boat||sp.rail)return;let r;
  if(sp.pedal&&sp.seat){r=buildPerson(mpick(DRV_SHIRTS),{seated:true,female:false});const st=sp.seat;r.position.set(0,st[1]-.62,st[2]);r.userData.legs.forEach(l=>l.rotation.x=-1.15);r.userData.arms.forEach(a=>a.rotation.x=-1);r.userData.pedal=true;}
  else if(sp.fp){const fp=sp.fp;r=buildPerson(mpick(DRV_SHIRTS),{seated:true,female:Math.random()<.12});const head=fp[1]-.2;r.position.set(fp[0],head-1.73,fp[2]-.12);r.userData.legs.forEach(l=>l.rotation.x=-1.5);r.userData.sitK=-.85;r.userData.arms.forEach(a=>a.rotation.x=-.95);}
  else return;v.m.add(r);v.m.userData.driver=r;}
function removeVeh(v){scene.remove(v.m);const i=vehicles.indexOf(v);if(i>=0)vehicles.splice(i,1);}
function segDist(px,pz,v){const fx=Math.sin(v.h),fz=Math.cos(v.h),half=Math.max(0,v.spec.len/2-v.spec.wid/2);let t=(px-v.pos.x)*fx+(pz-v.pos.z)*fz;t=clamp(t,-half,half);const qx=v.pos.x+fx*t,qz=v.pos.z+fz*t,dx=px-qx,dz=pz-qz;return{d:Math.hypot(dx,dz),dx,dz};}

/* lanes */
function laneOff(l){const e=l.e;return e.multi?(l.k?e.laneI:e.laneO):e.lane;}
function lanePos(l,out){const e=l.e;const bx=e.ax+e.dx*l.s,bz=e.az+e.dz*l.s;const fx=e.dx*l.dir,fz=e.dz*l.dir;const off=l.off!=null&&l.oe===e?l.off:laneOff(l);out.x=bx+fz*off;out.z=bz-fx*off;out.h=Math.atan2(fx,fz);return out;}
const _lp={x:0,z:0,h:0};
function placeLane(v){lanePos(v.lane,_lp);v.pos.set(_lp.x,v.lane.e.fly?flyY(v.lane.e,v.lane.s):0,_lp.z);v.h=_lp.h;v.m.rotation.y=v.h;}
function nextLane(l){const e=l.e;const r=e.road;const nk=e.k+(l.dir>0?1:-1);const ne=r.edges.find(q=>q.k===nk);if(ne&&!ne.blocked){l.e=ne;l.s=l.dir>0?0:ne.len;return;}
  const px=l.dir>0?e.bx:e.ax,pz=l.dir>0?e.bz:e.az;const cand=[];for(const ox of [-RH,0,RH])for(const oz of [-RH,0,RH])for(const id of edgesNear(px+ox,pz+oz)){const q=EDGES[id];if(q===e||q.blocked||q.kind==='bridge'&&q.road.name.includes('Haji'))continue;
    if(Math.hypot(q.ax-px,q.az-pz)<14)cand.push([q,1]);else if(Math.hypot(q.bx-px,q.bz-pz)<14)cand.push([q,-1]);}
  if(cand.length){const hx=e.dx*l.dir,hz=e.dz*l.dir;const ok=cand.filter(([q,d])=>q.road!==e.road||q.k!==e.k?(q.dx*d*hx+q.dz*d*hz)>-.5:false);const pool=ok.length?ok:cand;
    // mostly carry on straight or turn gently; the busier the turn, the less likely
    const w=pool.map(([q,d])=>.3+Math.max(0,q.dx*d*hx+q.dz*d*hz)*1.4+(q.road===e.road?1.2:0));let r=Math.random()*w.reduce((a,b)=>a+b,0),i=0;while(i<w.length-1&&(r-=w[i])>0)i++;const [q,d]=pool[i];l.e=q;l.dir=d;l.s=d>0?0:q.len;return;}l.dir=-l.dir;l.dead=true;}
function randomLaneNear(cx,cz,rmin,rmax){for(let k=0;k<25;k++){const a=Math.random()*6.283,r=MR(rmin,rmax);const x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;const ids=edgesNear(x,z);if(!ids.length)continue;const e=EDGES[mpick(ids)];if(e.blocked||e.road.name.includes('Haji'))continue;
  const l={e,dir:Math.random()<.5?1:-1,s:MR(e.stopA||0,e.stopB!=null?e.stopB:e.len)};lanePos(l,_lp);const d=Math.hypot(_lp.x-cx,_lp.z-cz);if(d>=rmin*.8&&d<=rmax*1.1)return l;}return null;}
const TT=['taxi','taxi','taxi','car','car','car','sedan','bus','truck','auto','auto','auto','bike','bike','suv','cycle','mpv','mpv','van','scooter','scooter','pickup','ambulance'];
const TTOWN=['auto','auto','bike','bike','bike','car','truck','bus','suv','cycle','rickshaw','sedan','scooter','scooter','erickshaw','erickshaw','tractor','pickup','lorry','van','mpv'];
const HWMIX=['truck','truck','lorry','lorry','tanker','bus','bus','car','sedan','suv','mpv','pickup','bike','taxi'];
function trafficTypeAt(x,z){const zz=zoneAt(x,z);if(!zz)return mpick(HWMIX);if(zz.id==='mumbai')return mpick(TT);return mpick(TTOWN);}
// Beta v1.01.24: traffic speeds (km/h = speed × 2.4). Highways: 60-70 km/h in the left lane, 75-95 in the right lane.
// Town and city streets: 40-55 km/h. Slow vehicles (tractors, cycles, rickshaws) keep their own pace.
function botSpeed(l,sp,type){const hw=l.e.kind!=='city'&&l.e.kind!=='service';const cap=sp.max*.95;if(sp.max<20)return Math.min(cap,MR(sp.max*.6,sp.max*.85));
  if(hw)return Math.min(cap,l.k?MR(31,40):(type==='bus'||type==='truck'||type==='lorry'||type==='tanker'?MR(25,28):MR(26,30)));return Math.min(cap,MR(17,23));}
// slow vehicles (buses, trucks, autos, two-wheelers, tractors) keep to the left lane; cars use the right lane to overtake
function slowType(t){const sp=SPEC[t];return !sp||sp.two||sp.max<20||/bus|truck|auto|tractor|tempo|rickshaw|cart|lorry|tanker/.test(t);}
function spawnTraffic(far){const pp=ppos();const l=randomLaneNear(pp.x,pp.z,far?90:20,330);if(!l)return null;if(l.e.deadEnd&&Math.random()<.85)return null;   // v1.01.22: little traffic near dead ends
  lanePos(l,_lp);let type=trafficTypeAt(_lp.x,_lp.z);if((type==='cycle'||type==='rickshaw')&&l.e.kind!=='city'&&l.e.kind!=='service')type=Math.random()<.5?'scooter':'bike';const sp=SPEC[type];l.slow=slowType(type);l.k=l.e.multi&&!l.slow&&Math.random()<.4?1:0;l.fast=!!l.k;l.vmax=botSpeed(l,sp,type)*(l.e.kind==='city'?1:1.6);
  vehLivery=type==='bus'&&hooks.livery?hooks.livery(_lp.x,_lp.z):null;const v=makeVeh(type,0,0,0,'traffic');vehLivery=null;v.lane=l;v.v=l.vmax;placeLane(v);if(v.spec.two)addRider(v);return v;}
const riderMat=['#d9483b','#2f7fc1','#e8a628','#3aa66b','#f4f1ea'].map(c=>LMat(c));
function addRider(v){const r=buildPerson(mpick(pedCols),{seated:true});const U=r.userData;U.legs.forEach((l,i)=>{l.rotation.x=-1.2;l.rotation.z=(i?1:-1)*.1;});U.arms.forEach(a=>a.rotation.x=-.95);const seat=(v.spec.seat||[0,.95,-.2]);r.position.set(0,seat[1]-.62,seat[2]);
  if(v.type!=='cycle'){const h=new THREE.Mesh(G.sph,mpick([VM.black,VM.red,VM.white,VM.blue]));h.scale.set(.17,.16,.19);h.position.set(0,1.75,0);r.add(h);}v.m.add(r);v.m.userData.driver=r;}

/* ================= player ================= */
/* ---------- people: human proportions, faces, hands and shoes ---------- */
const lathe=(prof,seg=14)=>new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p[0],p[1])),seg);
// Beta v1.01.23: a sloping trapezius from the shoulders to the neck (no flat 'shelf'), and a slimmer waist
const PG={torsoM:lathe([[0,.87],[.214,.87],[.21,.98],[.194,1.06],[.212,1.18],[.232,1.3],[.238,1.37],[.222,1.42],[.18,1.465],[.115,1.5],[.07,1.52],[0,1.525]],18),
  torsoF:lathe([[0,.87],[.222,.87],[.22,.98],[.172,1.07],[.19,1.16],[.212,1.26],[.214,1.33],[.2,1.4],[.16,1.445],[.1,1.48],[.062,1.5],[0,1.505]],18),
  hips:lathe([[0,.78],[.19,.78],[.204,.84],[.206,.9],[0,.91]]),kurta:lathe([[0,.5],[.262,.5],[.236,.78],[.216,1.0],[.212,1.08],[0,1.09]]),
  saree:lathe([[0,.05],[.29,.05],[.262,.4],[.226,.76],[.204,.98],[0,1.0]]),mundu:lathe([[0,.12],[.215,.12],[.218,.5],[.212,.96],[0,.97]]),
  neck:new THREE.CylinderGeometry(.05,.056,.14,10),head:new THREE.SphereGeometry(1,12,9),cap:new THREE.SphereGeometry(1,12,7,0,Math.PI*2,0,Math.PI*.4),
  eye:new THREE.SphereGeometry(1,6,4),box:new THREE.BoxGeometry(1,1,1),cone:new THREE.ConeGeometry(1,1,6),leg:new THREE.CylinderGeometry(.088,.062,.8,10),thigh:new THREE.CylinderGeometry(.09,.072,.43,10),shin:new THREE.CylinderGeometry(.07,.058,.4,10),knee:new THREE.SphereGeometry(.073,9,7),elbow:new THREE.SphereGeometry(.058,8,6),
  sleeve:new THREE.CylinderGeometry(.072,.062,.3,10),fore:new THREE.CylinderGeometry(.054,.044,.31,9),hand:new THREE.SphereGeometry(1,9,7),ring:new THREE.TorusGeometry(1,.14,5,14),ring4:new THREE.TorusGeometry(1,.14,4,4).rotateZ(Math.PI/4),cyl:new THREE.CylinderGeometry(1,1,1,10),bun:new THREE.SphereGeometry(1,9,7)};
const SKIN=['#5c3a24','#7b4a2e','#8d5524','#a0673f','#b97a4f','#c68642','#d19a6a','#e3b98f'],HAIRC=['#141010','#1e1612','#2b1d14','#3a2a20','#5a3a24','#8a8580','#d8d4cc','#7a2e1a'],SHOES=['#2a1d14','#1b1b1d','#5a3b22','#6b6b6b','#f1f1f1'];
const PANTS=['#2d3142','#4a4e57','#3b3024','#1f3a5f','#e9e4d6','#2c4a7a'],SAREE=['#c2185b','#f57c00','#1565c0','#2e7d32','#f9a825','#6a1b9a','#00838f','#d84315','#e9e0c8'];
const LOOKS={male:{hair:['short','side','curly','spiky','buzz','long','bald']},female:{hair:['braid','bun','ponytail','open','bob','short']},face:['oval','round','square','long','heart'],beard:['none','stubble','moustache','full','goatee','handlebar'],build:['slim','average','athletic','broad','heavy'],height:['short','average','tall'],specs:['none','round','square','sun'],hat:['none','cap','turban','topi'],nose:['small','medium','big'],brows:['thin','normal','thick']};
const BUILDK=b=>b==='slim'?.92:b==='broad'?1.1:b==='heavy'?1.16:b==='athletic'?1.04:1;
const shade=(c,k)=>{const C=new THREE.Color(c);C.multiplyScalar(k);return '#'+C.getHexString();};
const mixc=(a,b,t)=>{const A=new THREE.Color(a);A.lerp(new THREE.Color(b),t);return '#'+A.getHexString();};
function cgeo(geo,col,sx,sy,sz,x,y,z,rx=0,rz=0){const g=geo.clone();g.scale(sx,sy,sz);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);g.translate(x,y,z);const n=g.attributes.position.count,c=new Float32Array(n*3),C=new THREE.Color(col);for(let i=0;i<n;i++){c[i*3]=C.r;c[i*3+1]=C.g;c[i*3+2]=C.b;}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;}
function mergeC(list){let vc=0,ic=0;for(const g of list){vc+=g.attributes.position.count;ic+=g.index?g.index.count:g.attributes.position.count;}const pos=new Float32Array(vc*3),nor=new Float32Array(vc*3),col=new Float32Array(vc*3),idx=new Uint32Array(ic);let vo=0,io=0;
  for(const g of list){pos.set(g.attributes.position.array,vo*3);nor.set(g.attributes.normal.array,vo*3);col.set(g.attributes.color.array,vo*3);if(g.index){const a=g.index.array;for(let i=0;i<a.length;i++)idx[io++]=a[i]+vo;}else for(let i=0;i<g.attributes.position.count;i++)idx[io++]=vo+i;vo+=g.attributes.position.count;g.dispose();}
  const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.BufferAttribute(pos,3));o.setAttribute('normal',new THREE.BufferAttribute(nor,3));o.setAttribute('color',new THREE.BufferAttribute(col,3));o.setIndex(new THREE.BufferAttribute(idx,1));o.computeBoundingSphere();return o;}
const PEDMAT=new THREE.MeshLambertMaterial({vertexColors:true});const PMAT=new Map();const pm=c=>{if(!PMAT.has(c))PMAT.set(c,LMat(c));return PMAT.get(c);};
// a part: [role, geometry, colour, sx,sy,sz, x,y,z, rx, rz]. Roles group parts into meshes for the player (so outfits and looks can recolour them).
// The head: skull and jaw (face shape), ears, nose, eyes with irises, eyebrows, lips, hair style and beard.
function headParts(L,skin,hair,female){const H=1.71,o=[];const s=(r,g,c,sx,sy,sz,x,y,z,rx,rz)=>o.push([r,g,c,sx,sy,sz,x,y,z,rx||0,rz||0]);const lip=mixc(shade(skin,.78),'#a0404a',.35);
  s('skin',PG.neck,skin,1,1,1,0,1.535,0);s('skin',PG.head,skin,.106,.12,.114,0,H+.012,-.006);
  if(L.face==='round')s('skin',PG.head,skin,.1,.078,.1,0,H-.048,.012);else if(L.face==='square')s('skin',PG.head,skin,.1,.07,.098,0,H-.055,.012,0,0),s('skin',PG.head,skin,.075,.04,.08,0,H-.09,.03);else if(L.face==='long')s('skin',PG.head,skin,.086,.1,.094,0,H-.066,.016);else if(L.face==='heart')s('skin',PG.head,skin,.082,.08,.094,0,H-.062,.02),s('skin',PG.head,skin,.1,.05,.1,0,H-.02,.01);else s('skin',PG.head,skin,.09,.084,.096,0,H-.056,.016);
  for(const sx of [-1,1]){s('skin',PG.head,skin,.017,.031,.024,sx*.106,H-.004,-.004);s('eyeW',PG.eye,'#f4f1ea',.02,.012,.008,sx*.04,H+.012,.101);s('eyeD',PG.eye,'#1a1210',.0095,.0095,.006,sx*.04,H+.012,.108);
    s('hair',PG.box,hair,.038,L.brows==='thick'?.013:L.brows==='thin'?.006:.009,.012,sx*.041,H+.037,.104,0,-sx*.12);s('skin',PG.eye,shade(skin,.9),.021,.004,.007,sx*.04,H+.0245,.103);if(female)s('gold',PG.eye,'#e0b23a',.008,.008,.008,sx*.108,H-.035,.004);}
  {const nk=L.nose==='big'?1.3:L.nose==='small'?.8:1;s('skin',PG.head,skin,.011*nk,.026*nk,.016*nk,0,H-.018,.111);s('skin',PG.head,shade(skin,.96),.015*nk,.012*nk,.014*nk,0,H-.038,.115);for(const sx of [-1,1])s('eyeD',PG.eye,shade(skin,.45),.004*nk,.003,.003,sx*.007*nk,H-.045,.122);}s('lip',PG.head,lip,.029,.0085,.01,0,H-.074,.099);
  if(female&&L.bindi!==false)s('red',PG.eye,'#c8102e',.0075,.0075,.004,0,H+.035,.115);
  // hair
  const st=L.hair||'short',capS=st==='buzz'?[.11,.124,.118]:st==='curly'?[.124,.134,.13]:[.117,.13,.124];
  if(st!=='bald'){s('hair',PG.cap,hair,capS[0],capS[1],capS[2],0,H+.008,-.008);s('hair',PG.head,hair,.104,.1,.088,0,H+.01,-.042);if(!female)for(const sx of [-1,1])s('hair',PG.box,hair,.01,.04,.03,sx*.103,H+.0,.02);}else s('hair',PG.head,hair,.108,.035,.1,0,H-.015,-.04);
  if(st==='side')s('hair',PG.box,hair,.15,.032,.055,-.01,H+.09,.078,0,.16);
  if(st==='curly')for(let i=0;i<16;i++){const a=i/16*6.28;s('hair',PG.bun,hair,.034,.034,.034,Math.cos(a)*.1,H+.07+(i%2)*.03,Math.sin(a)*.1-.01);}
  if(st==='spiky')for(let i=0;i<7;i++)s('hair',PG.cone,hair,.03,.06,.03,(i-3)*.03,H+.13,(i%2?.02:-.03),(i%2?.3:-.3),(i-3)*.12);
  if(st==='long'||st==='open')s('hair',PG.box,hair,st==='open'?.22:.2,st==='open'?.38:.2,.06,0,H-(st==='open'?.18:.09),-.095);
  if(st==='open')for(const sx of [-1,1])s('hair',PG.box,hair,.03,.22,.06,sx*.1,H-.08,-.02);
  if(st==='bob')s('hair',PG.head,hair,.122,.11,.122,0,H-.02,-.02);
  if(st==='bun')s('hair',PG.bun,hair,.06,.058,.058,0,H+.01,-.135);
  if(st==='ponytail'){s('hair',PG.bun,hair,.04,.04,.04,0,H+.02,-.125);s('hair',PG.cyl,hair,.03,.24,.03,0,H-.1,-.15,.18);}
  if(st==='braid')for(let i=0;i<7;i++)s('hair',PG.bun,hair,.034-i*.002,.04,.03,0,H-.04-i*.065,-.125-i*.006);
  // beard
  if(!female){const b=L.beard;if(b==='stubble')s('beard',PG.head,mixc(skin,hair,.5),.097,.07,.1,0,H-.064,.02);
    if(b==='full'){s('beard',PG.head,hair,.096,.07,.097,0,H-.07,.02);s('beard',PG.box,hair,.05,.012,.014,0,H-.062,.107);}
    if(b==='moustache')s('beard',PG.box,hair,.052,.013,.014,0,H-.062,.107);}
  if(!female&&L.beard==='goatee'){s('beard',PG.head,hair,.03,.035,.03,0,H-.1,.088);s('beard',PG.box,hair,.045,.01,.013,0,H-.062,.107);}
  if(!female&&L.beard==='handlebar'){s('beard',PG.box,hair,.05,.012,.014,0,H-.062,.107);for(const sx of [-1,1])s('beard',PG.box,hair,.012,.026,.012,sx*.03,H-.056,.104,0,sx*.6);}
  // spectacles: round, square or sunglasses, with arms back to the ears
  if(L.specs&&L.specs!=='none'){const fr=L.specs==='sun'?'#111114':L.specsC||'#2a2522',rg=L.specs==='square'?PG.ring4:PG.ring;for(const sx of [-1,1]){s('specs',rg,fr,.024,.019,.03,sx*.04,H+.01,.115);if(L.specs==='sun')s('specs',PG.eye,'#1b1f26',.022,.016,.004,sx*.04,H+.01,.114);s('specs',PG.box,fr,.004,.004,.1,sx*.064,H+.016,.065);}s('specs',PG.box,fr,.018,.004,.004,0,H+.016,.116);}
  // headwear: cricket cap, a Rajasthani or Sikh turban, a Gandhi topi
  if(L.hat==='cap'){const hc=L.hatC||'#2d6cdf';s('hat',PG.cap,hc,.122,.07,.13,0,H+.05,-.005);s('hat',PG.box,hc,.15,.01,.09,0,H+.06,.12);}
  if(L.hat==='turban'){const hc=L.hatC||'#e8572a';for(let i=0;i<4;i++)s('hat',PG.ring,hc,.118-i*.006,.118-i*.006,.12,0,H+.055+i*.03,-.01,Math.PI/2+(i%2?.12:-.1));s('hat',PG.head,hc,.11,.06,.115,0,H+.14,-.01);if(L.female===false&&Math.random()<.4)s('hat',PG.box,hc,.05,.16,.02,.02,H-.03,-.13);}
  if(L.hat==='topi'){s('hat',PG.box,'#f4f1ea',.2,.05,.12,0,H+.105,-.005);s('hat',PG.box,'#f4f1ea',.19,.03,.02,0,H+.14,-.005);}
  return o;}
// the body: torso shape (man or woman), shoulders, collar, hips and belt, and the clothes: shirt and trousers, kurta,
// mundu, saree with pallu, salwar kameez with dupatta, or jeans and a top
function bodyParts(L,c){const o=[];const s=(r,g,col,sx,sy,sz,x,y,z,rx,rz)=>o.push([r,g,col,sx,sy,sz,x,y,z,rx||0,rz||0]);const k=BUILDK(L.build),sh=L.build==='athletic'?1.14:1;
  s('shirt',L.female?PG.torsoF:PG.torsoM,c.shirt,k,1,.6*k,0,0,0);for(const sx of [-1,1])s('shirt',PG.head,c.shirt,.078*k*sh,.062*sh,.072*sh,sx*.228*k*sh,1.415,0);if(L.build==='heavy')s('shirt',PG.head,c.shirt,.2,.17,.15,0,1.08,.035);if(L.build==='athletic')s('shirt',PG.head,c.shirt,.2,.12,.12,0,1.33,.02);
  s('shirt',PG.box,shade(c.shirt,.9),.14,.028,.03,0,1.497,.07);s('pants',PG.hips,c.pants,k,1,.62*k,0,0,0);
  if(c.dress==='shirt'&&!L.female)s('belt',PG.cyl,'#3a2a1c',.219*k,.028,.134*k,0,.885,0);
  if(c.dress==='kurta'||c.dress==='salwar')s('shirt',PG.kurta,c.shirt,k,1,.66*k,0,0,0);
  if(c.dress==='mundu')s('pants',PG.mundu,c.pants,k,1,.64*k,0,0,0);
  if(c.dress==='saree'){s('pants',PG.saree,c.pants,k,1,.7*k,0,0,0);s('pants',PG.box,c.pants,.2,.66,.02,.03,1.18,.135*k,0,-.55);s('pants',PG.box,c.pants,.2,.6,.02,.08,1.12,-.13*k,0,.4);s('pants',PG.box,c.pants,.22,.025,.13,0,.99,0);}
  if(c.dress==='salwar')for(const sx of [-1,1])s('dupatta',PG.box,c.dup,.06,.42,.02,sx*.09,1.3,.13*k,0,sx*.32);
  // clothing details: shirt pocket and buttons, t-shirt print, saree border, a watch, a bag
  if(c.dress==='shirt'){s('shirt',PG.box,shade(c.shirt,.88),.06,.06,.01,-.09,1.32,.128*k);for(let i=0;i<4;i++)s('btn',PG.eye,'#f2efe8',.007,.007,.004,0,1.42-i*.11,.135*k-.004*i);}
  if(c.dress==='tee'&&c.print)s('print',PG.box,c.print,.16,.12,.01,0,1.28,.132*k);
  if(c.dress==='saree')s('trim',PG.cyl,'#d9a93a',.292*k,.03,.212*k,0,.08,0);
  if(c.dress==='kurta')s('trim',PG.box,shade(c.shirt,.82),.025,.24,.01,0,1.36,.133*k);
  if(c.bag){s('bag',PG.box,shade(c.bag,.8),.025,.62,.012,.02,1.18,.132*k,0,-.62);s('bag',PG.box,c.bag,.2,.16,.07,.2*k,.92,.05);}
  return o;}
function pickClothes(female,shirtC){const r=Math.random();if(female){if(r<.5)return{dress:'saree',shirt:shirtC,pants:mpick(SAREE)};if(r<.85)return{dress:'salwar',shirt:mpick(SAREE),pants:mpick(['#f4f1ea','#e9e0c8','#d9c9a2','#2d3142']),dup:mpick(SAREE)};return{dress:'top',shirt:shirtC,pants:'#2c4a7a'};}
  if(r<.18)return{dress:'kurta',shirt:mpick(['#f4f1ea','#e9e0c8','#cfe3f0',shirtC]),pants:mpick(['#f4f1ea','#e9e4d6','#2d3142'])};if(r<.28)return{dress:'mundu',shirt:shirtC,pants:mpick(['#f4f1ea','#efe6cf'])};return{dress:r<.45?'tee':'shirt',shirt:shirtC,pants:mpick(PANTS),print:Math.random()<.6?mpick(['#ffffff','#1a1a1a','#ffc93c','#e4572e','#2f7fc1']):null};}
function randomLook(female){const old=Math.random()<.15,r=Math.random();return{female,face:mpick(LOOKS.face),hair:old&&!female&&Math.random()<.4?'bald':mpick(female?LOOKS.female.hair.slice(0,5):LOOKS.male.hair.slice(0,6)),beard:female?'none':mpick(['none','none','stubble','moustache','full','goatee','handlebar']),
  build:mpick(['slim','average','average','athletic','broad','heavy']),bindi:Math.random()<.6,hairC:old?mpick(['#8a8580','#d8d4cc','#9a9590']):Math.random()<.06?'#7a2e1a':mpick(HAIRC.slice(0,5)),specs:old&&Math.random()<.6?mpick(['round','square']):Math.random()<.16?mpick(['round','square','sun']):'none',
  hat:!female&&r<.07?'turban':!female&&r<.13?'cap':!female&&r<.15?'topi':'none',hatC:mpick(['#e8572a','#f4c430','#c8102e','#f4f1ea','#2d6cdf','#ff8fd0','#1f8a4c']),nose:mpick(LOOKS.nose),brows:mpick(LOOKS.brows)};}
// One person = a body piece, two legs and two arms (5 draws), each part coloured per vertex. opts.mats keeps separate materials (the player, so outfits and looks can recolour it).
/* Knees and elbows (Beta v1.01.25): every person has a knee and an elbow joint. Code that only swings the hips and shoulders
   still looks right, because the joints follow by themselves: a leg that is lifted forward past ~45° (sitting, riding) bends its
   knee so the shin hangs down; a walking leg bends its knee while it swings forward and straightens while it carries the weight;
   arms keep a slight natural bend. Set userData.jointLock=true to pose the joints yourself. */
let RIGF=0;
function jointRig(g,legs,knees,arms,fores){const st=[0,0],amp=[.3,.3];let last=-1;
  const run=()=>{if(last===RIGF)return;last=RIGF;const U=g.userData;if(U.jointLock)return;
    for(let i=0;i<2;i++){const th=legs[i].rotation.x,d=th-st[i];st[i]=th;let kt;
      if(th<-.75)kt=Math.min(1.75,-th-.05+(U.sitK||0));else{amp[i]=Math.max(.15,amp[i]*.995,Math.abs(th));kt=d<-1e-4?.12+.95*amp[i]*(1-Math.min(1,Math.abs(th)/amp[i])*.6):d>1e-4?.08+Math.max(0,th)*.35:.04;}
      knees[i].rotation.x+=(kt-knees[i].rotation.x)*.35;
      if(U.armLock)continue;const a=arms[i].rotation.x;const et=a<-.7?-.35-Math.min(.6,(-a-.7)*.4):a<-.15?-.2+a*.4:-.18-Math.max(0,a)*.25;fores[i].rotation.x+=(et-fores[i].rotation.x)*.35;}};
  const hook=m=>{m.onBeforeRender=run;};knees.forEach(k=>k.children.forEach(hook));}
function buildPerson(shirt,opts={}){const g=new THREE.Group();const shirtC=typeof shirt==='string'?shirt:'#'+shirt.color.getHexString();
  const female=opts.female!=null?opts.female:!opts.mats&&Math.random()<.4;const L=opts.look||randomLook(female);L.female=female;
  const skin=opts.skin||L.skin||mpick(SKIN),hair=L.hairC||mpick(HAIRC.slice(0,5)),shoe=female?mpick(['#5a3b22','#c9a46a','#8a2a2a']):mpick(SHOES);
  const c=opts.clothes?Object.assign({},opts.clothes):opts.mats?{dress:'shirt',shirt:shirtC,pants:'#2d3142'}:pickClothes(female,shirtC);if(opts.seated&&c.dress==='saree')c.dress='kurta';if(!opts.mats&&Math.random()<.18)c.bag=mpick(['#3a2a1c','#1f3a5f','#8a2a2a','#2d3142']);const legC=c.dress==='saree'||c.dress==='mundu'?c.pants:c.pants;
  const k=BUILDK(L.build);const sleeveC=c.shirt,armSkin=c.dress==='kurta'||c.dress==='salwar'?c.shirt:skin;
  const parts=bodyParts(L,c).concat(headParts(L,skin,hair,female));const legs=[],arms=[],knees=[],fores=[];let body=null,hairM=null,headG=null;
  const watch=!opts.mats&&Math.random()<.3;const armParts=sx=>[['shirt',PG.sleeve,sleeveC,1,1,1,0,-.15,0],['shirt',PG.elbow,sleeveC,1,1,1,0,-.3,0]],foreParts=sx=>[['skin',PG.fore,armSkin,1,1,1,0,-.15,0],...(watch&&sx<0?[['watch',PG.cyl,'#2a2522',.05,.025,.05,0,-.27,0]]:[]),['skin',PG.hand,skin,.048,.062,.034,0,-.345,.004],['skin',PG.hand,skin,.017,.03,.017,-sx*.032,-.32,.025]];
  const legParts=[['pants',PG.thigh,legC,1,1,1,0,-.215,0],['pants',PG.knee,legC,1,1,1,0,-.42,0]],shinParts=[['pants',PG.shin,legC,1,1,1,0,-.2,0],['shoe',PG.head,shoe,.058,.045,.118,0,-.398,.04],['shoe',PG.box,shade(shoe,.7),.115,.022,.24,0,-.432,.04]];
  if(opts.mats){const M2={shirt,pants:opts.legM||pm(legC),skin:opts.skinM||LMat(skin),hair:opts.hairM||LMat(hair)};M2.beard=M2.hair;
    const mk=(list,parent)=>{const by=new Map();for(const q of list){const key=M2[q[0]]?q[0]:q[2];if(!by.has(key))by.set(key,[]);by.get(key).push(q);}const out={};
      for(const [key,l] of by){const geo=merge(l.map(([r,gg,cc,sx,sy,sz,x,y,z,rx,rz])=>{const t=gg.clone();t.scale(sx,sy,sz);if(rx)t.rotateX(rx);if(rz)t.rotateZ(rz);t.translate(x,y,z);return t;}));const m=new THREE.Mesh(geo,M2[key]||pm(key));m.castShadow=true;parent.add(m);out[key]=m;}return out;};
    const bodyM=mk(parts.filter(q=>!['skin','hair','beard','eyeW','eyeD','lip','red','gold'].includes(q[0])),g);body=bodyM.shirt;g.userData.hips=bodyM.pants;
    headG=new THREE.Group();g.add(headG);const hm=mk(headParts(L,skin,hair,female),headG);hairM=hm.hair;
    for(const sx of [-1,1]){const lp=new THREE.Group();lp.position.set(sx*.1*k,.86,0);const lm=mk(legParts,lp);const kn=new THREE.Group();kn.position.y=-.42;const km=mk(shinParts,kn);lp.add(kn);kn.userData.pants=km.pants;g.add(lp);legs.push(lp);knees.push(kn);
      const ap=new THREE.Group();ap.position.set(sx*.285*k,1.44,0);ap.rotation.z=sx*.05;const am=mk(armParts(sx),ap);const fo=new THREE.Group();fo.position.y=-.3;mk(foreParts(sx),fo);ap.add(fo);g.add(ap);arms.push(ap);fores.push(fo);}
    jointRig(g,legs,knees,arms,fores);
    g.userData={legs,arms,knees,fores,body,head:body,hair:hairM||{visible:true},legM:M2.pants,female,skinM:M2.skin,hairM:M2.hair,headG,hips:bodyM.pants,belt:bodyM['#3a2a1c'],look:L,mk,M2};return g;}
  body=new THREE.Mesh(mergeC(parts.map(q=>cgeo(q[1],q[2],q[3],q[4],q[5],q[6],q[7],q[8],q[9],q[10]))),PEDMAT);body.castShadow=true;g.add(body);
  const cm=(list,parent)=>{const m=new THREE.Mesh(mergeC(list.map(q=>cgeo(q[1],q[2],q[3],q[4],q[5],q[6],q[7],q[8]))),PEDMAT);m.castShadow=true;parent.add(m);return m;};
  for(const sx of [-1,1]){const lp=new THREE.Group();lp.position.set(sx*.1*k,.86,0);cm(legParts,lp);const kn=new THREE.Group();kn.position.y=-.42;cm(shinParts,kn);lp.add(kn);g.add(lp);legs.push(lp);knees.push(kn);
    const ap=new THREE.Group();ap.position.set(sx*.285*k,1.44,0);ap.rotation.z=sx*.05;cm(armParts(sx),ap);const fo=new THREE.Group();fo.position.y=-.3;cm(foreParts(sx),fo);ap.add(fo);g.add(ap);arms.push(ap);fores.push(fo);}
  jointRig(g,legs,knees,arms,fores);
  g.scale.setScalar(L.height==='tall'?1.05:L.height==='short'?.94:opts.kid?MR(.6,.72):MR(.93,1.07));
  g.userData={legs,arms,knees,fores,body,head:body,hair:{visible:true},legM:pm(legC),female};return g;}
const avatar=buildPerson(LMat('#e8573e'),{mats:true,female:false,skin:'#a0673f'});scene.add(avatar);avatar.visible=false;
const AU=avatar.userData;
const gunMeshes={bat:part(G.box,LMat('#c99a5b'),.09,.09,1.1,0,-.3,.45,AU.fores[1]),lathi:part(G.box,LMat('#7a5232'),.05,.05,1.6,0,-.3,.5,AU.fores[1]),knife:part(G.box,LMat('#c9ced6'),.03,.05,.32,0,-.32,.2,AU.fores[1]),pistol:part(G.box,VM.black,.1,.16,.4,0,-.32,.18,AU.fores[1]),shotgun:part(G.box,VM.black,.1,.12,1.1,0,-.3,.5,AU.fores[1]),smg:part(G.box,LMat('#2b2d33'),.1,.2,.62,0,-.32,.3,AU.fores[1]),rifle:part(G.box,LMat('#5a3b22'),.08,.12,1.35,0,-.3,.6,AU.fores[1])};
const grp=(parent,list)=>{const g=new THREE.Group();for(const [geo,m,sx,sy,sz,x,y,z,rz] of list){const q=part(geo,m,sx,sy,sz,x,y,z,g);if(rz)q.rotation.z=rz;}parent.add(g);return g;};
const outfitParts={kurta:(()=>{const m=new THREE.Mesh(PG.kurta,LMat('#ffffff'));m.scale.set(1.05,1,.7);avatar.add(m);return m;})(),saree:(()=>{const m=new THREE.Mesh(PG.saree,LMat('#ffffff'));m.scale.set(1.04,1,.74);avatar.add(m);return m;})(),
  pallu:(()=>{const m=part(G.box,LMat('#ffffff'),.2,.68,.022,.03,1.18,.142,avatar);m.rotation.z=-.55;return m;})(),
  glasses:grp(avatar,[[G.box,VM.black,.17,.012,.01,0,1.735,.113],[G.box,LMat('#20262e'),.056,.03,.006,-.04,1.722,.114],[G.box,LMat('#20262e'),.056,.03,.006,.04,1.722,.114],[G.box,VM.black,.008,.01,.11,-.104,1.73,.06],[G.box,VM.black,.008,.01,.11,.104,1.73,.06]]),
  cap:grp(avatar,[[G.sph,LMat('#2d6cdf'),.124,.07,.13,0,1.79,-.005],[G.box,LMat('#2d6cdf'),.15,.012,.1,0,1.79,.13]]),
  helmet:part(G.sph,VM.black,.155,.155,.165,0,1.745,0,avatar),sneakers:[part(G.box,LMat('#ffffff'),.13,.075,.27,0,-.4,.045,AU.knees[0]),part(G.box,LMat('#ffffff'),.13,.075,.27,0,-.4,.045,AU.knees[1])]};
const player={mode:'drive',veh:null,pos:new THREE.Vector3(2940,0,8736),h:Math.PI/2,v:0,shake:0,anim:0,fireCd:0,arrestT:0,coolT:0,stars:0,hitCd:0,run:false,knock:0};
const ppos=()=>player.mode==='drive'&&player.veh?player.veh.pos:player.pos;
// Beta v2.02.00: more weapons (lathi, knife, SMG, rifle); dmg = damage to a police jeep (it has 100), hit = blows to knock a person down
const WEAP={fist:{name:'Fists',range:1.9,rate:.45,melee:true,hit:1},bat:{name:'Cricket bat',range:2.6,rate:.55,melee:true,hit:2},lathi:{name:'Lathi',range:2.8,rate:.5,melee:true,hit:2},knife:{name:'Knife',range:1.8,rate:.33,melee:true,hit:3},pistol:{name:'Pistol',range:60,rate:.32,ammo:'pistol',dmg:25},shotgun:{name:'Shotgun',range:28,rate:.95,ammo:'shotgun',dmg:25,two:true},smg:{name:'SMG',range:42,rate:.11,ammo:'smg',dmg:12,two:true},rifle:{name:'Rifle',range:130,rate:1.1,ammo:'rifle',dmg:60,two:true}};

/* save */
// Beta v2.05.00: Badshah starts broke (₹500, on foot); Multiplayer starts with the admin's start cash and an auto
function newSave(){return{v:3,name:'',age18:false,cash:STORY?500:CFG.startCash,bank:0,health:100,hunger:80,bladder:80,energy:85,weapons:['fist'],ammo:{pistol:0,shotgun:0,smg:0,rifle:0},armour:0,weapon:'fist',
  cars:STORY?[]:[{type:'auto',fuel:80,hp:100,puc:0,ins:0}],homes:[],pos:null,inCar:0,trips:0,lic:{two:false,lmv:false,heavy:false},helmet:false,
  outfit:{top:'shirt',topCol:'#e8573e',botCol:'#2d3142',shoes:'chappal',glasses:false,cap:false},look:null,wardrobe:['shirt'],furniture:{},phone:'smart',challans:[],
  ratings:{},jobs:{},discovered:{},ach:{},daily:{last:'',streak:0},story:{step:0,done:false},biz:[],rent:{},seenVersion:'',robbedAt:-99,stats:{km:0,lions:0,trips:0,earned:0,fines:0},extra:{}};}
// Test play (testers and admins): a separate save, so real progress is never touched. Switched in Profile.
// Beta v2.03.00: Badshah story mode has its own save and is played offline (no online, no gimmick vehicles)
const STORY=store.get('ib.mode')==='story';window.IB_STORY=STORY;
const TESTMODE=store.get('ib.testmode')===true,SAVEKEY=TESTMODE?(STORY?'ib.save.storytest':'ib.save.test'):STORY?'ib.save.story':'ib.save.v3';
let P=store.get(SAVEKEY);const hadSave=!!P;
if(!P){const old=store.get('bb.save.v2');P=newSave();if(old){P.cash=old.cash||P.cash;P.bank=old.bank||0;P.weapons=old.weapons||P.weapons;P.ammo=Object.assign(P.ammo,old.ammo||{});P.homes=(old.homes||[]).filter(h=>W.homes.some(x=>x.id===h));
  P.cars=(old.cars||['auto']).map(t=>({type:SPEC[t]?t:'auto',fuel:80,hp:100,puc:0,ins:0}));P.trips=old.trips||0;}}
P=Object.assign(newSave(),P);for(const k of ['ammo','lic','outfit','stats','story','daily'])P[k]=Object.assign(newSave()[k],P[k]||{});
let dirty=false,lastSave=0;
function save(){if(!startedOnce){store.set(SAVEKEY,P);return;}if(player.mode==='drive'&&player.veh){P.pos={x:player.veh.pos.x,z:player.veh.pos.z,h:player.veh.h};P.inCar=player.veh.owned?player.veh.ownedIdx:null;}else if(!inside){P.pos={x:player.pos.x,z:player.pos.z,h:player.h};P.inCar=null;}
  for(const v of ownedVeh)if(v&&P.cars[v.ownedIdx]){const c=P.cars[v.ownedIdx];c.fuel=Math.round(v.fuel*10)/10;c.hp=Math.round(v.hp);c.x=Math.round(v.pos.x);c.z=Math.round(v.pos.z);c.h=+v.h.toFixed(2);}
  P.savedAt=Date.now();store.set(SAVEKEY,P);dirty=false;emit('save');}

/* owned vehicles */
const ownedVeh=[];
function spawnOwned(i,x,z,h){if(ownedVeh[i])removeVeh(ownedVeh[i]);const c=P.cars[i];c.garage=null;const v=makeVeh(c.type,x,z,h,'parked',{fuel:c.fuel,hp:c.hp,colorMat:c.color||undefined});v.owned=true;v.ownedIdx=i;ownedVeh[i]=v;v.locked=!!c.locked;if(P.extra&&P.extra.plate)setPlate(v,P.extra.plate);emit('ownedSpawn',v);
  if(false&&c.neon){const sp=SPEC[c.type];const g=new THREE.PlaneGeometry(sp.wid*1.15,sp.len*1.05);g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:c.neon,transparent:true,opacity:.55,depthWrite:false}));m.position.y=.06;v.m.add(m);}
  return v;}
// Put an owned vehicle away in a home garage: it leaves the street and waits there.
function storeOwned(i,homeId){const v=ownedVeh[i];const c=P.cars[i];if(!c)return;if(v){if(player.veh===v)exitVehicle(true);c.fuel=Math.round(v.fuel);c.hp=Math.round(v.hp);removeVeh(v);ownedVeh[i]=null;}c.x=null;c.z=null;c.garage=homeId;dirty=true;}
function roadSpotNear(p){const r=nearestRoadPoint(p.x,p.z,300);if(!r)return[p.x,p.z,0];const e=r.e;const nx=e.dz,nz=-e.dx;const o=e.w/2+1.4;return[r.x+nx*o,r.z+nz*o,Math.atan2(e.dx,e.dz)];}
// Beta v2.01.00: a free spot by the road for a delivered or bought vehicle: it moves along the kerb past vehicles already
// parked there, so several deliveries line up instead of being stacked on top of each other
function freeRoadSpot(p,skip){const [x,z,h]=roadSpotNear(p);const fx=Math.sin(h),fz=Math.cos(h);for(const k of [0,1,-1,2,-2,3,-3,4,-4,5,-5,6,-6]){const X=x+fx*k*7.5,Z=z+fz*k*7.5;if(k&&!drivable(X,Z))continue;if(!vehicles.some(v=>v!==skip&&v.m&&v.m.parent&&Math.hypot(v.pos.x-X,v.pos.z-Z)<5.5))return[X,Z,h];}return[x,z,h];}

/* ================= pedestrians, cows, wildlife ================= */
const peds=[];const pedCols=['#d9483b','#e8a628','#2f7fc1','#9b4fb5','#3aa66b','#ff6fa8','#f4f1ea','#1f8a8a','#c96a2a','#e9e4d6','#5c6b8a','#8b5e3c','#ffffff','#3c4a5c'];
function pedBlocksNear(x,z){return blocks.filter(b=>b.hasBld&&Math.abs(b.x-x)<230&&Math.abs(b.z-z)<230);}
function edgeXY(p){const off=29.4,b=p.b;if(p.side<2){p.x=b.x+p.t;p.z=b.z+(p.side?off:-off);p.ry=p.dir>0?Math.PI/2:-Math.PI/2;}else{p.z=b.z+p.t;p.x=b.x+(p.side===2?-off:off);p.ry=p.dir>0?0:Math.PI;}}
function placePed(p,minD){const pp=ppos();const bl=pedBlocksNear(pp.x,pp.z);if(!bl.length){p.g.visible=false;p.state='idle';return;}let ok=false;for(let k=0;k<16;k++){p.b=mpick(bl);p.side=Math.floor(Math.random()*4);p.t=MR(-26,26);p.dir=Math.random()<.5?1:-1;edgeXY(p);if(wetNear(p.x,p.z,4))continue;ok=true;if(Math.hypot(p.x-pp.x,p.z-pp.z)>minD)break;}if(!ok){p.g.visible=false;p.state='idle';return;}
  p.state='walk';p.sp=MR(1,1.8);p.g.rotation.set(0,0,0);p.g.visible=true;}
function addPed(){const g=buildPerson(mpick(pedCols),{kid:Math.random()<.07});scene.add(g);const p={g,x:0,z:0,ry:0,state:'walk',ph:Math.random()*6};placePed(p,started?60:0);peds.push(p);return p;}
function setPedCount(n){while(peds.length<n)addPed();while(peds.length>n){const p=peds.pop();scene.remove(p.g);}}
function knockPed(p,crime){if(p.state==='down')return;p.state='down';p.fallT=0;p.hp=null;setTimeout(()=>fleeFrom(p.x,p.z,22),0);p.downT=14;if(crime)addWanted(1,crime);emit('pedDown',p);}
/* Fist fights (Beta v1.01.25): a person takes two or three punches (a bat hits twice as hard), staggers back from each one,
   and some of them fight back. They fall over backwards rather than snapping flat. */
function hitPed(p,dmg,ox,oz){if(p.state==='down')return;if(p.hp==null)p.hp=Math.random()<.35?3:2;p.hp-=dmg;const dx=p.x+(p.ox||0)-ox,dz=p.z+(p.oz||0)-oz,d=Math.hypot(dx,dz)||1;p.ox=(p.ox||0)+dx/d*.55;p.oz=(p.oz||0)+dz/d*.55;
  if(!p.hitOnce){p.hitOnce=true;addWanted(1,'Assault');}if(p.hp<=0){knockPed(p,null);return;}p.state='hit';p.hitT=.5;p.ry=Math.atan2(-dx,-dz);if(p.fighter==null)p.fighter=Math.random()<.3;}
function fleeFrom(x,z,r){for(const p of peds){if(p.state!=='walk'&&p.state!=='flee')continue;if(Math.hypot(p.x-x,p.z-z)<r){p.state='flee';p.fleeT=8;const ex=p.side<2?1:0,ez=1-ex;p.dir=Math.sign(((p.x-x)*ex+(p.z-z)*ez)||1);}}}
function ejectDriver(v){const p=peds.find(q=>q.state==='walk'&&Math.hypot(q.x-ppos().x,q.z-ppos().z)>40)||peds[0];if(!p)return;const sx=Math.cos(v.h),sz=-Math.sin(v.h);p.x=v.pos.x+sx*(v.spec.wid/2+.8);p.z=v.pos.z+sz*(v.spec.wid/2+.8);const a=Math.atan2(p.x-v.pos.x,p.z-v.pos.z);p.vx=Math.sin(a)*5;p.vz=Math.cos(a)*5;p.ry=a;p.state='run';p.runT=6;p.g.visible=true;p.g.rotation.set(0,a,0);}
/* Animals: rounded bodies with painted coats (stripes, spots, patches), proper legs with knees and hooves or paws,
   heads with snouts, ears, eyes and horns, and tails. Used on the streets (cows, buffaloes, goats, dogs, camels,
   monkeys, peacocks), out in the wild (lions, tigers, elephants, deer) and in the open zoos. */
const AMC={};const AMat=(c)=>AMC[c]||(AMC[c]=LMat(c));
const AG={body:new THREE.SphereGeometry(1,16,12).rotateX(Math.PI/2),sph:new THREE.SphereGeometry(1,12,9),leg:new THREE.CylinderGeometry(1,.8,1,8).translate(0,-.5,0),cone:new THREE.ConeGeometry(1,1,8).translate(0,.5,0),cyl:new THREE.CylinderGeometry(1,1,1,8)};
const ATEX={};
function coatTex(kind,base,mark){const key=kind+base+mark;if(ATEX[key])return ATEX[key];const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,256,128);x.fillStyle=mark;
  let r=1;const rnd=()=>(r=(r*9301+49297)%233280)/233280;
  if(kind==='stripes'){for(let i=0;i<16;i++){const y=8+i*7.5+rnd()*3;x.beginPath();x.moveTo(0,y);for(let u=0;u<=256;u+=16)x.lineTo(u,y+Math.sin(u*.05+i)*2.5+(rnd()-.5)*2);for(let u=256;u>=0;u-=16)x.lineTo(u,y+2.2+Math.sin(u*.05+i)*2+(Math.abs(u-128)<40?-2:0));x.fill();}}
  else if(kind==='zebra'){for(let i=0;i<22;i++){const y=4+i*5.6;x.fillRect(0,y,256,2.6);}}
  else if(kind==='spots'){for(let i=0;i<70;i++){x.beginPath();x.arc(rnd()*256,20+rnd()*90,1.5+rnd()*2,0,7);x.fill();}}
  else if(kind==='giraffe'){x.fillStyle=base;x.fillRect(0,0,256,128);x.fillStyle=mark;for(let j=0;j<6;j++)for(let i=0;i<14;i++){const px=i*19+(j%2)*9+rnd()*4,py=j*22+rnd()*4;x.fillRect(px,py,15,18);}}
  else if(kind==='patch'){for(let i=0;i<7;i++){x.beginPath();x.ellipse(rnd()*256,20+rnd()*90,10+rnd()*18,8+rnd()*14,rnd()*3,0,7);x.fill();}}
  else if(kind==='rosette'){for(let i=0;i<60;i++){x.beginPath();x.arc(rnd()*256,10+rnd()*108,2.6,0,7);x.lineWidth=1.6;x.strokeStyle=mark;x.stroke();}}
  const t=new THREE.CanvasTexture(c);return ATEX[key]=new THREE.MeshLambertMaterial({map:t});}
const ASPEC={
  cow:{col:['#efe8dc','#e9e2d4','#d9cbb4','#b98a5a','#8c8a86'],L:1.7,W:.62,H:.7,leg:.8,lr:.08,neck:.5,nAng:1.15,tilt:.45,head:[.24,.26,.44],snout:'#3a2e2a',horns:'up',hump:1,dewlap:1,tail:.8,ears:'side',hoof:1},
  buffalo:{col:['#2b2a2c','#3a3634'],L:1.8,W:.78,H:.78,leg:.66,lr:.1,neck:.4,nAng:1.3,tilt:.4,head:[.27,.27,.46],snout:'#1c1b1c',horns:'back',tail:.7,ears:'side',hoof:1},
  goat:{col:['#f3efe6','#3a2a22','#8a5a36','#1f1c1a'],L:.85,W:.34,H:.4,leg:.46,lr:.04,neck:.3,nAng:.75,tilt:.35,head:[.13,.16,.26],snout:'#2a2522',horns:'small',beard:1,tail:.2,ears:'droop',hoof:1},
  dog:{col:['#c99a5e','#a87442','#2c2723','#e6d8bf'],L:.82,W:.3,H:.34,leg:.42,lr:.045,neck:.24,nAng:.6,head:[.14,.15,.22],snout:'#1b1717',tail:.3,tailUp:1,ears:'up',paw:1,tilt:.15},
  camel:{col:['#c8a06a','#b98d58'],L:1.7,W:.62,H:.7,leg:1.3,lr:.085,neck:1.1,nAng:.35,neckCurve:1,head:[.2,.22,.5],snout:'#7a5a3a',hump:2.2,tail:.5,tilt:.6,ears:'small',hoof:1},
  elephant:{col:['#7d7a78','#6e6a69'],L:2.7,W:1.25,H:1.35,leg:1.25,lr:.27,neck:.2,nAng:.5,head:[.62,.7,.66],snout:'#6a6766',trunk:1,bigEars:1,tusks:1,tail:.9,column:1},
  deer:{col:['#a8642c'],coat:['spots','#a8642c','#f4e6c8'],L:1.05,W:.36,H:.44,leg:.72,lr:.045,neck:.42,nAng:.45,head:[.13,.15,.3],snout:'#1b1717',antlers:1,tail:.18,ears:'up',hoof:1,tilt:.2,belly:'#f1e7d4'},
  zebra:{col:['#f4f2ec'],coat:['zebra','#f4f2ec','#141414'],L:1.5,W:.5,H:.62,leg:.8,lr:.07,neck:.55,nAng:.55,head:[.18,.22,.48],snout:'#1a1a1a',mane:'#141414',tail:.6,ears:'up',hoof:1},
  giraffe:{col:['#e9c27a'],coat:['giraffe','#f1dcae','#b8692f'],L:1.6,W:.55,H:.66,leg:1.9,lr:.07,neck:2.3,nAng:.18,head:[.17,.2,.44],snout:'#6a4a2a',ossi:1,tail:.7,ears:'up',hoof:1},
  rhino:{col:['#8d8a87','#7d7976'],L:2.2,W:.95,H:.95,leg:.62,lr:.18,neck:.25,nAng:1.1,head:[.36,.36,.7],snout:'#6e6b69',horn:1,folds:1,tail:.5,ears:'up',column:1},
  hippo:{col:['#7e6a72','#8a7078'],L:2.2,W:1.05,H:.95,leg:.42,lr:.2,neck:.2,nAng:1.4,head:[.5,.4,.62],snout:'#c99aa3',tail:.25,ears:'small',column:1},
  bear:{col:['#1c1a19','#2a2421'],L:1.3,W:.56,H:.6,leg:.55,lr:.12,neck:.24,nAng:1,head:[.24,.24,.32],snout:'#c9b49a',tail:.05,ears:'round',paw:1,shaggy:1,chest:'#e9e1cf'},
  lion:{col:['#c99a52'],L:1.55,W:.5,H:.56,leg:.72,lr:.09,neck:.3,nAng:.8,head:[.22,.24,.34],snout:'#3a2a1c',mane:'#7a4a22',bigMane:1,tail:.85,tailTuft:'#5a3a1c',ears:'round',paw:1},
  lioness:{col:['#cfa465'],L:1.45,W:.46,H:.52,leg:.72,lr:.085,neck:.3,nAng:.8,head:[.2,.22,.32],snout:'#3a2a1c',tail:.8,tailTuft:'#5a3a1c',ears:'round',paw:1},
  tiger:{col:['#e08a2a'],coat:['stripes','#e08a2a','#1b130e'],L:1.65,W:.5,H:.56,leg:.7,lr:.09,neck:.3,nAng:.8,head:[.23,.24,.34],snout:'#f1e6d2',tail:.9,ears:'round',paw:1,belly:'#f4ead8'},
  leopard:{col:['#d9a650'],coat:['rosette','#d9a650','#2a1c10'],L:1.25,W:.38,H:.42,leg:.6,lr:.06,neck:.26,nAng:.8,head:[.17,.18,.26],snout:'#2a1c10',tail:.9,ears:'round',paw:1},
  monkey:{col:['#8f8a82','#a8754a'],L:.5,W:.22,H:.26,leg:.32,lr:.035,neck:.12,nAng:.4,head:[.11,.12,.11],snout:'#1d1a19',face:'#d9b49a',tail:.55,tailUp:2,ears:'small',paw:1,sit:1},
  croc:{col:['#4f5a32','#5a6338'],L:2.6,W:.5,H:.26,leg:.2,lr:.06,neck:.1,nAng:1.5,head:[.2,.12,.8],snout:'#3e4628',tail:2,ears:'none',sprawl:1,scutes:1},
  peacock:{bird:1,col:['#1a4fb5'],body:'#1a4fb5',neckC:'#1f64d6',tailC:'#2f7d3a',fan:1,L:.42,leg:.5},
  flamingo:{bird:1,col:['#f39ab0'],body:'#f39ab0',neckC:'#f7a9bd',L:.4,leg:1.0,longNeck:1,beak:'#2a2222'}};
function buildAnimal(kind,opt={}){const S=ASPEC[kind]||ASPEC.cow;const g=new THREE.Group();const s=opt.scale||1;const col=opt.col||mpick(S.col);const m=S.coat?coatTex(S.coat[0],S.coat[1],S.coat[2]):AMat(col);const dk=AMat(S.snout||'#222');const eye=AMat('#0d0b0a');
  const ud={legs:[],kind,s,head:null,body:null,tail:null};g.userData=ud;
  if(S.bird){const B=AMat(S.body),N=AMat(S.neckC),lg=AMat(S.flamingo?'#e88aa0':'#8c7a66');const body=part(AG.body,B,.13,.15,.27,0,S.leg+.12,0,g);ud.body=body;
    for(const sx of [-.07,.07]){const p=new THREE.Group();p.position.set(sx,S.leg+.05,0);part(AG.leg,lg,.018,S.leg,.018,0,0,0,p);part(G.box,lg,.06,.02,.12,0,-S.leg,.03,p);g.add(p);ud.legs.push(p);}
    const neck=new THREE.Group();neck.position.set(0,S.leg+.25,.18);g.add(neck);
    if(S.longNeck){part(AG.cyl,N,.04,.5,.04,0,.2,.08,neck).rotation.x=-.5;part(AG.cyl,N,.04,.45,.04,0,.55,.05,neck).rotation.x=.4;const h=part(AG.sph,N,.07,.07,.09,0,.78,.12,neck);part(G.box,AMat(S.beak),.04,.06,.12,0,.74,.22,neck).rotation.x=.6;ud.head=neck;part(G.box,AMat('#1a1a1a'),.5,.12,.5,0,S.leg+.18,-.08,g).scale.set(.24,.1,.3);}
    else{part(AG.cyl,N,.055,.34,.055,0,.15,.04,neck).rotation.x=-.25;part(AG.sph,N,.07,.075,.09,0,.36,.07,neck);part(G.box,AMat('#c9b08a'),.03,.03,.07,0,.35,.16,neck);for(const sx of [-.025,0,.025])part(AG.cyl,N,.006,.1,.006,sx,.46,.06,neck);part(AG.sph,AMat('#f4f4f4'),.02,.02,.02,.045,.38,.1,neck);part(AG.sph,AMat('#f4f4f4'),.02,.02,.02,-.045,.38,.1,neck);ud.head=neck;
      const tail=new THREE.Group();tail.position.set(0,S.leg+.2,-.25);g.add(tail);ud.tail=tail;const tm=AMat(S.tailC),eyeM=AMat('#e0b23a'),eyeB=AMat('#1a3a8a');
      for(let i=0;i<15;i++){const a=(i/14-.5)*2.4;const f=new THREE.Group();f.rotation.set(0,0,a);tail.add(f);part(G.box,tm,.06,1.2,.025,0,.6,0,f);part(AG.sph,eyeM,.07,.08,.02,0,1.15,.012,f);part(AG.sph,eyeB,.035,.04,.02,0,1.15,.02,f);}
      tail.rotation.x=opt.fan===false?-1.45:-.25;if(opt.fan===false)tail.scale.set(.25,1,1);}
    g.castShadow=true;return g;}
  const legH=S.leg*s,L=S.L*s,Wd=S.W*s,Ht=S.H*s,by=legH+Ht*.42;
  const body=part(AG.body,m,Wd/2,Ht/2,L/2,0,by,0,g);ud.body=body;
  if(S.belly)part(AG.body,AMat(S.belly),Wd*.42,Ht*.3,L*.4,0,by-Ht*.22,0,g);
  if(S.chest)part(G.box,AMat(S.chest),Wd*.4,Ht*.18,.04,0,by+Ht*.05,L*.42,g);
  part(AG.sph,m,Wd*.48,Ht*.5,L*.24,0,by+Ht*.02,L*.3,g);part(AG.sph,m,Wd*.5,Ht*.48,L*.24,0,by,-L*.3,g);    // chest and rump
  if(S.hump===1)part(AG.sph,m,Wd*.26,Ht*.32,L*.13,0,by+Ht*.42,L*.28,g);
  if(S.hump===2.2)part(AG.sph,m,Wd*.36,Ht*.42,L*.2,0,by+Ht*.48,0,g);
  if(S.dewlap)part(AG.sph,m,Wd*.12,Ht*.36,L*.16,0,by-Ht*.32,L*.42,g);
  if(S.shaggy)for(let i=0;i<7;i++)part(AG.sph,m,Wd*.3,Ht*.3,L*.2,(Math.random()-.5)*Wd*.6,by+Ht*.25,(i/6-.5)*L*.8,g);
  if(S.folds)for(const zz of [-.18,.18])part(AG.body,AMat('#77736f'),Wd*.51,Ht*.51,.05,0,by,zz*L,g);
  if(S.scutes)for(let i=0;i<9;i++)part(G.box,AMat('#3f4828'),Wd*.6,.05,L*.06,0,by+Ht*.48,(i/8-.5)*L*.85,g);
  // legs: upper and lower with a knee, hooves or paws
  const hx=Wd*.32,hz=L*.36;const sprawl=S.sprawl?Wd*.35:0;
  for(const [x,z,front] of [[-hx,hz,1],[hx,hz,1],[-hx,-hz,0],[hx,-hz,0]]){const p=new THREE.Group();p.position.set(x+Math.sign(x)*sprawl,legH,z);g.add(p);const r=S.lr*s*(front?1:1.08);
    if(S.sprawl){part(AG.leg,m,r,legH,r,0,0,0,p).rotation.z=Math.sign(x)*.7;}
    else if(S.column){part(AG.leg,m,r*1.1,legH,r*1.1,0,0,0,p);part(AG.cyl,AMat('#d8d0c4'),r*1.15,.06,r*1.15,0,-legH+.03,0,p);}
    else{const up=new THREE.Group();p.add(up);part(AG.sph,m,r*1.55,legH*.26,r*1.8,0,legH*.06,0,up);part(AG.leg,m,r*1.15,legH*.56,r*1.15,0,0,0,up);const lo=new THREE.Group();lo.position.y=-legH*.52;up.add(lo);
      part(AG.leg,m,r*.8,legH*.48,r*.8,0,0,0,lo);part(AG.sph,m,r*.9,r*.9,r*.9,0,0,0,lo);
      if(S.hoof)part(AG.cyl,AMat('#2a2420'),r*.95,.08*s,r*1.05,0,-legH*.48+.04,0,lo);if(S.paw)part(AG.sph,m,r*1.1,r*.7,r*1.5,0,-legH*.46,r*.4,lo);p.userData.lo=lo;}
    ud.legs.push(p);}
  // neck and head
  const neck=new THREE.Group();neck.position.set(0,by+Ht*(S.tilt>.3?.06:.18),L*.4);g.add(neck);ud.head=neck;const nl=S.neck*s;
  if(S.neckCurve){part(AG.cyl,m,Wd*.18,nl*.6,Wd*.2,0,nl*.15,nl*.25,neck).rotation.x=1.05;part(AG.cyl,m,Wd*.15,nl*.55,Wd*.17,0,nl*.48,nl*.48,neck).rotation.x=.15;}
  else{const nk=part(AG.cyl,m,Math.max(Wd*.2,S.head[0]*s*.7),nl+.05,Math.max(Wd*.22,S.head[0]*s*.8),0,Math.cos(S.nAng)*nl/2,Math.sin(S.nAng)*nl/2,neck);nk.rotation.x=S.nAng;}
  const hy=S.neckCurve?nl*.78:Math.cos(S.nAng)*nl,hzz=S.neckCurve?nl*.55:Math.sin(S.nAng)*nl+S.head[2]*s*.3;
  const head=new THREE.Group();head.position.set(0,hy,hzz);neck.add(head);const [hw,hh,hl]=S.head.map(v=>v*s);
  part(AG.sph,m,hw,hh,hl*.55,0,0,0,head);const sn=part(AG.sph,S.face?AMat(S.face):m,hw*.72,hh*.62,hl*.42,0,-hh*.25,hl*.45,head);
  part(AG.sph,dk,hw*.55,hh*.4,hl*.12,0,-hh*.28,hl*.82,head);
  for(const sx of [-1,1]){part(AG.sph,eye,hw*.13,hw*.13,hw*.1,sx*hw*.62,hh*.22,hl*.22,head);
    if(S.ears==='side')part(AG.sph,m,hw*.45,hh*.16,hw*.22,sx*hw*1.15,hh*.2,0,head).rotation.z=sx*.3;
    if(S.ears==='droop')part(AG.sph,m,hw*.2,hh*.55,hw*.14,sx*hw*1.0,-hh*.1,0,head).rotation.z=sx*.3;
    if(S.ears==='up')part(AG.cone,m,hw*.28,hh*.75,hw*.12,sx*hw*.55,hh*.55,-hl*.1,head).rotation.z=-sx*.25;
    if(S.ears==='round')part(AG.sph,m,hw*.28,hh*.28,hw*.1,sx*hw*.72,hh*.7,-hl*.12,head);
    if(S.ears==='small')part(AG.sph,m,hw*.18,hh*.18,hw*.1,sx*hw*.75,hh*.55,-hl*.15,head);
    if(S.horns==='up'){const h=part(AG.cone,AMat('#d9cfb8'),hw*.13,hh*1.1,hw*.13,sx*hw*.55,hh*.75,-hl*.1,head);h.rotation.z=-sx*.55;}
    if(S.horns==='back'){const h=part(AG.cone,AMat('#3a3632'),hw*.18,hh*2.2,hw*.15,sx*hw*.8,hh*.5,-hl*.2,head);h.rotation.set(-1.3,0,-sx*1.1);}
    if(S.horns==='small'){const h=part(AG.cone,AMat('#5a4a3a'),hw*.12,hh*.9,hw*.12,sx*hw*.35,hh*.8,-hl*.15,head);h.rotation.x=-.7;}
    if(S.antlers&&opt.male!==false){const a=new THREE.Group();a.position.set(sx*hw*.3,hh*.8,-hl*.1);a.rotation.z=-sx*.35;head.add(a);const am=AMat('#c9b48a');part(AG.cyl,am,.018,.45,.018,0,.22,0,a);part(AG.cyl,am,.014,.22,.014,0,.3,.08,a).rotation.x=.9;part(AG.cyl,am,.012,.2,.012,0,.42,-.04,a).rotation.x=-.6;}
    if(S.bigEars){const e=part(AG.sph,m,hw*.1,hh*.85,hw*.75,sx*hw*.95,hh*.05,-hl*.62,head);e.rotation.y=-sx*.35;}
    if(S.tusks&&opt.male!==false){const t=part(AG.cone,AMat('#f1ead8'),.06*s,.7*s,.06*s,sx*hw*.32,-hh*.5,hl*.5,head);t.rotation.set(2.0,0,sx*.12);}
    if(S.ossi)part(AG.cyl,AMat('#5a3a1c'),.025,.16,.025,sx*hw*.3,hh*.85,-hl*.15,head);}
  if(S.trunk){let tp=head;let y=-hh*.4,zz=hl*.6;for(let i=0;i<6;i++){const seg=new THREE.Group();seg.position.set(0,y,zz);tp.add(seg);part(AG.cyl,m,.17*s*(1-i*.12),.34*s,.17*s*(1-i*.12),0,-.15*s,0,seg);seg.rotation.x=i?(i>3?-.35:-.06):-.5;tp=seg;y=-.3*s;zz=0;}ud.trunk=head.children[head.children.length-1];}
  if(S.horn){part(AG.cone,AMat('#5f5a54'),hw*.22,hh*1.1,hw*.22,0,hh*.05,hl*.78,head).rotation.x=-.35;part(AG.cone,AMat('#5f5a54'),hw*.12,hh*.5,hw*.12,0,hh*.25,hl*.45,head).rotation.x=-.25;}
  if(S.beard)part(AG.cone,AMat('#d9d0c0'),hw*.15,hh*.6,hw*.15,0,-hh*.8,hl*.45,head).rotation.x=Math.PI;
  if(S.mane&&(S.bigMane?opt.male!==false:true)){const mm=AMat(S.mane);if(S.bigMane){part(AG.sph,mm,hw*1.6,hh*1.6,hl*.9,0,-hh*.05,-hl*.35,head);part(AG.sph,mm,Wd*.5,Ht*.6,L*.22,0,hy*.35,hzz*.2,neck);}else for(let i=0;i<5;i++)part(G.box,mm,.05*s,.16*s,.14*s,0,Math.cos(S.nAng)*nl*i/5+.12,Math.sin(S.nAng)*nl*i/5-.05,neck);}
  head.rotation.x=S.tilt!=null?S.tilt:S.nAng>1?.15:-.1;ud.headG=head;
  // tail
  if(S.tail){const tail=new THREE.Group();tail.position.set(0,by+Ht*.25,-L*.5);g.add(tail);ud.tail=tail;const tl=S.tail*s;
    if(S.sprawl){part(AG.cone,m,Wd*.35,tl,Ht*.35,0,0,0,tail).rotation.x=-Math.PI/2;tail.position.y=by;}
    else{const t=part(AG.leg,m,.03*s+(S.column?.02:0),tl,.03*s,0,0,0,tail);tail.rotation.x=S.tailUp===1?-2.0:S.tailUp===2?-2.3:.25;if(S.tailUp===2)part(AG.leg,m,.025*s,tl*.5,.025*s,0,-tl,0,tail).rotation.x=-1.6;if(S.tailTuft)part(AG.sph,AMat(S.tailTuft),.07*s,.12*s,.07*s,0,-tl,0,tail);else if(!S.tailUp)part(AG.sph,AMat(S.snout==='#1b1717'?col:'#2a2420'),.05*s,.1*s,.05*s,0,-tl,0,tail);}}
  if(S.sit){g.userData.sit=true;}
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;}});return g;}
// a gait: legs swing in diagonal pairs, knees bend, the head nods and the tail sways
function animGait(a,now,sp){const U=a.g.userData;const L=U.legs;if(!L.length)return;const f=Math.sin(now*(2+sp*2.4))*Math.min(.55,.15+sp*.12);
  if(L.length===2){L[0].rotation.x=f;L[1].rotation.x=-f;if(U.head)U.head.rotation.x=Math.sin(now*6)*(sp>0?.15:.05);return;}
  L[0].rotation.x=L[3].rotation.x=f;L[1].rotation.x=L[2].rotation.x=-f;for(const l of L)if(l.userData.lo)l.userData.lo.rotation.x=Math.max(0,-l.rotation.x)*1.2;
  if(U.head)U.head.rotation.x=sp>0?Math.sin(now*(4+sp*4))*.05:Math.sin(now*.7)*.12+(a.graze?.6:0);if(U.tail)U.tail.rotation.z=Math.sin(now*2.2)*.25;if(U.trunk)U.trunk.rotation.x=-.5+Math.sin(now*1.3)*.15;}
const animals=[];
// wild animals that live in the forests, deserts and national parks
const FAUNA=[{kind:'lion',x:1800,z:5780,rx:330,rz:200,n:5},{kind:'lioness',x:1800,z:5780,rx:330,rz:200,n:3},{kind:'deer',x:1850,z:5700,rx:300,rz:180,n:5},
  {kind:'tiger',x:6000,z:2150,rx:260,rz:170,n:4},{kind:'deer',x:6000,z:2150,rx:260,rz:170,n:6},{kind:'peacock',x:6020,z:2120,rx:200,rz:140,n:4},
  {kind:'camel',x:1030,z:1310,rx:160,rz:140,n:7},{kind:'camel',x:4220,z:1860,rx:90,rz:70,n:4},{kind:'peacock',x:4220,z:1860,rx:90,rz:70,n:3}];
const STRAYS={def:[['cow',36],['dog',30],['goat',14],['buffalo',12],['monkey',5],['peacock',3]],RJ:[['cow',30],['camel',20],['dog',20],['goat',14],['peacock',8],['monkey',8]],GJ:[['cow',34],['buffalo',16],['dog',24],['goat',12],['camel',8],['peacock',6]],
  KL:[['dog',34],['cow',22],['goat',20],['buffalo',8],['monkey',12],['elephant',4]],GA:[['dog',38],['cow',26],['buffalo',16],['goat',12],['monkey',8]],KA:[['cow',32],['dog',28],['buffalo',14],['goat',12],['monkey',10],['elephant',4]],LD:[['goat',55],['cow',35],['buffalo',10]],TN:[['dog',34],['cow',28],['goat',16],['buffalo',10],['monkey',8],['peacock',4]],PY:[['dog',40],['cow',30],['goat',20],['buffalo',10]],AP:[['cow',30],['buffalo',22],['dog',24],['goat',14],['monkey',6],['peacock',4]],TG:[['buffalo',20],['cow',26],['dog',24],['goat',16],['monkey',10],['peacock',4]],mumbai:[['dog',70],['goat',15],['cow',10],['monkey',5]],
  DL:[['dog',34],['cow',30],['monkey',16],['goat',10],['buffalo',10]],HR:[['buffalo',30],['cow',26],['dog',22],['goat',12],['camel',6],['peacock',4]],PB:[['buffalo',30],['cow',26],['dog',24],['goat',12],['peacock',8]],
  CH:[['dog',50],['cow',30],['monkey',20]],HP:[['dog',30],['goat',30],['cow',20],['monkey',20]],UK:[['dog',28],['cow',24],['goat',24],['monkey',24]],JK:[['dog',38],['goat',30],['cow',22],['monkey',10]],
  LA:[['dog',50],['goat',40],['cow',10]],UP:[['cow',32],['buffalo',20],['dog',24],['goat',12],['monkey',12]],MP:[['cow',30],['buffalo',18],['dog',24],['goat',16],['monkey',8],['peacock',4]],
  CG:[['cow',30],['buffalo',20],['dog',26],['goat',18],['peacock',6]],OD:[['cow',34],['dog',28],['goat',16],['buffalo',14],['monkey',8]]};
// forest zones where wild elephants, deer and monkeys can cross the highway
const FOREST=['thekkady','munnar','kalpetta','madikeri','mollem','chikkamagaluru','sasangir','ranthambore','mountabu','ooty','valparai','kodaikanal','araku','srisailam',
  'ramnagar','mandla','umaria','seoni','pachmarhi','dudhwa','sheopur','panna','baripada','daringbadi','kanker','rishikesh','kondagaon','mainpat'];
const STRAY_SIZE={cow:.9,buffalo:1,goat:.45,dog:.4,camel:1,monkey:.35,peacock:.4,elephant:1.6,deer:.6};
function addFauna(f){for(let i=0;i<f.n;i++){const g=buildAnimal(f.kind,{male:f.kind==='deer'?i%2===0:undefined});g.visible=false;scene.add(g);animals.push({g,kind:f.kind,area:f,x:f.x+MR(-.6,.6)*f.rx,z:f.z+MR(-.6,.6)*f.rz,h:MR(0,6.28),sp:0,t:0,hp:100,state:'ok'});}}
for(const f of FAUNA)addFauna(f);
const strayPool={};const cows=[];let strayT=0;   // "cows" = every animal walking on the streets (kept for traffic stopping)
function getStray(kind){const pl=strayPool[kind]=strayPool[kind]||[];let a=pl.find(q=>!q.active);if(!a){if(cows.length>=12)return null;const g=buildAnimal(kind);g.visible=false;scene.add(g);a={g,kind,x:0,z:0,h:0,active:false,t:0,hp:100,state:'ok'};pl.push(a);cows.push(a);}return a;}
function wpick(list){let tot=0;for(const [,w] of list)tot+=w;let r=Math.random()*tot;for(const [k,w] of list){r-=w;if(r<=0)return k;}return list[0][0];}
const ANAME={cow:'cow',buffalo:'buffalo',goat:'goat',dog:'dog',camel:'camel',monkey:'monkey',peacock:'peacock',elephant:'elephant',deer:'deer',lion:'lion',lioness:'lioness',tiger:'tiger'};
function hurtAnimal(a,impact,how){if(a.state==='down')return;const big=a.kind==='elephant'||a.kind==='camel'||a.kind==='buffalo';a.hp=Math.max(0,a.hp-impact*(big?2.2:4));
  if(a.kind==='elephant'){a.state='angry';a.angryT=8;toast('🐘 You hit an elephant! It is angry · back off!','#ff5d73');emit('animalHit',{kind:a.kind,impact});return;}
  a.state='down';a.downT=a.hp<=0?28:10;a.g.rotation.z=Math.PI/2*(Math.random()<.5?1:-1);a.g.position.y=(STRAY_SIZE[a.kind]||.6)*.35;
  const nm=ANAME[a.kind]||'animal';toast(a.hp<=0?`🚑 You badly hurt a ${nm}. Animal ambulance 1962 is on the way · −₹2,000 fine`:`🐾 You hit a ${nm}! It is hurt · slow down near animals`,'#ff5d73');
  if(a.hp<=0&&!godMode){const fine=2000;if(P.cash>=fine)P.cash-=fine;else P.bank=Math.max(0,P.bank-fine);dirty=true;}
  if(a.kind==='cow'&&impact>6&&zoneAt(ppos().x,ppos().z,200))addWanted(1,'Hit a cow');emit('animalHit',{kind:a.kind,impact});}
function updAnimal(a,dt,now){if(a.state==='down'){a.downT-=dt;if(a.downT<=0){if(a.hp<=0){a.active=false;a.g.visible=false;a.hp=100;a.state='ok';a.g.rotation.z=0;a.g.position.y=0;return false;}a.state='limp';a.limpT=20;a.g.rotation.z=0;a.g.position.y=0;}return true;}
  if(a.state==='limp'){a.limpT-=dt;if(a.limpT<=0){a.state='ok';a.hp=Math.max(a.hp,60);}}
  if(a.state==='angry'){a.angryT-=dt;if(a.angryT<=0)a.state='ok';}return true;}
function updAnimals(dt,now){const pp=ppos();
  for(const a of animals){const near=Math.hypot(a.area.x-pp.x,a.area.z-pp.z)<a.area.rx+500;a.g.visible=near&&!inside;if(!near)continue;if(!updAnimal(a,dt,now)){a.g.visible=true;a.x=a.area.x+MR(-.5,.5)*a.area.rx;a.z=a.area.z+MR(-.5,.5)*a.area.rz;}if(a.state==='down')continue;
    a.t-=dt;if(a.t<=0){a.t=MR(2,6);a.sp=Math.random()<.45?0:MR(.6,1.6);a.graze=a.sp===0&&Math.random()<.5;a.h+=MR(-1.4,1.4);}
    const dx=pp.x-a.x,dz=pp.z-a.z,d=Math.hypot(dx,dz);const cat=a.kind==='lion'||a.kind==='lioness'||a.kind==='tiger';
    if(cat&&d<14&&player.mode==='foot'&&!inside){a.h=Math.atan2(dx,dz);a.sp=4;a.graze=false;if(d<2.2&&player.hitCd<=0){damage(14,a.kind==='tiger'?'A tiger pounced':'A lion swiped at you');player.hitCd=1.2;toast(a.kind==='tiger'?'Tiger! Run!':'Lion! Back to the jeep!','#ff5d73');}}
    else if((a.kind==='deer'||a.kind==='peacock')&&d<18){a.h=Math.atan2(-dx,-dz);a.sp=a.kind==='deer'?6:2.5;a.graze=false;}
    const spd=a.sp*(a.state==='limp'?.4:1);let nx=a.x+Math.sin(a.h)*spd*dt,nz=a.z+Math.cos(a.h)*spd*dt;if(inE(a.area,nx,nz)>1||isWater(nx,nz)){a.h+=Math.PI*.7;}else{a.x=nx;a.z=nz;}
    a.g.position.set(a.x,0,a.z);a.g.rotation.y=a.h;animGait(a,now,spd);}
  const zz=zoneAt(pp.x,pp.z,200);const forest=!zz&&W.zones.some(q=>FOREST.includes(q.id)&&Math.hypot(q.x0+q.nx*40-pp.x,q.z0+q.nz*40-pp.z)<900);
  const list=zz?(zz.id==='mumbai'?STRAYS.mumbai:STRAYS[zz.st]||STRAYS.def):forest?[['elephant',30],['deer',40],['monkey',30]]:null;
  strayT-=dt;if(list&&!inside&&strayT<=0&&cows.filter(c=>c.active).length<(zz?(zz.size==='big'?0:zz.size==='mid'?1:2):forest?5:2)){strayT=MR(1,3)*(zz?3:1);const r=randomLaneNear(pp.x,pp.z,60,200);if(r&&(zz?r.e.kind==='city':r.e.kind!=='city')){const kind=wpick(list);const c=getStray(kind);if(c){lanePos(r,_lp);if(isWater(_lp.x,_lp.z)||wetNear(_lp.x,_lp.z,3)){c.active=false;c.g.visible=false;}else{c.x=_lp.x;c.z=_lp.z;c.h=_lp.h+MR(-.4,.4);c.active=true;c.g.visible=true;c.t=MR(30,80);c.hp=100;c.state='ok';c.g.rotation.set(0,c.h,0);c.g.position.y=0;}}}}
  for(const c of cows){if(!c.active)continue;c.t-=dt;const d=Math.hypot(c.x-pp.x,c.z-pp.z);if(c.state!=='down'&&(c.t<=0&&d>120||d>320)||inside){c.active=false;c.g.visible=false;c.state='ok';c.g.rotation.z=0;continue;}
    if(!updAnimal(c,dt,now))continue;if(c.state==='down')continue;
    if(c.kind==='elephant'&&c.state==='angry'&&player.mode!=='foot'&&d<30){c.h=Math.atan2(pp.x-c.x,pp.z-c.z);}
    else if(Math.random()<.01)c.h+=MR(-.8,.8);
    const base={cow:.35,buffalo:.3,goat:.6,dog:.9,camel:.6,monkey:.8,peacock:.4,elephant:.5,deer:.8}[c.kind]||.4;const sp=c.state==='angry'?3:c.state==='limp'?base*.4:base;
    const nx=c.x+Math.sin(c.h)*sp*dt,nz=c.z+Math.cos(c.h)*sp*dt;if(roadAt(nx,nz)&&!isWater(nx,nz)&&!wetNear(nx,nz,2)){c.x=nx;c.z=nz;}else c.h+=Math.PI/2;c.g.position.set(c.x,0,c.z);c.g.rotation.y=c.h;animGait(c,now,sp);}}

/* ================= Mumbai local train and planes ================= */
const localTrains=[];
function buildTrain(){const g=new THREE.Group();const cm=LMat('#d8d0bf'),stripe=LMat('#7b2a5e');for(let i=0;i<7;i++){part(G.box,cm,3,3.2,11.5,0,2,i*12,g);part(G.box,stripe,3.05,.5,11.6,0,1.2,i*12,g);for(let k=0;k<4;k++)part(G.box,VM.dark,3.08,.9,1.4,0,2.4,i*12-4+k*2.6,g);}g.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(g);return g;}
for(let i=0;i<2;i++){const g=buildTrain();localTrains.push({g,z:i?8800:8150,dir:i?-1:1,wait:0,x:i?2902.2:2897.8});}
const LSTATIONS=[8140,8300,8540,8860];
function updTrains(dt){const pp=ppos();const rush=(clockH>=8&&clockH<11)||(clockH>=17&&clockH<21);localTrains.forEach((t,i)=>{const near=Math.abs(pp.x-2900)<900&&pp.z>7600&&pp.z<9400;t.g.visible=near&&!inside&&(i===0||rush);if(!t.g.visible)return;
  if(t.wait>0){t.wait-=dt;return;}const nz=t.z+t.dir*16*dt;for(const s of LSTATIONS){if((t.z-s)*(nz-s)<0){t.wait=6;}}t.z=nz;if(t.z>8880){t.dir=-1;t.z=8880;t.wait=8;}if(t.z<8080){t.dir=1;t.z=8080;t.wait=8;}
  t.g.position.set(t.x,0,t.z-(t.dir>0?78:0));t.g.rotation.y=0;
  const half=42,cz=t.z+(t.dir>0?-36:36);if(Math.abs(pp.x-t.x)<3.4&&Math.abs(pp.z-cz)<half&&player.hitCd<=0&&!inside){damage(30,'Hit by a local train');player.hitCd=1.5;toast('Stay off the tracks!','#ff5d73');if(player.mode==='drive'&&player.veh){player.veh.v=0;player.veh.hp-=40;player.veh.pos.x+=pp.x<t.x?-5:5;}else player.pos.x+=pp.x<t.x?-5:5;}});}
function updPlanes(dt){const pp=ppos();for(const ap of airportPlanes){const a=ap.a;const d=Math.hypot(a.x-pp.x,a.z-pp.z);if(ap.t<0){ap.next-=dt;if(ap.next<=0&&d<1100){ap.t=0;ap.fly.visible=true;}continue;}
  ap.t+=dt;const T=ap.t;const along=-a.L/2+Math.min(a.L*1.6,2*T*T);const y=T>9?(T-9)*(T-9)*2.2:2.6;ap.fly.position.set(a.x+along,y,a.z);ap.fly.rotation.set(-(T>9?Math.min(.25,(T-9)*.05):0),Math.PI/2,0,'YXZ');
  if(T>32){ap.t=-1;ap.fly.visible=false;ap.next=MR(60,140);}}}

/* ================= police + wanted ================= */
const AGGR={off:0,easy:.6,normal:1,hard:1.5};
function addWanted(n,why){if(CFG.police==="off"||inside||afk)return;const before=player.stars;player.stars=Math.min(5,player.stars+n);player.coolT=0;if(player.stars>before){toast(`${why} · police alerted`,'#ff5d73');emit('stars',player.stars);}renderStars();}
function renderStars(){const el=$('#stars');let h='';for(let i=0;i<5;i++){const on=i<player.stars;h+=`<svg viewBox="0 0 24 24" class="${on?'on':''}"><path d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.7 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z" fill="${on?'#ffc93c':'rgba(255,255,255,.18)'}" stroke="${on?'#7a4a00':'none'}" stroke-width="1"/></svg>`;}el.innerHTML=player.stars?h:'';}
let policeSpawnT=0;
function spawnPolice(){const pp=ppos();const l=randomLaneNear(pp.x,pp.z,110,170);if(!l)return;lanePos(l,_lp);const v=makeVeh('police',_lp.x,_lp.z,Math.atan2(pp.x-_lp.x,pp.z-_lp.z),'police');v.ai={stuck:0,shootT:2};v.hp=100;}
// Beta v2.02.00: hiding (features/hideout.js sets player.hidden = {x,z,safe}). While you hide the police search the area
// instead of driving at you, cannot shoot or arrest you, and the stars cool down faster. A jeep that passes very close may find you.
function updPolice(dt,now){const pp=ppos();const cops=vehicles.filter(v=>v.state==='police');const aggr=AGGR[CFG.police]||0;const hid=player.hidden;
  if(player.stars>0&&!inside){const want=Math.round(Math.min(8,player.stars*(player.stars>=3?2:1.4))*aggr);policeSpawnT-=dt;if(cops.filter(c=>!c.dead).length<want&&policeSpawnT<=0){spawnPolice();policeSpawnT=2.5;}}
  let near=false;
  for(const c of cops){let dx=pp.x-c.pos.x,dz=pp.z-c.pos.z,d=Math.hypot(dx,dz);const realD=d;
    if(hid){if(!c.ai.sx||now>(c.ai.st||0)){const a=Math.random()*6.28,r=hid.safe?MR(60,140):MR(15,70);c.ai.sx=hid.x+Math.cos(a)*r;c.ai.sz=hid.z+Math.sin(a)*r;c.ai.st=now+MR(4,8);}dx=c.ai.sx-c.pos.x;dz=c.ai.sz-c.pos.z;d=Math.hypot(dx,dz)+15;
      if(!hid.safe&&realD<9&&Math.random()<dt*.35&&!c.dead){emit('hideFound',c);}}
    if(player.stars===0||inside){if(d>40||inside){removeVeh(c);continue;}c.v*=.95;}
    if(c.m.userData.lights){const f=Math.floor(now*6)%2;c.m.userData.lights[0].material=f?VM.sirR:VM.dark;c.m.userData.lights[1].material=f?VM.dark:VM.sirB;}
    if(c.dead||player.stars===0)continue;if(hid?realD<10:d<70)near=true;
    const want=Math.atan2(dx,dz),diff=wrapA(want-c.h);c.steer=clamp(diff*2,-1,1);const tv=d>14?c.spec.max*(.75+.25*aggr):d>7?7:0;c.v+=clamp(tv-c.v,-25*dt,c.spec.acc*dt);
    c.h+=c.steer*c.spec.turn*clamp(Math.abs(c.v)/7,0,1)*dt;const nx=c.pos.x+Math.sin(c.h)*c.v*dt,nz=c.pos.z+Math.cos(c.h)*c.v*dt;if(drivable(nx,nz)){c.pos.x=nx;c.pos.z=nz;}else c.v*=.3;
    if(collide(c.pos,1.2,false)&&c.v>6)c.v*=.6;if(c.v<2&&d>20)c.ai.stuck+=dt;else c.ai.stuck=Math.max(0,c.ai.stuck-dt);if(c.ai.stuck>3||(!hid&&d>260)||realD>400){removeVeh(c);continue;}
    c.m.rotation.y=c.h;for(const w of c.m.userData.wheels)w.rotation.x+=c.v*dt/.4;
    if(player.mode==='foot'){const s=segDist(pp.x,pp.z,c);if(s.d<c.spec.wid/2+.6&&c.v>5&&player.hitCd<=0){damage(12,'Hit by a police jeep');player.hitCd=1;player.pos.x+=s.dx/(s.d||1)*2;player.pos.z+=s.dz/(s.d||1)*2;}}
    if(!hid&&player.stars>=3&&d<34){c.ai.shootT-=dt*aggr;if(c.ai.shootT<=0){c.ai.shootT=MR(1.1,1.8);tracer(c.pos.x,1.6,c.pos.z,pp.x+MR(-.5,.5),1.2,pp.z+MR(-.5,.5),0x9fd0ff);sfxShot(.5);damage(player.mode==='drive'?2:5,'Police fire');}}}
  if(player.stars>0){const close=!hid&&cops.some(c=>!c.dead&&c.pos.distanceTo(pp)<7.5);const spd=player.mode==='drive'?Math.abs(player.veh.v):player.v;if(close&&spd<3.5)player.arrestT+=dt;else player.arrestT=Math.max(0,player.arrestT-dt*1.5);if(player.arrestT>2.6)busted();
    if(near)player.coolT=0;else{player.coolT+=dt*(hid?(hid.safe?4:2.5):1);if(player.coolT>10+player.stars*3){player.stars--;player.coolT=0;renderStars();toast(player.stars?'Lost a star':'You lost the police','#3ddc97');emit('stars',player.stars);}}}
  $('#stars').classList.toggle('hot',near);}

/* ================= weapons ================= */
const tracers=[];
function tracer(x1,y1,z1,x2,y2,z2,col=0xfff1a0){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1,y1,z1),new THREE.Vector3(x2,y2,z2)]);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.9}));scene.add(l);tracers.push({l,t:.09});}
const flash=new THREE.PointLight(0xffd27a,0,10);scene.add(flash);
const fireHooks=[];function fire(){for(const f of fireHooks){try{if(f())return;}catch(e){}}if(player.mode!=='foot'||inside||player.fireCd>0||uiLock()||player.knock>0)return;const Wp=WEAP[P.weapon];
  if(!Wp.melee&&!CFG.weapons){P.weapon='fist';updWeap();return;}if(Wp.ammo&&!(P.ammo[Wp.ammo]>0)){toast('Out of ammo · buy more at Hathiyar Ghar','#ff9f1c');P.weapon='fist';updWeap();return;}
  player.fireCd=Wp.rate;player.anim=.25;const ox=player.pos.x,oz=player.pos.z;const cone=Wp.melee?1.1:.32;let best=null,bd=1e9;const cand=[];
  for(const p of peds)if(p.state!=='down'&&p.g.visible)cand.push({k:'ped',o:p,x:p.x,z:p.z});for(const v of vehicles)if(v.state==='traffic'||v.state==='police')cand.push({k:'veh',o:v,x:v.pos.x,z:v.pos.z});
  for(const c of cand){const dx=c.x-ox,dz=c.z-oz,d=Math.hypot(dx,dz);const lim=Wp.range+(c.k==='veh'?c.o.spec.len/2:0);if(d>lim||d<.01)continue;const da=Math.abs(wrapA(Math.atan2(dx,dz)-player.h));if(da<cone&&d<bd){bd=d;best=c;}}
  if(Wp.melee){sfxPunch();player.lastPunch=performance.now();player.punchSide=1-(player.punchSide|0);if(best&&best.k==='ped'&&bd<Wp.range+.4){player.h=Math.atan2(best.x-ox,best.z-oz);hitPed(best.o,Wp.hit||1,ox,oz);fleeFrom(ox,oz,25);}return;}
  P.ammo[Wp.ammo]--;dirty=true;updWeap();sfxShot(1);flash.position.set(ox+Math.sin(player.h),1.4,oz+Math.cos(player.h));flash.intensity=3;let tx=ox+Math.sin(player.h)*Wp.range,tz=oz+Math.cos(player.h)*Wp.range;
  const hitOne=c=>{if(c.k==='ped')knockPed(c.o,null);else{const v=c.o;if(v.state==='police'){v.hp-=Wp.dmg||25;addWanted(1,'Shot at police');if(v.hp<=0){v.dead=true;v.v=0;}}else{v.stopT=8;}}};
  if(best){player.h=Math.atan2(best.x-ox,best.z-oz);tx=best.x;tz=best.z;hitOne(best);if(best.k==='ped')addWanted(1,'Attack');}
  if(P.weapon==='shotgun'){let n=0;for(const c of cand){if(c===best||n>=2)continue;const dx=c.x-ox,dz=c.z-oz,d=Math.hypot(dx,dz);if(d<16&&Math.abs(wrapA(Math.atan2(dx,dz)-player.h))<.25){hitOne(c);n++;}}}
  tracer(ox+Math.sin(player.h)*.6,1.35,oz+Math.cos(player.h)*.6,tx,1.1,tz);if(player.stars===0)addWanted(1,'Shots fired');fleeFrom(ox,oz,45);}
function cycleWeapon(){const list=P.weapons.filter(w=>CFG.weapons||WEAP[w].melee);const i=list.indexOf(P.weapon);P.weapon=list[(i+1)%list.length]||'fist';updWeap();}
function updWeap(){const Wp=WEAP[P.weapon]||WEAP.fist;const el=$('#weap');el.hidden=P.weapon==='fist'||!P.weapon;el.textContent=(Wp.ammo?`${Wp.name} · ${P.ammo[Wp.ammo]||0}`:Wp.name)+(P.armour>0?` · 🦺 ${Math.round(P.armour)}`:'');el.title='Weapon in hand · Q switches';for(const k in gunMeshes)gunMeshes[k].visible=k===P.weapon;}

/* ================= events + hooks ================= */
let started=false,startedOnce=false;document.body.classList.add('pre');
const bus={};function on(ev,fn){(bus[ev]=bus[ev]||[]).push(fn);}function emit(ev,d){for(const f of bus[ev]||[]){try{f(d);}catch(e){console.error(e);}}}
const hooks={update:[],start:[],afterRender:[],key:{}};const poiHandlers={};const missions=[];const speedMods=[];const apps=[];

/* ================= light + weather ================= */
const hemi=new THREE.HemisphereLight(0xffe6c4,0x4a3b55,.7);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffc48a,.95);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-110,right:110,top:110,bottom:-110,near:1,far:500});sun.shadow.bias=-0.0008;scene.add(sun);scene.add(sun.target);
const WX={clear:{dim:1,fn:180,ff:700,rain:0,grey:0},cloudy:{dim:.75,fn:140,ff:520,rain:0,grey:.45},rain:{dim:.6,fn:80,ff:340,rain:.5,grey:.6},monsoon:{dim:.45,fn:50,ff:240,rain:1,grey:.75},fog:{dim:.72,fn:14,ff:150,rain:0,grey:.7}};
const WLABEL={clear:'Clear',cloudy:'Cloudy',rain:'Rain',monsoon:'Monsoon',fog:'Fog'};
const wx={cur:'clear',dim:1,fn:180,ff:700,rain:0,grey:0,flash:0};
function autoWeather(){const slot=Math.floor(gameMin()/240);const r=hash(slot*13.37+7);const m=istMonth();if(m>=6&&m<=9)return r<.25?'cloudy':r<.65?'rain':r<.9?'monsoon':'clear';if(m===10||m===11)return r<.62?'clear':r<.86?'cloudy':r<.94?'rain':'fog';if(m===12||m<=2)return r<.55?'clear':r<.8?'fog':'cloudy';return r<.75?'clear':r<.95?'cloudy':'rain';}
const RAIN_N=1600;const rainPos=new Float32Array(RAIN_N*6);const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xaabbd0,transparent:true,opacity:.5}));rain.frustumCulled=false;scene.add(rain);for(let i=0;i<RAIN_N;i++)rainPos[i*6+1]=-100;
function updRain(dt,cx,cy,cz){const n=Math.floor(RAIN_N*wx.rain);rain.visible=n>0&&!inside;if(!rain.visible)return;for(let i=0;i<RAIN_N;i++){const o=i*6;if(i>=n){rainPos[o+1]=rainPos[o+4]=-100;continue;}
  let y=rainPos[o+1]-48*dt;if(y<0||Math.abs(rainPos[o]-cx)>45||Math.abs(rainPos[o+2]-cz)>45){rainPos[o]=cx+MR(-45,45);rainPos[o+2]=cz+MR(-45,45);y=cy+MR(5,35);}rainPos[o+1]=y;rainPos[o+3]=rainPos[o]+.15;rainPos[o+4]=y+1.3;rainPos[o+5]=rainPos[o+2];}rainGeo.attributes.position.needsUpdate=true;}
const SKY=[[0,'#0f1436','#1d2448',.16,'#9fb2ff',.42,1],[5,'#0f1436','#1d2448',.16,'#9fb2ff',.42,1],[6.3,'#f2a1a7','#e9a99a',.5,'#ffb38a',.5,.4],[8,'#8ec5ee','#bcd8ea',.95,'#fff1d6',.75,0],[16,'#8ec5ee','#c9dcea',.95,'#fff1d6',.75,0],[17.6,'#f3a65a','#f0a868',.95,'#ffb36b',.7,0],[18.6,'#d8606a','#c86a70',.6,'#ff8a5c',.55,.35],[19.6,'#3a2a5c','#3b2f5a',.25,'#9f8cff',.42,.85],[21,'#0f1436','#1d2448',.16,'#9fb2ff',.42,1],[24,'#0f1436','#1d2448',.16,'#9fb2ff',.42,1]];
const cB=new THREE.Color(),greyC=new THREE.Color(),lampOff=new THREE.Color(0x666055),lampOn=new THREE.Color(0xffd27a);let nightF=0;
const nightFill=new THREE.PointLight(0xffd9a8,0,70,1.4);scene.add(nightFill);   // the warm glow of nearby street lights around you
function updSky(dt){const target=CFG.weather==='auto'?autoWeather():CFG.weather;if(target!==wx.cur){wx.cur=target;emit('weather',target);}const Wt=WX[target]||WX.clear;const k=Math.min(1,dt*.8);for(const f of ['dim','fn','ff','rain','grey'])wx[f]+=(Wt[f]-wx[f])*k;
  let i=0;while(i<SKY.length-2&&SKY[i+1][0]<=clockH)i++;const a=SKY[i],b=SKY[i+1];const t=(clockH-a[0])/(b[0]-a[0]||1);nightF=a[6]+(b[6]-a[6])*t;greyC.set(0x8b9099).multiplyScalar(.2+.8*(1-nightF));
  scene.background.set(a[1]).lerp(cB.set(b[1]),t).lerp(greyC,wx.grey);scene.fog.color.set(a[2]).lerp(cB.set(b[2]),t).lerp(greyC,wx.grey);scene.fog.near=wx.fn*GFX.fog;scene.fog.far=wx.ff*GFX.fog;
  sun.intensity=(a[3]+(b[3]-a[3])*t)*wx.dim;{const rf=Math.max(.12,Math.min(1,sun.intensity/.95));for(const m of ENVM)m.reflectivity=m.userData.envR*rf;}sun.color.set(a[4]).lerp(cB.set(b[4]),t);hemi.intensity=(a[5]+(b[5]-a[5])*t)*(.55+.45*wx.dim)+wx.flash*2.5;hemi.color.copy(scene.fog.color).lerp(cB.set('#ffffff'),.4);
  const night=Math.max(nightF,(1-wx.dim)*.45);for(const m of styleCache.values())m.emissiveIntensity=night*.95;M.lamp.color.copy(lampOff).lerp(lampOn,night);poolMat.opacity=night*.62;nightFill.intensity=inside?0:night*.85;if(!inside){const pp=ppos();nightFill.position.set(pp.x,14,pp.z);}headL.intensity=player.mode==='drive'&&!inside?night*2.2:0;
}
const sunDir=new THREE.Vector3();
function updSun(c){const a=(clockH-6)/12*Math.PI;const day=clockH>5.5&&clockH<19.5;if(day)sunDir.set(Math.cos(a),Math.max(Math.sin(a),.12),.35).normalize();else sunDir.set(-.3,.8,.5).normalize();sun.position.copy(c).addScaledVector(sunDir,220);sun.target.position.copy(c);}

/* ================= festivals, events, fares ================= */
const stateAt=(x,z)=>{const zz=zoneAt(x,z,60);if(zz)return zz.st;if(isForeign(x,z))return 'FR';for(const sp of W.statePolys||[])if(pip(x,z,sp.pts))return sp.st;if(z<3000)return 'RJ';if(z<3550&&x>2400)return 'RJ';if(z<7000&&x<5200)return 'GJ';return 'MH';};
function activeFestivals(st){const iso=istISO();return CFG.festivals.filter(f=>f.start&&f.end&&f.start<=iso&&f.end>=iso&&(()=>{const ws=String(f.where||'all').split(',').map(s=>s.trim());return ws.includes('all')||ws.includes(st);})());}
function activeEvents(){const iso=istISO();return CFG.events.filter(e=>e.start<=iso&&e.end>=iso);}
function fareMultAt(x,z){let m=CFG.fareMul;const st=stateAt(x,z);for(const f of activeFestivals(st))m*=+f.mult||1;const zz=zoneAt(x,z,60);for(const e of activeEvents())if(zz&&e.zone===zz.id)m*=+e.mult||1;return m;}

/* ================= needs + damage ================= */
let warned={};let sleeping=false;
let godMode=false;function damage(n,why){if(inside||godMode||afk)return;if(P.armour>0&&!/drown|fall|hunger|jump/i.test(why||'')){const a=Math.min(P.armour,n*.6);P.armour=Math.max(0,P.armour-a*1.2);n-=a;updWeap();}P.health=Math.max(0,P.health-n);if(P.health<=0)knockedOut(why);}
speedMods.push(()=>P.health<25?.6:1); // badly hurt: vehicles go slower too
// Beta v2.03.00: a play-time clock. Rent, offers and anything that runs out by Bay days count only the time you are playing.
// Beta v2.03.00: away from the keyboard. After 2 minutes with no key, click or touch you are "away": your meters stop,
// nothing can hurt, rob, arrest or fine you, and play days stop counting, until you touch the game again.
let lastInput=performance.now(),afk=false;const afkEl=document.createElement('div');afkEl.id='afk';afkEl.hidden=true;afkEl.textContent='💤 Away · your character is safe and the meters are paused · touch any key to carry on';afkEl.style.cssText='position:fixed;left:50%;top:40%;transform:translateX(-50%);z-index:80;padding:10px 18px;border-radius:14px;background:rgba(18,22,30,.9);color:#f4f1ea;font:600 14px system-ui,sans-serif;text-align:center;max-width:86vw';document.body.appendChild(afkEl);
for(const ev of ['keydown','pointerdown','touchstart','wheel','mousemove'])addEventListener(ev,()=>{lastInput=performance.now();if(afk){afk=false;afkEl.hidden=true;emit('afk',false);}},{capture:true,passive:true});
function checkAfk(){if(!afk&&started&&performance.now()-lastInput>120000&&!(api.CINE&&api.CINE.on)){afk=true;afkEl.hidden=false;emit('afk',true);}return afk;}
function playDay(){return Math.floor(((P.extra&&P.extra.playMin)||0)/1440);}
function updNeeds(dt){if(checkAfk())return;const gm=dt*CFG.timeSpeed;P.extra.playMin=(P.extra.playMin||0)+Math.min(gm,5);P.bladder=100;if(!CFG.needs){P.hunger=P.energy=100;}else{const s=sleeping?.5:1;P.hunger-=100/(CFG.foodHrs*60)*gm*s;if(!sleeping)P.energy-=100/(CFG.awakeHrs*60)*gm*(player.run&&player.mode==='foot'?1.6:1)*(player.veh&&player.veh.spec.pedal&&!player.veh.spec.animal&&Math.abs(player.veh.v)>1?1.8:1);}
  P.hunger=clamp(P.hunger,0,100);P.energy=clamp(P.energy,0,100);
  // Empty needs wear health down slowly, but never knock you out: eat, sleep or see a doctor to get it back.
  if(!inside&&!waitOpen()&&CFG.needs){const drain=(P.hunger<=0?.12:0)+(P.energy<=0?.06:0);if(drain&&P.health>10)P.health=Math.max(10,P.health-drain*dt);}
  if(P.hunger>60&&P.energy>50&&P.health<100)P.health=Math.min(100,P.health+dt*.03);
  if(P.health<25&&!warned.health){warned.health=1;toast('Health low · you move slower. Eat, sleep or visit a hospital','#ff5d73');}if(P.health>35)warned.health=0;
  for(const [k,msg] of [['hunger','You need food · find an orange marker'],['energy','You need sleep · home, lodge or dharamshala']]){if(P[k]<22&&!warned[k]){warned[k]=1;toast(msg,'#ff9f1c');}if(P[k]>40)warned[k]=0;}
  needAlerts();}
/* Beta v1.01.21: when sleep, food or health is almost gone (10% and below), a notification you can tap:
   sleep → directions to the nearest lodge or your home, food → order food, health → directions to the hospital */
const nAlert={};
function nearestSleep(){const pp=ppos();let best=null,bd=1e9;for(const p of pois){if(p.type!=='lodge'&&!(p.type==='home'&&P.homes.includes(p.extra)))continue;const d=Math.hypot(p.x-pp.x,p.z-pp.z);if(d<bd){bd=d;best=p;}}return best;}
function needAlerts(){if(!started||!CFG.needs||inside||sleeping)return;
  const L=[['energy','😴','You are very sleepy',()=>{const p=nearestSleep();return p?`Tap for directions to ${p.type==='home'?'your home':p.name}`:'Find a lodge or your home';},()=>{const p=nearestSleep();if(p&&api.directions)api.directions(p.x,p.z,p.name);}],
    ['hunger','🍛','You are very hungry',()=>'Tap to order food to where you are',()=>{const a=apps.find(q=>q.id==='swiggy')||apps.find(q=>q.id==='zomato');if(a)a.fn(api);else{const f=nearestPoi('food',ppos().x,ppos().z);if(f&&api.directions)api.directions(f.x,f.z,f.name);}}],
    ['health','🏥','You are badly hurt',()=>{const h=nearestPoi('hospital',ppos().x,ppos().z);return h?`Tap for directions to ${h.name}`:'Find a hospital';},()=>{const h=nearestPoi('hospital',ppos().x,ppos().z);if(h&&api.directions)api.directions(h.x,h.z,h.name);}]];
  for(const [k,ic,t,sub,fn] of L){const v=P[k];if(v<=10&&!nAlert[k]){nAlert[k]=1;notify(ic,t,sub(),fn,k);}else if(v>20&&nAlert[k]){nAlert[k]=0;const el=$('#notif');if(el&&el.dataset.k===k)el.hidden=true;}}}
function notify(icon,title,sub,fn,key){let el=$('#notif');if(!el){el=document.createElement('button');el.id='notif';el.type='button';el.className='hud';document.body.appendChild(el);}
  el.dataset.k=key||'';el.innerHTML=`<span class="ni">${esc(icon)}</span><span class="nt"><b>${esc(title)}</b><small>${esc(sub||'')}</small></span><i class="nx" data-nx aria-label="Dismiss">×</i>`;el.hidden=false;el.classList.remove('in');void el.offsetWidth;el.classList.add('in');
  el.onclick=e=>{el.hidden=true;if(e.target.closest('[data-nx]'))return;if(fn)try{fn();}catch(er){console.error(er);}};clearTimeout(el._t);el._t=setTimeout(()=>{el.hidden=true;},30000);}
function setMeter(id,v){v=Math.round(v*2)/2;if(setMeter[id]===v)return;setMeter[id]=v;const el=$(id);el.querySelector('i').style.width=v+'%';el.classList.toggle('low',v<22);}
let overT=0;
function teleport(x,z,h,opts={}){if(inside)leaveHome(true);if(player.mode==='drive'&&!opts.keepCar)exitVehicle(true);player.pos.set(x,0,z);player.h=h||0;camSnap=true;emit('teleport',{x,z});}
function respawnAt(x,z,h){teleport(x,z,h);player.stars=0;player.arrestT=0;renderStars();for(const v of vehicles.slice())if(v.state==='police')removeVeh(v);}
function nearestPoi(type,x,z){let b=null,bd=1e9;for(const p of pois)if(p.type===type){const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;b=p;}}return b;}
function takeFee(n){const c=Math.min(P.cash,n);P.cash-=c;const b=Math.min(P.bank,n-c);P.bank-=b;dirty=true;return c+b;}
function knockedOut(why){if(overT>0||afk)return;overT=3;big('KNOCKED OUT','#ff5d73');const fee=takeFee(cost('svc.ko',1000));emit('ko');
  setTimeout(()=>{const h=nearestPoi('hospital',ppos().x,ppos().z);respawnAt(h.x+Math.sin(h.rot)*2,h.z+Math.cos(h.rot)*2,h.rot);P.health=100;P.hunger=Math.max(P.hunger,50);P.energy=Math.max(P.energy,50);save();toast(`${h.name} · treatment ${inr(fee)}`,'#ffc93c');},1800);}
function busted(){if(overT>0||afk)return;overT=3;big('BUSTED','#5fb4ff');const fine=takeFee(cost('svc.bust',1500));P.weapons=P.weapons.filter(w=>WEAP[w].melee);for(const k in P.ammo)P.ammo[k]=0;if(!P.weapons.includes(P.weapon))P.weapon='fist';emit('bust');
  setTimeout(()=>{const s=nearestPoi('police',ppos().x,ppos().z);respawnAt(s.x+Math.sin(s.rot)*2,s.z+Math.cos(s.rot)*2,s.rot);updWeap();save();toast(`Released · fine ${inr(fine)}, guns taken`,'#5fb4ff');},1800);}
function addChallan(amt,why){if(!CFG.challansOn)return;P.challans=P.challans||[];P.challans.push({amt:price(amt),why,day:istISO()});dirty=true;toast(`🚨 e-challan ${inr(price(amt))} · ${why}`,'#ff9f1c');emit('challan',{amt,why});} // traffic fines: only when the admin turns challans on

/* ================= entering and leaving vehicles ================= */
function enterVehicle(v){if(v.state==='net'){toast('That one belongs to the street traffic','#d6c8e4');return;}if(v.locked){if(v.owned){v.locked=false;if(P.cars[v.ownedIdx])P.cars[v.ownedIdx].locked=false;toast('🔓 Unlocked','#3ddc97');}else{toast('🔒 '+(v.lockMsg||'It is locked'),'#ff9f1c');return;}}if(v.repairing){toast('Still with the mechanic · see the timer at the top','#ff9f1c');return;}if(v.state==='traffic'){ejectDriver(v);addWanted(1,'Carjacking');if(v.m.userData.driver&&v.spec.two){v.m.remove(v.m.userData.driver);v.m.userData.driver=null;}}
  else if(v.state==='police'){if(!v.dead)addWanted(2,'Stole a police jeep');}
  if(v.fallen){v.fallen=false;}v.state='player';v.lane=null;v.v=0;player.veh=v;player.mode='drive';
  const ride=!!(v.spec.two||v.spec.pedal);avatar.visible=ride;if(v.m.userData.driver&&!v.spec.two)v.m.userData.driver.visible=!v.spec.pedal;
  v.m.add(headL);v.m.add(headT);headL.position.set(0,1.3,v.spec.len/2);headT.position.set(0,0,v.spec.len/2+12);
  emit('enterVehicle',v);toast(v.owned?`Your ${v.spec.label}`:v.spec.label,'#ffc93c');updAvatarGear();}
function exitVehicle(force){const v=player.veh;if(!v)return;if(!force&&Math.abs(v.v)>4){toast('Slow down to get out','#ff9f1c');return;}if(!force&&v.pos.y>1){toast('No stopping on the flyover · get out after the ramp','#ff9f1c');return;}
  v.state='parked';v.v=0;v.m.remove(headL);v.m.remove(headT);scene.add(headL);scene.add(headT);headL.intensity=0;if(v.m.userData.driver&&!v.spec.two)v.m.userData.driver.visible=false;
  const sx=Math.cos(v.h),sz=-Math.sin(v.h);let px=v.pos.x+sx*(v.spec.wid/2+.9),pz=v.pos.z+sz*(v.spec.wid/2+.9);if(!drivable(px,pz)){px=v.pos.x-sx*(v.spec.wid/2+.9);pz=v.pos.z-sz*(v.spec.wid/2+.9);}
  player.pos.set(px,0,pz);player.h=v.h;player.mode='foot';player.veh=null;avatar.visible=true;avatar.rotation.set(0,player.h,0);collide(player.pos,.4,true);emit('exitVehicle',v);updAvatarGear();
  if(v.company)return;const extra=vehicles.filter(q=>q.state==='parked'&&!q.owned&&!q.company&&!q.lot);if(extra.length>8){extra.sort((a,b)=>b.pos.distanceTo(player.pos)-a.pos.distanceTo(player.pos));removeVeh(extra[0]);}}
function nearestVeh(){let best=null,bd=1e9;for(const v of vehicles){if(v.state==='player'||v.state==='procession'||v.noEnter||v.state==='towed')continue;const s=segDist(player.pos.x,player.pos.z,v);const lim=v.spec.wid/2+1.8;if(s.d<lim&&s.d<bd){bd=s.d;best=v;}}return best;}
function fallOff(v,impact){exitVehicle(true);v.fallen=true;v.m.rotation.set(0,v.h,Math.PI/2.2,'YXZ');player.knock=1.6;const dmg=impact*(P.helmet?.45:1.4);damage(dmg,'Fell off');toast(P.helmet?'You fell off · the helmet saved you':'You fell off · buy a helmet!','#ff5d73');emit('fall');}

/* ================= outfits ================= */
const shirtMat=AU.body.material=LMat(P.outfit.topCol);AU.arms.forEach(a=>a.children[0].material=shirtMat);const legMat=LMat(P.outfit.botCol);AU.legs.forEach(l=>l.children[0].material=legMat);AU.knees.forEach(k=>{if(k.userData.pants)k.userData.pants.material=legMat;});if(AU.hips)AU.hips.material=legMat;
function applyOutfit(){const o=P.outfit;shirtMat.color.set(o.topCol||'#e8573e');legMat.color.set(o.botCol||'#2d3142');outfitParts.kurta.visible=o.top==='kurta';outfitParts.kurta.material.color.set(o.topCol);
  outfitParts.saree.visible=outfitParts.pallu.visible=o.top==='saree';outfitParts.saree.material.color.set(o.topCol);outfitParts.pallu.material.color.set(o.topCol);AU.legs.forEach(l=>l.visible=o.top!=='saree'||player.mode==='drive');
  outfitParts.sneakers.forEach(s=>s.visible=o.shoes==='sneakers'&&o.top!=='saree');outfitParts.glasses.visible=!!o.glasses;updAvatarGear();}
// sitting or riding in a saree: the drape is shown as a long top over saree-coloured legs, so the legs can bend (Beta v1.01.25)
let seatedA=false;function seatAvatar(on){on=!!on;if(on===seatedA)return;seatedA=on;const o=P.outfit;if(o.top!=='saree'){if(!on)applyOutfit();return;}
  if(on){outfitParts.saree.visible=false;outfitParts.kurta.visible=true;outfitParts.kurta.material.color.set(o.topCol);legMat.color.set(o.topCol);AU.legs.forEach(l=>l.visible=true);}else applyOutfit();}
on('enterVehicle',()=>{seatAvatar(true);document.body.classList.add('driving');});on('exitVehicle',()=>{seatAvatar(false);document.body.classList.remove('driving');keys.hb=false;});
/* your look (Settings → My look): man or woman, skin tone, face shape, hair style and colour, beard, build and height */
const LOOK_DEF={female:false,skin:'#a0673f',face:'oval',hair:'short',hairC:'#141010',beard:'none',build:'average',height:'average',bindi:true,specs:'none',hat:'none',hatC:'#e8572a',nose:'medium',brows:'normal'};
function applyLook(){const L=P.look=Object.assign({},LOOK_DEF,P.look||{});const hairs=L.female?LOOKS.female.hair:LOOKS.male.hair;if(!hairs.includes(L.hair))L.hair=hairs[0];if(L.female)L.beard='none';
  AU.skinM.color.set(L.skin);AU.hairM.color.set(L.hairC);AU.female=L.female;AU.look=L;
  for(const ch of [...AU.headG.children]){AU.headG.remove(ch);ch.geometry.dispose();}const hm=AU.mk(headParts(L,L.skin,L.hairC,L.female),AU.headG);AU.hair=hm.hair||{visible:true};
  const k=BUILDK(L.build);const bp=bodyParts(L,{dress:'shirt',shirt:'#ffffff',pants:'#000000'});
  const geo=r=>merge(bp.filter(q=>q[0]===r).map(([r2,gg,cc,sx,sy,sz,x,y,z,rx,rz])=>{const g=gg.clone();g.scale(sx,sy,sz);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);g.translate(x,y,z);return g;}));
  AU.body.geometry.dispose();AU.body.geometry=geo('shirt');AU.hips.geometry.dispose();AU.hips.geometry=geo('pants');if(AU.belt){AU.belt.visible=!L.female;AU.belt.scale.set(k,1,k);}
  AU.legs.forEach((l,i)=>l.position.x=(i?1:-1)*.1*k);AU.arms.forEach((a,i)=>a.position.x=(i?1:-1)*.285*k);avatar.scale.setScalar(L.height==='tall'?1.04:L.height==='short'?.95:1);
  outfitParts.kurta.scale.set(1.05*k,1,.7*k);outfitParts.saree.scale.set(1.04*k,1,.74*k);updAvatarGear();emit('look',L);}
// a short code so other players see your look online: m/f + skin, face, hair, hair colour, beard, build, height
function lookCode(){const L=Object.assign({},LOOK_DEF,P.look||{});const hairs=L.female?LOOKS.female.hair:LOOKS.male.hair;const ix=(a,v)=>Math.max(0,a.indexOf(v));
  return (L.female?'f':'m')+[ix(SKIN,L.skin),ix(LOOKS.face,L.face),ix(hairs,L.hair),ix(HAIRC,L.hairC),ix(LOOKS.beard,L.beard),ix(LOOKS.build,L.build),ix(LOOKS.height,L.height),ix(LOOKS.specs,L.specs),ix(LOOKS.hat,L.hat),ix(LOOKS.nose,L.nose),ix(LOOKS.brows,L.brows)].join('');}
function decodeLook(s){if(!/^[mf][0-9]{7,12}$/.test(s||''))return null;const f=s[0]==='f',d=s.slice(1).split('').map(Number);const hairs=f?LOOKS.female.hair:LOOKS.male.hair;
  return{female:f,skin:SKIN[d[0]]||SKIN[3],face:LOOKS.face[d[1]]||'oval',hair:hairs[d[2]]||hairs[0],hairC:HAIRC[d[3]]||HAIRC[0],beard:f?'none':LOOKS.beard[d[4]]||'none',build:LOOKS.build[d[5]]||'average',height:LOOKS.height[d[6]]||'average',specs:LOOKS.specs[d[7]]||'none',hat:LOOKS.hat[d[8]]||'none',nose:LOOKS.nose[d[9]]||'medium',brows:LOOKS.brows[d[10]]||'normal'};}
applyLook();
// Settings → My look: the camera turns round to face you while you change things
const SWN=['Deep brown','Dark','Brown','Wheatish brown','Warm','Wheatish','Light','Fair'],HCN=['Black','Soft black','Dark brown','Brown','Light brown','Grey','White','Henna'];
function frameLook(){const p=new THREE.Vector3();avatar.getWorldPosition(p);const h=player.mode==='drive'&&player.veh?player.veh.h:player.h;const fx=Math.sin(h),fz=Math.cos(h);const wide=innerWidth>=800;const d=wide?2.7:3.4;
  // face the avatar from the front, or from the side if a wall is in the way
  let ang=0;if(!inside){const tv=new THREE.Vector3();for(const a of [0,.5,-.5,1,-1,1.6,-1.6,2.3,-2.3,Math.PI]){const c=Math.cos(a),sn=Math.sin(a);const ux=fx*c+fz*sn,uz=-fx*sn+fz*c;let ok=true;for(const k of [.35,.7,1]){tv.set(p.x+ux*d*k,0,p.z+uz*d*k);if(collide(tv,.4,false)||vehicles.some(v=>Math.hypot(v.pos.x-tv.x,v.pos.z-tv.z)<(v.spec.len||3)/2+.8)){ok=false;break;}}if(ok){ang=a;break;}}}
  const c0=Math.cos(ang),s0=Math.sin(ang);const ux=fx*c0+fz*s0,uz=-fx*s0+fz*c0;
  camera.position.set(p.x+ux*d,p.y+(wide?1.45:1.6),p.z+uz*d);const rx=uz,rz=-ux;camera.lookAt(p.x+(wide?rx*.85:0),p.y+(wide?1.05:.15),p.z+(wide?rz*.85:0));}
function lookSheet(){const L=Object.assign({},LOOK_DEF,P.look||{});
  const chips=(key,list,names)=>`<div class="chips">${list.map((v,i)=>`<button class="chip${String(L[key])===v?' on':''}" data-lk="${key}" data-v="${v}">${esc(names?names[i]:v[0].toUpperCase()+v.slice(1))}</button>`).join('')}</div>`;
  const sw=(key,list,names)=>`<div class="chips swatch">${list.map((v,i)=>`<button class="chip sw${L[key]===v?' on':''}" data-lk="${key}" data-v="${v}" aria-label="${names[i]}" title="${names[i]}" style="--c:${v}"><i></i></button>`).join('')}</div>`;
  const hairs=L.female?LOOKS.female.hair:LOOKS.male.hair;
  const html=`<h3 class="sub">You are</h3>${chips('female',[false,true].map(String),['A man','A woman'])}
    <h3 class="sub">Skin tone</h3>${sw('skin',SKIN,SWN)}<h3 class="sub">Face shape</h3>${chips('face',LOOKS.face)}
    <h3 class="sub">Hair style</h3>${chips('hair',hairs)}<h3 class="sub">Hair colour</h3>${sw('hairC',HAIRC,HCN)}
    ${L.female?`<h3 class="sub">Bindi</h3>${chips('bindi',['true','false'],['Yes','No'])}`:`<h3 class="sub">Beard</h3>${chips('beard',LOOKS.beard)}`}
    <h3 class="sub">Nose</h3>${chips('nose',LOOKS.nose)}<h3 class="sub">Eyebrows</h3>${chips('brows',LOOKS.brows)}
    <h3 class="sub">Spectacles</h3>${chips('specs',LOOKS.specs,['None','Round','Square','Sunglasses'])}<h3 class="sub">Headwear</h3>${chips('hat',LOOKS.hat,['None','Cricket cap','Turban (pagdi)','Gandhi topi'])}
    ${L.hat!=='none'?`<div class="chips swatch">${['#e8572a','#f4c430','#c8102e','#f4f1ea','#2d6cdf','#ff8fd0','#1f8a4c','#1a1a1a'].map(v=>`<button class="chip sw${L.hatC===v?' on':''}" data-lk="hatC" data-v="${v}" aria-label="Headwear colour" style="--c:${v}"><i></i></button>`).join('')}</div>`:''}
    <h3 class="sub">Body type</h3>${chips('build',LOOKS.build)}<h3 class="sub">Height</h3>${chips('height',LOOKS.height)}
    <div class="btnrow2">${rowHtml('rand','Surprise me','A random new look','Random','ghost')}${rowHtml('ward','Clothes','Shirts, kurtas, sarees, shoes and glasses in the Wardrobe','Wardrobe','ghost')}</div>
    <p class="note">${player.mode==='drive'?'Step out of the vehicle to see yourself better. ':''}Other players see your look online.</p>`;
  const set=(k,v)=>{const q=P.look=Object.assign({},LOOK_DEF,P.look||{});q[k]=v;if(k==='female'){q.hair=(v?LOOKS.female.hair:LOOKS.male.hair)[0];if(v)q.beard='none';}dirty=true;applyLook();frameLook();lookSheet();};
  if($('#sheetWrap').hidden||!$('#sheetWrap').classList.contains('lookmode')){openSheet('🧑 My look','Changes show on you right away',html,null,()=>{$('#sheetWrap').classList.remove('lookmode');camSnap=true;});$('#sheetWrap').classList.add('lookmode');frameLook();}
  else $('#sbody').innerHTML=html;
  $('#sheet').onclick=e=>{const b=e.target.closest('[data-lk]');if(b){const k=b.dataset.lk,v=b.dataset.v;return set(k,v==='true'?true:v==='false'?false:v);}const id=e.target.dataset.id;
    if(id==='rand'){const f=!!(P.look&&P.look.female);P.look=Object.assign(randomLook(f),{skin:mpick(SKIN),hairC:mpick(HAIRC.slice(0,6)),height:mpick(LOOKS.height)});dirty=true;applyLook();frameLook();lookSheet();}
    if(id==='ward'){const a=apps.find(q=>q.id==='wardrobe');if(a)a.fn();}};}
function updAvatarGear(){const riding=player.mode==='drive'&&player.veh&&player.veh.spec.two&&player.veh.type!=='cycle';outfitParts.helmet.visible=riding&&P.helmet;outfitParts.cap.visible=!!P.outfit.cap&&!outfitParts.helmet.visible;AU.hair.visible=!outfitParts.helmet.visible;}

/* ================= interiors ================= */
let inside=null;const inter={scene:new THREE.Scene(),group:null,pois:[],w:0,d:0};
inter.scene.background=new THREE.Color('#120d1f');inter.scene.add(new THREE.HemisphereLight(0xfff0dc,0x3a3040,.75));const iLamp=new THREE.PointLight(0xffd7a0,1,40);iLamp.position.set(0,3.6,0);inter.scene.add(iLamp);
const HTYPE={chawl:{w:7,d:6,wall:'#7fb3a8',floor:'#8b5a3c',toilet:false,kit:'stove'},flat:{w:12,d:9,wall:'#efe3c8',floor:'#c9a27a',toilet:true,kit:'fridge',tv:true,view:0x5fa8d8},bungalow:{w:16,d:12,wall:'#f2e6cf',floor:'#a8784e',toilet:true,kit:'fridge',tv:true},
  cottage:{w:11,d:9,wall:'#e9dcc0',floor:'#8b5a3c',toilet:true,kit:'stove'},pol:{w:9,d:8,wall:'#d98a5a',floor:'#9a6a3a',toilet:true,kit:'stove'},haveli:{w:16,d:14,wall:'#e8967a',floor:'#b07a4a',toilet:true,kit:'fridge',tv:true},
  villa:{w:16,d:12,wall:'#f4f1ea',floor:'#d2b48c',toilet:true,kit:'fridge',tv:true,view:0x5fa8d8},tent:{w:8,d:7,wall:'#efe2c4',floor:'#c9a26b',toilet:false,kit:'stove'},
  portuguese:{w:14,d:11,wall:'#f2d16b',floor:'#a0522d',toilet:true,kit:'fridge',tv:true},hut:{w:8,d:7,wall:'#d9b98a',floor:'#c9a26b',toilet:true,kit:'stove',view:0x5fa8d8},
  nalukettu:{w:17,d:15,wall:'#f1e6cf',floor:'#5a3a24',toilet:true,kit:'stove',tv:true},houseboat:{w:14,d:6,wall:'#c9a06a',floor:'#7a5030',toilet:true,kit:'stove',view:0x3f86c1}};
const FURN={sofa:{name:'Sofa set',price:18000},tv:{name:'LED TV',price:25000},plant:{name:'Tulsi and money plant',price:800},rug:{name:'Jaipur dhurrie rug',price:4500},lamp:{name:'Brass lamp',price:2500},shelf:{name:'Bookshelf',price:7000},painting:{name:'Madhubani painting',price:6000},jhoola:{name:'Wooden jhoola swing',price:22000},puja:{name:'Puja shelf',price:3500},dining:{name:'Dining table',price:15000}};
function buildInterior(home){const H=HTYPE[home.type]||HTYPE.flat;if(inter.group)inter.scene.remove(inter.group);const g=new THREE.Group();const w=H.w,d=H.d;inter.w=w;inter.d=d;
  const wall=LMat(H.wall),floor=LMat(H.floor),wood=LMat('#6b4a32'),cloth=LMat('#3b5b8c'),white=LMat('#f1eee7'),dark=LMat('#202024'),green=LMat('#3e8c3a'),brass=LMat('#c9a227');
  const b=(sx,sy,sz,x,y,z,m)=>{const mm=new THREE.Mesh(G.box,m);mm.scale.set(sx,sy,sz);mm.position.set(x,y,z);g.add(mm);return mm;};
  b(w,.2,d,0,-.1,0,floor);b(w,3.6,.2,0,1.8,-d/2,wall);b(.2,3.6,d,-w/2,1.8,0,wall);b(.2,3.6,d,w/2,1.8,0,wall);
  const win=new THREE.Mesh(new THREE.PlaneGeometry(H.view?4:1.6,1.5),new THREE.MeshBasicMaterial({color:H.view||0x9fb7c7}));win.position.set(1,2.1,-d/2+.12);g.add(win);
  b(2.2,.45,1.3,-w/2+1.3,.3,-d/2+.9,wood);b(2.1,.25,1.2,-w/2+1.3,.65,-d/2+.9,white);b(.6,.18,1.1,-w/2+.55,.85,-d/2+.9,cloth);
  const ip=[{k:'bed',name:'Bed · sleep',x:-w/2+1.3,z:-d/2+2},{k:'door',name:'Door · go outside',x:0,z:d/2-.6}];
  if(H.kit==='fridge'){b(.7,1.9,.7,w/2-.5,.95,-d/2+1.6,white);ip.push({k:'fridge',name:'Fridge · eat',x:w/2-.5,z:-d/2+2.4});}else{b(1,.9,.5,w/2-.6,.45,d/2-1.4,wood);b(.4,.25,.4,w/2-.6,1,d/2-1.4,dark);ip.push({k:'stove',name:'Stove · cook dal-chawal',x:w/2-.6,z:d/2-2.1});}
  const F=P.furniture[home.id]||[];const hasTv=H.tv||F.includes('tv');if(hasTv){b(1.8,1,.1,w/2-.2,1.6,0,dark);ip.push({k:'tv',name:'TV · watch cricket',x:w/2-1.2,z:0});}
  if(F.includes('sofa')||H.tv){b(2.4,.5,.9,-1,.35,1.2,cloth);b(2.4,.8,.25,-1,.7,1.6,cloth);}
  if(F.includes('rug'))b(2.2,.03,1.6,-.6,.02,.1,LMat('#b8483b'));if(F.includes('plant')){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.25,.2,.4,8),LMat('#a85a3a'));pot.position.set(w/2-.6,.2,d/2-.6);g.add(pot);const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.45,0),green);leaf.position.set(w/2-.6,.75,d/2-.6);g.add(leaf);}
  if(F.includes('lamp')){b(.1,1.4,.1,-w/2+.4,.7,.6,brass);b(.4,.3,.4,-w/2+.4,1.45,.6,LMat('#ffe2a8'));}if(F.includes('shelf'))b(1.2,2,.35,w/2-.3,1,-d/2+3.2,wood);
  if(F.includes('painting'))b(1.4,.9,.05,-1.5,2.2,-d/2+.13,LMat('#d9483b'));if(F.includes('jhoola')){b(1.6,.1,.6,1.5,.6,-d/2+2.6,wood);b(.04,2.4,.04,.75,1.8,-d/2+2.6,dark);b(.04,2.4,.04,2.25,1.8,-d/2+2.6,dark);}
  if(F.includes('puja')){b(.8,.6,.4,-w/2+.3,1.4,-.8,brass);ip.push({k:'puja',name:'Puja shelf · light a diya',x:-w/2+.9,z:-.8});}if(F.includes('dining')){b(1.6,.08,.9,1.2,.75,1.6,wood);for(const dx of [-.6,.6])b(.08,.75,.08,1.2+dx,.37,1.6,wood);}
  b((w-1.6)/2,3.6,.2,-(w+1.6)/4,1.8,d/2,wall);b((w-1.6)/2,3.6,.2,(w+1.6)/4,1.8,d/2,wall);b(1.6,1.2,.2,0,3,d/2,wall);exitDoor(g,0,d/2-.05,LMat(H.wall));
  inter.scene.add(g);inter.group=g;inter.pois=ip;}
function homeById(id){return W.homes.find(h=>h.id===id);}
function enterHome(poi){const home=homeById(poi.extra);if(!home)return;if(P.rent[home.id]){toast('Your tenants live here now · end the rental from Phone → Business','#ff9f1c');return;}buildInterior(home);inside={poi,home};player.mode='foot';player.pos.set(0,0,inter.d/2-1.2);player.h=Math.PI;scene.remove(avatar);inter.scene.add(avatar);avatar.visible=true;camSnap=true;
  for(const v of vehicles.slice())if(v.state==='police')removeVeh(v);if(player.stars){player.stars=0;renderStars();toast('You hid at home · the police gave up','#3ddc97');}emit('enterHome',home);}
function leaveHome(silent){if(!inside)return;const poi=inside.poi;const ven=inside.venue;if(ven){inter.scene.background=new THREE.Color('#120d1f');if(ven.onExit)try{ven.onExit();}catch(e){}}inter.scene.remove(avatar);scene.add(avatar);inside=null;const o=1.8;player.pos.set(poi.x+Math.sin(poi.rot)*o,0,poi.z+Math.cos(poi.rot)*o);player.h=poi.rot;camSnap=true;}
// Venues: walk-in interiors for stadiums, malls and attractions, built by features.
// Beta v1.01.27: a real door to leave by, in every interior: frame, panelled wooden door, handle and a green EXIT sign
function exitDoor(g,x,z,wallM,wide){const fr=LMat('#5a3d28'),dr=LMat('#8a5a34'),pn=LMat('#7a4e2c'),br=LMat('#c9a227');const W2=wide?2.2:1.2,H2=2.3;const add=(sx,sy,sz,px,py,pz,m)=>{const mm=new THREE.Mesh(G.box,m);mm.scale.set(sx,sy,sz);mm.position.set(x+px,py,z+pz);g.add(mm);return mm;};
  add(W2+.24,.14,.14,0,H2+.07,0,fr);for(const sx of [-1,1])add(.12,H2,.14,sx*(W2/2+.06),H2/2,0,fr);add(W2,H2,.06,0,H2/2,-.04,dr);for(const yy of [.6,1.6])add(W2*.75,.7,.02,0,yy,-.08,pn);add(.06,.06,.12,W2*.36,1.05,-.1,br);
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(.7,.24),new THREE.MeshBasicMaterial({map:signTex('EXIT','#ffffff','#1e8a4c',256,88)}));sg.position.set(x,H2+.4,z-.08);sg.rotation.y=Math.PI;g.add(sg);return g;}
// o = {poi, name, w, d, bg, build(group) -> interior points [{k,name,x,z}], onAction(k), onExit(), start:{x,z,h}, title, hint}
function enterVenue(o){if(inside)leaveHome(true);if(player.mode==='drive')exitVehicle(true);if(inter.group)inter.scene.remove(inter.group);const g=new THREE.Group();inter.w=o.w;inter.d=o.d;
  const pts=o.build(g)||[];pts.push({k:'door',name:o.exitName||'Exit · go outside',x:(o.exit||{x:0}).x,z:(o.exit||{z:o.d/2-1}).z});if(!o._ib&&!o.noDoor){const ex=(o.exit||{x:0,z:o.d/2-1});exitDoor(g,ex.x,Math.min(o.d/2-.05,ex.z+1),null,o.w>30);}inter.scene.add(g);inter.group=g;inter.pois=pts;inter.scene.background=new THREE.Color(o.bg||'#120d1f');
  inside={poi:o.poi,venue:o,home:{name:o.name}};player.mode='foot';const st=o.start||{x:0,z:o.d/2-2,h:Math.PI};player.pos.set(st.x,0,st.z);player.h=st.h;scene.remove(avatar);inter.scene.add(avatar);avatar.visible=true;camSnap=true;emit('enterVenue',o);}
function homeAction(k){if(inside&&inside.venue){if(k==='door')return leaveHome();return inside.venue.onAction&&inside.venue.onAction(k);}if(k==='door')return leaveHome();
  if(k==='bed')return startSleep('Sleeping at home','Needs refill while the Bay clock keeps running');
  if(k==='fridge')return startActivity({title:'Eating leftovers',minutes:CFG.act.snack,effects:{hunger:45}});
  if(k==='stove')return startActivity({title:'Cooking dal-chawal',minutes:CFG.act.cook,effects:{hunger:42}});
  if(k==='tv')return startActivity({title:'Watching cricket',sub:mpick(['India need 32 off 18 balls','Super over!','Rain delay at Wankhede','A century in the making']),minutes:CFG.act.tv,effects:{energy:10}});
  if(k==='puja'){toast('Diya lit · peace of mind','#ffc93c');P.energy=Math.min(100,P.energy+3);}}

/* ================= wait overlay: activities and queues ================= */
let wait=null;const waitOpen=()=>!!wait;
function openWait(o){wait=Object.assign({t:0},o);wait.t0=Date.now()-wait.t*1000;if(o.persist){P.extra.wait=Object.assign({},o.persist,{t0:wait.t0,total:o.total});dirty=true;try{save();}catch(e){}}const el=$('#wait');el.hidden=false;el.innerHTML=`<div class="wcard"><div class="wk">${esc(o.kind||'Please wait')}</div><h2>${esc(o.title)}</h2><div class="wsub" id="wsub">${esc(o.sub||'')}</div><div class="wbar"><i id="wfill"></i></div><div class="wtime" id="wtime"></div>
  <div class="btnrow wbtns">${(o.buttons||[]).map(b=>`<button class="buy ghost" data-w="${b.id}">${esc(b.label)}</button>`).join('')}${hooks.bayGame?'<button class="buy ghost" data-w="__game">Play BayGame</button>':''}${o.cancel?`<button class="buy danger" data-w="__cancel">${esc(o.cancel)}</button>`:''}</div></div>`;
  el.onclick=e=>{const id=e.target.dataset&&e.target.dataset.w;if(!id)return;if(id==='__cancel'){const w=wait;closeWait();w.onCancel&&w.onCancel();return;}if(id==='__game'){hooks.bayGame();return;}const b=(wait.buttons||[]).find(x=>x.id===id);b&&b.fn();};for(const k in keys)keys[k]=false;}
function closeWait(){if(P.extra&&P.extra.wait){delete P.extra.wait;dirty=true;}wait=null;$('#wait').hidden=true;sleeping=false;}
// wall clock (Beta v1.01.11): the timer keeps going with the screen off or the browser closed
function tickWait(dt){if(!wait)return;const nt=(Date.now()-wait.t0)/1000;const d=Math.max(0,nt-wait.t);wait.t=nt;const f=Math.min(1,wait.t/wait.total);if(wait.onTick)wait.onTick(d,f);$('#wfill').style.width=(f*100)+'%';const left=Math.max(0,Math.ceil(wait.total-wait.t));$('#wtime').textContent=wait.timeText?wait.timeText(left,f):`${left}s left`;
  if(f>=1){const w=wait;closeWait();w.onDone&&w.onDone();}}
// Food also heals: health goes up by half of what the dish fills, when you are hurt.
function healFx(fx){const o=Object.assign({},fx);const h=Math.max(0,fx.hunger||0)*.5+(fx.energy||0)*.3;if(h>0)o.health=(o.health||0)+h;return o;}
function startActivity(o){if(player.stars&&!o.elapsed){toast('Lose the police first','#ff5d73');return;}const total=o.total||Math.max(2,o.minutes/Math.max(.05,CFG.timeSpeed));const t=Math.min(total,o.elapsed||0);let applied=o.applied!=null?o.applied:t/total;const eff=o.effects||{};
  const persist=o.noPersist?null:{type:'act',sleep:!!o.sleep,o:{kind:o.kind,title:o.title,sub:o.sub,minutes:o.minutes,effects:o.effects,cancelLabel:o.cancelLabel,total,sleep:o.sleep,resume:o.resume}};
  openWait({kind:o.kind||'Activity',title:o.title,sub:o.sub||`${o.minutes} game minutes`,total,t,persist,cancel:o.cancelLabel||'Stop',buttons:o.buttons,timeText:(l)=>`${l}s · Bay ${bayTime()}`,
    onTick:(dt,f)=>{const d=f-applied;applied=f;for(const k in eff)P[k]=clamp(P[k]+eff[k]*d,0,100);o.onTick&&o.onTick(dt,f);},onDone:()=>{dirty=true;o.onDone&&o.onDone();emit('activity',o);},onCancel:()=>{dirty=true;o.onCancel&&o.onCancel();}});}
const resumers={};function addResumer(k,f){resumers[k]=f;}
function resumeWait(){const r=P.extra&&P.extra.wait;if(!r||wait)return;delete P.extra.wait;const el=(Date.now()-r.t0)/1000;
  if(r.type==='act'){const o=Object.assign({},r.o,{elapsed:el,applied:Math.max(0,Math.min(1,((P.savedAt||r.t0)-r.t0)/1000/r.o.total))});if(o.resume&&resumers[o.resume.key])return resumers[o.resume.key](o.resume.data,o,r);if(o.sleep){sleeping=true;o.onDone=()=>{save();toast('Fully rested · game saved','#3ddc97');emit('sleep');};o.onCancel=()=>{save();};}
    toast(el>=o.total?`${esc(o.title)} · finished while you were away`:`Welcome back · ${esc(o.title)} continues`,'#d6c8e4');return startActivity(o);}
  if(resumers[r.type])resumers[r.type](r,el);}
function startSleep(title,sub){if(P.energy>85){toast('You are not sleepy yet','#d6c8e4');return;}const mins=CFG.act.sleep*(100-P.energy)/100;sleeping=true;
  startActivity({kind:'Sleeping',sleep:true,title,sub:sub+' · wake up any time',minutes:Math.max(20,mins),effects:{energy:100-P.energy,health:Math.max(0,(100-P.health)*.8*(100-P.energy)/100+(P.health<100?10:0))},cancelLabel:'Wake up',onDone:()=>{save();toast('Fully rested · game saved','#3ddc97');emit('sleep');},onCancel:()=>{save();toast('Up early · game saved','#d6c8e4');}});sleeping=true;}
const QLINES=['Bhaiya, jaldi karo!','Line mein raho, boss.','Ek minute, server down hai.','Chhutta nahi hai?','Uncle is paying in coins.'];
function startQueue(o){if(player.stars){toast('Lose the police first','#ff5d73');return false;}if(o.fare>0){if(!spend(o.fare,o.bank!==false))return false;toast(`Paid ${inr(o.fare)} · ${esc(o.title)}`,'#3ddc97');}
  const refund=why=>{if(o.fare>0){P.cash+=o.fare;dirty=true;toast(`${why} · ${inr(o.fare)} refunded`,'#d6c8e4');}};const rush=(clockH>=8&&clockH<11)||(clockH>=17&&clockH<21);let ahead=o.ahead!=null?o.ahead:Math.floor(MR(0,rush?6:3));const svc=CFG.queue[o.place]||15;
  const total=Math.max(1,(ahead+1)*svc);openWait({kind:'Queue',title:o.title,sub:ahead?`${ahead} ${ahead===1?'person':'people'} ahead of you${rush?' · rush hour':''}`:'You are next',total,cancel:'Leave the queue',onCancel:()=>refund('You left the queue'),
    timeText:(l,f)=>{const pos=Math.ceil((1-f)*(ahead+1))-1;$('#wsub').textContent=pos>0?`${pos} ahead of you`:'Being served';return `~${l}s`;},
    buttons:[...(['petrol','cng'].includes(o.place)&&player.mode==='drive'?[{id:'honk',label:'Honk',fn:()=>{hornSfx();toast(mpick(QLINES),'#ffc93c');}}]:[]),{id:'cut',label:'Cut the queue',fn:()=>{closeWait();toast('Attendant: "Line mein aao!" · service refused','#ff5d73');refund('Service refused');}}],
    onDone:()=>{o.onServe&&o.onServe();}});return true;}

/* ================= sheets ================= */
let sheetClose=null;const sheetOpen=()=>!$('#sheetWrap').hidden;
// Every sheet has ‹ Back: it returns to the sheet you came from (Settings, Phone, Menu, apps, shops…), or closes the
// first one. The phone's back gesture or button does the same.
let sheetStack=[],curSheet=null,navBack=false,histOn=false,skipPop=0;let pendingBack=0;
function openSheet(title,sub,body,bind,onClose){const was=sheetOpen();if(!was)sheetStack=[];else if(curSheet&&!navBack&&curSheet.title!==title){sheetStack.push(curSheet);if(sheetStack.length>12)sheetStack.shift();}
  curSheet={title,sub,body,bind,onClose};$('#sheet').onclick=null;$('#sheetWrap').classList.remove('lookmode');
  $('#sheet').innerHTML=($('#sheetWrap').classList.contains('phonemode')?`<div class="pstat"><b>${bayTime()}</b><i class="notch"></i><span>📶 4G 🔋</span></div>`:'')+`<div class="shead"><button class="back" aria-label="Back" title="Back" data-back>‹</button><div class="stt"><h2>${title}</h2><div class="sub">${sub||''}</div></div><button class="x" aria-label="Close" data-close>×</button></div><div id="sbody">${body}</div>`;
  $('#sheetWrap').hidden=false;sheetClose=onClose||null;for(const k in keys)keys[k]=false;$$('.pad button').forEach(b=>b.classList.remove('on'));$('#sheet').querySelector('[data-close]').onclick=closeSheet;
  $('#sheet').querySelector('[data-back]').onclick=e=>{e.stopPropagation();sheetBack();};
  if(pendingBack){clearTimeout(pendingBack);pendingBack=0;histOn=true;}   // a sheet that opens right after another closed reuses its history step
  if(!histOn){try{history.pushState({ibSheet:1},'');histOn=true;}catch(e){}}if(bind)bind($('#sheet'));}
function sheetBack(){const prev=sheetStack.pop();if(!prev)return closeSheet();if(sheetClose){const f=sheetClose;sheetClose=null;try{f();}catch(e){}}navBack=true;try{openSheet(prev.title,prev.sub,prev.body,prev.bind,prev.onClose);}finally{navBack=false;}}
function closeSheet(){$('#sheetWrap').hidden=true;$('#sheetWrap').classList.remove('phonemode');sheetStack=[];curSheet=null;if(histOn){histOn=false;clearTimeout(pendingBack);pendingBack=setTimeout(()=>{pendingBack=0;if(histOn)return;try{skipPop++;history.back();}catch(e){skipPop=Math.max(0,skipPop-1);}},80);}if(sheetClose){const f=sheetClose;sheetClose=null;f();}}
addEventListener('popstate',()=>{if(skipPop){skipPop--;return;}if(!histOn)return;histOn=false;if(sheetOpen()){sheetBack();if(sheetOpen()&&!histOn){try{history.pushState({ibSheet:1},'');histOn=true;}catch(e){}}}});
$('#sheetWrap').addEventListener('click',e=>{if(e.target.id==='sheetWrap')closeSheet();});
const uiLock=()=>sheetOpen()||waitOpen()||!started||howOpen();
function rowHtml(id,nm,sub,label,cls=''){return`<div class="row"><div class="nm">${nm}<small>${sub}</small></div><button class="buy ${cls}" data-id="${id}">${label}</button></div>`;}
function spend(n,allowBank){if(P.cash>=n){P.cash-=n;dirty=true;return true;}if(allowBank&&P.cash+P.bank>=n){P.bank-=n-P.cash;P.cash=0;dirty=true;return true;}toast(`Not enough ${allowBank?'money':'cash'} · you need ${inr(n)}`,'#ff5d73');return false;}
function earn(n,why){P.cash+=n;P.stats.earned+=n;dirty=true;emit('earn',{n,why});}

/* core shops */
const KIND_MIN=k=>CFG.act[k]||CFG.act.snack;
let parcelMode=false;
function foodSheet(poi){const list=W.menus[poi.extra]||W.menus.MH;openSheet(poi.name,`Cash ${inr(P.cash)} · Food ${Math.round(P.hunger)}%`,`<div class="chips"><button class="chip${parcelMode?'':' on'}" data-pm="0">🍽 Eat here</button><button class="chip${parcelMode?' on':''}" data-pm="1">📦 Parcel · keep for later</button></div>`+list.map(([id,nm,sub,p,fx,k])=>rowHtml(id,nm,parcelMode?`${sub} · packed to take away · keeps about 6 Bay hours`:`${sub} · ${KIND_MIN(k)} min`,inr(cost('food.'+poi.extra+'.'+id,p)))).join(''),
  s=>s.onclick=e=>{if(e.target.dataset.pm!=null){parcelMode=e.target.dataset.pm==='1';return foodSheet(poi);}const id=e.target.dataset.id;if(!id)return;const it=list.find(i=>i[0]===id);if(!spend(cost('food.'+poi.extra+'.'+id,it[3])))return;
    if(parcelMode){emit('parcel',{item:it,from:poi.name,kind:'fresh'});toast(`📦 ${it[1]} packed · in your food bag (Phone → Food bag)`,'#3ddc97');return foodSheet(poi);}closeSheet();emit('eat',it);startActivity({kind:'Eating',title:it[1],sub:poi.name,minutes:KIND_MIN(it[5]),effects:healFx(it[4]),onDone:()=>toast(`${it[1]} · tasty`,'#3ddc97')});});}
function bankSheet(poi){const gun=!!(WEAP[P.weapon]&&WEAP[P.weapon].ammo);const amts=[500,5000,'all'];
  const body=`<div class="bal"><div><small>Cash</small><b>${inr(P.cash)}</b></div><div><small>Bank</small><b>${inr(P.bank)}</b></div></div>`+amts.map(a=>rowHtml('d'+a,a==='all'?'Deposit all cash':'Deposit '+inr(a),'At the counter · bank money is safe','Deposit')).join('')+
    amts.map(a=>rowHtml('w'+a,a==='all'?'Withdraw everything':'Withdraw '+inr(a),'ATM · there may be a queue','Withdraw','ghost')).join('')+(CFG.weapons?rowHtml('rob','Rob the bank',gun?'Grab the cash drawer. 3 stars at least.':'You need a gun in hand','Rob','danger'):'');
  openSheet(poi.name,'Savings account · counter and ATM',body,s=>s.onclick=e=>{const id=e.target.dataset.id;if(!id)return;
    if(id==='rob'){if(!gun){toast('Equip a pistol or shotgun first','#ff9f1c');return;}const hrs=gameMin()/60;if(hrs-P.robbedAt<6){toast('The vault is still empty · come back later','#ff9f1c');return;}const take=Math.round(MR(8000,20000)/100)*100;earn(take,'robbery');P.robbedAt=hrs;closeSheet();addWanted(Math.max(3-player.stars,1),'Bank robbery');toast(`+${inr(take)} · run!`,'#3ddc97');fleeFrom(player.pos.x,player.pos.z,60);return;}
    const a=id.slice(1),n=a==='all'?null:+a;if(id[0]==='d'){const v=n==null?P.cash:Math.min(n,P.cash);if(v<=0){toast('No cash to deposit','#ff9f1c');return;}P.cash-=v;P.bank+=v;save();emit('deposit',v);bankSheet(poi);}
    else{const v=n==null?P.bank:Math.min(n,P.bank);if(v<=0){toast('Your account is empty','#ff9f1c');return;}closeSheet();startQueue({place:'atm',title:'ATM queue',onServe:()=>{P.bank-=v;P.cash+=v;save();toast(`Withdrew ${inr(v)}`,'#3ddc97');}});}});}
// Beta v2.02.00: a bigger shop: lathi, knife, SMG, rifle, body armour and ammo for each gun
const GUNSHOP=[['bat','Cricket bat','Close-range swing',600],['lathi','Lathi','A long bamboo stick',400],['knife','Knife','Quick close-range strikes',900],['pistol','Pistol','Includes 24 rounds',8000],['shotgun','Shotgun','Includes 12 shells · hits up to 3 at close range',20000],['smg','SMG','Includes 60 rounds · fast fire',35000],['rifle','Rifle','Includes 10 rounds · long range',45000],['armour','Body armour','Bulletproof vest · takes 60% of the damage until it wears out',6000],['ammoP','Pistol rounds','24 rounds',600],['ammoS','Shotgun shells','12 shells',900],['ammoM','SMG rounds','60 rounds',1500],['ammoR','Rifle rounds','10 rounds',1200]];
const GUNAMMO={ammoP:['pistol',24],ammoS:['shotgun',12],ammoM:['smg',60],ammoR:['rifle',10]},GUNSTART={pistol:24,shotgun:12,smg:60,rifle:10};
function gunSheet(poi){if(!CFG.weapons){toast('Weapons are switched off in this world','#d6c8e4');return;}openSheet(poi.name,`Cash ${inr(P.cash)}`,GUNSHOP.map(([id,nm,sub,p])=>rowHtml(id,nm,id==='armour'&&P.armour>0?sub+' · now '+Math.round(P.armour)+'%':WEAP[id]&&WEAP[id].ammo&&P.weapons.includes(id)?sub+' · '+(P.ammo[WEAP[id].ammo]||0)+' left':sub,WEAP[id]&&P.weapons.includes(id)?'Owned':inr(cost('gun.'+id,p)),P.weapons.includes(id)?'ghost':'')).join(''),
  s=>s.onclick=e=>{const id=e.target.dataset.id;if(!id)return;const it=GUNSHOP.find(i=>i[0]===id);if(WEAP[id]&&P.weapons.includes(id))return;if(id==='armour'&&P.armour>=100){toast('Your vest is as good as new','#d6c8e4');return;}if(!spend(cost('gun.'+id,it[3])))return;
    if(GUNAMMO[id]){const [k,n]=GUNAMMO[id];P.ammo[k]=(P.ammo[k]||0)+n;}else if(id==='armour')P.armour=100;else{P.weapons.push(id);P.weapon=id;if(GUNSTART[id])P.ammo[id]=(P.ammo[id]||0)+GUNSTART[id];}updWeap();save();emit('buy',{kind:'weapon',id});toast(`Bought ${it[1]}`,'#3ddc97');gunSheet(poi);});}
const SHOWROOM=[['auto','Auto rickshaw','CNG · no licence needed',12000],['car','Hatchback','Petrol · LMV licence',45000],['sedan','Sedan','Petrol · for cab jobs',85000],['suv','SUV','Diesel · big and tough',120000],['sports','Sports coupe','Top speed 110 km/h',250000],['mpv','MPV','7 seats · diesel · for families and cab jobs',150000],['van','Van','The everyday people mover',55000],['pickup','Pickup','Open bed for goods',110000],['coupe','Coupe','Two doors, quick',220000],['convertible','Convertible','Roof down by the sea',320000],['limo','Limousine','Long, black and grand',900000],['camper','Camper van','Sleep anywhere · road trips',400000],['tractor','Tractor','Slow and strong · farms and villages',350000],['lorry','Lorry','Open goods truck · heavy licence',650000],['tanker','Tanker','Fuel and water · heavy licence',800000],['towtruck','Tow truck','Pull broken cars to the mechanic · heavy licence',700000],['skycar','Aerion flying car','Electric · drives, then press F to fly · car licence',2500000]];
function buyVehicle(type,cost,near){if(!spend(cost,true))return false;P.cars.push({type,fuel:100,hp:100});const i=P.cars.length-1;const [x,z,h]=freeRoadSpot(near);spawnOwned(i,x,z,h);save();emit('buy',{kind:'vehicle',type});toast(`${SPEC[type].label} is yours · parked outside`,'#3ddc97');return true;}
function carSheet(poi){openSheet(poi.name,`Cash ${inr(P.cash)} · bank money works too`,SHOWROOM.filter(r=>!(STORY&&r[0]==='skycar')).map(([id,nm,sub,p])=>rowHtml(id,nm,sub,inr(cost('veh.'+id,p)))).join('')+`<p class="note">Comes with a full tank.</p>`,
  s=>s.onclick=e=>{const id=e.target.dataset.id;if(!id)return;const it=SHOWROOM.find(i=>i[0]===id);if(buyVehicle(id,cost('veh.'+id,it[3]),{x:poi.x,z:poi.z}))closeSheet();});}
function realtySheet(poi){openSheet(poi.name,`Cash ${inr(P.cash)} · Bank ${inr(P.bank)}`,W.homes.filter(h=>!h.starter).map(h=>{const z=W.zones.find(q=>q.id===h.zone);return rowHtml(h.id,h.name,`${z?z.name:''} · ${({chawl:'one room',flat:'flat',bungalow:'bungalow',cottage:'cottage',pol:'old city house',haveli:'haveli',villa:'villa',tent:'tent',portuguese:'Portuguese house',hut:'hut',nalukettu:'nalukettu',houseboat:'houseboat'})[h.type]||'home'}`,P.homes.includes(h.id)?'Owned':inr(cost('home.'+h.id,h.price)),P.homes.includes(h.id)?'ghost':'');}).join('')+`<p class="note">Homes are marked H on the map once you own them. Sleep, cook, decorate, hide from police, or rent them out.</p>`,
  s=>s.onclick=e=>{const id=e.target.dataset.id;if(id)buyHome(id,()=>realtySheet(poi));});}
function buyHome(id,done){const h=homeById(id);const c=cost('home.'+h.id,h.price);if(P.homes.includes(id))return;if(!spend(c,true))return;P.homes.push(id);save();emit('buy',{kind:'home',id});toast(`${h.name} is yours`,'#3ddc97');done&&done();}
function fuelSheet(poi){const v=player.veh;if(!v){toast('Drive in to refuel','#d6c8e4');return;}const sp=v.spec;if(!sp.fuel){toast(`A ${sp.label.toLowerCase()} runs on legs, not fuel`,'#d6c8e4');return;}
  const cng=poi.type==='cng';if(cng!==(sp.fuel==='cng')){toast(cng?'This pump only has CNG':`This ${sp.label.toLowerCase()} runs on CNG · find a CNG pump`,'#ff9f1c');return;}
  const per=CFG.fuel[sp.fuel]*CFG.priceMul;const unit='L';const need=(100-v.fuel)/100*sp.tank;const full=Math.ceil(need*per);
  openSheet(poi.name,`${sp.label} · ${Math.round(v.fuel)}% · ${inr(per)}/${unit}`,rowHtml('full','Fill it up',`${need.toFixed(1)} ${unit}`,inr(full))+rowHtml('500','₹500 worth',`${(500/per).toFixed(1)} ${unit}`,inr(500),'ghost')+rowHtml('200','₹200 worth',`${(200/per).toFixed(1)} ${unit}`,inr(200),'ghost'),
    s=>s.onclick=e=>{const id=e.target.dataset.id;if(!id)return;
      const amt=id==='full'?full:+id;if(amt<=0){toast('Tank is already full','#d6c8e4');return;}if(P.cash<amt){toast(`You need ${inr(amt)} in cash`,'#ff5d73');return;}closeSheet();
      startQueue({place:cng?'cng':'petrol',title:cng?'CNG pump queue':'Petrol pump queue',fare:amt,bank:false,onServe:()=>{v.fuel=Math.min(100,v.fuel+amt/per/sp.tank*100);dirty=true;emit('refuel',v);toast(`Filled · ${Math.round(v.fuel)}% tank`,'#3ddc97');}});});}
function hospitalSheet(poi){openSheet(poi.name,`Health ${Math.round(P.health)}%`,rowHtml('heal','Full treatment','Restores health to 100% · OPD queue',inr(cost('svc.hospital',300))),s=>s.onclick=e=>{if(!e.target.dataset.id)return;if(P.cash<cost('svc.hospital',300)){toast(`You need ${inr(cost('svc.hospital',300))}`,'#ff5d73');return;}closeSheet();
  startQueue({place:'hospital',title:'OPD queue',fare:cost('svc.hospital',300),bank:false,onServe:()=>{P.health=100;dirty=true;toast('Treated · health 100%','#3ddc97');}});});}
function policeSheet(poi){const ch=P.challans.reduce((a,c)=>a+c.amt,0);const fine=price(1000*player.stars);
  openSheet(poi.name,`${player.stars?player.stars+' star'+(player.stars>1?'s':''):'No wanted level'}${ch?' · '+P.challans.length+' unpaid challan'+(P.challans.length>1?'s':''):''}`,(player.stars?rowHtml('fine','Surrender and pay','Clears your wanted level',inr(fine)):'')+(ch?rowHtml('ch',`Pay ${P.challans.length} e-challan${P.challans.length>1?'s':''}`,P.challans.slice(-3).map(c=>c.why).join(' · '),inr(ch)):'')||'<p class="note">Nothing to pay · drive safe.</p>',
  s=>s.onclick=e=>{const id=e.target.dataset.id;if(id==='fine'&&spend(fine,true)){player.stars=0;renderStars();emit('stars',0);toast('Fine paid · record clear','#3ddc97');policeSheet(poi);}if(id==='ch'&&spend(ch,true)){P.challans=[];save();toast('All challans paid','#3ddc97');policeSheet(poi);}});}
function lodgeSheet(poi){const p=poi.name.includes('dharamshala')?cost('svc.dharamshala',150):poi.name.includes('tent')||poi.name.includes('camp')?cost('svc.camp',250):cost('svc.lodge',250);openSheet(poi.name,'Rooms by the night',rowHtml('sleep','Sleep here',`Energy ${Math.round(P.energy)}% · a clean room for the night`,inr(p)),s=>s.onclick=e=>{if(!e.target.dataset.id)return;if(P.energy>85){toast('You are not sleepy yet','#d6c8e4');return;}if(!spend(p,true))return;closeSheet();startSleep(poi.name,'Room booked');});}
function safariSheet(poi){const camel=poi.type==='camel';const p=camel?cost('svc.camel',500):cost('svc.safari',800);openSheet(poi.name,camel?'Ride into the dunes at sunset':'Open jeep safari with a guide',rowHtml('go',camel?'Camel ride':'Lion safari',camel?'20 game minutes':'40 game minutes',inr(p)),s=>s.onclick=e=>{if(!e.target.dataset.id||!spend(p))return;closeSheet();
  startActivity({kind:camel?'Camel safari':'Safari',title:camel?'Swaying over the dunes':'Searching for lions',minutes:camel?20:40,effects:{energy:-4},onDone:()=>{if(camel){toast('Sunset over the Thar · unforgettable','#ffc93c');emit('camel');}else{const n=Math.floor(MR(1,5));P.stats.lions+=n;toast(`You spotted ${n} Asiatic lion${n>1?'s':''}!`,'#ffc93c');emit('safari',n);}}});});}
function openPoi(poi){const T=poi.type;if(player.stars&&!['police','home'].includes(T)){toast('Lose the police first · or surrender at a police station','#ff5d73');return;}if(hooks.walkIn&&!poi._desk&&!inside&&player.mode==='foot'&&hooks.walkIn(poi))return;/* Beta v1.01.24: walk into the building first (features/interiors.js) */if(poi.onUse)return poi.onUse(poi,api);if(poiHandlers[T])return poiHandlers[T](poi,api);
  if(T==='food')return foodSheet(poi);if(T==='toilet')return;
  if(T==='bank')return bankSheet(poi);if(T==='guns')return gunSheet(poi);if(T==='cars')return carSheet(poi);if(T==='realty')return realtySheet(poi);if(T==='pump'||T==='cng')return fuelSheet(poi);
  if(T==='home'){if(P.homes.includes(poi.extra))return enterHome(poi);const h=homeById(poi.extra);if(h&&h.starter&&hooks.starterSheet)return hooks.starterSheet(h,poi);return openSheet(h.name,'For sale',rowHtml(h.id,h.name,'Buy it to sleep, cook, decorate and hide from the police',inr(cost('home.'+h.id,h.price))),s=>s.onclick=e=>{if(e.target.dataset.id)buyHome(h.id,()=>{closeSheet();enterHome(poi);});});}
  if(T==='hospital')return hospitalSheet(poi);if(T==='police')return policeSheet(poi);if(T==='lodge')return lodgeSheet(poi);if(T==='safari'||T==='camel')return safariSheet(poi);
  toast(`${poi.name} opens in a coming update`,'#d6c8e4');}

/* ================= phone ================= */
function addApp(a){apps.push(a);}
const ORDER={phone:['calls','messages','map','rewards','invite','swiggy','zomato','baycart','foodbag','sports','challans','baypay','roadside','radio','baygame','camera','baygram','story'],menu:['garage','addgarage','property','jobs','localwork','wardrobe','business'],settings:['online','look','steer','clock','features','film','ach','admin']};
function appGrid(group,skip){const smart=P.phone==='smart';const list=apps.filter(a=>(a.group||'phone')===group&&(!a.admin||adminOK)&&(!a.show||a.show())&&!(skip&&skip.includes(a.id))&&(!api.appFilter||api.appFilter(a))).sort((a,b)=>(ORDER[group].indexOf(a.id)+99)%99-(ORDER[group].indexOf(b.id)+99)%99);
  return `<div class="apps">${list.map(a=>`<button class="app${a.smart&&!smart?' locked':''}" data-app="${a.id}" style="--h:${appHue(a.id)}"><span>${esc(a.icon||'•')}</span>${esc(a.label)}</button>`).join('')}</div>`;}
function appClick(e){const b=e.target.closest('[data-app]');if(!b)return false;const a=apps.find(x=>x.id===b.dataset.app);if(a.smart&&P.phone!=='smart'){toast('Needs a smartphone · Mobile Point sells them','#ff9f1c');return true;}a.fn(api);return true;}
// The phone (Beta v1.01.11): a home screen of apps and folders on swipeable pages, with a dock that never moves.
// Everything that used to be in the ☰ menu lives here now. New apps from features join the end of the home screen.
const DOCK=['calls','messages','map','baygram'];
// Beta v1.01.21: Story, Rewards, Invite and Achievements are on the home screen (no Bay folder); Bay Transport holds every
// ticket app; Film mode, Profile, Settings and Message admin moved into the phone.
const HOME=[{f:'transport',label:'Bay Transport',icon:'🚌',ids:['baytaxi','baybus','baytrain','baymetro','bayflight','mytickets']},{f:'food',label:'BayFood',icon:'🍛',ids:['foodbag','swiggy','zomato']},{f:'veh',label:'Vehicles',icon:'🚗',ids:['garage','addgarage','mechanic','roadside']},
  {f:'pay',label:'BayPay',icon:'💸',ids:['baypay','challans']},'story','rewards','invite','ach','bayradio',{f:'work',label:'Jobs',icon:'💼',ids:['jobs','localwork']},'traveler','location','events','baycart','sports','property','wardrobe','business','baygame','camera','film','profileapp','settingsapp','msgadmin','themes','online','testtools'];
const HOME_HIDE=['radio'];   // opened from inside another app (BayRadio)
const appById=id=>apps.find(a=>a.id===id&&(!a.admin||adminOK)&&(!a.show||a.show()));
const appIcon=(a,cls='')=>`<button class="app${cls}${a.smart&&P.phone!=='smart'?' locked':''}${a.svg?' svg':''}" data-app="${a.id}" style="--h:${appHue(a.id)}"><span>${a.svg||esc(a.icon||'•')}</span>${esc(a.label)}</button>`;
function homeItems(){const used=new Set(DOCK.concat(HOME_HIDE));const out=[];
  for(const it of HOME){if(typeof it==='string'){const a=appById(it);if(a){out.push(appIcon(a));used.add(it);}continue;}
    const L=it.ids.map(appById).filter(Boolean);it.ids.forEach(x=>used.add(x));if(!L.length)continue;
    out.push(`<button class="app folder" data-folder="${it.f}"><span class="fold">${L.slice(0,4).map(a=>`<i style="--h:${appHue(a.id)}">${esc(a.icon)}</i>`).join('')}</span>${esc(it.label)}</button>`);}
  for(const a of apps)if(!used.has(a.id)&&['phone','menu'].includes(a.group||'phone')&&appById(a.id)){out.push(appIcon(a));used.add(a.id);}
  return out;}
let phonePage=0;
function phoneSheet(){const smart=P.phone==='smart';$('#sheetWrap').classList.add('phonemode');
  const items=homeItems();const per=16;const pages=[];for(let i=0;i<items.length;i+=per)pages.push(items.slice(i,i+per));
  const dock=DOCK.map(appById).filter(Boolean);
  openSheet(smart?'<img class="blogo" src="assets/logo-192.png" alt="">India Bay':'📱 Keypad phone',`${istText()}`,`<div class="pclock"><b>${bayTime()}</b><small>Bay time · ${esc(areaName())}</small></div>`+
    `<div class="ppages" id="ppages">${pages.map(pg=>`<div class="ppage">${pg.join('')}</div>`).join('')}</div>`+(pages.length>1?`<div class="pdots">${pages.map((_,i)=>`<i data-pg="${i}"${i===phonePage?' class="on"':''}></i>`).join('')}</div>`:'')+
    (smart?'':'<p class="note">Locked apps need a smartphone. Buy one at any Mobile Point.</p>')+`<div class="pdock">${dock.map(a=>appIcon(a)).join('')}</div>`,
    s=>{s.onclick=e=>{const f=e.target.closest('[data-folder]');if(f)return folderSheet(f.dataset.folder);const d=e.target.closest('[data-pg]');if(d){const pp=s.querySelector('#ppages');pp.scrollTo({left:pp.clientWidth*(+d.dataset.pg),behavior:'smooth'});return;}appClick(e);};
      const dk=s.querySelector('.pdock');const sh=$('#sheet');if(dk&&sh)sh.appendChild(dk);   // pinned at the bottom, outside the scrolling area
      const pp=s.querySelector('#ppages');if(pp){requestAnimationFrame(()=>{pp.scrollLeft=pp.clientWidth*Math.min(phonePage,pages.length-1);});pp.onscroll=()=>{const k=Math.round(pp.scrollLeft/Math.max(1,pp.clientWidth));if(k!==phonePage){phonePage=k;s.querySelectorAll('.pdots i').forEach((x,i)=>x.classList.toggle('on',i===k));}};}});}
function folderSheet(f){const it=HOME.find(q=>q.f===f);if(!it)return;$('#sheetWrap').classList.add('phonemode');const L=it.ids.map(appById).filter(Boolean);
  openSheet(`${it.icon} ${it.label}`,'',`<div class="apps fapps">${L.map(a=>appIcon(a)).join('')}</div>`,s=>s.onclick=appClick);}
const appHue=id=>({map:140,swiggy:28,zomato:355,baycart:215,foodbag:40,sports:120,challans:200,baypay:250,roadside:30,radio:300,baygame:270,camera:210,baygram:320,story:45,rewards:50,invite:160,calls:130,messages:200,testtools:60,online:190})[id]??[...id].reduce((h,c)=>(h*31+c.charCodeAt(0))%360,7);
function menuSheet(){phoneSheet();}
// 🏠 back to the start screen (Beta v1.01.11): saves, then shows the main menu with Continue
function mainMenuSheet(){openSheet('🏠 Main menu','Your game is saved first',`<p class="note">Go back to the start screen to change city, read what's new or start a new game. You continue right where you are.</p><div class="stack"><button class="go" data-id="menu">Go to the main menu</button><button class="buy ghost" data-id="stay">Keep playing</button></div>`,
  s=>s.onclick=e=>{const id=e.target.dataset.id;if(id==='stay')return closeSheet();if(id==='menu'){save();emit('toMenu');closeSheet();toast('Saved · opening the main menu','#3ddc97');setTimeout(()=>location.replace(location.pathname+'?u='+Date.now()+location.hash),900);}});}   // the old ☰ menu: everything is in the phone now
addApp({id:'garage',label:'Garage',icon:'🚗',group:'menu',fn:garageSheet});addApp({id:'features',label:'Features',icon:'✨',group:'settings',fn:()=>featuresSheet()});addApp({id:'look',label:'My look',icon:'🧑',group:'settings',fn:lookSheet});addApp({id:'admin',label:'Admin',icon:'🔑',group:'settings',admin:true,fn:()=>adminSheet()});
addApp({id:'profileapp',label:'Profile',icon:'👤',group:'phone',fn:()=>hubSheet()});addApp({id:'settingsapp',label:'Settings',icon:'⚙',group:'phone',fn:()=>settingsSheet()});
// remove one of your vehicles (sold) and keep the list in order
function dropCar(k){const v=ownedVeh[k];if(v){if(player.veh===v)exitVehicle(true);removeVeh(v);}ownedVeh.splice(k,1);P.cars.splice(k,1);ownedVeh.forEach((q,j)=>{if(q)q.ownedIdx=j;});save();}
function carValue(k){const c=P.cars[k],v=ownedVeh[k];return Math.round(cost('veh.'+c.type,VALUE[c.type]||10000)*.5*Math.max(.3,(v?v.hp:c.hp)/100)/5)*5;}
function garageSheet(){const pp=ppos();const homeNear=P.homes.map(id=>pois.find(q=>q.type==='home'&&q.extra===id)).find(q=>q&&Math.hypot(q.x-pp.x,q.z-pp.z)<45);
  openSheet('🚗 Garage',`${P.cars.length} vehicle${P.cars.length===1?'':'s'} · valet ${inr(cost('svc.valet',200))} brings one to the nearest road`,rowHtml('addv','＋ Add a vehicle','Get in the driver seat of any vehicle, then tap Add · you can name it','Add')+P.cars.map((c,i)=>{const v=ownedVeh[i];const d=v?Math.round(v.pos.distanceTo(pp)*2.4/100)/10:null;const val=Math.round(cost('veh.'+c.type,VALUE[c.type]||10000)*.5*Math.max(.3,(v?v.hp:c.hp)/100)/5)*5;
    const home=c.garage?homeById(c.garage):null;const here=home&&homeNear&&homeNear.extra===c.garage;const mods=[c.tune?'tuned':'',c.horn?'musical horn':''].filter(Boolean).join(', ');
    return `<div class="grow"><div class="gtop"><span class="gdot" style="background:${c.color||'#9aa'}"></span><div class="gname">${c.nick?'<b>'+esc(c.nick)+'</b> · ':''}${SPEC[c.type].label}${c.stolen?' · no papers':''}${c.locked?' · 🔒':''}</div><button class="gren" data-ren="${i}" title="Name it" aria-label="Name it">✏ Name</button></div><small class="ginfo">${home?'In your garage at '+esc(home.name):v?d+' km away':'Not on the street'} · fuel ${Math.round(v?v.fuel:c.fuel)}% · body ${Math.round(v?v.hp:c.hp)}%${mods?' · '+mods:''}</small><div class="gbtns">${here?`<button class="buy" data-out="${i}">Take out</button>`:`<button class="buy ghost" data-id="${i}">Deliver</button>`}${v&&!home&&P.homes.length?`<button class="buy ghost" data-ret="${i}" title="Return to your garage">🏠 Return to garage</button>`:''}${P.cars.length>1?`<button class="buy danger" data-sell="${i}">${api.VSALE&&api.VSALE.isFor(c)?'🤝 Buyer waiting':'💰 Sell ~'+inr(val)}</button>`:''}</div></div>`;}).join('')||'<p class="note">No vehicles yet. Visit Bay Motors or a two-wheeler dealer.</p>'+
    `<p class="note">Park in your own garage: drive up to a home you own and press E. A vehicle you take from the street can be kept too: park it in your garage, or get papers at a mechanic workshop.</p>`,
  s=>s.onclick=e=>{if(e.target.dataset.id==='addv'){return openApp('addgarage');}const rn=e.target.dataset.ren;if(rn!=null)return api.nameCar&&api.nameCar(+rn,garageSheet);const si=e.target.dataset.sell,out=e.target.dataset.out;if(out!=null){const k=+out;const c=P.cars[k];const hp=pois.find(q=>q.type==='home'&&q.extra===c.garage);const [x,z,h]=freeRoadSpot(hp||player.pos,ownedVeh[k]);const v=spawnOwned(k,x,z,h);closeSheet();toast(`${SPEC[c.type].label} out of the garage`,'#3ddc97');return;}
    const rt=e.target.dataset.ret;if(rt!=null){const k=+rt;const hm=P.homes.map(id=>pois.find(q=>q.type==='home'&&q.extra===id)).filter(Boolean).sort((a,b)=>Math.hypot(a.x-pp.x,a.z-pp.z)-Math.hypot(b.x-pp.x,b.z-pp.z))[0];if(!hm)return toast('You need a home with a garage','#ff9f1c');if(player.veh===ownedVeh[k])exitVehicle(true);const fee=cost('svc.valet',200);if(!spend(fee,true))return;storeOwned(k,hm.extra);save();toast(`🏠 A valet drives your ${SPEC[P.cars[k].type].label.toLowerCase()} back to your garage at ${esc(hm.name)} · ${inr(fee)}`,'#3ddc97');emit('garage',{kind:'return'});garageSheet();return;}
    if(si!=null&&api.VSALE){closeSheet();return api.VSALE.list(+si);}
    if(si!=null){const k=+si;const v=ownedVeh[k];if(player.veh&&player.veh===v){toast('Get out before selling it','#ff9f1c');return;}const c=P.cars[k];const val=Math.round(cost('veh.'+c.type,VALUE[c.type]||10000)*.5*Math.max(.3,(v?v.hp:c.hp)/100)/5)*5;
    if(v)removeVeh(v);ownedVeh.splice(k,1);P.cars.splice(k,1);ownedVeh.forEach((q,j)=>{if(q)q.ownedIdx=j;});earn(val,'sale');save();toast(`Sold for ${inr(val)}`,'#3ddc97');garageSheet();return;}const i=e.target.dataset.id;if(i==null)return;if(inside){toast('Go outside first','#ff9f1c');return;}if(player.veh===ownedVeh[+i]){toast('You are already in it','#d6c8e4');return;}const fee=cost('svc.valet',200);if(!spend(fee,true))return;const [x,z,h]=freeRoadSpot(player.pos,ownedVeh[+i]);spawnOwned(+i,x,z,h);closeSheet();toast(`${SPEC[P.cars[i].type].label} delivered · ${inr(fee)} valet`,'#3ddc97');});}
function settingsSheet(){const rOff=!(P.extra.radio&&P.extra.radio.on);openSheet('⚙ Settings',P.name?`Playing on this device as ${esc(P.name)}`:'Playing solo',appGrid('settings',['look','film','ach'])+rowHtml('sound','Sound',muted?'Off':'On',muted?'Turn on':'Turn off','ghost')+rowHtml('radio','Radio',rOff?'Off · stays off until you turn it on':'On · remembers your station · R switches',rOff?'Turn on':'Turn off','ghost')+rowHtml('gfx','🔋 Graphics',{saver:'Battery saver · cool phone, 30 fps',balanced:'Balanced · smoother, a little warmer',high:'High · sharpest, best on laptops'}[GFX.lvl],'Change','ghost')+rowHtml('howto','How to play','A short guide to the basics','Show','ghost')+(TESTMODE||(api.canTestPlay&&api.canTestPlay())?rowHtml('testplay','🧪 Play mode',TESTMODE?'TEST PLAY · separate save, everything unlocked':'Real play · testers can switch to test play',TESTMODE?'Back to real play':'Test play','ghost'):'')+rowHtml('help','Controls','Keyboard and touch','Show','ghost')+rowHtml('profile','Profile','Username and age','Edit','ghost')+(api.ONLINE&&api.ONLINE.signedIn?rowHtml('logout','Log out',api.ONLINE.guest?'Guest account · it cannot be recovered after logging out':'Signed in as @'+esc((hooks.displayName&&hooks.displayName())||P.name)+' · sign in again any time','Log out','danger'):'')+rowHtml('insta','📸 Follow us on Instagram','@indiabaygame · news, updates and the best player photos','Open','ghost')+rowHtml('suggest','Suggest a schedule change','Opening hours, festivals or events · goes to the admin','Write','ghost')+rowHtml('reset','Start a new game','Clears progress on this device','Reset','danger')+`<p class="note" style="text-align:center;user-select:none">About · India Bay <span data-ibver>${esc(VERSION)}</span></p>`,
  s=>s.onclick=e=>{if(appClick(e))return;const id=e.target.dataset.id;if(!id)return;if(id==='sound'){if(api.SOUND)return api.SOUND.sheet();setMuted(!muted);settingsSheet();}if(id==='radio'){emit('radioSetting',rOff);settingsSheet();}if(id==='help')helpSheet();if(id==='gfx')gfxSheet();if(id==='howto'){closeSheet();howTo(0);}if(id==='profile'){if(hooks.profileEdit)hooks.profileEdit();else profileSheet(false);}if(id==='suggest')suggestSheet();if(id==='insta')window.open('https://www.instagram.com/indiabaygame/','_blank','noopener');if(id==='testplay')api.setTestMode(!TESTMODE);if(id==='logout'){if(!e.target.dataset.out){e.target.dataset.out=1;e.target.textContent='Tap again to log out';return;}api.ONLINE.signOut();}
    if(id==='reset'){if(e.target.dataset.sure){P=newSave();store.set(SAVEKEY,P);location.reload();}else{e.target.dataset.sure=1;e.target.textContent='Tap again';}}});}
function gfxSheet(){const L=[['saver','🔋 Battery saver','30 frames a second, lighter resolution, a bit less traffic · keeps phones cool (best for phones)'],['balanced','⚖ Balanced','45 frames a second, sharper · phones get a little warm'],['high','✨ High','Full frame rate and resolution, longest view · best on laptops and desktops']];
  openSheet('🔋 Graphics','Changes apply after a quick reload · your game is saved',L.map(([k,n,d])=>rowHtml(k,n,d,GFX.lvl===k?'Current':'Use',GFX.lvl===k?'ghost':'')).join(''),s=>s.onclick=e=>{const k=e.target.dataset.id;if(!k||k===GFX.lvl)return;try{localStorage.setItem('ib.gfx',k);}catch(_){}save();location.reload();});}
/* profile hub: the 👤 button, in the game and on the start screen. Online play adds account rows through api.addProfileRows. */
const profileRows=[];
function setAvatar(){const u=(hooks.displayName&&hooks.displayName())||P.name;const n=P.fullName||u;const el=$('#pAv');if(el)el.textContent=n?n[0].toUpperCase():'👤';
  const ip=$('#introProf');if(ip){const lab=hooks.introLabel?hooks.introLabel():(u?u:'Profile');ip.innerHTML=`<span class="pav sm">${esc(n?n[0].toUpperCase():'👤')}</span><span>${esc(lab)}</span>`;}}
function openApp(id){const a=apps.find(x=>x.id===id);if(a)a.fn();}
// a headshot of your character for the profile, drawn once per look with a small separate renderer
let hsR=null,hsKey='',hsURL='';
function headshot(){try{const key=lookCode()+(P.wear&&P.wear.shirt||'');if(key===hsKey&&hsURL)return hsURL;
  if(!hsR){hsR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});hsR.setSize(192,192,false);hsR.setPixelRatio(1);}
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xfff4e0,0x553322,1.05));const dl=new THREE.DirectionalLight(0xffffff,.7);dl.position.set(1.5,3,2.5);sc.add(dl);
  const L=Object.assign({},LOOK_DEF,P.look||{});const g=buildPerson('#2f6fd0',{look:Object.assign({},L),female:L.female});sc.add(g);g.rotation.y=-.35;g.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(g);const top=box.max.y,cx=(box.min.x+box.max.x)/2,cz=(box.min.z+box.max.z)/2;const ty=top-.2;
  const cam=new THREE.PerspectiveCamera(30,1,.05,20);cam.position.set(cx+.18,ty+.04,cz+1.15);cam.lookAt(cx,ty,cz);hsR.setClearColor(0x000000,0);hsR.render(sc,cam);
  hsURL=hsR.domElement.toDataURL('image/png');hsKey=key;g.traverse(o=>{if(o.geometry&&o.geometry.dispose&&!o.geometry.userData.shared)try{o.geometry.dispose();}catch(e){}});return hsURL;}catch(e){return '';}}
// Profile (Beta v1.01.11): headshot, email, username, money and achievements, then your look, film mode,
// test play, username and age, achievements and settings.
function hubSheet(){const ex=profileRows.map(f=>{try{return f();}catch(e){return null;}}).filter(Boolean)[0]||null;
  const u=(hooks.displayName&&hooks.displayName())||P.name||'',full=P.fullName||'',shown=full||u||'New player';const em=api.userEmail?api.userEmail():'';
  const row=r=>rowHtml(r.id,r.label,r.sub||'',r.btn,r.cls||'ghost');
  const end=ex?(ex.end||[]):(P.name||hadSave?[{id:'h_wipe',label:'🗑 Delete my data',sub:'Erases your player and progress on this device',btn:'Delete',cls:'danger'}]:[]);
  const hs=started||startedOnce?headshot():'';const achN=Object.keys(P.ach||{}).length;
  const film=api.FILM&&api.FILM.allowed&&api.FILM.allowed()&&started;
  openSheet('Profile','',`<div class="phead2"><div class="hshot">${hs?`<img src="${hs}" alt="">`:`<span>${esc(shown[0].toUpperCase())}</span>`}</div><div class="pinfo"><b>${esc(shown)}</b>${em?`<small class="pem">${esc(em)}</small>`:`<small class="pem">${esc(ex&&ex.sub||'Playing on this device')}</small>`}${u?`<small>@${esc(u)}</small>`:''}</div></div>`+
    (P.name?`<div class="pstats"><div><small>Cash</small><b>${inr(P.cash)}</b></div><div><small>Bank</small><b>${inr(P.bank)}</b></div><button type="button" data-id="h_ach"><small>Achievements</small><b>🏆 ${achN}</b></button></div>`:'')+
    (ex&&ex.top||[]).map(row).join('')+
    (started?rowHtml('h_look','🧑 My look','Face, hair, skin, build and clothes','Change','ghost'):'')+
    rowHtml('h_edit','✏ Username and age','Your username, name and date of birth','Edit','ghost')+
    rowHtml('h_ach','🏆 Achievements',`${achN} reached · see what is left`,'Open','ghost')+rowHtml('h_set','⚙ Settings','Sound, radio, steering, Bay clock and online','Open','ghost')+rowHtml('h_priv','🔒 Privacy policy','What we collect and why','Read','ghost')+rowHtml('h_sup','💬 Contact support','support@indiabaygame.com','Write','ghost')+
    end.map(row).join(''),
    s=>s.onclick=e=>{const b=e.target.closest('[data-id]');const id=b&&b.dataset.id;if(!id)return;if(id==='h_ach')return openApp('ach');if(id==='h_set')return settingsSheet();if(id==='h_priv')return window.open('privacy.html','_blank','noopener');if(id==='h_sup')return supportSheet();
      if(id==='h_look')return lookSheet();if(id==='h_film'){closeSheet();return setTimeout(()=>api.FILM.start(),150);}if(id==='h_edit'){if(hooks.profileEdit)return hooks.profileEdit();return profileSheet(false);}
      if(id==='h_wipe'){if(!e.target.dataset.sure){e.target.dataset.sure=1;e.target.textContent='Tap again to delete';return;}P=newSave();store.set(SAVEKEY,P);location.reload();return;}
      if(ex&&ex.handle&&(ex.top||[]).concat(ex.end||[]).some(r=>r.id===id))ex.handle(id,e);});}
function supportSheet(){const SITE=window.SITE||{};const mail=SITE.supportEmail||'';const can=!!(cfgBackend&&cfgBackend.support);
  openSheet('Contact support',can?'Your message goes straight to the India Bay team':mail?'Opens your email app':'Send us a message',`<form class="form" id="sup" novalidate><label>Topic<select id="su_t"><option>Something is broken</option><option>Account or sign-in</option><option>Lost progress</option><option>Report a player</option><option>Delete my data</option><option>Idea or feedback</option><option>Other</option></select></label>
    <label>Message<textarea id="su_m" maxlength="1000" placeholder="What happened? Where in the game were you?"></textarea></label><label>Email for our reply (optional)<input type="email" id="su_e" maxlength="120" value="${esc((hooks.userEmail&&hooks.userEmail())||'')}" placeholder="you@example.com"></label>
    <div class="btnrow"><button class="go" type="submit">Send</button></div><p class="note" id="su_msg">${mail?`You can also email <a href="mailto:${esc(mail)}">${esc(mail)}</a>.`:can?'':'Sign in to play online to send messages from the game.'}</p></form>`,s=>{
    s.querySelector('#sup').onsubmit=async e=>{e.preventDefault();const m=s.querySelector('#su_msg');const row={topic:s.querySelector('#su_t').value,message:s.querySelector('#su_m').value.trim().slice(0,1000),reply_email:s.querySelector('#su_e').value.trim().slice(0,120),name:P.name||'',page:location.host+' · v'+VERSION+' · '+navigator.userAgent.slice(0,80)};
      if(row.message.length<5){m.textContent='Please write a little more so we can help.';m.className='note bad';return;}
      if(can){m.textContent='Sending…';m.className='note';try{await cfgBackend.support(row);closeSheet();toast('Sent · thank you, we will get back to you','#3ddc97');}catch(err){m.textContent='Could not send: '+(err&&err.message||'check your connection');m.className='note bad';}return;}
      if(mail){location.href=`mailto:${mail}?subject=${encodeURIComponent('India Bay · '+row.topic)}&body=${encodeURIComponent(row.message+'\n\n— '+row.name+' · '+row.page)}`;return;}
      m.textContent='Support messages need online play. Open the game at indiabaygame.com and sign in.';m.className='note bad';};});}
function suggestSheet(){openSheet('Suggest a change','The admin reads every suggestion',`<form class="form" id="sg" novalidate><label>Region<select id="sg_r">${REGIONS.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}</select></label><label>Your suggestion<textarea id="sg_t" maxlength="400" placeholder="Keep the West open till 3 am on Saturdays"></textarea></label><div class="note" id="sg_m"></div><div class="btnrow"><button class="go" type="submit">Send</button></div></form>`,s=>{s.querySelector('#sg').onsubmit=async e=>{e.preventDefault();const t=s.querySelector('#sg_t').value.trim(),m=s.querySelector('#sg_m');if(t.length<5){m.textContent='Write a few words first.';m.className='note bad';return;}
  const row={region:s.querySelector('#sg_r').value,text:t.slice(0,400),name:P.name||'player',date:istISO()};if(cfgBackend&&cfgBackend.suggest){try{await cfgBackend.suggest(row);closeSheet();toast('Sent to the admin · thank you','#3ddc97');return;}catch(err){m.textContent='Could not send. Check your connection and that you are signed in.';m.className='note bad';return;}}if(db){try{await db.collection('suggestions').add(row);closeSheet();toast('Sent to the admin · thank you','#3ddc97');return;}catch(err){m.textContent='Could not send. Only players with access to this game can send suggestions.';m.className='note bad';return;}}
  const l=store.get('ib.suggestions')||[];l.push(row);store.set('ib.suggestions',l);closeSheet();toast('Saved on this device for the admin','#3ddc97');};});}
function helpSheet(){openSheet('Controls','',`<div class="note" style="font-size:14px;line-height:1.9;color:var(--ink)"><b>Keyboard</b><br><kbd>W</kbd><kbd>S</kbd> forward and back · <kbd>A</kbd><kbd>D</kbd> turn · <kbd>Shift</kbd> run · <kbd>E</kbd> enter, leave, use · <kbd>J</kbd> or click attack · <kbd>Q</kbd> weapon · <kbd>Space</kbd> brake · <kbd>H</kbd> horn · <kbd>C</kbd> camera · <kbd>M</kbd> phone · <kbd>I</kbd> menu · <kbd>O</kbd> settings · <kbd>R</kbd> radio · <kbd>N</kbd> India map · <kbd>P</kbd> photo mode<br>
  <b>Touch</b><br>Arrows turn · GO and BACK move · E enters, leaves and uses · FIRE attacks · GUN switches weapon · HORN honks · tap the minimap for the map<br><b>Tips</b><br>Keep cash in the bank. Fill up before long highway drives. Wear a helmet on bikes: falls hurt less. Jobs need the right licence from an RTO office.</div>`);}
const BLOCK=['admin','police','mod','moderator','support','staff','claude','anthropic','root','system','sex','fuck','shit','bitch','chutiya','madarchod','bhenchod','gandu','randi','harami','kamina','bastard','asshole'];
function nameOk(n){n=String(n||'');if(n.length<3||n.length>15)return 'Use 3 to 15 characters.';if(!/^[a-z0-9_.]+$/.test(n))return 'Use only small letters a-z, numbers 0-9, _ and .';if(/^\.|\.$|\.\./.test(n))return 'A dot cannot be first, last or twice in a row.';const l=n.replace(/[_.]/g,'');if(BLOCK.some(b=>l.includes(b)))return 'That name is not allowed. Try another.';return '';}
// Beta v1.01.18: usernames are small letters a-z, 0-9, _ and . · as the player types, capitals become small letters and spaces become _
function unameIn(inp){const v=inp.value,c=v.toLowerCase().replace(/\s/g,'_').replace(/[^a-z0-9_.]/g,'');if(c!==v){const p=inp.selectionStart;inp.value=c;try{inp.setSelectionRange(Math.min(p,c.length),Math.min(p,c.length));}catch(e){}}}
function unameField(val,ph){return `<label>Username<input type="text" id="pf_name" maxlength="15" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="email" value="${esc(val||'')}" placeholder="${ph||'raju_2026'}"></label><div class="note" id="pf_msg">Small letters a-z, numbers 0-9, _ and . · 3 to 15 long. Other players see this name, and nobody else can have it.</div>`;}
// Male / Female: sets how your player looks (change the rest any time in My look)
function sexField(f){return `<div class="sexpick" role="radiogroup" aria-label="Your look"><span class="lbl">Male / Female <small>(for your look)</small></span><label class="sx${f===false?' on':''}"><input type="radio" name="pf_sex" value="m"${f===false?' checked':''}>👨 Male</label><label class="sx${f===true?' on':''}"><input type="radio" name="pf_sex" value="f"${f===true?' checked':''}>👩 Female</label></div>`;}
function sexWire(s){s.querySelectorAll('input[name=pf_sex]').forEach(r=>r.onchange=()=>{s.querySelectorAll('.sexpick .sx').forEach(l=>l.classList.toggle('on',l.querySelector('input').checked));const e=s.querySelector('#pf_err,#un_err');if(e&&/Male or Female/.test(e.textContent))e.textContent='';});}
function sexGet(s){const r=s.querySelector('input[name=pf_sex]:checked');return r?r.value==='f':null;}
function setSex(f){const q=P.look=Object.assign({},LOOK_DEF,P.look||{});if(q.female!==f){q.female=f;q.hair=(f?LOOKS.female.hair:LOOKS.male.hair)[0];if(f)q.beard='none';P.extra=P.extra||{};P.extra.sexSet=1;}dirty=true;try{applyLook();}catch(e){}}
function personErr(full,dob){full=String(full||'').trim();if(full.length<2)return 'Please type your name.';if(!/^[\p{L}\p{M} .'-]{2,60}$/u.test(full))return 'Use letters only in your name.';const age=IBCONF.ageFromDob(dob);if(age==null)return 'Please pick your date of birth.';if(age<3||age>120)return 'Please check your date of birth.';return '';}
function personFields(pre,mid){return `<label>Your name<input type="text" id="pf_full" maxlength="60" autocomplete="name" value="${esc(pre.fullName||'')}" placeholder="Raju Sharma"></label>${mid||''}
  <label>Date of birth<input type="date" id="pf_dob" min="1900-01-01" max="${istISO()}" value="${esc(pre.dob||'')}"${pre.dob?' readonly aria-readonly="true" class="locked"':''}></label>${pre.dob?'<p class="note">Your date of birth is set and cannot be changed. If it is wrong, write to support (Settings → Contact support).</p>':''}${pre.sexAsk?sexField(pre.female):''}<p class="note">Your name and date of birth stay private. <a href="privacy.html" target="_blank" rel="noopener">Privacy policy</a></p>`;}
function profileSheet(first,done){const L0=P.look||{};const known=!first||(P.extra&&P.extra.sexSet);openSheet(first?'Welcome to India Bay':'Profile',first?'Create your player':'Saved on this device',`<form class="form" id="pf" novalidate>
  ${personFields({fullName:P.fullName,dob:P.dob,sexAsk:true,female:known?!!L0.female:null},unameField(String(P.name||'').toLowerCase()))}<p class="note bad" id="pf_err" aria-live="polite"></p><div class="btnrow"><button class="go" type="submit" id="pf_go">${first?'Continue':'Save'}</button></div></form>`,s=>{const f=s.querySelector('#pf'),inp=s.querySelector('#pf_name'),msg=s.querySelector('#pf_msg'),er=s.querySelector('#pf_err');sexWire(s);
    inp.oninput=()=>{unameIn(inp);const m=nameOk(inp.value);msg.textContent=m||'Looks good.';msg.className='note '+(m?'bad':'ok');};f.onsubmit=e=>{e.preventDefault();er.textContent='';
      const full=s.querySelector('#pf_full').value.trim(),dob=s.querySelector('#pf_dob').value;if(full.length<2){er.textContent='Please type your name.';return;}
      unameIn(inp);const m=inp.value===P.name&&!first?'':nameOk(inp.value);if(m){msg.textContent=m;msg.className='note bad';return;}
      const pe=personErr(full,dob);if(pe){er.textContent=pe;return;}const sx=sexGet(s);if(sx==null){er.textContent='Pick Male or Female for your look.';return;}
      P.name=inp.value;P.fullName=full;if(!P.dob)P.dob=dob;P.age18=IBCONF.ageFromDob(P.dob)>=18;setSex(sx);save();refreshBillboards();setAvatar();closeSheet();done&&done();};});}
// What's new pops up once only when an update after Beta v1.0.0 adds notes (here or in Admin → Changelog)
// built-in notes, with the admin's edits on top (same version) and hidden entries left out
function clList(){const by={};for(const c of CHANGELOG)if(c&&c.v)by[c.v]=Object.assign({},c);for(const c of (CFG.changelog||[])){if(!c||!c.v)continue;const o=by[c.v]||{v:c.v};for(const k in c)if(c[k]!==''&&c[k]!=null)o[k]=c[k];by[c.v]=o;}
  return Object.values(by).filter(c=>c.show!=='Hide').sort((a,b)=>String(b.v).localeCompare(String(a.v),undefined,{numeric:true}));}
const clLines=n=>String(n||'').split(/\n| \| /).map(x=>x.trim()).filter(Boolean);
function whatsNew(auto,tab){const list=clList();if(!list.length&&auto)return;tab=tab||'new';
  const card=c=>`<div class="cl"><div class="clh"><b>${esc(c.v)}</b><small>${esc(c.date||'')}</small></div>${c.title?`<h3 class="sub">${esc(c.title)}</h3>`:''}${clLines(c.notes).map(l=>`<p>${esc(l)}</p>`).join('')}</div>`;
  const tabs=auto?'':`<div class="chips wtabs"><button class="chip${tab==='new'?' on':''}" data-wt="new">✨ What's new</button><button class="chip${tab==='feat'?' on':''}" data-wt="feat">🧭 All features</button></div>`;
  const body=tab==='feat'?`<p class="note">Everything you can do in India Bay · <span data-ibver>${esc(VERSION)}</span></p>`+FEATURES.map(([i,h,d])=>`<div class="feat"><span>${i}</span><div><b>${esc(h)}</b><p>${esc(d)}</p></div></div>`).join(''):(auto?card(list[0]):list.map(card).join(''));
  openSheet(auto?`What's new in ${esc(list[0].v)}`:"What's new",auto?'Since you last played':`${list.length} updates · you have ${esc(VERSION)}`,tabs+body+(auto?rowHtml('all','Every update and all features','The full changelog and everything you can do','Open','ghost'):''),
    s=>s.onclick=e=>{const t=e.target.closest('[data-wt]');if(t)return whatsNew(false,t.dataset.wt);if(e.target.dataset.id==='all')whatsNew(false);},()=>{if(list[0]){P.seenVersion=list[0].v;dirty=true;}});}
// Settings → Features: what the game has (Beta v1.0.0 lists features, not a change history)
const FEATURES=[['👑','Badshah mode','A mission-based game mode, played solo with its own save and cloud saves. Choose it at the top of the start menu.'],['🗺','A big open world','West and South-West India on one map: Mumbai, Pune, Ahmedabad, Jaipur, Udaipur, Goa, Bengaluru, Mysuru, Mangaluru, Kochi, Thiruvananthapuram, Lakshadweep and 140+ cities and towns, with real landmarks, highways, expressways, flyovers, ghats, beaches, backwaters and deserts.'],
  ['🚗','Drive anything','Cycles, scooters, bikes, autos, cars, SUVs and sports cars. Fuel and CNG pumps, mechanics, garages, RTO licences, helmets and traffic challans. Ride trains, the Mumbai–Ahmedabad bullet train, the metro on its elevated lines, buses, ferries, flights and helicopters, with the view out of the window.'],
  ['💼','Work and money','Food deliveries, auto and cab rides (accept the ones you want), 74 local trades and crafts in Local work, job boards, your own businesses and homes, the bank and BayPay.'],
  ['🍛','Live like a local','Regional food at every stall, Swiggy and Zomato delivery, BayCart shopping, a food bag for later, and needs for food and sleep. Buy homes, furniture and clothes.'],
  ['📖','Story in every city','Chapter-wise stories that follow the city you are in, 60+ achievements with unlock cards, and daily rewards that grow with your streak.'],
  ['🎉','Festivals','Diwali, Navratri garba, Ganpati, Holi, Uttarayan kites, Durga Puja, Onam boat races, Christmas, Eid and Pongal, plus fairs (Pushkar, Kumbh Mela), the Pandharpur wari, Rath Yatra, Gangaur, Teej, Dahi Handi and more, each in its own state or city, with mini-games.'],
  ['🏟','Sports','Watch football and IPL cricket from your seat inside the stadium, play kabaddi, and bet on matches (18+).'],
  ['🛍','Go inside','Shopping malls with a cinema, game zone and food court, and the insides of temples, churches, dargahs, palaces, forts and caves.'],
  ['🪂','Adventures','Paragliding, parasailing, scuba diving, snorkelling, surfing, rafting, kayaking, houseboats, hot-air balloons, ziplines, dune bashing, treks and helicopter joyrides.'],
  ['🦒','Wildlife and open zoos','Gir lions, Ranthambore tigers, desert camels and forest elephants in the wild; cows, dogs, goats, buffaloes, monkeys and peacocks on the streets (drive carefully). Nine open zoos with a safari ride.'],
  ['🌐','Play online','See other players, chat, hold 🎙 to talk live to players near you, make BayGram groups to chat and call together, share your location with friends, host events on a stage, and invite friends (you become friends and both get a bonus).'],
  ['🧑','Be yourself','Settings → My look: skin tone, face, hair, beard, build and height. The Wardrobe has shirts, kurtas, sarees and more.'],
  ['📸','BayGram','Take photos in the game and post them for every player to see, like and comment on. Add friends, chat, call, and make groups. Record videos in Film mode.'],
  ['🎟','Bay Transport','Book a bus, train, metro or flight in the phone. Your ticket is confirmed while you travel to the stop, then you board with no queue. BayTaxi comes to you.'],
  ['🐪','Animal rides','Ride a camel in the Thar and Kutch, a horse at the hill stations and on Juhu beach, or an elephant at Amer Fort and in the Kodagu and Kerala forests.'],
  ['📻','And more','Radio stations, photo mode, the minimap with zoom and a navigation view, and directions to anywhere.']];
function featuresSheet(){whatsNew(false,'feat');}
// How to play: a skippable guide on the first start (and any time from Settings)
const HOWTO=[['👋','Welcome to India Bay','An open world across West and South-West India. This short guide shows the basics. Skip it any time, and find it again in ⚙ Settings → How to play.'],
  ['🕹','Move and drive',isTouch?'Use ◀ ▶ to steer and GO / BACK to drive or walk. JUMP jumps when you are on foot. Drag the screen to look around. 🎥 switches the camera.':'W A S D to drive or walk, Shift to run. Space jumps on foot and brakes in a vehicle. Drag with the mouse to look around. C switches the camera.'],
  ['🚪','Get in, get out, use things',isTouch?'Tap E to get in or out of a vehicle, and to use shops, food stalls, ATMs and doors when you are next to them.':'Press E to get in or out of a vehicle, and to use shops, food stalls, ATMs and doors when you are next to them.'],
  ['🍛','Look after yourself','Top left: ❤ health, 🍛 food and 😴 sleep. Eat at stalls or order food, and sleep at a lodge or your home. When one runs very low, tap the notification for help.'],
  ['💼','Earn money','☰ Menu → Jobs for deliveries and rides. Accept the ones you want. Claim your daily reward every day to grow your streak.'],
  ['📱','Your phone','📱 Phone has the Map, Bay Transport (taxi, bus, train, metro and flight tickets), BayGram, BayEvents, Swiggy and Zomato, the Radio, Camera, Film mode, Settings and more. 🔊 sets music, vehicle sounds, voices and the radio.'],
  ['🧭','Find your way','Tap the minimap for the full map, pick a place and tap Directions, then follow the blue line. + and − under the minimap zoom it.'],
  ['📖','Stories, festivals and more','Every city has its own story chapters. Look out for festivals, stadiums, malls, zoos and adventures. Make yourself look the way you like in ⚙ Settings → My look.']];
function howTo(i){let el=$('#howto');if(!el){el=document.createElement('div');el.id='howto';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');document.body.appendChild(el);}
  const [ic,h,d]=HOWTO[i],last=i===HOWTO.length-1;el.hidden=false;
  el.innerHTML=`<div class="hcard"><div class="hic">${ic}</div><small>How to play · ${i+1} of ${HOWTO.length}</small><h2>${esc(h)}</h2><p>${esc(d)}</p><div class="hdots">${HOWTO.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>
    <div class="btnrow">${i?'<button class="buy ghost" data-h="back">Back</button>':''}<button class="buy ghost" data-h="skip">Skip</button><button class="go" data-h="next">${last?"Let's play":'Next'}</button></div></div>`;
  el.onclick=e=>{const k=e.target.dataset.h;if(!k)return;if(k==='back')return howTo(i-1);if(k==='next'&&!last)return howTo(i+1);el.hidden=true;P.extra.howto=istISO();dirty=true;emit('howto',k);};}
const howOpen=()=>{const el=$('#howto');return !!el&&!el.hidden;};

/* ================= admin ================= */
let adminOK=false,adminLocal=false,db=null,isOwner=false,cfgBackend=null;
function cloudConfig(d){d=Object.assign({},d);delete d.updatedAt;store.set('ib.cfg',d);savedCFG=mergeCfg(DEFAULTS,d);if(!$('#adm'))applyConfig(d);}
function applyTheme(){const pt=P&&P.extra&&P.extra.theme;const T=THEMES[pt]||THEMES[CFG.theme]||THEMES.kesar;const s=document.documentElement.style;s.setProperty('--acc',pt?T.accent:(CFG.accent||T.accent));if(T.wall)s.setProperty('--wall',T.wall);else s.removeProperty('--wall');document.documentElement.dataset.ibtheme=pt||CFG.theme||'kesar';s.setProperty('--panel',T.panel);s.setProperty('--panel-edge',T.edge);s.setProperty('--sheet',T.sheet);s.setProperty('--sheet-2',T.sheet2);}
function applyConfig(c){const prev=CFG;CFG=mergeCfg(DEFAULTS,c);applyTheme();document.title=CFG.name;renderIntro();if(started){setPedCount(Math.round(CFG.peds*botScale*GFX.k));}
  if(JSON.stringify(prev.billboards)!==JSON.stringify(CFG.billboards))refreshBillboards();if(!CFG.weapons&&!WEAP[P.weapon].melee)P.weapon='fist';if(CFG.police==='off'&&player.stars){player.stars=0;renderStars();}updWeap();emit('config',CFG);}
const getPath=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
function setPath(o,p,v){const k=p.split('.');let a=o;for(let i=0;i<k.length-1;i++){a[k[i]]=Array.isArray(a[k[i]])?a[k[i]].slice():Object.assign({},a[k[i]]);a=a[k[i]];}a[k[k.length-1]]=v;}
const LISTS=IBCONF.lists(W.zones.map(z=>z.id));
function adminSheet(){const C=JSON.parse(JSON.stringify(CFG));let work=Object.assign({},C,{changelog:IBCONF.fullChangelog(C.changelog)});
  const num=(p,label,min,max,step)=>`<label>${label}<input type="number" data-p="${p}" min="${min}" max="${max}" step="${step}" value="${getPath(C,p)}"></label>`;
  const txt=(p,label,max)=>`<label>${label}<input type="text" data-p="${p}" maxlength="${max}" value="${esc(getPath(C,p))}"></label>`;
  const ck=(p,label)=>`<label class="ck"><input type="checkbox" data-p="${p}" data-t="b"${getPath(C,p)?' checked':''}> ${label}</label>`;
  const sel=(p,label,opts)=>`<label>${label}<select data-p="${p}">${opts.map(([v,l])=>`<option value="${v}"${String(v)===String(getPath(C,p))?' selected':''}>${l}</option>`).join('')}</select></label>`;
  const rng=(p,label,min,max,step)=>`<label>${label} · <span class="val" data-v="${p}"></span><input type="range" data-p="${p}" min="${min}" max="${max}" step="${step}" value="${getPath(C,p)}"></label>`;
  const list=name=>{const cols=LISTS[name];return `<div class="ltable" data-list="${name}">${(work[name]||[]).map((row,i)=>`<div class="lrow">${cols.map(([k,l,t])=>t==='textarea'?`<label class="wide">${l}<textarea rows="5" data-l="${name}" data-i="${i}" data-k="${k}">${esc(row[k]||'')}</textarea></label>`:Array.isArray(t)?`<label>${l}<select data-l="${name}" data-i="${i}" data-k="${k}">${t.map(o=>`<option${o===row[k]?' selected':''}>${o}</option>`).join('')}</select></label>`:`<label>${l}<input type="${t}" data-l="${name}" data-i="${i}" data-k="${k}" value="${esc(row[k])}"${t==='number'?' step="0.1" min="0.5" max="3"':''}></label>`).join('')}<button type="button" class="buy danger" data-del="${name}" data-i="${i}">Remove</button></div>`).join('')}<button type="button" class="buy ghost" data-add="${name}">Add</button></div>`;};
  const body=()=>`<form class="form" id="adm" autocomplete="off" novalidate>
  <details open><summary>Announcements</summary><label>Announcement on the start screen<textarea data-p="announce" maxlength="240" placeholder="Diwali update: double fares this week">${esc(C.announce)}</textarea></label><p class="note">News with dates shows on the start screen ticker and in Phone → BayRadio.</p>${list('news')}</details>
  <details><summary>Bay clock and weather</summary>${rng('timeSpeed','Time speed (game minutes per real second)',0,10,0.5)}${num('timeOffset','Clock shift (game minutes)',-1440,1440,10)}${sel('weather','Weather',[['auto','Follows the season and changes every 4 game hours'],['clear','Always clear'],['cloudy','Cloudy'],['rain','Rain'],['monsoon','Monsoon storm'],['fog','Fog']])}</details>
  <details><summary>Needs and activity times</summary>${ck('needs','Hunger and sleep needs')}${num('foodHrs','Food lasts (game hours)',2,48,1)}${num('awakeHrs','Awake time before exhausted (game hours)',4,48,1)}
   ${['sleep','meal','snack','drink','cook','tv'].map(k=>num('act.'+k,{sleep:'Full sleep',meal:'Meal',snack:'Snack',drink:'Drink',cook:'Cooking',tv:'TV cricket'}[k]+' (game minutes)',1,720,1)).join('')}</details>
  <details><summary>Queues (real seconds per person)</summary>${Object.keys(C.queue).filter(k=>k!=='toilet').map(k=>num('queue.'+k,{petrol:'Petrol pump',cng:'CNG pump',atm:'ATM',toilet:'Public toilet',ticket:'Railway ticket counter',hospital:'Hospital',checkin:'Airport check-in'}[k],1,300,1)).join('')}</details>
  <details><summary>Travel tickets and times</summary>${Object.keys(C.travel).map(k=>`<div class="pair">${num('travel.'+k+'.0',({sleeper:'Train sleeper',ac:'Train AC',flight:'Flight',bus:'State bus',busac:'AC sleeper bus',citybus:'City bus',tour:'City tour bus',bottaxi:'Bot taxi',ferry:'Ferry',local:'Mumbai local',metro:'Metro',bullet:'Bullet train',baytaxi:'BayTaxi'}[k]||k)+' ticket (₹)',0,100000,10)}${num('travel.'+k+'.1','Longest trip (real seconds)',5,1800,5)}</div>`).join('')}<p class="note">Shorter trips take less time, scaled by distance.</p></details>
  <details><summary>Streets and police</summary>${rng('traffic','Traffic vehicles near the player',0,60,1)}${rng('peds','Pedestrians near the player',0,80,1)}${sel('police','Police',[['off','Off'],['easy','Easy'],['normal','Normal'],['hard','Hard']])}${rng('dropCashPct','Pocket cash dropped when knocked out (%)',0,100,5)}${ck('weapons','Weapons and bank robbery')}${ck('challansOn','Traffic challans (red lights, speed cameras, no helmet)')}${ck('voiceChat','Voice messages between players')}${ck('filmOn','Film mode for every player (Profile → Film mode)')}${ck('chatOn','Chat between players (nearby, BayGram messages, comments)')}${ck('callsOn','Phone calls between players')}${txt('chatNote','Announcement when chat or calls are off',200)}</details>
  <details><summary>Economy</summary>${rng('priceMul','Prices ×',0.5,3,0.1)}${rng('fareMul','Job pay ×',0.5,3,0.1)}${num('startCash','Starting cash for new players (₹)',0,10000000,100)}${num('fuel.petrol','Petrol ₹/L',10,500,1)}${num('fuel.diesel','Diesel ₹/L',10,500,1)}${num('fuel.cng','CNG ₹/L',10,500,1)}${num('toll','Toll (₹)',0,5000,10)}
</details>
  <details><summary>Festivals</summary><p class="note">Real dates in India time. Check dates each year: they follow the Hindu calendar.</p>${list('festivals')}</details>
  <details><summary>Happening now events</summary>${list('events')}</details>
  <details><summary>Billboards</summary><p class="note">Text billboards on rooftops in the chosen city. Image uploads need the online storage (R2).</p>${list('billboards')}</details>
  <details><summary>Changelog</summary><p class="note">Every version is listed. Change any text, or set Players see it to Hide. Write each note on its own line in Notes. A new entry with a higher version shows players a What's new pop-up once.</p>${list('changelog')}</details>
  <details><summary>Heroes</summary>${ck('heroes.vidyut','⚡ Vidyut, the Lightning Guardian (Kerala)')}${ck('heroes.varsha','🌧 Varsha, the Monsoon Guardian (Maharashtra)')}${ck('heroes.marudhar','🦅 Marudhar, the Desert Falcon (Rajasthan)')}${ck('heroes.patang','🪁 Patang, the Kite Ace (Gujarat)')}${ck('heroes.sagar','🌊 Sagar, the Tide Rider (Goa)')}${ck('heroes.chandan','🌿 Chandan, the Forest Spirit (Karnataka)')}<p class="note">Each hero is in one city of its state at a time and moves every 20 minutes.</p></details>
  <details><summary>States</summary><p class="note">Untick a state to close it for every player: it cannot be picked on the start screen and trips there are not sold.</p>${[...new Set(W.zones.map(z=>z.st))].map(st=>`<label class="ck"><input type="checkbox" data-p="states.${st}" data-t="b"${!(C.states&&C.states[st]===false)?' checked':''}> ${esc(W.states[st]||st)}</label>`).join('')}</details>
  <details><summary>Regions</summary>${REGIONS.map(r=>`<label class="ck"><input type="checkbox" data-p="regions.${r.id}" data-t="b"${C.regions[r.id]?' checked':''}${r.map?'':' disabled'}> ${r.name}: ${r.states}${r.map?'':' (map not built yet)'}</label>`).join('')}</details>
  <details id="sugg"><summary>Player suggestions</summary><div id="sugg_l" class="note">Open to load.</div></details>
  <div class="btnrow"><button type="submit" class="go">${adminLocal?'Save on this device':'Save for all players'}</button><button type="button" class="go alt" id="a_reset">Defaults</button></div>
  <p class="note" id="a_msg">${adminLocal?'This copy is not connected to your Claude account, so changes stay on this device.':'Changes preview live on your screen. Players get them when you save.'}</p></form>`;
  openSheet('Admin settings',adminLocal?'Local admin mode':'Signed in as the game owner',body(),bind,()=>{if(JSON.stringify(CFG)!==JSON.stringify(savedCFG))applyConfig(savedCFG);});
  function read(f){const c=JSON.parse(JSON.stringify(work));f.querySelectorAll('[data-p]').forEach(el=>{const p=el.dataset.p;let v=el.dataset.t==='b'?el.checked:el.type==='number'||el.type==='range'?clamp(+el.value||0,+el.min||-1e9,+el.max||1e9):el.value;if(p.startsWith('travel.')){const [,k,i]=p.split('.');c.travel[k]=c.travel[k].slice();c.travel[k][+i]=v;return;}setPath(c,p,v);});
    f.querySelectorAll('[data-l]').forEach(el=>{const l=el.dataset.l,i=+el.dataset.i,k=el.dataset.k;c[l]=c[l].slice();c[l][i]=Object.assign({},c[l][i],{[k]:el.type==='number'?+el.value:el.value});});c.name=String(c.name||'').trim()||DEFAULTS.name;return c;}
  function labels(s){s.querySelectorAll('[data-v]').forEach(el=>{const inp=s.querySelector(`[data-p="${el.dataset.v}"]`);const v=+inp.value;el.textContent=el.dataset.v==='timeSpeed'?(v===0?'Frozen':v+' game min/s'):el.dataset.v.endsWith('Mul')?'×'+v.toFixed(1):v;});}
  function bind(s){const f=s.querySelector('#adm');labels(s);let tm;
    f.addEventListener('input',e=>{labels(s);if(e.target.dataset.p==='theme')f.querySelector('[data-p=accent]').value=THEMES[e.target.value].accent;clearTimeout(tm);tm=setTimeout(()=>{work=read(f);applyConfig(work);},200);});
    f.addEventListener('click',e=>{const a=e.target.dataset.add,d=e.target.dataset.del;if(!a&&!d)return;work=read(f);if(a){const row={};for(const [k,,t] of LISTS[a])row[k]=Array.isArray(t)?t[0]:t==='number'?1:t==='color'?'#ffffff':t==='date'?istISO():'';if(a==='changelog')row.v=VERSION+'.'+(work.changelog.length+1);work[a]=work[a].concat([row]);}else{work[d]=work[d].filter((_,i)=>i!==+e.target.dataset.i);}
      const open=[...f.querySelectorAll('details')].map(x=>x.open);s.querySelector('#sbody').innerHTML=body().replace(/<form[\s\S]*?>/,m=>m);const nf=s.querySelector('#adm');
      nf.querySelectorAll('[data-p]').forEach(el=>{const v=getPath(work,el.dataset.p);if(el.dataset.t==='b')el.checked=!!v;else if(v!=null&&!el.dataset.p.startsWith('travel.'))el.value=v;});nf.querySelectorAll('details').forEach((x,i)=>x.open=open[i]);bind(s);});
    const sg=s.querySelector('#sugg');if(sg)sg.addEventListener('toggle',async()=>{if(!sg.open)return;const el=s.querySelector('#sugg_l');let list=[];if(cfgBackend&&cfgBackend.listSuggestions){try{list=await cfgBackend.listSuggestions();}catch(e){el.textContent='Could not load suggestions.';return;}}else if(db){try{const q=await db.collection('suggestions').orderBy('date','desc').limit(50).get();list=q.docs.map(d=>d.data());}catch(e){el.textContent='Could not load suggestions.';return;}}else list=(store.get('ib.suggestions')||[]).slice().reverse();
      el.innerHTML=list.length?list.map(r=>`<div class="row"><div class="nm">${esc(r.text)}<small>${esc(r.name)} · ${esc(r.region)} · ${esc(r.date)}</small></div></div>`).join(''):'No suggestions yet.';});
    s.querySelector('#a_reset').onclick=()=>{work=JSON.parse(JSON.stringify(DEFAULTS));applyConfig(work);closeSheet();adminSheet();};
    f.addEventListener('submit',async e=>{e.preventDefault();const c=read(f);work=c;const msg=s.querySelector('#a_msg');applyConfig(c);
      if(cfgBackend&&cfgBackend.admin){msg.textContent='Saving…';msg.className='note';try{await cfgBackend.save(c);savedCFG=CFG;store.set('ib.cfg',c);msg.textContent='Saved. Every player now gets these settings.';msg.className='note ok';}catch(err){msg.textContent='Could not save: '+(err&&err.message||'check your connection');msg.className='note bad';}}
      else if(db&&isOwner){msg.textContent='Saving…';msg.className='note';try{await db.doc('config/game').set(Object.assign({},c,{updatedAt:Date.now()}));savedCFG=CFG;store.set('ib.cfg',c);msg.textContent='Saved. Every player now gets these settings.';msg.className='note ok';}catch(err){msg.textContent='Could not save right now. Check your connection and try again.';msg.className='note bad';}}
      else{store.set('ib.cfg',c);savedCFG=CFG;msg.textContent='Saved on this device.';msg.className='note ok';}});}}
(async()=>{if(!window.claude||typeof claude.use!=='function'){return;}
  try{const user=await claude.use('user');isOwner=user?await user.isOwner():false;}catch(e){}
  try{db=await claude.use('db');}catch(e){db=null;}
  if(db){db.doc('config/game').onSnapshot(s=>{if(s.exists){const d=Object.assign({},s.data());delete d.updatedAt;store.set('ib.cfg',d);savedCFG=mergeCfg(DEFAULTS,d);if(!$('#adm'))applyConfig(d);}},()=>{});}
  if(isOwner){adminOK=true;adminLocal=!db;}})();

/* ================= missions + targets ================= */
const beamMat=new THREE.MeshBasicMaterial({color:0x3ddc97,transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const mRingMat=new THREE.MeshBasicMaterial({color:0x3ddc97});const marker=new THREE.Group();const beam=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.4,70,24,1,true),beamMat);beam.position.y=35;marker.add(beam);
const mring=new THREE.Mesh(new THREE.TorusGeometry(4.2,.25,8,40),mRingMat);mring.rotation.x=Math.PI/2;mring.position.y=.3;marker.add(mring);scene.add(marker);marker.visible=false;
const arrowMat=new THREE.MeshBasicMaterial({color:0x3ddc97});const arrowGeo=new THREE.ConeGeometry(.55,1.5,4);arrowGeo.rotateX(Math.PI/2);const arrow=new THREE.Mesh(arrowGeo,arrowMat);arrow.scale.setScalar(.75);scene.add(arrow);arrow.visible=false;
let curMission=null;
function addMission(fn){missions.push(fn);}
function evalMission(){let best={pri:-1};const add=m=>{if(m&&m.pri>best.pri)best=m;};
  if(inside)add(inside.venue?{pri:100,k:inside.venue.name,t:inside.venue.title||'Have a look around',m:inside.venue.hint||'Walk up to things and press E'}:{pri:100,k:inside.home.name,t:'Home sweet home',m:'Walk to the bed, kitchen or door'});
  if(player.stars>0)add({pri:90,cls:'wanted',k:`Wanted · ${player.stars} star${player.stars>1?'s':''}`,t:player.arrestT>.3?'Police are arresting you · move!':'Lose the police',m:'Stay away from jeeps, hide at home, or pay at a police station'});
  for(const f of missions){try{add(f(api));}catch(e){console.error(e);}}
  const need=[['hunger','You are hungry','Orange markers sell food'],['energy','You are tired','Sleep at home, a lodge or a dharamshala']].find(([k])=>P[k]<30);if(need)add({pri:15,k:'Needs',t:need[1],m:need[2]});
  add({pri:0,k:areaName(),t:'Explore India',m:'Phone → Jobs for work · tap the minimap for the India map'});return best;}
let missionKey='',missionHide=0;
function showMission(m){const el=$('#mission');const key=m.k+'|'+m.t;if(key!==missionKey){missionKey=key;missionHide=performance.now()+5000;}el.className='pill'+(m.cls?' '+m.cls:'')+(performance.now()<missionHide?' show':'');el.innerHTML=`<div class="k">${esc(m.k)}</div><div class="t">${esc(m.t)}</div><div class="m">${esc(m.m||'')}</div>`;
  const tg=m.target;if(tg&&!inside){marker.visible=true;marker.position.set(tg.x,0,tg.z);const c=tg.col||0x3ddc97;beamMat.color.setHex(c);mRingMat.color.setHex(c);arrowMat.color.setHex(c);}else marker.visible=false;}
let lastArea='';
function areaName(){const pp=ppos();const z=zoneAt(pp.x,pp.z,30);if(z)return `${z.name} · ${W.states[z.st]}`;const e=roadAt(pp.x,pp.z,4);if(e&&e.road.name)return `${e.road.name} · ${W.states[stateAt(pp.x,pp.z)]}`;return W.states[stateAt(pp.x,pp.z)];}

/* ================= navigation: road graph and routes ================= */
const NODES=[],NADJ=[],nHash=new Map();
function nodeFor(x,z){const kx=Math.floor(x/10),kz=Math.floor(z/10);for(let i=kx-1;i<=kx+1;i++)for(let j=kz-1;j<=kz+1;j++){const a=nHash.get(i+','+j);if(a)for(const id of a){const n=NODES[id];if(Math.abs(n.x-x)<6&&Math.abs(n.z-z)<6)return id;}}
  const id=NODES.length;NODES.push({x,z});NADJ.push([]);const k=kx+','+kz;let a=nHash.get(k);if(!a)nHash.set(k,a=[]);a.push(id);return id;}
function nlink(a,b,eid=-1){if(a===b||NADJ[a].some(q=>q[0]===b))return;const d=Math.hypot(NODES[a].x-NODES[b].x,NODES[a].z-NODES[b].z);NADJ[a].push([b,d,eid]);NADJ[b].push([a,d,eid]);}
for(const e of EDGES){const ts=[0,e.len];const cand=new Set();for(let t=0;t<=e.len;t+=RH/2)for(const ox of [-RH,0,RH])for(const oz of [-RH,0,RH])for(const id of edgesNear(e.ax+e.dx*t+ox,e.az+e.dz*t+oz))cand.add(id);
  for(const id of cand){if(id===e.id)continue;const f=EDGES[id];const rx=e.bx-e.ax,rz=e.bz-e.az,sx=f.bx-f.ax,sz=f.bz-f.az;const den=rx*sz-rz*sx;if(Math.abs(den)<1e-6)continue;const qx=f.ax-e.ax,qz=f.az-e.az;const t=(qx*sz-qz*sx)/den,u=(qx*rz-qz*rx)/den;const et=6/e.len,eu=6/f.len;
    if(t>-et&&t<1+et&&u>-eu&&u<1+eu){if(!!e.fly!==!!f.fly){const g=e.fly?e:f,tg=e.fly?t:u,sg=g.s0+clamp(tg,0,1)*g.len;if(sg>8&&sg<g.fly.len-8)continue;}ts.push(clamp(t,0,1)*e.len);}}
  ts.sort((a,b)=>a-b);let prev=null;for(const t of ts){const n=nodeFor(e.ax+e.dx*t,e.az+e.dz*t);if(prev!=null)nlink(prev,n,e.id);prev=n;}}
for(let i=0;i<NODES.length;i++){if(NADJ[i].length>1)continue;const n=NODES[i];let best=-1,bd=32;const kx=Math.floor(n.x/10),kz=Math.floor(n.z/10);for(let a=kx-4;a<=kx+4;a++)for(let b=kz-4;b<=kz+4;b++){for(const id of nHash.get(a+','+b)||[]){if(id===i||NADJ[i].some(q=>q[0]===id))continue;const d=Math.hypot(NODES[id].x-n.x,NODES[id].z-n.z);if(d<bd){bd=d;best=id;}}}if(best>=0){const m=NODES[best];let ok=true;const L=Math.hypot(m.x-n.x,m.z-n.z);for(let t=0;t<=L;t+=2){const x=n.x+(m.x-n.x)*t/L,z=n.z+(m.z-n.z)*t/L;if(!roadAt(x,z,1.5)){ok=false;break;}}if(ok)nlink(i,best);}}
function nearestNode(x,z){for(let r=1;r<=40;r+=3){let best=-1,bd=1e9;const kx=Math.floor(x/10),kz=Math.floor(z/10);for(let a=kx-r;a<=kx+r;a++)for(let b=kz-r;b<=kz+r;b++)for(const id of nHash.get(a+','+b)||[]){const d=Math.hypot(NODES[id].x-x,NODES[id].z-z);if(d<bd){bd=d;best=id;}}if(best>=0)return best;}return -1;}
function nodesNear(x,z,r,n){const out=[];const kx=Math.floor(x/10),kz=Math.floor(z/10),k=Math.ceil(r/10);for(let a=kx-k;a<=kx+k;a++)for(let b=kz-k;b<=kz+k;b++)for(const id of nHash.get(a+','+b)||[]){const d=Math.hypot(NODES[id].x-x,NODES[id].z-z);if(d<=r)out.push([id,d]);}return out.sort((p,q)=>p[1]-q[1]).slice(0,n);}
function findRoute(sx,sz,tx,tz,hd){let starts=nodesNear(sx,sz,140,5);if(!starts.length){const a=nearestNode(sx,sz);if(a<0)return null;starts=[[a,0]];}let goals=nodesNear(tx,tz,140,4);if(!goals.length){const g0=nearestNode(tx,tz);if(g0<0)return null;goals=[[g0,0]];}
  const gset=new Map(goals.map(([id,d])=>[id,d]));const b=goals[0][0];if(hd!=null)starts=starts.map(([id,d])=>{const n=NODES[id];const dot=(n.x-sx)*Math.sin(hd)+(n.z-sz)*Math.cos(hd);return [id,d+(dot<0&&d>8?60:0)];});const N=NODES.length;const g=new Float64Array(N).fill(Infinity),from=new Int32Array(N).fill(-1),done=new Uint8Array(N);
  const heap=[];const push=(id,f)=>{heap.push([f,id]);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
  const h=id=>Math.hypot(NODES[id].x-tx,NODES[id].z-tz);for(const [id,d] of starts){if(d<g[id]){g[id]=d;push(id,d+h(id));}}let it=0,end=-1,best=Infinity;
  while(heap.length&&it++<80000){const [f,u]=pop();if(f>=best)break;if(done[u])continue;done[u]=1;if(gset.has(u)){const tot=g[u]+gset.get(u);if(tot<best){best=tot;end=u;}}for(const [v,d,eid] of NADJ[u]){if(eid>=0&&EDGES[eid].blocked)continue;/* v1.01.24: closed stretches */const ng=g[u]+d*(1+3*(eid>=0?CONG[eid]:0));if(ng<g[v]){g[v]=ng;from[v]=u;push(v,ng+h(v));}}}
  if(end<0)return null;const path=[];for(let u=end;u>=0;u=from[u])path.push([NODES[u].x,NODES[u].z]);path.reverse();return [[sx,sz],...path,[tx,tz]];}
const nav={route:null,tx:0,tz:0,t:0,name:'',left:0,turn:null,cong:null};
// which parts of the route are jammed (drawn red; the rest is blue)
function navCong(){const R=nav.route;nav.cgT=performance.now();if(!R){nav.cong=null;return;}const out=[];for(let i=0;i<R.length-1;i++){const mx=(R[i][0]+R[i+1][0])/2,mz=(R[i][1]+R[i+1][1])/2;const e=roadAt(mx,mz,1);out.push(e?CONG[e.id]:0);}nav.cong=out;}
function updNav(dt){nav.t-=dt;const m=curMission;const tg=m&&m.target&&!inside?m.target:null;const pp=ppos();
  if(!tg||Math.hypot(tg.x-pp.x,tg.z-pp.z)<30){nav.route=null;$('#nav').hidden=true;return;}
  let need=!nav.route||Math.hypot(tg.x-nav.tx,tg.z-nav.tz)>20;
  if(nav.route){let bi=0,bd=1e9;const R=nav.route;for(let i=0;i<Math.min(R.length-1,25);i++){const d=segD(pp.x,pp.z,R[i][0],R[i][1],R[i+1][0],R[i+1][1]);if(d<bd){bd=d;bi=i;}}
    const e0=roadAt(pp.x,pp.z,1);const lim=Math.max(16,(e0?e0.w/2:6)+10);if(bd>lim){nav.off=(nav.off||0)+dt;if(nav.off>1.2||bd>45)need=true;}else{nav.off=0;if(bi>0)nav.route=[[pp.x,pp.z],...R.slice(bi+1)];else R[0]=[pp.x,pp.z];}}
  let why='';if(need&&nav.route&&nav.t<=0)why='off';
  if(need&&nav.t<=0){nav.t=1;nav.off=0;nav.tx=tg.x;nav.tz=tg.z;nav.route=findRoute(pp.x,pp.z,tg.x,tg.z,player.mode==='drive'&&player.veh?player.veh.h:player.h)||[[pp.x,pp.z],[tg.x,tg.z]];nav.alt=performance.now();navCong();if(why==='off'&&nav.said!==nav.tx+','+nav.tz+'|'+Math.round(pp.x/40)){nav.said=nav.tx+','+nav.tz+'|'+Math.round(pp.x/40);toast('🔄 Rerouting · new route from this road','#5fb4ff');}}
  // every 20 s: a clearly faster way round the traffic? take it
  else if(nav.route&&performance.now()-(nav.alt||0)>20000&&player.mode==='drive'){nav.alt=performance.now();const alt=findRoute(pp.x,pp.z,tg.x,tg.z,player.veh?player.veh.h:player.h);if(alt){const a=routeEta(alt).t,b=routeEta(nav.route).t;if(a<b*.85&&b-a>25){nav.route=alt;navCong();toast(`🔀 Faster route · avoiding traffic · ${Math.max(1,Math.round((b-a)/60))} min quicker`,'#5fb4ff');}}}
  if(nav.route&&(!nav.cong||nav.cong.length!==nav.route.length-1||performance.now()-(nav.cgT||0)>5000))navCong();
  const R=nav.route;if(!R)return;let total=0,turn=null,acc=0;for(let i=0;i<R.length-1;i++){const l=Math.hypot(R[i+1][0]-R[i][0],R[i+1][1]-R[i][1]);total+=l;
    if(!turn&&i<R.length-2){acc+=l;const ax=R[i+1][0]-R[i][0],az=R[i+1][1]-R[i][1],bx=R[i+2][0]-R[i+1][0],bz=R[i+2][1]-R[i+1][1];const la=Math.hypot(ax,az),lb=Math.hypot(bx,bz);if(la>1&&lb>1){const cos=(ax*bx+az*bz)/(la*lb),cr=ax*bz-az*bx;if(cos<.82&&!(i===0&&acc<12))turn={d:acc,dir:cr>0?'right':'left',u:cos<-.5}}}}
  nav.left=total;nav.turn=turn;const km=total*2.4;const dist=km>=1000?(km/1000).toFixed(1)+' km':Math.round(km/10)*10+' m';
  const tt=turn?(turn.u?'U-turn':`Turn ${turn.dir}`)+` in ${Math.max(10,Math.round(turn.d*2.4/10)*10)} m`:'Continue straight';const ar=turn?(turn.u?'⮌':turn.dir==='left'?'↰':'↱'):'↑';
  const eta=routeEta(R);const mins=Math.max(1,Math.round(eta.t/60));const el=$('#nav');el.hidden=false;el.classList.toggle('heavy',eta.heavy);el.innerHTML=`<b>${ar}</b><span>${tt}</span><small>${esc(m.t)} · ${dist} · ${mins} min${eta.heavy?' · heavy traffic':''}</small>`;}
/* live traffic: busier in big cities and at rush hour, changes every game hour */
const CONG=new Float32Array(EDGES.length);let congT=0;
function updCongestion(){const h=clockH;const rush=(h>=8&&h<11)||(h>=17&&h<21)?1:(h>=23||h<6)?.2:.55;const slot=Math.floor(gameMin()/60);
  for(const e of EDGES){const z=zoneAt((e.ax+e.bx)/2,(e.az+e.bz)/2,10);const base=z?(z.id==='mumbai'?.6:z.size==='big'?.45:z.size==='mid'?.28:.1):e.kind==='exp'?.08:e.kind==='bridge'?.35:.16;CONG[e.id]=clamp(base*rush*(.3+1.5*hash(e.id*3.1+slot*.7))*1.5,0,1);}}
updCongestion();
function routeEta(R){let t=0,heavy=false;for(let i=0;i<R.length-1;i++){const l=Math.hypot(R[i+1][0]-R[i][0],R[i+1][1]-R[i][1]);for(let k=0;k<l;k+=40){const x=R[i][0]+(R[i+1][0]-R[i][0])*k/l,z=R[i][1]+(R[i+1][1]-R[i][1])*k/l;const e=roadAt(x,z);const c=e?CONG[e.id]:0;if(c>.7)heavy=true;const sp=e&&e.kind!=='city'?24:12;t+=Math.min(40,l-k)/(sp*(1-.7*c));}}return{t,heavy};}

/* traffic signals at junctions in cities and big towns */
const SIG=34;
function sigJunction(x,z){const zz=zoneAt(x,z);if(!zz||zz.size==='small')return null;const i=Math.round((x-zz.x0)/80),j=Math.round((z-zz.z0)/80);if(i<=0||j<=0||i>=zz.nx||j>=zz.nz)return null;const jx=zz.x0+i*80,jz=zz.z0+j*80;if(isWater(jx,jz))return null;return{x:jx,z:jz,zone:zz,i,j};}
function sigState(jx,jz,axis){const t=((Date.now()/1000)+hash(jx*.13+jz*.71)*SIG)%SIG;if(axis==='ns')return t<15?'g':t<17?'a':'r';return t<17?'r':t<32?'g':t<34?'a':'r';}
function sigStop(c){const e=c.lane.e;if(e.kind!=='city'){if(e.fly)return Infinity;const ex=c.lane.dir>0?e.bx:e.ax,ez=c.lane.dir>0?e.bz:e.az;const d=c.lane.dir>0?e.len-c.lane.s:c.lane.s;if(d>34)return Infinity;const j=hwjAt(ex,ez,14);if(!j)return Infinity;return sigState(j.x,j.z,hwjAxis(j,Math.atan2(e.dx*c.lane.dir,e.dz*c.lane.dir)))==='g'?Infinity:d-11;}const ew=Math.abs(e.dx)>.5;const f=ew?Math.sign(e.dx*c.lane.dir):Math.sign(e.dz*c.lane.dir);const zz=zoneAt(c.pos.x,c.pos.z);if(!zz||zz.size==='small')return Infinity;
  const a=ew?c.pos.x:c.pos.z,base=ew?zz.x0:zz.z0;let k=f>0?Math.ceil((a-base)/80):Math.floor((a-base)/80);let jc=base+k*80;let d=(jc-a)*f;if(d<9){k+=f;jc=base+k*80;d=(jc-a)*f;}if(d>32)return Infinity;
  const jx=ew?jc:c.pos.x,jz=ew?c.pos.z:jc;const J=sigJunction(jx,jz);if(!J)return Infinity;return sigState(J.x,J.z,ew?'ew':'ns')==='g'?Infinity:d-11;}
const sigMats={r:new THREE.MeshBasicMaterial({color:0xff2a2a}),a:new THREE.MeshBasicMaterial({color:0xffb000}),g:new THREE.MeshBasicMaterial({color:0x2aff6a})};
const sigPool=[];for(let k=0;k<14;k++){const grp=new THREE.Group();const heads=[];for(const [cx,cz,faces] of [[9.5,-9.5,[Math.PI,Math.PI/2]],[-9.5,9.5,[0,-Math.PI/2]]]){const pole=new THREE.Mesh(G.cyl,M.pole);pole.scale.set(.14,5,.14);pole.position.set(cx,2.5,cz);grp.add(pole);
  for(const ry of faces){const hd=new THREE.Group();hd.position.set(cx,4.6,cz);hd.rotation.y=ry;const box=new THREE.Mesh(G.box,VM.black);box.scale.set(.5,1.4,.35);box.position.z=.3;hd.add(box);const lamp=new THREE.Mesh(G.box,sigMats.g);lamp.scale.set(.36,.36,.08);lamp.position.z=.5;hd.add(lamp);grp.add(hd);heads.push({lamp,axis:Math.abs(Math.sin(ry))>.5?'ew':'ns'});}}
  grp.visible=false;scene.add(grp);sigPool.push({grp,heads,key:''});}
let sigNear=[];const redSeen=new Map();
/* Beta v1.01.07: signals where three or more roads meet outside the city grids (highway junctions, town entries) */
const HWJ=[];{const ends=new Map();for(const e of EDGES){if(e.fly||e.kind==='service')continue;for(const [x,z,dir] of [[e.ax,e.az,-1],[e.bx,e.bz,1]]){const k=Math.round(x/12)+','+Math.round(z/12);let a=ends.get(k);if(!a)ends.set(k,a=[]);a.push({e,x,z,h:Math.atan2(-e.dx*dir,-e.dz*dir)});}}
  for(const a of ends.values()){const roads=new Set(a.map(q=>q.e.road));if(a.length<3||roads.size<2)continue;const x=a[0].x,z=a[0].z;const zz=zoneAt(x,z,-1);if(zz&&zz.size!=='small'){const i=Math.round((x-zz.x0)/80),j=Math.round((z-zz.z0)/80);if(i>0&&j>0&&i<zz.nx&&j<zz.nz)continue;}
    if(a.every(q=>q.e.kind==='city')||isWater(x,z))continue;const th=Math.atan2(a[0].e.dx,a[0].e.dz);HWJ.push({x,z,th,app:a});}}
const hwjAt=(x,z,r)=>{let best=null,bd=r;for(const j of HWJ){const d=Math.abs(j.x-x)+Math.abs(j.z-z);if(d<bd){bd=d;best=j;}}return best;};
const hwjAxis=(j,h)=>Math.abs(Math.cos(h-j.th))>.7?'ns':'ew';
const hwSigPool=[];for(let k=0;k<12;k++){const grp=new THREE.Group();const pole=new THREE.Mesh(G.cyl,M.pole);pole.scale.set(.14,5,.14);pole.position.y=2.5;grp.add(pole);const hd=new THREE.Group();hd.position.y=4.6;const box=new THREE.Mesh(G.box,VM.black);box.scale.set(.5,1.4,.35);hd.add(box);const lamp=new THREE.Mesh(G.box,sigMats.g);lamp.scale.set(.36,.36,.08);lamp.position.z=.2;hd.add(lamp);grp.add(hd);grp.visible=false;scene.add(grp);hwSigPool.push({grp,lamp});}
function updHwSignals(){const pp=ppos();const list=[];for(const j of HWJ){const d=Math.abs(j.x-pp.x)+Math.abs(j.z-pp.z);if(d<300)for(const q of j.app)list.push([d,j,q]);}list.sort((a,b)=>a[0]-b[0]);
  hwSigPool.forEach((p,k)=>{const it=list[k];if(!it||inside){p.grp.visible=false;return;}const [,j,q]=it;const ax=Math.sin(q.h),az=Math.cos(q.h);const w=q.e.w/2+1.6;p.grp.visible=true;p.grp.position.set(j.x-ax*10+az*w,0,j.z-az*10-ax*w);p.grp.rotation.y=q.h+Math.PI;
    const st=sigState(j.x,j.z,hwjAxis(j,q.h));p.lamp.material=sigMats[st];p.lamp.position.y=st==='r'?.42:st==='a'?0:-.42;});}
function updSignals(){const pp=ppos();const list=[];const zz=zoneAt(pp.x,pp.z,100);if(zz&&zz.size!=='small'&&!inside){for(let i=1;i<zz.nx;i++)for(let j=1;j<zz.nz;j++){const x=zz.x0+i*80,z=zz.z0+j*80;const d=Math.abs(x-pp.x)+Math.abs(z-pp.z);if(d<360&&!isWater(x,z))list.push([d,x,z]);}}
  list.sort((a,b)=>a[0]-b[0]);sigNear=list.slice(0,sigPool.length);sigPool.forEach((p,k)=>{const j=sigNear[k];if(!j){p.grp.visible=false;return;}p.grp.visible=true;p.grp.position.set(j[1],0,j[2]);for(const h of p.heads){const st=sigState(j[1],j[2],h.axis);h.lamp.material=sigMats[st];h.lamp.position.y=st==='r'?.42:st==='a'?0:-.42;}});}
function checkRedLight(now){if(player.mode!=='drive'||!player.veh)return;const v=player.veh;if(Math.abs(v.v)<4)return;const J=sigJunction(v.pos.x,v.pos.z);if(!J)return;if(Math.abs(v.pos.x-J.x)>7||Math.abs(v.pos.z-J.z)>7)return;
  const axis=Math.abs(Math.sin(v.h))>Math.abs(Math.cos(v.h))?'ew':'ns';const key=J.x+','+J.z;if(sigState(J.x,J.z,axis)!=='r'||now-(redSeen.get(key)||-99)<30)return;redSeen.set(key,now);addChallan(cost('fine.signal',CFG.challan.signal||1000),'Jumped a red light');}

function navAhead(dist){const R=nav.route;if(!R||R.length<2)return null;let acc=0;for(let i=0;i<R.length-1;i++){const l=Math.hypot(R[i+1][0]-R[i][0],R[i+1][1]-R[i][1]);if(acc+l>=dist){const t=(dist-acc)/l;return[R[i][0]+(R[i+1][0]-R[i][0])*t,R[i][1]+(R[i+1][1]-R[i][1])*t];}acc+=l;}return R[R.length-1];}

/* ================= toasts ================= */
let toastT;function toast(html,color){const t=$('#toast');t.innerHTML=html;t.style.color=color||'#fff4e2';t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2400);}
let bigT;function big(txt,col){const b=$('#big');b.textContent=txt;b.style.color=col;b.classList.add('show');$('#dim').style.opacity=.55;clearTimeout(bigT);bigT=setTimeout(()=>{b.classList.remove('show');$('#dim').style.opacity=0;},2000);}

/* ================= input ================= */
const keys={up:false,down:false,left:false,right:false,run:false,hb:false};
const km={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'hb',ShiftLeft:'run',ShiftRight:'run'};
addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea,select'))return;if(e.code==='Space'&&player.mode==='foot'&&started&&!uiLock()){e.preventDefault();if(!e.repeat)jump();return;}if(e.code==='Escape'){if(howOpen()){$('#howto').hidden=true;P.extra.howto=istISO();dirty=true;return;}if(hooks.escape&&hooks.escape())return;if(sheetOpen()){closeSheet();return;}}if(uiLock())return;
  if(km[e.code]){keys[km[e.code]]=true;e.preventDefault();}if(e.repeat)return;
  if(e.code==='KeyE'||e.code==='KeyF')useAction();if(e.code==='KeyJ')fire();if(e.code==='KeyQ')cycleWeapon();if(e.code==='KeyH')horn();if(e.code==='KeyC')cycleCam();if(e.code==='KeyM')phoneSheet();if(e.code==='KeyI')phoneSheet();if(e.code==='KeyO')settingsSheet();if(hooks.key[e.code])hooks.key[e.code]();});
addEventListener('keyup',e=>{if(km[e.code])keys[km[e.code]]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
/* drag to orbit the camera (mouse on PC, finger on phones); a short click still attacks */
let camYaw=0,camPitch=0,orbitIdle=9;const drag={on:false,id:null,x:0,y:0,moved:0,btn:0,touch:false};const cv0=$('#c');
cv0.addEventListener('pointerdown',e=>{if(!started||uiLock()||hooks.photo)return;Object.assign(drag,{on:true,id:e.pointerId,x:e.clientX,y:e.clientY,moved:0,btn:e.button,touch:e.pointerType!=='mouse'});try{cv0.setPointerCapture(e.pointerId);}catch(_){}});
cv0.addEventListener('pointermove',e=>{if(!drag.on||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;drag.moved+=Math.abs(dx)+Math.abs(dy);if(drag.moved<4)return;camYaw=wrapA(camYaw-dx*.007);camPitch=clamp(camPitch+dy*.004,-.4,.9);orbitIdle=0;});
const endDrag=e=>{if(!drag.on||e.pointerId!==drag.id)return;drag.on=false;if(drag.moved<6&&drag.btn===0&&!uiLock()&&e.type==='pointerup'){if(pickBillboard(e.clientX,e.clientY))return;if(!drag.touch)fire();}};cv0.addEventListener('pointerup',endDrag);cv0.addEventListener('pointercancel',endDrag);
$$('.pad button[data-k]').forEach(b=>{const k=b.dataset.k;const on=e=>{e.preventDefault();keys[k]=true;b.classList.add('on');try{b.setPointerCapture(e.pointerId);}catch(_){}};const off=()=>{keys[k]=false;b.classList.remove('on');};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);b.addEventListener('contextmenu',e=>e.preventDefault());});
/* Taps on buttons in menus and pop-ups: some phones only sent a click after a long press. A quick tap (finger
   moved under 12 px, under 700 ms) now presses the button straight away; the browser's own click that may follow is ignored. */
{let tp=null,lastSyn=null;const TAPS='#sheetWrap,#wait,#offer,#cine,#intro,#achPop,#chatbar,#howto,#miniZ,.hud';
  addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;const b=e.target.closest&&e.target.closest('button,[data-id],[data-app],[data-tab],[data-c],a.go');tp=b&&b.closest(TAPS)?{b,x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId}:null;},true);
  addEventListener('pointerup',e=>{const q=tp;tp=null;if(!q||e.pointerId!==q.id)return;if(Math.hypot(e.clientX-q.x,e.clientY-q.y)>12||performance.now()-q.t>700||!q.b.isConnected||q.b.disabled)return;
    lastSyn={b:q.b,t:performance.now(),x:e.clientX,y:e.clientY};const ev=new MouseEvent('click',{bubbles:true,cancelable:true,clientX:e.clientX,clientY:e.clientY});q.b.dispatchEvent(ev);},true);
  addEventListener('click',e=>{if(!e.isTrusted||!lastSyn)return;if(performance.now()-lastSyn.t<800){const b=e.target.closest&&e.target.closest('button,[data-id],[data-app],[data-tab],[data-c],a.go');if(b===lastSyn.b||!b||Math.hypot(e.clientX-lastSyn.x,e.clientY-lastSyn.y)<30){e.stopImmediatePropagation();e.preventDefault();}}},true);}
document.addEventListener('contextmenu',e=>{if(!(e.target.closest&&e.target.closest('input,textarea,select,a')))e.preventDefault();});document.addEventListener('selectstart',e=>{if(!(e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]')))e.preventDefault();});
let fireHeld=false;
$$('.pad button[data-act]').forEach(b=>{const a=b.dataset.act;b.addEventListener('contextmenu',e=>e.preventDefault());
  b.addEventListener('pointerdown',e=>{e.preventDefault();if(uiLock())return;b.classList.add('on');if(a==='use')useAction();if(a==='fire'){fireHeld=true;fire();}if(a==='gun')cycleWeapon();if(a==='horn'){if(player.mode==='foot')jump();else horn();}});
  const off=()=>{b.classList.remove('on');if(a==='fire')fireHeld=false;};b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});
let camMode=0;const CAMS=['Chase camera','Far camera','First-person camera'];function cycleCam(){camMode=(camMode+1)%3;$('#camBtn').title=CAMS[camMode];toast(CAMS[camMode],'#d6c8e4');camSnap=true;camYaw=0;camPitch=0;}
$('#camBtn').onclick=cycleCam;$('#menuBtn').onclick=()=>{if(started&&!uiLock())mainMenuSheet();};$('#phoneBtn').onclick=()=>{if(started&&!uiLock())phoneSheet();};$('#setBtn').onclick=()=>{if(started&&!uiLock())hubSheet();};$('#supLink').onclick=e=>{e.preventDefault();supportSheet();};if($('#introMute')){$('#introMute').onclick=e=>{e.stopPropagation();if(api.SOUND)return api.SOUND.sheet();setMuted(!muted);};setTimeout(()=>setMuted(muted),0);}$('#introProf').onclick=()=>{if(hooks.introClick)hooks.introClick();else hubSheet();};$('#mission').onclick=()=>{missionHide=performance.now()+5000;};$('#nav').onclick=()=>{missionHide=performance.now()+5000;};
$('#mini').addEventListener('click',()=>{if(started&&!uiLock()&&hooks.map)hooks.map();});$$('#miniZ [data-mz]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();if(started)setMiniZoom(b.dataset.mz==='in'?1.4:1/1.4);}));hooks.key.Equal=()=>setMiniZoom(1.4);hooks.key.Minus=()=>setMiniZoom(1/1.4);
let curPrompt=null;
function useAction(){if(uiLock()||overT>0||player.knock>0)return;updPrompt();if(curPrompt&&curPrompt.first){curPrompt.fn();return;}
  if(inside){const ip=nearInterior();if(ip)homeAction(ip.k);return;}
  if(player.mode==='drive'){if(curPrompt&&curPrompt.poi&&curPrompt.poi.drive&&Math.abs(player.veh.v)<2){openPoi(curPrompt.poi);return;}exitVehicle();return;}
  if(curPrompt&&curPrompt.opts){if(curPrompt.opts.length===1)return curPrompt.opts[0].fn();return chooseAction(curPrompt.opts);}
  if(curPrompt&&curPrompt.poi){openPoi(curPrompt.poi);return;}if(curPrompt&&curPrompt.fn){curPrompt.fn();return;}const v=nearestVeh();if(v)enterVehicle(v);}
// Beta v1.01.22: when more than one thing is in reach (your SUV and the lodge door), E asks which one
function chooseAction(opts){const L=opts.slice(0,6);openSheet('What do you want to do?','Several things are here',L.map((o,i)=>rowHtml('o'+i,esc(o.text),esc(o.sub||''),o.btn||'Go')).join(''),s=>s.onclick=e=>{const id=e.target.dataset.id;if(!id)return;const o=L[+id.slice(1)];closeSheet();if(o)o.fn();});}
function vehText(v){if(v.locked&&!v.owned)return '🔒 '+(v.lockName||v.spec.label)+' · locked';return v.state==='traffic'?'Take this '+v.spec.label+' (crime)':v.state==='police'?(v.dead?'Take the wrecked jeep':'Steal police jeep'):v.fallen?'Pick up the '+v.spec.label:(v.owned?'Get in your '+v.spec.label:v.company?'Company '+v.spec.label:'Get in '+v.spec.label);}
function footOpts(pf){const o=[];if(pf)o.push({text:pf.text,fn:pf.fn,first:true});
  let best=null,bd=2.8;for(const p of pois){const d=Math.hypot(player.pos.x-p.x,player.pos.z-p.z);if(d<bd){bd=d;best=p;}}
  if(best){const own=best.type==='home'&&P.homes.includes(best.extra);const b=best;o.push({text:best.prompt?best.prompt:best.type==='home'?(own?'Enter '+best.name:best.name+' · for sale'):best.name,fn:()=>openPoi(b),btn:'Open',poi:best});}
  for(const f of prompts){let r=null;try{r=f(api);}catch(e){}if(r){o.push({text:r.text,fn:r.fn});break;}}
  const v=nearestVeh();if(v){const vv=v;o.push({text:vehText(v),fn:()=>enterVehicle(vv),btn:'Get in'});}
  const seen=new Set();return o.filter(q=>q.text&&!seen.has(q.text)&&seen.add(q.text));}
function nearInterior(){let b=null,bd=inside&&inside.venue?2.4:1.4;for(const p of inter.pois){const d=Math.hypot(player.pos.x-p.x,player.pos.z-p.z);if(d<bd){bd=d;b=p;}}return b;}

/* Beta v1.01.24: a proper first-person view in vehicles. The glass goes see-through from inside, the driver model
   is hidden (you are the driver) and cars, autos, buses and trucks get a dashboard and a steering wheel. */
let fpVeh=null;const fpMats=new Map();
const fpClear=new Map();const fpMat=m=>{if(!fpClear.has(m)){const q=m.clone();q.opacity=Math.min(m.opacity,.08);q.depthWrite=false;fpClear.set(m,q);}return fpClear.get(m);};
function fpView(v){if(v===fpVeh)return;if(fpVeh){for(const [o,m] of fpMats)o.material=m;fpMats.clear();const U=fpVeh.m.userData;if(U.driver)U.driver.visible=true;if(U.dash)U.dash.visible=false;}
  fpVeh=v;if(!v)return;v.m.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||!o.material.transparent)return;fpMats.set(o,o.material);o.material=fpMat(o.material);});
  const U=v.m.userData;if(U.driver)U.driver.visible=false;if(v.spec.two||v.spec.pedal)return;
  if(!U.dash){const f=v.spec.fp,g=new THREE.Group();const big=v.type==='bus'||v.type==='truck';const dm=LMat('#1d1e22'),wm=LMat('#2a2a2e');
    const d=new THREE.Mesh(new THREE.BoxGeometry(big?2.2:v.spec.wid*.92,.3,.55),dm);d.position.set(0,f[1]-.62,f[2]+.62);g.add(d);
    const wh=new THREE.Mesh(new THREE.TorusGeometry(big?.24:.18,.025,8,22),wm);wh.position.set(f[0],f[1]-.42,f[2]+.42);wh.rotation.x=-1.15;g.add(wh);
    const col=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.35,8),wm);col.position.set(f[0],f[1]-.52,f[2]+.55);col.rotation.x=-1.15+Math.PI/2;g.add(col);
    const sp=new THREE.Mesh(new THREE.PlaneGeometry(.2,.09),new THREE.MeshBasicMaterial({color:0x8fe3ff}));sp.position.set(f[0],f[1]-.46,f[2]+.6);sp.rotation.x=-.5;g.add(sp);
    g.traverse(o=>{if(o.isMesh)o.castShadow=false;});v.m.add(g);U.dash=g;}
  U.dash.visible=true;}

/* ================= audio ================= */
let ac=null,eng=null,sir=null,muted=store.get('ib.muted')===true,noiseBuf=null;let vehOn=(store.get('ib.snd')||{}).veh!==false;   // Beta v1.01.21: Sound → Vehicle sounds
function setMuted(m){muted=!!m;store.set('ib.muted',muted);emit('mute',muted);const b=$('#introMute');if(b){b.textContent=muted?'🔇':'🔊';b.setAttribute('aria-label',muted?'Sound off · tap to turn on':'Sound on · tap to mute');}}
function initAudio(){if(ac)return;try{ac=new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator();o.type='sawtooth';const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=380;
  const g=ac.createGain();g.gain.value=0;const lfo=ac.createOscillator();lfo.type='square';lfo.frequency.value=11;const am=ac.createGain();am.gain.value=1;const lg=ac.createGain();lg.gain.value=.6;lfo.connect(lg);lg.connect(am.gain);o.connect(f);f.connect(am);am.connect(g);g.connect(ac.destination);/* v1.01.22: the rumble wobbles a middle stage, so volume 0 is really silent */o.start();lfo.start();eng={o,lfo,g,f,lg,type:''};
  const so=ac.createOscillator();so.type='triangle';so.frequency.value=700;const sl=ac.createOscillator();sl.frequency.value=.7;const sg2=ac.createGain();sg2.gain.value=220;sl.connect(sg2);sg2.connect(so.frequency);const sg=ac.createGain();sg.gain.value=0;so.connect(sg);sg.connect(ac.destination);so.start();sl.start();sir={g:sg};
  {const nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;const ns=ac.createBufferSource();ns.buffer=nb;ns.loop=true;const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2300;bp.Q.value=5;
    const sq=ac.createOscillator();sq.type='triangle';sq.frequency.value=1150;const sqg=ac.createGain();sqg.gain.value=.35;sq.connect(sqg);sqg.connect(bp);ns.connect(bp);const dg=ac.createGain();dg.gain.value=0;bp.connect(dg);dg.connect(ac.destination);ns.start();sq.start();eng.drift={g:dg,f:bp,sq};}
  noiseBuf=ac.createBuffer(1,ac.sampleRate*.3,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);emit('audio',ac);}catch(e){ac=null;}}
function hornSfx(){if(!ac||muted||!vehOn)return;const t=ac.currentTime;[392,494].forEach(fr=>{const o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=fr;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06,t+.02);g.gain.setValueAtTime(.06,t+.28);g.gain.exponentialRampToValueAtTime(.0001,t+.36);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.4);});}
function horn(){if(player.mode==='drive'){const v=player.veh,c=v&&v.owned?P.cars[v.ownedIdx]:null;if(c&&c.horn)musicHorn();else hornSfx();emit('horn');}}
function musicHorn(){if(!ac||muted||!vehOn)return;const t=ac.currentTime;[523,659,784,659,880].forEach((fr,k)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=fr;const t0=t+k*.13;g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.05,t0+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+.12);o.connect(g);g.connect(ac.destination);o.start(t0);o.stop(t0+.14);});}
function sfxShot(vol){if(!ac||muted)return;const s=ac.createBufferSource();s.buffer=noiseBuf;const g=ac.createGain();g.gain.value=.25*vol;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=1800;s.connect(f);f.connect(g);g.connect(ac.destination);s.start();}
function sfxPunch(){if(!ac||muted)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(50,t+.12);g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.0001,t+.15);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.16);}

/* ================= player updates ================= */
const fwd=new THREE.Vector3();let lastBump=0,lowFuelWarn=false;
const smoke=[];const smokeMat=new THREE.MeshBasicMaterial({color:0x666666,transparent:true,opacity:.5,depthWrite:false});const smokeGeo=new THREE.SphereGeometry(.5,6,4);
function puff(x,y,z){let s=smoke.find(q=>!q.m.visible);if(!s){if(smoke.length>40)return;s={m:new THREE.Mesh(smokeGeo,smokeMat.clone())};scene.add(s.m);smoke.push(s);}s.m.visible=true;s.m.position.set(x,y,z);s.t=1.4;s.m.scale.setScalar(1);}
function updSmoke(dt){for(const s of smoke){if(!s.m.visible)continue;s.t-=dt;s.m.position.y+=dt*1.6;s.m.scale.multiplyScalar(1+dt*.8);s.m.material.opacity=Math.max(0,s.t*.35);if(s.t<=0)s.m.visible=false;}}
// Flyovers: a vehicle that drives onto a flyover ramp follows the deck height; parapets keep it on the deck.
function flyUpd(v){if(v.flyR){const h=onRoadOf(v.flyR,v.pos.x,v.pos.z);const y=flyY(h.e,h.t),half=v.flyR.w/2;
    if(y>1&&h.lat>half-.5){const k=(half-.5)/h.lat;v.pos.x=h.px+(v.pos.x-h.px)*k;v.pos.z=h.pz+(v.pos.z-h.pz)*k;v.v*=.85;}
    if(y<.3&&h.lat>half+.5){v.flyR=null;v.pos.y=0;return;}v.pos.y=y;return;}
  for(const id of edgesNear(v.pos.x,v.pos.z)){const f=EDGES[id];if(!f.fly)continue;let t=(v.pos.x-f.ax)*f.dx+(v.pos.z-f.az)*f.dz;if(t<0||t>f.len)continue;const lat=Math.abs((v.pos.x-f.ax)*f.dz-(v.pos.z-f.az)*f.dx);
    if(lat<f.w/2&&flyY(f,t)<1.2&&Math.abs(Math.sin(v.h)*f.dx+Math.cos(v.h)*f.dz)>.6){v.flyR=f.fly;v.pos.y=flyY(f,t);return;}}v.pos.y=0;}
/* Engine sounds per vehicle (Beta v1.01.25): each kind has its own voice — the thump of a single-cylinder bike, the rattle of an
   auto, a scooter's buzz, a car's hum, a sports car's howl, a diesel bus or truck's growl, the whine of an electric. The pitch climbs
   through the gears and drops at each change. Tyres squeal when the vehicle slides sideways (drifting with Space, the handbrake). */
const ENG={bike:['sawtooth',52,1.9,13,.75,520,.034,5],sportsbike:['sawtooth',95,2.6,26,.35,1500,.03,6],scooter:['square',105,1.6,32,.3,950,.022,3],
  auto:['square',36,1.5,9,.85,320,.034,3],car:['sawtooth',44,1.7,10,.55,380,.03,5],sports:['sawtooth',58,2.4,21,.35,950,.034,6],suv:['sawtooth',38,1.6,9,.6,330,.032,5],
  diesel:['sawtooth',27,1.5,6.5,.75,230,.04,6],tractor:['square',21,1.3,5,.9,200,.042,4],electric:['sine',260,2.2,0,0,1800,.012,1]};
const ENGOF={bike:'bike',sportsbike:'sportsbike',scooter:'scooter',atv:'scooter',auto:'auto',sports:'sports',coupe:'sports',convertible:'sports',suv:'suv',police:'suv',pickup:'suv',limo:'suv',ambulance:'suv',camper:'suv',
  bus:'diesel',truck:'diesel',lorry:'diesel',tanker:'diesel',towtruck:'diesel',firetruck:'diesel',tractor:'tractor',erickshaw:'electric',golfcart:'electric'};
function engTick(v,sp,off,dt){if(!eng)return;const kind=ENGOF[v.type]||(sp.two?'bike':'car');const E=ENG[kind];const silent=muted||!vehOn||!sp.fuel&&kind!=='electric'||off;
  if(eng.type!==kind){eng.type=kind;eng.o.type=E[0];eng.f.frequency.value=E[5];}
  const sv=Math.abs(v.v),gw=Math.max(4,sp.max/E[7]),g=Math.min(E[7]-1,Math.floor(sv/gw)),fr=(sv-g*gw)/gw;const rpm=kind==='electric'?sv/sp.max:fr;
  const thr=keys.up?1:.55;eng.g.gain.value=silent?0:E[6]*(.75+.25*thr)*(kind==='electric'?.4+sv/sp.max:1);eng.o.frequency.value=E[1]*(1+(E[2]-1)*rpm+g*.07)*(kind==='electric'?1:1);
  eng.lfo.frequency.value=E[3]*(1+rpm*1.2+g*.1);eng.lg.gain.value=E[4];
  const D=eng.drift;if(D){const fx=Math.sin(v.h),fz=Math.cos(v.h);const lat=Math.abs((v.vx||0)*fz-(v.vz||0)*fx);const on=!silent||kind==='electric'?Math.min(1,Math.max(0,lat-1.8)/4):0;const want=muted||!vehOn||sp.pedal?0:on*(sp.two?.05:.08);
    D.g.gain.value+=(want-D.g.gain.value)*Math.min(1,dt*10);D.sq.frequency.value=1000+sv*12;if(on>.3&&Math.random()<dt*14&&!sp.two)for(const sx of [-1,1])puff(v.pos.x-fx*sp.len*.4+fz*sx*sp.wid*.45,.3,v.pos.z-fz*sp.len*.4-fx*sx*sp.wid*.45);}}
function updDrive(dt,now){const v=player.veh,sp=v.spec;const dead=v.hp<=0,dry=sp.fuel&&v.fuel<=0;const acc=dead||dry?0:sp.acc;
  if(keys.up&&acc)v.v+=(v.v<0?30:acc)*dt;if(keys.down)v.v-=(v.v>.5?32:acc?10:0)*dt;if(!keys.up&&!keys.down||(!acc&&v.v>0)){v.v-=Math.sign(v.v)*Math.min(Math.abs(v.v),(acc?5:3)*dt);}
  const road=roadAt(v.pos.x,v.pos.z,.5);const paved=!road&&zoneAt(v.pos.x,v.pos.z);let maxv=playerMax(v.type,sp)*(wx.rain>.3?.92:1)*(sp.boat?1:road?1:paved?.7:sp.two?.5:.58);for(const f of speedMods){try{maxv*=f(v);}catch(e){}}
  if(sp.pedal&&P.energy<10)maxv*=.5;v.v=clamp(v.v,sp.two?-2:-8,maxv);
  const st=steerIn!=null?steerIn:(keys.left?1:0)-(keys.right?1:0);v.steer+=(st-v.steer)*Math.min(1,dt*(steerIn!=null?12:8));v.h+=v.steer*sp.turn*clamp(Math.abs(v.v)/7,0,1)*Math.sign(v.v)*(1-.35*Math.abs(v.v)/sp.max)*(keys.hb&&!sp.pedal&&Math.abs(v.v)>6?1.45:1)*dt;
  // momentum: the vehicle's motion follows its heading with some grip, so it slides a little in fast sharp turns
  const fx=Math.sin(v.h),fz=Math.cos(v.h);const hb=keys.hb&&!sp.pedal;if(hb)v.v-=Math.sign(v.v)*Math.min(Math.abs(v.v),(sp.two?10:7)*dt);const grip=(sp.two||sp.pedal?14:sp.max>36?6:8)*(hb&&Math.abs(v.v)>6?(sp.two?.35:.18):1);if(v.vx==null){v.vx=fx*v.v;v.vz=fz*v.v;}const gk=Math.min(1,dt*grip*(1+(Math.abs(v.v)<6?3:0)));v.vx+=(fx*v.v-v.vx)*gk;v.vz+=(fz*v.v-v.vz)*gk;
  const nx=v.pos.x+v.vx*dt,nz=v.pos.z+v.vz*dt;
  const okAt=sp.boat?(x,z)=>isWater(x,z)&&!isForeign(x,z)&&x>2&&z>Z0+2&&x<W.W-2&&z<W.H-2:drivable;let crash=0;if(okAt(nx+fx*sp.len/2,nz+fz*sp.len/2)&&okAt(nx,nz)){v.pos.x=nx;v.pos.z=nz;}else{crash=Math.abs(v.v);v.v*=-.2;v.vx=fx*v.v;v.vz=fz*v.v;}
  const accN=(v.v-(v.pv||0))/Math.max(dt,1e-3);v.pv=v.v;v.pitchT=clamp(-accN*.0045,-.07,.07)*(sp.two?.5:1);v.pitch=(v.pitch||0)+((v.pitchT)-(v.pitch||0))*Math.min(1,dt*7);v.bump=Math.max(0,(v.bump||0)-dt*2.5);
  const rough=!road&&!paved&&Math.abs(v.v)>3?Math.sin(now*23+v.pos.x)*.012*Math.min(1,Math.abs(v.v)/12):0;
  flyUpd(v);const hit=v.pos.y>1.5?null:collide(v.pos,Math.min(1.6,sp.wid/2+.2),false);if(hit){crash=Math.max(crash,Math.abs(v.v));v.v*=Math.abs(v.v)>3?-.3:.5;}
  const half=sp.len/2-sp.wid/2;
  for(const o of vehicles){if(o===v)continue;if(Math.abs(o.pos.x-v.pos.x)>14||Math.abs(o.pos.z-v.pos.z)>14||Math.abs(o.pos.y-v.pos.y)>2)continue;for(const t of [-half,0,half]){const px=v.pos.x+fx*t,pz=v.pos.z+fz*t;const s=segDist(px,pz,o);const min=o.spec.wid/2+sp.wid/2;
      if(s.d<min&&s.d>.001){const k=(min-s.d)/s.d;v.pos.x+=s.dx*k;v.pos.z+=s.dz*k;if(Math.abs(v.v)>5&&now-lastBump>1.2){lastBump=now;crash=Math.max(crash,Math.abs(v.v));if(o.state==='police')addWanted(1,'Rammed police');else if(o.state==='traffic'){o.stopT=3;}}v.v*=.4;break;}}}
  for(const p of peds){if(p.state==='down'||!p.g.visible)continue;const s=segDist(p.x+(p.ox||0),p.z+(p.oz||0),v);if(s.d<sp.wid/2+.45){if(Math.abs(v.v)>5)knockPed(p,'Hit a pedestrian');else{p.x+=s.dx/(s.d||1)*.5;p.z+=s.dz/(s.d||1)*.5;}}}
  for(const c of cows.concat(animals)){if(c.area?!c.g.visible:!c.active)continue;if(c.state==='down'||Math.abs(c.x-v.pos.x)>12||Math.abs(c.z-v.pos.z)>12||v.pos.y>1.5)continue;const sz=STRAY_SIZE[c.kind]||.7;const s=segDist(c.x,c.z,v);if(s.d<sp.wid/2+sz){const big=c.kind==='elephant'?3:sz>=.9?1.4:.6;v.pos.x-=s.dx/(s.d||1)*.6;v.pos.z-=s.dz/(s.d||1)*.6;
    if(Math.abs(v.v)>3&&now-lastBump>.8){lastBump=now;const imp=Math.abs(v.v);crash=Math.max(crash,imp*big);hurtAnimal(c,imp,'vehicle');}v.v*=c.kind==='elephant'?-.3:sz>=.9?.2:.6;}}
  if(crash>4){v.bump=Math.min(1,crash/12);v.vx=Math.sin(v.h)*v.v;v.vz=Math.cos(v.h)*v.v;if(crash>8)fleeFrom(v.pos.x,v.pos.z,18);player.shake=Math.min(.8,crash*.03);v.hp=Math.max(0,v.hp-crash*1.1);damage(sp.two||sp.pedal?0:crash*.2,'Crash');hornSfx();emit('crash',{v,impact:crash});if(v.hp<=0)toast('Engine dead · call a mechanic from Phone → Garage, or walk','#ff5d73');
    if((sp.two)&&crash>8){fallOff(v,crash);return;}}
  if(sp.fuel){const used=Math.abs(v.v*dt)/sp.range*100*(v.company?0:1);v.fuel=Math.max(0,v.fuel-used);if(v.fuel<15&&!lowFuelWarn&&v.fuel>0){lowFuelWarn=true;toast('Low fuel · find a pump','#ff9f1c');}if(v.fuel>20)lowFuelWarn=false;if(v.fuel<=0&&dry===false)toast('Out of fuel · push to a pump or call fuel delivery from Garage','#ff5d73');}
  P.stats.km+=Math.abs(v.v*dt)*2.4/1000;
  if(sp.two){v.lean+=((-v.steer*Math.min(Math.abs(v.v)/sp.max,1)*.55)-v.lean)*Math.min(1,dt*6);v.m.position.copy(v.pos);v.m.rotation.set(0,v.h,v.lean,'YXZ');}
  else{v.m.position.copy(v.pos);v.m.position.y+=rough+Math.sin(now*18)*v.bump*.08;v.m.rotation.set((v.pitch||0)+rough*.6+Math.sin(now*14)*v.bump*.03,v.h,-v.steer*Math.min(Math.abs(v.v)/sp.max,1)*.1+Math.sin(now*11)*v.bump*.03,'YXZ');}
  for(const w of v.m.userData.wheels)w.rotation.x+=v.v*dt/.36;if(v.m.userData.driver&&!sp.two)v.m.userData.driver.visible=camMode!==2;
  if(sp.two||sp.pedal){const s=sp.seat;const c=Math.cos(v.h),sn=Math.sin(v.h);avatar.position.set(v.pos.x+s[2]*sn,s[1]-.6,v.pos.z+s[2]*c);avatar.rotation.set(0,v.h,sp.two?v.lean:0,'YXZ');AU.legs[0].rotation.x=AU.legs[1].rotation.x=-1.2;AU.legs[0].rotation.z=-.1;AU.legs[1].rotation.z=.1;AU.arms[0].rotation.x=AU.arms[1].rotation.x=sp.pedal?-1.05:-.95;
    if(sp.pedal){const ph=now*Math.abs(v.v)*1.2;AU.legs[0].rotation.x=-1.2+Math.sin(ph)*.5;AU.legs[1].rotation.x=-1.2-Math.sin(ph)*.5;}avatar.visible=camMode!==2;}
  if(v.hp<30&&Math.random()<dt*6)puff(v.pos.x+fx*sp.len*.4,1.3,v.pos.z+fz*sp.len*.4);
  engTick(v,sp,dead||dry,dt);}
let steerIn=null;   // analog steering from the wheel, slider or tilt controls (features/steering.js); null = arrow keys
// boxing stance after a punch (fists up by the face), a real jab or cross with the elbow straightening, a twist of the body;
// a bat is swung down from over the shoulder
function fightPose(){const now=performance.now();const t=player.anim>0?1-player.anim/.25:0;AU.armLock=false;
  if(P.weapon==='fist'&&now-(player.lastPunch||0)<3500){AU.armLock=true;const s=player.punchSide|0,strike=player.anim>0?Math.sin(Math.PI*Math.min(1,t)):0;
    for(let i=0;i<2;i++){const hit=player.anim>0&&i===s;AU.arms[i].rotation.x=hit?-1.15-.45*strike:-1.15;AU.fores[i].rotation.x=hit?-1.95+1.85*strike:-1.95;AU.arms[i].rotation.z=(i?1:-1)*(hit?.04:.3);}
    avatar.rotation.y=player.h+(s?-1:1)*.28*strike;return;}
  AU.arms[0].rotation.z=-.05;AU.arms[1].rotation.z=.05;
  if(P.weapon==='bat'&&player.anim>0){AU.armLock=true;const e=Math.min(1,t*1.4);AU.arms[1].rotation.x=AU.arms[0].rotation.x=-2.7+2.2*e;AU.fores[1].rotation.x=AU.fores[0].rotation.x=-.6+.5*e;AU.arms[0].rotation.z=.35;AU.arms[1].rotation.z=-.15;avatar.rotation.y=player.h-.5+.9*e;}
  else if(WEAP[P.weapon]&&WEAP[P.weapon].ammo){const two=WEAP[P.weapon].two;AU.armLock=true;AU.fores[1].rotation.x=-.05;AU.fores[0].rotation.x=two?-.9:-.25;if(two)AU.arms[0].rotation.x=-1.2;}
  else if((P.weapon==='lathi'||P.weapon==='knife')&&player.anim>0){AU.armLock=true;const e=Math.min(1,t*1.6);AU.arms[1].rotation.x=-2.2+2*e;AU.fores[1].rotation.x=-.4+.3*e;avatar.rotation.y=player.h-.3+.6*e;}}
/* Swimming and drowning (Beta v1.01.25): walk, jump or fall into the sea, a river, a lake or a pool and you swim (slowly,
   the front crawl). Your breath runs down while you swim; get out before it is gone, or you start to drown and are knocked out. */
const wetAt=(x,z)=>(isWater(x,z)&&!roadAt(x,z,.5))||(POOLS.length&&inPool(x,z));let breath=100,brEl=null,brWarn=0;
function swimEnd(){if(player.swim){player.swim=false;if(brEl)brEl.hidden=true;}}
function swimTick(dt){const w=wetAt(player.pos.x,player.pos.z)&&(player.pos.y||0)<.5;
  if(!w){if(player.swim)swimEnd();breath=Math.min(100,breath+dt*30);return;}
  if(!player.swim){player.swim=true;toast('🌊 You are in the water · swim back to the shore','#5fb4ff');}
  player.v=clamp(player.v,-1,player.run?2.6:1.7);const now=performance.now()/1000;const sea=isWater(player.pos.x,player.pos.z)&&!(POOLS.length&&inPool(player.pos.x,player.pos.z));
  breath=Math.max(0,breath-dt*(player.run?3.2:2.2)*(sea?1.15:1));if(breath<=0){damage(14*dt,'Drowned');if(now-brWarn>3){brWarn=now;toast('🫧 You are drowning · get out of the water!','#ff5d73');}}else if(breath<30&&now-brWarn>6){brWarn=now;toast('🫧 Running out of breath · head for the shore','#ff9f1c');}
  const mv=Math.abs(player.v)>.2,k=now*(player.run?5:3.6);avatar.position.y=(sea?-1.1:0)-(mv?.45:1.45)+Math.sin(now*2.2)*.05;avatar.rotation.set(mv?1.15:.25,player.h,mv?Math.sin(k)*.12:0,'YXZ');
  AU.armLock=true;if(mv){AU.arms[0].rotation.x=-(k%6.283);AU.arms[1].rotation.x=-((k+3.1416)%6.283);AU.fores[0].rotation.x=AU.fores[1].rotation.x=-.25;AU.legs[0].rotation.x=Math.sin(k*2.4)*.35;AU.legs[1].rotation.x=-Math.sin(k*2.4)*.35;}
  else{const tr=Math.sin(now*2);AU.arms[0].rotation.x=AU.arms[1].rotation.x=-1.4+tr*.3;AU.arms[0].rotation.z=-.7;AU.arms[1].rotation.z=.7;AU.fores[0].rotation.x=AU.fores[1].rotation.x=-.4;AU.legs[0].rotation.x=-.3+tr*.2;AU.legs[1].rotation.x=-.1-tr*.2;}
  if(!brEl){brEl=document.createElement('div');brEl.id='breath';brEl.className='hud';brEl.innerHTML='🫧 <i><b></b></i>';document.body.appendChild(brEl);}brEl.hidden=false;const b=brEl.querySelector('b');b.style.width=breath+'%';b.style.background=breath<30?'#ff5d73':'#5fb4ff';}
function updFoot(dt,bounds){if(player.knock>0){player.knock-=dt;avatar.position.set(player.pos.x,.35,player.pos.z);avatar.rotation.set(-Math.PI/2,player.h,0,'YXZ');if(player.knock<=0)avatar.rotation.set(0,player.h,0);return;}
  const tired=(P.energy<=0?.6:1)*(P.health<25?.6:1);player.run=keys.run||keys.up&&isTouch;const target=keys.up?(player.run?7.5:4.2)*tired:keys.down?-2.4:0;player.v+=(target-player.v)*Math.min(1,dt*10);
  const st=(keys.left?1:0)-(keys.right?1:0);player.h+=st*3*dt;let nx=player.pos.x+Math.sin(player.h)*player.v*dt,nz=player.pos.z+Math.cos(player.h)*player.v*dt;
  if(!bounds){const feet=player.pos.y||0,gN=groundAt(nx,nz,feet);if(gN.block){nx=player.pos.x;nz=player.pos.z;player.v*=.3;if(gN.msg&&performance.now()-(gN.p._m||0)>2500){gN.p._m=performance.now();toast(gN.msg,'#ffc93c');}}}
  if(bounds){player.pos.x=clamp(nx,-bounds.w/2+.4,bounds.w/2-.4);player.pos.z=clamp(nz,-bounds.d/2+.4,bounds.d/2-.3);const vb=inside&&inside.venue&&inside.venue.blk;if(vb)for(const r of vb){const q=player.pos;if(q.x>r[0]-.35&&q.x<r[2]+.35&&q.z>r[1]-.35&&q.z<r[3]+.35){const dl=q.x-r[0]+.35,dr=r[2]+.35-q.x,du=q.z-r[1]+.35,dd=r[3]+.35-q.z,m=Math.min(dl,dr,du,dd);if(m===dl)q.x=r[0]-.35;else if(m===dr)q.x=r[2]+.35;else if(m===du)q.z=r[1]-.35;else q.z=r[3]+.35;}}}
  else{const wN=wetAt(nx,nz);if(drivable(nx,nz)||wN&&nx>2&&nz>Z0+2&&nx<W.W-2&&nz<W.H-2){player.pos.x=nx;player.pos.z=nz;}if((player.pos.y||0)<.8)collide(player.pos,.4,true);for(const o of vehicles){if(Math.abs(o.pos.x-player.pos.x)>8||Math.abs(o.pos.z-player.pos.z)>8)continue;const s=segDist(player.pos.x,player.pos.z,o);const min=o.spec.wid/2+.4;if(s.d<min&&s.d>.001){const k=(min-s.d)/s.d;player.pos.x+=s.dx*k;player.pos.z+=s.dz*k;}}}
  player.anim=Math.max(0,player.anim-dt);const ph=performance.now()/1000*(player.run?13:9),sw=Math.min(1,Math.abs(player.v)/4)*.7;
  AU.legs[0].rotation.z=AU.legs[1].rotation.z=0;AU.legs[0].rotation.x=Math.sin(ph)*sw;AU.legs[1].rotation.x=-Math.sin(ph)*sw;AU.arms[0].rotation.x=-Math.sin(ph)*sw;AU.arms[1].rotation.x=player.anim>0?-1.5:(P.weapon==='fist'?Math.sin(ph)*sw:-.5);
  if(!bounds){const fl=groundAt(player.pos.x,player.pos.z,player.pos.y||0).y;player.vy=(player.vy||0)-15*dt;let y=(player.pos.y||0)+player.vy*dt;if(y<=fl){if(player.vy<-7)player.shake=Math.min(.3,-player.vy*.02);y=fl;player.vy=0;}player.pos.y=y;}else{player.pos.y=0;player.vy=0;}
  const air=(player.pos.y||0)-(bounds?0:groundAt(player.pos.x,player.pos.z,player.pos.y||0).y);if(air>.05){AU.legs[0].rotation.x=-.6;AU.legs[1].rotation.x=.3;AU.arms[0].rotation.x=AU.arms[1].rotation.x=-2.4;}
  avatar.position.set(player.pos.x,(inside?0:.3)+(player.pos.y||0),player.pos.z);avatar.rotation.set(0,player.h,0);fightPose();if(!bounds)swimTick(dt);else swimEnd();avatar.visible=camMode!==2;if(eng){eng.g.gain.value=0;if(eng.drift)eng.drift.g.gain.value=0;}}
/* Beta v1.01.21: jumping, and raised platforms (event stages) you can jump onto. api.addPlatform({x,z,hw,hd,y,rot,ok(),msg}) */
const PLATS=[];function addPlatform(p){PLATS.push(p);return p;}function removePlatform(p){const i=PLATS.indexOf(p);if(i>=0)PLATS.splice(i,1);}
function inPlat(p,x,z,m){const c=Math.cos(p.rot||0),s=Math.sin(p.rot||0),dx=x-p.x,dz=z-p.z;const lx=dx*c-dz*s,lz=dx*s+dz*c;return Math.abs(lx)<p.hw+(m||0)&&Math.abs(lz)<p.hd+(m||0);}
// floor height at (x,z) for feet at height feet: the highest platform top you can stand on; block when a platform is too high to step onto (or you may not go up)
function groundAt(x,z,feet){let y=0,block=false,msg='',bp=null;for(const p of PLATS){if(!inPlat(p,x,z))continue;const ok=!p.ok||p.ok();if(ok&&p.y<=feet+.35){if(p.y>y)y=p.y;}else if((!ok&&feet<p.y-.01)||(ok&&p.y>feet+.35)){block=true;if(!ok)msg=p.msg||'';bp=p;}}return{y,block,msg,p:bp||{}};}
function jump(){if(player.mode!=='foot'||inside||player.knock>0||overT>0)return;const fl=groundAt(player.pos.x,player.pos.z,player.pos.y||0).y;if((player.pos.y||0)-fl>.06)return;player.vy=5.8;emit('jump');}
const JCL=new Map();let TIDN=0;
// Beta v1.01.22: lanes on highways. Slow vehicles stay in the left lane; a car stuck behind slower traffic moves to the right
// lane when it is clear, overtakes, and comes back to the left after a while. The move is a smooth slide, not a jump.
function laneClear(c,l,k){const fx=Math.sin(c.h),fz=Math.cos(c.h);const shift=(k===1?1:-1)*(l.e.laneO-l.e.laneI);
  for(const o of vehicles){if(o===c)continue;const dx=o.pos.x-c.pos.x,dz=o.pos.z-c.pos.z;if(Math.abs(dx)>34||Math.abs(dz)>34)continue;const dot=Math.sin(o.h)*fx+Math.cos(o.h)*fz;if(o.state==='traffic'&&dot<.3)continue;
    const along=dx*fx+dz*fz,lat=-dx*fz+dz*fx;if(along>-14&&along<18&&Math.abs(lat-shift)<2.2)return false;}return true;}
function laneChange(c,l,dt,stuck,target){l.lcT=Math.max(0,(l.lcT||0)-dt);if(l.vmax0==null)l.vmax0=l.vmax;
  let want=l.k||0;if(!want&&!l.slow&&stuck&&target<l.vmax*.75)want=1;else if(want===1&&l.slow)want=0;else if(want===1&&l.pass&&(l.passT=(l.passT||0)+dt)>7&&!stuck)want=0;
  // Beta v1.01.28: indicate for a second, look again, then steer across smoothly (the car points into the new lane)
  if(l.sigK!=null){l.sigT-=dt;if(l.sigT<=0){const k=l.sigK;l.sigK=null;if(k!==(l.k||0)&&laneClear(c,l,k)){l.k=k;l.lcT=3;l.passT=0;if(k===1&&!l.fast){l.pass=true;l.vmax=Math.min(c.spec.max*.68,l.vmax0*1.3);}else if(k===0){l.pass=false;l.vmax=l.vmax0;}}else l.lcT=1.5;}}
  else if(want!==(l.k||0)&&l.lcT<=0&&laneClear(c,l,want)){l.sigK=want;l.sigT=1.1;}
  const tgt=laneOff(l);if(l.oe!==l.e||l.off==null){l.oe=l.e;l.off=tgt;l.lv=0;}
  else{const d=tgt-l.off,lim=Math.min(1.5,.55+Math.abs(c.v)*.07);l.lv=(l.lv||0)+clamp(clamp(d*1.1,-lim,lim)-(l.lv||0),-1.6*dt,1.6*dt);l.off+=l.lv*dt;if(Math.abs(d)<.03&&Math.abs(l.lv)<.08){l.off=tgt;l.lv=0;}}
  const ks=l.sigK!=null?l.sigK:null;c.sigSide=ks!=null?Math.sign((ks?l.e.laneI:l.e.laneO)-l.off):Math.abs(tgt-l.off)>.2?Math.sign(tgt-l.off):0;}
// indicator lamps (made the first time a vehicle signals): amber, front and back corners, blinking about 1.5 times a second
const INDM=new THREE.MeshBasicMaterial({color:0xffa21a}),INDG=new THREE.BoxGeometry(.14,.09,.07);
function indSet(c,side){if(!side&&!c.ind)return;if(!c.ind){const sp=c.spec,hw=sp.two?.2:sp.wid/2-.04,hl=sp.len/2-.03,y=sp.two?.95:sp.len>6?1.1:.78;c.ind={on:0,L:[],R:[]};
    for(const sx of [-1,1])for(const sz of [-1,1]){const m=new THREE.Mesh(INDG,INDM);m.position.set(sx*hw,y,sz*hl);m.visible=false;c.m.add(m);c.ind[sx>0?'R':'L'].push(m);}}
  const blink=side&&Math.sin(performance.now()*.0094)>0;if(c.ind.on===(blink?side:0))return;c.ind.on=blink?side:0;for(const m of c.ind.R)m.visible=blink&&side>0;for(const m of c.ind.L)m.visible=blink&&side<0;}
// can a vehicle make a U-turn here? (no oncoming vehicle close by on the other side of the road)
function uGapClear(c){const fx=Math.sin(c.h),fz=Math.cos(c.h);for(const o of vehicles){if(o===c||o.state==='parked')continue;const dx=o.pos.x-c.pos.x,dz=o.pos.z-c.pos.z;if(Math.abs(dx)>45||Math.abs(dz)>45||Math.abs(o.pos.y-c.pos.y)>2)continue;
    const dot=Math.sin(o.h)*fx+Math.cos(o.h)*fz,along=dx*fx+dz*fz,lat=Math.abs(-dx*fz+dz*fx);if(lat>9)continue;if(along>-4&&along<8&&lat<4.5&&o.state==='traffic')return false;if(dot<-.4&&along>0&&along<40&&(o.v||0)>.8)return false;if(dot>.4&&along<0&&along>-25&&(o.v||0)>1.5&&lat>2)return false;}return true;}
// How high is whatever stands at x,z (Beta v1.01.25, for flying): buildings, hills and other solid things (landmarks count as 16 m).
const OTH=new Map();let othN=-1;function othBuild(){OTH.clear();othN=BLDH.length;const put=(x0,z0,x1,z1,o)=>{for(let i=Math.floor(x0/40);i<=Math.floor(x1/40);i++)for(let j=Math.floor(z0/40);j<=Math.floor(z1/40);j++){const k=i+','+j;let a=OTH.get(k);if(!a)OTH.set(k,a=[]);a.push(o);}};
  for(const b of BLDH)put(b[0]-b[2],b[1]-b[3],b[0]+b[2],b[1]+b[3],{t:0,b});for(const h of HILLS_TRY)if(h.ok)put(h.x-h.rad,h.z-h.rad,h.x+h.rad,h.z+h.rad,{t:1,h});}
function obstTop(x,z){if(othN!==BLDH.length)othBuild();let top=0;const a=OTH.get(Math.floor(x/40)+','+Math.floor(z/40));if(a)for(const o of a){if(o.t===0){const b=o.b;if(Math.abs(x-b[0])<=b[2]&&Math.abs(z-b[1])<=b[3]&&b[4]>top)top=b[4];}else{const h=o.h,d=Math.hypot(x-h.x,z-h.z);if(d<h.rad){const y=h.H*(1-d/h.rad)-.5;if(y>top)top=y;}}}
  if(top===0){const cc=cHash.get(Math.floor(x/CHS)+','+Math.floor(z/CHS));if(cc)for(const c of cc)if(c.veh&&c.hw*c.hd>12&&Math.abs(c.x-x)<c.hw&&Math.abs(c.z-z)<c.hd){top=Math.max(top,c.h||12);break;}}return top;}
// the city block (with its pavement) at x,z, if any
const BKH=new Map();let bkN=-1;function blockAt(x,z){if(bkN!==blocks.length){BKH.clear();bkN=blocks.length;for(const b of blocks){const k=Math.floor(b.x/80)+','+Math.floor(b.z/80);let a=BKH.get(k);if(!a)BKH.set(k,a=[]);a.push(b);}}
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=BKH.get((Math.floor(x/80)+i)+','+(Math.floor(z/80)+j));if(a)for(const b of a)if(Math.abs(b.x-x)<31&&Math.abs(b.z-z)<31)return b;}return null;}
// is a point on screen? (stuck traffic is cleared away only where you can't see it)
const _fr=new THREE.Frustum(),_fm=new THREE.Matrix4();let _frF=-1;function inView(p){if(_frF!==frame){_frF=frame;camera.updateMatrixWorld();_fm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);_fr.setFromProjectionMatrix(_fm);}return _fr.containsPoint(p);}
function updTraffic(dt){const pp=ppos();const fp=player.mode==='foot'?player.pos:null;let n=0;
  // another player nearby runs the traffic (features/nettraffic.js): show theirs, not ours
  if(hooks.netFollow){for(const c of vehicles.slice())if(c.state==='traffic')removeVeh(c);return;}
  for(const c of vehicles.slice()){if(c.state!=='traffic'){if(c.ind&&c.ind.on)indSet(c,0);continue;}n++;if(c.pos.distanceTo(pp)>390){removeVeh(c);n--;continue;}const l=c.lane;let target=c.stopT>0?0:l.vmax;c.stopT=Math.max(0,c.stopT-dt);let blocked=null;
    if(!c.tid)c.tid=++TIDN;const fx=Math.sin(c.h),fz=Math.cos(c.h);const look=c.spec.len/2+6+Math.abs(c.v)*.9;
    // cars ignore oncoming cars (lanes can touch where roads meet) and a car stuck behind traffic for 6 s squeezes through,
    // so junctions at the ends of highways never lock up
    c.ghostT=Math.max(0,(c.ghostT||0)-dt);let jam=false;
    if(!(c.ghostT>0))for(const o of vehicles){if(o===c)continue;const dx=o.pos.x-c.pos.x,dz=o.pos.z-c.pos.z;if(Math.abs(dx)>50||Math.abs(dz)>50||Math.abs(o.pos.y-c.pos.y)>2)continue;const along=dx*fx+dz*fz,lat=Math.abs(-dx*fz+dz*fx);
      const dot=Math.sin(o.h)*fx+Math.cos(o.h)*fz;const near=along>0&&along<c.spec.len/2+o.spec.len/2+2.5&&lat<(c.spec.wid+o.spec.wid)/2+.3;const cross=!!(o.turn&&!o.turn.wait&&!c.turn&&along>0&&along<look+o.spec.len/2&&lat<(c.spec.wid+o.spec.wid)/2+.6);if(o.state==='traffic'&&dot<-.3&&!near&&!cross)continue;
      // crossing traffic: the vehicle that got there first (lower number) goes, the other waits its turn
      if(o.state==='traffic'&&Math.abs(dot)<.6&&(o.tid||0)>c.tid&&!near&&!cross)continue;
      if(along>0&&along<look+o.spec.len/2&&lat<2.4){target=Math.min(target,o.state==='traffic'?o.v*.8:0);if(o.state!=='traffic')blocked=o;else jam=true;}}
    if(jam&&c.v<.4){c.jamT=(c.jamT||0)+dt;if(c.jamT>7){c.jamT=0;if(c.pos.distanceTo(pp)>45||!inView(c.pos)){removeVeh(c);n--;continue;}else if((c.jamN=(c.jamN||0)+1)>4)c.ghostT=2;}}else{c.jamT=0;c.jamN=0;}
    for(const q of [fp,...cows.filter(k=>k.active)]){if(!q)continue;const dx=q.x-c.pos.x,dz=q.z-c.pos.z;const along=dx*fx+dz*fz,lat=Math.abs(-dx*fz+dz*fx);if(along>0&&along<look+2&&lat<2.4)target=0;}
    if(l.e.multi&&!c.turn)laneChange(c,l,dt,jam||!!blocked,target);
    if(blocked&&c.v<.5){c.blockT+=dt;if(c.blockT>9&&c.pos.distanceTo(pp)>60){removeVeh(c);n--;continue;}}else c.blockT=0;
    if(frame%3===0)c.sigD=sigStop(c);if(c.sigD!=null&&c.sigD<Infinity)target=Math.min(target,c.sigD<1?0:Math.max(0,c.sigD*.7));
    if(c.turn&&c.turn.wait){const T=c.turn;const o=JCL.get(T.key);if(o&&o!==c&&vehicles.includes(o)&&o.turn&&o.turn.key===T.key&&(T.waited=(T.waited||0)+dt)<8)target=0;else{T.wait=false;JCL.set(T.key,c);}}
    {const pv=c.v;c.v+=clamp(target-c.v,-20*dt,5*dt);if(!c.spec.two){const pt=clamp((pv-c.v)/Math.max(dt,1e-3)*.004,-.05,.05);c.m.rotation.x+=(pt-c.m.rotation.x)*Math.min(1,dt*6);}}
    if(c.turn&&!c.turn.wait){const T=c.turn;T.t=Math.min(1,T.t+c.v*dt/T.len);const t=T.t,u=1-t;let x,z,tx,tz;
      if(T.c2){x=u*u*u*T.p0[0]+3*u*u*t*T.c[0]+3*u*t*t*T.c2[0]+t*t*t*T.p2[0];z=u*u*u*T.p0[1]+3*u*u*t*T.c[1]+3*u*t*t*T.c2[1]+t*t*t*T.p2[1];tx=3*u*u*(T.c[0]-T.p0[0])+6*u*t*(T.c2[0]-T.c[0])+3*t*t*(T.p2[0]-T.c2[0]);tz=3*u*u*(T.c[1]-T.p0[1])+6*u*t*(T.c2[1]-T.c[1])+3*t*t*(T.p2[1]-T.c2[1]);}
      else{x=u*u*T.p0[0]+2*u*t*T.c[0]+t*t*T.p2[0];z=u*u*T.p0[1]+2*u*t*T.c[1]+t*t*T.p2[1];tx=2*u*(T.c[0]-T.p0[0])+2*t*(T.p2[0]-T.c[0]);tz=2*u*(T.c[1]-T.p0[1])+2*t*(T.p2[1]-T.c[1]);}
      c.pos.set(x,(T.y0||0)+((T.y2||0)-(T.y0||0))*t,z);if(Math.abs(tx)+Math.abs(tz)>1e-6)c.h=Math.atan2(tx,tz);c.m.rotation.y=c.h;if(T.t>=1){if(JCL.get(T.key)===c)JCL.delete(T.key);c.turn=null;placeLane(c);}}
    else if(!c.turn){l.s+=l.dir*c.v*dt;const left=l.dir>0?(l.e.stopB!=null?l.e.stopB:l.e.len)-l.s:l.s-(l.e.stopA||0);/* v1.01.23: turn round before a pool or fort at the end of the road */const TR=Math.min(9,l.e.len*.4);
      if(left<=TR){const pk={e:l.e,s:l.s,dir:l.dir};nextLane(pk);
        if(pk.dead){// a road that ends: far from you the vehicle simply leaves; near you it makes a proper U-turn
          if(c.pos.distanceTo(pp)>70){removeVeh(c);n--;continue;}
          if(!uGapClear(c)&&(c.uWait=(c.uWait||0)+dt)<14){l.s-=l.dir*c.v*dt;c.v=0;const h0=c.h;lanePos({e:l.e,s:l.s,dir:-l.dir,k:l.k},_lp);c.sigSide=Math.sign((_lp.x-c.pos.x)*Math.cos(h0)-(_lp.z-c.pos.z)*Math.sin(h0))||1;}
          else{c.uWait=0;const h0=c.h,fx2=Math.sin(h0),fz2=Math.cos(h0),r=Math.max(2.4,l.e.lane*1.2+1.2);lanePos({e:l.e,s:l.s,dir:-l.dir,k:l.k},_lp);
          c.turn={p0:[c.pos.x,c.pos.z],c:[c.pos.x+fx2*r*1.4,c.pos.z+fz2*r*1.4],c2:[_lp.x+fx2*r*1.4,_lp.z+fz2*r*1.4],p2:[_lp.x,_lp.z],t:0,len:r*3.4+2,key:'u'+(c.tid||(c.tid=++TIDN)),y0:c.pos.y,y2:c.pos.y,side:Math.sign((_lp.x-c.pos.x)*fz2-(_lp.z-c.pos.z)*fx2)||1};l.dir=-l.dir;}}
        else{const s1=pk.dir>0?Math.min(Math.min(9,pk.e.len*.4),pk.e.len):Math.max(0,pk.e.len-Math.min(9,pk.e.len*.4));const p0=[c.pos.x,c.pos.z],h0=c.h;lanePos({e:pk.e,s:s1,dir:pk.dir,k:l.k},_lp);const p2=[_lp.x,_lp.z],h2=_lp.h;
          const d=Math.hypot(p2[0]-p0[0],p2[1]-p0[1]);let dh=h2-h0;dh=Math.atan2(Math.sin(dh),Math.cos(dh));const k=d*.45;const cc=Math.abs(dh)<.15?[(p0[0]+p2[0])/2,(p0[1]+p2[1])/2]:null;
          const ex=l.dir>0?l.e.bx:l.e.ax,ez=l.dir>0?l.e.bz:l.e.az;const key=Math.round(ex/10)+','+Math.round(ez/10);const busy=pk.e.road!==l.e.road||Math.abs(dh)>.5;
          c.turn=cc?{p0,c:cc,p2,t:0,len:Math.max(1,d)}:{p0,c:[p0[0]+Math.sin(h0)*k,p0[1]+Math.cos(h0)*k],c2:[p2[0]-Math.sin(h2)*k,p2[1]-Math.cos(h2)*k],p2,t:0,len:Math.max(1,d*(1+Math.abs(dh)*.25))};c.turn.key=busy?key:'s'+(c.tid||(c.tid=++TIDN));c.turn.side=Math.abs(dh)>.5?Math.sign(dh):0;c.turn.y0=c.pos.y;c.turn.y2=pk.e.fly?flyY(pk.e,s1):0;
          if(busy){const o=JCL.get(key);if(o&&o!==c&&vehicles.includes(o)&&o.turn&&o.turn.key===key){c.turn.wait=true;}else JCL.set(key,c);}
          l.e=pk.e;l.dir=pk.dir;l.s=s1;}}
      if(!c.turn){placeLane(c);if(l.lv&&c.v>.5){c.h+=clamp(Math.atan2(l.lv,c.v),-.22,.22);c.m.rotation.y=c.h;}}}c.m.visible=Math.abs(c.pos.x-pp.x)+Math.abs(c.pos.z-pp.z)<Math.max(240,scene.fog.far*.6);for(const w of c.m.userData.wheels)w.rotation.x+=c.v*dt/.4;if(c.m.visible&&!c.spec.pedal)indSet(c,c.turn?(c.turn.side||0):l.e.multi?(c.sigSide||0):(c.uWait?c.sigSide||0:0));const Dr=c.m.userData.driver;if(Dr&&Dr.userData.pedal&&c.m.visible){Dr.userData.pph=(Dr.userData.pph||0)+c.v*dt*1.3;const a=Math.sin(Dr.userData.pph)*.5;Dr.userData.legs[0].rotation.x=-1.15+a;Dr.userData.legs[1].rotation.x=-1.15-a;}}
  let spawns=0;while(n<Math.round(CFG.traffic*botScale*GFX.k)&&spawns<3){spawns++;const v=spawnTraffic(started);if(v&&vehicles.some(o=>o!==v&&Math.abs(o.pos.x-v.pos.x)<(o.spec.len+v.spec.len)/2+3&&Math.abs(o.pos.z-v.pos.z)<(o.spec.len+v.spec.len)/2+3&&Math.abs(o.pos.y-v.pos.y)<2&&segDist(v.pos.x,v.pos.z,o).d<(o.spec.wid+v.spec.wid)/2+1.5)){removeVeh(v);continue;}if(v){const c=CONG[v.lane.e.id];if(Math.random()>.35+c){removeVeh(v);continue;}v.lane.vmax*=1-.55*c;const hw=v.lane.e.kind!=='city'&&v.lane.e.kind!=='service';if(hw&&v.spec.max>=20)v.lane.vmax=Math.max(v.lane.vmax,25.2);v.lane.vmax=botAdmin(v.lane.vmax,v.type,hw);n++;}}}
// Admin → Settings → Vehicle speeds (Beta v1.01.25): a top speed per vehicle type, one for street traffic and one for players,
// plus an overall percentage for each. Empty means the game's own speed.
function vsOver(type,k){const o=CFG.vspeed&&CFG.vspeed[type];const n=o&&+o[k];return n>0?n/3.6:0;}
function playerMax(type,sp){const o=vsOver(type,'p');return (o||sp.max)*clamp((+CFG.playerSpeedPct||100)/100,.3,3);}
function botAdmin(vm,type,hw){const o=vsOver(type,'b');let r=vm;if(o)r=hw?o*MR(.9,1.02):Math.min(vm,o);return r*clamp((+CFG.botSpeedPct||100)/100,.3,3);}
// people jump out of the way of a speeding vehicle (yours or traffic) and run from fights and gunfire
function dodgeCheck(p,dt){if(p.state==='down'||p.state==='idle')return;p.ox=p.ox||0;p.oz=p.oz||0;let hx=0,hz=0;
  const near=[];if(player.mode==='drive'&&player.veh)near.push(player.veh);for(const v of vehicles)if(v.state==='traffic'&&Math.abs(v.pos.x-p.x)<20&&Math.abs(v.pos.z-p.z)<20)near.push(v);
  for(const v of near){const sp=Math.abs(v.v);if(sp<6)continue;const fx=Math.sin(v.h)*Math.sign(v.v),fz=Math.cos(v.h)*Math.sign(v.v);const dx=p.x+p.ox-v.pos.x,dz=p.z+p.oz-v.pos.z;const along=dx*fx+dz*fz,lat=-dx*fz+dz*fx;
    if(along>0&&along<sp*1.6+4&&Math.abs(lat)<2.6){const s=lat>=0?1:-1;hx+=-fz*s*6;hz+=fx*s*6;if(v===player.veh&&!p.yell&&Math.random()<.4){p.yell=1;p.wave=true;setTimeout(()=>{p.wave=false;p.yell=0;},1600);}}}
  const ob=pedPush(p.x+p.ox,p.z+p.oz);
  if(hx||hz){p.ox=clamp(p.ox+hx*dt,-4,4);p.oz=clamp(p.oz+hz*dt,-4,4);if(p.state==='walk'){p.state='flee';p.fleeT=1.4;}}else if(ob){p.ox=clamp(p.ox+ob[0]*dt,-3,3);p.oz=clamp(p.oz+ob[1]*dt,-3,3);}else{p.ox*=Math.max(0,1-dt*.8);p.oz*=Math.max(0,1-dt*.8);}}
// People step round you (standing or sitting) and round benches and other things registered with api.pedBlock(x,z,r)
const PBLK=new Map();function pedBlock(x,z,r){const k=Math.floor(x/20)+','+Math.floor(z/20);let a=PBLK.get(k);if(!a)PBLK.set(k,a=[]);a.push([x,z,r]);}
const _pb=[0,0];function pedPush(x,z){let bx=0,bz=0;const one=(ox,oz,r)=>{const dx=x-ox,dz=z-oz,d=Math.hypot(dx,dz),m=r+.45;if(d<m&&d>1e-3){const k=(m-d)*7/d;bx+=dx*k;bz+=dz*k;}};
  if(!inside&&player.mode!=='drive'){if(avatar.visible)one(avatar.position.x,avatar.position.z,.45);else one(player.pos.x,player.pos.z,.4);}
  const a=PBLK.get(Math.floor(x/20)+','+Math.floor(z/20));if(a)for(const q of a)one(q[0],q[1],q[2]);if(!bx&&!bz)return null;_pb[0]=bx;_pb[1]=bz;return _pb;}
// Beta v1.01.26: people walk right round the block, turning at each corner, instead of pacing up and down one side
function pedCorner(p){const end=Math.sign(p.t);if(Math.random()<.2){p.t=end*27;p.dir*=-1;return;}
  if(p.side<2){const s0=p.side;p.side=end>0?3:2;p.t=s0===0?-26.5:26.5;p.dir=s0===0?1:-1;}else{const s0=p.side;p.side=end>0?1:0;p.t=s0===2?-26.5:26.5;p.dir=s0===2?1:-1;}}
function updPeds(dt,t){const pp=ppos();for(const p of peds){if(p.state==='idle'){if(Math.random()<.02)placePed(p,40);continue;}dodgeCheck(p,dt);
    if(p.state==='down'){p.downT-=dt;if(p.downT<=0){p.hitOnce=false;p.fighter=null;placePed(p,50);continue;}p.fallT=(p.fallT||0)+dt;const k=Math.min(1,p.fallT/.55),e=k*k;p.g.rotation.set(-Math.PI/2*e,p.ry,0,'YXZ');p.g.position.set(p.x+(p.ox||0),.3+.15*e,p.z+(p.oz||0));const U=p.g.userData;if(k<1&&U.arms){U.arms[0].rotation.x=U.arms[1].rotation.x=-2.2*k;}continue;}
    if(p.state==='hit'){p.hitT-=dt;const U=p.g.userData,k=Math.max(0,p.hitT/.5);p.g.position.set(p.x+(p.ox||0),.3,p.z+(p.oz||0));p.g.rotation.set(.35*Math.sin(k*Math.PI),p.ry,0,'YXZ');if(U.arms){U.arms[0].rotation.x=U.arms[1].rotation.x=-1.4*k;}if(U.legs){U.legs[0].rotation.x=-.3*k;U.legs[1].rotation.x=.25*k;}
      if(p.hitT<=0){p.g.rotation.set(0,p.ry,0);if(p.fighter&&player.mode==='foot'){p.state='fight';p.fightT=12;p.punchT=.6;p.x+=p.ox||0;p.z+=p.oz||0;p.ox=p.oz=0;}else{p.state='flee';p.fleeT=6;}}continue;}
    if(p.state==='fight'){p.fightT-=dt;const fx=player.pos.x-p.x,fz=player.pos.z-p.z,fd=Math.hypot(fx,fz)||1;p.ry=Math.atan2(fx,fz);const U=p.g.userData;
      if(p.fightT<=0||fd>16||player.mode!=='foot'||inside||overT>0){p.state='run';p.vx=-fx/fd*4.5;p.vz=-fz/fd*4.5;p.runT=4;continue;}
      if(fd>1.15){p.x+=fx/fd*2.6*dt;p.z+=fz/fd*2.6*dt;const ph=t*10+p.ph;if(U.legs){U.legs[0].rotation.x=Math.sin(ph)*.6;U.legs[1].rotation.x=-Math.sin(ph)*.6;}}else if(U.legs){U.legs[0].rotation.x=.15;U.legs[1].rotation.x=-.2;}
      p.punchT-=dt;const sw=p.punchT<.25&&p.punchT>0?Math.sin((1-p.punchT/.25)*Math.PI):0;if(U.arms){U.arms[0].rotation.x=-1.15-.4*sw;U.arms[1].rotation.x=-1.1;}if(U.fores){U.fores[0].rotation.x=-1.9+1.75*sw;U.fores[1].rotation.x=-1.95;}U.armLock=true;
      if(p.punchT<=0){p.punchT=.8+Math.random()*.6;if(fd<1.4&&player.knock<=0){sfxPunch();damage(4+Math.random()*5,'Got punched');player.shake=.18;}}
      p.g.position.set(p.x,.3,p.z);p.g.rotation.set(0,p.ry,0);continue;}
    if(p.g.userData.armLock)p.g.userData.armLock=false;
    if(Math.abs(p.x-pp.x)>240||Math.abs(p.z-pp.z)>240){placePed(p,60);continue;}
    if(p.state==='run'){p.x+=p.vx*dt;p.z+=p.vz*dt;p.runT-=dt;if(p.runT<=0)placePed(p,50);}
    else{const sp=p.state==='flee'?4.6:p.sp;if(p.state==='flee'){p.fleeT-=dt;if(p.fleeT<=0)p.state='walk';}p.t+=p.dir*sp*dt;if(Math.abs(p.t)>27){pedCorner(p);}edgeXY(p);if(frame%20===0&&wetNear(p.x,p.z,3)){p.dir*=-1;p.t+=p.dir*sp*dt*2;edgeXY(p);}}
    const far=Math.abs(p.x-pp.x)>110||Math.abs(p.z-pp.z)>110;p.g.visible=!far&&!inside;if(far)continue;const fast=p.state!=='walk';p.g.position.set(p.x+(p.ox||0),.3+Math.abs(Math.sin(t*(fast?12:7)+p.ph))*.08,p.z+(p.oz||0));p.g.rotation.set(0,p.state==='run'?Math.atan2(p.vx,p.vz):p.ry,0);
    const U=p.g.userData,sw=fast?.9:.5,ph=t*(fast?12:7)+p.ph;U.legs[0].rotation.x=Math.sin(ph)*sw;U.legs[1].rotation.x=-Math.sin(ph)*sw;U.arms[0].rotation.x=-Math.sin(ph)*sw;U.arms[1].rotation.x=p.state==='flee'?-2.6:p.wave?-2.8+Math.sin(t*8)*.4:Math.sin(ph)*sw;}}

/* ================= prompts, HUD, minimap ================= */
const prompts=[];function addPrompt(fn){prompts.push(fn);}
const firstPrompts=[];
function updPrompt(){let txt=null;curPrompt=null;let pf=null;if(!inside)for(const f of firstPrompts){try{pf=f(api);}catch(e){}if(pf)break;}
  if(pf&&(inside||player.mode==='drive')){curPrompt={fn:pf.fn,first:true};txt=`<kbd>E</kbd>${esc(pf.text)}`;}
  else if(player.mode!=='drive'&&!inside){const o=footOpts(pf);if(o.length===1&&o[0].first)curPrompt={fn:o[0].fn,first:true};else if(o.length)curPrompt={opts:o};
    txt=o.length===1?`<kbd>E</kbd>${esc(o[0].text)}`:o.length?`<kbd>E</kbd>Choose: ${o.slice(0,3).map(q=>esc(q.text)).join(' · ')}`:null;}
  else if(inside){const ip=nearInterior();if(ip)txt=`<kbd>E</kbd>${esc(ip.name)}`;}
  else if(player.mode==='drive'){const near=pois.find(p=>Math.hypot(player.veh.pos.x-p.x,player.veh.pos.z-p.z)<(p.drive?7:6));if(near){curPrompt={poi:near};txt=near.drive?`<kbd>E</kbd>${esc(near.name)}${Math.abs(player.veh.v)>2?' · stop first':''}`:`<kbd>E</kbd>Get out to visit ${esc(near.name)}`;if(!near.drive)curPrompt=null;}}
  else{let best=null,bd=2.8;for(const p of pois){const d=Math.hypot(player.pos.x-p.x,player.pos.z-p.z);if(d<bd){bd=d;best=p;}}
    if(best){curPrompt={poi:best};const own=best.type==='home'&&P.homes.includes(best.extra);txt=`<kbd>E</kbd>${best.prompt?best.prompt:best.type==='home'?(own?'Enter '+esc(best.name):esc(best.name)+' · for sale'):esc(best.name)}`;}
    else{for(const f of prompts){const r=f(api);if(r){curPrompt={fn:r.fn};txt=`<kbd>E</kbd>${esc(r.text)}`;break;}}
      if(!txt){const v=nearestVeh();if(v)txt=`<kbd>E</kbd>${v.state==='traffic'?'Take this '+v.spec.label+' (crime)':v.state==='police'?(v.dead?'Take the wrecked jeep':'Steal police jeep'):v.fallen?'Pick up the '+v.spec.label:(v.owned?'Get in your '+v.spec.label:v.company?'Company '+v.spec.label:'Get in '+v.spec.label)}`;}}}
  const el=$('#prompt');if(txt){el.innerHTML=txt;el.hidden=false;}else el.hidden=true;}
const HUDC={};function hudSet(k,v,f){if(HUDC[k]===v)return;HUDC[k]=v;f(v);}
function updHud(){hudSet('money',P.cash+'|'+P.bank,()=>{$('#money').innerHTML=`${inr(P.cash)}<small>Bank ${inr(P.bank)}</small>`;});setMeter('#mHp',P.health);setMeter('#mHunger',P.hunger);setMeter('#mEnergy',P.energy);
  const drv=player.mode==='drive'&&player.veh;const spd=drv?Math.abs(player.veh.v):Math.abs(player.v);hudSet('kmh',Math.round(spd*2.4),v=>{$('#kmh').textContent=v;});hudSet('lbl',drv?'KM/H':'ON FOOT',v=>{$('#spdLbl').textContent=v;});
  const vb=$('#vbars');if(drv){const v=player.veh;hudSet('vb',[1,v.spec.fuel?Math.round(v.fuel):100,!!v.spec.fuel,Math.round(v.hp)].join(),()=>{vb.hidden=false;$('#fuelBar i').style.width=(v.spec.fuel?v.fuel:100)+'%';$('#fuelBar').classList.toggle('low',v.spec.fuel&&v.fuel<15);$('#fuelBar').style.opacity=v.spec.fuel?1:.35;$('#bodyBar i').style.width=v.hp+'%';$('#bodyBar').classList.toggle('low',v.hp<30);});}else hudSet('vb','0',()=>{vb.hidden=true;});
  hudSet('cross',camMode===2&&player.mode==='foot'?'block':'none',v=>{$('#cross').style.display=v;});const hb=$('.pad.a [data-act=horn]');if(hb){const t=player.mode==='foot'?'JUMP':'HORN';if(hb.textContent!==t)hb.textContent=t;}}
/* pre-rendered world map, 1 px = 8 m */
const MAPS=W.W>20000?10:8;const mapCanvas=document.createElement('canvas');mapCanvas.width=Math.ceil(W.W/MAPS);mapCanvas.height=Math.ceil((W.H-Z0)/MAPS);
{const mx=mapCanvas.getContext('2d');const lo=document.createElement('canvas');lo.width=Math.ceil(W.W/24);lo.height=Math.ceil((W.H-Z0)/24);const lx=lo.getContext('2d');const img=lx.createImageData(lo.width,lo.height);
  for(let j=0;j<lo.height;j++)for(let i=0;i<lo.width;i++){const x=i*24+12,z=Z0+j*24+12;let c;if(isWater(x,z)&&!roadAt(x,z))c=cA.set('#2a6f97');else c=biomeColor(x,z,cA);const o=(j*lo.width+i)*4;img.data[o]=c.r*255;img.data[o+1]=c.g*255;img.data[o+2]=c.b*255;img.data[o+3]=255;}
  lx.putImageData(img,0,0);mx.imageSmoothingEnabled=true;mx.drawImage(lo,0,0,mapCanvas.width,mapCanvas.height);mx.translate(0,-Z0/MAPS);
  for(const z of W.zones){mx.fillStyle='rgba(70,64,84,.55)';mx.fillRect(z.x0/MAPS,z.z0/MAPS,z.nx*80/MAPS,z.nz*80/MAPS);}
  mx.lineCap='round';for(const r of ROADS){mx.strokeStyle=r.kind==='city'?'#a8a2b8':r.kind==='exp'?'#ffd36a':'#e8e0cc';mx.lineWidth=r.kind==='city'?1.4:2.4;mx.beginPath();r.pts.forEach(([x,z],i)=>i?mx.lineTo(x/MAPS,z/MAPS):mx.moveTo(x/MAPS,z/MAPS));mx.stroke();}
  for(const a of W.airports){mx.fillStyle='#2e2f33';mx.fillRect((a.x-a.L/2)/MAPS,(a.z-15)/MAPS,a.L/MAPS,30/MAPS);}}
const mini=$('#mini'),mc=mini.getContext('2d');
// Beta v1.01.21: features add their own markers (friends sharing their location, live events): api.addMapMarks(() => [{x,z,col,txt,name}])
const mapMarks=[];function addMapMarks(f){mapMarks.push(f);}
// minimap zoom (+ and − under the map) and, while navigating, a look-ahead view: you sit low on the map so more of the road ahead shows
let miniZoom=clamp(+store.get('ib.miniZoom')||1,.4,3),navOn=false;
function setMiniZoom(f){miniZoom=clamp(miniZoom*f,.4,3);store.set('ib.miniZoom',miniZoom);toast(`Map zoom ×${miniZoom.toFixed(1)}`,'#5fb4ff');}
function drawMini(now){const Wd=224,p0=ppos(),h=player.mode==='drive'&&player.veh?player.veh.h:player.h;const spd=player.mode==='drive'&&player.veh?Math.abs(player.veh.v):0;const radius=(nav.route?(spd>18?520:spd>9?340:220):(spd>18?700:spd>9?450:300))/miniZoom;const ppm=(Wd/2)/radius;
  if(!!nav.route!==navOn){navOn=!!nav.route;document.body.classList.toggle('navon',navOn);}const ahead=navOn?.38:0;const pp={x:p0.x+Math.sin(h)*radius*ahead,z:p0.z+Math.cos(h)*radius*ahead};
  mc.save();mc.fillStyle='#2a6f97';mc.fillRect(0,0,Wd,Wd);mc.translate(Wd/2,Wd/2);mc.rotate(Math.PI+h);mc.scale(ppm*MAPS,ppm*MAPS);mc.drawImage(mapCanvas,-pp.x/MAPS,(Z0-pp.z)/MAPS);mc.restore();
  mc.save();mc.translate(Wd/2,Wd/2);mc.rotate(Math.PI+h);for(const e of EDGES){const c=CONG[e.id];if(c<.42)continue;if(Math.max(e.ax,e.bx)<pp.x-radius||Math.min(e.ax,e.bx)>pp.x+radius||Math.max(e.az,e.bz)<pp.z-radius||Math.min(e.az,e.bz)>pp.z+radius)continue;mc.strokeStyle=c>.7?'#e8473a':'#ff9f1c';mc.lineWidth=Math.max(2.5,e.w*ppm*.6);mc.lineCap='round';mc.beginPath();mc.moveTo((e.ax-pp.x)*ppm,(e.az-pp.z)*ppm);mc.lineTo((e.bx-pp.x)*ppm,(e.bz-pp.z)*ppm);mc.stroke();}if(nav.route){mc.lineJoin=mc.lineCap='round';const R=nav.route,C=nav.cong||[];mc.strokeStyle='#ffffff';mc.lineWidth=11;mc.beginPath();R.forEach(([x,z],i)=>{const X=(x-pp.x)*ppm,Z=(z-pp.z)*ppm;i?mc.lineTo(X,Z):mc.moveTo(X,Z);});mc.stroke();mc.lineWidth=6.5;for(let i=0;i<R.length-1;i++){mc.strokeStyle=(C[i]||0)>.6?'#e8473a':'#2f7bff';mc.beginPath();mc.moveTo((R[i][0]-pp.x)*ppm,(R[i][1]-pp.z)*ppm);mc.lineTo((R[i+1][0]-pp.x)*ppm,(R[i+1][1]-pp.z)*ppm);mc.stroke();}}mc.font='13px "Baloo 2", sans-serif';mc.textAlign='center';mc.textBaseline='middle';
  const icon=(x,z,col,txt,rr=7,clampIt)=>{let dx=(x-pp.x)*ppm,dz=(z-pp.z)*ppm;const d=Math.hypot(dx,dz),lim=Wd/2-10;if(d>lim){if(!clampIt)return;dx*=lim/d;dz*=lim/d;}mc.save();mc.translate(dx,dz);mc.rotate(-Math.PI-h);mc.fillStyle=col;mc.beginPath();mc.arc(0,0,rr,0,6.29);mc.fill();if(txt){mc.fillStyle='#1a1430';mc.fillText(txt,0,1);}mc.restore();};
  for(const p of pois){if(Math.abs(p.x-pp.x)>radius*1.2||Math.abs(p.z-pp.z)>radius*1.2)continue;if(p.type==='home'&&!P.homes.includes(p.extra))continue;if(radius>400&&!['pump','cng','airport','station','home','hospital'].includes(p.type))continue;icon(p.x,p.z,p.color,p.icon,8);}
  for(const v of vehicles){if(v.state!=='police')continue;icon(v.pos.x,v.pos.z,Math.floor(now*6)%2?'#ff3b3b':'#3b6bff',null,5,true);}
  for(const f of mapMarks){let L=null;try{L=f();}catch(e){}if(L)for(const m of L)icon(m.x,m.z,m.col||'#ff8fd0',m.txt||null,m.r||8,m.edge!==false);}
  if(curMission&&curMission.target){const tg=curMission.target;icon(tg.x,tg.z,'#'+(tg.col||0x3ddc97).toString(16).padStart(6,'0'),null,8,true);}
  mc.restore();mc.save();mc.translate(Wd/2,Wd/2+ahead*Wd/2);mc.fillStyle=CFG.accent||'#ffc93c';mc.strokeStyle='#1a1430';mc.lineWidth=2;mc.beginPath();mc.moveTo(0,-11);mc.lineTo(8,9);mc.lineTo(0,4);mc.lineTo(-8,9);mc.closePath();mc.fill();mc.stroke();mc.restore();}
// Beta v1.01.20: floating name labels keep a sensible size on screen. Close to the camera they shrink and then fade,
// so a nearby player's name or a place label never fills the phone screen.
const SIZED=new Set(),_lv=new THREE.Vector3();
function sizeLabel(sp,ref){if(!sp)return sp;sp.userData.base=sp.scale.clone();sp.userData.ref=ref||12;sp.material.transparent=true;SIZED.add(sp);return sp;}
function updSized(){const c=camera.position;for(const sp of SIZED){if(!sp.parent||!sp.material){SIZED.delete(sp);continue;}sp.getWorldPosition(_lv);const d=_lv.distanceTo(c),r=sp.userData.ref;
  sp.scale.copy(sp.userData.base).multiplyScalar(Math.min(1,Math.max(.22,d/r)));sp.material.opacity=Math.min(1,Math.max(0,(d-r*.12)/(r*.2)));}}
function updLabels(){const pp=ppos();for(const p of pois){const d=Math.abs(p.x-pp.x)+Math.abs(p.z-pp.z);if(d<160&&!p.sp&&!inside){const lt=labelTex(p.name,p.color);p.sp=new THREE.Sprite(new THREE.SpriteMaterial({map:lt}));p.sp.scale.set(2*lt.userData.w/56,2,1);p.sp.position.set(p.x,5,p.z);scene.add(p.sp);sizeLabel(p.sp,40);}
  else if(p.sp&&(d>230)){scene.remove(p.sp);p.sp.material.map.dispose();p.sp.material.dispose();p.sp=null;}}}
function updDiscover(){const pp=ppos();for(const [name,x,z] of W.places){if(P.discovered[name])continue;if(Math.hypot(x-pp.x,z-pp.z)<55){P.discovered[name]=istISO();earn(price(100),'discover');dirty=true;toast(`Discovered: ${esc(name)} · +${inr(price(100))}`,'#ffc93c');emit('discover',name);}}}

/* ================= intro ================= */
// admin announcements that are inside their dates (Admin → Announcements)
function activeNews(){const d=istISO();return (CFG.news||[]).filter(n=>n&&(n.title||n.text)&&(!n.start||n.start<=d)&&(!n.end||n.end>=d));}
function renderIntro(){$('#gName').textContent=CFG.name;$('#gTag').textContent=CFG.tagline;const a=$('#ann');const fest=activeFestivals('MH').concat(activeFestivals('GJ'),activeFestivals('RJ')).filter((f,i,arr)=>arr.indexOf(f)===i);const ev=activeEvents();
  const lines=[];if(CFG.announce)lines.push(esc(CFG.announce));if(CFG.chatOn===false||CFG.callsOn===false)lines.push(esc(CFG.chatNote||((CFG.chatOn===false?'Chat':'Calls')+' paused by the admin')));for(const n of activeNews())lines.push(esc(n.title?n.title+(n.text?': '+n.text:''):n.text));if(fest.length)lines.push('Festival now: '+fest.map(f=>esc(f.name)).join(', '));if(ev.length)lines.push('Happening now: '+ev.map(e=>esc(e.name)).join(', '));a.hidden=!lines.length;a.innerHTML=lines.join('<br>');
  $('#today').textContent=`${istText()} · Bay time ${bayTime()}`;
  drawStartMap();
  pickRow();$('#newGame').hidden=!hadSave;setAvatar();}
/* start screen: India map, tap a state to start there */
var startPick=null;
// Beta v2.00.00: the map's state codes that differ from the outline file (Chhattisgarh, Odisha, Uttarakhand; Ladakh is drawn inside J&K)
// Beta v2.01.00: Dadra & Nagar Haveli is drawn on its own in the outline file but is one union territory with Daman & Diu
const SVGID={CG:'ct',OD:'or',UK:'ut',LA:'jk'},STOF={CT:'CG',OR:'OD',UT:'UK',DN:'DD'};
const stateRegion=st=>{const IS=window.INDIA_STATES;const id=(SVGID[st]||st).toLowerCase();const q=IS&&IS.states.find(x=>x.id===id);return q?q.region:null;};
function statePlayable(st){const r=REGIONS.find(q=>q.id===stateRegion(st));return !!(r&&r.map&&CFG.regions[r.id]&&!(CFG.states&&CFG.states[st]===false)&&W.startZones&&W.startZones[st]&&W.zones.some(z=>z.st===st));}
// Beta v2.01.00: the whole map is open, so the start screen picks a state from a list, then a city of that state
// (the small India map only shows where the chosen state is)
const SIZE_ORD={big:0,mid:1,small:2};
function startStates(){return Object.keys(W.states).filter(st=>st!=='FR'&&statePlayable(st)).sort((a,b)=>W.states[a].localeCompare(W.states[b]));}
// Beta v2.05.00: the start map is a real map. Scroll, pinch or use + and − to zoom, drag to move. Tap a state to zoom in on it,
// then tap one of its cities (the dots) to start there. The lists below the map stay for small screens.
let smVB=null;const SMFULL=(()=>{const IS=window.INDIA_STATES;if(!IS)return null;const [x,y,w,h]=IS.viewBox.split(' ').map(Number);return{x,y,w,h};})();
const pickZones=st=>W.zones.filter(z=>z.st===st||(st==='JK'&&z.st==='LA'));
function drawStartMap(){const el=$('#cities');const IS=window.INDIA_STATES;if(!IS){el.innerHTML='<div class="spick" id="spick"></div>';pickRow();return;}
  if(!smVB)smVB=Object.assign({},SMFULL);const stOf=q=>STOF[q.id.toUpperCase()]||q.id.toUpperCase();
  el.innerHTML=`<div class="smap zm"><svg id="smSvg" viewBox="${smVB.x} ${smVB.y} ${smVB.w} ${smVB.h}" role="img" aria-label="Map of India"><g id="smStates">${IS.states.map(q=>{const st=stOf(q);const ok=statePlayable(st)||(st==='JK'&&statePlayable('LA'));const on=startPick&&(st===startPick.st);return `<path data-st="${ok?st:''}" d="${q.d}" class="${ok?'ok':'no'}${on?' on':''}"><title>${esc(q.name)}</title></path>`;}).join('')}</g><g id="smDots"></g></svg>
    <div class="smz"><button type="button" data-zm="in" aria-label="Zoom in">＋</button><button type="button" data-zm="out" aria-label="Zoom out">－</button><button type="button" data-zm="all" aria-label="Whole India">⤢</button></div><div class="smhint">${startPick?'Tap a city dot to start there':'Tap a state on the map · scroll or pinch to zoom'}</div></div><div class="spick" id="spick"></div>`;
  const svg=$('#smSvg');wireMap(svg);if(startPick){placeDots(svg);if(startPick.zoomTo){startPick.zoomTo=false;zoomState(svg,startPick.st);}}
  pickRow();}
function setVB(svg,v){const F=SMFULL;v.w=clamp(v.w,F.w/14,F.w*1.15);v.h=v.w*F.h/F.w;v.x=clamp(v.x,F.x-v.w*.5,F.x+F.w-v.w*.5);v.y=clamp(v.y,F.y-v.h*.5,F.y+F.h-v.h*.5);smVB=v;svg.setAttribute('viewBox',`${v.x} ${v.y} ${v.w} ${v.h}`);dotSizes(svg);}
function zoomAt(svg,k,px,py){const v=Object.assign({},smVB);const nw=clamp(v.w*k,SMFULL.w/14,SMFULL.w*1.15),f=nw/v.w;v.x=px-(px-v.x)*f;v.y=py-(py-v.y)*f;v.w=nw;setVB(svg,v);}
function svgPt(svg,cx,cy){const r=svg.getBoundingClientRect();const s=Math.max(smVB.w/r.width,smVB.h/r.height);const ox=(r.width*s-smVB.w)/2,oy=(r.height*s-smVB.h)/2;return{x:smVB.x+(cx-r.left)*s-ox,y:smVB.y+(cy-r.top)*s-oy,s};}
function zoomState(svg,st){const ps=[...svg.querySelectorAll(`path[data-st="${st}"]`)];if(!ps.length)return;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of ps){const b=p.getBBox();x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.width);y1=Math.max(y1,b.y+b.height);}
  const w=Math.max((x1-x0)*1.35,(y1-y0)*1.35*SMFULL.w/SMFULL.h,SMFULL.w/14);const h=w*SMFULL.h/SMFULL.w;const from=Object.assign({},smVB),to={x:(x0+x1)/2-w/2,y:(y0+y1)/2-h/2,w,h};const t0=performance.now();
  const step=()=>{const k=Math.min(1,(performance.now()-t0)/450),e=1-Math.pow(1-k,3);setVB(svg,{x:from.x+(to.x-from.x)*e,y:from.y+(to.y-from.y)*e,w:from.w+(to.w-from.w)*e,h:0});if(k<1&&svg.isConnected)requestAnimationFrame(step);};step();}
function placeDots(svg){const g=svg.querySelector('#smDots');const st=startPick.st;const ps=[...svg.querySelectorAll(`path[data-st="${st}"]`)];const zs=pickZones(st);if(!ps.length||!zs.length)return;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of ps){const b=p.getBBox();x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.width);y1=Math.max(y1,b.y+b.height);}
  const C=z=>[z.x0+z.nx*40,z.z0+z.nz*40];let gx0=1e9,gz0=1e9,gx1=-1e9,gz1=-1e9;for(const z of zs){const [a,b]=C(z);gx0=Math.min(gx0,a);gx1=Math.max(gx1,a);gz0=Math.min(gz0,b);gz1=Math.max(gz1,b);}
  const inside=(x,y)=>{try{const pt=new DOMPoint(x,y);return ps.some(p=>p.isPointInFill(pt));}catch(e){return true;}};const mx=(x0+x1)/2,my=(y0+y1)/2;
  const ns='http://www.w3.org/2000/svg';g.innerHTML='';
  for(const z of zs.slice().sort((a,b)=>SIZE_ORD[b.size]-SIZE_ORD[a.size])){const [a,b]=C(z);let x=x0+(x1-x0)*(.12+.76*(gx1>gx0?(a-gx0)/(gx1-gx0):.5)),y=y0+(y1-y0)*(.12+.76*(gz1>gz0?(b-gz0)/(gz1-gz0):.5));for(let k=0;k<14&&!inside(x,y);k++){x+=(mx-x)*.2;y+=(my-y)*.2;}
    const c=document.createElementNS(ns,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.dataset.z=z.id;c.dataset.sz=z.size;c.setAttribute('class','sdot'+(startPick.zone===z?' on':'')+' '+z.size);const t=document.createElementNS(ns,'title');t.textContent=z.name;c.appendChild(t);g.appendChild(c);
    const tx=document.createElementNS(ns,'text');tx.setAttribute('x',x);tx.setAttribute('y',y);tx.dataset.z=z.id;tx.dataset.sz=z.size;tx.textContent=z.name;tx.setAttribute('class','slab'+(startPick.zone===z?' on':'')+' '+z.size);g.appendChild(tx);}
  dotSizes(svg);}
function dotSizes(svg){const k=smVB.w/SMFULL.w;const show=k<.35;for(const c of svg.querySelectorAll('.sdot')){const big=c.dataset.sz==='big'?1.6:c.dataset.sz==='mid'?1.25:1;c.setAttribute('r',4.2*k*big*(c.classList.contains('on')?1.5:1));}
  for(const t of svg.querySelectorAll('.slab')){const on=t.classList.contains('on');const vis=on||t.dataset.sz==='big'||(show&&t.dataset.sz==='mid')||k<.16;t.style.display=vis?'':'none';t.setAttribute('font-size',11*k);t.setAttribute('dx',6*k);t.setAttribute('dy',3.5*k);}}
function wireMap(svg){const pts=new Map();let moved=0,pinch0=null,start=null;
  svg.addEventListener('wheel',e=>{e.preventDefault();const p=svgPt(svg,e.clientX,e.clientY);zoomAt(svg,e.deltaY>0?1.18:1/1.18,p.x,p.y);},{passive:false});
  svg.addEventListener('pointerdown',e=>{svg.setPointerCapture&&svg.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;start={x:e.clientX,y:e.clientY,vb:Object.assign({},smVB),t:e.target};if(pts.size===2){const [a,b]=[...pts.values()];pinch0={d:Math.hypot(a.x-b.x,a.y-b.y),vb:Object.assign({},smVB),c:svgPt(svg,(a.x+b.x)/2,(a.y+b.y)/2)};}});
  svg.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===2&&pinch0){const [a,b]=[...pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const k=pinch0.d/Math.max(10,d);smVB=Object.assign({},pinch0.vb);zoomAt(svg,k,pinch0.c.x,pinch0.c.y);moved=99;return;}
    if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;moved=Math.max(moved,Math.hypot(dx,dy));if(moved<6)return;const r=svg.getBoundingClientRect();const s=Math.max(start.vb.w/r.width,start.vb.h/r.height);setVB(svg,{x:start.vb.x-dx*s,y:start.vb.y-dy*s,w:start.vb.w,h:start.vb.h});});
  const up=e=>{const was=pts.has(e.pointerId);pts.delete(e.pointerId);if(pts.size<2)pinch0=null;if(!was||pts.size)return;const t=start&&start.t;start=null;if(moved>=6||!t)return;
    const z=t.dataset&&t.dataset.z;if(z&&startPick){startPick.zone=W.zones.find(q=>q.id===z);drawStartMap();return;}
    const st=t.dataset&&t.dataset.st;if(st){startPick={st,zone:W.zones.find(x=>x.id===W.startZones[st])||pickZones(st)[0],zoomTo:true};drawStartMap();}};
  svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',e=>{pts.delete(e.pointerId);pinch0=null;start=null;});
  svg.parentNode.querySelector('.smz').onclick=e=>{const k=e.target.dataset.zm;if(!k)return;if(k==='all'){setVB(svg,Object.assign({},SMFULL));return;}zoomAt(svg,k==='in'?1/1.5:1.5,smVB.x+smVB.w/2,smVB.y+smVB.h/2);};}
function pickRow(){const el=$('#spick');if(!el)return;const go0=$('#go'),go=go0.querySelector('.gt')||go0;
  if(!startPick){const lz=lastZone();
    el.innerHTML=(hadSave?`<p>Continue where you left off${lz?' in <b>'+esc(lz.name)+'</b>':''}, or pick a state to travel somewhere new.</p>`:`<p><b>Choose your state</b>, then a city.</p>`)+
      `<div class="chips slist">${startStates().map(st=>`<button class="chip" data-st="${st}">${esc(W.states[st])}</button>`).join('')}</div>`;
    go.textContent=hadSave?(lz?'Continue in '+lz.name:'Continue'):'Start';
    el.onclick=e=>{const st=e.target.dataset.st;if(!st)return;startPick={st,zone:W.zones.find(x=>x.id===W.startZones[st])||pickZones(st)[0],zoomTo:true};drawStartMap();};return;}
  const st=startPick.st,zs=pickZones(st).sort((a,b)=>(SIZE_ORD[a.size]-SIZE_ORD[b.size])||a.name.localeCompare(b.name));
  el.innerHTML=`<div class="srow"><button class="chip" data-back="1">‹ All states</button><b>${esc(W.states[st])}</b><span class="note">${zs.length} ${zs.length===1?'city':'cities and towns'}</span></div><div class="chips clist">${zs.map(z=>`<button class="chip${z===startPick.zone?' on':''}" data-z="${z.id}">${esc(z.name)}</button>`).join('')}</div><button class="go spgo" type="button" data-spgo="1">▶ ${hadSave?'Go to':'Start at'} ${esc(startPick.zone.name)}</button>`;
  el.onclick=e=>{if(e.target.closest('[data-back]')){startPick=null;smVB=Object.assign({},SMFULL);drawStartMap();return;}if(e.target.closest('[data-spgo]')){if(!go0.disabled)go0.click();else toast('Still loading · one moment','#d6c8e4');return;}const id=e.target.dataset.z;if(!id)return;startPick.zone=W.zones.find(z=>z.id===id);drawStartMap();};
  go.textContent=(hadSave?'Go to ':'Start at ')+startPick.zone.name;}
function lastZone(){if(!hadSave||!P.pos)return null;return zoneAt(P.pos.x,P.pos.z,300)||W.zones.slice().sort((a,b)=>Math.hypot(a.x0+a.nx*40-P.pos.x,a.z0+a.nz*40-P.pos.z)-Math.hypot(b.x0+b.nx*40-P.pos.x,b.z0+b.nz*40-P.pos.z))[0];}
function storyStart(z){const cx=z.x0+z.nx*40,cz=z.z0+z.nz*40;const inZ=p=>p.x>z.x0-30&&p.x<z.x0+z.nx*80+30&&p.z>z.z0-30&&p.z<z.z0+z.nz*80+30;let best=null,bd=1e12;for(const t of ['station','bus'])if(!best)for(const p of pois)if(p.type===t&&inZ(p)){const d=Math.hypot(p.x-cx,p.z-cz);if(d<bd){bd=d;best=p;}}
  if(!best)for(const p of pois)if(p.type==='station'){const d=Math.hypot(p.x-cx,p.z-cz);if(d<bd&&d<1500){bd=d;best=p;}}if(best)return{x:best.x+Math.sin(best.rot||0)*2,z:best.z+Math.cos(best.rot||0)*2,h:(best.rot||0)+Math.PI};const r=startSpot(z);return r;}
function startSpot(z){const cx=z.x0+z.nx*40,cz=z.z0+z.nz*40;const r=nearestRoadPoint(cx,cz,400);if(!r)return{x:cx,z:cz,h:0};return{x:r.x,z:r.z,h:Math.atan2(r.e.dx,r.e.dz)};}
$('#newGame').onclick=e=>{const b=$('#newGame');if(b.dataset.sure){P=newSave();store.set(SAVEKEY,P);location.reload();return;}
  openSheet('🆕 Start a new game?','Your player starts again from the beginning',`<p class="note">Your money, homes, vehicles, story and achievements are reset${P.name?' for <b>'+esc(P.name)+'</b>':''}. This cannot be undone.</p><div class="stack"><button class="buy danger" data-id="yes">Yes, start a new game</button><button class="go" data-id="no">No, keep playing</button></div>`,
    s=>s.onclick=ev=>{const id=ev.target.dataset.id;if(id==='no')return closeSheet();if(id==='yes'){closeSheet();b.dataset.sure='1';setTimeout(()=>b.click(),120);}});};
let camSnap=true;
function begin(){setAvatar();document.body.classList.remove('pre');$('#intro').hidden=true;initAudio();if(ac&&ac.state==='suspended')ac.resume();started=true;camSnap=true;$('#c').focus();applyLook();applyOutfit();
  if(!startedOnce){startedOnce=true;if(!CFG.challansOn||!Array.isArray(P.challans))P.challans=[];
    P.cars.forEach((c,i)=>{if(c.x!=null)spawnOwned(i,c.x,c.z,c.h||0);});
    if(P.pos){if(P.inCar!=null&&P.cars[P.inCar]){const v=ownedVeh[P.inCar]||spawnOwned(P.inCar,P.pos.x,P.pos.z,P.pos.h);v.pos.set(P.pos.x,0,P.pos.z);v.h=P.pos.h;enterVehicle(v);}else{player.mode='foot';player.pos.set(P.pos.x,0,P.pos.z);player.h=P.pos.h;avatar.visible=true;}}
    else if(STORY||!P.cars.length){const z=startPick?startPick.zone:W.zones.find(q=>q.id==='mumbai');const sp=storyStart(z);player.mode='foot';player.pos.set(sp.x,0,sp.z);player.h=sp.h;avatar.visible=true;startPick=null;} // Beta v2.05.00: Badshah begins on foot at the city's railway station
    else{const sp=startPick?startSpot(startPick.zone):{x:2940,z:8736,h:Math.PI/2};const v=ownedVeh[0]||spawnOwned(0,sp.x,sp.z,sp.h);v.pos.set(sp.x,0,sp.z);v.h=sp.h;enterVehicle(v);startPick=null;}
    P.cars.forEach((c,i)=>{if(!ownedVeh[i]&&!c.garage){const [x,z,h]=[2900+i*7,8747,Math.PI/2];spawnOwned(i,x,z,h);}});
    if(startPick){const sp=startSpot(startPick.zone);const v=player.mode==='drive'?player.veh:null;teleport(sp.x,sp.z,sp.h);if(v){v.pos.set(sp.x,0,sp.z);v.h=sp.h;v.v=0;enterVehicle(v);}startPick=null;}
    setPedCount(Math.round(CFG.peds*botScale*GFX.k));hooks.start.forEach(f=>{try{f();}catch(e){console.error(e);}});
    const latest=(clList()[0]||{}).v;if(!P.extra.howto)setTimeout(()=>howTo(0),700);else if(latest&&P.seenVersion!==latest)setTimeout(()=>{if(!sheetOpen())whatsNew(true);},900);}
  toast(`${CFG.name} · ${areaName()}`,'#ffc93c');}
{const v=$('#ver');if(v)v.textContent=VERSION;}
$('#go').onclick=()=>{if(!P.name)return profileSheet(true,begin);begin();};
// Beta v2.05.00: the two game modes sit at the top of the start menu. Each has its own save; switching reloads the page.
{const box=$('#iModes');if(box){for(const b of box.querySelectorAll('[data-mode]'))b.classList.toggle('on',(b.dataset.mode==='story')===STORY);
  box.onclick=e=>{const b=e.target.closest('[data-mode]');if(!b)return;const want=b.dataset.mode;if((want==='story')===STORY)return;
    openSheet(want==='story'?'👑 Badshah':'🌐 Multiplayer',want==='story'?'A mission-based game mode':'The shared open world',
      (want==='story'?'<p class="note">Play missions on your own, start to finish. Badshah has its own save and starting money, so your multiplayer progress is safe. Sign in to keep it in the cloud and carry on from another device. It plays offline too.</p>':'<p class="note">The open world with other players online: jobs, chat, events and everything else. Your Badshah progress is kept.</p>')+rowHtml('go',want==='story'?'Play Badshah':'Play Multiplayer','The game reloads','Switch')+rowHtml('no','Stay here','','Cancel','ghost'),
      s=>s.onclick=ev=>{const id=ev.target.dataset.id;if(id==='go')api.setMode(want);else if(id==='no')closeSheet();});};}
  if(STORY){const t=$('#gTag');if(t)t.textContent='👑 Badshah · mission mode';document.body.classList.add('storymode');}}

/* ================= feature API ================= */
// Fewer bot cars and people when real players are around (set by online play).
let botScale=1;function setBotScale(k){k=clamp(k,.2,1);if(Math.abs(k-botScale)<.04)return;botScale=k;if(started)setPedCount(Math.round(CFG.peds*botScale*GFX.k));}
const api={GFX,MAPZ0:Z0,isForeign,onFire:f=>fireHooks.push(f),setBotScale,get botScale(){return botScale;},openPoi:p=>openPoi(p),foodSheet:p=>foodSheet(p),colliders,cost,rawCost,enterVenue,leaveVenue:()=>leaveHome(),interScene:inter.scene,get insideVenue(){return inside&&inside.venue;},storeOwned,roadSpotNear,THREE,scene,camera,renderer,player,vehicles,peds,pois,SPEC,WORLD:W,REGIONS,FURN,HTYPE,inter,avatar,outfitParts,mapCanvas,MAPS,
  get CFG(){return CFG;},get P(){return P;},get clock(){return clockH;},get gameDay(){return gameDay;},get inside(){return inside;},get muted(){return muted;},setMuted,get vehSound(){return vehOn;},set vehSound(v){vehOn=!!v;},get testMode(){return TESTMODE;},setTestMode(on){save();store.set('ib.testmode',!!on);sessionStorage.setItem('ib.cloudLoaded','1');location.reload();},get god(){return godMode;},set god(v){godMode=!!v;},get audio(){return ac;},get started(){return started;},get weather(){return wx.cur;},get camMode(){return camMode;},
  toast,big,openSheet,closeSheet,rowHtml,spend,earn,notify,collideTest(v){const q=v.clone();return collide(q,.5,true);},colsAt(x,z,r,foot){const out=[];for(const c of colliders){if(Math.abs(c.x-x)<c.hw+r&&Math.abs(c.z-z)<c.hd+r&&(foot?c.foot:c.veh))out.push(c);}return out;},drivableAt:(x,z)=>drivable(x,z),seatAvatar,obstTop,puff,dropCar,carValue,garageSheet,vehText,storeOwned,blockAt,twoSided,logoTex,LOGO_IMG,exitDoor,wetNear,pedBlock,pedPush,BLDS,setPlate,plateTex,get ownedVehicles(){return ownedVeh;},inPool,POOLS,addPlatform,removePlatform,groundAt,jump,inr,price,esc,addWanted,damage,save,makeVeh,removeVeh,spawnOwned,ownedVeh,buyVehicle,ppos,edgePos,box,boxRot,addStatic,flushStatic,LMat,buildPerson,addSign,
  addPoi(o){const p=makePoi(o);return p;},addApp,addMission,addPrompt,addFirstPrompt(f){firstPrompts.push(f);},poiHandlers,speedMods,on,emit,openWait,closeWait,startActivity,startQueue,startSleep,teleport,nearestRoadPoint,roadAt,drivable,isWater,isLand,zoneAt,stateAt,
  fareMultAt,activeFestivals,activeEvents,addChallan,istISO,istText,bayTime,gameMin,enterVehicle,exitVehicle,applyOutfit,homeById,buildInterior,nearestPoi,phoneSheet,profileSheet,hornSfx,areaName,
  onUpdate(f){hooks.update.push(f);},onStart(f){hooks.start.push(f);if(startedOnce)f();},onAfterRender(f){hooks.afterRender.push(f);},onKey(code,f){hooks.key[code]=f;},setMap(f){hooks.map=f;},setBayGame(f){hooks.bayGame=f;},setEscape(f){hooks.escape=f;},set photo(v){hooks.photo=v;},set walkIn(f){hooks.walkIn=f;},set livery(f){hooks.livery=f;},set netFollow(v){hooks.netFollow=v;},get netFollow(){return hooks.netFollow;},makeBusWith(L,x,z,h,state){vehLivery=L;try{return makeVeh('bus',x,z,h,state||'parked');}finally{vehLivery=null;}},set viewAt(f){hooks.viewAt=f;},get tourSpots(){return TOUR;},get photo(){return hooks.photo;},
  addMapMarks,get mapMarks(){return mapMarks;},PICON,PLABEL,findRoute,get route(){return nav.route;},get routeCong(){return nav.cong;},menuSheet,settingsSheet,get curMission(){return curMission;},
  CONG,sigState,sigJunction,
  blocks,get db(){return db;},get adminOK(){return adminOK;},buildVeh,nameOk,ageFromDob:IBCONF.ageFromDob,get adSlots(){return SLOTS;},updBillboards,billboardMeshes,adSheet,pickBillboard,personErr,personFields,unameField,unameIn,sexField,sexWire,sexGet,setSex,refreshBillboards,sizeLabel,openApp,set introClick(f){hooks.introClick=f;},set starterSheet(f){hooks.starterSheet=f;},enterHome,homeById,set introLabel(f){hooks.introLabel=f;setAvatar();},cloudConfig,hubSheet,supportSheet,setAvatar,addProfileRows(f){profileRows.push(f);},set profileEdit(f){hooks.profileEdit=f;},set displayName(f){hooks.displayName=f;setAvatar();},set userEmail(f){hooks.userEmail=f;},setCfgBackend(b){cfgBackend=b;adminOK=!!(b&&b.admin);adminLocal=false;},get hadSave(){return hadSave;},
  setDirty(){dirty=true;},buildPlane,addAdSlot,setSteer(v){steerIn=v==null?null:clamp(v,-1,1);},addCol,applyLook,lookCode,decodeLook,lookSheet,LOOKS,buildAnimal,animGait,ASPEC,get strays(){return cows;},animals,MR,mpick,clamp,hash,canvasTex,EDGES,ROADS,laneRandom:randomLaneNear,lanePos,uiLock};
api.freeRoadSpot=freeRoadSpot;api.tracer=tracer;api.sfxShot=sfxShot;api.sfxPunch=sfxPunch;api.fleeFrom=fleeFrom;api.setMode=m=>{store.set('ib.mode',m==='story'?'story':'world');save();location.reload();};api.playDay=playDay;Object.defineProperty(api,'afk',{get:()=>afk});api.WEAP=WEAP;api.GUNSHOP=GUNSHOP;api.updWeap=updWeap;api.renderStars=renderStars;api.gunSheet=p=>gunSheet(p);api.addResumer=addResumer;api.resumeWait=resumeWait;api.getWait=()=>wait;api.applyTheme=applyTheme;api.phoneSheet=phoneSheet;api.folderSheet=folderSheet;api.HOME=HOME;api.activeNews=activeNews;api.clList=clList;api.clLines=clLines;api.THEMES=THEMES;api.garageSheet=garageSheet;api.now=bayNow;api.addHouseAd=f=>EXTRA_ADS.push(f);api.needCity=()=>!hadSave&&!startPick;api.startName=()=>startPick?startPick.zone.name:(lastZone()||{}).name||'';api.openCityPick=()=>{const p=$('#iMapPanel');if(p)p.classList.add('open');document.body.classList.add('imap');const s=$('#spick');if(s){s.classList.remove('flash');void s.offsetWidth;s.classList.add('flash');}};api.lastZone=lastZone;api.howTo=howTo;api.whatsNew=whatsNew;api.featuresSheet=featuresSheet;window.BB=api;
const queued=Array.isArray(window.BBFeatures)?window.BBFeatures:[];window.BBFeatures={push(f){try{f(api);}catch(e){console.error('Feature failed',e);try{const at=String(e&&e.stack||'').split('\n').find(l=>/features\/|\.js/.test(l))||'';(window.__ibErrors=window.__ibErrors||[]).push('feature failed: '+(e&&e.message||e)+' '+(at.match(/[\w-]+\.js[^)\s]*/)||[''])[0]);}catch(_){}}}};queued.forEach(f=>window.BBFeatures.push(f));
flushStatic();

/* ================= boot + loop ================= */
applyTheme();tickClock();renderIntro();document.title=CFG.name;updWeap();renderStars();updSky(1);updSun(new THREE.Vector3(2900,0,8700));
camera.position.set(3150,60,8950);
const camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),tmp=new THREE.Vector3();
let last=performance.now(),orbit=0,frame=0;
/* the start screen tour (Beta v1.01.05): the camera glides round famous places, one after another */
const TOUR_SPOTS=[['Gateway of India','Mumbai',170,58,10],['Hawa Mahal','Jaipur',120,40,14],['Statue of Unity','Kevadia',260,90,60],['Marine Drive','Mumbai',200,50,6],['Mysore Palace','Mysuru',140,46,16],['Jaisalmer Fort','Jaisalmer',160,55,18],['Chinese Fishing Nets','Fort Kochi',110,30,6],['Bandra–Worli Sea Link','Mumbai',230,70,10],['Mehrangarh Fort','Jodhpur',190,70,24]];
const TOUR=TOUR_SPOTS.map(([n,c,r,h,ly])=>{const p=(W.places||[]).find(q=>q[0]===n);return p?{name:`${n}, ${c}`,cx:p[1],cz:p[2],r,h,ly}:null;}).filter(Boolean);
let tourI=0,tourT=0,tourA=0;
{const lz=lastZone();if(lz&&P.pos){TOUR.unshift({name:'Where you left off · '+lz.name,cx:P.pos.x,cz:P.pos.z,r:110,h:42,ly:4});setTimeout(()=>{const n=$('#tourName');if(n)n.textContent=TOUR[0].name;},0);}}
function tourShot(rdt){if(!TOUR.length)return{cx:2990,cz:8800,r:170,h:60,ly:10,a:orbit+=rdt*.05};tourT+=rdt;tourA+=rdt*.07;
  if(tourT>13){tourT=0;tourI=(tourI+1)%TOUR.length;tourA=Math.random()*6;const n=$('#tourName');if(n){n.textContent=TOUR[tourI].name;const c=$('#tourCap');if(c){c.classList.remove('in');void c.offsetWidth;c.classList.add('in');}}}
  const q=TOUR[tourI];const k=Math.min(1,tourT/1.2,(13-tourT)/1.2);const v=$('#intro');if(v)v.style.setProperty('--fade',String(1-Math.max(0,k)));return Object.assign({a:tourA},q);}
/* Beta v1.01.29: things wholly beyond the fog are not drawn at all (they could not be seen anyway). The city chunks
   and the far landmarks and hills keep their own rules; everything else (stadiums, car parks, venues, props) is
   hidden just for the moment of drawing, so the game's own show/hide logic is never disturbed. */
const CULLR=new WeakMap(),cullOff=[],_cb=new THREE.Box3(),_cs=new THREE.Sphere();let cullSkip=null;
function cullRad(o){let r=CULLR.get(o);if(r==null){_cb.setFromObject(o);if(_cb.isEmpty())r=0;else{_cb.getBoundingSphere(_cs);r=_cs.radius+_cs.center.distanceTo(o.position);}CULLR.set(o,r);}return r;}
function drawScene(){const sc=inside?inter.scene:scene;
  if(sc===scene){if(!cullSkip||cullSkip.n!==chunks.size+farGroups.length){cullSkip=new Set();for(const c of chunks.values())cullSkip.add(c.group);for(const f of farGroups)cullSkip.add(f.group);cullSkip.n=chunks.size+farGroups.length;}
    const cp=camera.position,lim=scene.fog.far+40;for(const o of scene.children){if(!o.visible||o.isLight||cullSkip.has(o)||o.frustumCulled===false)continue;const d=Math.hypot(o.position.x-cp.x,o.position.z-cp.z);if(d<lim)continue;const r=cullRad(o);if(r>1500)continue;if(d-r>lim){o.visible=false;cullOff.push(o);}}
    // place markers (the rings on the ground) only near you: on phones within 150 m
    const rl=GFX.lvl==='saver'?150:GFX.lvl==='balanced'?240:420;for(const p of pois){const g=p.ring;if(!g||!g.visible||g.parent!==scene)continue;if(Math.abs(p.x-cp.x)+Math.abs(p.z-cp.z)>rl*1.2){g.visible=false;cullOff.push(g);}}}
  renderer.render(sc,camera);for(const o of cullOff)o.visible=true;cullOff.length=0;}
let gfxN=0,gfxSum=0,gfxT=0,gfxGood=0;
function gfxTune(ms,cap){const iv=ms-last;if(iv>0&&iv<500){gfxN++;gfxSum+=iv;}if(ms-gfxT<2500)return;const avg=gfxN?gfxSum/gfxN:0;gfxT=ms;gfxN=0;gfxSum=0;if(!avg||document.hidden)return;const want=1000/cap;
  if(avg>want*1.3&&GFX.scale>.7){GFX.scale=Math.max(.7,GFX.scale-.1);gfxGood=0;renderer.setPixelRatio(gfxDpr());resize();}
  else if(avg<want*1.08&&GFX.scale<1){if(++gfxGood>=4){gfxGood=0;GFX.scale=Math.min(1,GFX.scale+.05);renderer.setPixelRatio(gfxDpr());resize();}}else gfxGood=0;}
function loop(ms){requestAnimationFrame(loop);
  // Beta v1.01.29: draw only as often as the graphics level asks (phones: 30 a second, 12 behind menus)
  {const afk=started&&ms-GFX.lastIn>45000&&!(player.mode==='drive'&&player.veh&&Math.abs(player.veh.v)>1)&&!document.body.classList.contains('cine');const cap=started&&(sheetOpen()||waitOpen())?GFX.idle:afk?Math.min(GFX.fps||60,20):GFX.fps;if(cap&&ms-last<1000/cap-4)return;if(GFX.fps&&started&&cap===GFX.fps)gfxTune(ms,GFX.fps);}
  const now=ms/1000;const rdt=Math.min(1,Math.max(0,(ms-last)/1000));const dt=Math.min(.05,rdt);last=ms;frame++;RIGF++;tickClock();
  if(!started){const T=tourShot(rdt);updSky(dt);camera.position.set(T.cx+Math.cos(T.a)*T.r,T.h+Math.sin(T.a*.7)*6,T.cz+Math.sin(T.a)*T.r);camera.lookAt(T.cx,T.ly,T.cz);updSun(camera.position);if(frame%15===1)updChunks(T.cx,T.cz);if(frame%20===1){updLabels();updBillboards(T.cx,T.cz);}updSized();
    if(frame%40===0)$('#today').textContent=`${istText()} · Bay time ${bayTime()}`;drawScene();return;}
  updSky(dt);
  if(sheetOpen()||waitOpen()){tickWait(rdt);updNeeds(rdt);updHud();drawScene();for(const f of hooks.afterRender)f();return;}
  if(CFG.weather==='auto'&&wx.cur==='monsoon'&&Math.random()<.004)wx.flash=1;wx.flash=Math.max(0,wx.flash-dt*5);
  overT=Math.max(0,overT-dt);player.fireCd=Math.max(0,player.fireCd-dt);player.hitCd=Math.max(0,player.hitCd-dt);if(fireHeld&&(P.weapon==='pistol'||P.weapon==='smg'))fire();
  if(inside){updFoot(dt,inter);}
  else{updTraffic(dt);updPeds(dt,now);updAnimals(dt,now);updTrains(dt);updPlanes(dt);updPolice(dt,now);
    if(overT<=0&&(!hooks.photo||hooks.photo.live)){if(player.mode==='drive'&&player.veh)updDrive(dt,now);else updFoot(dt,null);}
    for(const v of vehicles)if(v.state==='parked'&&v.fallen)v.m.rotation.set(0,v.h,Math.PI/2.2,'YXZ');
    seaTex.offset.x+=dt*.004;seaTex.offset.y+=dt*.002;for(const f of flags)f.rotation.y=Math.sin(now*3+f.position.x)*.25;
    marker.rotation.y+=dt;beamMat.opacity=.22+Math.sin(now*3)*.07;for(const p of pois){if(p.sp)p.ring.material.opacity=.55+Math.sin(now*4)*.3;}
    if(frame%20===0)updDiscover();if(frame%20===5)updLabels();updSized();if(frame%15===2){const vp=hooks.viewAt?hooks.viewAt():ppos();updChunks(vp.x,vp.z);}if(frame%60===3){const vp=hooks.viewAt?hooks.viewAt():ppos();updBillboards(vp.x,vp.z);}if(frame%3===1)fadeBoards();
    if(sir)sir.g.gain.value=muted||!vehOn?0:(vehicles.some(v=>v.state==='police'&&!v.dead&&v.pos.distanceTo(ppos())<90)?.03:0);
    const an=areaName();if(frame%30===0&&an!==lastArea){const z=zoneAt(ppos().x,ppos().z,30);if(z)emit('zone',z);lastArea=an;$('#area').textContent=an;}}
  updNeeds(rdt);updSmoke(dt);
  for(const f of hooks.update){try{f(dt,now);}catch(e){console.error(e);}}
  for(let i=tracers.length-1;i>=0;i--){tracers[i].t-=dt;if(tracers[i].t<=0){scene.remove(tracers[i].l);tracers[i].l.geometry.dispose();tracers.splice(i,1);}}flash.intensity=Math.max(0,flash.intensity-dt*40);
  if(frame%6===0){curMission=evalMission();showMission(curMission);}
  if(frame%10===0)updNav(dt*10);
  if(frame%8===0&&!inside){updSignals();updHwSignals();}if(frame%4===0&&CFG.challansOn&&!inside)checkRedLight(now);congT+=rdt;if(congT>20){congT=0;updCongestion();}
  arrow.visible=false;
  if(frame%5===0)updPrompt();updHud();if(frame%GFX.mini===0&&!inside)drawMini(now);
  if(dirty&&ms-lastSave>15000){lastSave=ms;save();}
  /* camera */
  const P0=ppos();
  if(eng&&eng.drift&&(player.mode!=='drive'||hooks.photo&&!hooks.photo.live))eng.drift.g.gain.value=0;
  if(hooks.photo){hooks.photo(dt);}
  else if(inside){if(camMode===2){camera.position.set(player.pos.x,1.65,player.pos.z);camera.lookAt(player.pos.x+Math.sin(player.h)*5,1.5,player.pos.z+Math.cos(player.h)*5);}
    else if(inside.venue&&inside.venue._ib){// Beta v1.01.25: walk-in rooms keep the camera inside, under the ceiling, behind your shoulder
      const VH=inside.venue.H||5,bk=camMode===1?5.2:3.4,up=Math.min(VH-.4,camMode===1?3.3:2.3),ya=player.h+(camYaw||0);tmp.set(clamp(player.pos.x-Math.sin(ya)*bk,-inter.w/2+.45,inter.w/2-.45),up,clamp(player.pos.z-Math.cos(ya)*bk,-inter.d/2+.45,inter.d/2-.45));if(camSnap)camPos.copy(tmp);camPos.lerp(tmp,1-Math.exp(-dt*6));camera.position.copy(camPos);camera.lookAt(player.pos.x+Math.sin(ya)*2.5,1.3,player.pos.z+Math.cos(ya)*2.5);}
    else if(inside.venue&&(inter.w>16||inter.d>16)){const bk=camMode===1?12:6,up=camMode===1?9:3.4;tmp.set(clamp(player.pos.x-Math.sin(player.h)*bk,-inter.w/2+.5,inter.w/2-.5),up,clamp(player.pos.z-Math.cos(player.h)*bk,-inter.d/2+.5,inter.d/2-.5));if(camSnap)camPos.copy(tmp);camPos.lerp(tmp,1-Math.exp(-dt*5));camera.position.copy(camPos);camera.lookAt(player.pos.x+Math.sin(player.h)*3,1.4,player.pos.z+Math.cos(player.h)*3);}
    else{tmp.set(player.pos.x*.5,camMode===1?11:7.5,inter.d/2+(camMode===1?3:5.5));if(camSnap)camPos.copy(tmp);camPos.lerp(tmp,1-Math.exp(-dt*4));camera.position.copy(camPos);camera.lookAt(player.pos.x*.7,.6,player.pos.z*.7);}camSnap=false;}
  else{const drv=player.mode==='drive'&&player.veh;const hh=drv?player.veh.h:player.h;fwd.set(Math.sin(hh),0,Math.cos(hh));
    orbitIdle+=dt;const mv=drv?Math.abs(player.veh.v):Math.abs(player.v);if(!drag.on&&orbitIdle>2.5&&mv>1.5){const k=Math.min(1,dt*1.6);camYaw-=camYaw*k;camPitch-=camPitch*k;}
    const lx=Math.sin(hh+camYaw),lz=Math.cos(hh+camYaw);
    fpView(camMode===2&&drv?player.veh:null);
    if(camMode===2){if(drv){const f=player.veh.spec.fp;const c=Math.cos(hh),s=Math.sin(hh);camera.position.set(P0.x+f[0]*c+f[2]*s,f[1],P0.z-f[0]*s+f[2]*c);camera.lookAt(camera.position.x+lx*10,f[1]+.05-camPitch*6,camera.position.z+lz*10);}
      else{camera.position.set(P0.x+fwd.x*.15,1.95,P0.z+fwd.z*.15);camera.lookAt(P0.x+lx*10,1.8-camPitch*6,P0.z+lz*10);}camLook.copy(P0);}
    else{const por=camera.aspect<1?1.2:1;const back=(camMode===1?22:drv?player.veh.spec.cam+3.5:4.6)*por,up=(camMode===1?20:drv?3.6+player.veh.spec.len*.15:2.5)*por;const cp=Math.cos(camPitch*.9);tmp.set(P0.x-lx*back*cp,P0.y+up+Math.sin(camPitch*.9)*back*.9,P0.z-lz*back*cp);
      if(camSnap){camPos.copy(tmp);camLook.copy(P0);}camPos.lerp(tmp,1-Math.exp(-dt*(camMode?3:5)));camera.position.copy(camPos);if(player.shake>0){player.shake-=dt;camera.position.x+=(Math.random()-.5)*player.shake;camera.position.y+=(Math.random()-.5)*player.shake;}
      tmp.set(P0.x+lx*(camMode?6:drv?5:2),P0.y+(camMode?0:drv?1.6:1.4),P0.z+lz*(camMode?6:drv?5:2));camLook.lerp(tmp,1-Math.exp(-dt*8));camera.lookAt(camLook);}camSnap=false;updSun(P0);}
  updRain(dt,camera.position.x,camera.position.y,camera.position.z);
  drawScene();for(const f of hooks.afterRender)f();}
requestAnimationFrame(loop);
addEventListener('pagehide',()=>{if(started)save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started)save();});
})();
