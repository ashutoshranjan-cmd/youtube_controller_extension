import {
  CommandMessage,
  StateUpdatePayload,
  YouTubePlaybackState,
  YouTubeTabInfo
} from '../types/messages.js';

let currentState: YouTubePlaybackState | null = null;
let currentTabs: YouTubeTabInfo[] = [];

const tabCount = document.getElementById('tabCount') as HTMLElement;
const tabSelectSection = document.getElementById('tabSelectSection') as HTMLElement;
const tabSelect = document.getElementById('tabSelect') as HTMLSelectElement;
const popupThumb = document.getElementById('popupThumb') as HTMLImageElement;
const popupTitle = document.getElementById('popupTitle') as HTMLElement;
const popupChannel = document.getElementById('popupChannel') as HTMLElement;
const popupSeek = document.getElementById('popupSeek') as HTMLInputElement;
const popupCurrentTime = document.getElementById('popupCurrentTime') as HTMLElement;
const popupDuration = document.getElementById('popupDuration') as HTMLElement;
const popupPrev = document.getElementById('popupPrev') as HTMLButtonElement;
const popupSkipBack = document.getElementById('popupSkipBack') as HTMLButtonElement;
const popupPlayPause = document.getElementById('popupPlayPause') as HTMLButtonElement;
const popupSkipFwd = document.getElementById('popupSkipFwd') as HTMLButtonElement;
const popupNext = document.getElementById('popupNext') as HTMLButtonElement;
const popupMute = document.getElementById('popupMute') as HTMLButtonElement;
const popupVolume = document.getElementById('popupVolume') as HTMLInputElement;
const barToggle = document.getElementById('barToggle') as HTMLInputElement;
const barStatusText = document.getElementById('barStatusText') as HTMLElement;

popupSkipBack.addEventListener('click', () => sendCommand({ type: 'SEEK_RELATIVE', payload: { delta: -10 } }));
popupSkipFwd.addEventListener('click', () => sendCommand({ type: 'SEEK_RELATIVE', payload: { delta: 10 } }));

function updateBarStatus(enabled: boolean): void {
  barToggle.checked = enabled;
  barStatusText.textContent = enabled ? 'Visible on all tabs' : 'Hidden from webpages';
}

barToggle.addEventListener('change', () => {
  const enabled = barToggle.checked;
  updateBarStatus(enabled);
  chrome.runtime.sendMessage({
    type: 'SET_BAR_VISIBILITY',
    payload: { enabled }
  }).catch(() => {});
});

// Fetch initial bar visibility preference
chrome.runtime.sendMessage({ type: 'GET_BAR_VISIBILITY' }, (res) => {
  if (res && res.success && typeof res.data?.enabled === 'boolean') {
    updateBarStatus(res.data.enabled);
  }
});

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function updateUI(): void {
  tabCount.textContent = `${currentTabs.length} tab${currentTabs.length === 1 ? '' : 's'}`;

  // Tab selector
  if (currentTabs.length > 1) {
    tabSelectSection.style.display = 'flex';
    tabSelect.innerHTML = '';
    for (const tab of currentTabs) {
      const opt = document.createElement('option');
      opt.value = String(tab.tabId);
      opt.textContent = `${tab.isPlaying ? '▶ ' : '⏸ '}${tab.title}`;
      opt.selected = tab.isTarget;
      tabSelect.appendChild(opt);
    }
  } else {
    tabSelectSection.style.display = 'none';
  }

  if (!currentState) {
    popupTitle.textContent = currentTabs.length > 0 ? 'YouTube connected (Ready)' : 'No YouTube tabs open';
    popupChannel.textContent = currentTabs.length > 0 ? 'Start playback in YouTube' : 'Open YouTube to start controlling';
    popupThumb.style.display = 'none';
    popupPlayPause.textContent = '▶';
    popupCurrentTime.textContent = '0:00';
    popupDuration.textContent = '0:00';
    popupSeek.value = '0';
    popupPrev.disabled = true;
    popupNext.disabled = true;
    return;
  }

  popupTitle.textContent = currentState.title || 'YouTube Video';
  popupChannel.textContent = currentState.channel || '';

  if (currentState.thumbnailUrl) {
    popupThumb.src = currentState.thumbnailUrl;
    popupThumb.style.display = 'block';
  } else {
    popupThumb.style.display = 'none';
  }

  popupPlayPause.textContent = currentState.isPlaying ? '❚❚' : '▶';
  popupCurrentTime.textContent = formatTime(currentState.currentTime);
  popupDuration.textContent = currentState.isLive ? 'LIVE' : formatTime(currentState.duration);

  if (currentState.duration > 0 && !currentState.isLive) {
    popupSeek.value = String(Math.round((currentState.currentTime / currentState.duration) * 100));
  } else {
    popupSeek.value = '0';
  }

  popupPrev.disabled = !currentState.hasPrevious;
  popupNext.disabled = !currentState.hasNext;

  popupVolume.value = String(currentState.isMuted ? 0 : currentState.volume);
  popupMute.textContent = (currentState.isMuted || currentState.volume === 0) ? '🔇' : '🔊';
}

function sendCommand(msg: CommandMessage): void {
  chrome.runtime.sendMessage(msg).catch(() => {});
}

// Event Listeners
popupPlayPause.addEventListener('click', () => sendCommand({ type: 'TOGGLE_PLAY' }));
popupNext.addEventListener('click', () => sendCommand({ type: 'NEXT' }));
popupPrev.addEventListener('click', () => sendCommand({ type: 'PREVIOUS' }));
popupMute.addEventListener('click', () => sendCommand({ type: 'TOGGLE_MUTE' }));

popupVolume.addEventListener('input', () => {
  const vol = parseInt(popupVolume.value, 10);
  sendCommand({ type: 'SET_VOLUME', payload: { volume: vol } });
});

popupSeek.addEventListener('change', () => {
  if (currentState && currentState.duration > 0) {
    const ratio = parseInt(popupSeek.value, 10) / 100;
    sendCommand({ type: 'SEEK', payload: { time: ratio * currentState.duration } });
  }
});

tabSelect.addEventListener('change', () => {
  const tabId = parseInt(tabSelect.value, 10);
  sendCommand({ type: 'SELECT_TARGET_TAB', payload: { tabId } });
});

// Real-time message listener
chrome.runtime.onMessage.addListener((message: CommandMessage) => {
  if (message.type === 'STATE_UPDATE') {
    const payload = message.payload as StateUpdatePayload;
    if (payload) {
      currentState = payload.state;
      currentTabs = payload.tabs || [];
      updateUI();
    }
  }
});

// Initial handshake
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
  if (chrome.runtime.lastError) return;
  if (response && response.success && response.data) {
    const { state, tabs } = response.data as StateUpdatePayload;
    currentState = state;
    currentTabs = tabs || [];
    updateUI();
  }
});

