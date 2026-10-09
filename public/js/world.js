// العالم ثلاثي الأبعاد: تضاريس ملونة، مناطق، لاعب، بناء، سلوكيات العناصر، لاعبون آخرون
let worldNight=false,worldSun=null,worldHemi=null;
function setWorldTime(night){worldNight=!!night;if(typeof scene==='undefined'||!scene)return;const sky=worldNight?0x172443:0xa7c5d5;scene.background.setHex(sky);if(scene.fog)scene.fog.color.setHex(sky);if(worldSun)worldSun.intensity=worldNight?.16:.48;if(worldHemi)worldHemi.intensity=worldNight?.28:.58;document.documentElement.dataset.worldTime=worldNight?'night':'day'}
const T=THREE,HALF=240,BUILD_SCALE=1.6;
const hs=(x,z)=>{let h=Math.imul(x|0,374761393)+Math.imul(z|0,668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295};
const sm=t=>t*t*(3-2*t),vn=(x,z)=>{const i=Math.floor(x),j=Math.floor(z),fx=sm(x-i),fz=sm(z-j),a=hs(i,j),b=hs(i+1,j),c=hs(i,j+1),d=hs(i+1,j+1);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz};
const fbm=(x,z)=>{let a=.5,f=1,s=0;for(let i=0;i<4;i++){s+=vn(x*f,z*f)*a;a/=2;f*=2}return s/.9375},gs=(d,r)=>Math.exp(-d*d/(r*r));
function H(x,z){let h=(fbm(x/26+3,z/26)-.5)*2.8;const d=i=>Math.hypot(x-ZONES[i].x,z-ZONES[i].z);h+=gs(d(1),19)*5.2;h+=gs(d(4),18)*2.8;h-=gs(d(2),14)*2.4;const sp=Math.min(1,Math.hypot(x,z)/18);h*=sp*sp*(3-2*sp);return h-Math.max(0,Math.max(Math.abs(x),Math.abs(z))/HALF-.94)*12}
function tcol(x,z,h){let c=[.32,.68,.27];const zw=i=>gs(Math.hypot(x-ZONES[i].x,z-ZONES[i].z),ZONES[i].r*.8),mix=(a,w)=>{w=Math.max(0,Math.min(1,w));for(let i=0;i<3;i++)c[i]+=(a[i]-c[i])*w};
 mix([.22,.55,.25],zw(1)*.72);mix([.91,.73,.36],zw(3)*.92);mix([.88,.94,1],zw(4)*.95+Math.max(0,h-4)*.1);mix([.55,.66,.84],zw(5)*.32);if(h<.45)mix([.82,.75,.48],Math.min(1,(.45-h)*1.15));if(h<-.65)mix([.43,.75,.79],Math.min(1,(-h-.4)*1.8));const n=.97+hs(Math.round(x*1.7),Math.round(z*1.7))*.06;return c.map(v=>Math.max(0,Math.min(1,v*n)))}
const GEO={sph:a=>new T.SphereGeometry(a[0],12,10),box:a=>new T.BoxGeometry(a[0],a[1],a[2]),cyl:a=>new T.CylinderGeometry(a[0],a[1],a[2],10),cone:a=>new T.ConeGeometry(a[0],a[1],8),pyr:a=>new T.ConeGeometry(a[0],a[1],4),oct:a=>new T.OctahedronGeometry(a[0]),ico:a=>new T.IcosahedronGeometry(a[0],0),tor:a=>new T.TorusGeometry(a[0],a[1],8,18,a[2]||6.283)};
function mk(b,c,ghost){const g=new T.Group();
 const add=(p,par)=>{const[s,d,col,x,y,z,sx,sy,sz,rx,ry,rz]=p,cc=col==='c'?c:col,m=new T.Mesh(GEO[s](d),new T.MeshStandardMaterial({color:cc,roughness:.65,flatShading:s==='ico'||s==='oct',emissive:col==='c'&&EM.has(b)?cc:0,emissiveIntensity:.14,transparent:!!ghost,opacity:ghost?.5:1}));
  m.position.set(x||0,y||0,z||0);m.scale.set(sx||1,sy||1,sz||1);m.rotation.set(rx||0,ry||0,rz||0);if(col==='c')m.userData.tint=1;(par||g).add(m)};
 if(b==='door'){add(['box',[.1,1.1,.2],0xf5f5f5,-.48,.55,0]);add(['box',[.1,1.1,.2],0xf5f5f5,.48,.55,0]);add(['box',[1,.12,.2],0xf5f5f5,0,1.06,0]);const pv=new T.Group();pv.position.set(-.45,0,0);add(['box',[.86,1,.08],'c',.43,.5,0],pv);add(['sph',[.05],0xffd23f,.78,.5,.06],pv);g.add(pv);g.userData.door=pv;g.userData.open=0}
 else{(B[b]||B.rock).forEach(p=>add(p));if(b==='mill'){const bl=new T.Group();bl.position.set(0,1.3,.38);for(let i=0;i<4;i++){const sg=new T.Group();sg.rotation.z=i*1.5708;add(['box',[.12,.7,.02],0xffffff,0,.35,0],sg);bl.add(sg)}g.add(bl);g.userData.spin=bl}}
 return g}
function mkAvatar(hue,name,appearance={}){
 const g=new T.Group(),col=new T.Color(appearance.outfit||new T.Color().setHSL(hue/360,.72,.54)),shade=new T.Color(appearance.trim||col.clone().multiplyScalar(.72)),light=col.clone().lerp(new T.Color(0xffffff),.58);
 const mat=(color,roughness=.58,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const skin=mat(appearance.skin||0xffd2ad),skinShade=mat(0xeeb28e),cloth=mat(col),clothDark=mat(shade),clothLight=mat(light),white=mat(0xffffff),ink=mat(0x29253b),shoeMat=mat(appearance.shoes||0x34364b),gold=mat(appearance.scarf||0xffca58,.35,.18),hair=mat(appearance.hair||0x49334a),cheek=mat(0xff9d9e),pants=mat(appearance.pants||0x34364b);
 const add=(geo,material,x,y,z,sx=1,sy=1,sz=1,parent=g)=>{const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m};
 const ball=(material,x,y,z,sx,sy,sz,parent=g)=>add(new T.SphereGeometry(1,16,12),material,x,y,z,sx,sy,sz,parent);
 // Rounded jacket and compact silhouette.
 ball(cloth,0,.67,0,.32,.37,.22);ball(clothLight,0,.79,.205,.19,.15,.035);
 add(new T.CylinderGeometry(.09,.105,.13,12),skin,0,.94,0);
 // Oversized face, soft hair cap and fringe.
 ball(skin,0,1.18,0,.285,.30,.26);ball(hair,0,1.385,-.025,.29,.14,.27);
 ball(hair,-.235,1.27,.005,.07,.15,.105);ball(hair,.235,1.27,.005,.07,.15,.105);
 ball(hair,-.105,1.37,.19,.12,.07,.09);ball(hair,.035,1.39,.205,.12,.065,.075);
 ball(skinShade,-.284,1.17,0,.055,.08,.055);ball(skinShade,.284,1.17,0,.055,.08,.055);
 ball(white,-.105,1.205,.232,.071,.084,.035);ball(white,.105,1.205,.232,.071,.084,.035);
 ball(ink,-.095,1.2,.262,.033,.048,.018);ball(ink,.115,1.2,.262,.033,.048,.018);
 ball(white,-.105,1.22,.278,.012,.016,.008);ball(white,.105,1.22,.278,.012,.016,.008);
 ball(cheek,-.18,1.105,.207,.055,.027,.018);ball(cheek,.18,1.105,.207,.055,.027,.018);
 const smile=new T.Mesh(new T.TorusGeometry(.067,.012,6,16,Math.PI),ink);smile.position.set(0,1.095,.249);smile.rotation.z=Math.PI;g.add(smile);
 // Golden explorer scarf and badge.
 const scarf=add(new T.ConeGeometry(.105,.19,4),gold,0,.91,.22);scarf.rotation.x=.14;scarf.rotation.y=Math.PI/4;
 // Shoulder pivots let the arms swing naturally while walking.
 const armL=new T.Group();armL.position.set(-.29,.82,0);g.add(armL);
 ball(clothDark,0,-.13,0,.095,.19,.105,armL);ball(skin,-.015,-.285,.025,.075,.075,.075,armL);
 const armR=new T.Group();armR.position.set(.29,.82,0);g.add(armR);
 ball(clothDark,0,-.13,0,.095,.19,.105,armR);ball(skin,.015,-.285,.025,.075,.075,.075,armR);
 ball(shoeMat,0,.36,0,.23,.12,.18);
 const legL=new T.Group();legL.position.set(-.12,.34,0);g.add(legL);
 ball(pants,0,-.105,0,.105,.19,.12,legL);ball(shoeMat,0,-.23,.065,.13,.075,.19,legL);
 const legR=new T.Group();legR.position.set(.12,.34,0);g.add(legR);
 ball(pants,0,-.105,0,.105,.19,.12,legR);ball(shoeMat,0,-.23,.065,.13,.075,.19,legR);
 add(new T.CylinderGeometry(.235,.235,.065,16),gold,0,.48,0,1,.6,.78);
 ball(clothDark,0,.7,-.225,.19,.23,.09);ball(gold,0,.75,.241,.065,.065,.025);
 g.userData.armL=armL;g.userData.armR=armR;g.userData.legL=legL;g.userData.legR=legR;
 g.userData.styleMats={skin,hair,cloth,clothDark,clothLight,shoeMat,gold,pants};
 const hatMat=mat(appearance.hatColor||0x3da5ff),hatTrim=mat(0xffca58,.35,.18),accessories={};const cap=new T.Group();cap.add(new T.Mesh(new T.SphereGeometry(.205,14,9,0,Math.PI*2,0,Math.PI/2),hatMat));const brim=new T.Mesh(new T.CylinderGeometry(.22,.22,.035,16),hatMat);brim.position.y=.01;cap.add(brim);cap.position.set(0,1.45,-.015);g.add(cap);accessories.cap=cap;const crown=new T.Group();const crownBase=new T.Mesh(new T.CylinderGeometry(.16,.19,.09,8),hatMat);crownBase.position.y=1.44;crown.add(crownBase);for(let i=0;i<5;i++){const tip=new T.Mesh(new T.ConeGeometry(.045,.13,5),hatTrim);const a=i*Math.PI*2/5;tip.position.set(Math.cos(a)*.13,1.53,Math.sin(a)*.13);crown.add(tip)}g.add(crown);accessories.crown=crown;g.userData.accessories=accessories;g.userData.appearance={...appearance};applyAvatarAppearanceTo(g,appearance);
 // Keep the old animation hooks compatible with the game loop.
 g.userData.f1=legL;g.userData.f2=legR;
 if(name){const cv=document.createElement('canvas');cv.width=320;cv.height=84;const x=cv.getContext('2d');x.fillStyle='rgba(255,255,255,.94)';x.beginPath();x.roundRect(8,8,304,64,24);x.fill();x.strokeStyle='#d9dcf4';x.lineWidth=3;x.stroke();x.font='bold 32px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#2b2a5a';x.fillText(String(name).slice(0,18),160,42);const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv),depthTest:false}));sp.scale.set(2.25,.59,1);sp.position.y=1.83;g.add(sp)}
 return g}
function applyAvatarAppearanceTo(avatar,appearance={}){const m=avatar&&avatar.userData&&avatar.userData.styleMats;if(!m)return;const set=(material,value)=>{if(material&&value!=null)material.color.set(value)};set(m.skin,appearance.skin==null?m.skin.color:appearance.skin);set(m.hair,appearance.hair==null?m.hair.color:appearance.hair);set(m.cloth,appearance.outfit==null?m.cloth.color:appearance.outfit);set(m.clothDark,appearance.trim==null?m.clothDark.color:appearance.trim);set(m.clothLight,appearance.outfit==null?m.clothLight.color:new T.Color(appearance.outfit).lerp(new T.Color(0xffffff),.58));set(m.pants,appearance.pants==null?m.pants.color:appearance.pants);set(m.shoeMat,appearance.shoes==null?m.shoeMat.color:appearance.shoes);set(m.gold,appearance.scarf==null?m.gold.color:appearance.scarf);const ac=avatar.userData.accessories;if(ac){Object.values(ac).forEach(g=>g.visible=false);if(ac[appearance.hat])ac[appearance.hat].visible=true;const hm=ac.cap&&ac.cap.children[0]&&ac.cap.children[0].material,cm=ac.crown&&ac.crown.children[0]&&ac.crown.children[0].material;if(hm)hm.color.set(appearance.hatColor||appearance.outfit||0x3da5ff);if(cm)cm.color.set(appearance.hatColor||appearance.outfit||0x3da5ff);if(ac.crown)ac.crown.children.slice(1).forEach(o=>o.material.color.set(0xffca58))}avatar.userData.appearance={...appearance}}
function setAvatarAppearance(appearance){if(!pl||!pl.g)return;applyAvatarAppearanceTo(pl.g,appearance||{});S.avatar={...(appearance||{})}}
let R,scene,cam,terrain,pl,placed=[],cols=[],others={},ghost=null,tool=null,elev=0,manualElev=0,rot=0,cy=0,cp=.45,cd=8,keys={},ctl={lock:false},gifts=[],clouds=[],curZone=0,gpos={x:0,z:0},rc=new T.Raycaster(),moved=0;
const walkable=(x,z)=>Math.abs(x)<HALF-2&&Math.abs(z)<HALF-2&&H(x,z)>-.45;
function collide(x,z){let ax=x,az=z;for(const c of cols){if(c.door&&c.o.g.userData.open>.5)continue;if((c.o.e||0)>1.2)continue;const dx=ax-c.x,dz=az-c.z,s=Math.sin(c.ry),co=Math.cos(c.ry),lx=dx*co-dz*s,lz=dx*s+dz*co,qx=Math.max(-c.hx,Math.min(c.hx,lx)),qz=Math.max(-c.hz,Math.min(c.hz,lz)),ex=lx-qx,ez=lz-qz,d=Math.hypot(ex,ez);
  if(d<.3){const nx=d>1e-4?ex/d:0,nz=d>1e-4?ez/d:1,pu=.3-d+.002,wx=nx*pu,wz=nz*pu;ax+=wx*co+wz*s;az+=-wx*s+wz*co}}return[ax,az]}
function mv(dx,dz){const nx=pl.x+dx,nz=pl.z+dz;if(!walkable(nx,nz))return false;const[a,b]=collide(nx,nz);if(!walkable(a,b))return false;pl.x=a;pl.z=b;return true}
const PART_Y={roof:1.1,balcony:.55,chimney:1.1};
function placeObj(po,remoteOwner=null){const d=DEFS[po.k][po.i],g=mk(d.b,d.c),y=Math.max(H(po.x,po.z),-.3)+(po.e||0)+(po.k==='p'&&(PART_Y[d.b]||0)*BUILD_SCALE||0);g.scale.setScalar(BUILD_SCALE);g.position.set(po.x,y,po.z);g.rotation.y=po.ry||0;Object.assign(g.userData,{po,x0:po.x,y0:y,z0:po.z,ry0:po.ry||0});po.g=g;if(remoteOwner)po.remoteOwner=remoteOwner;scene.add(g);placed.push(po);
 // Collision bounds must use the same scale as the rendered build, including remote players' builds.
 const s=SOLID[d.b];if(po.k==='p'&&s)cols.push({o:po,x:po.x,z:po.z,ry:po.ry||0,hx:s[0]*BUILD_SCALE,hz:s[1]*BUILD_SCALE,door:d.b==='door'});return po}
function removeObj(po){const at=placed.indexOf(po);if(at<0||!po?.g)return;scene.remove(po.g);const geometries=new Set(),materials=new Set();po.g.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m))});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());placed.splice(at,1);const i=cols.findIndex(c=>c.o===po);if(i>=0)cols.splice(i,1)}
function behave(po,dt,t){const b=po.beh,g=po.g,u=g.userData;if(!b)return;const p=b.p||4,w=(t+u.x0)%1000;
 if(b.t==='spin')g.rotation.y=u.ry0+w*6.283/p;else if(b.t==='bounce')g.position.y=u.y0+Math.abs(Math.sin(w*3.14159/p*2))*.7;else if(b.t==='sway')g.rotation.z=Math.sin(w*6.283/p)*.25;
 else if(b.t==='pulse')g.scale.setScalar(BUILD_SCALE*(1+Math.sin(w*6.283/p)*.25));else if(b.t==='slide'){const a=Math.sin(w*6.283/p)*2;g.position.x=u.x0+Math.cos(u.ry0)*a;g.position.z=u.z0-Math.sin(u.ry0)*a}
 else if(b.t==='color'){const h=(w/p)%1;g.traverse(m=>{if(m.isMesh&&m.userData.tint)m.material.color.setHSL(h,.8,.6)})}
 else if(b.t==='swing'){u.force=Math.floor(w/p)%2===0?1:0;if(!u.door)g.rotation.z+=((u.force?1.1:0)-g.rotation.z)*Math.min(1,dt*3)}}
function clearBeh(po){const g=po.g,u=g.userData;g.rotation.set(0,u.ry0,0);g.scale.setScalar(BUILD_SCALE);g.position.set(u.x0,u.y0,u.z0);u.force=0;g.traverse(m=>{if(m.isMesh&&m.userData.tint){const d=DEFS[po.k][po.i];m.material.color.setHex(d.c)}})}
function setTool(t){tool=t;if(ghost){scene.remove(ghost);ghost=null}if(t&&t.k){const d=DEFS[t.k][t.i];ghost=mk(d.b,d.c,true);ghost.scale.setScalar(BUILD_SCALE);ghost.visible=false;scene.add(ghost)}document.getElementById('bt').classList.toggle('on',!!t);if(typeof updateQuickBuild==='function')updateQuickBuild()}
function ghostPlace(){if(!ghost)return;const d=DEFS[tool.k][tool.i];ghost.position.set(gpos.x,Math.max(H(gpos.x,gpos.z),-.3)+elev+(tool.k==='p'&&(PART_Y[d.b]||0)*BUILD_SCALE||0),gpos.z);ghost.rotation.y=rot;ghost.visible=true}
function pick(e){const r=R.domElement.getBoundingClientRect();rc.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam)}
function initWorld(){
 const cv=document.getElementById('cv');R=new T.WebGLRenderer({canvas:cv,antialias:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.outputEncoding=T.sRGBEncoding;
 scene=new T.Scene();scene.background=new T.Color(0xa7c5d5);scene.fog=new T.Fog(0xa7c5d5,260,820);cam=new T.PerspectiveCamera(55,1,.1,1400);
 worldHemi=new T.HemisphereLight(0xffffff,0x71947d,.58);scene.add(worldHemi);worldSun=new T.DirectionalLight(0xfff3d0,.48);worldSun.position.set(40,70,25);scene.add(worldSun);
 const geo=new T.PlaneGeometry(HALF*2,HALF*2,240,240);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,col=[];
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),h=H(x,z);pos.setY(i,h);col.push(...tcol(x,z,h))}geo.setAttribute('color',new T.Float32BufferAttribute(col,3));geo.computeVertexNormals();
 terrain=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.95}));scene.add(terrain);
 const wt=new T.Mesh(new T.PlaneGeometry(HALF*4,HALF*4),new T.MeshStandardMaterial({color:0x47b8c5,transparent:true,opacity:.68,roughness:.38}));wt.rotation.x=-Math.PI/2;wt.position.y=-.7;scene.add(wt);
 for(let i=0;i<10;i++){const g=new T.Group();for(let j=0;j<4;j++){const s=new T.Mesh(new T.SphereGeometry(2+Math.random()*2,10,8),new T.MeshBasicMaterial({color:0xffffff,fog:false}));s.position.set(j*2.6-4,Math.random(),Math.random()*1.5);g.add(s)}g.position.set(Math.random()*900-450,28+Math.random()*10,Math.random()*900-450);scene.add(g);clouds.push(g)}
 // زرع العناصر في المناطق
 const sets={0:['flower','tulip','bush','grass','round'],1:['pine','round','mushroom','fern','bamboo'],2:['palm','bamboo','flower','grass'],3:['cactus','rock','palm'],4:['pine','rock','snowman'],5:['house','lamp','flower','bush']};
 for(let n=0;n<800;n++){const x=(hs(n,7)-.5)*(HALF*1.8),z=(hs(n,13)-.5)*(HALF*1.8);if(Math.hypot(x,z)<5||H(x,z)<-.2)continue;let zi=0,bd=1e9;ZONES.forEach((q,i)=>{const d=Math.hypot(x-q.x,z-q.z)/q.r;if(d<bd){bd=d;zi=i}});if(bd>1.15)continue;
  const ok=ELS.filter(e=>sets[zi].includes(e.b)&&(zi!==4||e.c>0xe0e0e0||e.b==='rock'||e.b==='snowman'));if(!ok.length)continue;const d=ok[(hs(n,3)*ok.length)|0],g=mk(d.b,d.c);g.position.set(x,H(x,z),z);g.rotation.y=hs(n,5)*6.28;const s=.8+hs(n,9)*.6;g.scale.setScalar(d.b==='house'?1.3:s);scene.add(g)}
 // صناديق الهدايا
 for(let n=0;n<34;n++){const x=(hs(n,21)-.5)*(HALF*1.7),z=(hs(n,23)-.5)*(HALF*1.7);if(H(x,z)<0||Math.hypot(x,z)<4)continue;const g=new T.Group(),c=new T.Color().setHSL(hs(n,2),.8,.6);const b=new T.Mesh(new T.BoxGeometry(.5,.5,.5),new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.3}));b.position.y=.4;const r=new T.Mesh(new T.BoxGeometry(.54,.1,.1),new T.MeshStandardMaterial({color:0xffffff}));r.position.y=.4;const r2=r.clone();r2.rotation.y=1.57;g.add(b,r,r2);g.position.set(x,H(x,z),z);scene.add(g);gifts.push({g,x,z,alive:true,t:0})}
 pl={g:mkAvatar(S.hue||200,'',S.avatar||{}),x:0,z:6,ry:3.14,vy:0,jy:0,walk:0};scene.add(pl.g);
 const rs=()=>{R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',rs);rs();
 let dn=null;
 cv.addEventListener('pointerdown',e=>{dn={x:e.clientX,y:e.clientY};moved=0;try{cv.setPointerCapture(e.pointerId)}catch(_){}});
 cv.addEventListener('pointermove',e=>{if(dn){const dx=e.clientX-dn.x,dy=e.clientY-dn.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>6){cy-=dx*.006;cp=Math.max(.12,Math.min(1.2,cp+dy*.004))}dn.x=e.clientX;dn.y=e.clientY}
  if(tool&&tool.k){pick(e);scene.updateMatrixWorld(true);
   // محاذاة العناصر بحسب حدودها الفعلية، بدل إزاحة ثابتة تسبب تداخلًا أو فراغات.
   const hits=rc.intersectObjects(placed.map(p=>p.g),true);
   let stacked=false;
   for(const hit of hits){let obj=hit.object;while(obj&&!obj.userData.po)obj=obj.parent;const base=obj&&obj.userData.po;if(!base||!hit.face)continue;
    const normal=hit.face.normal.clone().applyMatrix3(new T.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();
    const d=DEFS[tool.k]&&DEFS[tool.k][tool.i],part=d&&tool.k==='p'?(PART_Y[d.b]||0):0;
    if(normal.y>.5){
     gpos.x=Math.round(hit.point.x*2)/2;gpos.z=Math.round(hit.point.z*2)/2;
     elev=Math.max(0,hit.point.y-H(gpos.x,gpos.z)-part);
    }else if(Math.abs(normal.x)>Math.abs(normal.z)||Math.abs(normal.z)>.5){
     // Use world-space bounding boxes so rotated objects and different sizes line up.
     const targetBox=new T.Box3().setFromObject(base.g);
     ghost.position.set(0,0,0);ghost.rotation.y=rot;ghost.updateMatrixWorld(true);
     const candidateBox=new T.Box3().setFromObject(ghost);
     const targetCX=(targetBox.min.x+targetBox.max.x)/2,targetCZ=(targetBox.min.z+targetBox.max.z)/2;
     const candidateCX=(candidateBox.min.x+candidateBox.max.x)/2,candidateCZ=(candidateBox.min.z+candidateBox.max.z)/2;
     if(Math.abs(normal.x)>=Math.abs(normal.z)){
      gpos.x=normal.x>=0?targetBox.max.x-candidateBox.min.x:targetBox.min.x-candidateBox.max.x;
      gpos.z=targetCZ-candidateCZ;
     }else{
      gpos.z=normal.z>=0?targetBox.max.z-candidateBox.min.z:targetBox.min.z-candidateBox.max.z;
      gpos.x=targetCX-candidateCX;
     }
     gpos.x=Math.max(-HALF+2,Math.min(HALF-2,gpos.x));
     gpos.z=Math.max(-HALF+2,Math.min(HALF-2,gpos.z));
     elev=base.e||0;
    }
    stacked=true;break;
   }
   if(!stacked){elev=manualElev;const h=rc.intersectObject(terrain)[0];if(h){gpos.x=Math.round(h.point.x*2)/2;gpos.z=Math.round(h.point.z*2)/2}}
   ghostPlace()
  }});
 cv.addEventListener('pointerup',e=>{if(dn&&moved<=6)onWorldClick(e);dn=null});
 cv.addEventListener('wheel',e=>{cd=Math.max(4,Math.min(18,cd+e.deltaY*.01))},{passive:true});
 let last=performance.now();const loop=now=>{requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000),t=now/1000;last=now;frame(dt,t)};requestAnimationFrame(loop)}
function hitPlaced(e){pick(e);const h=rc.intersectObjects(placed.filter(p=>!p.remoteOwner).map(p=>p.g),true)[0];if(!h)return null;let o=h.object;while(o&&!o.userData.po)o=o.parent;return o?o.userData.po:null}
function onWorldClick(e){if(!tool)return;
 if(tool==='move'){const po=hitPlaced(e);if(po){selectPlaced(po)}else{clearPlacedSelection();toast('انقر على عنصر لتحديده')}}
 else if(tool==='del'){const po=hitPlaced(e);if(po&&!po.remoteOwner){removeObj(po);if(po.k==='e')S.inv['e'+po.i]=(S.inv['e'+po.i]||0)+1;dirty();saveNow();refreshPanels();spark_toast('🗑 تم الحذف')}}
 else if(tool==='sel'){const po=hitPlaced(e);if(po)openScript(po)}
 else if(tool==='copy'){const po=hitPlaced(e);if(po){const d=DEFS[po.k]&&DEFS[po.k][po.i];if(!d)return;const key='e'+po.i;if(po.k==='e'&&!(S.inv[key]>0))return toast('لا توجد نسخة في الحقيبة — اجمع هدية أولًا');if(po.k==='e')S.inv[key]--;const x=Math.round((po.x+1.4*Math.cos(po.ry||0))*2)/2,z=Math.round((po.z-1.4*Math.sin(po.ry||0))*2)/2;const copy=placeObj({k:po.k,i:po.i,x,z,ry:po.ry||0,e:po.e||0});if(po.beh)copy.beh={...po.beh};S.xp+=1;dirty();saveNow();refreshPanels();toast('📋 تم نسخ العنصر')}}
 else if(tool.k){if(tool.k==='e'){const key='e'+tool.i;if(!(S.inv[key]>0))return toast('لا تملك هذا العنصر — اجمع الهدايا 🎁 أو اطلبه من صديق');S.inv[key]--}
  placeObj({k:tool.k,i:tool.i,x:gpos.x,z:gpos.z,ry:rot,e:elev});S.xp+=1;dirty();saveNow();refreshPanels()}}
const lerpAng=(a,b,t)=>{let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*t};
function syncPlayers(list){const ids=new Set(list.map(p=>p.id));for(const id in others)if(!ids.has(id)){scene.remove(others[id].g);delete others[id]}
 list.forEach(p=>{let o=others[p.id];if(!o){o={g:mkAvatar(p.hue,p.name),x:p.x,z:p.z,ry:p.ry,name:p.name,phase:0,walk:0};scene.add(o.g);others[p.id]=o}o.tx=Number(p.x)||0;o.tz=Number(p.z)||0;o.try=Number(p.ry)||0})}
function frame(dt,t){
 const k=keys;if(!ctl.lock){let ix=(k.right?1:0)-(k.left?1:0),iz=(k.up?1:0)-(k.down?1:0);if(ix||iz){const l=Math.hypot(ix,iz);ix/=l;iz/=l;const sp=(k.shift?7:4.6)*dt,fx=-Math.sin(cy),fz=-Math.cos(cy),rx=Math.cos(cy),rz=-Math.sin(cy),vx=(fx*iz+rx*ix)*sp,vz=(fz*iz+rz*ix)*sp;mv(vx,vz);pl.ry=lerpAng(pl.ry,Math.atan2(vx,vz),.25);pl.walk=1}else pl.walk=0;
  if(k.jump&&pl.jy<=.001){pl.vy=7;k.jump=false}}
 pl.jy+=pl.vy*dt;pl.vy-=22*dt;if(pl.jy<=0){pl.jy=0;pl.vy=0}
 const gy=Math.max(H(pl.x,pl.z),-.3);pl.g.position.set(pl.x,gy+pl.jy,pl.z);pl.g.rotation.y=pl.ry;const gait=pl.walk?Math.sin(t*12):0;const sw=gait*.08;pl.g.userData.f1.position.z=sw;pl.g.userData.f2.position.z=-sw;if(pl.g.userData.armL){pl.g.userData.armL.rotation.x=gait*.62;pl.g.userData.armR.rotation.x=-gait*.62;pl.g.userData.legL.rotation.x=-gait*.48;pl.g.userData.legR.rotation.x=gait*.48}pl.g.position.y+=pl.walk?Math.abs(Math.sin(t*12))*.045:0;
 if(ctl.lock)cy=lerpAng(cy,pl.ry+Math.PI,.06);
 const ty=pl.g.position.y+1.1;cam.position.set(pl.x+Math.sin(cy)*cd*Math.cos(cp),ty+Math.sin(cp)*cd,pl.z+Math.cos(cy)*cd*Math.cos(cp));cam.lookAt(pl.x,ty,pl.z);
 for(const id in others){const o=others[id],oldX=o.x,oldZ=o.z,blend=1-Math.exp(-dt*14);o.x+=(o.tx-o.x)*blend;o.z+=(o.tz-o.z)*blend;o.ry=lerpAng(o.ry,o.try,blend);const speed=Math.hypot(o.x-oldX,o.z-oldZ)/Math.max(dt,.001);o.walk=speed>.18?1:0;if(o.walk)o.phase+=dt*Math.min(14,7+speed*1.4);const gait=o.walk?Math.sin(o.phase):0;o.g.position.set(o.x,Math.max(H(o.x,o.z),-.3)+(o.walk?Math.abs(Math.sin(o.phase))*.035:0),o.z);o.g.rotation.y=o.ry;const u=o.g.userData,sw=gait*.08;if(u.f1)u.f1.position.z=sw;if(u.f2)u.f2.position.z=-sw;if(u.armL){u.armL.rotation.x=gait*.62;u.armR.rotation.x=-gait*.62;u.legL.rotation.x=-gait*.48;u.legR.rotation.x=gait*.48}}
 for(const po of placed){const u=po.g.userData;behave(po,dt,t);if(po.k==='e'&&ELS[po.i]){const kind=ELS[po.i].b,phase=(po.i%9)*.7;if(kind==='animal'){po.g.position.y=u.y0+Math.abs(Math.sin(t*2+phase))*.045;po.g.rotation.y=(u.ry0||0)+Math.sin(t*.55+phase)*.16}else if(['pine','round','palm','bamboo'].includes(kind)){po.g.rotation.z=Math.sin(t*.42+(u.x0||0)*.1)*.012;po.g.rotation.x=Math.cos(t*.38+(u.z0||0)*.1)*.01}}if(u.door){const near=Math.hypot(pl.x-po.x,pl.z-po.z)<2.4||u.force;u.open+=((near?1:0)-u.open)*Math.min(1,dt*6);u.door.rotation.y=-u.open*1.7}if(u.spin)u.spin.rotation.z+=dt*1.5}
 scene.traverse&&0;for(const g of gifts){if(!g.alive){if(t>g.t){g.alive=true;g.g.visible=true}continue}g.g.rotation.y+=dt*1.5;g.g.position.y=H(g.x,g.z)+Math.sin(t*3+g.x)*.12;if(Math.hypot(pl.x-g.x,pl.z-g.z)<1){g.alive=false;g.g.visible=false;g.t=t+45;onGift()}}
 clouds.forEach(c=>{c.position.x+=dt*.8;if(c.position.x>480)c.position.x=-480});
 let zi=0,bd=1e9;ZONES.forEach((q,i)=>{const d=Math.hypot(pl.x-q.x,pl.z-q.z)/q.r;if(d<bd){bd=d;zi=i}});if(bd<.8){if(zi!==curZone||!curZone&&zi===0){curZone=zi;onZone(zi)}}
 R.render(scene,cam)}
