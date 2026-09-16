import {
  YouTubePlaybackState,
  YouTubeTabInfo,
  StateUpdatePayload
} from '../types/messages.js';

export class TabManager {
  private tabStates: Map<number, YouTubePlaybackState> = new Map();
  private userSelectedTabId: number | null = null;
  private targetTabId: number | null = null;

  /**
   * Updates or registers the playback state for a YouTube tab.
   */
  public updateTabState(tabId: number, state: YouTubePlaybackState): void {
    this.tabStates.set(tabId, { ...state, tabId, lastUpdated: Date.now() });
    this.electTargetTab();
  }

  /**
   * Registers a YouTube tab without full state yet (e.g. initial discovery).
   */
  public registerTab(tabId: number, title = 'YouTube', url = ''): void {
    if (!this.tabStates.has(tabId)) {
      this.tabStates.set(tabId, {
        tabId,
        videoId: null,
        title: title || 'YouTube',
        channel: '',
        thumbnailUrl: '',
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        volume: 100,
        isMuted: false,
        hasNext: false,
        hasPrevious: false,
        queue: [],
        queueAvailable: false,
        isLive: false,
        lastUpdated: Date.now()
      });
      this.electTargetTab();
    }
  }

  /**
   * Removes a tab when closed or navigated away from YouTube.
   */
  public removeTab(tabId: number): void {
    this.tabStates.delete(tabId);
    if (this.userSelectedTabId === tabId) {
      this.userSelectedTabId = null;
    }
    if (this.targetTabId === tabId) {
      this.targetTabId = null;
    }
    this.electTargetTab();
  }

  /**
   * Sets the user's manual selection for the target YouTube tab.
   */
  public setUserSelectedTab(tabId: number): boolean {
    if (this.tabStates.has(tabId)) {
      this.userSelectedTabId = tabId;
      this.targetTabId = tabId;
      return true;
    }
    return false;
  }

  /**
   * Determines which YouTube tab should currently be the target for controls.
   */
  public electTargetTab(): number | null {
    // 1. If user explicitly selected a valid tab that still exists, prioritize it
    if (this.userSelectedTabId !== null && this.tabStates.has(this.userSelectedTabId)) {
      this.targetTabId = this.userSelectedTabId;
      return this.targetTabId;
    }

    const tabs = Array.from(this.tabStates.values());
    if (tabs.length === 0) {
      this.targetTabId = null;
      return null;
    }

    // 2. Find currently playing tabs
    const playingTabs = tabs.filter(t => t.isPlaying);

    if (playingTabs.length === 1) {
      // Exactly one playing tab: use it as target
      this.targetTabId = playingTabs[0].tabId;
      return this.targetTabId;
    } else if (playingTabs.length > 1) {
      // Multiple tabs playing: retain existing target if it's playing, else take the most recently active
      if (this.targetTabId !== null) {
        const currentTarget = this.tabStates.get(this.targetTabId);
        if (currentTarget && currentTarget.isPlaying) {
          return this.targetTabId;
        }
      }
      // Otherwise pick the one updated most recently
      playingTabs.sort((a, b) => b.lastUpdated - a.lastUpdated);
      this.targetTabId = playingTabs[0].tabId;
      return this.targetTabId;
    }

    // 3. No tabs currently playing: retain existing target if still valid
    if (this.targetTabId !== null && this.tabStates.has(this.targetTabId)) {
      return this.targetTabId;
    }

    // 4. Fallback: pick the one with videoId/title loaded, or the first one
    const tabWithVideo = tabs.find(t => t.videoId || (t.title && t.title !== 'YouTube'));
    this.targetTabId = tabWithVideo ? tabWithVideo.tabId : tabs[0].tabId;
    return this.targetTabId;
  }

  public getTargetTabId(): number | null {
    return this.targetTabId;
  }

  public getTargetState(): YouTubePlaybackState | null {
    if (this.targetTabId === null) return null;
    return this.tabStates.get(this.targetTabId) || null;
  }

  /**
   * Generates a list of all detected YouTube tabs for the switcher UI.
   */
  public getAllTabsInfo(): YouTubeTabInfo[] {
    const list: YouTubeTabInfo[] = [];
    for (const [tabId, state] of this.tabStates.entries()) {
      list.push({
        tabId,
        title: state.title || 'YouTube',
        url: state.videoId ? `https://www.youtube.com/watch?v=${state.videoId}` : 'https://www.youtube.com/',
        isPlaying: state.isPlaying,
        isTarget: tabId === this.targetTabId,
        videoTitle: state.title
      });
    }
    return list;
  }

  public getFullPayload(): StateUpdatePayload {
    return {
      state: this.getTargetState(),
      tabs: this.getAllTabsInfo()
    };
  }
}

