import { Component, OnInit, signal } from '@angular/core';
import { TwitchService } from '../../services/twitch.service';
import { TwitchMessage } from '../../../types/twitch';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { EmotesPipe } from '../../pipes/emotes.pipe';

@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [DatePipe, NgOptimizedImage, EmotesPipe],
  templateUrl: './chatbox.component.html',
})
export class ChatboxComponent implements OnInit {
  element: HTMLElement | null = null;
  messages = signal<TwitchMessage[]>([]);

  constructor(private readonly twitchService: TwitchService) {
    this.twitchService.messages.subscribe((message) => {
      // Der Observer wird subscribed, und man bekommt dann die Nachrichten nacheinander.
      this.messages.update((m) => [...m, message].slice(-30));
      this.scrollToBottom();
    });
  }

  ngOnInit() {
    this.element = document.getElementById('message-container')!;
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
