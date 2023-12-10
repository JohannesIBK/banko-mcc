export interface TwitchMessage {
  id: string;
  color: string;
  displayName: string;
  userId: number;
  roomId: number;
  createdAt: Date;
  message: string;
  badges: TwitchBadge[];
  emotes: Map<string, TwitchEmote>;
}

export interface TwitchBadge {
  id: string;
  title: string;
  description: string;
  click_url: string | null;
  url: {
    large: string;
    medium: string;
    small: string;
  };
}

export interface TwitchEmote {
  id: string;
  name: string;
  url: {
    large: {
      url: string;
      width: number;
      height: number;
    };
    medium: {
      url: string;
      width: number;
      height: number;
    };
    small: {
      url: string;
      width: number;
      height: number;
    };
  };
}
