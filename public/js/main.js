// الواجهة: الحسابات، اللوحات، الدردشة، الهدايا، الحفظ
const $=s=>document.querySelector(s);

// مؤثرات صوتية مولّدة داخل المتصفح، بلا ملفات خارجية.
let soundOn=true,soundCtx=null,soundLast=0,sfxVolume=.8,musicVolume=.58;
try{soundOn=localStorage.getItem('bw_sound')!=='off';sfxVolume=Math.max(0,Math.min(1,Number(localStorage.getItem('bw_sfx_volume')??.8)));musicVolume=Math.max(0,Math.min(1,Number(localStorage.getItem('bw_music_volume')??.58)))}catch(_){}
function sfx(kind='ui'){
 if(!soundOn)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  if(!soundCtx)soundCtx=new AC();if(soundCtx.state==='suspended')soundCtx.resume();
  const now=soundCtx.currentTime;
  const seq={ui:[[520,.045,'sine']],open:[[440,.06,'sine'],[660,.08,'sine']],step:[[250,.045,'triangle'],[340,.05,'triangle']],jump:[[330,.07,'sine'],[520,.12,'sine'],[680,.1,'sine']],build:[[390,.06,'triangle'],[520,.07,'triangle'],[760,.11,'sine']],collect:[[620,.06,'sine'],[830,.08,'sine'],[1040,.13,'sine']],turn:[[420,.05,'sine']],run:[[440,.07,'triangle'],[660,.08,'triangle']],done:[[523,.09,'sine'],[659,.09,'sine'],[784,.16,'sine']],error:[[240,.13,'sawtooth'],[180,.15,'sawtooth']],night:[[360,.1,'sine'],[290,.14,'sine']],say:[[560,.055,'sine']]};
  const notes=seq[kind]||seq.ui;notes.forEach((n,i)=>{const o=soundCtx.createOscillator(),g=soundCtx.createGain();o.type=n[2];o.frequency.setValueAtTime(n[0],now+i*.075);g.gain.setValueAtTime(.0001,now+i*.075);g.gain.exponentialRampToValueAtTime(.055*sfxVolume,now+i*.075+.012);g.gain.exponentialRampToValueAtTime(.0001,now+i*.075+n[1]);o.connect(g);g.connect(soundCtx.destination);o.start(now+i*.075);o.stop(now+i*.075+n[1]+.015)});
 }catch(_){}
}
function toggleSound(){soundOn=!soundOn;try{localStorage.setItem('bw_sound',soundOn?'on':'off')}catch(_){}const b=$('#bSound');if(b){b.textContent=soundOn?'🔊 الصوت':'🔇 الصوت';b.title=soundOn?'إيقاف المؤثرات الصوتية':'تشغيل المؤثرات الصوتية'}if(soundOn)sfx('open');toast(soundOn?'🔊 تم تشغيل المؤثرات الصوتية':'🔇 تم كتم المؤثرات الصوتية')}

/* موسيقى خلفية هادئة مولّدة محليًا؛ تبدأ بعد أول تفاعل احترامًا لسياسة تشغيل الصوت بالمتصفح. */
let musicOn=true,musicMaster=null,musicTimer=null,musicStep=0,musicReady=false;
try{musicOn=localStorage.getItem('bw_music')!=='off'}catch(_){}
const musicChords=[[261.63,329.63,392.00],[220.00,261.63,329.63],[174.61,220.00,261.63],[196.00,246.94,293.66]],musicNightChords=[[196,233.08,293.66],[174.61,220,261.63],[146.83,185,220],[164.81,196,246.94]];
function musicNote(freq,when,duration,volume){
 if(!soundCtx||!musicMaster)return;
 const o=soundCtx.createOscillator(),g=soundCtx.createGain(),filter=soundCtx.createBiquadFilter();
 o.type='sine';o.frequency.setValueAtTime(freq,when);
 filter.type='lowpass';filter.frequency.setValueAtTime(950,when);filter.Q.value=.4;
 g.gain.setValueAtTime(.0001,when);
 g.gain.linearRampToValueAtTime(volume,when+1.1);
 g.gain.setValueAtTime(volume,when+Math.max(1.2,duration-1.1));
 g.gain.exponentialRampToValueAtTime(.0001,when+duration);
 o.connect(filter);filter.connect(g);g.connect(musicMaster);
 o.start(when);o.stop(when+duration+.08);
}
function playMusicPhrase(){
 if(!musicOn||!soundCtx||!musicMaster)return;
 const now=soundCtx.currentTime+0.12,night=typeof nightMode!=='undefined'&&nightMode,chords=night?musicNightChords:musicChords,chord=chords[musicStep%chords.length];
 chord.forEach((f,i)=>musicNote(f,now+i*.18,5.6,.012));
 // نغمة علوية خفيفة تمنح الخلفية إحساسًا هادئًا دون أن تطغى على اللعب.
 musicNote(chord[2]*2,now+1.2,3.8,.0045);
 musicStep++;
}
function startMusic(){
 if(!musicOn||musicTimer)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  if(!soundCtx)soundCtx=new AC();
  if(soundCtx.state==='suspended')soundCtx.resume();
  musicMaster=soundCtx.createGain();musicMaster.gain.value=musicVolume;musicMaster.connect(soundCtx.destination);
  musicReady=true;playMusicPhrase();musicTimer=setInterval(playMusicPhrase,5600);
  updateMusicButton();
 }catch(_){}
}
function stopMusic(){
 if(musicTimer){clearInterval(musicTimer);musicTimer=null}
 if(musicMaster){try{musicMaster.gain.setTargetAtTime(.0001,soundCtx.currentTime,.18);const old=musicMaster;setTimeout(()=>{try{old.disconnect()}catch(_){}},900)}catch(_){}musicMaster=null}
 updateMusicButton();
}
function toggleMusic(){
 musicOn=!musicOn;try{localStorage.setItem('bw_music',musicOn?'on':'off')}catch(_){}
 if(musicOn){if(!musicReady)startMusic();else startMusic()}else stopMusic();
 updateMusicButton();toast(musicOn?'🎵 تم تشغيل الموسيقى الهادئة':'🔇 تم إيقاف الموسيقى الخلفية');
}
function updateMusicButton(){const b=$('#bMusic');if(b){b.textContent=musicOn?'🎵 الموسيقى':'♫ الموسيقى';b.title=musicOn?'إيقاف الموسيقى الخلفية':'تشغيل الموسيقى الخلفية';b.setAttribute('aria-pressed',String(musicOn))}}
document.addEventListener('pointerdown',()=>{if(musicOn)startMusic()},{once:true,passive:true});
document.addEventListener('keydown',()=>{if(musicOn)startMusic()},{once:true});

document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.id==='bSound'||b.disabled)return;const id=b.id||'',t=(b.textContent||'').trim();if(id==='runb')return;if(id==='bTime')sfx('night');else if(id==='bAvatar'||id==='bHelp'||id==='bShare'||b.dataset.p)sfx('open');else if(/حفظ|وضع|بناء|نسخ|تأكيد/.test(t))sfx('build');else if(/تشغيل|ابدأ/.test(t))sfx('run');else sfx('ui')},true);

let S={xp:0,inv:{},placed:[],custom:[],found:{},pos:[0,6],hue:200,avatar:{skin:0xffd2ad,hair:0x49334a,outfit:0x3da5ff,trim:0x2674b4,pants:0x34364b,shoes:0x34364b,scarf:0xffca58,hat:'none',hatColor:0x3da5ff},prog:[]},SH=false,since=0,chatTo=null,started=false,isDirty=false,saving=false,saveVersion=0,openP=null;
let selectedPo=null,selectionBox=null;
// سحب اللوحات من شريط العنوان لتغيير مكانها ومنع تداخل لوحة البرمجة مع الأدوات.
(function enablePanelDragging(){
 let drag=null;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 document.addEventListener('pointerdown',e=>{
  const head=e.target.closest('.panel h3');
  if(!head||e.target.closest('button,input,select,textarea'))return;
  const panel=head.closest('.panel');if(!panel||!panel.classList.contains('on'))return;
  const r=panel.getBoundingClientRect();
  panel.style.left=r.left+'px';panel.style.top=r.top+'px';panel.style.right='auto';panel.style.bottom='auto';
  panel.style.insetInlineStart='auto';panel.style.insetInlineEnd='auto';
  panel.classList.add('dragging');drag={panel,x:e.clientX,y:e.clientY,left:r.left,top:r.top};
  try{head.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault();
 });
 document.addEventListener('pointermove',e=>{if(!drag)return;const p=drag.panel,r=p.getBoundingClientRect();
  const left=clamp(drag.left+e.clientX-drag.x,8,Math.max(8,innerWidth-r.width-8));
  const top=clamp(drag.top+e.clientY-drag.y,8,Math.max(8,innerHeight-Math.min(r.height,70)));
  p.style.left=left+'px';p.style.top=top+'px';
 });
 const stop=()=>{if(drag){drag.panel.classList.remove('dragging');drag=null}};
 document.addEventListener('pointerup',stop);document.addEventListener('pointercancel',stop);
})();
const rnd=n=>Math.floor(Math.random()*n);
function clearPlacedSelection(){if(selectionBox&&typeof scene!=='undefined')scene.remove(selectionBox);selectionBox=null;selectedPo=null}
function selectPlaced(po){clearPlacedSelection();selectedPo=po;selectionBox=new THREE.BoxHelper(po.g,0xffc928);scene.add(selectionBox);toast('تم تحديد العنصر — الأسهم للتحريك، Q/E للتدوير، Delete للحذف');}
function moveSelected(dx,dz){if(!selectedPo)return;const po=selectedPo,x=Math.max(-HALF+2,Math.min(HALF-2,Math.round((po.x+dx)*2)/2)),z=Math.max(-HALF+2,Math.min(HALF-2,Math.round((po.z+dz)*2)/2));if(!walkable(x,z))return;po.x=x;po.z=z;po.g.position.x=x;po.g.position.z=z;po.g.userData.x0=x;po.g.userData.z0=z;po.g.userData.y0=Math.max(H(x,z),-.3)+(po.e||0)+(po.k==='p'&&PART_Y[DEFS[po.k][po.i].b]||0);po.g.position.y=po.g.userData.y0;const c=cols.find(v=>v.o===po);if(c){c.x=x;c.z=z}if(selectionBox)selectionBox.update();dirty()}
function rotateSelected(dir){if(!selectedPo)return;const po=selectedPo;po.ry=((po.ry||0)+dir*Math.PI/4)%(Math.PI*2);po.g.rotation.y=po.ry;po.g.userData.ry0=po.ry;const c=cols.find(v=>v.o===po);if(c)c.ry=po.ry;if(selectionBox)selectionBox.update();dirty()}
function changeSelectedHeight(dir){if(!selectedPo)return;selectedPo.e=Math.max(0,Math.min(4.4,Math.round(((selectedPo.e||0)+dir*.55)*100)/100));const po=selectedPo;po.g.position.y=Math.max(H(po.x,po.z),-.3)+(po.e||0)+(po.k==='p'&&PART_Y[DEFS[po.k][po.i].b]||0);po.g.userData.y0=po.g.position.y;if(selectionBox)selectionBox.update();dirty()}
function deleteSelected(){if(!selectedPo)return;const po=selectedPo;removeObj(po);if(po.k==='e')S.inv['e'+po.i]=(S.inv['e'+po.i]||0)+1;clearPlacedSelection();dirty();refreshPanels();toast('تم حذف العنصر المحدد')}
function duplicateSelected(){if(!selectedPo)return;const po=selectedPo;if(po.k==='e'&&!(S.inv['e'+po.i]>0))return toast('لا توجد نسخة في الحقيبة');if(po.k==='e')S.inv['e'+po.i]--;const copy=placeObj({k:po.k,i:po.i,x:Math.min(HALF-2,po.x+1),z:po.z,ry:po.ry||0,e:po.e||0});if(po.beh)copy.beh={...po.beh};selectPlaced(copy);dirty();refreshPanels();toast('تم نسخ العنصر')}

function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2400)}
const spark_toast=toast,dirty=()=>{isDirty=true;saveVersion++;hud()};
function hud(){const l=Math.floor(S.xp/100)+1;$('#lv').textContent=l;$('#xb').style.width=S.xp%100+'%'}
function onGift(){const i=rnd(ELS.length),n=1+rnd(3);S.inv['e'+i]=(S.inv['e'+i]||0)+n;S.xp+=5;toast('🎁 حصلت على '+n+'× '+ELS[i].n+'!');dirty();refreshPanels()}
function onZone(i){const z=ZONES[i];$('#zn').textContent=z.e+' '+z.n;if(!S.found[i]){S.found[i]=1;S.xp+=20;toast('🗺️ اكتشفت «'+z.n+'»! +20 XP ('+Object.keys(S.found).length+'/'+ZONES.length+')');dirty()}}
// ---------- اللوحات ----------
const PN=['Build','Code','Bag','Chat','Near'];
function togglePanel(n){const was=openP===n;PN.forEach(p=>$('#p'+p).classList.remove('on'));if(openP==='Build'&&was)setTool(null);openP=was?null:n;if(!was){$('#p'+n).classList.add('on');renderPanel(n)}else if(n==='Build')setTool(null)}
function renderPanel(n){({Build:rBuild,Code:rCode,Bag:rBag,Chat:rChat,Near:rNear})[n]()}
function refreshPanels(){if(openP&&openP!=='Code'&&openP!=='Chat')renderPanel(openP)}
let bk='e',bc=0,buildSearch='';
const ITEM_GLYPHS={pine:'🌲',round:'🌳',palm:'🌴',bamboo:'🎋',flower:'🌷',tulip:'🌷',sun:'🌻',bouquet:'💐',crystal:'💎',grass:'🌱',bush:'🌿',fern:'🌿',mushroom:'🍄',cactus:'🌵',pumpkin:'🎃',rock:'🪨',animal:'🐾',lamp:'💡',bench:'🪑',sign:'🪧',flag:'🚩',mailbox:'📫',fire:'🔥',tent:'⛺',well:'🪣',fountain:'⛲',swing:'🎠',balloon:'🎈',chest:'🧰',barrel:'🛢️',crate:'📦',snowman:'⛄',scarecrow:'🧑‍🌾',mill:'🌬️',ball:'⚽',boat:'⛵',car:'🚙',rocket:'🚀',ufo:'🛸',portal:'🌀',star:'⭐',rainbow:'🌈',house:'🏠',wall:'🧱',door:'🚪',window:'🪟',roof:'🏡',floor:'🟫',fence:'🚧',pillar:'🏛️',stair:'🪜',bridge:'🌉',arch:'🏛️',chimney:'🏭',balcony:'🏠',tower:'🗼'};
function itemGlyph(d){return ITEM_GLYPHS[d.b]||'🧊'}
function itemThumb(d){return '<span class="item-preview" style="--item-color:#'+d.c.toString(16).padStart(6,'0')+'" aria-hidden="true"><span>'+itemGlyph(d)+'</span></span>'}

function rBuild(){const cats=bk==='e'?ELC:PTC,L=bk==='e'?ELS:PTS,cat=cats[bc]||cats[0],q=buildSearch.trim().toLocaleLowerCase(),shown=L.filter(d=>d.cat===cat&&(!q||d.n.toLocaleLowerCase().includes(q)||d.cat.toLocaleLowerCase().includes(q)));
 $('#pBuild').innerHTML=`<h3>🔨 البناء <small>${ELS.length} عنصر · ${PTS.length} أداة بناء</small></h3><div class="tabs"><button class="${bk==='e'?'on':''}" data-bk="e">🌸 العناصر (${ELS.length})</button><button class="${bk==='p'?'on':''}" data-bk="p">🧱 أدوات البناء (${PTS.length})</button></div><div class="tabs">${cats.map((c,i)=>`<button class="${i===bc?'on':''}" data-bc="${i}">${c}</button>`).join('')}</div>
 <input id="buildSearch" class="code-search" value="${esc(buildSearch)}" placeholder="🔎 ابحث عن عنصر أو أداة..." aria-label="البحث في كتالوج البناء">
 <div class="grid">${shown.map(d=>{const n=S.inv['e'+d.i]||0,no=bk==='e'&&!n,on=tool&&tool.k===bk&&tool.i===d.i;return`<button class="it ${no?'no':''} ${on?'on':''}" data-i="${d.i}">${itemThumb(d)}<span class="item-name">${esc(d.n)}</span>${bk==='e'?'<small>× '+n+'</small>':''}</button>`}).join('')}</div>
 <small>🗑 احذف · 👆 برمج عنصرًا · ⟳ دوّر · ⬆⬇ ارتفاع. انقر على الأرض للوضع.</small>`;
 const p=$('#pBuild');$('#buildSearch').oninput=e=>{buildSearch=e.target.value;const pos=e.target.selectionStart;rBuild();const s=$('#buildSearch');s.focus();s.setSelectionRange(pos,pos)};p.querySelectorAll('[data-bk]').forEach(b=>b.onclick=()=>{bk=b.dataset.bk;bc=0;rBuild()});p.querySelectorAll('[data-bc]').forEach(b=>b.onclick=()=>{bc=+b.dataset.bc;rBuild()});
 p.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{setTool({k:bk,i:+b.dataset.i});rBuild()})}
function rBag(){const items=Object.keys(S.inv).filter(k=>S.inv[k]>0).map(k=>({d:ELS[+k.slice(1)],n:S.inv[k]})).filter(x=>x.d);
 $('#pBag').innerHTML=`<h3>🎒 حقيبتي <small>${items.reduce((a,b)=>a+b.n,0)} قطعة</small></h3><small>اجمع الهدايا 🎁 المنتشرة في العالم للحصول على عناصر جديدة، وشاركها مع أصدقائك.</small><div class="grid">${items.map(x=>`<button class="it" data-i="${x.d.i}">${itemThumb(x.d)}<span class="item-name">${esc(x.d.n)}</span><small>× ${x.n}</small></button>`).join('')||'<p>حقيبتك فارغة!</p>'}</div>`;
 $('#pBag').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{bk='e';bc=ELC.indexOf(ELS[+b.dataset.i].cat);setTool({k:'e',i:+b.dataset.i});togglePanel('Build')})}
// ---------- البرمجة ----------
let bcat=0,progHistory=[],progFuture=[],codeSearch='';
function rememberProg(){progHistory.push(JSON.stringify(prog));if(progHistory.length>40)progHistory.shift();progFuture=[]}
function undoProg(){if(running||!progHistory.length)return toast('لا توجد خطوة للتراجع');progFuture.push(JSON.stringify(prog));prog=JSON.parse(progHistory.pop());S.prog=prog;dirty();drawProg();toast('↶ تم التراجع')}
function redoProg(){if(running||!progFuture.length)return toast('لا توجد خطوة للإعادة');progHistory.push(JSON.stringify(prog));prog=JSON.parse(progFuture.pop());S.prog=prog;dirty();drawProg();toast('↷ تمت إعادة الخطوة')}
function exportProject(){const data={format:'blockworld-project',version:1,program:prog,custom:S.custom||[],exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='blockworld-project.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('📦 تم تصدير مشروع البرمجة')}
function importProject(file){const reader=new FileReader();reader.onload=()=>{try{const d=JSON.parse(reader.result);if(!d||d.format!=='blockworld-project'||!Array.isArray(d.program)||!Array.isArray(d.custom||[]))throw Error('صيغة الملف غير صحيحة');if(d.program.length>120||d.custom.length>80)throw Error('المشروع أكبر من الحد المسموح');const valid=d.program.every(b=>b&&typeof b.k==='string'&&('p'in b));if(!valid)throw Error('توجد بلوكات غير صالحة');rememberProg();prog=d.program.map(b=>({k:b.k,p:b.p,l:String(b.l||b.k).slice(0,120),c:Number.isInteger(b.c)?Math.max(0,Math.min(5,b.c)):0}));S.custom=d.custom.filter(b=>b&&typeof b.name==='string'&&typeof b.code==='string').slice(0,80).map(b=>({name:b.name.slice(0,20),code:b.code.slice(0,5000)}));S.prog=prog;dirty();closeModal();rCode();toast('✅ تم استيراد المشروع بنجاح')}catch(e){const err=$('#importErr');if(err)err.textContent=e.message||'تعذر قراءة المشروع'}};reader.readAsText(file)}

function avatarModal(){
 const defaults={skin:0xffd2ad,hair:0x49334a,outfit:0x3da5ff,trim:0x2674b4,pants:0x34364b,shoes:0x34364b,scarf:0xffca58,hat:'none',hatColor:0x3da5ff};
 const a={...defaults,...(S.avatar||{})};
 const skinOpts=[[0xffd2ad,'فاتحة'],[0xeeb28e,'قمحية'],[0x9b6347,'بنية'],[0x6a4032,'داكنة']].map(x=>'<option value="'+x[0]+'" '+(Number(a.skin)===x[0]?'selected':'')+'>'+x[1]+'</option>').join('');
 const hairOpts=[[0x49334a,'بنفسجي داكن'],[0x211b20,'أسود'],[0x8a5635,'بني'],[0xf0c56a,'أشقر'],[0xff557f,'وردي'],[0x3b79b8,'أزرق']].map(x=>'<option value="'+x[0]+'" '+(Number(a.hair)===x[0]?'selected':'')+'>'+x[1]+'</option>').join('');
 const hex=v=>'#'+Number(v).toString(16).padStart(6,'0');
 modal('<h2>🧑‍🎨 تخصيص الشخصية</h2><p>غيّر ملامح الشخصية وملابسها. التعديلات تظهر مباشرة وتُحفظ مع تقدمك.</p><div class="avatar-form">'+
 '<label>لون البشرة<select id="avSkin">'+skinOpts+'</select></label>'+
 '<label>لون الشعر<select id="avHair">'+hairOpts+'</select></label>'+
 '<label>السترة / القميص<input id="avOutfit" type="color" value="'+hex(a.outfit)+'"></label>'+
 '<label>تفاصيل الملابس<input id="avTrim" type="color" value="'+hex(a.trim)+'"></label>'+
 '<label>البنطال<input id="avPants" type="color" value="'+hex(a.pants)+'"></label>'+
 '<label>الحذاء<input id="avShoes" type="color" value="'+hex(a.shoes)+'"></label>'+
 '<label>الوشاح<input id="avScarf" type="color" value="'+hex(a.scarf)+'"></label>'+
 '<label>غطاء الرأس<select id="avHat"><option value="none">بدون</option><option value="cap">قبعة مغامر</option><option value="crown">تاج</option></select></label>'+
 '<label>لون غطاء الرأس<input id="avHatColor" type="color" value="'+hex(a.hatColor)+'"></label></div>'+
 '<div class="row"><button class="b1" id="avSave">حفظ المظهر</button><button id="avReset">إعادة الافتراضي</button><button id="avClose">إغلاق</button></div>');
 const el=id=>$('#'+id);el('avHat').value=a.hat;
 const read=()=>({skin:+el('avSkin').value,hair:+el('avHair').value,outfit:parseInt(el('avOutfit').value.slice(1),16),trim:parseInt(el('avTrim').value.slice(1),16),pants:parseInt(el('avPants').value.slice(1),16),shoes:parseInt(el('avShoes').value.slice(1),16),scarf:parseInt(el('avScarf').value.slice(1),16),hat:el('avHat').value,hatColor:parseInt(el('avHatColor').value.slice(1),16)});
 const update=()=>{S.avatar=read();if(typeof setAvatarAppearance==='function')setAvatarAppearance(S.avatar);dirty()};
 ['avSkin','avHair','avOutfit','avTrim','avPants','avShoes','avScarf','avHat','avHatColor'].forEach(id=>el(id).onchange=update);
 el('avSave').onclick=()=>{update();closeModal();toast('✨ تم حفظ مظهر الشخصية')};
 el('avReset').onclick=()=>{S.avatar={...defaults};if(typeof setAvatarAppearance==='function')setAvatarAppearance(S.avatar);dirty();closeModal();avatarModal()};
 el('avClose').onclick=closeModal;
}

function projectModal(){modal('<h2>📦 إدارة المشروع</h2><p>احفظ برنامجك في ملف، أو استورد مشروعًا سابقًا لمتابعة العمل عليه.</p><button class="b1" id="exportProj">⬇️ تصدير المشروع JSON</button><label class="filepick">⬆️ استيراد مشروع من ملف JSON<input id="importProj" type="file" accept=".json,application/json"></label><div id="importErr" class="err"></div><div class="row"><button id="undoProj">↶ تراجع</button><button id="redoProj">↷ إعادة</button><button id="closeProj">إغلاق</button></div>');$('#exportProj').onclick=exportProject;$('#importProj').onchange=e=>{if(e.target.files&&e.target.files[0])importProject(e.target.files[0])};$('#undoProj').onclick=undoProg;$('#redoProj').onclick=redoProg;$('#closeProj').onclick=closeModal}
const PROGRAM_TEMPLATES=[
 {name:'🏠 بناء بيت',desc:'ابنِ بيتًا صغيرًا أمامك.',blocks:[['house',0]]},
 {name:'⬜ ارسم مربعًا',desc:'تحرّك ودر حول نفسك لرسم مربع.',blocks:[['repeat',4],['fwd',4],['turn',90],['end',0]]},
 {name:'💃 رقصة مرحة',desc:'قل رسالة ثم ارقص وأظهر تعبيرًا.',blocks:[['say','هيا نرقص!'],['dance',0],['emote','🥳']]},
 {name:'🎁 اجمع الهدايا',desc:'حاول جمع الهدايا القريبة عدة مرات.',blocks:[['repeat',5],['collect',0],['fwd',2],['end',0]]},
 {name:'🗺️ جولة استكشاف',desc:'زر مناطق مختلفة من العالم.',blocks:[['say','لنستكشف العالم!'],['goto',1],['wait',1],['goto',2],['wait',1],['goto',3],['wait',1],['goto',0]]},
 {name:'🌸 حديقة صغيرة',desc:'ضع زهورًا حولك بالتتابع.',blocks:[['place',{k:'e',i:0}],['turn',90],['fwd',2],['place',{k:'e',i:0}],['turn',90],['fwd',2],['place',{k:'e',i:0}]]}
];
function templateModal(){modal('<h2>🧰 قوالب برامج جاهزة</h2><p>اختر مثالًا جاهزًا لتضيفه إلى برنامجك الحالي. يمكنك بعد ذلك تحريك البلوكات وتعديلها أو حذفها.</p><div class="template-list">'+PROGRAM_TEMPLATES.map((t,i)=>'<button class="template-card" data-template="'+i+'"><b>'+esc(t.name)+'</b><small>'+esc(t.desc)+'</small></button>').join('')+'</div><div class="row"><button id="templateClose">إغلاق</button></div>');$('#templateClose').onclick=closeModal;$('#mb').querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>{const t=PROGRAM_TEMPLATES[+b.dataset.template],next=t.blocks.map(([k,p])=>{const d=BLK.find(x=>x.k===k&&JSON.stringify(x.p)===JSON.stringify(p));if(d)return{k:d.k,p:d.p,l:d.l,c:d.c};if(k==='place')return{k,p,l:'ضع '+((typeof p==='object'&&ELS[p.i])?ELS[p.i].n:'العنصر'),c:3};return{k,p,l:k,c:3}});if(prog.length+next.length>120)return toast('القالب يتجاوز حد 120 بلوكًا');rememberProg();prog=prog.concat(next);S.prog=prog;dirty();closeModal();rCode();toast('✨ أضيف القالب إلى برنامجك')})}
function rCode(){const all=bcat===5?S.custom.map((c,i)=>({c:5,l:'⭐ '+c.name,k:'custom',p:i})):BLK.filter(b=>b.c===bcat),q=codeSearch.trim().toLocaleLowerCase(),L=all.filter(b=>!q||String(b.l).toLocaleLowerCase().includes(q));
 $('#pCode').innerHTML=`<h3>🧩 البرمجة <small>${BLK.length}+ بلوك</small></h3><div class="tabs">${BCATS.map((c,i)=>`<button class="${i===bcat?'on':''}" data-c="${i}">${c}</button>`).join('')}</div>
 <input id="codeSearch" class="code-search" value="${esc(codeSearch)}" placeholder="🔎 ابحث عن بلوك..." aria-label="البحث في البلوكات">
 <div class="grid" id="blockPalette" style="max-height:30%;flex:none;grid-template-columns:repeat(auto-fill,minmax(122px,1fr))">${L.map((b,i)=>`<button class="blk" data-b="${i}" style="--block-color:${BCOL[b.c]}"><span>${b.l}</span><small>＋</small></button>`).join('')||'<small class="empty-blocks">لا توجد بلوكات مطابقة لبحثك.</small>'}</div>
 <div class="program-tools"><span id="progCount">🧩 ${prog.length}/120 بلوك</span><div class="row"><button id="undoProg">↶</button><button id="redoProg">↷</button><button id="manageProj">📦 المشروع</button><button id="templatesBtn">🧰 قوالب</button></div></div>
 <div id="prog"></div><div class="exec-tools"><button id="pauseb" type="button">⏸ مؤقت</button><button id="stepb" type="button">⏭ خطوة</button><label>السرعة <select id="runSpeed"><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label></div><div class="row"><button id="runb" class="b1">${running?'⏹ إيقاف':'▶ تشغيل'}</button><button id="clrp">مسح</button><button id="newb" class="b2">➕ بلوك بالكود</button></div>`;
 const p=$('#pCode');p.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{bcat=+b.dataset.c;rCode()});
 $('#codeSearch').oninput=e=>{codeSearch=e.target.value;const pos=e.target.selectionStart;rCode();const s=$('#codeSearch');s.focus();s.setSelectionRange(pos,pos)};
 p.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{if(running)return;if(prog.length>=120)return toast('الحد الأقصى 120 بلوكًا');const x=L[+b.dataset.b];rememberProg();prog.push({k:x.k,p:x.p,l:x.l,c:x.c});S.prog=prog;dirty();drawProg()});
 $('#undoProg').onclick=undoProg;$('#redoProg').onclick=redoProg;$('#manageProj').onclick=projectModal;$('#templatesBtn').onclick=templateModal;
 $('#runb').onclick=runProg;$('#pauseb').onclick=()=>{if(!running)return;paused=!paused;stepBudget=0;$('#pauseb').textContent=paused?'▶ متابعة':'⏸ مؤقت'};$('#stepb').onclick=()=>{if(!running)return;paused=true;stepBudget=1;$('#pauseb').textContent='▶ متابعة'};$('#runSpeed').value=String(runSpeed);$('#runSpeed').onchange=e=>{runSpeed=Math.max(.5,Math.min(2,+e.target.value||1));if(running)speed=runSpeed};$('#clrp').onclick=()=>{if(!running&&prog.length){rememberProg();prog=[];S.prog=prog;dirty();drawProg()}};$('#newb').onclick=customModal;drawProg()}
function drawProg(){const z=$('#prog');if(!z)return;const count=$('#progCount');if(count)count.textContent='🧩 '+prog.length+'/120 بلوك';z.innerHTML=prog.length?'':'<small>اضغط على البلوكات لتضيفها هنا. «كرر» و«إذا» تحتاج «نهاية ⏹».</small>';let d=0;
 prog.forEach((b,i)=>{if(b.k==='end'&&d>0)d--;const e=document.createElement('div');e.className='pi'+(i===curI?' cur':'');e.style.cssText='--block-color:'+BCOL[b.c]+';margin-inline-start:'+d*14+'px';e.innerHTML='<span class="pi-label">'+esc(b.l)+'</span><span class="pi-actions"><button type="button" data-up="'+i+'" aria-label="تحريك لأعلى">↑</button><button type="button" data-down="'+i+'" aria-label="تحريك لأسفل">↓</button><button type="button" data-remove="'+i+'" aria-label="حذف البلوك">×</button></span>';e.querySelector('[data-remove]').onclick=()=>{if(!running){rememberProg();prog.splice(i,1);S.prog=prog;dirty();drawProg()}};e.querySelector('[data-up]').onclick=()=>{if(!running&&i>0){rememberProg();[prog[i-1],prog[i]]=[prog[i],prog[i-1]];S.prog=prog;dirty();drawProg()}};e.querySelector('[data-down]').onclick=()=>{if(!running&&i<prog.length-1){rememberProg();[prog[i+1],prog[i]]=[prog[i],prog[i+1]];S.prog=prog;dirty();drawProg()}};z.appendChild(e);if(OPEN.has(b.k))d++})}
function modal(h){$('#mb').innerHTML=h;$('#modal').classList.add('on')}const closeModal=()=>$('#modal').classList.remove('on');$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
function customModal(){modal(`<h2>➕ بلوك بالكود</h2><small>اكتب بلوكك بلغة JavaScript. الأوامر: forward(n) back(n) turn(درجات) side(n) jump(h) wait(ثواني) say("نص") place("وردة") dance() color(0..360) size(1) emote("😀") collect() goto(0..5)</small>
 <input id="cbn" placeholder="اسم البلوك، مثل: مربع"><textarea id="cbc">for (let i = 0; i < 4; i++) {\n  forward(3);\n  turn(90);\n}</textarea><div class="err" id="cbe"></div><div class="row"><button class="b1" id="cbs">حفظ البلوك</button><button id="cbx">إلغاء</button></div>`);
 $('#cbx').onclick=closeModal;$('#cbs').onclick=()=>{const n=$('#cbn').value.trim().slice(0,20),c=$('#cbc').value;if(!n)return $('#cbe').textContent='اكتب اسمًا للبلوك';try{new AF('forward','back','turn','jump','wait','say','place','dance','color','size','emote','collect','goto','side',c)}catch(e){return $('#cbe').textContent='خطأ في الكود: '+e.message}
  S.custom.push({name:n,code:c});bcat=5;dirty();closeModal();if(openP!=='Code')togglePanel('Code');else rCode()}}
// ---------- برمجة العناصر ----------
const BEH=[['spin','دوران 🔄'],['swing','فتح وإغلاق 🚪'],['bounce','قفز ⬆️'],['sway','تمايل 🌬️'],['pulse','نبض 💗'],['slide','ذهاب وإياب ↔'],['color','تغيير اللون 🌈']];
function openScript(po){PN.forEach(n=>$('#p'+n).classList.remove('on'));openP=null;setTool(null);const d=DEFS[po.k][po.i],p=$('#pScript');p.classList.add('on');
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
async function saveNow(){if(!started||!isDirty||saving)return;saving=true;serialize();const version=saveVersion,save={xp:S.xp,inv:{...S.inv},placed:S.placed.map(a=>a.slice()),custom:S.custom.map(a=>({...a})),found:{...S.found},pos:S.pos.slice(),hue:S.hue,avatar:{...(S.avatar||{})},prog:prog.map(a=>({...a}))};
 try{if(NET.guest)localStorage.setItem('bw_guest',JSON.stringify(save));else await NET.api('save',{save});if(saveVersion===version)isDirty=false}catch(e){isDirty=true}finally{saving=false}}
function startGame(save,name,hue){if(started)return;started=true;S={...S,...(save||{})};S.hue=hue||S.hue;S.avatar={skin:0xffd2ad,hair:0x49334a,outfit:0x3da5ff,trim:0x2674b4,pants:0x34364b,shoes:0x34364b,scarf:0xffca58,hat:'none',hatColor:0x3da5ff,...(S.avatar||{})};if(!save||!Object.keys(S.inv||{}).length){S.inv=S.inv||{};[1,7,16,20,30,44,58,70].forEach(i=>{if(ELS[i])S.inv['e'+i]=3})}
 $('#auth').style.display='none';$('#hud').hidden=false;try{initWorld()}catch(e){document.body.innerHTML='<p style="padding:30px;font-size:20px">يحتاج المتصفح إلى WebGL ليعمل بلوك وورلد.</p>';return}
 (S.placed||[]).forEach(a=>{if(DEFS[a[0]]&&DEFS[a[0]][a[1]]){const po=placeObj({k:a[0],i:a[1],x:a[2],z:a[3],ry:a[4],e:a[5]});if(a[6])po.beh={t:a[6],p:a[7]||4}}});
 if(S.pos){pl.x=S.pos[0];pl.z=S.pos[1];if(!walkable(pl.x,pl.z)){pl.x=0;pl.z=6}}prog=S.prog||[];if(typeof setAvatarAppearance==='function')setAvatarAppearance(S.avatar||{});hud();$('#onl').textContent=NET.guest?'🎮 ضيف':'👤 1 متصل';$('#bShare').style.display=NET.guest?'none':'';
 setInterval(tick,500);setInterval(saveNow,6000);addEventListener('beforeunload',saveNow);
 toast(name?'أهلًا '+name+'! 🎉 استكشف، ابنِ، وبرمج':'أهلًا بك! 🎉');setTimeout(()=>{onZone(0)},600)}
async function auth(kind){const n=$('#un').value.trim(),p=$('#pw').value;$('#aerr').textContent='';try{const r=await NET.api(kind,{name:n,pass:p});NET.token=r.token;NET.guest=false;localStorage.setItem('bw_t',r.token);startGame(r.save,r.name,r.hue)}catch(e){$('#aerr').textContent=e.message==='Failed to fetch'?'الخادم غير متصل — شغّل node server.js أو العب كضيف':e.message}}
$('#bLogin').onclick=()=>auth('login');$('#bReg').onclick=()=>auth('register');$('#pw').onkeydown=e=>{if(e.key==='Enter')auth('login')};
$('#bGuest').onclick=()=>{let s=null;try{s=JSON.parse(localStorage.getItem('bw_guest')||'null')}catch(e){}NET.guest=true;startGame(s,'',200)};
(async()=>{const t=localStorage.getItem('bw_t');if(!t)return;NET.token=t;try{const r=await NET.api('me');NET.guest=false;startGame(r.save,r.name,r.hue)}catch(e){NET.token=null;localStorage.removeItem('bw_t')}})();
// ---------- الأزرار ----------
$('#bAvatar').onclick=avatarModal;
$('#bSound').onclick=toggleSound;$('#bMusic').onclick=toggleMusic;updateMusicButton();
$('#bSound').textContent=soundOn?'🔊 الصوت':'🔇 الصوت';
document.querySelectorAll('#dock [data-p]').forEach(b=>b.onclick=()=>togglePanel(b.dataset.p));
$('#bMove').onclick=()=>{setTool('move');toast('⌨️ انقر على عنصر لتحديده ثم استخدم الأسهم للتحريك')};
$('#bShare').onclick=()=>{SH=!SH;$('#bShare').textContent=SH?'🌍 مشترك':'🏡 خاص';if(!SH)syncPlayers([]);toast(SH?'العالم المشترك: سترى اللاعبين الآخرين':'عالمك الخاص: تتجول وحدك')};
$('#bShare').textContent='🏡 خاص';
let nightMode=false;$('#bTime').onclick=()=>{nightMode=!nightMode;setWorldTime(nightMode);$('#bTime').textContent=nightMode?'☀️ نهار':'🌙 ليل';if(musicOn&&musicMaster){musicMaster.gain.setTargetAtTime(musicVolume,soundCtx.currentTime,.8);playMusicPhrase()}toast(nightMode?'🌙 تم تفعيل أجواء الليل':'☀️ عادت أجواء النهار')};
 $('#bHelp').onclick=()=>{modal('<h2>❔ دليل التحكم في BlockWorld</h2><p><b>الحركة:</b> WASD أو الأسهم، والمسافة للقفز. حرّك الكاميرا بسحب الشاشة، وقرّب أو أبعد بعجلة الفأرة.</p><p><b>البناء:</b> افتح 🔨 بناء واختر عنصرًا، ثم انقر على العالم لوضعه. وجّه المؤشر إلى عنصر موجود للبناء فوقه أو بجانبه. اضغط R لتدوير معاينة البناء، واستخدم ⬆ و⬇ لضبط ارتفاعه.</p><p><b>تعديل عنصر موجود:</b> اختر ⌨️ تحريك ثم انقر العنصر. الأسهم أو WASD لتحريكه، Shift لحركة أكبر، Q/E للتدوير، PageUp/PageDown للارتفاع، Delete للحذف، وCtrl+D للنسخ.</p><p><b>برمجة عنصر:</b> اضغط 🧩 برمجة ثم انقر عنصرًا، أو استخدم لوحة البرمجة لبناء تسلسل أوامر وتشغيله.</p><p><b>الحفظ والحسابات:</b> يُحفظ التقدم تلقائيًا كل عدة ثوانٍ. حفظ الحسابات عبر الإنترنت يتطلب إعداد قاعدة البيانات DATABASE_URL في الاستضافة؛ اللعب كضيف يحفظ على هذا المتصفح فقط.</p><div class="row"><button class="b1" id="bHelpClose">فهمت</button></div>');$('#bHelpClose').onclick=closeModal};
$('#tDel').onclick=()=>{clearPlacedSelection();setTool('del');toast('🗑 انقر على العنصر الذي تريد حذفه')};$('#tMove').onclick=()=>{setTool('move');toast('⌨️ انقر على عنصر ثم حرّكه بالأسهم أو WASD')};$('#tSel').onclick=()=>{clearPlacedSelection();setTool('sel');toast('🧩 انقر على عنصر لفتح إعدادات برمجته')};$('#tCopy').onclick=()=>{setTool('copy');toast('📋 انقر على عنصر لنسخه — يلزم توفره في الحقيبة')};$('#tOff').onclick=()=>{setTool(null);if(openP==='Build')rBuild()};
$('#tRot').onclick=()=>{if(selectedPo&&tool==='move'){rotateSelected(1);toast('⟳ تم تدوير العنصر المحدد')}else{rot=(rot+Math.PI/4)%(Math.PI*2);if(ghost)ghostPlace();toast('⟳ تدوير معاينة البناء')}};$('#tUp').onclick=()=>{if(selectedPo&&tool==='move'){changeSelectedHeight(1);toast('⬆ تم رفع العنصر المحدد')}else{manualElev=Math.min(4.4,manualElev+.55);elev=manualElev;toast('ارتفاع البناء: '+Math.round(elev/.55));if(ghost)ghostPlace()}};$('#tDn').onclick=()=>{if(selectedPo&&tool==='move'){changeSelectedHeight(-1);toast('⬇ تم خفض العنصر المحدد')}else{manualElev=Math.max(0,manualElev-.55);elev=manualElev;toast('ارتفاع البناء: '+Math.round(elev/.55));if(ghost)ghostPlace()}};
document.querySelectorAll('#dpad [data-k]').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});['pointerup','pointercancel','pointerleave'].forEach(v=>b.addEventListener(v,()=>keys[k]=false))});
$('#jump').addEventListener('pointerdown',e=>{e.preventDefault();keys.jump=true});
const KM={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;
 if(e.ctrlKey&&e.code==='KeyZ'){undoProg();e.preventDefault();return}if(e.ctrlKey&&e.code==='KeyY'){redoProg();e.preventDefault();return}
 if(tool==='move'&&selectedPo){
  const step=e.shiftKey?1:.5;
  if(KM[e.code]){const k=KM[e.code];moveSelected(k==='left'?-step:k==='right'?step:0,k==='up'?-step:k==='down'?step:0);e.preventDefault();return}
  if(e.code==='KeyQ'){rotateSelected(-1);e.preventDefault();return}
  if(e.code==='KeyE'){rotateSelected(1);e.preventDefault();return}
  if(e.code==='PageUp'||e.code==='Equal'||e.code==='NumpadAdd'){changeSelectedHeight(1);e.preventDefault();return}
  if(e.code==='PageDown'||e.code==='Minus'||e.code==='NumpadSubtract'){changeSelectedHeight(-1);e.preventDefault();return}
  if(e.code==='Delete'||e.code==='Backspace'){deleteSelected();e.preventDefault();return}
  if(e.ctrlKey&&e.code==='KeyD'){duplicateSelected();e.preventDefault();return}
 }
 if(KM[e.code]){keys[KM[e.code]]=true;e.preventDefault()}if(e.code==='Space'){keys.jump=true;e.preventDefault()}if(e.key==='Shift')keys.shift=true;
 if(e.code==='KeyR'&&tool==='move'&&selectedPo){rotateSelected(1);e.preventDefault()}else if(e.code==='KeyR'&&tool&&tool.k){rot=(rot+Math.PI/4)%(Math.PI*2);ghostPlace()}if(e.code==='Escape'){if(openP)togglePanel(openP);clearPlacedSelection();setTool(null);closeModal()}});
addEventListener('keyup',e=>{if(KM[e.code])keys[KM[e.code]]=false;if(e.key==='Shift')keys.shift=false});
