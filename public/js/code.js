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
let prog=[],running=false,stopF=false,curI=-1,V={c:0},speed=1,runSpeed=1,paused=false,stepBudget=0,instructionBusy=false;
const OPEN=new Set(['repeat','forever','ifblocked','ifnear','ifgift','ifrand','ifc']),frameP=()=>new Promise(r=>requestAnimationFrame(()=>{const tick=()=>{if(!paused||instructionBusy||stopF)r();else setTimeout(tick,40)};tick()})),chk=()=>{if(stopF)throw'STOP'};
async function beginInstruction(){while(paused&&stepBudget<=0&&!stopF)await new Promise(r=>setTimeout(r,40));chk();if(paused&&stepBudget>0)stepBudget--;instructionBusy=true}
function endInstruction(){instructionBusy=false}
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
async function execList(list){for(const n of list){chk();const k=n.k,leaf=!OPEN.has(k);if(leaf)await beginInstruction();curI=n.i;drawProg();try{
 if(k==='repeat'){for(let j=0;j<n.p;j++){await execList(n.b);chk()}}else if(k==='forever'){while(true){await execList(n.b);await frameP();chk()}}
 else if(k==='ifc'){if(V.c>n.p)await execList(n.b)}else if(COND[k]){if(COND[k]())await execList(n.b)}
 else if(k==='fwd'){sfx('step');await A.step(0,n.p)}else if(k==='back'){sfx('step');await A.step(Math.PI,n.p)}else if(k==='str'){sfx('step');await A.str(n.p)}else if(k==='turn'){sfx('turn');await A.turn(n.p)}else if(k==='jump'){sfx('jump');await A.jump(n.p)}
 else if(k==='goto')await A.goto(n.p);else if(k==='wait')await A.wait(n.p);else if(k==='say'){sfx('say');await A.say(n.p)}else if(k==='color')await A.color(n.p);else if(k==='size')await A.size(n.p);
 else if(k==='emote')await A.emote(n.p);else if(k==='dance')await A.dance();else if(k==='speed')speed=n.p;else if(k==='place'){sfx('build');await A.place(n.p)}else if(k==='house'){sfx('build');await A.house()}
 else if(k==='collect'){sfx('collect');await A.collect()}else if(k==='door')await A.door();else if(k==='remove')await A.remove();else if(k==='setc')V.c=0;else if(k==='addc')V.c+=n.p;else if(k==='stop')throw'STOP';
 else if(k==='custom')await runCustom(n.p)
 }finally{if(leaf)endInstruction()}}}
const CUSTOM_COMMANDS=new Set(['forward','back','turn','jump','wait','say','place','dance','color','size','emote','collect','goto','side']);
function parseCustom(source){
 const src=String(source||'');if(src.length>5000)throw Error('الحد الأقصى 5000 حرف');
 const re=/\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|\d+(?:\.\d+)?|[A-Za-z_$][\w$]*|\+\+|--|<=|>=|==|!=|[{}();=<>+,-]/y,tokens=[];let at=0;
 while(at<src.length){re.lastIndex=at;const m=re.exec(src);if(!m)throw Error('يوجد رمز غير مسموح قرب: '+src.slice(at,at+12));at=re.lastIndex;const t=m[0];if(/^\s/.test(t)||t.startsWith('//')||t.startsWith('/*'))continue;tokens.push(t)}
 let p=0,nodes=0;const peek=()=>tokens[p],take=()=>tokens[p++],need=t=>{if(take()!==t)throw Error('توقّع الرمز '+t)},number=()=>{const t=take();if(!/^\d+(?:\.\d+)?$/.test(t||''))throw Error('توقّع رقمًا');return Number(t)};
 function arg(vars){let sign=1;if(peek()==='-'){take();sign=-1}const t=take();if(t===undefined)throw Error('قيمة ناقصة');let v;if(/^\d+(?:\.\d+)?$/.test(t))v={type:'number',value:sign*Number(t)};else if(sign!==1)throw Error('الإشارة السالبة تستخدم مع الأرقام فقط');else if(t.startsWith('"'))v={type:'string',value:JSON.parse(t)};else if(vars.has(t))v={type:'var',name:t};else throw Error('استخدم رقمًا أو نصًا بين علامتي اقتباس أو متغير حلقة');if(peek()==='+'||peek()==='-'){const op=take(),rhs=number();if(v.type!=='var')throw Error('العمليات الحسابية مسموحة لمتغير الحلقة فقط');v={type:'math',name:v.name,op,rhs}}return v}
 function block(end=false,depth=0,vars=new Set()){if(depth>4)throw Error('الحلقات متداخلة أكثر من المسموح');const out=[];while(p<tokens.length&&peek()!=='}'){if(++nodes>300)throw Error('البرنامج أطول من الحد المسموح');if(peek()==='for'){take();need('(');need('let');const variable=take();if(!/^[A-Za-z_$][\w$]*$/.test(variable||''))throw Error('اسم متغير الحلقة غير صالح');need('=');const start=number();need(';');if(take()!==variable)throw Error('متغير الحلقة غير متطابق');need('<');const limit=number();need(';');if(take()!==variable)throw Error('متغير الحلقة غير متطابق');need('++');need(')');if(limit<start||limit-start>50)throw Error('يجب أن تكون الحلقة بين 0 و50 تكرارًا');need('{');const innerVars=new Set(vars);innerVars.add(variable);const body=block(true,depth+1,innerVars);need('}');out.push({type:'loop',variable,start,limit,body});continue}
  const name=take();if(!CUSTOM_COMMANDS.has(name))throw Error('الأمر غير مسموح: '+name);need('(');const args=[];if(peek()!==')'){args.push(arg(vars));if(peek()===',')throw Error('الأوامر تقبل قيمة واحدة فقط')}need(')');if(peek()===';')take();const noArg=name==='dance'||name==='collect';if(args.length!==(noArg?0:1))throw Error('الأمر '+name+' يحتاج '+(noArg?'صفر':'قيمة واحدة'));out.push({type:'call',name,args})}
  if(end&&p>=tokens.length)throw Error('قوس إغلاق مفقود');return out}
 const ast=block(false);if(p!==tokens.length)throw Error('توجد رموز زائدة أو قوس إغلاق غير متوقع');return ast
}
function customArg(a,vars){if(a.type==='number'||a.type==='string')return a.value;if(a.type==='var')return vars[a.name]??0;if(a.type==='math')return (vars[a.name]??0)+(a.op==='+'?a.rhs:-a.rhs);throw Error('قيمة غير صالحة')}
async function runCustom(i){const cb=S.custom[i];if(!cb)return;try{const ast=parseCustom(cb.code);let count=0;const run=async(list,vars)=>{for(const node of list){chk();if(node.type==='loop'){for(let n=node.start;n<node.limit;n++){vars[node.variable]=n;await run(node.body,vars);chk()}continue}if(++count>300)throw Error('تجاوز البرنامج 300 أمر أثناء التشغيل');const v=node.args.length?customArg(node.args[0],vars):undefined;switch(node.name){case'forward':if(!(Number.isFinite(v)&&v>=0&&v<=20))throw Error('forward يقبل رقمًا من 0 إلى 20');await A.step(0,v);break;case'back':if(!(Number.isFinite(v)&&v>=0&&v<=20))throw Error('back يقبل رقمًا من 0 إلى 20');await A.step(Math.PI,v);break;case'side':if(!(Number.isFinite(v)&&Math.abs(v)<=20))throw Error('side يقبل رقمًا بين -20 و20');await A.str(v);break;case'turn':if(!(Number.isFinite(v)&&Math.abs(v)<=3600))throw Error('turn يقبل زاوية بين -3600 و3600');await A.turn(v);break;case'jump':if(!(Number.isFinite(v)&&v>=1&&v<=3))throw Error('jump يقبل رقمًا من 1 إلى 3');await A.jump(v);break;case'wait':if(!(Number.isFinite(v)&&v>=0&&v<=30))throw Error('wait يقبل مدة من 0 إلى 30 ثانية');await A.wait(v);break;case'say':await A.say(String(v).slice(0,100));break;case'place':await A.placeBy(String(v).slice(0,60));break;case'dance':await A.dance();break;case'color':if(!(Number.isFinite(v)&&v>=0&&v<=360))throw Error('color يقبل قيمة من 0 إلى 360');await A.color(v);break;case'size':if(!(Number.isFinite(v)&&v>=.5&&v<=2))throw Error('size يقبل قيمة من 0.5 إلى 2');await A.size(v);break;case'emote':await A.emote(String(v).slice(0,8));break;case'collect':await A.collect();break;case'goto':if(!(Number.isInteger(v)&&v>=0&&v<ZONES.length))throw Error('رقم المنطقة غير صالح');await A.goto(v);break}}};await run(ast,{})}catch(e){if(e==='STOP')throw e;toast('⚠ خطأ في بلوكك «'+cb.name+'»: '+(e.message||e))}}
async function runProg(){if(running){stopF=true;paused=false;return}if(!prog.length)return toast('أضف بلوكات أولًا 🧩');sfx('run');const runSnapshot=prog.map(b=>({...b}));running=true;stopF=false;paused=false;stepBudget=0;instructionBusy=false;ctl.lock=true;speed=runSpeed;V.c=0;document.getElementById('runb').textContent='⏹ إيقاف';
 try{await execList(parseProg(runSnapshot));S.xp+=runSnapshot.length*2;sfx('done');toast('✓ انتهى البرنامج +'+runSnapshot.length*2+' XP')}catch(e){if(e!=='STOP'){sfx('error');console.error(e)}}
 // تنفيذ البرنامج لا يحذف بلوكاته؛ أعد القائمة الأصلية حتى تبقى جاهزة للتشغيل والتعديل.
 prog=runSnapshot;S.prog=prog;running=false;paused=false;stepBudget=0;instructionBusy=false;ctl.lock=false;curI=-1;pl.walk=0;document.getElementById('runb').textContent='▶ تشغيل';drawProg();dirty()}
