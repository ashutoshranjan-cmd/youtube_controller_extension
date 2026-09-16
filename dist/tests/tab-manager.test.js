// tests/tab-manager.test.ts
import { describe, it } from "node:test";
import assert from "node:assert";

// src/background/tab-manager.ts
var TabManager = class {
  tabStates = /* @__PURE__ */ new Map();
  userSelectedTabId = null;
  targetTabId = null;
  /**
   * Updates or registers the playback state for a YouTube tab.
   */
  updateTabState(tabId, state) {
    this.tabStates.set(tabId, { ...state, tabId, lastUpdated: Date.now() });
    this.electTargetTab();
  }
  /**
   * Registers a YouTube tab without full state yet (e.g. initial discovery).
   */
  registerTab(tabId, title = "YouTube", url = "") {
    if (!this.tabStates.has(tabId)) {
      this.tabStates.set(tabId, {
        tabId,
        videoId: null,
        title: title || "YouTube",
        channel: "",
        thumbnailUrl: "",
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
  removeTab(tabId) {
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
  setUserSelectedTab(tabId) {
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
  electTargetTab() {
    if (this.userSelectedTabId !== null && this.tabStates.has(this.userSelectedTabId)) {
      this.targetTabId = this.userSelectedTabId;
      return this.targetTabId;
    }
    const tabs = Array.from(this.tabStates.values());
    if (tabs.length === 0) {
      this.targetTabId = null;
      return null;
    }
    const playingTabs = tabs.filter((t) => t.isPlaying);
    if (playingTabs.length === 1) {
      this.targetTabId = playingTabs[0].tabId;
      return this.targetTabId;
    } else if (playingTabs.length > 1) {
      if (this.targetTabId !== null) {
        const currentTarget = this.tabStates.get(this.targetTabId);
        if (currentTarget && currentTarget.isPlaying) {
          return this.targetTabId;
        }
      }
      playingTabs.sort((a, b) => b.lastUpdated - a.lastUpdated);
      this.targetTabId = playingTabs[0].tabId;
      return this.targetTabId;
    }
    if (this.targetTabId !== null && this.tabStates.has(this.targetTabId)) {
      return this.targetTabId;
    }
    const tabWithVideo = tabs.find((t) => t.videoId || t.title && t.title !== "YouTube");
    this.targetTabId = tabWithVideo ? tabWithVideo.tabId : tabs[0].tabId;
    return this.targetTabId;
  }
  getTargetTabId() {
    return this.targetTabId;
  }
  getTargetState() {
    if (this.targetTabId === null)
      return null;
    return this.tabStates.get(this.targetTabId) || null;
  }
  /**
   * Generates a list of all detected YouTube tabs for the switcher UI.
   */
  getAllTabsInfo() {
    const list = [];
    for (const [tabId, state] of this.tabStates.entries()) {
      list.push({
        tabId,
        title: state.title || "YouTube",
        url: state.videoId ? `https://www.youtube.com/watch?v=${state.videoId}` : "https://www.youtube.com/",
        isPlaying: state.isPlaying,
        isTarget: tabId === this.targetTabId,
        videoTitle: state.title
      });
    }
    return list;
  }
  getFullPayload() {
    return {
      state: this.getTargetState(),
      tabs: this.getAllTabsInfo()
    };
  }
};

// tests/tab-manager.test.ts
function createMockState(tabId, isPlaying, title = `Video ${tabId}`) {
  return {
    tabId,
    videoId: `vid-${tabId}`,
    title,
    channel: "Test Channel",
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
describe("TabManager Logic", () => {
  it("should elect the only playing tab as target", () => {
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
  it("should retain user selected tab even if other tabs are playing", () => {
    const manager = new TabManager();
    manager.updateTabState(201, createMockState(201, true, "Song A"));
    manager.updateTabState(202, createMockState(202, true, "Podcast B"));
    const selected = manager.setUserSelectedTab(202);
    assert.strictEqual(selected, true);
    assert.strictEqual(manager.getTargetTabId(), 202);
    manager.updateTabState(201, createMockState(201, true, "Song A updated"));
    assert.strictEqual(manager.getTargetTabId(), 202);
  });
  it("should re-elect new target when current target tab is closed", () => {
    const manager = new TabManager();
    manager.updateTabState(301, createMockState(301, true, "Video 1"));
    manager.updateTabState(302, createMockState(302, false, "Video 2"));
    assert.strictEqual(manager.getTargetTabId(), 301);
    manager.removeTab(301);
    assert.strictEqual(manager.getTargetTabId(), 302);
    manager.removeTab(302);
    assert.strictEqual(manager.getTargetTabId(), null);
    assert.strictEqual(manager.getTargetState(), null);
  });
  it("should generate all tabs info for UI switcher", () => {
    const manager = new TabManager();
    manager.updateTabState(401, createMockState(401, false, "Anime Episode 1"));
    manager.updateTabState(402, createMockState(402, true, "Lofi Hip Hop"));
    const allTabs = manager.getAllTabsInfo();
    assert.strictEqual(allTabs.length, 2);
    const targetTab = allTabs.find((t) => t.isTarget);
    assert.ok(targetTab);
    assert.strictEqual(targetTab.tabId, 402);
    assert.strictEqual(targetTab.isPlaying, true);
  });
});
