import { useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { ScreenContainer, SectionHeader, TextInputField, GhostButton } from '@/src/components';
import { contactsService, type ContactEntry } from '@/src/services/contacts/contactsService';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import { colors, radius, spacing, typography } from '@/src/theme';

export default function AddCrushScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, 'pending' | 'matched'>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void contactsService.loadContacts().then(setContacts);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')),
    );
  }, [contacts, query]);

  const onAdd = async (c: ContactEntry) => {
    try {
      setAdding(c.id);
      const res = await firestoreService.addCrush(c.phone);
      setAdded((prev) => ({ ...prev, [c.id]: res.status === 'matched' ? 'matched' : 'pending' }));
      setToast(
        res.status === 'matched'
          ? "It's mutual! Reveal is held until 6:30 PM IST."
          : 'Crush added secretly.',
      );
      setTimeout(() => setToast(null), 2200);
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : 'Could not add');
      setTimeout(() => setToast(null), 2200);
    } finally {
      setAdding(null);
    }
  };

  return (
    <ScreenContainer testID="add-crush-screen">
      <Stack.Screen options={{ presentation: 'modal' }} />
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
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
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
          <GhostButton testID="add-crush-close-button" label="Done" onPress={() => router.back()} />
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
  list: { paddingTop: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
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
