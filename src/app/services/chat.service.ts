import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ChatMessage } from '../../types/internal';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private messages = new Subject<ChatMessage>();

  constructor() {}

  get messages$(): Observable<ChatMessage> {
    return this.messages.asObservable();
  }
}
