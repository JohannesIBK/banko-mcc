import { Injectable } from '@angular/core';
import { LRUCache } from 'lru-cache';
import { CachedUser } from '../../types/internal';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  // Cache of all twitch users
  private readonly twitchUsers = new LRUCache<string, CachedUser>({
    maxSize: 1000,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sizeCalculation: (_u, _s) => {
      return 1;
    },
  });
  constructor() {}

  getTwitchUser(id: string): CachedUser | undefined {
    return this.twitchUsers.get(id);
  }

  setTwitchUser(id: string, user: CachedUser): void {
    if (!this.twitchUsers.has(id)) {
      this.twitchUsers.set(id, user);
    }
  }
}
