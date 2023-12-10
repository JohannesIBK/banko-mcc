import { Injectable } from '@angular/core';
import { TwitchEmote } from '../../types/twitch';
import { SevenTvService } from './seven-tv.service';

@Injectable({
  providedIn: 'root',
})
export class EmotesService {
  // Map of all channel 7TV emotes, mapped by channel (Map<channel, Map<emoteIdentifier, emoteId>>)
  private sevenTvChannelEmotes: Map<string, Map<string, string>> = new Map();
  // Map of all 7TV emotes, mapped by emoteId (Map<emoteId, emote>)
  private sevenTvEmotes: Map<string, TwitchEmote> = new Map();

  constructor(private readonly sevenTvService: SevenTvService) {}

  async loadChannelEmotes(channelId: number, channel: string) {
    await this.loadSevenTvEmotes(channelId, channel);
  }

  getMessageEmotes(message: string, channel: string): Map<string, TwitchEmote> {
    const emotes = new Map<string, TwitchEmote>();

    const messageParts = new Set(message.split(' '));

    this.parseSevenTvEmotes(messageParts, channel, emotes);

    return emotes;
  }

  private async loadSevenTvEmotes(channelId: number, channel: string) {
    const emotes = await this.sevenTvService.getEmotes(channelId);

    for (const emote of emotes.values()) {
      this.sevenTvEmotes.set(emote.id, emote);
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
    const channelEmotes = this.sevenTvChannelEmotes.get(channel)!;

    for (const part of message) {
      if (channelEmotes.has(part)) {
        const emoteId = channelEmotes.get(part)!;
        const emote = this.sevenTvEmotes.get(emoteId)!;

        emoteSet.set(part, emote);
      }
    }
  }
}
