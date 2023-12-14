import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  signal,
} from '@angular/core';
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
import { TwitchWsService } from '../../services/twitch-ws.service';
import { LoggingService } from '../../services/logging.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatboxComponent implements OnInit, AfterViewChecked {
  readonly messages = signal<ChatMessage[]>([]);

  private element: HTMLElement | null = null;
  private scrolled = true;
  private pressingAlt = false;
  private wasScrolling?: boolean = false;

  constructor(
    private readonly chatService: ChatService,
    private readonly loggingService: LoggingService,
    private readonly _: TwitchWsService,
  ) {
    this.chatService.messages$.subscribe((message) => {
      // Der Observer wird subscribed, und man bekommt dann die Nachrichten nacheinander.
      this.messages.update((m) => [...m, message].slice(-500));
      this.scrolled = false;
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
    if (!this.scrolled) {
      this.scrollToBottom();
      this.scrolled = true;
    }
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(ev: KeyboardEvent) {
    if (ev.key === 'Alt') {
      this.pressingAlt = false;

      if (this.wasScrolling) {
        this.scrollToBottom();
      }

      this.wasScrolling = undefined;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent) {
    if (ev.key === 'Alt') {
      this.pressingAlt = true;

      this.wasScrolling ??= this.shouldScroll();
    }
  }

  scrollToBottom(): void {
    // if pressing alt, don't scroll
    if (this.pressingAlt) {
      this.loggingService.debug('Not scrolling because pressing alt');
      return;
    }

    if (!this.shouldScroll()) {
      this.loggingService.debug('Not scrolling because shouldScroll is false');
      return;
    }

    // shouldScroll() also checks if element is not null, so it can be forced to be non-null here
    this.element!.scrollTop = this.element!.scrollHeight + 100;
  }

  shouldScroll(): boolean {
    if (!this.element) {
      return false;
    }

    return this.element.scrollHeight - this.element.scrollTop < 1000;
  }

  isTwitchMessage(message: ChatMessage): message is TwitchMessage {
    return message.source === 'twitch';
  }

  isYoutubeMessage(message: ChatMessage): message is YoutubeMessage {
    return message.source === 'youtube';
  }
}
