// العالم ثلاثي الأبعاد: تضاريس ملونة، مناطق، لاعب، بناء، سلوكيات العناصر، لاعبون آخرون
const T=THREE,HALF=60;
const hs=(x,z)=>{let h=Math.imul(x|0,374761393)+Math.imul(z|0,668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295};
const sm=t=>t*t*(3-2*t),vn=(x,z)=>{const i=Math.floor(x),j=Math.floor(z),fx=sm(x-i),fz=sm(z-j),a=hs(i,j),b=hs(i+1,j),c=hs(i,j+1),d=hs(i+1,j+1);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz};
const fbm=(x,z)=>{let a=.5,f=1,s=0;for(let i=0;i<4;i++){s+=vn(x*f,z*f)*a;a/=2;f*=2}return s/.9375},gs=(d,r)=>Math.exp(-d*d/(r*r));
function H(x,z){let h=(fbm(x/22+3,z/22)-.5)*5;const d=i=>Math.hypot(x-ZONES[i].x,z-ZONES[i].z);h+=gs(d(4),16)*15;h-=gs(d(2),12)*5.5;const sp=Math.min(1,Math.hypot(x,z)/14);h*=sp*sp*(3-2*sp);return h-Math.max(0,Math.max(Math.abs(x),Math.abs(z))/HALF-.85)*70}
function tcol(x,z,h){let c=[.45,.85,.35];const zw=i=>gs(Math.hypot(x-ZONES[i].x,z-ZONES[i].z),ZONES[i].r*.75),mix=(a,w)=>{w=Math.min(1,w);for(let i=0;i<3;i++)c[i]+=(a[i]-c[i])*w};
 mix([.2,.66,.3],zw(1)*1.2);mix([.98,.84,.45],zw(3)*1.3);mix([.95,.97,1],zw(4)*1.3+Math.max(0,h-9)*.2);mix([1,.74,.86],zw(5)*.7);if(h<.4)mix([.99,.9,.6],(.4-h)*2);if(h<-.3)mix([.45,.78,.88],1);const n=.93+hs(x*3,z*3)*.14;return c.map(v=>v*n)}
const GEO={sph:a=>new T.SphereGeometry(a[0],12,10),box:a=>new T.BoxGeometry(a[0],a[1],a[2]),cyl:a=>new T.CylinderGeometry(a[0],a[1],a[2],10),cone:a=>new T.ConeGeometry(a[0],a[1],8),pyr:a=>new T.ConeGeometry(a[0],a[1],4),oct:a=>new T.OctahedronGeometry(a[0]),ico:a=>new T.IcosahedronGeometry(a[0],0),tor:a=>new T.TorusGeometry(a[0],a[1],8,18,a[2]||6.283)};
function mk(b,c,ghost){const g=new T.Group();
 const add=(p,par)=>{const[s,d,col,x,y,z,sx,sy,sz,rx,ry,rz]=p,cc=col==='c'?c:col,m=new T.Mesh(GEO[s](d),new T.MeshStandardMaterial({color:cc,roughness:.65,flatShading:s==='ico'||s==='oct',emissive:col==='c'&&EM.has(b)?cc:0,emissiveIntensity:.4,transparent:!!ghost,opacity:ghost?.5:1}));
  m.position.set(x||0,y||0,z||0);m.scale.set(sx||1,sy||1,sz||1);m.rotation.set(rx||0,ry||0,rz||0);if(col==='c')m.userData.tint=1;(par||g).add(m)};
 if(b==='door'){add(['box',[.1,1.1,.2],0xf5f5f5,-.48,.55,0]);add(['box',[.1,1.1,.2],0xf5f5f5,.48,.55,0]);add(['box',[1,.12,.2],0xf5f5f5,0,1.06,0]);const pv=new T.Group();pv.position.set(-.45,0,0);add(['box',[.86,1,.08],'c',.43,.5,0],pv);add(['sph',[.05],0xffd23f,.78,.5,.06],pv);g.add(pv);g.userData.door=pv;g.userData.open=0}
 else{(B[b]||B.rock).forEach(p=>add(p));if(b==='mill'){const bl=new T.Group();bl.position.set(0,1.3,.38);for(let i=0;i<4;i++){const sg=new T.Group();sg.rotation.z=i*1.5708;add(['box',[.12,.7,.02],0xffffff,0,.35,0],sg);bl.add(sg)}g.add(bl);g.userData.spin=bl}}
 return g}
function mkAvatar(hue,name){const g=new T.Group(),col=new T.Color().setHSL(hue/360,.75,.58),M=(geo,c,x,y,z,sx,sy,sz)=>{const m=new T.Mesh(geo,new T.MeshStandardMaterial({color:c,roughness:.6}));m.position.set(x,y,z);m.scale.set(sx||1,sy||1,sz||1);g.add(m);return m};
 M(new T.SphereGeometry(.3,14,12),col,0,.5,0,1,1.15,.95);M(new T.SphereGeometry(.26,14,12),0xffe3c4,0,1.05,0);M(new T.SphereGeometry(.04,8,6),0x222222,-.09,1.08,.23);M(new T.SphereGeometry(.04,8,6),0x222222,.09,1.08,.23);
 M(new T.SphereGeometry(.05,8,6),0xff8fb0,-.17,1,.2);M(new T.SphereGeometry(.05,8,6),0xff8fb0,.17,1,.2);M(new T.ConeGeometry(.2,.25,10),col,0,1.4,0);
 g.userData.f1=M(new T.SphereGeometry(.1,8,6),0x333355,-.12,.08,.04);g.userData.f2=M(new T.SphereGeometry(.1,8,6),0x333355,.12,.08,.04);
 if(name){const cv=document.createElement('canvas');cv.width=256;cv.height=64;const x=cv.getContext('2d');x.font='bold 34px sans-serif';x.textAlign='center';x.fillStyle='rgba(255,255,255,.9)';x.fillRect(0,8,256,48);x.fillStyle='#2b2a5a';x.fillText(name,128,46);const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv),depthTest:false}));sp.scale.set(2,.5,1);sp.position.y=2;g.add(sp)}
 return g}
let R,scene,cam,terrain,pl,placed=[],cols=[],others={},ghost=null,tool=null,elev=0,rot=0,cy=0,cp=.45,cd=8,keys={},ctl={lock:false},gifts=[],clouds=[],curZone=0,gpos={x:0,z:0},rc=new T.Raycaster(),moved=0;
const walkable=(x,z)=>Math.abs(x)<HALF-2&&Math.abs(z)<HALF-2&&H(x,z)>-.45;
function collide(x,z){let ax=x,az=z;for(const c of cols){if(c.door&&c.o.g.userData.open>.5)continue;if((c.o.e||0)>1.2)continue;const dx=ax-c.x,dz=az-c.z,s=Math.sin(c.ry),co=Math.cos(c.ry),lx=dx*co-dz*s,lz=dx*s+dz*co,qx=Math.max(-c.hx,Math.min(c.hx,lx)),qz=Math.max(-c.hz,Math.min(c.hz,lz)),ex=lx-qx,ez=lz-qz,d=Math.hypot(ex,ez);
  if(d<.3){const nx=d>1e-4?ex/d:0,nz=d>1e-4?ez/d:1,pu=.3-d+.002,wx=nx*pu,wz=nz*pu;ax+=wx*co+wz*s;az+=-wx*s+wz*co}}return[ax,az]}
function mv(dx,dz){const nx=pl.x+dx,nz=pl.z+dz;if(!walkable(nx,nz))return false;const[a,b]=collide(nx,nz);if(!walkable(a,b))return false;pl.x=a;pl.z=b;return true}
const PART_Y={roof:1.1,balcony:.55,chimney:1.1};
function placeObj(po){const d=DEFS[po.k][po.i],g=mk(d.b,d.c),y=Math.max(H(po.x,po.z),-.3)+(po.e||0)+(po.k==='p'&&PART_Y[d.b]||0);g.position.set(po.x,y,po.z);g.rotation.y=po.ry||0;Object.assign(g.userData,{po,x0:po.x,y0:y,z0:po.z,ry0:po.ry||0});po.g=g;scene.add(g);placed.push(po);
 const s=SOLID[d.b];if(po.k==='p'&&s)cols.push({o:po,x:po.x,z:po.z,ry:po.ry||0,hx:s[0],hz:s[1],door:d.b==='door'});return po}
function removeObj(po){scene.remove(po.g);placed.splice(placed.indexOf(po),1);const i=cols.findIndex(c=>c.o===po);if(i>=0)cols.splice(i,1)}
function behave(po,dt,t){const b=po.beh,g=po.g,u=g.userData;if(!b)return;const p=b.p||4,w=(t+u.x0)%1000;
 if(b.t==='spin')g.rotation.y=u.ry0+w*6.283/p;else if(b.t==='bounce')g.position.y=u.y0+Math.abs(Math.sin(w*3.14159/p*2))*.7;else if(b.t==='sway')g.rotation.z=Math.sin(w*6.283/p)*.25;
 else if(b.t==='pulse')g.scale.setScalar(1+Math.sin(w*6.283/p)*.25);else if(b.t==='slide'){const a=Math.sin(w*6.283/p)*2;g.position.x=u.x0+Math.cos(u.ry0)*a;g.position.z=u.z0-Math.sin(u.ry0)*a}
 else if(b.t==='color'){const h=(w/p)%1;g.traverse(m=>{if(m.isMesh&&m.userData.tint)m.material.color.setHSL(h,.8,.6)})}
 else if(b.t==='swing'){u.force=Math.floor(w/p)%2===0?1:0;if(!u.door)g.rotation.z+=((u.force?1.1:0)-g.rotation.z)*Math.min(1,dt*3)}}
function clearBeh(po){const g=po.g,u=g.userData;g.rotation.set(0,u.ry0,0);g.scale.setScalar(1);g.position.set(u.x0,u.y0,u.z0);u.force=0;g.traverse(m=>{if(m.isMesh&&m.userData.tint){const d=DEFS[po.k][po.i];m.material.color.setHex(d.c)}})}
function setTool(t){tool=t;if(ghost){scene.remove(ghost);ghost=null}if(t&&t.k){const d=DEFS[t.k][t.i];ghost=mk(d.b,d.c,true);ghost.visible=false;scene.add(ghost)}document.getElementById('bt').classList.toggle('on',!!t)}
function ghostPlace(){if(!ghost)return;const d=DEFS[tool.k][tool.i];ghost.position.set(gpos.x,Math.max(H(gpos.x,gpos.z),-.3)+elev+(tool.k==='p'&&PART_Y[d.b]||0),gpos.z);ghost.rotation.y=rot;ghost.visible=true}
function pick(e){const r=R.domElement.getBoundingClientRect();rc.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam)}
function initWorld(){
 const cv=document.getElementById('cv');R=new T.WebGLRenderer({canvas:cv,antialias:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.outputEncoding=T.sRGBEncoding;
 scene=new T.Scene();scene.background=new T.Color(0x55d7ff);scene.fog=new T.Fog(0x9cecff,65,190);cam=new T.PerspectiveCamera(55,1,.1,300);
 scene.add(new T.HemisphereLight(0xffffff,0x72e0a1,1.15));const sun=new T.DirectionalLight(0xfff3d0,.9);sun.position.set(40,70,25);scene.add(sun);
 const geo=new T.PlaneGeometry(HALF*2,HALF*2,120,120);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,col=[];
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),h=H(x,z);pos.setY(i,h);col.push(...tcol(x,z,h))}geo.setAttribute('color',new T.Float32BufferAttribute(col,3));geo.computeVertexNormals();
 terrain=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.95}));scene.add(terrain);
 const wt=new T.Mesh(new T.PlaneGeometry(400,400),new T.MeshStandardMaterial({color:0x18dce8,transparent:true,opacity:.86,roughness:.16}));wt.rotation.x=-Math.PI/2;wt.position.y=-.7;scene.add(wt);
 for(let i=0;i<10;i++){const g=new T.Group();for(let j=0;j<4;j++){const s=new T.Mesh(new T.SphereGeometry(2+Math.random()*2,10,8),new T.MeshBasicMaterial({color:0xffffff,fog:false}));s.position.set(j*2.6-4,Math.random(),Math.random()*1.5);g.add(s)}g.position.set(Math.random()*240-120,28+Math.random()*10,Math.random()*240-120);scene.add(g);clouds.push(g)}
 // زرع العناصر في المناطق
 const sets={0:['flower','tulip','bush','grass','round'],1:['pine','round','mushroom','fern','bamboo'],2:['palm','bamboo','flower','grass'],3:['cactus','rock','palm'],4:['pine','rock','snowman'],5:['house','lamp','flower','bush']};
 for(let n=0;n<340;n++){const x=(hs(n,7)-.5)*(HALF*1.8),z=(hs(n,13)-.5)*(HALF*1.8);if(Math.hypot(x,z)<5||H(x,z)<-.2)continue;let zi=0,bd=1e9;ZONES.forEach((q,i)=>{const d=Math.hypot(x-q.x,z-q.z)/q.r;if(d<bd){bd=d;zi=i}});if(bd>1.15)continue;
  const ok=ELS.filter(e=>sets[zi].includes(e.b)&&(zi!==4||e.c>0xe0e0e0||e.b==='rock'||e.b==='snowman'));if(!ok.length)continue;const d=ok[(hs(n,3)*ok.length)|0],g=mk(d.b,d.c);g.position.set(x,H(x,z),z);g.rotation.y=hs(n,5)*6.28;const s=.8+hs(n,9)*.6;g.scale.setScalar(d.b==='house'?1.3:s);scene.add(g)}
 // صناديق الهدايا
 for(let n=0;n<34;n++){const x=(hs(n,21)-.5)*100,z=(hs(n,23)-.5)*100;if(H(x,z)<0||Math.hypot(x,z)<4)continue;const g=new T.Group(),c=new T.Color().setHSL(hs(n,2),.8,.6);const b=new T.Mesh(new T.BoxGeometry(.5,.5,.5),new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.3}));b.position.y=.4;const r=new T.Mesh(new T.BoxGeometry(.54,.1,.1),new T.MeshStandardMaterial({color:0xffffff}));r.position.y=.4;const r2=r.clone();r2.rotation.y=1.57;g.add(b,r,r2);g.position.set(x,H(x,z),z);scene.add(g);gifts.push({g,x,z,alive:true,t:0})}
 pl={g:mkAvatar(S.hue||200),x:0,z:6,ry:3.14,vy:0,jy:0,walk:0};scene.add(pl.g);
 const rs=()=>{R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',rs);rs();
 let dn=null;
 cv.addEventListener('pointerdown',e=>{dn={x:e.clientX,y:e.clientY};moved=0;try{cv.setPointerCapture(e.pointerId)}catch(_){}});
 cv.addEventListener('pointermove',e=>{if(dn){const dx=e.clientX-dn.x,dy=e.clientY-dn.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>6){cy-=dx*.006;cp=Math.max(.12,Math.min(1.2,cp+dy*.004))}dn.x=e.clientX;dn.y=e.clientY}
  if(tool&&tool.k){pick(e);const h=rc.intersectObject(terrain)[0];if(h){gpos.x=Math.round(h.point.x*2)/2;gpos.z=Math.round(h.point.z*2)/2;ghostPlace()}}});
 cv.addEventListener('pointerup',e=>{if(dn&&moved<=6)onWorldClick(e);dn=null});
 cv.addEventListener('wheel',e=>{cd=Math.max(4,Math.min(18,cd+e.deltaY*.01))},{passive:true});
 let last=performance.now();const loop=now=>{requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000),t=now/1000;last=now;frame(dt,t)};requestAnimationFrame(loop)}
function hitPlaced(e){pick(e);const h=rc.intersectObjects(placed.map(p=>p.g),true)[0];if(!h)return null;let o=h.object;while(o&&!o.userData.po)o=o.parent;return o?o.userData.po:null}
function onWorldClick(e){if(!tool)return;
 if(tool==='del'){const po=hitPlaced(e);if(po){removeObj(po);if(po.k==='e')S.inv['e'+po.i]=(S.inv['e'+po.i]||0)+1;dirty();refreshPanels();spark_toast('🗑 تم الحذف')}}
 else if(tool==='sel'){const po=hitPlaced(e);if(po)openScript(po)}
 else if(tool==='copy'){const po=hitPlaced(e);if(po){const d=DEFS[po.k]&&DEFS[po.k][po.i];if(!d)return;const key='e'+po.i;if(po.k==='e'&&!(S.inv[key]>0))return toast('لا توجد نسخة في الحقيبة — اجمع هدية أولًا');if(po.k==='e')S.inv[key]--;const x=Math.round((po.x+1.4*Math.cos(po.ry||0))*2)/2,z=Math.round((po.z-1.4*Math.sin(po.ry||0))*2)/2;const copy=placeObj({k:po.k,i:po.i,x,z,ry:po.ry||0,e:po.e||0});if(po.beh)copy.beh={...po.beh};S.xp+=1;dirty();refreshPanels();toast('📋 تم نسخ العنصر')}}
 else if(tool.k){if(tool.k==='e'){const key='e'+tool.i;if(!(S.inv[key]>0))return toast('لا تملك هذا العنصر — اجمع الهدايا 🎁 أو اطلبه من صديق');S.inv[key]--}
  placeObj({k:tool.k,i:tool.i,x:gpos.x,z:gpos.z,ry:rot,e:elev});S.xp+=1;dirty();refreshPanels()}}
const lerpAng=(a,b,t)=>{let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*t};
function syncPlayers(list){const ids=new Set(list.map(p=>p.id));for(const id in others)if(!ids.has(id)){scene.remove(others[id].g);delete others[id]}
 list.forEach(p=>{let o=others[p.id];if(!o){o={g:mkAvatar(p.hue,p.name),x:p.x,z:p.z,ry:p.ry,name:p.name};scene.add(o.g);others[p.id]=o}o.tx=p.x;o.tz=p.z;o.try=p.ry})}
function frame(dt,t){
 const k=keys;if(!ctl.lock){let ix=(k.right?1:0)-(k.left?1:0),iz=(k.up?1:0)-(k.down?1:0);if(ix||iz){const l=Math.hypot(ix,iz);ix/=l;iz/=l;const sp=(k.shift?7:4.6)*dt,fx=-Math.sin(cy),fz=-Math.cos(cy),rx=Math.cos(cy),rz=-Math.sin(cy),vx=(fx*iz+rx*ix)*sp,vz=(fz*iz+rz*ix)*sp;mv(vx,vz);pl.ry=lerpAng(pl.ry,Math.atan2(vx,vz),.25);pl.walk=1}else pl.walk=0;
  if(k.jump&&pl.jy<=.001){pl.vy=7;k.jump=false}}
 pl.jy+=pl.vy*dt;pl.vy-=22*dt;if(pl.jy<=0){pl.jy=0;pl.vy=0}
 const gy=Math.max(H(pl.x,pl.z),-.3);pl.g.position.set(pl.x,gy+pl.jy,pl.z);pl.g.rotation.y=pl.ry;const sw=pl.walk?Math.sin(t*14)*.08:0;pl.g.userData.f1.position.z=.04+sw;pl.g.userData.f2.position.z=.04-sw;pl.g.position.y+=pl.walk?Math.abs(Math.sin(t*14))*.05:0;
 if(ctl.lock)cy=lerpAng(cy,pl.ry+Math.PI,.06);
 const ty=pl.g.position.y+1.1;cam.position.set(pl.x+Math.sin(cy)*cd*Math.cos(cp),ty+Math.sin(cp)*cd,pl.z+Math.cos(cy)*cd*Math.cos(cp));cam.lookAt(pl.x,ty,pl.z);
 for(const id in others){const o=others[id];o.x+=(o.tx-o.x)*Math.min(1,dt*6);o.z+=(o.tz-o.z)*Math.min(1,dt*6);o.ry=lerpAng(o.ry,o.try,.2);o.g.position.set(o.x,Math.max(H(o.x,o.z),-.3),o.z);o.g.rotation.y=o.ry}
 for(const po of placed){const u=po.g.userData;behave(po,dt,t);if(u.door){const near=Math.hypot(pl.x-po.x,pl.z-po.z)<2.4||u.force;u.open+=((near?1:0)-u.open)*Math.min(1,dt*6);u.door.rotation.y=-u.open*1.7}if(u.spin)u.spin.rotation.z+=dt*1.5}
 scene.traverse&&0;for(const g of gifts){if(!g.alive){if(t>g.t){g.alive=true;g.g.visible=true}continue}g.g.rotation.y+=dt*1.5;g.g.position.y=H(g.x,g.z)+Math.sin(t*3+g.x)*.12;if(Math.hypot(pl.x-g.x,pl.z-g.z)<1){g.alive=false;g.g.visible=false;g.t=t+45;onGift()}}
 clouds.forEach(c=>{c.position.x+=dt*.8;if(c.position.x>130)c.position.x=-130});
 let zi=0,bd=1e9;ZONES.forEach((q,i)=>{const d=Math.hypot(pl.x-q.x,pl.z-q.z)/q.r;if(d<bd){bd=d;zi=i}});if(bd<.8){if(zi!==curZone||!curZone&&zi===0){curZone=zi;onZone(zi)}}
 R.render(scene,cam)}
