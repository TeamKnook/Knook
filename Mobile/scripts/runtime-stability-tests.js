#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'services', 'contacts', 'contactsService.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
}).outputText;

const sandbox = {
  exports: {},
  require(request) {
    if (request === '@/src/utils/diagnostics') {
      return { diagnostics: { log() {}, warn() {}, error() {} } };
    }
    if (request === '@/src/utils/environment') {
      return { appEnvironment: { canUsePreviewTools: true } };
    }
    return require(request);
  },
  console,
};

vm.runInNewContext(compiled, sandbox, { filename: sourcePath });

const { sanitizeContactsForPreview } = sandbox.exports;

assert.equal(typeof sanitizeContactsForPreview, 'function');
assert.equal(sanitizeContactsForPreview(null).length, 0);
assert.equal(sanitizeContactsForPreview({}).length, 0);
assert.equal(sanitizeContactsForPreview([]).length, 0);

const contacts = sanitizeContactsForPreview([
  null,
  {},
  { id: 'one', name: '  Asha  ', phone: '  +91 90000 00001  ' },
  { id: 'one', name: 'Duplicate', phone: '+919000000002' },
  { name: '', phone: '+919000000003' },
  { id: 'missing-phone', name: 'No Phone' },
  { id: 'numeric-name', name: 42, phone: '+919000000004' },
]);

assert.equal(contacts.length, 3);
assert.equal(contacts[0].id, 'one');
assert.equal(contacts[0].name, 'Asha');
assert.equal(contacts[0].phone, '+91 90000 00001');
assert.equal(contacts[1].name, 'Unknown');
assert.match(contacts[1].id, /^contact-4-/);
assert.equal(contacts[2].name, 'Unknown');

sandbox.exports.contactsService.loadContacts().then((loaded) => {
  assert.ok(loaded.length >= 3);
  assert.ok(loaded.some((contact) => contact.phone === '+15555550101'));
  console.log('runtime stability checks passed');
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
