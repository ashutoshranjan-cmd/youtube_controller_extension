import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ControlBarStateStore } from '../src/content/control-bar/state.js';
import { YouTubePlaybackState, YouTubeTabInfo } from '../src/types/messages.js';

function createMockState(currentTime = 15, duration = 300, isPlaying = true): YouTubePlaybackState {
  return {
    tabId: 1,
    videoId: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    channel: 'Rick Astley',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    currentTime,
    duration,
    isPlaying,
    volume: 75,
    isMuted: false,
    hasNext: true,
    hasPrevious: true,
    queue: [
      {
        videoId: 'next-1',
        title: 'Next Awesome Song',
        channel: 'Music Channel',
        thumbnailUrl: 'https://i.ytimg.com/vi/next-1/mqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=next-1'
      }
    ],
    queueAvailable: true,
    isLive: false,
    lastUpdated: Date.now()
  };
}

describe('ControlBarStateStore', () => {
  it('should format seconds into mm:ss and hh:mm:ss properly', () => {
    assert.strictEqual(ControlBarStateStore.formatTime(0), '0:00');
    assert.strictEqual(ControlBarStateStore.formatTime(9), '0:09');
    assert.strictEqual(ControlBarStateStore.formatTime(65), '1:05');
    assert.strictEqual(ControlBarStateStore.formatTime(3599), '59:59');
    assert.strictEqual(ControlBarStateStore.formatTime(3665), '1:01:05');
    assert.strictEqual(ControlBarStateStore.formatTime(-5), '0:00');
    assert.strictEqual(ControlBarStateStore.formatTime(NaN), '0:00');
  });

  it('should notify subscribers when state updates', () => {
    const store = new ControlBarStateStore();
    let notified = 0;
    const unsubscribe = store.subscribe(() => {
      notified++;
    });

    const mockTabs: YouTubeTabInfo[] = [
      {
        tabId: 1,
        title: 'Rick Astley',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        isPlaying: true,
        isTarget: true
      }
    ];

    store.update(createMockState(), mockTabs);
    assert.strictEqual(notified, 1);
    assert.strictEqual(store.isVisible(), true);
    assert.strictEqual(store.getState()?.title, 'Never Gonna Give You Up');

    unsubscribe();
    store.update(null, []);
    // Subscriber was unsubscribed, notified count stays 1
    assert.strictEqual(notified, 1);
  });

  it('should handle dragging and seek calculation accurately', () => {
    const store = new ControlBarStateStore();
    store.update(createMockState(50, 200), []);

    store.startDragging(0.5);
    assert.strictEqual(store.isDragging(), true);
    assert.strictEqual(store.getCurrentProgressRatio(), 0.5);
    assert.strictEqual(store.getCurrentTime(), 100);

    store.updateDragging(0.75);
    assert.strictEqual(store.getCurrentProgressRatio(), 0.75);
    assert.strictEqual(store.getCurrentTime(), 150);

    const targetSeconds = store.stopDragging();
    assert.strictEqual(targetSeconds, 150);
    assert.strictEqual(store.isDragging(), false);
  });

  it('should handle minimize and close behavior', () => {
    const store = new ControlBarStateStore();
    const mockTabs: YouTubeTabInfo[] = [
      {
        tabId: 1,
        title: 'Test',
        url: 'https://www.youtube.com',
        isPlaying: false,
        isTarget: true
      }
    ];
    store.update(null, mockTabs);

    assert.strictEqual(store.isVisible(), true);
    assert.strictEqual(store.getMinimized(), false);

    store.toggleMinimized();
    assert.strictEqual(store.getMinimized(), true);

    store.close();
    assert.strictEqual(store.isVisible(), false);
  });
});

