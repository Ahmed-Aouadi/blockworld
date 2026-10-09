// الواجهة: الحسابات، اللوحات، الدردشة، الهدايا، الحفظ
const $=s=>document.querySelector(s);
let S={xp:0,inv:{},placed:[],custom:[],found:{},pos:[0,6],hue:200,prog:[]},SH=false,since=0,chatTo=null,started=false,isDirty=false,openP=null;
const rnd=n=>Math.floor(Math.random()*n);
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2400)}
const spark_toast=toast,dirty=()=>{isDirty=true;hud()};
function hud(){const l=Math.floor(S.xp/100)+1;$('#lv').textContent=l;$('#xb').style.width=S.xp%100+'%'}
function onGift(){const i=rnd(ELS.length),n=1+rnd(3);S.inv['e'+i]=(S.inv['e'+i]||0)+n;S.xp+=5;toast('🎁 حصلت على '+n+'× '+ELS[i].n+'!');dirty();refreshPanels()}
function onZone(i){const z=ZONES[i];$('#zn').textContent=z.e+' '+z.n;if(!S.found[i]){S.found[i]=1;S.xp+=20;toast('🗺️ اكتشفت «'+z.n+'»! +20 XP ('+Object.keys(S.found).length+'/'+ZONES.length+')');dirty()}}
// ---------- اللوحات ----------
const PN=['Build','Code','Bag','Chat','Near'];
function togglePanel(n){const was=openP===n;PN.forEach(p=>$('#p'+p).classList.remove('on'));if(openP==='Build'&&was)setTool(null);openP=was?null:n;if(!was){$('#p'+n).classList.add('on');renderPanel(n)}else if(n==='Build')setTool(null)}
function renderPanel(n){({Build:rBuild,Code:rCode,Bag:rBag,Chat:rChat,Near:rNear})[n]()}
function refreshPanels(){if(openP&&openP!=='Code'&&openP!=='Chat')renderPanel(openP)}
let bk='e',bc=0;
function rBuild(){const cats=bk==='e'?ELC:PTC,L=bk==='e'?ELS:PTS,cat=cats[bc]||cats[0];
 $('#pBuild').innerHTML=`<h3>🔨 البناء <small>${ELS.length} عنصر · ${PTS.length} أداة بناء</small></h3><div class="tabs"><button class="${bk==='e'?'on':''}" data-bk="e">🌸 العناصر (${ELS.length})</button><button class="${bk==='p'?'on':''}" data-bk="p">🧱 أدوات البناء (${PTS.length})</button></div><div class="tabs">${cats.map((c,i)=>`<button class="${i===bc?'on':''}" data-bc="${i}">${c}</button>`).join('')}</div>
 <div class="grid">${L.filter(d=>d.cat===cat).map(d=>{const n=S.inv['e'+d.i]||0,no=bk==='e'&&!n,on=tool&&tool.k===bk&&tool.i===d.i;return`<button class="it ${no?'no':''} ${on?'on':''}" data-i="${d.i}"><i style="background:#${d.c.toString(16).padStart(6,'0')}"></i>${d.n}${bk==='e'?'<small>× '+n+'</small>':''}</button>`}).join('')}</div>
 <small>🗑 احذف · 👆 برمج عنصرًا · ⟳ دوّر · ⬆⬇ ارتفاع. انقر على الأرض للوضع.</small>`;
 const p=$('#pBuild');p.querySelectorAll('[data-bk]').forEach(b=>b.onclick=()=>{bk=b.dataset.bk;bc=0;rBuild()});p.querySelectorAll('[data-bc]').forEach(b=>b.onclick=()=>{bc=+b.dataset.bc;rBuild()});
 p.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{setTool({k:bk,i:+b.dataset.i});rBuild()})}
function rBag(){const items=Object.keys(S.inv).filter(k=>S.inv[k]>0).map(k=>({d:ELS[+k.slice(1)],n:S.inv[k]})).filter(x=>x.d);
 $('#pBag').innerHTML=`<h3>🎒 حقيبتي <small>${items.reduce((a,b)=>a+b.n,0)} قطعة</small></h3><small>اجمع الهدايا 🎁 المنتشرة في العالم للحصول على عناصر جديدة، وشاركها مع أصدقائك.</small><div class="grid">${items.map(x=>`<button class="it" data-i="${x.d.i}"><i style="background:#${x.d.c.toString(16).padStart(6,'0')}"></i>${x.d.n}<small>× ${x.n}</small></button>`).join('')||'<p>حقيبتك فارغة!</p>'}</div>`;
 $('#pBag').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{bk='e';bc=ELC.indexOf(ELS[+b.dataset.i].cat);setTool({k:'e',i:+b.dataset.i});togglePanel('Build')})}
// ---------- البرمجة ----------
let bcat=0;
function rCode(){const L=bcat===5?S.custom.map((c,i)=>({c:5,l:'⭐ '+c.name,k:'custom',p:i})):BLK.filter(b=>b.c===bcat);
 $('#pCode').innerHTML=`<h3>🧩 البرمجة <small>${BLK.length}+ بلوك</small></h3><div class="tabs">${BCATS.map((c,i)=>`<button class="${i===bcat?'on':''}" data-c="${i}">${c}</button>`).join('')}</div>
 <div class="grid" style="max-height:34%;flex:none;grid-template-columns:repeat(auto-fill,minmax(122px,1fr))">${L.map((b,i)=>`<button class="blk" data-b="${i}" style="border-inline-start:8px solid ${BCOL[b.c]}">${b.l}</button>`).join('')}</div>
 <div id="prog"></div><div class="row"><button id="runb" class="b1">${running?'⏹ إيقاف':'▶ تشغيل'}</button><button id="clrp">مسح</button><button id="newb" class="b2">➕ بلوك بالكود</button></div>`;
 const p=$('#pCode');p.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{bcat=+b.dataset.c;rCode()});
 p.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{if(running)return;if(prog.length>=120)return toast('الحد الأقصى 120 بلوكًا');const x=L[+b.dataset.b];prog.push({k:x.k,p:x.p,l:x.l,c:x.c});S.prog=prog;drawProg()});
 $('#runb').onclick=runProg;$('#clrp').onclick=()=>{if(!running){prog=[];drawProg()}};$('#newb').onclick=customModal;drawProg()}
function drawProg(){const z=$('#prog');if(!z)return;z.innerHTML=prog.length?'':'<small>اضغط على البلوكات لتضيفها هنا. «كرر» و«إذا» تحتاج «نهاية ⏹».</small>';let d=0;
 prog.forEach((b,i)=>{if(b.k==='end'&&d>0)d--;const e=document.createElement('div');e.className='pi'+(i===curI?' cur':'');e.style.cssText='margin-inline-start:'+d*14+'px;border-inline-start:8px solid '+BCOL[b.c];e.innerHTML='<span>'+b.l+'</span><button>×</button>';e.querySelector('button').onclick=()=>{if(!running){prog.splice(i,1);drawProg()}};z.appendChild(e);if(OPEN.has(b.k))d++})}
function modal(h){$('#mb').innerHTML=h;$('#modal').classList.add('on')}const closeModal=()=>$('#modal').classList.remove('on');$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
function customModal(){modal(`<h2>➕ بلوك بالكود</h2><small>اكتب بلوكك بلغة JavaScript. الأوامر: forward(n) back(n) turn(درجات) side(n) jump(h) wait(ثواني) say("نص") place("وردة") dance() color(0..360) size(1) emote("😀") collect() goto(0..5)</small>
 <input id="cbn" placeholder="اسم البلوك، مثل: مربع"><textarea id="cbc">for (let i = 0; i < 4; i++) {\n  forward(3);\n  turn(90);\n}</textarea><div class="err" id="cbe"></div><div class="row"><button class="b1" id="cbs">حفظ البلوك</button><button id="cbx">إلغاء</button></div>`);
 $('#cbx').onclick=closeModal;$('#cbs').onclick=()=>{const n=$('#cbn').value.trim().slice(0,20),c=$('#cbc').value;if(!n)return $('#cbe').textContent='اكتب اسمًا للبلوك';try{new AF('forward','back','turn','jump','wait','say','place','dance','color','size','emote','collect','goto','side',c)}catch(e){return $('#cbe').textContent='خطأ في الكود: '+e.message}
  S.custom.push({name:n,code:c});bcat=5;dirty();closeModal();if(openP!=='Code')togglePanel('Code');else rCode()}}
// ---------- برمجة العناصر ----------
const BEH=[['spin','دوران 🔄'],['swing','فتح وإغلاق 🚪'],['bounce','قفز ⬆️'],['sway','تمايل 🌬️'],['pulse','نبض 💗'],['slide','ذهاب وإياب ↔'],['color','تغيير اللون 🌈']];
function openScript(po){const d=DEFS[po.k][po.i],p=$('#pScript');p.classList.add('on');
 p.innerHTML=`<h3>🧪 برمجة: ${d.n} <button id="sx">✕</button></h3><small>اختر سلوكًا يتكرر كل مدة زمنية:</small><div class="tabs">${BEH.map(b=>`<button data-t="${b[0]}" class="${po.beh&&po.beh.t===b[0]?'on':''}">${b[1]}</button>`).join('')}</div>
 <label>المدة (ثوانٍ): <b id="pv">${po.beh?po.beh.p:4}</b></label><input type="range" id="pr" min="1" max="20" value="${po.beh?po.beh.p:4}"><button id="pc">إزالة السلوك</button>`;
 const set=t=>{clearBeh(po);po.beh=t?{t,p:+$('#pr').value}:null;dirty();openScript(po)};
 p.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>set(b.dataset.t));$('#pr').oninput=e=>{$('#pv').textContent=e.target.value;if(po.beh)po.beh.p=+e.target.value;dirty()};$('#pc').onclick=()=>set(null);$('#sx').onclick=()=>p.classList.remove('on')}
// ---------- اللاعبون والدردشة ----------
function rChat(){$('#pChat').innerHTML=`<h3>💬 الدردشة <small>${chatTo?'إلى '+chatTo.name+' (خاص)':'للجميع القريبين'}</small></h3><div class="msgs" id="msgs">${$('#msgs')?$('#msgs').innerHTML:''}</div><div class="row">${chatTo?'<button id="pub">🌍 عام</button>':''}<input id="ci" maxlength="120" placeholder="اكتب رسالة..." style="flex:3"><button class="b1" id="cs">إرسال</button></div>`;
 const send=async()=>{const t=$('#ci').value.trim();if(!t)return;if(NET.guest)return toast('سجّل الدخول للدردشة مع اللاعبين');$('#ci').value='';try{await NET.api('chat',{text:t,to:chatTo?chatTo.id:null})}catch(e){toast(e.message)}};
 $('#cs').onclick=send;$('#ci').onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')send()};const pb=$('#pub');if(pb)pb.onclick=()=>{chatTo=null;rChat()};$('#msgs').scrollTop=1e5}
function addMsg(m){const box=$('#msgs');const html=`<div class="${m.priv?'pv':''}"><b>${esc(m.from)}</b>${m.priv?' 🔒':''}: ${esc(m.text)}</div>`;if(box){box.insertAdjacentHTML('beforeend',html);box.scrollTop=1e5}else{window._mh=(window._mh||'')+html}if(openP!=='Chat')toast('💬 '+m.from+': '+m.text)}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function nearList(){return Object.keys(others).map(id=>({id,name:others[id].name,d:Math.hypot(others[id].x-pl.x,others[id].z-pl.z)})).filter(o=>o.d<14).sort((a,b)=>a.d-b.d)}
function rNear(){const L=nearList();$('#pNear').innerHTML=`<h3>👫 اللاعبون القريبون</h3>${NET.guest?'<p>سجّل الدخول لترى لاعبين حقيقيين.</p>':!SH?'<p>أنت في عالمك الخاص. اضغط «🌍 مشترك» بالأعلى لترى الآخرين.</p>':L.length?'':'<p>لا أحد قريب الآن — اقترب من لاعب آخر!</p>'}`+L.map(o=>`<div class="who"><span>🧒 ${esc(o.name)} <small>(${Math.round(o.d)} م)</small></span><span><button data-m="${o.id}">💬</button> <button data-g="${o.id}">🎁</button></span></div>`).join('');
 $('#pNear').querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{chatTo={id:b.dataset.m,name:others[b.dataset.m].name};togglePanel('Chat')});
 $('#pNear').querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>giftModal(b.dataset.g))}
function giftModal(id){const o=others[id];if(!o)return;const items=Object.keys(S.inv).filter(k=>S.inv[k]>0&&ELS[+k.slice(1)]);
 modal(`<h2>🎁 أرسل هدية إلى ${esc(o.name)}</h2>${items.length?`<select id="gi">${items.map(k=>`<option value="${k}">${ELS[+k.slice(1)].n} (× ${S.inv[k]})</option>`).join('')}</select><input id="gn" type="number" min="1" value="1"><div class="err" id="ge"></div><div class="row"><button class="b1" id="gs">إرسال</button><button id="gx">إلغاء</button></div>`:'<p>حقيبتك فارغة — اجمع الهدايا أولًا.</p>'}`);
 const x=$('#gx');if(x)x.onclick=closeModal;const s=$('#gs');if(s)s.onclick=async()=>{const k=$('#gi').value,n=Math.floor(+$('#gn').value);if(!(n>=1&&n<=S.inv[k]))return $('#ge').textContent='الكمية غير صحيحة';try{await NET.api('gift',{to:id,item:k,n});S.inv[k]-=n;dirty();closeModal();toast('🎁 أُرسلت الهدية!');refreshPanels()}catch(e){$('#ge').textContent=e.message}}}
async function tick(){if(NET.guest)return;try{const r=await NET.api('tick',{x:pl.x,z:pl.z,ry:pl.ry,sh:SH?1:0,since});since=Math.max(since,r.last||0);syncPlayers(SH?r.pl:[]);
 r.ms.forEach(addMsg);r.inbox.forEach(g=>{S.inv[g.item]=(S.inv[g.item]||0)+g.n;toast('🎁 '+g.from+' أهداك '+g.n+'× '+(ELS[+g.item.slice(1)]||{n:'عنصر'}).n);dirty()});if(r.inbox.length)refreshPanels();
 $('#onl').textContent='👤 '+(SH?r.pl.length+1:1)+' متصل';if(openP==='Near')rNear()}catch(e){}}
// ---------- الحفظ والدخول ----------
function serialize(){S.placed=placed.map(p=>[p.k,p.i,p.x,p.z,+(p.ry||0).toFixed(3),p.e||0,p.beh?p.beh.t:0,p.beh?p.beh.p:0]);S.pos=[pl.x,pl.z];S.prog=prog}
async function saveNow(){if(!started||!isDirty)return;isDirty=false;serialize();const save={xp:S.xp,inv:S.inv,placed:S.placed,custom:S.custom,found:S.found,pos:S.pos,hue:S.hue,prog:S.prog||[]};
 try{if(NET.guest)localStorage.setItem('bw_guest',JSON.stringify(save));else await NET.api('save',{save})}catch(e){isDirty=true}}
function startGame(save,name,hue){if(started)return;started=true;S={...S,...(save||{})};S.hue=hue||S.hue;if(!save||!Object.keys(S.inv||{}).length){S.inv=S.inv||{};[1,7,16,20,30,44,58,70].forEach(i=>{if(ELS[i])S.inv['e'+i]=3})}
 $('#auth').style.display='none';$('#hud').hidden=false;try{initWorld()}catch(e){document.body.innerHTML='<p style="padding:30px;font-size:20px">يحتاج المتصفح إلى WebGL ليعمل بلوك وورلد.</p>';return}
 (S.placed||[]).forEach(a=>{if(DEFS[a[0]]&&DEFS[a[0]][a[1]]){const po=placeObj({k:a[0],i:a[1],x:a[2],z:a[3],ry:a[4],e:a[5]});if(a[6])po.beh={t:a[6],p:a[7]||4}}});
 if(S.pos){pl.x=S.pos[0];pl.z=S.pos[1];if(!walkable(pl.x,pl.z)){pl.x=0;pl.z=6}}prog=S.prog||[];hud();$('#onl').textContent=NET.guest?'🎮 ضيف':'👤 1 متصل';$('#bShare').style.display=NET.guest?'none':'';
 setInterval(tick,500);setInterval(saveNow,6000);addEventListener('beforeunload',saveNow);
 toast(name?'أهلًا '+name+'! 🎉 استكشف، ابنِ، وبرمج':'أهلًا بك! 🎉');setTimeout(()=>{onZone(0)},600)}
async function auth(kind){const n=$('#un').value.trim(),p=$('#pw').value;$('#aerr').textContent='';try{const r=await NET.api(kind,{name:n,pass:p});NET.token=r.token;NET.guest=false;localStorage.setItem('bw_t',r.token);startGame(r.save,r.name,r.hue)}catch(e){$('#aerr').textContent=e.message==='Failed to fetch'?'الخادم غير متصل — شغّل node server.js أو العب كضيف':e.message}}
$('#bLogin').onclick=()=>auth('login');$('#bReg').onclick=()=>auth('register');$('#pw').onkeydown=e=>{if(e.key==='Enter')auth('login')};
$('#bGuest').onclick=()=>{let s=null;try{s=JSON.parse(localStorage.getItem('bw_guest')||'null')}catch(e){}NET.guest=true;startGame(s,'',200)};
(async()=>{const t=localStorage.getItem('bw_t');if(!t)return;NET.token=t;try{const r=await NET.api('me');NET.guest=false;startGame(r.save,r.name,r.hue)}catch(e){NET.token=null}})();
// ---------- الأزرار ----------
document.querySelectorAll('#dock [data-p]').forEach(b=>b.onclick=()=>togglePanel(b.dataset.p));
$('#bShare').onclick=()=>{SH=!SH;$('#bShare').textContent=SH?'🌍 مشترك':'🏡 خاص';if(!SH)syncPlayers([]);toast(SH?'العالم المشترك: سترى اللاعبين الآخرين':'عالمك الخاص: تتجول وحدك')};
$('#bShare').textContent='🏡 خاص';
$('#tDel').onclick=()=>{setTool('del');toast('🗑 انقر على العنصر الذي تريد حذفه')};$('#tSel').onclick=()=>{setTool('sel');toast('🧩 انقر على عنصر لفتح إعدادات برمجته')};$('#tCopy').onclick=()=>{setTool('copy');toast('📋 انقر على عنصر لنسخه — يلزم توفره في الحقيبة')};$('#tOff').onclick=()=>{setTool(null);if(openP==='Build')rBuild()};
$('#tRot').onclick=()=>{rot+=Math.PI/4;if(ghost)ghostPlace()};$('#tUp').onclick=()=>{elev=Math.min(4.4,elev+.55);toast('الارتفاع: '+Math.round(elev/.55));if(ghost)ghostPlace()};$('#tDn').onclick=()=>{elev=Math.max(0,elev-.55);toast('الارتفاع: '+Math.round(elev/.55));if(ghost)ghostPlace()};
document.querySelectorAll('#dpad [data-k]').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});['pointerup','pointercancel','pointerleave'].forEach(v=>b.addEventListener(v,()=>keys[k]=false))});
$('#jump').addEventListener('pointerdown',e=>{e.preventDefault();keys.jump=true});
const KM={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;if(KM[e.code]){keys[KM[e.code]]=true;e.preventDefault()}if(e.code==='Space'){keys.jump=true;e.preventDefault()}if(e.key==='Shift')keys.shift=true;
 if(e.code==='KeyR'&&tool&&tool.k){rot+=Math.PI/4;ghostPlace()}if(e.code==='Escape'){if(openP)togglePanel(openP);setTool(null);closeModal()}});
addEventListener('keyup',e=>{if(KM[e.code])keys[KM[e.code]]=false;if(e.key==='Shift')keys.shift=false});
