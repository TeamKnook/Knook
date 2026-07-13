const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const animationSource = read('src/illustrations/knookOoAnimations.ts');
const componentSource = read('src/components/illustrations/KnookIllustration.tsx');
const appConfigSource = read('app.config.js');
const layoutSource = read('app/_layout.tsx');
const crushesSource = read('app/(tabs)/crushes.tsx');
const chatsSource = read('app/(tabs)/chats.tsx');
const chatSource = read('app/chat/[matchId].tsx');
const revealSource = read('app/reveal/[matchId].tsx');
const profileSource = read('app/(tabs)/profile.tsx');

const states = ['sleepy', 'binoculars', 'hearts', 'cupid', 'surprise', 'unhook', 'mirror'];
for (const state of states) {
  assert.match(animationSource, new RegExp(`\\b${state}\\b`), `missing ${state} animation state`);
}

assert.match(componentSource, /isReduceMotionEnabled/, 'illustrations must honor reduced motion');
assert.match(componentSource, /accessibilityLabel=\{labels\[state\]\}/, 'illustrations need meaningful accessibility labels');
assert.match(appConfigSource, /backgroundColor: '#F5F4EF'/, 'native splash must hand off on the Knook off-white');
assert.doesNotMatch(appConfigSource, /splash-image\.png/, 'native splash must not show stale preview branding');
assert.match(layoutSource, /KnookBrandSplash/, 'opening splash must use the illustration system');
assert.match(crushesSource, /state="binoculars"/, 'empty private circle must use binoculars');
assert.doesNotMatch(crushesSource, /state="hearts"/, 'matched hearts must never render on the pre-reveal Crushes screen');
assert.match(chatsSource, /matches\.length[\s\S]*state="hearts"/, 'daily reveal hearts must require visible active matches');
assert.match(chatSource, /state="cupid"/, 'anonymous chat must use the cupid state');
assert.match(chatSource, /state="unhook"/, 'unhook confirmation must use the unhook state');
assert.match(revealSource, /state="surprise"/, 'identity reveal must use the surprise state');
assert.match(profileSource, /state="mirror"/, 'profile must use the mirror state');

console.log('Knook illustration system checks passed.');
