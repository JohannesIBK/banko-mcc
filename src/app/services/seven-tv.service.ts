import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SevenTvEmoteResponse } from '../../types/response';
import { lastValueFrom } from 'rxjs';
import { TwitchEmote } from '../../types/twitch';

@Injectable({
  providedIn: 'root',
})
export class SevenTvService {
  constructor(private readonly http: HttpClient) {}

  async getEmotes(channelId: number): Promise<Map<string, TwitchEmote>> {
    const observable = this.http.get<SevenTvEmoteResponse>(
      `https://7tv.io/v3/users/twitch/${channelId}`,
    );

    const data = await lastValueFrom(observable);

    const emotes = new Map<string, TwitchEmote>();

    for (const emote of data.emote_set.emotes) {
      const lrg = emote.data.host.files.find(
        (file) => file.name === '4x.webp',
      )!;
      const med = emote.data.host.files.find(
        (file) => file.name === '2x.webp',
      )!;
      const sml = emote.data.host.files.find(
        (file) => file.name === '1x.webp',
      )!;

      emotes.set(emote.name, {
        id: emote.id,
        name: emote.name,
        url: {
          large: {
            url: `https:${emote.data.host.url}/${lrg.name}`,
            height: lrg.height,
            width: lrg.width,
          },
          medium: {
            url: `https:${emote.data.host.url}/${med.name}`,
            height: med.height,
            width: med.width,
          },
          small: {
            url: `https:${emote.data.host.url}/${sml.name}`,
            height: sml.height,
            width: sml.width,
          },
        },
      });
    }

    return emotes;
  }
}
