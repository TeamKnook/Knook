#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

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

const validation = compileTs('src/services/firestore/userProfileValidation.ts');
const {
  normalizeProfileGender,
  normalizeInterestedIn,
  validateOnboardingInput,
  sanitizeOnboardingInput,
  buildVibeAnswers,
} = validation.exports;

assert.equal(normalizeProfileGender('Woman'), 'woman');
assert.equal(normalizeProfileGender('Man'), 'man');
assert.equal(normalizeProfileGender('Non-binary'), 'non_binary');
assert.equal(normalizeProfileGender('Prefer not to say'), null);
assert.equal(normalizeInterestedIn('Men'), 'men');
assert.equal(normalizeInterestedIn('Women'), 'women');
assert.equal(normalizeInterestedIn('Everyone'), 'everyone');

const validInput = {
  firstName: 'Alex',
  age: '24',
  gender: 'Man',
  interestedIn: 'Women',
  idealFirstDate: 'Coffee',
  loveLanguage: 'Quality time',
  favouriteShow: 'Avatar',
};

assert.equal(validateOnboardingInput(validInput).ok, true);
assert.equal(validateOnboardingInput({ ...validInput, firstName: '' }).ok, false);
assert.equal(validateOnboardingInput({ ...validInput, age: '17' }).ok, false);
assert.equal(validateOnboardingInput({ ...validInput, gender: null }).ok, false);
assert.equal(validateOnboardingInput({ ...validInput, interestedIn: null }).ok, false);
assert.equal(validateOnboardingInput({ ...validInput, idealFirstDate: '', loveLanguage: '', favouriteShow: '' }).ok, false);
assert.equal(validateOnboardingInput({ ...validInput, favouriteShow: '' }).ok, false);
assert.equal(JSON.stringify(buildVibeAnswers(validInput)), JSON.stringify({
  idealFirstDate: ['Coffee'],
  lookingFor: ['Quality time'],
  favouriteTVShow: ['Avatar'],
}));
assert.equal(sanitizeOnboardingInput(validInput).favouriteShow, 'Avatar');

const profileService = read('src/services/firestore/userProfileService.ts');
assert.match(profileService, /doc\(getKnookFirestore\(\), 'users', uid\)/);
assert.match(profileService, /assertOwnProfile\(uid\)/);
assert.match(profileService, /phoneNumber = user\.phoneNumber/);
assert.match(profileService, /phoneNumberE164: phoneNumber/);
assert.match(profileService, /schemaVersion: USER_PROFILE_SCHEMA_VERSION/);
assert.match(profileService, /syncPreviewProfile/);
assert.doesNotMatch(profileService, /phoneNumberE164:\s*input/);

const onboardingScreen = read('app/(onboarding)/profile.tsx');
assert.match(onboardingScreen, /validateOnboardingInput/);
assert.match(onboardingScreen, /type OnboardingStep = 1 \| 2 \| 3/);
assert.match(onboardingScreen, /setStep\(2\)/);
assert.match(onboardingScreen, /setStep\(3\)/);
assert.match(onboardingScreen, /completeOnboarding\(uid, onboardingInput\)/);
assert.equal((onboardingScreen.match(/completeOnboarding\(/g) || []).length, 1);
assert.match(onboardingScreen, /profile-save-button/);
assert.match(onboardingScreen, /favourite-show-input/);
assert.doesNotMatch(onboardingScreen, /firestoreService\.updateMe/);

const indexScreen = read('app/index.tsx');
assert.match(indexScreen, /userProfileService\.getCurrentUserProfile/);
assert.match(indexScreen, /userProfileService\.createUserProfileFromAuth/);

const authService = read('src/services/auth/authService.ts');
assert.match(authService, /userProfileService\.createUserProfileFromAuth/);

const environment = read('src/utils/environment.ts');
assert.match(environment, /firestoreTarget/);
assert.match(environment, /usesFirestoreEmulator/);

const appConfig = read('app.config.js');
assert.match(appConfig, /FIRESTORE_TARGET/);
assert.match(appConfig, /RNFBFirestore/);

const rules = fs.readFileSync(path.join(__dirname, '..', '..', 'firebase', 'firestore.rules'), 'utf8');
assert.match(rules, /match \/users\/\{uid\}/);
assert.match(rules, /request\.auth\.uid == uid/);
assert.match(rules, /allow delete: if false/);
assert.match(rules, /phoneNumberE164 == resource\.data\.phoneNumberE164/);
assert.match(rules, /match \/\{document=\*\*\}/);

console.log('firestore profile checks passed');
