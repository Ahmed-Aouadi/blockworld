let THREE=null;
let GLTFLoader=null;
const worlds=new Map();
const assetCache=new Map();

const ASSETS={
  city:"https://cdn.3dassets.dev/assets/36160/v1/model.glb",
  lagoon:"https://cdn.3dassets.dev/assets/6862/v1/model.glb",
  temple:"https://cdn.3dassets.dev/assets/36101/v1/model.glb",
  boat:"https://cdn.3dassets.dev/assets/36619/v1/model.glb",
  log:"https://cdn.3dassets.dev/assets/36143/v1/model.glb",
  floor:"https://cdn.3dassets.dev/assets/36112/v1/model.glb",
  dune:"https://cdn.3dassets.dev/assets/6830/v1/model.glb"
};

async function init3D(){
  try{
    THREE=await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
    ({GLTFLoader}=await import("https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js"));
    await Promise.all([setup3D($("#worldCanvas")),setup3D($("#worldCanvas2"))]);
    drawAll();
  }catch(err){
    console.error(err);
    $("#worldState").textContent="تعذر تحميل عالم المغامرة";
    $("#output").textContent="● تعذر تحميل أصول العالم ثلاثي الأبعاد. بقية المنصة تعمل بصورة طبيعية.";
  }
}

function loadAsset(key){
  if(assetCache.has(key))return assetCache.get(key);
  const p=new Promise((resolve,reject)=>{
    const loader=new GLTFLoader();
    loader.load(ASSETS[key],g=>resolve(g.scene),undefined,reject);
  });
  assetCache.set(key,p);
  return p;
}

function cloneAsset(source){
  const clone=source.clone(true);
  clone.traverse(o=>{
    if(o.isMesh){
      o.castShadow=true;o.receiveShadow=true;
      if(o.material?.map)o.material.map.colorSpace=THREE.SRGBColorSpace;
    }
  });
  return clone;
}

async function setup3D(canvas){
  if(!canvas||!THREE||worlds.has(canvas))return;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x9abfc0);
  scene.fog=new THREE.Fog(0x88a9a5,95,560);

  const camera=new THREE.PerspectiveCamera(70,1,.08,700);
  const hemi=new THREE.HemisphereLight(0xeaf7f1,0x24332d,1.9);
  scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe3b8,4.1);
  sun.position.set(-80,120,55);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-180;sun.shadow.camera.right=180;
  sun.shadow.camera.top=180;sun.shadow.camera.bottom=-180;
  sun.shadow.camera.far=520;
  scene.add(sun);

  const world={
    renderer,scene,camera,sun,fps:true,ready:false,loading:true,
    yaw:.2,pitch:.08,distance:14,drag:false,lx:0,ly:0,
    player:null,interactive:[],animals:[],assets:[],mixers:[],
    water:null,time:0,velocity:new THREE.Vector3(),jump:0,jumpT:0,
    keys:{},actionAnim:null,anim:null
  };
  worlds.set(canvas,world);
  resize3D(world);
  canvas.classList.add("assetWorld");

  try{
    const [city,lagoon,temple,boat,log,floor,dune]=await Promise.all([
      loadAsset("city"),loadAsset("lagoon"),loadAsset("temple"),
      loadAsset("boat"),loadAsset("log"),loadAsset("floor"),loadAsset("dune")
    ]);

    // A curated world made from authored GLB environments, not primitive-generated scenery.
    const cityA=cloneAsset(city);cityA.position.set(0,0,0);cityA.scale.setScalar(1.8);scene.add(cityA);world.assets.push(cityA);
    const cityB=cloneAsset(city);cityB.position.set(-118,-1,-82);cityB.scale.setScalar(1.15);cityB.rotation.y=.7;scene.add(cityB);world.assets.push(cityB);

    const lagoonA=cloneAsset(lagoon);lagoonA.position.set(-92,-.25,92);lagoonA.scale.setScalar(5.2);lagoonA.rotation.y=-.35;scene.add(lagoonA);world.assets.push(lagoonA);
    const lagoonB=cloneAsset(lagoon);lagoonB.position.set(105,-.2,102);lagoonB.scale.setScalar(4.6);lagoonB.rotation.y=1.9;scene.add(lagoonB);world.assets.push(lagoonB);

    const shrine=cloneAsset(temple);shrine.position.set(92,0,-92);shrine.scale.setScalar(4.3);shrine.rotation.y=-.55;scene.add(shrine);world.assets.push(shrine);

    const shoreBoat=cloneAsset(boat);shoreBoat.position.set(122,-.05,35);shoreBoat.scale.setScalar(6.5);shoreBoat.rotation.y=-.9;scene.add(shoreBoat);world.assets.push(shoreBoat);

    // A sparse authored forest floor network breaks up the distance without repeating trees.
    const floorSpots=[
      [-45,-70,1.9,.2],[-12,-82,1.7,1.1],[28,-72,1.8,-.6],[62,-55,1.6,.4],
      [70,38,1.9,2.2],[36,67,1.7,-1.2],[-20,72,1.8,.3],[-62,58,1.7,1.6],
      [-112,28,1.8,-.4],[-105,-35,1.6,2.1],[112,-20,1.8,.8],[130,-72,1.5,-.8]
    ];
    for(const [x,z,s,r] of floorSpots){
      const f=cloneAsset(floor);f.position.set(x,-.05,z);f.scale.setScalar(s);f.rotation.y=r;scene.add(f);world.assets.push(f);
    }

    const logSpots=[[-48,-24,1.8,.7],[42,-42,2.0,-.5],[-78,42,1.7,1.3],[78,58,1.8,-1.1],[18,88,1.6,.2]];
    for(const [x,z,s,r] of logSpots){
      const l=cloneAsset(log);l.position.set(x,0,z);l.scale.setScalar(s);l.rotation.y=r;scene.add(l);world.assets.push(l);
    }

    const dunes=[[-128,76,3.2,.3],[132,78,3.1,-.8],[-138,110,2.8,1.4],[142,112,2.6,-1.3]];
    for(const [x,z,s,r] of dunes){
      const d=cloneAsset(dune);d.position.set(x,-.1,z);d.scale.setScalar(s);d.rotation.y=r;scene.add(d);world.assets.push(d);
    }

    // Water is deliberately simple; the visual identity comes from authored environments.
    const ocean=new THREE.Mesh(
      new THREE.PlaneGeometry(620,620),
      new THREE.MeshPhysicalMaterial({color:0x1b6470,roughness:.13,metalness:.02,transparent:true,opacity:.84})
    );
    ocean.rotation.x=-Math.PI/2;ocean.position.y=-1.25;scene.add(ocean);world.water=ocean;

    const start=new THREE.Vector3(S.player.x||0,0,S.player.z||0);
    world.player=start;
    createInteractive(world,"🌿","الغابة","قطع","cut",-48,-24);
    createInteractive(world,"🏛️","مدينة الغابة","استكشاف","enter",18,-12);
    createInteractive(world,"💧","البحيرة","شرب","drink",-92,92);
    createInteractive(world,"🧑‍🌾","المعسكر","تحدث","talk",7,34);
    createInteractive(world,"🐟","القارب","صيد","fish",122,35);
    createInteractive(world,"🪨","المعبد","تعدين","mine",92,-92);
    createInteractive(world,"🌀","البوابة القديمة","دخول","portal",-118,-82);

    const marker=new THREE.Mesh(
      new THREE.RingGeometry(.24,.31,32),
      new THREE.MeshBasicMaterial({color:0x7de6d6,transparent:true,opacity:.9,side:THREE.DoubleSide})
    );
    marker.rotation.x=-Math.PI/2;marker.position.y=.04;marker.visible=false;scene.add(marker);world.marker=marker;

    world.ready=true;world.loading=false;
    $("#worldState").textContent="العالم جاهز · استكشف بـ WASD";
  }catch(err){
    world.loading=false;
    console.error("Asset world failed",err);
    $("#worldState").textContent="تعذر تحميل بعض أصول العالم";
  }

  const frame=()=>{world._raf=requestAnimationFrame(frame);render3D(world)};
  frame();

  canvas.addEventListener("pointerdown",e=>{
    if(world.fps&&document.pointerLockElement!==canvas){canvas.requestPointerLock?.();return}
    world.drag=true;world.lx=e.clientX;world.ly=e.clientY;
  });
  document.addEventListener("mousemove",e=>{
    if(document.pointerLockElement===canvas){
      world.yaw-=e.movementX*.0026;
      world.pitch=Math.max(-.5,Math.min(.5,world.pitch-e.movementY*.002));
    }
  });
  canvas.addEventListener("pointermove",e=>{
    if(!world.drag||document.pointerLockElement===canvas)return;
    world.yaw-=(e.clientX-world.lx)*.005;
    world.pitch=Math.max(-.4,Math.min(.5,world.pitch+(e.clientY-world.ly)*.003));
    world.lx=e.clientX;world.ly=e.clientY;
  });
  ["pointerup","pointercancel"].forEach(k=>canvas.addEventListener(k,()=>world.drag=false));

  if(!world._touchBound){
    world._touchBound=true;
    $(".movePad [data-move]").forEach(btn=>{
      const map={up:"w",down:"s",left:"a",right:"d",jump:" "},key=map[btn.dataset.move];
      const on=()=>{world.keys[key]=true};const off=()=>{world.keys[key]=false};
      btn.addEventListener("pointerdown",e=>{e.preventDefault();on()});
      ["pointerup","pointercancel","pointerleave"].forEach(ev=>btn.addEventListener(ev,off));
    });
  }

  if(!window._blockWorldKeys){
    window._blockWorldKeys=true;
    window.addEventListener("keydown",e=>{
      if(S.settings?.keyboard===false)return;
      const key=e.key.toLowerCase();
      if(key==="e"){
        const best=findNearestInteraction();
        if(best){e.preventDefault();performInteraction(best.action)}
        return;
      }
      for(const w of worlds.values())w.keys[key]=true;
      if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))e.preventDefault();
    });
    window.addEventListener("keyup",e=>{for(const w of worlds.values())w.keys[e.key.toLowerCase()]=false});
  }
}

function findNearestInteraction(){
  let best=null,d=Infinity;
  for(const w of worlds.values())for(const g of w.interactive||[]){
    const a=g.userData,q=Math.hypot(S.player.x-a.x,S.player.z-a.z);
    if(q<4.5&&q<d){d=q;best=a}
  }
  return best;
}

function createInteractive(w,icon,label,verb,action,x,z){
  const g=new THREE.Group();g.position.set(x,0,z);
  g.userData={icon,label,verb,action,x,z};
  w.scene.add(g);w.interactive.push(g);
}

function updateNearby(){
  const best=findNearestInteraction();
  const e=$("#nearby"),a=$("#nearbyActions");
  if(!e||!a)return;
  if(!best){e.hidden=true;for(const w of worlds.values())if(w.marker)w.marker.visible=false;return}
  e.hidden=false;
  a.innerHTML='<div class="ePrompt"><kbd>E</kbd><span>'+best.verb+" · "+best.label+"</span></div>";
  e.dataset.action=best.action;e.dataset.interaction=best.label;
  for(const w of worlds.values())if(w.marker){w.marker.position.set(best.x,.05,best.z);w.marker.visible=true;w.marker.rotation.z=performance.now()*.001}
}

function performInteraction(action){
  if(action==="cut"){S.wood++;toast("🌿 جمعت موردًا من الغابة")}
  else if(action==="enter"){S.xp+=10;toast("🏛️ اكتشفت أطلال المدينة · +10 XP")}
  else if(action==="drink"){S.food=(S.food||0)+1;toast("💧 شربت من البحيرة")}
  else if(action==="talk"){S.xp+=15;toast("🧑‍🌾 تحدثت مع المرشد · +15 XP")}
  else if(action==="fish"){S.fish=(S.fish||0)+1;toast("🎣 اصطدت سمكة")}
  else if(action==="mine"){S.gem++;toast("⛏ وجدت أثرًا ثمينًا")}
  else if(action==="portal"){S.xp+=20;toast("🌀 دخلت البوابة القديمة · +20 XP")}
  save();updateUI();drawAll();
}

async function executeWorldBlock(type){
  const w=[...worlds.values()][0];
  if(!w)return {label:TYPES[type]?.label||type};
  const moveForward=async()=>{
    const step=2.8;
    const fx=Math.sin(w.yaw),fz=Math.cos(w.yaw);
    S.player.x=Math.max(-155,Math.min(155,S.player.x+fx*step));
    S.player.z=Math.max(-155,Math.min(155,S.player.z+fz*step));
    S.steps++;await animatePlayer("move");
  };
  if(type==="move"){await moveForward();return {label:"تحرك فعليًا في العالم"}}
  if(type==="turn"){w.yaw+=Math.PI/2;S.rotation=(S.rotation+1)%4;await animatePlayer("turn");return {label:"استدار 90°"}}
  if(type==="jump"){w.jump=1;w.jumpT=0;await animatePlayer("jump");return {label:"قفز فعليًا"}}
  if(type==="repeat"){for(let i=0;i<3;i++)await moveForward();unlock("loop");return {label:"كرر الحركة ×3"}}
  if(type==="collect"){
    const best=findNearestInteraction();
    if(best&&["cut","mine","fish"].includes(best.action))performInteraction(best.action);
    else S.wood++;
    unlock("collector");await animateWorldAction("collect");return {label:"جمع مورد"}}
  if(type==="plant"){
    if(S.seeds<=0)return {label:"لا توجد بذور"};
    S.seeds--;S.plants.push({x:S.player.x,z:S.player.z});unlock("gardener");await animateWorldAction("plant");return {label:"زراعة في موقعك"}}
  if(type==="build"){
    if(S.house)return {label:"البناء موجود"};
    if(S.wood<3)return {label:"تحتاج 3 أخشاب"};
    S.wood-=3;S.house=true;unlock("builder");await animateWorldAction("build");return {label:"تم بناء نقطة استكشاف"}}
  return {label:TYPES[type]?.label||type};
}
window.executeWorldBlock=executeWorldBlock;

function animatePlayer(type){
  return new Promise(resolve=>{
    const start=performance.now();
    for(const w of worlds.values())w.anim={type,start,duration:type==="jump"?520:360};
    function tick(now){
      let done=true;
      for(const w of worlds.values()){
        const p=Math.min(1,(now-w.anim.start)/w.anim.duration);w.anim.p=p;render3D(w);
        if(p<1)done=false;
      }
      if(!done)requestAnimationFrame(tick);
      else{for(const w of worlds.values())w.anim=null;resolve()}
    }
    requestAnimationFrame(tick);
  });
}
function animatePulse(){return new Promise(r=>setTimeout(r,220))}
function animateWorldAction(type){for(const w of worlds.values())w.actionAnim={type,start:performance.now()};return new Promise(r=>setTimeout(r,600))}

function resize3D(w){
  const r=w.renderer.domElement.getBoundingClientRect(),width=Math.max(1,r.width),height=Math.max(1,r.height);
  w.renderer.setSize(width,height,false);w.camera.aspect=width/height;w.camera.updateProjectionMatrix();
}

function render3D(w){
  if(!THREE)return;
  const now=performance.now();w.time=now*.001;
  const k=w.keys;
  const forward=(k.w||k.arrowup?1:0)-(k.s||k.arrowdown?1:0);
  const strafe=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0);
  const moving=!!(forward||strafe);
  const sprint=k.shift?1.65:1;

  if(moving&&!S.running&&S.settings?.keyboard!==false){
    const len=Math.hypot(forward,strafe)||1,f=forward/len,s=strafe/len;
    const fx=Math.sin(w.yaw),fz=Math.cos(w.yaw);
    const tx=(fx*f+Math.cos(w.yaw)*s)*.24*sprint;
    const tz=(fz*f-Math.sin(w.yaw)*s)*.24*sprint;
    w.velocity.x+=(tx-w.velocity.x)*.24;w.velocity.z+=(tz-w.velocity.z)*.24;
    S.player.x=Math.max(-155,Math.min(155,S.player.x+w.velocity.x));
    S.player.z=Math.max(-155,Math.min(155,S.player.z+w.velocity.z));
  }else{w.velocity.x*=.76;w.velocity.z*=.76}

  if(k[" "]&&!w.jump&&!S.running){w.jump=1;w.jumpT=0;k[" "]=false}
  if(w.jump){w.jumpT=Math.min(1,w.jumpT+.06);if(w.jumpT>=1)w.jump=0}

  const eyeY=1.68+(w.jump?Math.sin(w.jumpT*Math.PI)*1.45:0)+(moving?Math.sin(w.time*10)*.025:0);
  const px=S.player.x,pz=S.player.z;
  const targetX=px+Math.sin(w.yaw)*9,targetZ=pz+Math.cos(w.yaw)*9;

  w.camera.position.lerp(new THREE.Vector3(px,eyeY,pz),.28);
  w.camera.lookAt(targetX,eyeY+Math.sin(w.pitch)*7,targetZ);

  if(w.water)w.water.position.y=-1.25+Math.sin(w.time*.65)*.018;
  updateNearby();
  w.renderer.render(w.scene,w.camera);
}

function drawAll(){for(const w of worlds.values()){resize3D(w);render3D(w)}}
window.addEventListener("resize",drawAll);
window.addEventListener("beforeunload",()=>{for(const w of worlds.values()&&[];){}});
