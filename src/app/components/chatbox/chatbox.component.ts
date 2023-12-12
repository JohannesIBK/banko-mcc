import { AfterViewChecked, Component, OnInit, signal } from '@angular/core';
import { TwitchWsService } from '../../services/twitch-ws.service';
import { TwitchMessage } from '../../../types/twitch';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { TwitchMessagePipe } from '../../pipes/twitch-message.pipe';
import { TwitchMessageComponent } from '../twitch-message/twitch-message.component';
import { ChannelBadgeListComponent } from '../channel-badge-list/channel-badge-list.component';
import { ManageChannelsComponent } from '../manage-channels/manage-channels.component';

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
  ],
  templateUrl: './chatbox.component.html',
})
export class ChatboxComponent implements OnInit, AfterViewChecked {
  element: HTMLElement | null = null;
  readonly messages = signal<TwitchMessage[]>([]);
  readonly scrolled = signal(true);

  constructor(private readonly twitchService: TwitchWsService) {
    this.twitchService.messages.subscribe((message) => {
      // Der Observer wird subscribed, und man bekommt dann die Nachrichten nacheinander.
      this.messages.update((m) => [...m, message].slice(-30));
      this.scrolled.set(false);
    });
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
}
