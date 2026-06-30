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

export const contactsService = {
  async loadContacts(): Promise<ContactEntry[]> {
    // TODO(real-device): use loadDeviceContacts() once expo-contacts is wired.
    return MOCK_CONTACTS;
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
      return flat;
    } catch {
      return MOCK_CONTACTS;
    }
  },
};
