import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  TwitchBadgeResponse,
  TwitchEmoteResponse,
  TwitchUsersResponse,
} from '../../types/response';
import { environment } from '../../environments/environment';
import { lastValueFrom } from 'rxjs';
import { TwitchBadge, TwitchEmote, TwitchUser } from '../../types/twitch';

@Injectable({
  providedIn: 'root',
})
export class TwitchApiService {
  constructor(private readonly http: HttpClient) {}

  async getChannelInfo(channel: string): Promise<TwitchUser> {
    const obs = this.http.get<TwitchUsersResponse>(
      `https://api.twitch.tv/helix/users?login=${channel}`,
      {
        headers: {
          Authorization: `Bearer ${environment.pass}`,
          'Client-Id': environment.clientId,
        },
      },
    );

    const data = await lastValueFrom(obs);

    const user = data.data![0];

    return {
      id: Number.parseInt(user.id),
      displayName: user.display_name,
      imageUrl: user.profile_image_url,
      login: user.login,
    };
  }

  async getChannelBadges(channelId: number) {
    const observable = this.http.get<TwitchBadgeResponse>(
      `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${channelId}`,
      {
        headers: {
          Authorization: `Bearer ${environment.pass}`,
          'Client-Id': environment.clientId,
        },
      },
    );

    const data = await lastValueFrom(observable);

    return this.responseToMap(data);
  }

  async getGlobalBadges() {
    const observable = this.http.get<TwitchBadgeResponse>(
      `https://api.twitch.tv/helix/chat/badges/global`,
      {
        headers: {
          Authorization: `Bearer ${environment.pass}`,
          'Client-Id': environment.clientId,
        },
      },
    );

    const data = await lastValueFrom(observable);

    return this.responseToMap(data);
  }

  async getGlobalEmotes(): Promise<Map<string, TwitchEmote>> {
    const observable = this.http.get<TwitchEmoteResponse>(
      `https://api.twitch.tv/helix/chat/emotes/global`,
      {
        headers: {
          Authorization: `Bearer ${environment.pass}`,
          'Client-Id': environment.clientId,
        },
      },
    );

    const data = await lastValueFrom(observable);

    const emotes = new Map<string, TwitchEmote>();

    for (const emote of data.data) {
      emotes.set(emote.name, {
        id: emote.id,
        name: emote.name,
        url: {
          large: {
            url: emote.images.url_4x,
            height: 112,
            width: 112,
          },
          medium: {
            url: emote.images.url_2x,
            height: 56,
            width: 56,
          },
          small: {
            url: emote.images.url_1x,
            height: 28,
            width: 28,
          },
        },
      });
    }

    return emotes;
  }

  async getChannelEmotes(channelId: number): Promise<TwitchEmote[]> {
    const observable = this.http.get<TwitchEmoteResponse>(
      `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${channelId}`,
      {
        headers: {
          Authorization: `Bearer ${environment.pass}`,
          'Client-Id': environment.clientId,
        },
      },
    );

    const data = await lastValueFrom(observable);

    return data.data.map((emote) => ({
      id: emote.id,
      name: emote.name,
      url: {
        large: {
          url: emote.images.url_4x,
          height: 112,
          width: 112,
        },
        medium: {
          url: emote.images.url_2x,
          height: 56,
          width: 56,
        },
        small: {
          url: emote.images.url_1x,
          height: 28,
          width: 28,
        },
      },
    }));
  }

  private responseToMap(response: TwitchBadgeResponse) {
    const badges = new Map<string, Map<string, TwitchBadge>>();

    for (const badge of response.data) {
      const versionSet = new Map<string, TwitchBadge>();

      for (const version of badge.versions) {
        versionSet.set(version.id, {
          id: `${badge.set_id}/${version.id}`,
          title: version.title,
          description: version.description,
          click_url: version.click_url,
          url: {
            large: version.image_url_4x,
            medium: version.image_url_2x,
            small: version.image_url_1x,
          },
        });
      }

      badges.set(badge.set_id, versionSet);
    }

    return badges;
  }
}
