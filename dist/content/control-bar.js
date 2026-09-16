"use strict";
(() => {
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

  // src/content/control-bar/styles.ts
  var CONTROL_BAR_STYLES = `
:host {
  all: initial !important;
  display: block !important;
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483647 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  font-size: 13px !important;
  line-height: 1.4 !important;
  box-sizing: border-box !important;
  pointer-events: none !important;
  user-select: none !important;
  -webkit-font-smoothing: antialiased !important;
}

/* Minimized Floating Circular Pill Mode */
:host(.pill-mode) {
  /* :host covers viewport with pointer-events: none */
}

:host(.controller-hidden) {
  display: none !important;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

svg {
  box-sizing: content-box;
  flex-shrink: 0;
}

/* Global Dark Theme Variables (Inherited across all Shadow DOM elements) */
:host,
.bar-container,
.yt-search-backdrop,
.video-preview-window {
  --yt-bg: #12131a;
  --yt-border: rgba(255, 255, 255, 0.16);
  --yt-text: #ffffff;
  --yt-text-secondary: #aaaaaa;
  --yt-hover-bg: rgba(255, 255, 255, 0.12);
  --yt-active-bg: rgba(255, 255, 255, 0.2);
  --yt-progress-track: rgba(255, 255, 255, 0.25);
  --yt-panel-bg: #181922;
  --yt-shadow: 0 16px 48px rgba(0, 0, 0, 0.75);
  --yt-card-bg: rgba(255, 255, 255, 0.08);
  color: #ffffff !important;
}

/* Light Theme Variables */
:host(.theme-light),
.bar-container.theme-light,
.yt-search-backdrop.theme-light,
.video-preview-window.theme-light,
.theme-light {
  --yt-bg: #ffffff;
  --yt-border: rgba(0, 0, 0, 0.14);
  --yt-text: #111114;
  --yt-text-secondary: #5f6368;
  --yt-hover-bg: rgba(0, 0, 0, 0.08);
  --yt-active-bg: rgba(0, 0, 0, 0.15);
  --yt-progress-track: rgba(0, 0, 0, 0.16);
  --yt-panel-bg: #f9f9fb;
  --yt-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  --yt-card-bg: rgba(0, 0, 0, 0.05);
  color: #111114 !important;
}

/* Main Floating Dock */
.bar-container {
  pointer-events: auto !important;
  position: fixed !important;
  bottom: 18px !important;
  bottom: 22px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  background: var(--yt-bg);
  border: 1px solid var(--yt-border);
  border-radius: 20px;
  box-shadow: var(--yt-shadow);
  color: var(--yt-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  padding: 0 20px;
  gap: 16px;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  width: min(96vw, 1400px) !important;
  height: 72px !important;
  padding: 0 22px !important;
  border-radius: 9999px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 14px !important;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
  
  background: var(--yt-bg) !important;
  border: 1px solid var(--yt-border) !important;
  box-shadow: var(--yt-shadow) !important;
  color: var(--yt-text) !important;
}

/* Light Mode High-Contrast Overrides */
.bar-container.theme-light .video-title {
  color: #0f172a !important;
  text-shadow: none !important;
}

.bar-container.theme-light .channel-name {
  color: #475569 !important;
  text-shadow: none !important;
}

.bar-container.theme-light .icon-btn {
  color: #1e293b !important;
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.09) !important;
}

.bar-container.theme-light .icon-btn:hover {
  color: #000000 !important;
  background: rgba(0, 0, 0, 0.12) !important;
  border-color: rgba(0, 0, 0, 0.22) !important;
}

.bar-container.theme-light .like-btn {
  color: #1e293b !important;
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.09) !important;
}

.bar-container.theme-light .like-btn:hover {
  color: #000000 !important;
  background: rgba(0, 0, 0, 0.12) !important;
  border-color: rgba(0, 0, 0, 0.22) !important;
}

.bar-container.theme-light .like-btn.liked {
  color: #ff0033 !important;
  background: rgba(255, 0, 51, 0.1) !important;
  border-color: rgba(255, 0, 51, 0.35) !important;
}

.bar-container.theme-light .time-row {
  color: #334155 !important;
}

.bar-container.theme-light .progress-track {
  background: rgba(0, 0, 0, 0.12) !important;
}

.bar-container.theme-light .volume-slider {
  background: rgba(0, 0, 0, 0.12) !important;
}

.bar-container.theme-light .volume-slider::-webkit-slider-thumb {
  background: #1e293b !important;
}

.bar-container.theme-light .vol-step-btn {
  color: #334155 !important;
}

.bar-container.theme-light .vol-step-btn:hover {
  color: #000000 !important;
}

.bar-container.theme-light .bar-divider {
  background: rgba(0, 0, 0, 0.16) !important;
}

.bar-container.theme-light .hd-badge-btn {
  color: #0f172a !important;
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1.2px solid rgba(0, 0, 0, 0.18) !important;
}

.bar-container.theme-light .hd-badge-btn:hover {
  background: rgba(0, 0, 0, 0.12) !important;
  border-color: rgba(0, 0, 0, 0.3) !important;
}

.bar-container.hidden {
  display: none !important;
}

/* Smooth Minimizing & Expanding Transitions */
.bar-container.elastic-minimizing {
  animation: elasticSnapToPill 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
  pointer-events: none !important;
}

@keyframes elasticSnapToPill {
  0% {
    transform: translateX(-50%) scale(1);
    opacity: 1;
    border-radius: 20px;
    border-radius: 9999px;
  }
  50% {
    transform: translateX(-80%) scaleX(0.7) scaleY(1.05);
    opacity: 0.85;
    border-radius: 28px;
    border-radius: 9999px;
  }
  100% {
    transform: translateX(-140%) scale(0.25);
    opacity: 0;
    border-radius: 50%;
  }
}

@keyframes elasticPillBounceIn {
  0% {
    transform: scale(0.4) translateX(-20px);
    opacity: 0;
  }
  65% {
    transform: scale(1.12) translateX(2px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateX(0);
    opacity: 1;
  }
}

.floating-pill.elastic-burst {
  animation: elasticPillBurst 0.1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

@keyframes elasticPillBurst {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.22); opacity: 0; }
}

.bar-container.elastic-expanding {
  animation: elasticBarExpand 0.36s cubic-bezier(0.18, 0.89, 0.32, 1.15) forwards !important;
}

@keyframes elasticBarExpand {
  0% {
    transform: translateX(-120%) scaleX(0.3) scaleY(0.7);
    opacity: 0;
    border-radius: 40px;
    border-radius: 9999px;
  }
  60% {
    transform: translateX(-48%) scaleX(1.03) scaleY(0.98);
    opacity: 1;
    border-radius: 22px;
    border-radius: 9999px;
  }
  100% {
    transform: translateX(-50%) scale(1);
    border-radius: 20px;
    border-radius: 9999px;
  }
}

/* Circular Floating YouTube Pill (when minimized in bottom-left corner) */
.floating-pill {
  position: fixed !important;
  left: 24px !important;
  right: auto !important;
  bottom: 24px !important;
  display: none;
  pointer-events: auto !important;
  width: 54px;
  height: 54px;
  background: rgba(16, 18, 27, 0.85) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.28) !important;
  width: 52px;
  height: 52px;
  background: var(--yt-bg) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.32) !important;
  border-radius: 50%;
  box-shadow: var(--yt-shadow);
  box-shadow: var(--yt-shadow);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
}

.floating-pill:hover {
  transform: scale(1.12);
  box-shadow: 0 0 28px rgba(255, 0, 51, 0.8), 0 14px 40px rgba(0, 0, 0, 0.8) !important;
  border-color: #ff0033 !important;
}

.floating-pill svg {
  width: 28px;
  height: 20px;
  display: block;
}

.floating-pill-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #00d26a;
  border: 2px solid #111;
  display: none;
}

.floating-pill.playing .floating-pill-dot {
  display: block;
  animation: pulseDot 1.5s infinite;
}

/* Close / Cut button on Pill hover */
.pill-cut-btn {
  position: absolute !important;
  top: -5px !important;
  right: -5px !important;
  width: 22px !important;
  height: 22px !important;
  border-radius: 50% !important;
  background: #ff0033 !important;
  border: 2px solid #ffffff !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  outline: none !important;
  opacity: 0 !important;
  transform: scale(0.5) !important;
  pointer-events: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.7) !important;
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease !important;
  z-index: 10 !important;
  padding: 0 !important;
}

.pill-cut-btn svg {
  width: 12px !important;
  height: 12px !important;
  fill: #ffffff !important;
  display: block !important;
}

.floating-pill:hover .pill-cut-btn {
  opacity: 1 !important;
  transform: scale(1) !important;
  pointer-events: auto !important;
}

.pill-cut-btn:hover {
  background: #ff1a4a !important;
  transform: scale(1.18) rotate(90deg) !important;
  box-shadow: 0 0 14px rgba(255, 0, 51, 0.95), 0 2px 10px rgba(0, 0, 0, 0.8) !important;
}

@keyframes pulseDot {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
}

:host(.pill-mode) .bar-container {
  display: none !important;
}

:host(.pill-mode) .floating-pill {
  display: flex !important;
  animation: elasticPillBounceIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Left Section: Cover, Title, Channel & Like */
.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
  max-width: 280px;
  min-width: 200px;
  max-width: 270px;
  flex-shrink: 0;
}

.thumbnail-wrap {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  flex-shrink: 0;
  position: relative;
  border: 1px solid var(--yt-border);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

.thumbnail-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumbnail-wrap.empty {
  display: none;
}

.track-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.video-title {
  font-weight: 700;
  font-size: 13.5px;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--yt-text);
  letter-spacing: -0.1px;
  color: #ffffff !important;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.channel-name {
  font-size: 11px;
  color: var(--yt-text-secondary);
  font-size: 10.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.68) !important;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

/* YouTube Like / Thumbs Up Button */
/* YouTube Like / Heart Button */
.like-btn {
  background: none;
  border: none;
  color: var(--yt-text-secondary);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #ffffff;
  cursor: pointer;
  width: 32px;
  height: 32px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease, transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  flex-shrink: 0;
  position: relative;
}

.like-btn:hover {
  color: var(--yt-text);
  background: var(--yt-hover-bg);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.35);
  transform: scale(1.12);
}

.like-btn.liked {
  color: #3ea6ff;
  color: #ff2d55;
  background: rgba(255, 45, 85, 0.18);
  border-color: rgba(255, 45, 85, 0.45);
  box-shadow: 0 0 14px rgba(255, 45, 85, 0.6);
}

.like-btn svg {
  width: 18px;
  height: 18px;
  width: 17px;
  height: 17px;
  fill: currentColor;
}

.like-btn.pop-anim, .preview-like-btn.pop-anim {
  animation: ytThumbPop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes ytThumbPop {
  0% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.38) rotate(-18deg);
  }
  50% {
    transform: scale(0.88) rotate(8deg);
  }
  75% {
    transform: scale(1.15) rotate(-3deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.like-btn svg {
  width: 19px;
  height: 19px;
  fill: currentColor;
}

/* Floating Confirmation Toast */
.dock-toast {
  position: absolute;
  bottom: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%) translateY(8px) scale(0.95);
  background: #18181b;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1000;
  white-space: nowrap;
}

.dock-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

.theme-light .dock-toast {
  background: rgba(255, 255, 255, 0.94);
  color: #0f0f0f;
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.15);
}

/* Center Section: Controls & Seek Bar */
.center-section {
  display: flex;
  align-items: center;
  gap: 16px;
  gap: 18px;
  flex: 1;
  max-width: 560px;
  max-width: 580px;
  justify-content: center;
}

.buttons-group {
  display: flex;
  align-items: center;
  gap: 6px;
  gap: 8px;
  flex-shrink: 0;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--yt-text-secondary);
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease, transform 0.1s ease;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  position: relative;
}

.icon-btn:hover {
  color: var(--yt-text);
  background: var(--yt-hover-bg);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.35);
  transform: scale(1.08);
}

.icon-btn:active {
  transform: scale(0.95);
}

.icon-btn svg {
  width: 18px;
  height: 18px;
  width: 17px;
  height: 17px;
  fill: currentColor;
}

.icon-btn.shuffle-btn.active,
.icon-btn.loop-btn.active {
  background: rgba(255, 45, 85, 0.22);
  border-color: #ff2d55;
  color: #ff2d55;
  box-shadow: 0 0 12px rgba(255, 45, 85, 0.5);
}

/* Explicit 10s Skip Buttons */
.skip-10-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.skip-10-btn svg {
  width: 22px;
  height: 22px;
}

/* Glowing Red Play/Pause Button */
/* 3D Jewel Red Play/Pause Button */
.icon-btn.play-pause-btn {
  width: 44px;
  height: 44px;
  background: #ff0033;
  color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(255, 0, 51, 0.6);
  margin: 0 4px;
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  border-radius: 50% !important;
  background: radial-gradient(circle at 36% 28%, #ff5277 0%, #ff0844 45%, #b30026 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 
    0 0 28px 4px rgba(255, 0, 68, 0.8),
    0 6px 18px rgba(179, 0, 38, 0.55),
    inset 0 2.5px 3px rgba(255, 255, 255, 0.85),
    inset 0 -2px 4px rgba(0, 0, 0, 0.5) !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 4px !important;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease !important;
}

.icon-btn.play-pause-btn:hover {
  background: #ff1a47;
  transform: scale(1.1);
  box-shadow: 0 0 28px rgba(255, 0, 51, 0.85);
  transform: scale(1.1) !important;
  box-shadow: 
    0 0 38px 6px rgba(255, 0, 68, 0.95),
    0 8px 22px rgba(179, 0, 38, 0.7),
    inset 0 2.5px 3px rgba(255, 255, 255, 0.95),
    inset 0 -2px 4px rgba(0, 0, 0, 0.5) !important;
}

.icon-btn.play-pause-btn:active {
  transform: scale(0.96) !important;
}

.icon-btn.play-pause-btn svg {
  width: 20px;
  height: 20px;
  fill: #ffffff;
  width: 20px !important;
  height: 20px !important;
  fill: #ffffff !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35)) !important;
}

/* Track Change Spinner */
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: none;
}

.icon-btn.loading .btn-icon {
  display: none !important;
}

.icon-btn.loading .btn-spinner {
  display: block !important;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Seek Bar with High-Contrast Timestamps Underneath */
.seek-container {
  display: flex;
  flex-direction: column;
  gap: 3px;
  justify-content: center;
  gap: 4px;
  flex: 1;
  min-width: 160px;
  max-width: 250px;
  position: relative;
}

.progress-container {
  position: relative;
  width: 100%;
  height: 14px;
  height: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  touch-action: none;
}

.progress-track {
  width: 100%;
  height: 4.5px;
  background: var(--yt-progress-track);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.24);
  border-radius: 9999px;
  position: relative;
  transition: height 0.12s ease;
}

.progress-container:hover .progress-track,
.progress-container.dragging .progress-track {
  height: 6.5px;
  height: 6px;
}

.progress-fill {
  height: 100%;
  background: #ff0033;
  border-radius: 3px;
  background: linear-gradient(90deg, #ff2d55, #ff456e);
  border-radius: 9999px;
  box-shadow: 0 0 8px rgba(255, 45, 85, 0.6);
  width: 0%;
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  left: 0%;
  width: 13px;
  height: 13px;
  width: 12px;
  height: 12px;
  background: #ffffff;
  border: 2px solid #ff0033;
  border: 1.5px solid #ff2d55;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(1);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.95), 0 2px 5px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  transition: transform 0.1s ease;
}

.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--yt-text-secondary);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-variant-numeric: tabular-nums;
  padding: 0 1px;
  letter-spacing: 0.2px;
}

.progress-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.92);
  color: #fff;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  pointer-events: none;
  display: none;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 100;
}

.progress-container:hover .progress-tooltip {
  display: block;
}

/* LIVE Indicator */
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ff0033;
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.5px;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff0033;
  box-shadow: 0 0 6px #ff0033;
  animation: liveP 1.2s infinite;
}

@keyframes liveP {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

/* Right Tools: Volume, HD, PiP, Queue, Settings, Collapse */
.right-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.volume-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  gap: 5px;
}

.vol-step-btn {
  background: none;
  border: none;
  color: var(--yt-text-secondary);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1;
}

.vol-step-btn:hover {
  color: var(--yt-text);
  color: #ffffff;
}

.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 58px;
  height: 4px;
  background: var(--yt-progress-track);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.24);
  border-radius: 9999px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.5);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8), 0 1px 3px rgba(0, 0, 0, 0.4);
}

/* Vertical Divider */
.bar-divider {
  width: 1.5px;
  height: 26px;
  background: rgba(255, 255, 255, 0.24);
  border-radius: 1px;
  margin: 0 4px;
  flex-shrink: 0;
}

/* Interactive HD / Resolution Badge Button */
.hd-badge-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--yt-border);
  color: var(--yt-text-secondary);
  background: rgba(255, 255, 255, 0.07);
  border: 1.2px solid rgba(255, 255, 255, 0.28);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 9999px;
  letter-spacing: 0.8px;
  cursor: pointer;
  transition: all 0.15s ease;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  line-height: 1;
}

.hd-badge-btn:hover {
  background: var(--yt-hover-bg);
  color: var(--yt-text);
  border-color: var(--yt-text-secondary);
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.45);
  transform: scale(1.06);
}

.hd-badge-btn.active-hd {
  background: rgba(62, 166, 255, 0.16);
  background: rgba(62, 166, 255, 0.22);
  border-color: #3ea6ff;
  color: #3ea6ff;
  box-shadow: 0 0 10px rgba(62, 166, 255, 0.3);
  box-shadow: 0 0 12px rgba(62, 166, 255, 0.5);
}

/* Playback Quality Selector Popover */
.quality-popover {
  position: absolute;
  bottom: calc(100% + 14px);
  right: 65px;
  width: 220px;
  background: var(--yt-panel-bg);
  border: 1px solid var(--yt-border);
  border-radius: 14px;
  box-shadow: var(--yt-shadow);
  padding: 8px 0;
  display: none;
  flex-direction: column;
  z-index: 1000;
  animation: popoverFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.quality-popover.open {
  display: flex;
}

.quality-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px 10px 14px;
  border-bottom: 1px solid var(--yt-border);
  margin-bottom: 4px;
}

.quality-header-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--yt-text-secondary);
  border: 1px solid var(--yt-border);
  padding: 2px 5px;
}

.quality-current-tag {
  font-size: 10px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.12);
  color: var(--yt-text);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  cursor: default;
}

.quality-options-list {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  overflow-y: auto;
}

.quality-option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--yt-text);
  transition: background 0.12s ease;
}

.quality-option-item:hover {
  background: var(--yt-hover-bg);
}

.quality-option-item.selected {
  color: #3ea6ff;
  font-weight: 700;
}

.quality-option-check {
  font-size: 13px;
  color: #3ea6ff;
  display: none;
}

.quality-option-item.selected .quality-option-check {
  display: inline-block;
}

.quality-option-hd-badge {
  font-size: 9px;
  font-weight: 800;
  background: #ff0033;
  color: #ffffff;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 6px;
}

/* Settings Popover Card */
.settings-popover {
  position: absolute;
  bottom: calc(100% + 14px);
  right: 0;
  width: 330px;
  background: var(--yt-panel-bg);
  border: 1px solid var(--yt-border);
  border-radius: 18px;
  box-shadow: var(--yt-shadow);
  padding: 16px;
  display: none;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
  color: var(--yt-text);
}

.settings-popover.open {
  display: flex;
}

.popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--yt-border);
}

.popover-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
  color: var(--yt-text);
}

.popover-brand svg {
  width: 24px;
  height: 17px;
  display: block;
}

.popover-close-btn {
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.popover-close-btn svg {
  width: 14px;
  height: 14px;
  fill: #ffffff !important;
}

.popover-close-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
  color: #ffffff !important;
  transform: scale(1.15) rotate(90deg);
  box-shadow: 0 0 12px rgba(255, 0, 51, 0.85);
}

.popover-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.popover-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--yt-card-bg);
  border: 1px solid var(--yt-border);
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.popover-card:hover {
  background: var(--yt-hover-bg);
}

.popover-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.popover-card-icon {
  font-size: 18px;
}

.popover-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.popover-card-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--yt-text);
}

.popover-card-sub {
  font-size: 10.5px;
  color: var(--yt-text-secondary);
}

.popover-chevron {
  font-size: 16px;
  color: var(--yt-text-secondary);
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 22px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 22px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #ff0033;
}

input:checked + .slider:before {
  transform: translateX(16px);
}

/* Sub-panel (Keyboard & Appearance) */
.sub-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  color: var(--yt-text);
  padding: 4px 0;
}

.sub-panel-back-btn {
  background: none;
  border: none;
  color: var(--yt-text);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  padding: 0;
}

.shortcuts-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
}

.shortcut-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: var(--yt-card-bg);
  border-radius: 6px;
}

.shortcut-key {
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  font-family: monospace;
}

.theme-options-row {
  display: flex;
  gap: 8px;
}

.theme-pill-btn {
  flex: 1;
  background: var(--yt-card-bg);
  border: 1px solid var(--yt-border);
  color: var(--yt-text);
  padding: 8px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s ease;
}

.theme-pill-btn:hover {
  background: var(--yt-hover-bg);
}

.theme-pill-btn.active {
  background: #ff0033;
  color: #fff;
  border-color: #ff0033;
}

.popover-footer {
  text-align: center;
  font-size: 10.5px;
  color: var(--yt-text-secondary);
  padding-top: 4px;
}

/* Floating Queue Popover */
.queue-panel {
  position: absolute;
  bottom: calc(100% + 14px);
  right: 40px;
  width: 360px;
  max-height: 380px;
  background: var(--yt-panel-bg);
  border: 1px solid var(--yt-border);
  border-radius: 16px;
  box-shadow: var(--yt-shadow);
  display: none;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  color: var(--yt-text);
}

.queue-panel.open {
  display: flex;
}

.queue-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--yt-border);
  font-weight: 700;
  font-size: 13px;
}

.close-queue-btn {
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  cursor: pointer;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.close-queue-btn svg {
  width: 14px;
  height: 14px;
  fill: #ffffff !important;
}

.close-queue-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
  color: #ffffff !important;
  transform: scale(1.15) rotate(90deg);
  box-shadow: 0 0 12px rgba(255, 0, 51, 0.85);
}

.queue-list {
  overflow-y: auto;
  max-height: 320px;
  display: flex;
  flex-direction: column;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  transition: background 0.12s ease;
  border-bottom: 1px solid var(--yt-border);
}

.queue-item:hover {
  background: var(--yt-hover-bg);
}

.queue-thumb {
  width: 48px;
  height: 32px;
  border-radius: 4px;
  background: #000;
  flex-shrink: 0;
  overflow: hidden;
}

.queue-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.queue-details {
  flex: 1;
  min-width: 0;
}

.queue-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--yt-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-channel {
  font-size: 10px;
  color: var(--yt-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-empty-msg {
  padding: 24px;
  text-align: center;
  color: var(--yt-text-secondary);
  font-size: 12px;
}

/* ==========================================================================
   Floating Video Preview (with Smart Auto-Vanishing Controls on Hover)
   Floating Video Preview (Draggable, with Complete Video Controls)
   ========================================================================== */
.video-preview-window {
  position: fixed;
  bottom: 84px;
  right: 24px;
  pointer-events: auto !important;
  width: 350px;
  height: 200px;
  border-radius: 14px;
  width: 360px;
  height: 210px;
  border-radius: 16px;
  overflow: hidden;
  background: #000000;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.78), 0 0 0 1px rgba(255, 255, 255, 0.16);
  z-index: 2147483644;
  display: none;
  animation: popoverFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  touch-action: none;
}

.video-preview-window.open {
  display: block;
}

.video-preview-window.is-dragging {
  cursor: grabbing !important;
  transition: none !important;
  box-shadow: 0 26px 65px rgba(0, 0, 0, 0.95), 0 0 0 2px rgba(255, 0, 51, 0.6) !important;
  transform: scale(1.02);
}

.preview-media-wrap {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
}

.preview-media-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Preview controls appear only while the pointer is over the window. */
.preview-controls-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.78) 0%,
    rgba(0, 0, 0, 0.2) 40%,
    rgba(0, 0, 0, 0.88) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease;
}

.video-preview-window:hover .preview-controls-overlay {
  opacity: 1;
  pointer-events: auto;
}

.preview-top-bar {
  display: flex;
  gap: 8px;
  min-width: 0;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: grab;
  padding-bottom: 2px;
}

.video-preview-window.is-dragging .preview-top-bar {
  cursor: grabbing !important;
}

.preview-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.preview-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-drag-grip {
  width: 13px;
  height: 13px;
  fill: rgba(255, 255, 255, 0.65);
  flex-shrink: 0;
}

.preview-top-bar:hover .preview-drag-grip {
  fill: #ffffff;
}

.preview-brand svg {
  width: 18px;
  height: 13px;
  flex-shrink: 0;
}

.preview-top-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.preview-icon-action-btn {
  background: rgba(0, 0, 0, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.28) !important;
  color: #ffffff !important;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.preview-icon-action-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  transform: scale(1.1);
}

.preview-icon-action-btn svg {
  width: 13px;
  height: 13px;
  fill: #ffffff !important;
}

.preview-close-btn {
  background: rgba(0, 0, 0, 0.65) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.35) !important;
  color: #ffffff !important;
  width: 26px;
  height: 26px;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.preview-close-btn svg {
  width: 14px;
  height: 14px;
  width: 13px;
  height: 13px;
  fill: #ffffff !important;
}

.preview-close-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
  color: #ffffff !important;
  transform: scale(1.15) rotate(90deg);
  box-shadow: 0 0 12px rgba(255, 0, 51, 0.85);
}

.preview-center-controls {
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  gap: 20px;
  gap: 12px;
}

.preview-icon-btn {
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  width: 36px;
  height: 36px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: background 0.15s ease, transform 0.12s ease;
  transition: background 0.15s ease, transform 0.12s ease, border-color 0.15s ease;
}

.preview-icon-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.15);
  border-color: rgba(255, 255, 255, 0.45);
  transform: scale(1.12);
}

.preview-icon-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.preview-icon-btn svg {
  width: 17px;
  height: 17px;
  fill: currentColor;
}

.preview-prev-track,
.preview-next-track {
  display: flex;
}

.preview-play-btn {
  width: 44px;
  height: 44px;
  background: #ff0033;
  box-shadow: 0 0 16px rgba(255, 0, 51, 0.6);
  border-color: #ff0033;
  box-shadow: 0 0 16px rgba(255, 0, 51, 0.65);
}

.preview-play-btn:hover {
  background: #cc0029;
  border-color: #cc0029;
  transform: scale(1.12);
  box-shadow: 0 0 20px rgba(255, 0, 51, 0.85);
}

.preview-bottom-bar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.preview-progress-track {
  width: 100%;
  height: 3px;
  height: 4px;
  background: rgba(255, 255, 255, 0.28);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  transition: height 0.12s ease;
}

.preview-progress-track:hover {
  height: 5px;
  height: 6px;
}

.preview-progress-fill {
  height: 100%;
  background: #ff0033;
  border-radius: 2px;
  width: 0%;
}

.preview-bottom-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #e0e0e0;
  font-weight: 500;
}

.preview-meta-left {
  display: flex;
  align-items: center;
}

.preview-meta-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-vol-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.preview-vol-btn {
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  opacity: 0.85;
  transition: opacity 0.15s ease;
}

.preview-vol-btn:hover {
  opacity: 1;
}

.preview-vol-btn svg {
  width: 14px;
  height: 14px;
  fill: #ffffff;
}

.preview-vol-slider {
  width: 44px;
  height: 3px;
  appearance: none;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  accent-color: #ff0033;
}

.preview-vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
  cursor: pointer;
}

.preview-open-yt {
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.15s ease, color 0.15s ease;
  font-size: 10.5px;
}

.preview-open-yt:hover {
  opacity: 1;
  color: #3ea6ff;
}

/* ==========================================================================
   YouTube Search Modal & Results Overlay
   ========================================================================== */
.yt-search-backdrop {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  pointer-events: auto !important;
  background: rgba(0, 0, 0, 0.75);
  z-index: 2147483646;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.yt-search-backdrop.open {
  display: flex !important;
}

.yt-search-modal {
  width: min(92vw, 640px);
  max-height: min(85vh, 660px);
  margin: auto;
  background: rgba(18, 19, 26, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 22px;
  box-shadow: var(--yt-shadow);
  background: #181922 !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 20px;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #ffffff !important;
  animation: modalCenterPop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.yt-search-backdrop.theme-light {
  background: rgba(0, 0, 0, 0.45);
}

.yt-search-backdrop.theme-light .yt-search-modal {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: var(--yt-shadow);
  color: #111114;
  background: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.15) !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25) !important;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-modal-title {
  color: #111114;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-modal-header,
.yt-search-backdrop.theme-light .search-input-section {
  border-color: rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.1) !important;
}

.yt-search-backdrop.theme-light .search-cut-btn {
  background: rgba(0, 0, 0, 0.07) !important;
  border-color: rgba(0, 0, 0, 0.15) !important;
  background: rgba(0, 0, 0, 0.08) !important;
  border-color: rgba(0, 0, 0, 0.18) !important;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-cut-btn svg {
  fill: #111114 !important;
}

.yt-search-backdrop.theme-light .search-cut-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
}

.yt-search-backdrop.theme-light .search-cut-btn:hover svg {
  fill: #ffffff !important;
}

.yt-search-backdrop.theme-light .search-input-box {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.18) !important;
}

.yt-search-backdrop.theme-light .search-icon-inside {
  fill: #55555e !important;
}

.yt-search-backdrop.theme-light .search-text-input {
  color: #111114;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-text-input::placeholder {
  color: #777780 !important;
}

.yt-search-backdrop.theme-light .search-clear-btn {
  color: #55555e !important;
}

.yt-search-backdrop.theme-light .search-status-msg {
  color: #55555e !important;
}

.yt-search-backdrop.theme-light .search-card-title {
  color: #111114;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-card-sub {
  color: #55555e !important;
}

.yt-search-backdrop.theme-light .search-result-card:hover {
  background: rgba(0, 0, 0, 0.06) !important;
}

.yt-search-backdrop.theme-light .search-chip {
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  color: #33333e !important;
}

.yt-search-backdrop.theme-light .search-chip:hover {
  background: rgba(0, 0, 0, 0.1) !important;
  border-color: rgba(0, 0, 0, 0.22) !important;
  color: #000000 !important;
}

.yt-search-backdrop.theme-light .search-filter-bar {
  border-color: rgba(0, 0, 0, 0.08) !important;
}

.yt-search-backdrop.theme-light .search-filter-btn {
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  color: #44444e !important;
}

.yt-search-backdrop.theme-light .search-filter-btn:hover {
  background: rgba(0, 0, 0, 0.09) !important;
  color: #000000 !important;
}

.yt-search-backdrop.theme-light .search-filter-btn.active {
  background: #065fd4 !important;
  border-color: #065fd4 !important;
  color: #ffffff !important;
}

.yt-search-backdrop.theme-light .search-channel-card {
  background: rgba(0, 0, 0, 0.03) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.yt-search-backdrop.theme-light .search-channel-avatar {
  border-color: rgba(0, 0, 0, 0.15) !important;
}

.yt-search-backdrop.theme-light .search-channel-visit-btn {
  background: rgba(0, 0, 0, 0.07) !important;
  border: 1px solid rgba(0, 0, 0, 0.15) !important;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-channel-visit-btn:hover {
  background: #cc0000 !important;
  border-color: #cc0000 !important;
  color: #ffffff !important;
}

@keyframes modalCenterPop {
  0% { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.search-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px 20px;
  border-bottom: 1px solid var(--yt-border);
}

.search-modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--yt-text);
  color: #ffffff !important;
}

.search-modal-title svg {
  width: 24px;
  height: 17px;
  flex-shrink: 0;
}

.search-cut-btn {
  background: rgba(255, 255, 255, 0.14) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.28) !important;
  color: #ffffff !important;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.search-cut-btn svg {
  width: 18px;
  height: 18px;
  fill: #ffffff !important;
}

.search-cut-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
  color: #ffffff !important;
  transform: scale(1.14) rotate(90deg);
  box-shadow: 0 0 16px rgba(255, 0, 51, 0.85);
}

.search-input-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--yt-border);
}

.search-input-box {
  display: flex;
  align-items: center;
  background: var(--yt-card-bg);
  border: 1px solid var(--yt-border);
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 24px;
  padding: 0 16px;
  height: 44px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-input-box:focus-within {
  border-color: #3ea6ff;
  box-shadow: 0 0 0 2px rgba(62, 166, 255, 0.25);
  border-color: #3ea6ff !important;
  box-shadow: 0 0 0 2px rgba(62, 166, 255, 0.3) !important;
}

.search-icon-inside {
  width: 18px;
  height: 18px;
  fill: var(--yt-text-secondary);
  fill: #aaaaaa !important;
  margin-right: 10px;
  flex-shrink: 0;
}

.search-text-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--yt-text);
  color: #ffffff !important;
  font-size: 14px;
  font-family: inherit;
}

.search-text-input::placeholder {
  color: var(--yt-text-secondary);
  color: #888894 !important;
}

.search-clear-btn {
  background: none;
  border: none;
  color: var(--yt-text-secondary);
  color: #aaaaaa !important;
  cursor: pointer;
  font-size: 14px;
  display: none;
  padding: 4px;
}

.search-clear-btn:hover {
  color: var(--yt-text);
  color: #ffffff !important;
}

.search-results-list {
  overflow-y: auto;
  padding: 8px 12px;
  max-height: 440px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  gap: 6px;
}

.search-status-msg {
  padding: 32px 20px;
  text-align: center;
  color: var(--yt-text-secondary);
  color: #aaaaaa !important;
  font-size: 13px;
}

.search-result-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.12s ease, transform 0.08s ease;
  background: transparent;
  transition: background 0.15s ease, transform 0.08s ease;
}

.search-result-card:hover {
  background: var(--yt-hover-bg);
  background: rgba(255, 255, 255, 0.1) !important;
  transform: translateX(2px);
}

.search-card-thumb {
  width: 96px;
  height: 54px;
  border-radius: 6px;
  border-radius: 8px;
  background: #000;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.search-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.search-duration-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.85);
  color: #ffffff;
  background: rgba(0, 0, 0, 0.88);
  color: #ffffff !important;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
}

.search-card-meta {
  flex: 1;
  min-width: 0;
}

.search-card-title {
  font-size: 13.5px;
  font-size: 14px;
  font-weight: 600;
  color: var(--yt-text);
  margin-bottom: 3px;
  line-height: 1.3;
  color: #ffffff !important;
  margin-bottom: 4px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.search-card-sub {
  font-size: 11.5px;
  color: var(--yt-text-secondary);
  font-size: 12px;
  color: #aaaaaa !important;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.3;
}

.search-recommendation-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.search-chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  color: #dddddd !important;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  outline: none;
}

.search-chip:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.32);
  color: #ffffff !important;
  transform: translateY(-1px);
}

.search-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
}

.search-filter-btn {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  color: #cccccc !important;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  outline: none;
}

.search-filter-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff !important;
}

.search-filter-btn.active {
  background: #3ea6ff !important;
  border-color: #3ea6ff !important;
  color: #000000 !important;
  font-weight: 700;
}

.search-channel-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 14px;
  border-radius: 14px;
}

.search-channel-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.22);
  flex-shrink: 0;
}

.search-channel-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.search-badge-channel {
  background: rgba(255, 0, 51, 0.2);
  border: 1px solid rgba(255, 0, 51, 0.4);
  color: #ff4e6b !important;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
  vertical-align: middle;
  letter-spacing: 0.5px;
}

.search-badge-playlist {
  background: rgba(62, 166, 255, 0.2);
  border: 1px solid rgba(62, 166, 255, 0.4);
  color: #3ea6ff !important;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
  vertical-align: middle;
  letter-spacing: 0.5px;
}

.search-channel-visit-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 16px;
  color: #ffffff !important;
  font-size: 11.5px;
  font-weight: 600;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  outline: none;
}

.search-channel-visit-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
  color: #ffffff !important;
}

/* ==========================================================================
   Comprehensive Responsive Adjustments (Desktop, Tablet, Mobile)
   ========================================================================== */
@media (max-width: 1040px) {
  .bar-container {
    width: 96% !important;
    padding: 0 14px;
    gap: 12px;
  }
  .left-section {
    min-width: 180px;
    max-width: 230px;
  }
  .volume-slider {
    width: 44px;
  }
}

@media (max-width: 860px) {
  .bar-container {
    height: 64px;
    padding: 0 12px;
    gap: 10px;
  }
  .left-section {
    min-width: 140px;
    max-width: 180px;
  }
  .vol-step-btn {
    display: none !important;
  }
  .hd-badge-btn {
    display: none !important;
  }
  .seek-container {
    min-width: 130px;
  }
}

@media (max-width: 680px) {
  .bar-container {
    height: 58px;
    padding: 0 10px;
    gap: 8px;
    border-radius: 16px;
    bottom: 12px !important;
    width: 97% !important;
  }
  .left-section {
    min-width: 100px;
    max-width: 130px;
  }
  .channel-name {
    display: none !important;
  }
  .volume-wrap {
    display: none !important;
  }
  .preview-toggle-btn {
    display: none !important;
  }
  .queue-btn {
    display: none !important;
  }
  .skip-10-btn {
    display: none !important;
  }
  .time-row {
    font-size: 10px;
  }
  .yt-search-modal {
    width: 95vw;
    max-height: 90vh;
    border-radius: 18px;
  }
  .search-card-thumb {
    width: 76px;
    height: 44px;
  }
  .search-card-title {
    font-size: 12.5px;
  }
}

@media (max-width: 480px) {
  .bar-container {
    gap: 6px;
    padding: 0 8px;
  }
  .thumbnail-wrap {
    width: 36px;
    height: 36px;
  }
  .like-btn {
    display: none !important;
  }
  .buttons-group {
    gap: 4px;
  }
  .icon-btn.play-pause-btn {
    width: 38px;
    height: 38px;
  }
  .search-input-box {
    height: 40px;
    padding: 0 12px;
  }
  .floating-pill {
    left: 14px !important;
    bottom: 14px !important;
    width: 48px;
    height: 48px;
  }
  .floating-pill svg {
    width: 24px;
    height: 18px;
  }
}

/* Stable, accessible queue and search controls */
.queue-panel { max-height: min(480px, calc(100vh - 120px)); width: min(390px, calc(100vw - 32px)); }
.queue-header, .queue-tools, .queue-summary { flex-shrink: 0; }
.queue-tools { display: flex; gap: 8px; padding: 12px 14px 6px; }
.queue-filter { min-width: 0; flex: 1; }
.queue-filter, .queue-current-btn, .search-sort {
  font: inherit; color: var(--yt-text); background: var(--yt-bg);
  border: 1px solid var(--yt-border); border-radius: 8px; padding: 7px 9px;
}
.queue-current-btn { cursor: pointer; font-size: 11px; }
.queue-current-btn:disabled { opacity: 0.45; cursor: default; }
.queue-summary { padding: 0 14px 8px; color: var(--yt-text-secondary); font-size: 11px; }
.queue-list { min-height: 0; overscroll-behavior: contain; scrollbar-gutter: stable; scrollbar-width: thin; scrollbar-color: #666 transparent; }
.queue-item { flex-shrink: 0; width: 100%; background: transparent; color: var(--yt-text); font: inherit; text-align: left; border: 0; border-bottom: 1px solid var(--yt-border); }
.queue-item.current { background: var(--yt-hover-bg); box-shadow: inset 3px 0 #ff0033; }
.queue-duration { flex-shrink: 0; font-size: 10px; color: var(--yt-text-secondary); }
.queue-item.current .queue-duration { color: #ff456e; }
.queue-item:focus-visible, .search-result-card:focus-visible, .queue-filter:focus-visible,
.queue-current-btn:focus-visible, .search-chip:focus-visible, .search-sort:focus-visible {
  outline: 2px solid #5aa9ff; outline-offset: -2px;
}
.search-tools, .search-recents { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 20px; color: var(--yt-text-secondary); font-size: 11px; flex-shrink: 0; }
.search-tools { justify-content: space-between; border-bottom: 1px solid var(--yt-border); }
.search-recents:empty { display: none; }
.search-recents .search-chip { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-tools label { display: flex; align-items: center; gap: 6px; }
.search-results-list { min-height: 0; overscroll-behavior: contain; scrollbar-gutter: stable; }
.search-status-msg .search-chip { display: block; margin: 12px auto 0; }

.preview-like-btn.liked svg { fill: #ff2d55 !important; }
.like-btn.unlike-anim, .preview-like-btn.unlike-anim { animation: ytUnlike 0.25s ease-out; }
@keyframes ytUnlike { 50% { transform: scale(0.8) rotate(8deg); } }
.like-btn.pop-anim::after, .preview-like-btn.pop-anim::after {
  content: ''; position: absolute; inset: -4px; border: 2px solid #ff456e;
  border-radius: 50%; pointer-events: none; animation: ytLikeRing 0.45s ease-out forwards;
}
.preview-like-btn { position: relative; }
@keyframes ytLikeRing { from { opacity: 0.9; transform: scale(0.7); } to { opacity: 0; transform: scale(1.5); } }
@media (prefers-reduced-motion: reduce) {
  .like-btn.pop-anim, .preview-like-btn.pop-anim, .like-btn.unlike-anim, .preview-like-btn.unlike-anim { animation: none; }
  .like-btn.pop-anim::after, .preview-like-btn.pop-anim::after { display: none; }
}
`;

  // src/content/control-bar/ui.ts
  var ControlBarUI = class {
    hostElement;
    shadow;
    store;
    // Cached DOM elements
    container;
    floatingPill;
    thumbWrap;
    thumbImg;
    titleEl;
    channelEl;
    likeBtn;
    thumbOutlineIcon;
    thumbFilledIcon;
    dockToast;
    toastMsgEl;
    toastIconEl;
    toastTimer = null;
    hdBtn;
    qualityPopover;
    qualityListEl;
    qualityTagEl;
    isQualityOpen = false;
    // Video Preview Window & Controls
    videoPreviewWindow;
    previewTopBar;
    previewThumbImg;
    previewTitleText;
    previewLikeBtn;
    prevThumbOutlineIcon;
    prevThumbFilledIcon;
    previewFullscreenBtn;
    previewCloseBtn;
    previewPrevBtn;
    previewSkipBackBtn;
    previewPlayBtn;
    previewPlayIcon;
    previewPauseIcon;
    previewSkipFwdBtn;
    previewNextBtn;
    previewProgressTrack;
    previewProgressFill;
    previewTimeEl;
    previewVolBtn;
    prevSpeakerIcon;
    prevMutedIcon;
    previewVolSlider;
    previewOpenYt;
    previewToggleBtn;
    isPreviewOpen = false;
    isPreviewDragging = false;
    // Search Modal Elements
    searchBtn;
    searchBackdrop;
    searchInput;
    searchClearBtn;
    searchCutBtn;
    searchResultsList;
    searchFilterBar;
    searchChipsContainer;
    currentSearchResults = [];
    currentSearchFilter = "all";
    searchDebounceTimer = null;
    isSearchOpen = false;
    searchRequestId = 0;
    recentSearches = [];
    searchSort = "relevance";
    queueSignature = "";
    qualitySignature = "";
    queueFilter;
    prevBtn;
    skip10BackBtn;
    playPauseBtn;
    playIcon;
    pauseIcon;
    skip10FwdBtn;
    nextBtn;
    progressContainer;
    progressFill;
    progressThumb;
    progressTooltip;
    currentTimeEl;
    durationTimeEl;
    muteBtn;
    speakerIcon;
    mutedIcon;
    volDownBtn;
    volUpBtn;
    volumeSlider;
    pipBtn;
    queueBtn;
    queuePanel;
    queueList;
    settingsBtn;
    settingsPopover;
    barToggleInput;
    hideBtn;
    shuffleBtn;
    loopBtn;
    // Settings popover views
    popoverMainView;
    popoverShortcutsView;
    popoverAppearanceView;
    hotkeysToggleInput;
    darkThemeBtn;
    lightThemeBtn;
    isQueueOpen = false;
    isSettingsOpen = false;
    isPillMode = false;
    isAnimatingPill = false;
    isLoadingTrack = false;
    loadingTimeout = null;
    lastTrackId = null;
    isLiked = false;
    pendingLike = null;
    isShuffleActive = false;
    isLoopActive = false;
    hotkeysEnabled = true;
    currentTheme = "dark";
    constructor(store) {
      this.store = store;
      this.hostElement = document.createElement("yt-global-control-bar");
      this.shadow = this.hostElement.attachShadow({ mode: "open" });
      this.render();
      this.loadPreferences();
      this.attachEventListeners();
      this.attachKeyboardHotkeys();
      this.mount();
      this.store.subscribe(() => this.updateView());
    }
    mount() {
      if (document.body) {
        document.body.appendChild(this.hostElement);
      } else {
        document.documentElement.appendChild(this.hostElement);
      }
    }
    loadPreferences() {
      try {
        chrome.storage.local.get(["ytTheme", "ytHotkeys", "ytPillMode"], (res) => {
          if (res.ytTheme) {
            this.setTheme(res.ytTheme);
          }
          if (typeof res.ytHotkeys === "boolean") {
            this.hotkeysEnabled = res.ytHotkeys;
            this.hotkeysToggleInput.checked = res.ytHotkeys;
          }
          if (res.ytPillMode) {
            this.setPillMode(true);
          }
        });
      } catch {
      }
    }
    render() {
      const styleEl = document.createElement("style");
      styleEl.textContent = CONTROL_BAR_STYLES;
      this.shadow.appendChild(styleEl);
      const pill = document.createElement("div");
      pill.className = "floating-pill";
      pill.title = "Click to expand YouTube Player";
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
      const wrapper = document.createElement("div");
      wrapper.className = "bar-container hidden";
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
          <button class="icon-btn skip-10-btn skip-back-btn" title="Rewind 10 seconds (J / \u2190)" aria-label="Rewind 10s">
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
          <button class="icon-btn skip-10-btn skip-fwd-btn" title="Forward 10 seconds (L / \u2192)" aria-label="Forward 10s">
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
          <button class="vol-step-btn vol-down-btn" title="Decrease Volume (-10%)">\u2212</button>
          <input type="range" class="volume-slider" min="0" max="100" value="100" title="Volume" />
          <button class="vol-step-btn vol-up-btn" title="Increase Volume (+10%)">\uFF0B</button>
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
              <span class="popover-card-icon">\u{1F5A5}</span>
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
              <span class="popover-card-icon">\u2328</span>
              <div class="popover-card-text">
                <span class="popover-card-title">Keyboard Shortcuts</span>
                <span class="popover-card-sub">Space: Play/Pause \u2022 J/L: \xB110s \u2022 M: Mute</span>
              </div>
            </div>
            <span class="popover-chevron">\u203A</span>
          </div>

          <!-- Item 3: Appearance (Click to open theme sub-view) -->
          <div class="popover-card popover-appearance-card">
            <div class="popover-card-left">
              <span class="popover-card-icon">\u{1F5B5}</span>
              <div class="popover-card-text">
                <span class="popover-card-title">Appearance</span>
                <span class="popover-card-sub">Dark / Light Mode</span>
                <span class="popover-card-sub">Dark / Light Mode</span>
              </div>
            </div>
            <span class="popover-chevron">\u203A</span>
          </div>

          <div class="popover-footer">
            Made with \u2764\uFE0F for a better YouTube experience
          </div>
        </div>

        <!-- Shortcuts Sub-View -->
        <div class="popover-view shortcuts-view" style="display:none;">
          <div class="sub-panel-header back-to-main">
            <button class="sub-panel-back-btn">\u2039 Back</button>
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
            <div class="shortcut-row"><span>Rewind 10 Seconds</span><span class="shortcut-key">J or \u2190</span></div>
            <div class="shortcut-row"><span>Forward 10 Seconds</span><span class="shortcut-key">L or \u2192</span></div>
            <div class="shortcut-row"><span>Volume Up / Down</span><span class="shortcut-key">\u2191 / \u2193</span></div>
            <div class="shortcut-row"><span>Mute / Unmute</span><span class="shortcut-key">M</span></div>
          </div>
        </div>

        <!-- Appearance Sub-View -->
        <div class="popover-view appearance-view" style="display:none;">
          <div class="sub-panel-header back-to-main">
            <button class="sub-panel-back-btn">\u2039 Back</button>
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
          <input class="queue-filter" type="search" placeholder="Filter title or channel\u2026" aria-label="Filter queue" />
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
        <span class="toast-icon">\u{1F44D}</span>
        <span class="toast-msg">Added to Liked videos</span>
      </div>
    `;
      const previewWindow = document.createElement("div");
      previewWindow.className = "video-preview-window";
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
                <span class="preview-open-yt" title="Open YouTube tab">youtube.com \u2197</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
      const searchBackdrop = document.createElement("div");
      searchBackdrop.className = "yt-search-backdrop";
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
            <button class="search-clear-btn" title="Clear">\u2715</button>
          </div>
          <div class="search-recommendation-chips">
            <button class="search-chip" data-query="Top Songs">\u{1F525} Top Songs</button>
            <button class="search-chip" data-query="Lofi Hip Hop radio">\u{1F3A7} Lofi Beats</button>
            <button class="search-chip" data-query="Trending Music">\u26A1 Trending Music</button>
            <button class="search-chip" data-query="Chill Acoustic">\u2615 Chill</button>
            <button class="search-chip" data-query="Rock Classics">\u{1F3B8} Rock Classics</button>
            <button class="search-chip" data-query="Podcasts">\u{1F399}\uFE0F Podcasts</button>
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
          <span>\u2193 Browse results \xB7 Enter to play \xB7 Esc to close</span>
          <label>Sort <select class="search-sort"><option value="relevance">Relevance</option><option value="title">Title A\u2013Z</option></select></label>
        </div>
        <div class="search-results-list" aria-label="Search results">
          <div class="search-status-msg">Type to search songs, artists, channels or playlists on YouTube...</div>
        </div>
      </div>
    `;
      this.shadow.appendChild(wrapper);
      this.shadow.appendChild(previewWindow);
      this.shadow.appendChild(searchBackdrop);
      this.container = wrapper;
      this.thumbWrap = wrapper.querySelector(".thumbnail-wrap");
      this.thumbImg = wrapper.querySelector(".thumbnail-wrap img");
      this.titleEl = wrapper.querySelector(".video-title");
      this.channelEl = wrapper.querySelector(".channel-name");
      this.likeBtn = wrapper.querySelector(".like-btn");
      this.thumbOutlineIcon = wrapper.querySelector(".thumb-outline");
      this.thumbFilledIcon = wrapper.querySelector(".thumb-filled");
      this.dockToast = wrapper.querySelector(".dock-toast");
      this.toastMsgEl = wrapper.querySelector(".toast-msg");
      this.toastIconEl = wrapper.querySelector(".toast-icon");
      this.hdBtn = wrapper.querySelector(".hd-badge-btn");
      this.qualityPopover = wrapper.querySelector(".quality-popover");
      this.qualityListEl = wrapper.querySelector(".quality-options-list");
      this.qualityTagEl = wrapper.querySelector(".quality-current-tag");
      this.videoPreviewWindow = previewWindow;
      this.previewTopBar = previewWindow.querySelector(".preview-top-bar");
      this.previewThumbImg = previewWindow.querySelector(".preview-thumb-img");
      this.previewTitleText = previewWindow.querySelector(".preview-title-text");
      this.previewLikeBtn = previewWindow.querySelector(".preview-like-btn");
      this.prevThumbOutlineIcon = previewWindow.querySelector(".prev-thumb-outline");
      this.prevThumbFilledIcon = previewWindow.querySelector(".prev-thumb-filled");
      this.previewFullscreenBtn = previewWindow.querySelector(".preview-fullscreen-btn");
      this.previewCloseBtn = previewWindow.querySelector(".preview-close-btn");
      this.previewPrevBtn = previewWindow.querySelector(".preview-prev-track");
      this.previewSkipBackBtn = previewWindow.querySelector(".preview-skip-back");
      this.previewPlayBtn = previewWindow.querySelector(".preview-play-btn");
      this.previewPlayIcon = previewWindow.querySelector(".prev-play-icon");
      this.previewPauseIcon = previewWindow.querySelector(".prev-pause-icon");
      this.previewSkipFwdBtn = previewWindow.querySelector(".preview-skip-fwd");
      this.previewNextBtn = previewWindow.querySelector(".preview-next-track");
      this.previewProgressTrack = previewWindow.querySelector(".preview-progress-track");
      this.previewProgressFill = previewWindow.querySelector(".preview-progress-fill");
      this.previewTimeEl = previewWindow.querySelector(".preview-time");
      this.previewVolBtn = previewWindow.querySelector(".preview-vol-btn");
      this.prevSpeakerIcon = previewWindow.querySelector(".prev-speaker-icon");
      this.prevMutedIcon = previewWindow.querySelector(".prev-muted-icon");
      this.previewVolSlider = previewWindow.querySelector(".preview-vol-slider");
      this.previewOpenYt = previewWindow.querySelector(".preview-open-yt");
      this.previewToggleBtn = wrapper.querySelector(".preview-toggle-btn");
      this.searchBtn = wrapper.querySelector(".search-btn");
      this.searchBackdrop = searchBackdrop;
      this.searchInput = searchBackdrop.querySelector(".search-text-input");
      this.searchClearBtn = searchBackdrop.querySelector(".search-clear-btn");
      this.searchCutBtn = searchBackdrop.querySelector(".search-cut-btn");
      this.searchResultsList = searchBackdrop.querySelector(".search-results-list");
      this.searchFilterBar = searchBackdrop.querySelector(".search-filter-bar");
      this.searchChipsContainer = searchBackdrop.querySelector(".search-recommendation-chips");
      this.shuffleBtn = wrapper.querySelector(".shuffle-btn");
      this.prevBtn = wrapper.querySelector(".prev-btn");
      this.skip10BackBtn = wrapper.querySelector(".skip-back-btn");
      this.playPauseBtn = wrapper.querySelector(".play-pause-btn");
      this.playIcon = wrapper.querySelector(".play-icon");
      this.pauseIcon = wrapper.querySelector(".pause-icon");
      this.skip10FwdBtn = wrapper.querySelector(".skip-fwd-btn");
      this.nextBtn = wrapper.querySelector(".next-btn");
      this.loopBtn = wrapper.querySelector(".loop-btn");
      this.progressContainer = wrapper.querySelector(".progress-container");
      this.progressFill = wrapper.querySelector(".progress-fill");
      this.progressThumb = wrapper.querySelector(".progress-thumb");
      this.progressTooltip = wrapper.querySelector(".progress-tooltip");
      this.currentTimeEl = wrapper.querySelector(".current-time");
      this.durationTimeEl = wrapper.querySelector(".duration-time");
      this.muteBtn = wrapper.querySelector(".mute-btn");
      this.speakerIcon = wrapper.querySelector(".speaker-icon");
      this.mutedIcon = wrapper.querySelector(".muted-icon");
      this.volDownBtn = wrapper.querySelector(".vol-down-btn");
      this.volUpBtn = wrapper.querySelector(".vol-up-btn");
      this.volumeSlider = wrapper.querySelector(".volume-slider");
      this.pipBtn = wrapper.querySelector(".pip-btn");
      this.queueBtn = wrapper.querySelector(".queue-btn");
      this.queuePanel = wrapper.querySelector(".queue-panel");
      this.queueList = wrapper.querySelector(".queue-list");
      this.queueFilter = wrapper.querySelector(".queue-filter");
      this.settingsBtn = wrapper.querySelector(".settings-btn");
      this.settingsPopover = wrapper.querySelector(".settings-popover");
      this.barToggleInput = wrapper.querySelector(".popover-bar-toggle");
      this.hideBtn = wrapper.querySelector(".hide-btn");
      this.popoverMainView = wrapper.querySelector(".main-view");
      this.popoverShortcutsView = wrapper.querySelector(".shortcuts-view");
      this.popoverAppearanceView = wrapper.querySelector(".appearance-view");
      this.hotkeysToggleInput = wrapper.querySelector(".hotkeys-toggle");
      this.darkThemeBtn = wrapper.querySelector(".dark-btn");
      this.lightThemeBtn = wrapper.querySelector(".light-btn");
    }
    setPillMode(pill) {
      this.isPillMode = pill;
      this.hostElement.classList.toggle("pill-mode", pill);
      try {
        chrome.storage.local.set({ ytPillMode: pill });
      } catch {
      }
    }
    setTheme(theme) {
      this.currentTheme = theme;
      this.darkThemeBtn.classList.toggle("active", theme === "dark");
      this.lightThemeBtn.classList.toggle("active", theme === "light");
      const isLight = theme === "light";
      this.hostElement.classList.toggle("theme-light", isLight);
      this.container.classList.toggle("theme-light", isLight);
      this.settingsPopover.classList.toggle("theme-light", isLight);
      this.queuePanel.classList.toggle("theme-light", isLight);
      this.searchBackdrop.classList.toggle("theme-light", isLight);
      this.videoPreviewWindow.classList.toggle("theme-light", isLight);
      try {
        chrome.storage.local.set({ ytTheme: theme });
      } catch {
      }
    }
    attachKeyboardHotkeys() {
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
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
            this.qualityPopover.classList.remove("open");
            return;
          }
          if (this.isSettingsOpen) {
            this.isSettingsOpen = false;
            this.settingsPopover.classList.remove("open");
            return;
          }
          if (this.isQueueOpen) {
            this.isQueueOpen = false;
            this.queuePanel.classList.remove("open");
            return;
          }
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
          e.preventDefault();
          if (this.isSearchOpen) {
            this.closeSearchModal();
          } else {
            this.openSearchModal();
          }
          return;
        }
        if (!this.hotkeysEnabled)
          return;
        if (this.isSearchOpen)
          return;
        const pathTarget = e.composedPath && e.composedPath().length > 0 ? e.composedPath()[0] : e.target;
        if (pathTarget && (pathTarget.tagName === "INPUT" || pathTarget.tagName === "TEXTAREA" || pathTarget.isContentEditable)) {
          return;
        }
        const target = e.target;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        if (e.code === "Space" && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.sendCommand({ type: "TOGGLE_PLAY" });
        } else if (e.key === "j" || e.key === "J" || e.code === "ArrowLeft" && e.altKey) {
          this.sendCommand({ type: "SEEK_RELATIVE", payload: { delta: -10 } });
        } else if (e.key === "l" || e.key === "L" || e.code === "ArrowRight" && e.altKey) {
          this.sendCommand({ type: "SEEK_RELATIVE", payload: { delta: 10 } });
        } else if (e.key === "m" || e.key === "M") {
          this.sendCommand({ type: "TOGGLE_MUTE" });
        } else if (e.code === "ArrowUp" && e.altKey) {
          e.preventDefault();
          this.sendCommand({ type: "STEP_VOLUME", payload: { step: 10 } });
        } else if (e.code === "ArrowDown" && e.altKey) {
          e.preventDefault();
          this.sendCommand({ type: "STEP_VOLUME", payload: { step: -10 } });
        }
      });
    }
    attachEventListeners() {
      this.floatingPill.addEventListener("click", (e) => {
        if (e.target.closest(".pill-cut-btn"))
          return;
        if (this.isAnimatingPill)
          return;
        this.isAnimatingPill = true;
        this.floatingPill.classList.add("elastic-burst");
        setTimeout(() => {
          this.floatingPill.classList.remove("elastic-burst");
          this.setPillMode(false);
          this.container.classList.add("elastic-expanding");
          setTimeout(() => {
            this.container.classList.remove("elastic-expanding");
            this.isAnimatingPill = false;
          }, 360);
        }, 100);
      });
      const pillCutBtn = this.floatingPill.querySelector(".pill-cut-btn");
      pillCutBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.setPillMode(false);
        this.store.close();
      });
      this.hideBtn.addEventListener("click", () => {
        if (this.isAnimatingPill)
          return;
        this.isAnimatingPill = true;
        this.isSettingsOpen = false;
        this.settingsPopover.classList.remove("open");
        this.isQueueOpen = false;
        this.queuePanel.classList.remove("open");
        this.isQualityOpen = false;
        this.qualityPopover.classList.remove("open");
        this.container.classList.add("elastic-minimizing");
        setTimeout(() => {
          this.container.classList.remove("elastic-minimizing");
          this.setPillMode(true);
          this.isAnimatingPill = false;
        }, 300);
      });
      this.shuffleBtn.addEventListener("click", () => {
        this.isShuffleActive = !this.isShuffleActive;
        this.shuffleBtn.classList.toggle("active", this.isShuffleActive);
        this.showToast(this.isShuffleActive ? "Shuffle enabled" : "Shuffle disabled", "\u{1F500}");
      });
      this.playPauseBtn.addEventListener("click", () => {
        this.sendCommand({ type: "TOGGLE_PLAY" });
      });
      this.nextBtn.addEventListener("click", () => {
        this.triggerTrackChange("NEXT");
      });
      this.prevBtn.addEventListener("click", () => {
        this.triggerTrackChange("PREVIOUS");
      });
      this.loopBtn.addEventListener("click", () => {
        this.isLoopActive = !this.isLoopActive;
        this.loopBtn.classList.toggle("active", this.isLoopActive);
        this.sendCommand({ type: "TOGGLE_LOOP" });
        this.showToast(this.isLoopActive ? "Repeat enabled" : "Repeat disabled", "\u{1F501}");
      });
      this.skip10BackBtn.addEventListener("click", () => {
        this.sendCommand({ type: "SEEK_RELATIVE", payload: { delta: -10 } });
      });
      this.skip10FwdBtn.addEventListener("click", () => {
        this.sendCommand({ type: "SEEK_RELATIVE", payload: { delta: 10 } });
      });
      this.likeBtn.addEventListener("click", () => {
        this.handleLikeClick();
      });
      this.searchBtn.addEventListener("click", () => {
        this.openSearchModal();
      });
      this.hdBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isQualityOpen = !this.isQualityOpen;
        this.qualityPopover.classList.toggle("open", this.isQualityOpen);
        if (this.isQualityOpen) {
          this.isSettingsOpen = false;
          this.settingsPopover.classList.remove("open");
          this.isQueueOpen = false;
          this.queuePanel.classList.remove("open");
        }
      });
      this.previewToggleBtn.addEventListener("click", () => {
        this.togglePreview();
      });
      this.thumbWrap.addEventListener("click", () => {
        this.togglePreview();
      });
      this.setupPreviewDragging();
      this.previewCloseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closePreview();
      });
      this.previewLikeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleLikeClick();
      });
      this.previewFullscreenBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.sendCommand({ type: "FOCUS_YOUTUBE_TAB" });
      });
      this.previewPrevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.triggerTrackChange("PREVIOUS");
      });
      this.previewPlayBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.sendCommand({ type: "TOGGLE_PLAY" });
      });
      this.previewSkipBackBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.sendCommand({ type: "SEEK_RELATIVE", payload: { delta: -10 } });
      });
      this.previewSkipFwdBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.sendCommand({ type: "SEEK_RELATIVE", payload: { delta: 10 } });
      });
      this.previewNextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.triggerTrackChange("NEXT");
      });
      this.previewVolBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.sendCommand({ type: "TOGGLE_MUTE" });
      });
      this.previewVolSlider.addEventListener("input", (e) => {
        e.stopPropagation();
        const vol = parseInt(this.previewVolSlider.value, 10);
        this.sendCommand({ type: "SET_VOLUME", payload: { volume: vol } });
      });
      this.previewProgressTrack.addEventListener("click", (e) => {
        e.stopPropagation();
        const rect = this.previewProgressTrack.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const duration = this.store.getState()?.duration || 0;
        this.sendCommand({ type: "SEEK", payload: { time: ratio * duration } });
      });
      this.previewOpenYt.addEventListener("click", (e) => {
        e.stopPropagation();
        this.sendCommand({ type: "FOCUS_YOUTUBE_TAB" });
      });
      this.searchCutBtn.addEventListener("click", () => {
        this.closeSearchModal();
      });
      this.searchClearBtn.addEventListener("click", () => {
        this.searchInput.value = "";
        this.handleSearchInput();
        this.searchInput.focus();
      });
      this.searchInput.addEventListener("input", () => {
        this.handleSearchInput();
      });
      this.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape" || e.key === "Tab")
          return;
        e.stopPropagation();
        if (e.key === "ArrowDown") {
          e.preventDefault();
          this.searchResultsList.querySelector(".search-result-card")?.focus();
          return;
        }
        if (e.key === "Enter") {
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
      const chips = this.searchChipsContainer.querySelectorAll(".search-chip");
      chips.forEach((chip) => {
        chip.addEventListener("click", () => {
          const q = chip.getAttribute("data-query");
          if (q) {
            this.searchInput.value = q;
            this.searchClearBtn.style.display = "block";
            this.executeSearch(q);
          }
        });
      });
      const filterBtns = this.searchFilterBar.querySelectorAll(".search-filter-btn");
      filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          filterBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const filter = btn.getAttribute("data-filter");
          this.currentSearchFilter = filter || "all";
          this.renderFilteredResults();
        });
      });
      this.muteBtn.addEventListener("click", () => {
        this.sendCommand({ type: "TOGGLE_MUTE" });
      });
      this.volDownBtn.addEventListener("click", () => {
        this.sendCommand({ type: "STEP_VOLUME", payload: { step: -10 } });
      });
      this.volUpBtn.addEventListener("click", () => {
        this.sendCommand({ type: "STEP_VOLUME", payload: { step: 10 } });
      });
      this.volumeSlider.addEventListener("input", () => {
        const vol = parseInt(this.volumeSlider.value, 10);
        this.sendCommand({ type: "SET_VOLUME", payload: { volume: vol } });
      });
      const handleSeekPointer = (e) => {
        const rect = this.progressContainer.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        return Math.max(0, Math.min(1, ratio));
      };
      this.progressContainer.addEventListener("mousemove", (e) => {
        const ratio = handleSeekPointer(e);
        const duration = this.store.getState()?.duration || 0;
        const hoverSec = ratio * duration;
        this.progressTooltip.textContent = ControlBarStateStore.formatTime(hoverSec);
        const rect = this.progressContainer.getBoundingClientRect();
        const posPx = Math.max(10, Math.min(rect.width - 10, e.clientX - rect.left));
        this.progressTooltip.style.left = `${posPx}px`;
      });
      this.progressContainer.addEventListener("pointerdown", (e) => {
        this.progressContainer.setPointerCapture(e.pointerId);
        this.progressContainer.classList.add("dragging");
        const ratio = handleSeekPointer(e);
        this.store.startDragging(ratio);
        const onMove = (moveEv) => {
          this.store.updateDragging(handleSeekPointer(moveEv));
        };
        const onUp = () => {
          this.progressContainer.classList.remove("dragging");
          this.progressContainer.removeEventListener("pointermove", onMove);
          this.progressContainer.removeEventListener("pointerup", onUp);
          const targetSeconds = this.store.stopDragging();
          this.sendCommand({ type: "SEEK", payload: { time: targetSeconds } });
        };
        this.progressContainer.addEventListener("pointermove", onMove);
        this.progressContainer.addEventListener("pointerup", onUp);
      });
      this.queueFilter.addEventListener("input", () => {
        const state = this.store.getState();
        this.renderQueue(state?.queue || [], !!state?.queueAvailable);
      });
      this.queuePanel.querySelector(".queue-current-btn").addEventListener("click", () => {
        this.queueFilter.value = "";
        const state = this.store.getState();
        this.renderQueue(state?.queue || [], !!state?.queueAvailable);
        const current = this.queueList.querySelector(".current");
        current?.scrollIntoView({ block: "nearest" });
        current?.focus({ preventScroll: true });
      });
      this.searchBackdrop.querySelector(".search-sort").addEventListener("change", (event) => {
        this.searchSort = event.target.value;
        this.renderFilteredResults();
      });
      this.searchBackdrop.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          this.closeSearchModal();
        }
        if (event.key === "Tab") {
          const elements = Array.from(this.searchBackdrop.querySelectorAll('button, input, select, [tabindex="0"]')).filter((el) => el.getClientRects().length > 0);
          const first = elements[0], last = elements[elements.length - 1];
          if (event.shiftKey && this.shadow.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && this.shadow.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      });
      this.queueBtn.addEventListener("click", () => {
        this.isQueueOpen = !this.isQueueOpen;
        this.queuePanel.classList.toggle("open", this.isQueueOpen);
        if (this.isQueueOpen) {
          this.isSettingsOpen = false;
          this.settingsPopover.classList.remove("open");
          this.isQualityOpen = false;
          this.qualityPopover.classList.remove("open");
        }
      });
      this.queuePanel.querySelector(".close-queue-btn")?.addEventListener("click", () => {
        this.isQueueOpen = false;
        this.queuePanel.classList.remove("open");
      });
      this.settingsBtn.addEventListener("click", () => {
        this.isSettingsOpen = !this.isSettingsOpen;
        this.settingsPopover.classList.toggle("open", this.isSettingsOpen);
        if (this.isSettingsOpen) {
          this.isQueueOpen = false;
          this.queuePanel.classList.remove("open");
          this.isQualityOpen = false;
          this.qualityPopover.classList.remove("open");
          this.showPopoverView("main");
        }
      });
      this.settingsPopover.querySelector(".popover-close-btn")?.addEventListener("click", () => {
        this.isSettingsOpen = false;
        this.settingsPopover.classList.remove("open");
      });
      this.container.addEventListener("click", (e) => {
        const target = e.target;
        if (!target.closest(".quality-popover") && !target.closest(".hd-badge-btn")) {
          this.isQualityOpen = false;
          this.qualityPopover.classList.remove("open");
        }
      });
      this.shadow.querySelector(".popover-shortcuts-card")?.addEventListener("click", () => {
        this.showPopoverView("shortcuts");
      });
      this.shadow.querySelector(".popover-appearance-card")?.addEventListener("click", () => {
        this.showPopoverView("appearance");
      });
      this.shadow.querySelectorAll(".back-to-main")?.forEach((btn) => {
        btn.addEventListener("click", () => {
          this.showPopoverView("main");
        });
      });
      this.barToggleInput.addEventListener("change", () => {
        const enabled = this.barToggleInput.checked;
        this.store.setBarEnabled(enabled);
        chrome.runtime.sendMessage({
          type: "SET_BAR_VISIBILITY",
          payload: { enabled }
        }).catch(() => {
        });
      });
      this.hotkeysToggleInput.addEventListener("change", () => {
        this.hotkeysEnabled = this.hotkeysToggleInput.checked;
        try {
          chrome.storage.local.set({ ytHotkeys: this.hotkeysEnabled });
        } catch {
        }
      });
      this.darkThemeBtn.addEventListener("click", () => this.setTheme("dark"));
      this.lightThemeBtn.addEventListener("click", () => this.setTheme("light"));
      this.thumbImg.addEventListener("error", () => {
        this.thumbWrap.classList.add("empty");
      });
    }
    showPopoverView(view) {
      this.popoverMainView.style.display = view === "main" ? "flex" : "none";
      this.popoverShortcutsView.style.display = view === "shortcuts" ? "flex" : "none";
      this.popoverAppearanceView.style.display = view === "appearance" ? "flex" : "none";
    }
    triggerTrackChange(cmd) {
      if (this.isLoadingTrack)
        return;
      this.isLoadingTrack = true;
      if (cmd === "NEXT") {
        this.nextBtn.classList.add("loading");
      } else {
        this.prevBtn.classList.add("loading");
      }
      this.sendCommand({ type: cmd });
      if (this.loadingTimeout)
        clearTimeout(this.loadingTimeout);
      this.loadingTimeout = setTimeout(() => {
        this.resetLoadingState();
      }, 1800);
    }
    resetLoadingState() {
      this.isLoadingTrack = false;
      this.nextBtn.classList.remove("loading");
      this.prevBtn.classList.remove("loading");
    }
    sendCommand(msg) {
      chrome.runtime.sendMessage(msg).catch(() => {
      });
    }
    updateView() {
      const isVisible = this.store.isVisible();
      this.container.classList.toggle("hidden", !isVisible);
      this.hostElement.classList.toggle("controller-hidden", !isVisible);
      if (!isVisible)
        return;
      const state = this.store.getState();
      const tabs = this.store.getTabs();
      this.barToggleInput.checked = this.store.getBarEnabled();
      if (state && state.isPlaying) {
        this.floatingPill.classList.add("playing");
      } else {
        this.floatingPill.classList.remove("playing");
      }
      if (!state) {
        this.renderQueue([], false);
        if (tabs.length === 0) {
          this.titleEl.textContent = "YouTube Controller";
          this.channelEl.textContent = "Open YouTube in a tab to begin playing";
        } else {
          this.titleEl.textContent = "YouTube connected";
          this.channelEl.textContent = "Waiting for playback...";
        }
        this.thumbWrap.classList.add("empty");
        this.playIcon.style.display = "block";
        this.pauseIcon.style.display = "none";
        this.currentTimeEl.textContent = "0:00";
        this.durationTimeEl.textContent = "0:00";
        this.progressFill.style.width = "0%";
        this.progressThumb.style.left = "0%";
        return;
      }
      if (this.lastTrackId && this.lastTrackId !== state.videoId) {
        this.resetLoadingState();
      }
      this.lastTrackId = state.videoId;
      this.titleEl.textContent = state.title || "YouTube Video";
      this.channelEl.textContent = state.channel || "YouTube";
      if (state.thumbnailUrl) {
        if (this.thumbImg.src !== state.thumbnailUrl) {
          this.thumbImg.src = state.thumbnailUrl;
        }
        this.thumbWrap.classList.remove("empty");
      } else {
        this.thumbWrap.classList.add("empty");
      }
      if (state.isPlaying) {
        this.playIcon.style.display = "none";
        this.pauseIcon.style.display = "block";
      } else {
        this.playIcon.style.display = "block";
        this.pauseIcon.style.display = "none";
      }
      const currentTime = this.store.getCurrentTime();
      const duration = state.duration;
      this.currentTimeEl.textContent = ControlBarStateStore.formatTime(currentTime);
      if (state.isLive) {
        this.durationTimeEl.innerHTML = `
        <span class="live-badge"><span class="live-dot"></span>LIVE</span>
      `;
        this.progressFill.style.width = "100%";
        this.progressThumb.style.left = "100%";
      } else {
        this.durationTimeEl.textContent = ControlBarStateStore.formatTime(duration);
        const progressRatio = this.store.getCurrentProgressRatio();
        const pct = (progressRatio * 100).toFixed(2);
        this.progressFill.style.width = `${pct}%`;
        this.progressThumb.style.left = `${pct}%`;
      }
      if (this.shadow.activeElement !== this.volumeSlider) {
        this.volumeSlider.value = String(state.isMuted ? 0 : state.volume);
      }
      if (state.isMuted || state.volume === 0) {
        this.speakerIcon.style.display = "none";
        this.mutedIcon.style.display = "block";
      } else {
        this.speakerIcon.style.display = "block";
        this.mutedIcon.style.display = "none";
      }
      this.prevBtn.disabled = !state.hasPrevious;
      this.nextBtn.disabled = !state.hasNext;
      if (this.pendingLike && (this.pendingLike.videoId !== state.videoId || this.pendingLike.liked === state.isLiked || Date.now() >= this.pendingLike.expires)) {
        this.pendingLike = null;
      }
      if (!this.pendingLike && typeof state.isLiked === "boolean") {
        this.setLikeVisualState(state.isLiked, false);
      }
      if (state.currentQuality) {
        this.updateHDBadge(state.currentQuality);
      }
      this.renderQualityOptions(state.availableQualities || [], state.currentQuality || "auto");
      if (this.isPreviewOpen) {
        this.previewTitleText.textContent = state.title || "YouTube Video";
        if (state.thumbnailUrl && this.previewThumbImg.src !== state.thumbnailUrl) {
          this.previewThumbImg.src = state.thumbnailUrl;
        }
        this.previewPlayIcon.style.display = state.isPlaying ? "none" : "block";
        this.previewPauseIcon.style.display = state.isPlaying ? "block" : "none";
        const progressRatio = this.store.getCurrentProgressRatio();
        const pct = (progressRatio * 100).toFixed(2);
        this.previewProgressFill.style.width = `${pct}%`;
        this.previewTimeEl.textContent = `${ControlBarStateStore.formatTime(currentTime)} / ${ControlBarStateStore.formatTime(duration)}`;
        this.previewPrevBtn.disabled = !state.hasPrevious;
        this.previewNextBtn.disabled = !state.hasNext;
        const vol = state.isMuted ? 0 : state.volume;
        if (this.shadow.activeElement !== this.previewVolSlider)
          this.previewVolSlider.value = String(vol);
        this.prevSpeakerIcon.style.display = state.isMuted || vol === 0 ? "none" : "block";
        this.prevMutedIcon.style.display = state.isMuted || vol === 0 ? "block" : "none";
      }
      this.renderQueue(state.queue, state.queueAvailable);
    }
    handleLikeClick() {
      const state = this.store.getState();
      if (!state?.videoId)
        return;
      const liked = !this.isLiked;
      this.pendingLike = { videoId: state.videoId, liked, expires: Date.now() + 2500 };
      this.setLikeVisualState(liked, true);
      this.showToast(liked ? "Added to Liked videos" : "Like removed", liked ? "\u{1F44D}" : "\u{1F44E}");
      this.sendCommand({ type: "TOGGLE_LIKE" });
      setTimeout(() => this.updateView(), 2550);
    }
    showToast(msg, icon = "\u{1F44D}") {
      if (this.toastTimer) {
        clearTimeout(this.toastTimer);
        this.toastTimer = null;
      }
      this.toastMsgEl.textContent = msg;
      this.toastIconEl.textContent = icon;
      this.dockToast.classList.add("show");
      this.toastTimer = setTimeout(() => {
        this.dockToast.classList.remove("show");
        this.toastTimer = null;
      }, 2200);
    }
    setLikeVisualState(liked, animate = false) {
      this.isLiked = liked;
      this.likeBtn.classList.toggle("liked", liked);
      this.likeBtn.title = liked ? "Unlike video" : "Like video";
      this.likeBtn.setAttribute("aria-pressed", String(liked));
      this.likeBtn.setAttribute("aria-label", this.likeBtn.title);
      if (this.previewLikeBtn) {
        this.previewLikeBtn.title = liked ? "Unlike video" : "Like video";
        this.previewLikeBtn.classList.toggle("liked", liked);
        this.previewLikeBtn.setAttribute("aria-pressed", String(liked));
        this.prevThumbOutlineIcon.style.display = liked ? "none" : "block";
        this.prevThumbFilledIcon.style.display = liked ? "block" : "none";
      }
      this.thumbOutlineIcon.style.display = liked ? "none" : "block";
      this.thumbFilledIcon.style.display = liked ? "block" : "none";
      if (animate) {
        for (const button of [this.likeBtn, this.previewLikeBtn]) {
          button.classList.remove("pop-anim", "unlike-anim");
          void button.offsetWidth;
          button.classList.add(liked ? "pop-anim" : "unlike-anim");
        }
      }
    }
    updateHDBadge(quality, isHD) {
      const isQualityHD = isHD ?? (quality.startsWith("hd") || quality === "highres");
      if (quality === "hd1080") {
        this.hdBtn.textContent = "1080p";
      } else if (quality === "hd720") {
        this.hdBtn.textContent = "720p";
      } else if (quality === "hd1440") {
        this.hdBtn.textContent = "1440p";
      } else if (quality === "hd2160") {
        this.hdBtn.textContent = "4K";
      } else if (quality === "large") {
        this.hdBtn.textContent = "480p";
      } else if (quality === "medium") {
        this.hdBtn.textContent = "360p";
      } else if (isQualityHD) {
        this.hdBtn.textContent = "HD";
      } else {
        this.hdBtn.textContent = "HD";
      }
      this.hdBtn.classList.toggle("active-hd", isQualityHD);
    }
    renderQualityOptions(available, currentQuality) {
      const signature = JSON.stringify([available, currentQuality]);
      if (signature === this.qualitySignature)
        return;
      this.qualitySignature = signature;
      this.qualityTagEl.textContent = (currentQuality || "auto").toUpperCase();
      this.qualityListEl.innerHTML = "";
      const list = available && available.length > 0 ? available : [
        { quality: "auto", label: "Auto", isHD: false },
        { quality: "hd1080", label: "1080p HD", isHD: true },
        { quality: "hd720", label: "720p HD", isHD: true },
        { quality: "large", label: "480p", isHD: false },
        { quality: "medium", label: "360p", isHD: false },
        { quality: "small", label: "240p", isHD: false }
      ];
      for (const opt of list) {
        const row = document.createElement("div");
        const isSelected = opt.quality === currentQuality || opt.quality === "auto" && !currentQuality;
        row.className = `quality-option-item ${isSelected ? "selected" : ""}`;
        row.innerHTML = `
        <span>
          ${this.escapeHtml(opt.label)}
          ${opt.isHD ? '<span class="quality-option-hd-badge">HD</span>' : ""}
        </span>
        <span class="quality-option-check">\u2713</span>
      `;
        row.addEventListener("click", () => {
          this.sendCommand({
            type: "SET_QUALITY",
            payload: { quality: opt.quality }
          });
          this.isQualityOpen = false;
          this.qualityPopover.classList.remove("open");
          this.showToast(`Resolution: ${opt.label}`, "\u2699\uFE0F");
          this.updateHDBadge(opt.quality, opt.isHD);
        });
        this.qualityListEl.appendChild(row);
      }
    }
    renderQueue(queue, available) {
      const filter = this.queueFilter.value.trim().toLocaleLowerCase();
      const signature = JSON.stringify([queue, available, filter]);
      if (signature === this.queueSignature)
        return;
      this.queueSignature = signature;
      const scrollTop = this.queueList.scrollTop;
      const items = available ? queue.filter((item) => `${item.title} ${item.channel || ""}`.toLocaleLowerCase().includes(filter)) : [];
      this.queuePanel.querySelector(".queue-summary").textContent = `${items.length} of ${available ? queue.length : 0} tracks`;
      this.queuePanel.querySelector(".queue-current-btn").disabled = !available || !queue.some((item) => item.isCurrent);
      this.queueList.replaceChildren();
      if (!items.length) {
        const message = document.createElement("div");
        message.className = "queue-empty-msg";
        message.textContent = !available ? "Queue unavailable for this video" : filter ? "No matching tracks. Try another title or channel." : "No tracks in the queue.";
        this.queueList.appendChild(message);
        return;
      }
      for (const item of items) {
        const row = document.createElement("button");
        row.type = "button";
        row.className = `queue-item ${item.isCurrent ? "current" : ""}`;
        row.setAttribute("aria-current", item.isCurrent ? "true" : "false");
        row.title = item.title;
        row.innerHTML = `<div class="queue-thumb"></div><div class="queue-details"><div class="queue-title"></div><div class="queue-channel"></div></div><span class="queue-duration"></span>`;
        if (item.thumbnailUrl) {
          const img = document.createElement("img");
          img.src = item.thumbnailUrl;
          img.alt = "";
          img.loading = "lazy";
          row.querySelector(".queue-thumb").appendChild(img);
        }
        row.querySelector(".queue-title").textContent = item.title;
        row.querySelector(".queue-channel").textContent = item.channel || "";
        row.querySelector(".queue-duration").textContent = item.isCurrent ? "Playing" : item.durationText || "";
        row.addEventListener("click", () => {
          if (item.isCurrent)
            return;
          this.sendCommand({ type: "PLAY_QUEUE_ITEM", payload: { url: item.url, videoId: item.videoId } });
        });
        this.queueList.appendChild(row);
      }
      this.queueList.scrollTop = scrollTop;
    }
    // =========================================================================
    // Video Preview Methods (with smart auto-vanishing hover controls)
    // =========================================================================
    togglePreview() {
      this.isPreviewOpen = !this.isPreviewOpen;
      this.videoPreviewWindow.classList.toggle("open", this.isPreviewOpen);
      if (this.isPreviewOpen)
        this.updateView();
    }
    closePreview() {
      this.isPreviewOpen = false;
      this.videoPreviewWindow.classList.remove("open");
    }
    setupPreviewDragging() {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initialLeft = 0;
      let initialTop = 0;
      try {
        const savedX = localStorage.getItem("yt_preview_x");
        const savedY = localStorage.getItem("yt_preview_y");
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
            this.videoPreviewWindow.style.right = "auto";
            this.videoPreviewWindow.style.bottom = "auto";
          }
        }
      } catch {
      }
      const onPointerDown = (e) => {
        const target = e.composedPath ? e.composedPath()[0] : e.target;
        if (target && (target.tagName === "BUTTON" || target.closest("button") || target.tagName === "INPUT" || target.closest(".preview-progress-track") || target.closest(".preview-open-yt") || target.classList.contains("preview-vol-slider"))) {
          return;
        }
        isDragging = true;
        this.isPreviewDragging = true;
        this.videoPreviewWindow.classList.add("is-dragging");
        const rect = this.videoPreviewWindow.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        this.videoPreviewWindow.style.left = `${initialLeft}px`;
        this.videoPreviewWindow.style.top = `${initialTop}px`;
        this.videoPreviewWindow.style.right = "auto";
        this.videoPreviewWindow.style.bottom = "auto";
        startX = e.clientX;
        startY = e.clientY;
        this.videoPreviewWindow.setPointerCapture?.(e.pointerId);
        e.preventDefault();
      };
      const onPointerMove = (e) => {
        if (!isDragging)
          return;
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
      const onPointerUp = (e) => {
        if (!isDragging)
          return;
        isDragging = false;
        this.isPreviewDragging = false;
        this.videoPreviewWindow.classList.remove("is-dragging");
        try {
          this.videoPreviewWindow.releasePointerCapture?.(e.pointerId);
        } catch {
        }
        try {
          const rect = this.videoPreviewWindow.getBoundingClientRect();
          localStorage.setItem("yt_preview_x", String(Math.round(rect.left)));
          localStorage.setItem("yt_preview_y", String(Math.round(rect.top)));
        } catch {
        }
      };
      this.videoPreviewWindow.addEventListener("pointerdown", onPointerDown);
      this.videoPreviewWindow.addEventListener("pointermove", onPointerMove);
      this.videoPreviewWindow.addEventListener("pointerup", onPointerUp);
      this.videoPreviewWindow.addEventListener("pointercancel", onPointerUp);
    }
    // =========================================================================
    // YouTube Search Modal Methods
    // =========================================================================
    openSearchModal() {
      this.isSearchOpen = true;
      this.searchBackdrop.classList.add("open");
      this.isQualityOpen = false;
      this.qualityPopover.classList.remove("open");
      this.isSettingsOpen = false;
      this.settingsPopover.classList.remove("open");
      this.isQueueOpen = false;
      this.queuePanel.classList.remove("open");
      if (!this.searchInput.value.trim()) {
        this.searchChipsContainer.style.display = "flex";
        this.searchFilterBar.style.display = "none";
      } else {
        this.searchChipsContainer.style.display = "none";
      }
      setTimeout(() => {
        this.searchInput.focus();
        this.searchInput.select();
      }, 60);
    }
    closeSearchModal() {
      this.isSearchOpen = false;
      this.searchBackdrop.classList.remove("open");
      this.searchBtn.focus();
    }
    handleSearchInput() {
      ++this.searchRequestId;
      const query = this.searchInput.value.trim();
      this.currentSearchResults = [];
      this.searchFilterBar.style.display = "none";
      this.searchClearBtn.style.display = query ? "block" : "none";
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }
      if (!query) {
        this.searchChipsContainer.style.display = "flex";
        this.searchFilterBar.style.display = "none";
        this.currentSearchResults = [];
        this.searchResultsList.innerHTML = '<div class="search-status-msg">Type to search songs, artists, channels or playlists on YouTube...</div>';
        return;
      }
      this.searchChipsContainer.style.display = "none";
      this.searchResultsList.innerHTML = '<div class="search-status-msg">Searching YouTube...</div>';
      this.searchDebounceTimer = setTimeout(() => {
        this.executeSearch(query);
      }, 280);
    }
    executeSearch(query) {
      query = query.trim();
      if (!query)
        return;
      clearTimeout(this.searchDebounceTimer);
      const requestId = ++this.searchRequestId;
      this.currentSearchResults = [];
      this.currentSearchFilter = "all";
      this.searchFilterBar.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("active", button.getAttribute("data-filter") === "all"));
      this.searchFilterBar.style.display = "none";
      this.searchClearBtn.style.display = "block";
      this.searchChipsContainer.style.display = "none";
      this.searchResultsList.innerHTML = '<div class="search-status-msg" role="status">Searching YouTube...</div>';
      this.recentSearches = [query, ...this.recentSearches.filter((value) => value !== query)].slice(0, 6);
      this.renderRecentSearches();
      const fail = (message) => {
        if (requestId !== this.searchRequestId)
          return;
        this.searchResultsList.replaceChildren();
        const status = document.createElement("div");
        status.className = "search-status-msg";
        status.textContent = message;
        const retry = document.createElement("button");
        retry.className = "search-chip";
        retry.textContent = "Retry search";
        retry.addEventListener("click", () => this.executeSearch(query));
        status.appendChild(retry);
        this.searchResultsList.appendChild(status);
      };
      try {
        chrome.runtime.sendMessage({ type: "SEARCH_YOUTUBE", payload: { query } }, (res) => {
          const error = chrome.runtime.lastError;
          if (requestId !== this.searchRequestId)
            return;
          if (!error && res?.success && Array.isArray(res.data))
            this.renderSearchResults(res.data);
          else
            fail(error?.message || res?.error || "Search failed. Please try again.");
        });
      } catch {
        fail("Search is unavailable. Reload the page and try again.");
      }
    }
    renderRecentSearches() {
      const container = this.searchBackdrop.querySelector(".search-recents");
      container.replaceChildren();
      if (!this.recentSearches.length)
        return;
      const label = document.createElement("span");
      label.textContent = "Recent";
      container.appendChild(label);
      for (const query of this.recentSearches) {
        const button = document.createElement("button");
        button.className = "search-chip";
        button.textContent = query;
        button.addEventListener("click", () => {
          this.searchInput.value = query;
          this.executeSearch(query);
        });
        container.appendChild(button);
      }
      const clear = document.createElement("button");
      clear.className = "search-chip";
      clear.textContent = "Clear history";
      clear.addEventListener("click", () => {
        this.recentSearches = [];
        this.renderRecentSearches();
      });
      container.appendChild(clear);
    }
    renderSearchResults(items) {
      this.currentSearchResults = items || [];
      if (!items || items.length === 0) {
        this.searchFilterBar.style.display = "none";
        this.searchResultsList.innerHTML = '<div class="search-status-msg">No results found for this search.</div>';
        return;
      }
      const videoCount = items.filter((i) => (i.itemType || "video") === "video").length;
      const channelCount = items.filter((i) => i.itemType === "channel").length;
      const playlistCount = items.filter((i) => i.itemType === "playlist").length;
      const btnAll = this.searchFilterBar.querySelector('[data-filter="all"]');
      const btnVideo = this.searchFilterBar.querySelector('[data-filter="video"]');
      const btnChannel = this.searchFilterBar.querySelector('[data-filter="channel"]');
      const btnPlaylist = this.searchFilterBar.querySelector('[data-filter="playlist"]');
      if (btnAll)
        btnAll.textContent = `All (${items.length})`;
      if (btnVideo)
        btnVideo.textContent = `Videos & Songs (${videoCount})`;
      if (btnChannel) {
        btnChannel.textContent = `Channels (${channelCount})`;
        btnChannel.style.display = channelCount > 0 ? "inline-block" : "none";
      }
      if (btnPlaylist) {
        btnPlaylist.textContent = `Playlists (${playlistCount})`;
        btnPlaylist.style.display = playlistCount > 0 ? "inline-block" : "none";
      }
      this.searchFilterBar.style.display = "flex";
      this.renderFilteredResults();
    }
    renderFilteredResults() {
      const items = this.currentSearchResults.filter((item) => {
        const type = item.itemType || "video";
        if (this.currentSearchFilter === "all")
          return true;
        if (this.currentSearchFilter === "video")
          return type === "video";
        if (this.currentSearchFilter === "channel")
          return type === "channel";
        if (this.currentSearchFilter === "playlist")
          return type === "playlist";
        return true;
      });
      if (this.searchSort === "title")
        items.sort((a, b) => a.title.localeCompare(b.title));
      if (items.length === 0) {
        this.searchResultsList.innerHTML = `<div class="search-status-msg">No ${this.currentSearchFilter}s found for this query.</div>`;
        return;
      }
      this.searchResultsList.innerHTML = "";
      for (const item of items) {
        const type = item.itemType || "video";
        const card = document.createElement("div");
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `${type === "channel" ? "Open channel" : "Play"}: ${item.title}`);
        card.addEventListener("keydown", (event) => {
          if (event.target !== card)
            return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            card.click();
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const next = event.key === "ArrowDown" ? card.nextElementSibling : card.previousElementSibling;
            if (next)
              next.focus();
            else if (event.key === "ArrowUp")
              this.searchInput.focus();
          }
        });
        card.className = `search-result-card ${type === "channel" ? "search-channel-card" : ""}`;
        if (type === "channel") {
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
              <span>${this.escapeHtml(item.subscribersText || "YouTube Creator")}</span>
            </div>
          </div>
          <button class="search-channel-visit-btn" title="Open channel">Visit Channel</button>
        `;
          card.addEventListener("click", () => {
            window.open(item.url, "_blank");
            this.showToast(`Opening Channel: ${item.title}`, "\u{1F4FA}");
          });
        } else if (type === "playlist") {
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
              <span>${this.escapeHtml(item.channel || "YouTube Playlist")}</span>
              ${item.viewsText ? `<span>\u2022 ${this.escapeHtml(item.viewsText)}</span>` : ""}
            </div>
          </div>
        `;
          card.addEventListener("click", () => {
            this.sendCommand({
              type: "PLAY_QUEUE_ITEM",
              payload: { url: item.url, videoId: item.videoId }
            });
            this.closeSearchModal();
            this.showToast(`Playing Playlist: ${item.title}`, "\u25B6\uFE0F");
          });
        } else {
          card.innerHTML = `
          <div class="search-card-thumb">
            <img src="${this.escapeHtml(item.thumbnailUrl)}" alt="thumbnail" />
            ${item.durationText ? `<span class="search-duration-badge">${this.escapeHtml(item.durationText)}</span>` : ""}
          </div>
          <div class="search-card-meta">
            <div class="search-card-title" title="${this.escapeHtml(item.title)}">
              ${this.escapeHtml(item.title)}
              ${item.badgeText ? `<span class="search-duration-badge" style="position:static;display:inline-block;margin-left:6px;background:#ff0033;">${this.escapeHtml(item.badgeText)}</span>` : ""}
            </div>
            <div class="search-card-sub">
              <span>${this.escapeHtml(item.channel || "YouTube")}</span>
              ${item.viewsText ? `<span>\u2022 ${this.escapeHtml(item.viewsText)}</span>` : ""}
            </div>
          </div>
        `;
          card.addEventListener("click", () => {
            this.sendCommand({
              type: "PLAY_QUEUE_ITEM",
              payload: { url: item.url, videoId: item.videoId }
            });
            this.closeSearchModal();
            this.showToast(`Playing: ${item.title}`, "\u25B6\uFE0F");
          });
        }
        this.searchResultsList.appendChild(card);
      }
    }
    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // src/content/control-bar/index.ts
  if (!window.__YT_GLOBAL_CONTROL_BAR_INJECTED__) {
    window.__YT_GLOBAL_CONTROL_BAR_INJECTED__ = true;
    const store = new ControlBarStateStore();
    new ControlBarUI(store);
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "STATE_UPDATE") {
        const payload = message.payload;
        if (payload) {
          store.update(payload.state, payload.tabs || []);
        }
      } else if (message.type === "BAR_VISIBILITY_CHANGED") {
        const enabled = message.payload?.enabled;
        if (typeof enabled === "boolean") {
          store.setBarEnabled(enabled);
        }
      }
    });
    try {
      chrome.runtime.sendMessage({ type: "GET_BAR_VISIBILITY" }, (res) => {
        if (chrome.runtime.lastError)
          return;
        if (res && res.success && typeof res.data?.enabled === "boolean") {
          store.setBarEnabled(res.data.enabled);
        }
      });
      chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
        if (chrome.runtime.lastError)
          return;
        if (response && response.success && response.data) {
          const { state, tabs } = response.data;
          store.update(state, tabs || []);
        }
      });
    } catch {
    }
  }
})();
