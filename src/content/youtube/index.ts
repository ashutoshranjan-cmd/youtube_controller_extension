import { YouTubePlayerController } from './player.js';
import { YouTubeMetadataExtractor } from './metadata.js';
import { YouTubeQueueExtractor } from './queue.js';
import { YouTubeSPAObserver } from './spa-observer.js';
import {
  CommandMessage,
  ExtensionResponse,
  QualityOption,
  YouTubePlaybackState
} from '../../types/messages.js';

const player = new YouTubePlayerController();
const metadataExtractor = new YouTubeMetadataExtractor();
const queueExtractor = new YouTubeQueueExtractor();

let currentQuality = 'auto';
let availableQualities: QualityOption[] = [
  { quality: 'auto', label: 'Auto', isHD: false },
  { quality: 'hd1080', label: '1080p HD', isHD: true },
  { quality: 'hd720', label: '720p HD', isHD: true },
  { quality: 'large', label: '480p', isHD: false },
  { quality: 'medium', label: '360p', isHD: false },
  { quality: 'small', label: '240p', isHD: false }
];

// Listen for quality broadcasts from the main-world script
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || event.data.source !== 'YT_MAIN_WORLD_QUALITY') {
    return;
  }
  if (event.data.type === 'QUALITY_UPDATE') {
    if (event.data.currentQuality) {
      currentQuality = event.data.currentQuality;
    }
    if (Array.isArray(event.data.availableQualities) && event.data.availableQualities.length > 0) {
      availableQualities = event.data.availableQualities;
    }
    sendStateUpdate();
  }
});

function getCurrentState(): YouTubePlaybackState {
  const video = player.getVideoElement();
  const metadata = metadataExtractor.extract(video);
  const queueResult = queueExtractor.extractQueue();

  const currentTime = video ? video.currentTime : 0;
  const duration = video && isFinite(video.duration) ? video.duration : 0;
  const isPlaying = video ? (!video.paused && !video.ended && video.readyState > 2) : false;
  const volume = video ? Math.round(video.volume * 100) : 100;
  const isMuted = video ? video.muted : false;

  return {
    tabId: -1, // Populated by background service worker based on sender.tab.id
    videoId: metadata.videoId,
    title: metadata.title,
    channel: metadata.channel,
    thumbnailUrl: metadata.thumbnailUrl,
    currentTime,
    duration,
    isPlaying,
    volume,
    isMuted,
    hasNext: player.hasNext() || queueResult.items.length > 0,
    hasPrevious: player.hasPrevious(),
    queue: queueResult.items,
    queueAvailable: queueResult.available,
    isLive: metadata.isLive,
    isLiked: player.isLiked(),
    currentQuality,
    availableQualities,
    lastUpdated: Date.now()
  };
}

function sendStateUpdate(): void {
  try {
    const state = getCurrentState();
    chrome.runtime.sendMessage({
      type: 'STATE_UPDATE',
      payload: { state }
    }).catch(() => {
      // Extension reloaded or service worker sleeping
    });
  } catch {
    // Context invalidated during extension reload
  }
}

// Observe SPA navigation and playback changes
new YouTubeSPAObserver(() => {
  sendStateUpdate();
});

// Listen for playback commands routed from the control bar via service worker
chrome.runtime.onMessage.addListener((
  message: CommandMessage,
  _sender,
  sendResponse: (response: ExtensionResponse) => void
) => {
  const { type, payload } = message;

  switch (type) {
    case 'GET_STATE': {
      const state = getCurrentState();
      sendResponse({ success: true, data: state });
      sendStateUpdate();
      return true;
    }

    case 'TOGGLE_PLAY': {
      const success = player.togglePlay();
      setTimeout(sendStateUpdate, 50);
      sendResponse({ success });
      return true;
    }

    case 'PLAY': {
      const success = player.play();
      setTimeout(sendStateUpdate, 50);
      sendResponse({ success });
      return true;
    }

    case 'PAUSE': {
      const success = player.pause();
      setTimeout(sendStateUpdate, 50);
      sendResponse({ success });
      return true;
    }

    case 'NEXT': {
      const success = player.next();
      setTimeout(sendStateUpdate, 150);
      sendResponse({ success });
      return true;
    }

    case 'PREVIOUS': {
      const success = player.previous();
      setTimeout(sendStateUpdate, 150);
      sendResponse({ success });
      return true;
    }

    case 'SEEK': {
      const time = payload?.time;
      const success = typeof time === 'number' ? player.seek(time) : false;
      setTimeout(sendStateUpdate, 50);
      sendResponse({ success });
      return true;
    }

    case 'SEEK_RELATIVE': {
      const delta = payload?.delta || 0;
      const success = player.seekRelative(delta);
      setTimeout(sendStateUpdate, 50);
      sendResponse({ success });
      return true;
    }

    case 'SET_VOLUME': {
      const volume = payload?.volume;
      const success = typeof volume === 'number' ? player.setVolume(volume) : false;
      setTimeout(sendStateUpdate, 50);
      sendResponse({ success });
      return true;
    }

    case 'STEP_VOLUME': {
      const step = payload?.step || 0;
      const success = player.stepVolume(step);
      setTimeout(sendStateUpdate, 50);
      sendResponse({ success });
      return true;
    }

    case 'TOGGLE_MUTE': {
      const success = player.toggleMute();
      setTimeout(sendStateUpdate, 50);
      sendResponse({ success });
      return true;
    }

    case 'TOGGLE_PIP': {
      player.togglePiP().then((success) => {
        sendResponse({ success });
      });
      return true;
    }

    case 'TOGGLE_LIKE': {
      const success = player.toggleLike();
      setTimeout(sendStateUpdate, 150);
      sendResponse({ success });
      return true;
    }

    case 'SET_QUALITY': {
      const targetQuality = payload?.quality;
      const success = typeof targetQuality === 'string' ? player.setQuality(targetQuality) : false;
      if (typeof targetQuality === 'string') {
        currentQuality = targetQuality;
      }
      setTimeout(sendStateUpdate, 150);
      sendResponse({ success });
      return true;
    }

    case 'TOGGLE_LOOP': {
      const success = player.toggleLoop();
      setTimeout(sendStateUpdate, 50);
      sendResponse({ success });
      return true;
    }

    case 'PLAY_QUEUE_ITEM': {
      const { url, videoId } = payload || {};
      const success = queueExtractor.playItem(url, videoId);
      setTimeout(sendStateUpdate, 200);
      sendResponse({ success });
      return true;
    }

    default:
      sendResponse({ success: false, error: `Unknown command: ${type}` });
      return true;
  }
});

// Initial handshake
sendStateUpdate();

