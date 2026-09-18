// tests/e2e-simulation.test.ts
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

// tests/e2e-simulation.test.ts
var MockYouTubeTab = class {
  tabId;
  video = {
    currentTime: 0,
    duration: 300,
    paused: true,
    volume: 1,
    muted: false
  };
  queue = [
    {
      videoId: "vid-2",
      title: "Episode 2",
      channel: "Anime Channel",
      thumbnailUrl: "https://i.ytimg.com/vi/vid-2/mqdefault.jpg",
      url: "https://www.youtube.com/watch?v=vid-2"
    }
  ];
  currentVideoId = "vid-1";
  currentTitle = "Episode 1";
  isLiked = false;
  currentQuality = "auto";
  constructor(tabId) {
    this.tabId = tabId;
  }
  getState() {
    return {
      tabId: this.tabId,
      videoId: this.currentVideoId,
      title: this.currentTitle,
      channel: "Anime Channel",
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
        { quality: "auto", label: "Auto", isHD: false },
        { quality: "hd1080", label: "1080p HD", isHD: true },
        { quality: "hd720", label: "720p HD", isHD: true }
      ],
      lastUpdated: Date.now()
    };
  }
  handleCommand(msg) {
    switch (msg.type) {
      case "PLAY":
        this.video.paused = false;
        break;
      case "PAUSE":
        this.video.paused = true;
        break;
      case "TOGGLE_PLAY":
        this.video.paused = !this.video.paused;
        break;
      case "TOGGLE_LIKE":
        this.isLiked = !this.isLiked;
        break;
      case "SET_QUALITY":
        this.currentQuality = msg.payload?.quality || "auto";
        break;
      case "SEEK":
        this.video.currentTime = msg.payload?.time || 0;
        break;
      case "SET_VOLUME":
        this.video.volume = (msg.payload?.volume || 0) / 100;
        break;
      case "TOGGLE_MUTE":
        this.video.muted = !this.video.muted;
        break;
      case "PLAY_QUEUE_ITEM":
        this.currentVideoId = msg.payload?.videoId || "next-vid";
        this.currentTitle = "Next Video Title";
        this.video.currentTime = 0;
        this.video.paused = false;
        break;
      case "NEXT":
        this.currentVideoId = "vid-2";
        this.currentTitle = "Episode 2";
        this.video.currentTime = 0;
        break;
      case "PREVIOUS":
        this.video.currentTime = 0;
        break;
    }
  }
};
describe("End-to-End Control Bar & YouTube Dispatch Simulation", () => {
  it("should route playback commands to elected tab and update state without focus switch", () => {
    const tabManager = new TabManager();
    const ytTab1 = new MockYouTubeTab(501);
    const ytTab2 = new MockYouTubeTab(502);
    tabManager.updateTabState(501, ytTab1.getState());
    tabManager.updateTabState(502, ytTab2.getState());
    ytTab1.handleCommand({ type: "PLAY" });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetTabId(), 501);
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);
    const targetTabId = tabManager.getTargetTabId();
    assert.strictEqual(targetTabId, 501);
    ytTab1.handleCommand({ type: "TOGGLE_PLAY" });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, false);
    ytTab1.handleCommand({ type: "SET_VOLUME", payload: { volume: 45 } });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.volume, 45);
    ytTab1.handleCommand({ type: "SEEK", payload: { time: 142 } });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.currentTime, 142);
    ytTab1.handleCommand({ type: "TOGGLE_MUTE" });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.isMuted, true);
    assert.strictEqual(tabManager.getTargetState()?.isLiked, false);
    ytTab1.handleCommand({ type: "TOGGLE_LIKE" });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.isLiked, true);
    ytTab1.handleCommand({ type: "TOGGLE_LIKE" });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.isLiked, false);
    assert.strictEqual(tabManager.getTargetState()?.currentQuality, "auto");
    ytTab1.handleCommand({ type: "SET_QUALITY", payload: { quality: "hd1080" } });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.currentQuality, "hd1080");
    assert.strictEqual(tabManager.getTargetState()?.availableQualities?.length, 3);
    ytTab1.handleCommand({ type: "NEXT" });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.videoId, "vid-2");
    assert.strictEqual(tabManager.getTargetState()?.title, "Episode 2");
    ytTab1.handleCommand({
      type: "PLAY_QUEUE_ITEM",
      payload: { videoId: "custom-q", url: "https://youtube.com/watch?v=custom-q" }
    });
    tabManager.updateTabState(501, ytTab1.getState());
    assert.strictEqual(tabManager.getTargetState()?.videoId, "custom-q");
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);
  });
  it("should handle multi-tab player selection smoothly", () => {
    const tabManager = new TabManager();
    const ytMusic = new MockYouTubeTab(601);
    const ytTutorial = new MockYouTubeTab(602);
    ytMusic.currentTitle = "Lofi Beats";
    ytTutorial.currentTitle = "TypeScript Advanced Tutorial";
    tabManager.updateTabState(601, ytMusic.getState());
    tabManager.updateTabState(602, ytTutorial.getState());
    tabManager.setUserSelectedTab(602);
    assert.strictEqual(tabManager.getTargetTabId(), 602);
    assert.strictEqual(tabManager.getTargetState()?.title, "TypeScript Advanced Tutorial");
    ytTutorial.handleCommand({ type: "PLAY" });
    tabManager.updateTabState(602, ytTutorial.getState());
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);
    tabManager.setUserSelectedTab(601);
    assert.strictEqual(tabManager.getTargetTabId(), 601);
    assert.strictEqual(tabManager.getTargetState()?.title, "Lofi Beats");
  });
  it("should play search result items directly without stealing focus", () => {
    const tabManager = new TabManager();
    const ytTab = new MockYouTubeTab(701);
    tabManager.updateTabState(701, ytTab.getState());
    const searchItem = {
      videoId: "found-123",
      title: "Trending Hit Song",
      channel: "Popular Artist",
      durationText: "3:45",
      thumbnailUrl: "https://i.ytimg.com/vi/found-123/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=found-123"
    };
    ytTab.handleCommand({
      type: "PLAY_QUEUE_ITEM",
      payload: { url: searchItem.url, videoId: searchItem.videoId }
    });
    tabManager.updateTabState(701, ytTab.getState());
    assert.strictEqual(tabManager.getTargetState()?.videoId, "found-123");
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);
  });
  it("should support channel recommendations and playlist playback items", () => {
    const tabManager = new TabManager();
    const ytTab = new MockYouTubeTab(702);
    tabManager.updateTabState(702, ytTab.getState());
    const channelItem = {
      videoId: "",
      title: "T-Series",
      channel: "Verified Channel",
      thumbnailUrl: "https://yt3.googleusercontent.com/avatar.jpg",
      subscribersText: "260M subscribers",
      badgeText: "CHANNEL",
      itemType: "channel",
      url: "https://www.youtube.com/@tseries"
    };
    assert.strictEqual(channelItem.itemType, "channel");
    assert.strictEqual(channelItem.badgeText, "CHANNEL");
    const playlistItem = {
      videoId: "mix-first-vid",
      title: "Top Hits Playlist 2024",
      channel: "YouTube Music",
      thumbnailUrl: "https://i.ytimg.com/vi/mix-first-vid/hqdefault.jpg",
      viewsText: "50 videos",
      badgeText: "PLAYLIST",
      itemType: "playlist",
      url: "https://www.youtube.com/watch?v=mix-first-vid&list=RDCLAK5uy_km"
    };
    ytTab.handleCommand({
      type: "PLAY_QUEUE_ITEM",
      payload: { url: playlistItem.url, videoId: playlistItem.videoId }
    });
    tabManager.updateTabState(702, ytTab.getState());
    assert.strictEqual(tabManager.getTargetState()?.videoId, "mix-first-vid");
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);
  });
  it("should support video preview drag boundary calculation and full controls dispatch", () => {
    const winWidth = 1920;
    const winHeight = 1080;
    const previewWidth = 360;
    const previewHeight = 210;
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    const maxLeft = Math.max(0, winWidth - previewWidth - 8);
    const maxTop = Math.max(0, winHeight - previewHeight - 8);
    assert.strictEqual(clamp(-100, 8, maxLeft), 8);
    assert.strictEqual(clamp(2500, 8, maxLeft), maxLeft);
    assert.strictEqual(clamp(500, 8, maxLeft), 500);
    assert.strictEqual(clamp(-50, 8, maxTop), 8);
    assert.strictEqual(clamp(1500, 8, maxTop), maxTop);
    assert.strictEqual(clamp(300, 8, maxTop), 300);
    const tabManager = new TabManager();
    const ytTab = new MockYouTubeTab(703);
    tabManager.updateTabState(703, ytTab.getState());
    ytTab.handleCommand({ type: "TOGGLE_PLAY" });
    tabManager.updateTabState(703, ytTab.getState());
    assert.strictEqual(tabManager.getTargetState()?.isPlaying, true);
    ytTab.handleCommand({ type: "NEXT" });
    tabManager.updateTabState(703, ytTab.getState());
    assert.strictEqual(tabManager.getTargetState()?.videoId, "vid-2");
    ytTab.handleCommand({ type: "SET_VOLUME", payload: { volume: 65 } });
    tabManager.updateTabState(703, ytTab.getState());
    assert.strictEqual(tabManager.getTargetState()?.volume, 65);
    ytTab.handleCommand({ type: "TOGGLE_MUTE" });
    tabManager.updateTabState(703, ytTab.getState());
    assert.strictEqual(tabManager.getTargetState()?.isMuted, true);
  });
  it("should accurately calculate preview resize geometry, keyboard steps, bounds clamping, and drag isolation", () => {
    const winWidth = 1920;
    const winHeight = 1080;
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
    const resize = (width, height) => {
      currentWidth = Math.max(1, Math.min(Math.max(320, width), winWidth - 16));
      currentHeight = Math.max(1, Math.min(Math.max(180, height), winHeight - 16));
      fitPreviewToViewport();
    };
    assert.strictEqual(currentWidth, 360);
    assert.strictEqual(currentHeight, 210);
    resize(currentWidth + 140, currentHeight + 90);
    assert.strictEqual(currentWidth, 500);
    assert.strictEqual(currentHeight, 300);
    assert.strictEqual(currentLeft, 1412);
    assert.strictEqual(currentTop, 750);
    resize(100, 50);
    assert.strictEqual(currentWidth, 320);
    assert.strictEqual(currentHeight, 180);
    resize(3e3, 2e3);
    assert.strictEqual(currentWidth, winWidth - 16);
    assert.strictEqual(currentHeight, winHeight - 16);
    assert.strictEqual(currentLeft, 8);
    assert.strictEqual(currentTop, 8);
    currentWidth = 360;
    currentHeight = 210;
    fitPreviewToViewport();
    assert.strictEqual(currentWidth, 360);
    assert.strictEqual(currentHeight, 210);
    const stepNormal = 10;
    resize(currentWidth + stepNormal, currentHeight + stepNormal);
    assert.strictEqual(currentWidth, 370);
    assert.strictEqual(currentHeight, 220);
    const stepShift = 40;
    resize(currentWidth - stepShift, currentHeight - stepShift);
    assert.strictEqual(currentWidth, 330);
    assert.strictEqual(currentHeight, 180);
    const isDragBlocked = (target) => {
      return target.tagName === "BUTTON" || target.closest("button") || target.tagName === "INPUT" || target.closest(".preview-progress-track") || target.closest(".preview-open-yt") || target.className.includes("preview-vol-slider") || target.className.includes("preview-resize-handle") || target.closest(".preview-resize-handle");
    };
    const handleElement = {
      tagName: "BUTTON",
      className: "preview-resize-handle",
      closest: (selector) => selector === "button" || selector === ".preview-resize-handle"
    };
    assert.strictEqual(isDragBlocked(handleElement), true);
    const titleBarElement = {
      tagName: "DIV",
      className: "preview-top-bar",
      closest: () => false
    };
    assert.strictEqual(isDragBlocked(titleBarElement), false);
  });
});
