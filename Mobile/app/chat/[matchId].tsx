import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMessages } from '@/src/hooks/useMessages';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import type { Message } from '@/src/models';
import { colors, radius, spacing, typography } from '@/src/theme';
import { formatChatTime } from '@/src/utils/timeUtils';
import { diagnostics } from '@/src/utils/diagnostics';

export default function ChatScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { match, messages, send, error: loadError } = useMessages(matchId);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmUnhook, setConfirmUnhook] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    AsyncStorage.getItem('knook.uid').then(setMyUid);
  }, []);

  useEffect(() => {
    if (messages.length) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  // chat dismissed if the match got unhooked
  useEffect(() => {
    if (match && match.status === 'unhooked') {
      router.replace('/(tabs)/chats');
    }
  }, [match, router]);

  const onSend = async () => {
    const text = draft.trim();
    if (!text) return;
    try {
      setSending(true);
      setDraft('');
      setError(null);
      await send(text);
    } catch (err) {
      diagnostics.error('chat-send-failed', err, { matchId });
      setError(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const onUnhook = async () => {
    if (!matchId) return;
    try {
      setError(null);
      await firestoreService.unhook(matchId);
      router.replace('/(tabs)/chats');
    } catch (err) {
      diagnostics.error('chat-unhook-failed', err, { matchId });
      setError(err instanceof Error ? err.message : 'Could not unhook');
      setConfirmUnhook(false);
    }
  };

  const title = match?.mutualReveal && match.otherName ? match.otherName : 'Mystery Match';
  const subtitle = match?.mutualReveal
    ? 'Revealed · real names'
    : match?.iRevealed
    ? 'You revealed · waiting on them'
    : 'Anonymous';

  return (
    <SafeAreaView style={styles.safe} testID="chat-screen">
      <View style={styles.header}>
        <Pressable testID="chat-back-button" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.knookDark} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Pressable
          testID="chat-reveal-button"
          onPress={() => matchId && router.push(`/reveal/${matchId}`)}
          style={[styles.iconBtn, styles.headerAction]}
        >
          <Ionicons name="sparkles" size={18} color={colors.knookDark} />
        </Pressable>
        <Pressable
          testID="chat-unhook-button"
          onPress={() => setConfirmUnhook(true)}
          style={styles.iconBtn}
        >
          <Ionicons name="cut" size={20} color={colors.knookPurple} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.messageId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const mine = item.senderId === myUid;
            return (
              <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
                <View
                  testID={mine ? 'msg-out' : 'msg-in'}
                  style={[styles.bubble, mine ? styles.bubbleOut : styles.bubbleIn]}
                >
                  <Text style={[styles.bubbleText, mine ? styles.outText : styles.inText]}>{item.text}</Text>
                  <Text style={[styles.bubbleTime, mine ? styles.outTime : styles.inTime]}>
                    {formatChatTime(item.sentAt)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Say hello, anonymously.</Text>
              <Text style={styles.emptySub}>Real names appear only after you both reveal.</Text>
            </View>
          }
        />

        <View style={styles.composer}>
          {error || loadError ? (
            <Text style={styles.error}>{error || loadError}</Text>
          ) : null}
          <TextInput
            testID="chat-input"
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message…"
            placeholderTextColor={colors.knookMidGrey}
            style={styles.input}
            multiline
          />
          <Pressable
            testID="chat-send-button"
            disabled={sending || !draft.trim()}
            onPress={onSend}
            style={[styles.send, (sending || !draft.trim()) && styles.sendDisabled]}
          >
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {confirmUnhook ? (
        <View style={styles.sheetBackdrop} testID="unhook-sheet">
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Unhook this match?</Text>
            <Text style={styles.sheetBody}>
              This deletes the chat for both of you and removes the match. It cannot be undone.
            </Text>
            <Pressable testID="unhook-confirm" style={styles.sheetCta} onPress={onUnhook}>
              <Text style={styles.sheetCtaText}>Yes, unhook</Text>
            </Pressable>
            <Pressable
              testID="unhook-cancel"
              style={styles.sheetGhost}
              onPress={() => setConfirmUnhook(false)}
            >
              <Text style={styles.sheetGhostText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.knookOffWhite },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomColor: colors.knookLightGrey, borderBottomWidth: 1,
    backgroundColor: colors.white,
  },
  iconBtn: { padding: spacing.xs },
  headerAction: {},
  title: { ...typography.h3, color: colors.knookDark },
  subtitle: { ...typography.caption, color: colors.knookMidGrey },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
  bubbleRow: { flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  bubbleOut: { backgroundColor: colors.knookPurple, borderBottomRightRadius: 4 },
  bubbleIn: { backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.knookLightGrey },
  bubbleText: { ...typography.body },
  outText: { color: colors.white },
  inText: { color: colors.knookDark },
  bubbleTime: { ...typography.caption, marginTop: 2, fontSize: 11 },
  outTime: { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  inTime: { color: colors.knookMidGrey },
  empty: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...typography.h3, color: colors.knookDark, textAlign: 'center' },
  emptySub: { ...typography.body, color: colors.knookMidGrey, textAlign: 'center' },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    flexWrap: 'wrap',
    padding: spacing.md, backgroundColor: colors.white,
    borderTopColor: colors.knookLightGrey, borderTopWidth: 1,
  },
  error: { ...typography.caption, color: '#B91C1C', width: '100%' },
  input: {
    flex: 1, ...typography.body, color: colors.knookDark,
    backgroundColor: colors.knookLightGrey, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    maxHeight: 120, minHeight: 44,
  },
  send: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.knookPurple, alignItems: 'center', justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,26,26,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: { backgroundColor: colors.knookOffWhite, padding: spacing.lg, gap: spacing.sm, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetTitle: { ...typography.h2, color: colors.knookDark },
  sheetBody: { ...typography.body, color: colors.knookMidGrey, marginBottom: spacing.sm },
  sheetCta: { backgroundColor: colors.knookPurple, borderRadius: radius.pill, padding: spacing.md, alignItems: 'center' },
  sheetCtaText: { ...typography.buttonLg, color: colors.white },
  sheetGhost: { padding: spacing.md, alignItems: 'center' },
  sheetGhostText: { ...typography.buttonLg, color: colors.knookPurple },
});
