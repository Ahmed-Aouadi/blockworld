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
  scene.background=new THREE.Color(0x9bc7d0);
  scene.fog=new THREE.FogExp2(0x7fa69a,.0026);

  const camera=new THREE.PerspectiveCamera(68,1,.08,700);
  const hemi=new THREE.HemisphereLight(0xe4f5f1,0x17231d,2.0);
  scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe0b0,5.2);
  sun.position.set(-45,70,20);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-150;sun.shadow.camera.right=150;sun.shadow.camera.top=150;sun.shadow.camera.bottom=-150;
  sun.shadow.camera.near=1;sun.shadow.camera.far=420;
  scene.add(sun);

  const world={
    renderer,scene,camera,sun,
    target:new THREE.Vector3(0,1.3,0),
    yaw:.25,pitch:.30,distance:14,drag:false,lx:0,ly:0,
    player:null,interactive:[],animals:[],water:null,waterTime:0,
    actionAnim:null,anim:null,keys:{},time:0,velocity:new THREE.Vector3(),groundY:0,jump:0,jumpT:0
  };
  createCinematicWorld(world);
  world.fps=true;
  worlds.set(canvas,world);
  resize3D(world);
  const frame=()=>{world._raf=requestAnimationFrame(frame);render3D(world)};
  frame();

  canvas.addEventListener("pointerdown",e=>{
    if(world.fps && document.pointerLockElement!==canvas){canvas.requestPointerLock?.();return}
    world.drag=true;world.lx=e.clientX;world.ly=e.clientY;canvas.setPointerCapture?.(e.pointerId);
  });
  document.addEventListener("mousemove",e=>{
    if(world.fps && document.pointerLockElement===canvas){
      world.yaw-=e.movementX*.0028;
      world.pitch=Math.max(-.35,Math.min(.65,world.pitch-e.movementY*.0022));
    }
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

  $(".movePad [data-move]").forEach(btn=>{
    const map={up:"w",down:"s",left:"a",right:"d",jump:" "},key=map[btn.dataset.move];
    const on=()=>{world.keys[key]=true};
    const off=()=>{world.keys[key]=false};
    btn.addEventListener("pointerdown",e=>{e.preventDefault();on()});
    ["pointerup","pointercancel","pointerleave"].forEach(ev=>btn.addEventListener(ev,off));
  });

  if(!world._keysBound){
    world._keysBound=true;
    window.addEventListener("keydown",e=>{
      if(S.settings?.keyboard===false)return;
      const key=e.key.toLowerCase();
      if(key==="e"){
        const best=[...worlds.values()].flatMap(v=>v.interactive||[]).map(g=>g.userData).filter(a=>Math.hypot(S.player.x-a.x,S.player.z-a.z)<3.6).sort((a,b)=>Math.hypot(S.player.x-a.x,S.player.z-a.z)-Math.hypot(S.player.x-b.x,S.player.z-b.z))[0];
        if(best){e.preventDefault();performInteraction(best.action)}
        return;
      }
      world.keys[key]=true;
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

function createPalmTree(w,x,z,s=1){
  const g=new THREE.Group();g.position.set(x,0,z);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28*s,.55*s,5.5*s,10),material(0x795033,.88));trunk.castShadow=true;g.add(trunk);
  trunk.rotation.z=.08*Math.sin(x);
  for(let i=0;i<9;i++){
    const leaf=new THREE.Mesh(new THREE.ConeGeometry(.22*s,4.2*s,6),material(i%2?0x2e7048:0x3c8552,.9));
    leaf.position.y=5.4*s;leaf.rotation.z=Math.PI/2.5;leaf.rotation.y=i*Math.PI*2/9;leaf.scale.z=.45;leaf.castShadow=true;g.add(leaf);
  }
  w.scene.add(g);return g;
}
function createRockCluster(w,x,z,s=1){
  const g=new THREE.Group();g.position.set(x,0,z);
  for(let i=0;i<5;i++){const r=new THREE.Mesh(new THREE.IcosahedronGeometry((.7+i%3*.35)*s,1),material(i%2?0x69716a:0x515b55,.98));r.position.set((i-2)*.7*s,.45+(i%2)*.2,(i%3-1)*.65*s);r.scale.y=.65;r.castShadow=true;r.receiveShadow=true;g.add(r)}
  w.scene.add(g);return g;
}
function createWoodenLookout(w,x,z){
  const g=new THREE.Group();g.position.set(x,0,z);const wood=material(0x67472f,.82);
  for(const sx of [-1.8,1.8])for(const zz of [-1.8,1.8]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,7,8),wood);p.position.set(sx,3.5,zz);p.castShadow=true;g.add(p)}
  const deck=new THREE.Mesh(new THREE.BoxGeometry(4.4,.35,4.4),wood);deck.position.y=6.4;deck.castShadow=true;g.add(deck);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(3.2,1.7,4),material(0x49382b,.92));roof.rotation.y=Math.PI/4;roof.position.y=9;roof.castShadow=true;g.add(roof);
  for(const side of [-1,1]){const rail=new THREE.Mesh(new THREE.BoxGeometry(4,.18,.18),wood);rail.position.set(0,7.3,side*2);g.add(rail)}
  w.scene.add(g);return g;
}
function createCinematicWorld(w){
  // A real playable island base: terrain + surrounding ocean.
  const terrainGeo=new THREE.PlaneGeometry(230,230,64,64);
  const pos=terrainGeo.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getY(i),r=Math.hypot(x,z);let h=0;h+=Math.max(0,1-r/108)*2.4;h+=Math.sin(x*.055)*1.5+Math.cos(z*.048)*1.2;h+=Math.sin((x+z)*.025)*2.2;h+=Math.max(0,1-Math.abs(x+18)/30)*Math.max(0,1-Math.abs(z-12)/75)*5;pos.setZ(i,h)}
  terrainGeo.computeVertexNormals();
  const island=new THREE.Mesh(terrainGeo,material(0x426b4d,.92));
  island.rotation.x=-Math.PI/2;island.position.y=-.18;island.receiveShadow=true;w.scene.add(island);w.terrain=island;
  const shore=new THREE.Mesh(new THREE.RingGeometry(92,112,96),material(0xc5aa72,.96));
  shore.rotation.x=-Math.PI/2;shore.position.y=-.1;w.scene.add(shore);
  const ocean=new THREE.Mesh(new THREE.PlaneGeometry(620,620,64,64),new THREE.MeshPhysicalMaterial({color:0x1d6570,roughness:.18,metalness:.02,transparent:true,opacity:.9}));
  ocean.rotation.x=-Math.PI/2;ocean.position.y=-.42;w.scene.add(ocean);w.ocean=ocean;
  for(let i=0;i<28;i++){const foam=new THREE.Mesh(new THREE.TorusGeometry(.45+(i%4)*.18,.035,6,20),new THREE.MeshBasicMaterial({color:0xbce8e5,transparent:true,opacity:.32}));const a=i*.9;foam.position.set(Math.cos(a)*(44+(i%5)*2),-.3,Math.sin(a)*(44+(i%5)*2));foam.rotation.x=Math.PI/2;w.scene.add(foam)}
  const path=new THREE.Mesh(new THREE.PlaneGeometry(7,92),material(0x7d7159,.96));
  path.rotation.x=-Math.PI/2;path.position.set(3,.22,0);w.scene.add(path);
  const river=new THREE.Mesh(new THREE.PlaneGeometry(11,118,1,20),new THREE.MeshPhysicalMaterial({color:0x2c7983,roughness:.08,metalness:.05,transparent:true,opacity:.82}));
  river.rotation.x=-Math.PI/2;river.position.set(-17,.05,0);w.scene.add(river);w.water=river;
  const pool=new THREE.Mesh(new THREE.CylinderGeometry(10,11,.35,40),new THREE.MeshPhysicalMaterial({color:0x286f79,roughness:.08,transparent:true,opacity:.86}));
  pool.position.set(-8,.1,-38);w.scene.add(pool);

  for(let i=0;i<18;i++){
    const side=i%2?-1:1,x=side*(47+(i%3)*2),z=-48+i*5.6,h=7+(i%4)*2.5;
    const rock=stone(w,4.8+(i%3)*1.1,h,0x465049,x,z);rock.scale.z=1.35;
    for(let j=0;j<2;j++){const ledge=box(w,7,.55,3.8,0x596057,x-side*(1.4+j*.7),1.8+j*2.5,z+(j-.5)*1.4);ledge.rotation.z=side*(j%2?.08:-.05)}
  }
  createTemple(w,-5,-39);
  createWoodenLookout(w,42,-8);createWoodenLookout(w,-42,18);
  createAdventureCamp(w,12,-4);
  for(let i=0;i<28;i++){const a=i*.73;createPalmTree(w,Math.cos(a)*(72+(i%5)*4),Math.sin(a)*(72+(i%5)*4),.85+(i%4)*.12)}
  for(let i=0;i<46;i++)createRockCluster(w,-92+(i*37)%184,-92+(i*61)%184,.65+(i%4)*.18);

  for(let i=0;i<8;i++)box(w,11-i*.7,.28,1.2,0x6b6557,-5,0.3+i*.28,-34+i*1.2);
  createRuins(w,27,-18);createBridge(w,14,8);

  const arch=new THREE.Group();arch.position.set(25,0,27);
  for(const sx of [-3.3,3.3])arch.add(box(w,1.8,7,2.2,0x4e554e,sx,3.5,0));
  arch.add(box(w,8,1.8,2.2,0x4e554e,0,7,0));arch.add(box(w,4.2,3.8,.4,0x171c1a,0,1.9,.95));w.scene.add(arch);

  // handcrafted landmarks: beach huts, jungle clearings and a river settlement
  for(let i=0;i<7;i++){
    const hx=-58+(i%4)*12,hz=42+Math.floor(i/4)*10;
    createAdventureCamp(w,hx,hz).scale.setScalar(.65+(i%2)*.08);
  }
  for(let i=0;i<260;i++){const x=-43+(i*19)%86,z=-48+(i*31)%96;if(Math.abs(x+17)<8&&Math.abs(z)<12)continue;createJungleTree(w,x,z,.72+(i%6)*.12)}
  for(let i=0;i<180;i++){const x=-44+(i*27)%88,z=-46+(i*17)%92;foliage(w,x,.2,z,.55+(i%5)*.12)}
  for(let i=0;i<220;i++){const rock=stone(w,.3+(i%6)*.15,.45+(i%5)*.28,0x5a6259,-43+(i*17)%86,-44+(i*29)%90);rock.rotation.z=(i%7)*.11}
  for(let i=0;i<8;i++){const fall=new THREE.Mesh(new THREE.PlaneGeometry(2.2+(i%3)*.5,7+(i%2)*2),new THREE.MeshStandardMaterial({color:0xbfecee,transparent:true,opacity:.32,side:THREE.DoubleSide}));fall.position.set(-8+i*.65,4+(i%2),-45);fall.rotation.y=(i-4)*.035;w.scene.add(fall)}
  for(let i=0;i<18;i++){const spray=new THREE.Mesh(new THREE.SphereGeometry(.05+(i%3)*.025,7,6),new THREE.MeshBasicMaterial({color:0xd9ffff,transparent:true,opacity:.6}));spray.position.set(-8+(i%6)*.5,1+(i%5)*.25,-43+(i%3)*.4);w.scene.add(spray)}
  for(const p of [[-11,-28],[8,-27],[19,8],[-8,13],[9,-38],[27,27]])createTorch(w,p[0],p[1]);

  createInteractive(w,"🌿","شجرة","قطع","cut",18,4);createInteractive(w,"🏛️","المعبد","دخول","enter",-5,-35);
  createInteractive(w,"💧","الشلال","شرب","drink",-8,-41);createInteractive(w,"🧑‍🌾","المرشد","تحدث","talk",7,13);
  createInteractive(w,"🐟","النهر","صيد","fish",-17,8);createInteractive(w,"🪨","الآثار","تعدين","mine",27,-18);createInteractive(w,"🌀","البوابة","دخول","portal",-27,31);

  for(let i=0;i<12;i++)w.animals.push(createAnimal(w,8+(i*7)%30,-28+(i*11)%58,i%4===0?"deer":"boar"));
  for(let i=0;i<8;i++)w.animals.push(createAnimal(w,-17+(i%4)*2,-25+i*8,"fish"));

  const p=new THREE.Group();
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.43,.82,7,14),material(0x26363b,.7));torso.position.y=1.35;p.add(torso);
  const vest=new THREE.Mesh(new THREE.BoxGeometry(.58,.8,.46),material(0x5b4637,.78));vest.position.set(0,1.35,.08);p.add(vest);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.36,20,16),material(0xb87854,.8));head.position.y=2.2;p.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.4,18,12),material(0x251d1a,.92));hair.scale.y=.58;hair.position.set(0,2.42,-.01);p.add(hair);
  const pack=new THREE.Mesh(new THREE.BoxGeometry(.68,.78,.3),material(0x4a3228,.8));pack.position.set(0,1.3,-.5);p.add(pack);
  for(const sx of [-.52,.52]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.65,5,8),material(0xb87854,.82));arm.position.set(sx,1.28,0);arm.rotation.z=sx*.28;p.add(arm)}
  for(const sx of [-.18,.18]){const boot=new THREE.Mesh(new THREE.BoxGeometry(.2,.65,.32),material(0x262727,.8));boot.position.set(sx,.48,.02);p.add(boot)}
  const scarf=new THREE.Mesh(new THREE.TorusGeometry(.38,.06,8,20),material(0xa24b37,.8));scarf.position.y=1.86;scarf.rotation.x=Math.PI/2;p.add(scarf);
  p.traverse(o=>{if(o.isMesh)o.castShadow=true});w.scene.add(p);w.player=p;

  w.house=createAdventureCamp(w,12,-4);w.house.visible=!!S.house;
  w.plantPool=[];for(let i=0;i<30;i++){const plant=createAdventurePlant(w,0,0);plant.visible=false;w.plantPool.push(plant)}
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.3,.16,18,56),new THREE.MeshStandardMaterial({color:0x68e4d5,emissive:0x1d9587,emissiveIntensity:2,roughness:.3}));
  ring.position.set(-27,2.5,31);ring.rotation.x=Math.PI/2;w.scene.add(ring);w.portal=ring;
  const sky=new THREE.Mesh(new THREE.SphereGeometry(115,32,18),new THREE.MeshBasicMaterial({color:0x829f9d,side:THREE.BackSide}));w.scene.add(sky);
  for(let i=0;i<13;i++){const m=new THREE.Mesh(new THREE.ConeGeometry(9+(i%3)*4,18+(i%4)*5,8),material(0x40504a,.99));m.position.set(-62+i*11,8,-66);m.scale.z=.55;w.scene.add(m)}
}
function createAdventureCamp(w,x,z){
  const g=new THREE.Group();g.position.set(x,0,z);const wood=material(0x68472f,.78),dark=material(0x30271f,.9);
  const floor=new THREE.Mesh(new THREE.BoxGeometry(7,.35,6),wood);floor.position.y=.25;floor.castShadow=true;g.add(floor);
  for(const sx of [-3.1,3.1])for(const zz of [-2.6,2.6]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,3.8,8),wood);p.position.set(sx,2,zz);p.castShadow=true;g.add(p)}
  for(let i=0;i<4;i++){const plank=new THREE.Mesh(new THREE.BoxGeometry(6.2,.16,.55),wood);plank.position.set(0,1.1+i*.55,-2.75);g.add(plank)}
  const roof=new THREE.Mesh(new THREE.ConeGeometry(4.5,2.6,4),material(0x3e342b,.96));roof.rotation.y=Math.PI/4;roof.position.y=4.2;roof.scale.z=.78;roof.castShadow=true;g.add(roof);
  const door=new THREE.Mesh(new THREE.BoxGeometry(1.35,2.4,.12),dark);door.position.set(0,1.35,-2.86);g.add(door);
  const fire=new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),new THREE.MeshStandardMaterial({color:0xffa13b,emissive:0xff4d12,emissiveIntensity:4}));fire.position.set(0,1.05,2.5);g.add(fire);
  const light=new THREE.PointLight(0xff7b36,2.8,10);light.position.set(0,1.6,2.5);g.add(light);
  w.scene.add(g);return g;
}
function createAdventurePlant(w,x,z){
  const g=new THREE.Group();g.position.set(x,0,z);
  const stem=box(w,.08,.7,.08,0x3f7045,0,.35,0);g.add(stem);
  for(const dx of [-.2,.2]){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),material(0x5f9b55,.96));leaf.scale.set(1,.45,1.4);leaf.position.set(dx,.62,0);g.add(leaf)}
  w.scene.add(g);return g;
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

async function executeWorldBlock(type){
  const w=[...worlds.values()][0];
  if(!w) return {label:TYPES[type]?.label||type};
  const moveForward=async()=>{
    const step=2.2; S.player.x=Math.max(-43,Math.min(43,S.player.x+Math.sin(w.yaw)*step)); S.player.z=Math.max(-45,Math.min(45,S.player.z+Math.cos(w.yaw)*step)); S.steps++; await animatePlayer("move");
  };
  if(type==="move"){await moveForward();return {label:"تحرك فعليًا"}}
  if(type==="turn"){w.yaw+=Math.PI/2;S.rotation=(S.rotation+1)%4;await animatePlayer("turn");return {label:"استدار 90°"}}
  if(type==="jump"){w.jump=1;w.jumpT=0;await animatePlayer("jump");return {label:"قفز فعليًا"}}
  if(type==="repeat"){for(let i=0;i<3;i++)await moveForward();unlock("loop");return {label:"كرر الحركة ×3"}}
  if(type==="collect"){
    let best=null,d=Infinity;for(const g of w.interactive){const a=g.userData;if(["cut","mine","fish"].includes(a.action)){const q=Math.hypot(S.player.x-a.x,S.player.z-a.z);if(q<d){d=q;best=a}}}
    if(best&&d<6){if(best.action==="cut")S.wood++;if(best.action==="mine")S.gem++;if(best.action==="fish")S.fish=(S.fish||0)+1;unlock("collector");await animateWorldAction("collect");return {label:"جمع "+best.label}}
    S.wood++;S.gem++;unlock("collector");await animateWorldAction("collect");return {label:"جمع مورد"}}
  if(type==="plant"){
    if(S.seeds<=0)return {label:"لا توجد بذور"};S.seeds--;S.plants.push({x:S.player.x,z:S.player.z});unlock("gardener");await animateWorldAction("plant");return {label:"نبتة ظهرت في موقعك"}}
  if(type==="build"){
    if(S.house)return {label:"البناء موجود"};if(S.wood<3)return {label:"تحتاج 3 أخشاب"};
    S.wood-=3;S.house=true;unlock("builder");
    if(w.house){w.house.position.set(S.player.x*1.18,0,S.player.z*1.18);w.house.visible=true}
    await animateWorldAction("build");return {label:"بُني في موقعك"};
  }
  return {label:TYPES[type]?.label||type};
}
window.executeWorldBlock=executeWorldBlock;

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
    if(d<3.6&&d<d0){best=g.userData;d0=d}
  }
  const e=$("#nearby"),a=$("#nearbyActions");if(!e||!a)return;
  if(!best){e.hidden=true;return}
  e.hidden=false;
  a.innerHTML='<div class="ePrompt"><kbd>E</kbd><span>'+best.verb+' · '+best.label+'</span></div>';
  e.dataset.action=best.action;
  e.dataset.interaction=best.label;
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
  const moving=!!(forward||strafe);
  const sprint=k.shift?1.7:1;
  if(moving&&!S.running&&S.settings?.keyboard!==false){
    const len=Math.hypot(forward,strafe)||1, f=forward/len,s=strafe/len,fx=Math.sin(w.yaw),fz=Math.cos(w.yaw);
    const tx=(fx*f+Math.cos(w.yaw)*s)*.20*sprint, tz=(fz*f-Math.sin(w.yaw)*s)*.20*sprint;
    w.velocity.x+=(tx-w.velocity.x)*.22;w.velocity.z+=(tz-w.velocity.z)*.22;
    S.player.x=Math.max(-42,Math.min(42,S.player.x+w.velocity.x));S.player.z=Math.max(-45,Math.min(45,S.player.z+w.velocity.z));
  }else{w.velocity.x*=.78;w.velocity.z*=.78}
  if(k[" "]&&!w.jump&&!S.running&&S.settings?.keyboard!==false){w.jump=1;w.jumpT=0;k[" "]=false}
  if(w.jump){w.jumpT=Math.min(1,w.jumpT+.055);if(w.jumpT>=1)w.jump=0}

  const px=S.player.x*1.18,pz=S.player.z*1.18;
  if(w.player){
    w.player.position.x=px;w.player.position.z=pz;
    const jumpArc=w.jump?Math.sin(w.jumpT*Math.PI)*1.65:0;
    w.player.position.y=jumpArc+(w.anim&&w.anim.type==="jump"?Math.sin(w.anim.p*Math.PI)*.7:0);
    if(moving)w.player.rotation.y=Math.atan2(w.velocity.x,w.velocity.z)+Math.PI;
    const bob=moving?Math.sin(w.time*11)*.045:Math.sin(w.time*2)*.012;
    w.player.position.y+=bob;
    w.player.visible=!w.fps;
  }

  // Tropical first-person adventure camera.
  const eyeY=1.62+(w.jump?Math.sin(w.jumpT*Math.PI)*1.45:0)+(moving?Math.sin(w.time*10)*.025:0);
  const targetX=px+Math.sin(w.yaw)*8;
  const targetZ=pz+Math.cos(w.yaw)*8;
  if(w.fps){
    w.camera.position.lerp(new THREE.Vector3(px,eyeY,pz),.28);
    w.camera.lookAt(targetX,eyeY+Math.sin(w.pitch)*7,targetZ);
  }else{
    const shoulder=new THREE.Vector3(targetX-Math.sin(w.yaw)*w.distance,3.2+w.distance*.17,targetZ-Math.cos(w.yaw)*w.distance);
    shoulder.y+=Math.sin(w.pitch)*w.distance*.8;
    w.camera.position.lerp(shoulder,.12);w.target.set(px,1.35,pz);w.camera.lookAt(w.target);
  }

  if(w.water)w.water.material.opacity=.82+Math.sin(w.time*1.5)*.04;
  if(w.ocean){w.ocean.position.y=-.42+Math.sin(w.time*.7)*.025;w.ocean.material.opacity=.88+Math.sin(w.time*.9)*.025;}
  if(w.portal){w.portal.rotation.z=w.time*.35;w.portal.scale.setScalar(1+Math.sin(w.time*2)*.035)}
  if(w.animals)w.animals.forEach((a,i)=>{
    const speed=a.userData.type==="fish"?.55:.22;
    a.position.x=a.userData.baseX+Math.sin(w.time*speed+a.userData.phase)*(.7+(i%3)*.25);
    a.position.z=a.userData.baseZ+Math.cos(w.time*speed*.8+a.userData.phase)*(.55+(i%2)*.2);
    a.rotation.y=Math.sin(w.time*speed+a.userData.phase)*.3;
  });
  if(w.house){w.house.visible=!!S.house}
  if(w.plantPool)w.plantPool.forEach((p,i)=>{const s=S.plants[i];p.visible=!!s;if(s){p.position.x=s.x*1.18;p.position.z=s.z*1.18}});
  updateNearby();
  w.renderer.render(w.scene,w.camera);
}
function drawAll(){for(const w of worlds.values()){resize3D(w);render3D(w)}}
window.addEventListener("resize",drawAll);
