/* أدوات BlockWorld الإضافية: نسخ احتياطي، تراجع العالم، تحديات ومساعد البناء */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
let history=[],future=[],restoring=false,batch=false,backupTimer=null;
const MAX_HISTORY=30;
const safe=(fn)=>{try{return fn()}catch(e){console.error('[BlockWorld tools]',e);return null}};
function toastSafe(msg){if(typeof toast==='function')toast(msg);else console.info(msg)}
function snapshot(){
 if(!started||!S||!pl)return null;
 return {xp:S.xp||0,inv:{...(S.inv||{})},placed:placed.map(p=>[p.k,p.i,p.x,p.z,+(p.ry||0),+(p.e||0),p.beh?p.beh.t:0,p.beh?p.beh.p:0]),found:{...(S.found||{})},pos:[pl.x,pl.z],hue:S.hue,avatar:{...(S.avatar||{})},prog:(prog||[]).map(b=>({...b})),custom:(S.custom||[]).map(b=>({...b}))};
}
function pushHistory(){
 if(restoring||batch||!started)return;
 const s=snapshot();if(!s)return;
 history.push(s);if(history.length>MAX_HISTORY)history.shift();future=[];
}
function applySnapshot(s){
 if(!s||!started)return;
 restoring=true;
 try{
  placed.slice().forEach(p=>removeObj(p));
  S.xp=s.xp;S.inv={...s.inv};S.found={...s.found};S.hue=s.hue;S.avatar={...(s.avatar||{})};S.custom=(s.custom||[]).map(b=>({...b}));prog=(s.prog||[]).map(b=>({...b}));S.prog=prog;
  (s.placed||[]).forEach(a=>{if(Array.isArray(a)&&DEFS[a[0]]&&DEFS[a[0]][a[1]]){const p=placeObj({k:a[0],i:a[1],x:a[2],z:a[3],ry:a[4],e:a[5]});if(a[6])p.beh={t:a[6],p:a[7]||4}}});
  if(Array.isArray(s.pos)&&s.pos.length===2){pl.x=Number(s.pos[0])||0;pl.z=Number(s.pos[1])||0}
  if(typeof setAvatarAppearance==='function')setAvatarAppearance(S.avatar||{});
  if(typeof dirty==='function')dirty();if(typeof refreshPanels==='function')refreshPanels();if(typeof hud==='function')hud();
 }finally{restoring=false}
}
function undoWorld(){if(!history.length)return toastSafe('لا توجد تغييرات في العالم للتراجع عنها');const now=snapshot();if(now)future.push(now);applySnapshot(history.pop());toastSafe('↶ تم التراجع عن تعديل العالم')}
function redoWorld(){if(!future.length)return toastSafe('لا توجد تغييرات لإعادتها');const now=snapshot();if(now)history.push(now);applySnapshot(future.pop());toastSafe('↷ تمت إعادة تعديل العالم')}
function download(name,data){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)}
function exportWorld(){const s=snapshot();if(!s)return toastSafe('ابدأ اللعب أولًا');download('blockworld-world.json',{format:'blockworld-world',version:1,createdAt:new Date().toISOString(),save:s});toastSafe('📦 تم تصدير عالمك كاملًا')}
function restoreBackup(){try{const d=JSON.parse(localStorage.getItem('bw_world_backup')||'null');if(!d||d.format!=='blockworld-world'||!d.save)throw Error('لم نعثر على نسخة احتياطية محلية');if(!confirm('سيتم استبدال العالم الحالي بآخر نسخة محفوظة محليًا. هل تريد المتابعة؟'))return;pushHistory();applySnapshot(d.save);closeTools();toastSafe('♻️ تمت استعادة النسخة المحلية')}catch(e){const el=$('#bwToolError');if(el)el.textContent=e.message||'تعذرت استعادة النسخة'}}
function saveBackup(){
 const s=snapshot();if(!s)return;
 try{localStorage.setItem('bw_world_backup',JSON.stringify({format:'blockworld-world',version:1,savedAt:new Date().toISOString(),save:s}))}catch(e){toastSafe('مساحة النسخ الاحتياطي ممتلئة؛ صدّر العالم إلى ملف')}
}
function importWorld(file){
 const rd=new FileReader();rd.onload=()=>{
  try{
   const d=JSON.parse(String(rd.result||'')),s=d&&d.save;
   if(!d||d.format!=='blockworld-world'||d.version!==1||!s||!Array.isArray(s.placed)||!Array.isArray(s.pos)||!Array.isArray(s.prog))throw Error('ملف العالم غير صالح أو من إصدار غير مدعوم');
   if(s.placed.length>2000||s.prog.length>120||!s.inv||typeof s.inv!=='object')throw Error('الملف يتجاوز الحدود الآمنة');
   const valid=s.placed.every(a=>Array.isArray(a)&&DEFS[a[0]]&&DEFS[a[0]][a[1]]&&Number.isFinite(+a[2])&&Number.isFinite(+a[3])&&Math.abs(+a[2])<500&&Math.abs(+a[3])<500);
   if(!valid)throw Error('يحتوي الملف على عناصر أو إحداثيات غير صالحة');
   if(!confirm('سيستبدل هذا الملف عالمك الحالي. هل تريد المتابعة؟'))return;
   pushHistory();applySnapshot(s);saveBackup();closeTools();toastSafe('✅ تم استيراد العالم وحفظ نسخة محلية منه');
  }catch(e){const el=$('#bwToolError');if(el)el.textContent=e.message||'تعذر استيراد الملف'}
 };rd.readAsText(file);
}
const challenges=[
 {id:'first-build',title:'البداية الإبداعية',desc:'ضع 5 عناصر أو أدوات في عالمك',check:s=>s.placed.length>=5,reward:20},
 {id:'green-garden',title:'حديقة صغيرة',desc:'ازرع 3 أشجار أو نباتات',check:s=>s.placed.filter(a=>a[0]==='e'&&ELS[a[1]]&&/شجرة|صنوبر|بلوط|نخلة|بامبو|نبات|عشب|زهرة|وردة|توليب|فطر|شجيرة/.test(ELS[a[1]].n)).length>=3,reward:30},
 {id:'explorer',title:'مستكشف العالم',desc:'اكتشف 3 مناطق مختلفة',check:s=>Object.keys(s.found||{}).length>=3,reward:40},
 {id:'architect',title:'مهندس صغير',desc:'ابنِ 10 قطع من أدوات البناء',check:s=>s.placed.filter(a=>a[0]==='p').length>=10,reward:50},
 {id:'programmer',title:'المبرمج الصغير',desc:'أنشئ برنامجًا من 5 بلوكات',check:s=>(s.prog||[]).length>=5,reward:30}
];
function doneSet(){try{return new Set(JSON.parse(localStorage.getItem('bw_challenge_done')||'[]'))}catch(_){return new Set()}}
function checkChallenges(){
 if(!started)return;const s=snapshot();if(!s)return;const done=doneSet();let changed=false;
 challenges.forEach(c=>{if(!done.has(c.id)&&c.check(s)){done.add(c.id);S.xp=(S.xp||0)+c.reward;changed=true;toastSafe('🏆 اكتمل تحدي «'+c.title+'»! +'+c.reward+' XP')}});if(changed){try{localStorage.setItem('bw_challenge_done',JSON.stringify([...done]))}catch(_){}if(typeof dirty==='function')dirty();if($('#bwTools').classList.contains('on'))renderTools()}
}
function nearPos(){const x=Math.round((pl.x+Math.sin(pl.ry)*7)*2)/2,z=Math.round((pl.z+Math.cos(pl.ry)*7)*2)/2;return{x,z}}
function buildPlan(kind){
 const p=nearPos(),parts=[];
 const find=(b)=>PTS.find(d=>d.b===b);
 const add=(b,x,z,ry=0,e=0)=>{const d=find(b);if(d)parts.push({k:'p',i:d.i,x:p.x+x,z:p.z+z,ry:pl.ry+ry,e})};
 if(kind==='house'){
  for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)if(Math.abs(x)===2||Math.abs(z)===2){if(z===2&&x===0)add('door',x,z);else add('wall',x,z,Math.abs(x)===2?Math.PI/2:0)}
  for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)add('floor',x,z);
  for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)add('roof',x,z,0,2.2);
  add('window',-1,2);add('window',1,2);
 }else if(kind==='garden'){
  for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)if(Math.abs(x)===3||Math.abs(z)===3)add('fence',x,z);
  for(let x=-2;x<=2;x+=2)for(let z=-2;z<=2;z+=2){const d=ELS.find(v=>/زهرة|وردة|توليب|شجرة|نخلة/.test(v.n));if(d)parts.push({k:'e',i:d.i,x:p.x+x,z:p.z+z,ry:0,e:0})}
 }else if(kind==='bridge'){
  for(let x=-4;x<=4;x++){add('bridge',x,0);add('fence',x,-1);add('fence',x,1)}
 }else if(kind==='tower'){
  for(let y=0;y<4;y++){add('wall',-1,-1,0,y*.8);add('wall',1,-1,0,y*.8);add('wall',-1,1,0,y*.8);add('wall',1,1,0,y*.8)}
  add('roof',0,0,0,3.5);add('door',0,1);
 }else{
  for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)if(Math.abs(x)===3||Math.abs(z)===3)add('fence',x,z);
  add('bench',0,0);add('lamp',-2,-2);add('lamp',2,2);
 }
 return parts;
}
function runBuilder(kind){
 if(!started)return toastSafe('ابدأ اللعب أولًا');const parts=buildPlan(kind);if(!parts.length)return toastSafe('تعذر تجهيز هذا التصميم');
 if(placed.length+parts.length>2000)return toastSafe('العالم قريب من الحد الآمن للعناصر');
 pushHistory();batch=true;try{parts.forEach(o=>{if(o.k==='e'&&!(S.inv['e'+o.i]>0))return; if(o.k==='e')S.inv['e'+o.i]--;placeObj(o)});}finally{batch=false}
 if(typeof dirty==='function')dirty();if(typeof refreshPanels==='function')refreshPanels();saveBackup();toastSafe('✨ أُضيف التصميم إلى عالمك؛ يمكنك التراجع عنه بزر ↶');renderTools();
}
function askBuilder(){
 const q=($('#bwIdea')?.value||'').trim().toLocaleLowerCase();if(!q)return $('#bwToolError').textContent='اكتب ما تريد بناءه، مثل: بيت أو حديقة أو جسر';
 let kind='park',name='حديقة وساحة',tip='أضف الزهور والأشجار من حقيبتك لإكمال التصميم.';
 if(/بيت|منزل|كوخ|house/.test(q)){kind='house';name='بيت صغير';tip='يتضمن أرضية وجدرانًا وسقفًا ونوافذ وبابًا.'}
 else if(/حديق|زهور|شجر|garden|park/.test(q)){kind='garden';name='حديقة مسوّرة';tip='سور محيط ومساحات مناسبة للنباتات.'}
 else if(/جسر|bridge/.test(q)){kind='bridge';name='جسر';tip='جسر طويل مع حواجز جانبية.'}
 else if(/برج|قلع|tower|castle/.test(q)){kind='tower';name='برج مراقبة';tip='برج بسيط متعدد الطبقات.'}
 else if(/ساح|منتزه|park|ملعب/.test(q)){kind='park';name='ساحة ترفيه';tip='ساحة مسوّرة مع إنارة ومقعد.'}
 $('#bwToolResult').innerHTML='<b>اقتراح: '+name+'</b><p>'+tip+'</p><button class="b1" id="bwBuildNow">✨ ابنِ هذا التصميم</button>';
 $('#bwBuildNow').onclick=()=>runBuilder(kind);$('#bwToolError').textContent='';
}
function renderTools(){
 const s=snapshot(),done=doneSet();if(!s)return;
 $('#bwToolStatus').textContent='العناصر: '+s.placed.length+' · بلوكات البرنامج: '+s.prog.length+' · مستوى '+(Math.floor(s.xp/100)+1);
 $('#bwChallenges').innerHTML=challenges.map(c=>{const ok=done.has(c.id);return '<div class="bw-challenge '+(ok?'done':'')+'"><b>'+(ok?'✅ ':'🏅 ')+c.title+'</b><small>'+c.desc+'</small><span>'+(ok?'مكتمل':'المكافأة: '+c.reward+' XP')+'</span></div>'}).join('');
 const stat=$('#bwHistoryStatus');if(stat)stat.textContent='تراجع: '+history.length+' · إعادة: '+future.length;
}
function closeTools(){$('#bwTools')?.classList.remove('on')}
function openTools(){if(!started)return toastSafe('ابدأ اللعب أولًا');$('#bwTools').classList.add('on');renderTools()}
function mount(){
 const header=$('header');if(!header)return;
 const b=document.createElement('button');b.className='chip';b.id='bTools';b.textContent='🧭 أدوات';b.title='النسخ الاحتياطي والتحديات ومساعد البناء';header.insertBefore(b,$('#bHelp'));b.onclick=openTools;
 const overlay=document.createElement('div');overlay.id='bwTools';overlay.innerHTML='<section class="bw-toolbox" role="dialog" aria-modal="true" aria-labelledby="bwToolTitle"><header class="bw-toolhead"><h2 id="bwToolTitle">🧭 أدوات العالم</h2><button id="bwToolClose" aria-label="إغلاق">✕</button></header><p id="bwToolStatus" class="bw-toolstatus">ابدأ اللعب لاستخدام الأدوات</p><div class="bw-tool-actions"><button id="bwUndo">↶ تراجع العالم</button><button id="bwRedo">↷ إعادة</button><button id="bwExport">⬇ تصدير العالم</button><button id="bwRestore">♻ استعادة النسخة المحلية</button><label class="bw-import">⬆ استيراد عالم<input id="bwImport" type="file" accept=".json,application/json"></label></div><p id="bwHistoryStatus" class="bw-toolstatus"></p><h3>🎧 إعدادات الصوت</h3><div class="bw-volume"><label for="bwMusicVol">الموسيقى الخلفية <span id="bwMusicVal"></span></label><input id="bwMusicVol" type="range" min="0" max="1" step="0.05"><label for="bwSfxVol">المؤثرات الصوتية <span id="bwSfxVal"></span></label><input id="bwSfxVol" type="range" min="0" max="1" step="0.05"></div><h3>🤖 مساعد البناء</h3><p class="bw-muted">اكتب فكرة، وسيقترح المساعد تصميمًا جاهزًا يمكن تعديله بعد بنائه.</p><div class="bw-ask"><input id="bwIdea" maxlength="120" placeholder="مثال: ابنِ لي بيتًا صغيرًا"><button id="bwAsk">اقترح</button></div><div id="bwToolResult" class="bw-result">جرّب: بيت، حديقة، جسر، برج، أو ساحة.</div><div id="bwToolError" class="err" role="status"></div><h3>🏆 تحدياتك</h3><div id="bwChallenges" class="bw-challenges"></div><p class="bw-muted">تُحفظ نسخة محلية تلقائيًا على هذا المتصفح. استخدم «تصدير العالم» للاحتفاظ بملف خارجي.</p></section>';
 document.body.appendChild(overlay);b.onclick=openTools;$('#bwToolClose').onclick=closeTools;overlay.addEventListener('click',e=>{if(e.target===overlay)closeTools()});
 $('#bwUndo').onclick=undoWorld;$('#bwRedo').onclick=redoWorld;$('#bwExport').onclick=exportWorld;$('#bwRestore').onclick=restoreBackup;$('#bwImport').onchange=e=>{if(e.target.files?.[0])importWorld(e.target.files[0]);e.target.value=''};
 const mv=$('#bwMusicVol'),sv=$('#bwSfxVol');mv.value=String(typeof musicVolume==='number'?musicVolume:.58);sv.value=String(typeof sfxVolume==='number'?sfxVolume:.8);$('#bwMusicVal').textContent=Math.round(+mv.value*100)+'%';$('#bwSfxVal').textContent=Math.round(+sv.value*100)+'%';mv.oninput=()=>{musicVolume=+mv.value;$('#bwMusicVal').textContent=Math.round(musicVolume*100)+'%';try{localStorage.setItem('bw_music_volume',String(musicVolume))}catch(_){}if(musicMaster&&soundCtx)musicMaster.gain.setTargetAtTime(musicVolume,soundCtx.currentTime,.12)};sv.oninput=()=>{sfxVolume=+sv.value;$('#bwSfxVal').textContent=Math.round(sfxVolume*100)+'%';try{localStorage.setItem('bw_sfx_volume',String(sfxVolume))}catch(_){}};$('#bwAsk').onclick=askBuilder;$('#bwIdea').onkeydown=e=>{if(e.key==='Enter')askBuilder();e.stopPropagation()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTools()});
}
function installHistoryHooks(){
 const wrap=(name)=>{try{const orig=window[name]||eval(name);if(typeof orig!=='function')return;const wrapped=function(...args){if(started&&!restoring&&!batch)pushHistory();return orig.apply(this,args)};window[name]=wrapped;try{eval(name+' = wrapped')}catch(_){}}catch(e){}};
 // Classic-script function bindings are wrapped directly so existing controls are tracked too.
 ['placeObj','removeObj','moveSelected','rotateSelected','changeSelectedHeight'].forEach(wrap);
}
document.addEventListener('DOMContentLoaded',mount,{once:true});
if(document.readyState!=='loading')mount();
setTimeout(()=>{installHistoryHooks()},0);
setInterval(()=>{if(started){saveBackup();checkChallenges()}},15000);
addEventListener('pagehide',saveBackup);
})();
