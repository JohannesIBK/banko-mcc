import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TwitchWsService } from '../../services/twitch-ws.service';
import { ChannelBadgeListComponent } from '../channel-badge-list/channel-badge-list.component';

@Component({
  selector: 'app-manage-channels',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ChannelBadgeListComponent],
  templateUrl: './manage-channels.component.html',
})
export class ManageChannelsComponent {
  form = new FormGroup({
    channel: new FormControl('', [Validators.required]),
  });

  constructor(private readonly twitchWsService: TwitchWsService) {}

  onFormSubmit(): void {
    this.twitchWsService.joinChannel(this.form.value.channel!);
    this.form.reset();
  }
}
