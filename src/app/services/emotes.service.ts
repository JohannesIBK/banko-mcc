import { Injectable } from '@angular/core';
import { TwitchEmote } from '../../types/twitch';
import { SevenTvService } from './seven-tv.service';
import { TwitchApiService } from './twitch-api.service';

@Injectable({
  providedIn: 'root',
})
export class EmotesService {
  // Map of all channel emotes, mapped by channel (Map<channel, Map<emoteIdentifier, emoteId>>)
  private sevenTvChannelEmotes: Map<string, Map<string, string>> = new Map();
  // Map of all emotes, mapped by emoteId (Map<emoteId, emote>)
  private emotes: Map<string, TwitchEmote> = new Map();

  constructor(
    private readonly sevenTvService: SevenTvService,
    private readonly twitchApiService: TwitchApiService,
  ) {}

  async loadGlobalEmotes() {
    const emotes = await this.twitchApiService.getGlobalEmotes();

    for (const emote of emotes.values()) {
      this.emotes.set(emote.id, emote);
    }
  }

  async loadChannelEmotes(channelId: number, channel: string) {
    await this.loadSevenTvEmotes(channelId, channel);
    this.twitchApiService.getChannelEmotes(channelId).then((emotes) => {
      for (const emote of emotes) {
        this.emotes.set(emote.id, emote);
      }
    });
  }

  getMessageEmotes(
    message: string,
    channel: string,
    emoteIds: string[],
  ): Map<string, TwitchEmote> {
    const emotes = new Map<string, TwitchEmote>();

    const messageParts = new Set(message.split(' '));

    this.parseSevenTvEmotes(messageParts, channel, emotes);
    this.parseTwitchEmotes(message, emoteIds, emotes);

    return emotes;
  }

  private async loadSevenTvEmotes(channelId: number, channel: string) {
    const emotes = await this.sevenTvService.getEmotes(channelId);

    for (const emote of emotes.values()) {
      this.emotes.set(emote.id, emote);
    }

    const identifierMap = new Map();
    for (const [identifier, emote] of emotes) {
      identifierMap.set(identifier, emote.id);
    }

    this.sevenTvChannelEmotes.set(channel, identifierMap);
  }

  private parseSevenTvEmotes(
    message: Set<string>,
    channel: string,
    emoteSet: Map<string, TwitchEmote>,
  ) {
    const channelEmotes = this.sevenTvChannelEmotes.get(channel);
    if (!channelEmotes) {
      return;
    }

    for (const part of message) {
      if (channelEmotes.has(part)) {
        const emoteId = channelEmotes.get(part)!;
        const emote = this.emotes.get(emoteId)!;

        emoteSet.set(part, emote);
      }
    }
  }

  private parseTwitchEmotes(
    message: string,
    emoteIds: string[],
    emoteSet: Map<string, TwitchEmote>,
  ) {
    console.log(emoteIds);

    for (const emoteIdentifier of emoteIds) {
      const emoteId = emoteIdentifier.split(':')[0];

      if (this.emotes.has(emoteId)) {
        const emote = this.emotes.get(emoteId)!;

        emoteSet.set(emote.name, emote);
      } else {
        const emote = this.parseEmoteFromMessage(message, emoteIdentifier);

        this.emotes.set(emote.id, emote);
        emoteSet.set(emote.name, emote);
      }
    }
  }

  private parseEmoteFromMessage(message: string, emoteId: string): TwitchEmote {
    const [id, position] = emoteId.split(':');
    const positionArr = position.split(',')[0].split('-');

    const start = Number.parseInt(positionArr[0]);
    const end = Number.parseInt(positionArr[1]);

    const name = message.substring(start, end + 1);

    return {
      id,
      name,
      url: {
        small: {
          url: `https://static-cdn.jtvnw.net/emoticons/v1/${id}/1.0`,
          height: 28,
          width: 28,
        },
        medium: {
          url: `https://static-cdn.jtvnw.net/emoticons/v1/${id}/2.0`,
          height: 56,
          width: 56,
        },
        large: {
          url: `https://static-cdn.jtvnw.net/emoticons/v1/${id}/3.0`,
          height: 112,
          width: 112,
        },
      },
    };
  }
}
