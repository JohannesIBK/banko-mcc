import { Component, Input } from '@angular/core';
import { Channel } from '../../../types/internal';
import { NgOptimizedImage } from '@angular/common';
import { IconsModule } from '../../modules/icons/icons.module';
import { ChannelService } from '../../services/channel.service';

@Component({
  selector: 'app-channel-badge',
  standalone: true,
  imports: [NgOptimizedImage, IconsModule],
  templateUrl: './channel-badge.component.html',
})
export class ChannelBadgeComponent {
  @Input({ required: true }) channel!: Channel;

  constructor(private readonly channelService: ChannelService) {}

  getProviderIconUrl(): string {
    switch (this.channel.source) {
      case 'twitch':
        return '/assets/provider/twitch.svg';
      case 'youtube':
        return '/assets/provider/youtube.svg';
    }
  }

  removeChannel(): void {
    this.channelService.leaveChannel(this.channel);
  }
}
