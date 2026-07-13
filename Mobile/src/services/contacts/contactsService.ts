import { diagnostics } from '@/src/utils/diagnostics';
import { appEnvironment } from '@/src/utils/environment';

/**
 * Contacts service.
 *
 * Production: uses expo-contacts with permission gating. Phone numbers are
 * normalized + SHA-256 hashed on the client BEFORE leaving the device — we
 * NEVER upload raw contact data.
 *
 * Preview: returns a fixed mock list so the Add Crush flow can be demoed
 * without device-level contact access.
 *
 * NOTE: real expo-contacts is imported lazily inside loadDeviceContacts so the
 * package isn't required at install time for preview.
 */
export interface ContactEntry {
  id: string;
  name: string;
  phone: string;
}

const MOCK_CONTACTS: ContactEntry[] = [
  { id: 'demo-us-0', name: 'Alex Demo', phone: '+12025550100' },
  { id: 'demo-us-1', name: 'Jordan Demo', phone: '+12025550101' },
  { id: 'demo-us-2', name: 'Demo Contact Two', phone: '+15555550102' },
  { id: 'demo-us-3', name: 'Demo Contact Three', phone: '+15555550103' },
  { id: 'c1', name: 'Aarav Mehta', phone: '+919812345601' },
  { id: 'c2', name: 'Priya Sharma', phone: '+919812345602' },
  { id: 'c3', name: 'Rohan Iyer', phone: '+919812345603' },
  { id: 'c4', name: 'Sara Khan', phone: '+919812345604' },
  { id: 'c5', name: 'Aditya Reddy', phone: '+919812345605' },
  { id: 'c6', name: 'Ishaan Patel', phone: '+919812345606' },
  { id: 'c7', name: 'Meera Nair', phone: '+919812345607' },
  { id: 'c8', name: 'Kabir Joshi', phone: '+919812345608' },
  { id: 'c9', name: 'Tara Bose', phone: '+919812345609' },
  { id: 'c10', name: 'Neel Kapoor', phone: '+919812345610' },
];

export function sanitizeContactsForPreview(input: unknown): ContactEntry[] {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();
  return input.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const raw = item as Partial<ContactEntry>;
    const phone = typeof raw.phone === 'string' ? raw.phone.trim() : '';
    if (!phone) return [];
    const fallbackId = `contact-${index}-${phone.replace(/\D/g, '').slice(-8)}`;
    const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fallbackId;
    if (seen.has(id)) return [];
    seen.add(id);
    const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Unknown';
    return [{ id, name, phone }];
  });
}

export const contactsService = {
  async loadContacts(): Promise<ContactEntry[]> {
    if (appEnvironment.canUsePreviewTools) {
      const contacts = sanitizeContactsForPreview(MOCK_CONTACTS);
      diagnostics.log('contacts-preview-loaded', { count: contacts.length });
      return contacts;
    }
    return this.loadDeviceContacts();
  },

  /**
   * Real implementation — kept here so it's easy to flip when running on a
   * Dev Build. Requires `expo install expo-contacts`.
   */
  async loadDeviceContacts(): Promise<ContactEntry[]> {
    try {
      // @ts-expect-error optional dep — only available in Dev Build
      // eslint-disable-next-line import/no-unresolved
      const Contacts = await import('expo-contacts');
      const { status } = await Contacts.requestPermissionsAsync();
      diagnostics.log('contacts-permission-result', { status });
      if (status !== 'granted') return [];
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      const flat: ContactEntry[] = [];
      data.forEach((c: { id?: string; name?: string; phoneNumbers?: { number?: string }[] }) => {
        c.phoneNumbers?.forEach((p, idx) => {
          if (p.number) flat.push({ id: `${c.id ?? ''}-${idx}`, name: c.name ?? 'Unknown', phone: p.number });
        });
      });
      const contacts = sanitizeContactsForPreview(flat);
      diagnostics.log('contacts-device-loaded', { count: contacts.length });
      return contacts;
    } catch (error) {
      diagnostics.error('contacts-device-load-failed', error);
      if (appEnvironment.canUsePreviewTools) {
        const contacts = sanitizeContactsForPreview(MOCK_CONTACTS);
        diagnostics.log('contacts-preview-fallback-loaded', { count: contacts.length });
        return contacts;
      }
      return [];
    }
  },
};
