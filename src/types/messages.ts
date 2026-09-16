export interface QueueItem {
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  durationText?: string;
  url: string;
  isCurrent?: boolean;
}

export interface YouTubeTabInfo {
  tabId: number;
  title: string;
  url: string;
  isPlaying: boolean;
  isTarget: boolean;
  videoTitle?: string;
}

export interface QualityOption {
  quality: string; // e.g. 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto'
  label: string;   // e.g. '2160p (4K)', '1440p', '1080p HD', '720p HD', '480p', '360p', '240p', '144p', 'Auto'
  isHD: boolean;
}

export interface YouTubePlaybackState {
  tabId: number;
  videoId: string | null;
  title: string;
  channel: string;
  thumbnailUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number; // 0 to 100
  isMuted: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  queue: QueueItem[];
  queueAvailable: boolean;
  isLive: boolean;
  isLiked?: boolean;
  currentQuality?: string;
  availableQualities?: QualityOption[];
  lastUpdated: number;
}

export interface SearchResultItem {
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  durationText?: string;
  viewsText?: string;
  url: string;
  itemType?: 'video' | 'channel' | 'playlist';
  subscribersText?: string;
  badgeText?: string;
}

export type ExtensionCommandType =
  | 'TOGGLE_PLAY'
  | 'PLAY'
  | 'PAUSE'
  | 'NEXT'
  | 'PREVIOUS'
  | 'SEEK'
  | 'SEEK_RELATIVE'
  | 'SET_VOLUME'
  | 'STEP_VOLUME'
  | 'TOGGLE_MUTE'
  | 'TOGGLE_PIP'
  | 'TOGGLE_LIKE'
  | 'TOGGLE_LOOP'
  | 'SET_QUALITY'
  | 'GET_QUALITY'
  | 'SEARCH_YOUTUBE'
  | 'PLAY_QUEUE_ITEM'
  | 'FOCUS_YOUTUBE_TAB'
  | 'SELECT_TARGET_TAB'
  | 'GET_STATE'
  | 'GET_TABS'
  | 'STATE_UPDATE'
  | 'SET_BAR_VISIBILITY'
  | 'GET_BAR_VISIBILITY'
  | 'BAR_VISIBILITY_CHANGED'
  | 'PING';

export interface CommandMessage {
  type: ExtensionCommandType;
  payload?: any;
}

export interface SeekPayload {
  time: number; // target position in seconds
}

export interface SetVolumePayload {
  volume: number; // 0 to 100
}

export interface PlayQueuePayload {
  videoId?: string;
  url: string;
}

export interface SelectTargetTabPayload {
  tabId: number;
}

export interface StateUpdatePayload {
  state: YouTubePlaybackState | null;
  tabs: YouTubeTabInfo[];
}

export interface ExtensionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

