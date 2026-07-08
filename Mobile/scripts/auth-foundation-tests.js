#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function compileTs(relativePath, mocks = {}) {
  const sourcePath = path.join(__dirname, '..', relativePath);
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
      if (mocks[request]) return mocks[request];
      return require(request);
    },
    console,
    process,
  };
  vm.runInNewContext(compiled, sandbox, { filename: sourcePath });
  return { exports: sandbox.exports, source };
}

const { exports: phoneUtils } = compileTs('src/utils/normalizePhone.ts');
assert.equal(phoneUtils.normalizePhone(' +1 (555) 555-0100 '), '+15555550100');
assert.equal(phoneUtils.normalizePhone('98220 30378'), '9822030378');
assert.equal(phoneUtils.normalizePhone(''), '');
assert.equal(phoneUtils.phoneLast4('+1 (555) 555-0101'), '0101');

const apiSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'api.ts'), 'utf8');
assert.match(apiSource, /setAccessTokenResolver/);
assert.match(apiSource, /setUidResolver/);
assert.match(apiSource, /Authorization/);
assert.ok(!apiSource.includes('Firebase ID token'));

const authServiceSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'auth', 'authService.ts'), 'utf8');
assert.match(authServiceSource, /appEnvironment\.usesFirebaseAuth/);
assert.match(authServiceSource, /firebaseAuthProvider/);
assert.match(authServiceSource, /previewAuthProvider/);
assert.match(authServiceSource, /setAccessTokenResolver/);

const firebaseProviderSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'auth', 'firebaseAuthProvider.ts'), 'utf8');
assert.match(firebaseProviderSource, /signInWithPhoneNumber/);
assert.match(firebaseProviderSource, /getIdToken/);
assert.match(firebaseProviderSource, /connectAuthEmulator/);
assert.doesNotMatch(firebaseProviderSource, /123456|5555550100|5555550101/);

const phoneScreen = fs.readFileSync(path.join(__dirname, '..', 'app', '(auth)', 'phone.tsx'), 'utf8');
const otpScreen = fs.readFileSync(path.join(__dirname, '..', 'app', '(auth)', 'otp.tsx'), 'utf8');
assert.match(phoneScreen, /if \(submitting\) return/);
assert.match(otpScreen, /if \(submitting\) return/);
assert.doesNotMatch(phoneScreen, /useState\(['"]\+91/);
assert.match(otpScreen, /appEnvironment\.canUsePreviewTools/);

const environmentSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'environment.ts'), 'utf8');
assert.match(environmentSource, /usesFirebaseAuth/);
assert.match(environmentSource, /usesPreviewAuth/);
assert.match(environmentSource, /usesFirebaseAuthEmulator/);
assert.match(environmentSource, /canShowFirebaseTestHelpers/);

console.log('auth foundation checks passed');
