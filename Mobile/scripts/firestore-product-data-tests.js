#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.join(__dirname, '..');
const repoRoot = path.join(mobileRoot, '..');

function readMobile(relativePath) {
  return fs.readFileSync(path.join(mobileRoot, relativePath), 'utf8');
}

function readRepo(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const environment = readMobile('src/utils/environment.ts');
assert.match(environment, /productDataProvider/);
assert.match(environment, /usesFirebaseProductData/);

const appConfig = readMobile('app.config.js');
assert.match(appConfig, /PRODUCT_DATA_PROVIDER/);
assert.match(appConfig, /productDataProvider: PRODUCT_DATA_PROVIDER/);

const facade = readMobile('src/services/firestore/firestoreService.ts');
assert.match(facade, /firebaseProductDataService/);
assert.match(facade, /appEnvironment\.usesFirebaseProductData/);
assert.match(facade, /productDataService\.addCrush/);
assert.match(facade, /productDataService\.triggerDailyReveal/);

const productService = readMobile('src/services/firestore/firebaseProductDataService.ts');
assert.match(productService, /users', profile\.uid, 'crushes', phoneHash/);
assert.match(productService, /collection\(getKnookFirestore\(\), 'crushRequests'\)/);
assert.match(productService, /waitForCrushRequest/);
assert.doesNotMatch(productService, /setDoc\(\s*crushRef/);
assert.match(productService, /where\('status', '==', 'active'\)/);
assert.match(productService, /revealRequests/);
assert.match(productService, /unhookRequests/);
assert.match(productService, /devRevealRequests/);
assert.match(productService, /matches', matchId, 'messages'/);
assert.doesNotMatch(productService, /api\.(get|post|put|delete)/);
assert.doesNotMatch(productService, /users', otherUid/);

const chatScreen = readMobile('app/chat/[matchId].tsx');
assert.match(chatScreen, /const \[viewerUid, setViewerUid\]/);
assert.match(chatScreen, /item\.senderId === viewerUid/);

const rules = readRepo('firebase/firestore.rules');
assert.match(rules, /match \/users\/\{uid\}/);
assert.match(rules, /match \/crushes\/\{phoneHash\}/);
assert.match(rules, /allow create, update, delete: if false/);
assert.match(rules, /match \/crushRequests\/\{requestId\}/);
assert.match(rules, /validCrushRequest\(requestId\)/);
assert.match(rules, /phoneHashUnchangedOrInitiallyBackfilled/);
assert.match(rules, /match \/matches\/\{matchId\}/);
assert.match(rules, /resource\.data\.status == 'active'/);
assert.match(rules, /match \/messages\/\{messageId\}/);
assert.match(rules, /request\.resource\.data\.senderId == request\.auth\.uid/);
assert.match(rules, /match \/revealRequests\/\{requestId\}/);
assert.match(rules, /match \/unhookRequests\/\{requestId\}/);
assert.match(rules, /match \/devRevealRequests\/\{requestId\}/);

const indexes = JSON.parse(readRepo('firebase/firestore.indexes.json'));
assert.ok(indexes.indexes.some((index) => index.collectionGroup === 'matches'));
assert.ok(indexes.indexes.some((index) => index.collectionGroup === 'messages'));

const detectMutual = readRepo('Backend/functions/src/crushes/detectMutualCrush.ts');
assert.match(detectMutual, /\.onWrite/);
assert.match(detectMutual, /reciprocalMatchStatus/);
assert.match(detectMutual, /refreshPrivacyHeldMatches/);
assert.match(detectMutual, /participants\.join\('_'\)/);
assert.match(detectMutual, /status: 'matched'/);

const crushRequest = readRepo('Backend/functions/src/crushes/handleCrushRequest.ts');
assert.match(crushRequest, /crushRequests\/\{requestId\}/);
assert.match(crushRequest, /MAX_FREE_ACTIVE_CRUSHES/);
assert.match(crushRequest, /privateCircleMetadata/);
assert.match(crushRequest, /invalid crush request/);
assert.doesNotMatch(crushRequest, /phoneNumberE164|targetPhone/);

const dailyReveal = readRepo('Backend/functions/src/reveal/dailyReveal.ts');
assert.match(dailyReveal, /pubsub\.schedule\('30 18 \* \* \*'\)/);
assert.match(dailyReveal, /timeZone\('Asia\/Kolkata'\)/);
assert.match(dailyReveal, /handleDevRevealRequest/);
assert.match(dailyReveal, /\['privacy_hold', 'pending_reveal'\]/);
assert.match(dailyReveal, /participantActiveCrushCounts/);
assert.match(dailyReveal, /runTransaction/);
assert.match(dailyReveal, /revealedAt: currentData\.revealedAt \?\? now/);
assert.match(dailyReveal, /matchExpiresAt: currentData\.matchExpiresAt \?\? expiresAt/);

const matchModel = readMobile('src/models/Match.ts');
assert.match(matchModel, /'privacy_hold'/);

const functionsIndex = readRepo('Backend/functions/src/index.ts');
assert.match(functionsIndex, /handleCrushRequest/);
assert.doesNotMatch(functionsIndex, /handleUnhook'/);
assert.doesNotMatch(functionsIndex, /sendMatchRevealedNotification/);

const identityReveal = readRepo('Backend/functions/src/reveal/handleIdentityReveal.ts');
assert.match(identityReveal, /revealRequests\/\{requestId\}/);
assert.match(identityReveal, /participants\.every/);
assert.match(identityReveal, /revealedNames/);

const unhook = readRepo('Backend/functions/src/matches/handleUnhookRequest.ts');
assert.match(unhook, /unhookRequests\/\{requestId\}/);
assert.match(unhook, /status: 'unhooked'/);
assert.match(unhook, /collectionGroup\('crushes'\)/);
assert.match(unhook, /deletedAt/);

const messages = readRepo('Backend/functions/src/messages/handleMessageCreated.ts');
assert.match(messages, /matches\/\{matchId\}\/messages\/\{messageId\}/);
assert.match(messages, /lastMessagePreview/);
assert.match(messages, /firstMessageSentAt/);

console.log('firestore product-data migration checks passed');
