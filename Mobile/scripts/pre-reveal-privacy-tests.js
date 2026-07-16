#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const utilPath = path.join(__dirname, '..', 'src', 'utils', 'crushPrivacy.ts');
const utilSource = fs.readFileSync(utilPath, 'utf8');
const compiled = ts.transpileModule(utilSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
}).outputText;

const sandbox = {
  exports: {},
  require,
  console,
};

vm.runInNewContext(compiled, sandbox, { filename: utilPath });

const { getCrushDisplayModel, getCrushDisplayState } = sandbox.exports;

const oneSidedCrush = {
  status: 'pending',
  matchId: null,
};
const hiddenMutualCrush = {
  status: 'matched',
  matchId: 'match-hidden',
};
const activeMutualCrush = {
  status: 'matched',
  matchId: 'match-active',
};
const unhookedCrush = { status: 'unhooked', matchId: 'match-unhooked' };
const expiredCrush = { status: 'expired', matchId: null };

assert.equal(getCrushDisplayState(oneSidedCrush), 'private');
assert.equal(getCrushDisplayState(hiddenMutualCrush), 'private');
assert.equal(getCrushDisplayState(activeMutualCrush), 'private');
assert.equal(getCrushDisplayState(unhookedCrush), 'private');
assert.equal(getCrushDisplayState(expiredCrush), 'expired');

const oneSidedModel = getCrushDisplayModel(oneSidedCrush);
assert.equal(oneSidedModel.title, 'Added privately');
assert.equal(oneSidedModel.badge, 'PRIVATE');
assert.equal(oneSidedModel.isActive, true);

const hiddenModel = getCrushDisplayModel(hiddenMutualCrush);
assert.equal(hiddenModel.title, 'Added privately');
assert.equal(hiddenModel.badge, 'PRIVATE');
assert.equal(hiddenModel.isActive, true);
assert.ok(!/matched|crushed you back|waiting for them/i.test(`${hiddenModel.title} ${hiddenModel.subtitle} ${hiddenModel.badge}`));

const activeModel = getCrushDisplayModel(activeMutualCrush);
assert.equal(activeModel.title, 'Added privately');
assert.equal(activeModel.badge, 'PRIVATE');
assert.equal(activeModel.isActive, true);

const unhookedModel = getCrushDisplayModel(unhookedCrush);
assert.equal(unhookedModel.title, 'Added privately');
assert.equal(unhookedModel.badge, 'PRIVATE');
assert.equal(unhookedModel.isActive, true);

const expiredModel = getCrushDisplayModel(expiredCrush);
assert.equal(expiredModel.badge, 'EXPIRED');
assert.equal(expiredModel.isActive, false);

const addCrushSource = fs.readFileSync(path.join(__dirname, '..', 'app', 'add-crush.tsx'), 'utf8');
assert.ok(!addCrushSource.includes("It's mutual"));
assert.ok(!addCrushSource.includes("? 'Matched'"));

const crushesSource = fs.readFileSync(path.join(__dirname, '..', 'app', '(tabs)', 'crushes.tsx'), 'utf8');
assert.ok(!crushesSource.includes('useMatches'), 'Home must not subscribe to match state');
assert.ok(!crushesSource.includes('stat-matched'), 'Home must not expose a matched counter');
assert.ok(!crushesSource.includes('>Matched<'), 'Home must not label any crush as matched');
assert.ok(!crushesSource.includes('phoneLast4'), 'Home crush cards must not display phone-number fragments');
assert.match(crushesSource, /name="heart-outline"/, 'all active crush cards must use identical neutral styling');

console.log('pre-reveal privacy checks passed');
