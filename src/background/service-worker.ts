import { TabManager } from './tab-manager.js';
import {
  CommandMessage,
  ExtensionResponse,
  SearchResultItem,
  StateUpdatePayload,
  YouTubePlaybackState
} from '../types/messages.js';

const tabManager = new TabManager();

function extractRunsText(obj: any): string {
  if (!obj) return '';
  if (typeof obj.simpleText === 'string') return obj.simpleText;
  if (Array.isArray(obj.runs)) {
    return obj.runs.map((r: any) => r?.text || '').join('');
  }
  if (obj.accessibility?.accessibilityData?.label) {
    return obj.accessibility.accessibilityData.label;
  }
  return '';
}

function parseSearchResultItem(item: any): SearchResultItem | null {
  if (!item) return null;

  // 1. Channel Renderer (Channels, Verified Artists)
  if (item.channelRenderer && item.channelRenderer.channelId) {
    const cr = item.channelRenderer;
    const title = extractRunsText(cr.title) || 'YouTube Channel';
    const subs = extractRunsText(cr.subscriberCountText) || extractRunsText(cr.videoCountText) || 'Channel';
    const thumbnails = cr.thumbnail?.thumbnails || [];
    const thumbnailUrl = thumbnails[thumbnails.length - 1]?.url || 'https://www.gstatic.com/youtube/media/ytm/images/channel-empty-state.png';
    const rawUrl = cr.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || `/channel/${cr.channelId}`;
    const url = rawUrl.startsWith('http') ? rawUrl : `https://www.youtube.com${rawUrl}`;

    return {
      videoId: '',
      title,
      channel: 'Verified Channel',
      thumbnailUrl,
      subscribersText: subs,
      badgeText: 'CHANNEL',
      itemType: 'channel',
      url
    };
  }

  // 2. Playlist / Radio Mix Renderer
  const pr = item.playlistRenderer || item.radioRenderer;
  if (pr && pr.playlistId) {
    const title = extractRunsText(pr.title) || 'YouTube Playlist';
    const channel = extractRunsText(pr.longBylineText) || extractRunsText(pr.shortBylineText) || 'Playlist / Mix';
    const thumbList = pr.thumbnails?.[0]?.thumbnails || pr.thumbnail?.thumbnails || [];
    const thumbnailUrl = thumbList[thumbList.length - 1]?.url || 'https://www.gstatic.com/youtube/media/ytm/images/channel-empty-state.png';
    const count = extractRunsText(pr.videoCountText) || (pr.videoCount ? `${pr.videoCount} videos` : 'Playlist');
    const rawUrl = pr.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || `/playlist?list=${pr.playlistId}`;
    const url = rawUrl.startsWith('http') ? rawUrl : `https://www.youtube.com${rawUrl}`;
    const videoId = pr.navigationEndpoint?.watchEndpoint?.videoId || '';

    return {
      videoId,
      title,
      channel,
      thumbnailUrl,
      viewsText: count,
      badgeText: 'PLAYLIST',
      itemType: 'playlist',
      url
    };
  }

  // 3. Video Renderer (Songs, Videos, Streams)
  const vr = item.videoRenderer;
  if (vr && vr.videoId) {
    const videoId = vr.videoId;
    const title = extractRunsText(vr.title) || 'YouTube Video';
    const channel = extractRunsText(vr.ownerText) || extractRunsText(vr.longBylineText) || extractRunsText(vr.shortBylineText) || 'YouTube';
    const thumbnails = vr.thumbnail?.thumbnails || [];
    const thumbnailUrl = thumbnails[thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const durationText = extractRunsText(vr.lengthText) || '';
    const viewsText = extractRunsText(vr.shortViewCountText) || extractRunsText(vr.viewCountText) || '';
    const badge = vr.badges?.[0]?.metadataBadgeRenderer?.label || (vr.badges?.[0]?.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW' ? 'LIVE' : undefined);

    return {
      videoId,
      title,
      channel,
      thumbnailUrl,
      durationText,
      viewsText,
      badgeText: badge,
      itemType: 'video',
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  }

  return null;
}

async function searchYouTubeVideos(query: string): Promise<SearchResultItem[]> {
  try {
    const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const results: SearchResultItem[] = [];
    const ytInitialDataMatch =
      html.match(/var\s+ytInitialData\s*=\s*({.+?});<\/script>/s) ||
      html.match(/window\["ytInitialData"\]\s*=\s*({.+?});/s);

    if (ytInitialDataMatch && ytInitialDataMatch[1]) {
      try {
        const data = JSON.parse(ytInitialDataMatch[1]);
        const sections =
          data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

        for (const section of sections) {
          const items = section?.itemSectionRenderer?.contents || [];
          for (const item of items) {
            // Unpack shelfRenderer if present (e.g. "Latest from...", "Trending Songs")
            if (item.shelfRenderer) {
              const subItems =
                item.shelfRenderer?.content?.verticalListRenderer?.items ||
                item.shelfRenderer?.content?.expandedShelfContentsRenderer?.items ||
                [];
              for (const subItem of subItems) {
                const parsedSub = parseSearchResultItem(subItem);
                if (parsedSub) {
                  results.push(parsedSub);
                  if (results.length >= 40) break;
                }
              }
              if (results.length >= 40) break;
              continue;
            }

            const parsed = parseSearchResultItem(item);
            if (parsed) {
              results.push(parsed);
              if (results.length >= 40) break;
            }
          }
          if (results.length >= 40) break;
        }
      } catch {}
    }

    // Fallback if scraping yielded no items: query Google Suggest API
    if (results.length === 0) {
      const suggestRes = await fetch(
        `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`
      );
      if (suggestRes.ok) {
        const text = await suggestRes.text();
        const jsonMatch = text.match(/window\.google\.ac\.h\((.*)\)/) || text.match(/\((.*)\)/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1]);
          const suggestions: string[] = (parsed?.[1] || []).map((s: any) => s[0]).filter(Boolean);
          for (const s of suggestions.slice(0, 15)) {
            results.push({
              videoId: '',
              title: s,
              channel: 'Search Suggestion',
              thumbnailUrl: 'https://www.gstatic.com/youtube/media/ytm/images/channel-empty-state.png',
              itemType: 'video',
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(s)}`
            });
          }
        }
      }
    }

    return results;
  } catch (err) {
    console.error('YouTube search error:', err);
    return [];
  }
}

// Throttle broadcast updates so high-frequency time updates don't overwhelm messaging
let lastBroadcastTime = 0;
let pendingBroadcastTimer: ReturnType<typeof setTimeout> | null = null;
const BROADCAST_THROTTLE_MS = 250;

/**
 * Broadcasts playback state update to all active normal webpage tabs.
 */
function broadcastState(immediate = false): void {
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
    if (chrome.runtime.lastError || !tabs) return;

    for (const tab of tabs) {
      if (tab.id && tab.url && !isYouTubeUrl(tab.url)) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'STATE_UPDATE',
          payload
        }).catch(() => {
          // Content script may not be injected or ready on this tab, ignore silently
        });
      }
    }
  });
}

function isYouTubeUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.startsWith('https://www.youtube.com/') ||
    url.startsWith('https://youtube.com/') ||
    url.startsWith('https://m.youtube.com/')
  );
}

/**
 * Scan open tabs on worker startup to detect any existing YouTube tabs.
 */
function discoverYouTubeTabs(): void {
  chrome.tabs.query({}, (tabs) => {
    if (chrome.runtime.lastError || !tabs) return;

    for (const tab of tabs) {
      if (tab.id && isYouTubeUrl(tab.url)) {
        tabManager.registerTab(tab.id, tab.title || 'YouTube', tab.url);
        // Ping YouTube tab content script to ask for immediate state
        chrome.tabs.sendMessage(tab.id, { type: 'GET_STATE' }).catch(() => {
          // Tab might still be loading
        });
      }
    }
    broadcastState(true);
  });
}

/**
 * Automatically inject content scripts into all already-open tabs on install/reload
 */
function injectIntoExistingTabs(): void {
  chrome.tabs.query({}, (tabs) => {
    if (chrome.runtime.lastError || !tabs) return;

    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;
      if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) continue;

      if (isYouTubeUrl(tab.url)) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          files: ['content/youtube-main-world.js']
        }).catch(() => {});

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/youtube-content.js']
        }).catch(() => {});
      } else {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/control-bar.js']
        }).catch(() => {});
      }
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  injectIntoExistingTabs();
  discoverYouTubeTabs();
});

// Track tab closure
chrome.tabs.onRemoved.addListener((tabId) => {
  tabManager.removeTab(tabId);
  broadcastState(true);
});

// Track tab URL updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    if (isYouTubeUrl(changeInfo.url)) {
      tabManager.registerTab(tabId, tab.title || 'YouTube', changeInfo.url);
    } else {
      tabManager.removeTab(tabId);
    }
    broadcastState(true);
  } else if (changeInfo.title && isYouTubeUrl(tab.url)) {
    // Title might have updated before full metadata event
    const currentState = tabManager.getTargetState();
    if (currentState && currentState.tabId === tabId && (!currentState.title || currentState.title === 'YouTube')) {
      tabManager.updateTabState(tabId, {
        ...currentState,
        title: changeInfo.title.replace(/ - YouTube$/, '')
      });
      broadcastState(true);
    }
  }
});

// Central message dispatcher
chrome.runtime.onMessage.addListener((
  message: CommandMessage,
  sender,
  sendResponse: (response: ExtensionResponse) => void
) => {
  const { type, payload } = message;

  // 1. Messages sent from YouTube Content Script
  if (type === 'STATE_UPDATE' && sender.tab?.id) {
    const state = payload?.state as YouTubePlaybackState;
    if (state) {
      tabManager.updateTabState(sender.tab.id, state);
      broadcastState();
    }
    sendResponse({ success: true });
    return true;
  }

  // 2. Control bar requests state
  if (type === 'GET_STATE') {
    sendResponse({
      success: true,
      data: tabManager.getFullPayload()
    });
    return true;
  }

  // 3. Request tab list
  if (type === 'GET_TABS') {
    sendResponse({
      success: true,
      data: tabManager.getAllTabsInfo()
    });
    return true;
  }

  // Handle bar visibility
  if (type === 'GET_BAR_VISIBILITY') {
    chrome.storage.local.get({ barEnabled: true }, (res) => {
      sendResponse({ success: true, data: { enabled: res.barEnabled } });
    });
    return true;
  }

  if (type === 'SET_BAR_VISIBILITY') {
    const enabled = Boolean(payload?.enabled);
    chrome.storage.local.set({ barEnabled: enabled }, () => {
      // Broadcast to all open webpage tabs
      chrome.tabs.query({}, (tabs) => {
        if (!tabs) return;
        for (const tab of tabs) {
          if (tab.id && tab.url && !isYouTubeUrl(tab.url)) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'BAR_VISIBILITY_CHANGED',
              payload: { enabled }
            }).catch(() => {});
          }
        }
      });
      sendResponse({ success: true, data: { enabled } });
    });
    return true;
  }

  // 4. User selects target YouTube tab from dropdown or popup
  if (type === 'SELECT_TARGET_TAB') {
    const tabId = payload?.tabId;
    if (typeof tabId === 'number' && tabManager.setUserSelectedTab(tabId)) {
      broadcastState(true);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Invalid tab ID' });
    }
    return true;
  }

  // 5. Search YouTube
  if (type === 'SEARCH_YOUTUBE') {
    const query = String(payload?.query || '').trim();
    if (!query) {
      sendResponse({ success: true, data: [] });
      return true;
    }

    searchYouTubeVideos(query)
      .then((results) => {
        sendResponse({ success: true, data: results });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err?.message || 'Search failed' });
      });
    return true;
  }

  // 6. Playback commands targeted at the active YouTube tab
  const targetTabId = tabManager.getTargetTabId();

  // If command is to play a queue item / searched video and no YouTube tab is currently open:
  if (type === 'PLAY_QUEUE_ITEM' && payload?.url) {
    if (!targetTabId) {
      chrome.tabs.create({ url: payload.url, active: false }, (newTab) => {
        if (newTab && newTab.id) {
          tabManager.registerTab(newTab.id, 'YouTube', payload.url);
          tabManager.setUserSelectedTab(newTab.id);
        }
        sendResponse({ success: true });
      });
      return true;
    }

    chrome.tabs.sendMessage(targetTabId, message).then((res) => {
      sendResponse(res || { success: true });
    }).catch(() => {
      // Fallback: update YouTube tab URL without bringing it to focus (active: false)
      chrome.tabs.update(targetTabId, { url: payload.url, active: false }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (!targetTabId) {
    sendResponse({ success: false, error: 'No active YouTube tab found' });
    return true;
  }

  // If command is to set playback resolution:
  if (type === 'SET_QUALITY' && payload?.quality) {
    chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      world: 'MAIN',
      func: (q: string) => {
        const p = (document.getElementById('movie_player') || document.querySelector('.html5-video-player')) as any;
        if (p) {
          if (typeof p.setPlaybackQualityRange === 'function') p.setPlaybackQualityRange(q, q);
          if (typeof p.setPlaybackQuality === 'function') p.setPlaybackQuality(q);
        }
      },
      args: [payload.quality]
    }).catch(() => {});
  }

  // Forward command to the target YouTube tab without switching user's tab focus
  chrome.tabs.sendMessage(targetTabId, message).then((res) => {
    sendResponse(res || { success: true });
  }).catch((err) => {
    sendResponse({ success: false, error: err?.message || 'Failed to reach YouTube player' });
  });

  return true; // Keep message channel open for async response
});

// Initialize on load
discoverYouTubeTabs();

