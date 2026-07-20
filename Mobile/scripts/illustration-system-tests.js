const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const animationSource = read('src/illustrations/knookOoAnimations.ts');
const staticRegistrySource = read('src/illustrations/knookStaticIllustrations.ts');
const componentSource = read('src/components/illustrations/KnookIllustration.tsx');
const dailyRevealAsset = read('assets/illustrations/static/knook-daily-reveal.svg');
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
  assert.match(staticRegistrySource, new RegExp(`\\b${state}\\b`), `missing ${state} static registry state`);
}

const staticAssets = [
  'knook-opening-splash.svg',
  'knook-private-circle.svg',
  'knook-daily-reveal.svg',
  'knook-anonymous-chat.svg',
  'knook-identity-reveal.svg',
  'knook-unhook.svg',
  'knook-profile.svg',
];
for (const filename of staticAssets) {
  const source = read(`assets/illustrations/static/${filename}`);
  assert.match(source, /viewBox="0 0 320 260"/, `${filename} must preserve the approved Figma canvas`);
  assert.match(staticRegistrySource, new RegExp(filename.replace('.', '\\.')), `${filename} must be registered`);
}

assert.match(componentSource, /isReduceMotionEnabled/, 'illustrations must honor reduced motion');
assert.match(componentSource, /accessibilityLabel=\{labels\[state\]\}/, 'illustrations need meaningful accessibility labels');
assert.match(componentSource, /hasViewManagerConfig\('LottieAnimationView'\)/, 'old native builds need a Lottie availability guard');
assert.match(componentSource, /StaticOoFallback/, 'old native builds need a static wordmark fallback');
assert.match(appConfigSource, /backgroundColor: '#F5F4EF'/, 'native splash must hand off on the Knook off-white');
assert.doesNotMatch(appConfigSource, /splash-image\.png/, 'native splash must not show stale preview branding');
assert.match(layoutSource, /KnookBrandSplash/, 'opening splash must use the illustration system');
assert.match(crushesSource, /state="binoculars"/, 'empty private circle must use binoculars');
assert.doesNotMatch(crushesSource, /state="hearts"/, 'matched hearts must never render on the pre-reveal Crushes screen');
assert.match(chatsSource, /matches\.length[\s\S]*state="hearts"/, 'daily reveal hearts must require visible active matches');
assert.doesNotMatch(animationSource, /knookIllustrationDarkStates[\s\S]*'hearts'/, 'daily reveal hearts must use the clean light treatment');
assert.doesNotMatch(dailyRevealAsset, /<rect/, 'daily reveal wordmark must not render a background panel');
assert.match(dailyRevealAsset, /fill="#111111"/, 'daily reveal letters must render in near-black');
assert.match(chatSource, /AnonymousChatIllustration/, 'anonymous chat must use its dedicated message illustration');
assert.match(chatSource, /AmbientLineBackground/, 'anonymous chat must preserve the subtle line-art background');
assert.match(chatSource, /state="unhook"/, 'unhook confirmation must use the unhook state');
assert.match(revealSource, /state="surprise"/, 'identity reveal must use the surprise state');
assert.match(profileSource, /state="mirror"/, 'profile must use the mirror state');

console.log('Knook illustration system checks passed.');
