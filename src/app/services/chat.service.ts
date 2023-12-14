import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ChatMessage, MessageDelete } from '../../types/internal';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly messages = new Subject<ChatMessage>();
  private readonly messageDelete = new Subject<MessageDelete>();

  constructor() {}

  addMessage<T extends ChatMessage>(message: T): void {
    this.messages.next(message);
  }

  deleteMessage(event: MessageDelete): void {
    this.messageDelete.next(event);
  }

  get messages$(): Observable<ChatMessage> {
    return this.messages.asObservable();
  }

  get messageDelete$(): Observable<MessageDelete> {
    return this.messageDelete.asObservable();
  }
}
