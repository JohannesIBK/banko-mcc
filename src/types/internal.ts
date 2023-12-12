export interface ChatMessage {
  id: string;
  origin: 'youtube' | 'twitch' | 'system';
  deleted?: boolean;
  displayName: string;
  createdAt: Date;
  message: string;
  userId: string;
  roomId: string;
}

export interface Channel {
  variant: 'youtube' | 'twitch';
  id: string;
  name: string;
  imageUrl: string;
}

export interface MessageDelete {
  messageId?: string;
  userId?: string;
  roomId?: string;
}
