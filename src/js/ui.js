function level(){return Math.floor(S.xp/100)+1}
function updateUI(){
 const a=Object.keys(S.ach).length;
 $("#xpStat").textContent=S.xp+" XP";$("#xpTop").textContent=S.xp+" XP";$("#level").textContent=level();$("#usedStat").textContent=S.used;$("#woodStat").textContent=S.wood;$("#wood").textContent=S.wood;$("#gem").textContent=S.gem;$("#seed").textContent=S.seeds;$("#fish").textContent=S.fish||0;$("#food").textContent=S.food||0;$("#achStat").textContent=a+" / "+ACH.length;
 $("#p1").style.width=(S.steps>0?100:0)+"%";$("#p2").style.width=(S.ach.loop&&S.ach.collector?100:0)+"%";$("#p3").style.width=(S.ach.gardener||S.house?100:0)+"%";
 $("#c1").textContent=S.steps?"✓":"○";$("#c2").textContent=S.ach.loop&&S.ach.collector?"✓":"🔒";$("#c3").textContent=S.ach.gardener||S.house?"✓":"🔒";
 $("#worldLevel").textContent=level();$("#wood2").textContent=S.wood;$("#gem2").textContent=S.gem;
 renderAchievements();renderTasks();renderLibrary();renderProject();renderSettings();
}
function renderAchievements(){
 const html=ACH.map(a=>'<div class="card '+(S.ach[a[0]]?"":"locked")+'"><div class="big">'+a[1]+'</div><b>'+a[2]+'</b><small>'+(S.ach[a[0]]?"✓ مكتمل":a[3])+'</small></div>').join("");
 $("#achievementCards").innerHTML=html;$("#allAchievements").innerHTML=ACH.map(a=>'<div class="panel feature '+(S.ach[a[0]]?"":"locked")+'"><div style="font-size:28px">'+a[1]+'</div><h3>'+a[2]+'</h3><p>'+a[3]+'<br><strong>'+(S.ach[a[0]]?"✓ تم فتحه":"غير مكتمل")+'</strong></p></div>').join("");
}
function renderTasks(){
 const tasks=[["تحرك","نفّذ أمر تحرك",S.steps>0],["اجمع","اجمع خشبًا",S.ach.collector],["كرر","استخدم التكرار",S.ach.loop],["ازرع","ازرع بذرة",S.ach.gardener],["ابنِ","اجمع 3 أخشاب وابنِ",S.house],["استكشف","حرّك الكاميرا أو الشخصية",S.ach.explorer]];
 $("#taskCards").innerHTML=tasks.map(x=>'<div class="panel feature"><div style="font-size:26px">'+(x[2]?"✅":"🎯")+'</div><h3>'+x[0]+'</h3><p>'+x[1]+'<br><strong>'+(x[2]?"مكتملة":"قيد التنفيذ")+'</strong></p></div>').join("");
}
function renderLibrary(){
 const d={move:"تحريك الشخصية خطوة إلى الأمام.",turn:"تغيير اتجاه الشخصية.",jump:"تنفيذ قفزة مرئية.",repeat:"تنفيذ الحركة للأمام 3 مرات.",collect:"الحصول على خشب وجوهرة.",plant:"استهلاك بذرة وزراعة نبات.",build:"بناء منزل مقابل 3 أخشاب."};
 $("#libraryCards").innerHTML=Object.keys(TYPES).map(k=>'<div class="panel feature"><div style="font-size:25px">'+TYPES[k].label.split(" ")[0]+'</div><h3>'+TYPES[k].label.slice(TYPES[k].label.indexOf(" ")+1)+'</h3><p>'+d[k]+'</p></div>').join("");
}
function renderProject(){
 $("#projectInfo").innerHTML='<div class="row"><div class="ico">🗂</div><div class="grow"><b>مغامرتي الأولى</b><small>'+S.program.length+' أمر · '+S.xp+' XP · '+Object.keys(S.ach).length+' إنجازات</small></div><span>محفوظ ✓</span></div><div class="row"><div class="ico">💾</div><div class="grow"><b>حفظ محلي</b><small>لا توجد حسابات أو خوادم؛ بياناتك تبقى في هذا المتصفح.</small></div></div>';
}
function renderSettings(){
 const set=(id,on)=>{const e=$("#"+id);if(!e)return;e.classList.toggle("on",on);e.querySelector("span").style.transform=on?"translateX(-18px)":"translateX(0)"};
 set("keyboardToggle",S.settings.keyboard);set("hintToggle",S.settings.hints);
 $(".canvasHint").style.display=S.settings.hints?"block":"none";
}
function factory(){
 if(!confirm("سيتم حذف كل البرنامج والموارد والإنجازات. هل تريد المتابعة؟"))return;
 S=structuredClone(defaultState);history=[];save();renderProgram();updateUI();toast("تم مسح التقدم بالكامل");
}
$("#newProject").onclick=()=>{if(S.program.length&&!confirm("بدء مشروع جديد؟ سيتم حذف البرنامج فقط مع إبقاء الإنجازات والموارد."))return;S.program=[];history=[];save();renderProgram();updateUI();showPage("home");toast("بدأ مشروع جديد")};
$("#keyboardToggle").onclick=()=>{S.settings.keyboard=!S.settings.keyboard;save();updateUI()};
$("#hintToggle").onclick=()=>{S.settings.hints=!S.settings.hints;save();updateUI()};
$("#factoryReset").onclick=factory;

