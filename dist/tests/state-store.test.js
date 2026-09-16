// tests/state-store.test.ts
import { describe, it } from "node:test";
import assert from "node:assert";

// src/content/control-bar/state.ts
var ControlBarStateStore = class {
  state = null;
  tabs = [];
  isMinimized = false;
  isClosedByUser = false;
  isBarEnabled = true;
  listeners = /* @__PURE__ */ new Set();
  isDraggingProgress = false;
  dragProgressRatio = 0;
  // Client-side smooth time interpolation
  interpolatedTime = 0;
  lastInterpolationTimestamp = 0;
  rafId = null;
  constructor() {
    this.startClock();
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }
  update(state, tabs) {
    this.state = state;
    this.tabs = tabs;
    if (state) {
      this.interpolatedTime = state.currentTime;
      this.lastInterpolationTimestamp = performance.now();
    }
    this.notify();
  }
  setBarEnabled(enabled) {
    this.isBarEnabled = enabled;
    if (enabled) {
      this.isClosedByUser = false;
    }
    this.notify();
  }
  getBarEnabled() {
    return this.isBarEnabled;
  }
  getState() {
    return this.state;
  }
  getTabs() {
    return this.tabs;
  }
  isVisible() {
    return this.isBarEnabled && !this.isClosedByUser;
  }
  getMinimized() {
    return this.isMinimized;
  }
  setMinimized(minimized) {
    this.isMinimized = minimized;
    this.notify();
  }
  toggleMinimized() {
    this.setMinimized(!this.isMinimized);
  }
  close() {
    this.isClosedByUser = true;
    this.notify();
    try {
      chrome.runtime.sendMessage({
        type: "SET_BAR_VISIBILITY",
        payload: { enabled: false }
      }).catch(() => {
      });
    } catch {
    }
  }
  startDragging(ratio) {
    this.isDraggingProgress = true;
    this.dragProgressRatio = Math.max(0, Math.min(1, ratio));
    this.notify();
  }
  updateDragging(ratio) {
    if (this.isDraggingProgress) {
      this.dragProgressRatio = Math.max(0, Math.min(1, ratio));
      this.notify();
    }
  }
  stopDragging() {
    this.isDraggingProgress = false;
    const duration = this.state?.duration || 0;
    const targetSeconds = this.dragProgressRatio * duration;
    this.interpolatedTime = targetSeconds;
    this.notify();
    return targetSeconds;
  }
  isDragging() {
    return this.isDraggingProgress;
  }
  getCurrentProgressRatio() {
    if (this.isDraggingProgress) {
      return this.dragProgressRatio;
    }
    const duration = this.state?.duration || 0;
    if (!duration || duration <= 0)
      return 0;
    return Math.max(0, Math.min(1, this.interpolatedTime / duration));
  }
  getCurrentTime() {
    if (this.isDraggingProgress) {
      const duration = this.state?.duration || 0;
      return this.dragProgressRatio * duration;
    }
    return this.interpolatedTime;
  }
  startClock() {
    if (typeof requestAnimationFrame === "undefined")
      return;
    const tick = (now) => {
      if (this.state && this.state.isPlaying && !this.isDraggingProgress) {
        if (this.lastInterpolationTimestamp > 0) {
          const delta = (now - this.lastInterpolationTimestamp) / 1e3;
          this.interpolatedTime = Math.min(
            this.interpolatedTime + delta,
            this.state.duration || Infinity
          );
        }
      }
      this.lastInterpolationTimestamp = now;
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
  destroy() {
    if (this.rafId && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.rafId);
    }
    this.listeners.clear();
  }
  static formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return "0:00";
    }
    const s = Math.floor(seconds % 60);
    const m = Math.floor(seconds / 60 % 60);
    const h = Math.floor(seconds / 3600);
    const pad = (n) => n < 10 ? `0${n}` : `${n}`;
    if (h > 0) {
      return `${h}:${pad(m)}:${pad(s)}`;
    }
    return `${m}:${pad(s)}`;
  }
};

// tests/state-store.test.ts
function createMockState(currentTime = 15, duration = 300, isPlaying = true) {
  return {
    tabId: 1,
    videoId: "dQw4w9WgXcQ",
    title: "Never Gonna Give You Up",
    channel: "Rick Astley",
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    currentTime,
    duration,
    isPlaying,
    volume: 75,
    isMuted: false,
    hasNext: true,
    hasPrevious: true,
    queue: [
      {
        videoId: "next-1",
        title: "Next Awesome Song",
        channel: "Music Channel",
        thumbnailUrl: "https://i.ytimg.com/vi/next-1/mqdefault.jpg",
        url: "https://www.youtube.com/watch?v=next-1"
      }
    ],
    queueAvailable: true,
    isLive: false,
    lastUpdated: Date.now()
  };
}
describe("ControlBarStateStore", () => {
  it("should format seconds into mm:ss and hh:mm:ss properly", () => {
    assert.strictEqual(ControlBarStateStore.formatTime(0), "0:00");
    assert.strictEqual(ControlBarStateStore.formatTime(9), "0:09");
    assert.strictEqual(ControlBarStateStore.formatTime(65), "1:05");
    assert.strictEqual(ControlBarStateStore.formatTime(3599), "59:59");
    assert.strictEqual(ControlBarStateStore.formatTime(3665), "1:01:05");
    assert.strictEqual(ControlBarStateStore.formatTime(-5), "0:00");
    assert.strictEqual(ControlBarStateStore.formatTime(NaN), "0:00");
  });
  it("should notify subscribers when state updates", () => {
    const store = new ControlBarStateStore();
    let notified = 0;
    const unsubscribe = store.subscribe(() => {
      notified++;
    });
    const mockTabs = [
      {
        tabId: 1,
        title: "Rick Astley",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        isPlaying: true,
        isTarget: true
      }
    ];
    store.update(createMockState(), mockTabs);
    assert.strictEqual(notified, 1);
    assert.strictEqual(store.isVisible(), true);
    assert.strictEqual(store.getState()?.title, "Never Gonna Give You Up");
    unsubscribe();
    store.update(null, []);
    assert.strictEqual(notified, 1);
  });
  it("should handle dragging and seek calculation accurately", () => {
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
  it("should handle minimize and close behavior", () => {
    const store = new ControlBarStateStore();
    const mockTabs = [
      {
        tabId: 1,
        title: "Test",
        url: "https://www.youtube.com",
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
