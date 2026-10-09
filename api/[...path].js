// Vercel serverless API with durable Neon/Postgres storage.
const crypto = require('node:crypto');
const { neon } = require('@neondatabase/serverless');
const normalizeName = n => String(n || '').normalize('NFKC').trim().toLocaleLowerCase('ar');
const hash = (p, s) => crypto.scryptSync(p, s, 32).toString('hex');
const SAVE_PROGRAM_KEYS = new Set(['fwd','back','str','turn','jump','goto','wait','say','color','size','emote','dance','speed','place','house','collect','door','remove','setc','addc','ifc','repeat','forever','ifblocked','ifnear','ifgift','ifrand','stop','end','custom']);
function validPlacedList(list, max = 1000) {
  const allowedBehaviors = new Set(['spin','swing','bounce','sway','pulse','slide','color']);
  return Array.isArray(list) && list.length <= max && list.every(a =>
    Array.isArray(a) && a.length >= 4 && a.length <= 8 &&
    ['e','p'].includes(a[0]) && Number.isInteger(a[1]) && a[1] >= 0 && a[1] < 200 &&
    Number.isFinite(Number(a[2])) && Number.isFinite(Number(a[3])) &&
    Math.abs(Number(a[2])) < 500 && Math.abs(Number(a[3])) < 500 &&
    (a[4] === undefined || Number.isFinite(Number(a[4]))) &&
    (a[5] === undefined || (Number.isFinite(Number(a[5])) && Number(a[5]) >= 0 && Number(a[5]) <= 10)) &&
    (a[6] === undefined || a[6] === 0 || allowedBehaviors.has(a[6])) &&
    (a[7] === undefined || Number.isFinite(Number(a[7]))
  );
}
function validSave(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
  try { if (JSON.stringify(s).length > 1500000) return false; } catch (_) { return false; }
  if (!Number.isFinite(Number(s.xp)) || Number(s.xp) < 0 || Number(s.xp) > 1e9) return false;
  if (!Array.isArray(s.pos) || s.pos.length !== 2 || !s.pos.every(v => Number.isFinite(Number(v)) && Math.abs(Number(v)) <= 500)) return false;
  if (!Array.isArray(s.placed) || s.placed.length > 2000 || !Array.isArray(s.prog) || s.prog.length > 120) return false;
  if (!s.inv || typeof s.inv !== 'object' || Array.isArray(s.inv) || Object.keys(s.inv).length > 200) return false;
  if (!Object.entries(s.inv).every(([k,v]) => /^e\d{1,3}$/.test(k) && Number(k.slice(1)) < 200 && Number.isInteger(v) && v >= 0 && v <= 999)) return false;
  if (!s.placed.every(a => Array.isArray(a) && a.length >= 4 && a.length <= 8 && ['e','p'].includes(a[0]) && Number.isInteger(a[1]) && a[1] >= 0 && a[1] < 200 && Number.isFinite(Number(a[2])) && Number.isFinite(Number(a[3])) && Math.abs(Number(a[2])) < 500 && Math.abs(Number(a[3])) < 500 && (a[4] === undefined || Number.isFinite(Number(a[4]))) && (a[5] === undefined || (Number.isFinite(Number(a[5])) && Number(a[5]) >= 0 && Number(a[5]) <= 10)) && (a[6] === undefined || a[6] === 0 || ['spin','swing','bounce','sway','pulse','slide','color'].includes(a[6])))) return false;
  if (!s.prog.every(b => b && typeof b.k === 'string' && SAVE_PROGRAM_KEYS.has(b.k) && Object.prototype.hasOwnProperty.call(b,'p') && (b.l === undefined || (typeof b.l === 'string' && b.l.length <= 120)))) return false;
  const custom = s.custom === undefined ? [] : s.custom;
  if (!Array.isArray(custom) || custom.length > 80 || !custom.every(b => b && typeof b.name === 'string' && b.name.length <= 20 && typeof b.code === 'string' && b.code.length <= 5000)) return false;
  if (s.avatar !== undefined && (!s.avatar || typeof s.avatar !== 'object' || Array.isArray(s.avatar) || (s.avatar.hat !== undefined && !['none','cap','crown'].includes(s.avatar.hat)))) return false;
  return true;
}
let schemaReady;
async function db() {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error('قاعدة البيانات غير مهيأة. أضف DATABASE_URL في إعدادات الاستضافة.'), { status: 503 });
  const sql = neon(process.env.DATABASE_URL);
  if (!schemaReady) schemaReady = (async () => {
    await sql`CREATE TABLE IF NOT EXISTS bw_users (user_key text PRIMARY KEY, name text NOT NULL, salt text NOT NULL, pass_hash text NOT NULL, save jsonb, hue integer NOT NULL, inbox jsonb NOT NULL DEFAULT '[]'::jsonb)`;
    await sql`CREATE TABLE IF NOT EXISTS bw_sessions (token text PRIMARY KEY, user_key text NOT NULL REFERENCES bw_users(user_key) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS bw_presence (user_key text PRIMARY KEY REFERENCES bw_users(user_key) ON DELETE CASCADE, x double precision NOT NULL DEFAULT 0, z double precision NOT NULL DEFAULT 0, ry double precision NOT NULL DEFAULT 0, shared boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS bw_shared_world (world_key text PRIMARY KEY, placed jsonb NOT NULL DEFAULT '[]'::jsonb, updated_at timestamptz NOT NULL DEFAULT now())`;
    await sql`INSERT INTO bw_shared_world(world_key,placed) VALUES ('main','[]'::jsonb) ON CONFLICT(world_key) DO NOTHING`;
    await sql`CREATE TABLE IF NOT EXISTS bw_messages (id bigserial PRIMARY KEY, from_name text NOT NULL, from_key text NOT NULL, to_key text, body text NOT NULL, x double precision NOT NULL DEFAULT 0, z double precision NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE INDEX IF NOT EXISTS bw_messages_id_idx ON bw_messages(id)`;
  })().catch(e => { schemaReady = null; throw e; });
  await schemaReady;
  return sql;
}
function send(res, status, body) { res.status(status).json(body); }
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { e: 'طريقة الطلب غير مدعومة' });
  try {
    const sql = await db();
    const ep = String(req.url || '').split('?')[0].replace(/^\/api\/?/, '').replace(/\/$/, '');
    const b = req.body && typeof req.body === 'object' ? req.body : {};
    if (ep === 'register') {
      const name = String(b.name || '').normalize('NFKC').trim().slice(0, 16);
      const pass = String(b.pass || '');
      const key = normalizeName(name);
      if (name.length < 2 || pass.length < 6 || pass.length > 256) return send(res, 400, { e: 'اسم اللاعب يجب أن يكون حرفين على الأقل وكلمة المرور بين 6 و256 حرفًا' });
      const salt = crypto.randomBytes(16).toString('hex');
      const passHash = hash(pass, salt);
      const hue = crypto.randomInt(0, 360);
      const made = await sql`INSERT INTO bw_users (user_key,name,salt,pass_hash,hue) VALUES (${key},${name},${salt},${passHash},${hue}) ON CONFLICT (user_key) DO NOTHING RETURNING user_key,name,hue,save`;
      if (!made.length) return send(res, 409, { e: 'هذا الاسم مستخدم بالفعل، جرّب اسمًا مختلفًا' });
      const token = crypto.randomBytes(32).toString('hex');
      await sql`INSERT INTO bw_sessions(token,user_key) VALUES (${token},${key})`;
      return send(res, 200, { token, name: made[0].name, hue: made[0].hue, save: made[0].save });
    }
    if (ep === 'login') {
      const key = normalizeName(b.name), pass = String(b.pass || '');
      if (pass.length > 256) return send(res, 401, { e: 'اسم اللاعب أو كلمة المرور غير صحيحة' });
      const rows = await sql`SELECT user_key,name,salt,pass_hash,hue,save FROM bw_users WHERE user_key=${key} LIMIT 1`;
      const u = rows[0];
      if (!u) return send(res, 401, { e: 'اسم اللاعب أو كلمة المرور غير صحيحة' });
      const a = Buffer.from(u.pass_hash, 'hex'), c = Buffer.from(hash(pass, u.salt), 'hex');
      if (a.length !== c.length || !crypto.timingSafeEqual(a, c)) return send(res, 401, { e: 'اسم اللاعب أو كلمة المرور غير صحيحة' });
      const token = crypto.randomBytes(32).toString('hex');
      await sql`INSERT INTO bw_sessions(token,user_key) VALUES (${token},${key})`;
      return send(res, 200, { token, name: u.name, hue: u.hue, save: u.save });
    }
    const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!auth) return send(res, 401, { e: 'سجّل الدخول أولًا' });
    const users = await sql`SELECT u.user_key,u.name,u.hue,u.save,u.inbox FROM bw_sessions s JOIN bw_users u ON u.user_key=s.user_key WHERE s.token=${auth} AND s.created_at > now() - interval '30 days' LIMIT 1`;
    const u = users[0];
    if (!u) return send(res, 401, { e: 'انتهت الجلسة؛ سجّل الدخول مجددًا' });
    const key = u.user_key;
    if (ep === 'me') return send(res, 200, { name: u.name, hue: u.hue, save: u.save });
    if (ep === 'save') {
      if (!validSave(b.save)) return send(res, 400, { e: 'بيانات الحفظ غير صالحة أو تتجاوز الحدود الآمنة؛ لم يتم تغيير عالمك.' });
      await sql`UPDATE bw_users SET save=${JSON.stringify(b.save)}::jsonb WHERE user_key=${key}`;
      return send(res, 200, { ok: 1 });
    }
    if (ep === 'tick') {
      const x = Number(b.x) || 0, z = Number(b.z) || 0, ry = Number(b.ry) || 0, shared = !!b.sh, since = Math.max(0, Number(b.since) || 0);
      await sql`INSERT INTO bw_presence(user_key,x,z,ry,shared,updated_at) VALUES (${key},${x},${z},${ry},${shared},now()) ON CONFLICT(user_key) DO UPDATE SET x=EXCLUDED.x,z=EXCLUDED.z,ry=EXCLUDED.ry,shared=EXCLUDED.shared,updated_at=now()`;
      // Apply explicit changes to the latest database value, avoiding stale full-snapshot overwrites.
      const worldAdd = b.worldAdd === undefined ? [] : b.worldAdd;
      const worldRemove = b.worldRemove === undefined ? [] : b.worldRemove;
      const validSharedChanges = shared && validPlacedList(worldAdd) && validPlacedList(worldRemove);
      if (validSharedChanges && (worldAdd.length || worldRemove.length)) {
        const removeJson = JSON.stringify(worldRemove);
        const addJson = JSON.stringify(worldAdd);
        await sql `
          UPDATE bw_shared_world
          SET placed = (
            SELECT COALESCE(jsonb_agg(existing.value ORDER BY existing.ordinality), '[]'::jsonb)
            FROM jsonb_array_elements(bw_shared_world.placed) WITH ORDINALITY AS existing(value, ordinality)
            WHERE NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements(`${removeJson}::jsonb) AS gone(value)
              WHERE gone.value = existing.value
            )
          ) || (
            SELECT COALESCE(jsonb_agg(candidate.value), '[]'::jsonb)
            FROM jsonb_array_elements(`${addJson}::jsonb) AS candidate(value)
            WHERE NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements(bw_shared_world.placed) AS current(value)
              WHERE current.value = candidate.value
            )
          ),
          updated_at = now()
          WHERE world_key = 'main'
          AND jsonb_array_length(placed) - (
            SELECT COUNT(*) FROM jsonb_array_elements(bw_shared_world.placed) AS existing(value)
            WHERE EXISTS (
              SELECT 1 FROM jsonb_array_elements(`${removeJson}::jsonb) AS gone(value)
              WHERE gone.value = existing.value
            )
          ) + (
            SELECT COUNT(*) FROM jsonb_array_elements(`${addJson}::jsonb) AS candidate(value)
            WHERE NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements(bw_shared_world.placed) AS current(value)
              WHERE current.value = candidate.value
            )
          ) <= 1000
        `;
      }
      let pl = [], worlds = [], sharedWorld = [];
      if (shared) {
        const sharedRows = await sql`SELECT placed FROM bw_shared_world WHERE world_key='main' LIMIT 1`;
        sharedWorld = Array.isArray(sharedRows[0]?.placed) ? sharedRows[0].placed.slice(0,1000) : [];
        pl = await sql`SELECT p.user_key AS id,u.name,p.x,p.z,p.ry,u.hue FROM bw_presence p JOIN bw_users u ON u.user_key=p.user_key WHERE p.user_key <> ${key} AND p.updated_at > now() - interval '6 seconds' AND p.shared=true`;
        // Shared builds come exclusively from bw_shared_world; never expose personal saves here.
        worlds = [];
      }
      const ms = await sql`SELECT id,from_name AS "from",to_key,body AS text FROM bw_messages WHERE id > ${since} AND (to_key=${key} OR (from_key=${key} AND to_key IS NOT NULL) OR (to_key IS NULL AND ${shared}=true AND sqrt(power(x-${x},2)+power(z-${z},2)) < 45)) ORDER BY id LIMIT 200`;
      const inbox = Array.isArray(u.inbox) ? u.inbox : [];
      if (inbox.length) await sql`UPDATE bw_users SET inbox='[]'::jsonb WHERE user_key=${key}`;
      const lastRows = await sql`SELECT COALESCE(MAX(id),0)::bigint AS last FROM bw_messages`;
      return send(res, 200, { pl: pl.map(p => ({ id:p.id, name:p.name, x:p.x, z:p.z, ry:p.ry, hue:p.hue })), worlds:worlds.map(w => ({ id:w.id, placed:Array.isArray(w.placed)?w.placed.slice(0,1000):[] })), sharedWorld, ms:ms.map(m => ({ id:Number(m.id), from:m.from, priv:!!m.to_key, text:m.text })), inbox, last:Number(lastRows[0].last) });
    }
    if (ep === 'chat') {
      const to = b.to ? String(b.to) : '';
      const text = String(b.text || '').trim().slice(0, 120);
      if (!text) return send(res, 400, { e: 'رسالة فارغة' });
      let target = null;
      if (to) { const t = await sql`SELECT user_key FROM bw_users WHERE user_key=${to} LIMIT 1`; if (!t.length || to === key) return send(res, 400, { e: 'المستلم غير صالح' }); target = t[0].user_key; }
      const loc = await sql`SELECT x,z FROM bw_presence WHERE user_key=${key}`;
      const px = loc[0] ? loc[0].x : 0, pz = loc[0] ? loc[0].z : 0;
      await sql`INSERT INTO bw_messages(from_name,from_key,to_key,body,x,z) VALUES (${u.name},${key},${target},${text},${px},${pz})`;
      return send(res, 200, { ok: 1 });
    }
    if (ep === 'gift') {
      const to = String(b.to || ''), item = String(b.item || ''), n = Math.floor(Number(b.n));
      if (!/^e\d{1,3}$/.test(item) || !(n >= 1 && n <= 99) || to === key) return send(res, 400, { e: 'هدية غير صالحة' });
      const target = await sql`SELECT user_key,inbox FROM bw_users WHERE user_key=${to} LIMIT 1`;
      if (!target.length) return send(res, 400, { e: 'المستلم غير موجود' });
      const inbox = Array.isArray(target[0].inbox) ? target[0].inbox : [];
      inbox.push({ item, n, from: u.name });
      if (inbox.length > 200) inbox.shift();
      await sql`UPDATE bw_users SET inbox=${JSON.stringify(inbox)}::jsonb WHERE user_key=${to}`;
      await sql`INSERT INTO bw_messages(from_name,from_key,to_key,body,x,z) VALUES ('🎁 هدية',${key},${to},${'وصلتك هدية من '+u.name+'!'},0,0)`;
      return send(res, 200, { ok: 1 });
    }
    return send(res, 404, { e: 'واجهة غير موجودة' });
  } catch (e) {
    console.error('BlockWorld API:', e);
    return send(res, e.status || 500, { e: e.status === 503 ? e.message : 'تعذر تنفيذ الطلب على الخادم. تحقق من DATABASE_URL وسجلات الاستضافة.' });
  }
};
