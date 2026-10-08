function renderProgram(){
 const z=$("#zone");z.innerHTML="";
 if(!S.program.length)z.innerHTML='<div class="hint">أضف الأوامر هنا.<br>يمكنك حذف أي أمر أو التراجع عن آخر إضافة.</div>';
 S.program.forEach((t,i)=>{const d=document.createElement("div");d.className="placed "+TYPES[t].cls+(S.runningIndex===i?" running":"");d.dataset.index=i;d.innerHTML="<span class=\"blockIndex\">"+(i+1)+". "+TYPES[t].label+"</span><button aria-label=\"حذف الأمر "+(i+1)+"\">×</button>";d.querySelector("button").onclick=()=>{history.push([...S.program]);S.program.splice(i,1);commit()};z.appendChild(d)});
 $("#count").textContent=S.program.length+" / 15";
}
function add(type){if(S.program.length>=15){toast("الحد الأقصى 15 أمرًا");return}history.push([...S.program]);S.program.push(type);commit();$("#output").textContent="● أُضيف: "+TYPES[type].label}
function commit(){save();renderProgram();updateUI()}
$$(".block").forEach(b=>{b.onclick=()=>add(b.dataset.type);b.draggable=true;b.addEventListener("dragstart",e=>e.dataTransfer.setData("text/plain",b.dataset.type))});
$("#zone").addEventListener("dragover",e=>e.preventDefault());
$("#zone").addEventListener("drop",e=>{e.preventDefault();const t=e.dataTransfer.getData("text/plain");if(TYPES[t])add(t)});
$("#undo").onclick=()=>{if(!history.length){toast("لا يوجد شيء للتراجع عنه");return}S.program=history.pop();commit();toast("تم التراجع")};
$("#clear").onclick=()=>{if(!S.program.length)return;history.push([...S.program]);S.program=[];commit();$("#output").textContent="● مساحة البرنامج فارغة."};

function unlock(id){if(!S.ach[id]){S.ach[id]=true;const a=ACH.find(x=>x[0]===id);if(a)toast("🏆 إنجاز جديد: "+a[2])}}
async function run(){
 if(!S.program.length){toast("أضف أمرًا واحدًا على الأقل");return}
 const btn=$("#run");btn.disabled=true;let log=[];
 for(const t of S.program){
  S.used++;S.xp+=10;
  if(t==="move"){S.player.x=Math.max(-18,Math.min(18,S.player.x+Math.cos(S.rotation*Math.PI/2)));S.player.z=Math.max(-18,Math.min(18,S.player.z+Math.sin(S.rotation*Math.PI/2)));S.steps++;log.push("تحرك");await animatePlayer("move")}
  if(t==="turn"){S.rotation=(S.rotation+1)%4;log.push("استدارة");await animatePlayer("turn")}
  if(t==="jump"){log.push("قفز");await animatePlayer("jump")}
  if(t==="repeat"){for(let i=0;i<3;i++){S.player.x=Math.max(-18,Math.min(18,S.player.x+Math.cos(S.rotation*Math.PI/2)));S.player.z=Math.max(-18,Math.min(18,S.player.z+Math.sin(S.rotation*Math.PI/2)));S.steps++;await animatePlayer("move")}unlock("loop");log.push("تكرار ×3")}
  if(t==="collect"){S.wood++;S.gem++;unlock("collector");log.push("جمع");await animatePulse()}
  if(t==="plant"){if(S.seeds>0){S.seeds--;S.plants.push({x:S.player.x,z:S.player.z});unlock("gardener");log.push("زراعة");await animateWorldAction("plant")}else log.push("لا توجد بذور")}
  if(t==="build"){if(S.wood>=3&&!S.house){S.wood-=3;S.house=true;unlock("builder");log.push("بناء");await animateWorldAction("build")}else if(S.house){log.push("المنزل موجود")}else log.push("تحتاج 3 أخشاب")}
  save();updateUI();drawAll();
 }
 S.ran=true;unlock("first");save();updateUI();drawAll();$("#worldState").textContent="تم التنفيذ ✓";$("#output").textContent="✓ "+log.join(" · ");toast("تم التنفيذ · +"+S.program.length*10+" XP");btn.disabled=false;
}
$("#run").onclick=run;
function resetWorld(){S.player={x:0,z:0};S.rotation=0;S.plants=[];S.house=false;save();updateUI();drawAll();toast("أعيد العالم فقط — تقدمك محفوظ")}
$("#reset").onclick=resetWorld;
function explore(){S.player.x=((S.player.x+1+5)%5)-2;S.player.z=((S.player.z+1+5)%5)-2;S.explores++;unlock("explorer");save();updateUI();drawAll();toast("اكتشفت مكانًا جديدًا")}
$("#explore").onclick=explore;
$$("[data-explore]").forEach(b=>b.onclick=explore);
$("#fullscreen").onclick=()=>{const el=$(".worldFrame");if(!document.fullscreenElement)el.requestFullscreen?.();else document.exitFullscreen?.()};
$("#begin").onclick=()=>{$("#workspace").scrollIntoView({behavior:"smooth",block:"start"});toast("ابدأ باختيار 2 أو 3 أوامر")};
$("#how").onclick=()=>modal("كيف تلعب؟","اختر البلوكات أو اسحبها إلى البرنامج، ثم شغّلها. الموارد والإنجازات والبرنامج تُحفظ تلقائيًا على جهازك. أمر البناء يحتاج 3 أخشاب فعلية؛ وإعادة العالم لا تمسح تقدمك.");
