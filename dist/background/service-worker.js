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

// src/background/service-worker.ts
var tabManager = new TabManager();
function extractRunsText(obj) {
  if (!obj)
    return "";
  if (typeof obj.simpleText === "string")
    return obj.simpleText;
  if (Array.isArray(obj.runs)) {
    return obj.runs.map((r) => r?.text || "").join("");
  }
  if (obj.accessibility?.accessibilityData?.label) {
    return obj.accessibility.accessibilityData.label;
  }
  return "";
}
function parseSearchResultItem(item) {
  if (!item)
    return null;
  if (item.channelRenderer && item.channelRenderer.channelId) {
    const cr = item.channelRenderer;
    const title = extractRunsText(cr.title) || "YouTube Channel";
    const subs = extractRunsText(cr.subscriberCountText) || extractRunsText(cr.videoCountText) || "Channel";
    const thumbnails = cr.thumbnail?.thumbnails || [];
    const thumbnailUrl = thumbnails[thumbnails.length - 1]?.url || "https://www.gstatic.com/youtube/media/ytm/images/channel-empty-state.png";
    const rawUrl = cr.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || `/channel/${cr.channelId}`;
    const url = rawUrl.startsWith("http") ? rawUrl : `https://www.youtube.com${rawUrl}`;
    return {
      videoId: "",
      title,
      channel: "Verified Channel",
      thumbnailUrl,
      subscribersText: subs,
      badgeText: "CHANNEL",
      itemType: "channel",
      url
    };
  }
  const pr = item.playlistRenderer || item.radioRenderer;
  if (pr && pr.playlistId) {
    const title = extractRunsText(pr.title) || "YouTube Playlist";
    const channel = extractRunsText(pr.longBylineText) || extractRunsText(pr.shortBylineText) || "Playlist / Mix";
    const thumbList = pr.thumbnails?.[0]?.thumbnails || pr.thumbnail?.thumbnails || [];
    const thumbnailUrl = thumbList[thumbList.length - 1]?.url || "https://www.gstatic.com/youtube/media/ytm/images/channel-empty-state.png";
    const count = extractRunsText(pr.videoCountText) || (pr.videoCount ? `${pr.videoCount} videos` : "Playlist");
    const rawUrl = pr.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || `/playlist?list=${pr.playlistId}`;
    const url = rawUrl.startsWith("http") ? rawUrl : `https://www.youtube.com${rawUrl}`;
    const videoId = pr.navigationEndpoint?.watchEndpoint?.videoId || "";
    return {
      videoId,
      title,
      channel,
      thumbnailUrl,
      viewsText: count,
      badgeText: "PLAYLIST",
      itemType: "playlist",
      url
    };
  }
  const vr = item.videoRenderer;
  if (vr && vr.videoId) {
    const videoId = vr.videoId;
    const title = extractRunsText(vr.title) || "YouTube Video";
    const channel = extractRunsText(vr.ownerText) || extractRunsText(vr.longBylineText) || extractRunsText(vr.shortBylineText) || "YouTube";
    const thumbnails = vr.thumbnail?.thumbnails || [];
    const thumbnailUrl = thumbnails[thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const durationText = extractRunsText(vr.lengthText) || "";
    const viewsText = extractRunsText(vr.shortViewCountText) || extractRunsText(vr.viewCountText) || "";
    const badge = vr.badges?.[0]?.metadataBadgeRenderer?.label || (vr.badges?.[0]?.metadataBadgeRenderer?.style === "BADGE_STYLE_TYPE_LIVE_NOW" ? "LIVE" : void 0);
    return {
      videoId,
      title,
      channel,
      thumbnailUrl,
      durationText,
      viewsText,
      badgeText: badge,
      itemType: "video",
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  }
  return null;
}
async function searchYouTubeVideos(query) {
  try {
    const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
    if (!response.ok)
      throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const results = [];
    const ytInitialDataMatch = html.match(/var\s+ytInitialData\s*=\s*({.+?});<\/script>/s) || html.match(/window\["ytInitialData"\]\s*=\s*({.+?});/s);
    if (ytInitialDataMatch && ytInitialDataMatch[1]) {
      try {
        const data = JSON.parse(ytInitialDataMatch[1]);
        const sections = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
        for (const section of sections) {
          const items = section?.itemSectionRenderer?.contents || [];
          for (const item of items) {
            if (item.shelfRenderer) {
              const subItems = item.shelfRenderer?.content?.verticalListRenderer?.items || item.shelfRenderer?.content?.expandedShelfContentsRenderer?.items || [];
              for (const subItem of subItems) {
                const parsedSub = parseSearchResultItem(subItem);
                if (parsedSub) {
                  results.push(parsedSub);
                  if (results.length >= 40)
                    break;
                }
              }
              if (results.length >= 40)
                break;
              continue;
            }
            const parsed = parseSearchResultItem(item);
            if (parsed) {
              results.push(parsed);
              if (results.length >= 40)
                break;
            }
          }
          if (results.length >= 40)
            break;
        }
      } catch {
      }
    }
    if (results.length === 0) {
      const suggestRes = await fetch(
        `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`
      );
      if (suggestRes.ok) {
        const text = await suggestRes.text();
        const jsonMatch = text.match(/window\.google\.ac\.h\((.*)\)/) || text.match(/\((.*)\)/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1]);
          const suggestions = (parsed?.[1] || []).map((s) => s[0]).filter(Boolean);
          for (const s of suggestions.slice(0, 15)) {
            results.push({
              videoId: "",
              title: s,
              channel: "Search Suggestion",
              thumbnailUrl: "https://www.gstatic.com/youtube/media/ytm/images/channel-empty-state.png",
              itemType: "video",
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(s)}`
            });
          }
        }
      }
    }
    return results;
  } catch (err) {
    console.error("YouTube search error:", err);
    return [];
  }
}
var lastBroadcastTime = 0;
var pendingBroadcastTimer = null;
var BROADCAST_THROTTLE_MS = 250;
function broadcastState(immediate = false) {
  const now = Date.now();
  if (!immediate && now - lastBroadcastTime < BROADCAST_THROTTLE_MS) {
    if (!pendingBroadcastTimer) {
      pendingBroadcastTimer = setTimeout(() => {
        pendingBroadcastTimer = null;
        broadcastState(true);
      }, BROADCAST_THROTTLE_MS - (now - lastBroadcastTime));
    }
    return;
  }
  if (pendingBroadcastTimer) {
    clearTimeout(pendingBroadcastTimer);
    pendingBroadcastTimer = null;
  }
  lastBroadcastTime = now;
  const payload = tabManager.getFullPayload();
  chrome.tabs.query({}, (tabs) => {
    if (chrome.runtime.lastError || !tabs)
      return;
    for (const tab of tabs) {
      if (tab.id && tab.url && !isYouTubeUrl(tab.url)) {
        chrome.tabs.sendMessage(tab.id, {
          type: "STATE_UPDATE",
          payload
        }).catch(() => {
        });
      }
    }
  });
}
function isYouTubeUrl(url) {
  if (!url)
    return false;
  return url.startsWith("https://www.youtube.com/") || url.startsWith("https://youtube.com/") || url.startsWith("https://m.youtube.com/");
}
function discoverYouTubeTabs() {
  chrome.tabs.query({}, (tabs) => {
    if (chrome.runtime.lastError || !tabs)
      return;
    for (const tab of tabs) {
      if (tab.id && isYouTubeUrl(tab.url)) {
        tabManager.registerTab(tab.id, tab.title || "YouTube", tab.url);
        chrome.tabs.sendMessage(tab.id, { type: "GET_STATE" }).catch(() => {
        });
      }
    }
    broadcastState(true);
  });
}
function injectIntoExistingTabs() {
  chrome.tabs.query({}, (tabs) => {
    if (chrome.runtime.lastError || !tabs)
      return;
    for (const tab of tabs) {
      if (!tab.id || !tab.url)
        continue;
      if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))
        continue;
      if (isYouTubeUrl(tab.url)) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: "MAIN",
          files: ["content/youtube-main-world.js"]
        }).catch(() => {
        });
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content/youtube-content.js"]
        }).catch(() => {
        });
      } else {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content/control-bar.js"]
        }).catch(() => {
        });
      }
    }
  });
}
chrome.runtime.onInstalled.addListener(() => {
  injectIntoExistingTabs();
  discoverYouTubeTabs();
});
chrome.tabs.onRemoved.addListener((tabId) => {
  tabManager.removeTab(tabId);
  broadcastState(true);
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    if (isYouTubeUrl(changeInfo.url)) {
      tabManager.registerTab(tabId, tab.title || "YouTube", changeInfo.url);
    } else {
      tabManager.removeTab(tabId);
    }
    broadcastState(true);
  } else if (changeInfo.title && isYouTubeUrl(tab.url)) {
    const currentState = tabManager.getTargetState();
    if (currentState && currentState.tabId === tabId && (!currentState.title || currentState.title === "YouTube")) {
      tabManager.updateTabState(tabId, {
        ...currentState,
        title: changeInfo.title.replace(/ - YouTube$/, "")
      });
      broadcastState(true);
    }
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;
  if (type === "STATE_UPDATE" && sender.tab?.id) {
    const state = payload?.state;
    if (state) {
      tabManager.updateTabState(sender.tab.id, state);
      broadcastState();
    }
    sendResponse({ success: true });
    return true;
  }
  if (type === "GET_STATE") {
    sendResponse({
      success: true,
      data: tabManager.getFullPayload()
    });
    return true;
  }
  if (type === "GET_TABS") {
    sendResponse({
      success: true,
      data: tabManager.getAllTabsInfo()
    });
    return true;
  }
  if (type === "GET_BAR_VISIBILITY") {
    chrome.storage.local.get({ barEnabled: true }, (res) => {
      sendResponse({ success: true, data: { enabled: res.barEnabled } });
    });
    return true;
  }
  if (type === "SET_BAR_VISIBILITY") {
    const enabled = Boolean(payload?.enabled);
    chrome.storage.local.set({ barEnabled: enabled }, () => {
      chrome.tabs.query({}, (tabs) => {
        if (!tabs)
          return;
        for (const tab of tabs) {
          if (tab.id && tab.url && !isYouTubeUrl(tab.url)) {
            chrome.tabs.sendMessage(tab.id, {
              type: "BAR_VISIBILITY_CHANGED",
              payload: { enabled }
            }).catch(() => {
            });
          }
        }
      });
      sendResponse({ success: true, data: { enabled } });
    });
    return true;
  }
  if (type === "SELECT_TARGET_TAB") {
    const tabId = payload?.tabId;
    if (typeof tabId === "number" && tabManager.setUserSelectedTab(tabId)) {
      broadcastState(true);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "Invalid tab ID" });
    }
    return true;
  }
  if (type === "SEARCH_YOUTUBE") {
    const query = String(payload?.query || "").trim();
    if (!query) {
      sendResponse({ success: true, data: [] });
      return true;
    }
    searchYouTubeVideos(query).then((results) => {
      sendResponse({ success: true, data: results });
    }).catch((err) => {
      sendResponse({ success: false, error: err?.message || "Search failed" });
    });
    return true;
  }
  const targetTabId = tabManager.getTargetTabId();
  if (type === "FOCUS_YOUTUBE_TAB") {
    if (targetTabId == null) {
      sendResponse({ success: false, error: "No active YouTube tab found" });
      return true;
    }
    chrome.tabs.update(targetTabId, { active: true }).then((tab) => chrome.windows.update(tab.windowId, { focused: true })).then(() => sendResponse({ success: true })).catch((error) => sendResponse({ success: false, error: error?.message || "Unable to switch to YouTube" }));
    return true;
  }
  if (type === "PLAY_QUEUE_ITEM" && payload?.url) {
    if (!targetTabId) {
      chrome.tabs.create({ url: payload.url, active: false }, (newTab) => {
        if (newTab && newTab.id) {
          tabManager.registerTab(newTab.id, "YouTube", payload.url);
          tabManager.setUserSelectedTab(newTab.id);
        }
        sendResponse({ success: true });
      });
      return true;
    }
    chrome.tabs.sendMessage(targetTabId, message).then((res) => {
      sendResponse(res || { success: true });
    }).catch(() => {
      chrome.tabs.update(targetTabId, { url: payload.url, active: false }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  if (!targetTabId) {
    sendResponse({ success: false, error: "No active YouTube tab found" });
    return true;
  }
  if (type === "SET_QUALITY" && payload?.quality) {
    chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      world: "MAIN",
      func: (q) => {
        const p = document.getElementById("movie_player") || document.querySelector(".html5-video-player");
        if (p) {
          if (typeof p.setPlaybackQualityRange === "function")
            p.setPlaybackQualityRange(q, q);
          if (typeof p.setPlaybackQuality === "function")
            p.setPlaybackQuality(q);
        }
      },
      args: [payload.quality]
    }).catch(() => {
    });
  }
  chrome.tabs.sendMessage(targetTabId, message).then((res) => {
    sendResponse(res || { success: true });
  }).catch((err) => {
    sendResponse({ success: false, error: err?.message || "Failed to reach YouTube player" });
  });
  return true;
});
discoverYouTubeTabs();
