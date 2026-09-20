import type { Block, V3 } from './geometry';
import type { CorridorHop, CorridorSlice } from './corridor';
import { groundHeight, tunnelSections, tunnelExitM } from './corridor';
import { stationPosition } from './routes';

type Kit = 'office' | 'hospital' | 'mall' | 'temple' | 'church' | 'lake' | 'park' | 'market' | 'campus' | 'depot' | 'industrial' | 'hub' | 'civic' | 'residential' | 'fringe' | 'board';
type Landmark = Readonly<{ kit: Kit; name: string; color: string }>;
const catalog: Record<string, Landmark> = {};
function register(kit: Kit, color: string, entries: [string, string][]) {
 for (const [tag, name] of entries) catalog[tag] = { kit, name, color };
}
register('office', '#55818c', [
 ['IT_parks','WHITEFIELD IT PARKS'],['ITPB','ITPB · INTERNATIONAL TECH PARK'],['SAP','SAP'],['TCS','TCS'],['HP','HP'],['ITPL','ITPL'],['IBM','IBM'],['IT_offices','WHITEFIELD · IT OFFICES'],['GE','GE'],['RMZ','RMZ'],['industrial_IT','INDUSTRY & TECHNOLOGY'],['tech_park','HOODI · TECH PARK'],['Tata_Elxsi','TATA ELXSI'],['Capgemini','CAPGEMINI'],['WeWork','WEWORK'],['office_towers','BENNIGANAHALLI · OFFICES'],['towers','MG ROAD · BUSINESS DISTRICT'],
]);
register('hospital', '#ece0c6', [
 ['hospital','HOSPITAL'],['medical_campus','SRI SATHYA SAI · MEDICAL CAMPUS'],['eye_hospital','EYE HOSPITAL'],['ESI','ESI HOSPITAL'],['Motherhood','MOTHERHOOD'],['hospitals','HOSPITALS'],['eye_hospitals','EYE CARE'],
]);
register('mall', '#d7b18a', [
 ['mall','SHOPPING CENTRE'],['cinema','CINEMA'],['Brookefield_mall','BROOKEFIELD MALL'],['DMart','D MART'],['Phoenix_MarketCity','PHOENIX MARKETCITY'],['VR_Bengaluru','VR BENGALURU'],['Lido_mall','LIDO MALL'],['GT_World_Mall','GT WORLD MALL'],['Vishal','VISHAL'],['Divinity_Mall','DIVINITY MALL'],['PVR','PVR'],['Gopalan_Arcade','GOPALAN ARCADE'],['Star_Bazaar','STAR BAZAAR'],['Decathlon','DECATHLON'],
]);
register('temple', '#dfb16c', [['temple','CHALLAGHATTA · TEMPLE'],['temples','TEMPLE STREET']]);
register('church', '#e1d8bd', [['church','CHURCH'],['Holy_Trinity_Church','HOLY TRINITY CHURCH']]);
register('lake', '#477b80', [['lake','LAKE'],['lake_park','LAKE & PARK'],['Ulsoor_lake','ULSOOR LAKE'],['Kengeri_lake','KENGERI LAKE']]);
register('park', '#618063', [['forest','KADUGODI · TREE BELT'],['park','NEIGHBOURHOOD PARK']]);
register('market', '#bd8266', [['retail','LOCAL SHOPS'],['100ft_retail','100 FEET ROAD'],['markets','MARKET STREET'],['Brigade_Road','BRIGADE ROAD'],['Cottonpet','COTTONPET'],['town_centre','KENGERI · TOWN CENTRE']]);
register('campus', '#cabc9e', [
 ['school','SCHOOL'],['schools','SCHOOLS'],['college','COLLEGE'],['colleges','COLLEGES'],['university_fringe','JNANABHARATHI · CAMPUS EDGE'],['Bangalore_University','BANGALORE UNIVERSITY'],['RVCE','RV COLLEGE OF ENGINEERING'],['ISI','INDIAN STATISTICAL INSTITUTE'],['campus_belt','JNANABHARATHI · CAMPUS BELT'],['library','PUBLIC LIBRARY'],
]);
register('depot', '#6d8c91', [['depot','KADUGODI DEPOT'],['auto_yard','AUTO YARD'],['rail','RAILWAY YARD'],['depot_yards','BAIYAPPANAHALLI DEPOT'],['depot_fringe','BAIYAPPANAHALLI · YARD EDGE'],['BMTC_depot','BMTC DEPOT'],['depot_terminus','CHALLAGHATTA · DEPOT']]);
register('industrial', '#a1aaa1', [['industrial','INDUSTRIAL ESTATE'],['ABB','ABB'],['Tin_Factory','TIN FACTORY'],['CocaCola','COCA-COLA'],['BEML','BEML'],['BHEL','BHEL']]);
register('hub', '#829fa1', [['TTMC','TTMC · BUS TERMINAL'],['Hoodi_junction','HOODI JUNCTION'],['KR_Puram_hub','KR PURAM · TRANSPORT HUB'],['Trinity_Circle','TRINITY CIRCLE'],['Vijayanagar_hub','VIJAYANAGAR'],['Chord_Road','CHORD ROAD'],['bus_stand','BUS STAND'],['Mysore_Road','MYSORE ROAD'],['junction','NAYANDAHALLI JUNCTION'],['NICE','NICE ROAD']]);
register('civic', '#b66e5d', [['police','POLICE'],['Mayo_Hall','MAYO HALL'],['MG_Road_spine','MG ROAD · BOULEVARD']]);
register('residential', '#c5b7a1', [['hotel','HOTEL'],['hotels','TRINITY · HOTELS'],['RR_Nagar','RAJARAJESHWARI NAGAR'],['BDA','BDA · RESIDENTIAL']]);
register('fringe', '#af9874', [['peri_urban','CHALLAGHATTA · CITY EDGE']]);
register('board', '#355661', [['tunnel','PURPLE LINE'],['Cubbon_Park_surface','CUBBON PARK · SURFACE'],['stadium_near','STADIUM · SURFACE'],['Vidhana_Soudha','VIDHANA SOUDHA · SURFACE'],['High_Court','HIGH COURT · SURFACE'],['Central_College','CENTRAL COLLEGE · SURFACE'],['secretariat','SECRETARIAT · SURFACE'],['Majestic_bus','MAJESTIC · BUS INTERCHANGE'],['KSRTC','KSRTC · SURFACE'],['City_railway','KSR · CITY RAILWAY'],['tunnel_exit','MAGADI ROAD · PORTAL']]);
export const LANDMARKS: Readonly<Record<string, Landmark>> = Object.freeze(catalog);
export type Plate = { text: string; sub: string; p: V3; width: number; color: string };
export type SceneryKit = { solid: Block[]; glass: Block[]; glow: Block[]; foliage: Block[]; round: Block[]; plates: Plate[] };
const emptyKit = (): SceneryKit => ({ solid: [], glass: [], glow: [], foliage: [], round: [], plates: [] });
export function random(seed: number): () => number {
 let n = seed >>> 0;
 return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
}
function block(list: Block[], p: V3, s: V3, color: string, r?: V3) { list.push({ p, s, color, r }); }
function tree(k: SceneryKit, x: number, y: number, z: number, scale: number, color = '#405f48') {
 block(k.solid, [x,y+2.6*scale,z], [.45*scale,5.2*scale,.45*scale], '#766454');
 block(k.foliage, [x,y+6*scale,z], [3.8*scale,2.6*scale,3.5*scale], color);
 block(k.foliage, [x+1.8*scale,y+5.1*scale,z+1.1*scale], [2.7*scale,2.1*scale,2.5*scale], '#577254');
}
function windows(k: SceneryKit, x: number, y: number, z: number, w: number, h: number, depth: number, seed: number) {
 for (let floor=3; floor<h-1; floor+=3) {
  block(k.glass, [x,y+floor,z+depth/2+.04], [w-.8,1.65,.09], '#477078');
  // Side ribbon windows catch the warm sky on approach.
  for (const side of [-1,1]) block(k.glass, [x+side*(w/2+.04),y+floor,z], [.09,1.65,depth-.8], '#49717a');
  for (let col=-w/2+1.5; col<w/2; col+=3) {
   if ((Math.round(col+floor)+seed)%3===0) block(k.glow, [x+col,y+floor,z+depth/2+.11], [1.2,1.25,.025], '#cbbd8e');
  }
 }
 for (let col=-w/2+1.5; col<w/2; col+=3) block(k.solid, [x+col,y+h/2,z+depth/2+.15], [.16,h,.2], '#aeb9b0');
}

export function landmarkPlacements(hop: CorridorHop) {
 return hop.tags.map((tag, index) => {
  const landmark = LANDMARKS[tag];
  if (!landmark) throw new Error(`Unmapped corridor tag: ${tag}`);
  return { tag, landmark, distance: hop.start + 90 + (hop.m - 180) * (index + .5) / hop.tags.length,
   side: (index + hop.i) % 2 ? -1 : 1, seed: hop.i * 127 + index * 19 + 3 };
 });
}

function landmarkKit(k: SceneryKit, spec: ReturnType<typeof landmarkPlacements>[number], base: number) {
 const { landmark: l, tag, side, seed } = spec;
 const rng=random(seed), z=base-spec.distance, g=groundHeight(spec.distance);
 const x=side*(29+rng()*9), color=l.color, width=24+rng()*6, depth=30;
 const add=(dx:number,y:number,dz:number,w:number,h:number,d:number,c=color)=>block(k.solid,[x+dx,g+y,z+dz],[w,h,d],c);
 let signY=13, signW=26, signZ=depth/2+.4;
 switch(l.kit) {
  case 'office': {
   const height=31+rng()*25;
   for(const [dx,h,w] of [[-8,height,17],[10,height*.73,14]]) {
    add(dx,h/2,0,w,h,depth,'#617b81');
    windows(k,x+dx,g,z,w,h,depth,seed);
    add(dx,h+.35,0,w+1.5,.7,depth+1,'#c4c8b6');
    add(dx,h+2,-5,w*.7,3,7,'#657877');
    for(let y=6;y<h;y+=6) add(dx,y,depth/2+.3,w+.6,.35,.7,'#bec7bd');
   }
   add(0,4,18,38,8,8,'#c4bda5');
   block(k.glass,[x,g+3.8,z+22.1],[34,5,.15],'#486f74');
   for(const dx of [-13,0,13]) tree(k,x+dx,g,z+29,1.2);
   signY=11; signZ=22.3;
   break;
  }
  case 'hospital': {
   const h=22+rng()*10;
   add(0,h/2,0,width,h,depth); windows(k,x,g,z,width,h,depth,seed);
   for(const dx of [-19,19]) {add(dx,6,3,12,12,24);windows(k,x+dx,g,z+3,12,12,24,seed);}
   add(0,4,22,14,.6,12,'#83a7a2');
   for(const dx of [-6,6]) add(dx,2,26,.5,4,.5);
   block(k.glow,[x,g+h+3,z+15.6],[1.2,5,.2],'#cf6d61');
   block(k.glow,[x,g+h+3,z+15.7],[4.5,1.2,.2],'#cf6d61');
   if(tag==='medical_campus') {block(k.round,[x,g+h,z],[7,5,7],'#d0b46f');signY=h-3;}
   else signY=h-3;
   break;
  }
  case 'mall': {
   const phoenix=tag==='Phoenix_MarketCity', vr=tag==='VR_Bengaluru';
   const h=vr?25:phoenix?21:15;
   add(0,h/2,0,42,h,36,vr?'#3e4c54':color);
   add(-15,h/2,19,6,h+1,3,vr?'#a48361':'#be7058');
   block(k.glass,[x+3,g+4,z+18.2],[31,6,.2],'#456976');
   for(let dx=-17;dx<=18;dx+=5) add(dx,h/2,18.6,.3,h,.6,'#e2c895');
   add(6,h-4,18.7,23,4,.5,vr?'#242c37':'#a35443');
   block(k.glow,[x,g+h+.3,z+18.5],[42,.22,.2],'#ebc17d');
   for(const dx of [-16,16]) tree(k,x+dx,g,z+28,1.05);
   // Phoenix's warm stepped crown / VR's dark box and bronze fins.
   if(phoenix) for(let i=0;i<3;i++) add(0,h+1+i*1.4,0,32-i*7,1.4,22-i*4,'#cb9a72');
   if(tag==='Decathlon') {add(0,h-2,18.8,36,4,.2,'#287caa');signW=29;}
   signY=h-4;signZ=19.1;signW=34;
   break;
  }
  case 'temple': {
   add(0,2,0,25,4,28,'#be8d6e');
   for(let level=0;level<7;level++) {
    const w=14-level*1.5;add(0,5+level*2.1,7,w,2,9-level*.65);
    add(0,6+level*2.1,7,w+1,.3,10-level*.65,'#d4b68c');
    for(const dx of [-1,1]) block(k.round,[x+dx*w*.3,g+5.4+level*2.1,z+12-level*.3],[.6,.7,.5],level%2?'#b57061':'#8daba2');
   }
   for(const dx of [-3,0,3]) block(k.round,[x+dx,g+20,z+7],[.45,.7,.45],'#dfb657');
   add(0,2.5,14.3,4,5,.3,'#534f46'); signY=4;signW=22;
   break;
  }
  case 'church': {
   add(0,5,0,17,10,28);
   for(const side of [-1,1]) block(k.solid,[x+side*4.8,g+11,z],[10,.7,30],'#986a58',[0,0,side*-.38]);
   add(0,12,11,6,24,6,'#dfd6b7');add(0,25,11,.5,5,.5);add(0,26,11,3,.45,.45);
   for(const dx of [-6,6]) block(k.glass,[x+dx,g+6,z+14.1],[2,4,.1],'#708f91');
   tree(k,x+14,g,z+8,1.3);signY=5;signW=24;
   break;
  }
  case 'lake': {
   // Opaque, low-cost water with ripples; no full-screen reflection pass.
   block(k.round,[x+side*27,g-.1,z],[46,.16,56],'#477b80');
   for(let i=0;i<18;i++) block(k.glass,[x+side*27+(rng()-.5)*50,g+.1,z+(rng()-.5)*75],[5+rng()*12,.035,.12],'#9bb0a0');
   for(let i=0;i<12;i++) {const a=i*Math.PI*2/12;tree(k,x+side*27+Math.cos(a)*47,g,z+Math.sin(a)*57,.9+rng()*.5);}
   add(-side*9,.2,0,3,.3,85,'#bdad88');signY=9;signW=24;signZ=12;
   break;
  }
  case 'park':
   add(side*18,-.1,0,66,.2,76,'#728365');
   for(let i=0;i<26;i++) tree(k,x+side*rng()*49,g,z+(rng()-.5)*65,.9+rng()*.9);
   signY=9;signW=26;break;
  case 'market':
   for(let i=0;i<6;i++) {
    const dx=(i%3-1)*10,dz=Math.floor(i/3)*18,h=8+rng()*8;
    add(dx,h/2,dz,9,h,16,['#b9967c','#c5b38c','#8caaa0'][i%3]);
    windows(k,x+dx,g,z+dz,9,h,16,seed+i);
    add(dx,3,dz+9.6,9,.3,4,i%2?'#c47c56':'#69886c');
    add(dx,1.5,dz+8.2,7,3,.1,'#535d5b');
    block(k.glow,[x+dx,g+2.8,z+dz+9.8],[5,.13,.12],'#e3b57b');
   }
   signY=13;signW=28;signZ=28;break;
  case 'campus':
   add(0,7,0,34,14,23);windows(k,x,g,z,34,14,23,seed);
   for(const dx of [-14,14]) {add(dx,2,24,1,4,1,'#ad8c73');tree(k,x+dx,g,z+35,1.5);}
   add(0,5,24,30,2,1.5,'#b19871');
   for(let dx=-12;dx<=12;dx+=6) add(dx,5,13,.7,10,.8,'#e1d4b2');
   for(let i=0;i<8;i++) tree(k,x+side*(24+rng()*20),g,z+(rng()-.5)*55,1.2);
   signY=8.5;signZ=24.9;signW=30;break;
  case 'depot':
   for(let i=0;i<4;i++) {
    const dx=i*5*side;
    for(const rail of [-.72,.72]) add(dx+rail,.15,0,.09,.13,98,'#b6beb7');
    for(let dz=-45;dz<48;dz+=3) add(dx,.02,dz,2.2,.12,.3,'#727977');
    if(i%2===0) {add(dx,1.7,-7,3.1,3.2,42,'#c3c9c1');add(dx,2.3,14.1,2.8,.6,.1,'#79498d');block(k.glass,[x+dx,g+2.8,z+14.2],[2.5,.8,.15],'#354f5b');}
   }
   add(side*8,6,-28,28,.7,40,'#78999b');
   for(const dx of [-5,21]) add(side*dx,3,-12,.5,6,.5);
   signY=8;signW=30;signZ=22;break;
  case 'industrial':
   add(0,4.5,0,35,9,36);
   for(let i=0;i<5;i++) {add(-14+i*7,9.4,0,6,1,37,'#879994');add(-14+i*7,3,18.1,4,5,.15,'#516b70');}
   add(side*17,10,-12,2,20,2,'#baac96');
   add(side*17,19,-12,2.2,.7,2.2,'#765b50');signY=7;signW=30;signZ=18.3;break;
  case 'hub':
   add(0,.05,0,44,.2,58,'#555f5e');
   add(0,5,-7,40,.7,20,'#a2b5ae');
   for(let i=0;i<4;i++) {add(-15+i*10,2,-4,2.6,3.5,11,i%2?'#98a9b0':'#64998d');block(k.glass,[x-15+i*10,g+2.7,z+1.6],[2.4,1.1,.1],'#2c4953');}
   for(const dx of [-18,18]) add(dx,2.5,0,.5,5,.5);
   signY=8;signZ=5;signW=32;break;
  case 'civic':
   add(0,6,0,30,12,26,tag==='Mayo_Hall'?'#a95848':color);
   add(0,12.5,0,32,1,28,'#e4cbaa');add(0,10,14,32,1,3,'#dfc6a0');
   for(let dx=-12;dx<=12;dx+=4) {add(dx,5,14,.65,10,.65,'#ead7b5');block(k.glass,[x+dx,g+6,z+13.1],[2,4,.1],'#5d7773');}
   signY=13;signW=29;signZ=14.5;break;
  case 'residential': {
   const h=tag==='hotel'||tag==='hotels'?33:19;
   for(const dx of [-10,10]) {add(dx,h/2,0,17,h,26);windows(k,x+dx,g,z,17,h,26,seed);for(let y=3;y<h;y+=3)add(dx,y,14,18,.3,2,'#d8ceb9');}
   signY=h-3;signW=28;break;
  }
  case 'fringe':
   add(side*27,-.1,0,80,.2,110,'#9b926b');
   for(let i=0;i<8;i++) {const dx=side*(10+rng()*60),dz=(rng()-.5)*85;add(dx,2.5,dz,8,5,9,i%2?'#b29575':'#d0bda2');add(dx,5.3,dz,8.8,.6,10,'#b07858');}
   for(let i=0;i<10;i++) tree(k,x+side*rng()*55,g,z+(rng()-.5)*95,.7+rng()*.7);
   signY=10;signW=29;break;
  case 'board': signY=11;signW=25;break;
 }
 const text=tag==='hospital'&&spec.seed>=3*127&&spec.seed<4*127?'SRI SATHYA SAI HOSPITAL':l.name;
 k.plates.push({text,sub:l.kit==='lake'?'BENGALURU · LAKE & GREENWAY':l.kit==='depot'?'NAMMA METRO · RAIL CORRIDOR':'BENGALURU',p:[x,g+signY,z+signZ],width:signW,color:tag==='VR_Bengaluru'?'#293e49':tag==='Decathlon'?'#196b96':l.kit==='office'?'#284b59':l.kit==='hospital'?'#366b69':'#654c44'});
 // Free-standing plates have supports; building-mounted ones sit on the facade.
 if(['lake','park','depot','hub','fringe','board'].includes(l.kit)) for(const dx of [-signW*.4,signW*.4]) add(dx,signY/2,signZ,.22,signY,.25,'#83958e');
}

export function makeSurface(slice: CorridorSlice): SceneryKit {
 const k=emptyKit(), {hop,start,end}=slice;
 if(slice.tunnel || hop.layout==='underground') return k;
 const rural=hop.tags.includes('peri_urban'), green=hop.tags.some(t=>['forest','campus_belt','university_fringe'].includes(t));
 const yard=hop.layout==='at-grade', rng=random(hop.i*9901+Math.floor(start/160)*31);
 const hasLake=hop.tags.some(t=>LANDMARKS[t]?.kit==='lake');
 // Twenty-metre ground strips allow a continuous embankment at grade changes.
 for(let a=start;a<end;a+=20) {
  const b=Math.min(a+20,end),d=(a+b)/2,g=groundHeight(d),z=start-d;
  block(k.solid,[-2,g-.3,z],[330,.6,b-a],rural?'#898568':green?'#6a7860':'#686f61');
  for(const side of [-1,1]) {
   const x=side===1?14:-18;
   block(k.solid,[x,g+.04,z],[yard?7:12,.08,b-a],'#49575a');
   block(k.solid,[x+side*6.4,g+.16,z],[1.6,.3,b-a],'#b9b09b');
   block(k.solid,[x,g+.1,z],[.13,.035,Math.min(7,b-a)],'#c7bf9e');
  }
  if(!yard&&g<-2) {
   block(k.solid,[-2.1,(g-1.2)/2,z],[1.6,-1.2-g,2.2],'#a4aaa0');
   block(k.solid,[-2.1,-1.25,z],[9.5,.7,3],'#bec1af');
  }
 }
 // Stable global slots: assets neither move nor multiply when a chunk streams.
 for(let d=Math.ceil(start/40)*40;d<end;d+=40) {
  const z=start-d,g=groundHeight(d);
  block(k.solid,[3.5,2.9,z],[.17,5.8,.2],'#7e8e8a');
  block(k.solid,[-2.1,5.75,z],[11.4,.16,.17],'#687f83');
  for(const side of [-1,1]) {
   const x=side===1?20:-25;
   if(!yard) {block(k.solid,[x,g+6,z],[.15,12,.15],'#8d9a90');block(k.glow,[x-side*1.3,g+11.7,z],[2.8,.12,.3],'#efd09b');}
   if(!rural || rng()>.4) tree(k,x+side*2,g,z+8,.85+rng()*.6,green?'#405f47':'#536c4f');
   // A second, lower horizon behind the named landmarks. Never mask lakes.
   if(!yard&&!hasLake&&!rural) {
    const x2=side*(76+rng()*33),h=green?7+rng()*9:12+rng()*(hop.i<10?29:18),w=11+rng()*11;
    block(k.solid,[x2,g+h/2,z],[w,h,25],['#999e91','#b9aa91','#809393','#b5b39e'][hop.i%4]);
    windows(k,x2,g,z,w,h,25,hop.i);
    block(k.solid,[x2,g+h+.5,z],[w+1,1,26],'#717f79');
   }
   if(yard) {
    const railX=side===1?28:-32;
    for(const r of [-.72,.72]) block(k.solid,[railX+r,g+.15,z-20],[.09,.1,40],'#c2c8bf');
    for(let t=0;t<40;t+=2) block(k.solid,[railX,g,z-t],[2.2,.12,.25],'#787e73');
    block(k.solid,[side*23,g+1.5,z],[.12,3,.12],'#aeb7a5');
    block(k.solid,[side*23,g+1.6,z-20],[.07,.05,40],'#aeb7a5');
   }
   if(!yard&&rng()>.2) {
    const tx=side===1?12:-16;
    block(k.solid,[tx,g+.7,z],[1.8,1.4,3.6],rng()>.5?'#d0b260':'#a5b6b5');
    block(k.glass,[tx,g+1.5,z],[1.65,.4,2],'#36575b');
    block(k.glow,[tx,g+.6,z+1.85],[1.4,.15,.05],'#edd4a1');
   }
  }
 }
 for(const spec of landmarkPlacements(hop)) if(spec.distance>=start&&spec.distance<end) landmarkKit(k,spec,start);
 return k;
}

export function makeTunnel(slice: CorridorSlice): SceneryKit {
 const k=emptyKit(), {start,end,hop}=slice;
 // Bulkheads close the space around each bore at station chamber ends. The
 // openings follow the tube ellipse, leaving the full train clearance intact.
 for(let i=18;i<=23;i++) for(const d of [stationPosition(i)-126,stationPosition(i)+48]) {
  if(d<start||d>=end||d>=tunnelExitM) continue;
  for(let y=-1.4;y<8.4;y+=.2) {
   const near=Math.max(0,Math.abs(y+.1-2.4)-.1),rx=2.04*Math.sqrt(Math.max(0,1-(near/3.8)**2));
   const left=-4.2-rx,right=rx,mid=4.2-2*rx;
   block(k.solid,[(-14.5+left)/2,y+.1,start-d],[left+14.5,.2,.45],'#697c83');
   block(k.solid,[(10.3+right)/2,y+.1,start-d],[10.3-right,.2,.45],'#697c83');
   if(mid>0) block(k.solid,[-2.1,y+.1,start-d],[mid,.2,.45],'#697c83');
  }
 }
 for(const section of tunnelSections(start,end)) {
  const length=section.end-section.start,z=start-(section.start+section.end)/2;
  if(section.chamber) {
   block(k.solid,[-2.1,8,z],[25,.7,length],'#3e515b');
   for(const x of [-14.5,10.3]) block(k.solid,[x,3.5,z],[.5,9,length],'#566976');
   for(let d=Math.ceil(section.start/12)*12;d<section.end;d+=12) {
    block(k.solid,[-2.1,7.5,start-d],[25,.4,.5],'#82949c');
    for(const x of [-10,6]) block(k.glow,[x,7.3,start-d],[.25,.12,6],'#b7dae6');
   }
  } else {
   // Twin oval bores; concrete panels are tangent to the ellipse. Adjacent
   // edges overlap slightly, so neither sky nor street can leak through joints.
   for(const center of [0,-4.2]) for(let j=0;j<24;j++) {
    const a=(j+.5)/24*Math.PI*2,rx=2.04,ry=3.8;
    const x=center+rx*Math.cos(a),y=2.4+ry*Math.sin(a);
    const tangent=Math.atan2(ry*Math.cos(a),-rx*Math.sin(a));
    const span=Math.hypot(rx*Math.sin(a),ry*Math.cos(a))*Math.PI*2/24+.08;
    block(k.solid,[x,y,z],[span,.2,length],j%3?'#42535e':'#4d606a',[0,0,tangent]);
    for(let d=Math.ceil(section.start/8)*8;d<section.end;d+=8) block(k.solid,[x*.998,y,start-d],[span,.24,.09],'#70818a',[0,0,tangent]);
   }
   for(const x of [-1.82,1.82,-6.02,-2.38]) {
    block(k.solid,[x,1.4,z],[.13,.35,length],'#233b49');
    block(k.solid,[x,2.35,z],[.08,.05,length],'#a09170');
    for(let d=Math.ceil(section.start/16)*16;d<section.end;d+=16) block(k.glow,[x,3.1,start-d],[.09,.15,2.6],'#b8e4ec');
   }
  }
 }
 for(const spec of landmarkPlacements(hop)) if(spec.distance>=start&&spec.distance<end&&spec.tag!=='tunnel') {
  const z=start-spec.distance;
  k.plates.push({text:spec.landmark.name,sub:'SURFACE WAYFINDING · NEXT STATION',p:[0,4.6,z],width:2.9,color:'#244451'});
 }
 return k;
}
