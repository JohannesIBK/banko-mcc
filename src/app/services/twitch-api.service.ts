import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TwitchBadgeResponse, TwitchUsersResponse } from '../../types/response';
import { environment } from '../../environments/environment';
import { lastValueFrom } from 'rxjs';
import { TwitchBadge } from '../../types/twitch';

@Injectable({
  providedIn: 'root',
})
export class TwitchApiService {
  constructor(private readonly http: HttpClient) {}

  async getChannelId(channel: string): Promise<number> {
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

    return Number.parseInt(data.data![0].id);
  }

  async loadChannelBadges(channelId: number) {
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

  async loadGlobalBadges() {
    const obserable = this.http.get<TwitchBadgeResponse>(
      `https://api.twitch.tv/helix/chat/badges/global`,
      {
        headers: {
          Authorization: `Bearer ${environment.pass}`,
          'Client-Id': environment.clientId,
        },
      },
    );

    const data = await lastValueFrom(obserable);

    return this.responseToMap(data);
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
