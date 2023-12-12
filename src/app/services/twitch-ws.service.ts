import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { TwitchBadge, TwitchMessage } from '../../types/twitch';
import { TwitchApiService } from './twitch-api.service';
import { EmotesService } from './emotes.service';
import { LoggingService } from './logging.service';
import { ChannelService } from './channel.service';

type TwitchBadgeSet = Map<string, TwitchBadge>;

@Injectable({
  providedIn: 'root',
})
export class TwitchWsService {
  private channelImages: Map<string, string> = new Map();
  private globalBadges: Map<string, TwitchBadgeSet> = new Map();
  private channelBadges: Map<string, Map<string, TwitchBadgeSet>> = new Map();

  private messages$: Subject<TwitchMessage> = new Subject<TwitchMessage>();
  private ws: WebSocket;

  constructor(
    private readonly twitchApi: TwitchApiService,
    private readonly emoteService: EmotesService,
    private readonly loggingService: LoggingService,
    private readonly channelService: ChannelService,
  ) {
    channelService.channelLeave$.subscribe((channel) => {
      if (channel.variant !== 'twitch') return;

      this.leaveChannel(channel.name);
    });

    twitchApi.getGlobalBadges().then((badges) => {
      this.globalBadges = badges;
    });
    emoteService.loadGlobalEmotes().then(() => {
      loggingService.debug('loaded global emotes');
    });

    this.ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    this.ws.onopen = async () => {
      this.ws.send(`CAP REQ :twitch.tv/tags twitch.tv/commands`);
      this.ws.send(`PASS oauth:${environment.pass}`);
      this.ws.send('NICK johannesibk');

      this.joinChannel('bastighg');
      this.joinChannel('papaplatte');
    };

    this.ws.onmessage = (event) => {
      if (event.data.startsWith('PING')) {
        this.ws.send('PONG :tmi.twitch.tv');

        loggingService.debug('Received ping');

        return;
      }

      for (const line of event.data.split('\r\n')) {
        if (line.trim() === '') {
          return;
        }

        this.parseMassage(line);
      }
    };
  }

  joinChannel(channel: string) {
    if (this.ws.CONNECTING) {
      setTimeout(() => this.joinChannel(channel), 100);
    } else if (this.ws.OPEN) {
      this.ws.send(`JOIN #${channel.toLowerCase()}`);
    }
  }

  leaveChannel(channel: string) {
    if (this.ws.CONNECTING) {
      setTimeout(() => this.leaveChannel(channel), 100);
    } else if (this.ws.OPEN) {
      this.ws.send(`PART #${channel.toLowerCase()}`);
      this.channelService.onChannelLeave(channel);
    }
  }

  private parseMassage(message: string) {
    if (message.startsWith('@')) {
      const messageType = message.split(' ')[2];
      const channel = message.split(' ')[3];

      if (messageType === 'PRIVMSG') {
        this.parseChatMessage(message, channel);
      }
    }
    if (message.startsWith(':')) {
      const messageType = message.split(' ')[1];
      const channel = message.split(' ')[2].replace('#', '');

      if (messageType === 'JOIN') {
        this.onChannelJoin(channel);
      } else if (messageType === 'PART') {
        this.channelService.onChannelLeave(channel);
      }
    }
  }

  private onChannelJoin(channel: string) {
    this.twitchApi.getChannelInfo(channel).then((user) => {
      // Load channel image for prefix
      this.channelImages.set(user.login, user.imageUrl);
      this.channelService.onChannelJoin({
        id: user.id.toString(),
        name: user.displayName,
        variant: 'twitch',
        imageUrl: user.imageUrl,
      });

      // Load channel badges
      this.twitchApi.getChannelBadges(user.id).then((badges) => {
        this.channelBadges.set(channel, badges);
      });

      // Load channel emotes
      this.emoteService
        .loadChannelEmotes(user.id, channel)
        .then(() => this.loggingService.debug(`loaded ${channel} emotes`));
    });
  }

  private parseChatMessage(message: string, channel: string) {
    const tags = message.split(';');
    const messageId = tags.find((tag) => tag.startsWith('id='))!.split('=')[1];
    const username = tags
      .find((tag) => tag.startsWith('display-name='))!
      .split('=')[1];
    const color = tags.find((tag) => tag.startsWith('color='))!.split('=')[1];
    const userId = Number.parseInt(
      tags.find((tag) => tag.startsWith('user-id='))!.split('=')[1],
    );
    const roomId = Number.parseInt(
      tags.find((tag) => tag.startsWith('room-id='))!.split('=')[1],
    );
    const messageSent = Number.parseInt(
      tags.find((tag) => tag.startsWith('tmi-sent-ts='))!.split('=')[1],
    );
    const badgesId = tags
      .find((tag) => tag.startsWith('badges='))!
      .split('=')[1]
      .split(',');
    let emotes = tags
      .find((tag) => tag.startsWith('emotes='))!
      .split('=')[1]
      .split('/');
    const userMessage = message.split(`PRIVMSG ${channel} :`)[1].trim();

    const broadcasterLogin = channel.replace('#', '');

    if (emotes.at(0) === '') {
      emotes = [];
    }

    this.messages$.next({
      id: messageId,
      color,
      variant: 'twitch',
      displayName: username,
      emotes: this.emoteService.getMessageEmotes(
        userMessage,
        broadcasterLogin,
        emotes,
      ),
      userId: userId,
      roomId: roomId,
      createdAt: new Date(messageSent),
      message: userMessage,
      badges: this.getBadges(badgesId, channel),
      prefixUrl: this.channelImages.get(broadcasterLogin) ?? null,
    });
  }

  private getBadges(badgeIds: string[], channel: string) {
    const badges: TwitchBadge[] = [];

    for (const badgeId of badgeIds) {
      const badgeName = badgeId.split('/')[0];
      const badgeVersion = badgeId.split('/')[1];

      const channelBadges = this.channelBadges.get(channel.replace('#', ''));
      if (channelBadges) {
        const channelBadge = channelBadges.get(badgeName);
        if (channelBadge) {
          const badge = channelBadge.get(badgeVersion);

          if (badge) {
            badges.push(badge);
            continue;
          }
        }
      }

      const globalBadge = this.globalBadges.get(badgeName);
      if (globalBadge) {
        const badge = globalBadge.get(badgeVersion);

        if (badge) {
          badges.push(badge);
        }
      }
    }

    return badges;
  }

  get messages() {
    return this.messages$.asObservable();
  }
}