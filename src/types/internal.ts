export interface ChatMessage {
  variant: 'youtube' | 'twitch';
}

export interface Channel {
  variant: 'youtube' | 'twitch';
  id: string;
  name: string;
  imageUrl: string;
}
