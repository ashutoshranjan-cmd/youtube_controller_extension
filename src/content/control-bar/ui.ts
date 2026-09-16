import { CONTROL_BAR_STYLES } from './styles.js';
import { ControlBarStateStore } from './state.js';
import {
  CommandMessage,
  QualityOption,
  QueueItem,
  SearchResultItem,
  YouTubeTabInfo
} from '../../types/messages.js';

export class ControlBarUI {
  private hostElement: HTMLElement;
  private shadow: ShadowRoot;
  private store: ControlBarStateStore;

  // Cached DOM elements
  private container!: HTMLElement;
  private floatingPill!: HTMLElement;
  private thumbWrap!: HTMLElement;
  private thumbImg!: HTMLImageElement;
  private titleEl!: HTMLElement;
  private channelEl!: HTMLElement;
  private likeBtn!: HTMLButtonElement;
  private thumbOutlineIcon!: SVGElement;
  private thumbFilledIcon!: SVGElement;
  private dockToast!: HTMLElement;
  private toastMsgEl!: HTMLElement;
  private toastIconEl!: HTMLElement;
  private toastTimer: any = null;

  private hdBtn!: HTMLButtonElement;
  private qualityPopover!: HTMLElement;
  private qualityListEl!: HTMLElement;
  private qualityTagEl!: HTMLElement;
  private isQualityOpen = false;

  // Video Preview Window & Controls
  private videoPreviewWindow!: HTMLElement;
  private previewTopBar!: HTMLElement;
  private previewThumbImg!: HTMLImageElement;
  private previewTitleText!: HTMLElement;
  private previewLikeBtn!: HTMLButtonElement;
  private prevThumbOutlineIcon!: SVGElement;
  private prevThumbFilledIcon!: SVGElement;
  private previewFullscreenBtn!: HTMLButtonElement;
  private previewCloseBtn!: HTMLButtonElement;
  private previewPrevBtn!: HTMLButtonElement;
  private previewSkipBackBtn!: HTMLButtonElement;
  private previewPlayBtn!: HTMLButtonElement;
  private previewPlayIcon!: SVGElement;
  private previewPauseIcon!: SVGElement;
  private previewSkipFwdBtn!: HTMLButtonElement;
  private previewNextBtn!: HTMLButtonElement;
  private previewProgressTrack!: HTMLElement;
  private previewProgressFill!: HTMLElement;
  private previewTimeEl!: HTMLElement;
  private previewVolBtn!: HTMLButtonElement;
  private prevSpeakerIcon!: SVGElement;
  private prevMutedIcon!: SVGElement;
  private previewVolSlider!: HTMLInputElement;
  private previewOpenYt!: HTMLElement;
  private previewToggleBtn!: HTMLButtonElement;
  private isPreviewOpen = false;
  private isPreviewDragging = false;

  // Search Modal Elements
  private searchBtn!: HTMLButtonElement;
  private searchBackdrop!: HTMLElement;
  private searchInput!: HTMLInputElement;
  private searchClearBtn!: HTMLButtonElement;
  private searchCutBtn!: HTMLButtonElement;
  private searchResultsList!: HTMLElement;
  private searchFilterBar!: HTMLElement;
  private searchChipsContainer!: HTMLElement;
  private currentSearchResults: SearchResultItem[] = [];
  private currentSearchFilter: 'all' | 'video' | 'channel' | 'playlist' = 'all';
  private searchDebounceTimer: any = null;
  private isSearchOpen = false;
  private searchRequestId = 0;
  private recentSearches: string[] = [];
  private searchSort: 'relevance' | 'title' = 'relevance';
  private queueSignature = '';
  private qualitySignature = '';
  private queueFilter!: HTMLInputElement;

  private prevBtn!: HTMLButtonElement;
  private skip10BackBtn!: HTMLButtonElement;
  private playPauseBtn!: HTMLButtonElement;
  private playIcon!: SVGElement;
  private pauseIcon!: SVGElement;
  private skip10FwdBtn!: HTMLButtonElement;
  private nextBtn!: HTMLButtonElement;
  private progressContainer!: HTMLElement;
  private progressFill!: HTMLElement;
  private progressThumb!: HTMLElement;
  private progressTooltip!: HTMLElement;
  private currentTimeEl!: HTMLElement;
  private durationTimeEl!: HTMLElement;
  private muteBtn!: HTMLButtonElement;
  private speakerIcon!: SVGElement;
  private mutedIcon!: SVGElement;
  private volDownBtn!: HTMLButtonElement;
  private volUpBtn!: HTMLButtonElement;
  private volumeSlider!: HTMLInputElement;
  private pipBtn!: HTMLButtonElement;
  private queueBtn!: HTMLButtonElement;
  private queuePanel!: HTMLElement;
  private queueList!: HTMLElement;
  private settingsBtn!: HTMLButtonElement;
  private settingsPopover!: HTMLElement;
  private barToggleInput!: HTMLInputElement;
  private hideBtn!: HTMLButtonElement;
  private shuffleBtn!: HTMLButtonElement;
  private loopBtn!: HTMLButtonElement;

  // Settings popover views
  private popoverMainView!: HTMLElement;
  private popoverShortcutsView!: HTMLElement;
  private popoverAppearanceView!: HTMLElement;
  private hotkeysToggleInput!: HTMLInputElement;
  private darkThemeBtn!: HTMLButtonElement;
  private lightThemeBtn!: HTMLButtonElement;

  private isQueueOpen = false;
  private isSettingsOpen = false;
  private isPillMode = false;
  private isAnimatingPill = false;
  private isLoadingTrack = false;
  private loadingTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastTrackId: string | null = null;
  private isLiked = false;
  private pendingLike: { videoId: string; liked: boolean; expires: number } | null = null;
  private isShuffleActive = false;
  private isLoopActive = false;
  private hotkeysEnabled = true;
  private currentTheme: 'dark' | 'light' = 'dark';

  constructor(store: ControlBarStateStore) {
    this.store = store;

    this.hostElement = document.createElement('yt-global-control-bar');
    this.shadow = this.hostElement.attachShadow({ mode: 'open' });

    this.render();
    this.loadPreferences();
    this.attachEventListeners();
    this.attachKeyboardHotkeys();
    this.mount();

    this.store.subscribe(() => this.updateView());
  }

  private mount(): void {
    if (document.body) {
      document.body.appendChild(this.hostElement);
    } else {
      document.documentElement.appendChild(this.hostElement);
    }
  }

  private loadPreferences(): void {
    try {
      chrome.storage.local.get(['ytTheme', 'ytHotkeys', 'ytPillMode'], (res) => {
        if (res.ytTheme) {
          this.setTheme(res.ytTheme);
        }
        if (typeof res.ytHotkeys === 'boolean') {
          this.hotkeysEnabled = res.ytHotkeys;
          this.hotkeysToggleInput.checked = res.ytHotkeys;
        }
        if (res.ytPillMode) {
          this.setPillMode(true);
        }
      });
    } catch {}
  }

  private render(): void {
    const styleEl = document.createElement('style');
    styleEl.textContent = CONTROL_BAR_STYLES;
    this.shadow.appendChild(styleEl);

    // 1. Minimized Floating Pill Element
    const pill = document.createElement('div');
    pill.className = 'floating-pill';
    pill.title = 'Click to expand YouTube Player';
    pill.innerHTML = `
      <svg width="28" height="20" style="width:28px;height:20px;display:block;" viewBox="0 0 28 20">
        <path fill="#FF0000" d="M27.973 3.123A3.504 3.504 0 0 0 25.5.651C23.32 0 14 0 14 0S4.68 0 2.5.651A3.504 3.504 0 0 0 .027 3.123C0 5.3 0 10 0 10s0 4.7.027 6.877A3.504 3.504 0 0 0 2.5 19.349C4.68 20 14 20 14 20s9.32 0 11.5-.651a3.504 3.504 0 0 0 2.473-2.472C28 14.7 28 10 28 10s0-4.7-.027-6.877z"/>
        <polygon fill="#FFFFFF" points="11.2,14.4 18.2,10 11.2,5.6"/>
      </svg>
      <span class="floating-pill-dot"></span>
      <button class="pill-cut-btn" title="Close player" aria-label="Close">
        <svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    `;
    this.shadow.appendChild(pill);
    this.floatingPill = pill;

    // 2. Main Dock Container
    const wrapper = document.createElement('div');
    wrapper.className = 'bar-container hidden';
    wrapper.innerHTML = `
      <!-- Left Track Info -->
      <div class="left-section">
        <div class="thumbnail-wrap empty" title="Open YouTube">
          <img alt="Thumbnail" />
        </div>
        <div class="track-meta">
          <span class="video-title">YouTube Controller</span>
          <span class="channel-name">Open YouTube to start playing</span>
        </div>
        <!-- YouTube Thumbs Up Like Button -->
        <button class="like-btn" title="Like video" aria-label="Like">
          <!-- Outline Thumb -->
          <svg class="thumb-outline" viewBox="0 0 24 24">
            <path d="M18.77 11h-4.23l1.52-4.94C16.38 5.03 15.54 4 14.38 4c-.58 0-1.14.24-1.52.65L7 11H3v10h4l1 1h11c1.1 0 2-.9 2-2l1-7c.1-.8-.45-1.5-1.23-1.8zM7 20H4v-8h3v8zm13.1-6.84l-.9 6.34c-.05.3-.3.5-.6.5H8.5V11.6l5.2-5.45c.1-.1.2-.15.3-.15.2 0 .4.1.5.25.1.15.1.35.05.5L13.05 12h7.05c.4 0 .7.3.8.7.05.15.05.3 0 .46z"/>
          </svg>
          <!-- Solid Filled Thumb -->
          <svg class="thumb-filled" style="display:none;" viewBox="0 0 24 24">
            <path d="M3 21h3.6V9H3v12zm19-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 1 6.59 7.59C6.22 7.95 6 8.45 6 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
          </svg>
        </button>
      </div>

      <!-- Center Controls with Explicit -10s and +10s Buttons -->
      <!-- Center Controls: Shuffle, Prev, 3D Play/Pause Orb, Next, Loop -->
      <div class="center-section">
        <div class="buttons-group">
          <!-- Shuffle Button -->
          <button class="icon-btn shuffle-btn" title="Shuffle" aria-label="Shuffle">
            <svg viewBox="0 0 24 24">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>

          <!-- Previous with Loading Spinner -->
          <button class="icon-btn prev-btn" title="Previous (Shift+P)" aria-label="Previous">
            <span class="btn-spinner"></span>
            <svg class="btn-icon" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          </button>

          <!-- Explicit 10s Rewind Button (Counter-Clockwise Circular Arrow) -->
          <button class="icon-btn skip-10-btn skip-back-btn" title="Rewind 10 seconds (J / ←)" aria-label="Rewind 10s">
            <svg viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8c0-4.42-3.58-8-8-8z"/>
              <text x="12" y="13.5" font-size="6.5" font-family="system-ui, -apple-system, Roboto, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="middle" fill="currentColor">10</text>
            </svg>
          </button>

          <!-- Glowing Red Play/Pause Button -->
          <!-- Glowing 3D Jewel Red Play/Pause Button -->
          <button class="icon-btn play-pause-btn" title="Play / Pause (Space)" aria-label="Play / Pause">
            <svg class="play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg class="pause-icon" style="display:none;" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </button>

          <!-- Explicit 10s Forward Button (Clockwise Circular Arrow) -->
          <button class="icon-btn skip-10-btn skip-fwd-btn" title="Forward 10 seconds (L / →)" aria-label="Forward 10s">
            <svg viewBox="0 0 24 24">
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8c0-4.42 3.58-8 8-8z"/>
              <text x="12" y="13.5" font-size="6.5" font-family="system-ui, -apple-system, Roboto, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="middle" fill="currentColor">10</text>
            </svg>
          </button>

          <!-- Next with Loading Spinner -->
          <button class="icon-btn next-btn" title="Next (Shift+N)" aria-label="Next">
            <span class="btn-spinner"></span>
            <svg class="btn-icon" viewBox="0 0 24 24"><path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>

          <!-- Loop / Repeat Button -->
          <button class="icon-btn loop-btn" title="Repeat / Loop" aria-label="Repeat">
            <svg viewBox="0 0 24 24">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          </button>
        </div>

        <!-- Inline Progress Bar with High-Contrast Timestamps Underneath -->
        <div class="seek-container">
          <div class="progress-container" title="Seek position">
            <div class="progress-track">
              <div class="progress-fill"></div>
              <div class="progress-thumb"></div>
            </div>
            <div class="progress-tooltip">0:00</div>
          </div>
          <div class="time-row">
            <span class="current-time">0:00</span>
            <span class="duration-time">0:00</span>
          </div>
        </div>
      </div>

      <!-- Right Tools: Volume with +/-, HD, PiP, Queue, Settings, Minimize Pill Button -->
      <div class="right-section">
        <!-- Volume with +/- Step Buttons -->
        <div class="volume-wrap">
          <button class="icon-btn mute-btn" style="width:28px;height:28px;" title="Mute (M)" aria-label="Mute">
            <svg class="speaker-icon" style="width:18px;height:18px;" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            <svg class="muted-icon" style="width:18px;height:18px;display:none;" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
          </button>
          <button class="vol-step-btn vol-down-btn" title="Decrease Volume (-10%)">−</button>
          <input type="range" class="volume-slider" min="0" max="100" value="100" title="Volume" />
          <button class="vol-step-btn vol-up-btn" title="Increase Volume (+10%)">＋</button>
        </div>

        <!-- Vertical Divider -->
        <div class="bar-divider"></div>

        <!-- Search YouTube Button -->
        <button class="icon-btn search-btn" title="Search YouTube (Ctrl+K)" aria-label="Search YouTube">
          <svg viewBox="0 0 24 24"><path d="M20.87 19.46l-4.48-4.48C17.48 13.67 18 12.14 18 10.5 18 6.36 14.64 3 10.5 3S3 6.36 3 10.5 6.36 18 10.5 18c1.64 0 3.17-.52 4.48-1.61l4.48 4.48 1.41-1.41zM5 10.5C5 7.46 7.46 5 10.5 5S16 7.46 16 10.5 13.54 16 10.5 16 5 13.54 5 10.5z"/></svg>
        </button>

        <!-- Interactive HD Resolution Button -->
        <button class="hd-badge-btn" title="Playback Quality (Resolution)" aria-label="Resolution">HD</button>

        <!-- Floating Video Preview Toggle Button -->
        <button class="icon-btn preview-toggle-btn" title="Floating Video Preview" aria-label="Video Preview">
          <svg viewBox="0 0 24 24"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"/></svg>
        </button>

        <!-- Queue Button -->
        <button class="icon-btn queue-btn" title="Up Next / Queue" aria-label="Queue">
          <svg viewBox="0 0 24 24"><path d="M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm10 0v6l5-3z"/></svg>
        </button>

        <!-- Settings Gear Button -->
        <button class="icon-btn settings-btn" title="Settings & Options" aria-label="Settings">
          <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </button>

        <!-- Hide / Minimize Button (Slide Left Chevron) -->
        <button class="icon-btn hide-btn" title="Minimize to pill (Slide Left)" aria-label="Minimize">
          <svg viewBox="0 0 24 24" width="22" height="22" style="width:22px;height:22px;fill:currentColor;"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
      </div>

      <!-- Settings Popover Card (with interactive sub-panels) -->
      <div class="settings-popover">
        <!-- Main Settings View -->
        <div class="popover-view main-view">
          <div class="popover-header">
            <div class="popover-brand">
              <svg width="24" height="17" style="width:24px;height:17px;display:block;" viewBox="0 0 28 20">
                <path fill="#FF0000" d="M27.973 3.123A3.504 3.504 0 0 0 25.5.651C23.32 0 14 0 14 0S4.68 0 2.5.651A3.504 3.504 0 0 0 .027 3.123C0 5.3 0 10 0 10s0 4.7.027 6.877A3.504 3.504 0 0 0 2.5 19.349C4.68 20 14 20 14 20s9.32 0 11.5-.651a3.504 3.504 0 0 0 2.473-2.472C28 14.7 28 10 28 10s0-4.7-.027-6.877z"/>
                <polygon fill="#FFFFFF" points="11.2,14.4 18.2,10 11.2,5.6"/>
              </svg>
              <span>YouTube Controller</span>
            </div>
            <button class="popover-close-btn" title="Close Settings (ESC)">
              <svg viewBox="0 0 24 24" width="16" height="16" style="width:16px;height:16px;fill:currentColor;"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>

          <!-- Item 1: Bottom Control Bar Always Show Switch -->
          <div class="popover-card">
            <div class="popover-card-left">
              <span class="popover-card-icon">🖥</span>
              <div class="popover-card-text">
                <span class="popover-card-title">Bottom Control Bar</span>
                <span class="popover-card-sub">Always show player controls</span>
              </div>
            </div>
            <label class="switch">
              <input type="checkbox" class="popover-bar-toggle" checked />
              <span class="slider"></span>
            </label>
          </div>

          <!-- Item 2: Keyboard Shortcuts (Click to open sub-view) -->
          <div class="popover-card popover-shortcuts-card">
            <div class="popover-card-left">
              <span class="popover-card-icon">⌨</span>
              <div class="popover-card-text">
                <span class="popover-card-title">Keyboard Shortcuts</span>
                <span class="popover-card-sub">Space: Play/Pause • J/L: ±10s • M: Mute</span>
              </div>
            </div>
            <span class="popover-chevron">›</span>
          </div>

          <!-- Item 3: Appearance (Click to open theme sub-view) -->
          <div class="popover-card popover-appearance-card">
            <div class="popover-card-left">
              <span class="popover-card-icon">🖵</span>
              <div class="popover-card-text">
                <span class="popover-card-title">Appearance</span>
                <span class="popover-card-sub">Dark / Light Mode</span>
                <span class="popover-card-sub">Dark / Light Mode</span>
              </div>
            </div>
            <span class="popover-chevron">›</span>
          </div>

          <div class="popover-footer">
            Made with ❤️ for a better YouTube experience
          </div>
        </div>

        <!-- Shortcuts Sub-View -->
        <div class="popover-view shortcuts-view" style="display:none;">
          <div class="sub-panel-header back-to-main">
            <button class="sub-panel-back-btn">‹ Back</button>
            <span>Keyboard Shortcuts</span>
          </div>

          <div class="popover-card">
            <div class="popover-card-text">
              <span class="popover-card-title">Enable Hotkeys</span>
              <span class="popover-card-sub">Control playback while browsing</span>
            </div>
            <label class="switch">
              <input type="checkbox" class="hotkeys-toggle" checked />
              <span class="slider"></span>
            </label>
          </div>

          <div class="shortcuts-table">
            <div class="shortcut-row"><span>Play / Pause</span><span class="shortcut-key">Space</span></div>
            <div class="shortcut-row"><span>Rewind 10 Seconds</span><span class="shortcut-key">J or ←</span></div>
            <div class="shortcut-row"><span>Forward 10 Seconds</span><span class="shortcut-key">L or →</span></div>
            <div class="shortcut-row"><span>Volume Up / Down</span><span class="shortcut-key">↑ / ↓</span></div>
            <div class="shortcut-row"><span>Mute / Unmute</span><span class="shortcut-key">M</span></div>
          </div>
        </div>

        <!-- Appearance Sub-View -->
        <div class="popover-view appearance-view" style="display:none;">
          <div class="sub-panel-header back-to-main">
            <button class="sub-panel-back-btn">‹ Back</button>
            <span>Appearance & Theme</span>
          </div>

          <div class="theme-options-row">
            <button class="theme-pill-btn active dark-btn">Dark</button>
            <button class="theme-pill-btn light-btn">Light</button>
          </div>

        </div>
      </div>

      <!-- Queue Floating Popover -->
      <div class="queue-panel" role="region" aria-label="Playback queue">
        <div class="queue-header">
          <span>Up Next / Queue</span>
          <button class="icon-btn close-queue-btn" title="Close Queue (ESC)" style="width:26px;height:26px;">
            <svg viewBox="0 0 24 24" width="16" height="16" style="width:16px;height:16px;fill:currentColor;"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div class="queue-tools">
          <input class="queue-filter" type="search" placeholder="Filter title or channel…" aria-label="Filter queue" />
          <button class="queue-current-btn" type="button">Now playing</button>
        </div>
        <div class="queue-summary" aria-live="polite"></div>
        <div class="queue-list"></div>
      </div>

      <!-- Playback Quality Selector Popover -->
      <div class="quality-popover">
        <div class="quality-popover-header">
          <span class="quality-header-title">Playback Quality</span>
          <span class="quality-current-tag">Auto</span>
        </div>
        <div class="quality-options-list"></div>
      </div>

      <!-- Floating Confirmation Toast -->
      <div class="dock-toast">
        <span class="toast-icon">👍</span>
        <span class="toast-msg">Added to Liked videos</span>
      </div>
    `;

    // 3. Floating Video Preview Window
    const previewWindow = document.createElement('div');
    previewWindow.className = 'video-preview-window';
    previewWindow.innerHTML = `
      <div class="preview-media-wrap">
        <img class="preview-thumb-img" alt="Video Preview" />
        <div class="preview-controls-overlay">
          <div class="preview-top-bar" title="Drag to move preview">
            <div class="preview-brand">
              <svg class="preview-drag-grip" viewBox="0 0 24 24"><path d="M9 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10-14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></svg>
              <svg width="20" height="14" style="width:20px;height:14px;display:block;flex-shrink:0;" viewBox="0 0 28 20"><path fill="#FF0000" d="M27.973 3.123A3.504 3.504 0 0 0 25.5.651C23.32 0 14 0 14 0S4.68 0 2.5.651A3.504 3.504 0 0 0 .027 3.123C0 5.3 0 10 0 10s0 4.7.027 6.877A3.504 3.504 0 0 0 2.5 19.349C4.68 20 14 20 14 20s9.32 0 11.5-.651a3.504 3.504 0 0 0 2.473-2.472C28 14.7 28 10 28 10s0-4.7-.027-6.877z"/><polygon fill="#FFFFFF" points="11.2,14.4 18.2,10 11.2,5.6"/></svg>
              <span class="preview-title-text">YouTube Video</span>
            </div>
            <div class="preview-top-actions">
              <button class="preview-icon-action-btn preview-like-btn" title="Like / Unlike video">
                <svg class="prev-thumb-outline" viewBox="0 0 24 24"><path d="M18.77 11h-4.23l1.52-4.94C16.38 5.03 15.54 4 14.38 4c-.58 0-1.14.24-1.52.65L7 11H3v10h4l1 1h11c1.1 0 2-.9 2-2l1-7c.1-.8-.45-1.5-1.23-1.8zM7 20H4v-8h3v8zm13.1-6.84l-.9 6.34c-.05.3-.3.5-.6.5H8.5V11.6l5.2-5.45c.1-.1.2-.15.3-.15.2 0 .4.1.5.25.1.15.1.35.05.5L13.05 12h7.05c.4 0 .7.3.8.7.05.15.05.3 0 .46z"/></svg>
                <svg class="prev-thumb-filled" viewBox="0 0 24 24" style="display:none;fill:#ff0033;"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
              </button>
              <button class="preview-icon-action-btn preview-fullscreen-btn" title="Switch to playing YouTube tab">
                <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              </button>
              <button class="preview-close-btn" title="Close preview">
                <svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor;"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
          </div>
          <div class="preview-center-controls">
            <button class="preview-icon-btn preview-prev-track" title="Previous video">
              <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
            <button class="preview-icon-btn preview-skip-back" title="Rewind 10 seconds">
              <svg viewBox="0 0 24 24">
                <path d="M12.5 3a9 9 0 1 0 7.8 4.5l1.6-1.6A11 11 0 1 1 12.5 1v-2l-4 3.5 4 3.5V3z"/>
                <text x="12" y="15.5" font-size="7" font-weight="800" text-anchor="middle" fill="currentColor">10</text>
              </svg>
            </button>
            <button class="preview-icon-btn preview-play-btn" title="Play / Pause">
              <svg class="prev-play-icon" viewBox="0 0 24 24" style="width:22px;height:22px;fill:#fff;"><path d="M8 5v14l11-7z"/></svg>
              <svg class="prev-pause-icon" viewBox="0 0 24 24" style="width:22px;height:22px;fill:#fff;display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button class="preview-icon-btn preview-skip-fwd" title="Forward 10 seconds">
              <svg viewBox="0 0 24 24">
                <path d="M11.5 3a9 9 0 1 1-7.8 4.5L2.1 5.9A11 11 0 1 0 11.5 1v-2l4 3.5-4 3.5V3z"/>
                <text x="12" y="15.5" font-size="7" font-weight="800" text-anchor="middle" fill="currentColor">10</text>
              </svg>
            </button>
            <button class="preview-icon-btn preview-next-track" title="Next video">
              <svg viewBox="0 0 24 24"><path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>
          <div class="preview-bottom-bar">
            <div class="preview-progress-track">
              <div class="preview-progress-fill"></div>
            </div>
            <div class="preview-bottom-meta">
              <div class="preview-meta-left">
                <span class="preview-time">0:00 / 0:00</span>
              </div>
              <div class="preview-meta-right">
                <div class="preview-vol-wrapper">
                  <button class="preview-vol-btn" title="Mute / Unmute">
                    <svg class="prev-speaker-icon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                    <svg class="prev-muted-icon" viewBox="0 0 24 24" style="display:none;"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                  </button>
                  <input type="range" class="preview-vol-slider" min="0" max="100" value="100" title="Preview Volume" />
                </div>
                <span class="preview-open-yt" title="Open YouTube tab">youtube.com ↗</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const resizeHandle = document.createElement('button');
    resizeHandle.className = 'preview-resize-handle';
    resizeHandle.type = 'button';
    resizeHandle.title = 'Drag to resize · Arrow keys to adjust · Double-click to reset';
    resizeHandle.setAttribute('aria-label', 'Resize video preview');
    resizeHandle.textContent = '◢';
    previewWindow.appendChild(resizeHandle);

    // 4. YouTube Search Modal Backdrop
    const searchBackdrop = document.createElement('div');
    searchBackdrop.className = 'yt-search-backdrop';
    searchBackdrop.innerHTML = `
      <div class="yt-search-modal" role="dialog" aria-modal="true" aria-label="Search YouTube">
        <div class="search-modal-header">
          <div class="search-modal-title">
            <svg width="24" height="17" style="width:24px;height:17px;display:block;flex-shrink:0;" viewBox="0 0 28 20"><path fill="#FF0000" d="M27.973 3.123A3.504 3.504 0 0 0 25.5.651C23.32 0 14 0 14 0S4.68 0 2.5.651A3.504 3.504 0 0 0 .027 3.123C0 5.3 0 10 0 10s0 4.7.027 6.877A3.504 3.504 0 0 0 2.5 19.349C4.68 20 14 20 14 20s9.32 0 11.5-.651a3.504 3.504 0 0 0 2.473-2.472C28 14.7 28 10 28 10s0-4.7-.027-6.877z"/><polygon fill="#FFFFFF" points="11.2,14.4 18.2,10 11.2,5.6"/></svg>
            <span>Search YouTube</span>
          </div>
          <button class="search-cut-btn" title="Close (ESC)">
            <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor;"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div class="search-input-section">
          <div class="search-input-box">
            <svg class="search-icon-inside" viewBox="0 0 24 24"><path d="M20.87 19.46l-4.48-4.48C17.48 13.67 18 12.14 18 10.5 18 6.36 14.64 3 10.5 3S3 6.36 3 10.5 6.36 18 10.5 18c1.64 0 3.17-.52 4.48-1.61l4.48 4.48 1.41-1.41zM5 10.5C5 7.46 7.46 5 10.5 5S16 7.46 16 10.5 13.54 16 10.5 16 5 13.54 5 10.5z"/></svg>
            <input type="text" class="search-text-input" placeholder="Search songs, artists, channels, playlists..." />
            <button class="search-clear-btn" title="Clear">✕</button>
          </div>
          <div class="search-recommendation-chips">
            <button class="search-chip" data-query="Top Songs">🔥 Top Songs</button>
            <button class="search-chip" data-query="Lofi Hip Hop radio">🎧 Lofi Beats</button>
            <button class="search-chip" data-query="Trending Music">⚡ Trending Music</button>
            <button class="search-chip" data-query="Chill Acoustic">☕ Chill</button>
            <button class="search-chip" data-query="Rock Classics">🎸 Rock Classics</button>
            <button class="search-chip" data-query="Podcasts">🎙️ Podcasts</button>
          </div>
        </div>
        <div class="search-recents" aria-label="Recent searches"></div>
        <div class="search-filter-bar" style="display: none;">
          <button class="search-filter-btn active" data-filter="all">All</button>
          <button class="search-filter-btn" data-filter="video">Videos & Songs</button>
          <button class="search-filter-btn" data-filter="channel">Channels</button>
          <button class="search-filter-btn" data-filter="playlist">Playlists</button>
        </div>
        <div class="search-tools">
          <span>↓ Browse results · Enter to play · Esc to close</span>
          <label>Sort <select class="search-sort"><option value="relevance">Relevance</option><option value="title">Title A–Z</option></select></label>
        </div>
        <div class="search-results-list" aria-label="Search results">
          <div class="search-status-msg">Type to search songs, artists, channels or playlists on YouTube...</div>
        </div>
      </div>
    `;

    this.shadow.appendChild(wrapper);
    this.shadow.appendChild(previewWindow);
    this.shadow.appendChild(searchBackdrop);

    // Query elements
    this.container = wrapper;
    this.thumbWrap = wrapper.querySelector('.thumbnail-wrap')!;
    this.thumbImg = wrapper.querySelector('.thumbnail-wrap img')!;
    this.titleEl = wrapper.querySelector('.video-title')!;
    this.channelEl = wrapper.querySelector('.channel-name')!;
    this.likeBtn = wrapper.querySelector('.like-btn')!;
    this.thumbOutlineIcon = wrapper.querySelector('.thumb-outline')!;
    this.thumbFilledIcon = wrapper.querySelector('.thumb-filled')!;
    this.dockToast = wrapper.querySelector('.dock-toast')!;
    this.toastMsgEl = wrapper.querySelector('.toast-msg')!;
    this.toastIconEl = wrapper.querySelector('.toast-icon')!;

    this.hdBtn = wrapper.querySelector('.hd-badge-btn')!;
    this.qualityPopover = wrapper.querySelector('.quality-popover')!;
    this.qualityListEl = wrapper.querySelector('.quality-options-list')!;
    this.qualityTagEl = wrapper.querySelector('.quality-current-tag')!;

    // Video Preview Query Elements
    this.videoPreviewWindow = previewWindow;
    this.previewTopBar = previewWindow.querySelector('.preview-top-bar')!;
    this.previewThumbImg = previewWindow.querySelector('.preview-thumb-img')!;
    this.previewTitleText = previewWindow.querySelector('.preview-title-text')!;
    this.previewLikeBtn = previewWindow.querySelector('.preview-like-btn')!;
    this.prevThumbOutlineIcon = previewWindow.querySelector('.prev-thumb-outline')!;
    this.prevThumbFilledIcon = previewWindow.querySelector('.prev-thumb-filled')!;
    this.previewFullscreenBtn = previewWindow.querySelector('.preview-fullscreen-btn')!;
    this.previewCloseBtn = previewWindow.querySelector('.preview-close-btn')!;
    this.previewPrevBtn = previewWindow.querySelector('.preview-prev-track')!;
    this.previewSkipBackBtn = previewWindow.querySelector('.preview-skip-back')!;
    this.previewPlayBtn = previewWindow.querySelector('.preview-play-btn')!;
    this.previewPlayIcon = previewWindow.querySelector('.prev-play-icon')!;
    this.previewPauseIcon = previewWindow.querySelector('.prev-pause-icon')!;
    this.previewSkipFwdBtn = previewWindow.querySelector('.preview-skip-fwd')!;
    this.previewNextBtn = previewWindow.querySelector('.preview-next-track')!;
    this.previewProgressTrack = previewWindow.querySelector('.preview-progress-track')!;
    this.previewProgressFill = previewWindow.querySelector('.preview-progress-fill')!;
    this.previewTimeEl = previewWindow.querySelector('.preview-time')!;
    this.previewVolBtn = previewWindow.querySelector('.preview-vol-btn')!;
    this.prevSpeakerIcon = previewWindow.querySelector('.prev-speaker-icon')!;
    this.prevMutedIcon = previewWindow.querySelector('.prev-muted-icon')!;
    this.previewVolSlider = previewWindow.querySelector('.preview-vol-slider')!;
    this.previewOpenYt = previewWindow.querySelector('.preview-open-yt')!;
    this.previewToggleBtn = wrapper.querySelector('.preview-toggle-btn')!;

    // Search Query Elements
    this.searchBtn = wrapper.querySelector('.search-btn')!;
    this.searchBackdrop = searchBackdrop;
    this.searchInput = searchBackdrop.querySelector('.search-text-input')!;
    this.searchClearBtn = searchBackdrop.querySelector('.search-clear-btn')!;
    this.searchCutBtn = searchBackdrop.querySelector('.search-cut-btn')!;
    this.searchResultsList = searchBackdrop.querySelector('.search-results-list')!;
    this.searchFilterBar = searchBackdrop.querySelector('.search-filter-bar')!;
    this.searchChipsContainer = searchBackdrop.querySelector('.search-recommendation-chips')!;

    this.shuffleBtn = wrapper.querySelector('.shuffle-btn')!;
    this.prevBtn = wrapper.querySelector('.prev-btn')!;
    this.skip10BackBtn = wrapper.querySelector('.skip-back-btn')!;
    this.playPauseBtn = wrapper.querySelector('.play-pause-btn')!;
    this.playIcon = wrapper.querySelector('.play-icon')!;
    this.pauseIcon = wrapper.querySelector('.pause-icon')!;
    this.skip10FwdBtn = wrapper.querySelector('.skip-fwd-btn')!;
    this.nextBtn = wrapper.querySelector('.next-btn')!;
    this.loopBtn = wrapper.querySelector('.loop-btn')!;
    this.progressContainer = wrapper.querySelector('.progress-container')!;
    this.progressFill = wrapper.querySelector('.progress-fill')!;
    this.progressThumb = wrapper.querySelector('.progress-thumb')!;
    this.progressTooltip = wrapper.querySelector('.progress-tooltip')!;
    this.currentTimeEl = wrapper.querySelector('.current-time')!;
    this.durationTimeEl = wrapper.querySelector('.duration-time')!;
    this.muteBtn = wrapper.querySelector('.mute-btn')!;
    this.speakerIcon = wrapper.querySelector('.speaker-icon')!;
    this.mutedIcon = wrapper.querySelector('.muted-icon')!;
    this.volDownBtn = wrapper.querySelector('.vol-down-btn')!;
    this.volUpBtn = wrapper.querySelector('.vol-up-btn')!;
    this.volumeSlider = wrapper.querySelector('.volume-slider')!;
    this.pipBtn = wrapper.querySelector('.pip-btn')!;
    this.queueBtn = wrapper.querySelector('.queue-btn')!;
    this.queuePanel = wrapper.querySelector('.queue-panel')!;
    this.queueList = wrapper.querySelector('.queue-list')!;
    this.queueFilter = wrapper.querySelector('.queue-filter')!;
    this.settingsBtn = wrapper.querySelector('.settings-btn')!;
    this.settingsPopover = wrapper.querySelector('.settings-popover')!;
    this.barToggleInput = wrapper.querySelector('.popover-bar-toggle')!;
    this.hideBtn = wrapper.querySelector('.hide-btn')!;

    // Popover Views
    this.popoverMainView = wrapper.querySelector('.main-view')!;
    this.popoverShortcutsView = wrapper.querySelector('.shortcuts-view')!;
    this.popoverAppearanceView = wrapper.querySelector('.appearance-view')!;
    this.hotkeysToggleInput = wrapper.querySelector('.hotkeys-toggle')!;
    this.darkThemeBtn = wrapper.querySelector('.dark-btn')!;
    this.lightThemeBtn = wrapper.querySelector('.light-btn')!;
  }

  private setPillMode(pill: boolean): void {
    this.isPillMode = pill;
    this.hostElement.classList.toggle('pill-mode', pill);
    try {
      chrome.storage.local.set({ ytPillMode: pill });
    } catch {}
  }

  private async animatePillMode(pill: boolean): Promise<void> {
    if (this.isAnimatingPill || this.isPillMode === pill) return;
    this.isSettingsOpen = false;
    this.settingsPopover.classList.remove('open');
    this.isQueueOpen = false;
    this.queuePanel.classList.remove('open');
    this.isQualityOpen = false;
    this.qualityPopover.classList.remove('open');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.setPillMode(pill);
      return;
    }
    this.isAnimatingPill = true;
    this.hostElement.classList.add('tape-transition');
    this.container.inert = true;
    this.floatingPill.inert = true;
    const bar = this.container.getBoundingClientRect();
    const box = this.floatingPill.getBoundingClientRect();
    const verticalInset = Math.max(0, (bar.height - box.height) / 2);
    const expanded = { translate: '0px 0px', clipPath: 'inset(0px 0px 0px 0px round 36px)' };
    const retracted = {
      translate: `${box.left - bar.left}px ${box.top - bar.top - verticalInset}px`,
      clipPath: `inset(${verticalInset}px ${Math.max(0, bar.width - box.width)}px ${verticalInset}px 0px round 27px)`
    };
    const animation = this.container.animate(pill ? [expanded, retracted] : [retracted, expanded], {
      duration: pill ? 520 : 620,
      easing: pill ? 'cubic-bezier(0.65, 0, 0.35, 1)' : 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'both'
    });
    try {
      await animation.finished;
    } catch {
      // Finish in the requested state even if the browser cancels the animation.
    } finally {
      this.setPillMode(pill);
      animation.cancel();
      this.hostElement.classList.remove('tape-transition');
      this.container.inert = false;
      this.floatingPill.inert = false;
      this.isAnimatingPill = false;
    }
  }

  private setTheme(theme: 'dark' | 'light'): void {
    this.currentTheme = theme;
    this.darkThemeBtn.classList.toggle('active', theme === 'dark');
    this.lightThemeBtn.classList.toggle('active', theme === 'light');

    const isLight = theme === 'light';
    this.hostElement.classList.toggle('theme-light', isLight);
    this.container.classList.toggle('theme-light', isLight);
    this.settingsPopover.classList.toggle('theme-light', isLight);
    this.queuePanel.classList.toggle('theme-light', isLight);
    this.searchBackdrop.classList.toggle('theme-light', isLight);
    this.videoPreviewWindow.classList.toggle('theme-light', isLight);

    try {
      chrome.storage.local.set({ ytTheme: theme });
    } catch {}
  }

  private attachKeyboardHotkeys(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // 1. Dismiss modals and popovers on Escape regardless of focus
      if (e.key === 'Escape') {
        if (this.isSearchOpen) {
          this.closeSearchModal();
          return;
        }
        if (this.isPreviewOpen) {
          this.closePreview();
          return;
        }
        if (this.isQualityOpen) {
          this.isQualityOpen = false;
          this.qualityPopover.classList.remove('open');
          return;
        }
        if (this.isSettingsOpen) {
          this.isSettingsOpen = false;
          this.settingsPopover.classList.remove('open');
          return;
        }
        if (this.isQueueOpen) {
          this.isQueueOpen = false;
          this.queuePanel.classList.remove('open');
          return;
        }
      }

      // 2. Ctrl+K or Cmd+K to open YouTube Search Modal
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (this.isSearchOpen) {
          this.closeSearchModal();
        } else {
          this.openSearchModal();
        }
        return;
      }

      if (!this.hotkeysEnabled) return;

      // Never intercept hotkeys when YouTube search modal is open
      if (this.isSearchOpen) return;

      // Don't intercept playback hotkeys if user is typing in input, textarea, or contentEditable
      const pathTarget = (e.composedPath && e.composedPath().length > 0 ? e.composedPath()[0] : e.target) as HTMLElement;
      if (
        pathTarget &&
        (pathTarget.tagName === 'INPUT' ||
          pathTarget.tagName === 'TEXTAREA' ||
          pathTarget.isContentEditable)
      ) {
        return;
      }

      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.sendCommand({ type: 'TOGGLE_PLAY' });
      } else if (e.key === 'j' || e.key === 'J' || (e.code === 'ArrowLeft' && e.altKey)) {
        this.sendCommand({ type: 'SEEK_RELATIVE', payload: { delta: -10 } });
      } else if (e.key === 'l' || e.key === 'L' || (e.code === 'ArrowRight' && e.altKey)) {
        this.sendCommand({ type: 'SEEK_RELATIVE', payload: { delta: 10 } });
      } else if (e.key === 'm' || e.key === 'M') {
        this.sendCommand({ type: 'TOGGLE_MUTE' });
      } else if (e.code === 'ArrowUp' && e.altKey) {
        e.preventDefault();
        this.sendCommand({ type: 'STEP_VOLUME', payload: { step: 10 } });
      } else if (e.code === 'ArrowDown' && e.altKey) {
        e.preventDefault();
        this.sendCommand({ type: 'STEP_VOLUME', payload: { step: -10 } });
      }
    });
  }

  private attachEventListeners(): void {
    // Extend the dock from the same case it retracts into.
    this.floatingPill.addEventListener('click', (event) => {
      if ((event.target as Element).closest('.pill-cut-btn')) return;
      void this.animatePillMode(false);
    });

    // Pill Cut Button Click -> Closes the controller
    const pillCutBtn = this.floatingPill.querySelector('.pill-cut-btn');
    pillCutBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.setPillMode(false);
      this.store.close();
    });

    this.hideBtn.addEventListener('click', () => {
      void this.animatePillMode(true);
    });

    // Shuffle Button Toggle
    this.shuffleBtn.addEventListener('click', () => {
      this.isShuffleActive = !this.isShuffleActive;
      this.shuffleBtn.classList.toggle('active', this.isShuffleActive);
      this.showToast(this.isShuffleActive ? 'Shuffle enabled' : 'Shuffle disabled', '🔀');
    });

    // Play/Pause
    this.playPauseBtn.addEventListener('click', () => {
      this.sendCommand({ type: 'TOGGLE_PLAY' });
    });

    // Next / Prev with loader and debounce
    this.nextBtn.addEventListener('click', () => {
      this.triggerTrackChange('NEXT');
    });

    this.prevBtn.addEventListener('click', () => {
      this.triggerTrackChange('PREVIOUS');
    });

    // Loop / Repeat Button Toggle
    this.loopBtn.addEventListener('click', () => {
      this.isLoopActive = !this.isLoopActive;
      this.loopBtn.classList.toggle('active', this.isLoopActive);
      this.sendCommand({ type: 'TOGGLE_LOOP' });
      this.showToast(this.isLoopActive ? 'Repeat enabled' : 'Repeat disabled', '🔁');
    });

    // Explicit 10s Rewind & Forward
    this.skip10BackBtn.addEventListener('click', () => {
      this.sendCommand({ type: 'SEEK_RELATIVE', payload: { delta: -10 } });
    });

    this.skip10FwdBtn.addEventListener('click', () => {
      this.sendCommand({ type: 'SEEK_RELATIVE', payload: { delta: 10 } });
    });

    // YouTube Thumbs Up / Like
    this.likeBtn.addEventListener('click', () => {
      this.handleLikeClick();
    });

    // Search YouTube Button
    this.searchBtn.addEventListener('click', () => {
      this.openSearchModal();
    });

    // HD / Quality Resolution Popover Toggle
    this.hdBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isQualityOpen = !this.isQualityOpen;
      this.qualityPopover.classList.toggle('open', this.isQualityOpen);
      if (this.isQualityOpen) {
        this.isSettingsOpen = false;
        this.settingsPopover.classList.remove('open');
        this.isQueueOpen = false;
        this.queuePanel.classList.remove('open');
      }
    });

    // Floating Video Preview Toggle (from button or track thumbnail)
    this.previewToggleBtn.addEventListener('click', () => {
      this.togglePreview();
    });

    this.thumbWrap.addEventListener('click', () => {
      this.togglePreview();
    });

    // Video Preview Controls
    // Floating Video Preview Dragging
    this.setupPreviewDragging();
    this.setupPreviewResizing();

    // Video Preview Top Actions
    this.previewCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closePreview();
    });

    this.previewLikeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleLikeClick();
    });

    this.previewFullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sendCommand({ type: 'FOCUS_YOUTUBE_TAB' });
    });

    // Video Preview Transport Controls
    this.previewPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerTrackChange('PREVIOUS');
    });

    this.previewPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sendCommand({ type: 'TOGGLE_PLAY' });
    });

    this.previewSkipBackBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sendCommand({ type: 'SEEK_RELATIVE', payload: { delta: -10 } });
    });

    this.previewSkipFwdBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sendCommand({ type: 'SEEK_RELATIVE', payload: { delta: 10 } });
    });

    // Video Preview Smart Controls Auto-Hiding (vanishes after 2.5s, appears on hover)
    this.previewNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerTrackChange('NEXT');
    });

    // Video Preview Volume Controls
    this.previewVolBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sendCommand({ type: 'TOGGLE_MUTE' });
    });

    this.previewVolSlider.addEventListener('input', (e) => {
      e.stopPropagation();
      const vol = parseInt(this.previewVolSlider.value, 10);
      this.sendCommand({ type: 'SET_VOLUME', payload: { volume: vol } });
    });

    this.previewProgressTrack.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      const rect = this.previewProgressTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const duration = this.store.getState()?.duration || 0;
      this.sendCommand({ type: 'SEEK', payload: { time: ratio * duration } });
    });

    this.previewOpenYt.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sendCommand({ type: 'FOCUS_YOUTUBE_TAB' });
    });

    // Search Modal Event Listeners
    this.searchCutBtn.addEventListener('click', () => {
      this.closeSearchModal();
    });

    // NOTE: We deliberately do NOT close the modal when clicking on searchBackdrop/screen
    // so user's search session is not lost when clicking anywhere on the screen.
    // The modal is dismissed explicitly via the searchCutBtn or ESC key.

    this.searchClearBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      this.handleSearchInput();
      this.searchInput.focus();
    });

    this.searchInput.addEventListener('input', () => {
      this.handleSearchInput();
    });

    this.searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
      // Prevent keyboard event from bubbling to window playback hotkeys
      if (e.key === 'Escape' || e.key === 'Tab') return;
      e.stopPropagation();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.searchResultsList.querySelector<HTMLElement>('.search-result-card')?.focus();
        return;
      }
      if (e.key === 'Enter') {
        const query = this.searchInput.value.trim();
        if (query) {
          if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = null;
          }
          this.executeSearch(query);
        }
      }
    });

    // Recommendation chips listeners
    const chips = this.searchChipsContainer.querySelectorAll('.search-chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-query');
        if (q) {
          this.searchInput.value = q;
          this.searchClearBtn.style.display = 'block';
          this.executeSearch(q);
        }
      });
    });

    // Search filter category buttons
    const filterBtns = this.searchFilterBar.querySelectorAll('.search-filter-btn');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter') as 'all' | 'video' | 'channel' | 'playlist';
        this.currentSearchFilter = filter || 'all';
        this.renderFilteredResults();
      });
    });

    // Volume Mute, Step Up (+), Step Down (-)
    this.muteBtn.addEventListener('click', () => {
      this.sendCommand({ type: 'TOGGLE_MUTE' });
    });

    this.volDownBtn.addEventListener('click', () => {
      this.sendCommand({ type: 'STEP_VOLUME', payload: { step: -10 } });
    });

    this.volUpBtn.addEventListener('click', () => {
      this.sendCommand({ type: 'STEP_VOLUME', payload: { step: 10 } });
    });

    this.volumeSlider.addEventListener('input', () => {
      const vol = parseInt(this.volumeSlider.value, 10);
      this.sendCommand({ type: 'SET_VOLUME', payload: { volume: vol } });
    });

    // Seek Dragging & Hover Tooltip
    const handleSeekPointer = (e: PointerEvent | MouseEvent) => {
      const rect = this.progressContainer.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(1, ratio));
    };

    this.progressContainer.addEventListener('mousemove', (e: MouseEvent) => {
      const ratio = handleSeekPointer(e);
      const duration = this.store.getState()?.duration || 0;
      const hoverSec = ratio * duration;
      this.progressTooltip.textContent = ControlBarStateStore.formatTime(hoverSec);
      const rect = this.progressContainer.getBoundingClientRect();
      const posPx = Math.max(10, Math.min(rect.width - 10, e.clientX - rect.left));
      this.progressTooltip.style.left = `${posPx}px`;
    });

    this.progressContainer.addEventListener('pointerdown', (e: PointerEvent) => {
      this.progressContainer.setPointerCapture(e.pointerId);
      this.progressContainer.classList.add('dragging');
      const ratio = handleSeekPointer(e);
      this.store.startDragging(ratio);

      const onMove = (moveEv: PointerEvent) => {
        this.store.updateDragging(handleSeekPointer(moveEv));
      };

      const onUp = () => {
        this.progressContainer.classList.remove('dragging');
        this.progressContainer.removeEventListener('pointermove', onMove);
        this.progressContainer.removeEventListener('pointerup', onUp);
        const targetSeconds = this.store.stopDragging();
        this.sendCommand({ type: 'SEEK', payload: { time: targetSeconds } });
      };

      this.progressContainer.addEventListener('pointermove', onMove);
      this.progressContainer.addEventListener('pointerup', onUp);
    });

    this.queueFilter.addEventListener('input', () => {
      const state = this.store.getState();
      this.renderQueue(state?.queue || [], !!state?.queueAvailable);
    });
    this.queuePanel.querySelector('.queue-current-btn')!.addEventListener('click', () => {
      this.queueFilter.value = '';
      const state = this.store.getState();
      this.renderQueue(state?.queue || [], !!state?.queueAvailable);
      const current = this.queueList.querySelector<HTMLElement>('.current');
      current?.scrollIntoView({ block: 'nearest' });
      current?.focus({ preventScroll: true });
    });
    this.searchBackdrop.querySelector('.search-sort')!.addEventListener('change', (event) => {
      this.searchSort = (event.target as HTMLSelectElement).value as 'relevance' | 'title';
      this.renderFilteredResults();
    });
    this.searchBackdrop.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.closeSearchModal();
      }
      if (event.key === 'Tab') {
        const elements = Array.from(this.searchBackdrop.querySelectorAll<HTMLElement>('button, input, select, [tabindex="0"]')).filter(el => el.getClientRects().length > 0);
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && this.shadow.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && this.shadow.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });

    // Queue Popover
    this.queueBtn.addEventListener('click', () => {
      this.isQueueOpen = !this.isQueueOpen;
      this.queuePanel.classList.toggle('open', this.isQueueOpen);
      if (this.isQueueOpen) {
        this.isSettingsOpen = false;
        this.settingsPopover.classList.remove('open');
        this.isQualityOpen = false;
        this.qualityPopover.classList.remove('open');
      }
    });

    this.queuePanel.querySelector('.close-queue-btn')?.addEventListener('click', () => {
      this.isQueueOpen = false;
      this.queuePanel.classList.remove('open');
    });

    // Settings Popover Toggle
    this.settingsBtn.addEventListener('click', () => {
      this.isSettingsOpen = !this.isSettingsOpen;
      this.settingsPopover.classList.toggle('open', this.isSettingsOpen);
      if (this.isSettingsOpen) {
        this.isQueueOpen = false;
        this.queuePanel.classList.remove('open');
        this.isQualityOpen = false;
        this.qualityPopover.classList.remove('open');
        this.showPopoverView('main');
      }
    });

    this.settingsPopover.querySelector('.popover-close-btn')?.addEventListener('click', () => {
      this.isSettingsOpen = false;
      this.settingsPopover.classList.remove('open');
    });

    // Dismiss popovers when clicking elsewhere on the bar
    this.container.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.quality-popover') && !target.closest('.hd-badge-btn')) {
        this.isQualityOpen = false;
        this.qualityPopover.classList.remove('open');
      }
    });

    // Settings Navigation (Sub-Views)
    this.shadow.querySelector('.popover-shortcuts-card')?.addEventListener('click', () => {
      this.showPopoverView('shortcuts');
    });

    this.shadow.querySelector('.popover-appearance-card')?.addEventListener('click', () => {
      this.showPopoverView('appearance');
    });

    this.shadow.querySelectorAll('.back-to-main')?.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.showPopoverView('main');
      });
    });

    // Master Bar Toggle in Settings
    this.barToggleInput.addEventListener('change', () => {
      const enabled = this.barToggleInput.checked;
      this.store.setBarEnabled(enabled);
      chrome.runtime.sendMessage({
        type: 'SET_BAR_VISIBILITY',
        payload: { enabled }
      }).catch(() => {});
    });

    // Hotkeys Toggle in Settings
    this.hotkeysToggleInput.addEventListener('change', () => {
      this.hotkeysEnabled = this.hotkeysToggleInput.checked;
      try {
        chrome.storage.local.set({ ytHotkeys: this.hotkeysEnabled });
      } catch {}
    });

    // Theme Pill Buttons
    this.darkThemeBtn.addEventListener('click', () => this.setTheme('dark'));
    this.lightThemeBtn.addEventListener('click', () => this.setTheme('light'));

    // Thumbnail error handling
    this.thumbImg.addEventListener('error', () => {
      this.thumbWrap.classList.add('empty');
    });
  }

  private showPopoverView(view: 'main' | 'shortcuts' | 'appearance'): void {
    this.popoverMainView.style.display = view === 'main' ? 'flex' : 'none';
    this.popoverShortcutsView.style.display = view === 'shortcuts' ? 'flex' : 'none';
    this.popoverAppearanceView.style.display = view === 'appearance' ? 'flex' : 'none';
  }

  private triggerTrackChange(cmd: 'NEXT' | 'PREVIOUS'): void {
    if (this.isLoadingTrack) return;
    this.isLoadingTrack = true;

    if (cmd === 'NEXT') {
      this.nextBtn.classList.add('loading');
    } else {
      this.prevBtn.classList.add('loading');
    }

    this.sendCommand({ type: cmd });

    if (this.loadingTimeout) clearTimeout(this.loadingTimeout);
    this.loadingTimeout = setTimeout(() => {
      this.resetLoadingState();
    }, 1800);
  }

  private resetLoadingState(): void {
    this.isLoadingTrack = false;
    this.nextBtn.classList.remove('loading');
    this.prevBtn.classList.remove('loading');
  }

  private sendCommand(msg: CommandMessage): void {
    chrome.runtime.sendMessage(msg).catch(() => {});
  }

  public updateView(): void {
    const isVisible = this.store.isVisible();
    this.container.classList.toggle('hidden', !isVisible);
    this.hostElement.classList.toggle('controller-hidden', !isVisible);
    if (!isVisible) return;

    const state = this.store.getState();
    const tabs = this.store.getTabs();
    this.barToggleInput.checked = this.store.getBarEnabled();

    // Update floating pill playing animation
    if (state && state.isPlaying) {
      this.floatingPill.classList.add('playing');
    } else {
      this.floatingPill.classList.remove('playing');
    }

    if (!state) {
      this.renderQueue([], false);
      if (tabs.length === 0) {
        this.titleEl.textContent = 'YouTube Controller';
        this.channelEl.textContent = 'Open YouTube in a tab to begin playing';
      } else {
        this.titleEl.textContent = 'YouTube connected';
        this.channelEl.textContent = 'Waiting for playback...';
      }
      this.thumbWrap.classList.add('empty');
      this.playIcon.style.display = 'block';
      this.pauseIcon.style.display = 'none';
      this.currentTimeEl.textContent = '0:00';
      this.durationTimeEl.textContent = '0:00';
      this.progressFill.style.width = '0%';
      this.progressThumb.style.left = '0%';
      return;
    }

    // Reset loading spinner if track changed
    if (this.lastTrackId && this.lastTrackId !== state.videoId) {
      this.resetLoadingState();
    }
    this.lastTrackId = state.videoId;

    // Track Meta
    this.titleEl.textContent = state.title || 'YouTube Video';
    this.channelEl.textContent = state.channel || 'YouTube';

    if (state.thumbnailUrl) {
      if (this.thumbImg.src !== state.thumbnailUrl) {
        this.thumbImg.src = state.thumbnailUrl;
      }
      this.thumbWrap.classList.remove('empty');
    } else {
      this.thumbWrap.classList.add('empty');
    }

    // Play/Pause icon
    if (state.isPlaying) {
      this.playIcon.style.display = 'none';
      this.pauseIcon.style.display = 'block';
    } else {
      this.playIcon.style.display = 'block';
      this.pauseIcon.style.display = 'none';
    }

    // Timestamps & Progress
    const currentTime = this.store.getCurrentTime();
    const duration = state.duration;

    this.currentTimeEl.textContent = ControlBarStateStore.formatTime(currentTime);

    if (state.isLive) {
      this.durationTimeEl.innerHTML = `
        <span class="live-badge"><span class="live-dot"></span>LIVE</span>
      `;
      this.progressFill.style.width = '100%';
      this.progressThumb.style.left = '100%';
    } else {
      this.durationTimeEl.textContent = ControlBarStateStore.formatTime(duration);
      const progressRatio = this.store.getCurrentProgressRatio();
      const pct = (progressRatio * 100).toFixed(2);
      this.progressFill.style.width = `${pct}%`;
      this.progressThumb.style.left = `${pct}%`;
    }

    // Volume & Mute
    if (this.shadow.activeElement !== this.volumeSlider) {
      this.volumeSlider.value = String(state.isMuted ? 0 : state.volume);
    }
    if (state.isMuted || state.volume === 0) {
      this.speakerIcon.style.display = 'none';
      this.mutedIcon.style.display = 'block';
    } else {
      this.speakerIcon.style.display = 'block';
      this.mutedIcon.style.display = 'none';
    }

    // Next / Prev availability
    this.prevBtn.disabled = !state.hasPrevious;
    this.nextBtn.disabled = !state.hasNext;

    // Thumbs Up / Like state synchronization from background YouTube tab
    if (this.pendingLike && (this.pendingLike.videoId !== state.videoId ||
      this.pendingLike.liked === state.isLiked || Date.now() >= this.pendingLike.expires)) {
      this.pendingLike = null;
    }
    if (!this.pendingLike && typeof state.isLiked === 'boolean') {
      this.setLikeVisualState(state.isLiked, false);
    }

    // Playback Quality / Resolution Badge update
    if (state.currentQuality) {
      this.updateHDBadge(state.currentQuality);
    }
    this.renderQualityOptions(state.availableQualities || [], state.currentQuality || 'auto');

    // Video Preview Synchronization
    if (this.isPreviewOpen) {
      this.previewTitleText.textContent = state.title || 'YouTube Video';
      if (state.thumbnailUrl && this.previewThumbImg.src !== state.thumbnailUrl) {
        this.previewThumbImg.src = state.thumbnailUrl;
      }
      this.previewPlayIcon.style.display = state.isPlaying ? 'none' : 'block';
      this.previewPauseIcon.style.display = state.isPlaying ? 'block' : 'none';
      const progressRatio = this.store.getCurrentProgressRatio();
      const pct = (progressRatio * 100).toFixed(2);
      this.previewProgressFill.style.width = `${pct}%`;
      this.previewTimeEl.textContent = `${ControlBarStateStore.formatTime(currentTime)} / ${ControlBarStateStore.formatTime(duration)}`;

      // Prev / Next buttons state in preview
      this.previewPrevBtn.disabled = !state.hasPrevious;
      this.previewNextBtn.disabled = !state.hasNext;

      // Volume & Mute in preview
      const vol = state.isMuted ? 0 : state.volume;
      if (this.shadow.activeElement !== this.previewVolSlider) this.previewVolSlider.value = String(vol);
      this.prevSpeakerIcon.style.display = state.isMuted || vol === 0 ? 'none' : 'block';
      this.prevMutedIcon.style.display = state.isMuted || vol === 0 ? 'block' : 'none';


    }

    // Queue updates
    this.renderQueue(state.queue, state.queueAvailable);
  }

  private handleLikeClick(): void {
    const state = this.store.getState();
    if (!state?.videoId) return;
    const liked = !this.isLiked;
    this.pendingLike = { videoId: state.videoId, liked, expires: Date.now() + 2500 };
    this.setLikeVisualState(liked, true);
    this.showToast(liked ? 'Added to Liked videos' : 'Like removed', liked ? '👍' : '👎');
    this.sendCommand({ type: 'TOGGLE_LIKE' });
    setTimeout(() => this.updateView(), 2550);
  }

  private showToast(msg: string, icon = '👍'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toastMsgEl.textContent = msg;
    this.toastIconEl.textContent = icon;
    this.dockToast.classList.add('show');
    this.toastTimer = setTimeout(() => {
      this.dockToast.classList.remove('show');
      this.toastTimer = null;
    }, 2200);
  }

  private setLikeVisualState(liked: boolean, animate = false): void {
    this.isLiked = liked;
    this.likeBtn.classList.toggle('liked', liked);
    this.likeBtn.title = liked ? 'Unlike video' : 'Like video';
    this.likeBtn.setAttribute('aria-pressed', String(liked));
    this.likeBtn.setAttribute('aria-label', this.likeBtn.title);

    if (this.previewLikeBtn) {
      this.previewLikeBtn.title = liked ? 'Unlike video' : 'Like video';
      this.previewLikeBtn.classList.toggle('liked', liked);
      this.previewLikeBtn.setAttribute('aria-pressed', String(liked));
      this.prevThumbOutlineIcon.style.display = liked ? 'none' : 'block';
      this.prevThumbFilledIcon.style.display = liked ? 'block' : 'none';
    }

    this.thumbOutlineIcon.style.display = liked ? 'none' : 'block';
    this.thumbFilledIcon.style.display = liked ? 'block' : 'none';
    if (animate) {
      for (const button of [this.likeBtn, this.previewLikeBtn]) {
        button.classList.remove('pop-anim', 'unlike-anim');
        void button.offsetWidth;
        button.classList.add(liked ? 'pop-anim' : 'unlike-anim');
      }
    }
  }

  private updateHDBadge(quality: string, isHD?: boolean): void {
    const isQualityHD = isHD ?? (quality.startsWith('hd') || quality === 'highres');
    if (quality === 'hd1080') {
      this.hdBtn.textContent = '1080p';
    } else if (quality === 'hd720') {
      this.hdBtn.textContent = '720p';
    } else if (quality === 'hd1440') {
      this.hdBtn.textContent = '1440p';
    } else if (quality === 'hd2160') {
      this.hdBtn.textContent = '4K';
    } else if (quality === 'large') {
      this.hdBtn.textContent = '480p';
    } else if (quality === 'medium') {
      this.hdBtn.textContent = '360p';
    } else if (isQualityHD) {
      this.hdBtn.textContent = 'HD';
    } else {
      this.hdBtn.textContent = 'HD';
    }
    this.hdBtn.classList.toggle('active-hd', isQualityHD);
  }

  private renderQualityOptions(available: QualityOption[], currentQuality: string): void {
    const signature = JSON.stringify([available, currentQuality]);
    if (signature === this.qualitySignature) return;
    this.qualitySignature = signature;
    this.qualityTagEl.textContent = (currentQuality || 'auto').toUpperCase();
    this.qualityListEl.innerHTML = '';

    const list = (available && available.length > 0) ? available : [
      { quality: 'auto', label: 'Auto', isHD: false },
      { quality: 'hd1080', label: '1080p HD', isHD: true },
      { quality: 'hd720', label: '720p HD', isHD: true },
      { quality: 'large', label: '480p', isHD: false },
      { quality: 'medium', label: '360p', isHD: false },
      { quality: 'small', label: '240p', isHD: false }
    ];

    for (const opt of list) {
      const row = document.createElement('div');
      const isSelected = opt.quality === currentQuality || (opt.quality === 'auto' && !currentQuality);
      row.className = `quality-option-item ${isSelected ? 'selected' : ''}`;
      row.innerHTML = `
        <span>
          ${this.escapeHtml(opt.label)}
          ${opt.isHD ? '<span class="quality-option-hd-badge">HD</span>' : ''}
        </span>
        <span class="quality-option-check">✓</span>
      `;

      row.addEventListener('click', () => {
        this.sendCommand({
          type: 'SET_QUALITY',
          payload: { quality: opt.quality }
        });
        this.isQualityOpen = false;
        this.qualityPopover.classList.remove('open');
        this.showToast(`Resolution: ${opt.label}`, '⚙️');
        this.updateHDBadge(opt.quality, opt.isHD);
      });

      this.qualityListEl.appendChild(row);
    }
  }

  private renderQueue(queue: QueueItem[], available: boolean): void {
    const filter = this.queueFilter.value.trim().toLocaleLowerCase();
    const signature = JSON.stringify([queue, available, filter]);
    if (signature === this.queueSignature) return;
    this.queueSignature = signature;
    const scrollTop = this.queueList.scrollTop;
    const items = available ? queue.filter(item => `${item.title} ${item.channel || ''}`.toLocaleLowerCase().includes(filter)) : [];
    this.queuePanel.querySelector('.queue-summary')!.textContent = `${items.length} of ${available ? queue.length : 0} tracks`;
    (this.queuePanel.querySelector('.queue-current-btn') as HTMLButtonElement).disabled = !available || !queue.some(item => item.isCurrent);
    this.queueList.replaceChildren();
    if (!items.length) {
      const message = document.createElement('div');
      message.className = 'queue-empty-msg';
      message.textContent = !available ? 'Queue unavailable for this video' : filter ? 'No matching tracks. Try another title or channel.' : 'No tracks in the queue.';
      this.queueList.appendChild(message);
      return;
    }
    for (const item of items) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `queue-item ${item.isCurrent ? 'current' : ''}`;
      row.setAttribute('aria-current', item.isCurrent ? 'true' : 'false');
      row.title = item.title;
      row.innerHTML = `<div class="queue-thumb"></div><div class="queue-details"><div class="queue-title"></div><div class="queue-channel"></div></div><span class="queue-duration"></span>`;
      if (item.thumbnailUrl) {
        const img = document.createElement('img');
        img.src = item.thumbnailUrl;
        img.alt = '';
        img.loading = 'lazy';
        row.querySelector('.queue-thumb')!.appendChild(img);
      }
      row.querySelector('.queue-title')!.textContent = item.title;
      row.querySelector('.queue-channel')!.textContent = item.channel || '';
      row.querySelector('.queue-duration')!.textContent = item.isCurrent ? 'Playing' : item.durationText || '';
      row.addEventListener('click', () => {
        if (item.isCurrent) return;
        this.sendCommand({ type: 'PLAY_QUEUE_ITEM', payload: { url: item.url, videoId: item.videoId } });
      });
      this.queueList.appendChild(row);
    }
    this.queueList.scrollTop = scrollTop;
  }

  // =========================================================================
  // Video Preview Methods (with smart auto-vanishing hover controls)
  // =========================================================================
  private togglePreview(): void {
    this.isPreviewOpen = !this.isPreviewOpen;
    this.videoPreviewWindow.classList.toggle('open', this.isPreviewOpen);
    if (this.isPreviewOpen) {
      this.fitPreviewToViewport();
      this.updateView();
    }
  }

  private closePreview(): void {
    this.isPreviewOpen = false;
    this.videoPreviewWindow.classList.remove('open');
  }

  private fitPreviewToViewport(): void {
    const preview = this.videoPreviewWindow;
    const width = Math.min(parseFloat(preview.style.width) || 360, Math.max(1, window.innerWidth - 16));
    const height = Math.min(parseFloat(preview.style.height) || 210, Math.max(1, window.innerHeight - 16));
    preview.style.width = `${width}px`;
    preview.style.height = `${height}px`;
    const rect = preview.getBoundingClientRect();
    preview.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    preview.style.top = `${Math.max(8, Math.min(rect.top, window.innerHeight - height - 8))}px`;
    preview.style.right = 'auto';
    preview.style.bottom = 'auto';
  }

  private setupPreviewResizing(): void {
    const preview = this.videoPreviewWindow;
    const handle = preview.querySelector<HTMLButtonElement>('.preview-resize-handle')!;
    let start: { x: number; y: number; width: number; height: number; pointerId: number } | null = null;
    try {
      const size = JSON.parse(localStorage.getItem('yt_preview_size') || 'null');
      if (Number.isFinite(size?.width) && Number.isFinite(size?.height)) {
        preview.style.width = `${Math.max(320, size.width)}px`;
        preview.style.height = `${Math.max(180, size.height)}px`;
      }
    } catch {}
    const save = () => {
      try {
        const rect = preview.getBoundingClientRect();
        localStorage.setItem('yt_preview_size', JSON.stringify({ width: rect.width, height: rect.height }));
        localStorage.setItem('yt_preview_x', String(rect.left));
        localStorage.setItem('yt_preview_y', String(rect.top));
      } catch {}
    };
    const resize = (width: number, height: number) => {
      preview.style.width = `${Math.max(1, Math.min(Math.max(320, width), window.innerWidth - 16))}px`;
      preview.style.height = `${Math.max(1, Math.min(Math.max(180, height), window.innerHeight - 16))}px`;
      this.fitPreviewToViewport();
    };
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      this.fitPreviewToViewport();
      const rect = preview.getBoundingClientRect();
      start = { x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, pointerId: event.pointerId };
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove', event => {
      if (!start || event.pointerId !== start.pointerId) return;
      resize(start.width + event.clientX - start.x, start.height + event.clientY - start.y);
    });
    const finish = () => { if (start) { start = null; save(); } };
    handle.addEventListener('pointerup', event => {
      if (!start || event.pointerId !== start.pointerId) return;
      finish();
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    });
    handle.addEventListener('pointercancel', finish);
    handle.addEventListener('lostpointercapture', finish);
    handle.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const rect = preview.getBoundingClientRect();
      const step = event.shiftKey ? 40 : 10;
      resize(rect.width + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0),
        rect.height + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0));
      save();
    });
    handle.addEventListener('dblclick', event => {
      event.stopPropagation();
      preview.style.width = '360px';
      preview.style.height = '210px';
      this.fitPreviewToViewport();
      save();
    });
    window.addEventListener('resize', () => { if (this.isPreviewOpen) this.fitPreviewToViewport(); });
  }

  private setupPreviewDragging(): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    // Restore saved position if available
    try {
      const savedX = localStorage.getItem('yt_preview_x');
      const savedY = localStorage.getItem('yt_preview_y');
      if (savedX && savedY) {
        const x = parseInt(savedX, 10);
        const y = parseInt(savedY, 10);
        if (!isNaN(x) && !isNaN(y)) {
          const maxLeft = Math.max(0, window.innerWidth - 370);
          const maxTop = Math.max(0, window.innerHeight - 220);
          const clampedX = Math.max(8, Math.min(maxLeft, x));
          const clampedY = Math.max(8, Math.min(maxTop, y));
          this.videoPreviewWindow.style.left = `${clampedX}px`;
          this.videoPreviewWindow.style.top = `${clampedY}px`;
          this.videoPreviewWindow.style.right = 'auto';
          this.videoPreviewWindow.style.bottom = 'auto';
        }
      }
    } catch {}

    const onPointerDown = (e: PointerEvent) => {
      // Don't drag if clicking buttons, slider, or progress bar
      const target = (e.composedPath ? e.composedPath()[0] : e.target) as HTMLElement;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.closest('button') ||
          target.tagName === 'INPUT' ||
          target.closest('.preview-progress-track') ||
          target.closest('.preview-open-yt') ||
          target.classList.contains('preview-vol-slider'))
      ) {
        return;
      }

      isDragging = true;
      this.isPreviewDragging = true;
      this.videoPreviewWindow.classList.add('is-dragging');

      const rect = this.videoPreviewWindow.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      this.videoPreviewWindow.style.left = `${initialLeft}px`;
      this.videoPreviewWindow.style.top = `${initialTop}px`;
      this.videoPreviewWindow.style.right = 'auto';
      this.videoPreviewWindow.style.bottom = 'auto';

      startX = e.clientX;
      startY = e.clientY;

      (this.videoPreviewWindow as any).setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const width = this.videoPreviewWindow.offsetWidth || 360;
      const height = this.videoPreviewWindow.offsetHeight || 210;

      const maxLeft = Math.max(0, window.innerWidth - width - 8);
      const maxTop = Math.max(0, window.innerHeight - height - 8);

      const newLeft = Math.max(8, Math.min(maxLeft, initialLeft + deltaX));
      const newTop = Math.max(8, Math.min(maxTop, initialTop + deltaY));

      this.videoPreviewWindow.style.left = `${newLeft}px`;
      this.videoPreviewWindow.style.top = `${newTop}px`;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      this.isPreviewDragging = false;
      this.videoPreviewWindow.classList.remove('is-dragging');

      try {
        (this.videoPreviewWindow as any).releasePointerCapture?.(e.pointerId);
      } catch {}

      try {
        const rect = this.videoPreviewWindow.getBoundingClientRect();
        localStorage.setItem('yt_preview_x', String(Math.round(rect.left)));
        localStorage.setItem('yt_preview_y', String(Math.round(rect.top)));
      } catch {}
    };

    this.videoPreviewWindow.addEventListener('pointerdown', onPointerDown);
    this.videoPreviewWindow.addEventListener('pointermove', onPointerMove);
    this.videoPreviewWindow.addEventListener('pointerup', onPointerUp);
    this.videoPreviewWindow.addEventListener('pointercancel', onPointerUp);
  }

  // =========================================================================
  // YouTube Search Modal Methods
  // =========================================================================
  private openSearchModal(): void {
    this.isSearchOpen = true;
    this.searchBackdrop.classList.add('open');
    this.isQualityOpen = false;
    this.qualityPopover.classList.remove('open');
    this.isSettingsOpen = false;
    this.settingsPopover.classList.remove('open');
    this.isQueueOpen = false;
    this.queuePanel.classList.remove('open');

    if (!this.searchInput.value.trim()) {
      this.searchChipsContainer.style.display = 'flex';
      this.searchFilterBar.style.display = 'none';
    } else {
      this.searchChipsContainer.style.display = 'none';
    }

    setTimeout(() => {
      this.searchInput.focus();
      this.searchInput.select();
    }, 60);
  }

  private closeSearchModal(): void {
    this.isSearchOpen = false;
    this.searchBackdrop.classList.remove('open');
    this.searchBtn.focus();
  }

  private handleSearchInput(): void {
    ++this.searchRequestId;
    const query = this.searchInput.value.trim();
    this.currentSearchResults = [];
    this.searchFilterBar.style.display = 'none';
    this.searchClearBtn.style.display = query ? 'block' : 'none';

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    if (!query) {
      this.searchChipsContainer.style.display = 'flex';
      this.searchFilterBar.style.display = 'none';
      this.currentSearchResults = [];
      this.searchResultsList.innerHTML = '<div class="search-status-msg">Type to search songs, artists, channels or playlists on YouTube...</div>';
      return;
    }

    this.searchChipsContainer.style.display = 'none';
    this.searchResultsList.innerHTML = '<div class="search-status-msg">Searching YouTube...</div>';

    this.searchDebounceTimer = setTimeout(() => {
      this.executeSearch(query);
    }, 280);
  }

  private executeSearch(query: string): void {
    query = query.trim();
    if (!query) return;
    clearTimeout(this.searchDebounceTimer);
    const requestId = ++this.searchRequestId;
    this.currentSearchResults = [];
    this.currentSearchFilter = 'all';
    this.searchFilterBar.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active', button.getAttribute('data-filter') === 'all'));
    this.searchFilterBar.style.display = 'none';
    this.searchClearBtn.style.display = 'block';
    this.searchChipsContainer.style.display = 'none';
    this.searchResultsList.innerHTML = '<div class="search-status-msg" role="status">Searching YouTube...</div>';
    this.recentSearches = [query, ...this.recentSearches.filter(value => value !== query)].slice(0, 6);
    this.renderRecentSearches();
    const fail = (message: string) => {
      if (requestId !== this.searchRequestId) return;
      this.searchResultsList.replaceChildren();
      const status = document.createElement('div');
      status.className = 'search-status-msg';
      status.textContent = message;
      const retry = document.createElement('button');
      retry.className = 'search-chip';
      retry.textContent = 'Retry search';
      retry.addEventListener('click', () => this.executeSearch(query));
      status.appendChild(retry);
      this.searchResultsList.appendChild(status);
    };
    try {
      chrome.runtime.sendMessage({ type: 'SEARCH_YOUTUBE', payload: { query } }, (res: any) => {
        const error = chrome.runtime.lastError;
        if (requestId !== this.searchRequestId) return;
        if (!error && res?.success && Array.isArray(res.data)) this.renderSearchResults(res.data);
        else fail(error?.message || res?.error || 'Search failed. Please try again.');
      });
    } catch {
      fail('Search is unavailable. Reload the page and try again.');
    }
  }

  private renderRecentSearches(): void {
    const container = this.searchBackdrop.querySelector('.search-recents')!;
    container.replaceChildren();
    if (!this.recentSearches.length) return;
    const label = document.createElement('span');
    label.textContent = 'Recent';
    container.appendChild(label);
    for (const query of this.recentSearches) {
      const button = document.createElement('button');
      button.className = 'search-chip';
      button.textContent = query;
      button.addEventListener('click', () => { this.searchInput.value = query; this.executeSearch(query); });
      container.appendChild(button);
    }
    const clear = document.createElement('button');
    clear.className = 'search-chip';
    clear.textContent = 'Clear history';
    clear.addEventListener('click', () => { this.recentSearches = []; this.renderRecentSearches(); });
    container.appendChild(clear);
  }

  private renderSearchResults(items: SearchResultItem[]): void {
    this.currentSearchResults = items || [];
    if (!items || items.length === 0) {
      this.searchFilterBar.style.display = 'none';
      this.searchResultsList.innerHTML = '<div class="search-status-msg">No results found for this search.</div>';
      return;
    }

    const videoCount = items.filter((i) => (i.itemType || 'video') === 'video').length;
    const channelCount = items.filter((i) => i.itemType === 'channel').length;
    const playlistCount = items.filter((i) => i.itemType === 'playlist').length;

    // Update filter buttons labels and visibility
    const btnAll = this.searchFilterBar.querySelector('[data-filter="all"]');
    const btnVideo = this.searchFilterBar.querySelector('[data-filter="video"]');
    const btnChannel = this.searchFilterBar.querySelector('[data-filter="channel"]') as HTMLElement | null;
    const btnPlaylist = this.searchFilterBar.querySelector('[data-filter="playlist"]') as HTMLElement | null;

    if (btnAll) btnAll.textContent = `All (${items.length})`;
    if (btnVideo) btnVideo.textContent = `Videos & Songs (${videoCount})`;
    if (btnChannel) {
      btnChannel.textContent = `Channels (${channelCount})`;
      btnChannel.style.display = channelCount > 0 ? 'inline-block' : 'none';
    }
    if (btnPlaylist) {
      btnPlaylist.textContent = `Playlists (${playlistCount})`;
      btnPlaylist.style.display = playlistCount > 0 ? 'inline-block' : 'none';
    }

    this.searchFilterBar.style.display = 'flex';
    this.renderFilteredResults();
  }

  private renderFilteredResults(): void {
    const items = this.currentSearchResults.filter((item) => {
      const type = item.itemType || 'video';
      if (this.currentSearchFilter === 'all') return true;
      if (this.currentSearchFilter === 'video') return type === 'video';
      if (this.currentSearchFilter === 'channel') return type === 'channel';
      if (this.currentSearchFilter === 'playlist') return type === 'playlist';
      return true;
    });

    if (this.searchSort === 'title') items.sort((a, b) => a.title.localeCompare(b.title));

    if (items.length === 0) {
      this.searchResultsList.innerHTML = `<div class="search-status-msg">No ${this.currentSearchFilter}s found for this query.</div>`;
      return;
    }

    this.searchResultsList.innerHTML = '';
    for (const item of items) {
      const type = item.itemType || 'video';
      const card = document.createElement('div');
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `${type === 'channel' ? 'Open channel' : 'Play'}: ${item.title}`);
      card.addEventListener('keydown', (event) => {
        if (event.target !== card) return;
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const next = event.key === 'ArrowDown' ? card.nextElementSibling : card.previousElementSibling;
          if (next) (next as HTMLElement).focus();
          else if (event.key === 'ArrowUp') this.searchInput.focus();
        }
      });
      card.className = `search-result-card ${type === 'channel' ? 'search-channel-card' : ''}`;

      if (type === 'channel') {
        card.innerHTML = `
          <div class="search-channel-avatar">
            <img src="${this.escapeHtml(item.thumbnailUrl)}" alt="${this.escapeHtml(item.title)}" />
          </div>
          <div class="search-card-meta">
            <div class="search-card-title">
              ${this.escapeHtml(item.title)}
              <span class="search-badge-channel">CHANNEL</span>
            </div>
            <div class="search-card-sub">
              <span>${this.escapeHtml(item.subscribersText || 'YouTube Creator')}</span>
            </div>
          </div>
          <button class="search-channel-visit-btn" title="Open channel">Visit Channel</button>
        `;

        card.addEventListener('click', () => {
          window.open(item.url, '_blank');
          this.showToast(`Opening Channel: ${item.title}`, '📺');
        });
      } else if (type === 'playlist') {
        card.innerHTML = `
          <div class="search-card-thumb">
            <img src="${this.escapeHtml(item.thumbnailUrl)}" alt="thumbnail" />
            <span class="search-duration-badge">PLAYLIST</span>
          </div>
          <div class="search-card-meta">
            <div class="search-card-title" title="${this.escapeHtml(item.title)}">
              ${this.escapeHtml(item.title)}
              <span class="search-badge-playlist">PLAYLIST</span>
            </div>
            <div class="search-card-sub">
              <span>${this.escapeHtml(item.channel || 'YouTube Playlist')}</span>
              ${item.viewsText ? `<span>• ${this.escapeHtml(item.viewsText)}</span>` : ''}
            </div>
          </div>
        `;

        card.addEventListener('click', () => {
          this.sendCommand({
            type: 'PLAY_QUEUE_ITEM',
            payload: { url: item.url, videoId: item.videoId }
          });
          this.closeSearchModal();
          this.showToast(`Playing Playlist: ${item.title}`, '▶️');
        });
      } else {
        // Video or Song Item
        card.innerHTML = `
          <div class="search-card-thumb">
            <img src="${this.escapeHtml(item.thumbnailUrl)}" alt="thumbnail" />
            ${item.durationText ? `<span class="search-duration-badge">${this.escapeHtml(item.durationText)}</span>` : ''}
          </div>
          <div class="search-card-meta">
            <div class="search-card-title" title="${this.escapeHtml(item.title)}">
              ${this.escapeHtml(item.title)}
              ${item.badgeText ? `<span class="search-duration-badge" style="position:static;display:inline-block;margin-left:6px;background:#ff0033;">${this.escapeHtml(item.badgeText)}</span>` : ''}
            </div>
            <div class="search-card-sub">
              <span>${this.escapeHtml(item.channel || 'YouTube')}</span>
              ${item.viewsText ? `<span>• ${this.escapeHtml(item.viewsText)}</span>` : ''}
            </div>
          </div>
        `;

        card.addEventListener('click', () => {
          this.sendCommand({
            type: 'PLAY_QUEUE_ITEM',
            payload: { url: item.url, videoId: item.videoId }
          });
          this.closeSearchModal();
          this.showToast(`Playing: ${item.title}`, '▶️');
        });
      }

      this.searchResultsList.appendChild(card);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
