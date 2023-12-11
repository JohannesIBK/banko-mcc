import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { TwitchBadge, TwitchMessage } from '../../types/twitch';
import { TwitchApiService } from './twitch-api.service';
import { EmotesService } from './emotes.service';

type TwitchBadgeSet = Map<string, TwitchBadge>;

@Injectable({
  providedIn: 'root',
})
export class TwitchService {
  private channelImages: Map<string, string> = new Map();
  private globalBadges: Map<string, TwitchBadgeSet> = new Map();
  private channelBadges: Map<string, Map<string, TwitchBadgeSet>> = new Map();

  private messages$: Subject<TwitchMessage> = new Subject<TwitchMessage>();
  private ws: WebSocket;

  constructor(
    private readonly twitchApi: TwitchApiService,
    private readonly emoteService: EmotesService,
  ) {
    twitchApi.loadGlobalBadges().then((badges) => {
      this.globalBadges = badges;
    });

    this.ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    this.ws.onopen = async () => {
      this.ws.send(`CAP REQ :twitch.tv/tags twitch.tv/commands`);
      this.ws.send(`PASS oauth:${environment.pass}`);
      this.ws.send('NICK johannesibk');
      this.ws.send('JOIN #caedrel,#agurin,#drututt');
    };

    this.ws.onmessage = (event) => {
      if (event.data.startsWith('PING')) {
        this.ws.send('PONG :tmi.twitch.tv');
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
      }
    }
  }

  private onChannelJoin(channel: string) {
    this.twitchApi.getChannelInfo(channel).then((user) => {
      this.channelImages.set(user.login, user.imageUrl);

      this.twitchApi.loadChannelBadges(user.id).then((badges) => {
        this.channelBadges.set(channel, badges);
      });

      this.emoteService
        .loadChannelEmotes(user.id, channel)
        .then(() => console.log('loaded emotes'));
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
    const userMessage = message.split(`PRIVMSG ${channel} :`)[1].trim();

    const broadcasterLogin = channel.replace('#', '');

    this.messages$.next({
      id: messageId,
      color,
      displayName: username,
      emotes: this.emoteService.getMessageEmotes(userMessage, broadcasterLogin),
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
