import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer, SectionHeader, TextInputField, GhostButton } from '@/src/components';
import { contactsService, type ContactEntry } from '@/src/services/contacts/contactsService';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import { colors, radius, spacing, typography } from '@/src/theme';
import { diagnostics } from '@/src/utils/diagnostics';

export default function AddCrushScreen() {
  const router = useRouter();
  const mounted = useRef(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, 'pending' | 'matched'>>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    if (!mounted.current) return;
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      if (mounted.current) setToast(null);
    }, 2200);
  };

  useEffect(() => {
    diagnostics.log('add-crush-enter');
    mounted.current = true;

    void contactsService.loadContacts()
      .then((loaded) => {
        diagnostics.log('add-crush-contacts-loaded', {
          count: loaded.length,
          sampleKeys: loaded[0] ? Object.keys(loaded[0]) : [],
        });
        if (mounted.current) setContacts(loaded);
      })
      .catch((error) => {
        diagnostics.error('add-crush-contacts-load-failed', error);
        showToast('Could not load contacts');
      });

    return () => {
      diagnostics.log('add-crush-exit');
      mounted.current = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    const qDigits = q.replace(/\D/g, '');
    return contacts.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      return qDigits.length > 0 && c.phone.replace(/\D/g, '').includes(qDigits);
    });
  }, [contacts, query]);

  useEffect(() => {
    diagnostics.log('add-crush-list-render', { contacts: contacts.length, filtered: filtered.length });
  }, [contacts.length, filtered.length]);

  const onAdd = async (c: ContactEntry) => {
    try {
      diagnostics.log('add-crush-select', { contactId: c.id, hasPhone: !!c.phone });
      setAdding(c.id);
      const res = await firestoreService.addCrush(c.phone);
      if (!mounted.current) return;
      setAdded((prev) => ({ ...prev, [c.id]: res.status === 'matched' ? 'matched' : 'pending' }));
      showToast(
        res.status === 'matched'
          ? "It's mutual! Reveal is held until 6:30 PM IST."
          : 'Crush added secretly.',
      );
    } catch (e: unknown) {
      diagnostics.error('add-crush-submit-failed', e, { contactId: c.id });
      showToast(e instanceof Error ? e.message : 'Could not add');
    } finally {
      if (mounted.current) setAdding(null);
    }
  };

  const onDone = () => {
    diagnostics.log('add-crush-done');
    router.replace('/(tabs)/crushes');
  };

  return (
    <ScreenContainer testID="add-crush-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <SectionHeader
            eyebrow="Secret"
            title="Add a crush"
            subtitle="Pick from your contacts. They'll only know if they crush you back."
          />
          <TextInputField
            testID="contacts-search-input"
            label="Search"
            placeholder="Name or number"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <FlatList
          style={styles.listWrap}
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const status = added[item.id];
            return (
              <View testID={`contact-row-${item.id}`} style={styles.row}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={18} color={colors.knookPurple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.phone}>{item.phone}</Text>
                </View>
                <Pressable
                  testID={`add-crush-${item.id}`}
                  disabled={!!status || adding === item.id}
                  onPress={() => onAdd(item)}
                  style={[styles.action, status === 'matched' && styles.actionMatched, status === 'pending' && styles.actionPending]}
                >
                  <Text style={[styles.actionLabel, !!status && styles.actionLabelDone]}>
                    {status === 'matched' ? 'Matched' : status === 'pending' ? 'Added' : 'Crush'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />

        <View style={styles.footer}>
          <GhostButton testID="add-crush-close-button" label="Done" onPress={onDone} />
        </View>

        {toast ? (
          <View style={styles.toast} testID="add-crush-toast" pointerEvents="none">
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: spacing.md, paddingTop: spacing.md },
  listWrap: { flex: 1 },
  list: { flexGrow: 1, paddingTop: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, backgroundColor: colors.white,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.knookLightGrey,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.knookLightGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { ...typography.body, color: colors.knookDark, fontWeight: '700' },
  phone: { ...typography.caption, color: colors.knookMidGrey },
  action: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.pill, backgroundColor: colors.knookPurple,
  },
  actionPending: { backgroundColor: colors.knookLightGrey },
  actionMatched: { backgroundColor: colors.knookYellow },
  actionLabel: { ...typography.caption, color: colors.white, fontWeight: '700', textTransform: 'uppercase' },
  actionLabelDone: { color: colors.knookDark },
  footer: { paddingVertical: spacing.md },
  toast: {
    position: 'absolute', bottom: spacing.xxl, left: spacing.lg, right: spacing.lg,
    backgroundColor: colors.knookDark, padding: spacing.md, borderRadius: radius.lg,
  },
  toastText: { ...typography.body, color: colors.knookOffWhite, textAlign: 'center' },
});
