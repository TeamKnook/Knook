export interface Message {
  messageId: string;
  matchId: string;
  senderId: string;
  type: 'text';
  text: string;
  sentAt: string;
  readBy: string[];
  creditsCharged?: number;
  deletedAt?: string | null;
}
