import { ChatMessage } from './internal';

export interface YoutubeMessage extends ChatMessage {
  color: string;
  displayName: string;
  message: string;
  badges: string[];
  emotes: Map<string, string>;
  prefixUrl: string | null;
}
