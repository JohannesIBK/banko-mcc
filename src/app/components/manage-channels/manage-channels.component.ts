import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ChannelBadgeListComponent } from '../channel-badge-list/channel-badge-list.component';
import { ChannelService } from '../../services/channel.service';

@Component({
  selector: 'app-manage-channels',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ChannelBadgeListComponent],
  templateUrl: './manage-channels.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageChannelsComponent implements OnInit {
  form = new FormGroup({
    channel: new FormControl('', [Validators.required]),
  });

  constructor(private readonly channelService: ChannelService) {}

  ngOnInit() {
    this.channelService.loadFromStorage();
  }

  onFormSubmit(): void {
    this.channelService.joinChannel({
      identifier: this.form.value.channel!,
      source: 'twitch',
    });
    this.form.reset();
  }
}
