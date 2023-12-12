import { Injectable } from '@angular/core';
import { Channel } from '../../types/internal';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private channels = new BehaviorSubject<Channel[]>([]);
  private channelLeave = new Subject<Channel>();
  private channelJoin = new Subject<Channel>();
  constructor() {}

  onChannelJoin(channel: Channel): void {
    this.channels.next([...this.channels.getValue(), channel]);
  }

  onChannelLeave(channel: string): void {
    this.channels.next(
      this.channels.getValue().filter((c) => c.name !== channel),
    );
  }

  get channels$(): Observable<Channel[]> {
    return this.channels.asObservable();
  }

  get channelLeave$(): Observable<Channel> {
    return this.channelLeave.asObservable();
  }

  get channelJoin$(): Observable<Channel> {
    return this.channelJoin.asObservable();
  }
}
