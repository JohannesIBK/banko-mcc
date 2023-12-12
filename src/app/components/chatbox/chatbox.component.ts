import { AfterViewChecked, Component, OnInit, signal } from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { TwitchMessagePipe } from '../../pipes/twitch-message.pipe';
import { TwitchMessageComponent } from '../twitch-message/twitch-message.component';
import { ChannelBadgeListComponent } from '../channel-badge-list/channel-badge-list.component';
import { ManageChannelsComponent } from '../manage-channels/manage-channels.component';
import { ChatService } from '../../services/chat.service';
import { ChatMessage } from '../../../types/internal';
import { TwitchMessage } from '../../../types/twitch';
import { YoutubeMessage } from '../../../types/youtube';
import { SystemMessageComponent } from '../system-message/system-message.component';

@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [
    DatePipe,
    NgOptimizedImage,
    TwitchMessagePipe,
    TwitchMessageComponent,
    ChannelBadgeListComponent,
    ManageChannelsComponent,
    SystemMessageComponent,
  ],
  templateUrl: './chatbox.component.html',
})
export class ChatboxComponent implements OnInit, AfterViewChecked {
  element: HTMLElement | null = null;
  readonly messages = signal<ChatMessage[]>([]);
  readonly scrolled = signal(true);

  constructor(private readonly chatService: ChatService) {
    this.chatService.messages$.subscribe((message) => {
      // Der Observer wird subscribed, und man bekommt dann die Nachrichten nacheinander.
      this.messages.update((m) => [...m, message].slice(-30));
      this.scrolled.set(false);
    });

    this.chatService.messageDelete$.subscribe(
      ({ messageId, userId, roomId }) => {
        this.messages.update((m) => {
          if (messageId) {
            return m.map((message) => {
              if (message.id === messageId) {
                return { ...message, deleted: true };
              } else {
                return message;
              }
            });
          } else if (userId && roomId) {
            return m.map((message) => {
              if (message.userId === userId && message.roomId === roomId) {
                return { ...message, deleted: true };
              } else {
                return message;
              }
            });
          } else {
            return m;
          }
        });
      },
    );
  }

  ngOnInit() {
    this.element = document.getElementById('message-container')!;
  }

  ngAfterViewChecked() {
    if (!this.scrolled()) {
      this.scrollToBottom();
      this.scrolled.set(true);
    }
  }

  scrollToBottom(): void {
    if (!this.element) {
      console.warn('No element found');
      return;
    }

    // if not close to bottom, don't scroll
    if (this.element.scrollHeight - this.element.scrollTop > 1000) {
      return;
    }

    this.element.scrollTop = this.element.scrollHeight + 100;
  }

  isTwitchMessage(message: ChatMessage): message is TwitchMessage {
    return message.origin === 'twitch';
  }

  isYoutubeMessage(message: ChatMessage): message is YoutubeMessage {
    return message.origin === 'youtube';
  }
}
