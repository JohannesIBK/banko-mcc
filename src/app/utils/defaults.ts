import { ChatMessage } from '../../types/internal';

export const SYSTEM_MESSAGE = {
  roomId: 'system',
  userId: 'system',
  origin: 'system',
  createdAt: new Date(),
  displayName: '',
} as ChatMessage;
