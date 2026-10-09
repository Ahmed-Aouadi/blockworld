// البلوكات البرمجية (~200 بلوك جاهز) + المفسّر + البلوكات المخصصة بالكتابة
const BCATS=['🏃 الحركة','🔁 التحكم','😀 المظهر','🌍 العالم','🔢 العدّاد','⭐ بلوكاتي'],BCOL=['#3da5ff','#ffc928','#ff5fa2','#35c46b','#9a6bff','#ff8a3d'];
const BLK=[],ab=(c,l,k,p,o)=>BLK.push({c,l,k,p,o});
(()=>{const M=0,C=1,L=2,W=3,N=4;
 for(let n=1;n<=20;n++)ab(M,'تقدّم '+n,'fwd',n);for(let n=1;n<=10;n++)ab(M,'ارجع '+n,'back',n);
 for(let n=1;n<=6;n++){ab(M,'خطوة يمين '+n,'str',n);ab(M,'خطوة يسار '+n,'str',-n)}
 [15,30,45,60,90,120,180,270].forEach(a=>{ab(M,'استدر يمينًا '+a+'°','turn',a);ab(M,'استدر يسارًا '+a+'°','turn',-a)});
 [1,2,3].forEach(h=>ab(M,'اقفز '+h,'jump',h));ZONES.forEach((z,i)=>ab(M,'اذهب إلى '+z.n,'goto',i));
 for(let n=2;n<=20;n++)ab(C,'كرر '+n+' مرة','repeat',n,1);[25,30,40,50].forEach(n=>ab(C,'كرر '+n+' مرة','repeat',n,1));ab(C,'كرر للأبد','forever',0,1);
 [.5,1,1.5,2,3,5,10].forEach(s=>ab(C,'انتظر '+s+' ث','wait',s));
 ab(C,'إذا الطريق مغلق','ifblocked',0,1);ab(C,'إذا لاعب قريب','ifnear',0,1);ab(C,'إذا هدية قريبة','ifgift',0,1);ab(C,'إذا صدفة 50٪','ifrand',0,1);ab(C,'نهاية ⏹','end',0);ab(C,'توقف تمامًا','stop',0);
 ['مرحبًا! 👋','أنا أبني بيتي 🏠','انظروا لهذا!','هيا نلعب!','أحب هذا العالم 🌍','وجدت هدية! 🎁','أنا مبرمج صغير 🤖','هل تريد أن تكون صديقي؟','أحسنت! 👏','شكرًا لك 💖','أين الكنز؟ 🗺️','هيا نستكشف!'].forEach(t=>ab(L,'قل: '+t,'say',t));
 [0,30,55,120,190,230,280,320,340,200].forEach(h=>ab(L,'غيّر اللون ●','color',h));
 [[.7,'صغير'],[1,'عادي'],[1.5,'كبير']].forEach(a=>ab(L,'الحجم '+a[1],'size',a[0]));
 ['😀','😍','😎','🤩','😂','🥳','😴','🤖','🦄','🔥'].forEach(e=>ab(L,'تعبير '+e,'emote',e));ab(L,'ارقص 💃','dance',0);[[.6,'ببطء'],[1,'بسرعة عادية'],[2,'بسرعة']].forEach(a=>ab(L,'تحرك '+a[1],'speed',a[0]));
 ab(W,'ضع العنصر المحدد أمامك','place','sel');ELS.filter((_,i)=>i%4===0).slice(0,26).forEach(d=>ab(W,'ضع '+d.n,'place',{k:'e',i:d.i}));PTS.filter((_,i)=>i%3===0).slice(0,22).forEach(d=>ab(W,'ابنِ '+d.cat.slice(2)+' '+d.n,'place',{k:'p',i:d.i}));
 ab(W,'ابنِ بيتًا جاهزًا 🏠','house',0);ab(W,'اجمع الهدايا القريبة 🎁','collect',0);ab(W,'افتح أقرب باب 🚪','door',0);ab(W,'احذف ما أمامك 🗑','remove',0);
 ab(N,'العدّاد = 0','setc',0);[1,2,5,10,-1].forEach(n=>ab(N,'العدّاد '+(n>0?'+':'−')+Math.abs(n),'addc',n));[1,2,3,5,8,10,15,20].forEach(n=>ab(N,'إذا العدّاد > '+n,'ifc',n,1))})();
let prog=[],running=false,stopF=false,curI=-1,V={c:0},speed=1,runSpeed=1,paused=false,stepBudget=0;
const OPEN=new Set(['repeat','forever','ifblocked','ifnear','ifgift','ifrand','ifc']),frameP=()=>new Promise(r=>requestAnimationFrame(()=>{const tick=()=>{if(!paused||stepBudget>0||stopF){if(paused&&stepBudget>0)stepBudget--;r()}else setTimeout(tick,40)};tick()})),chk=()=>{if(stopF)throw'STOP'};
const findDef=q=>typeof q==='number'?ELS[q]:ELS.find(d=>d.n.includes(q)||d.b===q)||PTS.find(d=>(d.cat+d.n).includes(q)||d.b===q);
function front(n){return{x:Math.round((pl.x+Math.sin(pl.ry)*n)*2)/2,z:Math.round((pl.z+Math.cos(pl.ry)*n)*2)/2}}
function putDef(d,x,z,ry,e){if(d.k==='e'){const key='e'+d.i;if(!(S.inv[key]>0)){toast('لا تملك «'+d.n+'» في حقيبتك');return false}S.inv[key]--}placeObj({k:d.k,i:d.i,x,z,ry,e:e||0});return true}
const blockedAhead=()=>{const x=pl.x+Math.sin(pl.ry)*.7,z=pl.z+Math.cos(pl.ry)*.7,[a,b]=collide(x,z);return !walkable(x,z)||Math.hypot(a-x,b-z)>.05};
const A={
 async step(ang,n){let ok=true;for(let i=0;i<n&&ok;i++){chk();const a=pl.ry+ang,dx=Math.sin(a),dz=Math.cos(a);pl.walk=1;for(let s=0;s<8;s++){if(!mv(dx/8,dz/8)){ok=false;break}for(let q=0;q<Math.round(2/speed);q++)await frameP()}pl.walk=0}pl.walk=0;return ok},
 async turn(d){const t=pl.ry-d*Math.PI/180,s=(t-pl.ry)/10;for(let i=0;i<10;i++){chk();pl.ry+=s;await frameP()}},
 async jump(h){pl.vy=7*Math.sqrt(h);await frameP();while(pl.jy>.001){chk();await frameP()}},
 async goto(i){const z=ZONES[i];for(let r=0;r<20;r++)for(let a=0;a<12;a++){const x=z.x+Math.cos(a)*r,zz=z.z+Math.sin(a)*r;if(walkable(x,zz)&&H(x,zz)>.2){pl.x=x;pl.z=zz;toast(z.e+' '+z.n);return}}},
 async wait(s){const t=performance.now()+s*1000/speed;while(performance.now()<t){chk();await frameP()}},
 async say(t){toast('💬 '+t);await A.wait(1)},async emote(e){toast(e+'  '+e+'  '+e);await A.wait(.6)},
 async color(h){pl.g.children[0].material.color.setHSL(h/360,.75,.58);pl.g.children[6].material.color.setHSL(h/360,.75,.58);await frameP()},
 async size(s){pl.g.scale.setScalar(s);await frameP()},async dance(){for(let i=0;i<24;i++){chk();pl.ry+=.52;pl.vy=i%6===0?5:pl.vy;await frameP();await frameP()}},
 async place(spec){let d;if(spec==='sel'){if(!tool||!tool.k){toast('اختر عنصرًا من لوحة البناء أولًا');return}d=DEFS[tool.k][tool.i]}else d=DEFS[spec.k][spec.i];const f=front(1.4);if(putDef(d,f.x,f.z,pl.ry,0)){dirty();refreshPanels()}await A.wait(.3)},
 async placeBy(q){const d=findDef(q);if(!d)return toast('لم أجد: '+q);const f=front(1.4);if(putDef(d,f.x,f.z,pl.ry,0)){dirty();refreshPanels()}await A.wait(.3)},
 async house(){const c=front(3.5),w=PTS.find(d=>d.b==='wall'),dr=PTS.find(d=>d.b==='door'),rf=PTS.find(d=>d.b==='roof'),fl=PTS.find(d=>d.b==='floor'),s=Math.sin(pl.ry),co=Math.cos(pl.ry),P=(d,lx,lz,ry,e)=>putDef(d,c.x+lx*co+lz*s,c.z-lx*s+lz*co,pl.ry+ry,e);
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){P(fl,a,b,0,0);P(rf,a,b,0,1.1)}
  [-1,0,1].forEach(a=>{P(w,a,1.5,0,0);if(a===0)P(dr,a,-1.5,0,0);else P(w,a,-1.5,0,0);P(w,-1.5,a,Math.PI/2,0);P(w,1.5,a,Math.PI/2,0)});dirty();refreshPanels();toast('🏠 بنيت بيتًا! اقترب من الباب ليفتح');await A.wait(.5)},
 async collect(){gifts.forEach(g=>{if(g.alive&&Math.hypot(pl.x-g.x,pl.z-g.z)<5){g.alive=false;g.g.visible=false;g.t=performance.now()/1000+45;onGift()}});await A.wait(.3)},
 async door(){placed.forEach(p=>{if(p.g.userData.door&&Math.hypot(p.x-pl.x,p.z-pl.z)<7){p.g.userData.force=1;setTimeout(()=>p.g.userData.force=0,3500)}});await A.wait(.4)},
 async remove(){const f=front(1.2);let b=null,bd=1.4;placed.forEach(p=>{const d=Math.hypot(p.x-f.x,p.z-f.z);if(d<bd){bd=d;b=p}});if(b){removeObj(b);if(b.k==='e')S.inv['e'+b.i]=(S.inv['e'+b.i]||0)+1;dirty();refreshPanels()}await A.wait(.2)},
 async str(n){await A.step(n>0?-Math.PI/2:Math.PI/2,Math.abs(n))}};
const COND={ifblocked:blockedAhead,ifnear:()=>Object.keys(others).some(id=>Math.hypot(others[id].x-pl.x,others[id].z-pl.z)<8),ifgift:()=>gifts.some(g=>g.alive&&Math.hypot(pl.x-g.x,pl.z-g.z)<6),ifrand:()=>Math.random()<.5};
function parseProg(p){const root=[],st=[root];p.forEach((b,i)=>{if(b.k==='end'){if(st.length>1)st.pop();return}const n={...b,i,b:[]};st[st.length-1].push(n);if(OPEN.has(b.k))st.push(n.b)});return root}
async function execList(list){for(const n of list){chk();curI=n.i;drawProg();const k=n.k;
 if(k==='repeat'){for(let j=0;j<n.p;j++){await execList(n.b);chk()}}else if(k==='forever'){while(true){await execList(n.b);await frameP();chk()}}
 else if(k==='ifc'){if(V.c>n.p)await execList(n.b)}else if(COND[k]){if(COND[k]())await execList(n.b)}
 else if(k==='fwd'){sfx('step');await A.step(0,n.p)}else if(k==='back'){sfx('step');await A.step(Math.PI,n.p)}else if(k==='str'){sfx('step');await A.str(n.p)}else if(k==='turn'){sfx('turn');await A.turn(n.p)}else if(k==='jump'){sfx('jump');await A.jump(n.p)}
 else if(k==='goto')await A.goto(n.p);else if(k==='wait')await A.wait(n.p);else if(k==='say'){sfx('say');await A.say(n.p)}else if(k==='color')await A.color(n.p);else if(k==='size')await A.size(n.p);
 else if(k==='emote')await A.emote(n.p);else if(k==='dance')await A.dance();else if(k==='speed')speed=n.p;else if(k==='place'){sfx('build');await A.place(n.p)}else if(k==='house'){sfx('build');await A.house()}
 else if(k==='collect'){sfx('collect');await A.collect()}else if(k==='door')await A.door();else if(k==='remove')await A.remove();else if(k==='setc')V.c=0;else if(k==='addc')V.c+=n.p;else if(k==='stop')throw'STOP';
 else if(k==='custom')await runCustom(n.p)}}
const AF=Object.getPrototypeOf(async function(){}).constructor;
async function runCustom(i){const cb=S.custom[i];if(!cb)return;const src=cb.code.replace(/\b(forward|back|turn|jump|wait|say|place|dance|color|size|emote|collect|goto|side)\s*\(/g,'await $1(');
 try{const fn=new AF('forward','back','turn','jump','wait','say','place','dance','color','size','emote','collect','goto','side',src);
  await fn(n=>A.step(0,n),n=>A.step(Math.PI,n),d=>A.turn(d),h=>A.jump(h),s=>A.wait(s),t=>A.say(t),q=>A.placeBy(q),()=>A.dance(),h=>A.color(h),s=>A.size(s),e=>A.emote(e),()=>A.collect(),i2=>A.goto(i2),n=>A.str(n))}
 catch(e){if(e==='STOP')throw e;toast('⚠ خطأ في بلوكك «'+cb.name+'»: '+(e.message||e))}}
async function runProg(){if(running){stopF=true;paused=false;return}if(!prog.length)return toast('أضف بلوكات أولًا 🧩');sfx('run');const runSnapshot=prog.map(b=>({...b}));running=true;stopF=false;paused=false;stepBudget=0;ctl.lock=true;speed=runSpeed;V.c=0;document.getElementById('runb').textContent='⏹ إيقاف';
 try{await execList(parseProg(runSnapshot));S.xp+=runSnapshot.length*2;sfx('done');toast('✓ انتهى البرنامج +'+runSnapshot.length*2+' XP')}catch(e){if(e!=='STOP'){sfx('error');console.error(e)}}
 // تنفيذ البرنامج لا يحذف بلوكاته؛ أعد القائمة الأصلية حتى تبقى جاهزة للتشغيل والتعديل.
 prog=runSnapshot;S.prog=prog;running=false;paused=false;stepBudget=0;ctl.lock=false;curI=-1;pl.walk=0;document.getElementById('runb').textContent='▶ تشغيل';drawProg();dirty()}
