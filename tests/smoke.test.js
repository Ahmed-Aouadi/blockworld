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
