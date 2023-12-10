import { Component, signal } from '@angular/core';
import { TwitchService } from '../../services/twitch.service';
import { TwitchMessage } from '../../../types/twitch';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { EmotesPipe } from '../../pipes/emotes.pipe';

@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [DatePipe, NgOptimizedImage, EmotesPipe],
  templateUrl: './chatbox.component.html',
  styleUrl: './chatbox.component.css',
})
export class ChatboxComponent {
  messages = signal<TwitchMessage[]>([]);

  constructor(private readonly twitchService: TwitchService) {
    this.twitchService.messages.subscribe((message) => {
      // Der Observer wird subscribed, und man bekommt dann die Nachrichten nacheinander.
      this.messages.update((m) => [...m, message].slice(-30));
    });
  }

  protected readonly indexedDB = indexedDB;
}
