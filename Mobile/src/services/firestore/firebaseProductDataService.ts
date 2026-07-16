import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from '@react-native-firebase/firestore';
import type { Crush, Match, Message } from '@/src/models';
import { authService } from '@/src/services/auth/authService';
import { appEnvironment } from '@/src/utils/environment';
import { sha256 } from '@/src/utils/sha256';
import { getKnookFirestore } from './firebaseFirestore';
import { userProfileService } from './userProfileService';

type FirestoreRecord = Record<string, unknown>;

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) throw new Error('Enter a valid phone number');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

function phoneLast4(phone: string): string {
  return phone.replace(/\D/g, '').slice(-4);
}

function toIso(value: unknown): string {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function nullableIso(value: unknown): string | null {
  return value ? toIso(value) : null;
}

function isPermissionDenied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('permission-denied') || message.includes('Permission denied');
}

async function currentUid(): Promise<string> {
  const uid = await authService.getCurrentUid();
  if (!uid) throw new Error('Sign in before continuing');
  return uid;
}

async function currentProfile() {
  const uid = await currentUid();
  const profile = await userProfileService.createUserProfileFromAuth();
  if (profile.uid !== uid) throw new Error('Profile mismatch');
  if (!profile.phoneHash) throw new Error('Profile phone identity is missing');
  return profile;
}

function crushFromData(data: FirestoreRecord): Crush {
  return {
    uid: String(data.uid ?? ''),
    phoneHash: String(data.phoneHash ?? ''),
    phoneLast4: typeof data.phoneLast4 === 'string' ? data.phoneLast4 : undefined,
    status: (data.status ?? 'pending') as Crush['status'],
    crushedAt: toIso(data.crushedAt),
    expiresAt: toIso(data.expiresAt),
    renewedAt: nullableIso(data.renewedAt),
    matchId: typeof data.matchId === 'string' ? data.matchId : null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

function matchFromData(data: FirestoreRecord, viewerUid: string): Match {
  const participants = Array.isArray(data.participants) ? data.participants.map(String) : [];
  const userA = String(data.userA ?? participants[0] ?? '');
  const userB = String(data.userB ?? participants[1] ?? '');
  const otherUid = userA === viewerUid ? userB : userA;
  const revealedBy = Array.isArray(data.revealedBy) ? data.revealedBy.map(String) : [];
  const revealedNames = (data.revealedNames ?? {}) as Record<string, unknown>;
  const mutualReveal = Boolean(data.mutualReveal);

  return {
    matchId: String(data.matchId ?? ''),
    userA,
    userB,
    participants,
    status: (data.status ?? 'pending_reveal') as Match['status'],
    matchedAt: toIso(data.matchedAt),
    revealedAt: nullableIso(data.revealedAt),
    revealedBy,
    mutualReveal,
    lastMessageAt: nullableIso(data.lastMessageAt),
    lastMessagePreview: typeof data.lastMessagePreview === 'string' ? data.lastMessagePreview : null,
    matchExpiresAt: nullableIso(data.matchExpiresAt),
    firstMessageSentAt: nullableIso(data.firstMessageSentAt),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    otherUid,
    otherName: mutualReveal && typeof revealedNames[otherUid] === 'string'
      ? String(revealedNames[otherUid])
      : null,
    otherPhoneLast4: null,
    iRevealed: revealedBy.includes(viewerUid),
  };
}

function messageFromData(data: FirestoreRecord): Message {
  return {
    messageId: String(data.messageId ?? ''),
    matchId: String(data.matchId ?? ''),
    senderId: String(data.senderId ?? ''),
    type: 'text',
    text: String(data.text ?? ''),
    sentAt: toIso(data.sentAt),
    readBy: Array.isArray(data.readBy) ? data.readBy.map(String) : [],
    creditsCharged: typeof data.creditsCharged === 'number' ? data.creditsCharged : 0,
    deletedAt: nullableIso(data.deletedAt),
  };
}

async function waitForMatch(matchId: string, predicate: (match: Match) => boolean): Promise<Match> {
  let last = await firebaseProductDataService.getMatch(matchId);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (predicate(last)) return last;
    await new Promise((resolve) => setTimeout(resolve, 400));
    last = await firebaseProductDataService.getMatch(matchId);
  }
  return last;
}

async function waitForCrushRequest(
  requestRef: ReturnType<typeof doc>,
): Promise<FirestoreRecord> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const snapshot = await getDoc(requestRef);
    const data = snapshot.data() as FirestoreRecord | undefined;
    if (data?.status === 'failed') {
      throw new Error(typeof data.error === 'string' ? data.error : 'Could not add crush');
    }
    if (data?.status === 'processed') return data;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Adding this crush is taking longer than expected. Please try again.');
}

export const firebaseProductDataService = {
  async addCrush(phone: string): Promise<Crush> {
    const profile = await currentProfile();
    const targetPhone = normalizePhone(phone);
    const phoneHash = sha256(targetPhone);
    if (phoneHash === profile.phoneHash) throw new Error('You cannot crush on yourself');

    const crushRef = doc(getKnookFirestore(), 'users', profile.uid, 'crushes', phoneHash);
    const requestRef = doc(collection(getKnookFirestore(), 'crushRequests'));
    await setDoc(requestRef, {
      requestId: requestRef.id,
      uid: profile.uid,
      phoneHash,
      phoneLast4: phoneLast4(targetPhone),
      createdAt: serverTimestamp(),
    });
    await waitForCrushRequest(requestRef);

    const saved = await getDoc(crushRef);
    if (!saved.exists()) throw new Error('Crush was not saved. Please try again.');
    return crushFromData(saved.data() as FirestoreRecord);
  },

  async listCrushes(): Promise<Crush[]> {
    const uid = await currentUid();
    const snap = await getDocs(collection(getKnookFirestore(), 'users', uid, 'crushes'));
    return snap.docs
      .map((item) => crushFromData(item.data() as FirestoreRecord))
      .sort((a, b) => Date.parse(b.crushedAt) - Date.parse(a.crushedAt));
  },

  async listMatches(): Promise<Match[]> {
    const uid = await currentUid();
    const q = query(
      collection(getKnookFirestore(), 'matches'),
      where('participants', 'array-contains', uid),
      where('status', '==', 'active'),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((item) => matchFromData(item.data() as FirestoreRecord, uid))
      .sort((a, b) => Date.parse(b.lastMessageAt ?? b.matchedAt) - Date.parse(a.lastMessageAt ?? a.matchedAt));
  },

  async getMatch(matchId: string): Promise<Match> {
    const uid = await currentUid();
    const snap = await getDoc(doc(getKnookFirestore(), 'matches', matchId)).catch((error) => {
      if (isPermissionDenied(error)) throw new Error('match no longer available');
      throw error;
    });
    if (!snap.exists()) throw new Error('match not found');
    const match = matchFromData(snap.data() as FirestoreRecord, uid);
    if (!match.participants.includes(uid)) throw new Error('not a participant');
    if (match.status === 'unhooked') throw new Error('match no longer available');
    if (match.status !== 'active') throw new Error('match not revealed yet');
    return match;
  },

  async reveal(matchId: string): Promise<Match> {
    const uid = await currentUid();
    await setDoc(
      doc(collection(getKnookFirestore(), 'revealRequests')),
      { matchId, uid, createdAt: serverTimestamp() },
    );
    return waitForMatch(matchId, (match) => match.revealedBy.includes(uid));
  },

  async unhook(matchId: string): Promise<{ ok: boolean }> {
    const uid = await currentUid();
    await setDoc(
      doc(collection(getKnookFirestore(), 'unhookRequests')),
      { matchId, uid, createdAt: serverTimestamp() },
    );
    return { ok: true };
  },

  async listMessages(matchId: string): Promise<Message[]> {
    await this.getMatch(matchId);
    const q = query(
      collection(getKnookFirestore(), 'matches', matchId, 'messages'),
      where('deletedAt', '==', null),
      orderBy('sentAt', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((item) => messageFromData(item.data() as FirestoreRecord));
  },

  async sendMessage(matchId: string, text: string): Promise<Message> {
    const uid = await currentUid();
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Message cannot be empty');
    const match = await this.getMatch(matchId);
    if (!match.participants.includes(uid)) throw new Error('not a participant');

    const messageRef = doc(collection(getKnookFirestore(), 'matches', matchId, 'messages'));
    await setDoc(messageRef, {
      messageId: messageRef.id,
      matchId,
      senderId: uid,
      type: 'text',
      text: trimmed,
      sentAt: serverTimestamp(),
      readBy: [uid],
      creditsCharged: 0,
      deletedAt: null,
    });

    const saved = await getDoc(messageRef);
    return messageFromData(saved.data() as FirestoreRecord);
  },

  async triggerDailyReveal(): Promise<{ updated: number }> {
    if (!appEnvironment.canUsePreviewTools) throw new Error('Demo reveal is development only');
    const uid = await currentUid();
    await setDoc(doc(collection(getKnookFirestore(), 'devRevealRequests')), {
      uid,
      createdAt: serverTimestamp(),
    });
    return { updated: 0 };
  },
};
