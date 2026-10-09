// BlockWorld server — Node.js بدون أي مكتبات خارجية: حسابات، حفظ، لاعبون حقيقيون، دردشة، هدايا
const http=require('http'),fs=require('fs'),path=require('path'),cr=require('crypto');
const PORT=process.env.PORT||3000,DB=path.join(__dirname,'data.json'),PUB=path.join(__dirname,'public');
let U={};try{U=JSON.parse(fs.readFileSync(DB,'utf8'))}catch(e){}
let st=0;const persist=()=>{clearTimeout(st);st=setTimeout(()=>fs.writeFile(DB,JSON.stringify(U),()=>{}),500)};
const tok={},on={},chat=[];let cid=0;
const hash=(p,s)=>cr.scryptSync(p,s,32).toString('hex');
const normalizeName=n=>String(n||'').normalize('NFKC').trim().toLocaleLowerCase('ar');
const validSave=s=>{if(!s||typeof s!=='object'||Array.isArray(s))return false;try{if(JSON.stringify(s).length>1500000)return false}catch(_){return false}if(!Number.isFinite(Number(s.xp))||Number(s.xp)<0||Number(s.xp)>1e9||!Array.isArray(s.pos)||s.pos.length!==2||!s.pos.every(v=>Number.isFinite(Number(v))&&Math.abs(Number(v))<=500)||!Array.isArray(s.placed)||s.placed.length>2000||!Array.isArray(s.prog)||s.prog.length>120||!s.inv||typeof s.inv!=='object'||Array.isArray(s.inv))return false;if(!Object.entries(s.inv).every(([k,v])=>/^e\d{1,3}$/.test(k)&&Number(k.slice(1))<200&&Number.isInteger(v)&&v>=0&&v<=999))return false;if(!s.placed.every(a=>Array.isArray(a)&&a.length>=4&&a.length<=8&&['e','p'].includes(a[0])&&Number.isInteger(a[1])&&a[1]>=0&&a[1]<200&&Number.isFinite(Number(a[2]))&&Number.isFinite(Number(a[3]))&&Math.abs(Number(a[2]))<500&&Math.abs(Number(a[3]))<500))return false;if(!s.prog.every(b=>b&&typeof b.k==='string'&&Object.prototype.hasOwnProperty.call(b,'p')))return false;const c=s.custom===undefined?[]:s.custom;return Array.isArray(c)&&c.length<=80&&c.every(b=>b&&typeof b.name==='string'&&b.name.length<=20&&typeof b.code==='string'&&b.code.length<=5000)};
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const send=(r,c,o)=>{r.writeHead(c,{'Content-Type':'application/json; charset=utf-8'});r.end(JSON.stringify(o))};
const body=q=>new Promise(r=>{let b='';q.on('data',d=>{b+=d;if(b.length>4e5)q.destroy()});q.on('end',()=>{try{r(JSON.parse(b||'{}'))}catch(e){r({})}})});
function login(r,k){const t=cr.randomBytes(16).toString('hex');tok[t]=k;send(r,200,{token:t,name:U[k].name,hue:U[k].hue,save:U[k].save})}
http.createServer(async(q,r)=>{
 const ep=q.url.split('?')[0];
 if(ep.startsWith('/api/')){
  const b=q.method==='POST'?await body(q):{},k=tok[(q.headers.authorization||'').slice(7)];
  if(ep==='/api/register'){const n=String(b.name||'').normalize('NFKC').trim().slice(0,16),p=String(b.pass||''),key=normalizeName(n);
   if(n.length<2||p.length<6)return send(r,400,{e:'اسم اللاعب يجب أن يكون حرفين على الأقل وكلمة المرور 6 أحرف على الأقل'});
      if(U[key])return send(r,409,{e:'هذا الاسم مستخدم بالفعل، جرّب اسمًا مختلفًا'});
   const s=cr.randomBytes(16).toString('hex');U[key]={name:n,salt:s,h:hash(p,s),save:null,hue:Math.random()*360|0,inbox:[]};persist();return login(r,key)}
  if(ep==='/api/login'){const kk=normalizeName(b.name),u=U[kk];
   if(!u||!u.salt||!u.h||String(b.pass||'').length>256)return send(r,401,{e:'اسم اللاعب أو كلمة المرور غير صحيحة'});
   let valid=false;try{const a=Buffer.from(u.h,'hex'),c=Buffer.from(hash(String(b.pass||''),u.salt),'hex');valid=a.length===c.length&&cr.timingSafeEqual(a,c)}catch(e){}
   if(!valid)return send(r,401,{e:'اسم اللاعب أو كلمة المرور غير صحيحة'});return login(r,kk)}
  if(!k||!U[k])return send(r,401,{e:'سجّل الدخول أولًا'});
  if(ep==='/api/me')return send(r,200,{name:U[k].name,hue:U[k].hue,save:U[k].save});
  if(ep==='/api/save'){if(!validSave(b.save))return send(r,400,{e:'بيانات الحفظ غير صالحة أو تتجاوز الحدود الآمنة؛ لم يتم تغيير عالمك.'});U[k].save=b.save;persist();return send(r,200,{ok:1})}
  if(ep==='/api/tick'){const t=Date.now();on[k]={x:+b.x||0,z:+b.z||0,ry:+b.ry||0,sh:b.sh?1:0,t,name:U[k].name,hue:U[k].hue};
   const active=Object.entries(on).filter(([o,v])=>o!==k&&t-v.t<6000&&v.sh&&on[k].sh);
   const pl=active.map(([o,v])=>({id:o,name:v.name,x:v.x,z:v.z,ry:v.ry,hue:v.hue}));
   const worlds=active.filter(([o])=>Array.isArray(U[o]&&U[o].save&&U[o].save.placed)).slice(0,12).map(([o])=>({id:o,placed:U[o].save.placed.slice(0,1000)}));
   const ms=chat.filter(m=>m.id>(+b.since||0)&&(m.to?(m.to===k||m.fk===k):on[k].sh&&Math.hypot(m.x-on[k].x,m.z-on[k].z)<45)).map(m=>({id:m.id,from:m.from,priv:!!m.to,text:m.text}));
   const inbox=U[k].inbox||[];if(inbox.length){U[k].inbox=[];persist()}
   return send(r,200,{pl,worlds,ms,inbox,last:cid})}
  if(ep==='/api/chat'){const targetToken=String(b.to||''),text=String(b.text||'').trim().slice(0,120);if(!text)return send(r,400,{e:'رسالة فارغة'});if(targetToken&&(!tok[targetToken]||tok[targetToken]===k||!U[tok[targetToken]]))return send(r,400,{e:'المستلم غير صالح'});
   chat.push({id:++cid,from:U[k].name,fk:k,to:targetToken||null,text,x:on[k]?on[k].x:0,z:on[k]?on[k].z:0});if(chat.length>300)chat.shift();return send(r,200,{ok:1})}
  if(ep==='/api/gift'){const targetToken=String(b.to||''),to=tok[targetToken],n=Math.floor(+b.n),item=String(b.item||'');
   if(!to||to===k||!U[to]||!/^e\d{1,3}$/.test(item)||!(n>=1&&n<=99))return send(r,400,{e:'هدية غير صالحة'});
   (U[to].inbox=U[to].inbox||[]).push({item,n,from:U[k].name});if(U[to].inbox.length>200)U[to].inbox.shift();
   chat.push({id:++cid,from:'🎁 هدية',fk:'',to:targetToken,text:'وصلتك هدية من '+U[k].name+'!',x:0,z:0});persist();return send(r,200,{ok:1})}
  return send(r,404,{e:'غير موجود'});
 }
 let u=decodeURIComponent(ep);if(u==='/')u='/index.html';
 const f=path.join(PUB,path.normalize(u));if(!f.startsWith(PUB)){r.writeHead(403);return r.end()}
 fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('404')}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});r.end(d)});
}).listen(PORT,()=>console.log('🧱 BlockWorld يعمل على http://localhost:'+PORT));
