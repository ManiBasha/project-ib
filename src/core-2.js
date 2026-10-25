
/* ================= places you can use ================= */
const PCOL={stadium:'#3ddc97',bank:'#3ddc97',food:'#ff9f1c',toilet:'#5fb4ff',pump:'#2fc4b2',cng:'#7fd858',hospital:'#ff6b6b',police:'#5f8bff',rto:'#c9a227',jobs:'#ffb347',cars:'#c38bff',bikes:'#ff8fd0',clothes:'#ff6fa8',furniture:'#d8a46a',mobile:'#6fc3ff',guns:'#ff5d73',realty:'#ffc93c',mechanic:'#9aa5b1',station:'#e07b39',bus:'#e85d5d',lodge:'#b38bff',home:'#ffe08a',airport:'#7ad0ff',local:'#ff9a3c',ferry:'#4fb3ff',safari:'#9bd36a',camel:'#e3b26a',cricket:'#3ddc97',mall:'#ff6fa8',metro:'#c38bff',bullet:'#1b4f9c',gig:'#e0a030',helipad:'#ffd36a',activity:'#3fd0c9',zoo:'#7cc96a'};
const PICON={heritage:'📜',stadium:'⚽',bank:'🏦',food:'🍛',toilet:'🚻',pump:'⛽',cng:'🟢',hospital:'🏥',police:'🚓',rto:'🪪',jobs:'💼',cars:'🚗',bikes:'🏍',clothes:'👕',furniture:'🛋',mobile:'📱',guns:'🎯',realty:'🏘',mechanic:'🔧',station:'🚆',bus:'🚌',lodge:'🛏',home:'🏡',airport:'✈',local:'🚉',ferry:'⛴',safari:'🦁',camel:'🐪',cricket:'🏏',mall:'🛍',metro:'Ⓜ',bullet:'🚄',gig:'🛠',helipad:'🚁',activity:'🪂',zoo:'🦒'};
const PLABEL={stadium:'Football stadium',bank:'Bank and ATM',food:'Food and chai',toilet:'Public toilet',pump:'Petrol and diesel',cng:'CNG pump',hospital:'Hospital',police:'Police station',rto:'RTO (licences)',jobs:'Job agent',cars:'Car showroom',bikes:'Two-wheeler dealer',clothes:'Clothes shop',furniture:'Furniture',mobile:'Mobile shop',guns:'Gun shop',realty:'Homes for sale',mechanic:'Mechanic',station:'Railway station',bus:'Bus stand',lodge:'Lodge to sleep',home:'Home',airport:'Airport',local:'Mumbai local',ferry:'Ferry',safari:'Lion safari',camel:'Camel ride',cricket:'Cricket stadium',mall:'Shopping mall',metro:'Metro station',bullet:'Bullet train station',gig:'Local work',helipad:'Helipad',activity:'Adventure activity',zoo:'Zoo'};
const VALUE={cycle:4000,rickshaw:15000,bike:65000,sportsbike:180000,auto:12000,car:45000,sedan:85000,suv:120000,sports:250000,taxi:40000};
const PNAME={bank:'Bharat Bay Bank',toilet:'Public toilet',pump:'Petrol pump',cng:'CNG pump',hospital:'Hospital',police:'Police station',rto:'RTO office',jobs:'Rozgar job agent',cars:'Bay Motors',bikes:'Do-Pahiya two-wheelers',clothes:'Kapda Bazaar',furniture:'Ghar Sajao furniture',mobile:'Mobile Point',guns:'Hathiyar Ghar',realty:'Sapna Homes',mechanic:'Mechanic garage',station:'Railway station',bus:'ST bus stand',lodge:'Lodge'};
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
  skycar:{max:44,acc:24,turn:1.9,len:4.6,wid:2.1,fuel:null,lic:'lmv',fp:[-.38,1.25,.1],cam:5.4,label:'Aerion flying car',flies:true}};
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
const gunMeshes={bat:part(G.box,LMat('#c99a5b'),.09,.09,1.1,0,-.3,.45,AU.fores[1]),pistol:part(G.box,VM.black,.1,.16,.4,0,-.32,.18,AU.fores[1]),shotgun:part(G.box,VM.black,.1,.12,1.1,0,-.3,.5,AU.fores[1])};
const grp=(parent,list)=>{const g=new THREE.Group();for(const [geo,m,sx,sy,sz,x,y,z,rz] of list){const q=part(geo,m,sx,sy,sz,x,y,z,g);if(rz)q.rotation.z=rz;}parent.add(g);return g;};
const outfitParts={kurta:(()=>{const m=new THREE.Mesh(PG.kurta,LMat('#ffffff'));m.scale.set(1.05,1,.7);avatar.add(m);return m;})(),saree:(()=>{const m=new THREE.Mesh(PG.saree,LMat('#ffffff'));m.scale.set(1.04,1,.74);avatar.add(m);return m;})(),
  pallu:(()=>{const m=part(G.box,LMat('#ffffff'),.2,.68,.022,.03,1.18,.142,avatar);m.rotation.z=-.55;return m;})(),
  glasses:grp(avatar,[[G.box,VM.black,.17,.012,.01,0,1.735,.113],[G.box,LMat('#20262e'),.056,.03,.006,-.04,1.722,.114],[G.box,LMat('#20262e'),.056,.03,.006,.04,1.722,.114],[G.box,VM.black,.008,.01,.11,-.104,1.73,.06],[G.box,VM.black,.008,.01,.11,.104,1.73,.06]]),
  cap:grp(avatar,[[G.sph,LMat('#2d6cdf'),.124,.07,.13,0,1.79,-.005],[G.box,LMat('#2d6cdf'),.15,.012,.1,0,1.79,.13]]),
  helmet:part(G.sph,VM.black,.155,.155,.165,0,1.745,0,avatar),sneakers:[part(G.box,LMat('#ffffff'),.13,.075,.27,0,-.4,.045,AU.knees[0]),part(G.box,LMat('#ffffff'),.13,.075,.27,0,-.4,.045,AU.knees[1])]};
const player={mode:'drive',veh:null,pos:new THREE.Vector3(2940,0,8736),h:Math.PI/2,v:0,shake:0,anim:0,fireCd:0,arrestT:0,coolT:0,stars:0,hitCd:0,run:false,knock:0};
const ppos=()=>player.mode==='drive'&&player.veh?player.veh.pos:player.pos;
const WEAP={fist:{name:'Fists',range:1.9,rate:.45,melee:true},bat:{name:'Cricket bat',range:2.6,rate:.55,melee:true},pistol:{name:'Pistol',range:60,rate:.32,ammo:'pistol'},shotgun:{name:'Shotgun',range:28,rate:.95,ammo:'shotgun'}};

/* save */
function newSave(){return{v:3,name:'',age18:false,cash:CFG.startCash,bank:0,health:100,hunger:80,bladder:80,energy:85,weapons:['fist'],ammo:{pistol:0,shotgun:0},weapon:'fist',
  cars:[{type:'auto',fuel:80,hp:100,puc:0,ins:0}],homes:[],pos:null,inCar:0,trips:0,lic:{two:false,lmv:false,heavy:false},helmet:false,
  outfit:{top:'shirt',topCol:'#e8573e',botCol:'#2d3142',shoes:'chappal',glasses:false,cap:false},look:null,wardrobe:['shirt'],furniture:{},phone:'smart',challans:[],
  ratings:{},jobs:{},discovered:{},ach:{},daily:{last:'',streak:0},story:{step:0,done:false},biz:[],rent:{},seenVersion:'',robbedAt:-99,stats:{km:0,lions:0,trips:0,earned:0,fines:0},extra:{}};}
// Test play (testers and admins): a separate save, so real progress is never touched. Switched in Profile.
const TESTMODE=store.get('ib.testmode')===true,SAVEKEY=TESTMODE?'ib.save.test':'ib.save.v3';
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
function addWanted(n,why){if(CFG.police==='off'||inside)return;const before=player.stars;player.stars=Math.min(5,player.stars+n);player.coolT=0;if(player.stars>before){toast(`${why} · police alerted`,'#ff5d73');emit('stars',player.stars);}renderStars();}
function renderStars(){const el=$('#stars');let h='';for(let i=0;i<5;i++){const on=i<player.stars;h+=`<svg viewBox="0 0 24 24" class="${on?'on':''}"><path d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.7 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z" fill="${on?'#ffc93c':'rgba(255,255,255,.18)'}" stroke="${on?'#7a4a00':'none'}" stroke-width="1"/></svg>`;}el.innerHTML=player.stars?h:'';}
let policeSpawnT=0;
function spawnPolice(){const pp=ppos();const l=randomLaneNear(pp.x,pp.z,110,170);if(!l)return;lanePos(l,_lp);const v=makeVeh('police',_lp.x,_lp.z,Math.atan2(pp.x-_lp.x,pp.z-_lp.z),'police');v.ai={stuck:0,shootT:2};v.hp=100;}
function updPolice(dt,now){const pp=ppos();const cops=vehicles.filter(v=>v.state==='police');const aggr=AGGR[CFG.police]||0;
  if(player.stars>0&&!inside){const want=Math.round(Math.min(8,player.stars*(player.stars>=3?2:1.4))*aggr);policeSpawnT-=dt;if(cops.filter(c=>!c.dead).length<want&&policeSpawnT<=0){spawnPolice();policeSpawnT=2.5;}}
  let near=false;
  for(const c of cops){const dx=pp.x-c.pos.x,dz=pp.z-c.pos.z,d=Math.hypot(dx,dz);
    if(player.stars===0||inside){if(d>40||inside){removeVeh(c);continue;}c.v*=.95;}
    if(c.m.userData.lights){const f=Math.floor(now*6)%2;c.m.userData.lights[0].material=f?VM.sirR:VM.dark;c.m.userData.lights[1].material=f?VM.dark:VM.sirB;}
    if(c.dead||player.stars===0)continue;if(d<70)near=true;
    const want=Math.atan2(dx,dz),diff=wrapA(want-c.h);c.steer=clamp(diff*2,-1,1);const tv=d>14?c.spec.max*(.75+.25*aggr):d>7?7:0;c.v+=clamp(tv-c.v,-25*dt,c.spec.acc*dt);
    c.h+=c.steer*c.spec.turn*clamp(Math.abs(c.v)/7,0,1)*dt;const nx=c.pos.x+Math.sin(c.h)*c.v*dt,nz=c.pos.z+Math.cos(c.h)*c.v*dt;if(drivable(nx,nz)){c.pos.x=nx;c.pos.z=nz;}else c.v*=.3;
    if(collide(c.pos,1.2,false)&&c.v>6)c.v*=.6;if(c.v<2&&d>20)c.ai.stuck+=dt;else c.ai.stuck=Math.max(0,c.ai.stuck-dt);if(c.ai.stuck>3||d>260){removeVeh(c);continue;}
    c.m.rotation.y=c.h;for(const w of c.m.userData.wheels)w.rotation.x+=c.v*dt/.4;
    if(player.mode==='foot'){const s=segDist(pp.x,pp.z,c);if(s.d<c.spec.wid/2+.6&&c.v>5&&player.hitCd<=0){damage(12,'Hit by a police jeep');player.hitCd=1;player.pos.x+=s.dx/(s.d||1)*2;player.pos.z+=s.dz/(s.d||1)*2;}}
    if(player.stars>=3&&d<34){c.ai.shootT-=dt*aggr;if(c.ai.shootT<=0){c.ai.shootT=MR(1.1,1.8);tracer(c.pos.x,1.6,c.pos.z,pp.x+MR(-.5,.5),1.2,pp.z+MR(-.5,.5),0x9fd0ff);sfxShot(.5);damage(player.mode==='drive'?2:5,'Police fire');}}}
  if(player.stars>0){const close=cops.some(c=>!c.dead&&c.pos.distanceTo(pp)<7.5);const spd=player.mode==='drive'?Math.abs(player.veh.v):player.v;if(close&&spd<3.5)player.arrestT+=dt;else player.arrestT=Math.max(0,player.arrestT-dt*1.5);if(player.arrestT>2.6)busted();
    if(near)player.coolT=0;else{player.coolT+=dt;if(player.coolT>10+player.stars*3){player.stars--;player.coolT=0;renderStars();toast(player.stars?'Lost a star':'You lost the police','#3ddc97');emit('stars',player.stars);}}}
  $('#stars').classList.toggle('hot',near);}

/* ================= weapons ================= */
const tracers=[];
function tracer(x1,y1,z1,x2,y2,z2,col=0xfff1a0){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1,y1,z1),new THREE.Vector3(x2,y2,z2)]);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.9}));scene.add(l);tracers.push({l,t:.09});}
const flash=new THREE.PointLight(0xffd27a,0,10);scene.add(flash);
const fireHooks=[];function fire(){for(const f of fireHooks){try{if(f())return;}catch(e){}}if(player.mode!=='foot'||inside||player.fireCd>0||uiLock()||player.knock>0)return;const Wp=WEAP[P.weapon];
  if(!Wp.melee&&!CFG.weapons){P.weapon='fist';updWeap();return;}if(Wp.ammo&&P.ammo[Wp.ammo]<=0){toast('Out of ammo · buy more at Hathiyar Ghar','#ff9f1c');P.weapon='fist';updWeap();return;}
  player.fireCd=Wp.rate;player.anim=.25;const ox=player.pos.x,oz=player.pos.z;const cone=Wp.melee?1.1:.32;let best=null,bd=1e9;const cand=[];
  for(const p of peds)if(p.state!=='down'&&p.g.visible)cand.push({k:'ped',o:p,x:p.x,z:p.z});for(const v of vehicles)if(v.state==='traffic'||v.state==='police')cand.push({k:'veh',o:v,x:v.pos.x,z:v.pos.z});
  for(const c of cand){const dx=c.x-ox,dz=c.z-oz,d=Math.hypot(dx,dz);const lim=Wp.range+(c.k==='veh'?c.o.spec.len/2:0);if(d>lim||d<.01)continue;const da=Math.abs(wrapA(Math.atan2(dx,dz)-player.h));if(da<cone&&d<bd){bd=d;best=c;}}
  if(Wp.melee){sfxPunch();player.lastPunch=performance.now();player.punchSide=1-(player.punchSide|0);if(best&&best.k==='ped'&&bd<Wp.range+.4){player.h=Math.atan2(best.x-ox,best.z-oz);hitPed(best.o,P.weapon==='bat'?2:1,ox,oz);fleeFrom(ox,oz,25);}return;}
  P.ammo[Wp.ammo]--;dirty=true;updWeap();sfxShot(1);flash.position.set(ox+Math.sin(player.h),1.4,oz+Math.cos(player.h));flash.intensity=3;let tx=ox+Math.sin(player.h)*Wp.range,tz=oz+Math.cos(player.h)*Wp.range;
  const hitOne=c=>{if(c.k==='ped')knockPed(c.o,null);else{const v=c.o;if(v.state==='police'){v.hp-=25;addWanted(1,'Shot at police');if(v.hp<=0){v.dead=true;v.v=0;}}else{v.stopT=8;}}};
  if(best){player.h=Math.atan2(best.x-ox,best.z-oz);tx=best.x;tz=best.z;hitOne(best);if(best.k==='ped')addWanted(1,'Attack');}
  if(P.weapon==='shotgun'){let n=0;for(const c of cand){if(c===best||n>=2)continue;const dx=c.x-ox,dz=c.z-oz,d=Math.hypot(dx,dz);if(d<16&&Math.abs(wrapA(Math.atan2(dx,dz)-player.h))<.25){hitOne(c);n++;}}}
  tracer(ox+Math.sin(player.h)*.6,1.35,oz+Math.cos(player.h)*.6,tx,1.1,tz);if(player.stars===0)addWanted(1,'Shots fired');fleeFrom(ox,oz,45);}
function cycleWeapon(){const list=P.weapons.filter(w=>CFG.weapons||WEAP[w].melee);const i=list.indexOf(P.weapon);P.weapon=list[(i+1)%list.length]||'fist';updWeap();}
function updWeap(){const Wp=WEAP[P.weapon]||WEAP.fist;const el=$('#weap');el.hidden=P.weapon==='fist'||!P.weapon;el.textContent=Wp.ammo?`${Wp.name} · ${P.ammo[Wp.ammo]}`:Wp.name;el.title='Weapon in hand · Q switches';for(const k in gunMeshes)gunMeshes[k].visible=k===P.weapon;}
