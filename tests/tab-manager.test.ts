import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TabManager } from '../src/background/tab-manager.js';
import { YouTubePlaybackState } from '../src/types/messages.js';

function createMockState(tabId: number, isPlaying: boolean, title = `Video ${tabId}`): YouTubePlaybackState {
  return {
    tabId,
    videoId: `vid-${tabId}`,
    title,
    channel: 'Test Channel',
    thumbnailUrl: `https://i.ytimg.com/vi/vid-${tabId}/mqdefault.jpg`,
    currentTime: 10,
    duration: 100,
    isPlaying,
    volume: 80,
    isMuted: false,
    hasNext: true,
    hasPrevious: false,
    queue: [],
    queueAvailable: false,
    isLive: false,
    lastUpdated: Date.now()
  };
}

describe('TabManager Logic', () => {
  it('should elect the only playing tab as target', () => {
    const manager = new TabManager();
    manager.updateTabState(101, createMockState(101, false));
    manager.updateTabState(102, createMockState(102, true));
    manager.updateTabState(103, createMockState(103, false));

    assert.strictEqual(manager.getTargetTabId(), 102);
    const targetState = manager.getTargetState();
    assert.ok(targetState);
    assert.strictEqual(targetState.tabId, 102);
    assert.strictEqual(targetState.isPlaying, true);
  });

  it('should retain user selected tab even if other tabs are playing', () => {
    const manager = new TabManager();
    manager.updateTabState(201, createMockState(201, true, 'Song A'));
    manager.updateTabState(202, createMockState(202, true, 'Podcast B'));

    // User selects 202
    const selected = manager.setUserSelectedTab(202);
    assert.strictEqual(selected, true);
    assert.strictEqual(manager.getTargetTabId(), 202);

    // Tab 201 plays something else, but 202 remains target
    manager.updateTabState(201, createMockState(201, true, 'Song A updated'));
    assert.strictEqual(manager.getTargetTabId(), 202);
  });

  it('should re-elect new target when current target tab is closed', () => {
    const manager = new TabManager();
    manager.updateTabState(301, createMockState(301, true, 'Video 1'));
    manager.updateTabState(302, createMockState(302, false, 'Video 2'));

    assert.strictEqual(manager.getTargetTabId(), 301);

    // Tab 301 closed
    manager.removeTab(301);
    // Tab 302 should now become target
    assert.strictEqual(manager.getTargetTabId(), 302);

    // Close Tab 302 as well
    manager.removeTab(302);
    assert.strictEqual(manager.getTargetTabId(), null);
    assert.strictEqual(manager.getTargetState(), null);
  });

  it('should generate all tabs info for UI switcher', () => {
    const manager = new TabManager();
    manager.updateTabState(401, createMockState(401, false, 'Anime Episode 1'));
    manager.updateTabState(402, createMockState(402, true, 'Lofi Hip Hop'));

    const allTabs = manager.getAllTabsInfo();
    assert.strictEqual(allTabs.length, 2);

    const targetTab = allTabs.find(t => t.isTarget);
    assert.ok(targetTab);
    assert.strictEqual(targetTab.tabId, 402);
    assert.strictEqual(targetTab.isPlaying, true);
  });
});

