import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ChannelService } from '../../services/channel.service';
import { Channel } from '../../../types/internal';
import { ChannelBadgeComponent } from '../channel-badge/channel-badge.component';

@Component({
  selector: 'app-channel-badge-list',
  standalone: true,
  imports: [ChannelBadgeComponent],
  templateUrl: './channel-badge-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelBadgeListComponent {
  readonly channels = signal<Channel[]>([]);

  constructor(private readonly channelService: ChannelService) {
    this.channelService.channels$.subscribe((channels) => {
      this.channels.update(() => channels);
    });
  }
}
