import { ChatMessage } from '../../types/internal';
import { TwitchMessage } from '../../types/twitch';

export function isTwitchMessage(
  message: ChatMessage,
): message is TwitchMessage {
  return message.origin === 'twitch';
}
