import { Injectable } from '@angular/core';
import { Channel, ChannelEvent } from '../../types/internal';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private channels = new BehaviorSubject<Channel[]>([]);
  private channelLeave = new Subject<Channel>();
  private channelJoin = new Subject<ChannelEvent>();

  constructor() {
    // Save channels to local storage when they change
    this.channels$.subscribe(() => {
      this.saveChannels();
    });
  }

  onChannelJoin(channel: Channel): void {
    this.channels.next([...this.channels.getValue(), channel]);
  }

  onChannelLeave(channel: string): void {
    this.channels.next(
      this.channels.getValue().filter((c) => c.name !== channel),
    );
  }

  joinChannel(channel: ChannelEvent): void {
    this.channelJoin.next(channel);
  }

  leaveChannel(channel: Channel): void {
    this.channelLeave.next(channel);
  }

  get channels$(): Observable<Channel[]> {
    return this.channels.asObservable();
  }

  get leaveChannel$(): Observable<Channel> {
    return this.channelLeave.asObservable();
  }

  get joinChannel$(): Observable<ChannelEvent> {
    return this.channelJoin.asObservable();
  }

  loadFromStorage(): void {
    const channels: ChannelEvent[] = JSON.parse(
      localStorage.getItem('channels') ?? '[]',
    );

    channels.forEach((channel) => {
      this.joinChannel(channel);
    });
  }

  private saveChannels(): void {
    localStorage.setItem(
      'channels',
      JSON.stringify(
        this.channels
          .getValue()
          .map((c) => ({ name: c.name, source: c.source })),
      ),
    );
  }
}
