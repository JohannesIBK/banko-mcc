export interface ChatMessage {
  id: string;
  source: 'youtube' | 'twitch' | 'system';
  deleted?: boolean;
  displayName: string;
  createdAt: Date;
  message: string;
  userId: string;
  roomId: string;
  prefixUrl?: string | null;
}

export interface Channel {
  source: 'youtube' | 'twitch';
  id: string;
  name: string;
  imageUrl: string;
}

export interface MessageDelete {
  messageId?: string;
  userId?: string;
  roomId?: string;
}

export interface CachedUser {
  name: string;
  channel: string;
}

export interface ChannelEvent {
  identifier: string;
  source: 'twitch' | 'youtube';
}
