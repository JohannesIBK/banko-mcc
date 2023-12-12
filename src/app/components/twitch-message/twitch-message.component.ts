import { Component, Input } from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { TwitchMessagePipe } from '../../pipes/twitch-message.pipe';
import { TwitchMessage } from '../../../types/twitch';

@Component({
  selector: 'app-twitch-message',
  standalone: true,
  imports: [DatePipe, TwitchMessagePipe, NgOptimizedImage],
  templateUrl: './twitch-message.component.html',
})
export class TwitchMessageComponent {
  @Input({ required: true }) message!: TwitchMessage;
}
