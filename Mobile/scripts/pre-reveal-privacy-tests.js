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

const { activeMatchIds, getCrushDisplayModel, getCrushDisplayState } = sandbox.exports;

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
const activeIds = activeMatchIds([
  { matchId: 'match-hidden', status: 'pending_reveal' },
  { matchId: 'match-active', status: 'active' },
  { matchId: 'match-unhooked', status: 'unhooked' },
]);

assert.equal(getCrushDisplayState(oneSidedCrush, activeIds), 'private');
assert.equal(getCrushDisplayState(hiddenMutualCrush, activeIds), 'private');
assert.equal(getCrushDisplayState(activeMutualCrush, activeIds), 'matched');

const oneSidedModel = getCrushDisplayModel(oneSidedCrush, activeIds);
assert.equal(oneSidedModel.title, 'Added privately');
assert.equal(oneSidedModel.badge, 'PRIVATE');
assert.equal(oneSidedModel.isMatched, false);

const hiddenModel = getCrushDisplayModel(hiddenMutualCrush, activeIds);
assert.equal(hiddenModel.title, 'Added privately');
assert.equal(hiddenModel.badge, 'PRIVATE');
assert.equal(hiddenModel.isMatched, false);
assert.ok(!/matched|crushed you back|waiting for them/i.test(`${hiddenModel.title} ${hiddenModel.subtitle} ${hiddenModel.badge}`));

const activeModel = getCrushDisplayModel(activeMutualCrush, activeIds);
assert.equal(activeModel.title, 'Matched');
assert.equal(activeModel.badge, 'MATCHED');
assert.equal(activeModel.isMatched, true);

const addCrushSource = fs.readFileSync(path.join(__dirname, '..', 'app', 'add-crush.tsx'), 'utf8');
assert.ok(!addCrushSource.includes("It's mutual"));
assert.ok(!addCrushSource.includes("? 'Matched'"));

console.log('pre-reveal privacy checks passed');
