import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { TwitchBadge } from '../../types/twitch';
import { TwitchApiService } from './twitch-api.service';
import { EmotesService } from './emotes.service';
import { LoggingService } from './logging.service';
import { ChannelService } from './channel.service';
import { ChatService } from './chat.service';
import { SYSTEM_MESSAGE } from '../utils/defaults';
import { UsersService } from './users.service';

type TwitchBadgeSet = Map<string, TwitchBadge>;

@Injectable({
  providedIn: 'root',
})
export class TwitchWsService {
  private channelImages: Map<string, string> = new Map();
  private globalBadges: Map<string, TwitchBadgeSet> = new Map();
  private channelBadges: Map<string, Map<string, TwitchBadgeSet>> = new Map();

  private ws!: WebSocket;

  constructor(
    private readonly twitchApi: TwitchApiService,
    private readonly emoteService: EmotesService,
    private readonly loggingService: LoggingService,
    private readonly channelService: ChannelService,
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {
    // Listen for join commands
    channelService.joinChannel$.subscribe((channel) => {
      if (channel.source !== 'twitch') return;

      this.joinChannel(channel.identifier);
    });

    // Listen for leave commands
    channelService.leaveChannel$.subscribe((channel) => {
      if (channel.name !== 'twitch') return;

      this.leaveChannel(channel.name);
    });

    twitchApi.getGlobalBadges().then((badges) => {
      this.globalBadges = badges;
    });
    emoteService.loadGlobalEmotes().then(() => {
      loggingService.debug('loaded global emotes');
    });

    this.setupWebsocket();
  }

  setupWebsocket() {
    this.ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    this.ws.onopen = async () => {
      this.ws.send(`CAP REQ :twitch.tv/tags twitch.tv/commands`);
      this.ws.send(`PASS oauth:${environment.pass}`);
      this.ws.send('NICK johannesibk');
    };

    this.ws.onmessage = (event) => {
      if (event.data.startsWith('PING')) {
        this.ws.send('PONG :tmi.twitch.tv');

        this.loggingService.debug('Received ping');

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

  private joinChannel(channel: string) {
    if (this.ws.readyState === this.ws.CONNECTING) {
      setTimeout(() => this.joinChannel(channel), 100);
    } else if (this.ws.readyState === this.ws.OPEN) {
      this.ws.send(`JOIN #${channel.toLowerCase()}`);
    }
  }

  private leaveChannel(channel: string) {
    if (this.ws.CONNECTING) {
      setTimeout(() => this.leaveChannel(channel), 100);
    } else if (this.ws.OPEN) {
      this.ws.send(`PART #${channel.toLowerCase()}`);
      this.channelService.onChannelLeave(channel);
    }
  }

  private parseMassage(message: string) {
    if (message.startsWith('@')) {
      message = message.replace('@', '');
      const messageType = message.split(' ')[2];

      if (messageType === 'PRIVMSG') {
        const channel = message.split(' ')[3];

        this.parseChatMessage(message, channel);
      } else if (messageType === 'CLEARMSG') {
        this.parseDeleteMessage(message);
      } else if (messageType === 'CLEARCHAT') {
        this.parseClearChat(message);
      }
    }
    if (message.startsWith(':')) {
      const messageType = message.split(' ')[1];
      const channel = message.split(' ')[2].replace('#', '');

      if (messageType === 'JOIN') {
        this.onChannelJoin(channel);
        this.chatService.addMessage({
          ...SYSTEM_MESSAGE,
          id: new Date().getTime().toString(),
          message: `Joined channel ${channel}`,
          createdAt: new Date(),
        });
      } else if (messageType === 'PART') {
        this.channelService.onChannelLeave(channel);
        this.chatService.addMessage({
          ...SYSTEM_MESSAGE,
          id: new Date().getTime().toString(),
          message: `Left Channel ${channel}`,
          createdAt: new Date(),
        });
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
        source: 'twitch',
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
    const userId = tags
      .find((tag) => tag.startsWith('user-id='))!
      .split('=')[1];
    const roomId = tags
      .find((tag) => tag.startsWith('room-id='))!
      .split('=')[1];
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

    this.usersService.setTwitchUser(userId, { channel, name: username });

    this.chatService.addMessage({
      id: messageId,
      color,
      source: 'twitch',
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

  private parseDeleteMessage(message: string) {
    const tags = message.split(';');
    const messageId = tags
      .find((tag) => tag.startsWith('target-msg-id='))!
      .split('=')[1];

    const timestamp = Number.parseInt(
      tags.find((tag) => tag.startsWith('tmi-sent-ts='))!.split('=')[1],
    );

    const username = tags
      .find((tag) => tag.startsWith('login='))!
      .split('=')[1];

    this.chatService.deleteMessage({
      messageId,
    });

    this.chatService.addMessage({
      ...SYSTEM_MESSAGE,
      id: new Date(timestamp).getTime().toString(),
      createdAt: new Date(timestamp),
      message: `A message from ${username} has been deleted`,
    });
  }

  private parseClearChat(message: string) {
    const broadcasterLogin = message.split(' ')[3].replace('#', '');

    const tags = message.split(';');
    const roomId = tags
      .find((tag) => tag.startsWith('room-id='))!
      .split('=')[1];

    const timestamp = Number.parseInt(
      tags.find((tag) => tag.startsWith('tmi-sent-ts='))!.split('=')[1],
    );

    const userId = tags
      .find((tag) => tag.startsWith('target-user-id='))!
      .split('=')[1];

    const duration = tags
      .find((tag) => tag.startsWith('ban-duration='))
      ?.split('=')
      .at(1);

    this.chatService.deleteMessage({
      roomId,
      userId,
    });

    const user = this.usersService.getTwitchUser(userId);

    const username = user ? user.name : 'A user';

    this.chatService.addMessage({
      ...SYSTEM_MESSAGE,
      id: new Date(timestamp).getTime().toString(),
      createdAt: new Date(timestamp),
      prefixUrl: this.channelImages.get(broadcasterLogin) ?? null,
      message: duration
        ? `${username} has been timed out for ${duration} seconds`
        : `${username} has been banned`,
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
}
