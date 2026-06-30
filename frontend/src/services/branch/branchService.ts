/**
 * Branch.io deep linking service.
 *
 * TODO(real-branch): integrate react-native-branch on Expo Dev Build.
 *   - Branch.subscribe(({ params }) => ...) on app start
 *   - Branch.createBranchUniversalObject(...).generateShortUrl(...) for invites
 *
 * We deliberately do NOT use Firebase Dynamic Links (deprecated).
 */
export interface BranchPayload {
  campaign?: string;
  inviterUid?: string;
  $deeplink_path?: string;
}

export const branchService = {
  async init(): Promise<void> {
    // TODO(real-branch)
  },
  async generateInviteLink(inviterUid: string): Promise<string> {
    // TODO(real-branch) — placeholder URL
    return `https://knook.app/invite?u=${encodeURIComponent(inviterUid)}`;
  },
  onLinkOpened(_handler: (payload: BranchPayload) => void): () => void {
    // TODO(real-branch)
    return () => {};
  },
};
