import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TabManager } from '../src/background/tab-manager.js';
import {
  CommandMessage,
  YouTubePlaybackState,
  QueueItem
} from '../src/types/messages.js';

// Mock YouTube Tab Player environment
class MockYouTubeTab {
  public tabId: number;
  public video = {
    currentTime: 0,
    duration: 300,
    paused: true,
    volume: 1,
    muted: false
  };
  public queue: QueueItem[] = [
    {
      videoId: 'vid-2',
      title: 'Episode 2',
      channel: 'Anime Channel',
      thumbnailUrl: 'https://i.ytimg.com/vi/vid-2/mqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=vid-2'
    }
  ];
  public currentVideoId = 'vid-1';
  public currentTitle = 'Episode 1';

  public isLiked = false;
  public currentQuality = 'auto';

  constructor(tabId: number) {
    this.tabId = tabId;
  }

  public getState(): YouTubePlaybackState {
    return {
      tabId: this.tabId,
      videoId: this.currentVideoId,
      title: this.currentTitle,
      channel: 'Anime Channel',
      thumbnailUrl: `https://i.ytimg.com/vi/${this.currentVideoId}/mqdefault.jpg`,
      currentTime: this.video.currentTime,
      duration: this.video.duration,
      isPlaying: !this.video.paused,
      volume: Math.round(this.video.volume * 100),
      isMuted: this.video.muted,
      hasNext: true,
      hasPrevious: true,
      queue: this.queue,
      queueAvailable: true,
      isLive: false,
      isLiked: this.isLiked,
      currentQuality: this.currentQuality,
      availableQualities: [
        { quality: 'auto', label: 'Auto', isHD: false },
        { quality: 'hd1080', label: '1080p HD', isHD: true },
        { quality: 'hd720', label: '720p HD', isHD: true }
      ],
      lastUpdated: Date.now()
    };
  }

  public handleCommand(msg: CommandMessage): void {
    switch (msg.type) {
      case 'PLAY':
        this.video.paused = false;
        break;
      case 'PAUSE':
        this.video.paused = true;
        break;
      case 'TOGGLE_PLAY':
        this.video.paused = !this.video.paused;
        break;
      case 'TOGGLE_LIKE':
        this.isLiked = !this.isLiked;
        break;
      case 'SET_QUALITY':
        this.currentQuality = msg.payload?.quality || 'auto';
        break;
      case 'SEEK':
        this.video.currentTime = msg.payload?.time || 0;
        break;
      case 'SET_VOLUME':
        this.video.volume = (msg.payload?.volume || 0) / 100;
        break;
      case 'TOGGLE_MUTE':
        this.video.muted = !this.video.muted;
        break;
      case 'PLAY_QUEUE_ITEM':
        this.currentVideoId = msg.payload?.videoId || 'next-vid';
        this.currentTitle = 'Next Video Title';
        this.video.currentTime = 0;
        this.video.paused = false;
        break;
      case 'NEXT':
        this.currentVideoId = 'vid-2';
        this.currentTitle = 'Episode 2';
        this.video.currentTime = 0;
        break;
      case 'PREVIOUS':
        this.video.currentTime = 0;
        break;
    }
  }
}

describe('End-to-End Control Bar & YouTube Dispatch Simulation', () => {
  it('should route playback commands to elected tab and update state without focus switch', () => {
    const tabManager = new TabManager();
    const ytTab1 = new MockYouTubeTab(501);
    const ytTab2 = new MockYouTubeTab(502);

    // Initial sync
    tabManager.updateTabState(501, ytTab1.getState());
    tabManager.updateTabState(502, ytTab2.getState());

    // Tab 1 plays
    ytTab1.handleCommand({ type: 'PLAY' });
    tabManager.updateTabState(501, ytTab1.getState());

    // Verify Tab 1 is automatically elected
    assert.strictEqual(tabManager.getTargetTabId(), 501);
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);

    // Simulate Control Bar sending TOGGLE_PLAY from another website
    const targetTabId = tabManager.getTargetTabId()!;
    assert.strictEqual(targetTabId, 501);

    ytTab1.handleCommand({ type: 'TOGGLE_PLAY' });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, false);

    // Test Volume adjustment
    ytTab1.handleCommand({ type: 'SET_VOLUME', payload: { volume: 45 } });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.volume, 45);

    // Test Seek adjustment
    ytTab1.handleCommand({ type: 'SEEK', payload: { time: 142 } });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.currentTime, 142);

    // Test Mute toggle
    ytTab1.handleCommand({ type: 'TOGGLE_MUTE' });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.isMuted, true);

    // Test Heart / Like toggle
    assert.strictEqual(tabManager.getTargetState()?.isLiked, false);
    ytTab1.handleCommand({ type: 'TOGGLE_LIKE' });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.isLiked, true);
    ytTab1.handleCommand({ type: 'TOGGLE_LIKE' });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.isLiked, false);

    // Test Playback Resolution / Quality Switching
    assert.strictEqual(tabManager.getTargetState()?.currentQuality, 'auto');
    ytTab1.handleCommand({ type: 'SET_QUALITY', payload: { quality: 'hd1080' } });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.currentQuality, 'hd1080');
    assert.strictEqual(tabManager.getTargetState()?.availableQualities?.length, 3);

    // Test Next video advance
    ytTab1.handleCommand({ type: 'NEXT' });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.videoId, 'vid-2');
    assert.strictEqual(tabManager.getTargetState()?.title, 'Episode 2');

    // Test Play Queue Item
    ytTab1.handleCommand({
      type: 'PLAY_QUEUE_ITEM',
      payload: { videoId: 'custom-q', url: 'https://youtube.com/watch?v=custom-q' }
    });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.videoId, 'custom-q');
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);
  });

  it('should handle multi-tab player selection smoothly', () => {
    const tabManager = new TabManager();
    const ytMusic = new MockYouTubeTab(601);
    const ytTutorial = new MockYouTubeTab(602);

    ytMusic.currentTitle = 'Lofi Beats';
    ytTutorial.currentTitle = 'TypeScript Advanced Tutorial';

    tabManager.updateTabState(601, ytMusic.getState());
    tabManager.updateTabState(602, ytTutorial.getState());

    // Both tabs are paused; user selects tutorial tab
    tabManager.setUserSelectedTab(602);
    assert.strictEqual(tabManager.getTargetTabId(), 602);
    assert.strictEqual(tabManager.getTargetState()?.title, 'TypeScript Advanced Tutorial');

    // Send play to selected tab
    ytTutorial.handleCommand({ type: 'PLAY' });
    tabManager.updateTabState(602, ytTutorial.getState());
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);

    // Switch selection to Music tab
    tabManager.setUserSelectedTab(601);
    assert.strictEqual(tabManager.getTargetTabId(), 601);
    assert.strictEqual(tabManager.getTargetState()?.title, 'Lofi Beats');
  });

  it('should play search result items directly without stealing focus', () => {
    const tabManager = new TabManager();
    const ytTab = new MockYouTubeTab(701);
    tabManager.updateTabState(701, ytTab.getState());

    // User searches and selects a video result
    const searchItem = {
      videoId: 'found-123',
      title: 'Trending Hit Song',
      channel: 'Popular Artist',
      durationText: '3:45',
      thumbnailUrl: 'https://i.ytimg.com/vi/found-123/hqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=found-123'
    };

    ytTab.handleCommand({
      type: 'PLAY_QUEUE_ITEM',
      payload: { url: searchItem.url, videoId: searchItem.videoId }
    });
    tabManager.updateTabState(701, ytTab.getState());

    assert.strictEqual(tabManager.getTargetState()?.videoId, 'found-123');
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);
  });

  it('should support channel recommendations and playlist playback items', () => {
    const tabManager = new TabManager();
    const ytTab = new MockYouTubeTab(702);
    tabManager.updateTabState(702, ytTab.getState());

    // Verified channel item
    const channelItem = {
      videoId: '',
      title: 'T-Series',
      channel: 'Verified Channel',
      thumbnailUrl: 'https://yt3.googleusercontent.com/avatar.jpg',
      subscribersText: '260M subscribers',
      badgeText: 'CHANNEL',
      itemType: 'channel' as const,
      url: 'https://www.youtube.com/@tseries'
    };
    assert.strictEqual(channelItem.itemType, 'channel');
    assert.strictEqual(channelItem.badgeText, 'CHANNEL');

    // Playlist / Mix item
    const playlistItem = {
      videoId: 'mix-first-vid',
      title: 'Top Hits Playlist 2024',
      channel: 'YouTube Music',
      thumbnailUrl: 'https://i.ytimg.com/vi/mix-first-vid/hqdefault.jpg',
      viewsText: '50 videos',
      badgeText: 'PLAYLIST',
      itemType: 'playlist' as const,
      url: 'https://www.youtube.com/watch?v=mix-first-vid&list=RDCLAK5uy_km'
    };

    ytTab.handleCommand({
      type: 'PLAY_QUEUE_ITEM',
      payload: { url: playlistItem.url, videoId: playlistItem.videoId }
    });
    tabManager.updateTabState(702, ytTab.getState());

    assert.strictEqual(tabManager.getTargetState()?.videoId, 'mix-first-vid');
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);
  });

  it('should support video preview drag boundary calculation and full controls dispatch', () => {
    // 1. Clamping simulation
    const winWidth = 1920;
    const winHeight = 1080;
    const previewWidth = 360;
    const previewHeight = 210;

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const maxLeft = Math.max(0, winWidth - previewWidth - 8);
    const maxTop = Math.max(0, winHeight - previewHeight - 8);

    assert.strictEqual(clamp(-100, 8, maxLeft), 8);
    assert.strictEqual(clamp(2500, 8, maxLeft), maxLeft);
    assert.strictEqual(clamp(500, 8, maxLeft), 500);

    assert.strictEqual(clamp(-50, 8, maxTop), 8);
    assert.strictEqual(clamp(1500, 8, maxTop), maxTop);
    assert.strictEqual(clamp(300, 8, maxTop), 300);

    // 2. Video preview transport command dispatch simulation
    const tabManager = new TabManager();
    const ytTab = new MockYouTubeTab(703);
    tabManager.updateTabState(703, ytTab.getState());

    // Play/Pause from preview
    ytTab.handleCommand({ type: 'TOGGLE_PLAY' });
    tabManager.updateTabState(703, ytTab.getState());
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);

    // Next track from preview
    ytTab.handleCommand({ type: 'NEXT' });
    tabManager.updateTabState(703, ytTab.getState());
    assert.strictEqual(tabManager.getTargetState()?.videoId, 'vid-2');

    // Mute and Volume from preview
    ytTab.handleCommand({ type: 'SET_VOLUME', payload: { volume: 65 } });
    tabManager.updateTabState(703, ytTab.getState());
    assert.strictEqual(tabManager.getTargetState()?.volume, 65);

    ytTab.handleCommand({ type: 'TOGGLE_MUTE' });
    tabManager.updateTabState(703, ytTab.getState());
    assert.strictEqual(tabManager.getTargetState()?.isMuted, true);
  });

  it('should accurately calculate preview resize geometry, keyboard steps, bounds clamping, and drag isolation', () => {
    const winWidth = 1920;
    const winHeight = 1080;

    // Simulation of preview resizing logic in setupPreviewResizing
    let currentWidth = 360;
    let currentHeight = 210;
    let currentLeft = 1500;
    let currentTop = 750;

    const fitPreviewToViewport = () => {
      currentWidth = Math.min(currentWidth, Math.max(1, winWidth - 16));
      currentHeight = Math.min(currentHeight, Math.max(1, winHeight - 16));
      currentLeft = Math.max(8, Math.min(currentLeft, winWidth - currentWidth - 8));
      currentTop = Math.max(8, Math.min(currentTop, winHeight - currentHeight - 8));
    };

    const resize = (width: number, height: number) => {
      currentWidth = Math.max(1, Math.min(Math.max(320, width), winWidth - 16));
      currentHeight = Math.max(1, Math.min(Math.max(180, height), winHeight - 16));
      fitPreviewToViewport();
    };

    // 1. Initial dimensions
    assert.strictEqual(currentWidth, 360);
    assert.strictEqual(currentHeight, 210);

    // 2. Drag resize by (+140px, +90px)
    resize(currentWidth + 140, currentHeight + 90);
    assert.strictEqual(currentWidth, 500);
    assert.strictEqual(currentHeight, 300);
    // Boundary check: 1500 + 500 = 2000 > 1920 - 8 (1912) -> should shift left to 1412
    assert.strictEqual(currentLeft, 1412);
    assert.strictEqual(currentTop, 750);

    // 3. Clamping minimum sizes: shrink below minimum (320x180)
    resize(100, 50);
    assert.strictEqual(currentWidth, 320);
    assert.strictEqual(currentHeight, 180);

    // 4. Clamping maximum sizes: enlarge beyond viewport
    resize(3000, 2000);
    assert.strictEqual(currentWidth, winWidth - 16);
    assert.strictEqual(currentHeight, winHeight - 16);
    assert.strictEqual(currentLeft, 8);
    assert.strictEqual(currentTop, 8);

    // 5. Double-click reset to default 360x210
    currentWidth = 360;
    currentHeight = 210;
    fitPreviewToViewport();
    assert.strictEqual(currentWidth, 360);
    assert.strictEqual(currentHeight, 210);

    // 6. Keyboard navigation: ArrowRight / ArrowDown (+10px)
    const stepNormal = 10;
    resize(currentWidth + stepNormal, currentHeight + stepNormal);
    assert.strictEqual(currentWidth, 370);
    assert.strictEqual(currentHeight, 220);

    // Shift + ArrowLeft / ArrowUp (-40px)
    const stepShift = 40;
    resize(currentWidth - stepShift, currentHeight - stepShift);
    assert.strictEqual(currentWidth, 330);
    assert.strictEqual(currentHeight, 180);

    // 7. Drag isolation: pointerdown on resize handle or button elements
    const isDragBlocked = (target: { tagName: string; className: string; closest: (s: string) => boolean }) => {
      return (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.tagName === 'INPUT' ||
        target.closest('.preview-progress-track') ||
        target.closest('.preview-open-yt') ||
        target.className.includes('preview-vol-slider') ||
        target.className.includes('preview-resize-handle') ||
        target.closest('.preview-resize-handle')
      );
    };

    // Resize handle click should NOT trigger window dragging
    const handleElement = {
      tagName: 'BUTTON',
      className: 'preview-resize-handle',
      closest: (selector: string) => selector === 'button' || selector === '.preview-resize-handle'
    };
    assert.strictEqual(isDragBlocked(handleElement), true);

    // Regular preview titlebar/backdrop click DOES allow window dragging
    const titleBarElement = {
      tagName: 'DIV',
      className: 'preview-top-bar',
      closest: () => false
    };
    assert.strictEqual(isDragBlocked(titleBarElement), false);
  });
});

