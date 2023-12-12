import { Component, Input } from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { TwitchMessagePipe } from '../../pipes/twitch-message.pipe';
import { ChatMessage } from '../../../types/internal';

@Component({
  selector: 'app-system-message',
  standalone: true,
  imports: [DatePipe, NgOptimizedImage, TwitchMessagePipe],
  templateUrl: './system-message.component.html',
})
export class SystemMessageComponent {
  @Input({ required: true }) message!: ChatMessage;
}
