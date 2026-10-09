const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('all JavaScript files parse without syntax errors', () => {
  for (const file of [
    'server.js', 'api/[...path].js', 'public/js/catalog.js',
    'public/js/net.js', 'public/js/world.js', 'public/js/code.js',
    'public/js/main.js', 'public/js/extras.js'
  ]) assert.doesNotThrow(() => new vm.Script(read(file), { filename: file }), file);
});

test('all local scripts and styles referenced by the page exist', () => {
  const html = read('public/index.html');
  for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) {
    if (/^https?:\/\//.test(src)) continue;
    assert.equal(fs.existsSync(path.join(root, 'public', src)), true, 'missing script ' + src);
  }
  for (const [, href] of html.matchAll(/<link[^>]+href="([^"]+)"/g)) {
    if (/^https?:\/\//.test(href)) continue;
    assert.equal(fs.existsSync(path.join(root, 'public', href)), true, 'missing stylesheet ' + href);
  }
});

test('catalogue indexes and definition references stay consistent', () => {
  const source = read('public/js/catalog.js') + '\nglobalThis.__catalog = { ELS, ELC, PTS, PTC, DEFS, ZONES };';
  const context = {};
  vm.runInNewContext(source, context);
  const { ELS, ELC, PTS, PTC, DEFS, ZONES } = context.__catalog;
  assert.ok(ELS.length > 50);
  assert.ok(PTS.length > 20);
  assert.ok(ELC.length > 0 && PTC.length > 0 && ZONES.length >= 4);
  assert.equal(DEFS.e.length, ELS.length);
  assert.equal(DEFS.p.length, PTS.length);
  ELS.forEach((item, i) => assert.equal(item.i, i));
  PTS.forEach((item, i) => assert.equal(item.i, i));
});

test('custom block parser accepts the editor example and rejects arbitrary code', () => {
  const source = read('public/js/code.js');
  const snippet = source.slice(source.indexOf('const CUSTOM_COMMANDS='), source.indexOf('function customArg'));
  const parseCustom = vm.runInNewContext(snippet + '\nparseCustom');
  const ast = parseCustom('for (let i = 0; i < 4; i++) {\n forward(3);\n turn(90);\n}');
  assert.equal(ast.length, 1);
  assert.equal(ast[0].type, 'loop');
  assert.throws(() => parseCustom('fetch("https://example.com");'));
  assert.throws(() => parseCustom('while(true){}'));
  assert.throws(() => parseCustom('forward(secret);'));
  assert.doesNotThrow(() => parseCustom('turn(-90);'));
});

test('server save validator accepts a valid save and rejects malformed saves', () => {
  const source = read('api/[...path].js');
  const snippet = source.slice(source.indexOf('const SAVE_PROGRAM_KEYS'), source.indexOf('\nlet schemaReady'));
  const validSave = vm.runInNewContext(snippet + '\nvalidSave');
  const good = { xp: 0, pos: [0, 6], placed: [], prog: [], inv: {}, custom: [], avatar: { hat: 'none' } };
  assert.equal(validSave(good), true);
  assert.equal(validSave({ ...good, pos: [0] }), false);
  assert.equal(validSave({ ...good, inv: { e9999: 1 } }), false);
  assert.equal(validSave({ ...good, placed: Array(2001).fill(['e', 0, 0, 0]) }), false);
});

test('world import and backup validator rejects invalid data', () => {
  const source = read('public/js/extras.js');
  const snippet = source.slice(source.indexOf('const VALID_PROGRAM_KEYS'), source.indexOf('function saveBackup'));
  const context = { ELS: Array(2).fill({}), DEFS: { e: Array(2).fill({}), p: Array(2).fill({}) } };
  const validWorldSave = vm.runInNewContext(snippet + '\nvalidWorldSave', context);
  const good = { xp: 0, pos: [0, 6], placed: [], prog: [], inv: {}, custom: [], avatar: { hat: 'none' } };
  assert.equal(validWorldSave(good), true);
  assert.equal(validWorldSave({ ...good, pos: [0] }), false);
  assert.equal(validWorldSave({ ...good, placed: [['invalid', 0, 0, 0]] }), false);
});

test('network polling is guarded and removed placed objects release GPU resources', () => {
  assert.match(read('public/js/main.js'), /let tickBusy=false/);
  assert.match(read('public/js/world.js'), /geometries\.forEach\(g=>g\.dispose\(\)\)/);
  assert.match(read('public/js/main.js'), /parseCustom\(c\)/);
});


test('side placement aligns real world-space object bounds instead of fixed offsets', () => {
  const world = read('public/js/world.js');
  assert.ok(world.includes('new T.Box3().setFromObject(base.g)'));
  assert.ok(world.includes('new T.Box3().setFromObject(ghost)'));
  assert.ok(world.includes('targetBox.max.x-candidateBox.min.x'));
  assert.ok(world.includes('targetBox.max.z-candidateBox.min.z'));
  assert.ok(!world.includes('base.x+Math.sign(normal.x)*1'));
});


test('mobile build controls stay usable and selected builds can be hidden without cancelling placement', () => {
  const html = read('public/index.html');
  const css = read('public/css/style.css');
  const main = read('public/js/main.js');
  const world = read('public/js/world.js');
  assert.match(html, /id="quickBuild"/);
  assert.match(css, /#quickBuild\.on\{display:block\}/);
  assert.match(css, /grid-template-columns:repeat\(3,43px\)/);
  assert.match(main, /function hideBuildPanel\(\)/);
  assert.match(main, /function updateQuickBuild\(\)/);
  assert.match(world, /if\(typeof updateQuickBuild==='function'\)updateQuickBuild\(\)/);
});

test('shared world is globally persistent and separate from private saves', () => {
  const api = read('api/[...path].js');
  const server = read('server.js');
  const main = read('public/js/main.js');
  assert.match(api, /CREATE TABLE IF NOT EXISTS bw_shared_world/);
  assert.match(api, /UPDATE bw_shared_world SET placed=/);
  assert.match(api, /sharedWorld, ms:/);
  assert.match(server, /U\.__sharedWorld=b\.worldPlaced/);
  assert.match(server, /sharedWorld,ms,inbox,last:cid/);
  assert.match(main, /privatePlacedCache=placed\.filter/);
  assert.match(main, /placed:\(SH&&privatePlacedCache\?privatePlacedCache:S\.placed\)/);
  assert.match(main, /payload\.worldPlaced=localPlaced/);
  assert.match(main, /Array\.isArray\(r\.sharedWorld\)/);
  assert.match(main, /function syncWorlds\(worlds\)/);
});


test('player-placed objects and placement preview are larger than the avatar scale', () => {
  const world = read('public/js/world.js');
  assert.match(world, /HALF=240,BUILD_SCALE=1\.6/);
  assert.match(world, /g\.scale\.setScalar\(BUILD_SCALE\);g\.position\.set\(po\.x,y,po\.z\)/);
  assert.match(world, /ghost\.scale\.setScalar\(BUILD_SCALE\)/);
  assert.match(world, /PART_Y\[d\.b\]\|\|0\)\*BUILD_SCALE/);
});


test('shared building publishes changed local blocks immediately and validates server updates', () => {
  const main = read('public/js/main.js');
  const api = read('api/[...path].js');
  const server = read('server.js');
  assert.match(main, /lastSharedPlacementSignature=null/);
  assert.match(main, /placementSignature=JSON\.stringify\(localPlaced\)/);
  assert.match(main, /if\(placementSignature!==lastSharedPlacementSignature\)payload\.placed=localPlaced/);
  assert.match(main, /if\(SH&&payload\.placed\)lastSharedPlacementSignature=placementSignature/);
  assert.match(api, /const validSharedPlaced = shared && Array\.isArray\(b\.placed\)/);
  assert.match(api, /jsonb_set\(COALESCE\(save,'\{\}'::jsonb\),'\{placed\}'/);
  assert.match(server, /const validSharedPlaced=!!on\[k\]\.sh&&Array\.isArray\(b\.placed\)/);
  assert.match(server, /U\[k\]\.save=\{\.\.\.\(U\[k\]\.save\|\|\{\}\),placed:b\.placed\}/);
});


test('shared build collision uses rendered scale and includes remote-owned structures', () => {
  const world = read('public/js/world.js');
  assert.match(world, /if\(po\.k==='p'&&s\)cols\.push/);
  assert.match(world, /hx:s\[0\]\*BUILD_SCALE,hz:s\[1\]\*BUILD_SCALE/);
  assert.match(world, /g\.scale\.setScalar\(BUILD_SCALE\*\(1\+Math\.sin\(w\*6\.283\/p\)\*\.25\)\)/);
  assert.match(world, /const def=DEFS\[tool\.k\]&&DEFS\[tool\.k\]\[tool\.i\],part=def&&tool\.k==='p'\?/);
});

test('remote player motion is frame-rate independent and animates walking', () => {
  const world = read('public/js/world.js');
  assert.match(world, /blend=1-Math\.exp\(-dt\*14\)/);
  assert.match(world, /o\.phase\+=dt\*Math\.min\(14,7\+speed\*1\.4\)/);
  assert.match(world, /u\.armL\.rotation\.x=gait\*\.62/);
});


test('shared world persistence is separate from personal saves and survives disconnects', () => {
  const client = read('public/js/main.js');
  const local = read('server.js');
  const api = read('api/[...path].js');
  assert.match(client, /privatePlacedCache=placed\.filter/);
  assert.match(client, /placed:\(SH&&privatePlacedCache\?privatePlacedCache:S\.placed\)/);
  assert.match(client, /payload\.worldPlaced=localPlaced/);
  assert.match(client, /Array\.isArray\(r\.sharedWorld\)/);
  assert.match(local, /U\.__sharedWorld=b\.worldPlaced/);
  assert.match(local, /sharedWorld,ms,inbox,last:cid/);
  assert.match(api, /CREATE TABLE IF NOT EXISTS bw_shared_world/);
  assert.match(api, /UPDATE bw_shared_world SET placed=/);
  assert.match(api, /sharedWorld, ms:/);
});
