# Global YouTube Control Bar (Chrome Extension Manifest V3)

A production-ready **Manifest V3 Chrome Extension** that injects a persistent, modern media-control bar at the bottom of any normal webpage (GitHub, Stack Overflow, Google, Gmail, Reddit, etc.) allowing full control of YouTube playback in background tabs **without ever switching active tabs**.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Host Webpage (GitHub, Stack Overflow, Google, etc.)                     │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ <yt-global-control-bar>                                         │   │
│   │   #shadow-root (Isolated from Host Page CSS)                    │   │
│   │     [Thumb] Video Title   ⏮  ▶/❚❚  ⏭   01:23/04:56  🔊 ━━●  ☰  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 chrome.runtime.sendMessage (Command)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Background Service Worker (Manifest V3)                                 │
│   • TabManager: tracks active YouTube tabs & elects target player       │
│   • Tab lifecycle handling (onRemoved, onUpdated, onReplaced)           │
│   • Relays commands to target YouTube tab without activating it         │
│   • Broadcasts playback state (throttled) to all open control bars      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    chrome.tabs.sendMessage (Direct)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Target YouTube Tab (Running in background)                              │
│   • YouTube Content Script (youtube-content.js)                         │
│   • HTML5 <video> controller (play, pause, seek, volume, mute)          │
│   • Resilient metadata extraction (title, channel, thumbnail)           │
│   • Up-Next / Playlist Queue DOM extractor & background navigation      │
│   • YouTube SPA Lifecycle Observer (yt-navigate-finish, video events)   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Features

- **Background YouTube Control**: Play, pause, seek, adjust volume, mute, advance to next track, or go to previous track without leaving your current webpage.
- **Strict Tab Focus Retention**: Commands never switch tabs or bring YouTube to the foreground.
- **Multiple YouTube Tabs Detection**:
  - Automatically identifies the tab that is actively playing.
  - If multiple YouTube tabs are open, an interactive tab switcher dropdown lets you choose the target player.
- **Scrubbable Progress Bar**:
  - High-precision draggable seek bar with elapsed and total duration timestamps.
  - Live stream detection (`LIVE` badge).
  - Client-side smooth time interpolation with zero UI jitter.
- **Complete Volume Control**:
  - Interactive volume slider (0–100%).
  - One-click mute/unmute toggle.
- **Rich Media Metadata**:
  - Video title with fallback cascade.
  - Channel name.
  - Canonical YouTube thumbnail with graceful error handling.
- **Up Next / Playlist Queue Panel**:
  - Expandable popover panel displaying upcoming videos from active playlists or recommended up-next items.
  - Clicking any queue item navigates the YouTube tab in the background.
  - Clean fallback notice if no queue is available for the current video.
- **Encapsulated Shadow DOM**:
  - Complete isolation from host webpage CSS resets, Tailwind, Bootstrap, and aggressive styles.
  - Does not leak styles into the host page.
- **Show / Hide & Minimized States**:
  - Auto-hides when no YouTube tab is open.
  - Minimize button collapses the bar into a compact floating pill.
  - Close button hides the bar for the current session.
- **Chrome Toolbar Popup**:
  - Instant access from the Chrome toolbar to select target players, toggle playback, view timestamps, and change volume.
- **Dark & Light Theme Support**:
  - Respects user system preferences (`prefers-color-scheme`).

---

## Directory Structure

```text
chrome_extension_youtube/
├── package.json               # Dependencies & scripts
├── tsconfig.json              # Strict TypeScript configuration
├── build.mjs                  # Fast esbuild bundle & asset packaging script
├── src/
│   ├── manifest.json          # Manifest V3 extension configuration
│   ├── types/
│   │   └── messages.ts        # Typed message schemas & playback state models
│   ├── background/
│   │   ├── tab-manager.ts     # YouTube tab tracking, active player election & lifecycle
│   │   └── service-worker.ts  # Manifest V3 service worker managing tabs & command routing
│   ├── content/
│   │   ├── youtube/
│   │   │   ├── index.ts       # YouTube content script entry point & listener
│   │   │   ├── player.ts      # HTML5 <video> controller & command executor
│   │   │   ├── metadata.ts    # Resilient video metadata extractors
│   │   │   ├── queue.ts       # Playlist & Up-Next DOM parser and background navigation
│   │   │   └── spa-observer.ts# SPA navigation & player lifecycle observer
│   │   └── control-bar/
│   │       ├── index.ts       # Webpage content script entry point
│   │       ├── ui.ts          # Shadow DOM container & component renderer
│   │       ├── state.ts       # Client-side state store & smooth progress tracker
│   │       └── styles.ts      # Encapsulated CSS with theme and responsive design
│   ├── popup/
│   │   ├── popup.html         # Toolbar action popup interface
│   │   ├── popup.css
│   │   └── popup.ts
│   └── icons/
│       ├── icon.svg           # Master SVG icon
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
├── dist/                      # Production unpacked extension loaded into Chrome
│   ├── manifest.json
│   ├── background/
│   │   └── service-worker.js
│   ├── content/
│   │   ├── youtube-content.js
│   │   └── control-bar.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── icons/
│   └── tests/
├── tests/
│   ├── tab-manager.test.ts    # Unit tests for tab election & lifecycle
│   ├── state-store.test.ts    # Unit tests for time formatting & progress scrubbing
│   └── e2e-simulation.test.ts # End-to-end command routing & dispatch simulation
└── README.md
```

---

## Installation & Build Instructions

### Prerequisites
- Node.js (v18 or newer)
- npm (v9 or newer)
- Google Chrome or Chromium-based browser (Brave, Edge, Opera, etc.)

### 1. Build the Extension
In the project directory, run:

```bash
npm install
npm run build
```

This compiles all TypeScript files using `esbuild` and outputs the production extension bundle into the `dist/` directory.

### 2. Load into Chrome
1. Open Google Chrome.
2. Navigate to `chrome://extensions`.
3. Toggle on **Developer mode** in the top-right corner.
4. Click the **Load unpacked** button in the top-left.
5. In the file dialog, select the **`dist`** folder inside this project directory (`/home/ashutosh/Downloads/chrome_extension_youtube/dist`).
6. The extension **"Global YouTube Control Bar"** is now installed and active!

---

## Permissions & Manifest V3 Justification

In compliance with Chrome Web Store best practices, only the minimum necessary permissions are requested:

| Permission | Reason |
|---|---|
| `"tabs"` | Required to query open YouTube tabs (`chrome.tabs.query`), read their titles and URLs to distinguish players in multi-tab scenarios, detect when YouTube tabs are closed (`onRemoved`) or navigated (`onUpdated`), and route commands to background tabs without activating them. |
| `"storage"` | Persists user preferences (such as minimized state, default volume preferences, and selected player). |
| `https://*.youtube.com/*`<br>`https://youtube.com/*`<br>`https://m.youtube.com/*` | Host permissions required to inject the YouTube player content script (`youtube-content.js`) to interact with YouTube's HTML5 `<video>` element. |
| `http://*/*`<br>`https://*/*` | Required to inject the isolated Shadow DOM control bar into normal webpages (Google, GitHub, Stack Overflow, Reddit, etc.) so that you can control YouTube from anywhere as requested. |

---

## Security & Privacy Policy

- **100% Local Processing**: All communication occurs directly between tabs and the extension service worker via Chrome's internal messaging APIs (`chrome.runtime` and `chrome.tabs`).
- **No External Backend**: There is zero external server, API proxy, or telemetry endpoint.
- **Zero Browsing History Collection**: The extension does not record, track, or transmit the user's browsing history, URLs, cookies, or YouTube viewing activity.
- **Safe Shadow DOM**: Content scripts run in isolated worlds and UI is attached inside a Shadow DOM, preventing host page scripts from reading extension states or tampering with playback commands.
- **No `eval()` or Remote Code**: Strictly conforms to Manifest V3 CSP. No remote script injection.

---

## Testing & Verification

The project includes an automated test suite executed with Node's native test runner (`node --test`):

```bash
npm test
```

### Test Coverage Summary:
1. **`TabManager Logic`**:
   - Elects single playing YouTube tab automatically.
   - Retains manual user-selected tab even when other tabs are playing.
   - Re-elects remaining active player when current target tab is closed.
   - Generates multi-tab info for the switcher dropdown UI.
2. **`ControlBarStateStore`**:
   - Correctly formats seconds into `mm:ss` and `hh:mm:ss` (including 0, negative values, and NaN).
   - Notifies subscribers on real-time state updates and unsubscribes cleanly.
   - Calculates fractional drag and seek timestamps accurately.
   - Manages minimized pill mode and close states.
3. **`End-to-End Simulation`**:
   - Simulates full message flow: Control Bar -> Background Service Worker -> YouTube Content Script -> HTML5 player -> State broadcast -> Control Bar.
   - Validates `TOGGLE_PLAY`, `SEEK`, `SET_VOLUME`, `TOGGLE_MUTE`, `NEXT`, `PREVIOUS`, `PLAY_QUEUE_ITEM`, and `SELECT_TARGET_TAB` with 100% pass rate.

---

## Known Chrome & YouTube Limitations

1. **Chrome Internal Pages & Webstore**:
   - Chrome Extension security policies prohibit injecting content scripts into `chrome://*`, `chrome-extension://*`, `edge://*`, and the `chromewebstore.google.com` domain. On these pages, the bottom control bar cannot be injected. To control YouTube while on these pages, click the extension icon in the Chrome toolbar to use the **Action Popup**.
2. **Protected DRM Media**:
   - Standard YouTube videos and YouTube Music work completely. Highly restricted movies or DRM-protected streams that disable HTML5 video DOM inspection may restrict programmatic seek operations.
3. **Single Video Queues**:
   - If a standalone YouTube video is playing without an active playlist and without related video recommendations rendered in the DOM by YouTube, the queue panel displays *"Queue unavailable for this video"* as required.
4. **YouTube Ad Break State**:
   - During YouTube pre-roll or mid-roll advertisements, YouTube replaces the active video stream with the ad media. Controls will adjust the active video volume and play state, but seeking past an unskippable ad is restricted by YouTube's player.

---

## Troubleshooting

- **Control bar does not appear on a newly opened webpage**:
  - Ensure at least one YouTube tab (`https://www.youtube.com/...`) is open in Chrome.
  - Refresh the host webpage once after first installing the extension so Chrome injects the content script into pre-existing tabs.
- **Playback does not respond**:
  - Check if the YouTube tab is discarded by Chrome's Memory Saver. Click or wake the YouTube tab, or exempt `youtube.com` in `chrome://settings/performance`.
- **Multiple YouTube tabs playing at once**:
  - Click the **📺 Tabs** button on the control bar or open the toolbar popup to choose which YouTube tab you want to control.

# youtube_controller_extension
