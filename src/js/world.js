let THREE=null;
const worlds=new Map();
async function init3D(){
  try{
    THREE=await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
    setup3D($("#worldCanvas"));
    setup3D($("#worldCanvas2"));
    drawAll();
  }catch(err){
    console.error(err);
    $("#worldState").textContent="وضع احتياطي";
    $("#output").textContent="● تعذر تحميل محرك الرسوميات ثلاثي الأبعاد؛ بقية الموقع تعمل بصورة طبيعية.";
  }
}
function setup3D(canvas){
  if(!canvas||!THREE||worlds.has(canvas))return;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x8bcbd0);
  scene.fog=new THREE.Fog(0x8bcbd0,28,75);
  const camera=new THREE.PerspectiveCamera(52,1,.1,120);
  camera.position.set(13,11,16);
  const hemi=new THREE.HemisphereLight(0xdffcff,0x345448,2.2);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff2ce,3.2);sun.position.set(-12,22,10);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;scene.add(sun);
  const world={renderer,scene,camera,target:new THREE.Vector3(0,0,0),yaw:.7,pitch:.42,distance:34,drag:false,lx:0,ly:0,player:null,interactive:[]};
  createWorld(world);
  worlds.set(canvas,world);
  resize3D(world);
  canvas.addEventListener("pointerdown",e=>{world.drag=true;world.lx=e.clientX;world.ly=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener("pointermove",e=>{
    if(!world.drag)return;
    world.yaw-=(e.clientX-world.lx)*.008;world.pitch=Math.max(.15,Math.min(1.15,world.pitch+(e.clientY-world.ly)*.006));
    world.lx=e.clientX;world.ly=e.clientY;render3D(world);
  });
  ["pointerup","pointercancel"].forEach(k=>canvas.addEventListener(k,()=>world.drag=false));
  canvas.addEventListener("wheel",e=>{e.preventDefault();world.distance=Math.max(14,Math.min(68,world.distance+e.deltaY*.025));render3D(world)},{passive:false});canvas.addEventListener("dblclick",()=>{if(typeof updateNearby==="function")updateNearby()});
}
function mat(color,rough=.85){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:.05});
}
function box(world,w,h,d,color,x,y,z,opts={}){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,opts.roughness??.85));
  m.position.set(x,y,z);m.castShadow=opts.shadow!==false;m.receiveShadow=true;world.scene.add(m);return m;
}
function createWorld(w){
 const ground=box(w,90,.7,90,0x4f9b72,0,-.45,0,{shadow:false});box(w,86,.18,86,0x78bd70,0,-.02,0,{shadow:false});
 const water=new THREE.Mesh(new THREE.PlaneGeometry(25,86),new THREE.MeshStandardMaterial({color:0x3fadc4,roughness:.16,transparent:true,opacity:.9}));water.rotation.x=-Math.PI/2;water.position.set(-23,.05,0);w.scene.add(water);
 for(let z=-38;z<=38;z+=5){const wave=new THREE.Mesh(new THREE.TorusGeometry(.8,.05,6,18),new THREE.MeshBasicMaterial({color:0x9deaf1,transparent:true,opacity:.55}));wave.rotation.x=Math.PI/2;wave.position.set(-23,.16,z);w.scene.add(wave)}
 const path=new THREE.Mesh(new THREE.PlaneGeometry(7,78),mat(0xd7bd83));path.rotation.x=-Math.PI/2;path.position.set(1,.08,0);w.scene.add(path);
 for(let i=0;i<18;i++){const r=2+(i%4)*1.3;const h=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),mat(i%2?0x4b916f:0x5aa27b));h.scale.y=.65;h.position.set(-40+(i*13)%80,r*.42,-40+(i*19)%80);h.receiveShadow=true;w.scene.add(h)}
 for(let i=0;i<45;i++){const x=-40+(i*17)%80,z=-38+(i*29)%76;if(Math.abs(x)<10&&Math.abs(z)<12)continue;createTree(w,x,z,.85+(i%5)*.13)}
 for(let i=0;i<30;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.35+(i%4)*.2,0),mat(0x71858a));rock.scale.y=.6;rock.position.set(-40+(i*23)%80,.3,-40+(i*31)%80);rock.rotation.set(i*.3,i*.7,i*.2);w.scene.add(rock)}
 for(let z=-30;z<=30;z+=6)createLamp(w,5,z);
 w.house=createHouse(w,10,-4);w.house.visible=!!S.house;w.plantPool=[];for(let i=0;i<30;i++){const p=createPlant3D(w,0,0);p.visible=false;w.plantPool.push(p)}
 w.animals=[];for(let i=0;i<8;i++)w.animals.push(createAnimal(w,8+(i*7)%28,-28+(i*13)%56,i%2?"rabbit":"deer"));for(let i=0;i<7;i++)w.animals.push(createAnimal(w,-19+(i*6)%12,-28+(i*9)%56,"fish"));
 createInteractive(w,"🌳","شجرة","قطع","cut",17,7);createInteractive(w,"🚪","البيت","دخول","enter",10,-4);createInteractive(w,"💧","النهر","شرب","drink",-23,0);createInteractive(w,"🧑‍🌾","الحارس","تحدث","talk",7,12);createInteractive(w,"🐟","منطقة الصيد","صيد","fish",-18,8);createInteractive(w,"🪨","صخرة","تعدين","mine",-4,-12);createInteractive(w,"🌀","البوابة","دخول","portal",-12,14);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(2.4,.22,16,56),mat(0x9b7cff,.3));ring.position.set(-12,2.6,14);ring.rotation.x=Math.PI/2;w.scene.add(ring);
 const core=new THREE.Mesh(new THREE.CircleGeometry(2.1,48),new THREE.MeshBasicMaterial({color:0x493cbd,transparent:true,opacity:.5,side:THREE.DoubleSide}));core.position.set(-12,2.6,14);core.rotation.x=Math.PI/2;w.scene.add(core);
 const p=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.5,1,6,12),mat(0x3d83e8));body.position.y=1.15;p.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.5,20,16),mat(0xf0b889));head.position.y=2.1;p.add(head);const visor=new THREE.Mesh(new THREE.BoxGeometry(.65,.2,.08),new THREE.MeshStandardMaterial({color:0x172b43,metalness:.2,roughness:.25}));visor.position.set(0,2.13,.46);p.add(visor);const backpack=new THREE.Mesh(new THREE.BoxGeometry(.58,.8,.25),mat(0x253b5e));backpack.position.set(0,1.15,-.46);p.add(backpack);w.scene.add(p);w.player=p;
 const sky=new THREE.Mesh(new THREE.SphereGeometry(44,24,16),new THREE.MeshBasicMaterial({color:0x7fcbd1,side:THREE.BackSide}));w.scene.add(sky);
}
function createTree(w,x,z,s){
  const g=new THREE.Group();g.position.set(x,0,z);
  const trunk=box(w,.48,2,.48,0x704a31,0,1,0);g.add(trunk);trunk.castShadow=true;
  for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.SphereGeometry(1.35-(i*.15),16,12),mat(i===1?0x2f8c62:0x3aa06c));crown.position.set((i-1)*.55,2.2+(i%2)*.55,(i%2)*.35);crown.scale.y=.9;crown.castShadow=true;g.add(crown)}
  g.scale.setScalar(s);w.scene.add(g);
}
function createLamp(w,x,z){
  const pole=box(w,.12,2.8,.12,0x334858,x,1.4,z);pole.castShadow=true;
  const light=new THREE.PointLight(0xffd77d,1.4,6);light.position.set(x,2.9,z);w.scene.add(light);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.18,12,10),new THREE.MeshStandardMaterial({color:0xffdf91,emissive:0xffa83d,emissiveIntensity:2}));bulb.position.copy(light.position);w.scene.add(bulb);
}
function createHouse(w,x,z){const g=new THREE.Group();g.position.set(x,0,z);const body=box(w,6,3.4,5.2,0xd09258,0,1.7,0);g.add(body);const roof=new THREE.Mesh(new THREE.ConeGeometry(4.2,2.4,4),mat(0x704a52));roof.rotation.y=Math.PI/4;roof.position.set(0,4.5,0);roof.scale.z=.75;g.add(roof);g.add(box(w,1.1,2.1,.12,0x55372f,0,1.05,-2.62));g.add(box(w,1.1,1,.1,0x8bd7dc,-2,1.9,-2.64),box(w,1.1,1,.1,0x8bd7dc,2,1.9,-2.64));w.scene.add(g);return g;}

function createPlant3D(w,x,z){const g=new THREE.Group();g.position.set(x,0,z);g.add(box(w,.08,.75,.08,0x2e8759,0,.38,0));for(const dx of [-.18,.18]){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.23,10,8),mat(0x35c77a));leaf.scale.set(1,.45,1.5);leaf.position.set(dx,.65,0);g.add(leaf)}w.scene.add(g);return g;}
function createAnimal(w,x,z,type){const g=new THREE.Group();g.position.set(x,.2,z);g.userData={baseX:x,baseZ:z,phase:(x+z)%7};const fish=type==="fish";g.add(box(w,fish?1.1:.9,fish?.35:.65,fish?.35:.5,fish?0x55c9e5:0xc88b5b,0,.45,0));if(!fish){g.add(box(w,.55,.5,.5,0xd7a06d,.55,.65,0));g.add(box(w,.12,.25,.12,0x9d6649,.62,.95,-.2),box(w,.12,.25,.12,0x9d6649,.62,.95,.2));}else g.add(box(w,.2,.5,.5,0x3d93bd,-.65,.45,0));w.scene.add(g);return g;}
function createInteractive(w,icon,label,verb,action,x,z){const g=new THREE.Group();g.position.set(x,0,z);g.userData={icon,label,verb,action,x,z};g.add(box(w,.12,1.8,.12,0x304b5a,0,.9,0));const m=new THREE.Mesh(new THREE.SphereGeometry(.42,14,12),new THREE.MeshStandardMaterial({color:0x58e0d0,emissive:0x174b49,emissiveIntensity:1.5}));m.position.y=2;g.add(m);w.scene.add(g);w.interactive.push(g);}
function updateNearby(){let best=null,d0=Infinity;for(const w of worlds.values())for(const g of w.interactive||[]){const d=Math.hypot(S.player.x-g.userData.x,S.player.z-g.userData.z);if(d<4&&d<d0){best=g.userData;d0=d}}const e=$("#nearby"),a=$("#nearbyActions");if(!e||!a)return;if(!best){e.hidden=true;return}e.hidden=false;a.innerHTML='<button>'+best.icon+' '+best.verb+' '+best.label+'</button>';a.firstElementChild.onclick=()=>performInteraction(best.action);}
function performInteraction(action){
 if(action==="cut"){S.wood++;toast("🪵 قطعت خشبًا");}
 else if(action==="enter"){toast("🏠 دخلت البيت");}
 else if(action==="drink"){S.food=(S.food||0)+1;toast("💧 شربت من النهر");}
 else if(action==="talk"){S.xp+=15;toast("🧑‍🌾 تحدثت مع الحارس · +15 XP");}
 else if(action==="fish"){S.fish=(S.fish||0)+1;S.gem++;toast("🎣 اصطدت سمكة");}
 else if(action==="mine"){S.gem++;toast("⛏ حصلت على جوهرة");}
 else if(action==="portal"){toast("🌀 البوابة ستفتح منطقة جديدة لاحقًا");}
 save();updateUI();drawAll();
}

function animatePlayer(type){return new Promise(resolve=>{const start=performance.now();for(const w of worlds.values())w.anim={type,start,duration:type==="jump"?550:420};function tick(now){let done=true;for(const w of worlds.values()){const p=Math.min(1,(now-w.anim.start)/w.anim.duration);w.anim.p=p;render3D(w);if(p<1)done=false}if(!done)requestAnimationFrame(tick);else{for(const w of worlds.values())w.anim=null;resolve()}}requestAnimationFrame(tick)})}
function animatePulse(){return new Promise(r=>setTimeout(r,280))}
function animateWorldAction(type){for(const w of worlds.values())w.actionAnim={type,start:performance.now()};return new Promise(r=>setTimeout(r,700))}

function resize3D(w){
  const r=w.renderer.domElement.getBoundingClientRect(),width=Math.max(1,r.width),height=Math.max(1,r.height);
  w.renderer.setSize(width,height,false);w.camera.aspect=width/height;w.camera.updateProjectionMatrix();
}
function render3D(w){if(!THREE)return;const c=w.camera,h=Math.cos(w.pitch)*w.distance;c.position.set(Math.cos(w.yaw)*h,Math.sin(w.pitch)*w.distance,Math.sin(w.yaw)*h);c.lookAt(w.target);if(w.player){w.player.position.x=S.player.x*1.7;w.player.position.z=S.player.z*1.7;w.player.position.y=w.anim&&w.anim.type==="jump"?Math.sin(w.anim.p*Math.PI)*2.2:0;w.player.rotation.y=S.rotation*Math.PI/2}if(w.house){w.house.visible=!!S.house;if(S.house&&w.actionAnim?.type==="build"){const p=Math.min(1,(performance.now()-w.actionAnim.start)/700);w.house.scale.setScalar(.2+.8*p)}}if(w.plantPool)w.plantPool.forEach((p,i)=>{const s=S.plants[i];p.visible=!!s;if(s){p.position.x=s.x*1.7;p.position.z=s.z*1.7}});if(w.animals)w.animals.forEach(a=>{a.position.x=a.userData.baseX+Math.sin(performance.now()/1800+a.userData.phase)*.8;a.position.z=a.userData.baseZ+Math.cos(performance.now()/2100+a.userData.phase)*.5});w.renderer.render(w.scene,c);}

function drawAll(){for(const w of worlds.values()){resize3D(w);render3D(w)}}
window.addEventListener("resize",drawAll);
