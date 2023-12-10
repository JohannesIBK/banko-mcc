export interface TwitchBadgeResponse {
  data: {
    set_id: string;
    versions: {
      id: string;
      image_url_1x: string;
      image_url_2x: string;
      image_url_4x: string;
      title: string;
      description: string;
      click_action: string | null;
      click_url: string | null;
    }[];
  }[];
}

export interface TwitchUsersResponse {
  data: {
    id: string;
    login: string;
    display_name: string;
    type: string;
    broadcaster_type: string;
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
  }[];
}

export interface SevenTvEmoteResponse {
  emote_set: {
    emotes: {
      data: {
        host: {
          url: string;
          files: {
            format: string;
            height: number;
            width: number;
            name: string;
          }[];
        };
      };
      id: string;
      name: string;
    }[];
  };
}
