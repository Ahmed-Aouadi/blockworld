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
    $("#worldState").textContent="تعذر تشغيل العالم";
    $("#output").textContent="● محرك العالم ثلاثي الأبعاد لم يتم تحميله. بقية المنصة تعمل بصورة طبيعية.";
  }
}

function setup3D(canvas){
  if(!canvas||!THREE||worlds.has(canvas))return;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x87a9ad);
  scene.fog=new THREE.FogExp2(0x8ba6a4,.0085);

  const camera=new THREE.PerspectiveCamera(58,1,.1,220);
  const hemi=new THREE.HemisphereLight(0xc9e5e4,0x18271f,1.65);
  scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe2ad,3.8);
  sun.position.set(-35,55,25);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-55;sun.shadow.camera.right=55;sun.shadow.camera.top=55;sun.shadow.camera.bottom=-55;
  sun.shadow.camera.near=1;sun.shadow.camera.far=150;
  scene.add(sun);

  const world={
    renderer,scene,camera,sun,
    target:new THREE.Vector3(0,1.3,0),
    yaw:.25,pitch:.30,distance:14,drag:false,lx:0,ly:0,
    player:null,interactive:[],animals:[],water:null,waterTime:0,
    actionAnim:null,anim:null,keys:{},time:0
  };
  createCinematicWorld(world);
  worlds.set(canvas,world);
  resize3D(world);

  canvas.addEventListener("pointerdown",e=>{
    world.drag=true;world.lx=e.clientX;world.ly=e.clientY;canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener("pointermove",e=>{
    if(!world.drag)return;
    world.yaw-=(e.clientX-world.lx)*.006;
    world.pitch=Math.max(.05,Math.min(.75,world.pitch+(e.clientY-world.ly)*.004));
    world.lx=e.clientX;world.ly=e.clientY;
  });
  ["pointerup","pointercancel"].forEach(k=>canvas.addEventListener(k,()=>world.drag=false));
  canvas.addEventListener("wheel",e=>{
    e.preventDefault();
    world.distance=Math.max(7,Math.min(28,world.distance+e.deltaY*.018));
  },{passive:false});

  if(!world._keysBound){
    world._keysBound=true;
    window.addEventListener("keydown",e=>{
      world.keys[e.key.toLowerCase()]=true;
      if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase()))e.preventDefault();
    });
    window.addEventListener("keyup",e=>{world.keys[e.key.toLowerCase()]=false});
  }
}

function material(color,rough=.86,metal=0){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
}
function box(w,ww,hh,dd,color,x,y,z,opts={}){
  const m=new THREE.Mesh(new THREE.BoxGeometry(ww,hh,dd),material(color,opts.roughness??.86,opts.metal??0));
  m.position.set(x,y,z);m.castShadow=opts.shadow!==false;m.receiveShadow=true;w.scene.add(m);return m;
}
function stone(w,r,h,color,x,z){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r*.82,r,h,7,1),material(color,.96));
  m.position.set(x,h/2-.03,z);m.rotation.y=Math.random()*Math.PI;m.castShadow=true;m.receiveShadow=true;w.scene.add(m);return m;
}
function foliage(w,x,y,z,s=1){
  const g=new THREE.Group();g.position.set(x,y,z);
  const colors=[0x244f3c,0x2d6a4d,0x3d7955,0x1d4336];
  for(let i=0;i<5;i++){
    const leaf=new THREE.Mesh(new THREE.DodecahedronGeometry(.8*s,1),material(colors[i%colors.length],.98));
    leaf.position.set((i-2)*.42*s,(i%2)*.48*s,(i%3-.9)*.35*s);
    leaf.scale.y=1.2;leaf.castShadow=true;g.add(leaf);
  }
  w.scene.add(g);return g;
}

function createCinematicWorld(w){
  // layered jungle terrain
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150,1,1),material(0x344d3c,.98));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;w.scene.add(ground);

  // playable clearings
  for(let i=0;i<16;i++){
    const r=5+(i%4)*1.5;
    const island=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.08,.55,12),material(i%2?0x587052:0x465e49,.98));
    island.position.set(-42+(i*19)%84,.12,-42+(i*31)%84);
    island.scale.z=.75;island.castShadow=true;island.receiveShadow=true;w.scene.add(island);
  }

  // cliffs and canyon walls
  for(let i=0;i<14;i++){
    const x=i%2?-43-i*.8:43+i*.55;
    const z=-40+i*6.2;
    const rock=stone(w,4.5+(i%3),7+(i%4)*2,0x3b4640,x,z);
    rock.scale.z=1.3;
  }
  for(let i=0;i<8;i++){
    const rock=stone(w,3.2+(i%2),5+(i%3)*1.5,0x4b5147,-22+i*6,35);
    rock.scale.z=.65;
  }

  // river + waterfall pool
  const river=new THREE.Mesh(new THREE.PlaneGeometry(13,110,1,8),new THREE.MeshStandardMaterial({
    color:0x397f87,roughness:.18,metalness:.02,transparent:true,opacity:.88
  }));
  river.rotation.x=-Math.PI/2;river.position.set(-15,.14,0);w.scene.add(river);w.water=river;
  const pool=new THREE.Mesh(new THREE.CylinderGeometry(9,10,.22,32),new THREE.MeshStandardMaterial({color:0x2d7880,roughness:.16,transparent:true,opacity:.92}));
  pool.position.set(-4,.13,-28);w.scene.add(pool);
  for(let i=0;i<9;i++){
    const fall=new THREE.Mesh(new THREE.PlaneGeometry(2.5+(i%3)*.4,6+(i%2)*2),new THREE.MeshStandardMaterial({color:0xbbecef,transparent:true,opacity:.42,side:THREE.DoubleSide}));
    fall.position.set(-4+i*.8,4+(i%2),-36);fall.rotation.y=(i-4)*.05;w.scene.add(fall);
  }

  // ancient path, ruins and temple
  const path=new THREE.Mesh(new THREE.PlaneGeometry(5.5,74),material(0x82745b,.95));
  path.rotation.x=-Math.PI/2;path.position.set(2,.2,0);w.scene.add(path);
  createTemple(w,-3,-33);
  createRuins(w,24,-18);
  createBridge(w,14,9);

  // jungle
  for(let i=0;i<72;i++){
    const x=-38+(i*17)%76,z=-42+(i*29)%82;
    if(Math.abs(x)<9&&Math.abs(z)<12)continue;
    createJungleTree(w,x,z,.8+(i%5)*.13);
  }
  for(let i=0;i<44;i++){
    const x=-39+(i*23)%78,z=-40+(i*13)%80;
    foliage(w,x,.2,z,.65+(i%4)*.12);
  }
  for(let i=0;i<55;i++){
    const r=.35+(i%5)*.17;
    const rock=stone(w,r,.5+(i%4)*.25,0x5d665c,-39+(i*17)%78,-39+(i*27)%78);
    rock.rotation.z=(i%5)*.13;
  }

  // torches / warm adventure lighting
  for(const p of [[-8,-22],[9,-22],[17,7],[-10,12],[6,-31]]){
    createTorch(w,p[0],p[1]);
  }

  // collectibles / interaction anchors
  createInteractive(w,"🌿","نبات","جمع","cut",18,4);
  createInteractive(w,"🏛️","معبد","دخول","enter",-3,-30);
  createInteractive(w,"💧","الشلال","شرب","drink",-5,-30);
  createInteractive(w,"🧑‍🌾","المرشد","تحدث","talk",7,13);
  createInteractive(w,"🐟","النهر","صيد","fish",-15,8);
  createInteractive(w,"🪨","أثر قديم","تعدين","mine",24,-18);
  createInteractive(w,"🌀","البوابة","دخول","portal",-18,28);

  // animals
  for(let i=0;i<10;i++)w.animals.push(createAnimal(w,9+(i*7)%25,-26+(i*11)%55,i%3===0?"deer":"boar"));
  for(let i=0;i<6;i++)w.animals.push(createAnimal(w,-15+(i%3)*2,-25+i*9,"fish"));

  // player - stylized adventurer silhouette
  const p=new THREE.Group();
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.9,6,12),material(0x273b42,.72));
  torso.position.y=1.25;p.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.39,20,16),material(0xb97955,.78));head.position.y=2.15;p.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.42,18,12),material(0x2a201c,.9));hair.scale.y=.58;hair.position.set(0,2.37,0);p.add(hair);
  const pack=new THREE.Mesh(new THREE.BoxGeometry(.7,.75,.28),material(0x4b3328,.82));pack.position.set(0,1.25,-.48);p.add(pack);
  const scarf=new THREE.Mesh(new THREE.TorusGeometry(.38,.07,8,20),material(0xa24b37,.8));scarf.position.y=1.8;scarf.rotation.x=Math.PI/2;p.add(scarf);
  p.castShadow=true;w.scene.add(p);w.player=p;

  // portal
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.3,.18,16,48),material(0x69e3d7,.32,0.25));
  ring.position.set(-18,2.5,28);ring.rotation.x=Math.PI/2;w.scene.add(ring);w.portal=ring;

  // atmospheric sky dome
  const sky=new THREE.Mesh(new THREE.SphereGeometry(110,32,18),new THREE.MeshBasicMaterial({color:0x8baaa7,side:THREE.BackSide}));
  w.scene.add(sky);

  // distant mountain silhouettes
  for(let i=0;i<9;i++){
    const m=new THREE.Mesh(new THREE.ConeGeometry(8+(i%3)*3,15+(i%4)*4,7),material(0x43534d,.98));
    m.position.set(-55+i*14,7,-58);m.scale.z=.65;w.scene.add(m);
  }
}

function createJungleTree(w,x,z,s){
  const g=new THREE.Group();g.position.set(x,0,z);
  const trunk=box(w,.42*s,3.6*s,.42*s,0x5b3d2b,0,1.8*s,0);g.add(trunk);
  for(let i=0;i<5;i++){
    const leaf=new THREE.Mesh(new THREE.DodecahedronGeometry(1.25*s,1),material([0x214c39,0x2d6849,0x397653][i%3],.96));
    leaf.position.set((i-2)*.55*s,3.1*s+(i%2)*.55*s,(i%3-.9)*.45*s);
    leaf.scale.y=1.15;leaf.castShadow=true;g.add(leaf);
  }
  const vine=new THREE.Mesh(new THREE.CylinderGeometry(.025*s,.04*s,2.4*s,6),material(0x254b38));
  vine.position.set(.7*s,2*s,.3*s);vine.rotation.z=.3;g.add(vine);
  g.scale.setScalar(1);w.scene.add(g);return g;
}

function createTorch(w,x,z){
  const pole=box(w,.12,2.1,.12,0x4b3023,x,1.05,z);
  const fire=new THREE.Mesh(new THREE.SphereGeometry(.24,12,10),new THREE.MeshStandardMaterial({color:0xffa43b,emissive:0xff5c18,emissiveIntensity:3}));
  fire.position.set(x,2.25,z);w.scene.add(fire);
  const light=new THREE.PointLight(0xff8a3d,2.3,9);light.position.set(x,2.2,z);w.scene.add(light);
  return {pole,fire,light};
}
function createTemple(w,x,z){
  const g=new THREE.Group();g.position.set(x,0,z);
  for(const dx of [-4,-2,2,4]){const col=box(w,.75,5,.75,0x766c59,dx,2.5,0);g.add(col)}
  const top=box(w,10,.7,3.5,0x625b4d,0,5.1,0);g.add(top);
  const door=box(w,3.2,4,.3,0x201d1a,0,2,-1.8);g.add(door);
  w.scene.add(g);return g;
}
function createRuins(w,x,z){
  for(let i=0;i<5;i++){const c=box(w,.7,2.5+(i%2),.7,0x716957,x+(i-2)*1.5,1.4,z+(i%2)*.6);c.rotation.z=(i-2)*.06}
}
function createBridge(w,x,z){
  for(let i=0;i<11;i++){const p=box(w,2.2,.18,.9,0x75553a,x,2+Math.sin(i/10*Math.PI)*.9,z-8+i*1.6);p.rotation.x=(i<5?-1:1)*.05}
  const ropeMat=material(0x6e4b31);
  for(const side of [-1,1]){
    const rope=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,17,8),ropeMat);
    rope.position.set(x+side*1.1,3,z);rope.rotation.x=Math.PI/2;w.scene.add(rope);
  }
}
function createAnimal(w,x,z,type){
  const g=new THREE.Group();g.position.set(x,.2,z);
  g.userData={baseX:x,baseZ:z,phase:(x+z)*.13,type};
  const fish=type==="fish";
  const body=new THREE.Mesh(new THREE.SphereGeometry(fish?.45:.65,14,10),material(fish?0x4fa9b5:type==="deer"?0x987051:0x6d4a3c,.9));
  body.scale.set(fish?1.7:1,fish?.45:1,fish?0.7:1);body.position.y=.55;g.add(body);
  if(!fish){
    const head=new THREE.Mesh(new THREE.SphereGeometry(.4,12,10),material(type==="deer"?0xa27b5c:0x76503f,.9));
    head.position.set(.58,.75,0);g.add(head);
    for(const dz of [-.22,.22])g.add(box(w,.1,.42,.1,type==="deer"?0x76513e:0x5b3e32,.65,.98,dz));
  }else{
    const fin=box(w,.15,.5,.9,0x2f7481,-.65,.55,0);fin.rotation.z=.4;g.add(fin);
  }
  w.scene.add(g);return g;
}

function createInteractive(w,icon,label,verb,action,x,z){
  const g=new THREE.Group();g.position.set(x,0,z);
  g.userData={icon,label,verb,action,x,z};
  const pole=box(w,.08,1.6,.08,0x536b62,0,.8,0);
  const marker=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),new THREE.MeshStandardMaterial({color:0x68ded1,emissive:0x14544e,emissiveIntensity:2}));
  marker.position.y=1.85;g.add(pole,marker);
  w.scene.add(g);w.interactive.push(g);
}

function updateNearby(){
  let best=null,d0=Infinity;
  for(const w of worlds.values())for(const g of w.interactive||[]){
    const d=Math.hypot(S.player.x-g.userData.x,S.player.z-g.userData.z);
    if(d<4.5&&d<d0){best=g.userData;d0=d}
  }
  const e=$("#nearby"),a=$("#nearbyActions");if(!e||!a)return;
  if(!best){e.hidden=true;return}
  e.hidden=false;
  a.innerHTML="<button>"+best.icon+" "+best.verb+" "+best.label+"</button>";
  a.firstElementChild.onclick=()=>performInteraction(best.action);
}

function performInteraction(action){
  if(action==="cut"){S.wood++;toast("🌿 جمعت موردًا من الغابة")}
  else if(action==="enter"){S.xp+=10;toast("🏛️ دخلت الموقع الأثري · +10 XP")}
  else if(action==="drink"){S.food=(S.food||0)+1;toast("💧 شربت من الماء")}
  else if(action==="talk"){S.xp+=15;toast("🧑‍🌾 تحدثت مع المرشد · +15 XP")}
  else if(action==="fish"){S.fish=(S.fish||0)+1;toast("🎣 اصطدت سمكة")}
  else if(action==="mine"){S.gem++;toast("⛏ وجدت أثرًا ثمينًا")}
  else if(action==="portal"){S.xp+=20;toast("🌀 اكتشفت بوابة قديمة · +20 XP")}
  save();updateUI();drawAll();
}

function animatePlayer(type){
  return new Promise(resolve=>{
    const start=performance.now();
    for(const w of worlds.values())w.anim={type,start,duration:type==="jump"?550:420};
    function tick(now){
      let done=true;
      for(const w of worlds.values()){const p=Math.min(1,(now-w.anim.start)/w.anim.duration);w.anim.p=p;render3D(w);if(p<1)done=false}
      if(!done)requestAnimationFrame(tick);else{for(const w of worlds.values())w.anim=null;resolve()}
    }
    requestAnimationFrame(tick);
  });
}
function animatePulse(){return new Promise(r=>setTimeout(r,280))}
function animateWorldAction(type){for(const w of worlds.values())w.actionAnim={type,start:performance.now()};return new Promise(r=>setTimeout(r,700))}

function resize3D(w){
  const r=w.renderer.domElement.getBoundingClientRect(),width=Math.max(1,r.width),height=Math.max(1,r.height);
  w.renderer.setSize(width,height,false);w.camera.aspect=width/height;w.camera.updateProjectionMatrix();
}

function render3D(w){
  if(!THREE)return;
  const now=performance.now();
  w.time=now*.001;

  // keyboard exploration
  const k=w.keys;
  const forward=(k.w||k.arrowup?1:0)-(k.s||k.arrowdown?1:0);
  const strafe=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0);
  if(forward||strafe){
    const speed=.075;
    const fx=Math.sin(w.yaw),fz=Math.cos(w.yaw);
    S.player.x=Math.max(-34,Math.min(34,S.player.x+fx*forward*speed+Math.cos(w.yaw)*strafe*speed));
    S.player.z=Math.max(-38,Math.min(38,S.player.z+fz*forward*speed-Math.sin(w.yaw)*strafe*speed));
  }

  const px=S.player.x*1.45,pz=S.player.z*1.45;
  if(w.player){
    const moving=forward||strafe;
    w.player.position.x=px;w.player.position.z=pz;
    w.player.position.y=w.anim&&w.anim.type==="jump"?Math.sin(w.anim.p*Math.PI)*2.2:0;
    if(moving)w.player.rotation.y=Math.atan2(Math.sin(w.yaw),Math.cos(w.yaw))+Math.PI;
    const bob=moving?Math.sin(w.time*11)*.045:Math.sin(w.time*2)*.012;
    w.player.position.y+=bob;
  }

  // cinematic over-the-shoulder camera
  const targetX=px,targetZ=pz;
  const shoulder=new THREE.Vector3(
    targetX-Math.sin(w.yaw)*w.distance,
    3.2+w.distance*.17,
    targetZ-Math.cos(w.yaw)*w.distance
  );
  shoulder.y+=Math.sin(w.pitch)*w.distance*.8;
  w.camera.position.lerp(shoulder,.12);
  w.target.set(targetX,1.35,targetZ);
  w.camera.lookAt(w.target);

  if(w.water)w.water.material.opacity=.82+Math.sin(w.time*1.5)*.04;
  if(w.portal){w.portal.rotation.z=w.time*.35;w.portal.scale.setScalar(1+Math.sin(w.time*2)*.035)}
  if(w.animals)w.animals.forEach((a,i)=>{
    const speed=a.userData.type==="fish"?.55:.22;
    a.position.x=a.userData.baseX+Math.sin(w.time*speed+a.userData.phase)*(.7+(i%3)*.25);
    a.position.z=a.userData.baseZ+Math.cos(w.time*speed*.8+a.userData.phase)*(.55+(i%2)*.2);
    a.rotation.y=Math.sin(w.time*speed+a.userData.phase)*.3;
  });
  if(w.house){w.house.visible=!!S.house}
  if(w.plantPool)w.plantPool.forEach((p,i)=>{const s=S.plants[i];p.visible=!!s;if(s){p.position.x=s.x*1.45;p.position.z=s.z*1.45}});
  updateNearby();
  w.renderer.render(w.scene,w.camera);
}
function drawAll(){for(const w of worlds.values()){resize3D(w);render3D(w)}}
window.addEventListener("resize",drawAll);
